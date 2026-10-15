# API contracts

This directory is the source of truth for frontend-facing API contracts. One Markdown file is required per public API area, and must state endpoint, HTTP method, authentication, authorization, request/response schemas, validation, error responses, pagination, filtering, and sorting where applicable.

All endpoints are versioned under /api/v1. All failure responses use the shared error envelope in error-envelope.md. Any future breaking change must document the prior contract, frontend impact, migration strategy, and whether the change is breaking.

Authentication endpoints are documented in `auth/authentication.md`. They are additive and do not expose user password hashes or session persistence records.

Organization authorization is documented in `auth/authorization.md`; this foundation adds no public endpoints.

DXOS-ORG-001 adds the four organization endpoints documented in `organizations.md`.

DXOS-AUDITLOG-001 adds the explicit-permission audit query in `audit-logs.md`.

DXOS-NOTIFY-001 adds recipient-owned organization notifications in `notifications.md`.

DXOS-FILES-001 adds the protected file lifecycle in files.md.
DXOS-BACKEND-001 adds tenant-scoped available-file listing and authenticated permission discovery in permissions.md.

DXOS-AI-001 adds tenant-authorized generation in ai.md.
