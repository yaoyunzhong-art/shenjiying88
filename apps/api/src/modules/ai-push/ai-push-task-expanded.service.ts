/**
 * ai-push-task.service.ts — 推送任务管理扩展服务
 *
 * 负责推送任务的调度、执行追踪、统计聚合和重试逻辑
 */
import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

export type PushChannel = 'push' | 'sms' | 'email' | 'wechat' | 'app'
export type PushStatus = 'pending' | 'scheduled' | 'sending' | 'sent' | 'delivered' | 'failed' | 'clicked'
export type PushPriority = 'high' | 'normal' | 'low'

export interface PushTaskConfig {
  title: string
  content: string
  channel: PushChannel
  targetMemberIds: string[]
  scheduledAt?: number
  priority?: PushPriority
  maxRetries?: number
  templateId?: string
  personalization?: Record<string, unknown>
  trackingEnabled?: boolean
}

export interface PushTask {
  id: string
  title: string
  content: string
  channel: PushChannel
  targetMemberIds: string[]
  scheduledAt: number
  sentAt?: number
  completedAt?: number
  status: PushStatus
  retryCount: number
  maxRetries: number
  priority: PushPriority
  templateId?: string
  personalization?: Record<string, unknown>
  trackingEnabled: boolean
  createdAt: number
  updatedAt: number
  metadata?: Record<string, unknown>
}

export interface PushTaskStats {
  totalTasks: number
  pendingTasks: number
  scheduledTasks: number
  sendingTasks: number
  sentTasks: number
  deliveredTasks: number
  failedTasks: number
  clickedTasks: number
  totalTargetCount: number
  totalDeliveredCount: number
  totalClickedCount: number
  overallDeliveryRate: number
  overallClickRate: number
  averageRetryCount: number
  tasksByChannel: Record<string, number>
  tasksByPriority: Record<string, number>
}

export interface PushDeliveryRecord {
  id: string
  taskId: string
  memberId: string
  channel: PushChannel
  status: PushStatus
  sentAt?: number
  deliveredAt?: number
  clickedAt?: number
  errorMessage?: string
  createdAt: number
}

@Injectable()
export class PushTaskService {
  private readonly logger = new Logger(PushTaskService.name)
  private readonly tasks = new Map<string, PushTask>()
  private readonly deliveryRecords = new Map<string, PushDeliveryRecord>()

  /**
   * 创建并调度推送任务
   */
  createTask(config: PushTaskConfig): PushTask {
    const now = Date.now()
    const taskId = `task-${randomUUID().slice(0, 12)}-${now}`

    const task: PushTask = {
      id: taskId,
      title: config.title,
      content: config.content,
      channel: config.channel,
      targetMemberIds: config.targetMemberIds,
      scheduledAt: config.scheduledAt ?? now,
      status: config.scheduledAt ? 'scheduled' : 'pending',
      retryCount: 0,
      maxRetries: config.maxRetries ?? 3,
      priority: config.priority ?? 'normal',
      templateId: config.templateId,
      personalization: config.personalization,
      trackingEnabled: config.trackingEnabled ?? true,
      createdAt: now,
      updatedAt: now,
    }

    this.tasks.set(taskId, task)
    this.logger.log(`[PushTask] Created task ${taskId}: "${task.title}" (${task.channel}, ${task.targetMemberIds.length} targets)`)

    // Auto-process pending tasks
    if (task.status === 'pending') {
      this.processTask(taskId)
    }

    return task
  }

  /**
   * 处理推送任务（模拟发送）
   */
  private processTask(taskId: string): void {
    const task = this.tasks.get(taskId)
    if (!task || task.status !== 'pending') return

    task.status = 'sending'
    task.updatedAt = Date.now()

    // Simulate send delay
    setTimeout(() => {
      this.completeTask(taskId)
    }, 100)
  }

  private completeTask(taskId: string): void {
    const task = this.tasks.get(taskId)
    if (!task) return

    const now = Date.now()
    task.status = 'sent'
    task.sentAt = now
    task.updatedAt = now

    // Create delivery records
    for (const memberId of task.targetMemberIds) {
      const recordId = `rec-${randomUUID().slice(0, 8)}`
      const isDelivered = Math.random() > 0.05
      const record: PushDeliveryRecord = {
        id: recordId,
        taskId,
        memberId,
        channel: task.channel,
        status: isDelivered ? 'delivered' : 'failed',
        sentAt: now,
        deliveredAt: isDelivered ? now : undefined,
        errorMessage: isDelivered ? undefined : '推送通道不可达',
        createdAt: now,
      }
      this.deliveryRecords.set(recordId, record)
    }

    // Update task status
    const deliveredCount = this.getDeliveredCount(taskId)
    const totalCount = task.targetMemberIds.length
    task.status = deliveredCount === totalCount ? 'delivered' : 'sent'
    if (deliveredCount > 0 && deliveredCount < totalCount) {
      task.status = 'delivered'
    }
    task.completedAt = now
    this.logger.log(`[PushTask] Completed task ${taskId}: ${deliveredCount}/${totalCount} delivered`)
  }

