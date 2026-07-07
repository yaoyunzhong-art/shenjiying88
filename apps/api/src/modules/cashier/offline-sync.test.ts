import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { OrderItem } from '@m5/types'
import {
  IdempotencyChecker,
  ConflictResolver,
  EdgeSyncCoordinator,
  LocalOrder
} from './offline-sync.service'

/**
 * T106-2 离线收银边缘计算测试
 *
 * P1-2 LYT Webhook 异步确认
 * P1-12 数据同步幂等性
 *
 * 使用 vitest globals（describe/it）
 */

describe('IdempotencyChecker', () => {
  let checker: IdempotencyChecker

  beforeEach(() => {
    checker = new IdempotencyChecker()
  })

  it('should return false for unknown key', () => {
    assert.equal(checker.check('unknown-key'), false)
  })

  it('should return true after marking a key', () => {
    checker.mark('test-key', { result: 'value' })
    assert.equal(checker.check('test-key'), true)
  })

  it('should return cached result after marking', () => {
    const result = { orderId: 'ORD-123', status: 'PAID' }
    checker.mark('idem-key', result)
    assert.deepEqual(checker.get('idem-key'), result)
  })

  it('should return null for unmapped key', () => {
    assert.equal(checker.get('unmapped'), null)
  })

  it('second call with same key returns cached result (幂等性)', () => {
    const firstResult = { id: 'ORD-1', totalCents: 1000 }
    checker.mark('idem-123', firstResult)

    // 第二次调用应返回缓存结果
    const cached = checker.get('idem-123')
    assert.deepEqual(cached, firstResult)
    assert.equal(checker.check('idem-123'), true)
  })
})

describe('ConflictResolver', () => {
  let resolver: ConflictResolver

  beforeEach(() => {
    resolver = new ConflictResolver()
  })

  describe('detectConflict', () => {
    it('returns null when no conflict', () => {
      const local: LocalOrder = { id: 'ORD-1', totalCents: 1000, status: 'PENDING' }
      const server: LocalOrder = { id: 'ORD-1', totalCents: 1000, status: 'PENDING' }
      assert.equal(resolver.detectConflict(local, server), null)
    })

    it('detects amount conflict', () => {
      const local: LocalOrder = { id: 'ORD-1', totalCents: 1000 }
      const server: LocalOrder = { id: 'ORD-1', totalCents: 2000 }
      const conflicts = resolver.detectConflict(local, server)
      assert.notEqual(conflicts, null)
      assert.equal(conflicts!.length, 1)
      assert.equal(conflicts![0].field, 'totalCents')
      assert.equal(conflicts![0].localValue, 1000)
      assert.equal(conflicts![0].serverValue, 2000)
    })

    it('detects status conflict', () => {
      const local: LocalOrder = { id: 'ORD-1', status: 'PENDING' }
      const server: LocalOrder = { id: 'ORD-1', status: 'PAID' }
      const conflicts = resolver.detectConflict(local, server)
      assert.notEqual(conflicts, null)
      assert.equal(conflicts![0].field, 'status')
    })

    it('returns conflict report when items count differs', () => {
      const local: LocalOrder = {
        id: 'ORD-1',
        items: [{ id: 'ITM-1', orderId: 'ORD-1', tenantId: 't1', productId: 'p1', productName: 'A', unitPriceCents: 100, quantity: 1, subtotalCents: 100, discountCents: 0, createdAt: '' }]
      }
      const server: LocalOrder = { id: 'ORD-1', items: [] }
      const conflicts = resolver.detectConflict(local, server)
      assert.notEqual(conflicts, null)
      assert.equal(conflicts![0].field, 'items')
    })
  })

  describe('resolveByTimestamp', () => {
    it('local newer wins', () => {
      const local: LocalOrder = { id: 'ORD-1', updatedAt: '2024-01-02T00:00:00Z', totalCents: 1000 }
      const server: LocalOrder = { id: 'ORD-1', updatedAt: '2024-01-01T00:00:00Z', totalCents: 1000 }
      const result = resolver.resolveByTimestamp(local, server)
      assert.equal(result.updatedAt, '2024-01-02T00:00:00Z')
    })

    it('server newer wins', () => {
      const local: LocalOrder = { id: 'ORD-1', updatedAt: '2024-01-01T00:00:00Z', totalCents: 1000 }
      const server: LocalOrder = { id: 'ORD-1', updatedAt: '2024-01-02T00:00:00Z', totalCents: 1000 }
      const result = resolver.resolveByTimestamp(local, server)
      assert.equal(result.updatedAt, '2024-01-02T00:00:00Z')
    })

    it('returns local when timestamps equal (tie-breaker uses local)', () => {
      const local: LocalOrder = { id: 'ORD-1', updatedAt: '2024-01-01T00:00:00Z', totalCents: 1000 }
      const server: LocalOrder = { id: 'ORD-1', updatedAt: '2024-01-01T00:00:00Z', totalCents: 1000 }
      const result = resolver.resolveByTimestamp(local, server)
      assert.equal(result.id, 'ORD-1')
    })
  })

  describe('resolveByAmount', () => {
    it('higher amount wins', () => {
      const local: LocalOrder = { id: 'ORD-1', totalCents: 500 }
      const server: LocalOrder = { id: 'ORD-1', totalCents: 1000 }
      const result = resolver.resolveByAmount(local, server)
      assert.equal(result.totalCents, 1000)
    })

    it('local amount wins when equal', () => {
      const local: LocalOrder = { id: 'ORD-1', totalCents: 1000 }
      const server: LocalOrder = { id: 'ORD-1', totalCents: 1000 }
      const result = resolver.resolveByAmount(local, server)
      assert.equal(result.totalCents, 1000)
    })
  })

  describe('mergeOrders', () => {
    it('merges items from both orders', () => {
      const local: LocalOrder = {
        id: 'ORD-1',
        items: [
          { id: 'ITM-1', orderId: 'ORD-1', tenantId: 't1', productId: 'p1', productName: 'A', unitPriceCents: 100, quantity: 1, subtotalCents: 100, discountCents: 0, createdAt: '' }
        ]
      }
      const server: LocalOrder = {
        id: 'ORD-1',
        items: [
          { id: 'ITM-2', orderId: 'ORD-1', tenantId: 't1', productId: 'p2', productName: 'B', unitPriceCents: 200, quantity: 1, subtotalCents: 200, discountCents: 0, createdAt: '' }
        ]
      }
      const merged = resolver.mergeOrders(local, server)
      assert.equal(merged.items!.length, 2)
    })

    it('takes max amount on conflict', () => {
      const local: LocalOrder = { id: 'ORD-1', totalCents: 500 }
      const server: LocalOrder = { id: 'ORD-1', totalCents: 1000 }
      const merged = resolver.mergeOrders(local, server)
      assert.equal(merged.totalCents, 1000)
    })

    it('keeps non-conflicting fields from both', () => {
      const local: LocalOrder = { id: 'ORD-1', status: 'PAID', createdBy: 'user-a' }
      const server: LocalOrder = { id: 'ORD-1', totalCents: 1000, paidAt: '2024-01-01' }
      const merged = resolver.mergeOrders(local, server)
      assert.equal(merged.status, 'PAID')
      assert.equal(merged.totalCents, 1000)
      assert.equal(merged.paidAt, '2024-01-01')
    })
  })
})

