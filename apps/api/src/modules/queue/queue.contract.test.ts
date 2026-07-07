import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  QueueType,
  QueueStatus,
  QUEUE_STATUS_TRANSITIONS,
  type QueueEntity
} from './queue.entity'
import {
  QueueEntryContract,
  QueueStatsContract,
  toQueueEntryContract
} from './queue.contract'

// ── QueueType enum contract ─────────────────────────────────────────────
describe('queue.contract: QueueType', () => {
  it('QueueType has 3 stable enum values', () => {
    assert.equal(QueueType.Booking, 'booking')
    assert.equal(QueueType.Waiting, 'waiting')
    assert.equal(QueueType.Service, 'service')
  })

  it('QueueType enum keys are stable wire values', () => {
    const types = Object.values(QueueType)
    assert.deepEqual(types.sort(), ['booking', 'service', 'waiting'])
  })
})

// ── QueueStatus enum contract ──────────────────────────────────────────
describe('queue.contract: QueueStatus', () => {
  it('QueueStatus has 6 stable enum values', () => {
    assert.equal(QueueStatus.Waiting, 'waiting')
    assert.equal(QueueStatus.Called, 'called')
    assert.equal(QueueStatus.Serving, 'serving')
    assert.equal(QueueStatus.Completed, 'completed')
    assert.equal(QueueStatus.Cancelled, 'cancelled')
    assert.equal(QueueStatus.NoShow, 'no_show')
  })

  it('QueueStatus enum keys cover all 6 states', () => {
    const statuses = Object.values(QueueStatus)
    assert.deepEqual(statuses.sort(), [
      'called',
      'cancelled',
      'completed',
      'no_show',
      'serving',
      'waiting'
    ])
  })

  it('QUEUE_STATUS_TRANSITIONS allows Waiting→Called/Cancelled only', () => {
    const allowed = QUEUE_STATUS_TRANSITIONS[QueueStatus.Waiting]
    assert.deepEqual(allowed.sort(), ['called', 'cancelled'])
  })

  it('QUEUE_STATUS_TRANSITIONS allows Called→Serving/NoShow/Cancelled', () => {
    const allowed = QUEUE_STATUS_TRANSITIONS[QueueStatus.Called]
    assert.deepEqual(allowed.sort(), ['cancelled', 'no_show', 'serving'])
  })

  it('QUEUE_STATUS_TRANSITIONS allows Serving→Completed/Cancelled only', () => {
    const allowed = QUEUE_STATUS_TRANSITIONS[QueueStatus.Serving]
    assert.deepEqual(allowed.sort(), ['cancelled', 'completed'])
  })

  it('QUEUE_STATUS_TRANSITIONS blocks Completed/Cancelled/NoShow (terminal)', () => {
    assert.deepEqual(QUEUE_STATUS_TRANSITIONS[QueueStatus.Completed], [])
    assert.deepEqual(QUEUE_STATUS_TRANSITIONS[QueueStatus.Cancelled], [])
    assert.deepEqual(QUEUE_STATUS_TRANSITIONS[QueueStatus.NoShow], [])
  })
})

// ── QueueEntity shape contract ──────────────────────────────────────────
describe('queue.contract: QueueEntity', () => {
  it('QueueEntity accepts all required fields with proper types', () => {
    const entity: QueueEntity = {
      id: 'queue-1',
      tenantId: 'tenant-1',
      type: QueueType.Waiting,
      queueNumber: 'B001',
      userId: 'user-1',
      userName: 'Alice',
      partySize: 2,
      status: QueueStatus.Waiting,
      priority: 0,
      estimatedWaitMin: 10,
      createdAt: new Date('2026-06-23T00:00:00.000Z'),
      updatedAt: new Date('2026-06-23T00:00:00.000Z')
    }

    assert.equal(entity.id, 'queue-1')
    assert.equal(entity.tenantId, 'tenant-1')
    assert.equal(entity.type, QueueType.Waiting)
    assert.equal(entity.queueNumber, 'B001')
    assert.equal(entity.status, QueueStatus.Waiting)
    assert.equal(typeof entity.createdAt, 'object')
  })

  it('QueueEntity accepts optional fields (phone, calledAt, servedAt, etc)', () => {
    const entity: QueueEntity = {
      id: 'q',
      tenantId: 't',
      type: QueueType.Booking,
      queueNumber: 'A001',
      userId: 'u',
      userName: 'u',
      phone: '13800138000',
      partySize: 4,
      resourceId: 'r-1',
      resourceName: 'Table 5',
      status: QueueStatus.Completed,
      priority: 1,
      estimatedWaitMin: 5,
      actualWaitMin: 12,
      calledAt: new Date('2026-06-23T00:05:00.000Z'),
      servedAt: new Date('2026-06-23T00:10:00.000Z'),
      completedAt: new Date('2026-06-23T00:25:00.000Z'),
      remark: 'VIP',
      createdAt: new Date('2026-06-23T00:00:00.000Z'),
      updatedAt: new Date('2026-06-23T00:25:00.000Z')
    }

    assert.equal(entity.phone, '13800138000')
    assert.equal(entity.partySize, 4)
    assert.equal(entity.actualWaitMin, 12)
    assert.ok(entity.calledAt instanceof Date)
  })
})

