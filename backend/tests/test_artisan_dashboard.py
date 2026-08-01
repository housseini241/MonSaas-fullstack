"""
Tests for Artisan Dashboard backend APIs:
- Auth (register/login)
- Clients CRUD + search
- Devis CRUD + numero auto-increment + HT/TVA/TTC computation
- Factures CRUD
- RDV CRUD + date filters
- Messages CRUD
- Analytics summary
- Multi-user data isolation
"""
import os
import time
import uuid
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://artisan-portal-14.preview.emergentagent.com").rstrip("/")


def _unique_email(prefix="user"):
    return f"TEST_{prefix}_{uuid.uuid4().hex[:10]}@example.com"


@pytest.fixture(scope="module")
def user_a():
    """Register first artisan and return {token, user, headers}."""
    email = _unique_email("a")
    payload = {"email": email, "password": "Passw0rd!123", "full_name": "Artisan A"}
    r = requests.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=20)
    assert r.status_code == 200, f"Register A failed: {r.status_code} {r.text}"
    data = r.json()
    return {
        "token": data["access_token"],
        "user": data["user"],
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
        "email": email,
        "password": "Passw0rd!123",
    }


@pytest.fixture(scope="module")
def user_b():
    """Register second artisan for isolation tests."""
    email = _unique_email("b")
    payload = {"email": email, "password": "Passw0rd!123", "full_name": "Artisan B"}
    r = requests.post(f"{BASE_URL}/api/auth/register", json=payload, timeout=20)
    assert r.status_code == 200, f"Register B failed: {r.status_code} {r.text}"
    data = r.json()
    return {
        "token": data["access_token"],
        "user": data["user"],
        "headers": {"Authorization": f"Bearer {data['access_token']}"},
        "email": email,
        "password": "Passw0rd!123",
    }


# ============================================================================
# AUTH
# ============================================================================

class TestAuth:
    def test_register_duplicate(self, user_a):
        r = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={"email": user_a["email"], "password": "Passw0rd!123", "full_name": "Dup"},
            timeout=20,
        )
        assert r.status_code == 400

    def test_login_success(self, user_a):
        r = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": user_a["email"], "password": user_a["password"]},
            timeout=20,
        )
        assert r.status_code == 200
        d = r.json()
        assert "access_token" in d and d["user"]["email"].lower() == user_a["email"].lower()

    def test_login_bad_password(self, user_a):
        r = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": user_a["email"], "password": "WRONG"},
            timeout=20,
        )
        assert r.status_code == 401

    def test_protected_requires_auth(self):
        r = requests.get(f"{BASE_URL}/api/artisan/clients", timeout=20)
        assert r.status_code in (401, 403)


# ============================================================================
# CLIENTS
# ============================================================================

