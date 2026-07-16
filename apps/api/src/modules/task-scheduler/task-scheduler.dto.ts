import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsArray,
} from 'class-validator'
import 'reflect-metadata'
import {
  TaskType,
  TaskPriority,
  TaskStatus,
} from './task-scheduler.entity'

// ═══════════════════════════════════════════════════════════════════════
// Task DTOs
// ═══════════════════════════════════════════════════════════════════════

export class CreateTaskDto {
  @IsString()
  name!: string

  @IsEnum(TaskType)
  type!: TaskType

  @IsEnum(TaskPriority)
  priority!: TaskPriority

  @IsString()
  @IsOptional()
  cronExpr?: string

  @IsString()
  assignedTo!: string

  @IsDateString()
  startTime!: string

  @IsDateString()
  @IsOptional()
  endTime?: string

  @IsString()
  description!: string
}

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  name?: string

  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority

  @IsString()
  @IsOptional()
  cronExpr?: string

  @IsString()
  @IsOptional()
  assignedTo?: string

  @IsDateString()
  @IsOptional()
  startTime?: string

  @IsDateString()
  @IsOptional()
  endTime?: string

  @IsString()
  @IsOptional()
  description?: string
}

export class UpdateTaskStatusDto {
  @IsEnum(TaskStatus)
  status!: TaskStatus
}

export class TaskQueryDto {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus

  @IsEnum(TaskType)
  @IsOptional()
  type?: TaskType

  @IsEnum(TaskPriority)
  @IsOptional()
  priority?: TaskPriority

  @IsString()
  @IsOptional()
  assignedTo?: string
}

export class BatchTaskStatusDto {
  @IsArray()
  @IsString({ each: true })
  taskIds!: string[]

  @IsEnum(TaskStatus)
  status!: TaskStatus
}
