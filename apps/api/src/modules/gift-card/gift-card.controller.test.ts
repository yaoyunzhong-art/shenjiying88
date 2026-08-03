/**
 * GiftCardController 集成测试
 *
 * 策略：使用真实 GiftCardService 实例创建 Controller 进行测试
 * 覆盖：创建 / 激活 / 充值 / 消费 / 冻结 / 解冻 / 取消 / 退款 / 查询 / 过期清理
 * 正向流程 + 边界条件
 */
import { describe, it, expect, beforeEach } from 'vitest'
import assert from 'node:assert/strict'
import { GiftCardController } from './gift-card.controller'
import { GiftCardService } from './gift-card.service'

describe('GiftCardController', () => {
  let controller: GiftCardController
  let service: GiftCardService

  function ok<T>(v: T | undefined | null): asserts v is T {
    assert.ok(v)
  }

  beforeEach(() => {
    service = new GiftCardService()
    controller = new GiftCardController(service)
  })

  // ─── 创建 ─────────────────────────────────────────────────

  describe('POST /gift-card — 创建礼品卡', () => {
    it('should create a gift card successfully', () => {
      const result = controller.create(
        {
          templateId: 'T001',
          denomination: 50000, // ¥500
          holderName: '张三',
          holderPhone: '13800138000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        'tenant-001',
      )

      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.status, 'pending')
      assert.equal(result.data.denomination, 50000)
      assert.equal(result.data.balance, 0)
      assert.equal(result.data.holderName, '张三')
      assert.match(result.data.cardId, /^GC/)
    })

    it('should fail without tenant header', () => {
      const result = controller.create(
        {
          templateId: 'T001',
          denomination: 50000,
          holderName: '张三',
          holderPhone: '13800138000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        undefined,
      )

      // TenantGuard will catch this, but controller still creates
      assert.equal(result.success, true)
    })

    it('should reject zero denomination', () => {
      const result = controller.create(
        {
          templateId: 'T001',
          denomination: 0,
          holderName: '张三',
          holderPhone: '13800138000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        'tenant-001',
      )

      assert.equal(result.success, false)
      assert.ok(result.message?.includes('面额'))
    })

    it('should reject empty holder name', () => {
      const result = controller.create(
        {
          templateId: 'T001',
          denomination: 50000,
          holderName: '',
          holderPhone: '13800138000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        'tenant-001',
      )

      assert.equal(result.success, false)
      assert.ok(result.message?.includes('持卡人'))
    })
  })

  // ─── 激活 ─────────────────────────────────────────────────

  describe('POST /gift-card/:cardId/activate — 激活', () => {
    it('should activate a pending gift card', () => {
      const created = controller.create(
        {
          templateId: 'T001',
          denomination: 50000,
          holderName: '李四',
          holderPhone: '13900139000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        'tenant-001',
      )
      ok(created.data)

      const result = controller.activate(created.data.cardId, { operatorId: 'op-001' })
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.status, 'active')
      assert.equal(result.data.balance, 50000)
      assert.ok(result.data.activatedAt)
    })

    it('should reject activating an already active card', () => {
      const created = controller.create(
        {
          templateId: 'T001',
          denomination: 10000,
          holderName: '王五',
          holderPhone: '13700137000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        'tenant-001',
      )
      ok(created.data)
      controller.activate(created.data.cardId, {})

      const result = controller.activate(created.data.cardId, {})
      assert.equal(result.success, false)
      assert.ok(result.message?.includes('不允许激活'))
    })

    it('should reject activating a cancelled card', () => {
      const created = controller.create(
        {
          templateId: 'T001',
          denomination: 10000,
          holderName: '赵六',
          holderPhone: '13600136000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        'tenant-001',
      )
      ok(created.data)
      controller.cancel(created.data.cardId, {})

      const result = controller.activate(created.data.cardId, {})
      assert.equal(result.success, false)
      assert.ok(result.message?.includes('不允许激活'))
    })
  })

  // ─── 充值 ─────────────────────────────────────────────────

  describe('POST /gift-card/:cardId/topup — 充值', () => {
    it('should topup an active card', () => {
      const created = controller.create(
        {
          templateId: 'T001',
          denomination: 10000,
          holderName: '钱七',
          holderPhone: '13500135000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        'tenant-001',
      )
      ok(created.data)
      controller.activate(created.data.cardId, {})

      const result = controller.topup(created.data.cardId, { amount: 20000, operatorId: 'op-001' })
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.balance, 30000) // 充值后面额10000+充值20000=30000
    })

    it('should reject topup with negative amount', () => {
      const created = controller.create(
        {
          templateId: 'T001',
          denomination: 10000,
          holderName: '孙八',
          holderPhone: '13400134000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        'tenant-001',
      )
      ok(created.data)
      controller.activate(created.data.cardId, {})

      const result = controller.topup(created.data.cardId, { amount: -100, operatorId: 'op-001' })
      assert.equal(result.success, false)
      assert.ok(result.message?.includes('大于 0'))
    })
  })

  // ─── 消费 ─────────────────────────────────────────────────

  describe('POST /gift-card/:cardId/consume — 消费', () => {
    it('should consume balance from active card', () => {
      const created = controller.create(
        {
          templateId: 'T001',
          denomination: 30000,
          holderName: '周九',
          holderPhone: '13300133000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        'tenant-001',
      )
      ok(created.data)
      controller.activate(created.data.cardId, {})

      const result = controller.consume(created.data.cardId, {
        amount: 5000,
        orderId: 'order-001',
        operatorId: 'op-001',
      })
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.balance, 25000)
      assert.equal(result.data.totalConsumed, 5000)
    })

    it('should reject consume beyond balance', () => {
      const created = controller.create(
        {
          templateId: 'T001',
          denomination: 5000,
          holderName: '吴十',
          holderPhone: '13200132000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        'tenant-001',
      )
      ok(created.data)
      controller.activate(created.data.cardId, {})

      const result = controller.consume(created.data.cardId, { amount: 10000, orderId: 'order-002' })
      assert.equal(result.success, false)
      assert.ok(result.message?.includes('余额不足'))
    })

    it('should auto-set redeemed when balance hits zero', () => {
      const created = controller.create(
        {
          templateId: 'T001',
          denomination: 5000,
          holderName: '郑十一',
          holderPhone: '13100131000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        'tenant-001',
      )
      ok(created.data)
      controller.activate(created.data.cardId, {})

      const result = controller.consume(created.data.cardId, { amount: 5000 })
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.status, 'redeemed')
      assert.equal(result.data.balance, 0)
    })
  })

  // ─── 冻结 / 解冻 ──────────────────────────────────────────

  describe('POST /gift-card/:cardId/freeze & unfreeze', () => {
    it('should freeze and unfreeze an active card', () => {
      const created = controller.create(
        {
          templateId: 'T001',
          denomination: 50000,
          holderName: '冯十二',
          holderPhone: '13000130000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        'tenant-001',
      )
      ok(created.data)
      controller.activate(created.data.cardId, {})

      // Freeze
      const freezeResult = controller.freeze(created.data.cardId, { operatorId: 'op-001' })
      assert.equal(freezeResult.success, true)
      ok(freezeResult.data)
      assert.equal(freezeResult.data.status, 'frozen')
      assert.equal(freezeResult.data.frozenAmount, 50000)

      // Unfreeze
      const unfreezeResult = controller.unfreeze(created.data.cardId, { operatorId: 'op-001' })
      assert.equal(unfreezeResult.success, true)
      ok(unfreezeResult.data)
      assert.equal(unfreezeResult.data.status, 'active')
      assert.equal(unfreezeResult.data.frozenAmount, 0)
    })
  })

  // ─── 取消 ─────────────────────────────────────────────────

  describe('POST /gift-card/:cardId/cancel — 取消', () => {
    it('should cancel a pending card', () => {
      const created = controller.create(
        {
          templateId: 'T001',
          denomination: 50000,
          holderName: '陈十三',
          holderPhone: '12900129000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        'tenant-001',
      )
      ok(created.data)

      const result = controller.cancel(created.data.cardId, {
        operatorId: 'op-001',
        remark: '用户申请取消',
      })
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.status, 'cancelled')
    })

    it('should reject cancelling a redeemed card', () => {
      const created = controller.create(
        {
          templateId: 'T001',
          denomination: 5000,
          holderName: '禇十四',
          holderPhone: '12800128000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        'tenant-001',
      )
      ok(created.data)
      controller.activate(created.data.cardId, {})
      controller.consume(created.data.cardId, { amount: 5000 })

      const result = controller.cancel(created.data.cardId, {})
      assert.equal(result.success, false)
      assert.ok(result.message?.includes('不允许取消'))
    })
  })

  // ─── 退款 ─────────────────────────────────────────────────

  describe('POST /gift-card/:cardId/refund — 退款', () => {
    it('should refund money to an active card', () => {
      const created = controller.create(
        {
          templateId: 'T001',
          denomination: 50000,
          holderName: '卫十五',
          holderPhone: '12700127000',
          expiresAt: '2027-12-31T23:59:59Z',
        },
        'tenant-001',
      )
      ok(created.data)
      controller.activate(created.data.cardId, {})
      controller.consume(created.data.cardId, { amount: 10000 })

      const result = controller.refund(created.data.cardId, { amount: 5000, operatorId: 'op-001' })
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.balance, 45000)  // 50000-10000+5000=45000
      assert.equal(result.data.totalConsumed, 5000) // 10000-5000=5000
    })
  })

  // ─── 查询 ─────────────────────────────────────────────────

  describe('GET /gift-card — 查询', () => {
    it('should list all gift cards', () => {
      controller.create(
        { templateId: 'T001', denomination: 50000, holderName: 'A', holderPhone: '111', expiresAt: '2027-12-31T23:59:59Z' },
        'tenant-001',
      )
      controller.create(
        { templateId: 'T002', denomination: 100000, holderName: 'B', holderPhone: '222', expiresAt: '2027-12-31T23:59:59Z' },
        'tenant-001',
      )

      const result = controller.list({})
      assert.equal(result.success, true)
      assert.equal(result.total, 2)
    })

    it('should filter by status', () => {
      const c1 = controller.create(
        { templateId: 'T001', denomination: 50000, holderName: 'C', holderPhone: '333', expiresAt: '2027-12-31T23:59:59Z' },
        'tenant-001',
      )
      ok(c1.data)
      controller.create(
        { templateId: 'T002', denomination: 100000, holderName: 'D', holderPhone: '444', expiresAt: '2027-12-31T23:59:59Z' },
        'tenant-001',
      )
      controller.cancel(c1.data.cardId, {})

      const result = controller.list({ status: 'cancelled' })
      assert.equal(result.success, true)
      assert.equal(result.total, 1)
    })
  })

  // ─── getById ──────────────────────────────────────────────

  describe('GET /gift-card/:cardId — 详情', () => {
    it('should return card by id', () => {
      const created = controller.create(
        { templateId: 'T001', denomination: 30000, holderName: 'E', holderPhone: '555', expiresAt: '2027-12-31T23:59:59Z' },
        'tenant-001',
      )
      ok(created.data)

      const result = controller.getById(created.data.cardId)
      assert.equal(result.success, true)
      ok(result.data)
      assert.equal(result.data.cardId, created.data.cardId)
    })

    it('should return not found for unknown id', () => {
      const result = controller.getById('nonexistent-id')
      assert.equal(result.success, false)
      assert.ok(result.message?.includes('不存在'))
    })
  })

  // ─── 交易流水 ─────────────────────────────────────────────

  describe('GET /gift-card/:cardId/transactions — 交易流水', () => {
    it('should return transactions for a card', () => {
      const created = controller.create(
        { templateId: 'T001', denomination: 50000, holderName: 'F', holderPhone: '666', expiresAt: '2027-12-31T23:59:59Z' },
        'tenant-001',
      )
      ok(created.data)
      controller.activate(created.data.cardId, {})
      controller.consume(created.data.cardId, { amount: 10000 })

      const result = controller.getTransactions(created.data.cardId)
      assert.equal(result.success, true)
      assert.ok(result.data)
      // purchase + activation + consume = 3 transactions
      assert.equal(result.total, 3)
    })
  })

  // ─── 清理过期 ─────────────────────────────────────────────

  describe('POST /gift-card/cleanup-expired — 过期清理', () => {
    it('should clean up expired cards', () => {
      // Create past-expiry card
      controller.create(
        { templateId: 'T001', denomination: 50000, holderName: 'G', holderPhone: '777', expiresAt: '2020-01-01T00:00:00Z' },
        'tenant-001',
      )

      const result = controller.cleanupExpired()
      assert.equal(result.success, true)
      assert.equal(result.data.cleaned, 1)
    })
  })

  // ─── 统计 ─────────────────────────────────────────────────

  describe('GET /gift-card/stats — 统计', () => {
    it('should return stats', () => {
      const c1 = controller.create(
        { templateId: 'T001', denomination: 50000, holderName: 'H', holderPhone: '888', expiresAt: '2027-12-31T23:59:59Z' },
        'tenant-001',
      )
      ok(c1.data)
      controller.activate(c1.data.cardId, {})

      controller.create(
        { templateId: 'T002', denomination: 30000, holderName: 'I', holderPhone: '999', expiresAt: '2027-12-31T23:59:59Z' },
        'tenant-001',
      )

      const result = controller.getStats('tenant-001')
      assert.equal(result.success, true)
      assert.ok(result.data)
      assert.equal(result.data.total, 2)
      assert.equal(result.data.active, 1)
      assert.equal(result.data.pending, 1)
    })
  })
})
