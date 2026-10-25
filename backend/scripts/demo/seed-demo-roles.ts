import { PrismaClient } from '@prisma/client';
import type { PrismaService } from '../../src/database/prisma.service';
import { AuditService } from '../../src/modules/audit/audit.service';
import { AUDIT_EVENTS } from '../../src/modules/audit/audit-catalog';
import { isPermissionKey, PERMISSIONS, type PermissionKey } from '../../src/modules/rbac/permission-catalog';
import { DEMO_ADMIN_EMAIL, DEMO_ORGANIZATION_SLUG } from './demo-fixtures';
import { DemoSeedError, localDemoDatabase } from './seed-demo-dataset';

const P = PERMISSIONS;
const EMPLOYEE: PermissionKey[] = [P.AI_USE, P.TASK_READ, P.CALENDAR_READ, P.DEPARTMENT_READ, P.LEAVE_READ, P.LEAVE_CREATE,
  P.ATTENDANCE_CHECK_IN, P.ATTENDANCE_CHECK_OUT];
const MANAGER: PermissionKey[] = [...EMPLOYEE, P.EMPLOYEE_READ, P.APPROVAL_READ, P.APPROVAL_APPROVE, P.APPROVAL_REJECT, P.LEAVE_APPROVE,
  P.ATTENDANCE_READ, P.ATTENDANCE_MANAGE, P.REPORT_READ, P.SCHEDULE_READ, P.SHIFT_READ, P.DOCUMENT_READ];
const HR: PermissionKey[] = [...MANAGER, P.DOCUMENT_SENSITIVE_READ, P.PAYROLL_READ, P.COMPENSATION_READ, P.PERFORMANCE_READ, P.GOAL_READ, P.KPI_READ];

/** Demo roles that show the AI assistant answering differently per permission set (spec 9.10). */
export const DEMO_ROLES = [
  { key: 'demo-employee', name: 'Nhân viên (demo)', permissions: EMPLOYEE, members: ['an.demo@dxos.local', 'hoang-nam.demo@dxos.local'] },
  { key: 'demo-manager', name: 'Quản lý (demo)', permissions: MANAGER, members: ['minh-anh.demo@dxos.local'] },
  { key: 'demo-hr', name: 'Nhân sự (demo)', permissions: HR, members: ['thu-ha.demo@dxos.local'] },
] as const;

/**
 * Explicit, local-only provisioning of the demo roles above. Idempotent: an existing role keeps its current grants
 * (operator edits win), existing assignments are kept, the `admin` role and the permission catalog are never touched.
 * Every role creation and assignment is audited in the same transaction.
 */
export async function seedDemoRoles(source: NodeJS.ProcessEnv) {
  const databaseUrl = localDemoDatabase(source);
  for (const role of DEMO_ROLES) for (const key of role.permissions) if (!isPermissionKey(key)) throw new DemoSeedError('UNKNOWN_PERMISSION');
  const db = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const audit = new AuditService(db as unknown as PrismaService);
  const created = { roles: 0, grants: 0, assignments: 0 };
  try {
    const result = await db.$transaction(async (tx) => {
      const organization = await tx.organization.findUnique({ where: { slug: DEMO_ORGANIZATION_SLUG }, select: { id: true, status: true } });
      const actor = await tx.user.findUnique({ where: { email: DEMO_ADMIN_EMAIL }, select: { id: true } });
      if (organization?.status !== 'ACTIVE' || !actor) throw new DemoSeedError('RUN_SEED_DEMO_ADMIN_FIRST');
      const org = organization.id;
      const summary: { role: string; status: 'created' | 'kept'; permissions: number; members: string[] }[] = [];
      for (const definition of DEMO_ROLES) {
        let role = await tx.role.findUnique({ where: { organizationId_key: { organizationId: org, key: definition.key } }, select: { id: true, isActive: true } });
        const status = role ? 'kept' as const : 'created' as const;
        if (!role) {
          role = await tx.role.create({ data: { organizationId: org, key: definition.key, name: definition.name, isActive: true,
            description: 'Role demo cho trợ lý AI; tạo bởi seed:demo-roles.' }, select: { id: true, isActive: true } });
          await audit.record({ event: AUDIT_EVENTS.ROLE_CREATED, organizationId: org, actorUserId: actor.id, resourceId: role.id }, tx);
          created.roles++;
          for (const key of definition.permissions) {
            const permission = await tx.permission.upsert({ where: { key }, update: {}, create: { key, name: key }, select: { id: true } });
            await tx.rolePermission.create({ data: { roleId: role.id, permissionId: permission.id } });
            created.grants++;
          }
        }
        if (!role.isActive) throw new DemoSeedError('DEMO_ROLE_INACTIVE_PRESERVED');
        const members: string[] = [];
        for (const email of definition.members) {
          const membership = await tx.organizationMembership.findFirst({ where: { organizationId: org, status: 'ACTIVE', user: { email } }, select: { id: true } });
          if (!membership) continue; // Run seed:demo first; missing demo users are skipped, not created here.
          const existing = await tx.membershipRole.findUnique({ where: { membershipId_roleId: { membershipId: membership.id, roleId: role.id } } });
          if (!existing) {
            await tx.membershipRole.create({ data: { organizationId: org, membershipId: membership.id, roleId: role.id } });
            await audit.record({ event: AUDIT_EVENTS.ROLE_ASSIGNED, organizationId: org, actorUserId: actor.id, resourceId: role.id }, tx);
            created.assignments++;
          }
          members.push(email);
        }
        const permissions = await tx.rolePermission.count({ where: { roleId: role.id } });
        summary.push({ role: definition.key, status, permissions, members });
      }
      return summary;
    });
    return { created, roles: result };
  } finally {
    await db.$disconnect();
  }
}
