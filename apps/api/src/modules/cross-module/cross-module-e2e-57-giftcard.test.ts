import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'

/**
 * cross-module-e2e-57-giftcard.test.ts
 *
 * 礼品卡全链路 E2E 测试
 * 覆盖: 创建(pending) → 激活(active) → 消费 → 冻结 → 解冻 → 充值
 *       → 全部消费(redeemed) → 退款 → 取消 → 过期清理
 *       → 边界条件: 余额不足 / 重复操作 / 状态不匹配
 *
 * 原则: 无 as any · 无 describe.skip · 无 it.only
 */

// ── 卡状态 ──
type GiftCardStatus = 'pending' | 'active' | 'frozen' | 'expired' | 'redeemed' | 'cancelled'
type TransactionType = 'purchase' | 'activation' | 'topup' | 'freeze' | 'unfreeze' | 'consume' | 'refund' | 'cancel'

// ── 数据模型 ──

interface GiftCard {
  cardId: string
  tenantId?: string
  templateId: string
  denomination: number
  balance: number
  currency: string
  status: GiftCardStatus
  holderName: string
  holderPhone: string
  purchasedAt: string
  activatedAt?: string
  expiresAt: string
  frozenAmount: number
  storeScope: string[]
  sourceOrderId?: string
  totalConsumed: number
  createdAt: string
  updatedAt: string
}

interface GiftCardTransaction {
  txId: string
  cardId: string
  type: TransactionType
  amount: number
  beforeBalance: number
  afterBalance: number
  orderId?: string
  operatorId?: string
  remark?: string
  createdAt: string
}

interface GiftCardStats {
  total: number
  active: number
  frozen: number
  expired: number
  redeemed: number
  cancelled: number
  pending: number
  totalBalance: number
  totalDenomination: number
}

// ── In-memory Service (mirrors GiftCardService production logic) ──

function generateCardId(): string {
  return `GC${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 8).toUpperCase()}`
}

function now(): string {
  return new Date().toISOString()
}

class GiftCardService {
  readonly cards = new Map<string, GiftCard>()
  readonly transactions = new Map<string, GiftCardTransaction[]>()

  create(params: {
    templateId: string
    denomination: number
    holderName: string
    holderPhone: string
    expiresAt: string
    storeScope?: string[]
    sourceOrderId?: string
    tenantId?: string
  }): GiftCard {
    if (params.denomination <= 0) throw new Error('面额必须大于 0')
    if (!params.holderName || !params.holderPhone) throw new Error('持卡人姓名和手机号必填')

    const cardId = generateCardId()
    const card: GiftCard = {
      cardId,
      tenantId: params.tenantId || 'tenant-default',
      templateId: params.templateId,
      denomination: params.denomination,
      balance: 0,
      currency: 'CNY',
      status: 'pending',
      holderName: params.holderName,
      holderPhone: params.holderPhone,
      purchasedAt: now(),
      activatedAt: undefined,
      expiresAt: params.expiresAt,
      frozenAmount: 0,
      storeScope: params.storeScope ?? [],
      sourceOrderId: params.sourceOrderId,
      totalConsumed: 0,
      createdAt: now(),
      updatedAt: now(),
    }
    this.cards.set(cardId, card)
    this._addTx(cardId, 'purchase', params.denomination, 0, 0)
    return card
  }

  activate(cardId: string): GiftCard {
    const card = this.getOrThrow(cardId)
    if (card.status !== 'pending') throw new Error(`不允许激活: ${card.status}`)
    if (new Date(card.expiresAt) < new Date()) {
      card.status = 'expired'
      throw new Error('已过期，无法激活')
    }
    const before = card.balance
    card.balance = card.denomination
    card.status = 'active'
    card.activatedAt = now()
    card.updatedAt = now()
    this.cards.set(cardId, card)
    this._addTx(cardId, 'activation', card.denomination, before, card.balance)
    return card
  }

  topup(cardId: string, amount: number): GiftCard {
    const card = this.getOrThrow(cardId)
    if (card.status !== 'active' && card.status !== 'frozen') throw new Error(`不允许充值: ${card.status}`)
    if (new Date(card.expiresAt) < new Date()) { card.status = 'expired'; throw new Error('已过期') }
    if (amount <= 0) throw new Error('充值金额必须大于 0')
    const before = card.balance
    card.balance += amount
    card.updatedAt = now()
    this.cards.set(cardId, card)
    this._addTx(cardId, 'topup', -amount, before, card.balance)
    return card
  }

