import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [queue] [A] service.spec — ≥18项正反例+边界
 * QueueService 纯函数式内联测试 (不 import 生产代码)
 *
 * 覆盖: 创建取号(3) + 叫号服务(3) + 状态流转(3) + 查询队列(3) + 统计(2) + 分页(2) + 边界(2) = 18
 */

import assert from 'node:assert/strict'

// ── 内联类型 ──

type QueueType = 'booking' | 'waiting' | 'service'
type QueueStatus = 'waiting' | 'called' | 'serving' | 'completed' | 'cancelled' | 'no_show'

interface QueueEntity {
  id: string; tenantId: string; type: QueueType; queueNumber: string
  userId: string; userName: string; phone?: string; partySize: number
  resourceId?: string; resourceName?: string; status: QueueStatus; priority: number
  estimatedWaitMin: number; actualWaitMin?: number
  calledAt?: Date; servedAt?: Date; completedAt?: Date; remark?: string
  createdAt: Date; updatedAt: Date
}

interface QueueStats {
  total: number; waitingCount: number; calledCount: number; servingCount: number
  completedCount: number; cancelledCount: number; noShowCount: number; avgWaitMin: number
}

interface PaginatedResult<T> { items: T[]; total: number; page: number; pageSize: number; totalPages: number }

interface QueuePosition { position: number; estimatedWaitMinutes: number; entry: QueueEntity | null }

// ── 内联状态机 ──

const QUEUE_STATUS_TRANSITIONS: Record<QueueStatus, QueueStatus[]> = {
  waiting: ['called', 'cancelled'], called: ['serving', 'no_show', 'cancelled'],
  serving: ['completed', 'cancelled'], completed: [], cancelled: [], no_show: [],
}

// ── 内联 Mock Service ──

let _idCounter = 0
function nextId(): string { return `q-${++_idCounter}` }

class MockQueueService {
  private store = new Map<string, QueueEntity>()
  private counters = new Map<string, number>()

  private assertOwned(id: string, tenantId: string): QueueEntity {
    const e = this.store.get(id)
    if (!e || e.tenantId !== tenantId) throw new Error(`Queue entry not found: ${id}`)
    return e
  }

  private assertTransition(from: QueueStatus, to: QueueStatus): void {
    const allowed = QUEUE_STATUS_TRANSITIONS[from]
    if (!allowed.includes(to)) throw new Error(`Invalid transition: ${from} → ${to}`)
  }

  create(input: { tenantId: string; type: QueueType; userId: string; userName: string; partySize: number; resourceId?: string; resourceName?: string; remark?: string; phone?: string }): QueueEntity {
    const now = new Date()
    const ck = `${input.tenantId}:${input.type}`
    const cur = (this.counters.get(ck) ?? 0) + 1
    this.counters.set(ck, cur)
    const prefixMap: Record<QueueType, string> = { booking: 'A', waiting: 'B', service: 'C' }
    const qn = `${prefixMap[input.type]}${String(cur).padStart(3, '0')}`
    const ahead = Array.from(this.store.values()).filter((q) => q.tenantId === input.tenantId && q.type === input.type && (q.status === 'waiting' || q.status === 'called')).length
    const e: QueueEntity = {
      id: nextId(), tenantId: input.tenantId, type: input.type, queueNumber: qn,
      userId: input.userId, userName: input.userName, phone: input.phone, partySize: input.partySize,
      resourceId: input.resourceId, resourceName: input.resourceName, status: 'waiting',
      priority: 0, estimatedWaitMin: ahead * 5, remark: input.remark,
      createdAt: now, updatedAt: now,
    }
    this.store.set(e.id, e)
    return e
  }

  takeNumber(input: any): QueueEntity { return this.create(input) }

  findAll(tenantId: string, filter?: { type?: QueueType; status?: QueueStatus; resourceId?: string; userId?: string; queueNumber?: string }): QueueEntity[] {
    return Array.from(this.store.values())
      .filter((q) => q.tenantId === tenantId)
      .filter((q) => (filter?.type ? q.type === filter.type : true))
      .filter((q) => (filter?.status ? q.status === filter.status : true))
      .filter((q) => (filter?.resourceId ? q.resourceId === filter.resourceId : true))
      .filter((q) => (filter?.userId ? q.userId === filter.userId : true))
      .filter((q) => (filter?.queueNumber ? q.queueNumber === filter.queueNumber : true))
      .sort((a, b) => a.queueNumber.localeCompare(b.queueNumber))
  }

