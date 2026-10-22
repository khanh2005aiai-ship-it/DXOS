> Đây là báo cáo lịch sử, không phải nghiệm thu bản hiện tại. Xem [bản phát hành v0.2.0](v0.2.0.md) và validation JSON đính kèm GitHub Release để biết kết quả mới nhất.

# DXOS V1 Release Readiness

Audit: `DXOS-RELEASE-001`
Date: 2026-09-12

## Status

**PASS with documented operational limitations.**

The backend, database migration history, frontend artifact, authentication, tenant isolation, RBAC, files, AI mock boundary and release documentation were checked. No unresolved release blocker was found. Backup/restore was documented but not executed because the local MySQL client utilities were not installed and destructive restore is not appropriate on the demo database.

## Architecture Summary

DX-OS is a modular monolith:

- Backend: NestJS, TypeScript, Prisma 6.19.3, MySQL 8.0-compatible schema
- Authentication: Argon2id passwords, JWT access tokens, rotating opaque refresh sessions
- Authorization: organization-scoped RBAC and explicit permission catalog
- Storage: private local filesystem storage with UUID object keys
- AI: deterministic offline `mock-v1`; production defaults to disabled
- Frontend: Vite/React application; unchanged by this audit

## Prerequisites

- Node.js 22+
- npm 10+
- MySQL 8.0+
- Redis in production for distributed authentication rate limiting
- A private writable file-storage directory
- External secret management for production credentials

Docker and cloud storage are not required by the repository.

## Environment Variables

### Required in production

- `NODE_ENV=production`
- `DATABASE_URL`: MySQL URL containing a database name
- `JWT_ACCESS_SECRET`: unique secret, at least 32 characters
- `CORS_ORIGINS`: comma-separated explicit `http`/`https` origins; wildcard is rejected
- `REDIS_URL`: `redis://` or `rediss://` URL for shared rate limiting

### Optional with safe defaults

- `PORT=3000`
- `API_PREFIX=api/v1`
- `LOG_LEVEL=info`
- `SWAGGER_ENABLED=false` in production by default
- `JWT_ACCESS_TTL=15m`
- `JWT_REFRESH_TTL=30d`
- `AI_PROVIDER=disabled` in production
- `AI_MODEL=mock-v1`
- `AI_TIMEOUT_MS=5000`
- `FILE_STORAGE_ROOT=~/.dx-os/files` when not explicitly configured
- Production rate-limit values default to login `10/60s` and refresh `30/60s`

### Development/test only

- Development may use the bounded in-memory rate-limit fallback when `REDIS_URL` is absent.
- `DEMO_ADMIN_PASSWORD` is for the local demo seed only and must remain outside source control.
- `RBAC_TEST_DATABASE_URL` and `SHADOW_DATABASE_URL` are supplied automatically by the official disposable MySQL runner.

Production configuration rejects missing database URL, JWT secret, Redis URL, invalid origins, wildcard CORS, insecure JWT secret, invalid durations and invalid enum values.

## Database Setup and Migration

Fresh local database:

```powershell
npm install
Copy-Item backend/.env.example backend/.env
npm run db:generate
npm run db:migrate:dev
```

Production-like database:

```powershell
npm install
npm run db:generate
npm run db:migrate:deploy
npm run db:migrate:status
```

Do not run `migrate:dev` against production. The active MySQL history contains 11 migrations and was replayed successfully against a disposable database. No migration was added by this release audit.

There is no automated down-migration or rollback command. Rollback is operational: restore a verified database backup and deploy a compatible application version, or apply a reviewed forward migration. Do not edit historical migrations.

## Backup and Restore

The repository does not provide automated backups. Operators should use the version-matched MySQL utilities and a secret-managed connection, for example:

```powershell
mysqldump --single-transaction --routines --triggers --hex-blob --databases dx_os > dx_os-YYYYMMDD-HHmm.sql
Get-FileHash .\dx_os-YYYYMMDD-HHmm.sql -Algorithm SHA256
```

Verify that the backup file exists, has a non-zero size, and that its SHA-256 digest is recorded in the backup log. Store the backup outside the application workspace with restricted permissions.

Restore procedure in an isolated database:

```powershell
mysql -e "CREATE DATABASE dx_os_restore CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql dx_os_restore < .\dx_os-YYYYMMDD-HHmm.sql
$env:DATABASE_URL='mysql://USER:PASSWORD@HOST:3306/dx_os_restore'
npm run db:validate
npm run db:migrate:status
```