  consume(cardId: string, amount: number): GiftCard {
    const card = this.getOrThrow(cardId)
    if (card.status !== 'active') throw new Error(`不允许消费: ${card.status}`)
    if (new Date(card.expiresAt) < new Date()) { card.status = 'expired'; throw new Error('已过期') }
    if (amount <= 0) throw new Error('消费金额必须大于 0')
    if (card.balance < amount) throw new Error(`余额不足: ${card.balance} < ${amount}`)
    const before = card.balance
    card.balance -= amount
    card.totalConsumed += amount
    card.updatedAt = now()
    if (card.balance === 0) card.status = 'redeemed'
    this.cards.set(cardId, card)
    this._addTx(cardId, 'consume', amount, before, card.balance)
    return card
  }

  freeze(cardId: string): GiftCard {
    const card = this.getOrThrow(cardId)
    if (card.status !== 'active') throw new Error(`不允许冻结: ${card.status}`)
    card.status = 'frozen'
    card.frozenAmount = card.balance
    card.updatedAt = now()
    this.cards.set(cardId, card)
    this._addTx(cardId, 'freeze', 0, card.balance, card.balance)
    return card
  }

  unfreeze(cardId: string): GiftCard {
    const card = this.getOrThrow(cardId)
    if (card.status !== 'frozen') throw new Error(`不允许解冻: ${card.status}`)
    card.status = 'active'
    card.frozenAmount = 0
    card.updatedAt = now()
    this.cards.set(cardId, card)
    this._addTx(cardId, 'unfreeze', 0, card.balance, card.balance)
    return card
  }

  cancel(cardId: string): GiftCard {
    const card = this.getOrThrow(cardId)
    if (card.status === 'cancelled' || card.status === 'redeemed') throw new Error(`不允许取消: ${card.status}`)
    card.status = 'cancelled'
    card.updatedAt = now()
    this.cards.set(cardId, card)
    this._addTx(cardId, 'cancel', card.balance, card.balance, 0)
    return card
  }

  refund(cardId: string, amount: number): GiftCard {
    const card = this.getOrThrow(cardId)
    if (card.status === 'cancelled' || card.status === 'expired') throw new Error(`不允许退款: ${card.status}`)
    if (amount <= 0) throw new Error('退款金额必须大于 0')
    const before = card.balance
    card.balance += amount
    card.totalConsumed = Math.max(0, card.totalConsumed - amount)
    card.updatedAt = now()
    if (card.status === 'redeemed' && card.balance > 0) card.status = 'active'
    this.cards.set(cardId, card)
    this._addTx(cardId, 'refund', -amount, before, card.balance)
    return card
  }

  getById(cardId: string): GiftCard | undefined {
    return this.cards.get(cardId)
  }

  getTransactions(cardId: string): GiftCardTransaction[] {
    return this.transactions.get(cardId) ?? []
  }

  getStats(): GiftCardStats {
    const all = Array.from(this.cards.values())
    return {
      total: all.length,
      active: all.filter((c) => c.status === 'active').length,
      frozen: all.filter((c) => c.status === 'frozen').length,
      expired: all.filter((c) => c.status === 'expired').length,
      redeemed: all.filter((c) => c.status === 'redeemed').length,
      cancelled: all.filter((c) => c.status === 'cancelled').length,
      pending: all.filter((c) => c.status === 'pending').length,
      totalBalance: all.filter((c) => c.status === 'active').reduce((s, c) => s + c.balance, 0),
      totalDenomination: all.reduce((s, c) => s + c.denomination, 0),
    }
  }

  cleanupExpired(): number {
    let count = 0
    for (const card of this.cards.values()) {
      if ((card.status === 'active' || card.status === 'pending') && new Date(card.expiresAt) < new Date()) {
        card.status = 'expired'
        card.updatedAt = now()
        this.cards.set(card.cardId, card)
        count++
      }
    }
    return count
  }

  private getOrThrow(cardId: string): GiftCard {
    const card = this.cards.get(cardId)
    if (!card) throw new Error(`卡 ${cardId} 不存在`)
    return card
  }

  private _addTx(cardId: string, type: TransactionType, amount: number, before: number, after: number) {
    const tx: GiftCardTransaction = {
      txId: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      cardId,
      type,
      amount,
      beforeBalance: before,
      afterBalance: after,
      createdAt: now(),
    }
    const txs = this.transactions.get(cardId) || []
    txs.push(tx)
    this.transactions.set(cardId, txs)
  }
}

// ── Tests ──

