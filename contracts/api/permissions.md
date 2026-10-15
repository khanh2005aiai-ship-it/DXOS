# Permission Discovery API v1 — DXOS-BACKEND-001

`GET /api/v1/organizations/:organizationId/permissions` requires a bearer JWT, active User/session, active organization and active membership. The route organization is authoritative. Missing, malformed or inaccessible organization context returns 403 without disclosing tenant existence; invalid credentials return 401.

The response is `{organizationId,permissions}`. `organizationId` is the requested tenant UUID. `permissions` contains only effective catalog permission keys from the authenticated user's active membership and active roles in that organization. Duplicate grants are removed and keys are sorted ascending for stable frontend checks. A membership with no active role grants returns an empty array.

The endpoint accepts no body or query parameters. Client-supplied permission identifiers, role identifiers, user identifiers and organization overrides are rejected. It never returns role internals or another user's permissions. Successful reads do not create audit events; existing authorization-denied audit behavior applies to denied requests. Backend guards remain authoritative and this endpoint does not grant access.

The catalog includes `role:read` for member discovery and `role:assign` for the separate permission provisioning API. Neither key is granted automatically; roles must be provisioned explicitly, and role assignment is limited by the actor's effective permission ceiling.
