# Audit logging — DXOS-AUDITLOG-001

## Persistence and migration plan

Add an append-only AuditEvent table using MySQL, UUID CHAR(36), UTC DATETIME(6),
bounded JSON metadata, nullable organization and actor FKs with restrictive deletes.
There is no updated_at. The service sets timestamps at millisecond precision so
Prisma cursor comparisons preserve ordering. Index (organization_id,created_at,id)
supports the descending tenant feed; (organization_id,event,created_at,id) supports
the only optional event filter; actor_user_id supports its foreign key. No history
is rewritten. Apply the new migration before deploying dependent code. Rollback must
preserve/export audit evidence; do not drop the table or cascade-delete evidence.

No audit:read grant is seeded. In a reviewed operator provisioning procedure, upsert
the global Permission definition using PERMISSIONS.AUDIT_READ, then call the trusted
RbacAssignmentService.grantPermissionToRole with the intended organization/role. That
service records the grant confirmation; it is not a public actor-authorized endpoint.

## Reliability and scope

Successful login/session issuance, refresh rotation, logout, organization creation
and update, and trusted RBAC provisioning persist audit records in the same database
transaction as their mutation. Audit failure rolls back the mutation. Login failures
and organization-permission HTTP guard denials persist synchronously in a separate
write before returning 401/403. Audit failure surfaces through the existing safe 500
envelope and never grants access. No queues, best-effort swallowing, or retrying login
mutations outside their transaction. Organization serializable retries roll back
their audit rows too, avoiding duplicate evidence from failed attempts.

Authentication events and denied authorization events are global (organization null).
A rejected route tenant is untrusted and is not stored as an audit organization or
metadata. The tenant query never exposes global events. Only organization-permission
guard denials are audited, once per request; internal can checks, missing/invalid
JWTs, DTO validation, refresh rejection and service-only authorization rechecks are
not separately audited. No fictitious lifecycle events: lifecycle currently has no
application mutation API. Direct SQL maintenance is outside this application log.

## Identity and metadata

Use the existing request ID via AsyncLocalStorage; no second correlation ID is made.
JwtAuthGuard supplies the authenticated actor context. Login uses its verified user
ID; unknown/bad-password attempts have no actor and no attempted email. Background
calls have SYSTEM source and may have a null actor. Organization IDs come from
server-side authorization/provisioning, never an audit request body. Internal callers
are trusted code; HTTP clients have no record/create endpoint.

Metadata is an allowlist of enum reason, catalog permission, and changedFields=[name].
Unknown keys, nested arbitrary values, unsupported strings, oversized metadata
(1024 UTF-8 bytes), invalid IDs, actor mismatches and unknown events are rejected.
Names, before/after content, emails, request bodies, headers, IPs, user agents,
credentials, session IDs, passwords and tokens are not captured. Event descriptors
determine outcome and resource type, and source/timestamp/request ID are server-set.

## Access and immutability

GET /organizations/:organizationId/audit-logs requires existing JWT and organization
RBAC audit:read, and rechecks authorization in the query transaction. No default
grant is added. Operators may provision audit:read through the trusted RBAC service.
The API/service expose append and bounded read only, never update/delete. This
protects against application users, not compromised server code, database accounts
with direct SQL write access, or a DBA. Deployment should restrict direct table
UPDATE/DELETE privileges for runtime accounts; no ACL or database account changes
are performed here. No tamper-proof, cryptographic or compliance claim is made.

Retention, privileged global investigations and export are future concerns. There
is no deletion scheduler or public deletion endpoint. Restrictive FKs require any
future user/organization purge to explicitly resolve evidence-retention policy.

## Validation

196 tests in 15 suites pass, including the 147 existing tests. Coverage includes real
MySQL transactional rollback for failed audit writes during login, refresh, logout,
organization bootstrap and rename; tenant and actor FKs; explicit audit-read access;
global-event isolation; metadata rejection/bounds; request correlation; denial
persistence; immutable public behavior; and bounded cursor pagination. The complete
five-migration shadow replay and live test-schema comparison pass without drift.
