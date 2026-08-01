"""
Tests for new P0 artisan dashboard endpoints (iteration 2):
- GET /api/artisan/devis/{id}/pdf
- GET /api/artisan/factures/{id}/pdf
- POST /api/artisan/devis/{id}/send-email
- POST /api/artisan/devis/{id}/convert-to-facture

Notes:
- These tests do not test real Resend sending. They check that without
  RESEND_API_KEY configured, the endpoint returns {sent:false, reason}.
- PDF is verified by checking magic bytes and content-length.
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get(
    "REACT_APP_BACKEND_URL",
    "https://artisan-portal-14.preview.emergentagent.com",
).rstrip("/")


def _unique_email(prefix="user"):
    return f"TEST_{prefix}_{uuid.uuid4().hex[:10]}@example.com"


# ---------------------------------------------------------------------------
# Fixtures - register two distinct artisan accounts and seed minimal data
# ---------------------------------------------------------------------------

@pytest.fixture(scope="module")
def user_a():
    email = _unique_email("a")
    r = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "password": "Passw0rd!123", "full_name": "Artisan A"},
        timeout=20,
    )
    assert r.status_code == 200, f"register A failed: {r.status_code} {r.text}"
    data = r.json()
    return {
        "token": data["access_token"],
        "user": data["user"],
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
        "email": email,
    }


@pytest.fixture(scope="module")
def user_b():
    email = _unique_email("b")
    r = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "password": "Passw0rd!123", "full_name": "Artisan B"},
        timeout=20,
    )
    assert r.status_code == 200, f"register B failed: {r.status_code} {r.text}"
    data = r.json()
    return {
        "token": data["access_token"],
        "user": data["user"],
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
        "email": email,
    }


@pytest.fixture(scope="module")
def client_with_email(user_a):
    """Create a client (with email) for user A."""
    payload = {
        "nom": "Martin",
        "prenom": "Marie",
        "email": "marie.martin@example.com",
        "telephone": "0102030405",
        "ville": "Paris",
        "code_postal": "75001",
        "adresse": "12 rue de la Paix",
    }
    r = requests.post(
        f"{BASE_URL}/api/artisan/clients", json=payload, headers=user_a["headers"], timeout=20
    )
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def client_without_email(user_a):
    """Create a client without an email for user A."""
    payload = {"nom": "Bernard", "prenom": "Paul", "telephone": "0999999999"}
    r = requests.post(
        f"{BASE_URL}/api/artisan/clients", json=payload, headers=user_a["headers"], timeout=20
    )
    assert r.status_code == 200, r.text
    return r.json()


def _create_devis(headers, client_id, montant=500):
    items = [{"description": "Prestation test", "quantite": 1, "prix_unitaire": montant, "montant": montant}]
    r = requests.post(
        f"{BASE_URL}/api/artisan/devis",
        json={"client_id": client_id, "date": "2026-01-15", "items": items, "tva_pourcent": 20.0},
        headers=headers,
        timeout=20,
    )
    assert r.status_code == 200, r.text
    return r.json()


# ---------------------------------------------------------------------------
# PDF devis tests
# ---------------------------------------------------------------------------

class TestDevisPDF:
    def test_devis_pdf_valid(self, user_a, client_with_email):
        devis = _create_devis(user_a["headers"], client_with_email["id"], montant=2500)
        r = requests.get(
            f"{BASE_URL}/api/artisan/devis/{devis['id']}/pdf",
            headers=user_a["headers"],
            timeout=30,
        )
        assert r.status_code == 200, r.text
        ct = r.headers.get("content-type", "")
        assert "application/pdf" in ct, f"unexpected content-type: {ct}"
        assert r.content.startswith(b"%PDF-"), "PDF magic bytes missing"
        assert len(r.content) > 1024, f"PDF too small: {len(r.content)}"

    def test_devis_pdf_404_unknown_id(self, user_a):
        r = requests.get(
            f"{BASE_URL}/api/artisan/devis/no-such-devis/pdf",
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 404

    def test_devis_pdf_cross_user_404(self, user_a, user_b, client_with_email):
        devis = _create_devis(user_a["headers"], client_with_email["id"], montant=300)
        r = requests.get(
            f"{BASE_URL}/api/artisan/devis/{devis['id']}/pdf",
            headers=user_b["headers"],
            timeout=20,
        )
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Send-email tests (RESEND_API_KEY not set → sent:false)
# ---------------------------------------------------------------------------

class TestDevisSendEmail:
    def test_send_email_without_api_key_returns_sent_false(self, user_a, client_with_email):
        devis = _create_devis(user_a["headers"], client_with_email["id"], montant=100)
        r = requests.post(
            f"{BASE_URL}/api/artisan/devis/{devis['id']}/send-email",
            headers=user_a["headers"],
            timeout=30,
        )
        # If RESEND_API_KEY is unset in preview env, expect sent:false
        # If it's set we still accept 200 with sent:true
        assert r.status_code == 200, r.text
        d = r.json()
        assert "sent" in d
        assert "email" in d
        assert d["email"] == client_with_email["email"]
        if d["sent"] is False:
            assert "reason" in d and d["reason"]

    def test_send_email_client_without_email_returns_400(self, user_a, client_without_email):
        devis = _create_devis(user_a["headers"], client_without_email["id"], montant=120)
        r = requests.post(
            f"{BASE_URL}/api/artisan/devis/{devis['id']}/send-email",
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 400

    def test_send_email_404_unknown_devis(self, user_a):
        r = requests.post(
            f"{BASE_URL}/api/artisan/devis/no-such-devis/send-email",
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 404

    def test_send_email_cross_user_404(self, user_a, user_b, client_with_email):
        devis = _create_devis(user_a["headers"], client_with_email["id"], montant=80)
        r = requests.post(
            f"{BASE_URL}/api/artisan/devis/{devis['id']}/send-email",
            headers=user_b["headers"],
            timeout=20,
        )
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Convert devis → facture tests
# ---------------------------------------------------------------------------

class TestConvertDevisToFacture:
    def test_convert_creates_facture_and_updates_devis(self, user_a, client_with_email):
        devis = _create_devis(user_a["headers"], client_with_email["id"], montant=1000)
        # tva_pourcent=20 ⇒ HT=1000, TVA=200, TTC=1200
        assert devis["montant_ttc"] == 1200.0
        devis_id = devis["id"]

        r = requests.post(
            f"{BASE_URL}/api/artisan/devis/{devis_id}/convert-to-facture",
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 200, r.text
        fac = r.json()
        assert fac["devis_id"] == devis_id
        assert fac["client_id"] == client_with_email["id"]
        assert fac["statut"] == "impayee"
        assert fac["montant_ht"] == 1000.0
        assert fac["montant_tva"] == 200.0
        assert fac["montant_ttc"] == 1200.0
        assert fac["numero"].startswith("FAC-")
        parts = fac["numero"].split("-")
        assert len(parts) == 3 and parts[0] == "FAC" and parts[2].isdigit()
        # items copied
        assert len(fac["items"]) == len(devis["items"])

        # Verify facture is retrievable via GET
        gf = requests.get(
            f"{BASE_URL}/api/artisan/factures/{fac['id']}",
            headers=user_a["headers"],
            timeout=20,
        )
        assert gf.status_code == 200
        assert gf.json()["devis_id"] == devis_id

        # Devis should now be statut=accepte
        gd = requests.get(
            f"{BASE_URL}/api/artisan/devis/{devis_id}",
            headers=user_a["headers"],
            timeout=20,
        )
        assert gd.status_code == 200
        assert gd.json()["statut"] == "accepte"

        # Save for next test
        user_a["_converted_devis_id"] = devis_id
        user_a["_converted_facture_id"] = fac["id"]
        user_a["_converted_facture_numero"] = fac["numero"]

    def test_convert_twice_returns_409(self, user_a):
        devis_id = user_a.get("_converted_devis_id")
        assert devis_id, "previous test must run first"
        r = requests.post(
            f"{BASE_URL}/api/artisan/devis/{devis_id}/convert-to-facture",
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 409, f"expected 409, got {r.status_code} {r.text}"

    def test_convert_unknown_devis_404(self, user_a):
        r = requests.post(
            f"{BASE_URL}/api/artisan/devis/no-such-devis/convert-to-facture",
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 404

    def test_convert_cross_user_404(self, user_a, user_b, client_with_email):
        devis = _create_devis(user_a["headers"], client_with_email["id"], montant=250)
        r = requests.post(
            f"{BASE_URL}/api/artisan/devis/{devis['id']}/convert-to-facture",
            headers=user_b["headers"],
            timeout=20,
        )
        assert r.status_code == 404


# ---------------------------------------------------------------------------
# Facture PDF tests
# ---------------------------------------------------------------------------

class TestFacturePDF:
    def test_facture_pdf_valid(self, user_a):
        fac_id = user_a.get("_converted_facture_id")
        assert fac_id, "convert test must run first"
        r = requests.get(
            f"{BASE_URL}/api/artisan/factures/{fac_id}/pdf",
            headers=user_a["headers"],
            timeout=30,
        )
        assert r.status_code == 200, r.text
        ct = r.headers.get("content-type", "")
        assert "application/pdf" in ct, f"unexpected content-type: {ct}"
        assert r.content.startswith(b"%PDF-"), "PDF magic bytes missing"
        assert len(r.content) > 1024, f"PDF too small: {len(r.content)}"

    def test_facture_pdf_404_unknown_id(self, user_a):
        r = requests.get(
            f"{BASE_URL}/api/artisan/factures/no-such-facture/pdf",
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 404

    def test_facture_pdf_cross_user_404(self, user_a, user_b):
        fac_id = user_a.get("_converted_facture_id")
        assert fac_id
        r = requests.get(
            f"{BASE_URL}/api/artisan/factures/{fac_id}/pdf",
            headers=user_b["headers"],
            timeout=20,
        )
        assert r.status_code == 404
