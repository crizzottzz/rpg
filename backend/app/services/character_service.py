"""Character service — CRUD operations for campaign characters."""

import json
from typing import Any

from app.extensions import db
from app.models.character import Character
from app.models.campaign import Campaign

_JSON_FIELD_TYPES: dict[str, type] = {
    "core_data": dict,
    "class_data": dict,
    "equipment": list,
    "spells": list,
}


def _validate_json_fields(data: dict[str, Any]) -> None:
    """Validate that JSON blob fields have the correct container type.

    Raises:
        ValueError: If a field has the wrong type.
    """
    for field, expected in _JSON_FIELD_TYPES.items():
        if field in data and not isinstance(data[field], expected):
            raise ValueError(f"{field} must be a {expected.__name__}")


def list_all_characters(user_id: str) -> list[dict]:
    """List all characters for a user across all campaigns.

    Includes campaign_name in each character dict via join.

    Args:
        user_id: UUID of the character owner.

    Returns:
        List of character dicts with campaign_name added.
    """
    rows = (
        db.session.query(Character, Campaign.name)
        .join(Campaign, Character.campaign_id == Campaign.id)
        .filter(Character.user_id == user_id)
        .order_by(Character.name)
        .all()
    )
    characters = []
    for char, campaign_name in rows:
        d = char.to_dict()
        d["campaign_name"] = campaign_name
        characters.append(d)
    return characters


def list_by_campaign(campaign_id: str, user_id: str) -> list[dict]:
    """List all characters in a specific campaign.

    Args:
        campaign_id: UUID of the campaign.
        user_id: UUID of the requesting user (for campaign ownership check).

    Returns:
        List of character dicts.

    Raises:
        LookupError: If campaign not found or not owned by user.
    """
    campaign = Campaign.query.filter_by(id=campaign_id, user_id=user_id).first()
    if not campaign:
        raise LookupError("Campaign not found")

    characters = Character.query.filter_by(campaign_id=campaign_id).all()
    return [c.to_dict() for c in characters]


def create_character(campaign_id: str, user_id: str, data: dict) -> dict:
    """Create a new character in a campaign.

    Args:
        campaign_id: UUID of the campaign.
        user_id: UUID of the character owner.
        data: Request body with name and optional character fields.

    Returns:
        Created character dict.

    Raises:
        LookupError: If campaign not found or not owned by user.
        ValueError: If required fields (name) are missing.
    """
    campaign = Campaign.query.filter_by(id=campaign_id, user_id=user_id).first()
    if not campaign:
        raise LookupError("Campaign not found")

    if not data.get("name"):
        raise ValueError("name is required")
    _validate_json_fields(data)

    character = Character(
        campaign_id=campaign_id,
        user_id=user_id,
        name=data["name"],
        character_type=data.get("character_type", "pc"),
        level=data.get("level", 1),
        core_data=json.dumps(data.get("core_data", {})),
        class_data=json.dumps(data.get("class_data", {})),
        equipment=json.dumps(data.get("equipment", [])),
        spells=json.dumps(data.get("spells", [])),
    )
    db.session.add(character)
    db.session.commit()
    return character.to_dict()


def get_character(character_id: str, user_id: str) -> dict | None:
    """Get a single character by ID, scoped to user.

    Args:
        character_id: UUID of the character.
        user_id: UUID of the requesting user.

    Returns:
        Character dict, or None if not found / not owned.
    """
    character = Character.query.filter_by(id=character_id, user_id=user_id).first()
    return character.to_dict() if character else None


def update_character(character_id: str, user_id: str, data: dict) -> dict | None:
    """Update a character's mutable fields.

    Args:
        character_id: UUID of the character.
        user_id: UUID of the requesting user.
        data: Dict of fields to update.

    Returns:
        Updated character dict, or None if not found.
    """
    character = Character.query.filter_by(id=character_id, user_id=user_id).first()
    if not character:
        return None

    _validate_json_fields(data)

    if "name" in data:
        character.name = data["name"]
    if "character_type" in data:
        character.character_type = data["character_type"]
    if "level" in data:
        character.level = data["level"]
    if "core_data" in data:
        character.core_data = json.dumps(data["core_data"])
    if "class_data" in data:
        character.class_data = json.dumps(data["class_data"])
    if "equipment" in data:
        character.equipment = json.dumps(data["equipment"])
    if "spells" in data:
        character.spells = json.dumps(data["spells"])

    db.session.commit()
    return character.to_dict()


def delete_character(character_id: str, user_id: str) -> bool:
    """Delete a character.

    Args:
        character_id: UUID of the character.
        user_id: UUID of the requesting user.

    Returns:
        True if deleted, False if not found.
    """
    character = Character.query.filter_by(id=character_id, user_id=user_id).first()
    if not character:
        return False

    db.session.delete(character)
    db.session.commit()
    return True
