# Backend foundation — DXOS-FOUNDATION-001

## Implemented request lifecycle

1. NestJS starts only after environment variables pass validation.
2. The request-context middleware accepts a safe client X-Request-Id or creates a UUID, returns it in the response header, and stores it on the request.
3. Helmet applies baseline HTTP security headers and explicit CORS middleware evaluates the request origin against configured origins.
4. Routes run under /api/v1; global DTO validation transforms input, strips and rejects unknown properties, and reports failures through the standard error envelope.
5. The global exception filter converts known HTTP failures and unexpected errors to safe, stable responses. It never returns stacks, credentials, filesystem paths, or original unexpected-error messages.
6. On response completion, a structured JSON log has timestamp, level, request ID, method, path without query string, status, duration, and an error code when relevant. Request bodies, query parameters, and headers are not logged.

## Implemented configuration

NODE_ENV is restricted to development, test, or production. Port, API prefix, log level, boolean switches, and CORS origins are validated at startup. Production requires an explicit CORS_ORIGINS list and rejects wildcard origins. SWAGGER_ENABLED defaults to false in production and true elsewhere.

## Implemented API documentation

The API publishes an OpenAPI-compatible JSON foundation document only when documentation is enabled. The current document covers health and the shared error schema; its source-of-truth frontend contract remains contracts/api.

## Implemented by subsequent foundation tasks

Database access, IAM authentication, hashed refresh sessions, password handling, and current-user identity are implemented by DXOS-DATA-001 and DXOS-IAM-001. RBAC, tenant context, audit logging, file storage, notifications, and business modules remain deliberately out of scope for this foundation document. Production authentication rate limiting uses shared Redis state; development/test may use a bounded local fallback.
