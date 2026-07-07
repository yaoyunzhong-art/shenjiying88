import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { QueueType, QueueStatus } from './queue.entity'
import { QueueService } from './queue.service'

beforeEach(() => {
  // Reset module-level state before each test
   
  ;(QueueService as any).prototype.resetQueueStoresForTests.call(new QueueService())
  // Fallback: use the static reset
  // Use new instance for reset since stores are module-level
  const svc = new QueueService()
  svc.resetQueueStoresForTests()
})

function makeService(): QueueService {
  const svc = new QueueService()
  svc.resetQueueStoresForTests()
  return svc
}

describe('QueueService: create / takeNumber', () => {
  it('create generates queue number with type prefix', () => {
    const svc = makeService()
    const entry = svc.create({
      tenantId: 't1',
      type: QueueType.Waiting,
      userId: 'u1',
      userName: 'Alice',
      partySize: 2
    })
    assert.ok(entry.queueNumber.startsWith('B')) // Waiting → B
    assert.equal(entry.queueNumber, 'B001')
  })

  it('create increments per-tenant per-type counter', () => {
    const svc = makeService()
    const e1 = svc.create({ tenantId: 't1', type: QueueType.Booking, userId: 'u1', userName: 'u', partySize: 1 })
    const e2 = svc.create({ tenantId: 't1', type: QueueType.Booking, userId: 'u2', userName: 'u', partySize: 1 })
    const e3 = svc.create({ tenantId: 't1', type: QueueType.Booking, userId: 'u3', userName: 'u', partySize: 1 })
    assert.equal(e1.queueNumber, 'A001')
    assert.equal(e2.queueNumber, 'A002')
    assert.equal(e3.queueNumber, 'A003')
  })

  it('create respects tenant isolation for counter', () => {
    const svc = makeService()
    const a1 = svc.create({ tenantId: 'tA', type: QueueType.Service, userId: 'u', userName: 'u', partySize: 1 })
    const b1 = svc.create({ tenantId: 'tB', type: QueueType.Service, userId: 'u', userName: 'u', partySize: 1 })
    assert.equal(a1.queueNumber, 'C001')
    assert.equal(b1.queueNumber, 'C001')
  })

  it('create sets status to Waiting and partySize', () => {
    const svc = makeService()
    const entry = svc.create({
      tenantId: 't1',
      type: QueueType.Booking,
      userId: 'u1',
      userName: 'Alice',
      partySize: 4
    })
    assert.equal(entry.status, QueueStatus.Waiting)
    assert.equal(entry.partySize, 4)
  })

  it('takeNumber is an alias for create', () => {
    const svc = makeService()
    const e1 = svc.takeNumber({ tenantId: 't', type: QueueType.Waiting, userId: 'u1', userName: 'Alice', partySize: 1 })
    // Both methods create an entry — assert properties match expected entry shape
    assert.ok(e1.id.startsWith('queue-'))
    assert.equal(e1.userId, 'u1')
    assert.equal(e1.userName, 'Alice')
    assert.equal(e1.type, QueueType.Waiting)
    assert.equal(e1.status, QueueStatus.Waiting)
    assert.ok(e1.queueNumber.startsWith('B'))
  })

  it('create computes estimatedWaitMin based on ahead count', () => {
    const svc = makeService()
    svc.create({ tenantId: 't', type: QueueType.Waiting, userId: 'u1', userName: 'u', partySize: 1 })
    svc.create({ tenantId: 't', type: QueueType.Waiting, userId: 'u2', userName: 'u', partySize: 1 })
    const third = svc.create({ tenantId: 't', type: QueueType.Waiting, userId: 'u3', userName: 'u', partySize: 1 })
    assert.equal(third.estimatedWaitMin, 10) // 2 ahead × 5 min
  })
})

describe('QueueService: findAll / findOne', () => {
  it('findAll returns tenant-scoped entries sorted by queueNumber', () => {
    const svc = makeService()
    svc.create({ tenantId: 't', type: QueueType.Booking, userId: 'u1', userName: 'u', partySize: 1 })
    svc.create({ tenantId: 't', type: QueueType.Booking, userId: 'u2', userName: 'u', partySize: 1 })
    svc.create({ tenantId: 'other', type: QueueType.Booking, userId: 'u3', userName: 'u', partySize: 1 })

    const t1Entries = svc.findAll('t')
    assert.equal(t1Entries.length, 2)
    assert.equal(t1Entries[0].queueNumber, 'A001')
    assert.equal(t1Entries[1].queueNumber, 'A002')
  })

  it('findAll filters by type and status', () => {
    const svc = makeService()
    svc.create({ tenantId: 't', type: QueueType.Booking, userId: 'u1', userName: 'u', partySize: 1 })
    svc.create({ tenantId: 't', type: QueueType.Waiting, userId: 'u2', userName: 'u', partySize: 1 })
    const all = svc.findAll('t')
    assert.equal(all.length, 2)
    const bookingOnly = svc.findAll('t', { type: QueueType.Booking })
    assert.equal(bookingOnly.length, 1)
    assert.equal(bookingOnly[0].type, QueueType.Booking)
  })

  it('findOne returns undefined for cross-tenant access', () => {
    const svc = makeService()
    const e = svc.create({ tenantId: 't1', type: QueueType.Waiting, userId: 'u', userName: 'u', partySize: 1 })
    assert.equal(svc.findOne(e.id, 't2'), undefined)
    assert.ok(svc.findOne(e.id, 't1'))
  })
})

