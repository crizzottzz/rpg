from flask import Blueprint, Response, request, jsonify

from app.services import campaign_service
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
    campaigns = campaign_service.list_campaigns(request.current_user.id)
    return jsonify({"campaigns": campaigns})


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

    try:
        campaign = campaign_service.create_campaign(request.current_user.id, data)
    except ValueError as e:
        return jsonify({"error": "Missing required fields", "detail": str(e)}), 400
    except LookupError as e:
        return jsonify({"error": str(e)}), 404

    return jsonify({"campaign": campaign}), 201


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
    campaign = campaign_service.get_campaign(campaign_id, request.current_user.id)
    if campaign is None:
        return jsonify({"error": "Campaign not found"}), 404
    return jsonify({"campaign": campaign})


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
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    campaign = campaign_service.update_campaign(
        campaign_id, request.current_user.id, data
    )
    if campaign is None:
        return jsonify({"error": "Campaign not found"}), 404
    return jsonify({"campaign": campaign})


@campaigns_bp.route("/api/campaigns/<campaign_id>", methods=["DELETE"])
@jwt_required
def delete_campaign(campaign_id: str) -> tuple[Response, int]:
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
    deleted = campaign_service.delete_campaign(campaign_id, request.current_user.id)
    if not deleted:
        return jsonify({"error": "Campaign not found"}), 404
    return jsonify(''), 204
