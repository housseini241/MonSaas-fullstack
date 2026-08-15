"""
E-commerce Hustart — Shops / Products / Orders
Fonctions pures (sans décorateurs FastAPI) appelées depuis server.py.
Le pattern suit exactement marketplace_routes.py.
"""
import uuid
import logging
import os
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from fastapi import HTTPException

from models import (
    CartItemIn,
    CheckoutShopIn,
    ProductIn,
    ProductUpdate,
    ShopCreate,
    ShopUpdate,
    OrderStatusUpdate,
)

logger = logging.getLogger("shop")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def slugify(text: str) -> str:
    import re
    s = text.lower()
    s = re.sub(r"[àáâãäå]", "a", s)
    s = re.sub(r"[èéêë]", "e", s)
    s = re.sub(r"[ìíîï]", "i", s)
    s = re.sub(r"[òóôõö]", "o", s)
    s = re.sub(r"[ùúûü]", "u", s)
    s = re.sub(r"[ç]", "c", s)
    s = re.sub(r"[^a-z0-9]+", "-", s).strip("-")
    return s[:60] or "site"


DEFAULT_SHIPPING_RATES = [
    {"id": "pickup", "name": "Retrait en boutique", "amount_cents": 0, "is_pickup": True},
    {"id": "fr_metro", "name": "France métropolitaine", "amount_cents": 490, "is_pickup": False},
    {"id": "eu", "name": "Union européenne", "amount_cents": 990, "is_pickup": False},
]
DEFAULT_SHOP_THEME = {
    "primary_color": "#1F3D2D",
    "accent_color": "#C84B31",
    "font_heading": "Instrument Serif",
    "font_body": "Manrope",
}


async def _unique_shop_slug(db, base: str) -> str:
    slug = slugify(base) or "boutique"
    candidate = slug
    i = 1
    while await db.shops.find_one({"slug": candidate}, {"_id": 0, "id": 1}):
        i += 1
        candidate = f"{slug}-{i}"
    return candidate


def _project_shop_public(shop: dict) -> dict:
    return {k: v for k, v in shop.items() if k not in {"_id", "user_id"}}


def _project_product_public(p: dict) -> dict:
    return {k: v for k, v in p.items() if k != "_id"}


async def create_shop(db, body: ShopCreate, user: dict, is_pro: Any) -> dict:
    if not await is_pro(user):
        raise HTTPException(
            status_code=402,
            detail="La boutique en ligne est réservée au plan Pro. Passez à Pro pour lancer votre e-commerce.",
        )
    base = body.name + (f"-{body.city}" if body.city else "")
    slug = await _unique_shop_slug(db, base)
    now = now_iso()
    shop = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "name": body.name,
        "slug": slug,
        "description": body.description or "",
        "city": body.city or "",
        "address": "",
        "contact_email": body.contact_email or user.get("email"),
        "phone": body.phone or "",
        "currency": "EUR",
        "tax_rate": 0.20,
        "tax_included": True,
        "shipping_rates": DEFAULT_SHIPPING_RATES,
        "theme": DEFAULT_SHOP_THEME,
        "logo_url": None,
        "hero_image_url": None,
        "status": "draft",
        "created_at": now,
        "updated_at": now,
    }
    await db.shops.insert_one(shop)
    shop.pop("_id", None)
    return shop


async def list_shops(db, user: dict) -> list:
    shops = await db.shops.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return shops


async def get_shop(db, shop_id: str, user: dict) -> dict:
    shop = await db.shops.find_one({"id": shop_id, "user_id": user["id"]}, {"_id": 0})
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    return shop


async def update_shop(db, shop_id: str, body: ShopUpdate, user: dict) -> dict:
    shop = await db.shops.find_one({"id": shop_id, "user_id": user["id"]})
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if "slug" in update:
        new_slug = slugify(update["slug"]) or shop.get("slug")
        if new_slug != shop.get("slug"):
            existing = await db.shops.find_one({"slug": new_slug, "id": {"$ne": shop_id}}, {"_id": 0, "id": 1})
            if existing:
                raise HTTPException(status_code=409, detail="Cette URL de boutique est déjà utilisée.")
        update["slug"] = new_slug
    update["updated_at"] = now_iso()
    await db.shops.update_one({"id": shop_id}, {"$set": update})
    updated = await db.shops.find_one({"id": shop_id}, {"_id": 0})
    return updated