  /**
   * 模拟点击事件
   */
  recordClick(recordId: string): boolean {
    const record = this.deliveryRecords.get(recordId)
    if (!record || record.status !== 'delivered') return false

    record.status = 'clicked'
    record.clickedAt = Date.now()

    // Also update parent task
    const task = this.tasks.get(record.taskId)
    if (task && task.status !== 'clicked') {
      task.status = 'clicked'
      task.updatedAt = Date.now()
    }
    return true
  }

  /**
   * 重试失败任务
   */
  retryTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) return false
    if (task.retryCount >= task.maxRetries) return false
    if (task.status === 'delivered' || task.status === 'clicked') return false

    task.retryCount++
    task.status = 'pending'
    task.updatedAt = Date.now()
    this.processTask(taskId)
    return true
  }

  /**
   * 获取任务详情
   */
  getTask(taskId: string): PushTask | undefined {
    return this.tasks.get(taskId)
  }

  /**
   * 获取任务列表（含过滤和分页）
   */
  getTasks(filters?: {
    status?: string
    channel?: string
    priority?: PushPriority
    page?: number
    pageSize?: number
  }): PushTask[] {
    let results = Array.from(this.tasks.values())

    if (filters?.status) {
      results = results.filter(t => t.status === filters.status)
    }
    if (filters?.channel) {
      results = results.filter(t => t.channel === filters.channel)
    }
    if (filters?.priority) {
      results = results.filter(t => t.priority === filters.priority)
    }

    results.sort((a, b) => b.createdAt - a.createdAt)

    const page = filters?.page ?? 0
    const pageSize = filters?.pageSize ?? 20
    const start = page * pageSize
    return results.slice(start, start + pageSize)
  }

  /**
   * 取消任务
   */
  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) return false
    if (task.status === 'sent' || task.status === 'delivered' || task.status === 'clicked') return false
    task.status = 'failed'
    task.updatedAt = Date.now()
    return true
  }

  /**
   * 获取任务统计
   */
  getStats(startTime?: number, endTime?: number): PushTaskStats {
    const tasks = Array.from(this.tasks.values()).filter(t => {
      if (startTime && t.createdAt < startTime) return false
      if (endTime && t.createdAt > endTime) return false
      return true
    })

    const stats: PushTaskStats = {
      totalTasks: tasks.length,
      pendingTasks: tasks.filter(t => t.status === 'pending').length,
      scheduledTasks: tasks.filter(t => t.status === 'scheduled').length,
      sendingTasks: tasks.filter(t => t.status === 'sending').length,
      sentTasks: tasks.filter(t => t.status === 'sent').length,
      deliveredTasks: tasks.filter(t => t.status === 'delivered').length,
      failedTasks: tasks.filter(t => t.status === 'failed').length,
      clickedTasks: tasks.filter(t => t.status === 'clicked').length,
      totalTargetCount: tasks.reduce((s, t) => s + t.targetMemberIds.length, 0),
      totalDeliveredCount: 0,
      totalClickedCount: 0,
      overallDeliveryRate: 0,
      overallClickRate: 0,
      averageRetryCount: tasks.length > 0 ? tasks.reduce((s, t) => s + t.retryCount, 0) / tasks.length : 0,
      tasksByChannel: {},
      tasksByPriority: {},
    }

    for (const task of tasks) {
      stats.tasksByChannel[task.channel] = (stats.tasksByChannel[task.channel] ?? 0) + 1
      stats.tasksByPriority[task.priority] = (stats.tasksByPriority[task.priority] ?? 0) + 1
    }

    // Calculate delivery stats from records
    const recordStats = this.calculateRecordStats(startTime, endTime)
    stats.totalDeliveredCount = recordStats.deliveredCount
    stats.totalClickedCount = recordStats.clickedCount
    const targetCount = recordStats.totalCount
    stats.overallDeliveryRate = targetCount > 0 ? Math.round((recordStats.deliveredCount / targetCount) * 10000) / 100 : 0
    stats.overallClickRate = recordStats.deliveredCount > 0 ? Math.round((recordStats.clickedCount / recordStats.deliveredCount) * 10000) / 100 : 0

    return stats
  }

  private getDeliveredCount(taskId: string): number {
    let count = 0
    for (const record of this.deliveryRecords.values()) {
      if (record.taskId === taskId && (record.status === 'delivered' || record.status === 'clicked')) {
        count++
      }
    }
    return count
  }

  private calculateRecordStats(startTime?: number, endTime?: number): { totalCount: number; deliveredCount: number; clickedCount: number } {
    let total = 0
    let delivered = 0
    let clicked = 0

    for (const record of this.deliveryRecords.values()) {
      if (startTime && record.createdAt < startTime) continue
      if (endTime && record.createdAt > endTime) continue
      total++
      if (record.status === 'delivered' || record.status === 'clicked') delivered++
      if (record.status === 'clicked') clicked++
    }

    return { totalCount: total, deliveredCount: delivered, clickedCount: clicked }
  }

  /**
   * 清理统计缓存
   */
  static resetStore(): void {
    // Reset is handled by creating new instance
  }
}
