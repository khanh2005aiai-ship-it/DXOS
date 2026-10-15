import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthorizationService } from '../rbac/authorization.service';
import { PERMISSIONS, type PermissionKey } from '../rbac/permission-catalog';
import { AuditService } from '../audit/audit.service';
import { AUDIT_EVENTS } from '../audit/audit-catalog';
import { EmployeesService } from '../people/employees.service';
import { DepartmentsService } from '../departments/departments.service';
import { NotificationService } from '../notifications/notification.service';
import { NOTIFICATION_TYPES } from '../notifications/notification-catalog';
import type { CreateTaskDto, ListTasksDto, UpdateTaskDto } from './task.dto';
import { taskPermissions } from './task-policy';

const projection = { id: true, organizationId: true, creatorEmployeeId: true, assigneeEmployeeId: true, departmentId: true,
  title: true, description: true, status: true, progressPercent: true, priority: true, dueAt: true, createdAt: true, updatedAt: true } satisfies Prisma.TaskSelect;
export type TaskResponse = Prisma.TaskGetPayload<{ select: typeof projection }>;

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: AuthorizationService,
    private readonly audit: AuditService, private readonly employees: EmployeesService,
    private readonly departments: DepartmentsService, private readonly notifications: NotificationService) {}

  create(actorId: string, organizationId: string, input: CreateTaskDto): Promise<TaskResponse> {
    return this.transaction(actorId, organizationId, taskPermissions('POST', input), async (tx) => {
      const creator = await this.employees.eligibleCreator(organizationId, actorId, tx);
      const assignee = input.assigneeEmployeeId ? await this.employees.eligibleAssignee(organizationId, input.assigneeEmployeeId, tx) : null;
      if (input.departmentId) await this.departments.assertActiveReference(organizationId, input.departmentId, tx);
      const row = await tx.task.create({ data: { organizationId, creatorEmployeeId: creator.id,
        assigneeEmployeeId: assignee?.id ?? null, departmentId: input.departmentId ?? null, title: input.title,
        description: input.description ?? null, priority: input.priority ?? 'MEDIUM', dueAt: input.dueAt ? new Date(input.dueAt) : null }, select: projection });
      await this.audit.record({ event: AUDIT_EVENTS.TASK_CREATED, organizationId, actorUserId: actorId, resourceId: row.id }, tx);
      if (assignee) {
        await this.audit.record({ event: AUDIT_EVENTS.TASK_ASSIGNED, organizationId, actorUserId: actorId,
          resourceId: row.id, metadata: { changedFields: ['assigneeEmployeeId'] } }, tx);
        await this.notify(actorId, organizationId, row.id, assignee.userId, tx);
      }
      return row;
    });
  }
  list(actorId: string, organizationId: string, query: ListTasksDto) {
    return this.transaction(actorId, organizationId, [PERMISSIONS.TASK_READ], async (tx) => {
      const rows = await tx.task.findMany({ where: { organizationId,
        ...(query.after ? { id: { gt: query.after } } : {}), ...(query.status ? { status: query.status } : {}),
        ...(query.priority ? { priority: query.priority } : {}), ...(query.assigneeEmployeeId ? { assigneeEmployeeId: query.assigneeEmployeeId } : {}),
        ...(query.departmentId ? { departmentId: query.departmentId } : {}) }, select: projection, orderBy: { id: 'asc' }, take: query.limit + 1 });
      const items = rows.slice(0, query.limit);
      return { items, nextCursor: rows.length > query.limit ? items[items.length - 1].id : null };
    });
  }
  getById(actorId: string, organizationId: string, taskId: string): Promise<TaskResponse> {
    return this.transaction(actorId, organizationId, [PERMISSIONS.TASK_READ], (tx) => this.find(tx, organizationId, taskId));
  }
  update(actorId: string, organizationId: string, taskId: string, input: UpdateTaskDto): Promise<TaskResponse> {
    return this.transaction(actorId, organizationId, taskPermissions('PATCH', input), async (tx) => {
      const command = { ...input };
      const keys = ['title', 'description', 'assigneeEmployeeId', 'departmentId', 'status', 'priority', 'dueAt', 'progressPercent'] as const;
      if (!keys.some((key) => command[key] !== undefined)) throw new BadRequestException({ message: ['At least one editable field is required.'] });
      const existing = await this.find(tx, organizationId, taskId);
      // Status-only requests from V1 clients remain valid. Explicit inconsistent progress is rejected.
      if (command.progressPercent === undefined && command.status !== undefined && command.status !== existing.status) {
        if (command.status === 'DONE') command.progressPercent = 100;
        if (command.status === 'TODO') command.progressPercent = 0;
      }
      const dueAt = command.dueAt === undefined ? undefined : command.dueAt === null ? null : new Date(command.dueAt);
      const changedFields = keys.filter((key) => command[key] !== undefined && (key === 'dueAt'
        ? (dueAt?.getTime() ?? null) !== (existing.dueAt?.getTime() ?? null) : command[key] !== existing[key]));
      if (!changedFields.length) return existing;
      if (existing.status === 'DONE' || existing.status === 'CANCELLED') throw new ConflictException();
      const nextStatus = command.status ?? existing.status;
      const progress = command.progressPercent ?? existing.progressPercent;
      if ((nextStatus === 'TODO' && progress !== 0) || (nextStatus === 'DONE' && progress !== 100) ||
        (['IN_PROGRESS', 'CANCELLED'].includes(nextStatus) && progress === 100)) throw new ConflictException();
      const assignee = changedFields.includes('assigneeEmployeeId') && command.assigneeEmployeeId
        ? await this.employees.eligibleAssignee(organizationId, command.assigneeEmployeeId, tx) : null;
      if (changedFields.includes('departmentId') && command.departmentId) await this.departments.assertActiveReference(organizationId, command.departmentId, tx);
      const row = await tx.task.update({ where: { organizationId_id: { organizationId, id: taskId } }, data: {
        title: command.title, description: command.description, assigneeEmployeeId: command.assigneeEmployeeId,
        departmentId: command.departmentId, status: command.status, progressPercent: command.progressPercent, priority: command.priority, dueAt }, select: projection });
      await this.audit.record({ event: AUDIT_EVENTS.TASK_UPDATED, organizationId, actorUserId: actorId, resourceId: row.id, metadata: { changedFields } }, tx);
      if (changedFields.includes('status')) await this.audit.record({ event: AUDIT_EVENTS.TASK_STATUS_CHANGED, organizationId,
        actorUserId: actorId, resourceId: row.id, metadata: { changedFields: ['status'] } }, tx);
      if (changedFields.includes('assigneeEmployeeId')) {
        await this.audit.record({ event: AUDIT_EVENTS.TASK_ASSIGNED, organizationId, actorUserId: actorId,
          resourceId: row.id, metadata: { changedFields: ['assigneeEmployeeId'] } }, tx);
        if (assignee) await this.notify(actorId, organizationId, row.id, assignee.userId, tx);
      }
      return row;
    });
  }
  private async notify(actorId: string, organizationId: string, taskId: string, recipientUserId: string, tx: Prisma.TransactionClient) {
    if (recipientUserId === actorId) return;
    await this.notifications.createForRecipient({ organizationId, recipientUserId, type: NOTIFICATION_TYPES.TASK_ASSIGNED, metadata: { taskId } }, tx);
  }
  private async find(tx: Prisma.TransactionClient, organizationId: string, id: string): Promise<TaskResponse> {
    const row = await tx.task.findUnique({ where: { organizationId_id: { organizationId, id } }, select: projection });
    if (!row) throw new NotFoundException();
    return row;
  }
  private async transaction<T>(actorId: string, organizationId: string, permissions: PermissionKey[], operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          for (const permission of permissions) if (!(await this.authorization.can(actorId, permission, organizationId, tx))) throw new ForbiddenException();
          return operation(tx);
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034') throw error;
        if (attempt === 2) throw new ConflictException();
      }
    }
  }
}
