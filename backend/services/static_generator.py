"""Génération des snapshots HTML statiques pour le SEO des sites artisans.

Ce module produit une page HTML complète (meta SEO, Open Graph, JSON-LD,
contenu crawlable) servie UNIQUEMENT aux crawlers par nginx. Les visiteurs
humains continuent de recevoir l'application React via index.html.

Le module ne sauvegarde rien sur disque : ``generate_static_html`` retourne
une chaîne HTML. La sauvegarde est gérée par server.py / le script de migration.
"""
import html
import json
from typing import Optional

BASE_URL = "https://hustart.fr"
DEFAULT_OG_IMAGE = f"{BASE_URL}/icons/icon-512.png"

# Même liste que le bloc nginx — évite une boucle de redirection si un
# crawler exécute le JS du snapshot.
_CRAWLER_UA_RE = (
    r"(googlebot|bingbot|slurp|duckduckbot|facebookexternalhit|twitterbot|"
    r"whatsapp|linkedinbot|pinterest|applebot|yandex|baiduspider|ia_archiver)"
)


def _content(site: dict) -> dict:
    return site.get("content") or {}


def _seo_title(site: dict) -> str:
    raw = (_content(site).get("seo_title") or "").strip()
    if raw:
        return raw
    return (
        f"{site.get('business_name', '')} — {site.get('business_type', '')} "
        f"à {site.get('city', '')} | Hustart"
    )


def _resolve_public_url(url: Optional[str]) -> Optional[str]:
    """Transforme une URL relative (/api/...) en URL absolue pour les crawlers."""
    if not url:
        return None
    if url.startswith("http://") or url.startswith("https://"):
        return url
    if url.startswith("/"):
        return f"{BASE_URL}{url}"
    return None  # data: URLs inexploitables par les scrapers — image par défaut


def _json_ld(site: dict) -> str:
    content = _content(site)
    url = f"{BASE_URL}/site/{site.get('slug', '')}"
    image = _resolve_public_url(site.get("hero_image_url"))
    data = {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        "name": site.get("business_name", ""),
        "description": content.get("seo_description") or "",
        "telephone": site.get("phone", ""),
        "address": {
            "@type": "PostalAddress",
            "addressLocality": site.get("city", ""),
            "addressCountry": "FR",
        },
        "url": url,
    }
    if site.get("email"):
        data["email"] = site["email"]
    if image:
        data["image"] = image
    # "<" échappé pour ne jamais casser la balise </script>
    return json.dumps(data, ensure_ascii=False).replace("<", "\\u003c")


def _services_html(site: dict) -> str:
    services = _content(site).get("services") or []
    if not services:
        services = [{"name": s, "description": ""} for s in (site.get("services") or [])]
    items = []
    for service in services:
        if isinstance(service, dict):
            name = html.escape(str(service.get("name", "")))
            description = html.escape(str(service.get("description", "")))
            items.append(f"<li><strong>{name}</strong> — {description}</li>")
        else:
            items.append(f"<li>{html.escape(str(service))}</li>")
    return "\n".join(items)


def _why_us_html(site: dict) -> str:
    why_us = _content(site).get("why_us") or []
    return "\n".join(f"<li>{html.escape(str(item))}</li>" for item in why_us)


async def generate_static_html(site: dict) -> str:
    """Génère et retourne le HTML statique complet d'un site artisan."""
    content = _content(site)
    slug = site.get("slug", "")
    canonical = f"{BASE_URL}/site/{slug}"
    title = html.escape(_seo_title(site), quote=True)
    description = html.escape(content.get("seo_description") or "", quote=True)
    keywords = html.escape(
        ", ".join(str(keyword) for keyword in (content.get("seo_keywords") or [])),
        quote=True,
    )
    og_image = html.escape(
        _resolve_public_url(site.get("hero_image_url")) or DEFAULT_OG_IMAGE,
        quote=True,
    )

    hero_title = html.escape(str(content.get("hero_title") or site.get("business_name", "")))
    hero_subtitle = html.escape(str(content.get("hero_subtitle") or ""))
    about_title = html.escape(str(content.get("about_title") or "À propos"))
    about_text = html.escape(str(content.get("about_text") or ""))
    contact_intro = html.escape(str(content.get("contact_intro") or ""))
    phone = html.escape(str(site.get("phone", "")))
    city = html.escape(str(site.get("city", "")))
    site_url = html.escape(canonical, quote=True)

    redirect_target = json.dumps(
        f"/site/{slug}#__react", ensure_ascii=False
    ).replace("<", "\\u003c")

    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>{title}</title>
  <meta name="description" content="{description}">
  <meta name="keywords" content="{keywords}">
  <link rel="canonical" href="{site_url}">
  <meta property="og:type" content="business.business">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{description}">
  <meta property="og:url" content="{site_url}">
  <meta property="og:site_name" content="Hustart">
  <meta property="og:image" content="{og_image}">
  <meta property="og:locale" content="fr_FR">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{title}">
  <meta name="twitter:description" content="{description}">
  <meta name="twitter:image" content="{og_image}">
  <script type="application/ld+json">
{_json_ld(site)}
  </script>
</head>
<body>
  <main>
    <h1>{hero_title}</h1>
    <p>{hero_subtitle}</p>
    <h2>{about_title}</h2>
    <p>{about_text}</p>
    <h2>Nos services</h2>
    <ul>
{_services_html(site)}
    </ul>
    <h2>Pourquoi nous choisir</h2>
    <ul>
{_why_us_html(site)}
    </ul>
    <p>{contact_intro}</p>
    <address>Tél : {phone} — {city}</address>
    <a href="{site_url}">Voir le site complet</a>
  </main>
  <script>
(function () {{
  var ua = (navigator.userAgent || '').toLowerCase();
  var isCrawler = /{_CRAWLER_UA_RE}/.test(ua);
  if (window.location.hash !== '#__react' && !isCrawler) {{
    window.location.replace({redirect_target});
  }}
}})();
  </script>
</body>
</html>
"""
