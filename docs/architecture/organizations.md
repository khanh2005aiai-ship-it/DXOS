# Organization foundation — DXOS-ORG-001

Organization is the tenant root. Public IDs are opaque UUIDs; immutable normalized
slugs are labels, never authorization credentials. Every future tenant-owned table
must reference its organization, use tenant-scoped constraints where appropriate,
and filter every operation by the server-authorized organization_id.

## Policies

An authenticated active user may create a new organization without an existing
membership. This explicit bootstrap policy lives in AuthorizationService; an
organization:create grant on an existing tenant cannot govern creation of a new
tenant. No unused organization:create permission or platform grant is introduced.
The server atomically creates an ACTIVE organization, the creator's ACTIVE membership,
an owner role, and exactly organization:read and organization:update grants. The
role name itself grants nothing. Ownership, status and permissions are not inputs.

Listing is an authenticated membership-discovery operation: it exposes only active
organizations with an active membership for the caller, even if that membership has
no role grants. Reading details requires organization:read; renaming requires
organization:update. Both use the existing guards and recheck AuthorizationService
inside a serializable transaction with the resource operation. Creation uses the
same isolation and rechecks active user state. Serialization failures retry at most
three times, then return a safe 409. The HTTP guard is not the sole authorization
boundary for service reads/writes. List filters account and membership state in its
single database query. Never use body, query or header tenant IDs for authority.

## Lifecycle

Organizations: ACTIVE, SUSPENDED, ARCHIVED. Only ACTIVE organizations authorize any
organization-scoped operation, including future modules using RBAC. SUSPENDED and
ARCHIVED are hidden from lists and return 403 on reads/updates. No data is deleted.
Lifecycle changes are operator-managed for now; no public status-changing endpoint
or reactivation flow is provided. Archived tenants retain their slug reservation.

Memberships retain ACTIVE/INACTIVE and add SUSPENDED/REMOVED. Only ACTIVE grants
access; stale role assignments on other states cannot authorize. REMOVED is terminal
for this foundation. Future rejoining must clear and explicitly re-provision grants,
not reactivate stale assignments. No invitations or membership mutation API is added.

## Migration plan and rollback

The new MySQL migration adds organization.status with ACTIVE default, extends the
membership enum without reordering existing states, and adds (user_id,status,
organization_id) for membership discovery. Existing memberships and grants remain
unchanged; existing organizations remain active. No historical migration is edited.
UUID CHAR(36), timestamp, FK and unique slug conventions remain intact. Existing
slugs are preserved; the stricter normalization applies to new API-created records.
Review/backup before deployment; ALTER TABLE can lock populated tables. Rollback is
a reviewed forward migration after mapping new membership states to INACTIVE and
preserving lifecycle state externally; reverting code first would ignore suspensions
and is unsafe. Do not remove status checks while suspended tenants exist.

## Boundaries

Four organization endpoints only; no permanent deletion, member management, platform
roles, billing, frontend, or audit log. DXOS-AUDITLOG-001 remains the next task.
Structured HTTP logs retain safe request metadata and never contain request bodies
or bearer credentials. Detailed API schemas are in contracts/api/organizations.md.

## Validation

147 tests across 13 suites pass, including the existing IAM/RBAC tests and real MySQL
HTTP tests for all four endpoints, tenant isolation, lifecycle, privilege rejection,
slug collisions, transaction rollback and authorization rechecks. Build, lint,
Prisma generate/validate, full shadow-history replay and live test-schema comparison
pass on MySQL 8.0.44 / Prisma 6.19.3. No test fixture is written to dx_os.
