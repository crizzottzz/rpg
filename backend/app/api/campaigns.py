import json
from flask import Blueprint, request, jsonify

from app.extensions import db
from app.models.campaign import Campaign
from app.models.ruleset import Ruleset
from app.utils.auth import jwt_required

campaigns_bp = Blueprint("campaigns", __name__)


@campaigns_bp.route("/api/campaigns")
@jwt_required
def list_campaigns():
    campaigns = Campaign.query.filter_by(user_id=request.current_user.id).all()
    return jsonify({"campaigns": [c.to_dict() for c in campaigns]})


@campaigns_bp.route("/api/campaigns", methods=["POST"])
@jwt_required
def create_campaign():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    ruleset = Ruleset.query.get(data.get("ruleset_id", ""))
    if not ruleset:
        return jsonify({"error": "Ruleset not found"}), 404

    campaign = Campaign(
        user_id=request.current_user.id,
        ruleset_id=ruleset.id,
        name=data.get("name", "Untitled Campaign"),
        description=data.get("description", ""),
        settings=json.dumps(data.get("settings", {})),
    )
    db.session.add(campaign)
    db.session.commit()
    return jsonify({"campaign": campaign.to_dict()}), 201


@campaigns_bp.route("/api/campaigns/<campaign_id>")
@jwt_required
def get_campaign(campaign_id):
    campaign = Campaign.query.filter_by(
        id=campaign_id, user_id=request.current_user.id
    ).first()
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404
    return jsonify({"campaign": campaign.to_dict()})


@campaigns_bp.route("/api/campaigns/<campaign_id>", methods=["PUT"])
@jwt_required
def update_campaign(campaign_id):
    campaign = Campaign.query.filter_by(
        id=campaign_id, user_id=request.current_user.id
    ).first()
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    if "name" in data:
        campaign.name = data["name"]
    if "description" in data:
        campaign.description = data["description"]
    if "status" in data:
        campaign.status = data["status"]
    if "settings" in data:
        campaign.settings = json.dumps(data["settings"])

    db.session.commit()
    return jsonify({"campaign": campaign.to_dict()})


@campaigns_bp.route("/api/campaigns/<campaign_id>", methods=["DELETE"])
@jwt_required
def delete_campaign(campaign_id):
    campaign = Campaign.query.filter_by(
        id=campaign_id, user_id=request.current_user.id
    ).first()
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404

    db.session.delete(campaign)
    db.session.commit()
    return jsonify({"message": "Campaign deleted"})
