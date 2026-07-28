/**
 * brand-workspace.entity.ts - 品牌工作台实体定义
 *
 * 按 PRD-018 数据模型定义:
 *   WorkspaceLayout     - 工作台布局
 *   WorkspaceTask       - 工作台任务
 *   ApprovalFlow        - 审批流程
 *   BrandCalendarEvent  - 品牌日历事件
 *   QuickAction         - 快捷操作
 *   RecentActivity      - 最近活动
 *   WorkspaceSummary    - 工作台汇总
 */

import { randomUUID } from 'node:crypto'

// ═══════════════════════════════════════════════════════════════════════════════
//  工作台布局
// ═══════════════════════════════════════════════════════════════════════════════

export type LayoutTheme = 'light' | 'dark' | 'auto'
export type LayoutType = 'default' | 'custom'

export type WidgetType =
  | 'kpi_overview'
  | 'campaign_status'
  | 'upcoming_schedule'
  | 'pending_approval'
  | 'brand_health'
  | 'recent_activity'
  | 'team_calendar'
  | 'content_performance'
  | 'quick_actions'
  | 'notification_feed'
  | 'asset_overview'
  | 'collaboration_list'

export interface WidgetPlacement {
  widgetId: string
  widgetType: WidgetType
  position: { x: number; y: number; w: number; h: number }
  config: Record<string, any>
  visible: boolean
}

export interface WorkspaceLayout {
  workspaceId: string
  tenantId: string
  name: string
  description?: string
  grid: WidgetPlacement[]
  theme: LayoutTheme
  layoutType: LayoutType
  createdAt: Date
  updatedAt: Date
}

// ═══════════════════════════════════════════════════════════════════════════════
//  工作台任务
// ═══════════════════════════════════════════════════════════════════════════════

export type TaskType =
  | 'campaign_review'
  | 'asset_review'
  | 'content_creation'
  | 'brand_audit'
  | 'approval'
  | 'notification'
  | 'schedule_setup'
  | 'collaboration_invite'

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled'
export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low'

export type RelatedEntityType = 'campaign' | 'asset' | 'approval' | 'schedule'

export interface ChecklistItem {
  id: string
  text: string
  completed: boolean
  completedAt?: Date
}

export interface TaskComment {
  id: string
  authorId: string
  authorName: string
  content: string
  attachments?: string[]
  createdAt: Date
}

export interface WorkspaceTask {
  taskId: string
  tenantId: string
  brandId: string
  title: string
  description?: string
  taskType: TaskType
  priority: TaskPriority
  status: TaskStatus
  assigneeId?: string
  assigneeName?: string
  dueDate?: Date
  relatedEntityType?: RelatedEntityType
  relatedEntityId?: string
  tags: string[]
  checklist: ChecklistItem[]
  comments: TaskComment[]
  createdAt: Date
  updatedAt: Date
}

// ═══════════════════════════════════════════════════════════════════════════════
//  审批流程
// ═══════════════════════════════════════════════════════════════════════════════

export type FlowType = 'campaign' | 'asset' | 'content' | 'brand_update'
export type ApprovalStatus = 'draft' | 'in_progress' | 'approved' | 'rejected' | 'cancelled'
export type StepStatus = 'pending' | 'approved' | 'rejected' | 'skipped'

export interface ApprovalStep {
  stepId: string
  stepNumber: number
  approverId: string
  approverName: string
  role: string
  status: StepStatus
  comment?: string
  actedAt?: Date
}

