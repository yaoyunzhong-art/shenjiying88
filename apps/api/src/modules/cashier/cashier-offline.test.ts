import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
import assert from 'node:assert/strict'
import {
  OfflineQueueManager,
  RefundProcessor,
  MultiChannelRouter,
  RefundStatus,
  type OfflineOrder,
  type ChannelType
} from './cashier-offline.service'

function createOfflineOrder(overrides?: Partial<OfflineOrder>): OfflineOrder {
  return {
    orderId: `offline-order-${randomUUID()}`,
    memberId: 'member-offline-1',
    items: [{ skuId: 'sku-test-1', quantity: 2, price: 50 }],
    totalAmount: 100,
    currency: 'CNY',
    channel: 'Web',
    queuedAt: new Date().toISOString(),
    synced: false,
    ...overrides
  }
}

function randomUUID() {
  return Math.random().toString(36).substring(2, 15)
}

describe('OfflineQueueManager', () => {
  it('enqueueOfflineOrder adds order to queue', () => {
    const manager = new OfflineQueueManager()
    const order = createOfflineOrder()

    const result = manager.enqueueOfflineOrder(order)

    assert.equal(result.enqueued, true)
    assert.equal(result.queueSize, 1)
    assert.equal(manager.getQueueSize(), 1)
  })

  it('enqueueOfflineOrder rejects duplicate order', () => {
    const manager = new OfflineQueueManager()
    const order = createOfflineOrder()
    manager.enqueueOfflineOrder(order)

    const result = manager.enqueueOfflineOrder(order)

    assert.equal(result.enqueued, false)
    assert.equal(result.queueSize, 1)
  })

  it('flushQueue submits all unsynced orders', async () => {
    const manager = new OfflineQueueManager()
    const order1 = createOfflineOrder({ orderId: 'order-flush-1' })
    const order2 = createOfflineOrder({ orderId: 'order-flush-2' })
    manager.enqueueOfflineOrder(order1)
    manager.enqueueOfflineOrder(order2)

    const result = await manager.flushQueue(async (orders) => {
      assert.equal(orders.length, 2)
      return { success: ['order-flush-1', 'order-flush-2'], failed: [] }
    })

    assert.equal(result.success.length, 2)
    assert.equal(result.failed.length, 0)
    assert.equal(result.flushedCount, 2)
  })

  it('flushQueue returns empty when queue is empty', async () => {
    const manager = new OfflineQueueManager()

    const result = await manager.flushQueue(async () => {
      return { success: [], failed: [] }
    })

    assert.equal(result.flushedCount, 0)
  })

  it('clearQueue removes all orders', () => {
    const manager = new OfflineQueueManager()
    manager.enqueueOfflineOrder(createOfflineOrder())
    manager.enqueueOfflineOrder(createOfflineOrder())

    const result = manager.clearQueue()

    assert.equal(result.clearedCount, 2)
    assert.equal(manager.getQueueSize(), 0)
  })

  it('getUnsyncedCount returns only unsynced orders', () => {
    const manager = new OfflineQueueManager()
    manager.enqueueOfflineOrder(createOfflineOrder({ orderId: 'order-unsynced-1' }))
    manager.enqueueOfflineOrder(createOfflineOrder({ orderId: 'order-unsynced-2' }))

    assert.equal(manager.getUnsyncedCount(), 2)

    manager.markSynced('order-unsynced-1')

    assert.equal(manager.getUnsyncedCount(), 1)
  })
})

describe('RefundProcessor', () => {
  it('processRefund creates refund record with processing status', async () => {
    const processor = new RefundProcessor()

    const result = await processor.processRefund('txn-123', 100, 'Customer request')

    assert.equal(result.refundId.startsWith('refund-'), true)
    assert.equal(result.transactionId, 'txn-123')
    assert.equal(result.amount, 100)
    assert.equal(result.reason, 'Customer request')
    assert.equal(result.status, RefundStatus.Completed)
    assert.ok(result.completedAt)
  })

  it('processRefund rejects duplicate refund for completed transaction', async () => {
    const processor = new RefundProcessor()
    await processor.processRefund('txn-dup', 50)

    await assert.rejects(
      () => processor.processRefund('txn-dup', 50),
      /already been refunded/
    )
  })

  it('queryRefundStatus returns refund record by id', async () => {
    const processor = new RefundProcessor()
    const refund = await processor.processRefund('txn-query', 75)

    const result = await processor.queryRefundStatus(refund.refundId)

    assert.equal(result?.refundId, refund.refundId)
    assert.equal(result?.amount, 75)
  })

  it('queryRefundStatus returns null for non-existent refund', async () => {
    const processor = new RefundProcessor()

    const result = await processor.queryRefundStatus('refund-nonexistent')

    assert.equal(result, null)
  })

  it('processRefund handles failed refund', async () => {
    const processor = new RefundProcessor()

    const refund = await processor.processRefund('txn-invalid', 0)

    assert.equal(refund.status, RefundStatus.Failed)
    assert.ok(refund.failureReason)
  })
})

