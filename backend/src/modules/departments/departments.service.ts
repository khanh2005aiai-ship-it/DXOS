import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthorizationService } from '../rbac/authorization.service';
import { PERMISSIONS, type PermissionKey } from '../rbac/permission-catalog';
import { AuditService } from '../audit/audit.service';
import { AUDIT_EVENTS } from '../audit/audit-catalog';
import type { CreateDepartmentDto, ListDepartmentsDto, UpdateDepartmentDto } from './department.dto';

const projection = { id: true, organizationId: true, code: true, name: true, description: true,
  status: true, createdAt: true, updatedAt: true } satisfies Prisma.DepartmentSelect;
export type DepartmentResponse = Prisma.DepartmentGetPayload<{ select: typeof projection }>;

@Injectable()
export class DepartmentsService {
  constructor(private readonly prisma: PrismaService, private readonly authorization: AuthorizationService,
    private readonly audit: AuditService) {}

  // Internal reference validation after caller authorization, within the caller's serializable transaction.
  async assertActiveReference(organizationId: string, id: string,
    tx: Pick<Prisma.TransactionClient, 'department'>): Promise<void> {
    const row = await tx.department.findUnique({ where: { organizationId_id: { organizationId, id } }, select: { status: true } });
    if (!row) throw new NotFoundException();
    if (row.status !== 'ACTIVE') throw new ConflictException();
  }

  create(userId: string, organizationId: string, input: CreateDepartmentDto): Promise<DepartmentResponse> {
    return this.transaction(userId, organizationId, PERMISSIONS.DEPARTMENT_CREATE, async (tx) => {
      const row = await tx.department.create({ data: { organizationId, code: input.code, name: input.name,
        description: input.description ?? null }, select: projection });
      await this.audit.record({ event: AUDIT_EVENTS.DEPARTMENT_CREATED, organizationId, actorUserId: userId,
        resourceId: row.id }, tx);
      return row;
    });
  }

  list(userId: string, organizationId: string, query: ListDepartmentsDto) {
    return this.transaction(userId, organizationId, PERMISSIONS.DEPARTMENT_READ, async (tx) => {
      const rows = await tx.department.findMany({ where: { organizationId,
        ...(query.after ? { id: { gt: query.after } } : {}), ...(query.status ? { status: query.status } : {}) },
      select: projection, orderBy: { id: 'asc' }, take: query.limit + 1 });
      const items = rows.slice(0, query.limit);
      return { items, nextCursor: rows.length > query.limit ? items[items.length - 1].id : null };
    });
  }

  getById(userId: string, organizationId: string, departmentId: string): Promise<DepartmentResponse> {
    return this.transaction(userId, organizationId, PERMISSIONS.DEPARTMENT_READ, (tx) => this.find(tx, organizationId, departmentId));
  }

  update(userId: string, organizationId: string, departmentId: string, input: UpdateDepartmentDto): Promise<DepartmentResponse> {
    return this.transaction(userId, organizationId, PERMISSIONS.DEPARTMENT_UPDATE, async (tx) => {
      const keys = ['name', 'description', 'status'] as const;
      if (!keys.some((key) => input[key] !== undefined)) throw new BadRequestException({ message: ['At least one editable field is required.'] });
      const existing = await this.find(tx, organizationId, departmentId);
      const changedFields = keys.filter((key) => input[key] !== undefined && input[key] !== existing[key]);
      if (!changedFields.length) return existing;
      const row = await tx.department.update({ where: { organizationId_id: { organizationId, id: departmentId } },
        data: { name: input.name, description: input.description, status: input.status }, select: projection });
      await this.audit.record({ event: AUDIT_EVENTS.DEPARTMENT_UPDATED, organizationId, actorUserId: userId,
        resourceId: row.id, metadata: { changedFields } }, tx);
      return row;
    });
  }

  private async find(tx: Prisma.TransactionClient, organizationId: string, id: string): Promise<DepartmentResponse> {
    const row = await tx.department.findUnique({ where: { organizationId_id: { organizationId, id } }, select: projection });
    if (!row) throw new NotFoundException();
    return row;
  }

  private async transaction<T>(userId: string, organizationId: string, permission: PermissionKey,
    operation: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        return await this.prisma.$transaction(async (tx) => {
          if (!(await this.authorization.can(userId, permission, organizationId, tx))) throw new ForbiddenException();
          return operation(tx);
        }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
      } catch (error) {
        if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2034') throw error;
        if (attempt === 2) throw new ConflictException();
      }
    }
  }
}
