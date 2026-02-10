import os

basedir = os.path.abspath(os.path.dirname(__file__))


class Config:
    """Flask application configuration."""

    SECRET_KEY = os.environ.get("SECRET_KEY", os.urandom(32).hex())
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", os.urandom(32).hex())
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = 30 * 24 * 3600  # 30 days

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(basedir, 'rpg.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SEED_USERNAME = os.environ.get("SEED_USERNAME", "dm")
    SEED_PASSWORD = os.environ.get("SEED_PASSWORD", "dungeon_master_2025")
    SEED_EMAIL = os.environ.get("SEED_EMAIL", "dm@rpg.local")

    SWAGGER = {"openapi": "3.0.3"}
