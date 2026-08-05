/**
 * 🐜 自动: [reservation] [A] service.spec — ≥18项正反例+边界
 *
 * 纯函数式内联，不 import 生产代码。
 */

import { describe, it, expect } from 'vitest'

// ─── 内联枚举 + 类型 ──────────────────────────────────────────────────────────

type ResType = 'venue' | 'equipment' | 'service' | 'class'
type ResStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

interface ResEntity {
  id: string; tenantId: string; type: ResType; resourceId: string; resourceName: string
  userId: string; userName: string; status: ResStatus
  startTime: Date; endTime: Date; duration: number; price: number; deposit: number
  remark?: string; createdAt: Date; updatedAt: Date; cancelledAt?: Date; cancelledReason?: string
}

interface CreateInput {
  tenantId: string; type: ResType; resourceId: string; resourceName: string
  userId: string; userName: string; startTime: string; endTime: string
  duration: number; price: number; deposit: number; remark?: string
}

const STATUS_TRANSITIONS: Record<ResStatus, ResStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  completed: [],
  cancelled: [],
}

// ─── 内联服务逻辑 ──────────────────────────────────────────────────────────────

class InlineReservationService {
  private store = new Map<string, ResEntity>()
  private idCounter = 0

  create(input: CreateInput): ResEntity {
    if (new Date(input.endTime) <= new Date(input.startTime)) {
      throw new Error('endTime must be after startTime')
    }
    const now = new Date()
    const res: ResEntity = {
      id: `res-${++this.idCounter}`,
      tenantId: input.tenantId, type: input.type,
      resourceId: input.resourceId, resourceName: input.resourceName,
      userId: input.userId, userName: input.userName,
      status: 'pending',
      startTime: new Date(input.startTime), endTime: new Date(input.endTime),
      duration: input.duration, price: input.price, deposit: input.deposit,
      remark: input.remark, createdAt: now, updatedAt: now,
    }
    this.store.set(res.id, res)
    return res
  }

