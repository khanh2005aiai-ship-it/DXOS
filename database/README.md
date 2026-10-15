# DX-OS database foundation

## Technology

- **Database:** MySQL Community Server 8.0
- **ORM and migration tool:** Prisma 6.19.3
- **Schema:** `database/schema.prisma`
- **Active MySQL migrations:** `database/migrations/`
- **Archived PostgreSQL migrations:** `database/migrations-postgresql/`

DX-OS uses one shared MySQL database. Prisma 6.19.3 validates the MySQL connector and generates a MySQL 8.0-compatible baseline from the current schema. The application does not create a Prisma client per business module: `PrismaService`, exported by `DatabaseModule`, owns the client lifecycle.

## Local development

Docker is not required by this repository. Run MySQL 8.0 locally or use an approved development instance, then create an empty database and a least-privilege application user. For example:

```sql
CREATE DATABASE dx_os CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Copy the configuration template and replace only the local placeholder:

```powershell
Copy-Item backend/.env.example backend/.env
```

`DATABASE_URL` is mandatory in development and production and must use a MySQL URL with a database name, for example `mysql://dxos:local-password@localhost:3306/dx_os`. It is intentionally optional only during `NODE_ENV=test`, because the current automated tests do not connect to a real database. Do not commit `backend/.env` or real credentials.

## Commands

Run these from the repository root after `npm install`:

```powershell
npm run db:generate
npm run db:validate
npm run db:migration:validate
npm run db:migrate:dev
```

`db:migrate:dev` is for local development only. Production-like environments must apply committed migrations only:

```powershell
npm run db:migrate:deploy
npm run db:migrate:status
```

`db:migration:validate` verifies committed MySQL migration structure without a database. Set `SHADOW_DATABASE_URL` to a disposable MySQL database URL to enable its full Prisma history-vs-schema diff. `db:migrate:status` and migration application do connect.

## MySQL mapping

| Concern | MySQL implementation |
| --- | --- |
| UUID identifiers | Prisma-generated UUID strings in `CHAR(36)` columns. |
| Account status | Native MySQL `ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED')`. |
| Timestamps | `DATETIME(6)`; application time is UTC. MySQL `DATETIME` has no timezone metadata. |
| Text lengths | Explicit `VARCHAR` limits, including `users.email` at 320 characters. |
| Character handling | `utf8mb4` with `utf8mb4_unicode_ci`; unique string values are case-insensitive according to this collation. |
| Relations | InnoDB foreign keys with `ON DELETE RESTRICT ON UPDATE CASCADE`. |
| JSON | No JSON columns exist in the current schema. |

## Current schema

| Model | Ownership | Foundation purpose |
| --- | --- | --- |
| `User` | Global identity | IAM identity with an optional Argon2id password hash, account status, and last-login timestamp. |
| `AuthSession` | Global session state | Hashed opaque refresh-token state for rotation and logout revocation. |
| `Organization` | Tenant root | Tenant identity through globally unique `slug`. |
| `OrganizationMembership` | Organization-owned relationship | Connects a user to an organization; unique per organization/user pair. |
| `Department` | Organization | Future organizational hierarchy; parent FK is constrained to the same organization. |
| `Role` | Organization | Future organization-scoped role catalog; role key is unique per organization. |
| `Permission` | Global catalog | Future permission definitions; no assignment logic exists yet. |

All IDs are Prisma-generated UUID strings stored in MySQL `CHAR(36)` columns. `created_at` and `updated_at` are `DATETIME(6)` fields. `AuthSession.refresh_token_hash` stores only a SHA-256 hash of the opaque refresh credential. Soft deletion is deliberately not included: deletion/retention semantics have not yet been defined per domain.

## Tenant isolation boundary

`organizations.id` is the tenant key. Every organization-owned table has `organization_id`; future repositories must require an organization context and include it in reads and writes. The initial schema prevents duplicate organization membership, department code, and role key inside one tenant. The composite department parent foreign key prevents a hierarchy that crosses tenant boundaries.

This is a data-model boundary, not completed tenant authorization. IAM, RBAC guards, organization selection, and repository-level tenant scoping remain future work.

## Important indexes

- unique `users.email`
- unique `organizations.slug`
- unique `(organization_id, user_id)` for memberships; indexes for user lookup and tenant chronology
- unique `(organization_id, code)` and indexed `(organization_id, parent_department_id)` for departments
- unique `(organization_id, key)` for roles
- unique `permissions.key`
- unique `auth_sessions.refresh_token_hash`; indexes for session expiry cleanup and a user's active-session lookup

## Provider-transition migration strategy

PostgreSQL SQL cannot be applied to MySQL. The original PostgreSQL migration files and their PostgreSQL provider lock are preserved byte-for-byte in `database/migrations-postgresql/` for audit; they are not active and must never be run by MySQL Prisma commands.

The active MySQL history starts with `20260906220000_mysql_baseline`, a clean baseline of the data and IAM schema. It is valid only for a new or empty MySQL `dx_os` database. It is not an in-place migration path for an already populated PostgreSQL deployment.

For a populated PostgreSQL environment, use a separate approved export/transform/import/cutover project. Transform PostgreSQL UUID, timezone, and enum semantics; import into an isolated MySQL database; verify counts and constraints; then perform a controlled cutover. Do not apply the MySQL baseline to a non-empty database and do not edit either historical migration history.

## Seed and test strategy

No seed is supplied. No credentials, API keys, personal data, or production-like records are committed. Unit/API tests mock Prisma and validate Prisma client initialization without requiring MySQL. Database connectivity and migration application are explicit local/CI steps once a test database is provisioned. Set `SHADOW_DATABASE_URL` when running `db:migration:validate` to compare the full MySQL migration history with the schema.
