"""Overlay service — CRUD operations for user entity overlays."""

import json

from app.extensions import db
from app.models.overlay import UserOverlay
from app.models.ruleset import Ruleset


def list_overlays(
    user_id: str,
    ruleset_id: str | None = None,
    campaign_id: str | None = None,
    entity_type: str | None = None,
) -> list[dict]:
    """List overlays for a user with optional filters.

    Args:
        user_id: UUID of the overlay owner.
        ruleset_id: Optional filter by ruleset.
        campaign_id: Optional filter by campaign.
        entity_type: Optional filter by entity type.

    Returns:
        List of overlay dicts.
    """
    query = UserOverlay.query.filter_by(user_id=user_id)
    if ruleset_id:
        query = query.filter_by(ruleset_id=ruleset_id)
    if campaign_id:
        query = query.filter_by(campaign_id=campaign_id)
    if entity_type:
        query = query.filter_by(entity_type=entity_type)

    overlays = query.all()
    return [o.to_dict() for o in overlays]


def create_overlay(user_id: str, data: dict) -> dict:
    """Create a new entity overlay.

    Args:
        user_id: UUID of the overlay owner.
        data: Request body with ruleset_id, entity_type, source_key,
              overlay_type, overlay_data, and optional campaign_id.

    Returns:
        Created overlay dict.

    Raises:
        ValueError: If required fields are missing.
        LookupError: If ruleset_id does not exist.
    """
    required = ["ruleset_id", "entity_type", "source_key", "overlay_type", "overlay_data"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        raise ValueError(f"{', '.join(missing)} required")

    ruleset = Ruleset.query.get(data["ruleset_id"])
    if not ruleset:
        raise LookupError("Ruleset not found")

    overlay = UserOverlay(
        user_id=user_id,
        ruleset_id=ruleset.id,
        entity_type=data["entity_type"],
        source_key=data["source_key"],
        overlay_type=data["overlay_type"],
        overlay_data=json.dumps(data["overlay_data"]),
        campaign_id=data.get("campaign_id"),
    )
    db.session.add(overlay)
    db.session.commit()
    return overlay.to_dict()


def update_overlay(overlay_id: str, user_id: str, data: dict) -> dict | None:
    """Update an overlay's data or type.

    Args:
        overlay_id: UUID of the overlay.
        user_id: UUID of the requesting user.
        data: Dict with optional overlay_data and/or overlay_type.

    Returns:
        Updated overlay dict, or None if not found.
    """
    overlay = UserOverlay.query.filter_by(id=overlay_id, user_id=user_id).first()
    if not overlay:
        return None

    if "overlay_data" in data:
        overlay.overlay_data = json.dumps(data["overlay_data"])
    if "overlay_type" in data:
        overlay.overlay_type = data["overlay_type"]

    db.session.commit()
    return overlay.to_dict()


def delete_overlay(overlay_id: str, user_id: str) -> bool:
    """Delete an overlay.

    Args:
        overlay_id: UUID of the overlay.
        user_id: UUID of the requesting user.

    Returns:
        True if deleted, False if not found.
    """
    overlay = UserOverlay.query.filter_by(id=overlay_id, user_id=user_id).first()
    if not overlay:
        return False

    db.session.delete(overlay)
    db.session.commit()
    return True