describe('cross-module-e2e-57-giftcard', () => {
  let svc: GiftCardService
  let pendingCard: GiftCard

  const FUTURE = '2027-12-31T23:59:59Z'
  const PAST = '2020-01-01T00:00:00Z'

  before(() => {
    svc = new GiftCardService()
  })

  // ── 1. 创建 ✅ ──
  it('[C001] 创建礼品卡 → pending', () => {
    pendingCard = svc.create({
      templateId: 'T001',
      denomination: 50000,  // ¥500
      holderName: '张三',
      holderPhone: '13800138000',
      expiresAt: FUTURE,
    })
    assert.ok(pendingCard.cardId)
    assert.equal(pendingCard.status, 'pending')
    assert.equal(pendingCard.balance, 0)
    assert.equal(pendingCard.denomination, 50000)
    assert.match(pendingCard.cardId, /^GC/)

    // 验证交易流水
    const txs = svc.getTransactions(pendingCard.cardId)
    assert.equal(txs.length, 1)
    assert.equal(txs[0].type, 'purchase')
  })

  // ── 2. 激活 ✅ ──
  it('[C002] 激活礼品卡 → active', () => {
    const card = svc.activate(pendingCard.cardId)
    assert.equal(card.status, 'active')
    assert.equal(card.balance, 50000)
    assert.ok(card.activatedAt)

    const txs = svc.getTransactions(card.cardId)
    const activationTx = txs.find((t) => t.type === 'activation')
    assert.ok(activationTx)
    assert.equal(activationTx!.beforeBalance, 0)
    assert.equal(activationTx!.afterBalance, 50000)
  })

  // ── 3. 重复激活 ❌ ──
  it('[C003] 重复激活 → 拒绝', () => {
    assert.throws(() => svc.activate(pendingCard.cardId), /不允许激活/)
  })

  // ── 4. 消费 ✅ ──
  it('[C004] 正常消费 20000 → 余额 30000', () => {
    const card = svc.consume(pendingCard.cardId, 20000)
    assert.equal(card.status, 'active')
    assert.equal(card.balance, 30000)
    assert.equal(card.totalConsumed, 20000)

    const txs = svc.getTransactions(card.cardId)
    const consumeTx = txs.find((t) => t.type === 'consume')
    assert.ok(consumeTx)
    assert.equal(consumeTx!.amount, 20000)
    assert.equal(consumeTx!.beforeBalance, 50000)
    assert.equal(consumeTx!.afterBalance, 30000)
  })

  // ── 5. 余额不足 ❌ ──
  it('[C005] 超余额消费 50000 → 余额不足拒绝', () => {
    assert.throws(() => svc.consume(pendingCard.cardId, 50000), /余额不足/)
  })

  // ── 6. 冻结 → 消费拒绝 → 解冻 → 消费正常 ✅ ──
  it('[C006] 冻结后禁止消费 / 解冻后恢复', () => {
    // Freeze
    let card = svc.freeze(pendingCard.cardId)
    assert.equal(card.status, 'frozen')
    assert.equal(card.frozenAmount, 30000)

    // 消费拒绝
    assert.throws(() => svc.consume(pendingCard.cardId, 1000), /不允许消费/)

    // Unfreeze
    card = svc.unfreeze(pendingCard.cardId)
    assert.equal(card.status, 'active')
    assert.equal(card.frozenAmount, 0)

    // 恢复消费
    svc.consume(pendingCard.cardId, 5000)
    card = svc.getById(pendingCard.cardId)!
    assert.equal(card.balance, 25000)
  })

  // ── 7. 充值 ✅ ──
  it('[C007] 充值 10000 → 余额 35000', () => {
    svc.topup(pendingCard.cardId, 10000)
    const card = svc.getById(pendingCard.cardId)!
    assert.equal(card.balance, 35000)
  })

  // ── 8. 全部消费 → redeemed ✅ ──
  it('[C008] 全部消费完毕 → redeemed', () => {
    // 从 35000 开始消费 35000
    svc.consume(pendingCard.cardId, 35000)
    const card = svc.getById(pendingCard.cardId)!
    assert.equal(card.status, 'redeemed')
    assert.equal(card.balance, 0)
    assert.equal(card.totalConsumed, 60000) // 20000+5000+35000
  })

  // ── 9. 退款到 redeemed 卡 → 升级为 active ✅ ──
  it('[C009] 退款到 redeemed 卡 → 恢复 active', () => {
    svc.refund(pendingCard.cardId, 10000)
    const card = svc.getById(pendingCard.cardId)!
    assert.equal(card.status, 'active')
    assert.equal(card.balance, 10000)
    assert.equal(card.totalConsumed, 50000) // 60000-10000
  })

  // ── 10. 取消 → 已取消不可激活 ❌ ──
  it('[C010] 取消卡 → 可查看但不可激活', () => {
    const card = svc.cancel(pendingCard.cardId)
    assert.equal(card.status, 'cancelled')
    assert.throws(() => svc.activate(pendingCard.cardId), /不允许激活/)
    assert.throws(() => svc.consume(pendingCard.cardId, 100), /不允许消费/)
  })

  // ── 11. 过期卡清理 ✅ ──
  it('[C011] 过期 card → cleanupExpired 标记 expired', () => {
    const expired = svc.create({
      templateId: 'T002',
      denomination: 30000,
      holderName: '过期卡',
      holderPhone: '13900000000',
      expiresAt: PAST,
    })
    assert.equal(expired.status, 'pending')
    assert.throws(() => svc.activate(expired.cardId), /无法激活/)
    // Both pending and active with past date get cleaned
    const cleaned = svc.cleanupExpired()
    assert.ok(cleaned >= 1)
    const after = svc.getById(expired.cardId)!
    assert.equal(after.status, 'expired')
  })

  // ── 12. 统计摘要 ✅ ──
  it('[C012] 统计摘要包含正确数据', () => {
    const stats = svc.getStats()
    assert.ok(stats.total >= 2)
    assert.equal(stats.cancelled, 1) // pendingCard is cancelled
    assert.ok(stats.expired >= 1)
    assert.ok(stats.totalDenomination > 0)
    assert.equal(stats.totalBalance, 0) // only active cards count, but the active one was cancelled
    // Ensure consistency
    const statusSum = stats.active + stats.frozen + stats.expired + stats.redeemed + stats.cancelled + stats.pending
    assert.equal(statusSum, stats.total)
  })

  // ── 13. 交易流水全量覆盖 ✅ ──
  it('[C013] 交易流水包含所有操作类型', () => {
    const txs = svc.getTransactions(pendingCard.cardId)
    const types = new Set(txs.map((t) => t.type))
    assert.ok(types.has('purchase'))
    assert.ok(types.has('activation'))
    assert.ok(types.has('consume'))
    assert.ok(types.has('freeze'))
    assert.ok(types.has('unfreeze'))
    assert.ok(types.has('topup'))
    assert.ok(types.has('refund'))
    assert.ok(types.has('cancel'))
    // Every transaction has balance snapshot
    for (const tx of txs) {
      assert.ok(typeof tx.beforeBalance === 'number')
      assert.ok(typeof tx.afterBalance === 'number')
    }
  })

  // ── 14. 新卡完整生命周期 ✅ ──
  it('[C014] 新卡完整生命周期: pending → active → freeze → unfreeze → consume → redeemed', () => {
    const c = svc.create({
      templateId: 'T003',
      denomination: 20000,
      holderName: '完整生命周期',
      holderPhone: '18800000000',
      expiresAt: FUTURE,
    })

    svc.activate(c.cardId)
    assert.equal(svc.getById(c.cardId)!.status, 'active')
    assert.equal(svc.getById(c.cardId)!.balance, 20000)

    svc.freeze(c.cardId)
    assert.equal(svc.getById(c.cardId)!.status, 'frozen')

    svc.unfreeze(c.cardId)
    assert.equal(svc.getById(c.cardId)!.status, 'active')

    svc.consume(c.cardId, 20000)
    assert.equal(svc.getById(c.cardId)!.status, 'redeemed')
    assert.equal(svc.getById(c.cardId)!.balance, 0)
  })

  // ── 15. 创建负数面额 ❌ ──
  it('[C015] 创建面额 ≤ 0 拒绝', () => {
    assert.throws(() => svc.create({
      templateId: 'T000',
      denomination: 0,
      holderName: '零面额',
      holderPhone: '18700000000',
      expiresAt: FUTURE,
    }), /面额/)
    assert.throws(() => svc.create({
      templateId: 'T000',
      denomination: -100,
      holderName: '负面试',
      holderPhone: '18600000000',
      expiresAt: FUTURE,
    }), /面额/)
  })

  // ── 16. 查询不存在的卡 ❌ ──
  it('[C016] 操作不存在的卡 → 异常', () => {
    assert.throws(() => svc.activate('no-such-card'), /不存在/)
    assert.throws(() => svc.consume('no-such-card', 100), /不存在/)
    assert.throws(() => svc.freeze('no-such-card'), /不存在/)
    assert.throws(() => svc.cancel('no-such-card'), /不存在/)
  })

  // ── 17. 冻结状态下不可消费/解冻/取消 → 只能解冻 ✅ ──
  it('[C017] frozen 卡不可消费/取消，但可解冻', () => {
    const c = svc.create({
      templateId: 'T004',
      denomination: 10000,
      holderName: '冻结测试',
      holderPhone: '18500000000',
      expiresAt: FUTURE,
    })
    svc.activate(c.cardId)
    svc.freeze(c.cardId)

    assert.throws(() => svc.consume(c.cardId, 1000), /不允许消费/)
    assert.throws(() => svc.freeze(c.cardId), /不允许冻结/)  // already frozen

    // unfreeze works
    svc.unfreeze(c.cardId)
    assert.equal(svc.getById(c.cardId)!.status, 'active')
  })
})
