from flask import Blueprint, request, jsonify

from app.models.ruleset import Ruleset, RulesetEntity
from app.models.overlay import UserOverlay
from app.utils.auth import jwt_required
from app.utils.deep_merge import deep_merge

rulesets_bp = Blueprint("rulesets", __name__)


@rulesets_bp.route("/api/rulesets")
@jwt_required
def list_rulesets():
    rulesets = Ruleset.query.all()
    return jsonify({"rulesets": [r.to_dict() for r in rulesets]})


@rulesets_bp.route("/api/rulesets/<ruleset_id>")
@jwt_required
def get_ruleset(ruleset_id):
    ruleset = Ruleset.query.get(ruleset_id)
    if not ruleset:
        return jsonify({"error": "Ruleset not found"}), 404
    return jsonify({"ruleset": ruleset.to_dict()})


@rulesets_bp.route("/api/rulesets/<ruleset_id>/entities")
@jwt_required
def list_entities(ruleset_id):
    ruleset = Ruleset.query.get(ruleset_id)
    if not ruleset:
        return jsonify({"error": "Ruleset not found"}), 404

    entity_type = request.args.get("type", "")
    search = request.args.get("search", "")
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 50, type=int)
    per_page = min(per_page, 100)

    query = RulesetEntity.query.filter_by(ruleset_id=ruleset_id)

    if entity_type:
        query = query.filter_by(entity_type=entity_type)
    if search:
        query = query.filter(RulesetEntity.name.ilike(f"%{search}%"))

    query = query.order_by(RulesetEntity.name)
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)

    return jsonify({
        "entities": [e.to_dict() for e in pagination.items],
        "total": pagination.total,
        "page": pagination.page,
        "pages": pagination.pages,
        "per_page": per_page,
    })


def apply_overlays(entity, user_id, campaign_id=None):
    """Apply user overlays to an entity's data, returning the effective dict."""
    result = entity.to_dict(include_data=True)
    base_data = entity.get_entity_data()

    # Find overlays: global first, then campaign-scoped
    overlays = UserOverlay.query.filter_by(
        user_id=user_id,
        ruleset_id=entity.ruleset_id,
        entity_type=entity.entity_type,
        source_key=entity.source_key,
    ).filter(
        (UserOverlay.campaign_id.is_(None)) | (UserOverlay.campaign_id == campaign_id)
    ).order_by(UserOverlay.campaign_id.asc()).all()  # global (NULL) first

    effective_data = base_data
    is_disabled = False

    for overlay in overlays:
        if overlay.overlay_type == "disable":
            is_disabled = True
        elif overlay.overlay_type in ("modify", "homebrew"):
            effective_data = deep_merge(effective_data, overlay.get_overlay_data())

    result["entity_data"] = effective_data
    result["is_disabled"] = is_disabled
    result["has_overlay"] = len(overlays) > 0
    return result


@rulesets_bp.route("/api/rulesets/<ruleset_id>/entities/<entity_id>")
@jwt_required
def get_entity(ruleset_id, entity_id):
    entity = RulesetEntity.query.filter_by(
        id=entity_id, ruleset_id=ruleset_id
    ).first()
    if not entity:
        return jsonify({"error": "Entity not found"}), 404

    effective = request.args.get("effective", "").lower() == "true"
    campaign_id = request.args.get("campaign_id")

    if effective:
        result = apply_overlays(entity, request.current_user.id, campaign_id)
    else:
        result = entity.to_dict(include_data=True)

    return jsonify({"entity": result})