// ── QueueEntryContract shape contract ──────────────────────────────────
describe('queue.contract: QueueEntryContract', () => {
  it('toQueueEntryContract serializes Date fields to ISO strings', () => {
    const entity: QueueEntity = {
      id: 'queue-iso',
      tenantId: 't',
      type: QueueType.Service,
      queueNumber: 'C001',
      userId: 'u',
      userName: 'Bob',
      partySize: 1,
      status: QueueStatus.Serving,
      priority: 0,
      estimatedWaitMin: 0,
      calledAt: new Date('2026-06-23T00:05:00.000Z'),
      servedAt: new Date('2026-06-23T00:10:00.000Z'),
      createdAt: new Date('2026-06-23T00:00:00.000Z'),
      updatedAt: new Date('2026-06-23T00:10:00.000Z')
    }

    const contract = toQueueEntryContract(entity)
    assert.equal(typeof contract.calledAt, 'string')
    assert.equal(typeof contract.servedAt, 'string')
    assert.equal(typeof contract.createdAt, 'string')
    assert.equal(contract.calledAt, '2026-06-23T00:05:00.000Z')
    assert.equal(contract.servedAt, '2026-06-23T00:10:00.000Z')
  })

  it('toQueueEntryContract returns undefined for missing optional Date fields', () => {
    const entity: QueueEntity = {
      id: 'queue-min',
      tenantId: 't',
      type: QueueType.Waiting,
      queueNumber: 'B001',
      userId: 'u',
      userName: 'u',
      partySize: 1,
      status: QueueStatus.Waiting,
      priority: 0,
      estimatedWaitMin: 0,
      createdAt: new Date('2026-06-23T00:00:00.000Z'),
      updatedAt: new Date('2026-06-23T00:00:00.000Z')
    }

    const contract: QueueEntryContract = toQueueEntryContract(entity)
    assert.equal(contract.calledAt, undefined)
    assert.equal(contract.servedAt, undefined)
    assert.equal(contract.completedAt, undefined)
    assert.equal(contract.actualWaitMin, undefined)
  })

  it('toQueueEntryContract preserves wire-stable enum values', () => {
    const entity: QueueEntity = {
      id: 'queue-enum',
      tenantId: 't',
      type: QueueType.Booking,
      queueNumber: 'A001',
      userId: 'u',
      userName: 'u',
      partySize: 1,
      status: QueueStatus.Cancelled,
      priority: 0,
      estimatedWaitMin: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    const c = toQueueEntryContract(entity)
    assert.equal(c.type, 'booking')
    assert.equal(c.status, 'cancelled')
  })
})

// ── QueueStatsContract shape contract ──────────────────────────────────
describe('queue.contract: QueueStatsContract', () => {
  it('QueueStatsContract covers 7 required metrics', () => {
    const stats: QueueStatsContract = {
      total: 10,
      waitingCount: 3,
      calledCount: 1,
      servingCount: 2,
      completedCount: 3,
      cancelledCount: 1,
      noShowCount: 0,
      avgWaitMin: 8
    }
    assert.equal(stats.total, 10)
    assert.equal(stats.waitingCount, 3)
    assert.equal(stats.avgWaitMin, 8)
  })
})
