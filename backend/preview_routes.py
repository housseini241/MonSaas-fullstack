"""
Preview de site avant paiement — fonctions pures appelées depuis server.py.
Le pattern suit exactement shop_routes.py.
"""
import asyncio
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
    stripe_sdk,
    packages: dict,
    dev_fake_payments: bool = False,
):
    if body.package_id not in packages:
        raise HTTPException(status_code=400, detail="Formule invalide")

    draft = await db.pending_sites.find_one({"id": body.draft_id, "user_id": user["id"]})
    if not draft:
        raise HTTPException(status_code=404, detail="Aperçu introuvable ou expiré")

    pkg = packages[body.package_id]
    origin = body.origin_url.rstrip("/")

    if not stripe_api_key or not stripe_sdk:
        if not dev_fake_payments:
            raise HTTPException(status_code=503, detail="Stripe non configuré")
        # ---- Mode DEV_FAKE_PAYMENTS : INCHANGÉ, garder tel quel ----
        logger.warning(
            f"[DEV_FAKE_PAYMENTS] Paiement simulé pour draft_id={body.draft_id}, "
            f"user_id={user['id']}, package_id={body.package_id} — AUCUN vrai paiement effectué."
        )
        fake_session_id = f"dev_{uuid.uuid4()}"
        await db.pending_sites.update_one(
            {"id": body.draft_id},
            {"$set": {
                "stripe_session_id": fake_session_id,
                "package_id": body.package_id,
                "status": "checkout_pending",
                "updated_at": now_iso(),
            }},
        )
        success_url = f"{origin}/preview/success?session_id={fake_session_id}&draft_id={body.draft_id}"
        return {"url": success_url, "session_id": fake_session_id, "dev_mode": True}

    # ---- Vrai abonnement Stripe (mode="subscription") ----
    interval = "month" if pkg["days"] <= 31 else "year"
    success_url = f"{origin}/preview/success?session_id={{CHECKOUT_SESSION_ID}}&draft_id={body.draft_id}"
    cancel_url = f"{origin}/preview/plans?draft_id={body.draft_id}"

    try:
        session = await asyncio.to_thread(
            stripe_sdk.checkout.Session.create,
            mode="subscription",
            payment_method_types=["card"],
            line_items=[{
                "quantity": 1,
                "price_data": {
                    "currency": pkg["currency"],
                    "product_data": {"name": f"Hustart Pro — {pkg['label']}"},
                    "unit_amount": int(round(float(pkg["amount"]) * 100)),
                    "recurring": {"interval": interval, "interval_count": 1},
                },
            }],
            success_url=success_url,
            cancel_url=cancel_url,
            customer_email=user.get("email"),
            metadata={
                "kind": "site_publish_subscription",
                "draft_id": body.draft_id,
                "user_id": user["id"],
                "package_id": body.package_id,
                "days": str(pkg["days"]),
            },
            subscription_data={
                "metadata": {
                    "kind": "site_publish_subscription",
                    "draft_id": body.draft_id,
                    "user_id": user["id"],
                    "package_id": body.package_id,
                    "days": str(pkg["days"]),
                },
            },
        )
    except Exception as e:
        logger.error(f"Stripe subscription session creation failed: {e}")
        raise HTTPException(status_code=502, detail=f"Stripe indisponible: {str(e)[:100]}")

    await db.pending_sites.update_one(
        {"id": body.draft_id},
        {"$set": {
            "stripe_session_id": session.id,
            "package_id": body.package_id,
            "status": "checkout_pending",
            "updated_at": now_iso(),
        }},
    )
    return {"url": session.url, "session_id": session.id}


async def finalize_preview_if_paid(
    db,
    session_id: str,
    stripe_api_key: str,
    stripe_sdk,
    save_static_site_fn,
    slugify_fn,
    unique_slug_fn,
    packages: dict,
    dev_fake_payments: bool = False,
) -> Dict[str, Any]:
    """Appelée par le webhook Stripe (ou par polling de statut) : si payée et pas déjà finalisée,
    crée le site réel dans db.sites à partir du draft ET active l'abonnement Pro de l'utilisateur."""
    draft = await db.pending_sites.find_one({"stripe_session_id": session_id})
    if not draft:
        return {"handled": False}

    if draft.get("status") == "finalized" and draft.get("site_id"):
        return {"handled": True, "site_id": draft["site_id"], "already": True}

    is_dev_fake = dev_fake_payments and session_id.startswith("dev_")
    subscription_id = None
    customer_id = None

    if not is_dev_fake:
        if not stripe_api_key or not stripe_sdk:
            return {"handled": True, "pending": True}
        try:
            session = await asyncio.to_thread(stripe_sdk.checkout.Session.retrieve, session_id)
        except Exception as e:
            logger.warning(f"Stripe session lookup failed for {session_id}: {e}")
            return {"handled": True, "pending": True}

        if session.payment_status != "paid":
            await db.pending_sites.update_one({"id": draft["id"]}, {"$set": {"status": "checkout_pending", "updated_at": now_iso()}})
            return {"handled": True, "pending": True}

        subscription_id = getattr(session, "subscription", None)
        customer_id = getattr(session, "customer", None)
    else:
        logger.warning(f"[DEV_FAKE_PAYMENTS] Finalisation simulée pour session_id={session_id} — AUCUN vrai paiement vérifié.")

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
        "phone": payload.get("phone"),
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
        update_fields = {"pro_until": new_until}
        if subscription_id:
            update_fields["stripe_subscription_id"] = subscription_id
            update_fields["subscription_status"] = "active"
        if customer_id:
            update_fields["stripe_customer_id"] = customer_id
        await db.users.update_one({"id": draft["user_id"]}, {"$set": update_fields})

    await db.pending_sites.update_one(
        {"id": draft["id"]},
        {"$set": {"status": "finalized", "site_id": site_doc["id"], "updated_at": now_iso()}},
    )
    return {"handled": True, "site_id": site_doc["id"], "already": False}
