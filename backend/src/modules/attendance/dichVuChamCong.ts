import {
  ForbiddenException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { ApiErrorException } from '../../common/errors/api-error.exception';
import { AttendanceStatus, EmployeeStatus, LeaveStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { AuthorizationService } from '../rbac/authorization.service';
import { PERMISSIONS } from '../rbac/permission-catalog';
import { AuditService } from '../audit/audit.service';
import { AUDIT_EVENTS } from '../audit/audit-catalog';
import type { AttendanceSummaryDto, CheckInDto, CheckOutDto, ListAttendanceDto } from './attendance.dto';
import { AttendanceLocationService } from './attendance-location.service';

export const attendanceProjection = {
  id: true,
  organizationId: true,
  employeeId: true,
  shiftId: true,
  workDate: true,
  checkInAt: true,
  checkOutAt: true,
  status: true,
  lateMinutes: true,
  earlyLeaveMinutes: true,
  workedMinutes: true,
  note: true,
  createdAt: true,
  updatedAt: true,
  shift: {
    select: {
      id: true,
      name: true,
      code: true,
      startTime: true,
      endTime: true,
      breakStart: true,
      breakEnd: true,
      gracePeriodMinutes: true,
      isOvernight: true,
    },
  },
  employee: {
    select: {
      id: true,
      employeeCode: true,
      displayName: true,
      jobTitle: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
    },
  },
} satisfies Prisma.AttendanceRecordSelect;

export type AttendanceRecordResponse = Prisma.AttendanceRecordGetPayload<{ select: typeof attendanceProjection }>;

export const VIETNAM_OFFSET_MS = 7 * 60 * 60 * 1000;

export interface ShiftTimeConfig {
  startTime?: string;
  endTime?: string;
  breakStart?: string | null;
  breakEnd?: string | null;
  gracePeriodMinutes?: number;
  isOvernight?: boolean;
}

export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
  const parts = timeStr.split(':').map(Number);
  return { hours: parts[0] || 0, minutes: parts[1] || 0 };
}

export function getVietnamDateParts(date: Date): {
  year: number;
  month: number; // 0-indexed
  day: number;
  hours: number;
  minutes: number;
  seconds: number;
  workDate: Date;
  dayStartUtc: Date;
  dayEndUtc: Date;
} {
  const local = new Date(date.getTime() + VIETNAM_OFFSET_MS);
  const year = local.getUTCFullYear();
  const month = local.getUTCMonth();
  const day = local.getUTCDate();
  const hours = local.getUTCHours();
  const minutes = local.getUTCMinutes();
  const seconds = local.getUTCSeconds();

  const workDate = new Date(Date.UTC(year, month, day, 0, 0, 0));
  const dayStartUtc = new Date(Date.UTC(year, month, day, 0, 0, 0) - VIETNAM_OFFSET_MS);
  const dayEndUtc = new Date(Date.UTC(year, month, day, 23, 59, 59, 999) - VIETNAM_OFFSET_MS);

  return { year, month, day, hours, minutes, seconds, workDate, dayStartUtc, dayEndUtc };
}

export function getShiftDateTimes(workDate: Date, shift?: ShiftTimeConfig) {
  const { year, month, day } = getVietnamDateParts(workDate);
  const startTime = shift?.startTime || '09:00';
  const endTime = shift?.endTime || '18:00';
  const graceMinutes = shift?.gracePeriodMinutes ?? 0;
  const isOvernight = shift?.isOvernight ?? false;

  const startParts = parseTimeString(startTime);
  const endParts = parseTimeString(endTime);

  const shiftStartUtc = new Date(Date.UTC(year, month, day, startParts.hours, startParts.minutes, 0) - VIETNAM_OFFSET_MS);
  const endDayOffset = isOvernight ? 1 : 0;
  const shiftEndUtc = new Date(Date.UTC(year, month, day + endDayOffset, endParts.hours, endParts.minutes, 0) - VIETNAM_OFFSET_MS);
  const graceCutoffUtc = new Date(shiftStartUtc.getTime() + graceMinutes * 60000);

  let breakStartUtc: Date | null = null;
  let breakEndUtc: Date | null = null;

  const breakStart = shift ? shift.breakStart : '12:00';
  const breakEnd = shift ? shift.breakEnd : '13:00';

  if (breakStart && breakEnd) {
    const bStartParts = parseTimeString(breakStart);
    const bEndParts = parseTimeString(breakEnd);
    const bStartDayOffset = (isOvernight && bStartParts.hours < startParts.hours) ? 1 : 0;
    const bEndDayOffset = (isOvernight && bEndParts.hours < startParts.hours) ? 1 : 0;

    breakStartUtc = new Date(Date.UTC(year, month, day + bStartDayOffset, bStartParts.hours, bStartParts.minutes, 0) - VIETNAM_OFFSET_MS);
    breakEndUtc = new Date(Date.UTC(year, month, day + bEndDayOffset, bEndParts.hours, bEndParts.minutes, 0) - VIETNAM_OFFSET_MS);
  }

  return { shiftStartUtc, shiftEndUtc, graceCutoffUtc, breakStartUtc, breakEndUtc };
}

export function calculateLateMinutes(checkInAt: Date, shift?: ShiftTimeConfig, customWorkDate?: Date): number {
  const { workDate } = getVietnamDateParts(customWorkDate ?? checkInAt);
  const { shiftStartUtc, graceCutoffUtc } = getShiftDateTimes(workDate, shift);

  if (checkInAt.getTime() > graceCutoffUtc.getTime()) {
    return Math.floor((checkInAt.getTime() - shiftStartUtc.getTime()) / 60000);
  }
  return 0;
}

export function calculateEarlyLeaveMinutes(checkOutAt: Date, shift?: ShiftTimeConfig, customWorkDate?: Date): number {
  const { workDate } = getVietnamDateParts(customWorkDate ?? checkOutAt);
  const { shiftEndUtc } = getShiftDateTimes(workDate, shift);

  if (checkOutAt.getTime() < shiftEndUtc.getTime()) {
    return Math.floor((shiftEndUtc.getTime() - checkOutAt.getTime()) / 60000);
  }
  return 0;
}

export function calculateWorkedMinutes(
  checkInAt: Date,
  checkOutAt: Date,
  shift?: ShiftTimeConfig,
  customWorkDate?: Date,
): number {
  if (checkOutAt.getTime() <= checkInAt.getTime()) {
    return 0;
  }
  const grossMinutes = Math.floor((checkOutAt.getTime() - checkInAt.getTime()) / 60000);
  const { workDate } = getVietnamDateParts(customWorkDate ?? checkInAt);
  const { breakStartUtc, breakEndUtc } = getShiftDateTimes(workDate, shift);

  if (breakStartUtc && breakEndUtc) {
    const overlapStart = Math.max(checkInAt.getTime(), breakStartUtc.getTime());
    const overlapEnd = Math.min(checkOutAt.getTime(), breakEndUtc.getTime());
    const lunchOverlapMinutes = overlapStart < overlapEnd ? Math.floor((overlapEnd - overlapStart) / 60000) : 0;
    return Math.max(0, grossMinutes - lunchOverlapMinutes);
  }

  return grossMinutes;
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authz: AuthorizationService,
    private readonly audit: AuditService,
    private readonly location: AttendanceLocationService,
  ) {}

  private async resolveActiveEmployee(tx: Prisma.TransactionClient, organizationId: string, userId: string) {
    const employee = await tx.employee.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId,
        },
      },
    });

    if (!employee || employee.status !== EmployeeStatus.ACTIVE) {
      throw new ForbiddenException('Hồ sơ nhân viên không tồn tại hoặc đã bị vô hiệu hóa trong tổ chức này.');
    }

    return employee;
  }

  async checkIn(
    organizationId: string,
    actorUserId: string,
    dto: CheckInDto,
    customNow?: Date,
  ): Promise<AttendanceRecordResponse> {
    const now = customNow ?? new Date();
    const { workDate, dayStartUtc, dayEndUtc } = getVietnamDateParts(now);

    return this.prisma.$transaction(
      async (tx) => {
        const employee = await this.resolveActiveEmployee(tx, organizationId, actorUserId);

        await this.location.assertInside(tx, organizationId, actorUserId, PERMISSIONS.ATTENDANCE_CHECK_IN, dto.location, now);

        // 1. Check Leave Management integration:
        // If employee has an APPROVED leave covering today, check-in is rejected
        const approvedLeave = await tx.leaveRequest.findFirst({
          where: {
            organizationId,
            employeeId: employee.id,
            status: LeaveStatus.APPROVED,
            startsAt: { lte: dayEndUtc },
            endsAt: { gte: dayStartUtc },
          },
        });

        if (approvedLeave) {
          throw new ApiErrorException(
            HttpStatus.CONFLICT,
            'EMPLOYEE_ON_LEAVE',
            'Nhân viên đang trong thời gian nghỉ phép đã được phê duyệt (EMPLOYEE_ON_LEAVE).',
          );
        }

        // 2. Resolve Work Schedule for today (or yesterday if overnight)
        let schedule = await tx.workSchedule.findUnique({
          where: {
            organizationId_employeeId_workDate: {
              organizationId,
              employeeId: employee.id,
              workDate,
            },
          },
          include: {
            shift: true,
          },
        });

        let targetWorkDate = workDate;

        // If no schedule today, check if yesterday was an overnight shift that is still ongoing and not yet checked in
        if (!schedule || schedule.isOff) {
          const yesterdayWorkDate = new Date(workDate.getTime() - 24 * 60 * 60 * 1000);
          const yesterdaySchedule = await tx.workSchedule.findUnique({
            where: {
              organizationId_employeeId_workDate: {
                organizationId,
                employeeId: employee.id,
                workDate: yesterdayWorkDate,
              },
            },
            include: { shift: true },
          });

          if (yesterdaySchedule && !yesterdaySchedule.isOff && yesterdaySchedule.shift?.isOvernight) {
            const existingYesterday = await tx.attendanceRecord.findUnique({
              where: {
                organizationId_employeeId_workDate: {
                  organizationId,
                  employeeId: employee.id,
                  workDate: yesterdayWorkDate,
                },
              },
            });
            if (!existingYesterday) {
              schedule = yesterdaySchedule;
              targetWorkDate = yesterdayWorkDate;
            }
          }
        }

        if (!schedule) {
          throw new ApiErrorException(
            HttpStatus.BAD_REQUEST,
            'NO_SCHEDULE_ASSIGNED',
            'Bạn chưa được phân ca làm việc hôm nay.',
          );
        }

        if (schedule.isOff) {
          throw new ApiErrorException(
            HttpStatus.BAD_REQUEST,
            'SCHEDULE_OFF_DAY',
            'Hôm nay là ngày nghỉ của bạn theo lịch phân ca.',
          );
        }

        if (!schedule.shift || !schedule.shift.isActive) {
          throw new ApiErrorException(
            HttpStatus.BAD_REQUEST,
            'NO_SCHEDULE_ASSIGNED',
            'Ca làm việc được phân không tồn tại hoặc đã bị vô hiệu hóa.',
          );
        }

        // 3. Check if already checked in for targetWorkDate:
        const existing = await tx.attendanceRecord.findUnique({
          where: {
            organizationId_employeeId_workDate: {
              organizationId,
              employeeId: employee.id,
              workDate: targetWorkDate,
            },
          },
        });

        if (existing) {
          throw new ApiErrorException(
            HttpStatus.CONFLICT,
            'ALREADY_CHECKED_IN',
            'Bạn đã thực hiện check-in cho ngày hôm nay rồi.',
          );
        }

        const lateMinutes = calculateLateMinutes(now, schedule.shift, targetWorkDate);
        const status = lateMinutes > 0 ? AttendanceStatus.LATE : AttendanceStatus.PRESENT;

        const record = await tx.attendanceRecord.create({
          data: {
            organizationId,
            employeeId: employee.id,
            shiftId: schedule.shift.id,
            workDate: targetWorkDate,
            checkInAt: now,
            status,
            lateMinutes,
            earlyLeaveMinutes: 0,
            note: dto.note?.trim() || null,
          },
          select: attendanceProjection,
        });

        await this.audit.record(
          {
            organizationId,
            actorUserId,
            event: AUDIT_EVENTS.ATTENDANCE_CHECK_IN,
            resourceId: record.id,
          },
          tx,
        );

        return record;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async checkOut(
    organizationId: string,
    actorUserId: string,
    dto: CheckOutDto,
    customNow?: Date,
  ): Promise<AttendanceRecordResponse> {
    const now = customNow ?? new Date();
    const { workDate } = getVietnamDateParts(now);

    return this.prisma.$transaction(
      async (tx) => {
        const employee = await this.resolveActiveEmployee(tx, organizationId, actorUserId);

        await this.location.assertInside(tx, organizationId, actorUserId, PERMISSIONS.ATTENDANCE_CHECK_OUT, dto.location, now);

        // Find active open attendance record (first check today, then yesterday if open overnight)
        let existing = await tx.attendanceRecord.findUnique({
          where: {
            organizationId_employeeId_workDate: {
              organizationId,
              employeeId: employee.id,
              workDate,
            },
          },
          include: { shift: true },
        });

        if (!existing || existing.checkOutAt) {
          const yesterdayWorkDate = new Date(workDate.getTime() - 24 * 60 * 60 * 1000);
          const yesterdayRecord = await tx.attendanceRecord.findUnique({
            where: {
              organizationId_employeeId_workDate: {
                organizationId,
                employeeId: employee.id,
                workDate: yesterdayWorkDate,
              },
            },
            include: { shift: true },
          });

          if (yesterdayRecord && !yesterdayRecord.checkOutAt) {
            existing = yesterdayRecord;
          }
        }

        if (!existing) {
          throw new ApiErrorException(
            HttpStatus.BAD_REQUEST,
            'CHECK_IN_REQUIRED',
            'Bạn chưa thực hiện check-in hôm nay, không thể check-out.',
          );
        }

        if (existing.checkOutAt) {
          throw new ApiErrorException(
            HttpStatus.CONFLICT,
            'ALREADY_CHECKED_OUT',
            'Bạn đã thực hiện check-out cho ngày hôm nay rồi.',
          );
        }

        if (now.getTime() < existing.checkInAt.getTime()) {
          throw new ApiErrorException(
            HttpStatus.BAD_REQUEST,
            'INVALID_CHECKOUT_TIME',
            'Thời gian check-out không thể diễn ra trước thời gian check-in.',
          );
        }

        const shiftConfig = existing.shift ?? undefined;
        const earlyLeaveMinutes = calculateEarlyLeaveMinutes(now, shiftConfig, existing.workDate);
        const workedMinutes = calculateWorkedMinutes(existing.checkInAt, now, shiftConfig, existing.workDate);

        const updated = await tx.attendanceRecord.update({
          where: {
            organizationId_id: {
              organizationId,
              id: existing.id,
            },
          },
          data: {
            checkOutAt: now,
            earlyLeaveMinutes,
            workedMinutes,
            note: dto.note?.trim() ? [existing.note, dto.note.trim()].filter(Boolean).join(' | ') : existing.note,
          },
          select: attendanceProjection,
        });

        await this.audit.record(
          {
            organizationId,
            actorUserId,
            event: AUDIT_EVENTS.ATTENDANCE_CHECK_OUT,
            resourceId: updated.id,
          },
          tx,
        );

        return updated;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async getTodayStatus(organizationId: string, actorUserId: string, customNow?: Date) {
    const now = customNow ?? new Date();
    const { workDate, dayStartUtc, dayEndUtc } = getVietnamDateParts(now);

    const employee = await this.prisma.employee.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: actorUserId,
        },
      },
      select: {
        id: true,
        displayName: true,
        employeeCode: true,
        status: true,
      },
    });

    if (!employee || employee.status !== EmployeeStatus.ACTIVE) {
      return {
        isEmployee: false,
        employee: null,
        record: null,
        approvedLeave: null,
        todayDate: workDate.toISOString().slice(0, 10),
        todaySchedule: null,
        todayShift: null,
        isOff: false,
      };
    }

    const yesterdayWorkDate = new Date(workDate.getTime() - 24 * 60 * 60 * 1000);

    const [todayRecord, yesterdayRecord, approvedLeave, todaySchedule] = await Promise.all([
      this.prisma.attendanceRecord.findUnique({
        where: {
          organizationId_employeeId_workDate: {
            organizationId,
            employeeId: employee.id,
            workDate,
          },
        },
        select: attendanceProjection,
      }),
      this.prisma.attendanceRecord.findUnique({
        where: {
          organizationId_employeeId_workDate: {
            organizationId,
            employeeId: employee.id,
            workDate: yesterdayWorkDate,
          },
        },
        select: attendanceProjection,
      }),
      this.prisma.leaveRequest.findFirst({
        where: {
          organizationId,
          employeeId: employee.id,
          status: LeaveStatus.APPROVED,
          startsAt: { lte: dayEndUtc },
          endsAt: { gte: dayStartUtc },
        },
        select: {
          id: true,
          leaveType: true,
          startsAt: true,
          endsAt: true,
          daysCount: true,
          reason: true,
        },
      }),
      this.prisma.workSchedule.findUnique({
        where: {
          organizationId_employeeId_workDate: {
            organizationId,
            employeeId: employee.id,
            workDate,
          },
        },
        include: {
          shift: {
            select: {
              id: true,
              name: true,
              code: true,
              startTime: true,
              endTime: true,
              breakStart: true,
              breakEnd: true,
              gracePeriodMinutes: true,
              isOvernight: true,
              isActive: true,
            },
          },
        },
      }),
    ]);

    // If today has no record but yesterday has an open overnight record (checkOutAt is null), display it
    let record = todayRecord;
    if (!record && yesterdayRecord && !yesterdayRecord.checkOutAt && yesterdayRecord.shift?.isOvernight) {
      record = yesterdayRecord;
    }

    return {
      isEmployee: true,
      employee,
      record,
      approvedLeave,
      todayDate: workDate.toISOString().slice(0, 10),
      todaySchedule,
      todayShift: todaySchedule?.shift ?? null,
      isOff: todaySchedule?.isOff ?? false,
    };
  }

  async listAttendance(
    organizationId: string,
    actorUserId: string,
    dto: ListAttendanceDto,
  ): Promise<{ items: AttendanceRecordResponse[]; nextCursor: string | null }> {
    const callerEmployee = await this.prisma.employee.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: actorUserId,
        },
      },
    });

    const hasManagePermission = await this.authz.can(actorUserId, PERMISSIONS.ATTENDANCE_MANAGE, organizationId);

    let targetEmployeeId = dto.employeeId;
    if (!hasManagePermission) {
      if (!callerEmployee) {
        return { items: [], nextCursor: null };
      }
      targetEmployeeId = callerEmployee.id;
    }

    const where: Prisma.AttendanceRecordWhereInput = {
      organizationId,
    };

    if (targetEmployeeId) {
      where.employeeId = targetEmployeeId;
    }

    if (dto.status) {
      where.status = dto.status;
    }

    if (dto.workDate) {
      const parts = dto.workDate.split('-').map(Number);
      where.workDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    } else if (dto.from || dto.to) {
      where.workDate = {};
      if (dto.from) {
        const parts = dto.from.split('-').map(Number);
        where.workDate.gte = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      }
      if (dto.to) {
        const parts = dto.to.split('-').map(Number);
        where.workDate.lte = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
      }
    }

    const take = dto.limit ?? 25;
    const items = await this.prisma.attendanceRecord.findMany({
      where,
      take: take + 1,
      ...(dto.after
        ? {
            cursor: {
              organizationId_id: {
                organizationId,
                id: dto.after,
              },
            },
            skip: 1,
          }
        : {}),
      orderBy: [{ workDate: 'desc' }, { createdAt: 'desc' }, { id: 'desc' }],
      select: attendanceProjection,
    });

    let nextCursor: string | null = null;
    if (items.length > take) {
      const nextItem = items.pop();
      nextCursor = nextItem ? nextItem.id : null;
    }

    return { items, nextCursor };
  }

  async getSummary(
    organizationId: string,
    actorUserId: string,
    dto: AttendanceSummaryDto,
  ) {
    const callerEmployee = await this.prisma.employee.findUnique({
      where: {
        organizationId_userId: {
          organizationId,
          userId: actorUserId,
        },
      },
    });

    const hasManagePermission = await this.authz.can(actorUserId, PERMISSIONS.ATTENDANCE_MANAGE, organizationId);

    let targetEmployeeId = dto.employeeId;
    if (!hasManagePermission) {
      if (!callerEmployee) {
        return {
          period: { from: '', to: '' },
          totalWorkDays: 0,
          presentDays: 0,
          lateDays: 0,
          earlyLeaveDays: 0,
          totalWorkedMinutes: 0,
          totalWorkedHours: 0,
          averageWorkedMinutesPerDay: 0,
        };
      }
      targetEmployeeId = callerEmployee.id;
    }

    let startDate: Date;
    let endDate: Date;

    if (dto.from && dto.to) {
      const fromParts = dto.from.split('-').map(Number);
      const toParts = dto.to.split('-').map(Number);
      startDate = new Date(Date.UTC(fromParts[0], fromParts[1] - 1, fromParts[2]));
      endDate = new Date(Date.UTC(toParts[0], toParts[1] - 1, toParts[2], 23, 59, 59, 999));
    } else if (dto.month) {
      const [y, m] = dto.month.split('-').map(Number);
      startDate = new Date(Date.UTC(y, m - 1, 1));
      endDate = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));
    } else {
      const now = new Date();
      const { year: currentYear, month: currentMonth } = getVietnamDateParts(now);
      startDate = new Date(Date.UTC(currentYear, currentMonth, 1));
      endDate = new Date(Date.UTC(currentYear, currentMonth + 1, 0, 23, 59, 59, 999));
    }

    const where: Prisma.AttendanceRecordWhereInput = {
      organizationId,
      workDate: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (targetEmployeeId) {
      where.employeeId = targetEmployeeId;
    }

    const records = await this.prisma.attendanceRecord.findMany({
      where,
      select: {
        id: true,
        workDate: true,
        status: true,
        lateMinutes: true,
        earlyLeaveMinutes: true,
        workedMinutes: true,
      },
    });

    const presentDays = records.filter((r) => r.status === AttendanceStatus.PRESENT).length;
    const lateDays = records.filter((r) => r.status === AttendanceStatus.LATE || r.lateMinutes > 0).length;
    const earlyLeaveDays = records.filter((r) => r.earlyLeaveMinutes > 0).length;

    const totalWorkedMinutes = records.reduce((sum, r) => sum + (r.workedMinutes ?? 0), 0);
    const totalWorkDays = records.length;
    const averageWorkedMinutesPerDay = totalWorkDays > 0 ? Math.round(totalWorkedMinutes / totalWorkDays) : 0;
    const totalWorkedHours = Number((totalWorkedMinutes / 60).toFixed(1));

    return {
      period: {
        from: startDate.toISOString().slice(0, 10),
        to: endDate.toISOString().slice(0, 10),
      },
      totalWorkDays,
      totalRecords: totalWorkDays,
      presentDays,
      lateDays,
      earlyLeaveDays,
      totalWorkedMinutes,
      totalWorkedHours,
      averageWorkedMinutesPerDay,
    };
  }
}