describe('QueueService: update / cancel', () => {
  it('update mutates partySize and remark only', () => {
    const svc = makeService()
    const e = svc.create({ tenantId: 't', type: QueueType.Booking, userId: 'u', userName: 'Alice', partySize: 2 })
    const updated = svc.update(e.id, 't', { partySize: 5, remark: 'VIP' })
    assert.equal(updated.partySize, 5)
    assert.equal(updated.remark, 'VIP')
  })

  it('cancel transitions Waiting→Cancelled', () => {
    const svc = makeService()
    const e = svc.create({ tenantId: 't', type: QueueType.Booking, userId: 'u', userName: 'u', partySize: 1 })
    const cancelled = svc.cancel(e.id, 't')
    assert.equal(cancelled.status, QueueStatus.Cancelled)
  })

  it('cancel rejects invalid transition (Cancelled→Waiting)', () => {
    const svc = makeService()
    const e = svc.create({ tenantId: 't', type: QueueType.Booking, userId: 'u', userName: 'u', partySize: 1 })
    svc.cancel(e.id, 't')
    assert.throws(() => svc.cancel(e.id, 't'), /Invalid queue status transition/)
  })

  it('update throws for unknown id', () => {
    const svc = makeService()
    assert.throws(() => svc.update('does-not-exist', 't', { partySize: 1 }), /Queue entry not found/)
  })
})

describe('QueueService: Controller wrappers', () => {
  it('joinQueue wraps create() with memberId mapping', () => {
    const svc = makeService()
    const entry = svc.joinQueue({
      tenantId: 't',
      queueType: QueueType.Waiting,
      memberId: 'member-001',
      memberName: 'Alice'
    })
    assert.equal(entry.userId, 'member-001')
    assert.equal(entry.userName, 'Alice')
    assert.equal(entry.type, QueueType.Waiting)
    assert.equal(entry.queueNumber, 'B001')
  })

  it('joinQueue defaults partySize to 1', () => {
    const svc = makeService()
    const entry = svc.joinQueue({
      tenantId: 't',
      queueType: QueueType.Booking,
      memberId: 'm1'
    })
    assert.equal(entry.partySize, 1)
  })

  it('joinQueue uses memberId as userName fallback when not provided', () => {
    const svc = makeService()
    const entry = svc.joinQueue({
      tenantId: 't',
      queueType: QueueType.Service,
      memberId: 'm-XYZ'
    })
    assert.equal(entry.userName, 'm-XYZ')
  })

  it('leaveQueue aliases cancel() (Waiting→Cancelled)', () => {
    const svc = makeService()
    const e = svc.joinQueue({ tenantId: 't', queueType: QueueType.Waiting, memberId: 'm1' })
    const left = svc.leaveQueue(e.id, 't')
    assert.equal(left.status, QueueStatus.Cancelled)
  })

  it('leaveQueue rejects non-Waiting entry', () => {
    const svc = makeService()
    const e = svc.create({ tenantId: 't', type: QueueType.Waiting, userId: 'u', userName: 'u', partySize: 1 })
    svc.cancel(e.id, 't')
    assert.throws(() => svc.leaveQueue(e.id, 't'), /Invalid queue status transition/)
  })

  it('completeService transitions Serving→Completed', () => {
    const svc = makeService()
    const e = svc.create({ tenantId: 't', type: QueueType.Waiting, userId: 'u', userName: 'u', partySize: 1, resourceId: 'r1' })
    svc.callNext('r1', 't')
    svc.startService(e.id, 't')
    const completed = svc.completeService(e.id, 't')
    assert.equal(completed.status, QueueStatus.Completed)
    assert.ok(completed.completedAt instanceof Date)
  })

  it('getQueueStatus returns stats scoped to a single resource', () => {
    const svc = makeService()
    svc.joinQueue({ tenantId: 't', queueType: QueueType.Waiting, memberId: 'm1', resourceId: 'r1' })
    svc.joinQueue({ tenantId: 't', queueType: QueueType.Waiting, memberId: 'm2', resourceId: 'r1' })
    svc.joinQueue({ tenantId: 't', queueType: QueueType.Waiting, memberId: 'm3', resourceId: 'r2' })

    const r1Stats = svc.getQueueStatus('r1', 't')
    assert.equal(r1Stats.total, 2)
    assert.equal(r1Stats.waitingCount, 2)

    const r2Stats = svc.getQueueStatus('r2', 't')
    assert.equal(r2Stats.total, 1)
  })

  it('getMyPosition returns position 1 for first waiter', () => {
    const svc = makeService()
    svc.joinQueue({ tenantId: 't', queueType: QueueType.Waiting, memberId: 'm1', resourceId: 'r1' })
    const pos = svc.getMyPosition('m1', 'r1', 't')
    assert.equal(pos.position, 1)
    assert.equal(pos.estimatedWaitMinutes, 5)
    assert.ok(pos.entry)
  })

  it('getMyPosition increments by 1 for each subsequent member', () => {
    const svc = makeService()
    svc.joinQueue({ tenantId: 't', queueType: QueueType.Waiting, memberId: 'm1', resourceId: 'r1' })
    svc.joinQueue({ tenantId: 't', queueType: QueueType.Waiting, memberId: 'm2', resourceId: 'r1' })
    svc.joinQueue({ tenantId: 't', queueType: QueueType.Waiting, memberId: 'm3', resourceId: 'r1' })

    assert.equal(svc.getMyPosition('m1', 'r1', 't').position, 1)
    assert.equal(svc.getMyPosition('m2', 'r1', 't').position, 2)
    assert.equal(svc.getMyPosition('m3', 'r1', 't').position, 3)
  })

  it('getMyPosition returns -1 for member not in queue', () => {
    const svc = makeService()
    const pos = svc.getMyPosition('m-unknown', 'r1', 't')
    assert.equal(pos.position, -1)
    assert.equal(pos.entry, null)
  })

  it('getMyPosition returns -1 for empty memberId/resourceId', () => {
    const svc = makeService()
    assert.equal(svc.getMyPosition('', 'r1', 't').position, -1)
    assert.equal(svc.getMyPosition('m1', '', 't').position, -1)
  })
})

