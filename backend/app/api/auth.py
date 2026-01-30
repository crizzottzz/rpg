from flask import Blueprint, request, jsonify

from app.models.user import User
from app.utils.auth import create_access_token, create_refresh_token, decode_token, jwt_required

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    username = data.get("username", "")
    password = data.get("password", "")

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "user": user.to_dict(),
    })


@auth_bp.route("/api/auth/refresh", methods=["POST"])
def refresh():
    data = request.get_json()
    if not data or "refresh_token" not in data:
        return jsonify({"error": "Refresh token required"}), 400

    try:
        payload = decode_token(data["refresh_token"])
        if payload.get("type") != "refresh":
            return jsonify({"error": "Invalid token type"}), 401
    except Exception:
        return jsonify({"error": "Invalid or expired refresh token"}), 401

    user = User.query.get(payload["sub"])
    if not user:
        return jsonify({"error": "User not found"}), 401

    return jsonify({
        "access_token": create_access_token(user.id),
    })


@auth_bp.route("/api/auth/me")
@jwt_required
def me():
    return jsonify({"user": request.current_user.to_dict()})
