"""Authentication service — credential verification and token refresh."""

import jwt

from app.models.user import User
from app.utils.auth import create_access_token, create_refresh_token, decode_token


def authenticate_user(username: str, password: str) -> dict:
    """Verify credentials and return token pair with user info.

    Args:
        username: Login username.
        password: Plaintext password.

    Returns:
        Dict with access_token, refresh_token, and user dict.

    Raises:
        ValueError: If credentials are invalid.
    """
    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        raise ValueError("Invalid credentials")

    return {
        "access_token": create_access_token(user.id),
        "refresh_token": create_refresh_token(user.id),
        "user": user.to_dict(),
    }


def refresh_access_token(refresh_token: str) -> dict:
    """Validate a refresh token and issue a new access token.

    Args:
        refresh_token: Encoded JWT refresh token string.

    Returns:
        Dict with new access_token.

    Raises:
        ValueError: If token is invalid, expired, wrong type, or user not found.
    """
    try:
        payload = decode_token(refresh_token)
    except jwt.ExpiredSignatureError:
        raise ValueError("Refresh token has expired")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid refresh token")

    if payload.get("type") != "refresh":
        raise ValueError("Invalid token type")

    user = User.query.get(payload["sub"])
    if not user:
        raise ValueError("User not found")

    return {"access_token": create_access_token(user.id)}