Then start the application against the isolated database and run health plus authentication smoke tests. Do not restore over the demo or production database until the isolated restore is verified.

Backup/restore execution status for this audit: **NOT EXECUTED**. `mysql` and `mysqldump` were not available in the local PATH, and no destructive restore was performed.

## Backend Build and Start

```powershell
npm run db:generate
npm run build:backend
npm --workspace @dx-os/backend run start
```

The process requires its environment to be supplied by the deployment environment or process manager. The application validates configuration during startup and fails rather than silently starting with an insecure production configuration.

Nest shutdown hooks are enabled, allowing Prisma `OnModuleDestroy` cleanup during graceful application shutdown.

The smoke test used direct Node startup with `backend/.env` explicitly loaded and passed. One wrapper `npm start` attempt returned code 1 while another local backend process already occupied the configured port; this was a local port-conflict condition, not a source/build failure.

## Frontend Build and Serve

```powershell
npm --prefix frontend run typecheck
npm --prefix frontend run lint
npm --prefix frontend run test -- --run
npm --prefix frontend run build
npm --prefix frontend run preview
```

Frontend release verification on 2026-09-12:

- Typecheck: PASS
- Tests: 14 files, 110 tests PASS
- Build: PASS
- Lint: 0 errors, 5 existing Fast Refresh warnings

Frontend source was not modified by this audit.

## Health Check

`GET /api/v1/health` returns HTTP `200`:

```json
{
  "status": "ok",
  "service": "dx-os-api",
  "timestamp": "..."
}
```

This is a process/API health check. It does not query MySQL or Redis. Dependency health is verified separately through startup, migration status, authentication smoke tests and the release validation suite.

## HTTP Security

Verified by code and tests:

- Helmet enabled
- Explicit-origin CORS; wildcard rejected
- Request correlation ID generated or validated
- Global `ValidationPipe` with transform, whitelist and forbidden unknown fields
- Safe error envelope with no stack, SQL, filesystem or provider details
- Structured request logs include request ID, method, path, status and duration
- Sensitive log keys are redacted
- API prefix defaults to `/api/v1`
- OpenAPI is disabled by default in production and returns not found when disabled
- File upload limits and signature validation enforced

## Authentication and RBAC

Verified by the hardening suite and live smoke checks:

- Invalid, expired, malformed and revoked sessions rejected
- Refresh rotation and concurrent refresh reuse protected
- Logout revokes the server session
- Inactive/suspended accounts rejected
- Organization membership and tenant isolation enforced
- Explicit permissions required
- Role catalog discovery, member listing, assignment and revoke protected
- Privilege ceiling and self-escalation protections enforced
- Audit records are tenant scoped and sensitive fields excluded

## File Storage

- Default root: `~/.dx-os/files`; configurable with absolute `FILE_STORAGE_ROOT`
- Public/static/frontend paths are rejected
- UUID storage keys only
- Directory and object symlink/hard-link checks enforced
- Maximum upload size: 5 MiB
- Supported content types/signatures: PDF, PNG, JPEG
- Uploads begin as `UPLOADING`, then become `AVAILABLE` after verification
- Failed/interrupted uploads are marked/cleaned through compensation
- Deleted files remain metadata-only and are not readable
- Physical paths and storage keys are not returned by public API responses

Operators must periodically reconcile `UPLOADING`/`FAILED` objects after process crashes; no automated cleanup job exists.

## AI

- Provider selection: `mock` or `disabled`
- Production default: `disabled`
- Development/test default: offline `mock-v1`
- No API key or external provider required
- `ai:use` permission required
- Input, message count, message length, output tokens and temperature are bounded
- Timeout and cancellation are enforced
- Provider errors are normalized
- Started/succeeded/failed lifecycle is persisted with audit events
- Prompts/responses are not persisted
- No tools, agents, autonomous actions, RAG or external calls

## API Documentation

Live OpenAPI verification returned HTTP `200`, 25 paths, and included:

- auth
- health
- organizations
- departments
- employees
- tasks
- notifications
- files
- AI
- members
- roles
- permissions
- audit logs

