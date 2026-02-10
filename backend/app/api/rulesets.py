from flask import Blueprint, Response, request, jsonify

from app.models.ruleset import Ruleset, RulesetEntity
from app.models.overlay import UserOverlay
from app.utils.auth import jwt_required
from app.utils.deep_merge import deep_merge

rulesets_bp = Blueprint("rulesets", __name__)


@rulesets_bp.route("/api/rulesets")
@jwt_required
def list_rulesets() -> Response:
    """
    List all available rulesets.

    ---
    tags:
      - Rulesets
    security:
      - bearerAuth: []
    responses:
      200:
        description: List of rulesets
        content:
          application/json:
            schema:
              type: object
              properties:
                rulesets:
                  type: array
                  items:
                    type: object
                    properties:
                      id:
                        type: string
                      key:
                        type: string
                      name:
                        type: string
                      source_type:
                        type: string
                      entity_types:
                        type: array
                        items:
                          type: string
                      entity_count:
                        type: integer
      401:
        description: Not authenticated
    """
    rulesets = Ruleset.query.all()
    return jsonify({"rulesets": [r.to_dict() for r in rulesets]})


@rulesets_bp.route("/api/rulesets/<ruleset_id>")
@jwt_required
def get_ruleset(ruleset_id: str) -> tuple[Response, int] | Response:
    """
    Get a single ruleset by ID.

    ---
    tags:
      - Rulesets
    security:
      - bearerAuth: []
    parameters:
      - name: ruleset_id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    responses:
      200:
        description: Ruleset details
      401:
        description: Not authenticated
      404:
        description: Ruleset not found
    """
    ruleset = Ruleset.query.get(ruleset_id)
    if not ruleset:
        return jsonify({"error": "Ruleset not found"}), 404
    return jsonify({"ruleset": ruleset.to_dict()})


@rulesets_bp.route("/api/rulesets/<ruleset_id>/entities")
@jwt_required
def list_entities(ruleset_id: str) -> tuple[Response, int] | Response:
    """
    List entities in a ruleset with optional filtering and pagination.

    ---
    tags:
      - Rulesets
    security:
      - bearerAuth: []
    parameters:
      - name: ruleset_id
        in: path
        required: true
        schema:
          type: string
          format: uuid
      - name: type
        in: query
        schema:
          type: string
        description: Filter by entity type (spell, creature, etc.)
      - name: search
        in: query
        schema:
          type: string
        description: Search entities by name (case-insensitive)
      - name: page
        in: query
        schema:
          type: integer
          default: 1
      - name: per_page
        in: query
        schema:
          type: integer
          default: 50
          maximum: 100
    responses:
      200:
        description: Paginated entity list
        content:
          application/json:
            schema:
              type: object
              properties:
                entities:
                  type: array
                  items:
                    type: object
                total:
                  type: integer
                page:
                  type: integer
                pages:
                  type: integer
                per_page:
                  type: integer
      401:
        description: Not authenticated
      404:
        description: Ruleset not found
    """
    ruleset = Ruleset.query.get(ruleset_id)
    if not ruleset:
        return jsonify({"error": "Ruleset not found"}), 404

    entity_type = request.args.get("type", "")
    search = request.args.get("search", "")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)
    per_page = min(per_page, 100)

    query = RulesetEntity.query.filter_by(ruleset_id=ruleset_id)

    if entity_type:
        query = query.filter_by(entity_type=entity_type)
    if search:
        query = query.filter(RulesetEntity.name.ilike(f"%{search}%"))

    query = query.order_by(RulesetEntity.name)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "entities": [e.to_dict() for e in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
        "per_page": per_page,
    })


def apply_overlays(entity: RulesetEntity, user_id: str, campaign_id: str | None = None) -> dict:
    """Apply user overlays to an entity's data, returning the effective dict.

    Args:
        entity: The base ruleset entity.
        user_id: UUID of the current user.
        campaign_id: Optional campaign UUID for scoped overlays.

    Returns:
        Entity dict with overlay-merged entity_data.
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


@rulesets_bp.route("/api/rulesets/<ruleset_id>/entities/<entity_id>")
@jwt_required
def get_entity(ruleset_id: str, entity_id: str) -> tuple[Response, int] | Response:
    """
    Get a single entity with optional overlay merging.

    ---
    tags:
      - Rulesets
    security:
      - bearerAuth: []
    parameters:
      - name: ruleset_id
        in: path
        required: true
        schema:
          type: string
          format: uuid
      - name: entity_id
        in: path
        required: true
        schema:
          type: string
          format: uuid
      - name: effective
        in: query
        schema:
          type: boolean
          default: false
        description: If true, apply user overlays to entity data
      - name: campaign_id
        in: query
        schema:
          type: string
          format: uuid
        description: Campaign scope for overlay resolution
    responses:
      200:
        description: Entity details with optional overlay data
      401:
        description: Not authenticated
      404:
        description: Entity not found
    """
    entity = RulesetEntity.query.filter_by(
        id=entity_id, ruleset_id=ruleset_id
    ).first()
    if not entity:
        return jsonify({"error": "Entity not found"}), 404

    effective = request.args.get("effective", "").lower() == "true"
    campaign_id = request.args.get("campaign_id")

    if effective:
        result = apply_overlays(entity, request.current_user.id, campaign_id)
    else:
        result = entity.to_dict(include_data=True)

    return jsonify({"entity": result})
