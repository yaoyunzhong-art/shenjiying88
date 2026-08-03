import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsEnum,
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsObject,
  Min,
  Max,
  MinLength,
  MaxLength,
  ArrayMinSize,
  ValidateNested,
  IsInt,
} from 'class-validator'
import { Type } from 'class-transformer'
import 'reflect-metadata'

// ── 枚举 ─────────────────────────────────────────────────────────────────────

export enum WidgetTypeEnum {
  KPI_OVERVIEW = 'kpi_overview',
  CAMPAIGN_STATUS = 'campaign_status',
  UPCOMING_SCHEDULE = 'upcoming_schedule',
  PENDING_APPROVAL = 'pending_approval',
  BRAND_HEALTH = 'brand_health',
  RECENT_ACTIVITY = 'recent_activity',
  TEAM_CALENDAR = 'team_calendar',
  CONTENT_PERFORMANCE = 'content_performance',
  QUICK_ACTIONS = 'quick_actions',
  NOTIFICATION_FEED = 'notification_feed',
  ASSET_OVERVIEW = 'asset_overview',
  COLLABORATION_LIST = 'collaboration_list',
}

export enum TaskTypeEnum {
  CAMPAIGN_REVIEW = 'campaign_review',
  ASSET_REVIEW = 'asset_review',
  CONTENT_CREATION = 'content_creation',
  BRAND_AUDIT = 'brand_audit',
  APPROVAL = 'approval',
  NOTIFICATION = 'notification',
  SCHEDULE_SETUP = 'schedule_setup',
  COLLABORATION_INVITE = 'collaboration_invite',
}

export enum TaskStatusEnum {
  TODO = 'todo',
  IN_PROGRESS = 'in_progress',
  REVIEW = 'review',
  DONE = 'done',
  CANCELLED = 'cancelled',
}

export enum TaskPriorityEnum {
  URGENT = 'urgent',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum FlowTypeEnum {
  CAMPAIGN = 'campaign',
  ASSET = 'asset',
  CONTENT = 'content',
  BRAND_UPDATE = 'brand_update',
}

export enum CalendarEventTypeEnum {
  CAMPAIGN_LAUNCH = 'campaign_launch',
  CAMPAIGN_END = 'campaign_end',
  CONTENT_PUBLISH = 'content_publish',
  REVIEW_DEADLINE = 'review_deadline',
  MEETING = 'meeting',
  MILESTONE = 'milestone',
  DEADLINE = 'deadline',
  REMINDER = 'reminder',
}

export enum QuickActionTypeEnum {
  CREATE_CAMPAIGN = 'create_campaign',
  UPLOAD_ASSET = 'upload_asset',
  CREATE_TASK = 'create_task',
  SCHEDULE_POST = 'schedule_post',
  INVITE_COLLABORATOR = 'invite_collaborator',
  GENERATE_REPORT = 'generate_report',
  BRAND_AUDIT = 'brand_audit',
}

export enum LayoutThemeEnum {
  LIGHT = 'light',
  DARK = 'dark',
  AUTO = 'auto',
}

export enum LayoutTypeEnum {
  DEFAULT = 'default',
  CUSTOM = 'custom',
}

// ═══════════════════════════════════════════════════════════════════════════════
//  位置 DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class PositionDto {
  @IsInt()
  @Min(0)
  @Max(23)
  x!: number

  @IsInt()
  @Min(0)
  @Max(23)
  y!: number

  @IsInt()
  @Min(1)
  @Max(12)
  w!: number

  @IsInt()
  @Min(1)
  @Max(12)
  h!: number
}

// ═══════════════════════════════════════════════════════════════════════════════
//  工作台布局 DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class WidgetPlacementDto {
  @IsOptional()
  @IsString()
  widgetId?: string

  @IsEnum(WidgetTypeEnum)
  widgetType!: WidgetTypeEnum

  @ValidateNested()
  @Type(() => PositionDto)
  position!: PositionDto

  @IsOptional()
  @IsObject()
  config?: Record<string, any>

  @IsOptional()
  @IsBoolean()
  visible?: boolean
}

export class CreateLayoutDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(100)
  name!: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WidgetPlacementDto)
  grid!: WidgetPlacementDto[]

  @IsOptional()
  @IsEnum(LayoutThemeEnum)
  theme?: LayoutThemeEnum

  @IsOptional()
  @IsEnum(LayoutTypeEnum)
  layoutType?: LayoutTypeEnum
}

export class UpdateLayoutDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WidgetPlacementDto)
  grid?: WidgetPlacementDto[]

  @IsOptional()
  @IsEnum(LayoutThemeEnum)
  theme?: LayoutThemeEnum
}

