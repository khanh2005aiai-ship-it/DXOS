# Employee V1 implementation — DXOS-DOMAIN-004

## Contract revision before implementation

The explicit DOMAIN-004 brief supersedes the unimplemented DOMAIN-002 Employee design: use userId rather than client membershipId, require immutable employeeCode, and add nullable jobTitle/phone. No shipped Employee API exists to break. Update the Employee contract/OpenAPI and frontend handoff together; old planned payloads using membershipId must be revised before integration. Membership remains authoritative through a composite (organizationId,userId) FK to OrganizationMembership; no redundant membershipId column or duplicated credentials.

Employee fields: UUID id/organizationId/userId; nullable departmentId; canonical immutable employeeCode (same normalization/rules as Department code); displayName 1–200; nullable jobTitle 1–200; nullable phone in E.164-style syntax (+ followed by 8–15 digits, first digit nonzero), treated as a business contact, not verified identity; ACTIVE/INACTIVE default ACTIVE; UTC timestamps. Optional strings are trimmed, no controls; null clears them. Tenant-wide employee:read exposes this minimal business directory, including supplied business contact. No private HR dossier or User credential projection.

PeopleModule owns Employee CRUD. OrganizationMembershipService provides a narrow, read-only transactional target eligibility check; DepartmentsService provides a narrow active-reference check. These trusted internal validators run only after Employee service authorizes the actor in the same serializable transaction, and are not public provisioning/read APIs. No cross-domain table writes. Inactive historical target membership/department may remain referenced; ordinary label edits/deactivation/clearing references remain allowed. Reactivation checks User/membership; changed non-null department checks ACTIVE in same tenant. Employee status never changes IAM or grants.

## Additive migration plan

No Employee model exists before this task. Add one employees table and EmployeeStatus enum with unique (organizationId,userId), (organizationId,employeeCode), (organizationId,id). Restrictive FKs: organization, User, composite membership, composite nullable department. Add userId FK index and (organizationId,departmentId) reference/filter index; existing tenant-leading unique indexes serve keyset list access. No speculative indexes or changes to existing table data. Prisma inverse relation fields do not modify existing columns. MySQL 8.0.44 and Prisma 6.19.3 remain fixed.

Migration 20260909010000_employee_v1 creates only the new table and its constraints. Inspect canonical history/checksums and pre-change drift before deploy. Replay in disposable test/shadow databases, verify FK isolation, then deploy and compare live schema. Existing Department and historical migrations remain unchanged. Roll back application exposure first and preserve employee data; dropping the table is a separate destructive operation requiring backup/approval, not an automatic rollback. No membership/grant/backfill data is inserted by migration.

Audit employee.created/updated joins the mutation transaction, includes verified actor/tenant/requestId and bounded field names only. No-op edits emit no audit or timestamp change. No notification, Task, provisioning or AI implementation.

## Deployment verification (2026-09-10)

Canonical local dx_os reported MySQL 8.0.44, nine applied migrations with matching checksums and no difference against the pre-Employee schema. Employee table was absent. Applied only 20260909010000_employee_v1 using Prisma migrate deploy; all ten migrations now report applied. Live schema comparison returns no difference. Verified 11 Employee columns, four restrictive FKs and the intended tenant uniqueness/indexes. Existing User/membership/Department/role/permission/session row counts did not change; migration creates no access records. Prisma Client 6.19.3 generated and schema validation passed after deploy.

The Department-specific JSON parser implementation is now shared under common/http/business-json.ts for the two actual business APIs. Department's existing export remains a compatibility alias, and its HTTP limits/behavior are unchanged. Employee and Department decoded JSON both use 64 KiB; other endpoints retain their existing default parsing. No new framework or dependency.
