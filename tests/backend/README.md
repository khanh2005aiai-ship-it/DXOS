# Backend tests

This directory contains backend integration and end-to-end tests. The bootstrap health test is intentionally the first executable check; protected domain modules must add validation, authentication, authorization, tenant-isolation, and failure-path coverage.
# RBAC MySQL integration

The same disposable-database runner now includes DXOS-AUDITLOG-001 audit unit/API
integration and failure/rollback tests, alongside all IAM, RBAC and organization
regressions. Audit fixtures are deleted only by privileged test teardown inside the
disposable database; no application deletion route exists.

Run `npm --workspace @dx-os/backend run test:rbac:mysql` from the repository root.
The runner uses the configured MySQL account to create uniquely named disposable
test and shadow databases, replays the full migration history, checks both history
and live-schema equivalence, runs all backend suites including real MySQL RBAC
fixtures, and drops only the databases it created. It requires CREATE/DROP DATABASE
privileges. It never resets dx_os. Ordinary npm test skips the MySQL suite unless
the runner's RBAC_TEST_DATABASE_URL is supplied. Mocked HTTP tests verify the Nest
guard/error boundary; real MySQL tests verify relational resolution and constraints.
