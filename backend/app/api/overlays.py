from flask import Blueprint, Response, request, jsonify

from app.services import overlay_service
from app.utils.auth import jwt_required

overlays_bp = Blueprint("overlays", __name__)


@overlays_bp.route("/api/overlays")
@jwt_required
def list_overlays() -> Response:
    """
    List overlays for the current user with optional filtering.

    ---
    tags:
      - Overlays
    security:
      - bearerAuth: []
    parameters:
      - name: ruleset_id
        in: query
        schema:
          type: string
          format: uuid
      - name: campaign_id
        in: query
        schema:
          type: string
          format: uuid
      - name: entity_type
        in: query
        schema:
          type: string
    responses:
      200:
        description: List of overlays
      401:
        description: Not authenticated
    """
    overlays = overlay_service.list_overlays(
        user_id=request.current_user.id,
        ruleset_id=request.args.get("ruleset_id"),
        campaign_id=request.args.get("campaign_id"),
        entity_type=request.args.get("entity_type"),
    )
    return jsonify({"overlays": overlays})


@overlays_bp.route("/api/overlays", methods=["POST"])
@jwt_required
def create_overlay() -> tuple[Response, int] | Response:
    """
    Create a new entity overlay.

    ---
    tags:
      - Overlays
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [ruleset_id, entity_type, source_key, overlay_type, overlay_data]
            properties:
              ruleset_id:
                type: string
                format: uuid
              entity_type:
                type: string
                description: Entity type key (spell, creature, etc.)
              source_key:
                type: string
                description: Source key of the entity to overlay
              overlay_type:
                type: string
                enum: [modify, homebrew, disable]
              overlay_data:
                type: object
                description: Data to merge over base entity
              campaign_id:
                type: string
                format: uuid
                description: Optional campaign scope (null for global)
    responses:
      201:
        description: Overlay created
      400:
        description: Validation error
      401:
        description: Not authenticated
      404:
        description: Ruleset not found
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    try:
        overlay = overlay_service.create_overlay(request.current_user.id, data)
    except ValueError as e:
        return jsonify({"error": "Missing required fields", "detail": str(e)}), 400
    except LookupError as e:
        return jsonify({"error": str(e)}), 404

    return jsonify({"overlay": overlay}), 201


@overlays_bp.route("/api/overlays/<overlay_id>", methods=["PUT"])
@jwt_required
def update_overlay(overlay_id: str) -> tuple[Response, int] | Response:
    """
    Update an overlay's data or type.

    ---
    tags:
      - Overlays
    security:
      - bearerAuth: []
    parameters:
      - name: overlay_id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            properties:
              overlay_data:
                type: object
              overlay_type:
                type: string
                enum: [modify, homebrew, disable]
    responses:
      200:
        description: Overlay updated
      400:
        description: Request body required
      401:
        description: Not authenticated
      404:
        description: Overlay not found
    """
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    overlay = overlay_service.update_overlay(
        overlay_id, request.current_user.id, data
    )
    if overlay is None:
        return jsonify({"error": "Overlay not found"}), 404
    return jsonify({"overlay": overlay})


@overlays_bp.route("/api/overlays/<overlay_id>", methods=["DELETE"])
@jwt_required
def delete_overlay(overlay_id: str) -> tuple[str, int] | tuple[Response, int]:
    """
    Delete an overlay.

    ---
    tags:
      - Overlays
    security:
      - bearerAuth: []
    parameters:
      - name: overlay_id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    responses:
      204:
        description: Overlay deleted
      401:
        description: Not authenticated
      404:
        description: Overlay not found
    """
    deleted = overlay_service.delete_overlay(overlay_id, request.current_user.id)
    if not deleted:
        return jsonify({"error": "Overlay not found"}), 404
    return '', 204