async def publish_shop(db, shop_id: str, user: dict) -> dict:
    shop = await db.shops.find_one({"id": shop_id, "user_id": user["id"]})
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    await db.shops.update_one({"id": shop_id}, {"$set": {"status": "published", "updated_at": now_iso()}})
    return {"status": "published", "slug": shop["slug"]}


async def delete_shop(db, shop_id: str, user: dict) -> dict:
    shop = await db.shops.find_one({"id": shop_id, "user_id": user["id"]})
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    await db.products.delete_many({"shop_id": shop_id})
    await db.orders.delete_many({"shop_id": shop_id})
    await db.shops.delete_one({"id": shop_id})
    return {"ok": True}


async def create_product(db, shop_id: str, body: ProductIn, user: dict) -> dict:
    shop = await db.shops.find_one({"id": shop_id, "user_id": user["id"]}, {"_id": 0, "id": 1})
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    now = now_iso()
    product = {
        "id": str(uuid.uuid4()),
        "shop_id": shop_id,
        "name": body.name,
        "slug": slugify(body.name) or str(uuid.uuid4())[:8],
        "description": body.description or "",
        "price_cents": body.price_cents,
        "compare_at_cents": body.compare_at_cents,
        "stock": body.stock,
        "category": body.category or "",
        "images": body.images or [],
        "variants": body.variants or [],
        "active": body.active,
        "created_at": now,
        "updated_at": now,
    }
    await db.products.insert_one(product)
    product.pop("_id", None)
    return product


