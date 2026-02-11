import json
import click
import requests

from app.extensions import db
from app.models.ruleset import Ruleset, RulesetEntity

OPEN5E_BASE = "https://api.open5e.com/v2"

ENTITY_CONFIGS = [
    {"type": "spell", "endpoint": "/spells", "name_field": "name"},
    {"type": "creature", "endpoint": "/creatures", "name_field": "name"},
    {"type": "class", "endpoint": "/classes", "name_field": "name"},
    {"type": "species", "endpoint": "/species", "name_field": "name"},
    {"type": "item", "endpoint": "/items", "name_field": "name"},
    {"type": "feat", "endpoint": "/feats", "name_field": "name"},
    {"type": "condition", "endpoint": "/conditions", "name_field": "name"},
    {"type": "background", "endpoint": "/backgrounds", "name_field": "name"},
]


def fetch_all_pages(endpoint: str, limit: int = 100) -> list[dict]:
    """Fetch all pages from an Open5e v2 endpoint.

    Args:
        endpoint: API path relative to base URL (e.g. '/spells').
        limit: Number of results per page.

    Returns:
        Aggregated list of result dictionaries from all pages.
    """
    results: list[dict] = []
    url: str | None = f"{OPEN5E_BASE}{endpoint}?format=json&limit={limit}"

    while url:
        click.echo(f"  Fetching: {url}")
        try:
            resp = requests.get(url, timeout=30)
            resp.raise_for_status()
            data = resp.json()
        except requests.RequestException as e:
            click.echo(f"  Error fetching {url}: {e}")
            break

        page_results = data.get("results", [])
        results.extend(page_results)
        url = data.get("next")

    return results


def seed_open5e() -> None:
    """Seed D&D 5e SRD data from Open5e v2 API."""
    click.echo("Seeding D&D 5e data from Open5e v2 API...")

    ruleset = Ruleset.query.filter_by(key="dnd-5e-srd").first()
    if not ruleset:
        ruleset = Ruleset(
            key="dnd-5e-srd",
            name="D&D 5e SRD",
            source_type="open5e",
            source_config=json.dumps({"base_url": OPEN5E_BASE}),
            entity_types=json.dumps([c["type"] for c in ENTITY_CONFIGS]),
        )
        db.session.add(ruleset)
        db.session.commit()
        click.echo(f"Created ruleset: {ruleset.name}")
    else:
        click.echo(f"Ruleset '{ruleset.name}' already exists, updating entities...")

    total = 0
    for config in ENTITY_CONFIGS:
        entity_type = config["type"]
        click.echo(f"\nFetching {entity_type}s...")
        items = fetch_all_pages(config["endpoint"])
        click.echo(f"  Got {len(items)} {entity_type}s")

        for item in items:
            name = item.get(config["name_field"], "Unknown")
            source_key = item.get("key") or item.get("url", name)

            existing = RulesetEntity.query.filter_by(
                ruleset_id=ruleset.id,
                entity_type=entity_type,
                source_key=str(source_key),
            ).first()

            if existing:
                existing.name = name
                existing.entity_data = json.dumps(item)
            else:
                entity = RulesetEntity(
                    ruleset_id=ruleset.id,
                    entity_type=entity_type,
                    source_key=str(source_key),
                    name=name,
                    entity_data=json.dumps(item),
                )
                db.session.add(entity)

            total += 1

        db.session.commit()

    click.echo(f"\nDone! Seeded {total} entities total.")
