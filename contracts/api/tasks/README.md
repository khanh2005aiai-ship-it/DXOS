# Work Management / Task V1 — DXOS-DOMAIN-005 / DXOS-WORK-002

DXOS-WORK-002 adds [comments, file attachments and progress](collaboration.md). DXOS-FEATURE-EXPANSION-001 adds [reviewer, checklist and safe activity history](planning.md). Task responses gain progressPercent and PATCH accepts it. Existing status-only requests remain supported. The linked contracts supplement the V1 rules below.

Implemented additive API, included in served OpenAPI. [Common rules](../business-v1.md) apply. The explicit DOMAIN-005 brief supersedes the unimplemented createdByMembershipId design: the server derives creatorEmployeeId from the actor's ACTIVE Employee profile. Old planned creator/membership fields must not be sent. No existing shipped Task endpoint is broken.

Base: `/api/v1/organizations/:organizationId/tasks`.

| Method/path | Permission | Request | Success |
| --- | --- | --- | --- |
| GET base | task:read | limit/after; optional status, priority, assigneeEmployeeId, departmentId | 200 `{items:[Task],nextCursor:UUID-or-null}` |
| POST base | task:create; also task:assign for non-null assignee | `{title,description?,assigneeEmployeeId?,departmentId?,priority?,dueAt?}` | 201 Task |
| GET base/:taskId | task:read | UUID | 200 Task |
| PATCH base/:taskId | Supplied-field matrix below | Nonempty subset `{title,description,assigneeEmployeeId,departmentId,status,priority,dueAt,progressPercent}` | 200 Task |

Task response: `{id,organizationId,creatorEmployeeId,assigneeEmployeeId,departmentId,title,description,status,progressPercent,priority,dueAt,createdAt,updatedAt}`. Assignee/department/description/dueAt nullable. UUIDs and UTC ISO timestamps. No nested Employee/User, phone, credentials, sessions, grants or storage projections. Status defaults TODO, progressPercent 0; priority defaults MEDIUM. Client POST status/progressPercent rejected. IDs, organization, creator and timestamps are server-owned and immutable through this API.

## Identity and references

Authenticated User remains the security identity. Creating a Task requires an existing ACTIVE Employee in the route organization for that actor; missing profile returns 404, inactive profile 409 after authorization. Creator is derived, never client-controlled; reject creatorEmployeeId, creatorUserId, createdByMembershipId or other unknown fields. Creation never creates a User, Employee, membership, role, permission or session. Later authorized list/detail/update does not require an actor Employee profile: creator and assignee confer no implicit permission.

Non-null new assignee must be an ACTIVE Employee in this tenant with ACTIVE User and membership. Arbitrary User IDs are not accepted. New department must be ACTIVE in this tenant. Task department can differ from the assignee's department. Both have composite tenant-aware restrictive FKs, as does creator. Referenced history is preserved; no cascade profile/unit updates or deletion API. Changing an Employee's department does not move Tasks.

On update, unchanged historical assignee/department may remain inactive; unrelated edits and clearing references remain allowed while the Task is nonterminal. Effective reassignment revalidates the new target. Null unassigns/removes department. EmployeesService and DepartmentsService validate references inside the same serializable transaction after actor authorization; Work writes only its own rows and calls central audit/notification services.

## Field authorization

| Supplied PATCH fields | Required grants |
| --- | --- |
| assigneeEmployeeId only, including null or unchanged value | task:assign |
| Other fields only | task:update |
| assigneeEmployeeId plus other fields | task:assign AND task:update |

Empty/malformed PATCH requires baseline task:update before validation. Unknown fields are rejected; adding them cannot downgrade the grant requirement. Permission checks use existing AuthorizationService before DTO/resource lookup and repeat inside the transaction using the same field matrix. No new authorization system and no automatic owner/admin grants. Mutation grants permit the safe resulting resource response; list/detail independently require task:read. Employee/Department read grants are not implicitly needed for mutation reference validation; UI selectors separately need employee:read/department:read. Notification does not grant task:read.

## Validation and lifecycle

Title: trim, 1–200 characters, no controls. Nullable description: trim, 1–10000 characters when supplied, only LF/tab controls permitted. Empty string is invalid; send null to clear nullable fields. Priority LOW/MEDIUM/HIGH/URGENT. Status TODO/IN_PROGRESS/DONE/CANCELLED. Non-null UUID references canonicalized to lowercase. Unknown fields, client ownership, grant injection, attachments and nested persistence inputs rejected.

