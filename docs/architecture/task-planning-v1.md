# Task planning persistence — DXOS-FEATURE-EXPANSION-001

Documented before schema changes. Add two Work-owned tables; preserve existing Task JSON and historical migrations.

- task_checklist_items: UUID id, organizationId, taskId, title varchar(200), isCompleted boolean default false, createdAt/updatedAt datetime(3). Composite tenant/task restrictive FK. Chronology index organizationId/taskId/createdAt/id. Maximum 100 rows per task enforced inside serializable transaction; parent lookup serializes concurrent creation.
- task_reviewers: taskId primary UUID, organizationId, employeeId, createdAt/updatedAt datetime(3). Composite organizationId/taskId restrictive FK to Task; composite organizationId/employeeId restrictive FK to Employee. Tenant/task unique key and employee reference index. Historical reviewer assignment can remain when an employee becomes inactive; effective reassignment validates eligibility. Removing the assignment does not delete Employee.

Migration will create empty tables only, with no backfill or existing row updates, no new permissions/dependencies and no schema rewrites. MySQL 8.0.44 / Prisma 6.19.3 remain. New backend deploy requires migration first. Rollback: deploy prior backend, archive any new checklist/reviewer data, then a separately reviewed forward migration may drop only these new tables and their indexes; never edit migration history or silently drop production data. No local database migration is considered applied until deploy/status/live schema checks succeed.

Checklist rows are Work checklist items, not recursive tasks. Reviewer designation is an optional planning reference and does not grant authority or change existing Task completion semantics. See contracts/api/tasks/planning.md.
