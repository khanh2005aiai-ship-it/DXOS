# HR Reports & Analytics — TASK 8 (additive)

Contract recorded before implementation. Base `/api/v1/organizations/:organizationId/reports`. JSON and existing error envelopes/auth conventions are preserved. No schema/migration, separate API client, reporting store or recalculation engine.

## Routes and authorization

GET base `/overview`, `/workforce`, `/attendance`, `/leave`, `/payroll`, `/departments`, `/performance`. JWT + ACTIVE account/session/organization/membership + explicit report:read for every route. Exports GET `/:kind/export` (workforce/attendance/leave/payroll/departments) additionally require report:export. REPORT_MANAGE is not introduced because there is no report mutation/configuration workflow. No role-name bypass, automatic grants or client-supplied permission list.

Additional read scopes:

| Section | Required existing permissions |
| --- | --- |
| Workforce | employee:read |
| Attendance across employees | attendance:read AND attendance:manage |
| Schedule-based attendance denominator/off-days | schedule:read in addition to Attendance grants |
| Leave across employees | leave:read AND leave:approve |
| Payroll, including totals/trends/exports | payroll:read |
| Department identities and workforce grouping | department:read AND employee:read |
| Performance | Unavailable until TASK 7 adapter integration; no guessed permission |

Overview returns unavailable/unauthorized sections as null, never synthetic zero; performance returns explicit availability without metrics when integration is pending. Dedicated section/export lacking its underlying grants returns403. No salary query or serialized payroll amounts when payroll:read is absent, including in department tables. Exports recheck all permissions and scope in the same transaction as aggregation and audit.

## Filters, bounds and error behavior

`dateFrom`, `dateTo`: required real YYYY-MM-DD dates, inclusive, year1000..9998, dateFrom<=dateTo, maximum366days. `interval=day|week|month`, defaultday. `departmentId`, `employeeId`: optional UUID; lookups require the corresponding employee/department read permission and same organization. Missing/foreign IDs return indistinguishable404 after authorization. Supplying both uses their intersection. `employeeStatus=ACTIVE|INACTIVE`; `leaveStatus=PENDING|APPROVED|REJECTED|CANCELLED`; `attendanceStatus=PRESENT|LATE|ABSENT|ON_LEAVE|INCOMPLETE`; `payrollStatus` uses actual PayrollPeriodStatus, defaultFINALIZED. Status filters affect their own source, employeeStatus affects all joined employee sources. Unknown filters/identity/permission overrides rejected400. PayrollStatus/filter metadata carries no payroll facts for an unauthorized caller.

All date-only values use existing Asia/Ho_Chi_Minh (UTC+07) business-day semantics. SQL DATE workDate/periodEnd are calendar dates, never browser-local timestamps. Leave/employee creation timestamps use Vietnam day boundaries. Weeks start Monday; first/last bucket may be partial.

Department pages use `limit=1..100/default25` and `after=UUID`, sorted id ascending, scoped cursor validation. KPI totals never count just a page. Overview uses the first25 department rows with nextCursor; dedicated department route supports paging. Department export is bounded to1000 rows and fails400 rather than silently truncating larger results. Monetary currency aggregates are bounded to20 currencies (fail400 when exceeded). Output trends have at most366/54/13 buckets; empty aggregate count0, undefined rate/average null with an explicit denominator.

401 invalid/missing auth,403 denied membership/permission,404 scoped employee/department/cursor missing,400 invalid filters/range/output bound,409 serialization retry exhausted,500 safe persistence/query failure. Foreign/missing organization receives generic403. No data values or query text in audit/error logs.

## Metric definitions

Workforce: current-state headcount and ACTIVE/INACTIVE distribution under employee/department/status filters. Date range does not fabricate historical headcount. `newEmployeeRecords` and registration trend use Employee.createdAt in range; these are record registrations, not hires or net employee growth. No employee status/department history exists. Unassigned department count is explicit.

Attendance: count records by workDate/status; reuse stored lateMinutes, earlyLeaveMinutes and workedMinutes. Late = status LATE OR stored lateMinutes>0. Early = stored earlyLeaveMinutes>0. Present = status PRESENT/LATE/INCOMPLETE (actual check-in records); ABSENT/ON_LEAVE counts reflect explicit records only. Total/average worked minutes use completed records with non-null workedMinutes, with null average when none. `lateRate` denominator is present records. Schedule metrics require schedule:read: planned working days count non-off schedules with a shift; offDays counts isOff schedules. Attendance rate uses attended planned days divided by planned working days, with matching employee/workDate and no shift-rule recalculation. Schedule denominator ignores attendanceStatus filter and is labeled; matched numerator uses the attendance filter. No inference that unscheduled/missing records are absences. Current schedule edits may change denominator; no historical schedule snapshots. Daily stored aggregates are bucketed without recomputing shift logic.

Leave: requests whose startsAt business date falls in range; status distribution, stored daysCount sums and approvedDays. Trend follows leave start date. Entire stored daysCount is attributed to the request start cohort, even if a request ends outside the range; this is not prorated leave consumed during the range. UNPAID is a real LeaveType; do not infer all other types are legally paid. No reason/reviewer notes exposed.

Payroll: existing records belonging to periods whose periodEnd is in range and whose status matches payrollStatus (defaultFINALIZED). Period/record/unique-employee counts, gross/net totals and average net **per payroll record**, grouped separately by currency. Trend uses periodEnd business date; do not mix currencies, prorate or recalculate totals. SUM/AVG on DECIMAL; fixed2 decimal strings, never floating-point money. Record, employee AND parent period must all match organization (existing Payroll FKs are not all composite). Department grouping uses the employee's CURRENT department; no historical department snapshot is assumed. Finalized periods/records remain unchanged. Do not read CompensationProfile, PayrollItem or individual salary fields.

Departments: current department metadata/headcount, permitted attendance/leave aggregates and permitted payroll currency totals. Batched aggregation per page, no employee ranking. Missing permissions yield null per section. Unassigned employees appear as a workforce count, not a fabricated Department.

## Responses and export

Overview `{organizationId,generatedAt,filters,timezone,workforce,attendance,leave,payroll,departments,performance}`; section-specific routes return the corresponding section. Sections include named counters, status distributions, bounded trends and denominator fields. Served OpenAPI supplies exact field schemas.

CSV UTF-8 with BOM, CRLF, fixed stable columns `section,bucket,departmentId,departmentName,currency,metric,value`. Aggregates only; no private employee/financial detail rows. All text cells are quoted/escaped and sanitized against leading formula characters (=,+,-,@), including leading whitespace/control tricks. Money exported as exact decimal text. Dates ISO/business-date format. Content-Disposition uses validated kind/dates only, Cache-Control no-store. Every successful export atomically records `report.exported` with resourceType report, organization context, authenticated actor, organizationId as resourceId and empty metadata. No report contents, filters or employee IDs logged. Audit failure aborts CSV response. Ordinary report reads are unaudited.

No changes to transactional module behavior. Performance provider is isolated under reports and returns unavailable while TASK 7 is partial. Final integration must use actual TASK 7 authorization, finalized/released visibility rules and actual model terminology; do not derive aggregate ratings from unapproved drafts.
