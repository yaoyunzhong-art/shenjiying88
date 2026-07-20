/**
 * logistics.schedule.entity.ts
 * P-30 设备巡检定时调度
 *
 * 周期检查计划（cron表达式配置）
 */

export type SchedulePlanStatus = 'active' | 'paused' | 'archived'
export type ScheduleTaskStatus = 'scheduled' | 'completed' | 'skipped' | 'failed'

export interface SchedulePlan {
  id: string
  tenantId: string
  storeId?: string
  /** 计划名称 */
  name: string
  /** 设备ID */
  equipmentId: string
  equipmentName: string
  /** 检查类型 */
  checkType: string // 'daily' | 'weekly' | 'monthly' | custom
  /** Cron 表达式 */
  cronExpression: string
  /** 分配给 */
  assigneeId: string
  assigneeName: string
  status: SchedulePlanStatus
  /** 备注/检查要点 */
  notes?: string
  /** 上次执行时间 */
  lastRunAt?: string
  /** 下次执行时间 */
  nextRunAt?: string
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ScheduleTaskLog {
  id: string
  planId: string
  tenantId: string
  equipmentId: string
  equipmentName: string
  status: ScheduleTaskStatus
  /** 实际执行结果 */
  resultStatus?: 'normal' | 'warning' | 'fault'
  /** 检查结果备注 */
  resultNote?: string
  /** 执行人 */
  executorId: string
  executorName: string
  /** 计划执行时间 */
  scheduledAt: string
  /** 实际执行时间 */
  executedAt?: string
  createdAt: string
}

export interface SchedulePlanMetrics {
  total: number
  active: number
  paused: number
  totalExecutions: number
  completedExecutions: number
  failedExecutions: number
}
