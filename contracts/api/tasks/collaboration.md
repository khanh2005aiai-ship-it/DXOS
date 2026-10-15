# Task collaboration and progress — DXOS-WORK-002

Base T: /api/v1/organizations/:organizationId/tasks/:taskId.
Bearer JWT, active User/session, active organization/membership, and explicit existing RBAC grants are required. Tenant comes from the authenticated, authorized route context. No client permission lists, role-name bypass or automatic grants.

| Method/path | Explicit permissions | Input | Success |
| --- | --- | --- | --- |
| GET T/comments | task:read | limit?, after? | 200 TaskCommentPage |
| POST T/comments | task:update | {body:string} | 201 TaskComment |
| GET T/attachments | task:read AND file:read | limit?, after? | 200 TaskAttachmentPage |
| POST T/attachments | task:update AND file:read | {fileId:UUID} | 201 TaskAttachment |
| DELETE T/attachments/:attachmentId | task:update AND file:read | no body/query | 204 empty |
| PATCH T | Existing field matrix; progress requires task:update | progressPercent?, status?, existing fields | 200 Task |

Mutation grants permit the safe resulting resource; list/detail require their own read grants. Assignment fields still independently require task:assign. Unknown fields, ownership/privilege injection and nested Prisma inputs are rejected. JSON only for POST/PATCH, decoded maximum64KiB including compressed input.

## Safe responses

TaskComment: {id,taskId,authorUserId,authorDisplayName,body,createdAt}. IDs are UUIDs; timestamps are UTC ISO. Author is the authenticated member. Employee profile is optional. Display name is current same-org Employee displayName, falling back to User displayName or null. No historical name snapshot, email, phone, password, hash, session, token or grants.

Comment body is trimmed plain text,1..4000 characters; only LF/tab control characters allowed. Escape text in UI; never render as HTML. Comments cannot be edited/deleted in V1. POST is not idempotent: disable duplicate submission and do not automatically retry an uncertain result.

TaskAttachment: {id,taskId,linkedByUserId,createdAt,file:{id,originalFilename,contentType,size}}. Size is bytes or null. No storage key/provider/path, signed URL, checksum, nested security record or bytes. Use attachment.id for unlink, attachment.file.id for download.

Only AVAILABLE same-tenant files can be linked, validated inside the Work transaction through FilesService. Cross-tenant/missing file ->404; known same-tenant unavailable file ->409. Composite tenant FKs also protect task, file and member references. Duplicate link returns the existing link with201 and no extra audit.

Upload through the existing multipart Files endpoint with file:upload, then link the returned fileId. Select existing files with GET /api/v1/organizations/:organizationId/files (file:read). Download with authenticated GET /api/v1/organizations/:organizationId/files/:fileId/content (file:read).

Files remain shared organization resources. Linking does not create task-private documents or grant access. Upload and link are separate requests; if link fails, retain the uploaded file and allow retry/select-existing. Never automatically delete a shared file. Unlink removes only the association, preserving file bytes and all other task links; it does not require file:delete.

Unavailable/soft-deleted files are hidden from attachment lists. Their retained links can still be unlinked on nonterminal tasks. Foreign/wrong-task/missing/already-unlinked attachmentId returns404 without existence details.

## Pagination and lifecycle

Both collections return {items:[Resource],nextCursor:UUID|null}. Limit integer1..100/default25. Oldest first, createdAt ASC then id ASC, using millisecond timestamp precision. after is looked up strictly within the authorized tenant AND task; foreign/missing/wrong-task cursor ->400. This chronological cursor is an explicit exception to the flat Task list's ascending ID-bound convention.

An attachment cursor can still resolve after its file is soft-deleted. Physical unlink of the cursor requires restarting pagination. No total count, arbitrary search/sort, offset or snapshot guarantee. Reset cached pages on org/task changes, retain query on subsequent pages, and deduplicate by ID on refresh.

DONE/CANCELLED tasks permit reads and reject all new comment/link/unlink mutations with409. Child changes do not modify Task.updatedAt; each child has createdAt.

Task gains response field progressPercent. Create still starts TODO/0 and rejects client status/progress. PATCH accepts integer0..100:

| State | Progress | Status-only transition |
| --- | --- | --- |
| TODO | 0 | Reset0 |
| IN_PROGRESS | 0..99 | Preserve previous progress |
| DONE | 100 | Set100 |
| CANCELLED | 0..99, last estimate | Preserve previous progress |

Explicit inconsistent pairs ->409. Start at30% with {status:"IN_PROGRESS",progressPercent:30}; changing only progress never implicitly changes status. Complete with {status:"DONE"}. Terminal effective edits ->409. No-op preserves timestamps/audits. Last serialized write wins; no revision token, numeric history series or elapsed-time inference.

## Errors, audit and rollout

Existing error envelope/requestId. 401 invalid/missing/expired/revoked JWT/session or inactive User;403 inaccessible/inactive org/membership or missing grant;404 missing/foreign scoped task/file/attachment;409 terminal mutation, inconsistent progress, unavailable same-tenant file or exhausted serializable retries;400 DTO/query/cursor/malformed transport;413 body limit;500 operational failure with rollback. Parser failures may precede guards. Valid transport authorization precedes DTO/resource lookup and repeats in the transaction.

Successful reads create no audit. New events task.comment.added (resourceType task_comment) and task.attachment.linked/unlinked (task_attachment) contain child resourceId, verified tenant/actor/requestId and empty metadata. Bodies, filenames, bytes and URLs are never logged/audited. Progress uses task.updated with only the changedFields name progressPercent; effective status change still emits task.status_changed. Writes and audit commit atomically. No new notifications or grants.

Migration 20260914000000_task_collaboration must precede the new backend. Existing DONE rows backfill100; other old rows default0. Historical migrations remain unchanged. Existing payloads remain compatible; strict frontend response validators must accept the additive Task field. See [architecture](../../../docs/architecture/task-collaboration-v1.md) and the release status in docs/reports/DXOS-WORK-002-report.md.