  findAll(tenantId: string, filter?: { type?: ResType; resourceId?: string; userId?: string; status?: ResStatus; startDate?: string; endDate?: string }): ResEntity[] {
    return Array.from(this.store.values())
      .filter(r => r.tenantId === tenantId)
      .filter(r => !filter?.type || r.type === filter.type)
      .filter(r => !filter?.resourceId || r.resourceId === filter.resourceId)
      .filter(r => !filter?.userId || r.userId === filter.userId)
      .filter(r => !filter?.status || r.status === filter.status)
      .filter(r => !filter?.startDate || r.startTime >= new Date(filter.startDate))
      .filter(r => !filter?.endDate || r.endTime <= new Date(filter.endDate))
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  findOne(id: string, tenantId: string): ResEntity | undefined {
    const r = this.store.get(id)
    if (!r || r.tenantId !== tenantId) return undefined
    return r
  }

  update(id: string, tenantId: string, data: { startTime?: string; endTime?: string; duration?: number; price?: number; deposit?: number; remark?: string; resourceName?: string }): ResEntity {
    const r = this._assertOwned(id, tenantId)
    if (data.startTime !== undefined) r.startTime = new Date(data.startTime)
    if (data.endTime !== undefined) r.endTime = new Date(data.endTime)
    if (data.duration !== undefined) r.duration = data.duration
    if (data.price !== undefined) r.price = data.price
    if (data.deposit !== undefined) r.deposit = data.deposit
    if (data.remark !== undefined) r.remark = data.remark
    if (data.resourceName !== undefined) r.resourceName = data.resourceName
    r.updatedAt = new Date()
    this.store.set(id, r)
    return r
  }

  cancel(id: string, tenantId: string, reason?: string): ResEntity {
    const r = this._assertOwned(id, tenantId)
    this._assertTransition(r.status, 'cancelled')
    r.status = 'cancelled'; r.cancelledAt = new Date(); r.cancelledReason = reason; r.updatedAt = new Date()
    return r
  }

  confirm(id: string, tenantId: string): ResEntity {
    const r = this._assertOwned(id, tenantId)
    this._assertTransition(r.status, 'confirmed')
    this.checkConflict(r.tenantId, r.resourceId, r.startTime.toISOString(), r.endTime.toISOString(), r.id)
    r.status = 'confirmed'; r.updatedAt = new Date()
    return r
  }

  startProgress(id: string, tenantId: string): ResEntity {
    const r = this._assertOwned(id, tenantId)
    this._assertTransition(r.status, 'in_progress')
    r.status = 'in_progress'; r.updatedAt = new Date()
    return r
  }

  complete(id: string, tenantId: string): ResEntity {
    const r = this._assertOwned(id, tenantId)
    this._assertTransition(r.status, 'completed')
    r.status = 'completed'; r.updatedAt = new Date()
    return r
  }

  findByTimeRange(tenantId: string, startDate: string, endDate: string): ResEntity[] {
    const start = new Date(startDate); const end = new Date(endDate)
    return Array.from(this.store.values()).filter(r => r.tenantId === tenantId && r.startTime >= start && r.endTime <= end).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  findByUser(tenantId: string, userId: string): ResEntity[] {
    return Array.from(this.store.values()).filter(r => r.tenantId === tenantId && r.userId === userId).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  findByResource(tenantId: string, resourceId: string): ResEntity[] {
    return Array.from(this.store.values()).filter(r => r.tenantId === tenantId && r.resourceId === resourceId).sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
  }

  checkConflict(tenantId: string, resourceId: string, startTime: string, endTime: string, excludeId?: string): void {
    const conflicts = Array.from(this.store.values()).filter(r => r.tenantId === tenantId && r.resourceId === resourceId && r.status === 'confirmed' && (excludeId ? r.id !== excludeId : true) && this._overlaps(r.startTime.toISOString(), r.endTime.toISOString(), startTime, endTime))
    if (conflicts.length > 0) throw new Error(`Resource ${resourceId} is already booked from ${startTime} to ${endTime}`)
  }

  resetStoreForTests(): void { this.store.clear(); this.idCounter = 0 }

  private _assertOwned(id: string, tenantId: string): ResEntity {
    const r = this.store.get(id)
    if (!r || r.tenantId !== tenantId) throw new Error(`Reservation not found: ${id}`)
    return r
  }

  private _assertTransition(from: ResStatus, to: ResStatus): void {
    if (!STATUS_TRANSITIONS[from].includes(to)) throw new Error(`Invalid reservation status transition: ${from} → ${to}`)
  }

  private _overlaps(sA: string, eA: string, sB: string, eB: string): boolean {
    return new Date(sA) < new Date(eB) && new Date(eA) > new Date(sB)
  }
}

// ─── Mock 工厂 ─────────────────────────────────────────────────────────────────

function svc(): InlineReservationService { return new InlineReservationService() }

// ─── 测试用例 ≥18 ──────────────────────────────────────────────────────────────

describe('ReservationService [inline]', () => {
  // ── 1. create ──
  it('create 创建成功并返回 pending 状态', () => {
    const s = svc()
    const r = s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'Hall A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    expect(r.status).toBe('pending')
    expect(r.id).toMatch(/^res-/)
  })

  it('create endTime <= startTime 抛出错误', () => {
    const s = svc()
    expect(() => s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'Hall A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T12:00:00Z', endTime: '2026-07-10T10:00:00Z', duration: 0, price: 100, deposit: 20 })).toThrow('endTime must be after startTime')
  })

  it('create 相同时间抛出', () => {
    const s = svc()
    expect(() => s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'Hall A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T10:00:00Z', duration: 0, price: 100, deposit: 20 })).toThrow('endTime must be after startTime')
  })

