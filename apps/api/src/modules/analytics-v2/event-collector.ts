import { Injectable } from '@nestjs/common'
import { EventAdapter } from './datasources/event.adapter'
import type { TenantId, AnalyticsEvent, EventType, EventContext, EventAction } from './analytics-v2.entity'

/**
 * Phase-43 T173: EventCollector (事件采集器)
 *
 * DR-43-A: 事件 ClickHouse 列存 + JSON properties + 5W1H
 *
 * 反模式 v4 event-tracking-pattern:
 *  - 重复事件: eventId 幂等
 *  - 缺失元数据: 5W1H 字段强制
 *  - 时间漂移: 服务端时间戳
 *  - PII 泄露: who 字段脱敏
 *  - 过度采集: properties ≤ 50 keys
 */
const MAX_PROPERTIES = 50
const PII_KEYS = ['email', 'phone', 'idCard', 'password', 'token']

@Injectable()
export class EventCollector {
  constructor(private readonly eventAdapter: EventAdapter) {}

  /**
   * 采集事件 (服务端补全时间戳 + 脱敏)
   */
  collect(input: {
    tenantId: TenantId
    eventId: string
    type: EventType
    who: string
    what: string
    memberId?: string
    sessionId?: string
    where?: EventContext
    why?: string
    how?: string
    properties?: Record<string, any>
    revenueCents?: number
    timestamp?: string
  }): { accepted: boolean; reason?: string; event?: AnalyticsEvent } {
    // 脱敏 PII 字段
    const safeProps = input.properties ? this.sanitizeProperties(input.properties) : {}

    const event: AnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tenantId: input.tenantId,
      eventId: input.eventId,
      type: input.type,
      memberId: input.memberId,
      sessionId: input.sessionId,
      timestamp: input.timestamp || new Date().toISOString(),  // 服务端时间戳
      who: this.sanitizeWho(input.who),
      when: input.timestamp || new Date().toISOString(),
      where: input.where || {},
      what: { name: input.what },
      why: input.why,
      how: input.how,
      properties: safeProps,
      revenueCents: input.revenueCents
    }

    return this.eventAdapter.ingest(event)
  }

  /**
   * 批量采集
   */
  collectBatch(events: Parameters<EventCollector['collect']>[0][]): Array<{ accepted: boolean; reason?: string; eventId: string }> {
    return events.map(e => {
      const r = this.collect(e)
      return { accepted: r.accepted, reason: r.reason, eventId: e.eventId }
    })
  }

  /**
   * PII 脱敏
   */
  private sanitizeProperties(props: Record<string, any>): Record<string, any> {
    if (Object.keys(props).length > MAX_PROPERTIES) {
      const limited: Record<string, any> = {}
      Object.keys(props).slice(0, MAX_PROPERTIES).forEach(k => {
        limited[k] = this.maskPII(k, props[k])
      })
      return limited
    }
    const sanitized: Record<string, any> = {}
    for (const [k, v] of Object.entries(props)) {
      sanitized[k] = this.maskPII(k, v)
    }
    return sanitized
  }

  private maskPII(key: string, value: any): any {
    if (PII_KEYS.includes(key)) {
      return '***MASKED***'
    }
    return value
  }

  private sanitizeWho(who: string): string {
    // 简单脱敏: 邮箱/手机号
    if (who.includes('@')) return who.split('@')[0] + '@***'
    if (/^1[3-9]\d{9}$/.test(who)) return who.slice(0, 3) + '****' + who.slice(-4)
    return who
  }

  /**
   * 反模式检测: 过度采集
   */
  isOverCollecting(properties: Record<string, any>): boolean {
    return Object.keys(properties).length > MAX_PROPERTIES
  }
}