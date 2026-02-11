"""add document_key to ruleset_entities

Revision ID: ecaf289e8614
Revises: 2072048c5919
Create Date: 2026-02-11 01:53:33.660887

"""
import json

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'ecaf289e8614'
down_revision = '2072048c5919'
branch_labels = None
depends_on = None

# Priority tiers for source ordering
_OFFICIAL_KEYS = ["srd-2024", "srd-2014", "bfrd"]


def _build_sources(connection):
    """Query distinct document metadata and build the sources array."""
    # Get one representative entity per document_key for metadata
    rows = connection.execute(sa.text(
        "SELECT document_key, COUNT(*) as cnt FROM ruleset_entities "
        "WHERE document_key IS NOT NULL GROUP BY document_key ORDER BY cnt DESC"
    )).fetchall()

    sources = []
    for doc_key, count in rows:
        # Get display info from one entity
        sample = connection.execute(sa.text(
            "SELECT entity_data FROM ruleset_entities "
            "WHERE document_key = :dk LIMIT 1"
        ), {"dk": doc_key}).fetchone()

        display_name = doc_key
        publisher = "Unknown"
        gamesystem = ""
        if sample:
            data = json.loads(sample[0])
            doc = data.get("document", {})
            display_name = doc.get("display_name") or doc.get("name") or doc_key
            pub = doc.get("publisher", {})
            publisher = pub.get("name", "Unknown") if isinstance(pub, dict) else str(pub)
            gs = doc.get("gamesystem", {})
            gamesystem = gs.get("key", "") if isinstance(gs, dict) else str(gs)

        # Assign priority: official first, then alphabetical
        if doc_key in _OFFICIAL_KEYS:
            priority = _OFFICIAL_KEYS.index(doc_key) + 1
        else:
            priority = 100  # placeholder, sorted alphabetically below

        sources.append({
            "key": doc_key,
            "display_name": display_name,
            "publisher": publisher,
            "gamesystem": gamesystem,
            "priority": priority,
            "is_default": doc_key == "srd-2024",
            "entity_count": count,
        })

    # Sort: official by priority, then 3rd party alphabetically
    official = sorted([s for s in sources if s["priority"] < 100], key=lambda s: s["priority"])
    third_party = sorted([s for s in sources if s["priority"] >= 100], key=lambda s: s["display_name"])
    # Re-number priorities sequentially
    all_sources = official + third_party
    for i, s in enumerate(all_sources):
        s["priority"] = i + 1

    return all_sources


def upgrade():
    # Add column and index
    with op.batch_alter_table('ruleset_entities', schema=None) as batch_op:
        batch_op.add_column(sa.Column('document_key', sa.String(length=100), nullable=True))
        batch_op.create_index(batch_op.f('ix_ruleset_entities_document_key'), ['document_key'], unique=False)

    # Backfill document_key from entity_data JSON
    connection = op.get_bind()
    connection.execute(sa.text(
        "UPDATE ruleset_entities SET document_key = json_extract(entity_data, '$.document.key') "
        "WHERE document_key IS NULL"
    ))

    # Build and store sources metadata on each ruleset
    rulesets = connection.execute(sa.text("SELECT id, source_config FROM rulesets")).fetchall()
    for rs_id, source_config_raw in rulesets:
        source_config = json.loads(source_config_raw) if source_config_raw else {}
        sources = _build_sources(connection)
        source_config["sources"] = sources
        connection.execute(sa.text(
            "UPDATE rulesets SET source_config = :sc WHERE id = :rid"
        ), {"sc": json.dumps(source_config), "rid": rs_id})


def downgrade():
    # Remove sources from source_config
    connection = op.get_bind()
    rulesets = connection.execute(sa.text("SELECT id, source_config FROM rulesets")).fetchall()
    for rs_id, source_config_raw in rulesets:
        source_config = json.loads(source_config_raw) if source_config_raw else {}
        source_config.pop("sources", None)
        connection.execute(sa.text(
            "UPDATE rulesets SET source_config = :sc WHERE id = :rid"
        ), {"sc": json.dumps(source_config), "rid": rs_id})

    with op.batch_alter_table('ruleset_entities', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_ruleset_entities_document_key'))
        batch_op.drop_column('document_key')