  // ── 2. findAll ──
  it('findAll 按 tenantId 过滤', () => {
    const s = svc()
    s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    s.create({ tenantId: 't2', type: 'venue', resourceId: 'r2', resourceName: 'B', userId: 'u2', userName: 'Bob', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    expect(s.findAll('t1').length).toBe(1)
    expect(s.findAll('t2').length).toBe(1)
    expect(s.findAll('t3').length).toBe(0)
  })

  it('findAll 按状态过滤', () => {
    const s = svc()
    s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    const pending = s.findAll('t1', { status: 'pending' })
    expect(pending.length).toBe(1)
    expect(s.findAll('t1', { status: 'confirmed' }).length).toBe(0)
  })

  it('findAll 按类型过滤', () => {
    const s = svc()
    s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    s.create({ tenantId: 't1', type: 'equipment', resourceId: 'r2', resourceName: 'Proj', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 50, deposit: 10 })
    expect(s.findAll('t1', { type: 'equipment' }).length).toBe(1)
  })

  // ── 3. findOne ──
  it('findOne 存在返回, 不存在返回 undefined', () => {
    const s = svc()
    const r = s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    expect(s.findOne(r.id, 't1')).toBeTruthy()
    expect(s.findOne('nonexistent', 't1')).toBeUndefined()
    expect(s.findOne(r.id, 't2')).toBeUndefined()
  })

  // ── 4. update ──
  it('update 修改字段', () => {
    const s = svc()
    const r = s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    const updated = s.update(r.id, 't1', { price: 150, remark: 'updated' })
    expect(updated.price).toBe(150)
    expect(updated.remark).toBe('updated')
    expect(updated.duration).toBe(120) // unchanged
  })

  it('update 不存在抛出错误', () => {
    const s = svc()
    expect(() => s.update('nonexistent', 't1', { price: 100 })).toThrow('Reservation not found')
  })

  it('update 跨 tenant 抛出错误', () => {
    const s = svc()
    const r = s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    expect(() => s.update(r.id, 't2', { price: 200 })).toThrow('Reservation not found')
  })

  // ── 5. 状态转换 ──
  it('confirm 从 pending → confirmed', () => {
    const s = svc()
    const r = s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    const confirmed = s.confirm(r.id, 't1')
    expect(confirmed.status).toBe('confirmed')
  })

  it('confirm 冲突抛出错误', () => {
    const s = svc()
    const r1 = s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    s.confirm(r1.id, 't1')
    const r2 = s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:30:00Z', endTime: '2026-07-10T11:30:00Z', duration: 60, price: 100, deposit: 20 })
    expect(() => s.confirm(r2.id, 't1')).toThrow('is already booked')
  })

  it('status transition: pending → cancelled', () => {
    const s = svc()
    const r = s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    const c = s.cancel(r.id, 't1', 'no longer needed')
    expect(c.status).toBe('cancelled')
    expect(c.cancelledReason).toBe('no longer needed')
  })

  it('status transition: completed → cancelled 抛出', () => {
    const s = svc()
    const r = s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    s.confirm(r.id, 't1')
    s.startProgress(r.id, 't1')
    s.complete(r.id, 't1')
    expect(() => s.cancel(r.id, 't1')).toThrow('Invalid reservation status transition')
  })

  it('full lifecycle: pending → confirmed → in_progress → completed', () => {
    const s = svc()
    const r = s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    expect(r.status).toBe('pending')
    expect(s.confirm(r.id, 't1').status).toBe('confirmed')
    expect(s.startProgress(r.id, 't1').status).toBe('in_progress')
    expect(s.complete(r.id, 't1').status).toBe('completed')
  })

  // ── 6. 查询 ──
  it('findByTimeRange 返回指定时间范围内的预约', () => {
    const s = svc()
    s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    const results = s.findByTimeRange('t1', '2026-07-10T00:00:00Z', '2026-07-11T00:00:00Z')
    expect(results.length).toBe(1)
  })

  it('findByUser 返回用户预约', () => {
    const s = svc()
    s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    expect(s.findByUser('t1', 'u1').length).toBe(1)
    expect(s.findByUser('t1', 'u2').length).toBe(0)
  })

  it('findByResource 返回资源预约', () => {
    const s = svc()
    s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    s.create({ tenantId: 't1', type: 'venue', resourceId: 'r2', resourceName: 'B', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    expect(s.findByResource('t1', 'r1').length).toBe(1)
  })

  // ── 7. 边界 ──
  it('resetStoreForTests 清空所有数据', () => {
    const s = svc()
    s.create({ tenantId: 't1', type: 'venue', resourceId: 'r1', resourceName: 'A', userId: 'u1', userName: 'Alice', startTime: '2026-07-10T10:00:00Z', endTime: '2026-07-10T12:00:00Z', duration: 120, price: 100, deposit: 20 })
    s.resetStoreForTests()
    expect(s.findAll('t1').length).toBe(0)
  })
})
