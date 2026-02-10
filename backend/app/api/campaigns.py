import json
from flask import Blueprint, Response, request, jsonify

from app.extensions import db
from app.models.campaign import Campaign
from app.models.ruleset import Ruleset
from app.utils.auth import jwt_required

campaigns_bp = Blueprint("campaigns", __name__)


@campaigns_bp.route("/api/campaigns")
@jwt_required
def list_campaigns() -> Response:
    """
    List all campaigns for the current user.

    ---
    tags:
      - Campaigns
    security:
      - bearerAuth: []
    responses:
      200:
        description: List of user's campaigns
        content:
          application/json:
            schema:
              type: object
              properties:
                campaigns:
                  type: array
                  items:
                    type: object
      401:
        description: Not authenticated
    """
    campaigns = Campaign.query.filter_by(user_id=request.current_user.id).all()
    return jsonify({"campaigns": [c.to_dict() for c in campaigns]})


@campaigns_bp.route("/api/campaigns", methods=["POST"])
@jwt_required
def create_campaign() -> tuple[Response, int] | Response:
    """
    Create a new campaign.

    ---
    tags:
      - Campaigns
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [name, ruleset_id]
            properties:
              name:
                type: string
                description: Campaign name
              description:
                type: string
                description: Optional campaign description
              ruleset_id:
                type: string
                format: uuid
                description: UUID of the ruleset to use
              settings:
                type: object
                description: Optional campaign settings
          example:
            name: Lost Mines of Phandelver
            description: Starter campaign
            ruleset_id: abc-123
    responses:
      201:
        description: Campaign created
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

    if not data.get("name") or not data.get("ruleset_id"):
        return jsonify({"error": "Missing required fields", "detail": "name and ruleset_id are required"}), 400

    ruleset = Ruleset.query.get(data["ruleset_id"])
    if not ruleset:
        return jsonify({"error": "Ruleset not found"}), 404

    campaign = Campaign(
        user_id=request.current_user.id,
        ruleset_id=ruleset.id,
        name=data["name"],
        description=data.get("description", ""),
        settings=json.dumps(data.get("settings", {})),
    )
    db.session.add(campaign)
    db.session.commit()
    return jsonify({"campaign": campaign.to_dict()}), 201


@campaigns_bp.route("/api/campaigns/<campaign_id>")
@jwt_required
def get_campaign(campaign_id: str) -> tuple[Response, int] | Response:
    """
    Get a single campaign by ID.

    ---
    tags:
      - Campaigns
    security:
      - bearerAuth: []
    parameters:
      - name: campaign_id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    responses:
      200:
        description: Campaign details
      401:
        description: Not authenticated
      404:
        description: Campaign not found
    """
    campaign = Campaign.query.filter_by(
        id=campaign_id, user_id=request.current_user.id
    ).first()
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404
    return jsonify({"campaign": campaign.to_dict()})


@campaigns_bp.route("/api/campaigns/<campaign_id>", methods=["PUT"])
@jwt_required
def update_campaign(campaign_id: str) -> tuple[Response, int] | Response:
    """
    Update a campaign's fields.

    ---
    tags:
      - Campaigns
    security:
      - bearerAuth: []
    parameters:
      - name: campaign_id
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
              name:
                type: string
              description:
                type: string
              status:
                type: string
                enum: [active, paused, completed]
              settings:
                type: object
    responses:
      200:
        description: Campaign updated
      400:
        description: Request body required
      401:
        description: Not authenticated
      404:
        description: Campaign not found
    """
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
def delete_campaign(campaign_id: str) -> tuple[str, int] | tuple[Response, int]:
    """
    Delete a campaign and all its characters.

    ---
    tags:
      - Campaigns
    security:
      - bearerAuth: []
    parameters:
      - name: campaign_id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    responses:
      204:
        description: Campaign deleted
      401:
        description: Not authenticated
      404:
        description: Campaign not found
    """
    campaign = Campaign.query.filter_by(
        id=campaign_id, user_id=request.current_user.id
    ).first()
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404

    db.session.delete(campaign)
    db.session.commit()
    return '', 204
