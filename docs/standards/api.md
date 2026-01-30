# API Design Standards

## Response Format

- **Raw data + HTTP status codes.** No envelope pattern.
- Return data directly as JSON. Use standard HTTP status codes (200, 201, 400, 404, 500).
- Paginated endpoints include pagination fields at top level alongside results.
- Error responses always use a consistent shape:

```json
{"error": "Short message", "detail": "Optional additional context"}
```

## Status Codes

| Code | Usage |
|------|-------|
| 200  | Success (GET, PUT) |
| 201  | Created (POST) |
| 204  | Deleted (DELETE, no body) |
| 400  | Bad request / validation error |
| 401  | Not authenticated |
| 403  | Not authorized |
| 404  | Resource not found |
| 409  | Conflict (duplicate, stale data) |
| 500  | Server error |

## Route Handler Pattern

Route handlers are **thin**:

1. Extract and validate input (params, query, body)
2. Call the appropriate service function
3. Return the result as JSON with the correct status code

No business logic in route handlers.

## OpenAPI 3.1 Docstrings

Every route handler must have an OpenAPI 3.1-compatible docstring. The docstring should be structured so it can be parsed to generate a valid OpenAPI spec for Swagger/Postman import.

### Format

```python
@bp.route('/campaigns', methods=['POST'])
@jwt_required
def create_campaign():
    """
    Create a new campaign.

    ---
    tags:
      - Campaigns
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [name, ruleset_id]
            properties:
              name:
                type: string
                description: Campaign name
              description:
                type: string
                description: Optional campaign description
              ruleset_id:
                type: string
                format: uuid
                description: UUID of the ruleset to use
          example:
            name: "Lost Mines of Phandelver"
            description: "Starter campaign"
            ruleset_id: "abc-123"
    responses:
      201:
        description: Campaign created
        content:
          application/json:
            schema:
              type: object
              properties:
                id:
                  type: string
                name:
                  type: string
                ruleset_id:
                  type: string
      400:
        description: Validation error
      401:
        description: Not authenticated
    """
```

### Requirements

- Summary (first line) is brief and imperative
- `tags` groups the endpoint by resource
- All path and query parameters documented with type and description
- Request body includes schema with `required`, `properties`, and `example`
- Response includes schema for the success case
- Error responses documented (at minimum 400, 401 for protected routes)

## Naming Conventions

- Resource-based URLs: `/api/campaigns`, `/api/campaigns/<id>`
- Nested resources for ownership: `/api/campaigns/<id>/characters`
- Query parameters for filtering/pagination: `?type=spell&search=fire&page=2&per_page=50`
- Use kebab-case for multi-word URL segments

## Authentication

- Protected endpoints require `Authorization: Bearer <token>` header
- Use the `@jwt_required` decorator
- Current user available via the decorator's injected context
