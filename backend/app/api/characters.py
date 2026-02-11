import json
from flask import Blueprint, Response, request, jsonify

from app.extensions import db
from app.models.character import Character
from app.models.campaign import Campaign
from app.utils.auth import jwt_required

characters_bp = Blueprint("characters", __name__)


@characters_bp.route("/api/characters")
@jwt_required
def list_all_characters() -> Response:
    """
    List all characters for the current user across all campaigns.

    ---
    tags:
      - Characters
    security:
      - bearerAuth: []
    responses:
      200:
        description: List of user's characters with campaign names
      401:
        description: Not authenticated
    """
    rows = (
        db.session.query(Character, Campaign.name)
        .join(Campaign, Character.campaign_id == Campaign.id)
        .filter(Character.user_id == request.current_user.id)
        .order_by(Character.name)
        .all()
    )
    characters = []
    for char, campaign_name in rows:
        d = char.to_dict()
        d["campaign_name"] = campaign_name
        characters.append(d)
    return jsonify({"characters": characters})


@characters_bp.route("/api/campaigns/<campaign_id>/characters")
@jwt_required
def list_characters(campaign_id: str) -> tuple[Response, int] | Response:
    """
    List all characters in a campaign.

    ---
    tags:
      - Characters
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
        description: List of characters
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

    characters = Character.query.filter_by(campaign_id=campaign_id).all()
    return jsonify({"characters": [c.to_dict() for c in characters]})


@characters_bp.route("/api/campaigns/<campaign_id>/characters", methods=["POST"])
@jwt_required
def create_character(campaign_id: str) -> tuple[Response, int] | Response:
    """
    Create a new character in a campaign.

    ---
    tags:
      - Characters
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
            required: [name]
            properties:
              name:
                type: string
                description: Character name
              character_type:
                type: string
                enum: [pc, npc]
                default: pc
              level:
                type: integer
                default: 1
              core_data:
                type: object
                description: Ability scores, HP, AC, etc.
              class_data:
                type: object
                description: Class levels and features
              equipment:
                type: array
                items:
                  type: object
              spells:
                type: array
                items:
                  type: object
    responses:
      201:
        description: Character created
      400:
        description: Validation error
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

    if not data.get("name"):
        return jsonify({"error": "Missing required fields", "detail": "name is required"}), 400

    character = Character(
        campaign_id=campaign_id,
        user_id=request.current_user.id,
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
    return jsonify({"character": character.to_dict()}), 201


@characters_bp.route("/api/characters/<character_id>")
@jwt_required
def get_character(character_id: str) -> tuple[Response, int] | Response:
    """
    Get a single character by ID.

    ---
    tags:
      - Characters
    security:
      - bearerAuth: []
    parameters:
      - name: character_id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    responses:
      200:
        description: Character details
      401:
        description: Not authenticated
      404:
        description: Character not found
    """
    character = Character.query.filter_by(
        id=character_id, user_id=request.current_user.id
    ).first()
    if not character:
        return jsonify({"error": "Character not found"}), 404
    return jsonify({"character": character.to_dict()})


@characters_bp.route("/api/characters/<character_id>", methods=["PUT"])
@jwt_required
def update_character(character_id: str) -> tuple[Response, int] | Response:
    """
    Update a character's fields.

    ---
    tags:
      - Characters
    security:
      - bearerAuth: []
    parameters:
      - name: character_id
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
              character_type:
                type: string
                enum: [pc, npc]
              level:
                type: integer
              core_data:
                type: object
              class_data:
                type: object
              equipment:
                type: array
              spells:
                type: array
    responses:
      200:
        description: Character updated
      400:
        description: Request body required
      401:
        description: Not authenticated
      404:
        description: Character not found
    """
    character = Character.query.filter_by(
        id=character_id, user_id=request.current_user.id
    ).first()
    if not character:
        return jsonify({"error": "Character not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

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
    return jsonify({"character": character.to_dict()})


@characters_bp.route("/api/characters/<character_id>", methods=["DELETE"])
@jwt_required
def delete_character(character_id: str) -> tuple[str, int] | tuple[Response, int]:
    """
    Delete a character.

    ---
    tags:
      - Characters
    security:
      - bearerAuth: []
    parameters:
      - name: character_id
        in: path
        required: true
        schema:
          type: string
          format: uuid
    responses:
      204:
        description: Character deleted
      401:
        description: Not authenticated
      404:
        description: Character not found
    """
    character = Character.query.filter_by(
        id=character_id, user_id=request.current_user.id
    ).first()
    if not character:
        return jsonify({"error": "Character not found"}), 404

    db.session.delete(character)
    db.session.commit()
    return '', 204
