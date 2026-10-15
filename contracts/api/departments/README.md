# Departments V1 — DXOS-DOMAIN-002

Implemented by DXOS-DOMAIN-003 and included in served OpenAPI. Additive API; existing APIs remain unchanged. Common rules in [business API rules](../business-v1.md) apply, with the transport behavior clarified below.

Base: `/api/v1/organizations/:organizationId/departments`.

| Method/path | Permission | Request | Success |
| --- | --- | --- | --- |
| GET base | department:read | Common pagination; optional status=ACTIVE or INACTIVE | 200 page of Department |
| POST base | department:create | `{code,name,description?}` | 201 Department |
| GET base/:departmentId | department:read | UUID | 200 Department |
| PATCH base/:departmentId | department:update | Nonempty subset `{name,description,status}` | 200 Department |

Department response: `{id,organizationId,code,name,description,status,createdAt,updatedAt}`. IDs are UUIDs, timestamps UTC ISO 8601, description nullable; status ACTIVE or INACTIVE. No embedded employee directory or grant data.

Code is immutable: trim, uppercase, 1–64 ASCII characters matching `^[A-Z0-9]+(?:[-_][A-Z0-9]+)*$`; unique within organization including inactive rows. Name trimmed 1–200 characters. Description optional at creation (default null), nullable on PATCH, trimmed 1–1000 characters when non-null. Single-line names/codes reject control characters; description permits LF/tab only. Server generates ID/timestamps/status ACTIVE. Unknown fields, including parentDepartmentId, organizationId and permissions, are rejected. Status permits ACTIVE↔INACTIVE. No delete route.

V1 departments are flat. Existing parentDepartmentId is preserved in storage, never accepted, changed or used as authorization by these APIs; legacy hierarchy remains outside V1. Migration `20260909000000_department_v1` adds nullable description and status default ACTIVE. Existing codes and parent relationships are preserved without normalization; the canonical code rules apply to new creates only. No new index is needed: existing tenant/code and tenant/id unique indexes support uniqueness and pagination.

Inactive departments remain readable. New or changed employee/task department references require ACTIVE. Deactivation retains existing references and does not cascade employee/membership/task changes; unrelated edits to linked resources remain allowed. Reactivation is explicit. No child traversal, managers or cost-centre semantics.

Errors: common 401/403/404/400 rules; 409 CONFLICT for duplicate normalized code. No discovery of cross-tenant codes. Updates/deactivation and reference creation must serialize their active-state checks to avoid committing a new reference after deactivation. Audit department.created/updated records safe field names, not description/name values. No department notification in V1.

Implementation details: all four operations recheck active authorization inside a serializable transaction; conflict retries are bounded and exhausted serialization conflicts return 409. Creation and effective updates commit their audit in the same transaction. No-op PATCH returns the unchanged resource/timestamp without an audit. Empty PATCH returns 400 VALIDATION_FAILED. Omitted fields remain unchanged; only description accepts null. Audit storage failure rolls back changes and returns a safe 500. New permissions are catalog entries only, never automatic grants.

POST/PATCH accept application/json only. Transport parsing occurs before guards: malformed JSON returns 400 BAD_REQUEST and decoded JSON bodies exceeding 64 KiB return 413 PAYLOAD_TOO_LARGE, including chunked/compressed input. Ordinary valid JSON reaches JWT and tenant authorization before DTO/resource validation. Non-JSON writes return 400 after guards. Unknown query fields are rejected on every operation; only list accepts limit/after/status. Missing or foreign department under an authorized tenant returns 404 NOT_FOUND; malformed department UUID returns 400 VALIDATION_FAILED; invalid or inaccessible organization UUID returns 403 FORBIDDEN. Read includes inactive departments. No delete, hierarchy, employee, reference-attachment or notification endpoint is added.

Future Employee/Task integrations must implement same-tenant active-reference validation transactionally before referencing this resource; those consumers are not part of Department V1.
