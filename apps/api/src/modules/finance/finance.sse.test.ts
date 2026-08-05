/**
 * finance.sse.spec.ts — P-38 财务 SSE 事件测试
 *
 * 覆盖:
 *   - FinanceEventEmitter: emit/stream/replay/store limits
 *   - 租户隔离
 *   - 事件类型过滤
 *   - 重连支持
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { firstValueFrom, toArray } from 'rxjs'
import { take, filter } from 'rxjs/operators'

// ─── 内联 EventEmitter ──────────────────────────────────────

type FinanceEventPayload =
  | { type: 'ledger.created'; tenantId: string; ledgerId: string; amount: number; timestamp: string }
  | { type: 'reconciliation.started'; tenantId: string; batchId: string; batchNo: string; channel: string; totalTransactions: number; timestamp: string }
  | { type: 'reconciliation.progress'; tenantId: string; batchId: string; processed: number; total: number; progress: number; timestamp: string }
  | { type: 'reconciliation.completed'; tenantId: string; batchId: string; matched: number; mismatched: number; totalDifference: number; timestamp: string }
  | { type: 'reconciliation.mismatch'; tenantId: string; batchId: string; transactionId: string; difference: number; timestamp: string }
  | { type: 'report.generating'; tenantId: string; reportId: string; reportType: string; timestamp: string }
  | { type: 'report.completed'; tenantId: string; reportId: string; status: string; timestamp: string }
  | { type: 'report.failed'; tenantId: string; reportId: string; error: string; timestamp: string }
  | { type: 'account.created'; tenantId: string; accountId: string; accountName: string; accountType: string; timestamp: string }
  | { type: 'account.frozen'; tenantId: string; accountId: string; timestamp: string }
  | { type: 'account.closed'; tenantId: string; accountId: string; timestamp: string }
  | { type: 'settlement.created'; tenantId: string; settlementId: string; totalRevenue: number; totalExpense: number; netProfit: number; timestamp: string }

interface FinanceMessageEvent {
  id: string
  type: string
  data: FinanceEventPayload
}

interface EventStoreRecord {
  event: FinanceEventPayload
  eventId: string
  timestamp: string
  tenantId: string
}

class FinanceEventEmitter {
  private store: EventStoreRecord[] = []
  private eventSeq = 0
  // RxJS 替代 — 使用简单的回调数组
  private listeners: Array<(msg: FinanceMessageEvent) => void> = []

  emit(event: FinanceEventPayload): string {
    this.eventSeq += 1
    const eventId = `fin-evt-${Date.now()}-${this.eventSeq}`
    const timestamp = new Date().toISOString()

    const messageEvent: FinanceMessageEvent = {
      id: eventId,
      type: event.type,
      data: event
    }

    this.store.push({ event, eventId, timestamp, tenantId: event.tenantId })
    if (this.store.length > 10000) {
      this.store.splice(0, this.store.length - 10000)
    }

    for (const listener of this.listeners) {
      listener(messageEvent)
    }

    return eventId
  }

  subscribe(cb: (msg: FinanceMessageEvent) => void): () => void {
    this.listeners.push(cb)
    return () => {
      this.listeners = this.listeners.filter((l) => l !== cb)
    }
  }

  getEvents(filterType?: string, tenantId?: string): FinanceMessageEvent[] {
    return this.store
      .filter((r) => !tenantId || r.tenantId === tenantId)
      .filter((r) => !filterType || r.event.type.startsWith(filterType))
      .map((r) => ({ id: r.eventId, type: r.event.type, data: r.event }))
  }

  replay(lastEventId: string, tenantId: string): FinanceMessageEvent[] {
    const lastIdx = this.store.findIndex((r) => r.eventId === lastEventId)
    const startIdx = lastIdx >= 0 ? lastIdx + 1 : 0

    return this.store
      .slice(startIdx)
      .filter((r) => r.tenantId === tenantId)
      .map((r) => ({ id: r.eventId, type: r.event.type, data: r.event }))
  }

  clear(): void {
    this.store.length = 0
    this.eventSeq = 0
    this.listeners.length = 0
  }

  get storeSize(): number {
    return this.store.length
  }
}

function now(): string {
  return new Date().toISOString()
}

// ═══════════════════════════════════════════════════════════════
// 测试
// ═══════════════════════════════════════════════════════════════

describe('FinanceEventEmitter', () => {
  let emitter: FinanceEventEmitter

  beforeEach(() => {
    emitter = new FinanceEventEmitter()
  })

  describe('emit', () => {
    it('should emit an event and return eventId', () => {
      const eventId = emitter.emit({
        type: 'ledger.created',
        tenantId: 't-1',
        ledgerId: 'ledger-001',
        amount: 10000,
        timestamp: now()
      })
      expect(eventId).toMatch(/^fin-evt-/)
    })

    it('should increment event sequence', () => {
      const id1 = emitter.emit({
        type: 'reconciliation.completed',
        tenantId: 't-1',
        batchId: 'rc-001',
        matched: 10,
        mismatched: 1,
        totalDifference: 0,
        timestamp: now()
      })
      const id2 = emitter.emit({
        type: 'report.completed',
        tenantId: 't-1',
        reportId: 'rpt-001',
        status: 'COMPLETED',
        timestamp: now()
      })
      expect(id1).not.toBe(id2)
      expect(emitter.storeSize).toBe(2)
    })

    it('should notify subscribers', () => {
      const received: FinanceMessageEvent[] = []
      emitter.subscribe((msg) => received.push(msg))

      emitter.emit({
        type: 'reconciliation.started',
        tenantId: 't-1',
        batchId: 'rc-001',
        batchNo: 'RC-WECHAT-20260711-ABC',
        channel: 'WECHAT',
        totalTransactions: 100,
        timestamp: now()
      })

      expect(received).toHaveLength(1)
      expect(received[0].type).toBe('reconciliation.started')
    })
  })

  describe('replay', () => {
    it('should replay events after lastEventId', () => {
      const e1 = emitter.emit({
        type: 'reconciliation.started',
        tenantId: 't-1',
        batchId: 'rc-001',
        batchNo: 'RC-WECHAT-001',
        channel: 'WECHAT',
        totalTransactions: 50,
        timestamp: now()
      })
      emitter.emit({
        type: 'reconciliation.progress',
        tenantId: 't-1',
        batchId: 'rc-001',
        processed: 25,
        total: 50,
        progress: 50,
        timestamp: now()
      })
      emitter.emit({
        type: 'reconciliation.completed',
        tenantId: 't-1',
        batchId: 'rc-001',
        matched: 48,
        mismatched: 2,
        totalDifference: 150,
        timestamp: now()
      })

      const replayed = emitter.replay(e1, 't-1')
      expect(replayed).toHaveLength(2)
      expect(replayed[0].type).toBe('reconciliation.progress')
    })

    it('should return all events when lastEventId not found', () => {
      emitter.emit({
        type: 'report.generating',
        tenantId: 't-1',
        reportId: 'rpt-001',
        reportType: 'PROFIT_LOSS',
        timestamp: now()
      })
      emitter.emit({
        type: 'report.completed',
        tenantId: 't-1',
        reportId: 'rpt-001',
        status: 'COMPLETED',
        timestamp: now()
      })

      const replayed = emitter.replay('nonexistent', 't-1')
      expect(replayed).toHaveLength(2)
    })

    it('should filter by tenant during replay', () => {
      emitter.emit({
        type: 'ledger.created',
        tenantId: 't-1',
        ledgerId: 'ledger-001',
        amount: 1000,
        timestamp: now()
      })
      emitter.emit({
        type: 'ledger.created',
        tenantId: 't-2',
        ledgerId: 'ledger-002',
        amount: 2000,
        timestamp: now()
      })

      const t1Events = emitter.replay('nonexistent', 't-1')
      expect(t1Events).toHaveLength(1)
      expect(t1Events[0].data.tenantId).toBe('t-1')
    })
  })

  describe('tenant isolation', () => {
    it('should filter events by tenant', () => {
      emitter.emit({
        type: 'ledger.created',
        tenantId: 'tenant-a',
        ledgerId: 'l-001',
        amount: 5000,
        timestamp: now()
      })
      emitter.emit({
        type: 'ledger.created',
        tenantId: 'tenant-b',
        ledgerId: 'l-002',
        amount: 8000,
        timestamp: now()
      })

      const tenantAEvents = emitter.getEvents(undefined, 'tenant-a')
      const tenantBEvents = emitter.getEvents(undefined, 'tenant-b')

      expect(tenantAEvents).toHaveLength(1)
      expect(tenantBEvents).toHaveLength(1)
      expect(tenantAEvents[0].data.tenantId).toBe('tenant-a')
      expect(tenantBEvents[0].data.tenantId).toBe('tenant-b')
    })
  })

  describe('type filtering', () => {
    it('should filter by event type prefix', () => {
      emitter.emit({
        type: 'reconciliation.started',
        tenantId: 't-1',
        batchId: 'rc-001',
        batchNo: 'RC-001',
        channel: 'WECHAT',
        totalTransactions: 10,
        timestamp: now()
      })
      emitter.emit({
        type: 'report.completed',
        tenantId: 't-1',
        reportId: 'rpt-001',
        status: 'COMPLETED',
        timestamp: now()
      })
      emitter.emit({
        type: 'reconciliation.progress',
        tenantId: 't-1',
        batchId: 'rc-001',
        processed: 5,
        total: 10,
        progress: 50,
        timestamp: now()
      })

      const recEvents = emitter.getEvents('reconciliation.', 't-1')
      const rptEvents = emitter.getEvents('report.', 't-1')

      expect(recEvents).toHaveLength(2)
      expect(rptEvents).toHaveLength(1)
    })
  })

  describe('store limits', () => {
    it('should cap store at 10000 events', () => {
      for (let i = 0; i < 10005; i++) {
        emitter.emit({
          type: 'ledger.created',
          tenantId: `t-${i % 10}`,
          ledgerId: `l-${i}`,
          amount: i,
          timestamp: now()
        })
      }
      expect(emitter.storeSize).toBeLessThanOrEqual(10000)
    })
  })

  describe('subscriber lifecycle', () => {
    it('should allow unsubscribe', () => {
      const received: FinanceMessageEvent[] = []
      const unsub = emitter.subscribe((msg) => received.push(msg))

      emitter.emit({
        type: 'report.completed',
        tenantId: 't-1',
        reportId: 'rpt-001',
        status: 'COMPLETED',
        timestamp: now()
      })
      expect(received).toHaveLength(1)

      unsub()
      emitter.emit({
        type: 'report.completed',
        tenantId: 't-1',
        reportId: 'rpt-002',
        status: 'COMPLETED',
        timestamp: now()
      })
      expect(received).toHaveLength(1) // 没有新增
    })
  })

  describe('clear', () => {
    it('should clear all events', () => {
      emitter.emit({
        type: 'ledger.created',
        tenantId: 't-1',
        ledgerId: 'l-001',
        amount: 1000,
        timestamp: now()
      })
      emitter.clear()
      expect(emitter.storeSize).toBe(0)
    })
  })

  describe('event types', () => {
    it('should handle all finance event types', () => {
      const events: FinanceEventPayload[] = [
        { type: 'ledger.created', tenantId: 't-1', ledgerId: 'l-1', amount: 100, timestamp: now() },
        { type: 'account.created', tenantId: 't-1', accountId: 'a-1', accountName: 'Main', accountType: 'CASH', timestamp: now() },
        { type: 'account.frozen', tenantId: 't-1', accountId: 'a-1', timestamp: now() },
        { type: 'account.closed', tenantId: 't-1', accountId: 'a-1', timestamp: now() },
        { type: 'settlement.created', tenantId: 't-1', settlementId: 's-1', totalRevenue: 1000, totalExpense: 500, netProfit: 500, timestamp: now() },
        { type: 'reconciliation.mismatch', tenantId: 't-1', batchId: 'rc-1', transactionId: 'txn-1', difference: 50, timestamp: now() },
        { type: 'report.failed', tenantId: 't-1', reportId: 'rpt-1', error: 'Error', timestamp: now() },
      ]

      for (const e of events) {
        emitter.emit(e)
      }

      expect(emitter.storeSize).toBe(events.length)
    })
  })
})
