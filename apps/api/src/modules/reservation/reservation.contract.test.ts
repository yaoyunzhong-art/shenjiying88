/**
 * 🐜 自动: [reservation] [A] contract.test.ts 补全
 *
 * 覆盖:
 *   ReservationContract / ReservationStatsContract 接口形状
 *   toReservationContract / toReservationStatsContract 转换函数
 *   包含正常流程 + 边界条件
 */

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { ReservationType, ReservationStatus, ReservationEntity } from './reservation.entity'
import { toReservationContract, toReservationStatsContract } from './reservation.contract'

// ── 辅助工厂 ──

function makeReservation(overrides?: Partial<ReservationEntity>): ReservationEntity {
  const entity = new ReservationEntity()
  entity.id = 'res-001'
  entity.tenantId = 'tenant-001'
  entity.type = ReservationType.Venue
  entity.resourceId = 'venue-001'
  entity.resourceName = 'A号包间'
  entity.userId = 'user-001'
  entity.userName = '张三'
  entity.status = ReservationStatus.Confirmed
  entity.startTime = new Date('2026-06-24T10:00:00.000Z')
  entity.endTime = new Date('2026-06-24T12:00:00.000Z')
  entity.duration = 120
  entity.price = 200
  entity.deposit = 50
  entity.remark = '生日聚会'
  entity.createdAt = new Date('2026-06-23T08:00:00.000Z')
  entity.updatedAt = new Date('2026-06-23T08:05:00.000Z')
  return Object.assign(entity, overrides)
}

// ──────────── toReservationContract ────────────

describe('toReservationContract', () => {
  test('完整预约转换：日期转 ISO 字符串', () => {
    const entity = makeReservation()
    const contract = toReservationContract(entity)

    assert.equal(contract.id, 'res-001')
    assert.equal(contract.tenantId, 'tenant-001')
    assert.equal(contract.type, ReservationType.Venue)
    assert.equal(contract.resourceId, 'venue-001')
    assert.equal(contract.resourceName, 'A号包间')
    assert.equal(contract.userId, 'user-001')
    assert.equal(contract.userName, '张三')
    assert.equal(contract.status, ReservationStatus.Confirmed)
    assert.equal(contract.startTime, '2026-06-24T10:00:00.000Z')
    assert.equal(contract.endTime, '2026-06-24T12:00:00.000Z')
    assert.equal(contract.duration, 120)
    assert.equal(contract.price, 200)
    assert.equal(contract.deposit, 50)
    assert.equal(contract.remark, '生日聚会')
    assert.equal(contract.createdAt, '2026-06-23T08:00:00.000Z')
    assert.equal(contract.updatedAt, '2026-06-23T08:05:00.000Z')
  })

  test('已取消预约转换', () => {
    const entity = makeReservation({
      id: 'res-002',
      status: ReservationStatus.Cancelled
    })
    const contract = toReservationContract(entity)

    assert.equal(contract.status, ReservationStatus.Cancelled)
  })

  test('进行中预约转换', () => {
    const entity = makeReservation({
      id: 'res-003',
      status: ReservationStatus.InProgress
    })
    const contract = toReservationContract(entity)

    assert.equal(contract.status, ReservationStatus.InProgress)
  })

  test('remark 为可选', () => {
    const entity = makeReservation({ remark: undefined })
    const contract = toReservationContract(entity)

    assert.equal(contract.remark, undefined)
  })

  test('设备预约类型', () => {
    const entity = makeReservation({
      type: ReservationType.Equipment,
      resourceId: 'eq-001',
      resourceName: 'PS5 游戏机',
      duration: 60,
      price: 30,
      deposit: 10
    })
    const contract = toReservationContract(entity)

    assert.equal(contract.type, ReservationType.Equipment)
    assert.equal(contract.resourceName, 'PS5 游戏机')
  })

  test('服务预约类型', () => {
    const entity = makeReservation({
      type: ReservationType.Service,
      resourceId: 'svc-001',
      resourceName: '教练指导',
      duration: 45
    })
    const contract = toReservationContract(entity)

    assert.equal(contract.type, ReservationType.Service)
    assert.equal(contract.duration, 45)
  })

  test('课程预约类型', () => {
    const entity = makeReservation({
      type: ReservationType.Class,
      resourceId: 'cls-001',
      resourceName: '街舞入门课'
    })
    const contract = toReservationContract(entity)

    assert.equal(contract.type, ReservationType.Class)
    assert.equal(contract.resourceName, '街舞入门课')
  })

  test('三小时长预约', () => {
    const entity = makeReservation({
      duration: 180,
      price: 500,
      deposit: 100
    })
    const contract = toReservationContract(entity)

    assert.equal(contract.duration, 180)
    assert.equal(contract.price, 500)
    assert.equal(contract.deposit, 100)
  })

  test('零押金预约', () => {
    const entity = makeReservation({ deposit: 0 })
    const contract = toReservationContract(entity)

    assert.equal(contract.deposit, 0)
  })

  test('所有预约状态类型均可转换', () => {
    const statuses = Object.values(ReservationStatus)
    for (const s of statuses) {
      const entity = makeReservation({ status: s as ReservationStatus })
      const contract = toReservationContract(entity)
      assert.equal(contract.status, s)
    }
  })
})

// ──────────── toReservationStatsContract ────────────

describe('toReservationStatsContract', () => {
  test('空列表统计', () => {
    const stats = toReservationStatsContract([])
    assert.equal(stats.total, 0)
    assert.equal(stats.pendingCount, 0)
    assert.equal(stats.confirmedCount, 0)
    assert.equal(stats.inProgressCount, 0)
    assert.equal(stats.completedCount, 0)
    assert.equal(stats.cancelledCount, 0)
  })

  test('多种状态混排统计', () => {
    const reservations = [
      makeReservation({ id: 'r1', status: ReservationStatus.Confirmed }),
      makeReservation({ id: 'r2', status: ReservationStatus.InProgress }),
      makeReservation({ id: 'r3', status: ReservationStatus.Completed }),
      makeReservation({ id: 'r4', status: ReservationStatus.Cancelled }),
      makeReservation({ id: 'r5', status: ReservationStatus.Pending }),
      makeReservation({ id: 'r6', status: ReservationStatus.Confirmed })
    ]
    const stats = toReservationStatsContract(reservations)

    assert.equal(stats.total, 6)
    assert.equal(stats.pendingCount, 1)
    assert.equal(stats.confirmedCount, 2)
    assert.equal(stats.inProgressCount, 1)
    assert.equal(stats.completedCount, 1)
    assert.equal(stats.cancelledCount, 1)
  })

  test('全已完成统计', () => {
    const reservations = [
      makeReservation({ id: 'r1', status: ReservationStatus.Completed }),
      makeReservation({ id: 'r2', status: ReservationStatus.Completed })
    ]
    const stats = toReservationStatsContract(reservations)

    assert.equal(stats.total, 2)
    assert.equal(stats.completedCount, 2)
    assert.equal(stats.pendingCount, 0)
    assert.equal(stats.inProgressCount, 0)
  })

  test('已取消预约不影响其他统计', () => {
    const reservations = [
      makeReservation({ id: 'r1', status: ReservationStatus.Cancelled }),
      makeReservation({ id: 'r2', status: ReservationStatus.Cancelled }),
      makeReservation({ id: 'r3', status: ReservationStatus.Confirmed })
    ]
    const stats = toReservationStatsContract(reservations)

    assert.equal(stats.total, 3)
    assert.equal(stats.cancelledCount, 2)
    assert.equal(stats.confirmedCount, 1)
    assert.equal(stats.inProgressCount, 0)
  })
})
