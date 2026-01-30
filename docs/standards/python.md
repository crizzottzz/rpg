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
- **Configuration:** Read from environment variables with sensible defaults. Never hardcode secrets or environment-specific values.
