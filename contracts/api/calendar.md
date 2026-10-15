# Organization calendar — DXOS-FEATURE-EXPANSION-001

Recorded before implementation. Preserve Task deadlines, status and permissions; add persistent calendar events/meetings only where no existing model provides them. No external calendar connector, invites, mail or notification sending. Leave entries are integrated only after the Leave module is implemented, never fabricated client-side.

## Authentication and access

All routes require JWT, ACTIVE user/session/organization/membership. Scope is validated organization context. Reuse AuthorizationService, OrganizationPermissionGuard, membership-role-permission joins and transaction-time authorization. Add explicit catalog keys calendar:read/create/update; no role receives these grants automatically. Task deadline visibility still uses task:read. Organization owner/admin names are not a bypass. Permission provisioning remains an intentional existing RBAC operation; do not run demo-account provisioning implicitly.

## List

GET `/api/v1/organizations/:organizationId/calendar` with mandatory `from`, `until`: timestamps with timezone/millisecond precision; `[from,until)` with positive range up to 62 days. `type=all|tasks|events` defaults all. `limit=1..100` defaults50 per group. `after=UUID` only for a single group. Strict query rejects client identities, extra keys or grants.

Returns `{tasks,events}`. A group is null if unrequested or its read permission is absent. An explicitly requested unauthorized group, or all with neither read grant, returns403. Permitted group is `{items,nextCursor}`. Task item `{id,title,status,priority,dueAt,progressPercent}` includes noncancelled tasks whose dueAt >= from and < until; no staff data. Events item `{id,title,description,kind,startsAt,endsAt,location,status,createdAt,updatedAt}` includes intervals overlapping the range (`startsAt < until && endsAt > from`), including cancelled events for historical visibility. Safe event description is plain text, never HTML. No creator IDs or private IAM fields.

Tasks ordered dueAt/id ascending; events startsAt/id ascending. Resolve after within the authorized tenant/group/range; missing/foreign/out-of-range cursor =>400 without disclosing existence. Read operations produce no audit. UTC storage; frontend shows browser local time and explicitly labels the timezone. Pagination remains visible; calendar must not imply all records were loaded while nextCursor exists.

## Event mutations

POST `/api/v1/organizations/:organizationId/calendar/events`: calendar:create, body `{title,kind,startsAt,endsAt,description?,location?}`. Title trimmed1..200, no controls; kind EVENT|MEETING; dates valid timezone timestamps, endsAt strictly after startsAt, duration at most31days. Optional description null or trimmed1..4000 (newline/tab allowed); location null or trimmed1..200 no controls. No attendees, private-event semantics or recurrence in V1. Returns201 safe event. Organization and creator derive from request auth.

PATCH same path `/:eventId`: calendar:update; nonempty subset title/kind/startsAt/endsAt/description/location/status. status SCHEDULED|CANCELLED. Cancelled events cannot be reopened/edited; exact no-op is idempotent without audit/timestamp change. Returns200 safe event. Foreign/missing event =>404 after authorization. No DELETE; cancellation preserves history. No automatic notifications/invites.

JSON mutations enforce64KiB. 400 invalid shape/unknown fields/date range, 401 invalid auth, 403 denied context/permission, 404 scoped event missing, 409 terminal/conflict, 413 body limit, 500 atomic persistence failure. All writes and audit are one serializable transaction. Audit `calendar.event.created` / `calendar.event.updated` with resourceType calendar_event, scoped eventID, empty metadata (no title/location/description). No successful-read audit.

## Persistence and rollout

New migration `20260916000000_calendar_events` creates empty calendar_events table: UUID, tenant, creator membership reference, title/description/kind/start/end/location/status and timestamps. Restrictive composite (organizationId,createdByUserId) FK to membership, unique tenant/id, chronology and overlap indexes. No existing records or historical migrations modified; MySQL8.0.44/Prisma6.19.3 unchanged. Adds catalog constants, not automatic database role assignments.

Validate against disposable MySQL with migration replay and drift BEFORE applying to local dx_os. Deploy migration before new backend. Rollback: restore prior application, retain event data; only a separate reviewed forward migration may archive/drop new storage. No destructive rollback in this task. Approved leave will join the calendar as a separately authorized source when its real model ships.