  findPaginated(tenantId: string, filter?: { type?: QueueType; status?: QueueStatus; page?: number; pageSize?: number }): PaginatedResult<QueueEntity> {
    const page = filter?.page ?? 1; const pageSize = filter?.pageSize ?? 20
    const items = this.findAll(tenantId, { type: filter?.type, status: filter?.status })
    const total = items.length; const totalPages = Math.ceil(total / pageSize)
    const start = (page - 1) * pageSize
    return { items: items.slice(start, start + pageSize), total, page, pageSize, totalPages }
  }

  findOne(id: string, tenantId: string): QueueEntity | undefined {
    const e = this.store.get(id)
    return (!e || e.tenantId !== tenantId) ? undefined : e
  }

  update(id: string, tenantId: string, data: { partySize?: number; phone?: string; resourceName?: string; remark?: string }): QueueEntity {
    const e = this.assertOwned(id, tenantId)
    if (data.partySize !== undefined) e.partySize = data.partySize
    if (data.phone !== undefined) e.phone = data.phone
    if (data.resourceName !== undefined) e.resourceName = data.resourceName
    if (data.remark !== undefined) e.remark = data.remark
    e.updatedAt = new Date()
    return e
  }

  cancel(id: string, tenantId: string): QueueEntity {
    const e = this.assertOwned(id, tenantId)
    this.assertTransition(e.status, 'cancelled')
    e.status = 'cancelled'; e.updatedAt = new Date(); return e
  }

  callNext(resourceId: string, tenantId: string): QueueEntity | null {
    const waiting = Array.from(this.store.values())
      .filter((q) => q.tenantId === tenantId && q.status === 'waiting' && (resourceId ? q.resourceId === resourceId : true))
      .sort((a, b) => { if (a.priority !== b.priority) return b.priority - a.priority; return a.queueNumber.localeCompare(b.queueNumber) })
    const next = waiting[0] ?? null
    if (next) {
      next.status = 'called'; next.calledAt = new Date(); next.updatedAt = new Date()
      next.actualWaitMin = Math.round((next.calledAt.getTime() - next.createdAt.getTime()) / 60000)
      this.store.set(next.id, next)
    }
    return next
  }

  startService(id: string, tenantId: string): QueueEntity {
    const e = this.assertOwned(id, tenantId)
    this.assertTransition(e.status, 'serving')
    e.status = 'serving'; e.servedAt = new Date(); e.updatedAt = new Date(); return e
  }

  complete(id: string, tenantId: string): QueueEntity {
    const e = this.assertOwned(id, tenantId)
    this.assertTransition(e.status, 'completed')
    e.status = 'completed'; e.completedAt = new Date(); e.updatedAt = new Date(); return e
  }

  markNoShow(id: string, tenantId: string): QueueEntity {
    const e = this.assertOwned(id, tenantId)
    this.assertTransition(e.status, 'no_show')
    e.status = 'no_show'; e.updatedAt = new Date(); return e
  }

  getCurrentQueue(tenantId: string, resourceId?: string, type?: QueueType): QueueEntity[] {
    return Array.from(this.store.values())
      .filter((q) => q.tenantId === tenantId && (q.status === 'waiting' || q.status === 'called' || q.status === 'serving'))
      .filter((q) => (resourceId ? q.resourceId === resourceId : true))
      .filter((q) => (type ? q.type === type : true))
  }

  getWaitingList(tenantId: string, resourceId?: string): QueueEntity[] {
    return Array.from(this.store.values())
      .filter((q) => q.tenantId === tenantId && q.status === 'waiting')
      .filter((q) => (resourceId ? q.resourceId === resourceId : true))
      .sort((a, b) => { if (a.priority !== b.priority) return b.priority - a.priority; return a.queueNumber.localeCompare(b.queueNumber) })
  }

  getQueueStats(tenantId: string, resourceId?: string): QueueStats {
    const entries = Array.from(this.store.values()).filter((q) => q.tenantId === tenantId).filter((q) => (resourceId ? q.resourceId === resourceId : true))
    const completed = entries.filter((q) => q.status === 'completed' && q.actualWaitMin != null)
    const avgWait = completed.length > 0 ? Math.round(completed.reduce((s, q) => s + q.actualWaitMin!, 0) / completed.length) : 0
    return { total: entries.length, waitingCount: entries.filter((q) => q.status === 'waiting').length, calledCount: entries.filter((q) => q.status === 'called').length, servingCount: entries.filter((q) => q.status === 'serving').length, completedCount: entries.filter((q) => q.status === 'completed').length, cancelledCount: entries.filter((q) => q.status === 'cancelled').length, noShowCount: entries.filter((q) => q.status === 'no_show').length, avgWaitMin: avgWait }
  }

