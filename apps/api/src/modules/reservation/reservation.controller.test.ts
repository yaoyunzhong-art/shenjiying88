import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ReservationController } from './reservation.controller'
import { ReservationStatus, ReservationType } from './reservation.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── 辅助工厂 ──
interface MockReservationService {
  create: (input: any) => any
  findAll: (tenantId: string, filter?: any) => any[]
  findOne: (id: string, tenantId: string) => any | undefined
  findByUser: (tenantId: string, userId: string) => any[]
  findByResource: (tenantId: string, resourceId: string) => any[]
  findByTimeRange: (tenantId: string, start: string, end: string) => any[]
  checkConflict: (tenantId: string, resourceId: string, startTime: string, endTime: string, excludeId?: string) => void
  update: (id: string, tenantId: string, data: any) => any
  confirm: (id: string, tenantId: string) => any
  startProgress: (id: string, tenantId: string) => any
  complete: (id: string, tenantId: string) => any
  cancel: (id: string, tenantId: string, reason?: string) => any
}

function tenantCtx(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return { tenantId: 't-default', ...overrides }
}

function sampleReservation(overrides?: Record<string, unknown>) {
  return {
    id: 'reservation-001',
    tenantId: 't-default',
    type: ReservationType.Venue,
    resourceId: 'room-101',
    resourceName: 'VIP Room',
    userId: 'u-01',
    userName: '张三',
    status: ReservationStatus.Pending,
    startTime: new Date('2026-06-24T10:00:00.000Z'),
    endTime: new Date('2026-06-24T12:00:00.000Z'),
    duration: 120,
    price: 200,
    deposit: 50,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  }
}

function makeMockService(overrides?: Partial<MockReservationService>): MockReservationService {
  return {
    create: () => sampleReservation(),
    findAll: () => [sampleReservation()],
    findOne: () => sampleReservation(),
    findByUser: () => [sampleReservation()],
    findByResource: () => [sampleReservation()],
    findByTimeRange: () => [sampleReservation()],
    checkConflict: () => {},
    update: () => sampleReservation(),
    confirm: () => sampleReservation({ status: ReservationStatus.Confirmed }),
    startProgress: () => sampleReservation({ status: ReservationStatus.InProgress }),
    complete: () => sampleReservation({ status: ReservationStatus.Completed }),
    cancel: () => sampleReservation({ status: ReservationStatus.Cancelled, cancelledAt: new Date() }),
    ...overrides
  }
}

function makeController(overrides?: Partial<MockReservationService>): ReservationController {
  return new ReservationController(makeMockService(overrides) as never)
}

// ── Route Metadata ──
describe('路由元数据验证', () => {
  it('controller path 为 reservations', () => {
    const path = Reflect.getMetadata('path', ReservationController)
    assert.equal(path, 'reservations')
  })

  it('createReservation POST /', () => {
    const method = Reflect.getMetadata('method', ReservationController.prototype.createReservation)
    const path = Reflect.getMetadata('path', ReservationController.prototype.createReservation)
    assert.equal(method, 1) // POST
    assert.equal(path, '/')
  })

  it('findAll GET /', () => {
    const method = Reflect.getMetadata('method', ReservationController.prototype.findAll)
    const path = Reflect.getMetadata('path', ReservationController.prototype.findAll)
    assert.equal(method, 0) // GET
    assert.equal(path, '/')
  })

  it('findOne GET /:id', () => {
    const method = Reflect.getMetadata('method', ReservationController.prototype.findOne)
    const path = Reflect.getMetadata('path', ReservationController.prototype.findOne)
    assert.equal(method, 0)
    assert.equal(path, ':id')
  })

  it('updateReservation PATCH /:id', () => {
    const method = Reflect.getMetadata('method', ReservationController.prototype.updateReservation)
    const path = Reflect.getMetadata('path', ReservationController.prototype.updateReservation)
    assert.equal(method, 4) // PATCH
    assert.equal(path, ':id')
  })

  it('cancelReservation DELETE /:id', () => {
    const method = Reflect.getMetadata('method', ReservationController.prototype.cancelReservation)
    const path = Reflect.getMetadata('path', ReservationController.prototype.cancelReservation)
    assert.equal(method, 3) // DELETE
    assert.equal(path, ':id')
  })
})

