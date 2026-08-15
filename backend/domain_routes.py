"""
Domain Marketplace Hustart — achat et gestion de domaines
Fonctions pures (sans décorateurs FastAPI) appelées depuis server.py.
Le pattern suit exactement shop_routes.py.
"""
import hashlib
import re
import uuid
import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any, Tuple

from fastapi import HTTPException

from models import DomainPurchaseIn

logger = logging.getLogger("domain")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(text: str) -> str:
    s = text.lower()
    s = re.sub(r"[àáâãäå]", "a", s)
    s = re.sub(r"[èéêë]", "e", s)
    s = re.sub(r"[ìíîï]", "i", s)
    s = re.sub(r"[òóôõö]", "o", s)
    s = re.sub(r"[ùúûü]", "u", s)
    s = re.sub(r"[ç]", "c", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:60] or "site"


PLATFORM_A_RECORD = None  # injecté via set_platform_a_record() depuis server.py au démarrage

TLD_PRICING = {
    "fr":       {"cost_cents":  900, "margin_cents": 1000, "available": True},
    "com":      {"cost_cents": 1400, "margin_cents": 1000, "available": True},
    "shop":     {"cost_cents": 3500, "margin_cents": 1000, "available": True},
    "boutique": {"cost_cents": 3000, "margin_cents": 1000, "available": True},
    "eu":       {"cost_cents":  800, "margin_cents": 1000, "available": True},
    "net":      {"cost_cents": 1300, "margin_cents": 1000, "available": True},
    "bzh":      {"cost_cents": 2500, "margin_cents": 1000, "available": True},
    "paris":    {"cost_cents": 3000, "margin_cents": 1000, "available": True},
}
DOMAIN_DEFAULT_PRICING = {"cost_cents": 1200, "margin_cents": 1000}


def set_platform_a_record(ip: str) -> None:
    """Injecte la valeur PLATFORM_A_RECORD depuis server.py (env)."""
    global PLATFORM_A_RECORD
    PLATFORM_A_RECORD = ip


def _split_domain(fqdn: str) -> Tuple[str, str, str]:
    fqdn = (fqdn or "").strip().lower().lstrip(".")
    if "." not in fqdn:
        raise HTTPException(status_code=400, detail="Nom de domaine invalide")
    parts = fqdn.split(".")
    if len(parts) > 4 or any(not re.match(r"^[a-z0-9-]{1,63}$", p) or p.startswith("-") or p.endswith("-") for p in parts):
        raise HTTPException(status_code=400, detail="Nom de domaine invalide")
    name = parts[0]
    tld = ".".join(parts[1:])
    return name, tld, fqdn


def tld_price(tld: str) -> dict:
    tld = tld.lstrip(".")
    p = TLD_PRICING.get(tld, {**DOMAIN_DEFAULT_PRICING, "available": True})
    total = p["cost_cents"] + p["margin_cents"]
    return {
        "tld": tld,
        "cost_cents": p["cost_cents"],
        "margin_cents": p["margin_cents"],
        "total_cents": total,
        "available": p.get("available", True),
    }


def _is_available_mock(fqdn: str) -> bool:
    low = fqdn.lower()
    taken_list = {"google.com", "facebook.com", "apple.com", "amazon.com", "artisanweb.fr", "test.fr", "example.com", "leboncoin.fr"}
    if low in taken_list:
        return False
    digest = int(hashlib.sha256(low.encode()).hexdigest(), 16)
    return (digest % 4) != 0


def _suggest_domains(business_type: Optional[str], city: Optional[str], base: Optional[str] = None) -> List[str]:
    t = slugify(business_type or "artisan")[:20]
    c = slugify(city or "")[:20]
    b = slugify(base or "")[:20]
    candidates: List[str] = []
    if t and c:
        candidates += [f"{t}-{c}", f"le-{t}-{c}", f"{t}{c}", f"mon-{t}-{c}"]
    if t:
        candidates += [f"{t}-pro", f"artisan-{t}"]
    if b:
        candidates += [f"{b}", f"{b}-{c}" if c else b, f"{b}-pro"]
    seen = set()
    unique = []
    for c_ in candidates:
        if c_ and c_ not in seen and 3 <= len(c_) <= 40:
            seen.add(c_)
            unique.append(c_)
    out: List[str] = []
    for base_name in unique[:8]:
        for tld in ("fr", "com", "shop"):
            out.append(f"{base_name}.{tld}")
    return out[:12]


def _project_domain_public(d: dict) -> dict:
    return {k: v for k, v in d.items() if k not in {"_id", "internal_notes"}}


def _build_dns_config(fqdn: str) -> dict:
    return {
        "provider": "platform-dns (auto)",
        "records": [
            {"type": "A", "host": "@", "value": PLATFORM_A_RECORD or "76.76.21.21", "ttl": 3600, "description": "Domaine racine"},
            {"type": "A", "host": "www", "value": PLATFORM_A_RECORD or "76.76.21.21", "ttl": 3600, "description": "Sous-domaine www"},
            {"type": "CAA", "host": "@", "value": "0 issue \"letsencrypt.org\"", "ttl": 3600, "description": "Autorisation SSL (Let's Encrypt)"},
        ],
        "a_record_target": PLATFORM_A_RECORD or "76.76.21.21",
        "configured_at": now_iso(),
    }


