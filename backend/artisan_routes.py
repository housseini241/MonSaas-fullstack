"""
Routes et modèles pour le Dashboard Métier Artisan
Gestion: Clients, Devis, Factures, RDV, Messages
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, Field, EmailStr, ConfigDict
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import uuid
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio
import logging
from io import BytesIO

logger = logging.getLogger("artisan")

# Router pour les routes artisan
artisan_router = APIRouter(prefix="/api/artisan", tags=["artisan"])

# ============================================================================
# MODELS
# ============================================================================

class Client(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    nom: str
    prenom: Optional[str] = None
    email: Optional[EmailStr] = None
    telephone: Optional[str] = None
    adresse: Optional[str] = None
    ville: Optional[str] = None
    code_postal: Optional[str] = None
    notes: Optional[str] = None
    statut_pipeline: str = "nouveau"  # nouveau, appeler, a_rappeler, signe
    pipeline_updated_at: Optional[str] = None
    source: Optional[str] = None  # site_web, manuel
    site_id: Optional[str] = None
    site_slug: Optional[str] = None
    created_at: str
    updated_at: str

class ClientCreate(BaseModel):
    nom: str = Field(min_length=2, max_length=100)
    prenom: Optional[str] = Field(default=None, max_length=100)
    email: Optional[EmailStr] = None
    telephone: Optional[str] = Field(default=None, max_length=20)
    adresse: Optional[str] = None
    ville: Optional[str] = None
    code_postal: Optional[str] = Field(default=None, max_length=10)
    notes: Optional[str] = None
    statut_pipeline: Optional[str] = "nouveau"

class ClientUpdate(BaseModel):
    nom: Optional[str] = Field(default=None, min_length=2, max_length=100)
    prenom: Optional[str] = Field(default=None, max_length=100)
    email: Optional[EmailStr] = None
    telephone: Optional[str] = Field(default=None, max_length=20)
    adresse: Optional[str] = None
    ville: Optional[str] = None
    code_postal: Optional[str] = Field(default=None, max_length=10)
    notes: Optional[str] = None
    statut_pipeline: Optional[str] = None

class PipelineStatusUpdate(BaseModel):
    statut_pipeline: str = Field(pattern="^(nouveau|appeler|a_rappeler|signe)$")

class DevisItem(BaseModel):
    description: str
    quantite: float = Field(gt=0)
    prix_unitaire: float = Field(ge=0)
    montant: float = Field(ge=0)  # quantite * prix_unitaire

class Devis(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    numero: str  # DEV-2025-001
    client_id: str
    client_nom: str  # denormalized for display
    date: str
    validite_jours: int = 30
    items: List[DevisItem]
    montant_ht: float
    tva_pourcent: float = 20.0
    montant_tva: float
    montant_ttc: float
    statut: str  # en_attente, accepte, refuse, expire
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class DevisCreate(BaseModel):
    client_id: str
    date: str
    validite_jours: int = Field(default=30, ge=1, le=365)
    items: List[DevisItem] = Field(min_length=1)
    tva_pourcent: float = Field(default=20.0, ge=0, le=100)
    notes: Optional[str] = None

class DevisUpdate(BaseModel):
    date: Optional[str] = None
    validite_jours: Optional[int] = Field(default=None, ge=1, le=365)
    items: Optional[List[DevisItem]] = None
    tva_pourcent: Optional[float] = Field(default=None, ge=0, le=100)
    statut: Optional[str] = None
    notes: Optional[str] = None

class Facture(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    numero: str  # FAC-2025-001
    devis_id: Optional[str] = None
    client_id: str
    client_nom: str
    date: str
    items: List[DevisItem]
    montant_ht: float
    tva_pourcent: float = 20.0
    montant_tva: float
    montant_ttc: float
    statut: str  # impayee, payee, annulee
    date_paiement: Optional[str] = None
    mode_paiement: Optional[str] = None  # virement, cheque, especes, cb
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class FactureCreate(BaseModel):
    devis_id: Optional[str] = None
    client_id: str
    date: str
    items: List[DevisItem] = Field(min_length=1)
    tva_pourcent: float = Field(default=20.0, ge=0, le=100)
    notes: Optional[str] = None

class FactureUpdate(BaseModel):
    statut: Optional[str] = None
    date_paiement: Optional[str] = None
    mode_paiement: Optional[str] = None
    notes: Optional[str] = None

class RDV(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    client_id: Optional[str] = None
    client_nom: Optional[str] = None
    titre: str
    description: Optional[str] = None
    date: str  # YYYY-MM-DD
    heure: str  # HH:MM
    duree_minutes: int = 60
    type_rdv: str  # devis_sur_place, intervention, sav, consultation, autre
    statut: str  # prevu, confirme, termine, annule
    lieu: Optional[str] = None
    notes: Optional[str] = None
    created_at: str
    updated_at: str

class RDVCreate(BaseModel):
    client_id: Optional[str] = None
    titre: str = Field(min_length=2, max_length=200)
    description: Optional[str] = None
    date: str  # YYYY-MM-DD
    heure: str  # HH:MM
    duree_minutes: int = Field(default=60, ge=15, le=480)
    type_rdv: str = Field(default="consultation")
    lieu: Optional[str] = None
    notes: Optional[str] = None

class RDVUpdate(BaseModel):
    client_id: Optional[str] = None
    titre: Optional[str] = Field(default=None, min_length=2, max_length=200)
    description: Optional[str] = None
    date: Optional[str] = None
    heure: Optional[str] = None
    duree_minutes: Optional[int] = Field(default=None, ge=15, le=480)
    type_rdv: Optional[str] = None
    statut: Optional[str] = None
    lieu: Optional[str] = None
    notes: Optional[str] = None

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    user_id: str
    client_id: Optional[str] = None
    client_nom: Optional[str] = None
    contenu: str
    type_message: str  # note, email, sms, appel
    date: str
    lu: bool = False
    created_at: str

class MessageCreate(BaseModel):
    client_id: Optional[str] = None
    contenu: str = Field(min_length=1)
    type_message: str = Field(default="note")
    date: Optional[str] = None

# ============================================================================
# HELPERS
# ============================================================================

def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

async def generate_numero(db, collection_name: str, prefix: str, user_id: str) -> str:
    """Generate unique numero like DEV-2025-001"""
    year = datetime.now(timezone.utc).year
    # Find highest number for this year and user
    pipeline = [
        {"$match": {"user_id": user_id, "numero": {"$regex": f"^{prefix}-{year}-"}}},
        {"$project": {"numero": 1}},
        {"$sort": {"numero": -1}},
        {"$limit": 1}
    ]
    result = await db[collection_name].aggregate(pipeline).to_list(1)
    if result:
        last_numero = result[0]["numero"]
        try:
            last_num = int(last_numero.split("-")[-1])
            new_num = last_num + 1
        except:
            new_num = 1
    else:
        new_num = 1
    return f"{prefix}-{year}-{str(new_num).zfill(3)}"

def calculate_totals(items: List[DevisItem], tva_pourcent: float) -> tuple:
    """Calculate montant_ht, montant_tva, montant_ttc"""
    montant_ht = sum(item.montant for item in items)
    montant_tva = montant_ht * (tva_pourcent / 100)
    montant_ttc = montant_ht + montant_tva
    return round(montant_ht, 2), round(montant_tva, 2), round(montant_ttc, 2)

# ============================================================================
# CLIENTS ROUTES
# ============================================================================

@artisan_router.post("/clients", response_model=Client)
async def create_client(body: ClientCreate, user: dict, db):
    """Créer un nouveau client"""
    data = body.model_dump()
    # Default statut_pipeline to "nouveau" if not provided
    if not data.get("statut_pipeline"):
        data["statut_pipeline"] = "nouveau"
    client_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        **data,
        "pipeline_updated_at": now_iso(),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.clients.insert_one(client_doc)
    client_doc.pop("_id", None)
    return Client(**client_doc)

@artisan_router.get("/clients", response_model=List[Client])
async def list_clients(user: dict, db, search: Optional[str] = None, statut_pipeline: Optional[str] = None):
    """Liste tous les clients de l'artisan avec recherche optionnelle et filtre par statut pipeline"""
    query: Dict[str, Any] = {"user_id": user["id"]}
    and_conditions = []

    if search:
        and_conditions.append({
            "$or": [
                {"nom": {"$regex": search, "$options": "i"}},
                {"prenom": {"$regex": search, "$options": "i"}},
                {"email": {"$regex": search, "$options": "i"}},
                {"telephone": {"$regex": search, "$options": "i"}},
            ]
        })

    if statut_pipeline:
        if statut_pipeline == "nouveau":
            # Include legacy clients (no statut_pipeline) as "nouveau"
            and_conditions.append({
                "$or": [
                    {"statut_pipeline": "nouveau"},
                    {"statut_pipeline": {"$exists": False}},
                    {"statut_pipeline": None},
                    {"statut_pipeline": ""},
                ]
            })
        else:
            query["statut_pipeline"] = statut_pipeline

    if and_conditions:
        query["$and"] = and_conditions

    clients = await db.clients.find(query, {"_id": 0}).sort("nom", 1).to_list(1000)
    # Ensure default statut_pipeline for legacy records
    for c in clients:
        if not c.get("statut_pipeline"):
            c["statut_pipeline"] = "nouveau"
    return [Client(**c) for c in clients]

