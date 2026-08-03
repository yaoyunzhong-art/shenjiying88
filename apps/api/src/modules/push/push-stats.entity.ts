/**
 * push-stats.entity.ts — 推送效果统计
 *
 * WP-13B: 效果回传 (BS-0185~BS-0188)
 *
 * 功能:
 * - 推送送达率统计
 * - 点击率统计
 * - 效果看板数据聚合
 */

import { PushBusinessPriority } from './push-priority.enum'

// ── 推送事件 ──

/**
 * 推送事件类型
 */
export type PushEventType = 'sent' | 'delivered' | 'clicked' | 'failed' | 'bounced'

/**
 * 推送事件记录
 * 每条推送从发送到用户点击的全链路事件
 */
export interface PushEventRecord {
  /** 事件 ID */
  id: string
  /** 关联推送记录 ID */
  pushRecordId: string
  /** 事件类型 */
  eventType: PushEventType
  /** 会员 ID */
  memberId: string
  /** 租户 ID */
  tenantId: string
  /** 推送通道 */
  channel: string
  /** 推送分级 */
  priority: PushBusinessPriority
  /** 事件发生时间 */
  timestamp: string
  /** 事件元数据 */
  metadata?: Record<string, unknown>
}

// ── 统计聚合 ──

/**
 * 通道统计
 */
export interface ChannelStats {
  /** 通道名称 */
  channel: string
  /** 总发送数 */
  sent: number
  /** 送达数 */
  delivered: number
  /** 点击数 */
  clicked: number
  /** 失败数 */
  failed: number
  /** 送达率 */
  deliveryRate: string
  /** 点击率 */
  clickRate: string
}

/**
 * 分级统计
 */
export interface PriorityStats {
  /** 推送分级 */
  priority: PushBusinessPriority
  /** 总发送数 */
  sent: number
  /** 送达数 */
  delivered: number
  /** 点击数 */
  clicked: number
  /** 失败数 */
  failed: number
  /** 送达率 */
  deliveryRate: string
  /** 点击率 */
  clickRate: string
}

/**
 * 推送效果看板数据
 * BS-0188: 效果看板
 */
export interface PushEffectDashboard {
  /** 开始日期 (YYYY-MM-DD) */
  startDate: string
  /** 结束日期 (YYYY-MM-DD) */
  endDate: string
  /** 总发送数 */
  totalSent: number
  /** 总送达数 */
  totalDelivered: number
  /** 总点击数 */
  totalClicked: number
  /** 总失败数 */
  totalFailed: number
  /** 总送达率 (格式: 'xx.xx%') */
  overallDeliveryRate: string
  /** 总点击率 (格式: 'xx.xx%') */
  overallClickRate: string
  /** 按通道统计 */
  byChannel: ChannelStats[]
  /** 按分级统计 */
  byPriority: PriorityStats[]
  /** 每日趋势 (最近 N 天) */
  dailyTrend: Array<{
    date: string
    sent: number
    delivered: number
    clicked: number
  }>
}

/**
 * 推送历史查询过滤
 */
export interface PushHistoryFilter {
  memberId?: string
  tenantId?: string
  channel?: string
  priority?: PushBusinessPriority
  from?: string
  to?: string
  page: number
  limit: number
}

/**
 * 推送历史条目
 */
export interface PushHistoryEntry {
  id: string
  deviceToken?: string
  memberId?: string
  tenantId?: string
  channel: string
  priority: PushBusinessPriority
  title: string
  body: string
  status: 'sent' | 'delivered' | 'clicked' | 'failed'
  sentAt: string
  deliveredAt?: string
  clickedAt?: string
}
