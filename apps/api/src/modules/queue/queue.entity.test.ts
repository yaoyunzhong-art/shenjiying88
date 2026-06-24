/**
 * 🐜 自动: [queue] [A] entity.test 补全
 */

import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  QueueType,
  QueueStatus,
  QUEUE_STATUS_TRANSITIONS,
  QueueEntity
} from './queue.entity'

describe('queue.entity enums', () => {
  test('QueueType 包含 Booking / Waiting / Service', () => {
    assert.equal(QueueType.Booking, 'booking')
    assert.equal(QueueType.Waiting, 'waiting')
    assert.equal(QueueType.Service, 'service')
  })

  test('QueueStatus 包含 6 种状态', () => {
    assert.equal(QueueStatus.Waiting, 'waiting')
    assert.equal(QueueStatus.Called, 'called')
    assert.equal(QueueStatus.Serving, 'serving')
    assert.equal(QueueStatus.Completed, 'completed')
    assert.equal(QueueStatus.Cancelled, 'cancelled')
    assert.equal(QueueStatus.NoShow, 'no_show')
  })
})

describe('queue.entity QUEUE_STATUS_TRANSITIONS', () => {
  test('Waiting → Called / Cancelled', () => {
    assert.deepEqual(QUEUE_STATUS_TRANSITIONS[QueueStatus.Waiting], [
      QueueStatus.Called,
      QueueStatus.Cancelled
    ])
  })

  test('Called → Serving / NoShow / Cancelled', () => {
    assert.deepEqual(QUEUE_STATUS_TRANSITIONS[QueueStatus.Called], [
      QueueStatus.Serving,
      QueueStatus.NoShow,
      QueueStatus.Cancelled
    ])
  })

  test('Serving → Completed / Cancelled', () => {
    assert.deepEqual(QUEUE_STATUS_TRANSITIONS[QueueStatus.Serving], [
      QueueStatus.Completed,
      QueueStatus.Cancelled
    ])
  })

  test('Completed — 不可再转换', () => {
    assert.deepEqual(QUEUE_STATUS_TRANSITIONS[QueueStatus.Completed], [])
  })

  test('Cancelled — 不可再转换', () => {
    assert.deepEqual(QUEUE_STATUS_TRANSITIONS[QueueStatus.Cancelled], [])
  })

  test('NoShow — 不可再转换', () => {
    assert.deepEqual(QUEUE_STATUS_TRANSITIONS[QueueStatus.NoShow], [])
  })
})

describe('queue.entity QueueEntity class', () => {
  test('QueueEntity 实例包含所有字段', () => {
    const now = new Date()
    const entity = Object.assign(new QueueEntity(), {
      id: 'queue-1',
      tenantId: 'tenant-1',
      type: QueueType.Waiting,
      queueNumber: 'A001',
      userId: 'user-1',
      userName: '张三',
      phone: '13800138000',
      partySize: 4,
      resourceId: 'table-1',
      resourceName: '包间 1 号',
      status: QueueStatus.Waiting,
      priority: 0,
      estimatedWaitMin: 15,
      actualWaitMin: undefined,
      remark: '靠近窗户',
      createdAt: now,
      updatedAt: now
    })

    assert.equal(entity.id, 'queue-1')
    assert.equal(entity.tenantId, 'tenant-1')
    assert.equal(entity.type, 'waiting')
    assert.equal(entity.queueNumber, 'A001')
    assert.equal(entity.userId, 'user-1')
    assert.equal(entity.userName, '张三')
    assert.equal(entity.phone, '13800138000')
    assert.equal(entity.partySize, 4)
    assert.equal(entity.resourceId, 'table-1')
    assert.equal(entity.resourceName, '包间 1 号')
    assert.equal(entity.status, 'waiting')
    assert.equal(entity.priority, 0)
    assert.equal(entity.estimatedWaitMin, 15)
    assert.equal(entity.actualWaitMin, undefined)
    assert.equal(entity.remark, '靠近窗户')
    assert.equal(entity.createdAt, now)
    assert.equal(entity.updatedAt, now)
  })

  test('QueueEntity 可选字段 phone / calledAt / servedAt 等可为 undefined', () => {
    const entity = Object.assign(new QueueEntity(), {
      id: 'queue-2',
      tenantId: 'tenant-1',
      type: QueueType.Service,
      queueNumber: 'B001',
      userId: 'user-2',
      userName: '李四',
      partySize: 1,
      status: QueueStatus.Called,
      priority: 1,
      estimatedWaitMin: 5,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    assert.equal(entity.id, 'queue-2')
    assert.equal(entity.phone, undefined)
    assert.equal(entity.resourceId, undefined)
    assert.equal(entity.resourceName, undefined)
    assert.equal(entity.remark, undefined)
    assert.equal(entity.calledAt, undefined)
    assert.equal(entity.servedAt, undefined)
    assert.equal(entity.completedAt, undefined)
    assert.equal(entity.actualWaitMin, undefined)
  })

  test('QueueEntity 兼容带所有时间戳的完整记录', () => {
    const entity = Object.assign(new QueueEntity(), {
      id: 'queue-3',
      tenantId: 'tenant-1',
      type: QueueType.Booking,
      queueNumber: 'C001',
      userId: 'user-3',
      userName: '王五',
      partySize: 2,
      status: QueueStatus.Completed,
      priority: 0,
      estimatedWaitMin: 10,
      actualWaitMin: 8,
      calledAt: new Date('2026-06-23T10:00:00Z'),
      servedAt: new Date('2026-06-23T10:03:00Z'),
      completedAt: new Date('2026-06-23T10:08:00Z'),
      createdAt: new Date('2026-06-23T09:55:00Z'),
      updatedAt: new Date('2026-06-23T10:08:00Z')
    })

    assert.equal(entity.status, 'completed')
    assert.equal(entity.actualWaitMin, 8)
    assert.ok(entity.calledAt instanceof Date)
    assert.ok(entity.servedAt instanceof Date)
    assert.ok(entity.completedAt instanceof Date)
  })
})
