import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe, beforeEach } from 'node:test'
import { ReservationService } from './reservation.service'
import { ReservationStatus, ReservationType } from './reservation.entity'

// ── Setup ──
function makeService(): ReservationService {
  const svc = new ReservationService()
  svc.resetStoreForTests()
  return svc
}

function makeInput(overrides?: Partial<{
  tenantId: string
  type: ReservationType
  resourceId: string
  resourceName: string
  userId: string
  userName: string
  startTime: string
  endTime: string
  duration: number
  price: number
  deposit: number
  remark: string
}>) {
  return {
    tenantId: 't-01',
    type: ReservationType.Venue,
    resourceId: 'res-room-101',
    resourceName: 'VIP Room',
    userId: 'u-01',
    userName: '张三',
    startTime: '2026-06-24T10:00:00.000Z',
    endTime: '2026-06-24T12:00:00.000Z',
    duration: 120,
    price: 200,
    deposit: 50,
    ...overrides
  }
}

describe('ReservationService', () => {
  let svc: ReservationService

  beforeEach(() => {
    svc = makeService()
  })

  // ── CREATE ──
  describe('create', () => {
    test('创建预约，状态为 Pending', () => {
      const r = svc.create(makeInput())
      assert.equal(r.status, ReservationStatus.Pending)
      assert.ok(r.id.startsWith('reservation-'))
      assert.equal(r.resourceName, 'VIP Room')
      assert.equal(r.price, 200)
    })

    test('创建预约 endTime <= startTime 时抛出异常', () => {
      assert.throws(
        () => svc.create(makeInput({
          startTime: '2026-06-24T12:00:00.000Z',
          endTime: '2026-06-24T10:00:00.000Z'
        })),
        /endTime must be after startTime/
      )
    })

    test('多个租户创建不同预约不冲突', () => {
      const r1 = svc.create(makeInput({ tenantId: 't-01', resourceId: 'room-1' }))
      const r2 = svc.create(makeInput({ tenantId: 't-02', resourceId: 'room-1' }))
      assert.notEqual(r1.id, r2.id)
      assert.equal(svc.findAll('t-01').length, 1)
      assert.equal(svc.findAll('t-02').length, 1)
    })
  })

  // ── FIND ──
  describe('findAll', () => {
    test('按 type 过滤', () => {
      svc.create(makeInput({ type: ReservationType.Venue, resourceId: 'room-1' }))
      svc.create(makeInput({ type: ReservationType.Equipment, resourceId: 'gear-1' }))
      const venues = svc.findAll('t-01', { type: ReservationType.Venue })
      assert.equal(venues.length, 1)
      assert.equal(venues[0].type, ReservationType.Venue)
    })

    test('按 status 过滤', () => {
      const r = svc.create(makeInput())
      svc.confirm(r.id, 't-01')
      const confirmed = svc.findAll('t-01', { status: ReservationStatus.Confirmed })
      assert.equal(confirmed.length, 1)
    })

    test('按 userId 过滤', () => {
      svc.create(makeInput({ userId: 'u-alice', resourceId: 'room-1' }))
      svc.create(makeInput({ userId: 'u-bob', resourceId: 'room-2' }))
      const alice = svc.findAll('t-01', { userId: 'u-alice' })
      assert.equal(alice.length, 1)
    })

    test('按时间范围过滤', () => {
      svc.create(makeInput({
        startTime: '2026-06-24T09:00:00.000Z',
        endTime: '2026-06-24T10:00:00.000Z',
        resourceId: 'room-a'
      }))
      svc.create(makeInput({
        startTime: '2026-06-25T09:00:00.000Z',
        endTime: '2026-06-25T10:00:00.000Z',
        resourceId: 'room-b'
      }))
      const inRange = svc.findAll('t-01', {
        startDate: '2026-06-24T00:00:00.000Z',
        endDate: '2026-06-24T23:59:59.000Z'
      })
      assert.equal(inRange.length, 1)
    })

    test('空结果返回空数组', () => {
      assert.deepEqual(svc.findAll('t-01'), [])
      assert.deepEqual(svc.findAll('nonexistent-tenant'), [])
    })
  })

  describe('findOne', () => {
    test('按 id 和 tenantId 找到', () => {
      const r = svc.create(makeInput())
      const found = svc.findOne(r.id, 't-01')
      assert.ok(found)
      assert.equal(found!.id, r.id)
    })

    test('不同租户找不到', () => {
      const r = svc.create(makeInput({ tenantId: 't-01' }))
      const found = svc.findOne(r.id, 't-02')
      assert.equal(found, undefined)
    })

    test('不存在的 id 返回 undefined', () => {
      assert.equal(svc.findOne('non-existent', 't-01'), undefined)
    })
  })

  // ── QUERY HELPERS ──
  describe('findByTimeRange', () => {
    test('按时间范围查询', () => {
      svc.create(makeInput({
        startTime: '2026-06-24T10:00:00.000Z',
        endTime: '2026-06-24T12:00:00.000Z',
        resourceId: 'room-1'
      }))
      svc.create(makeInput({
        startTime: '2026-06-25T10:00:00.000Z',
        endTime: '2026-06-25T12:00:00.000Z',
        resourceId: 'room-2'
      }))
      const results = svc.findByTimeRange('t-01', '2026-06-24T00:00:00.000Z', '2026-06-24T23:59:59.000Z')
      assert.equal(results.length, 1)
      assert.equal(results[0].resourceId, 'room-1')
    })
  })

  describe('findByUser', () => {
    test('按用户查询', () => {
      svc.create(makeInput({ userId: 'u-alice', resourceId: 'room-a' }))
      svc.create(makeInput({ userId: 'u-alice', resourceId: 'room-b' }))
      svc.create(makeInput({ userId: 'u-bob', resourceId: 'room-c' }))
      const alice = svc.findByUser('t-01', 'u-alice')
      assert.equal(alice.length, 2)
    })
  })

  describe('findByResource', () => {
    test('按资源查询', () => {
      svc.create(makeInput({ resourceId: 'room-vip' }))
      svc.create(makeInput({ resourceId: 'room-standard' }))
      const vip = svc.findByResource('t-01', 'room-vip')
      assert.equal(vip.length, 1)
    })
  })

  // ── STATUS TRANSITIONS ──
  describe('状态流转', () => {
    test('Pending → Confirmed → InProgress → Completed', () => {
      const r = svc.create(makeInput())
      const confirmed = svc.confirm(r.id, 't-01')
      assert.equal(confirmed.status, ReservationStatus.Confirmed)
      const inProgress = svc.startProgress(r.id, 't-01')
      assert.equal(inProgress.status, ReservationStatus.InProgress)
      const completed = svc.complete(r.id, 't-01')
      assert.equal(completed.status, ReservationStatus.Completed)
    })

    test('Pending → Cancelled', () => {
      const r = svc.create(makeInput())
      const cancelled = svc.cancel(r.id, 't-01', '客户取消')
      assert.equal(cancelled.status, ReservationStatus.Cancelled)
      assert.equal(cancelled.cancelledReason, '客户取消')
      assert.ok(cancelled.cancelledAt instanceof Date)
    })

    test('Confirmed → Cancelled', () => {
      const r = svc.create(makeInput())
      svc.confirm(r.id, 't-01')
      const cancelled = svc.cancel(r.id, 't-01')
      assert.equal(cancelled.status, ReservationStatus.Cancelled)
    })

    test('非法状态转换抛出异常', () => {
      const r = svc.create(makeInput())
      // Pending → Completed 不允许
      assert.throws(
        () => svc.complete(r.id, 't-01'),
        /Invalid reservation status transition/
      )
    })

    test('已完成状态不可再转换', () => {
      const r = svc.create(makeInput())
      svc.confirm(r.id, 't-01')
      svc.startProgress(r.id, 't-01')
      svc.complete(r.id, 't-01')
      assert.throws(
        () => svc.startProgress(r.id, 't-01'),
        /Invalid reservation status transition/
      )
    })
  })

  // ── UPDATE ──
  describe('update', () => {
    test('更新预约字段', () => {
      const r = svc.create(makeInput())
      const updated = svc.update(r.id, 't-01', { price: 300, remark: '更新备注' })
      assert.equal(updated.price, 300)
      assert.equal(updated.remark, '更新备注')
      assert.equal(updated.resourceName, 'VIP Room') // 未改
    })

    test('不存在或不同租户更新抛出异常', () => {
      const r = svc.create(makeInput({ tenantId: 't-01' }))
      assert.throws(() => svc.update(r.id, 't-02', { price: 100 }), /not found/)
      assert.throws(() => svc.update('fake-id', 't-01', { price: 100 }), /not found/)
    })
  })

  // ── CONFLICT DETECTION ──
  describe('冲突检测', () => {
    test('同资源同时间确认时检测冲突', () => {
      const r1 = svc.create(makeInput({ resourceId: 'room-101' }))
      svc.confirm(r1.id, 't-01')
      const r2 = svc.create(makeInput({ resourceId: 'room-101' }))
      assert.throws(
        () => svc.confirm(r2.id, 't-01'),
        /already booked/
      )
    })

    test('不同资源同时段无冲突', () => {
      const r1 = svc.create(makeInput({ resourceId: 'room-101' }))
      svc.confirm(r1.id, 't-01')
      const r2 = svc.create(makeInput({ resourceId: 'room-202' }))
      assert.doesNotThrow(() => svc.confirm(r2.id, 't-01'))
    })

    test('时间不重叠无冲突', () => {
      const r1 = svc.create(makeInput({
        resourceId: 'room-101',
        startTime: '2026-06-24T10:00:00.000Z',
        endTime: '2026-06-24T12:00:00.000Z'
      }))
      svc.confirm(r1.id, 't-01')
      const r2 = svc.create(makeInput({
        resourceId: 'room-101',
        startTime: '2026-06-24T12:00:00.000Z',
        endTime: '2026-06-24T14:00:00.000Z'
      }))
      assert.doesNotThrow(() => svc.confirm(r2.id, 't-01'))
    })

    test('未确认的预约不参与冲突检测', () => {
      svc.create(makeInput({ resourceId: 'room-101' }))
      const r2 = svc.create(makeInput({ resourceId: 'room-101' }))
      // Both are pending, no conflict on confirm of r2
      assert.doesNotThrow(() => svc.confirm(r2.id, 't-01'))
    })
  })

  // ── CANCEL ──
  describe('cancel', () => {
    test('取消预约记录取消时间和原因', () => {
      const r = svc.create(makeInput())
      const cancelled = svc.cancel(r.id, 't-01', '突发事件')
      assert.equal(cancelled.status, ReservationStatus.Cancelled)
      assert.equal(cancelled.cancelledReason, '突发事件')
      assert.ok(cancelled.cancelledAt)
    })

    test('已取消的预约不可再次取消', () => {
      const r = svc.create(makeInput())
      svc.cancel(r.id, 't-01')
      assert.throws(() => svc.cancel(r.id, 't-01'), /Invalid reservation status transition/)
    })
  })
})
