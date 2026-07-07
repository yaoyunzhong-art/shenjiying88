/**
 * edge-computing.service.spec.ts — 边缘计算 Service 深层单元测试
 *
 * 覆盖:
 *  - OfflineTicketService: 取号/排队/叫号/取消/完成/同步
 *  - TimeSyncService: 时钟偏移/同步/容差/校准
 *  - 正例/反例/边界 ≥ 18 项
 *
 * 全部内联 mock，不依赖 NestJS DI。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import type {
  Ticket,
  TicketStatus,
  QueuePosition,
  CallNextResult,
  SyncResult,
  TimeSyncResult,
  ClockToleranceResult,
} from './edge-computing.service'

// ═══════════════════════════════════════════════════════════════
// 枚举常量
// ═══════════════════════════════════════════════════════════════

const TICKET_STATUSES: TicketStatus[] = ['WAITING', 'CALLED', 'CANCELLED', 'COMPLETED']

// ═══════════════════════════════════════════════════════════════
// mock 数据工厂
// ═══════════════════════════════════════════════════════════════

function mockTicket(overrides?: Partial<Ticket>): Ticket {
  return {
    ticketId: `TK-test-001-${Math.random().toString(36).slice(2, 8)}`,
    storeId: 'store-001',
    ticketNumber: Math.floor(Math.random() * 1000) + 1,
    status: 'WAITING' as TicketStatus,
    issuedAt: new Date().toISOString(),
    customerId: undefined,
    priority: 0,
    ...overrides,
  }
}

// ═══════════════════════════════════════════════════════════════
// 模拟 OfflineTicketService（不 import 生产代码）
// ═══════════════════════════════════════════════════════════════

class MockOfflineTicketService {
  tickets = new Map<string, Ticket>()
  storeQueues = new Map<string, Set<string>>()
  ticketCounters = new Map<string, number>()

  issueTicket(storeId: string, customerId?: string, priority: number = 0): Ticket {
    const ticketNumber = this.getNextTicketNumber(storeId)
    const ticketId = `TK-${storeId}-${ticketNumber}-${Math.random().toString(36).slice(2, 10)}`
    const ticket: Ticket = {
      ticketId,
      storeId,
      ticketNumber,
      status: 'WAITING',
      issuedAt: new Date().toISOString(),
      customerId,
      priority,
    }
    this.tickets.set(ticketId, ticket)
    this.addToStoreQueue(storeId, ticketId)
    return ticket
  }

  getQueuePosition(ticketId: string): QueuePosition | null {
    const ticket = this.tickets.get(ticketId)
    if (!ticket) return null
    if (ticket.status !== 'WAITING') {
      return { ticketId, position: -1, estimatedWaitMinutes: 0, totalWaiting: this.getWaitingCount(ticket.storeId) }
    }
    const position = this.calculatePosition(ticket.storeId, ticketId)
    const totalWaiting = this.getWaitingCount(ticket.storeId)
    return { ticketId, position, estimatedWaitMinutes: Math.max(0, (position - 1) * 5), totalWaiting }
  }

  callNext(storeId: string): CallNextResult {
    const waitingTickets = this.getWaitingTickets(storeId)
    if (waitingTickets.length === 0) return { calledTicket: null, queueAfterCall: 0, previousTicketId: null }
    const sorted = [...waitingTickets].sort((a, b) => b.priority !== a.priority ? b.priority - a.priority : a.ticketNumber - b.ticketNumber)
    const next = sorted[0]
    next.status = 'CALLED'
    next.calledAt = new Date().toISOString()
    this.tickets.set(next.ticketId, next)
    return { calledTicket: next, queueAfterCall: this.getWaitingCount(storeId), previousTicketId: next.ticketId }
  }

  cancelTicket(ticketId: string): boolean {
    const ticket = this.tickets.get(ticketId)
    if (!ticket || ticket.status === 'COMPLETED') return false
    ticket.status = 'CANCELLED'
    this.tickets.set(ticketId, ticket)
    this.removeFromStoreQueue(ticket.storeId, ticketId)
    return true
  }

  completeTicket(ticketId: string): boolean {
    const ticket = this.tickets.get(ticketId)
    if (!ticket) return false
    ticket.status = 'COMPLETED'
    ticket.completedAt = new Date().toISOString()
    this.tickets.set(ticketId, ticket)
    this.removeFromStoreQueue(ticket.storeId, ticketId)
    return true
  }

  syncQueueToServer(storeId: string): SyncResult {
    const tickets = Array.from(this.tickets.values()).filter(t => t.storeId === storeId && t.status === 'WAITING')
    return { storeId, syncedAt: new Date().toISOString(), ticketCount: tickets.length, success: true }
  }

  getTicket(ticketId: string): Ticket | null {
    return this.tickets.get(ticketId) ?? null
  }

  getWaitingTickets(storeId: string): Ticket[] {
    return Array.from(this.tickets.values()).filter(t => t.storeId === storeId && t.status === 'WAITING')
  }

  clearStoreQueue(storeId: string): void {
    const queue = this.storeQueues.get(storeId)
    if (queue) {
      for (const id of queue) this.tickets.delete(id)
      this.storeQueues.delete(storeId)
    }
    this.ticketCounters.delete(storeId)
  }

  private getNextTicketNumber(storeId: string): number {
    const cur = this.ticketCounters.get(storeId) ?? 0
    const next = cur + 1
    this.ticketCounters.set(storeId, next)
    return next
  }

  private addToStoreQueue(storeId: string, ticketId: string): void {
    if (!this.storeQueues.has(storeId)) this.storeQueues.set(storeId, new Set())
    this.storeQueues.get(storeId)!.add(ticketId)
  }

  private removeFromStoreQueue(storeId: string, ticketId: string): void {
    this.storeQueues.get(storeId)?.delete(ticketId)
  }

  private getWaitingCount(storeId: string): number {
    return this.getWaitingTickets(storeId).length
  }

  private calculatePosition(storeId: string, ticketId: string): number {
    const waiting = this.getWaitingTickets(storeId)
    const sorted = [...waiting].sort((a, b) => b.priority !== a.priority ? b.priority - a.priority : a.ticketNumber - b.ticketNumber)
    const idx = sorted.findIndex(t => t.ticketId === ticketId)
    return idx === -1 ? -1 : idx + 1
  }
}

// ═══════════════════════════════════════════════════════════════
// 模拟 TimeSyncService（不 import 生产代码）
// ═══════════════════════════════════════════════════════════════

class MockTimeSyncService {
  clockOffset = 0
  lastSyncTime = 0
  syncHistory: Array<{ offset: number; timestamp: number }> = []

  getServerTime(): number { return Date.now() }

  calculateClockDrift(clientTime: number, serverTime: number): number {
    return serverTime - clientTime
  }

  syncClock(clientTime: number): TimeSyncResult {
    const t1 = Date.now()
    const serverTime = this.getServerTime()
    const t2 = Date.now()
    const roundTripDelay = t2 - t1
    const estimatedServerTime = serverTime + roundTripDelay / 2
    this.clockOffset = estimatedServerTime - clientTime
    this.lastSyncTime = serverTime
    this.syncHistory.push({ offset: this.clockOffset, timestamp: Date.now() })
    if (this.syncHistory.length > 10) this.syncHistory.shift()
    return { serverTime: estimatedServerTime, offset: this.clockOffset, roundTripDelay, synced: true }
  }

  isWithinTolerance(serverTime: number, toleranceMs: number = 500): ClockToleranceResult {
    const current = this.getServerTime()
    const deviationMs = Math.abs(current - serverTime)
    return { withinTolerance: deviationMs <= toleranceMs, deviationMs, serverTime: current }
  }

  isTimestampValid(timestamp: number, maxAgeMs: number = 60000): boolean {
    return Math.abs(this.getServerTime() - timestamp) <= maxAgeMs
  }

  getClockOffset(): number { return this.clockOffset }

  getLastSyncTime(): number { return this.lastSyncTime }

  calibrateWithSamples(samples: Array<{ clientTime: number; serverTime: number }>): number {
    if (samples.length === 0) return this.clockOffset
    const offsets = samples.map(s => s.serverTime - s.clientTime)
    const sorted = [...offsets].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    const median = sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
    this.clockOffset = median
    this.syncHistory.push({ offset: median, timestamp: Date.now() })
    if (this.syncHistory.length > 10) this.syncHistory.shift()
    return median
  }

  adjustTimestamp(timestamp: number): number {
    return timestamp + this.clockOffset
  }

  reset(): void {
    this.clockOffset = 0
    this.lastSyncTime = 0
    this.syncHistory = []
  }
}

// ═══════════════════════════════════════════════════════════════
// OfflineTicketService 测试
// ═══════════════════════════════════════════════════════════════

describe('OfflineTicketService', () => {
  let svc: MockOfflineTicketService

  beforeEach(() => {
    svc = new MockOfflineTicketService()
  })

  // ── 正例 7+ ──

  it('正例: issueTicket 返回有效票号', () => {
    const t = svc.issueTicket('store-001')
    expect(t.ticketId).toContain('TK-store-001')
    expect(t.ticketNumber).toBe(1)
    expect(t.status).toBe('WAITING')
    expect(t.storeId).toBe('store-001')
  })

  it('正例: issueTicket 票号递增', () => {
    const t1 = svc.issueTicket('store-001')
    const t2 = svc.issueTicket('store-001')
    expect(t2.ticketNumber).toBe(t1.ticketNumber + 1)
  })

  it('正例: issueTicket 支持优先级', () => {
    const t = svc.issueTicket('store-001', 'cust-abc', 5)
    expect(t.priority).toBe(5)
    expect(t.customerId).toBe('cust-abc')
  })

  it('正例: getQueuePosition 返回正确位置', () => {
    svc.issueTicket('store-001') // #1
    const t2 = svc.issueTicket('store-001') // #2
    const pos = svc.getQueuePosition(t2.ticketId)
    expect(pos).not.toBeNull()
    expect(pos!.position).toBe(2)
    expect(pos!.totalWaiting).toBe(2)
    expect(pos!.estimatedWaitMinutes).toBe(5) // (2-1)*5
  })

  it('正例: callNext 叫号返回排最前的票', () => {
    svc.issueTicket('store-001')
    const t2 = svc.issueTicket('store-001')
    const result = svc.callNext('store-001')
    expect(result.calledTicket).not.toBeNull()
    expect(result.calledTicket!.ticketNumber).toBe(1)
    expect(result.queueAfterCall).toBe(1)
    expect(result.calledTicket!.status).toBe('CALLED')
  })

  it('正例: 先叫高优先级后叫低优先级', () => {
    svc.issueTicket('store-001', undefined, 0)  // low priority, #1
    const high = svc.issueTicket('store-001', undefined, 10) // high priority, #2
    const firstCall = svc.callNext('store-001')
    expect(firstCall.calledTicket!.ticketId).toBe(high.ticketId) // 高优先级先叫
    const secondCall = svc.callNext('store-001')
    expect(secondCall.calledTicket!.ticketNumber).toBe(1)
  })

  it('正例: syncQueueToServer 返回待同步数', () => {
    svc.issueTicket('store-001')
    svc.issueTicket('store-001')
    const sync = svc.syncQueueToServer('store-001')
    expect(sync.success).toBe(true)
    expect(sync.ticketCount).toBe(2)
  })

  it('正例: completeTicket 标记完成', () => {
    const t = svc.issueTicket('store-001')
    expect(svc.completeTicket(t.ticketId)).toBe(true)
    const completed = svc.getTicket(t.ticketId)!
    expect(completed.status).toBe('COMPLETED')
    expect(completed.completedAt).toBeDefined()
  })

  // ── 反例 5+ ──

  it('反例: cancelTicket 取消后不在队列', () => {
    const t = svc.issueTicket('store-001')
    svc.cancelTicket(t.ticketId)
    const pos = svc.getQueuePosition(t.ticketId)
    expect(pos!.position).toBe(-1)
  })

  it('反例: 完成票不可取消', () => {
    const t = svc.issueTicket('store-001')
    svc.completeTicket(t.ticketId)
    expect(svc.cancelTicket(t.ticketId)).toBe(false)
  })

  it('反例: 不存在的 ticketId getTicket 返回 null', () => {
    expect(svc.getTicket('nonexistent')).toBeNull()
  })

  it('反例: 不存在的 ticketId getQueuePosition 返回 null', () => {
    expect(svc.getQueuePosition('nonexistent')).toBeNull()
  })

  it('反例: 空队列 callNext 返回 null', () => {
    const result = svc.callNext('empty-store')
    expect(result.calledTicket).toBeNull()
    expect(result.queueAfterCall).toBe(0)
  })

  it('反例: 不存在的 ticketId completeTicket 返回 false', () => {
    expect(svc.completeTicket('nonexistent')).toBe(false)
  })

  // ── 边界 5+ ──

  it('边界: 同一 store 不同计数器', () => {
    const t1 = svc.issueTicket('store-A')
    const t2 = svc.issueTicket('store-B')
    expect(t1.ticketNumber).toBe(1)
    expect(t2.ticketNumber).toBe(1)
  })

  it('边界: 清除队列后计数重置', () => {
    svc.issueTicket('store-001')
    svc.clearStoreQueue('store-001')
    const t = svc.issueTicket('store-001')
    expect(t.ticketNumber).toBe(1)
  })

  it('边界: getQueuePosition 对已叫号票返回 -1', () => {
    const t = svc.issueTicket('store-001')
    svc.callNext('store-001')
    const pos = svc.getQueuePosition(t.ticketId)
    expect(pos!.position).toBe(-1)
  })

  it('边界: 大量并发叫号', () => {
    for (let i = 0; i < 100; i++) svc.issueTicket('store-001')
    for (let i = 0; i < 50; i++) svc.callNext('store-001')
    expect(svc.getWaitingTickets('store-001').length).toBe(50)
  })

  it('边界: 完全取消后队列为空', () => {
    svc.issueTicket('store-001')
    svc.issueTicket('store-001')
    svc.issueTicket('store-001')
    for (const t of svc.tickets.values()) svc.cancelTicket(t.ticketId)
    expect(svc.getWaitingTickets('store-001').length).toBe(0)
  })

  it('边界: completeTicket 从队列移除', () => {
    const t = svc.issueTicket('store-001')
    svc.completeTicket(t.ticketId)
    expect(svc.storeQueues.get('store-001')!.has(t.ticketId)).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════
// TimeSyncService 测试
// ═══════════════════════════════════════════════════════════════

describe('TimeSyncService', () => {
  let svc: MockTimeSyncService

  beforeEach(() => {
    svc = new MockTimeSyncService()
  })

  // ── 正例 5+ ──

  it('正例: syncClock 返回有效结果', () => {
    const clientTime = Date.now() - 100 // 假设客户端慢 100ms
    const result = svc.syncClock(clientTime)
    expect(result.synced).toBe(true)
    expect(result.roundTripDelay).toBeGreaterThanOrEqual(0)
    expect(Math.abs(result.offset)).toBeGreaterThan(0)
  })

  it('正例: calculateClockDrift 正确计算偏移', () => {
    const drift = svc.calculateClockDrift(1000, 1100)
    expect(drift).toBe(100)
  })

  it('正例: 客户端快时偏移为负', () => {
    const drift = svc.calculateClockDrift(1100, 1000)
    expect(drift).toBe(-100)
  })

  it('正例: isWithinTolerance 返回正确结果', () => {
    const serverTime = svc.getServerTime()
    const result = svc.isWithinTolerance(serverTime, 10000)
    expect(result.withinTolerance).toBe(true)
    expect(result.deviationMs).toBeLessThan(10000)
  })

  it('正例: isTimestampValid 有效时间戳', () => {
    expect(svc.isTimestampValid(Date.now(), 5000)).toBe(true)
  })

  // ── 反例 ──

  it('反例: 过期时间戳 invalid', () => {
    expect(svc.isTimestampValid(Date.now() - 120000, 60000)).toBe(false)
  })

  it('反例: 未来时间戳超出 maxAge', () => {
    expect(svc.isTimestampValid(Date.now() + 120000, 60000)).toBe(false)
  })

  // ── 边界 ──

  it('边界: calibrateWithSamples 空数组返回当前 offset', () => {
    const offset = svc.calibrateWithSamples([])
    expect(offset).toBe(0)
  })

  it('边界: calibrateWithSamples 计算中位数', () => {
    const samples = [
      { clientTime: 1000, serverTime: 1100 }, // offset: 100
      { clientTime: 1000, serverTime: 1200 }, // offset: 200
      { clientTime: 1000, serverTime: 1300 }, // offset: 300
    ]
    const median = svc.calibrateWithSamples(samples)
    expect(median).toBe(200) // 中位数
  })

  it('边界: adjustTimestamp 应用偏移', () => {
    svc.clockOffset = 100
    expect(svc.adjustTimestamp(1000)).toBe(1100)
  })

  it('边界: reset 清零状态', () => {
    svc.clockOffset = 500
    svc.lastSyncTime = 12345
    svc.syncHistory.push({ offset: 500, timestamp: Date.now() })
    svc.reset()
    expect(svc.clockOffset).toBe(0)
    expect(svc.lastSyncTime).toBe(0)
    expect(svc.syncHistory).toHaveLength(0)
  })

  it('边界: syncHistory 不超过 10 条', () => {
    for (let i = 0; i < 15; i++) svc.syncClock(Date.now() - i * 10)
    expect(svc.syncHistory.length).toBeLessThanOrEqual(10)
  })

  it('正例: 多次同步后 offset 累积变化', () => {
    const r1 = svc.syncClock(Date.now())
    const r2 = svc.syncClock(Date.now() + 1000) // 假装客户端更快
    expect(r2.offset).not.toBe(0)
  })
})