describe('QueueService: callNext flow', () => {
  it('callNext picks the highest priority first, then earliest queueNumber', () => {
    const svc = makeService()
    const a = svc.joinQueue({ tenantId: 't', queueType: QueueType.Waiting, memberId: 'm1', resourceId: 'r1' })
    const b = svc.joinQueue({ tenantId: 't', queueType: QueueType.Waiting, memberId: 'm2', resourceId: 'r1' })
    // Bump b's priority
    b.priority = 5
    const called = svc.callNext('r1', 't')
    assert.equal(called?.id, b.id) // higher priority wins
    assert.equal(called?.status, QueueStatus.Called)
    assert.ok(called?.calledAt instanceof Date)
    assert.ok(typeof called?.actualWaitMin === 'number')
  })

  it('callNext returns null when no waiting entries', () => {
    const svc = makeService()
    const result = svc.callNext('r1', 't')
    assert.equal(result, null)
  })

  it('callNextByTenant preserves back-compat behavior (resourceId optional)', () => {
    const svc = makeService()
    svc.joinQueue({ tenantId: 't', queueType: QueueType.Waiting, memberId: 'm1', resourceId: 'r1' })
    const next = svc.callNextByTenant('t')
    assert.ok(next)
    assert.equal(next.status, QueueStatus.Called)
  })
})

describe('QueueService: status transitions', () => {
  it('startService transitions Called→Serving', () => {
    const svc = makeService()
    const e = svc.create({ tenantId: 't', type: QueueType.Waiting, userId: 'u', userName: 'u', partySize: 1, resourceId: 'r1' })
    svc.callNext('r1', 't')
    const serving = svc.startService(e.id, 't')
    assert.equal(serving.status, QueueStatus.Serving)
  })

  it('markNoShow transitions Called→NoShow', () => {
    const svc = makeService()
    const e = svc.create({ tenantId: 't', type: QueueType.Waiting, userId: 'u', userName: 'u', partySize: 1, resourceId: 'r1' })
    svc.callNext('r1', 't')
    const noShow = svc.markNoShow(e.id, 't')
    assert.equal(noShow.status, QueueStatus.NoShow)
  })

  it('startService rejects Waiting (must be Called)', () => {
    const svc = makeService()
    const e = svc.joinQueue({ tenantId: 't', queueType: QueueType.Waiting, memberId: 'm1' })
    assert.throws(() => svc.startService(e.id, 't'), /Invalid queue status transition/)
  })
})

describe('QueueService: getQueueStats', () => {
  it('getQueueStats aggregates counts across all statuses', () => {
    const svc = makeService()
    const a = svc.joinQueue({ tenantId: 't', queueType: QueueType.Waiting, memberId: 'a', resourceId: 'r' })
    svc.joinQueue({ tenantId: 't', queueType: QueueType.Waiting, memberId: 'b', resourceId: 'r' })
    svc.callNext('r', 't')
    svc.startService(a.id, 't')
    svc.completeService(a.id, 't')
    svc.leaveQueue(svc.findAll('t').find((q) => q.userId === 'b')!.id, 't')

    const stats = svc.getQueueStats('t', 'r')
    assert.equal(stats.total, 2)
    assert.equal(stats.completedCount, 1)
    assert.equal(stats.cancelledCount, 1)
  })

  it('getQueueStats returns 0 counts for empty tenant', () => {
    const svc = makeService()
    const stats = svc.getQueueStats('empty', 'r')
    assert.equal(stats.total, 0)
    assert.equal(stats.avgWaitMin, 0)
  })
})