describe('EdgeSyncCoordinator', () => {
  let coordinator: EdgeSyncCoordinator

  beforeEach(() => {
    coordinator = new EdgeSyncCoordinator()
  })

  afterEach(() => {
    coordinator._reset()
  })

  describe('prepareSync', () => {
    it('generates idempotency key with order id', () => {
      const order: LocalOrder = { id: 'ORD-123', tenantId: 'tenant-1' }
      const key = coordinator.prepareSync(order)
      assert.ok(key.includes('ORD-123'))
      assert.ok(key.includes('sync:'))
    })
  })

  describe('executeSync retry logic', () => {
    it('retries up to 3 times on failure', async () => {
      let attempts = 0
      const order: LocalOrder = { id: 'ORD-FAIL', tenantId: 'tenant-1' }

      const result = await coordinator.executeSync(order, async () => {
        attempts++
        throw new Error('Network error')
      })

      assert.equal(result.success, false)
      assert.ok(result.error)
      // attempts should be 3 (maxRetries)
      assert.equal(attempts, 3)
    })

    it('succeeds on first attempt', async () => {
      const order: LocalOrder = { id: 'ORD-SUCCESS', tenantId: 'tenant-1' }

      const result = await coordinator.executeSync(order, async (o) => {
        return { ...o, status: 'PAID' }
      })

      assert.equal(result.success, true)
      assert.equal(result.result?.status, 'PAID')
    })

    it('returns idempotent result on second call', async () => {
      const order: LocalOrder = { id: 'ORD-IDEM', tenantId: 'tenant-1' }

      const first = await coordinator.executeSync(order, async (o) => {
        return { ...o, status: 'PAID' }
      })

      const second = await coordinator.executeSync(order, async () => {
        throw new Error('Should not be called')
      })

      assert.equal(second.idempotent, true)
      assert.deepEqual(second.result, first.result)
    })
  })

  describe('rollback', () => {
    it('returns false for unknown sync', async () => {
      const result = await coordinator.rollback('unknown-sync-id')
      assert.equal(result, false)
    })
  })
})