async def _mock_registrar_purchase(fqdn: str, user_email: str) -> dict:
    await asyncio.sleep(0.05)
    now = datetime.now(timezone.utc)
    return {
        "registrar_order_id": f"MOCK-{uuid.uuid4().hex[:10].upper()}",
        "registration_date": now.isoformat(),
        "expiry_date": (now + timedelta(days=365)).isoformat(),
    }


async def _auto_connect_domain_to_project(db, domain_doc: dict) -> Optional[dict]:
    project_id = domain_doc.get("project_id")
    if not project_id:
        return None
    kind = domain_doc.get("project_kind", "site")
    coll = db.sites if kind == "site" else (db.shops if kind == "shop" else None)
    if coll is None:
        return None
    project = await coll.find_one({"id": project_id, "user_id": domain_doc["user_id"]}, {"_id": 0, "id": 1})
    if not project:
        return None
    await coll.update_one(
        {"id": project_id},
        {"$set": {
            "custom_domain": domain_doc["domain_name"],
            "domain_verified": True,
            "domain_verified_at": now_iso(),
            "domain_token": None,
            "updated_at": now_iso(),
        }},
    )
    return {"kind": kind, "id": project_id}


async def apply_domain_purchase_if_paid(db, session_id: str, stripe_deps: dict) -> Optional[dict]:
    doc = await db.domains.find_one({"stripe_session_id": session_id}, {"_id": 0})
    if not doc:
        return None
    if doc.get("status") == "active":
        return doc

    resolved_payment_status: Optional[str] = doc.get("payment_status")
    STRIPE_API_KEY = stripe_deps.get("STRIPE_API_KEY", "")
    if resolved_payment_status != "paid" and STRIPE_API_KEY:
        try:
            StripeCheckout = stripe_deps["StripeCheckout"]
            stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url="")
            status_resp = await stripe_checkout.get_checkout_status(session_id)
            resolved_payment_status = status_resp.payment_status
        except Exception as e:
            logger.warning(f"Stripe status lookup failed for domain session {session_id}: {e}")

    update = {"payment_status": resolved_payment_status or doc.get("payment_status"), "updated_at": now_iso()}

    if resolved_payment_status == "paid" and doc.get("status") != "active":
        try:
            user = await db.users.find_one({"id": doc["user_id"]}, {"_id": 0, "email": 1})
            receipt = await _mock_registrar_purchase(doc["domain_name"], user.get("email") if user else "unknown")
            update["registrar_order_id"] = receipt["registrar_order_id"]
            update["purchase_date"] = receipt["registration_date"]
            update["expiry_date"] = receipt["expiry_date"]
        except Exception as e:
            logger.error(f"Registrar order failed for {doc['domain_name']}: {e}")
            update["status"] = "error"
            update["error"] = "registrar_failed"
            await db.domains.update_one({"stripe_session_id": session_id}, {"$set": update})
            return await db.domains.find_one({"stripe_session_id": session_id}, {"_id": 0})

        update["dns_config"] = _build_dns_config(doc["domain_name"])
        update["ssl_status"] = "active"
        update["ssl_issuer"] = "Let's Encrypt (auto)"
        update["status"] = "active"
        update["activated_at"] = now_iso()

        attached = await _auto_connect_domain_to_project(db, {**doc, **update})
        if attached:
            update["attached_project"] = attached

    await db.domains.update_one({"stripe_session_id": session_id}, {"$set": update})
    return await db.domains.find_one({"stripe_session_id": session_id}, {"_id": 0})


async def domain_search(db, name: str, business_type: Optional[str] = None, city: Optional[str] = None) -> dict:
    name = (name or "").strip().lower()
    if not name:
        raise HTTPException(status_code=400, detail="Nom requis")

    exact_result: Optional[dict] = None
    if "." in name:
        base, tld, fqdn = _split_domain(name)
        pricing = tld_price(tld)
        exact_result = {
            "domain": fqdn,
            "available": pricing["available"] and _is_available_mock(fqdn),
            **{k: pricing[k] for k in ("tld", "cost_cents", "margin_cents", "total_cents")},
        }
        base_for_suggestions = base
    else:
        base_for_suggestions = name

    raw_suggestions = _suggest_domains(business_type, city, base=base_for_suggestions)
    if base_for_suggestions:
        for tld in ("fr", "com", "shop", "boutique"):
            fqdn = f"{slugify(base_for_suggestions)}.{tld}"
            if fqdn not in raw_suggestions:
                raw_suggestions.insert(0, fqdn)
    raw_suggestions = raw_suggestions[:12]

    suggestions: List[dict] = []
    for fqdn in raw_suggestions:
        try:
            _, tld, norm = _split_domain(fqdn)
        except HTTPException:
            continue
        pricing = tld_price(tld)
        suggestions.append({
            "domain": norm,
            "available": pricing["available"] and _is_available_mock(norm),
            "tld": pricing["tld"],
            "cost_cents": pricing["cost_cents"],
            "margin_cents": pricing["margin_cents"],
            "total_cents": pricing["total_cents"],
        })

    return {"query": name, "result": exact_result, "suggestions": suggestions, "currency": "EUR"}


