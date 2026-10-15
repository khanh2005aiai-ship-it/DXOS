import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';
import { AUDIT_EVENT_NAMES, type AuditEventName } from './audit-catalog';

export class AuditQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 25;

  @IsOptional()
  @IsUUID()
  after?: string;

  @IsOptional()
  @IsIn(AUDIT_EVENT_NAMES)
  event?: AuditEventName;
}
