# Audit logs — DXOS-AUDITLOG-001

Task V1 extension: task.created/task.updated/task.assigned/task.status_changed use resourceType task. task.updated allows 1–8 unique changed-field names from title, description, assigneeEmployeeId, departmentId, status, priority, dueAt and progressPercent. task.assigned allows only assigneeEmployeeId; task.status_changed only status. No field values; existing metadata policies and 1024-byte bound stay intact. Task, audits and optional assignment notification commit together; no-op/rollback emits no false success. Task planning adds task.checklist.added/task.checklist.updated/task.checklist.removed/task.reviewer.changed with resourceType task and empty metadata. Checklist title, reviewer identity and all values are omitted; mutations/audits commit atomically and no-op reviewer/checklist updates produce no success event.

## GET /api/v1/organizations/:organizationId/audit-logs

Requires existing bearer JWT authentication, an active account/organization/membership,
an active assigned organization role and explicit audit:read. No ordinary member or
creator is granted audit:read automatically. Provisioning uses the existing trusted
RBAC service. UUID route context is authoritative. Query/body/header tenant or actor
fields cannot select another tenant. No public global audit query exists.

Query: limit (integer 1–100, default 25), optional after (UUID previous nextCursor),
optional event (exact centralized catalog event). Unknown query fields are rejected.
The cursor must belong to the same organization and event filter; unknown/foreign
cursors return the same 400. Ordering is createdAt descending, then UUID id descending
to break ties. The service writes millisecond timestamps into DATETIME(6), preserving
precision through Prisma. At most limit+1 rows are fetched. Pagination is a live feed,
not a frozen snapshot; new events may appear before previously fetched pages.

200: `{ "items": [AuditEvent], "nextCursor": "UUID or null" }`.
AuditEvent fields: id (UUID), organizationId (UUID/null), actorUserId (UUID/null),
event, resourceType, resourceId (UUID/null), outcome (SUCCESS/FAILURE/DENIED), source
(HTTP/SYSTEM), requestId (string/null), metadata (object) and createdAt (UTC timestamp).
Tenant queries only return non-null organizationId matching the route. Global login,
refresh/logout and authorization-denial records are never included in this endpoint.
User/organization names and credentials are not joined into responses.

Metadata permits only enum reason, catalog permission and changedFields=[name], with
a 1024-byte UTF-8 bound. Unknown keys/values, sensitive data and nested arbitrary data
are rejected by the writer. No request bodies, headers, cookies, emails, credentials,
session IDs or tokens are stored. HTTP correlation uses the existing X-Request-Id.
Actor IDs are supplied by authenticated/server code; system events may omit actor.

Department V1 extension: department.created and department.updated use resourceType
department and the mutation transaction. Only department.updated additionally allows
1–3 unique changedFields selected from name, description and status. Existing event
allowlists stay unchanged. Values of names/descriptions are never copied. No-op
updates and rejected/rolled-back mutations do not create success records.

| HTTP | Code | Meaning |
| --- | --- | --- |
| 400 | VALIDATION_FAILED / BAD_REQUEST | Invalid query or unavailable cursor. |
| 401 | UNAUTHORIZED | Missing/invalid/expired/revoked IAM credential or unusable account/session. |
| 403 | FORBIDDEN | Inactive tenant/member, missing audit permission, or inaccessible/malformed tenant context. |
| 500 | INTERNAL_ERROR / DATABASE_ERROR | Operational failure, including audit persistence failure. |

All errors use the existing error envelope and requestId. Write/delete endpoints do
not exist; unsupported methods on this audit route return 404. AuditService has no
update/delete methods. Direct SQL administrators remain outside this application
immutability guarantee. Retention and privileged deletion policy are deferred.

## Recorded behavior

- notification.created: internal durable notification creation, in the originating transaction. Resource type is notification; reads are not audited.

- auth.login.success / auth.login.failure: credential verification outcome; unknown
  and wrong-password attempts omit actor/email. Inactive/suspended verified users have
  a safe reason and actor ID. Login success is atomic with session issuance.
- auth.refresh / auth.logout: successful session rotation/revocation, transactionally
  coupled. Logout records only when a session was actually revoked.
- organization.created / organization.updated, membership.created, rbac.role.created,
  rbac.role.assigned, rbac.role.revoked, rbac.permission.granted: actual
  provisioning/rename operations, persisted in their mutation transaction. Public role
  assignment/revocation records only a committed state change; idempotent no-ops do
  not emit success events. Organization transaction retries do not leave duplicate
  committed audit rows.
- security.authorization.denied: once at an HTTP organization permission guard's
  denial, stored globally without the untrusted attempted organization identifier.

No separate audit events for invalid JWT, refresh rejection, DTO rejection, internal
can checks or service-only rechecks. No lifecycle mutation endpoint exists, so direct
SQL suspension/archive is not represented as a fabricated application event.

Audit failure rolls back successful mutation transactions. Failure/denial recording
is synchronous before returning the normal 401/403; if storage fails, the operation
remains denied and returns safe 500. Existing successful response schemas and normal
IAM error codes are unchanged. No queue, export, analytics, retention job or UI added.

File foundation records file.uploaded and file.deleted with resource type file. File content, filename, checksum and storage key are omitted from audit metadata. Existing authorization-denial events cover denied file permissions.

AI admission/success/failure records use ai.request.started, ai.request.succeeded and ai.request.failed with resource type ai; no prompt/response metadata.

Employee V1 adds employee.created/employee.updated with resource type employee. Only employee.updated accepts 1–5 unique changed-field names from displayName, jobTitle, phone, departmentId and status. No field values or contact information are recorded. The 1024-byte bound and existing event-specific policies remain intact. Audit and profile mutation commit atomically; no-op updates emit no audit.
