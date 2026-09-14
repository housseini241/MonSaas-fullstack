"""
Template system tests (Phase A + Phase B).

Covers the guarantees the template system must never break:
  - template_id is persisted at creation and returned by both the private and
    the public site endpoints;
  - an unknown/missing template_id falls back to "essential" (backward
    compatibility for sites created before the feature);
  - switching template never loses `theme` or `section_order`;
  - an invalid template_id is rejected by the API.

Requires the backend to be running and REACT_APP_BACKEND_URL to point at it
(same convention as test_theme_sections.py).
"""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
API = f"{BASE_URL}/api"


def _register():
    email = f"TEST_tpl_{uuid.uuid4().hex[:8]}@example.com"
    r = requests.post(
        f"{API}/auth/register",
        json={"email": email, "password": "pass1234", "full_name": "Template Tester"},
        timeout=30,
    )
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def _generate(headers, template_id=None, name="TEST Template Site"):
    body = {
        "business_name": name,
        "business_type": "Maçonnerie",
        "services": ["Construction mur", "Dallage"],
        "city": "Lyon",
        "phone": "0600000000",
        "email": "tpl@test.fr",
        "description": "Artisan maçon",
        "style": "moderne",
        "generate_image": False,
    }
    if template_id is not None:
        body["template_id"] = template_id
    r = requests.post(f"{API}/sites/generate", headers=headers, json=body, timeout=180)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def auth_headers():
    return _register()


@pytest.fixture(scope="module")
def site(auth_headers):
    return _generate(auth_headers, template_id="atelier", name="TEST Atelier Tpl")


class TestTemplatePersistence:
    def test_created_with_requested_template(self, site):
        assert site["template_id"] == "atelier"

    def test_private_get_returns_template_id(self, auth_headers, site):
        r = requests.get(f"{API}/sites/{site['id']}", headers=auth_headers, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["template_id"] == "atelier"

    def test_public_get_returns_template_id(self, site):
        r = requests.get(f"{API}/public/sites/{site['slug']}", timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["template_id"] == "atelier"
        # user_id must never leak on the public endpoint
        assert "user_id" not in data

    def test_switch_template_keeps_theme_and_section_order(self, auth_headers, site):
        headers = auth_headers
        site_id = site["id"]
        theme = {
            "primary_color": "#1E3A8A",
            "accent_color": "#F59E0B",
            "font_heading": "Playfair Display",
            "font_body": "Inter",
        }
        section_order = ["hero", "services", "value_props", "about", "contact"]

        r = requests.put(
            f"{API}/sites/{site_id}",
            headers=headers,
            json={"theme": theme, "section_order": section_order},
            timeout=30,
        )
        assert r.status_code == 200, r.text

        # atelier -> batisseur -> confiance -> projet -> essential
        for target in ["batisseur", "confiance", "projet", "essential"]:
            r = requests.put(f"{API}/sites/{site_id}", headers=headers, json={"template_id": target}, timeout=30)
            assert r.status_code == 200, r.text
            data = r.json()
            assert data["template_id"] == target
            assert data.get("theme") == theme, f"theme lost when switching to {target}"
            assert data.get("section_order") == section_order, f"section_order lost when switching to {target}"

    def test_put_without_template_id_does_not_wipe_it(self, auth_headers, site):
        headers = auth_headers
        site_id = site["id"]
        r = requests.put(f"{API}/sites/{site_id}", headers=headers, json={"business_name": "TEST Renamed Tpl"}, timeout=30)
        assert r.status_code == 200, r.text
        assert r.json()["template_id"] == "essential"  # set by the previous test

    def test_invalid_template_id_is_rejected(self, auth_headers, site):
        r = requests.put(
            f"{API}/sites/{site['id']}",
            headers=auth_headers,
            json={"template_id": "not-a-real-template"},
            timeout=30,
        )
        assert r.status_code == 400

    def test_cleanup(self, auth_headers, site):
        r = requests.delete(f"{API}/sites/{site['id']}", headers=auth_headers, timeout=30)
        assert r.status_code == 200


class TestUnknownTemplateFallsBack:
    def test_unknown_template_id_normalizes_to_essential(self):
        headers = _register()
        site = _generate(headers, template_id="does-not-exist", name="TEST Fallback Tpl")
        try:
            assert site["template_id"] == "essential"
        finally:
            requests.delete(f"{API}/sites/{site['id']}", headers=headers, timeout=30)

    def test_missing_template_id_defaults_to_essential(self):
        headers = _register()
        site = _generate(headers, template_id=None, name="TEST Default Tpl")
        try:
            assert site["template_id"] == "essential"
        finally:
            requests.delete(f"{API}/sites/{site['id']}", headers=headers, timeout=30)
