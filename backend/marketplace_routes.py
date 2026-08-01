"""
Marketplace ArtisanWeb — Annuaire public + Appel d'offres
Fonctions pures (sans décorateurs FastAPI) appelées depuis server.py.
Le pattern suit exactement artisan_routes.py.
"""
import uuid
import logging
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from fastapi import HTTPException

logger = logging.getLogger("marketplace")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


TRADES = [
    "Plomberie", "Électricité", "Maçonnerie", "Peinture", "Menuiserie",
    "Chauffage", "Couverture", "Carrelage", "Paysagiste", "Serrurerie",
    "Plâtrerie", "Rénovation", "Climatisation", "Jardinage", "Nettoyage",
]


# ============================================================================
# Routes publiques (pas d'auth)
# ============================================================================

async def list_artisans(db, business_type: Optional[str] = None, city: Optional[str] = None,
                        disponible: Optional[bool] = None, verified: Optional[bool] = None,
                        page: int = 1, limit: int = 12) -> dict:
    """Annuaire public des artisans — GET /api/public/artisans"""
    query: Dict[str, Any] = {
        "status": "published",
        "marketplace_visible": True,
    }

    if business_type:
        query["business_type"] = {"$regex": f"^{business_type}$", "$options": "i"}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if disponible is True:
        query["disponibilite"] = "disponible"
    if verified is True:
        query["verified"] = True

    total = await db.sites.count_documents(query)
    skip = (page - 1) * limit

    cursor = db.sites.find(
        query,
        {
            "_id": 0,
            "id": 1,
            "slug": 1,
            "business_name": 1,
            "business_type": 1,
            "services": 1,
            "city": 1,
            "phone": 1,
            "email": 1,
            "hero_image_url": 1,
            "verified": 1,
            "disponibilite": 1,
            "zone_km": 1,
            "about_text": {"$ifNull": ["$content.about_text", None]},
            "created_at": 1,
        },
    ).sort("created_at", -1).skip(skip).limit(limit)

    artisans = await cursor.to_list(limit)
    return {
        "artisans": artisans,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": max(1, -(-total // limit)),
    }


async def get_artisan_profile(db, slug: str) -> dict:
    """Fiche publique d'un artisan — GET /api/public/artisans/{slug}"""
    site = await db.sites.find_one(
        {"slug": slug, "status": "published", "marketplace_visible": True},
        {"_id": 0},
    )
    if not site:
        raise HTTPException(status_code=404, detail="Artisan introuvable")

    # Nettoyer les champs sensibles
    site.pop("user_id", None)
    site.pop("domain_token", None)
    site.pop("custom_domain", None)
    site.pop("domain_verified", None)
    site.pop("_id", None)

    # Garantir les champs marketplace avec défaut
    if "marketplace_visible" not in site:
        site["marketplace_visible"] = True
    site.setdefault("verified", False)
    site.setdefault("disponibilite", "disponible")
    site.setdefault("zone_km", 30)
    site.setdefault("gallery", [])

    return site


