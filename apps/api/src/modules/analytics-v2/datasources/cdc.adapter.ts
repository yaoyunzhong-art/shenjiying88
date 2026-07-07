import { Injectable } from '@nestjs/common'
import type { TenantId, CDCEvent, CDCEventType } from '../analytics-v2.entity'

/**
 * Phase-43 T173: CDCAdapter (Change Data Capture, 增量同步)
 *
 * 反模式 v4 cdc-consistency-pattern:
 *  - 重放非幂等: eventId 去重
 *  - watermark 回退: 单调递增 watermark
 *  - 软删除丢失: DELETED 必须保留 before 快照
 *  - 顺序错乱: 同一 recordId 按 watermark 排序应用
 */
@Injectable()
export class CDCAdapter {
  private events: CDCEvent[] = []
  private byEventId = new Map<string, CDCEvent>()
  private watermark: Map<string, number> = new Map()  // tenantId -> lastWatermark

  apply(event: CDCEvent): { accepted: boolean; reason?: string; applied?: CDCEvent } {
    // 幂等: eventId 去重
    if (this.byEventId.has(event.eventId)) {
      return { accepted: false, reason: `duplicate_event_id: ${event.eventId}` }
    }
    // watermark 单调递增
    const lastWm = this.watermark.get(event.tenantId) || 0
    if (event.watermark <= lastWm) {
      return { accepted: false, reason: `watermark_not_increasing: ${event.watermark} <= ${lastWm}` }
    }
    // 软删除必须有 before
    if (event.eventType === 'DELETED' && !event.before) {
      return { accepted: false, reason: 'deleted_event_missing_before' }
    }
    // 持久化
    const stored: CDCEvent = {
      ...event,
      appliedAt: new Date().toISOString(),
      replayed: false
    }
    this.events.push(stored)
    this.byEventId.set(stored.eventId, stored)
    this.watermark.set(stored.tenantId, stored.watermark)
    return { accepted: true, applied: stored }
  }

  replay(event: CDCEvent): { accepted: boolean; reason?: string; replayed?: CDCEvent } {
    // 重放也要幂等
    if (this.byEventId.has(event.eventId)) {
      return { accepted: false, reason: `duplicate_replay: ${event.eventId}` }
    }
    const stored: CDCEvent = {
      ...event,
      appliedAt: new Date().toISOString(),
      replayed: true
    }
    this.events.push(stored)
    this.byEventId.set(stored.eventId, stored)
    return { accepted: true, replayed: stored }
  }

  query(tenantId: TenantId, eventId: string): CDCEvent | null {
    const e = this.byEventId.get(eventId)
    if (!e || e.tenantId !== tenantId) return null
    return { ...e }
  }

  queryByTenant(tenantId: TenantId, sinceWatermark?: number): CDCEvent[] {
    let list = this.events.filter(e => e.tenantId === tenantId)
    if (sinceWatermark !== undefined) {
      list = list.filter(e => e.watermark > sinceWatermark)
    }
    return list
      .sort((a, b) => a.watermark - b.watermark)
      .map(e => ({ ...e }))
  }

  queryByRecord(tenantId: TenantId, tableName: string, recordId: string): CDCEvent[] {
    return this.events
      .filter(e => e.tenantId === tenantId && e.tableName === tableName && e.recordId === recordId)
      .sort((a, b) => a.watermark - b.watermark)
      .map(e => ({ ...e }))
  }

  currentWatermark(tenantId: TenantId): number {
    return this.watermark.get(tenantId) || 0
  }

  /**
   * 应用变更到本地状态 (简化版, 真实场景会分发到下游)
   */
  applyToState(tableName: string, recordId: string, event: CDCEvent): Record<string, any> | null {
    if (event.eventType === 'CREATED' || event.eventType === 'UPDATED') {
      return event.after ? { ...event.after } : null
    }
    if (event.eventType === 'DELETED') {
      return null  // 已删除
    }
    return null
  }

  reset(): void {
    this.events = []
    this.byEventId.clear()
    this.watermark.clear()
  }
}