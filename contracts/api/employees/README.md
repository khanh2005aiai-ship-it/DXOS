# Employee / People V1 — DXOS-DOMAIN-004

Implemented REST contract; additive endpoints included in served OpenAPI. [Common rules](../business-v1.md) apply. The explicit DOMAIN-004 brief revises the unimplemented DOMAIN-002 design: userId replaces membershipId in requests/responses/filtering, employeeCode is required, and nullable jobTitle/phone are added. No previously shipped Employee API exists; planned frontend payloads must adopt this contract. User authentication and membership authority remain unchanged.

Base: `/api/v1/organizations/:organizationId/employees`.

| Method/path | Permission | Request | Success |
| --- | --- | --- | --- |
| GET base | employee:read | limit/after; optional status, departmentId, userId | 200 `{items:[Employee],nextCursor:UUID-or-null}` |
| POST base | employee:create | `{userId,employeeCode,displayName,departmentId?,jobTitle?,phone?}` | 201 Employee |
| GET base/:employeeId | employee:read | UUID | 200 Employee |
| PATCH base/:employeeId | employee:update | Nonempty subset `{displayName,departmentId,jobTitle,phone,status}` | 200 Employee |

Employee response: `{id,organizationId,userId,departmentId,employeeCode,displayName,jobTitle,phone,status,createdAt,updatedAt}`. IDs are UUIDs; timestamps ISO 8601 UTC. departmentId/jobTitle/phone are nullable. No nested User, email, passwordHash, session, token, membership, role or grant projection. employee:read exposes this business directory within the authorized organization, including business phone if supplied; this is not a confidential HR record.

## Validation

- userId is a required immutable UUID. The target must have an existing ACTIVE membership in the route organization and an ACTIVE User account. No global User lookup/discovery endpoint.
- employeeCode: trim and uppercase, 1–64 ASCII characters matching `^[A-Z0-9]+(?:[-_][A-Z0-9]+)*$`. Immutable; unique within organization, including inactive profiles. Same code in another organization is allowed.
- displayName: trim, 1–200 characters, no control characters. This is a professional label; global User.displayName is not modified.
- jobTitle: optional/nullable, trim, 1–200 characters and no control characters if supplied.
- phone: optional/nullable business contact. Trim; `^\+[1-9][0-9]{7,14}$` (plus followed by 8–15 digits), 9–16 total characters. For example +84901234567. No verification or telephone identity inference; no extensions/local-number normalization in V1.
- departmentId: optional/nullable UUID. Non-null on create or an effective reassignment must identify an ACTIVE department in the same tenant. department:read is not an additional mutation grant; authorized selector UI separately needs it.
- status: ACTIVE or INACTIVE, server defaults ACTIVE on create; client POST status rejected. Both transitions supported. No delete or termination workflow.

Omission on PATCH preserves a field; null clears only departmentId/jobTitle/phone. Empty PATCH, null displayName/status, unknown properties, organizationId/userId/employeeCode reassignment, membershipId, roles, permissions and credential fields are rejected. Explicit data projections prevent mass assignment. JSON only, maximum decoded size 64 KiB. Parser-level malformed JSON/oversized input returns safe 400 BAD_REQUEST/413 PAYLOAD_TOO_LARGE before guards; supported JSON reaches IAM and tenant authorization before DTO/resource validation. Non-JSON writes return 400. Malformed DTO/UUID/query values return 400 VALIDATION_FAILED. Unknown query fields are rejected on every operation.

## Tenant and lifecycle rules

One profile per `(organizationId,userId)`, including inactive rows. Composite FK to OrganizationMembership enforces actual same-tenant membership; additional direct Organization/User and composite Department FKs are restrictive. A User may have profiles in multiple organizations only through existing memberships. Creating Employee never creates or updates User credentials, OrganizationMembership, Role, Permission, RolePermission, MembershipRole or AuthSession. Migration creates no memberships or grants.

Employee INACTIVE does not suspend a User or revoke membership/grants. Revoking membership/account still blocks API access even if an Employee is ACTIVE. Reactivating a profile checks its existing User and membership are ACTIVE. Unrelated profile edits, deactivation and clearing references may preserve historic inactive references. Unchanged departmentId does not require that department to be reactivated. Changing department does not move the User or alter membership. Department deactivation preserves Employee references and does not cascade profile changes.

Actor authorization and reference checks execute inside the same serializable transaction as the write. Narrow OrganizationMembershipService and DepartmentsService validators read only the needed target state; Employee never writes their tables. Database uniqueness handles concurrent duplicate requests; bounded serializable retries end in safe 409 on exhaustion. New permissions are explicit catalog entries, not automatic admin/owner grants. Mutation permission permits the safe result response; list/detail still require employee:read. Owning a profile grants no additional authority.

## Pagination and errors

List uses ascending ID keyset order, default limit 25, maximum 100, optional after UUID lower bound. All filters are exact single values combined with tenant scope; omitted status includes ACTIVE/INACTIVE. Foreign/missing userId or departmentId filter returns an empty page, not a global lookup. Cursor/filter do not authorize a record; no stable snapshot or total count. No arbitrary sorting/search or membershipId filter.

| HTTP | Code | Meaning |
| --- | --- | --- |
| 401 | UNAUTHORIZED | Invalid/missing/expired/revoked session or inactive actor account |
| 403 | FORBIDDEN | Inactive/inaccessible/malformed tenant, inactive actor membership or missing exact grant |
| 404 | NOT_FOUND | Missing/foreign Employee or department; target User nonexistent or without this tenant's membership; identical safe response |
| 409 | CONFLICT | Duplicate user/code, inactive target membership/User on create/reactivation, inactive new department reference, exhausted concurrency retry |
| 400 | VALIDATION_FAILED / BAD_REQUEST | Invalid field/query/UUID or malformed transport |
| 413 | PAYLOAD_TOO_LARGE | Decoded JSON exceeds 64 KiB |
| 500 | INTERNAL_ERROR / DATABASE_ERROR | Operational failure, including audit persistence failure; no partial success |

Use the existing error envelope/requestId. Do not disclose a foreign user's existence, email, status or tenant. No-op normalized updates return the unchanged resource/timestamp with no mutation audit. Effective employee.created/updated commits an audit with tenant, verified actor, requestId, UUID resource and bounded metadata in the same transaction. employee.updated metadata is only unique changed-field names from displayName/jobTitle/phone/departmentId/status (max five, overall 1024 UTF-8 bytes); no contact/name values. Failures roll back profile and audit together. No Employee notifications.

Existing membership/grant provisioning remains an explicitly privileged operator workflow outside this API. No self-service user search, invitations, Task, payroll, attendance or frontend implementation is included. Migration: `20260909010000_employee_v1`.