The role catalog endpoint is documented as `GET /api/v1/organizations/{organizationId}/roles` with explicit `role:read`, safe metadata and cursor pagination. Historical architecture documents may contain design-time “future” wording; served OpenAPI and current contracts are authoritative for implemented V1 routes.

## Demo and Seed Data

Demo data is local-only and separate from production data:

```powershell
npm --workspace @dx-os/backend run seed:demo-admin
npm --workspace @dx-os/backend run seed:demo
```

The seed requires `DEMO_ADMIN_PASSWORD`, hashes passwords with the existing Argon2id service, uses deterministic tenant-scoped IDs, preserves existing operator edits, and is idempotent. It does not reset the database or create production secrets. Demo file storage is under the configured private `backend/outputs` path, which is ignored by Git.

## Logging

Structured logs include timestamp, level, message and bounded attributes. Request completion logs include request ID, HTTP method, path, status and duration. Redaction covers authorization, cookies, passwords, secrets, tokens and API keys. AI logs contain request metadata/status but not prompt or response content.

## Git and Release Baseline

`.gitignore` excludes:

- `.env` and environment variants except `.env.example`
- `node_modules`
- `dist`, coverage and TypeScript build info
- logs
- local database files
- runtime outputs and work artifacts

The current workspace has no committed Git baseline; `git status` therefore reports repository files as untracked rather than providing a normal tracked-file diff. Sensitive local files were observed as ignored (`backend/.env`, generated artifacts, `node_modules`, runtime outputs). No commit was created.

## Files Changed

- `backend/src/main.ts` - enables Nest graceful shutdown hooks.
- `docs/release/release-readiness.md` - release audit and operator runbook.

No frontend files, database schema, migration, credential or ACL files were changed.

## Release Validation

### Backend

- Official disposable MySQL suite: **31 suites, 815 tests PASS, 0 failed, 0 skipped**
- Prisma generate: **PASS**
- Prisma validate: **PASS**
- Migration status: **PASS; database schema up to date**
- Migration replay: **PASS; 11 migrations applied to disposable database**
- Schema drift: **PASS; no difference detected**
- Build: **PASS**
- Lint: **PASS**
- Health: **EXECUTED; HTTP 200**
- OpenAPI: **EXECUTED; HTTP 200, 25 paths**

### Frontend

- Typecheck: **PASS**
- Tests: **PASS; 14 files, 110 tests**
- Build: **PASS**
- Lint: **PASS with 5 warnings, 0 errors**
- Browser/responsive/accessibility QA: **VERIFIED BY PROVIDED RELEASE STATE; not re-executed in this audit**

## Security Checklist

- [x] Production JWT secret is required and validated
- [x] Database credentials are externalized
- [x] Explicit CORS configured; wildcard rejected
- [x] Helmet enabled
- [x] Global validation enabled
- [x] Sensitive logs redacted
- [x] Error details hidden
- [x] Tenant isolation tested
- [x] RBAC tested
- [x] Refresh rotation tested
- [x] Logout tested
- [x] File paths protected
- [x] Frontend build succeeds
- [x] Backend build succeeds
- [x] Migrations current
- [x] Schema drift absent
- [ ] Backup procedure executed locally: NOT EXECUTED
- [ ] Restore procedure executed locally: NOT EXECUTED
- [x] Health endpoint verified
- [x] API docs verified
- [x] No credentials committed

## Deployment Order

1. Provision MySQL and Redis.
2. Configure production environment through secret management.
3. Run `npm install`.
4. Run `npm run db:generate`.
5. Run `npm run db:migrate:deploy`.
6. Run `npm run build:backend`.
7. Run `npm --prefix frontend run build` and serve the generated static assets.
8. Start backend and frontend services.
9. Verify health and OpenAPI policy.
10. Smoke test login, organization discovery and one authorized core workflow.

No zero-downtime deployment or automated rollback mechanism is implemented.

## Known Limitations

- Health does not probe database or Redis dependencies.
- Backup/restore was documented but not executed in this environment because MySQL client binaries were unavailable.
- No automated backup scheduler or retention policy is included.
- No automated cleanup worker exists for interrupted file uploads.
- Frontend lint has five non-blocking Fast Refresh warnings.
- The workspace has no Git commit baseline; release review should occur after the repository is initialized and tracked files are reviewed.

## Final Decision

**PASS**, with the explicit operational limitations above. No frontend files, credentials, ACLs, or database migrations were changed by this audit.
