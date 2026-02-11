# Python Coding Standards

## Naming

- `snake_case` for functions, variables, modules
- `PascalCase` for classes
- `UPPER_SNAKE` for constants

## Type Hints

Pragmatic approach:

- Type all public function signatures
- Type API boundary inputs/outputs
- Type complex logic where intent isn't obvious
- Skip obvious internals — lean on inference

## Docstrings

- Docstrings on all public functions and classes
- Brief description, parameters with types, return value
- Route handlers use OpenAPI 3.1 format (see `docs/standards/api.md`)

## Error Handling

Boundary-only:

- Catch and handle errors at route handlers and CLI entry points
- Let internal code (services, utilities) raise naturally
- No defensive try/catch in business logic unless it's a critical path (auth, data writes)
- Use custom exception classes for domain errors (e.g., `NotFoundError`, `ValidationError`)

## Code Style

- Follow PEP 8
- Use `ruff` for linting and formatting when tooling is set up
- Max line length: 99 (ruff default)

## Dependencies

- Conservative. Only add packages when stdlib or existing deps can't do the job reasonably
- `venv` + `requirements.txt` for dependency management
- Pin versions in requirements.txt

## Project Layout

```
backend/
  app/
    api/          # Flask blueprints — thin route handlers
    models/       # SQLAlchemy models — data + serialization only
    services/     # Business logic layer
    utils/        # Decorators, error classes, helpers
    seed/         # CLI commands for data seeding
  config.py       # Environment-driven configuration
  run.py          # Entry point
```

## Patterns

- **Service layer:** Routes validate input and delegate to services. Services contain business logic and call models/DB. Models define data structure and serialization (`to_dict()`). No business logic in models or route handlers.
- **Factory pattern:** Use `create_app()` factory for Flask application creation.
- **Configuration:** Read from environment variables with sensible defaults. Never hardcode secrets or environment-specific values. Currently a single `Config` class; split into `DevConfig`/`TestConfig`/`ProdConfig` subclasses when multiple environments are needed.

### Service Layer Contract

Services are plain function modules (not classes). Each service file maps to a resource (e.g., `campaign_service.py`).

**Exception contract between services and routes:**

| Operation | Not found | Validation error | Missing parent |
|-----------|-----------|-----------------|----------------|
| Get/List  | Return `None` or `[]` | — | — |
| Create    | — | Raise `ValueError` | Raise `LookupError` |
| Update    | Return `None` | Raise `ValueError` | — |
| Delete    | Return `False` | — | — |

**Example service function:**

```python
def create_campaign(user_id: str, data: dict) -> CampaignDict:
    if not data.get("name") or not data.get("ruleset_id"):
        raise ValueError("name and ruleset_id are required")

    ruleset = Ruleset.query.get(data["ruleset_id"])
    if not ruleset:
        raise LookupError("Ruleset not found")

    campaign = Campaign(user_id=user_id, name=data["name"], ...)
    db.session.add(campaign)
    db.session.commit()
    return campaign.to_dict()
```

**Example thin route handler:**

```python
@bp.route("/api/campaigns", methods=["POST"])
@jwt_required
def create_campaign():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body required"}), 400
    try:
        campaign = campaign_service.create_campaign(request.current_user.id, data)
    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except LookupError as e:
        return jsonify({"error": str(e)}), 404
    return jsonify({"campaign": campaign}), 201
```