class TestClients:
    def test_create_client(self, user_a):
        payload = {
            "nom": "Dupont",
            "prenom": "Jean",
            "email": "jean.dupont@example.com",
            "telephone": "0601020304",
            "ville": "Paris",
            "code_postal": "75001",
        }
        r = requests.post(f"{BASE_URL}/api/artisan/clients", json=payload, headers=user_a["headers"], timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["nom"] == "Dupont"
        assert d["prenom"] == "Jean"
        assert d["user_id"] == user_a["user"]["id"]
        assert "id" in d
        user_a["client_id"] = d["id"]

    def test_create_client_missing_nom(self, user_a):
        r = requests.post(f"{BASE_URL}/api/artisan/clients", json={"prenom": "X"}, headers=user_a["headers"], timeout=20)
        assert r.status_code == 422

    def test_list_clients(self, user_a):
        r = requests.get(f"{BASE_URL}/api/artisan/clients", headers=user_a["headers"], timeout=20)
        assert r.status_code == 200
        clients = r.json()
        assert isinstance(clients, list)
        assert any(c["id"] == user_a["client_id"] for c in clients)

    def test_search_clients(self, user_a):
        r = requests.get(f"{BASE_URL}/api/artisan/clients?search=Dupont", headers=user_a["headers"], timeout=20)
        assert r.status_code == 200
        clients = r.json()
        assert len(clients) >= 1
        assert all("dupont" in (c["nom"] + (c.get("prenom") or "")).lower() or
                   "dupont" in (c.get("email") or "").lower() for c in clients)

    def test_get_client_by_id(self, user_a):
        r = requests.get(f"{BASE_URL}/api/artisan/clients/{user_a['client_id']}", headers=user_a["headers"], timeout=20)
        assert r.status_code == 200
        assert r.json()["nom"] == "Dupont"

    def test_update_client(self, user_a):
        r = requests.put(
            f"{BASE_URL}/api/artisan/clients/{user_a['client_id']}",
            json={"ville": "Lyon"},
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 200
        assert r.json()["ville"] == "Lyon"
        # verify persistence
        g = requests.get(f"{BASE_URL}/api/artisan/clients/{user_a['client_id']}", headers=user_a["headers"], timeout=20)
        assert g.json()["ville"] == "Lyon"

    def test_get_nonexistent_client(self, user_a):
        r = requests.get(f"{BASE_URL}/api/artisan/clients/nonexistent-id", headers=user_a["headers"], timeout=20)
        assert r.status_code == 404


# ============================================================================
# DEVIS
# ============================================================================

class TestDevis:
    def test_create_devis_with_calc(self, user_a):
        # 2 items: 2500 + 360, TVA 20% => HT 2860, TVA 572, TTC 3432
        items = [
            {"description": "Pose carrelage", "quantite": 1, "prix_unitaire": 2500, "montant": 2500},
            {"description": "Joints", "quantite": 1, "prix_unitaire": 360, "montant": 360},
        ]
        payload = {
            "client_id": user_a["client_id"],
            "date": "2026-01-15",
            "items": items,
            "tva_pourcent": 20.0,
        }
        r = requests.post(f"{BASE_URL}/api/artisan/devis", json=payload, headers=user_a["headers"], timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["montant_ht"] == 2860.0
        assert d["montant_tva"] == 572.0
        assert d["montant_ttc"] == 3432.0
        assert d["statut"] == "en_attente"
        assert d["numero"].startswith("DEV-")
        assert d["client_nom"] == "Jean Dupont"
        user_a["devis_id"] = d["id"]
        user_a["devis_numero_1"] = d["numero"]

    def test_devis_numero_increment(self, user_a):
        items = [{"description": "Test", "quantite": 1, "prix_unitaire": 100, "montant": 100}]
        r = requests.post(
            f"{BASE_URL}/api/artisan/devis",
            json={"client_id": user_a["client_id"], "date": "2026-01-16", "items": items},
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 200, r.text
        new_num = r.json()["numero"]
        # Same year, must increment
        prev = user_a["devis_numero_1"]
        prev_parts = prev.split("-")
        new_parts = new_num.split("-")
        assert prev_parts[0] == new_parts[0] == "DEV"
        assert prev_parts[1] == new_parts[1]  # same year
        assert int(new_parts[2]) == int(prev_parts[2]) + 1

    def test_create_devis_invalid_client(self, user_a):
        items = [{"description": "Test", "quantite": 1, "prix_unitaire": 100, "montant": 100}]
        r = requests.post(
            f"{BASE_URL}/api/artisan/devis",
            json={"client_id": "no-such-id", "date": "2026-01-15", "items": items},
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 404

    def test_list_devis_filter_client(self, user_a):
        r = requests.get(
            f"{BASE_URL}/api/artisan/devis?client_id={user_a['client_id']}",
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 2
        assert all(d["client_id"] == user_a["client_id"] for d in items)

    def test_list_devis_filter_statut(self, user_a):
        r = requests.get(f"{BASE_URL}/api/artisan/devis?statut=en_attente", headers=user_a["headers"], timeout=20)
        assert r.status_code == 200
        assert all(d["statut"] == "en_attente" for d in r.json())

    def test_get_devis(self, user_a):
        r = requests.get(f"{BASE_URL}/api/artisan/devis/{user_a['devis_id']}", headers=user_a["headers"], timeout=20)
        assert r.status_code == 200
        assert r.json()["montant_ttc"] == 3432.0

    def test_update_devis_recalc(self, user_a):
        new_items = [{"description": "Pose carrelage", "quantite": 1, "prix_unitaire": 1000, "montant": 1000}]
        r = requests.put(
            f"{BASE_URL}/api/artisan/devis/{user_a['devis_id']}",
            json={"items": new_items, "tva_pourcent": 10.0},
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["montant_ht"] == 1000.0
        assert d["montant_tva"] == 100.0
        assert d["montant_ttc"] == 1100.0

    def test_update_devis_statut(self, user_a):
        r = requests.put(
            f"{BASE_URL}/api/artisan/devis/{user_a['devis_id']}",
            json={"statut": "accepte"},
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 200
        assert r.json()["statut"] == "accepte"


# ============================================================================
# FACTURES
# ============================================================================

class TestFactures:
    def test_create_facture(self, user_a):
        items = [{"description": "Service", "quantite": 2, "prix_unitaire": 500, "montant": 1000}]
        r = requests.post(
            f"{BASE_URL}/api/artisan/factures",
            json={"client_id": user_a["client_id"], "date": "2026-01-10", "items": items, "tva_pourcent": 20.0},
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["numero"].startswith("FAC-")
        assert d["statut"] == "impayee"
        assert d["montant_ttc"] == 1200.0
        user_a["facture_id"] = d["id"]

    def test_list_factures(self, user_a):
        r = requests.get(f"{BASE_URL}/api/artisan/factures", headers=user_a["headers"], timeout=20)
        assert r.status_code == 200
        assert any(f["id"] == user_a["facture_id"] for f in r.json())

    def test_update_facture_paid(self, user_a):
        r = requests.put(
            f"{BASE_URL}/api/artisan/factures/{user_a['facture_id']}",
            json={"statut": "payee", "date_paiement": "2026-01-20T10:00:00+00:00", "mode_paiement": "virement"},
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 200
        assert r.json()["statut"] == "payee"


# ============================================================================
# RDV
# ============================================================================

class TestRDV:
    def test_create_rdv(self, user_a):
        payload = {
            "client_id": user_a["client_id"],
            "titre": "Visite chantier",
            "date": "2026-02-15",
            "heure": "10:00",
            "duree_minutes": 60,
            "type_rdv": "devis_sur_place",
            "lieu": "Paris",
        }
        r = requests.post(f"{BASE_URL}/api/artisan/rdv", json=payload, headers=user_a["headers"], timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["titre"] == "Visite chantier"
        assert d["statut"] == "prevu"
        assert d["client_nom"] == "Jean Dupont"
        user_a["rdv_id"] = d["id"]

    def test_list_rdv_date_filters(self, user_a):
        r = requests.get(
            f"{BASE_URL}/api/artisan/rdv?date_debut=2026-02-01&date_fin=2026-02-28",
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 200
        items = r.json()
        assert any(x["id"] == user_a["rdv_id"] for x in items)

    def test_list_rdv_date_filter_exclude(self, user_a):
        r = requests.get(
            f"{BASE_URL}/api/artisan/rdv?date_debut=2026-03-01&date_fin=2026-03-31",
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 200
        assert all(x["id"] != user_a["rdv_id"] for x in r.json())

    def test_update_rdv(self, user_a):
        r = requests.put(
            f"{BASE_URL}/api/artisan/rdv/{user_a['rdv_id']}",
            json={"statut": "confirme"},
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 200
        assert r.json()["statut"] == "confirme"

    def test_delete_rdv(self, user_a):
        r = requests.delete(f"{BASE_URL}/api/artisan/rdv/{user_a['rdv_id']}", headers=user_a["headers"], timeout=20)
        assert r.status_code == 200
        # Recreate for analytics test
        payload = {
            "client_id": user_a["client_id"],
            "titre": "Visite chantier 2",
            "date": "2026-12-15",
            "heure": "10:00",
            "type_rdv": "intervention",
        }
        r2 = requests.post(f"{BASE_URL}/api/artisan/rdv", json=payload, headers=user_a["headers"], timeout=20)
        assert r2.status_code == 200


# ============================================================================
# MESSAGES
# ============================================================================

class TestMessages:
    def test_create_message(self, user_a):
        r = requests.post(
            f"{BASE_URL}/api/artisan/messages",
            json={"client_id": user_a["client_id"], "contenu": "Note interne", "type_message": "note"},
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["contenu"] == "Note interne"
        assert d["lu"] is False
        user_a["message_id"] = d["id"]

    def test_list_messages(self, user_a):
        r = requests.get(f"{BASE_URL}/api/artisan/messages", headers=user_a["headers"], timeout=20)
        assert r.status_code == 200
        assert any(m["id"] == user_a["message_id"] for m in r.json())

    def test_mark_message_read(self, user_a):
        r = requests.put(
            f"{BASE_URL}/api/artisan/messages/{user_a['message_id']}/mark-read",
            headers=user_a["headers"],
            timeout=20,
        )
        assert r.status_code == 200


# ============================================================================
# ANALYTICS
# ============================================================================

class TestAnalytics:
    def test_analytics_summary(self, user_a):
        r = requests.get(f"{BASE_URL}/api/artisan/analytics/summary", headers=user_a["headers"], timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        for key in ["ca_mois", "devis_count", "rdv_count", "clients_count",
                    "monthly_series", "prochains_rdv", "devis_attente"]:
            assert key in d, f"missing {key} in analytics response"
        assert d["clients_count"] >= 1
        assert d["devis_count"] >= 2
        assert d["rdv_count"] >= 1
        assert isinstance(d["monthly_series"], list)
        assert len(d["monthly_series"]) == 6


# ============================================================================
# MULTI-USER ISOLATION
# ============================================================================

class TestIsolation:
    def test_user_b_cannot_see_user_a_clients(self, user_a, user_b):
        r = requests.get(f"{BASE_URL}/api/artisan/clients", headers=user_b["headers"], timeout=20)
        assert r.status_code == 200
        ids = [c["id"] for c in r.json()]
        assert user_a["client_id"] not in ids

    def test_user_b_cannot_get_user_a_client(self, user_a, user_b):
        r = requests.get(
            f"{BASE_URL}/api/artisan/clients/{user_a['client_id']}",
            headers=user_b["headers"],
            timeout=20,
        )
        assert r.status_code == 404

    def test_user_b_cannot_update_user_a_client(self, user_a, user_b):
        r = requests.put(
            f"{BASE_URL}/api/artisan/clients/{user_a['client_id']}",
            json={"ville": "Hacked"},
            headers=user_b["headers"],
            timeout=20,
        )
        assert r.status_code == 404

    def test_user_b_cannot_delete_user_a_client(self, user_a, user_b):
        r = requests.delete(
            f"{BASE_URL}/api/artisan/clients/{user_a['client_id']}",
            headers=user_b["headers"],
            timeout=20,
        )
        assert r.status_code == 404

    def test_user_b_cannot_see_user_a_devis(self, user_a, user_b):
        r = requests.get(f"{BASE_URL}/api/artisan/devis", headers=user_b["headers"], timeout=20)
        assert r.status_code == 200
        assert all(d["id"] != user_a["devis_id"] for d in r.json())

    def test_user_b_cannot_get_user_a_devis(self, user_a, user_b):
        r = requests.get(
            f"{BASE_URL}/api/artisan/devis/{user_a['devis_id']}",
            headers=user_b["headers"],
            timeout=20,
        )
        assert r.status_code == 404

    def test_user_b_analytics_empty(self, user_b):
        r = requests.get(f"{BASE_URL}/api/artisan/analytics/summary", headers=user_b["headers"], timeout=20)
        assert r.status_code == 200
        d = r.json()
        assert d["clients_count"] == 0
        assert d["devis_count"] == 0
        assert d["rdv_count"] == 0


# ============================================================================
# CLEANUP (deletes for user A)
# ============================================================================

class TestCleanup:
    def test_delete_devis(self, user_a):
        # Cleanup: list and delete remaining devis for user A
        r = requests.get(f"{BASE_URL}/api/artisan/devis", headers=user_a["headers"], timeout=20)
        for d in r.json():
            requests.delete(f"{BASE_URL}/api/artisan/devis/{d['id']}", headers=user_a["headers"], timeout=20)
        # Verify the original devis is gone
        g = requests.get(f"{BASE_URL}/api/artisan/devis/{user_a['devis_id']}", headers=user_a["headers"], timeout=20)
        assert g.status_code == 404

    def test_delete_client(self, user_a):
        r = requests.delete(f"{BASE_URL}/api/artisan/clients/{user_a['client_id']}", headers=user_a["headers"], timeout=20)
        assert r.status_code == 200
        g = requests.get(f"{BASE_URL}/api/artisan/clients/{user_a['client_id']}", headers=user_a["headers"], timeout=20)
        assert g.status_code == 404