async def submit_demande(db, body) -> dict:
    """Soumettre un appel d'offres — POST /api/public/marketplace/demandes"""
    # Si un artisan spécifique est ciblé, vérifier son existence
    target_artisan = None
    if body.artisan_slug:
        target_artisan = await db.sites.find_one(
            {"slug": body.artisan_slug, "status": "published", "marketplace_visible": True},
            {"_id": 0, "id": 1, "business_name": 1, "city": 1, "email": 1, "user_id": 1},
        )
        if not target_artisan:
            raise HTTPException(status_code=404, detail="Artisan introuvable")

    demande = {
        "id": str(uuid.uuid4()),
        "name": body.name.strip(),
        "email": body.email.lower(),
        "phone": body.phone,
        "city": body.city.strip(),
        "besoin": body.besoin.strip(),
        "urgence": body.urgence,
        "type_logement": getattr(body, "type_logement", None),
        "code_postal": getattr(body, "code_postal", None),
        "artisan_slug": body.artisan_slug,
        "artisan_name": target_artisan["business_name"] if target_artisan else None,
        "status": "nouvelle",
        "created_at": now_iso(),
    }
    await db.demandes.insert_one(demande)
    demande.pop("_id", None)

    # Notification email
    notified_count = 0
    if target_artisan:
        owner = await db.users.find_one({"id": target_artisan["user_id"]}, {"_id": 0, "email": 1})
        if owner and owner.get("email"):
            await _send_notification_email(db, owner["email"], target_artisan["business_name"], body)
            notified_count = 1
    else:
        artisans_in_zone = await db.sites.find(
            {
                "status": "published",
                "marketplace_visible": True,
                "city": {"$regex": body.city, "$options": "i"},
            },
            {"_id": 0, "user_id": 1, "business_name": 1},
        ).to_list(50)

        for art in artisans_in_zone:
            owner = await db.users.find_one({"id": art["user_id"]}, {"_id": 0, "email": 1, "pro_until": 1})
            if owner and owner.get("email"):
                pro_until = owner.get("pro_until")
                is_pro = False
                if pro_until:
                    try:
                        is_pro = datetime.fromisoformat(pro_until) > datetime.now(timezone.utc)
                    except Exception:
                        pass
                if is_pro:
                    await _send_notification_email(db, owner["email"], art["business_name"], body)
                    notified_count += 1

    logger.info(f"Demande {demande['id']} créée — {notified_count} artisans notifiés")
    return {
        "ok": True,
        "id": demande["id"],
        "message": f"Votre demande a été transmise à {notified_count if notified_count else 'plusieurs'} artisan(s) de votre zone.",
    }


async def _send_notification_email(db, owner_email: str, business_name: str, body):
    """Envoie une notification email (async — ne bloque pas la réponse)."""
    import os
    import asyncio

    RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
    SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

    if not RESEND_API_KEY:
        logger.info(f"[email skipped — no RESEND_API_KEY] would notify {owner_email} for {business_name}")
        return

    try:
        import resend
        resend.api_key = RESEND_API_KEY

        urgence_label = {"normal": "Normal", "urgent": "Urgent", "tres_urgent": "Très urgent"}

        html = f"""
        <table width="100%" cellpadding="0" cellspacing="0" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif; background:#FAFAFA; padding:32px 16px;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#fff; border:1px solid #E4E4E7;">
              <tr><td style="padding:32px 32px 0; border-bottom:4px solid #F95A2C;">
                <div style="font-family:monospace; font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:#71717A; margin-bottom:8px;">// nouvelle demande marketplace</div>
                <h1 style="margin:0 0 8px; font-size:28px; color:#09090B; font-weight:800;">Nouveau besoin à <span style="color:#F95A2C;">{body.city}</span></h1>
                <p style="margin:0 0 24px; color:#52525B; font-size:14px;">Un client a décrit son projet via la marketplace.</p>
              </td></tr>
              <tr><td style="padding:24px 32px;">
                <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E7;">
                  <tr><td style="padding:14px 18px; border-bottom:1px solid #E4E4E7;"><div style="font-size:11px; color:#71717A; text-transform:uppercase; letter-spacing:.15em;">Client</div><div style="font-size:16px; color:#09090B; font-weight:600;">{body.name}</div></td></tr>
                  <tr><td style="padding:14px 18px; border-bottom:1px solid #E4E4E7;"><div style="font-size:11px; color:#71717A; text-transform:uppercase; letter-spacing:.15em;">Email</div><a href="mailto:{body.email}" style="font-size:16px; color:#F95A2C; text-decoration:none;">{body.email}</a></td></tr>
                  {f"<tr><td style='padding:14px 18px; border-bottom:1px solid #E4E4E7;'><div style='font-size:11px; color:#71717A; text-transform:uppercase; letter-spacing:.15em;'>Téléphone</div><a href='tel:{body.phone}' style='font-size:16px; color:#F95A2C; text-decoration:none;'>{body.phone}</a></td></tr>" if body.phone else ""}
                  <tr><td style="padding:14px 18px; border-bottom:1px solid #E4E4E7;"><div style="font-size:11px; color:#71717A; text-transform:uppercase; letter-spacing:.15em;">Ville</div><div style="font-size:16px; color:#09090B; font-weight:600;">{body.city}</div></td></tr>
                  <tr><td style="padding:14px 18px; border-bottom:1px solid #E4E4E7;"><div style="font-size:11px; color:#71717A; text-transform:uppercase; letter-spacing:.15em;">Urgence</div><div style="font-size:16px; color:#09090B; font-weight:600;">{urgence_label.get(body.urgence, body.urgence)}</div></td></tr>
                  {f"<tr><td style='padding:14px 18px; border-bottom:1px solid #E4E4E7;'><div style='font-size:11px; color:#71717A; text-transform:uppercase; letter-spacing:.15em;'>Type logement</div><div style='font-size:16px; color:#09090B; font-weight:600;'>{body.type_logement}</div></td></tr>" if getattr(body, 'type_logement', None) else ""}
                  <tr><td style="padding:14px 18px;"><div style="font-size:11px; color:#71717A; text-transform:uppercase; letter-spacing:.15em; margin-bottom:8px;">Description</div><div style="font-size:15px; color:#1F2937; line-height:1.6; white-space:pre-wrap;">{body.besoin}</div></td></tr>
                </table>
              </td></tr>
              <tr><td style="padding:8px 32px 32px;"><a href="mailto:{body.email}" style="display:inline-block; background:#09090B; color:#fff; padding:12px 24px; text-decoration:none; font-weight:600; font-size:14px;">Répondre au client</a></td></tr>
              <tr><td style="padding:24px 32px; background:#FAFAFA; border-top:1px solid #E4E4E7;"><div style="font-family:monospace; font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:#71717A;">artisanweb · marketplace</div></td></tr>
            </table>
          </td></tr>
        </table>
        """

        await asyncio.to_thread(
            resend.Emails.send,
            {
                "from": SENDER_EMAIL,
                "to": [owner_email],
                "subject": f"Nouvelle demande à {body.city} — {body.name}",
                "html": html,
            },
        )
        logger.info(f"Marketplace notification sent to {owner_email}")
    except Exception as e:
        logger.error(f"Marketplace email notification failed for {owner_email}: {e}")


