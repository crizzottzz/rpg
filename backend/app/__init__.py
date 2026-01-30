from flask import Flask
from flask_cors import CORS

from config import Config
from app.extensions import db, migrate
from app.utils.errors import register_error_handlers


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    # Error handlers
    register_error_handlers(app)

    # Import models so they're registered with SQLAlchemy
    from app import models  # noqa: F401

    # Blueprints
    from app.api.health import health_bp
    app.register_blueprint(health_bp)

    from app.api.auth import auth_bp
    app.register_blueprint(auth_bp)

    from app.api.rulesets import rulesets_bp
    app.register_blueprint(rulesets_bp)

    from app.api.campaigns import campaigns_bp
    app.register_blueprint(campaigns_bp)

    from app.api.characters import characters_bp
    app.register_blueprint(characters_bp)

    from app.api.overlays import overlays_bp
    app.register_blueprint(overlays_bp)

    # CLI commands
    from app.seed.commands import register_commands
    register_commands(app)

    return app
