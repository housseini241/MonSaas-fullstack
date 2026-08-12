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


# ============================================================================
# Routes admin — gestion des appels d'offres
# ============================================================================

async def admin_create_demande(db, body, admin: dict) -> dict:
    """Créer une demande manuellement (sourcée hors plateforme) — POST /api/admin/marketplace/demandes"""
    teaser = f"Recherche {body.type_travaux or 'artisan'} à {body.city} — {body.besoin[:120]}{'...' if len(body.besoin) > 120 else ''}"

    demande = {
        "id": str(uuid.uuid4()),
        "name": body.name.strip(),
        "email": body.email.lower(),
        "phone": body.phone,
        "city": body.city.strip(),
        "code_postal": body.code_postal,
        "besoin": body.besoin.strip(),
        "urgence": body.urgence,
        "type_travaux": body.type_travaux,
        "type_logement": body.type_logement,
        "artisan_slug": None,
        "artisan_name": None,
        "source": "manuel",
        "origin_note": body.origin_note,
        "public_teaser": teaser,
        "status": "nouvelle",
        "views_count": 0,
        "responses": [],
        "campaign_sent_to": [],
        "created_by": admin.get("email"),
        "created_at": now_iso(),
    }
    await db.demandes.insert_one(demande)
    demande.pop("_id", None)
    logger.info(f"Demande manuelle {demande['id']} créée par {admin.get('email')}")
    return demande


async def admin_list_demandes(db, status_filter: Optional[str], source: Optional[str], page: int, limit: int) -> dict:
    """Liste toutes les demandes (manuelles + client) — GET /api/admin/marketplace/demandes"""
    query: Dict[str, Any] = {}
    if status_filter:
        query["status"] = status_filter
    if source:
        query["source"] = source

    total = await db.demandes.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.demandes.find(query, {"_id": 0}).sort("created_at", -1).skip(skip).limit(limit)
    demandes = await cursor.to_list(limit)

    return {
        "demandes": demandes,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": max(1, -(-total // limit)),
    }


async def admin_update_demande(db, demande_id: str, body) -> dict:
    """Modifier le statut/teaser d'une demande — PUT /api/admin/marketplace/demandes/{id}"""
    demande = await db.demandes.find_one({"id": demande_id})
    if not demande:
        raise HTTPException(status_code=404, detail="Demande introuvable")

    update = {k: v for k, v in body.model_dump().items() if v is not None}
    if update:
        update["updated_at"] = now_iso()
        await db.demandes.update_one({"id": demande_id}, {"$set": update})

    updated = await db.demandes.find_one({"id": demande_id}, {"_id": 0})
    return updated


async def admin_delete_demande(db, demande_id: str) -> dict:
    """Supprimer une demande — DELETE /api/admin/marketplace/demandes/{id}"""
    result = await db.demandes.delete_one({"id": demande_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Demande introuvable")
    return {"ok": True}


async def admin_send_campaign(db, body) -> dict:
    """Envoyer une campagne email aux artisans ciblés — POST /api/admin/marketplace/campaigns"""
    demande = await db.demandes.find_one({"id": body.demande_id}, {"_id": 0})
    if not demande:
        raise HTTPException(status_code=404, detail="Demande introuvable")

    target_emails: List[str] = []

    if body.artisan_emails:
        target_emails = [e.lower() for e in body.artisan_emails]
    else:
        query: Dict[str, Any] = {"status": "published", "marketplace_visible": True}
        if body.city:
            query["city"] = {"$regex": body.city, "$options": "i"}
        if body.trade:
            query["business_type"] = {"$regex": f"^{body.trade}$", "$options": "i"}

        sites = await db.sites.find(query, {"_id": 0, "user_id": 1}).to_list(200)
        user_ids = list({s["user_id"] for s in sites if s.get("user_id")})
        users = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0, "email": 1}).to_list(200)
        target_emails = [u["email"] for u in users if u.get("email")]

    sent = []
    for email in target_emails:
        ok = await _send_campaign_email(email, demande)
        if ok:
            sent.append({"email": email, "sent_at": now_iso()})

    if sent:
        await db.demandes.update_one(
            {"id": body.demande_id},
            {"$push": {"campaign_sent_to": {"$each": sent}}, "$set": {"status": "en_cours"}},
        )

    logger.info(f"Campagne demande {body.demande_id} — {len(sent)}/{len(target_emails)} emails envoyés")
    return {"ok": True, "targeted": len(target_emails), "sent": len(sent)}


