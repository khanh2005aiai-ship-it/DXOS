# PostgreSQL to MySQL provider transition — DXOS-DATA-002

## Decision

DX-OS now uses MySQL 8.0 through Prisma 6.19.3. The active datasource is `mysql` and the configured development database is `dx_os`.

## Compatibility decisions

- PostgreSQL `UUID` becomes Prisma-generated UUID strings stored in MySQL `CHAR(36)` columns.
- PostgreSQL `TIMESTAMPTZ(6)` becomes MySQL `DATETIME(6)`. Application dates are handled as UTC; the database column itself has no timezone metadata.
- The account-status enum becomes native MySQL `ENUM`.
- Explicit `VARCHAR` and `CHAR` lengths remain within MySQL 8.0 limits under `utf8mb4`.
- All relational tables remain InnoDB-compatible with restrictive deletes and cascading key updates.
- The current schema has no JSON fields or implicit relation tables.

## Migration history

The PostgreSQL migrations remain unchanged in `database/migrations-postgresql/`, including their provider lock. They are an audit archive and not a valid MySQL migration chain.

The active MySQL migration chain begins with `database/migrations/20260906220000_mysql_baseline`. This is a provider baseline, not a cross-database data conversion. It may be applied only to a newly created or empty MySQL database.

## Existing PostgreSQL data

There is no automatic cross-provider Prisma migration. A populated PostgreSQL installation requires a separately reviewed export/transform/import/cutover runbook, with reconciliation before production cutover. This prevents accidental application of MySQL DDL to PostgreSQL data or loss of provider-specific semantics.

## Boundaries

This task changes only the persistence provider and its migration strategy. It does not add RBAC, organization APIs, user provisioning, or business functionality.
