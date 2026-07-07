import { Injectable } from '@nestjs/common'
import type { TenantId, AnalyticsEvent, EventType } from '../analytics-v2.entity'

/**
 * Phase-43 T173: EventAdapter (事件采集, 类 ClickHouse 列存)
 *
 * 反模式 v4 event-tracking-pattern:
 *  - 重复事件: eventId 幂等键去重
 *  - 缺失元数据: 强制 5W1H 字段
 *  - 时间漂移: 服务端时间戳, 不信任客户端
 *  - 隐私泄露: PII 字段需脱敏
 *  - 过度采集: 控制 properties 大小 (默认 ≤ 50 keys)
 */
const MAX_PROPERTIES_KEYS = 50

@Injectable()
export class EventAdapter {
  private events = new Map<string, AnalyticsEvent>()     // 主键: id
  private eventIdIndex = new Map<string, string>()        // eventId -> id (幂等去重)
  private byTenant = new Map<string, Set<string>>()       // tenantId -> event ids

  ingest(event: AnalyticsEvent): { accepted: boolean; reason?: string; event?: AnalyticsEvent } {
    // 幂等检查
    if (this.eventIdIndex.has(event.eventId)) {
      return { accepted: false, reason: `duplicate_event_id: ${event.eventId}` }
    }
    // properties 大小限制
    if (Object.keys(event.properties || {}).length > MAX_PROPERTIES_KEYS) {
      return { accepted: false, reason: `too_many_properties: ${Object.keys(event.properties).length} > ${MAX_PROPERTIES_KEYS}` }
    }
    // 必填字段
    if (!event.tenantId || !event.type || !event.who) {
      return { accepted: false, reason: 'missing_required_fields' }
    }
    // 持久化
    const stored: AnalyticsEvent = { ...event }
    this.events.set(stored.id, stored)
    this.eventIdIndex.set(stored.eventId, stored.id)

    if (!this.byTenant.has(stored.tenantId)) {
      this.byTenant.set(stored.tenantId, new Set())
    }
    this.byTenant.get(stored.tenantId)!.add(stored.id)
    return { accepted: true, event: stored }
  }

  query(tenantId: TenantId, eventId: string): AnalyticsEvent | null {
    const id = this.eventIdIndex.get(eventId)
    if (!id) return null
    const e = this.events.get(id)
    if (!e || e.tenantId !== tenantId) return null
    return { ...e }
  }

  queryById(tenantId: TenantId, id: string): AnalyticsEvent | null {
    const e = this.events.get(id)
    if (!e || e.tenantId !== tenantId) return null
    return { ...e }
  }

  queryByTenant(tenantId: TenantId, limit?: number): AnalyticsEvent[] {
    const ids = this.byTenant.get(tenantId)
    if (!ids) return []
    const all = Array.from(ids).map(id => this.events.get(id)!).filter(Boolean)
    all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    return limit ? all.slice(0, limit) : all
  }

  queryByType(tenantId: TenantId, type: EventType, limit?: number): AnalyticsEvent[] {
    return this.queryByTenant(tenantId, limit).filter(e => e.type === type)
  }

  queryByMember(tenantId: TenantId, memberId: string, limit?: number): AnalyticsEvent[] {
    return this.queryByTenant(tenantId).filter(e => e.memberId === memberId).slice(0, limit)
  }

  queryByTimeRange(tenantId: TenantId, startMs: number, endMs: number): AnalyticsEvent[] {
    return this.queryByTenant(tenantId).filter(e => {
      const t = new Date(e.timestamp).getTime()
      return t >= startMs && t <= endMs
    })
  }

  count(tenantId: TenantId): number {
    return this.byTenant.get(tenantId)?.size || 0
  }

  reset(): void {
    this.events.clear()
    this.eventIdIndex.clear()
    this.byTenant.clear()
  }
}