async def domain_purchase(db, body: DomainPurchaseIn, user: dict, stripe_deps: dict) -> dict:
    _, tld, fqdn = _split_domain(body.domain)
    pricing = tld_price(tld)
    if not pricing["available"]:
        raise HTTPException(status_code=400, detail=f"TLD .{tld} non supporté")
    if not _is_available_mock(fqdn):
        raise HTTPException(status_code=409, detail="Ce domaine n'est plus disponible")

    existing = await db.domains.find_one({"domain_name": fqdn, "status": {"$in": ["active", "pending", "paid"]}})
    if existing:
        raise HTTPException(status_code=409, detail="Ce domaine a déjà été acheté sur la plateforme")

    project_kind = body.project_kind if body.project_kind in ("site", "shop") else "site"
    if body.project_id:
        coll = "sites" if project_kind == "site" else "shops"
        project = await db[coll].find_one({"id": body.project_id, "user_id": user["id"]}, {"_id": 0, "id": 1, "slug": 1})
        if not project:
            raise HTTPException(status_code=404, detail="Projet introuvable")

    STRIPE_API_KEY = stripe_deps.get("STRIPE_API_KEY", "")
    if not STRIPE_API_KEY:
        raise HTTPException(status_code=503, detail="Paiement non configuré")

    origin = body.origin_url.rstrip("/")
    success_url = f"{origin}/domain/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/domain/cancel"
    webhook_url = f"{origin}/api/webhook/stripe"

    StripeCheckout = stripe_deps["StripeCheckout"]
    CheckoutSessionRequest = stripe_deps["CheckoutSessionRequest"]
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    metadata = {
        "kind": "domain_purchase",
        "domain": fqdn,
        "user_id": user["id"],
        "project_id": body.project_id or "",
        "project_kind": project_kind,
    }
    req = CheckoutSessionRequest(
        amount=float(pricing["total_cents"]) / 100.0,
        currency="eur",
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    session = await stripe_checkout.create_checkout_session(req)

    now = now_iso()
    now_dt = datetime.now(timezone.utc)
    domain_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "project_id": body.project_id,
        "project_kind": project_kind,
        "domain_name": fqdn,
        "tld": tld,
        "status": "pending",
        "provider": "mock-registrar",
        "cost_cents": pricing["cost_cents"],
        "margin_cents": pricing["margin_cents"],
        "amount_cents": pricing["total_cents"],
        "currency": "EUR",
        "purchase_date": None,
        "expiry_date": (now_dt + timedelta(days=365)).isoformat(),
        "dns_config": None,
        "ssl_status": "pending",
        "stripe_session_id": session.session_id,
        "payment_status": "initiated",
        "created_at": now,
        "updated_at": now,
    }
    await db.domains.insert_one(domain_doc)

    return {
        "url": session.url,
        "session_id": session.session_id,
        "domain": fqdn,
        "amount_cents": pricing["total_cents"],
        "currency": "EUR",
    }


async def list_domains(db, user: dict) -> list:
    domains = await db.domains.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [_project_domain_public(d) for d in domains]


async def domain_status(db, session_id: str, user: dict, stripe_deps: dict) -> dict:
    doc = await db.domains.find_one({"stripe_session_id": session_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Commande domaine introuvable")
    fresh = await apply_domain_purchase_if_paid(db, session_id, stripe_deps) or doc
    return _project_domain_public(fresh)


async def domain_connect_to_project(db, domain_id: str, body: Dict[str, Any], user: dict) -> dict:
    domain_doc = await db.domains.find_one({"id": domain_id, "user_id": user["id"]}, {"_id": 0})
    if not domain_doc:
        raise HTTPException(status_code=404, detail="Domaine introuvable")
    if domain_doc.get("status") != "active":
        raise HTTPException(status_code=400, detail="Domaine pas encore actif")
    project_id = body.get("project_id")
    project_kind = body.get("project_kind", "site")
    if project_kind not in ("site", "shop"):
        raise HTTPException(status_code=400, detail="project_kind invalide")
    coll = db.sites if project_kind == "site" else db.shops
    project = await coll.find_one({"id": project_id, "user_id": user["id"]}, {"_id": 0, "id": 1})
    if not project:
        raise HTTPException(status_code=404, detail="Projet introuvable")
    await db.domains.update_one({"id": domain_id}, {"$set": {"project_id": project_id, "project_kind": project_kind, "updated_at": now_iso()}})
    await coll.update_one(
        {"id": project_id},
        {"$set": {
            "custom_domain": domain_doc["domain_name"],
            "domain_verified": True,
            "domain_verified_at": now_iso(),
            "domain_token": None,
            "updated_at": now_iso(),
        }},
    )
    return {"ok": True, "domain": domain_doc["domain_name"], "project_id": project_id}
