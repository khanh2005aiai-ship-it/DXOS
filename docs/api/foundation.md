# API foundation

## Implemented

- Public API routes are prefixed with /api/v1.
- GET /api/v1/health remains unauthenticated and keeps its existing response shape.
- X-Request-Id is accepted when it is a safe opaque identifier; otherwise the server creates a UUID. It is returned on every HTTP response.
- Error responses use the shared API error envelope in contracts/api/error-envelope.md.
- CORS allows only explicit values from CORS_ORIGINS; it is not wildcard-enabled.
- An OpenAPI-compatible JSON document is published at GET /api/v1/docs/openapi.json when SWAGGER_ENABLED=true. It describes health, authentication request/response schemas, bearer authentication, and the shared error schema.

## Planned

- Resource contracts, cursor/page conventions, filtering, and sort whitelists will be documented with the organization and business modules.
- Swagger UI can be added when the project needs an interactive developer portal; the JSON document is intentionally dependency-light at this stage.
