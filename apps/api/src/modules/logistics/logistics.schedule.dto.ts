import { IsString, IsNotEmpty, IsOptional, IsEnum, MaxLength, MinLength } from 'class-validator'

export enum SchedulePlanStatusEnum {
  ACTIVE = 'active',
  PAUSED = 'paused',
  ARCHIVED = 'archived',
}

export class CreateSchedulePlanDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  name!: string

  @IsString()
  @IsNotEmpty()
  equipmentId!: string

  @IsString()
  @IsNotEmpty()
  equipmentName!: string

  @IsOptional()
  @IsString()
  storeId?: string

  @IsString()
  @IsNotEmpty()
  checkType!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cronExpression!: string

  @IsString()
  @IsNotEmpty()
  assigneeId!: string

  @IsString()
  @IsNotEmpty()
  assigneeName!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string
}

export class UpdateSchedulePlanDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  name?: string

  @IsOptional()
  @IsEnum(SchedulePlanStatusEnum)
  status?: SchedulePlanStatusEnum

  @IsOptional()
  @IsString()
  @MaxLength(100)
  cronExpression?: string

  @IsOptional()
  @IsString()
  assigneeId?: string

  @IsOptional()
  @IsString()
  assigneeName?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string

  @IsOptional()
  @IsString()
  nextRunAt?: string
}

export class ExecuteSchedulePlanDto {
  @IsString()
  @IsNotEmpty()
  executorId!: string

  @IsString()
  @IsNotEmpty()
  executorName!: string

  @IsOptional()
  @IsString()
  resultStatus?: 'normal' | 'warning' | 'fault'

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  resultNote?: string
}
