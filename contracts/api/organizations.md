# Organization API — DXOS-ORG-001

All endpoints require Authorization: Bearer with an active IAM session. They are
additive under /api/v1; existing IAM and health responses do not change. All failures
use the existing error envelope, including error.code, safe message and requestId.

## Responses

Organization: `{ id, name, slug, status, createdAt, updatedAt }`. IDs are opaque UUIDs;
timestamps are ISO 8601 UTC strings. Status is ACTIVE, SUSPENDED or ARCHIVED, but
these endpoints only return ACTIVE organizations. No user, session, role or permission
record is exposed. Names are strings of 1–200 characters after trimming, without
control characters. New slugs are 3–63 characters, trimmed/lowercased, and match
`^[a-z0-9]+(?:-[a-z0-9]+)*$`. Slugs are unique and immutable. Do not use them as authority.

## POST /api/v1/organizations

Body: `{ "name": "Example Company", "slug": "example-company" }`.
Both fields required; unknown fields and null values rejected. An authenticated
active user may create a new tenant without prior membership. This bootstrap policy
is enforced in AuthorizationService; there is no organization:create permission
attached to an unrelated existing tenant. The server atomically creates an ACTIVE
organization, an ACTIVE creator membership, an owner role and exactly
organization:read + organization:update grants. A failure rolls back everything.
Returns 201 with Organization. Duplicate normalized slugs return 409 CONFLICT with
no owner or existing organization details. Slug collisions are never resolved by
attaching the caller to the existing organization.

No client owner ID, user ID, membership, roles, permissions, status, system/platform
privileges or other tenant metadata is accepted. No additional grant is inferred
from the owner role name. Existing users/memberships are never modified by creation.

## GET /api/v1/organizations

Active membership discovery: returns only ACTIVE organizations where the caller has
an ACTIVE membership. A role grant is not required for this list; detailed resource
access below still requires RBAC. Other users' organizations never appear. An empty
list returns 200, not 403. Suspended, removed and inactive memberships are excluded.

Query: `limit` integer 1–100 (default 25), optional `after` UUID. Unknown query fields
are rejected. Sort is fixed by opaque ID ascending. Response 200:
`{ "items": [Organization], "nextCursor": "UUID or null" }`.
Use nextCursor as after; null means no additional row at query time. This is keyset
pagination, not a stable snapshot across requests. The cursor is only a lower bound;
it never authorizes or exposes the referenced organization. No other filtering or
sorting is supported.

## GET /api/v1/organizations/:organizationId

Requires active user, organization, membership and active assigned role granting
organization:read. Returns 200 Organization. Unknown, malformed, inaccessible,
suspended or archived organization identifiers return 403 FORBIDDEN without revealing
existence. Slugs are not valid route IDs. Headers/body/query cannot override the UUID.

## PATCH /api/v1/organizations/:organizationId

Requires organization:update under the same active-state rules. Body:
`{ "name": "New name" }`. Name is required even for PATCH; an empty object is invalid.
Only name changes. Slug, status, ownership, membership and permission inputs are
rejected, including additional snake_case or camelCase organization IDs. Returns 200
Organization. Authorization is rechecked inside the transaction before the write.

## Lifecycle and errors

Lifecycle changes are operator-managed, not exposed publicly. SUSPENDED and ARCHIVED
organizations are hidden and denied throughout organization-scoped RBAC. Tenant data
is retained, and archived slugs remain reserved. Membership ACTIVE is the only
authorizing state; INACTIVE, SUSPENDED and REMOVED deny even with stale role joins.
No removal/reactivation/invitation endpoint is introduced. REMOVED is terminal until
a future reviewed rejoining flow clears and re-provisions its grants.

| Status | Code | Meaning |
| --- | --- | --- |
| 400 | VALIDATION_FAILED | Invalid/unknown body or list-query fields. |
| 401 | UNAUTHORIZED | Missing/invalid/expired/revoked JWT or unusable IAM session (including inactive/suspended account). |
| 403 | FORBIDDEN | Membership, lifecycle, permission or organization context denied; also active-user bootstrap recheck failure. |
| 409 | CONFLICT | Duplicate slug or exhausted transaction serialization retry; safe to retry with an appropriate request. |
| 500 | INTERNAL_ERROR / DATABASE_ERROR | Safe operational failure. |

All future tenant resource reads/writes must use the same server-authorized
organization_id, never arbitrary payload ownership. No frontend code is part of this
contract addition. Audit logging remains DXOS-AUDITLOG-001.
