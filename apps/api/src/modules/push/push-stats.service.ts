/**
 * push-stats.service.ts — 推送效果统计服务
 *
 * WP-13B: 效果回传 (BS-0185~BS-0188)
 *
 * 功能:
 * - 推送事件记录 (发送/送达/点击/失败)
 * - 送达率 & 点击率统计
 * - 效果看板数据聚合
 */

import { Injectable, Logger } from '@nestjs/common'
import { PushBusinessPriority } from './push-priority.enum'
import type {
  PushEventRecord,
  PushEventType,
  PushEffectDashboard,
  ChannelStats,
  PriorityStats,
  PushHistoryEntry,
  PushHistoryFilter,
} from './push-stats.entity'

/**
 * In-memory 事件存储
 * 生产环境应使用时序数据库 (如 InfluxDB / TimescaleDB / ClickHouse)
 */
const eventStore: PushEventRecord[] = []
let eventIdCounter = 0

export function resetPushStatsTestState(): void {
  eventStore.length = 0
  eventIdCounter = 0
}

@Injectable()
export class PushStatsService {
  private readonly logger = new Logger(PushStatsService.name)

  /**
   * 记录推送事件
   * BS-0185: 推送事件回传
   */
  recordEvent(event: {
    pushRecordId: string
    eventType: PushEventType
    memberId: string
    tenantId: string
    channel: string
    priority: PushBusinessPriority
    metadata?: Record<string, unknown>
  }): PushEventRecord {
    const record: PushEventRecord = {
      id: `evt_${Date.now()}_${++eventIdCounter}`,
      pushRecordId: event.pushRecordId,
      eventType: event.eventType,
      memberId: event.memberId,
      tenantId: event.tenantId,
      channel: event.channel,
      priority: event.priority,
      timestamp: new Date().toISOString(),
      metadata: event.metadata,
    }
    eventStore.push(record)
    this.logger.debug(
      `[Stats] Event recorded: ${event.eventType} push=${event.pushRecordId} member=${event.memberId}`
    )
    return record
  }

  /**
   * 记录推送发送事件
   */
  recordSent(
    pushRecordId: string,
    memberId: string,
    tenantId: string,
    channel: string,
    priority: PushBusinessPriority
  ): PushEventRecord {
    return this.recordEvent({
      pushRecordId,
      eventType: 'sent',
      memberId,
      tenantId,
      channel,
      priority,
    })
  }

  /**
   * 记录推送送达事件
   */
  recordDelivered(
    pushRecordId: string,
    memberId: string,
    tenantId: string,
    channel: string,
    priority: PushBusinessPriority
  ): PushEventRecord {
    return this.recordEvent({
      pushRecordId,
      eventType: 'delivered',
      memberId,
      tenantId,
      channel,
      priority,
    })
  }

  /**
   * 记录推送点击事件
   * BS-0186: 点击率统计
   */
  recordClicked(
    pushRecordId: string,
    memberId: string,
    tenantId: string,
    channel: string,
    priority: PushBusinessPriority,
    metadata?: Record<string, unknown>
  ): PushEventRecord {
    return this.recordEvent({
      pushRecordId,
      eventType: 'clicked',
      memberId,
      tenantId,
      channel,
      priority,
      metadata,
    })
  }

  /**
   * 记录推送失败事件
   */
  recordFailed(
    pushRecordId: string,
    memberId: string,
    tenantId: string,
    channel: string,
    priority: PushBusinessPriority,
    error?: string
  ): PushEventRecord {
    return this.recordEvent({
      pushRecordId,
      eventType: 'failed',
      memberId,
      tenantId,
      channel,
      priority,
      metadata: error ? { error } : undefined,
    })
  }

