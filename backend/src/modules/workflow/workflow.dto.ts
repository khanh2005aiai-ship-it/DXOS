import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateWorkflowInstanceDto {
  @IsString()
  @IsNotEmpty()
  workflowDefinitionId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title!: string;

  @IsString()
  @IsOptional()
  entityType?: string;

  @IsString()
  @IsOptional()
  entityId?: string;

  @IsOptional()
  data?: Record<string, unknown>;
}

export class ConfirmWorkflowStepDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  comments?: string;

  @IsOptional()
  resultPayload?: Record<string, unknown>;
}

export class CancelWorkflowDto {
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  reason?: string;
}
