"""
Tests for Client Pipeline Status feature:
- POST /api/artisan/clients default statut_pipeline = "nouveau"
- POST /api/artisan/clients with custom statut_pipeline
- PUT /api/artisan/clients/{id}/pipeline-status (valid/invalid/404/cross-user)
- GET /api/artisan/clients?statut_pipeline= filter
- GET /api/artisan/analytics/summary -> pipeline_stats
- Legacy clients (no statut_pipeline) counted as "nouveau"
"""
import os
import uuid
import pytest
import requests
from pymongo import MongoClient

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017")
DB_NAME = os.environ.get("DB_NAME", "test_database")


def _email(prefix="pipe"):
    return f"TEST_{prefix}_{uuid.uuid4().hex[:10]}@example.com"


def _register(prefix):
    email = _email(prefix)
    r = requests.post(
        f"{BASE_URL}/api/auth/register",
        json={"email": email, "password": "Passw0rd!123", "full_name": f"User {prefix}"},
        timeout=20,
    )
    assert r.status_code == 200, r.text
    d = r.json()
    return {
        "email": email,
        "user": d["user"],
        "headers": {"Authorization": f"Bearer {d['access_token']}"},
    }


@pytest.fixture(scope="module")
def user_a():
    return _register("a")


@pytest.fixture(scope="module")
def user_b():
    return _register("b")


# ============================================================================
# CREATE CLIENT default + custom statut_pipeline
# ============================================================================

