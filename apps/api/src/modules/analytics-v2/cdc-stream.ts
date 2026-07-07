import { Injectable } from '@nestjs/common'
import { CDCAdapter } from './datasources/cdc.adapter'
import type { TenantId, CDCEvent, CDCEventType } from './analytics-v2.entity'

/**
 * Phase-43 T173: CDCStream (Change Data Capture 流处理)
 *
 * DR-43-B: CDC watermark + 重放幂等 + 软删除
 *
 * 反模式 v4 cdc-consistency-pattern:
 *  - 重放非幂等: eventId 去重
 *  - watermark 回退: 单调递增
 *  - 软删除丢失: before 快照强制
 *  - 顺序错乱: 同 record 按 watermark 应用
 */
@Injectable()
export class CDCStream {
  constructor(private readonly cdcAdapter: CDCAdapter) {}

  /**
   * 创建 CDC 事件 (watermark = 当前毫秒)
   */
  create(input: {
    tenantId: TenantId
    tableName: string
    recordId: string
    eventType: CDCEventType
    before?: Record<string, any>
    after?: Record<string, any>
    eventId?: string
  }): CDCEvent {
    return {
      id: `cdc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tenantId: input.tenantId,
      tableName: input.tableName,
      recordId: input.recordId,
      eventType: input.eventType,
      timestamp: new Date().toISOString(),
      eventId: input.eventId || `cdc-${input.tenantId}-${input.tableName}-${input.recordId}-${Date.now()}`,
      watermark: Date.now(),
      before: input.before,
      after: input.after
    }
  }

  /**
   * 应用变更
   */
  apply(event: CDCEvent): { accepted: boolean; reason?: string; applied?: CDCEvent } {
    // 自动 watermark 校正 (单调递增)
    if (event.watermark <= this.cdcAdapter.currentWatermark(event.tenantId)) {
      event.watermark = this.cdcAdapter.currentWatermark(event.tenantId) + 1
    }
    return this.cdcAdapter.apply(event)
  }

  /**
   * 批量应用 (按 watermark 排序)
   */
  applyBatch(events: CDCEvent[]): Array<{ eventId: string; accepted: boolean; reason?: string }> {
    const sorted = events.sort((a, b) => a.watermark - b.watermark)
    return sorted.map(e => {
      const r = this.apply(e)
      return { eventId: e.eventId, accepted: r.accepted, reason: r.reason }
    })
  }

  /**
   * 重放事件 (幂等)
   */
  replay(event: CDCEvent): { accepted: boolean; reason?: string; replayed?: CDCEvent } {
    return this.cdcAdapter.replay(event)
  }

  /**
   * 查询变更流 (从指定 watermark 起)
   */
  tail(tenantId: TenantId, sinceWatermark?: number): CDCEvent[] {
    return this.cdcAdapter.queryByTenant(tenantId, sinceWatermark)
  }

  /**
   * 当前 watermark
   */
  currentWatermark(tenantId: TenantId): number {
    return this.cdcAdapter.currentWatermark(tenantId)
  }

  /**
   * 反模式检测: watermark 回退
   */
  detectWatermarkRegression(tenantId: TenantId, newWatermark: number): boolean {
    return newWatermark <= this.currentWatermark(tenantId)
  }
}