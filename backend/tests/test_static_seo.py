"""
Tests du SEO statique des sites artisans.
Couvre :
- generate_static_html : title (seo_title + fallback), meta, OG, Twitter, canonical,
  JSON-LD LocalBusiness, body crawlable, script de redirect anti-crawler.
- Endpoints HTTP : /api/static-snapshot/{slug}, /api/public/sitemap.xml.
"""
import json
import os
import re
import uuid

import pytest
import requests

import asyncio

from services.static_generator import generate_static_html

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    try:
        with open('/app/frontend/.env') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    BASE_URL = line.split('=', 1)[1].strip().rstrip('/')
                    break
    except Exception:
        pass

API = f"{BASE_URL}/api"
TIMEOUT = 60


def _sample_site(**overrides) -> dict:
    base = {
        "slug": "test-artisan-toulouse",
        "business_name": "Test & Rénovation",
        "business_type": "Rénovation",
        "services": ["Peinture", "Carrelage"],
        "city": "Toulouse",
        "phone": "+33 5 61 00 00 00",
        "email": "contact@test.fr",
        "style": "moderne",
        "hero_image_url": "/api/uploads/site-hero/abc/image.jpg",
        "content": {
            "tagline": "Artisan de confiance",
            "hero_title": "Rénovation de qualité à Toulouse",
            "hero_subtitle": "Devis gratuit, intervention rapide.",
            "hero_cta": "Demander un devis",
            "value_props": [{"title": "Devis", "description": "Gratuit", "icon": "clock"}],
            "services": [
                {"name": "Peinture", "description": "Peinture intérieure et extérieure."},
                {"name": "Carrelage", "description": "Pose de carrelage au sol."},
            ],
            "about_title": "Votre rénovateur à Toulouse",
            "about_text": "Nous rénovons vos espaces avec soin.",
            "why_us": ["Artisan local", "Devis clair"],
            "contact_intro": "Contactez-nous rapidement.",
            "seo_title": "Test & Rénovation — Rénovation à Toulouse",
            "seo_description": "Rénovation à Toulouse. Devis gratuit.",
            "seo_keywords": ["rénovation toulouse", "peinture", "carrelage"],
        },
    }
    return {**base, **overrides}


