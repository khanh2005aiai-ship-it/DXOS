# TASK 8 — HR Reports & Analytics implementation plan

Inspected 2026-09-17 before implementation. User explicitly authorizes backend and frontend Reports. Preserve the modular NestJS/Prisma 6.19.3/MySQL application and React/Vite/Tailwind Vietnamese UI. No schema changes, business-rule edits, credentials, ACL changes or commits.

## Existing sources and boundaries

Employee/Department, AttendanceRecord, LeaveRequest, Shift/WorkSchedule, ApprovalRequest, PayrollPeriod/PayrollRecord exist. Attendance already stores late/early/worked minutes, and workDate is a Vietnam calendar date encoded as a SQL DATE. Leave stores daysCount and actual PENDING/APPROVED/REJECTED/CANCELLED states. Payroll stores Decimal amounts/currency and immutable finalized period records. Read these values; do not call calculation/approval/mutation services.

Attendance read alone is self-scoped; organization reports require attendance:read plus attendance:manage. Leave read alone is self-scoped; organization reports require leave:read plus leave:approve. Payroll HTTP list routes require payroll:read; do not widen access with report permission alone or a role name. WorkSchedule data requires schedule:read. Department labels require department:read. These checks repeat in the report transaction, using the existing authorization infrastructure.

TASK 7 is partially available at inspection: Performance models/migration exist, but source module and permission catalog integration are absent. They are being developed separately. Use an isolated PerformanceAnalyticsProvider contract with an unavailable implementation until an authorized stable source is available. Do not interpret draft schema as a production analytics API, edit its models or query private review fields. Reinspect at final validation; document the exact integration point.

## Implementation sequence

1. Record additive contracts, permission matrix, metric definitions, range/output bounds and CSV behavior.
2. Implement reports-only DTOs, pure calculations, parameterized database aggregations, service/controller/OpenAPI, safe export/audit and Performance provider boundary.
3. Add narrowly scoped registration and report:read/export catalog entries; no automatic grants. Preserve concurrent shared-file changes.
4. Add isolated /reports page with Vietnamese filters, KPIs, accessible SVG/CSS charts and bounded tables; reuse authenticated api, organization/permission contexts and UI components. No chart dependency, polling or employee detail rewrite. Minimal router/sidebar integration after a fresh read; leave shared Dashboard untouched while TASK 7 is active.
5. Validate pure calculations, MySQL HTTP security/data integration, frontend states/filtering, then actual project full tests/build/lint/typecheck, DB status/validation/drift and Playwright against disposable seeded real data.

## Query design

Database-side counts/SUM/conditional aggregation; no loading full transactional tables. All raw SQL uses Prisma.sql parameter binding, trusted static identifiers, organization predicates on every joined tenant table. Department summary uses bounded keyset pages and batched group queries, no per-department queries. Trends have at most 366 daily/54 weekly/13 monthly buckets. Money remains Decimal until serialized as fixed-point strings; never sum currencies together. Exports contain aggregates only and are bounded. Reports perform no business writes; export audit is the only intentional persistent side effect.

Source hash baseline is recorded under task outputs/hr-reports/before.json, separate from earlier Phase 1 work. Existing source modules and schema are read-only for TASK 8. Use minimal patch edits for shared registration/catalog/router files and distinguish concurrent TASK 7 changes from this task's manifest.