dueAt: valid calendar timestamp with seconds and explicit Z or numeric offset; optional fractional seconds 1–3 digits. Normalize to UTC, allowing only resulting UTC year 1000–9999. Reject impossible dates, date-only/local-time strings, leap seconds and excess precision rather than silently truncating. Past timestamps represent overdue work and are allowed. Null clears dueAt. Timestamps are returned with millisecond precision; equivalent offsets compare as the same instant for no-op handling.

| Current | Allowed next |
| --- | --- |
| TODO | TODO (no-op), IN_PROGRESS, DONE, CANCELLED |
| IN_PROGRESS | IN_PROGRESS (no-op), TODO, DONE, CANCELLED |
| DONE | DONE only (no-op) |
| CANCELLED | CANCELLED only (no-op) |

DONE/CANCELLED reject **all effective changes** with 409, including title, due date or assignment edits. No reopen/delete. A fully normalized no-op preserves updatedAt and emits no audit/notification. Completion needs neither assignee nor due date. Concurrent updates serialize read/check/write with bounded conflict retries; no optimistic version or idempotency key. Repeated POST can create distinct Tasks, so do not blindly retry it.

## List and errors

ID ascending keyset pagination: limit integer 1–100/default 25, after UUID exclusive lower bound. Only exact single-value status/priority/assigneeEmployeeId/departmentId filters, combined with tenant scope. Omitted filters include all states. Foreign/missing reference filter returns an empty page. Cursor is not a lookup or authorization token. No generic query/search/sort, total count or snapshot guarantee. Unknown query fields rejected on every route.

JSON only, decoded limit 64 KiB (including compressed/chunked input). Parser-level malformed input 400 BAD_REQUEST or oversize 413 PAYLOAD_TOO_LARGE may occur before guards. Valid transport follows JWT/session → active tenant membership/grants → DTO → scoped resource/reference → transaction rechecks. Non-JSON writes return 400 after authorization.

| HTTP | Code | Meaning |
| --- | --- | --- |
| 401 | UNAUTHORIZED | Missing/invalid/expired/revoked session or inactive actor User |
| 403 | FORBIDDEN | Invalid/inaccessible tenant, inactive actor membership or missing required grant(s) |
| 404 | NOT_FOUND | Missing/foreign Task/Employee/Department, or missing creator profile in the authorized tenant |
| 409 | CONFLICT | Inactive/ineligible new creator/assignee/department, terminal edit/invalid transition, or exhausted serializable retries |
| 400 | VALIDATION_FAILED / BAD_REQUEST | Invalid DTO/query/UUID or malformed transport |
| 413 | PAYLOAD_TOO_LARGE | Decoded body exceeds 64 KiB |
| 500 | INTERNAL_ERROR / DATABASE_ERROR | Operational failure; mutation/audit/notification roll back |

Existing error envelope/requestId. Foreign and missing resources return the same safe response; do not disclose foreign names/status/users. Guard denials use the existing global authorization-denied audit taxonomy.

## Audit and notifications

Actual successful writes record task.created/task.updated. Initial non-null assignment and effective assignment/unassignment also record task.assigned; effective status transitions record task.status_changed. Each has tenant, verified actor, requestId, Task UUID and outcome. task.updated changedFields contains only unique title/description/assigneeEmployeeId/departmentId/status/priority/dueAt/progressPercent names (max eight). Assignment/status descriptors only permit their respective single field name. Overall metadata limit 1024 UTF-8 bytes. No field values, free-text snapshots or new audit tables; earlier event policies stay unchanged.

New non-self non-null assignment calls existing NotificationService with task.assigned, fixed title/body and only taskId metadata, addressed to the eligible Employee's User in the same tenant. Suppress self-assignment, unchanged assignment, unassignment and ordinary edits. Reassignment to a different Employee sends one notice to that new recipient; prior notices remain historical. Following a notice still requires task:read.

Task mutation, Task audits, notification and its notification.created audit commit atomically, becoming visible only after commit. Any failure rolls back all. Concurrent/retried identical PATCH produces one effective assignment notice via serializable recheck/no-op, not a new deduplication subsystem. No email/bus/delivery worker, and no exactly-once guarantee for unrelated/repeated POST commands.

Initial migration: `20260910000000_task_v1`; collaboration: `20260914000000_task_collaboration`; planning: `20260915000000_task_planning`. Work links existing Files through a validated reference. No AI calls, Projects, workflows or calendar API are introduced by this contract.
