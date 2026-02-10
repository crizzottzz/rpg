from flask import Blueprint, Response, request, jsonify

from app.models.user import User
from app.utils.auth import create_access_token, create_refresh_token, decode_token, jwt_required

auth_bp = Blueprint("auth", __name__)


@auth_bp.route("/api/auth/login", methods=["POST"])
def login() -> tuple[Response, int] | Response:
    """
    Authenticate a user and return JWT tokens.

    ---
    tags:
      - Auth
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [username, password]
            properties:
              username:
                type: string
              password:
                type: string
          example:
            username: dm
            password: dungeon_master_2025
    responses:
      200:
        description: Authentication successful
        content:
          application/json:
            schema:
              type: object
              properties:
                access_token:
                  type: string
                refresh_token:
                  type: string
                user:
                  type: object
      400:
        description: Request body required
      401:
        description: Invalid credentials
    """
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
def refresh() -> tuple[Response, int] | Response:
    """
    Refresh an access token using a refresh token.

    ---
    tags:
      - Auth
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [refresh_token]
            properties:
              refresh_token:
                type: string
    responses:
      200:
        description: New access token issued
        content:
          application/json:
            schema:
              type: object
              properties:
                access_token:
                  type: string
      400:
        description: Refresh token required
      401:
        description: Invalid or expired refresh token
    """
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
def me() -> Response:
    """
    Get the currently authenticated user.

    ---
    tags:
      - Auth
    security:
      - bearerAuth: []
    responses:
      200:
        description: Current user info
        content:
          application/json:
            schema:
              type: object
              properties:
                user:
                  type: object
                  properties:
                    id:
                      type: string
                    username:
                      type: string
                    email:
                      type: string
      401:
        description: Not authenticated
    """
    return jsonify({"user": request.current_user.to_dict()})
