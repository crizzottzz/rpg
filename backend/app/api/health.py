from flask import Blueprint, Response, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.route("/api/health")
def health() -> Response:
    """
    Check API health status.

    ---
    tags:
      - Health
    responses:
      200:
        description: API is healthy
        content:
          application/json:
            schema:
              type: object
              properties:
                status:
                  type: string
                  example: ok
    """
    return jsonify({"status": "ok"})
