# DXOS-WORK-002 — Task collaboration and progress

Scope: add plain-text comments, links to existing Files, and explicit task progress to the existing Work module. No Project, workflow engine, AI action, notification channel, frontend implementation or permission catalog changes.

Work owns TaskComment/TaskAttachment and the task progress column. FilesService validates AVAILABLE references within the Work transaction. Work reads only its public attachment projection when joining file metadata. File storage/upload/download/removal remain owned by Files. Comments derive the author from the authenticated member, with no Employee profile prerequisite. Existing tenant RBAC runs before validation and again inside serializable transactions with bounded conflict retries.

Writes use existing task:update; attachment operations also require file:read. Lists require task:read, plus file:read for attachments. No automatic grants or owner/creator/assignee bypass. Task terminal states remain immutable, including new collaboration mutations. Reads of historical comments/available attachments remain allowed. Comments are immutable in this version. Linking the same task/file twice returns the existing link; unlink removes only the link. Existing organization-shared file access is unchanged: this is not task-private document access.

Comments and attachment lists use createdAt/id ascending keyset pages, default25/max100. Millisecond database timestamp precision prevents cursor round-trip truncation. Cursor IDs resolve only within the authorized task and tenant; missing/foreign/wrong-task IDs all return 400. Deleted files are hidden from attachment results; retained links still resolve cursors. There is no cross-request snapshot; a physically unlinked cursor requires restarting pagination.

Progress is an integer: TODO=0, IN_PROGRESS=0..99, DONE=100, CANCELLED=0..99 (last recorded estimate). Status-only transitions to DONE/TODO set 100/0, preserving old client requests. Explicit inconsistent pairs return 409. No-op writes preserve task updatedAt and emit no audit. Progress changes use existing task.updated with a changedFields name, not the value. Audit gives operators an event record, not a numeric progress history API. Collaboration does not change task updatedAt; each child has its own createdAt.

Comment/link/unlink mutations and their audits commit together. New audit resource types task_comment/task_attachment use the child UUID and empty metadata. No body, filename, URL, file bytes or sensitive security data are logged. Reads produce no success audit. No new notifications are emitted. Current display names are safe projections, not historical author snapshots.

## Additive migration and deployment

Migration `20260914000000_task_collaboration` adds:

- tasks.progress_percent UNSIGNED TINYINT NOT NULL DEFAULT 0, with an explicit MySQL CHECK <=100. Existing DONE rows are backfilled to100; other states default0 because no historical percentage existed. Existing titles/statuses/assignments/timestamps are preserved.
- task_comments with tenant/task and tenant/author-member restrictive composite foreign keys, plus chronology and author indexes.
- task_attachments with tenant/task, tenant/file and tenant/linker-member restrictive composite foreign keys, unique tenant/task/file, and chronology/reference indexes.
- file_objects unique organization_id/id to support the tenant-aware attachment FK.

No historical migration edits, drops, credential, role or permission changes. MySQL8.0.44/Prisma6.19.3 remain pinned. Apply after disposable replay, FK/range tests and full regression checks. MySQL DDL is not transactionally rolled back: a failed deployment requires inspecting the migration state, never resetting dx_os. Schema diff validates Prisma-modeled structures; the manual CHECK is separately inspected and tested because Prisma6 does not model CHECK constraints.

Deploy migration before the new backend. Old clients keep working: the Task response gains progressPercent, PATCH accepts it, and the existing status-only path remains valid. Strict frontend runtime validators must accept the additive field. Task POST still rejects client-supplied status/progress. Demo seed creates DONE rows at100 for future fresh datasets; existing demo rows are not reseeded.

Rollback: prefer rolling back backend only while keeping additive tables/column. Removing schema objects requires a separately approved migration after exporting comments/links/progress and checking consumers; it loses collaboration data and is not automated here. Never edit an applied migration.

Concurrency: serializable authorization/reference checks prevent membership, file availability and terminal-state races. Last serialized progress update wins; no optimistic revision token. Comments are not idempotent: disable double submit and do not automatically retry uncertain POST outcomes. Duplicate attachment links are idempotent at the business key. No new dependencies or infrastructure.
