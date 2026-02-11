"""Ruleset service — read operations and overlay merging for ruleset entities."""

from app.models.ruleset import Ruleset, RulesetEntity
from app.models.overlay import UserOverlay
from app.utils.deep_merge import deep_merge


def list_rulesets() -> list[dict]:
    """List all available rulesets.

    Returns:
        List of ruleset dicts.
    """
    rulesets = Ruleset.query.all()
    return [r.to_dict() for r in rulesets]


def get_ruleset(ruleset_id: str) -> dict | None:
    """Get a single ruleset by ID.

    Args:
        ruleset_id: UUID of the ruleset.

    Returns:
        Ruleset dict, or None if not found.
    """
    ruleset = Ruleset.query.get(ruleset_id)
    return ruleset.to_dict() if ruleset else None


def list_entities(
    ruleset_id: str,
    entity_type: str = "",
    search: str = "",
    page: int = 1,
    per_page: int = 50,
) -> dict | None:
    """List entities in a ruleset with filtering and pagination.

    Args:
        ruleset_id: UUID of the ruleset.
        entity_type: Optional filter by entity type.
        search: Optional case-insensitive name search.
        page: Page number (1-indexed).
        per_page: Results per page (capped at 100).

    Returns:
        Dict with entities list and pagination metadata,
        or None if ruleset not found.
    """
    ruleset = Ruleset.query.get(ruleset_id)
    if not ruleset:
        return None

    per_page = min(per_page, 100)

    query = RulesetEntity.query.filter_by(ruleset_id=ruleset_id)
    if entity_type:
        query = query.filter_by(entity_type=entity_type)
    if search:
        query = query.filter(RulesetEntity.name.ilike(f"%{search}%"))

    query = query.order_by(RulesetEntity.name)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return {
        "entities": [e.to_dict() for e in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
        "per_page": per_page,
    }


def get_entity(
    ruleset_id: str,
    entity_id: str,
    user_id: str | None = None,
    campaign_id: str | None = None,
    effective: bool = False,
) -> dict | None:
    """Get a single entity with optional overlay merging.

    Args:
        ruleset_id: UUID of the ruleset.
        entity_id: UUID of the entity.
        user_id: UUID of requesting user (required if effective=True).
        campaign_id: Optional campaign scope for overlay resolution.
        effective: If True, apply user overlays to entity data.

    Returns:
        Entity dict (with or without overlays applied), or None if not found.
    """
    entity = RulesetEntity.query.filter_by(
        id=entity_id, ruleset_id=ruleset_id
    ).first()
    if not entity:
        return None

    if effective and user_id:
        return apply_overlays(entity, user_id, campaign_id)

    return entity.to_dict(include_data=True)


def apply_overlays(
    entity: RulesetEntity,
    user_id: str,
    campaign_id: str | None = None,
) -> dict:
    """Apply user overlays to an entity, returning the effective dict.

    Overlays are applied in order: global overlays first, then campaign-scoped.
    A 'disable' overlay marks the entity as disabled.
    'modify' and 'homebrew' overlays are deep-merged over base data.

    Args:
        entity: The base ruleset entity.
        user_id: UUID of the current user.
        campaign_id: Optional campaign UUID for scoped overlays.

    Returns:
        Entity dict with overlay-merged entity_data, plus is_disabled and has_overlay flags.
    """
    result = entity.to_dict(include_data=True)
    base_data = entity.get_entity_data()

    overlays = UserOverlay.query.filter_by(
        user_id=user_id,
        ruleset_id=entity.ruleset_id,
        entity_type=entity.entity_type,
        source_key=entity.source_key,
    ).filter(
        (UserOverlay.campaign_id.is_(None)) | (UserOverlay.campaign_id == campaign_id)
    ).order_by(UserOverlay.campaign_id.asc()).all()

    effective_data = base_data
    is_disabled = False

    for overlay in overlays:
        if overlay.overlay_type == "disable":
            is_disabled = True
        elif overlay.overlay_type in ("modify", "homebrew"):
            effective_data = deep_merge(effective_data, overlay.get_overlay_data())

    result["entity_data"] = effective_data
    result["is_disabled"] = is_disabled
    result["has_overlay"] = len(overlays) > 0
    return result