class TestCreateClientPipeline:
    def test_default_statut_pipeline_nouveau(self, user_a):
        r = requests.post(
            f"{BASE_URL}/api/artisan/clients",
            json={"nom": "DefaultPipe", "prenom": "X"},
            headers=user_a["headers"], timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["statut_pipeline"] == "nouveau"
        assert d.get("pipeline_updated_at")
        user_a["client_default"] = d["id"]

    def test_create_with_statut_appeler(self, user_a):
        r = requests.post(
            f"{BASE_URL}/api/artisan/clients",
            json={"nom": "Appeler", "statut_pipeline": "appeler"},
            headers=user_a["headers"], timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["statut_pipeline"] == "appeler"
        user_a["client_appeler"] = d["id"]

    def test_create_with_statut_a_rappeler(self, user_a):
        r = requests.post(
            f"{BASE_URL}/api/artisan/clients",
            json={"nom": "Rappel", "statut_pipeline": "a_rappeler"},
            headers=user_a["headers"], timeout=20,
        )
        assert r.status_code == 200, r.text
        assert r.json()["statut_pipeline"] == "a_rappeler"
        user_a["client_arappeler"] = r.json()["id"]

    def test_create_with_statut_signe(self, user_a):
        r = requests.post(
            f"{BASE_URL}/api/artisan/clients",
            json={"nom": "Signe", "statut_pipeline": "signe"},
            headers=user_a["headers"], timeout=20,
        )
        assert r.status_code == 200, r.text
        assert r.json()["statut_pipeline"] == "signe"
        user_a["client_signe"] = r.json()["id"]


# ============================================================================
# PUT /clients/{id}/pipeline-status
# ============================================================================

class TestPipelineStatusUpdate:
    def test_update_to_appeler(self, user_a):
        cid = user_a["client_default"]
        r = requests.put(
            f"{BASE_URL}/api/artisan/clients/{cid}/pipeline-status",
            json={"statut_pipeline": "appeler"},
            headers=user_a["headers"], timeout=20,
        )
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["statut_pipeline"] == "appeler"
        assert d["id"] == cid
        assert d.get("pipeline_updated_at")

        # Verify persistence
        g = requests.get(f"{BASE_URL}/api/artisan/clients/{cid}", headers=user_a["headers"], timeout=20)
        assert g.status_code == 200
        assert g.json()["statut_pipeline"] == "appeler"

    @pytest.mark.parametrize("statut", ["nouveau", "appeler", "a_rappeler", "signe"])
    def test_all_valid_statuts(self, user_a, statut):
        cid = user_a["client_default"]
        r = requests.put(
            f"{BASE_URL}/api/artisan/clients/{cid}/pipeline-status",
            json={"statut_pipeline": statut},
            headers=user_a["headers"], timeout=20,
        )
        assert r.status_code == 200, r.text
        assert r.json()["statut_pipeline"] == statut

    @pytest.mark.parametrize("invalid", ["invalide", "foo", "SIGNE", "", "nouveau "])
    def test_invalid_statut_returns_422(self, user_a, invalid):
        cid = user_a["client_default"]
        r = requests.put(
            f"{BASE_URL}/api/artisan/clients/{cid}/pipeline-status",
            json={"statut_pipeline": invalid},
            headers=user_a["headers"], timeout=20,
        )
        assert r.status_code == 422, f"Expected 422 for '{invalid}', got {r.status_code}: {r.text}"

    def test_update_nonexistent_client_returns_404(self, user_a):
        r = requests.put(
            f"{BASE_URL}/api/artisan/clients/nonexistent-uuid/pipeline-status",
            json={"statut_pipeline": "signe"},
            headers=user_a["headers"], timeout=20,
        )
        assert r.status_code == 404

    def test_cross_user_returns_404(self, user_a, user_b):
        # user_b tries to update user_a's client
        cid = user_a["client_default"]
        r = requests.put(
            f"{BASE_URL}/api/artisan/clients/{cid}/pipeline-status",
            json={"statut_pipeline": "signe"},
            headers=user_b["headers"], timeout=20,
        )
        assert r.status_code == 404

    def test_unauthenticated_returns_401(self, user_a):
        cid = user_a["client_default"]
        r = requests.put(
            f"{BASE_URL}/api/artisan/clients/{cid}/pipeline-status",
            json={"statut_pipeline": "signe"},
            timeout=20,
        )
        assert r.status_code in (401, 403)


# ============================================================================
# GET /clients?statut_pipeline= filter
# ============================================================================

class TestListClientsFilter:
    def test_filter_by_appeler(self, user_a):
        r = requests.get(
            f"{BASE_URL}/api/artisan/clients?statut_pipeline=appeler",
            headers=user_a["headers"], timeout=20,
        )
        assert r.status_code == 200
        clients = r.json()
        assert len(clients) >= 1
        assert all(c["statut_pipeline"] == "appeler" for c in clients)
        ids = [c["id"] for c in clients]
        assert user_a["client_appeler"] in ids

    def test_filter_by_signe(self, user_a):
        r = requests.get(
            f"{BASE_URL}/api/artisan/clients?statut_pipeline=signe",
            headers=user_a["headers"], timeout=20,
        )
        assert r.status_code == 200
        clients = r.json()
        assert all(c["statut_pipeline"] == "signe" for c in clients)
        ids = [c["id"] for c in clients]
        assert user_a["client_signe"] in ids

    def test_filter_by_a_rappeler(self, user_a):
        r = requests.get(
            f"{BASE_URL}/api/artisan/clients?statut_pipeline=a_rappeler",
            headers=user_a["headers"], timeout=20,
        )
        assert r.status_code == 200
        ids = [c["id"] for c in r.json()]
        assert user_a["client_arappeler"] in ids


# ============================================================================
# Analytics pipeline_stats + legacy
# ============================================================================

class TestAnalyticsPipelineStats:
    def test_pipeline_stats_keys_and_values(self, user_a):
        r = requests.get(f"{BASE_URL}/api/artisan/analytics/summary", headers=user_a["headers"], timeout=20)
        assert r.status_code == 200, r.text
        d = r.json()
        assert "pipeline_stats" in d
        ps = d["pipeline_stats"]
        for key in ["nouveau", "appeler", "a_rappeler", "signe"]:
            assert key in ps, f"Missing key {key} in pipeline_stats"
            assert isinstance(ps[key], int)
        # user_a has at least: 1 appeler, 1 a_rappeler, 1 signe (client_default ended up as signe after parametrize test)
        # Last parametrize value was 'signe' so client_default is now 'signe'
        assert ps["appeler"] >= 1
        assert ps["a_rappeler"] >= 1
        assert ps["signe"] >= 1

    def test_legacy_client_counted_as_nouveau(self, user_a):
        """Insert a legacy client directly via Mongo (no statut_pipeline), verify counted as 'nouveau'."""
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        legacy_id = str(uuid.uuid4())
        db.clients.insert_one({
            "id": legacy_id,
            "user_id": user_a["user"]["id"],
            "nom": "LegacyClient",
            "created_at": "2025-01-01T00:00:00+00:00",
            "updated_at": "2025-01-01T00:00:00+00:00",
            # No statut_pipeline field
        })
        try:
            # Before-after compare
            r1 = requests.get(f"{BASE_URL}/api/artisan/analytics/summary", headers=user_a["headers"], timeout=20)
            ps = r1.json()["pipeline_stats"]
            assert ps["nouveau"] >= 1, f"Legacy client should be counted as 'nouveau' but got {ps['nouveau']}"

            # Also: GET clients should return that client with statut_pipeline=nouveau (default fallback)
            r2 = requests.get(f"{BASE_URL}/api/artisan/clients", headers=user_a["headers"], timeout=20)
            assert r2.status_code == 200
            found = [c for c in r2.json() if c["id"] == legacy_id]
            assert len(found) == 1
            assert found[0]["statut_pipeline"] == "nouveau"
        finally:
            db.clients.delete_one({"id": legacy_id})
            client.close()


# ============================================================================
# CLEANUP
# ============================================================================

class TestCleanup:
    def test_delete_all(self, user_a):
        r = requests.get(f"{BASE_URL}/api/artisan/clients", headers=user_a["headers"], timeout=20)
        for c in r.json():
            requests.delete(f"{BASE_URL}/api/artisan/clients/{c['id']}", headers=user_a["headers"], timeout=20)
