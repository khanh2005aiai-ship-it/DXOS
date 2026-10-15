# Permission provisioning — DXOS-PERMISSION-001

The permission provisioning API manages existing organization memberships and roles. It never creates an implicit administrator and never accepts client supplied permissions. All routes require a valid Bearer session and an active membership in the route organization.

`GET /api/v1/organizations/{organizationId}/roles` requires `role:read` and returns a tenant-scoped keyset page of safe role metadata: `id`, `key`, `name` and `isActive`. Both active and inactive defined roles are returned so operators can distinguish lifecycle state; permission assignments and internal database fields are excluded. Results are ordered by role UUID ascending, with `limit` (1–100, default 25) and an optional `after` UUID cursor.

`GET /api/v1/organizations/{organizationId}/members` requires `role:read` and returns a tenant-scoped page of safe user, membership, employee and role summary fields. Password hashes, sessions, tokens, permission joins and storage secrets are excluded.

`POST /api/v1/organizations/{organizationId}/members/{membershipId}/roles` requires `role:assign` and a strict `{roleId}` body. The target and role must belong to the same organization and be active. An actor cannot assign a role to themself, and every permission on the role must already be effective for the actor. Assignment and `rbac.role.assigned` audit recording commit atomically.

`DELETE /api/v1/organizations/{organizationId}/members/{membershipId}/roles/{roleId}` uses the same actor permission and tenant checks. Self mutation is denied. Revocation and `rbac.role.revoked` audit recording commit atomically; revoking an absent assignment is an idempotent no-op.

Invalid or missing credentials return 401. An authenticated caller without the required grant, an inactive route organization, or a foreign route context returns 403. Missing same-tenant members or roles return 404; inactive targets and roles return 409. Unknown body/query fields and malformed UUIDs return 400. Authorization, target lookup, privilege-ceiling checks and uniqueness checks are repeated inside a serializable transaction.

Role discovery is a collection read and does not accept a role ID filter; therefore it does not return 404 for a missing role. Invalid or foreign organization context remains 403, while malformed pagination input is 400. A foreign role cannot appear in, or be used to select, the returned catalog.
