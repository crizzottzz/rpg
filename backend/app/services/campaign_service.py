"""Campaign service — CRUD operations for user campaigns."""

import json

from app.extensions import db
from app.models.campaign import Campaign
from app.models.ruleset import Ruleset


def list_campaigns(user_id: str) -> list[dict]:
    """List all campaigns for a user.

    Args:
        user_id: UUID of the campaign owner.

    Returns:
        List of campaign dicts.
    """
    campaigns = Campaign.query.filter_by(user_id=user_id).all()
    return [c.to_dict() for c in campaigns]


def create_campaign(user_id: str, data: dict) -> dict:
    """Create a new campaign.

    Args:
        user_id: UUID of the campaign owner.
        data: Request body with name, ruleset_id, optional description and settings.

    Returns:
        Created campaign dict.

    Raises:
        ValueError: If required fields are missing.
        LookupError: If ruleset_id does not exist.
    """
    if not data.get("name") or not data.get("ruleset_id"):
        raise ValueError("name and ruleset_id are required")

    ruleset = Ruleset.query.get(data["ruleset_id"])
    if not ruleset:
        raise LookupError("Ruleset not found")

    settings = data.get("settings", {})
    if not isinstance(settings, dict):
        raise ValueError("settings must be an object")

    campaign = Campaign(
        user_id=user_id,
        ruleset_id=ruleset.id,
        name=data["name"],
        description=data.get("description", ""),
        settings=json.dumps(settings),
    )
    db.session.add(campaign)
    db.session.commit()
    return campaign.to_dict()


def get_campaign(campaign_id: str, user_id: str) -> dict | None:
    """Get a single campaign by ID, scoped to user.

    Args:
        campaign_id: UUID of the campaign.
        user_id: UUID of the requesting user.

    Returns:
        Campaign dict, or None if not found / not owned.
    """
    campaign = Campaign.query.filter_by(id=campaign_id, user_id=user_id).first()
    return campaign.to_dict() if campaign else None


def update_campaign(campaign_id: str, user_id: str, data: dict) -> dict | None:
    """Update a campaign's mutable fields.

    Args:
        campaign_id: UUID of the campaign.
        user_id: UUID of the requesting user.
        data: Dict of fields to update (name, description, status, settings).

    Returns:
        Updated campaign dict, or None if not found.
    """
    campaign = Campaign.query.filter_by(id=campaign_id, user_id=user_id).first()
    if not campaign:
        return None

    if "name" in data:
        campaign.name = data["name"]
    if "description" in data:
        campaign.description = data["description"]
    if "status" in data:
        campaign.status = data["status"]
    if "settings" in data:
        if not isinstance(data["settings"], dict):
            raise ValueError("settings must be an object")
        campaign.settings = json.dumps(data["settings"])

    db.session.commit()
    return campaign.to_dict()


def delete_campaign(campaign_id: str, user_id: str) -> bool:
    """Delete a campaign and cascade to characters.

    Args:
        campaign_id: UUID of the campaign.
        user_id: UUID of the requesting user.

    Returns:
        True if deleted, False if not found.
    """
    campaign = Campaign.query.filter_by(id=campaign_id, user_id=user_id).first()
    if not campaign:
        return False

    db.session.delete(campaign)
    db.session.commit()
    return True