export class UpdateWidgetDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => PositionDto)
  position?: PositionDto

  @IsOptional()
  @IsObject()
  config?: Record<string, any>

  @IsOptional()
  @IsBoolean()
  visible?: boolean
}

export class ReorderWidgetsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  orderedWidgetIds!: string[]
}

// ═══════════════════════════════════════════════════════════════════════════════
//  任务 DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title!: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @IsEnum(TaskTypeEnum)
  taskType!: TaskTypeEnum

  @IsEnum(TaskPriorityEnum)
  priority!: TaskPriorityEnum

  @IsOptional()
  @IsEnum(TaskStatusEnum)
  status?: TaskStatusEnum

  @IsString()
  @IsNotEmpty()
  brandId!: string

  @IsOptional()
  @IsString()
  assigneeId?: string

  @IsOptional()
  @IsString()
  assigneeName?: string

  @IsOptional()
  @IsDateString()
  dueDate?: string

  @IsOptional()
  @IsString()
  relatedEntityType?: string

  @IsOptional()
  @IsString()
  relatedEntityId?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

export class UpdateTaskDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @IsOptional()
  @IsEnum(TaskTypeEnum)
  taskType?: TaskTypeEnum

  @IsOptional()
  @IsEnum(TaskPriorityEnum)
  priority?: TaskPriorityEnum

  @IsOptional()
  @IsEnum(TaskStatusEnum)
  status?: TaskStatusEnum

  @IsOptional()
  @IsString()
  assigneeId?: string

  @IsOptional()
  @IsString()
  assigneeName?: string

  @IsOptional()
  @IsDateString()
  dueDate?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[]
}

export class AddChecklistItemDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(500)
  text!: string
}

export class UpdateChecklistItemDto {
  @IsBoolean()
  completed!: boolean
}

export class AddTaskCommentDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(2000)
  content!: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[]
}

// ═══════════════════════════════════════════════════════════════════════════════
//  审批流 DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class ApprovalStepDto {
  @IsString()
  @IsNotEmpty()
  approverId!: string

  @IsString()
  @IsNotEmpty()
  approverName!: string

  @IsString()
  @IsNotEmpty()
  role!: string
}

export class CreateApprovalFlowDto {
  @IsString()
  @IsNotEmpty()
  brandId!: string

  @IsEnum(FlowTypeEnum)
  flowType!: FlowTypeEnum

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title!: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ApprovalStepDto)
  @ArrayMinSize(1)
  steps!: ApprovalStepDto[]

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>

  @IsString()
  @IsNotEmpty()
  createdBy!: string
}

export class ApproveStepDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string
}

export class RejectStepDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(1000)
  comment!: string
}

// ═══════════════════════════════════════════════════════════════════════════════
//  日历事件 DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class CreateCalendarEventDto {
  @IsString()
  @IsNotEmpty()
  brandId!: string

  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(200)
  title!: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @IsEnum(CalendarEventTypeEnum)
  eventType!: CalendarEventTypeEnum

  @IsDateString()
  startTime!: string

  @IsDateString()
  endTime!: string

  @IsOptional()
  @IsBoolean()
  allDay?: boolean

  @IsOptional()
  @IsString()
  color?: string

  @IsOptional()
  @IsString()
  relatedEntityType?: string

  @IsOptional()
  @IsString()
  relatedEntityId?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participants?: string[]
}

export class UpdateCalendarEventDto {
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string

  @IsOptional()
  @IsEnum(CalendarEventTypeEnum)
  eventType?: CalendarEventTypeEnum

  @IsOptional()
  @IsDateString()
  startTime?: string

  @IsOptional()
  @IsDateString()
  endTime?: string

  @IsOptional()
  @IsBoolean()
  allDay?: boolean

  @IsOptional()
  @IsString()
  color?: string

  @IsOptional()
  @IsString()
  status?: string

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participants?: string[]
}

// ═══════════════════════════════════════════════════════════════════════════════
//  快捷操作 DTOs
// ═══════════════════════════════════════════════════════════════════════════════

export class AddQuickActionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(1)
  @MaxLength(50)
  name!: string

  @IsString()
  @IsNotEmpty()
  icon!: string

  @IsEnum(QuickActionTypeEnum)
  actionType!: QuickActionTypeEnum

  @IsOptional()
  @IsString()
  shortcut?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number
}

export class UpdateQuickActionDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  name?: string

  @IsOptional()
  @IsString()
  icon?: string

  @IsOptional()
  @IsString()
  shortcut?: string

  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number
}

export class ReorderQuickActionsDto {
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  orderedActionIds!: string[]
}

// ═══════════════════════════════════════════════════════════════════════════════
//  汇总查询 DTO
// ═══════════════════════════════════════════════════════════════════════════════

export class GetSummaryDto {
  @IsString()
  @IsNotEmpty()
  brandId!: string
}