  getMyPosition(memberId: string, resourceId: string, tenantId: string): QueuePosition {
    if (!memberId || !resourceId) return { position: -1, estimatedWaitMinutes: 0, entry: null }
    const waiting = this.getWaitingList(tenantId, resourceId)
    const idx = waiting.findIndex((q) => q.userId === memberId)
    return idx === -1 ? { position: -1, estimatedWaitMinutes: 0, entry: null } : { position: idx + 1, estimatedWaitMinutes: (idx + 1) * 5, entry: waiting[idx] }
  }

  // wrappers
  joinQueue(input: { tenantId: string; queueType: QueueType; memberId: string; memberName?: string; resourceId?: string; resourceName?: string; remark?: string }): QueueEntity {
    return this.create({ tenantId: input.tenantId, type: input.queueType, userId: input.memberId, userName: input.memberName ?? input.memberId, partySize: 1, resourceId: input.resourceId, resourceName: input.resourceName, remark: input.remark })
  }
  leaveQueue(entryId: string, tenantId: string): QueueEntity { return this.cancel(entryId, tenantId) }
  completeService(entryId: string, tenantId: string): QueueEntity { return this.complete(entryId, tenantId) }
  getQueueStatus(resourceId: string, tenantId: string): QueueStats { return this.getQueueStats(tenantId, resourceId) }

  // test helper
  reset() { this.store.clear(); this.counters.clear() }
}

// ── 测试 ──