async def list_products(db, shop_id: str, user: dict) -> list:
    shop = await db.shops.find_one({"id": shop_id, "user_id": user["id"]}, {"_id": 0, "id": 1})
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    products = await db.products.find({"shop_id": shop_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return products


async def update_product(db, shop_id: str, product_id: str, body: ProductUpdate, user: dict) -> dict:
    shop = await db.shops.find_one({"id": shop_id, "user_id": user["id"]}, {"_id": 0, "id": 1})
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    update = {k: v for k, v in body.model_dump().items() if v is not None}
    update["updated_at"] = now_iso()
    res = await db.products.update_one({"id": product_id, "shop_id": shop_id}, {"$set": update})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    updated = await db.products.find_one({"id": product_id}, {"_id": 0})
    return updated


async def delete_product(db, shop_id: str, product_id: str, user: dict) -> dict:
    shop = await db.shops.find_one({"id": shop_id, "user_id": user["id"]}, {"_id": 0, "id": 1})
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    res = await db.products.delete_one({"id": product_id, "shop_id": shop_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return {"ok": True}


async def upload_shop_image(db, shop_id: str, file, kind: str, user: dict, upload_image_bytes: Any) -> dict:
    shop = await db.shops.find_one({"id": shop_id, "user_id": user["id"]}, {"_id": 0, "id": 1})
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    if kind not in {"product", "logo", "hero"}:
        kind = "product"
    data = await file.read()
    if not data or len(data) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Fichier invalide (max 8 Mo)")
    mime = file.content_type or "image/png"
    url = await upload_image_bytes(data, mime, f"shop-{kind}", user["id"])
    if not url:
        raise HTTPException(status_code=500, detail="Échec de l'upload")
    return {"url": url}


async def public_shop(db, slug: str) -> dict:
    shop = await db.shops.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    products = await db.products.find(
        {"shop_id": shop["id"], "active": True}, {"_id": 0}
    ).sort("created_at", -1).to_list(500)
    return {"shop": _project_shop_public(shop), "products": [_project_product_public(p) for p in products]}


async def public_product(db, slug: str, product_slug: str) -> dict:
    shop = await db.shops.find_one({"slug": slug, "status": "published"}, {"_id": 0, "id": 1})
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    product = await db.products.find_one({"shop_id": shop["id"], "slug": product_slug, "active": True}, {"_id": 0})
    if not product:
        raise HTTPException(status_code=404, detail="Produit introuvable")
    return _project_product_public(product)


async def _compute_order_amounts(db, shop: dict, items_in: List[CartItemIn], shipping_method_id: str):
    shipping_rate = next((r for r in shop.get("shipping_rates", []) if r.get("id") == shipping_method_id), None)
    if not shipping_rate:
        raise HTTPException(status_code=400, detail="Méthode de livraison inconnue")

    lines = []
    subtotal = 0
    for it in items_in:
        product = await db.products.find_one({"id": it.product_id, "shop_id": shop["id"], "active": True}, {"_id": 0})
        if not product:
            raise HTTPException(status_code=400, detail=f"Produit introuvable: {it.product_id}")
        if (product.get("stock", 0) or 0) < it.qty:
            raise HTTPException(status_code=409, detail=f"Stock insuffisant pour « {product['name']} »")
        unit = int(product.get("price_cents", 0))
        line_total = unit * it.qty
        subtotal += line_total
        lines.append({
            "product_id": product["id"],
            "name": product["name"],
            "slug": product.get("slug"),
            "image": (product.get("images") or [None])[0],
            "variant": it.variant or {},
            "qty": it.qty,
            "unit_price_cents": unit,
            "line_total_cents": line_total,
        })

    shipping_cents = int(shipping_rate.get("amount_cents", 0))
    tax_rate = float(shop.get("tax_rate", 0.20) or 0)
    tax_included = bool(shop.get("tax_included", True))
    if tax_included:
        base = subtotal + shipping_cents
        tax_cents = int(round(base - (base / (1 + tax_rate)))) if tax_rate else 0
        total = base
    else:
        base = subtotal + shipping_cents
        tax_cents = int(round(base * tax_rate))
        total = base + tax_cents
    return lines, subtotal, shipping_cents, tax_cents, total, shipping_rate


async def shop_checkout(db, slug: str, body: CheckoutShopIn, stripe_deps: dict) -> dict:
    shop = await db.shops.find_one({"slug": slug, "status": "published"}, {"_id": 0})
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    if not body.items:
        raise HTTPException(status_code=400, detail="Panier vide")
    if not stripe_deps.get("STRIPE_API_KEY"):
        raise HTTPException(status_code=503, detail="Paiement non configuré")

    lines, subtotal, shipping_cents, tax_cents, total_cents, shipping_rate = await _compute_order_amounts(
        db, shop, body.items, body.shipping_method_id,
    )

    now = now_iso()
    order_id = str(uuid.uuid4())
    origin = body.origin_url.rstrip("/")
    success_url = f"{origin}/shop/{slug}/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin}/shop/{slug}/checkout?cancelled=1"
    webhook_url = f"{origin}/api/webhook/stripe"

    StripeCheckout = stripe_deps["StripeCheckout"]
    CheckoutSessionRequest = stripe_deps["CheckoutSessionRequest"]
    stripe_checkout = StripeCheckout(api_key=stripe_deps["STRIPE_API_KEY"], webhook_url=webhook_url)
    metadata = {
        "kind": "shop_order",
        "order_id": order_id,
        "shop_id": shop["id"],
        "shop_slug": slug,
    }
    req = CheckoutSessionRequest(
        amount=float(total_cents) / 100.0,
        currency=(shop.get("currency") or "eur").lower(),
        success_url=success_url,
        cancel_url=cancel_url,
        metadata=metadata,
    )
    session = await stripe_checkout.create_checkout_session(req)

    order = {
        "id": order_id,
        "shop_id": shop["id"],
        "shop_slug": slug,
        "customer_name": body.customer_name,
        "customer_email": body.customer_email,
        "customer_phone": body.customer_phone,
        "shipping_method_id": body.shipping_method_id,
        "shipping_method_name": shipping_rate.get("name"),
        "shipping_is_pickup": bool(shipping_rate.get("is_pickup")),
        "shipping_address": body.shipping_address or "",
        "items": lines,
        "subtotal_cents": subtotal,
        "shipping_cents": shipping_cents,
        "tax_cents": tax_cents,
        "total_cents": total_cents,
        "currency": (shop.get("currency") or "EUR").upper(),
        "status": "pending",
        "stripe_session_id": session.session_id,
        "payment_status": "initiated",
        "applied": False,
        "created_at": now,
        "updated_at": now,
    }
    await db.orders.insert_one(order)
    return {"url": session.url, "session_id": session.session_id, "order_id": order_id}


async def _apply_shop_order_if_paid(db, session_id: str, stripe_deps: dict, email_deps: dict) -> Optional[dict]:
    order = await db.orders.find_one({"stripe_session_id": session_id}, {"_id": 0})
    if not order:
        return None
    if not stripe_deps.get("STRIPE_API_KEY"):
        return order

    try:
        StripeCheckout = stripe_deps["StripeCheckout"]
        stripe_checkout = StripeCheckout(api_key=stripe_deps["STRIPE_API_KEY"], webhook_url="")
        status_resp = await stripe_checkout.get_checkout_status(session_id)
    except Exception as e:
        logger.warning(f"Stripe status lookup failed for shop order {session_id}: {e}")
        return order

    update = {"payment_status": status_resp.payment_status, "updated_at": now_iso()}
    if status_resp.payment_status == "paid" and not order.get("applied", False):
        update["applied"] = True
        update["applied_at"] = now_iso()
        update["status"] = "paid"
        for line in order.get("items", []):
            await db.products.update_one(
                {"id": line["product_id"], "stock": {"$gte": line["qty"]}},
                {"$inc": {"stock": -line["qty"]}},
            )
        try:
            shop = await db.shops.find_one({"id": order["shop_id"]}, {"_id": 0})
            RESEND_API_KEY = email_deps.get("RESEND_API_KEY", "")
            SENDER_EMAIL = email_deps.get("SENDER_EMAIL", "onboarding@resend.dev")
            resend = email_deps.get("resend")
            if shop and RESEND_API_KEY and resend:
                owner_email = shop.get("contact_email")
                if owner_email:
                    items_html = "".join(
                        f"<li>{ln['qty']}× {ln['name']} — {ln['line_total_cents']/100:.2f} €</li>"
                        for ln in order.get("items", [])
                    )
                    resend.Emails.send({
                        "from": SENDER_EMAIL,
                        "to": owner_email,
                        "subject": f"Nouvelle commande #{order['id'][:8]} — {shop['name']}",
                        "html": f"<h2>Commande payée</h2><p>Client : {order['customer_name']} ({order['customer_email']})</p><ul>{items_html}</ul><p><b>Total : {order['total_cents']/100:.2f} €</b></p><p>Livraison : {order.get('shipping_method_name')}</p>",
                    })
                resend.Emails.send({
                    "from": SENDER_EMAIL,
                    "to": order["customer_email"],
                    "subject": f"Merci pour votre commande — {shop['name']}",
                    "html": f"<h2>Confirmation de commande</h2><p>Bonjour {order['customer_name']},</p><p>Votre commande <b>#{order['id'][:8]}</b> a bien été reçue. Montant : <b>{order['total_cents']/100:.2f} €</b>.</p>",
                })
        except Exception as e:
            logger.error(f"Order email failed: {e}")

    await db.orders.update_one({"stripe_session_id": session_id}, {"$set": update})
    return await db.orders.find_one({"stripe_session_id": session_id}, {"_id": 0})


async def public_order_status(db, slug: str, session_id: str, stripe_deps: dict, email_deps: dict) -> dict:
    order = await _apply_shop_order_if_paid(db, session_id, stripe_deps, email_deps)
    if not order:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    return {
        "order_id": order.get("id"),
        "status": order.get("status"),
        "payment_status": order.get("payment_status"),
        "total_cents": order.get("total_cents"),
        "currency": order.get("currency"),
        "customer_email": order.get("customer_email"),
        "items": order.get("items", []),
        "shipping_method_name": order.get("shipping_method_name"),
    }


async def list_orders(db, shop_id: str, user: dict) -> list:
    shop = await db.shops.find_one({"id": shop_id, "user_id": user["id"]}, {"_id": 0, "id": 1})
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    orders = await db.orders.find({"shop_id": shop_id}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return orders


async def update_order_status(db, shop_id: str, order_id: str, body: OrderStatusUpdate, user: dict) -> dict:
    shop = await db.shops.find_one({"id": shop_id, "user_id": user["id"]}, {"_id": 0, "id": 1})
    if not shop:
        raise HTTPException(status_code=404, detail="Boutique introuvable")
    allowed = {"pending", "paid", "shipped", "delivered", "cancelled"}
    if body.status not in allowed:
        raise HTTPException(status_code=400, detail="Statut invalide")
    res = await db.orders.update_one(
        {"id": order_id, "shop_id": shop_id},
        {"$set": {"status": body.status, "updated_at": now_iso()}},
    )
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Commande introuvable")
    updated = await db.orders.find_one({"id": order_id}, {"_id": 0})
    return updated


async def apply_shop_order_if_paid(db, session_id: str, stripe_deps: dict, email_deps: dict) -> Optional[dict]:
    """Wrapper public pour le webhook Stripe — délègue à _apply_shop_order_if_paid."""
    return await _apply_shop_order_if_paid(db, session_id, stripe_deps, email_deps)
