// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { QueueController } from './queue.controller'
import { QueueStatus } from './queue.entity'
import type { QueueService } from './queue.service'

// ── Mock QueueService ───────────────────────────────────────────────────
type AnyFn = (...args: never[]) => unknown
function makeMockService(overrides: Record<string, AnyFn> = {}) {
  return {
    joinQueue: (() => ({})) as AnyFn,
    leaveQueue: (() => ({})) as AnyFn,
    callNext: (() => null) as AnyFn,
    startService: (() => ({})) as AnyFn,
    completeService: (() => ({})) as AnyFn,
    markNoShow: (() => ({})) as AnyFn,
    getQueueStatus: (() => ({})) as AnyFn,
    getMyPosition: (() => ({ position: -1, estimatedWaitMinutes: 0, entry: null })) as AnyFn,
    ...overrides
  } as unknown as QueueService
}

function makeEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: 'queue-1',
    tenantId: 'tenant-1',
    type: 'waiting',
    queueNumber: 'B001',
    userId: 'member-1',
    userName: 'Alice',
    partySize: 1,
    resourceId: 'r-1',
    resourceName: 'Table 5',
    status: QueueStatus.Waiting,
    priority: 0,
    estimatedWaitMin: 5,
    createdAt: new Date('2026-06-23T00:00:00.000Z'),
    updatedAt: new Date('2026-06-23T00:00:00.000Z'),
    ...overrides
  }
}

// ── Controller metadata ─────────────────────────────────────────────────
describe('QueueController metadata', () => {
  it('controller path is queue', () => {
    const path = Reflect.getMetadata('path', QueueController)
    assert.equal(path, 'queue')
  })

  it('joinQueue POST join', () => {
    const method = Reflect.getMetadata('method', QueueController.prototype.joinQueue)
    const path = Reflect.getMetadata('path', QueueController.prototype.joinQueue)
    assert.equal(method, 1) // POST
    assert.equal(path, 'join')
  })

  it('leaveQueue POST :entryId/leave', () => {
    const method = Reflect.getMetadata('method', QueueController.prototype.leaveQueue)
    const path = Reflect.getMetadata('path', QueueController.prototype.leaveQueue)
    assert.equal(method, 1)
    assert.equal(path, ':entryId/leave')
  })

  it('callNext POST call-next', () => {
    const method = Reflect.getMetadata('method', QueueController.prototype.callNext)
    const path = Reflect.getMetadata('path', QueueController.prototype.callNext)
    assert.equal(method, 1)
    assert.equal(path, 'call-next')
  })

  it('startService POST :entryId/start-service', () => {
    const method = Reflect.getMetadata('method', QueueController.prototype.startService)
    const path = Reflect.getMetadata('path', QueueController.prototype.startService)
    assert.equal(method, 1)
    assert.equal(path, ':entryId/start-service')
  })

  it('completeService POST :entryId/complete', () => {
    const method = Reflect.getMetadata('method', QueueController.prototype.completeService)
    const path = Reflect.getMetadata('path', QueueController.prototype.completeService)
    assert.equal(method, 1)
    assert.equal(path, ':entryId/complete')
  })

  it('markNoShow POST :entryId/no-show', () => {
    const method = Reflect.getMetadata('method', QueueController.prototype.markNoShow)
    const path = Reflect.getMetadata('path', QueueController.prototype.markNoShow)
    assert.equal(method, 1)
    assert.equal(path, ':entryId/no-show')
  })

  it('getQueueStatus GET status/:resourceId', () => {
    const method = Reflect.getMetadata('method', QueueController.prototype.getQueueStatus)
    const path = Reflect.getMetadata('path', QueueController.prototype.getQueueStatus)
    assert.equal(method, 0) // GET
    assert.equal(path, 'status/:resourceId')
  })

  it('getMyPosition GET position', () => {
    const method = Reflect.getMetadata('method', QueueController.prototype.getMyPosition)
    const path = Reflect.getMetadata('path', QueueController.prototype.getMyPosition)
    assert.equal(method, 0)
    assert.equal(path, 'position')
  })
})

