# Organization RBAC — DXOS-RBAC-001

DXOS-ORG-001 extends this foundation with active organization lifecycle checks and
controlled creator provisioning. See [organization architecture](organizations.md)
for current endpoints, creation policy and lifecycle behavior. The sections below
record the original RBAC foundation's scope and validation.

## Model and isolation

An active User has an active OrganizationMembership in an existing Organization.
MembershipRole assigns zero or more organization Roles; active roles grant the union
of their RolePermissions. Permission is a global catalog of stable resource:action
keys, not a global grant. No membership or no grant means deny. Multiple roles avoid
duplicating enterprise job-role combinations while retaining a simple join model.
Role names and descriptions carry no authority. There are no wildcard grants,
platform roles, super-admin flags, or owner-name bypasses. Future platform identities
must use separate assignments and policies and cannot bypass organization membership.

AuthorizationService queries current database state on every check, including active
account, membership, organization, role ownership and the exact permission. Runtime
validation rejects missing identifiers and non-catalog permissions before Prisma can
omit undefined filters. Only the centralized permission catalog may be extended.

## Authentication and request context

Use JwtAuthGuard before OrganizationPermissionGuard. JWT verification and session
validation remain in IAM. Missing/invalid/expired/revoked credentials return 401.
IAM also returns 401 when an inactive or suspended account cannot authenticate its
session. An authenticated identity denied by RBAC receives 403 in the existing error
envelope. RBAC independently checks active account state, including a state change
after authentication. Database failures propagate to the safe 500 envelope.

The only organization selector is a UUID route parameter, organizationId by default,
or a server-configured @OrganizationContext parameter name. Headers, query parameters,
body fields and JWT claims cannot override it. Missing permission metadata on an
RBAC-guarded route fails closed. Controllers must scope all downstream resource
queries and writes to this same route organization; permission is not proof of
ownership of an arbitrary resource ID.

## Extension pattern

Import AuthModule and RbacModule in a future domain module. Apply
@UseGuards(JwtAuthGuard, OrganizationPermissionGuard), @OrganizationContext(), and
@RequirePermission(PERMISSIONS.ORGANIZATION_READ) to an organization route. Add new
keys centrally, provision exact catalog records, and test allowed and cross-tenant
requests. The test probe demonstrates this pattern but is never registered in the
production application. No production endpoints or default role seeds are added.

RbacAssignmentService remains trusted provisioning infrastructure for bootstrap and
internal procedures. The role administration API is the only public provisioning
surface: it requires role:read or role:assign, rejects self mutation, enforces a
grant ceiling against the actor's effective permissions, scopes every lookup to the
route organization, and commits assignment/revocation plus audit atomically.
The same surface exposes read-only role discovery with role:read; it returns only
tenant-scoped role metadata in ascending UUID keyset pages and never treats role
names or client permission lists as authorization.
Ordinary membership APIs must not accept roles or permissions. Initial grants require
an operator-reviewed provisioning procedure; existing memberships receive no grants.

## Migration plan, data impact and rollback

The existing additive RBAC migration adds active state and join tables with UUID
CHAR(36) IDs, DATETIME(6) timestamps, uniqueness and restrictive deletes. The two
MembershipRole composite foreign keys require the membership and role to share
organization_id. RolePermission references a global permission definition and a
specific role; it does not confer access to other roles or organizations.

The new 20260907000000_index_membership_role_scope migration explicitly indexes
(organization_id, membership_id), matching the referencing side of the membership
FK and Prisma schema. MySQL may already create this supporting index implicitly;
the explicit named index makes the schema intent reproducible. No historical SQL is
rewritten. No data is deleted or default grant introduced. Deploy using Prisma
migrate deploy after backup and review. Index creation can lock a populated table;
schedule accordingly. Rollback this index with a reviewed forward migration only
after ensuring another index still supports the FK. Rolling back the RBAC tables
requires exporting assignments first and reverting dependent application code.

Full migration replay requires a dedicated disposable shadow database. Offline
structural checks alone do not prove MySQL execution or migration-history equivalence.

## Validation performed

MySQL 8.0.44 and Prisma 6.19.3: all three active migrations replayed successfully in
a disposable shadow database; the history diff and migrated live-schema diff were
empty. All 75 backend tests passed, including real MySQL permission resolution,
cross-tenant composite foreign keys, uniqueness, revocation, account/role states and
platform escalation denial, plus HTTP 401/403 and existing IAM regressions. Build,
lint, Prisma generate and validate passed. The migrations were also deployed to
dx_os, whose migration status is up to date. Disposable databases were removed.