async def _send_campaign_email(to_email: str, demande: dict) -> bool:
    """Envoie un email de campagne pour une demande (sans coordonnées prospect)."""
    import os
    import asyncio

    RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
    SENDER_EMAIL = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
    FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://hustart.fr")

    if not RESEND_API_KEY:
        logger.info(f"[email skipped — no RESEND_API_KEY] would send campaign to {to_email}")
        return False

    try:
        import resend
        resend.api_key = RESEND_API_KEY

        cta_url = f"{FRONTEND_URL}/marketplace/appels-doffres/{demande['id']}"

        html = f"""
        <table width="100%" cellpadding="0" cellspacing="0" style="font-family:-apple-system,BlinkMacSystemFont,sans-serif; background:#F4F6FB; padding:32px 16px;">
          <tr><td align="center">
            <table width="560" cellpadding="0" cellspacing="0" style="background:#fff; border:1px solid #E4E8F1;">
              <tr><td style="padding:32px 32px 0; border-bottom:4px solid #4F46E5;">
                <div style="font-family:monospace; font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:#6B7280; margin-bottom:8px;">// appel d'offres hustart</div>
                <h1 style="margin:0 0 8px; font-size:26px; color:#0F1222; font-weight:700;">Un client cherche un artisan à {demande['city']}</h1>
                <p style="margin:0 0 24px; color:#6B7280; font-size:14px;">{demande.get('public_teaser', '')}</p>
              </td></tr>
              <tr><td style="padding:8px 32px 32px;">
                <a href="{cta_url}" style="display:inline-block; background:#0F1222; color:#fff; padding:12px 24px; text-decoration:none; font-weight:600; font-size:14px; border-radius:8px;">Voir la demande et répondre</a>
                <p style="margin:16px 0 0; color:#9CA3AF; font-size:12px;">Créez votre compte Hustart gratuit pour envoyer un devis directement depuis votre tableau de bord.</p>
              </td></tr>
              <tr><td style="padding:24px 32px; background:#FAFAFA; border-top:1px solid #E4E8F1;"><div style="font-family:monospace; font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:#9CA3AF;">hustart · marketplace</div></td></tr>
            </table>
          </td></tr>
        </table>
        """

        await asyncio.to_thread(
            resend.Emails.send,
            {
                "from": SENDER_EMAIL,
                "to": [to_email],
                "subject": f"Nouvel appel d'offres à {demande['city']} — {demande.get('type_travaux') or 'artisan recherché'}",
                "html": html,
            },
        )
        return True
    except Exception as e:
        logger.error(f"Campaign email failed for {to_email}: {e}")
        return False


async def admin_marketplace_stats(db) -> dict:
    """Stats de conversion du canal appels d'offres — GET /api/admin/marketplace/stats"""
    total_demandes = await db.demandes.count_documents({})
    manuelles = await db.demandes.count_documents({"source": "manuel"})
    total_emails_sent = 0
    async for d in db.demandes.find({}, {"_id": 0, "campaign_sent_to": 1}):
        total_emails_sent += len(d.get("campaign_sent_to", []))

    signups_from_channel = await db.users.count_documents({"converted_from_demande_id": {"$exists": True, "$ne": None}})
    total_responses = 0
    async for d in db.demandes.find({}, {"_id": 0, "responses": 1}):
        total_responses += len(d.get("responses", []))

    return {
        "total_demandes": total_demandes,
        "demandes_manuelles": manuelles,
        "emails_envoyes": total_emails_sent,
        "comptes_crees": signups_from_channel,
        "devis_envoyes": total_responses,
    }


# ============================================================================
# Réponse artisan à un appel d'offres
# ============================================================================

async def get_public_demande(db, demande_id: str) -> dict:
    """Fiche publique anonymisée d'une demande — GET /api/public/marketplace/demandes/{id}"""
    demande = await db.demandes.find_one({"id": demande_id}, {"_id": 0})
    if not demande or demande.get("status") == "archivee":
        raise HTTPException(status_code=404, detail="Demande introuvable")

    await db.demandes.update_one({"id": demande_id}, {"$inc": {"views_count": 1}})

    # Ne jamais exposer les coordonnées du prospect publiquement
    return {
        "id": demande["id"],
        "city": demande.get("city"),
        "type_travaux": demande.get("type_travaux"),
        "urgence": demande.get("urgence"),
        "public_teaser": demande.get("public_teaser"),
        "status": demande.get("status"),
        "created_at": demande.get("created_at"),
    }


async def artisan_repondre_demande(db, demande_id: str, user: dict) -> dict:
    """Créer/réutiliser un client CRM depuis la demande et l'attacher à l'artisan — POST /api/artisan/marketplace/demandes/{id}/repondre"""
    demande = await db.demandes.find_one({"id": demande_id}, {"_id": 0})
    if not demande or demande.get("status") == "archivee":
        raise HTTPException(status_code=404, detail="Demande introuvable")

    # Réutiliser un client existant (même artisan + même demande) pour éviter les doublons
    existing_client = await db.clients.find_one(
        {"user_id": user["id"], "demande_id": demande_id}, {"_id": 0, "id": 1}
    )
    if existing_client:
        client_id = existing_client["id"]
    else:
        client_id = str(uuid.uuid4())
        client_doc = {
            "id": client_id,
            "user_id": user["id"],
            "nom": demande["name"],
            "prenom": None,
            "email": demande["email"],
            "telephone": demande.get("phone"),
            "adresse": None,
            "ville": demande["city"],
            "code_postal": demande.get("code_postal"),
            "notes": f"Prospect issu d'un appel d'offres Hustart : {demande['besoin']}",
            "statut_pipeline": "nouveau",
            "source": "appel_offre",
            "demande_id": demande_id,
            "site_id": None,
            "site_slug": None,
            "pipeline_updated_at": now_iso(),
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }
        await db.clients.insert_one(client_doc)

    await db.demandes.update_one({"id": demande_id}, {"$set": {"status": "en_cours"}})

    return {
        "client_id": client_id,
        "besoin": demande["besoin"],
        "urgence": demande.get("urgence"),
        "type_travaux": demande.get("type_travaux"),
        "city": demande.get("city"),
    }


async def artisan_confirm_devis_sent(db, demande_id: str, user: dict, devis_id: Optional[str]) -> dict:
    """Enregistrer qu'un artisan a répondu à la demande avec un devis — POST /api/artisan/marketplace/demandes/{id}/confirm-sent"""
    if not devis_id:
        raise HTTPException(status_code=400, detail="devis_id requis")

    demande = await db.demandes.find_one({"id": demande_id})
    if not demande:
        raise HTTPException(status_code=404, detail="Demande introuvable")

    await db.demandes.update_one(
        {"id": demande_id},
        {"$push": {"responses": {"artisan_id": user["id"], "devis_id": devis_id, "responded_at": now_iso()}}},
    )
    return {"ok": True}
