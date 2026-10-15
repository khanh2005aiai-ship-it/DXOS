# Organization authorization contract — DXOS-RBAC-001

DXOS-ORG-001 now exposes organization endpoints in [organizations.md](../organizations.md).
It adds active-organization checks to RBAC and an explicit active-user bootstrap policy
for tenant creation. The original foundation description follows.

This foundation adds no production endpoint or role-management API. Existing IAM
and health contracts remain compatible. Test-only routes are excluded from OpenAPI.

Future organization endpoints require bearer authentication followed by a catalog
permission check. The UUID route parameter is the authoritative organization selector;
JSON, query and header organization IDs never override it. Membership must be active
in that organization and an assigned active organization role must grant the exact
permission. A role called owner, admin or super-admin confers no implicit privilege.

Missing, invalid, expired or revoked authentication returns 401 UNAUTHORIZED. Existing
IAM also rejects sessions for inactive/suspended users with 401. Authenticated users
without membership or permission receive 403 FORBIDDEN. Invalid/missing organization
context also returns 403 without disclosing organization existence. Failures use the
shared error envelope, including requestId. Operational database errors return 500.

There are no new response schemas, pagination, sorting, filtering or request bodies.
Future resource queries must use the same authorized route organization, even when
the body contains a resource or organization identifier. Add bearerAuth and 401/403
error responses to OpenAPI when introducing a production organization endpoint.

See docs/architecture/rbac.md for provisioning boundaries and extension guidance.
