import json
from flask import Blueprint, request, jsonify

from app.extensions import db
from app.models.overlay import UserOverlay
from app.models.ruleset import Ruleset
from app.utils.auth import jwt_required

overlays_bp = Blueprint("overlays", __name__)


@overlays_bp.route("/api/overlays")
@jwt_required
def list_overlays():
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
    ruleset_id = request.args.get("ruleset_id")
    campaign_id = request.args.get("campaign_id")
    entity_type = request.args.get("entity_type")

    query = UserOverlay.query.filter_by(user_id=request.current_user.id)
    if ruleset_id:
        query = query.filter_by(ruleset_id=ruleset_id)
    if campaign_id:
        query = query.filter_by(campaign_id=campaign_id)
    if entity_type:
        query = query.filter_by(entity_type=entity_type)

    overlays = query.all()
    return jsonify({"overlays": [o.to_dict() for o in overlays]})


@overlays_bp.route("/api/overlays", methods=["POST"])
@jwt_required
def create_overlay():
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

    required = ["ruleset_id", "entity_type", "source_key", "overlay_type", "overlay_data"]
    missing = [f for f in required if not data.get(f)]
    if missing:
        return jsonify({
            "error": "Missing required fields",
            "detail": f"{', '.join(missing)} required",
        }), 400

    ruleset = Ruleset.query.get(data["ruleset_id"])
    if not ruleset:
        return jsonify({"error": "Ruleset not found"}), 404

    overlay = UserOverlay(
        user_id=request.current_user.id,
        ruleset_id=ruleset.id,
        entity_type=data["entity_type"],
        source_key=data["source_key"],
        overlay_type=data["overlay_type"],
        overlay_data=json.dumps(data["overlay_data"]),
        campaign_id=data.get("campaign_id"),
    )
    db.session.add(overlay)
    db.session.commit()
    return jsonify({"overlay": overlay.to_dict()}), 201


@overlays_bp.route("/api/overlays/<overlay_id>", methods=["PUT"])
@jwt_required
def update_overlay(overlay_id: str):
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
    overlay = UserOverlay.query.filter_by(
        id=overlay_id, user_id=request.current_user.id
    ).first()
    if not overlay:
        return jsonify({"error": "Overlay not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    if "overlay_data" in data:
        overlay.overlay_data = json.dumps(data["overlay_data"])
    if "overlay_type" in data:
        overlay.overlay_type = data["overlay_type"]

    db.session.commit()
    return jsonify({"overlay": overlay.to_dict()})


@overlays_bp.route("/api/overlays/<overlay_id>", methods=["DELETE"])
@jwt_required
def delete_overlay(overlay_id: str):
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
    overlay = UserOverlay.query.filter_by(
        id=overlay_id, user_id=request.current_user.id
    ).first()
    if not overlay:
        return jsonify({"error": "Overlay not found"}), 404

    db.session.delete(overlay)
    db.session.commit()
    return '', 204