describe('RefundProcessor - LYT Points Reversal', () => {
  it('reverseLytPoints creates reversal record', async () => {
    const processor = new RefundProcessor()

    const result = await processor.reverseLytPoints('order-reversal-1', 'member-1', 100)

    assert.equal(result.reversalId.startsWith('reversal-'), true)
    assert.equal(result.orderId, 'order-reversal-1')
    assert.equal(result.memberId, 'member-1')
    assert.equal(result.points, 100)
    assert.ok(result.reversedAt)
  })

  it('reverseLytPoints rejects duplicate reversal', async () => {
    const processor = new RefundProcessor()
    await processor.reverseLytPoints('order-dup-rev', 'member-dup', 50)

    await assert.rejects(
      () => processor.reverseLytPoints('order-dup-rev', 'member-dup', 50),
      /already reversed/
    )
  })

  it('getReversalsByMember returns member reversals', async () => {
    const processor = new RefundProcessor()
    await processor.reverseLytPoints('order-m1', 'member-specific', 30)
    await processor.reverseLytPoints('order-m2', 'member-specific', 20)

    const result = processor.getReversalsByMember('member-specific')

    assert.equal(result.length, 2)
    assert.ok(result.every((r) => r.memberId === 'member-specific'))
  })
})

describe('MultiChannelRouter', () => {
  it('routeToChannel routes POS order correctly', () => {
    const router = new MultiChannelRouter()
    const order = createOfflineOrder({ channel: 'POS' })

    const result = router.routeToChannel(order)

    assert.equal(result.channel, 'POS')
    assert.equal(result.success, true)
    assert.ok(result.syncedAt)
  })

  it('routeToChannel routes Web order correctly', () => {
    const router = new MultiChannelRouter()
    const order = createOfflineOrder({ channel: 'WEB' })

    const result = router.routeToChannel(order)

    assert.equal(result.channel, 'Web')
    assert.equal(result.success, true)
  })

  it('routeToChannel routes Mobile order correctly', () => {
    const router = new MultiChannelRouter()
    const order = createOfflineOrder({ channel: 'Mobile' })

    const result = router.routeToChannel(order)

    assert.equal(result.channel, 'Mobile')
    assert.equal(result.success, true)
  })

  it('routeToChannel routes MiniApp order correctly', () => {
    const router = new MultiChannelRouter()
    const order = createOfflineOrder({ channel: 'MINI-PROGRAM' })

    const result = router.routeToChannel(order)

    assert.equal(result.channel, 'MiniApp')
    assert.equal(result.success, true)
  })

  it('syncToChannel performs successful sync', async () => {
    const router = new MultiChannelRouter()
    const order = createOfflineOrder()

    const result = await router.syncToChannel(order, 'POS')

    assert.equal(result.channel, 'POS')
    assert.equal(result.success, true)
    assert.ok(result.syncedAt)
  })

  it('syncToChannel rejects unsupported channel', async () => {
    const router = new MultiChannelRouter()
    const order = createOfflineOrder()

    const result = await router.syncToChannel(order, 'UnsupportedChannel' as ChannelType)

    assert.equal(result.success, false)
    assert.ok(result.error?.includes('Unsupported channel'))
  })

  it('syncToChannel fails for order without items', async () => {
    const router = new MultiChannelRouter()
    const order = createOfflineOrder({ items: [] })

    const result = await router.syncToChannel(order, 'Web')

    assert.equal(result.success, false)
    assert.ok(result.error?.includes('no items'))
  })

  it('getChannelRoute returns routed channel', () => {
    const router = new MultiChannelRouter()
    const order = createOfflineOrder({ channel: 'POS' })
    router.routeToChannel(order)

    const result = router.getChannelRoute(order.orderId)

    assert.equal(result, 'POS')
  })

  it('getAllSyncRecords returns all sync results for order', async () => {
    const router = new MultiChannelRouter()
    const order = createOfflineOrder()
    await router.syncToChannel(order, 'POS')
    await router.syncToChannel(order, 'Web')

    const results = router.getAllSyncRecords(order.orderId)

    assert.equal(results.length, 2)
    assert.ok(results.some((r) => r.channel === 'POS'))
    assert.ok(results.some((r) => r.channel === 'Web'))
  })
})