@artisan_router.get("/clients/{client_id}", response_model=Client)
async def get_client(client_id: str, user: dict, db):
    """Récupérer un client spécifique"""
    client = await db.clients.find_one({"id": client_id, "user_id": user["id"]}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
    return Client(**client)

@artisan_router.put("/clients/{client_id}", response_model=Client)
async def update_client(client_id: str, body: ClientUpdate, user: dict, db):
    """Mettre à jour un client"""
    client = await db.clients.find_one({"id": client_id, "user_id": user["id"]})
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
    
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = now_iso()
        await db.clients.update_one({"id": client_id}, {"$set": update_data})
    
    updated = await db.clients.find_one({"id": client_id}, {"_id": 0})
    return Client(**updated)

@artisan_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, user: dict, db):
    """Supprimer un client"""
    result = await db.clients.delete_one({"id": client_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Client introuvable")
    return {"deleted": True}

@artisan_router.put("/clients/{client_id}/pipeline-status", response_model=Client)
async def update_client_pipeline_status(client_id: str, body: PipelineStatusUpdate, user: dict, db):
    """Changer le statut pipeline d'un client (nouveau/appeler/a_rappeler/signe)"""
    client = await db.clients.find_one({"id": client_id, "user_id": user["id"]})
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
    await db.clients.update_one(
        {"id": client_id},
        {"$set": {
            "statut_pipeline": body.statut_pipeline,
            "pipeline_updated_at": now_iso(),
            "updated_at": now_iso(),
        }}
    )
    updated = await db.clients.find_one({"id": client_id}, {"_id": 0})
    if not updated.get("statut_pipeline"):
        updated["statut_pipeline"] = "nouveau"
    return Client(**updated)

# ============================================================================
# DEVIS ROUTES
# ============================================================================

@artisan_router.post("/devis", response_model=Devis)
async def create_devis(body: DevisCreate, user: dict, db):
    """Créer un nouveau devis"""
    # Verify client exists
    client = await db.clients.find_one({"id": body.client_id, "user_id": user["id"]}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
    
    # Generate numero
    numero = await generate_numero(db, "devis", "DEV", user["id"])
    
    # Calculate totals
    montant_ht, montant_tva, montant_ttc = calculate_totals(body.items, body.tva_pourcent)
    
    client_nom = f"{client.get('prenom', '')} {client['nom']}".strip()
    
    devis_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "numero": numero,
        "client_id": body.client_id,
        "client_nom": client_nom,
        "date": body.date,
        "validite_jours": body.validite_jours,
        "items": [item.model_dump() for item in body.items],
        "montant_ht": montant_ht,
        "tva_pourcent": body.tva_pourcent,
        "montant_tva": montant_tva,
        "montant_ttc": montant_ttc,
        "statut": "en_attente",
        "notes": body.notes,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.devis.insert_one(devis_doc)
    devis_doc.pop("_id", None)
    return Devis(**devis_doc)

@artisan_router.get("/devis", response_model=List[Devis])
async def list_devis(user: dict, db, client_id: Optional[str] = None, statut: Optional[str] = None):
    """Liste tous les devis avec filtres optionnels"""
    query = {"user_id": user["id"]}
    if client_id:
        query["client_id"] = client_id
    if statut:
        query["statut"] = statut
    devis_list = await db.devis.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return [Devis(**d) for d in devis_list]

@artisan_router.get("/devis/{devis_id}", response_model=Devis)
async def get_devis(devis_id: str, user: dict, db):
    """Récupérer un devis spécifique"""
    devis = await db.devis.find_one({"id": devis_id, "user_id": user["id"]}, {"_id": 0})
    if not devis:
        raise HTTPException(status_code=404, detail="Devis introuvable")
    return Devis(**devis)

@artisan_router.put("/devis/{devis_id}", response_model=Devis)
async def update_devis(devis_id: str, body: DevisUpdate, user: dict, db):
    """Mettre à jour un devis"""
    devis = await db.devis.find_one({"id": devis_id, "user_id": user["id"]})
    if not devis:
        raise HTTPException(status_code=404, detail="Devis introuvable")
    
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    
    # Recalculate if items or tva changed
    if "items" in update_data or "tva_pourcent" in update_data:
        items = [DevisItem(**item) for item in (update_data.get("items") or devis["items"])]
        tva = update_data.get("tva_pourcent", devis["tva_pourcent"])
        montant_ht, montant_tva, montant_ttc = calculate_totals(items, tva)
        update_data.update({
            "montant_ht": montant_ht,
            "montant_tva": montant_tva,
            "montant_ttc": montant_ttc,
        })
        if "items" in update_data:
            update_data["items"] = [item.model_dump() for item in items]
    
    if update_data:
        update_data["updated_at"] = now_iso()
        await db.devis.update_one({"id": devis_id}, {"$set": update_data})
    
    updated = await db.devis.find_one({"id": devis_id}, {"_id": 0})
    return Devis(**updated)

@artisan_router.delete("/devis/{devis_id}")
async def delete_devis(devis_id: str, user: dict, db):
    """Supprimer un devis"""
    result = await db.devis.delete_one({"id": devis_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Devis introuvable")
    return {"deleted": True}

@artisan_router.post("/devis/{devis_id}/send-email")
async def send_devis_email(devis_id: str, user: dict, db):
    """Envoyer le devis par email au client avec PDF en pièce jointe"""
    import base64
    import resend as resend_lib
    from pdf_generator import generate_devis_or_facture_pdf

    devis = await db.devis.find_one({"id": devis_id, "user_id": user["id"]}, {"_id": 0})
    if not devis:
        raise HTTPException(status_code=404, detail="Devis introuvable")

    client = await db.clients.find_one({"id": devis["client_id"]}, {"_id": 0})
    if not client or not client.get("email"):
        raise HTTPException(status_code=400, detail="Client sans email")

    resend_key = os.environ.get("RESEND_API_KEY", "")
    sender = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")

    if not resend_key:
        logger.warning(f"RESEND_API_KEY not set; would send devis {devis['numero']} to {client['email']}")
        return {"sent": False, "email": client["email"], "reason": "Email non configuré (RESEND_API_KEY manquante)"}

    # Generate PDF
    pdf_bytes = await asyncio.to_thread(generate_devis_or_facture_pdf, "devis", devis, client, user)
    pdf_b64 = base64.b64encode(pdf_bytes).decode("utf-8")

    client_name = f"{client.get('prenom', '') or ''} {client.get('nom', '')}".strip()
    artisan_name = user.get("full_name") or user.get("email", "")
    total = devis.get("montant_ttc", 0)
    total_str = f"{total:,.2f}".replace(",", " ").replace(".", ",") + " €"

    html = f"""
    <table width="100%" cellpadding="0" cellspacing="0" style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; background:#FAFAFA; padding:32px 16px;">
      <tr><td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#fff; border:1px solid #E4E4E7;">
          <tr><td style="padding:32px 32px 0; border-bottom:4px solid #F95A2C;">
            <div style="font-family:monospace; font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:#71717A; margin-bottom:8px;">// devis {devis['numero']}</div>
            <h1 style="margin:0 0 8px; font-size:26px; color:#09090B; font-weight:800;">Votre devis est prêt</h1>
            <p style="margin:0 0 24px; color:#52525B; font-size:14px;">Bonjour {client_name}, veuillez trouver ci-joint le devis demandé.</p>
          </td></tr>
          <tr><td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E4E4E7;">
              <tr><td style="padding:14px 18px; border-bottom:1px solid #E4E4E7;"><div style="font-size:11px; color:#71717A; text-transform:uppercase; letter-spacing:.15em;">Numéro</div><div style="font-size:16px; color:#09090B; font-weight:600;">{devis['numero']}</div></td></tr>
              <tr><td style="padding:14px 18px; border-bottom:1px solid #E4E4E7;"><div style="font-size:11px; color:#71717A; text-transform:uppercase; letter-spacing:.15em;">Montant TTC</div><div style="font-size:22px; color:#F95A2C; font-weight:700;">{total_str}</div></td></tr>
              <tr><td style="padding:14px 18px;"><div style="font-size:11px; color:#71717A; text-transform:uppercase; letter-spacing:.15em;">Validité</div><div style="font-size:15px; color:#1F2937;">{devis.get('validite_jours', 30)} jours</div></td></tr>
            </table>
          </td></tr>
          <tr><td style="padding:8px 32px 32px;">
            <p style="margin:8px 0 16px; color:#52525B; font-size:14px;">Pour toute question, n'hésitez pas à me contacter.</p>
            <p style="margin:0; color:#09090B; font-size:14px; font-weight:600;">{artisan_name}</p>
          </td></tr>
          <tr><td style="padding:24px 32px; background:#FAFAFA; border-top:1px solid #E4E4E7;">
            <div style="font-family:monospace; font-size:10px; letter-spacing:.2em; text-transform:uppercase; color:#71717A;">artisanweb · gestion artisan</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
    """

    resend_lib.api_key = resend_key
    params = {
        "from": sender,
        "to": [client["email"]],
        "subject": f"Devis {devis['numero']} — {artisan_name}",
        "html": html,
        "attachments": [{
            "filename": f"{devis['numero']}.pdf",
            "content": pdf_b64,
        }],
    }
    try:
        result = await asyncio.to_thread(resend_lib.Emails.send, params)
        email_id = result.get("id") if isinstance(result, dict) else None
        # Update devis with sent timestamp
        await db.devis.update_one(
            {"id": devis_id},
            {"$set": {"sent_at": now_iso(), "sent_to": client["email"]}}
        )
        logger.info(f"Devis {devis['numero']} sent to {client['email']} (email_id={email_id})")
        return {"sent": True, "email": client["email"], "email_id": email_id}
    except Exception as e:
        logger.error(f"Failed to send devis email: {e}")
        raise HTTPException(status_code=502, detail=f"Échec de l'envoi: {str(e)}")


@artisan_router.get("/devis/{devis_id}/pdf")
async def download_devis_pdf(devis_id: str, user: dict, db):
    """Télécharger le PDF du devis"""
    from fastapi.responses import Response
    from pdf_generator import generate_devis_or_facture_pdf

    devis = await db.devis.find_one({"id": devis_id, "user_id": user["id"]}, {"_id": 0})
    if not devis:
        raise HTTPException(status_code=404, detail="Devis introuvable")

    client = await db.clients.find_one({"id": devis["client_id"]}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")

    pdf_bytes = await asyncio.to_thread(generate_devis_or_facture_pdf, "devis", devis, client, user)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{devis["numero"]}.pdf"',
        },
    )


@artisan_router.post("/devis/{devis_id}/convert-to-facture")
async def convert_devis_to_facture(devis_id: str, user: dict, db):
    """Convertir un devis accepté en facture"""
    devis = await db.devis.find_one({"id": devis_id, "user_id": user["id"]}, {"_id": 0})
    if not devis:
        raise HTTPException(status_code=404, detail="Devis introuvable")

    # Check if a facture already exists for this devis
    existing = await db.factures.find_one({"devis_id": devis_id, "user_id": user["id"]}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=409, detail=f"Une facture existe déjà pour ce devis: {existing['numero']}")

    # Generate numero
    numero = await generate_numero(db, "factures", "FAC", user["id"])

    facture_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "numero": numero,
        "devis_id": devis_id,
        "client_id": devis["client_id"],
        "client_nom": devis["client_nom"],
        "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
        "items": devis["items"],
        "montant_ht": devis["montant_ht"],
        "tva_pourcent": devis["tva_pourcent"],
        "montant_tva": devis["montant_tva"],
        "montant_ttc": devis["montant_ttc"],
        "statut": "impayee",
        "date_paiement": None,
        "mode_paiement": None,
        "notes": devis.get("notes"),
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.factures.insert_one(facture_doc)
    facture_doc.pop("_id", None)

    # Update devis status to accepte
    await db.devis.update_one(
        {"id": devis_id},
        {"$set": {"statut": "accepte", "updated_at": now_iso()}}
    )

    return Facture(**facture_doc)


@artisan_router.get("/factures/{facture_id}/pdf")
async def download_facture_pdf(facture_id: str, user: dict, db):
    """Télécharger le PDF de la facture"""
    from fastapi.responses import Response
    from pdf_generator import generate_devis_or_facture_pdf

    facture = await db.factures.find_one({"id": facture_id, "user_id": user["id"]}, {"_id": 0})
    if not facture:
        raise HTTPException(status_code=404, detail="Facture introuvable")

    client = await db.clients.find_one({"id": facture["client_id"]}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")

    pdf_bytes = await asyncio.to_thread(generate_devis_or_facture_pdf, "facture", facture, client, user)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'inline; filename="{facture["numero"]}.pdf"',
        },
    )

# ============================================================================
# FACTURES ROUTES
# ============================================================================

@artisan_router.post("/factures", response_model=Facture)
async def create_facture(body: FactureCreate, user: dict, db):
    """Créer une nouvelle facture"""
    client = await db.clients.find_one({"id": body.client_id, "user_id": user["id"]}, {"_id": 0})
    if not client:
        raise HTTPException(status_code=404, detail="Client introuvable")
    
    numero = await generate_numero(db, "factures", "FAC", user["id"])
    montant_ht, montant_tva, montant_ttc = calculate_totals(body.items, body.tva_pourcent)
    
    client_nom = f"{client.get('prenom', '')} {client['nom']}".strip()
    
    facture_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "numero": numero,
        "devis_id": body.devis_id,
        "client_id": body.client_id,
        "client_nom": client_nom,
        "date": body.date,
        "items": [item.model_dump() for item in body.items],
        "montant_ht": montant_ht,
        "tva_pourcent": body.tva_pourcent,
        "montant_tva": montant_tva,
        "montant_ttc": montant_ttc,
        "statut": "impayee",
        "date_paiement": None,
        "mode_paiement": None,
        "notes": body.notes,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.factures.insert_one(facture_doc)
    facture_doc.pop("_id", None)
    return Facture(**facture_doc)

@artisan_router.get("/factures", response_model=List[Facture])
async def list_factures(user: dict, db, client_id: Optional[str] = None, statut: Optional[str] = None):
    """Liste toutes les factures"""
    query = {"user_id": user["id"]}
    if client_id:
        query["client_id"] = client_id
    if statut:
        query["statut"] = statut
    factures = await db.factures.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return [Facture(**f) for f in factures]

@artisan_router.get("/factures/{facture_id}", response_model=Facture)
async def get_facture(facture_id: str, user: dict, db):
    """Récupérer une facture"""
    facture = await db.factures.find_one({"id": facture_id, "user_id": user["id"]}, {"_id": 0})
    if not facture:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    return Facture(**facture)

@artisan_router.put("/factures/{facture_id}", response_model=Facture)
async def update_facture(facture_id: str, body: FactureUpdate, user: dict, db):
    """Mettre à jour une facture"""
    facture = await db.factures.find_one({"id": facture_id, "user_id": user["id"]})
    if not facture:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    if update_data:
        update_data["updated_at"] = now_iso()
        await db.factures.update_one({"id": facture_id}, {"$set": update_data})
    
    updated = await db.factures.find_one({"id": facture_id}, {"_id": 0})
    return Facture(**updated)

@artisan_router.delete("/factures/{facture_id}")
async def delete_facture(facture_id: str, user: dict, db):
    """Supprimer une facture"""
    result = await db.factures.delete_one({"id": facture_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    return {"deleted": True}

# ============================================================================
# RDV ROUTES
# ============================================================================

@artisan_router.post("/rdv", response_model=RDV)
async def create_rdv(body: RDVCreate, user: dict, db):
    """Créer un nouveau rendez-vous"""
    client_nom = None
    if body.client_id:
        client = await db.clients.find_one({"id": body.client_id, "user_id": user["id"]}, {"_id": 0})
        if client:
            client_nom = f"{client.get('prenom', '')} {client['nom']}".strip()
    
    rdv_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "client_id": body.client_id,
        "client_nom": client_nom,
        "titre": body.titre,
        "description": body.description,
        "date": body.date,
        "heure": body.heure,
        "duree_minutes": body.duree_minutes,
        "type_rdv": body.type_rdv,
        "statut": "prevu",
        "lieu": body.lieu,
        "notes": body.notes,
        "created_at": now_iso(),
        "updated_at": now_iso(),
    }
    await db.rdv.insert_one(rdv_doc)
    rdv_doc.pop("_id", None)
    return RDV(**rdv_doc)

@artisan_router.get("/rdv", response_model=List[RDV])
async def list_rdv(user: dict, db, client_id: Optional[str] = None, date_debut: Optional[str] = None, date_fin: Optional[str] = None):
    """Liste tous les RDV avec filtres"""
    query = {"user_id": user["id"]}
    if client_id:
        query["client_id"] = client_id
    if date_debut or date_fin:
        query["date"] = {}
        if date_debut:
            query["date"]["$gte"] = date_debut
        if date_fin:
            query["date"]["$lte"] = date_fin
    
    rdv_list = await db.rdv.find(query, {"_id": 0}).sort([("date", 1), ("heure", 1)]).to_list(1000)
    return [RDV(**r) for r in rdv_list]

@artisan_router.get("/rdv/{rdv_id}", response_model=RDV)
async def get_rdv(rdv_id: str, user: dict, db):
    """Récupérer un RDV"""
    rdv = await db.rdv.find_one({"id": rdv_id, "user_id": user["id"]}, {"_id": 0})
    if not rdv:
        raise HTTPException(status_code=404, detail="RDV introuvable")
    return RDV(**rdv)

@artisan_router.put("/rdv/{rdv_id}", response_model=RDV)
async def update_rdv(rdv_id: str, body: RDVUpdate, user: dict, db):
    """Mettre à jour un RDV"""
    rdv = await db.rdv.find_one({"id": rdv_id, "user_id": user["id"]})
    if not rdv:
        raise HTTPException(status_code=404, detail="RDV introuvable")
    
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    
    # Update client_nom if client_id changed
    if "client_id" in update_data and update_data["client_id"]:
        client = await db.clients.find_one({"id": update_data["client_id"], "user_id": user["id"]}, {"_id": 0})
        if client:
            update_data["client_nom"] = f"{client.get('prenom', '')} {client['nom']}".strip()
    
    if update_data:
        update_data["updated_at"] = now_iso()
        await db.rdv.update_one({"id": rdv_id}, {"$set": update_data})
    
    updated = await db.rdv.find_one({"id": rdv_id}, {"_id": 0})
    return RDV(**updated)

@artisan_router.delete("/rdv/{rdv_id}")
async def delete_rdv(rdv_id: str, user: dict, db):
    """Supprimer un RDV"""
    result = await db.rdv.delete_one({"id": rdv_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="RDV introuvable")
    return {"deleted": True}

# ============================================================================
# MESSAGES ROUTES
# ============================================================================

@artisan_router.post("/messages", response_model=Message)
async def create_message(body: MessageCreate, user: dict, db):
    """Créer un nouveau message/note"""
    client_nom = None
    if body.client_id:
        client = await db.clients.find_one({"id": body.client_id, "user_id": user["id"]}, {"_id": 0})
        if client:
            client_nom = f"{client.get('prenom', '')} {client['nom']}".strip()
    
    message_doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "client_id": body.client_id,
        "client_nom": client_nom,
        "contenu": body.contenu,
        "type_message": body.type_message,
        "date": body.date or now_iso(),
        "lu": False,
        "created_at": now_iso(),
    }
    await db.messages.insert_one(message_doc)
    message_doc.pop("_id", None)
    return Message(**message_doc)

@artisan_router.get("/messages", response_model=List[Message])
async def list_messages(user: dict, db, client_id: Optional[str] = None, lu: Optional[bool] = None):
    """Liste tous les messages"""
    query = {"user_id": user["id"]}
    if client_id:
        query["client_id"] = client_id
    if lu is not None:
        query["lu"] = lu
    messages = await db.messages.find(query, {"_id": 0}).sort("date", -1).to_list(1000)
    return [Message(**m) for m in messages]

@artisan_router.put("/messages/{message_id}/mark-read")
async def mark_message_read(message_id: str, user: dict, db):
    """Marquer un message comme lu"""
    result = await db.messages.update_one(
        {"id": message_id, "user_id": user["id"]},
        {"$set": {"lu": True}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Message introuvable")
    return {"marked": True}

@artisan_router.delete("/messages/{message_id}")
async def delete_message(message_id: str, user: dict, db):
    """Supprimer un message"""
    result = await db.messages.delete_one({"id": message_id, "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Message introuvable")
    return {"deleted": True}

# ============================================================================
# DASHBOARD ANALYTICS (Artisan)
# ============================================================================

@artisan_router.get("/analytics/summary")
async def get_artisan_analytics(user: dict, db):
    """Analytics pour le dashboard artisan"""
    now = datetime.now(timezone.utc)
    first_day_month = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0).isoformat()
    thirty_days_ago = (now - timedelta(days=30)).isoformat()
    
    # CA du mois (factures payées)
    factures_mois = await db.factures.find({
        "user_id": user["id"],
        "statut": "payee",
        "date_paiement": {"$gte": first_day_month}
    }, {"_id": 0}).to_list(1000)
    ca_mois = sum(f.get("montant_ttc", 0) for f in factures_mois)
    
    # CA total (toutes factures payées)
    factures_all = await db.factures.find({
        "user_id": user["id"],
        "statut": "payee"
    }, {"_id": 0, "montant_ttc": 1}).to_list(10000)
    ca_total = sum(f.get("montant_ttc", 0) for f in factures_all)
    
    # Devis
    devis_count = await db.devis.count_documents({"user_id": user["id"]})
    devis_en_attente = await db.devis.count_documents({"user_id": user["id"], "statut": "en_attente"})
    devis_30d = await db.devis.count_documents({
        "user_id": user["id"],
        "created_at": {"$gte": thirty_days_ago}
    })
    
    # RDV
    rdv_count = await db.rdv.count_documents({"user_id": user["id"]})
    rdv_a_venir = await db.rdv.count_documents({
        "user_id": user["id"],
        "date": {"$gte": now.strftime("%Y-%m-%d")},
        "statut": {"$in": ["prevu", "confirme"]}
    })
    
    # Clients
    clients_count = await db.clients.count_documents({"user_id": user["id"]})
    
    # Pipeline stats
    pipeline_stats = {}
    for statut in ["nouveau", "appeler", "a_rappeler", "signe"]:
        pipeline_stats[statut] = await db.clients.count_documents({
            "user_id": user["id"],
            "statut_pipeline": statut
        })
    # Also count legacy clients without statut_pipeline as "nouveau"
    legacy_count = await db.clients.count_documents({
        "user_id": user["id"],
        "$or": [
            {"statut_pipeline": {"$exists": False}},
            {"statut_pipeline": None},
            {"statut_pipeline": ""},
        ]
    })
    pipeline_stats["nouveau"] += legacy_count
    
    # Prochains RDV (7 jours)
    seven_days = (now + timedelta(days=7)).strftime("%Y-%m-%d")
    prochains_rdv = await db.rdv.find({
        "user_id": user["id"],
        "date": {"$gte": now.strftime("%Y-%m-%d"), "$lte": seven_days},
        "statut": {"$in": ["prevu", "confirme"]}
    }, {"_id": 0}).sort([("date", 1), ("heure", 1)]).to_list(10)
    
    # Devis en attente
    devis_attente_list = await db.devis.find({
        "user_id": user["id"],
        "statut": "en_attente"
    }, {"_id": 0}).sort("date", -1).to_list(10)
    
    # CA mensuel (6 derniers mois)
    monthly_series = []
    for i in range(5, -1, -1):
        month_date = now - timedelta(days=i * 30)
        month_str = month_date.strftime("%Y-%m")
        month_start = month_date.replace(day=1).isoformat()
        if i > 0:
            next_month = now - timedelta(days=(i - 1) * 30)
            month_end = next_month.replace(day=1).isoformat()
        else:
            month_end = now.isoformat()
        
        factures_month = await db.factures.find({
            "user_id": user["id"],
            "statut": "payee",
            "date_paiement": {"$gte": month_start, "$lt": month_end}
        }, {"_id": 0, "montant_ttc": 1}).to_list(1000)
        
        total = sum(f.get("montant_ttc", 0) for f in factures_month)
        monthly_series.append({
            "month": month_str,
            "total": round(total, 2)
        })
    
    return {
        "ca_mois": round(ca_mois, 2),
        "ca_total": round(ca_total, 2),
        "devis_count": devis_count,
        "devis_en_attente": devis_en_attente,
        "devis_30d": devis_30d,
        "rdv_count": rdv_count,
        "rdv_a_venir": rdv_a_venir,
        "clients_count": clients_count,
        "pipeline_stats": pipeline_stats,
        "prochains_rdv": prochains_rdv,
        "devis_attente": devis_attente_list,
        "monthly_series": monthly_series,
    }