# ============================================================================
# Routes authentifiées (dashboard artisan)
# ============================================================================

async def update_visibility(db, site_id: str, user: dict, body) -> dict:
    """Mettre à jour les paramètres de visibilité marketplace — PUT /api/marketplace/sites/{site_id}/visibility"""
    site = await db.sites.find_one({"id": site_id, "user_id": user["id"]})
    if not site:
        raise HTTPException(status_code=404, detail="Site introuvable")

    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if update:
        update["updated_at"] = now_iso()
        await db.sites.update_one({"id": site_id}, {"$set": update})

    updated = await db.sites.find_one({"id": site_id}, {"_id": 0})
    return updated


async def get_visibility(db, site_id: str, user: dict) -> dict:
    """Récupérer les paramètres de visibilité — GET /api/marketplace/sites/{site_id}/visibility"""
    site = await db.sites.find_one(
        {"id": site_id, "user_id": user["id"]},
        {"_id": 0,
         "marketplace_visible": 1,
         "verified": 1,
         "disponibilite": 1,
         "zone_km": 1,
         "gallery": 1,
         "business_name": 1,
         "business_type": 1,
         "city": 1,
         "slug": 1,
         "hero_image_url": 1,
         "services": 1,
         },
    )
    if not site:
        raise HTTPException(status_code=404, detail="Site introuvable")

    return {
        "marketplace_visible": site.get("marketplace_visible", False),
        "verified": site.get("verified", False),
        "disponibilite": site.get("disponibilite", "disponible"),
        "zone_km": site.get("zone_km", 30),
        "gallery": site.get("gallery", []),
        "business_name": site.get("business_name"),
        "business_type": site.get("business_type"),
        "city": site.get("city"),
        "slug": site.get("slug"),
        "hero_image_url": site.get("hero_image_url"),
        "services": site.get("services", []),
    }


async def list_trades() -> dict:
    """Retourne la liste des métiers disponibles."""
    return {"trades": TRADES}