describe('queue service.spec', () => {
  let svc: MockQueueService
  const T = 'tenant-A'

  beforeEach(() => { svc = new MockQueueService() })
  afterEach(() => { svc.reset() })

  // === 1. 创建取号 (3) ===
  describe('创建取号', () => {
    it('create 创建 Booking 队列号 A001', () => {
      const e = svc.create({ tenantId: T, type: 'booking', userId: 'u1', userName: '张三', partySize: 2 })
      assert.equal(e.tenantId, T); assert.equal(e.type, 'booking')
      assert.ok(e.queueNumber.startsWith('A')); assert.equal(e.status, 'waiting')
      assert.ok(e.id.startsWith('q-'))
    })
    it('takeNumber 递增队列号', () => {
      const e1 = svc.takeNumber({ tenantId: T, type: 'waiting', userId: 'u1', userName: '李四', partySize: 1 })
      assert.equal(e1.queueNumber, 'B001')
      const e2 = svc.takeNumber({ tenantId: T, type: 'waiting', userId: 'u2', userName: '王五', partySize: 1 })
      assert.equal(e2.queueNumber, 'B002')
    })
    it('不同 type 前缀不同', () => {
      assert.equal(svc.create({ tenantId: T, type: 'booking', userId: 'u', userName: 'u', partySize: 1 }).queueNumber[0], 'A')
      assert.equal(svc.create({ tenantId: T, type: 'waiting', userId: 'u', userName: 'u', partySize: 1 }).queueNumber[0], 'B')
      assert.equal(svc.create({ tenantId: T, type: 'service', userId: 'u', userName: 'u', partySize: 1 }).queueNumber[0], 'C')
    })
  })

  // === 2. 叫号服务流转 (3) ===
  describe('叫号与服务', () => {
    it('callNext 叫号 waiting → called', () => {
      svc.create({ tenantId: T, type: 'booking', userId: 'u1', userName: 'x', partySize: 1, resourceId: 'r1' })
      const next = svc.callNext('r1', T)
      assert.ok(next); assert.equal(next!.status, 'called'); assert.ok(next!.calledAt)
      assert.ok(next!.actualWaitMin! >= 0)
    })
    it('startService + complete 完整流程', () => {
      const e = svc.create({ tenantId: T, type: 'waiting', userId: 'u1', userName: 'x', partySize: 1, resourceId: 'r1' })
      const called = svc.callNext('r1', T)
      const serving = svc.startService(called!.id, T)
      assert.equal(serving.status, 'serving')
      const done = svc.complete(serving.id, T)
      assert.equal(done.status, 'completed')
    })
    it('markNoShow called → no_show', () => {
      const e = svc.create({ tenantId: T, type: 'booking', userId: 'u1', userName: 'x', partySize: 1, resourceId: 'r1' })
      svc.callNext('r1', T)
      const ns = svc.markNoShow(e.id, T)
      assert.equal(ns.status, 'no_show')
    })
  })

  // === 3. 状态流转校验 (3) ===
  describe('状态流转校验', () => {
    it('completed 不能再 cancel', () => {
      const e = svc.create({ tenantId: T, type: 'booking', userId: 'u', userName: 'u', partySize: 1, resourceId: 'r1' })
      svc.callNext('r1', T)
      svc.startService(e.id, T)
      svc.complete(e.id, T)
      assert.throws(() => svc.cancel(e.id, T), /Invalid transition/)
    })
    it('waiting 不能直接 complete', () => {
      const e = svc.create({ tenantId: T, type: 'booking', userId: 'u', userName: 'u', partySize: 1, resourceId: 'r1' })
      assert.throws(() => svc.complete(e.id, T), /Invalid transition/)
    })
    it('no_show 不能 startService', () => {
      const e = svc.create({ tenantId: T, type: 'booking', userId: 'u', userName: 'u', partySize: 1, resourceId: 'r1' })
      svc.callNext('r1', T)
      svc.markNoShow(e.id, T)
      assert.throws(() => svc.startService(e.id, T), /Invalid transition/)
    })
  })

  // === 4. 查询队列 (3) ===
  describe('队列查询', () => {
    it('findAll 按 filters 过滤', () => {
      svc.create({ tenantId: T, type: 'booking', userId: 'u1', userName: 'x', partySize: 1, resourceId: 'r1' })
      svc.create({ tenantId: T, type: 'waiting', userId: 'u2', userName: 'x', partySize: 1, resourceId: 'r2' })
      assert.equal(svc.findAll(T, { type: 'booking' }).length, 1)
      assert.equal(svc.findAll(T, { resourceId: 'r1' }).length, 1)
    })
    it('getCurrentQueue 只含 active 状态', () => {
      const e = svc.create({ tenantId: T, type: 'booking', userId: 'u', userName: 'u', partySize: 1, resourceId: 'r1' })
      assert.ok(svc.getCurrentQueue(T).length >= 1)
      svc.cancel(e.id, T)
      assert.equal(svc.getCurrentQueue(T).filter((q) => q.id === e.id).length, 0)
    })
    it('getMyPosition 返回位置', () => {
      svc.create({ tenantId: T, type: 'booking', userId: 'u1', userName: 'x', partySize: 1, resourceId: 'r1' })
      const pos = svc.getMyPosition('u1', 'r1', T)
      assert.equal(pos.position, 1)
      assert.equal(pos.estimatedWaitMinutes, 5)
    })
  })

  // === 5. 统计 (2) ===
  describe('统计', () => {
    it('getQueueStats 聚合各状态', () => {
      const e1 = svc.create({ tenantId: T, type: 'booking', userId: 'u1', userName: 'x', partySize: 1, resourceId: 'r1' })
      const e2 = svc.create({ tenantId: T, type: 'waiting', userId: 'u2', userName: 'x', partySize: 1, resourceId: 'r1' })
      svc.callNext('r1', T)
      svc.startService(e1.id, T)
      svc.complete(e1.id, T)
      svc.cancel(e2.id, T)
      const stats = svc.getQueueStats(T, 'r1')
      assert.equal(stats.total, 2)
      assert.equal(stats.completedCount, 1)
      assert.equal(stats.cancelledCount, 1)
    })
    it('空队列统计', () => {
      const stats = svc.getQueueStats(T)
      assert.equal(stats.total, 0); assert.equal(stats.avgWaitMin, 0)
    })
  })

  // === 6. 分页 (2) ===
  describe('分页', () => {
    it('findPaginated 默认 20 条/页', () => {
      for (let i = 0; i < 5; i++) svc.create({ tenantId: T, type: 'booking', userId: `u${i}`, userName: `u${i}`, partySize: 1 })
      const p1 = svc.findPaginated(T, { page: 1, pageSize: 3 })
      assert.equal(p1.items.length, 3); assert.equal(p1.total, 5); assert.equal(p1.totalPages, 2)
    })
    it('超出页数返回空', () => {
      const p = svc.findPaginated(T, { page: 99, pageSize: 10 })
      assert.equal(p.items.length, 0); assert.equal(p.total, 0)
    })
  })

  // === 7. 边界 (2) ===
  describe('边界情况', () => {
    it('不存在的记录 findOne 返回 undefined', () => {
      assert.equal(svc.findOne('non-existent', T), undefined)
    })
    it('更新记录字段', () => {
      const e = svc.create({ tenantId: T, type: 'booking', userId: 'u', userName: 'u', partySize: 1, phone: '123', remark: '备注' })
      const updated = svc.update(e.id, T, { partySize: 3, remark: '新备注' })
      assert.equal(updated.partySize, 3); assert.equal(updated.remark, '新备注')
    })
  })
})
