import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import {
  ReservationType,
  ReservationStatus,
  RESERVATION_STATUS_TRANSITIONS,
  ReservationEntity
} from './reservation.entity'

describe('reservation.entity enums', () => {
  it('ReservationType 包含 Venue / Equipment / Service / Class', () => {
    assert.equal(ReservationType.Venue, 'venue')
    assert.equal(ReservationType.Equipment, 'equipment')
    assert.equal(ReservationType.Service, 'service')
    assert.equal(ReservationType.Class, 'class')
  })

  it('ReservationStatus 包含 5 种状态', () => {
    assert.equal(ReservationStatus.Pending, 'pending')
    assert.equal(ReservationStatus.Confirmed, 'confirmed')
    assert.equal(ReservationStatus.InProgress, 'in_progress')
    assert.equal(ReservationStatus.Completed, 'completed')
    assert.equal(ReservationStatus.Cancelled, 'cancelled')
  })
})

describe('reservation.entity RESERVATION_STATUS_TRANSITIONS', () => {
  it('Pending → Confirmed / Cancelled', () => {
    assert.deepEqual(RESERVATION_STATUS_TRANSITIONS[ReservationStatus.Pending], [
      ReservationStatus.Confirmed,
      ReservationStatus.Cancelled
    ])
  })

  it('Confirmed → InProgress / Cancelled', () => {
    assert.deepEqual(RESERVATION_STATUS_TRANSITIONS[ReservationStatus.Confirmed], [
      ReservationStatus.InProgress,
      ReservationStatus.Cancelled
    ])
  })

  it('InProgress → Completed / Cancelled', () => {
    assert.deepEqual(RESERVATION_STATUS_TRANSITIONS[ReservationStatus.InProgress], [
      ReservationStatus.Completed,
      ReservationStatus.Cancelled
    ])
  })

  it('Completed — 不可再转换', () => {
    assert.deepEqual(RESERVATION_STATUS_TRANSITIONS[ReservationStatus.Completed], [])
  })

  it('Cancelled — 不可再转换', () => {
    assert.deepEqual(RESERVATION_STATUS_TRANSITIONS[ReservationStatus.Cancelled], [])
  })

  it('Completed 和 Cancelled 都不允许任何后续转移', () => {
    assert.equal(RESERVATION_STATUS_TRANSITIONS[ReservationStatus.Completed].length, 0)
    assert.equal(RESERVATION_STATUS_TRANSITIONS[ReservationStatus.Cancelled].length, 0)
  })
})

describe('reservation.entity ReservationEntity class', () => {
  it('ReservationEntity 实例包含所有字段', () => {
    const now = new Date('2026-06-23T12:00:00.000Z')
    const later = new Date('2026-06-23T14:00:00.000Z')
    const entity = Object.assign(new ReservationEntity(), {
      id: 'reservation-test-1',
      tenantId: 'tenant-1',
      type: ReservationType.Venue,
      resourceId: 'table-1',
      resourceName: '台球桌 1 号',
      userId: 'user-1',
      userName: '张三',
      status: ReservationStatus.Confirmed,
      startTime: now,
      endTime: later,
      duration: 120,
      price: 60,
      deposit: 30,
      remark: '靠窗',
      createdAt: now,
      updatedAt: now
    })

    assert.equal(entity.id, 'reservation-test-1')
    assert.equal(entity.tenantId, 'tenant-1')
    assert.equal(entity.type, ReservationType.Venue)
    assert.equal(entity.resourceId, 'table-1')
    assert.equal(entity.resourceName, '台球桌 1 号')
    assert.equal(entity.userId, 'user-1')
    assert.equal(entity.userName, '张三')
    assert.equal(entity.status, ReservationStatus.Confirmed)
    assert.equal(entity.startTime, now)
    assert.equal(entity.endTime, later)
    assert.equal(entity.duration, 120)
    assert.equal(entity.price, 60)
    assert.equal(entity.deposit, 30)
    assert.equal(entity.remark, '靠窗')
  })

  it('ReservationEntity 可选字段可为 undefined', () => {
    const entity = Object.assign(new ReservationEntity(), {
      id: 'reservation-test-2',
      tenantId: 'tenant-1',
      type: ReservationType.Equipment,
      resourceId: 'glove-1',
      resourceName: '手套',
      userId: 'user-2',
      userName: '李四',
      status: ReservationStatus.Pending,
      startTime: new Date(),
      endTime: new Date(),
      duration: 60,
      price: 20,
      deposit: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    assert.equal(entity.remark, undefined)
    assert.equal(entity.cancelledAt, undefined)
    assert.equal(entity.cancelledReason, undefined)
  })
})
