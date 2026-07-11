/**
 * push.contract.ts - Push 模块跨模块契约
 *
 * 定义稳定的跨模块通信接口，供其他模块通过 cross-boundary 消费。
 * 只暴露安全的子集，隐藏实现细节。
 */

import type {
  PushRecord,
  PushTemplate,
  ScheduledPush,
  WSClient,
  PushStats,
} from './push.entity'
import {
  PushPlatform,
  PushStatus,
  PushPriority,
  PushScheduleStatus,
} from './push.entity'

// ── Contract Interfaces ──

/** 跨模块安全的推送记录契约 */
export interface PushRecordContract {
  id: string
  deviceToken: string
  platform: string
  status: string
  sentAt: string
  priority: string
}

/** 跨模块安全的推送模板契约 */
export interface PushTemplateContract {
  id: string
  code: string
  platform: string
  tenantId: string
  title?: string
  body: string
  enabled: boolean
  createdAt: string
}

/** 跨模块安全的定时推送契约 */
export interface ScheduledPushContract {
  id: string
  memberId: string
  content: string
  sendAt: string
  status: string
}

/** 跨模块安全的 WebSocket 客户端契约 */
export interface WSClientContract {
  clientId: string
  userId: string
  connectedAt: string
  sessionId?: string
}

/** 跨模块安全的推送统计契约 */
export interface PushStatsContract {
  totalSent: number
  totalFailed: number
  activeConnections: number
  scheduledCount: number
}

// ── Converter Functions ──

/** 将 PushRecord 转换为契约 */
export function toPushRecordContract(record: PushRecord): PushRecordContract {
  return {
    id: record.id,
    deviceToken: record.deviceToken,
    platform: record.platform,
    status: record.status,
    sentAt: record.sentAt,
    priority: record.priority,
  }
}

/** 将 PushTemplate 转换为契约 */
export function toPushTemplateContract(template: PushTemplate): PushTemplateContract {
  return {
    id: template.id,
    code: template.code,
    platform: template.platform,
    tenantId: template.tenantId,
    title: template.title,
    body: template.body,
    enabled: template.enabled,
    createdAt: template.createdAt,
  }
}

/** 将 ScheduledPush 转换为契约 */
export function toScheduledPushContract(push: ScheduledPush): ScheduledPushContract {
  return {
    id: push.id,
    memberId: push.memberId,
    content: push.content,
    sendAt: typeof push.sendAt === 'string' ? push.sendAt : push.sendAt.toISOString(),
    status: push.status,
  }
}

/** 将 WSClient 转换为契约 */
export function toWSClientContract(client: WSClient): WSClientContract {
  return {
    clientId: client.clientId,
    userId: client.userId,
    connectedAt: client.connectedAt,
    sessionId: client.sessionId,
  }
}

/** 将 PushStats 转换为契约 */
export function toPushStatsContract(stats: PushStats): PushStatsContract {
  return {
    totalSent: stats.totalSent,
    totalFailed: stats.totalFailed,
    activeConnections: stats.activeConnections,
    scheduledCount: stats.scheduledCount,
  }
}
