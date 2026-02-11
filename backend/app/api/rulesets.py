from flask import Blueprint, Response, request, jsonify

from app.services import ruleset_service
from app.utils.auth import jwt_required

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
    rulesets = ruleset_service.list_rulesets()
    return jsonify({"rulesets": rulesets})


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
    ruleset = ruleset_service.get_ruleset(ruleset_id)
    if ruleset is None:
        return jsonify({"error": "Ruleset not found"}), 404
    return jsonify({"ruleset": ruleset})


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
      - name: source
        in: query
        schema:
          type: string
        description: "Source filter: document_key, 'all', or empty for smart default"
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
    entity_type = request.args.get("type", "")
    search = request.args.get("search", "")
    source = request.args.get("source", "")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)

    result = ruleset_service.list_entities(
        ruleset_id,
        entity_type=entity_type,
        search=search,
        source=source,
        page=page,
        per_page=per_page,
    )
    if result is None:
        return jsonify({"error": "Ruleset not found"}), 404
    return jsonify(result)


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
    effective = request.args.get("effective", "").lower() == "true"
    campaign_id = request.args.get("campaign_id")

    entity = ruleset_service.get_entity(
        ruleset_id,
        entity_id,
        user_id=request.current_user.id if effective else None,
        campaign_id=campaign_id,
        effective=effective,
    )
    if entity is None:
        return jsonify({"error": "Entity not found"}), 404
    return jsonify({"entity": entity})


@rulesets_bp.route("/api/rulesets/<ruleset_id>/sources")
@jwt_required
def list_sources(ruleset_id: str) -> tuple[Response, int] | Response:
    """
    List available source documents for a ruleset.

    Returns sources with entity counts. Optionally filter counts by entity type.

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
        description: Entity type to scope counts (e.g. spell, creature)
    responses:
      200:
        description: List of source documents with entity counts
        content:
          application/json:
            schema:
              type: object
              properties:
                sources:
                  type: array
                  items:
                    type: object
                    properties:
                      key:
                        type: string
                      display_name:
                        type: string
                      publisher:
                        type: string
                      priority:
                        type: integer
                      is_default:
                        type: boolean
                      entity_count:
                        type: integer
      401:
        description: Not authenticated
      404:
        description: Ruleset not found
    """
    entity_type = request.args.get("type")
    sources = ruleset_service.get_sources(ruleset_id, entity_type=entity_type)
    if sources is None:
        return jsonify({"error": "Ruleset not found"}), 404
    return jsonify({"sources": sources})
