"""Migration one-shot : génère les snapshots HTML statiques de TOUS les sites existants.

Usage (dans le conteneur backend, UNE SEULE FOIS après déploiement) :
    docker compose exec backend python scripts/migrate_static_sites.py

Ce script n'est PAS appelé au démarrage du backend.
"""
import asyncio
import os
import sys

import aiofiles
from motor.motor_asyncio import AsyncIOMotorClient

# /app est le WORKDIR du conteneur backend : services.static_generator est importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.static_generator import generate_static_html  # noqa: E402

MONGO_URL = os.environ.get("MONGO_URL", "mongodb://localhost:27017/artisanweb")
DB_NAME = os.environ.get("DB_NAME", "artisanweb")
STATIC_SITES_DIR = os.environ.get("STATIC_SITES_DIR", "/app/static_sites")


async def _save_snapshot(site: dict) -> str:
    html = await generate_static_html(site)
    path = os.path.join(STATIC_SITES_DIR, f"{site['slug']}.html")
    async with aiofiles.open(path, "w", encoding="utf-8") as f:
        await f.write(html)
    return path


async def migrate() -> None:
    os.makedirs(STATIC_SITES_DIR, exist_ok=True)
    client = AsyncIOMotorClient(MONGO_URL)
    db = client[DB_NAME]

    cursor = db.sites.find({})
    total = await db.sites.count_documents({})
    if total == 0:
        print("Aucun site en base — rien à migrer.")
        client.close()
        return

    ok = 0
    errors: list[str] = []
    i = 0
    async for site in cursor:
        i += 1
        slug = site.get("slug", "?")
        try:
            await _save_snapshot(site)
            ok += 1
            print(f"Généré : {slug} ({i}/{total})")
        except Exception as e:
            errors.append(f"{slug}: {e}")
            print(f"Erreur   : {slug} ({i}/{total}) — {e}")

    client.close()

    print("\n" + "=" * 50)
    print(f"Terminé — succès : {ok}/{total}")
    if errors:
        print(f"Erreurs  : {len(errors)}")
        for err in errors:
            print(f"  - {err}")
    else:
        print("Aucune erreur.")
    print("=" * 50)
    if errors:
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(migrate())
