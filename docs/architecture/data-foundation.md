# DX-OS data foundation

## Status and boundary

DXOS-DATA-001 established the initial Prisma schema; DXOS-DATA-002 moves its active provider to MySQL 8.0. It establishes storage conventions only; it does not implement authentication, RBAC assignment, organization authorization, or business workflows.

## Data model

`User` and `Permission` are global catalogs. `Organization` is the tenant root. `OrganizationMembership`, `Department`, and `Role` are organization-owned and carry `organization_id`.

All primary keys are UUID values created by Prisma and stored as MySQL `CHAR(36)`. Each current model has `created_at` and `updated_at` as `DATETIME(6)`. The committed MySQL baseline is the authoritative, reproducible database change for a new MySQL database.

## Tenant strategy

Future request handling must resolve an authorized organization context before reaching tenant repositories. Every tenant query and mutation must use that context as `organization_id`; it must never accept an untrusted tenant identifier alone as an authorization decision.

The schema prevents duplicate membership, department codes, and role keys in a tenant. The department parent relation uses the pair `(organization_id, id)`, so a department cannot reference a parent in another organization. These constraints support isolation but do not themselves authenticate or authorize a caller.

## Migration and operational policy

- Edit `database/schema.prisma` for a new reviewed schema change.
- Create and commit a new Prisma migration in a development database.
- Never rewrite a migration already applied outside local development.
- Use `db:migrate:deploy` in production-like environments; do not use `migrate dev` there.
- A seed is intentionally absent until an approved, non-sensitive fixture strategy exists.

See `database/README.md` for local setup and command details.

The historical PostgreSQL migration chain is preserved in `database/migrations-postgresql/` and must never be used to migrate MySQL. See `mysql-provider-transition.md` for the provider-transition strategy.

## Explicitly deferred

IAM has added credentials, account status, hashed refresh-session state, and current-user authentication. RBAC will add role-permission and membership-role assignment. Organization services will apply organization selection and server-side authorization. Audit trails, file storage, notifications, and business entities have no tables in this task.
