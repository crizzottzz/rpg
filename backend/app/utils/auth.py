import functools
from datetime import datetime, timedelta, timezone

import jwt
from flask import request, jsonify, current_app

from app.models.user import User


def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "access",
        "exp": datetime.now(timezone.utc) + timedelta(
            seconds=current_app.config["JWT_ACCESS_TOKEN_EXPIRES"]
        ),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def create_refresh_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "type": "refresh",
        "exp": datetime.now(timezone.utc) + timedelta(
            seconds=current_app.config["JWT_REFRESH_TOKEN_EXPIRES"]
        ),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET_KEY"], algorithm="HS256")


def decode_token(token: str) -> dict:
    return jwt.decode(token, current_app.config["JWT_SECRET_KEY"], algorithms=["HS256"])


def jwt_required(f):
    @functools.wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "Missing or invalid authorization header"}), 401

        token = auth_header[7:]
        try:
            payload = decode_token(token)
            if payload.get("type") != "access":
                return jsonify({"error": "Invalid token type"}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401

        user = User.query.get(payload["sub"])
        if not user:
            return jsonify({"error": "User not found"}), 401

        request.current_user = user
        return f(*args, **kwargs)

    return decorated
