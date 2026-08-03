/**
 * automation.entity.ts — 自动化规则引擎实体定义
 *
 * 类型定义:
 *   - AutoRule         自动化规则
 *   - AutoCondition    规则条件
 *   - AutoAction       规则动作
 *   - AutoWorkflow     工作流
 *   - AutoJob          自动化任务
 *   - AutoEvalResult   规则评估结果
 *   - AutoTriggerResult动作触发结果
 *   - AutoLog          执行日志
 */

// ─── 条件与动作 ───

/** 条件操作符 */
export type ConditionOperator =
  | 'eq' | 'neq'
  | 'gt' | 'gte' | 'lt' | 'lte'
  | 'contains' | 'not_contains'
  | 'in' | 'not_in'

/** 规则条件 */
export interface AutoCondition {
  field: string
  op: ConditionOperator
  value: unknown
}

/** 动作类型 */
export type ActionType =
  | 'send_notification'
  | 'webhook'
  | 'update_field'
  | 'create_ticket'
  | 'send_email'
  | 'log_event'

/** 规则动作定义 */
export interface AutoAction {
  type: ActionType
  params: Record<string, unknown>
}

/** 动作触发结果 */
export interface AutoActionResult {
  actionId: string
  type: ActionType
  success: boolean
  output?: string
  error?: string
  executedAt: string
}

// ─── 规则 ───

/** 规则状态 */
export type RuleStatus = 'active' | 'inactive' | 'archived'

/** 自动化规则 */
export interface AutoRule {
  id: string
  name: string
  description: string
  conditions: AutoCondition[]
  actions: AutoAction[]
  enabled: boolean
  priority: number
  status: RuleStatus
  tags: string[]
  category: string
  timeout: number
  createdAt: string
  updatedAt: string
}

// ─── 工作流 ───

/** 工作流状态 */
export type WorkflowStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'retrying'

/** 工作流 */
export interface AutoWorkflow {
  id: string
  name: string
  status: WorkflowStatus
  ruleId: string
  startedAt: string
  updatedAt: string
  progress: number
  error?: string
  results: AutoActionResult[]
  retryCount: number
  maxRetries: number
}

// ─── 任务 ───

/** 任务类型 */
export type JobType = 'scheduled' | 'triggered' | 'manual' | 'recurring'

/** 任务状态 */
export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

/** 评估上下文 */
export interface EvalContext {
  data: Record<string, unknown>
  timestamp: string
  userId?: string
  source?: string
}

/** 自动化任务 */
export interface AutoJob {
  id: string
  workflowId: string
  ruleId: string
  type: JobType
  status: JobStatus
  inputContext: EvalContext
  triggerResults: AutoActionResult[]
  error?: string
  createdAt: string
  completedAt?: string
  scheduledAt?: string
  duration?: number
}

// ─── 评估结果 ───

/** 规则评估结果 */
export interface AutoEvalResult {
  ruleId: string
  ruleName: string
  matched: boolean
  conditionsMet: number
  conditionsTotal: number
  triggeredActions: string[]
  evaluatedAt: string
  executionTime?: number
}

// ─── 执行日志 ───

/** 日志级别 */
export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

/** 执行日志 */
export interface AutoLog {
  id: string
  ruleId: string
  ruleName: string
  level: LogLevel
  message: string
  context?: Record<string, unknown>
  timestamp: string
  duration?: number
}

// ─── 统计 ───

/** 规则统计数据 */
export interface RuleStats {
  ruleId: string
  ruleName: string
  totalEvaluations: number
  totalMatches: number
  totalErrors: number
  avgExecutionTime: number
  lastExecutedAt?: string
  enabled: boolean
  priority: number
}

/** 自动化系统概览 */
export interface AutomationOverview {
  totalRules: number
  totalWorkflows: number
  totalJobs: number
  activeRules: number
  runningWorkflows: number
  recentErrors: number
  statsByCategory: Record<string, number>
  lastUpdated: string
}

// ─── 常量与标签 ───

/** 工作流状态中文标签 */
export const WORKFLOW_STATUS_LABELS: Record<WorkflowStatus, string> = {
  idle: '空闲',
  running: '运行中',
  paused: '已暂停',
  completed: '已完成',
  failed: '失败',
  cancelled: '已取消',
  retrying: '重试中',
}

/** 任务类型中文标签 */
export const JOB_TYPE_LABELS: Record<JobType, string> = {
  scheduled: '定时任务',
  triggered: '触发任务',
  manual: '手动任务',
  recurring: '循环任务',
}

/** 任务状态中文标签 */
export const JOB_STATUS_LABELS: Record<JobStatus, string> = {
  pending: '待处理',
  running: '执行中',
  completed: '已完成',
  failed: '失败',
  skipped: '已跳过',
}

/** 日志级别中文标签 */
export const LOG_LEVEL_LABELS: Record<LogLevel, string> = {
  info: '信息',
  warn: '警告',
  error: '错误',
  debug: '调试',
}

/** 动作类型中文标签 */
export const ACTION_TYPE_LABELS: Record<ActionType, string> = {
  send_notification: '发送通知',
  webhook: 'Webhook',
  update_field: '更新字段',
  create_ticket: '创建工单',
  send_email: '发送邮件',
  log_event: '记录日志',
}

/** 默认规则分类 */
export const DEFAULT_CATEGORIES = [
  'customer_service',
  'inventory',
  'order',
  'security',
  'marketing',
  'system',
] as const

export type RuleCategory = (typeof DEFAULT_CATEGORIES)[number]