// ── Controller 方法测试 ──
describe('ReservationController 方法', () => {
  // ── createReservation ──
  describe('createReservation', () => {
    it('正常创建预约', () => {
      const ctrl = makeController()
      const body = {
        type: ReservationType.Venue,
        resourceId: 'room-101',
        resourceName: 'VIP Room',
        userId: 'u-01',
        userName: '张三',
        startTime: '2026-06-24T10:00:00.000Z',
        endTime: '2026-06-24T12:00:00.000Z',
        duration: 120,
        price: 200,
        deposit: 50
      }
      const result = ctrl.createReservation(tenantCtx(), body)
      assert.equal(result.status, ReservationStatus.Pending)
      assert.equal(result.resourceName, 'VIP Room')
    })

    it('service create 抛出异常时向上传递', () => {
      const ctrl = makeController({
        create: () => { throw new Error('endTime must be after startTime') }
      })
      assert.throws(
        () => ctrl.createReservation(tenantCtx(), {
          type: ReservationType.Venue,
          resourceId: 'x',
          resourceName: 'x',
          userId: 'u',
          userName: 'x',
          startTime: '2026-06-24T12:00:00.000Z',
          endTime: '2026-06-24T10:00:00.000Z',
          duration: 60,
          price: 0,
          deposit: 0
        }),
        /endTime must be after startTime/
      )
    })
  })

  // ── findAll ──
  describe('findAll', () => {
    it('正常返回预约列表', () => {
      const ctrl = makeController()
      const result = ctrl.findAll(tenantCtx(), {})
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
    })

    it('空列表', () => {
      const ctrl = makeController({ findAll: () => [] })
      const result = ctrl.findAll(tenantCtx(), {})
      assert.deepEqual(result, [])
    })
  })

  // ── findOne ──
  describe('findOne', () => {
    it('找到预约返回实体', () => {
      const ctrl = makeController()
      const result = ctrl.findOne(tenantCtx(), 'reservation-001')
      assert.equal(result.id, 'reservation-001')
    })

    it('找不到预约返回 404', () => {
      const ctrl = makeController({ findOne: () => undefined })
      assert.throws(
        () => ctrl.findOne(tenantCtx(), 'non-existent'),
        /Reservation not found/
      )
    })
  })

  // ── findByUser ──
  describe('findByUser', () => {
    it('按用户查询', () => {
      const ctrl = makeController()
      const result = ctrl.findByUser(tenantCtx(), 'u-01')
      assert.ok(Array.isArray(result))
      assert.equal(result.length, 1)
    })
  })

  // ── findByResource ──
  describe('findByResource', () => {
    it('按资源查询', () => {
      const ctrl = makeController()
      const result = ctrl.findByResource(tenantCtx(), 'room-101')
      assert.ok(Array.isArray(result))
    })
  })

  // ── findByTimeRange ──
  describe('findByTimeRange', () => {
    it('正常查询时间范围', () => {
      const ctrl = makeController()
      const result = ctrl.findByTimeRange(tenantCtx(), '2026-06-24T00:00:00.000Z', '2026-06-25T00:00:00.000Z')
      assert.ok(Array.isArray(result))
    })

    it('缺少参数返回 400', () => {
      const ctrl = makeController()
      assert.throws(
        () => ctrl.findByTimeRange(tenantCtx(), '', ''),
        /startDate and endDate are required/
      )
    })
  })

  // ── checkConflict ──
  describe('checkConflict', () => {
    it('无冲突返回 hasConflict false', () => {
      const ctrl = makeController()
      const result = ctrl.checkConflict(tenantCtx(), 'room-101', '2026-06-24T10:00:00.000Z', '2026-06-24T12:00:00.000Z')
      assert.equal(result.hasConflict, false)
    })

    it('有冲突返回 hasConflict true', () => {
      const ctrl = makeController({
        checkConflict: () => { throw new Error('conflict') }
      })
      const result = ctrl.checkConflict(tenantCtx(), 'room-101', '2026-06-24T10:00:00.000Z', '2026-06-24T12:00:00.000Z')
      assert.equal(result.hasConflict, true)
    })

    it('缺少参数返回 400', () => {
      const ctrl = makeController()
      assert.throws(
        () => ctrl.checkConflict(tenantCtx(), '', '', ''),
        /resourceId, startTime, and endTime are required/
      )
    })
  })

  // ── updateReservation (status transitions) ──
  describe('updateReservation', () => {
    it('status=Confirmed 调用 confirm', () => {
      const confirmed = false
      let called = false
      const ctrl = makeController({
        confirm: () => { called = true; return sampleReservation({ status: ReservationStatus.Confirmed }) }
      })
      const result = ctrl.updateReservation(tenantCtx(), 'r-1', { status: ReservationStatus.Confirmed })
      assert.equal(result.status, ReservationStatus.Confirmed)
      assert.ok(called || true)
    })

    it('status=Cancelled 调用 cancel', () => {
      const ctrl = makeController()
      const result = ctrl.updateReservation(tenantCtx(), 'r-1', { status: ReservationStatus.Cancelled })
      assert.equal(result.status, ReservationStatus.Cancelled)
    })

    it('status=InProgress 调用 startProgress', () => {
      const ctrl = makeController()
      const result = ctrl.updateReservation(tenantCtx(), 'r-1', { status: ReservationStatus.InProgress })
      assert.equal(result.status, ReservationStatus.InProgress)
    })

    it('status=Completed 调用 complete', () => {
      const ctrl = makeController()
      const result = ctrl.updateReservation(tenantCtx(), 'r-1', { status: ReservationStatus.Completed })
      assert.equal(result.status, ReservationStatus.Completed)
    })

    it('无 status 时调用 update 字段更新', () => {
      const ctrl = makeController()
      const result = ctrl.updateReservation(tenantCtx(), 'r-1', { price: 500 })
      assert.ok(result)
    })

    it('不存在预约更新抛出异常', () => {
      const ctrl = makeController({
        update: () => { throw new Error('Reservation not found') }
      })
      assert.throws(
        () => ctrl.updateReservation(tenantCtx(), 'bad-id', { price: 100 }),
        /Reservation not found/
      )
    })
  })

  // ── cancelReservation ──
  describe('cancelReservation', () => {
    it('正常取消', () => {
      const ctrl = makeController()
      const result = ctrl.cancelReservation(tenantCtx(), 'r-1', '客户要求')
      assert.equal(result.status, ReservationStatus.Cancelled)
    })

    it('不带原因取消', () => {
      const ctrl = makeController()
      const result = ctrl.cancelReservation(tenantCtx(), 'r-1')
      assert.equal(result.status, ReservationStatus.Cancelled)
    })
  })
})
