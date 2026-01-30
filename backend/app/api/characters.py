import json
from flask import Blueprint, request, jsonify

from app.extensions import db
from app.models.character import Character
from app.models.campaign import Campaign
from app.utils.auth import jwt_required

characters_bp = Blueprint("characters", __name__)


@characters_bp.route("/api/campaigns/<campaign_id>/characters")
@jwt_required
def list_characters(campaign_id):
    campaign = Campaign.query.filter_by(
        id=campaign_id, user_id=request.current_user.id
    ).first()
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404

    characters = Character.query.filter_by(campaign_id=campaign_id).all()
    return jsonify({"characters": [c.to_dict() for c in characters]})


@characters_bp.route("/api/campaigns/<campaign_id>/characters", methods=["POST"])
@jwt_required
def create_character(campaign_id):
    campaign = Campaign.query.filter_by(
        id=campaign_id, user_id=request.current_user.id
    ).first()
    if not campaign:
        return jsonify({"error": "Campaign not found"}), 404

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    character = Character(
        campaign_id=campaign_id,
        user_id=request.current_user.id,
        name=data.get("name", "Unnamed Character"),
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
def get_character(character_id):
    character = Character.query.filter_by(
        id=character_id, user_id=request.current_user.id
    ).first()
    if not character:
        return jsonify({"error": "Character not found"}), 404
    return jsonify({"character": character.to_dict()})


@characters_bp.route("/api/characters/<character_id>", methods=["PUT"])
@jwt_required
def update_character(character_id):
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
def delete_character(character_id):
    character = Character.query.filter_by(
        id=character_id, user_id=request.current_user.id
    ).first()
    if not character:
        return jsonify({"error": "Character not found"}), 404

    db.session.delete(character)
    db.session.commit()
    return jsonify({"message": "Character deleted"})
