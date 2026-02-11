import os

basedir = os.path.abspath(os.path.dirname(__file__))

# Dev-only fallback secrets — stable across restarts so tokens survive
# auto-reload. Override with env vars in any real deployment.
_DEV_SECRET = "rpg-dev-secret-key-do-not-use-in-production"


class Config:
    """Flask application configuration.

    All tunables read from environment variables with sensible dev defaults.
    For production, set every env var marked (required) below.

    Environment variables:
        SECRET_KEY              Flask session secret (required in prod)
        JWT_SECRET_KEY          JWT signing key (required in prod)
        JWT_ACCESS_TOKEN_EXPIRES  Access token lifetime in seconds (default: 900)
        JWT_REFRESH_TOKEN_EXPIRES Refresh token lifetime in seconds (default: 2592000)
        DATABASE_URL            SQLAlchemy DB URI (default: sqlite:///rpg.db)
        MAX_CONTENT_LENGTH      Max request body in bytes (default: 2097152)
        LOG_LEVEL               Python log level name (default: INFO)
        SEED_USERNAME           Initial admin username (default: dm)
        SEED_PASSWORD           Initial admin password (default: dungeon_master_2025)
        SEED_EMAIL              Initial admin email (default: dm@rpg.local)
    """

    SECRET_KEY = os.environ.get("SECRET_KEY", _DEV_SECRET)
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", _DEV_SECRET)
    JWT_ACCESS_TOKEN_EXPIRES = int(os.environ.get("JWT_ACCESS_TOKEN_EXPIRES", 900))  # 15 min
    JWT_REFRESH_TOKEN_EXPIRES = int(os.environ.get("JWT_REFRESH_TOKEN_EXPIRES", 30 * 24 * 3600))

    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL", f"sqlite:///{os.path.join(basedir, 'rpg.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    SEED_USERNAME = os.environ.get("SEED_USERNAME", "dm")
    SEED_PASSWORD = os.environ.get("SEED_PASSWORD", "dungeon_master_2025")
    SEED_EMAIL = os.environ.get("SEED_EMAIL", "dm@rpg.local")

    MAX_CONTENT_LENGTH = int(os.environ.get("MAX_CONTENT_LENGTH", 2 * 1024 * 1024))

    SWAGGER = {"openapi": "3.0.3"}
