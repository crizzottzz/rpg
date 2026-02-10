from flask import Flask, Response, jsonify


class APIError(Exception):
    """Application-level error with HTTP status code."""

    def __init__(self, message: str, status_code: int = 400) -> None:
        self.message = message
        self.status_code = status_code


def register_error_handlers(app: Flask) -> None:
    """Register global error handlers for the Flask app."""

    @app.errorhandler(APIError)
    def handle_api_error(error: APIError) -> tuple[Response, int]:
        return jsonify({"error": error.message}), error.status_code

    @app.errorhandler(404)
    def handle_not_found(error: Exception) -> tuple[Response, int]:
        return jsonify({"error": "Not found"}), 404

    @app.errorhandler(500)
    def handle_internal(error: Exception) -> tuple[Response, int]:
        return jsonify({"error": "Internal server error"}), 500
