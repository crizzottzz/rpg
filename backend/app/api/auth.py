import time
from collections import defaultdict

from flask import Blueprint, Response, request, jsonify

from app.services import auth_service
from app.utils.auth import jwt_required

auth_bp = Blueprint("auth", __name__)

# Simple in-memory rate limiter: max 5 failed attempts per IP per 15-minute window
_login_attempts: dict[str, list[float]] = defaultdict(list)
_MAX_ATTEMPTS = 5
_WINDOW_SECONDS = 900


def _check_rate_limit(ip: str) -> bool:
    """Return True if the IP is rate-limited."""
    now = time.monotonic()
    attempts = _login_attempts[ip]
    _login_attempts[ip] = [t for t in attempts if now - t < _WINDOW_SECONDS]
    return len(_login_attempts[ip]) >= _MAX_ATTEMPTS


def _record_failed_attempt(ip: str) -> None:
    _login_attempts[ip].append(time.monotonic())


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
      429:
        description: Too many login attempts
    """
    client_ip = request.remote_addr or "unknown"
    if _check_rate_limit(client_ip):
        return jsonify({"error": "Too many login attempts. Try again later."}), 429

    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400

    try:
        result = auth_service.authenticate_user(
            data.get("username", ""),
            data.get("password", ""),
        )
    except ValueError as e:
        _record_failed_attempt(client_ip)
        return jsonify({"error": str(e)}), 401

    return jsonify(result)


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
        result = auth_service.refresh_access_token(data["refresh_token"])
    except ValueError as e:
        return jsonify({"error": str(e)}), 401

    return jsonify(result)


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
