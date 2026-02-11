from flask import Flask
from flask_cors import CORS
from flasgger import Swagger

from config import Config
from app.extensions import db, migrate
from app.utils.errors import register_error_handlers
from app.utils.logging import init_logging, register_access_logging

SWAGGER_CONFIG = {
    "headers": [],
    "specs": [
        {
            "endpoint": "openapi",
            "route": "/api/openapi.json",
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/api/docs",
}

SWAGGER_TEMPLATE = {
    "openapi": "3.0.3",
    "info": {
        "title": "RPG Platform API",
        "version": "1.0.0",
        "description": "Tabletop RPG campaign management API",
    },
    "servers": [{"url": "/"}],
    "components": {
        "securitySchemes": {
            "bearerAuth": {
                "type": "http",
                "scheme": "bearer",
                "bearerFormat": "JWT",
            }
        }
    },
}


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Logging
    init_logging()
    register_access_logging(app)

    # Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    CORS(app)
    Swagger(app, config=SWAGGER_CONFIG, template=SWAGGER_TEMPLATE)

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

    from app.api.logs import logs_bp
    app.register_blueprint(logs_bp)

    # CLI commands
    from app.seed.commands import register_commands
    register_commands(app)

    return app