  /**
   * 获取推送效果看板数据
   * BS-0188: 效果看板
   */
  getDashboard(
    tenantId: string,
    startDate?: string,
    endDate?: string
  ): PushEffectDashboard {
    const start = startDate ?? this.getDefaultStartDate()
    const end = endDate ?? this.getTodayDate()

    // 过滤时间范围
    const filtered = eventStore.filter((e) => {
      const date = e.timestamp.slice(0, 10)
      return e.tenantId === tenantId && date >= start && date <= end
    })

    // 按通道聚合
    const channelMap = new Map<string, { sent: number; delivered: number; clicked: number; failed: number }>()
    // 按分级聚合
    const priorityMap = new Map<PushBusinessPriority, { sent: number; delivered: number; clicked: number; failed: number }>()
    // 每日趋势
    const dailyMap = new Map<string, { sent: number; delivered: number; clicked: number }>()

    for (const event of filtered) {
      // 通道统计
      if (!channelMap.has(event.channel)) {
        channelMap.set(event.channel, { sent: 0, delivered: 0, clicked: 0, failed: 0 })
      }
      const cs = channelMap.get(event.channel)!
      if (event.eventType === 'sent') cs.sent++
      else if (event.eventType === 'delivered') cs.delivered++
      else if (event.eventType === 'clicked') cs.clicked++
      else if (event.eventType === 'failed') cs.failed++

      // 分级统计
      const pKey = event.priority
      if (!priorityMap.has(pKey)) {
        priorityMap.set(pKey, { sent: 0, delivered: 0, clicked: 0, failed: 0 })
      }
      const ps = priorityMap.get(pKey)!
      if (event.eventType === 'sent') ps.sent++
      else if (event.eventType === 'delivered') ps.delivered++
      else if (event.eventType === 'clicked') ps.clicked++
      else if (event.eventType === 'failed') ps.failed++

      // 每日趋势
      const dateKey = event.timestamp.slice(0, 10)
      if (!dailyMap.has(dateKey)) {
        dailyMap.set(dateKey, { sent: 0, delivered: 0, clicked: 0 })
      }
      const ds = dailyMap.get(dateKey)!
      if (event.eventType === 'sent') ds.sent++
      else if (event.eventType === 'delivered') ds.delivered++
      else if (event.eventType === 'clicked') ds.clicked++
    }

    // 汇总
    const totalSent = filtered.filter((e) => e.eventType === 'sent').length
    const totalDelivered = filtered.filter((e) => e.eventType === 'delivered').length
    const totalClicked = filtered.filter((e) => e.eventType === 'clicked').length
    const totalFailed = filtered.filter((e) => e.eventType === 'failed').length

    const byChannel: ChannelStats[] = Array.from(channelMap.entries()).map(([channel, stats]) => ({
      channel,
      ...stats,
      deliveryRate: this.calcRate(stats.delivered, stats.sent),
      clickRate: this.calcRate(stats.clicked, stats.delivered),
    }))

    const byPriority: PriorityStats[] = Array.from(priorityMap.entries()).map(([priority, stats]) => ({
      priority,
      ...stats,
      deliveryRate: this.calcRate(stats.delivered, stats.sent),
      clickRate: this.calcRate(stats.clicked, stats.delivered),
    }))

    const dailyTrend = Array.from(dailyMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return {
      startDate: start,
      endDate: end,
      totalSent,
      totalDelivered,
      totalClicked,
      totalFailed,
      overallDeliveryRate: this.calcRate(totalDelivered, totalSent),
      overallClickRate: this.calcRate(totalClicked, totalDelivered),
      byChannel,
      byPriority,
      dailyTrend,
    }
  }

  /**
   * 获取推送历史（按会员、时间、通道过滤）
   * BS-0166: 推送历史记录查询
   */
  getPushHistory(filter: PushHistoryFilter): {
    items: PushHistoryEntry[]
    total: number
    page: number
    limit: number
  } {
    let filtered = [...eventStore]

    if (filter.memberId) {
      filtered = filtered.filter((e) => e.memberId === filter.memberId)
    }
    if (filter.tenantId) {
      filtered = filtered.filter((e) => e.tenantId === filter.tenantId)
    }
    if (filter.channel) {
      filtered = filtered.filter((e) => e.channel === filter.channel)
    }
    if (filter.priority) {
      filtered = filtered.filter((e) => e.priority === filter.priority)
    }
    if (filter.from) {
      filtered = filtered.filter((e) => e.timestamp >= filter.from!)
    }
    if (filter.to) {
      filtered = filtered.filter((e) => e.timestamp <= filter.to!)
    }

    // 按时间降序排列
    filtered.sort((a, b) => b.timestamp.localeCompare(a.timestamp))

    const total = filtered.length
    const offset = (filter.page - 1) * filter.limit
    const paged = filtered.slice(offset, offset + filter.limit)

    // 将事件合并为推送历史条目
    const pushMap = new Map<string, PushHistoryEntry>()
    for (const event of paged) {
      if (!pushMap.has(event.pushRecordId)) {
        pushMap.set(event.pushRecordId, {
          id: event.pushRecordId,
          memberId: event.memberId,
          tenantId: event.tenantId,
          channel: event.channel,
          priority: event.priority,
          title: '',
          body: '',
          status: 'sent',
          sentAt: event.timestamp,
        })
      }
      const entry = pushMap.get(event.pushRecordId)!
      if (event.eventType === 'delivered') {
        entry.status = 'delivered'
        entry.deliveredAt = event.timestamp
      } else if (event.eventType === 'clicked') {
        entry.status = 'clicked'
        entry.clickedAt = event.timestamp
      } else if (event.eventType === 'failed') {
        entry.status = 'failed'
      }
    }

    return {
      items: Array.from(pushMap.values()),
      total,
      page: filter.page,
      limit: filter.limit,
    }
  }

  /**
   * 计算比率
   */
  private calcRate(numerator: number, denominator: number): string {
    if (denominator === 0) return '0.00%'
    return `${((numerator / denominator) * 100).toFixed(2)}%`
  }

  /**
   * 获取默认开始日期 (7 天前)
   */
  private getDefaultStartDate(): string {
    const d = new Date()
    d.setDate(d.getDate() - 7)
    return d.toISOString().slice(0, 10)
  }

  /**
   * 获取今日日期
   */
  private getTodayDate(): string {
    return new Date().toISOString().slice(0, 10)
  }

  /**
   * 测试辅助: 清空所有事件
   */
  reset(): void {
    eventStore.length = 0
    eventIdCounter = 0
  }
}