// ── joinQueue behavior ──────────────────────────────────────────────────
describe('QueueController.joinQueue', () => {
  it('translates tenantContext.tenantId to service joinQueue input', () => {
    const captured: any[] = []
    const controller = new QueueController(makeMockService({
      joinQueue: (input: any) => {
        captured.push(input)
        return makeEntry({ userId: input.memberId })
      }
    }))
    const result = controller.joinQueue(
      { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A' },
      {
        queueType: 'waiting' as any,
        memberId: 'member-1',
        memberName: 'Alice',
        resourceId: 'r-1',
        resourceName: 'Table 5',
        priority: 2
      }
    )
    assert.equal(captured.length, 1)
    assert.equal(captured[0].tenantId, 'tenant-A')
    assert.equal(captured[0].memberId, 'member-1')
    assert.equal(captured[0].memberName, 'Alice')
    assert.equal(captured[0].resourceId, 'r-1')
    assert.equal(captured[0].priority, 2)
    // Result is the contract serialization (date → ISO string)
    assert.equal(result.id, 'queue-1')
    assert.equal(typeof result.createdAt, 'string')
  })

  it('joins without optional fields', () => {
    const captured: any[] = []
    const controller = new QueueController(makeMockService({
      joinQueue: (input: any) => {
        captured.push(input)
        return makeEntry()
      }
    }))
    controller.joinQueue(
      { tenantId: 't', brandId: 'b', storeId: 's' },
      { queueType: 'booking' as any, memberId: 'm' }
    )
    assert.equal(captured[0].priority, undefined)
    assert.equal(captured[0].resourceId, undefined)
    assert.equal(captured[0].remark, undefined)
  })
})

// ── leaveQueue / callNext / startService / completeService / markNoShow ──
describe('QueueController state transitions', () => {
  it('leaveQueue passes entryId and tenantId', () => {
    const captured: any[][] = []
    const controller = new QueueController(makeMockService({
      leaveQueue: (...args: unknown[]) => {
        captured.push([args[0], args[1]])
        return makeEntry({ status: QueueStatus.Cancelled })
      }
    }))
    controller.leaveQueue({ tenantId: 't-A', brandId: 'b', storeId: 's' }, 'entry-1')
    assert.deepEqual(captured[0], ['entry-1', 't-A'])
  })

  it('callNext passes resourceId from body, tenantId from context', () => {
    const captured: any[][] = []
    const controller = new QueueController(makeMockService({
      callNext: (...args: unknown[]) => {
        captured.push([args[0], args[1]])
        return makeEntry({ status: QueueStatus.Called })
      }
    }))
    controller.callNext(
      { tenantId: 't-A', brandId: 'b', storeId: 's' },
      { resourceId: 'r-1' }
    )
    assert.deepEqual(captured[0], ['r-1', 't-A'])
  })

  it('startService is straightforward entryId+tenantId', () => {
    const captured: any[][] = []
    const controller = new QueueController(makeMockService({
      startService: (...args: unknown[]) => {
        captured.push([args[0], args[1]])
        return makeEntry({ status: QueueStatus.Serving })
      }
    }))
    controller.startService({ tenantId: 't', brandId: 'b', storeId: 's' }, 'e-1')
    assert.deepEqual(captured[0], ['e-1', 't'])
  })

  it('completeService passes entryId+tenantId to alias method', () => {
    const captured: any[][] = []
    const controller = new QueueController(makeMockService({
      completeService: (...args: unknown[]) => {
        captured.push([args[0], args[1]])
        return makeEntry({ status: QueueStatus.Completed })
      }
    }))
    controller.completeService({ tenantId: 't', brandId: 'b', storeId: 's' }, 'e-1')
    assert.deepEqual(captured[0], ['e-1', 't'])
  })

  it('markNoShow returns the marked entry', () => {
    const captured: any[][] = []
    const controller = new QueueController(makeMockService({
      markNoShow: (...args: unknown[]) => {
        captured.push([args[0], args[1]])
        return makeEntry({ status: QueueStatus.NoShow })
      }
    }))
    const result = controller.markNoShow({ tenantId: 't', brandId: 'b', storeId: 's' }, 'e-1')
    assert.equal(result.status, QueueStatus.NoShow)
  })
})

// ── getQueueStatus / getMyPosition ──────────────────────────────────────
describe('QueueController queue queries', () => {
  it('getQueueStatus passes resourceId and tenantId', () => {
    const captured: any[][] = []
    const controller = new QueueController(makeMockService({
      getQueueStatus: (...args: unknown[]) => {
        captured.push([args[0], args[1]])
        return { total: 5, waitingCount: 2, calledCount: 1, servingCount: 1, completedCount: 1, cancelledCount: 0, noShowCount: 0, avgWaitMin: 8 }
      }
    }))
    const result = controller.getQueueStatus({ tenantId: 't-A', brandId: 'b', storeId: 's' }, 'r-1')
    assert.deepEqual(captured[0], ['r-1', 't-A'])
    assert.equal(result.total, 5)
  })

  it('getMyPosition returns -1 fallback when memberId/resourceId missing', () => {
    const controller = new QueueController(makeMockService())
    const result = controller.getMyPosition(
      { tenantId: 't', brandId: 'b', storeId: 's' },
      {} as any
    )
    assert.equal(result.position, -1)
    assert.equal(result.entry, null)
  })

  it('getMyPosition returns real position when both ids provided', () => {
    const controller = new QueueController(makeMockService({
      getMyPosition: (...args: unknown[]) => ({
        position: 3,
        estimatedWaitMinutes: 15,
        entry: makeEntry({ userId: args[0] as string, resourceId: args[1] as string })
      })
    }))
    const result = controller.getMyPosition(
      { tenantId: 't', brandId: 'b', storeId: 's' },
      { memberId: 'm-1', resourceId: 'r-1' } as any
    )
    assert.equal(result.position, 3)
    assert.equal(result.estimatedWaitMinutes, 15)
    assert.equal(result.entry?.userId, 'm-1')
  })
})

// ── Controller integration with real service (light smoke) ──────────────
describe('QueueController integration with real service', () => {
  it('full join→leave flow returns valid contract shapes', () => {
     
    const { QueueService } = require('./queue.service') as typeof import('./queue.service')
    const svc = new QueueService()
    svc.resetQueueStoresForTests()
    const controller = new QueueController(svc)

    const joined = controller.joinQueue(
      { tenantId: 't-smoke', brandId: 'b', storeId: 's' },
      { queueType: 'waiting' as any, memberId: 'm-smoke', memberName: 'Alice' }
    )
    assert.equal(joined.userId, 'm-smoke')
    assert.equal(joined.status, QueueStatus.Waiting)
    assert.equal(typeof joined.createdAt, 'string')

    const left = controller.leaveQueue({ tenantId: 't-smoke', brandId: 'b', storeId: 's' }, joined.id)
    assert.equal(left.status, QueueStatus.Cancelled)
  })

  it('full join→call-next→start→complete flow', () => {
     
    const { QueueService } = require('./queue.service') as typeof import('./queue.service')
    const svc = new QueueService()
    svc.resetQueueStoresForTests()
    const controller = new QueueController(svc)

    controller.joinQueue(
      { tenantId: 't-full', brandId: 'b', storeId: 's' },
      { queueType: 'waiting' as any, memberId: 'm-flow', resourceId: 'r-flow' }
    )

    const called = controller.callNext(
      { tenantId: 't-full', brandId: 'b', storeId: 's' },
      { resourceId: 'r-flow' }
    )
    assert.equal(called?.status, QueueStatus.Called)

    const serving = controller.startService({ tenantId: 't-full', brandId: 'b', storeId: 's' }, called!.id)
    assert.equal(serving.status, QueueStatus.Serving)

    const completed = controller.completeService({ tenantId: 't-full', brandId: 'b', storeId: 's' }, called!.id)
    assert.equal(completed.status, QueueStatus.Completed)
  })
})
