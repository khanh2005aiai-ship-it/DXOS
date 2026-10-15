# DX-OS architecture

## Implemented

DX-OS is currently one TypeScript/NestJS deployment with a versioned REST API foundation and MySQL 8.0/Prisma data foundation. The implemented platform layer provides environment validation, request correlation, structured logging, global error handling, request validation, Helmet security headers, explicit-origin CORS, an OpenAPI-compatible health document, and backend tests.

The application uses a modular-monolith structure: platform concerns live in shared infrastructure and domain modules own their controllers, services, persistence, policies, contracts, and tests. The platform health, API-documentation, and global database modules exist today. `PrismaService` is the sole Prisma client abstraction and is not a business service.

## Data and tenancy

MySQL 8.0 with Prisma is the system of record. The active MySQL baseline defines global `User` and `Permission` catalogs plus tenant-root `Organization`, organization membership, department hierarchy, and organization-scoped roles. UUID strings use `CHAR(36)` and timestamps use UTC `DATETIME(6)`. Organization-owned tables include `organization_id`; tenant-scoped unique constraints and a composite department-parent FK protect known ownership relationships. PostgreSQL migration history is archived separately and is not an active provider chain.

Database constraints do not replace authorization. RBAC now verifies current active membership and role grants in the selected organization. Future domain repositories must filter every resource operation to the same authorized organization.

## Identity and authorization

IAM authentication is implemented with Argon2id passwords, account status, short-lived access JWTs, opaque rotating refresh tokens, session revocation, and current-user authentication. Organization-scoped RBAC uses multiple membership roles, a central permission catalog, a dedicated authorization service and a separate guard. See [RBAC architecture](rbac.md).

## Organization and audit infrastructure

DXOS-AUDITLOG-001 adds durable audit events, transactionally coupled mutation logging,
global authentication/denial evidence and a bounded tenant audit query requiring
audit:read. See [audit logging](audit-logging.md) for failure semantics and threat model.

Organization creation, membership-scoped listing, reading and renaming are implemented
by DXOS-ORG-001. Creator grants are server-provisioned atomically; suspended/archived
tenants and inactive memberships are denied centrally. See [organizations](organizations.md).

Notification outbox, object storage, provider-neutral AI orchestration, and business modules remain future work. Authentication rate limiting is implemented with shared Redis state in production; edge throttling remains deployment defense-in-depth.

## Delivery sequence

DXOS-FOUNDATION-001 → DXOS-DATA-001 → DXOS-IAM-001 → DXOS-RBAC-001 → DXOS-ORG-001 → DXOS-AUDITLOG-001.
