from flask import Blueprint, Response, request, jsonify

from app.services import character_service
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
    characters = character_service.list_all_characters(request.current_user.id)
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
    try:
        characters = character_service.list_by_campaign(
            campaign_id, request.current_user.id
        )
    except LookupError as e:
        return jsonify({"error": str(e)}), 404

    return jsonify({"characters": characters})


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
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    try:
        character = character_service.create_character(
            campaign_id, request.current_user.id, data
        )
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    except ValueError as e:
        return jsonify({"error": "Missing required fields", "detail": str(e)}), 400

    return jsonify({"character": character}), 201


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
    character = character_service.get_character(
        character_id, request.current_user.id
    )
    if character is None:
        return jsonify({"error": "Character not found"}), 404
    return jsonify({"character": character})


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
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    character = character_service.update_character(
        character_id, request.current_user.id, data
    )
    if character is None:
        return jsonify({"error": "Character not found"}), 404
    return jsonify({"character": character})


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
    deleted = character_service.delete_character(
        character_id, request.current_user.id
    )
    if not deleted:
        return jsonify({"error": "Character not found"}), 404
    return '', 204
