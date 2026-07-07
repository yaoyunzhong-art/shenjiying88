/**
 * ai-push-task.service.ts
 * 推送任务管理服务（创建、查询、统计）
 */
import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { PushTask, PushRecord, PushStats, PushChannel } from './ai-push.entity'

@Injectable()
export class PushTaskService {
  private tasks = new Map<string, PushTask>()
  private records = new Map<string, PushRecord[]>()

  /**
   * 创建推送任务
   */
  createTask(params: {
    title: string
    content: string
    channel: PushChannel
    targetMemberIds: string[]
    scheduledAt: number
  }): PushTask {
    const id = `task-${randomUUID().slice(0, 8)}`
    const now = Date.now()
    const task: PushTask = {
      id,
      title: params.title,
      content: params.content,
      channel: params.channel,
      targetMemberIds: params.targetMemberIds,
      scheduledAt: params.scheduledAt,
      status: params.scheduledAt > now ? 'pending' : 'sent',
      retryCount: 0,
      maxRetries: 3,
      createdAt: now,
      updatedAt: now,
    }

    if (task.status === 'sent') {
      task.sentAt = now
    }

    this.tasks.set(id, task)
    return task
  }

  /**
   * 查询任务列表
   */
  getTasks(filters: {
    status?: string
    channel?: string
    page: number
    pageSize: number
  }): PushTask[] {
    let all = Array.from(this.tasks.values())

    if (filters.status) {
      all = all.filter(t => t.status === filters.status)
    }
    if (filters.channel) {
      all = all.filter(t => t.channel === filters.channel)
    }

    // Sort by created time desc
    all.sort((a, b) => b.createdAt - a.createdAt)

    const offset = filters.page * filters.pageSize
    return all.slice(offset, offset + filters.pageSize)
  }

  /**
   * 获取任务详情
   */
  getTask(taskId: string): PushTask | undefined {
    return this.tasks.get(taskId)
  }

  /**
   * 发送推送并生成记录
   */
  sendPush(taskId: string, memberIds: string[]): void {
    const task = this.tasks.get(taskId)
    if (!task) return

    const records: PushRecord[] = memberIds.map(memberId => ({
      id: `rec-${randomUUID().slice(0, 8)}`,
      taskId,
      memberId,
      channel: task.channel,
      status: 'sent',
      sentAt: Date.now(),
      createdAt: Date.now(),
    }))

    this.records.set(taskId, records)

    task.status = 'sent'
    task.sentAt = Date.now()
    task.updatedAt = Date.now()
  }

  /**
   * 获取推送统计
   */
  getStats(startTime?: number, endTime?: number): PushStats {
    const now = Date.now()
    const effectiveStart = startTime ?? 0
    const effectiveEnd = endTime ?? now

    let allRecords: PushRecord[] = []
    for (const recs of this.records.values()) {
      allRecords = allRecords.concat(recs)
    }

    const filtered = allRecords.filter(
      r => r.createdAt >= effectiveStart && r.createdAt <= effectiveEnd,
    )

    const totalRecords = filtered.length
    const sentCount = filtered.filter(r => r.status === 'sent').length
    const deliveredCount = filtered.filter(r => r.status === 'delivered' || r.status === 'clicked').length
    const clickedCount = filtered.filter(r => r.status === 'clicked').length
    const failedCount = filtered.filter(r => r.status === 'failed').length

    return {
      totalTasks: this.tasks.size,
      totalRecords,
      sentCount,
      deliveredCount,
      clickedCount,
      failedCount,
      deliveryRate: totalRecords > 0 ? deliveredCount / totalRecords : 0,
      clickRate: totalRecords > 0 ? clickedCount / totalRecords : 0,
    }
  }
}
