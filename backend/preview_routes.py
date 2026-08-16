"""
Preview de site avant paiement — fonctions pures appelées depuis server.py.
Le pattern suit exactement shop_routes.py.
"""
import uuid
import logging
from datetime import datetime, timezone, timedelta
from typing import Dict, Any

from fastapi import HTTPException

from models import PreviewSiteIn, CheckoutPreviewIn

logger = logging.getLogger("preview")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def create_preview_draft(
    db,
    payload: PreviewSiteIn,
    user: dict,
    generate_content_fn,
) -> Dict[str, Any]:
    """Génère le contenu (synchrone) et stocke un draft non persisté en tant que site."""
    content = await generate_content_fn(payload)

    draft_id = str(uuid.uuid4())
    draft_doc = {
        "id": draft_id,
        "user_id": user["id"],
        "payload": payload.model_dump(),
        "content": content,
        "stripe_session_id": None,
        "package_id": None,
        "status": "draft",
        "site_id": None,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.pending_sites.insert_one(draft_doc)
    draft_doc.pop("_id", None)
    return draft_doc


async def create_preview_checkout(
    db,
    body: CheckoutPreviewIn,
    user: dict,
    stripe_api_key: str,
    stripe_checkout_cls,
    checkout_session_request_cls,
    packages: dict,
):
    if body.package_id not in packages:
        raise HTTPException(status_code=400, detail="Formule invalide")
    if not stripe_api_key:
        raise HTTPException(status_code=503, detail="Stripe non configuré")

    draft = await db.pending_sites.find_one({"id": body.draft_id, "user_id": user["id"]})
    if not draft:
        raise HTTPException(status_code=404, detail="Aperçu introuvable ou expiré")

    pkg = packages[body.package_id]
    origin = body.origin_url.rstrip("/")
    success_url = f"{origin}/preview/success?session_id={{CHECKOUT_SESSION_ID}}&draft_id={body.draft_id}"
    cancel_url = f"{origin}/preview/plans?draft_id={body.draft_id}"
    webhook_url = f"{origin}/api/webhook/stripe"

    stripe_checkout = stripe_checkout_cls(api_key=stripe_api_key, webhook_url=webhook_url)
    metadata = {
        "user_id": user["id"],
        "user_email": user.get("email", ""),
        "draft_id": body.draft_id,
        "package_id": body.package_id,
        "days": str(pkg["days"]),
        "kind": "site_publish_subscription",
    }
    req = checkout_session_request_cls(
        amount=float(pkg["amount"]),
        currency=pkg["currency"],
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    session = await stripe_checkout.create_checkout_session(req)

    await db.pending_sites.update_one(
        {"id": body.draft_id},
        {"$set": {
            "stripe_session_id": session.session_id,
            "package_id": body.package_id,
            "status": "checkout_pending",
            "updated_at": now_iso(),
        }},
    )
    return {"url": session.url, "session_id": session.session_id}


async def finalize_preview_if_paid(
    db,
    session_id: str,
    stripe_api_key: str,
    stripe_checkout_cls,
    save_static_site_fn,
    slugify_fn,
    unique_slug_fn,
    packages: dict,
) -> Dict[str, Any]:
    """Appelée par le webhook Stripe (ou par polling de statut) : si payée et pas déjà finalisée,
    crée le site réel dans db.sites à partir du draft ET active l'abonnement Pro de l'utilisateur."""
    draft = await db.pending_sites.find_one({"stripe_session_id": session_id})
    if not draft:
        return {"handled": False}

    if draft.get("status") == "finalized" and draft.get("site_id"):
        return {"handled": True, "site_id": draft["site_id"], "already": True}

    if not stripe_api_key:
        return {"handled": True, "pending": True}

    stripe_checkout = stripe_checkout_cls(api_key=stripe_api_key, webhook_url="")
    status_resp = await stripe_checkout.get_checkout_status(session_id)

    if status_resp.payment_status != "paid":
        await db.pending_sites.update_one({"id": draft["id"]}, {"$set": {"status": "checkout_pending", "updated_at": now_iso()}})
        return {"handled": True, "pending": True}

    payload = draft["payload"]
    content = draft["content"]
    base_slug = slugify_fn(payload["business_name"] + "-" + payload["city"])
    slug = await unique_slug_fn(base_slug)

    site_doc = {
        "id": str(uuid.uuid4()),
        "user_id": draft["user_id"],
        "slug": slug,
        "business_name": payload["business_name"],
        "business_type": payload["business_type"],
        "services": payload["services"],
        "city": payload["city"],
        "phone": payload["phone"],
        "email": payload.get("email"),
        "style": payload.get("style", "moderne"),
        "content": content,
        "hero_image_url": None,
        "logo_url": None,
        "service_image_urls": [],
        "status": "draft",
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.sites.insert_one(site_doc)
    site_doc.pop("_id", None)
    await save_static_site_fn(site_doc)

    # Activer/étendre l'abonnement Pro (même logique que _apply_pro_credit_if_paid)
    pkg_id = draft.get("package_id")
    days = packages.get(pkg_id, {}).get("days", 30)
    user = await db.users.find_one({"id": draft["user_id"]})
    if user:
        now = datetime.now(timezone.utc)
        current = user.get("pro_until")
        try:
            base = datetime.fromisoformat(current) if current else now
            if base < now:
                base = now
        except Exception:
            base = now
        new_until = (base + timedelta(days=days)).isoformat()
        await db.users.update_one({"id": draft["user_id"]}, {"$set": {"pro_until": new_until}})

    await db.pending_sites.update_one(
        {"id": draft["id"]},
        {"$set": {"status": "finalized", "site_id": site_doc["id"], "updated_at": now_iso()}},
    )
    return {"handled": True, "site_id": site_doc["id"], "already": False}
