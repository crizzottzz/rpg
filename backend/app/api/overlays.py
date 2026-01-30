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
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    ruleset = Ruleset.query.get(data.get("ruleset_id", ""))
    if not ruleset:
        return jsonify({"error": "Ruleset not found"}), 404

    overlay = UserOverlay(
        user_id=request.current_user.id,
        ruleset_id=ruleset.id,
        entity_type=data.get("entity_type", ""),
        source_key=data.get("source_key", ""),
        overlay_type=data.get("overlay_type", "modify"),
        overlay_data=json.dumps(data.get("overlay_data", {})),
        campaign_id=data.get("campaign_id"),
    )
    db.session.add(overlay)
    db.session.commit()
    return jsonify({"overlay": overlay.to_dict()}), 201


@overlays_bp.route("/api/overlays/<overlay_id>", methods=["PUT"])
@jwt_required
def update_overlay(overlay_id):
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
def delete_overlay(overlay_id):
    overlay = UserOverlay.query.filter_by(
        id=overlay_id, user_id=request.current_user.id
    ).first()
    if not overlay:
        return jsonify({"error": "Overlay not found"}), 404

    db.session.delete(overlay)
    db.session.commit()
    return jsonify({"message": "Overlay deleted"})