# ---------- Tests unitaires du générateur ----------
class TestStaticGenerator:
    def test_title_from_seo_title(self):
        html = asyncio.run(generate_static_html(_sample_site()))
        assert "<title>Test &amp; Rénovation — Rénovation à Toulouse</title>" in html

    def test_title_fallback(self):
        site = _sample_site()
        site["content"]["seo_title"] = None
        html = asyncio.run(generate_static_html(site))
        assert "<title>Test &amp; Rénovation — Rénovation à Toulouse | Hustart</title>" in html

    def test_meta_description_and_keywords(self):
        html = asyncio.run(generate_static_html(_sample_site()))
        assert 'name="description" content="Rénovation à Toulouse. Devis gratuit."' in html
        assert 'name="keywords" content="rénovation toulouse, peinture, carrelage"' in html

    def test_open_graph_and_twitter(self):
        html = asyncio.run(generate_static_html(_sample_site()))
        assert 'property="og:type" content="business.business"' in html
        assert 'property="og:url" content="https://hustart.fr/site/test-artisan-toulouse"' in html
        assert 'property="og:site_name" content="Hustart"' in html
        assert 'property="og:image" content="https://hustart.fr/api/uploads/site-hero/abc/image.jpg"' in html
        assert 'name="twitter:card" content="summary_large_image"' in html

    def test_open_graph_image_fallback_default(self):
        site = _sample_site(hero_image_url=None)
        html = asyncio.run(generate_static_html(site))
        assert 'property="og:image" content="https://hustart.fr/icons/icon-512.png"' in html

    def test_canonical(self):
        html = asyncio.run(generate_static_html(_sample_site()))
        assert '<link rel="canonical" href="https://hustart.fr/site/test-artisan-toulouse">' in html

    def test_json_ld_localbusiness(self):
        html = asyncio.run(generate_static_html(_sample_site()))
        m = re.search(r'<script type="application/ld\+json">\s*(\{.*?\})\s*</script>', html, re.S)
        assert m, "JSON-LD missing"
        data = json.loads(m.group(1))
        assert data["@type"] == "LocalBusiness"
        assert data["name"] == "Test & Rénovation"
        assert data["telephone"] == "+33 5 61 00 00 00"
        assert data["email"] == "contact@test.fr"
        assert data["address"] == {
            "@type": "PostalAddress",
            "addressLocality": "Toulouse",
            "addressCountry": "FR",
        }
        assert data["url"] == "https://hustart.fr/site/test-artisan-toulouse"
        assert data["image"] == "https://hustart.fr/api/uploads/site-hero/abc/image.jpg"

    def test_json_ld_escapes_script_close(self):
        site = _sample_site(business_name="Rénov <script>alert(1)</script>")
        html = asyncio.run(generate_static_html(site))
        # Le JSON-LD ne doit jamais contenir "</script>" brut (casserait le parseur)
        assert '</script>' not in html.split("<script type=\"application/ld+json\">")[1].split("</script>")[0]

    def test_body_crawlable_content(self):
        html = asyncio.run(generate_static_html(_sample_site()))
        assert "<h1>Rénovation de qualité à Toulouse</h1>" in html
        assert "<h2>Votre rénovateur à Toulouse</h2>" in html
        assert "<h2>Nos services</h2>" in html
        assert "<strong>Peinture</strong> — Peinture intérieure et extérieure." in html
        assert "<h2>Pourquoi nous choisir</h2>" in html
        assert "<li>Artisan local</li>" in html
        assert "<address>Tél : +33 5 61 00 00 00 — Toulouse</address>" in html
        assert 'href="https://hustart.fr/site/test-artisan-toulouse">Voir le site complet</a>' in html

    def test_redirect_script_protects_crawlers(self):
        html = asyncio.run(generate_static_html(_sample_site()))
        assert 'window.location.replace("/site/test-artisan-toulouse#__react")' in html
        assert "isCrawler" in html
        assert "googlebot" in html


# ---------- Tests HTTP (API réelle) ----------
def _rand_email(prefix="seo"):
    return f"TEST_{prefix}_{uuid.uuid4().hex[:8]}@artisanweb.fr"


@pytest.fixture(scope="module")
def seo_user():
    email = _rand_email()
    r = requests.post(f"{API}/auth/register", json={
        "email": email, "password": "testpass123", "full_name": "SEO Tester"
    }, timeout=30)
    assert r.status_code == 200, r.text
    return r.json()


@pytest.fixture(scope="module")
def seo_site(seo_user):
    headers = {"Authorization": f"Bearer {seo_user['access_token']}"}
    payload = {
        "business_name": "SEO Statique Test",
        "business_type": "Plomberie",
        "services": ["Dépannage", "Installation"],
        "city": "Bordeaux",
        "phone": "0600000000",
        "generate_image": False,
    }
    r = requests.post(f"{API}/sites/generate", json=payload, headers=headers, timeout=TIMEOUT)
    assert r.status_code == 200, r.text
    site = r.json()
    r2 = requests.post(f"{API}/sites/{site['id']}/publish", headers=headers, timeout=15)
    assert r2.status_code == 200, r2.text
    return site


class TestStaticSnapshotAPI:
    def test_snapshot_returns_html(self, seo_site):
        r = requests.get(f"{API}/static-snapshot/{seo_site['slug']}", timeout=15)
        assert r.status_code == 200
        assert "text/html" in r.headers.get("content-type", "")
        assert "<h1>" in r.text
        assert "application/ld+json" in r.text
        assert '<div id="root">' not in r.text

    def test_snapshot_unknown_slug_404(self):
        r = requests.get(f"{API}/static-snapshot/does-not-exist-{uuid.uuid4().hex[:6]}", timeout=15)
        assert r.status_code == 404


class TestSitemapAPI:
    def test_sitemap_xml(self, seo_site):
        r = requests.get(f"{API}/public/sitemap.xml", timeout=15)
        assert r.status_code == 200
        assert "application/xml" in r.headers.get("content-type", "")
        assert "<urlset" in r.text
        assert f"https://hustart.fr/site/{seo_site['slug']}" in r.text
