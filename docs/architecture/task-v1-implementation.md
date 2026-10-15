# Task V1 implementation — DXOS-DOMAIN-005

## Contract revision and boundaries before implementation

DOMAIN-005 explicitly replaces the unimplemented createdByMembershipId design with creatorEmployeeId. Derive it from the authenticated User's ACTIVE Employee in the selected organization; no profile returns 404, inactive profile returns 409 after authorization. Reject client creator fields. Existing JWT/User/session/membership remains the security identity. Creator provenance is immutable; later authorized updates do not require an actor Employee profile and confer no rights from creator/assignee identity.

WorkModule owns Task CRUD. It calls EmployeesService for narrow transactional eligible creator/assignee queries (ACTIVE Employee, User and membership) and DepartmentsService for ACTIVE same-tenant reference checks. All checks run in the same serializable transaction as Task/audit/notification writes. No cross-domain table writes. Historical inactive references remain until explicitly changed; no Employee/Department cascade updates. Task department need not equal assignee department.

Field-specific permission selection delegates to the existing AuthorizationService; it is not another grant model. GET requires task:read; POST task:create plus task:assign for non-null assignee; PATCH assignment-only task:assign, content-only task:update, mixed both. Supplied assignee requires assign even if unchanged or null on PATCH. Repeat the exact field matrix inside transactions, never depend on an HTTP guard alone. New catalog keys confer no automatic admin/owner grants.

The existing NotificationService accepts the originating transaction and validates recipients. Extend its bounded catalog with task.assigned and a sole taskId UUID metadata field/fixed text. Assignment notice commits atomically with Task and audit; it is not externally visible until commit. Suppress self-assignment, unchanged assignment, unassignment and ordinary edits. Repeated identical PATCH is a no-op; serializable retries roll back intermediate notifications. No global delivery/idempotency-key guarantee for repeated POST, queue or bus. Audit task.created/updated, task.assigned and task.status_changed uses bounded field names only; no title/description/phone or arbitrary metadata.

## Additive migration plan

No Task model exists before this task. Migration 20260910000000_task_v1 creates only tasks with UUIDs, creator/optional assignee Employee, optional Department, bounded title/nullable description, TODO/IN_PROGRESS/DONE/CANCELLED, LOW/MEDIUM/HIGH/URGENT, nullable UTC dueAt and timestamps. Default TODO/MEDIUM. Composite restrictive organization+Employee/Department foreign keys enforce tenant integrity, plus direct Organization FK. Inverse relation fields do not alter existing stored columns or lifecycle behavior.

Unique organizationId/id supports tenant-scoped detail and keyset list. Creator/assignee/department tenant-leading indexes support required FKs; status/id and priority/id tenant indexes serve the explicit list filters. No generic search or combined-every-filter indexes. Description is VARCHAR(10000); timestamps DATETIME(6) with API millisecond precision. dueAt must include timezone, calendar-valid date and fit UTC year 1000–9999; past timestamps allowed, fractions limited to milliseconds to avoid silent truncation.

Before deploy compare canonical database with the pre-Task schema and verify applied migration checksums. Replay all history in disposable test/shadow databases. Deploy the additive migration only after validation, then inspect live schema/drift. MySQL 8.0.44/Prisma 6.19.3 remain unchanged. Migration inserts no roles, identities, grants or notifications. Rollback application exposure first; preserve task data. Dropping the table needs separate backup/approval and is not automatic. Historical migrations remain untouched.

Terminal DONE/CANCELLED tasks reject any effective edits (409), not just reopening. Same normalized values are no-op and preserve timestamp/audit. No Project, comments, workflow, attachment, AI, hierarchy or frontend implementation.

## Canonical database verification (2026-09-10)

Applied 20260910000000_task_v1 to local dx_os on MySQL 8.0.44. All 11 migration checksums match disk and status is up to date. Live tasks has 12 columns and four restrictive foreign keys, including tenant-composite Employee and Department references. Pre-deploy and post-deploy schema comparisons found no drift. Existing application row counts remain unchanged; no identities or grants were provisioned. Prisma Client generation and schema validation passed on 6.19.3.