export interface ApprovalFlow {
  flowId: string
  tenantId: string
  brandId: string
  flowType: FlowType
  title: string
  description?: string
  status: ApprovalStatus
  currentStep: number
  steps: ApprovalStep[]
  metadata: Record<string, any>
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// ═══════════════════════════════════════════════════════════════════════════════
//  品牌日历事件
// ═══════════════════════════════════════════════════════════════════════════════

export type CalendarEventType =
  | 'campaign_launch'
  | 'campaign_end'
  | 'content_publish'
  | 'review_deadline'
  | 'meeting'
  | 'milestone'
  | 'deadline'
  | 'reminder'

export type CalendarEventStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type CalendarRelatedType = 'campaign' | 'task' | 'approval'

export interface BrandCalendarEvent {
  eventId: string
  tenantId: string
  brandId: string
  title: string
  description?: string
  eventType: CalendarEventType
  startTime: Date
  endTime: Date
  allDay: boolean
  color?: string
  status: CalendarEventStatus
  relatedEntityType?: CalendarRelatedType
  relatedEntityId?: string
  participants: string[]
  createdBy: string
  createdAt: Date
}

// ═══════════════════════════════════════════════════════════════════════════════
//  快捷操作
// ═══════════════════════════════════════════════════════════════════════════════

export type QuickActionType =
  | 'create_campaign'
  | 'upload_asset'
  | 'create_task'
  | 'schedule_post'
  | 'invite_collaborator'
  | 'generate_report'
  | 'brand_audit'

export interface QuickAction {
  actionId: string
  tenantId: string
  name: string
  icon: string
  actionType: QuickActionType
  shortcut?: string
  order: number
}

// ═══════════════════════════════════════════════════════════════════════════════
//  最近活动
// ═══════════════════════════════════════════════════════════════════════════════

export type ActivityType = 'created' | 'updated' | 'approved' | 'rejected' | 'published' | 'commented' | 'shared' | 'archived'
export type ActivityEntityType = 'campaign' | 'asset' | 'task' | 'approval' | 'schedule' | 'brand'

export interface RecentActivity {
  activityId: string
  tenantId: string
  brandId: string
  activityType: ActivityType
  entityType: ActivityEntityType
  entityId: string
  entityName: string
  actorId: string
  actorName: string
  description: string
  metadata?: Record<string, any>
  timestamp: Date
}

// ═══════════════════════════════════════════════════════════════════════════════
//  工作台汇总
// ═══════════════════════════════════════════════════════════════════════════════

export interface WorkspaceSummary {
  tenantId: string
  activeCampaigns: number
  pendingApprovals: number
  upcomingEvents: number
  overdueTasks: number
  totalAssets: number
  totalCollaborations: number
  brandHealthScore?: number
  recentActivities: RecentActivity[]
}

// ═══════════════════════════════════════════════════════════════════════════════
//  任务筛选参数
// ═══════════════════════════════════════════════════════════════════════════════

export interface TaskFilter {
  status?: TaskStatus
  priority?: TaskPriority
  assigneeId?: string
  taskType?: TaskType
  brandId?: string
  dueBefore?: Date
  dueAfter?: Date
}

// ═══════════════════════════════════════════════════════════════════════════════
//  默认工作台布局预设
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_WIDGETS: Omit<WidgetPlacement, 'widgetId'>[] = [
  {
    widgetType: 'kpi_overview',
    position: { x: 0, y: 0, w: 12, h: 2 },
    config: { showCharts: true, period: 'weekly' },
    visible: true,
  },
  {
    widgetType: 'campaign_status',
    position: { x: 0, y: 2, w: 6, h: 3 },
    config: { limit: 5 },
    visible: true,
  },
  {
    widgetType: 'pending_approval',
    position: { x: 6, y: 2, w: 6, h: 3 },
    config: { limit: 10 },
    visible: true,
  },
  {
    widgetType: 'upcoming_schedule',
    position: { x: 0, y: 5, w: 4, h: 3 },
    config: { days: 7 },
    visible: true,
  },
  {
    widgetType: 'recent_activity',
    position: { x: 4, y: 5, w: 8, h: 3 },
    config: { limit: 20 },
    visible: true,
  },
  {
    widgetType: 'quick_actions',
    position: { x: 0, y: 8, w: 12, h: 1 },
    config: {},
    visible: true,
  },
]

/** 创建默认工作台布局 */
export function createDefaultLayout(tenantId: string): WorkspaceLayout {
  return {
    workspaceId: randomUUID(),
    tenantId,
    name: '默认工作台',
    description: '系统默认工作台布局',
    grid: DEFAULT_WIDGETS.map(w => ({
      ...w,
      widgetId: randomUUID(),
    })),
    theme: 'light',
    layoutType: 'default',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

/**
 * 工作台实体类型常量映射
 */
export const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  kpi_overview: 'KPI 总览',
  campaign_status: '活动状态',
  upcoming_schedule: '待办排期',
  pending_approval: '待审批',
  brand_health: '品牌健康度',
  recent_activity: '最近操作',
  team_calendar: '团队日历',
  content_performance: '内容表现',
  quick_actions: '快捷操作',
  notification_feed: '通知流',
  asset_overview: '素材总览',
  collaboration_list: '协作列表',
}

export const TASK_TYPE_LABELS: Record<TaskType, string> = {
  campaign_review: '活动审查',
  asset_review: '素材审查',
  content_creation: '内容创作',
  brand_audit: '品牌审计',
  approval: '审批任务',
  notification: '通知任务',
  schedule_setup: '排期设置',
  collaboration_invite: '协作邀请',
}

export const CALENDAR_EVENT_TYPE_LABELS: Record<CalendarEventType, string> = {
  campaign_launch: '活动上线',
  campaign_end: '活动结束',
  content_publish: '内容发布',
  review_deadline: '审查截止',
  meeting: '会议',
  milestone: '里程碑',
  deadline: '截止日期',
  reminder: '提醒',
}

export const QUICK_ACTION_LABELS: Record<QuickActionType, string> = {
  create_campaign: '创建活动',
  upload_asset: '上传素材',
  create_task: '创建任务',
  schedule_post: '排期发布',
  invite_collaborator: '邀请协作',
  generate_report: '生成报告',
  brand_audit: '品牌审计',
}
