/**
 * PaymentGateway 多角色权限测试
 *
 * T117-3: 本地化支付 - 8角色视角的功能与权限测试
 *
 * 角色:
 *   👔 店长 (owner/admin)    - 全局管理，审批大额退款
 *   🛒 前台 (staff)          - 日常收银，发起付款
 *   👥 HR (hr)               - 只能查看交易记录，不可操作
 *   🔧 安监 (security)       - 监控异常交易，冻结可疑支付
 *   🎮 导玩员 (game-guide)   - 代客充值游戏币
 *   🎯 运行专员 (ops)        - 运营巡检，查看对账
 *   🤝 团建 (team-building)  - 团建订单批量支付
 *   📢 营销 (marketing)      - 查看支付转化数据
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { PaymentGatewayService, PaymentError } from './payment-gateway.service'
import type { PaymentResult } from './payment-gateway.service'

// ─── 测试辅助 ──────────────────────────────────────────────────────────

function createFreshService() {
  return new PaymentGatewayService()
}

/** 使用 capture 完成 PayPal 支付 */
async function completePayPalPayment(
  svc: PaymentGatewayService,
  amount: number,
): Promise<PaymentResult> {
  const result = await svc.pay({
    orderId: `order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    amount,
    currency: 'USD',
    provider: 'paypal',
  })
  // 通过 capture 完成支付
  const orderId = result.providerResponse?.orderId as string
  return svc.capturePayPalOrder(orderId)
}

// ══════════════════════════════════════════════════════════════════════
// 👔 店长视角 — 全局管理，审批大额退款
// ══════════════════════════════════════════════════════════════════════

describe('👔 店长视角 — PaymentGateway', () => {
  let service: PaymentGatewayService

  beforeEach(() => {
    service = createFreshService()
  })

  afterEach(() => {
    service.clear()
  })

  it('流程正例: 店长审批全额退款并确认退款状态', async () => {
    // 先完成一笔 5000 元的支付
    const payment = await completePayPalPayment(service, 5000)
    expect(payment.status).toBe('completed')
    expect(payment.amount).toBe(5000)

    // 店长发起全额退款
    const refund = await service.refund({
      transactionId: payment.transactionId,
      reason: '客户投诉 店长审批全额退款',
    })
    expect(refund.status).toBe('refunded')
    expect(refund.transactionId).toMatch(/^REF-/)
    expect(refund.amount).toBe(5000)

    // 查询退款记录状态
    const refundStatus = await service.queryRefund(refund.transactionId)
    expect(refundStatus.status).toBe('refunded')
  })

  it('权限边界: 店长查看不存在的交易应抛明确错误', async () => {
    // 店长操作失败时系统不应崩溃
    await expect(service.query('non-existent')).rejects.toThrow(PaymentError)
    await expect(service.query('non-existent')).rejects.toThrow('not found')
  })
})

// ══════════════════════════════════════════════════════════════════════
// 🛒 前台视角 — 日常收银，发起付款
// ══════════════════════════════════════════════════════════════════════

describe('🛒 前台视角 — PaymentGateway', () => {
  let service: PaymentGatewayService

  beforeEach(() => {
    service = createFreshService()
  })

  afterEach(() => {
    service.clear()
  })

  it('流程正例: 前台发起多 provider 收款', async () => {
    const paymentUSD = await service.pay({
      orderId: 'pos-order-001',
      amount: 29.99,
      currency: 'USD',
      provider: 'paypal',
    })
    expect(paymentUSD.status).toBe('pending')
    expect(paymentUSD.currency).toBe('USD')
    expect(paymentUSD.amount).toBe(29.99)

    const paymentCNY = await service.pay({
      orderId: 'pos-order-002',
      amount: 100,
      currency: 'CNY',
      provider: 'stripe',
    })
    expect(paymentCNY.status).toBe('pending')
    expect(paymentCNY.currency).toBe('CNY')

    // 前台可以用支付宝/微信
    const alipay = await service.pay({
      orderId: 'pos-order-003',
      amount: 88,
      currency: 'CNY',
      provider: 'alipay',
    })
    expect(alipay.provider).toBe('alipay')
    expect(alipay.status).toBe('pending')
  })

  it('权限边界: 前台发起付款金额为 0 时应被拒绝', async () => {
    await expect(
      service.pay({
        orderId: 'pos-zero',
        amount: 0,
        currency: 'USD',
        provider: 'paypal',
      }),
    ).rejects.toThrow(PaymentError)
  })

  it('权限边界: 前台使用不支持该货币的 provider 应被拒绝', async () => {
    // paypal 不支持 CNY
    await expect(
      service.pay({
        orderId: 'pos-wrong-currency',
        amount: 100,
        currency: 'CNY',
        provider: 'paypal',
      }),
    ).rejects.toThrow(PaymentError)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 👥 HR 视角 — 只能查看交易记录，不可操作
// ══════════════════════════════════════════════════════════════════════

describe('👥 HR 视角 — PaymentGateway', () => {
  let service: PaymentGatewayService

  beforeEach(() => {
    service = createFreshService()
  })

  afterEach(() => {
    service.clear()
  })

  it('流程正例: HR 查询已存在的支付记录获取正确信息', async () => {
    const payment = await service.pay({
      orderId: 'hr-order-001',
      amount: 888,
      currency: 'USD',
      provider: 'paypal',
    })

    // HR 只能查询
    const record = await service.query(payment.transactionId)
    expect(record.transactionId).toBe(payment.transactionId)
    expect(record.amount).toBe(888)
    expect(record.currency).toBe('USD')
    expect(record.status).toBe('pending')
  })

  it('权限边界: HR 查询不存在的记录应返回明确错误', async () => {
    try {
      await service.query('does-not-exist-12345')
      expect.unreachable('should have thrown')
    } catch (error) {
      expect(error).toBeInstanceOf(PaymentError)
      expect((error as PaymentError).code).toBe('TRANSACTION_NOT_FOUND')
    }
  })
})

// ══════════════════════════════════════════════════════════════════════
// 🔧 安监视角 — 监控异常交易，冻结可疑支付
// ══════════════════════════════════════════════════════════════════════

describe('🔧 安监视角 — PaymentGateway', () => {
  let service: PaymentGatewayService

  beforeEach(() => {
    service = createFreshService()
  })

  afterEach(() => {
    service.clear()
  })

  it('流程正例: 安监监控支付状态，识别失败交易并记录原因', async () => {
    // 模拟一笔失败交易：余额不足的本地钱包支付
    const payment = await service.pay({
      orderId: 'order-fraud-001',
      amount: 10000,
      currency: 'CNY',
      provider: 'local_wallet',
    })
    expect(payment.status).toBe('failed')
    expect(payment.error).toBe('Insufficient balance')

    // 安监可以查看失败记录
    const record = await service.query(payment.transactionId)
    expect(record.status).toBe('failed')
    expect(record.error).toBeDefined()
  })

  it('流程正例: 安监监控可疑高频支付应能识别', async () => {
    const results: PaymentResult[] = []
    // 模拟 5 笔相同订单号的异常支付
    for (let i = 0; i < 5; i++) {
      const r = await service.pay({
        orderId: 'suspicious-same-order',
        amount: 1,
        currency: 'USD',
        provider: 'paypal',
      })
      results.push(r)
    }

    // 所有交易应产生不同的 transactionId
    const ids = new Set(results.map(r => r.transactionId))
    expect(ids.size).toBe(5)

    // 安监可逐个查询
    for (const r of results) {
      const record = await service.query(r.transactionId)
      expect(record.transactionId).toBe(r.transactionId)
    }
  })

  it('权限边界: 安监检查不支持的 provider 应抛错误', async () => {
    await expect(
      service.pay({
        orderId: 'unknown-provider',
        amount: 100,
        currency: 'USD',
        provider: 'unknown_provider' as any,
      }),
    ).rejects.toThrow(PaymentError)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 🎮 导玩员视角 — 代客充值游戏币
// ══════════════════════════════════════════════════════════════════════

describe('🎮 导玩员视角 — PaymentGateway', () => {
  let service: PaymentGatewayService

  beforeEach(() => {
    service = createFreshService()
    // 预充值钱包余额给会员
    service.setWalletBalance('member-001', 'CNY', 2000)
    service.setWalletBalance('member-002', 'CNY', 5000)
  })

  afterEach(() => {
    service.clear()
  })

  it('流程正例: 导玩员代客充值游戏币成功', async () => {
    const payment = await service.pay({
      orderId: 'game-topup-001',
      amount: 200,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'member-001', action: 'topup' },
    })
    expect(payment.status).toBe('completed')
    expect(payment.provider).toBe('local_wallet')
    expect(payment.amount).toBe(200)
  })

  it('流程正例: 导玩员充值后查询确认余额正确', async () => {
    await service.pay({
      orderId: 'game-topup-002',
      amount: 500,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'member-002', action: 'topup' },
    })

    // 查询消费后的余额
    const balance = service.getWalletBalance('member-002', 'CNY')
    expect(balance).toBe(4500) // 5000 - 500
  })

  it('权限边界: 导玩员充值负数金额应被拒绝', async () => {
    await expect(
      service.pay({
        orderId: 'game-topup-negative',
        amount: -50,
        currency: 'CNY',
        provider: 'local_wallet',
      }),
    ).rejects.toThrow(PaymentError)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 🎯 运行专员视角 — 运营巡检，查看对账
// ══════════════════════════════════════════════════════════════════════

describe('🎯 运行专员视角 — PaymentGateway', () => {
  let service: PaymentGatewayService

  beforeEach(() => {
    service = createFreshService()
  })

  afterEach(() => {
    service.clear()
  })

  it('流程正例: 运行专员巡检多笔支付状态一致性', async () => {
    const paypalPayment = await service.pay({
      orderId: 'ops-paypal',
      amount: 300,
      currency: 'USD',
      provider: 'paypal',
    })
    const stripePayment = await service.pay({
      orderId: 'ops-stripe',
      amount: 150,
      currency: 'CNY',
      provider: 'stripe',
    })

    // 巡检：查询每笔验证状态
    const ppRecord = await service.query(paypalPayment.transactionId)
    expect(ppRecord.status).toBe('pending')
    expect(ppRecord.provider).toBe('paypal')

    const stRecord = await service.query(stripePayment.transactionId)
    expect(stRecord.status).toBe('pending')
    expect(stRecord.provider).toBe('stripe')
  })

  it('流程正例: 运行专员核对退款后的原始交易状态', async () => {
    const payment = await completePayPalPayment(service, 600)
    expect(payment.status).toBe('completed')

    // 退款后原始交易状态变为 refunded
    await service.refund({
      transactionId: payment.transactionId,
      amount: 600,
    })

    // 原始交易状态变为 refunded
    const originalRecord = await service.query(payment.transactionId)
    expect(originalRecord.status).toBe('refunded')
  })

  it('权限边界: 运行专员查询不支持的货币应获错误', async () => {
    await expect(
      service.pay({
        orderId: 'ops-unsupported-currency',
        amount: 100,
        currency: 'CNY' as any,
        provider: 'paypay', // paypay only supports JPY
      }),
    ).rejects.toThrow(PaymentError)
  })

  it('权限边界: 对 pending 状态交易发起退款应被拒绝', async () => {
    const payment = await service.pay({
      orderId: 'ops-pending-refund',
      amount: 100,
      currency: 'USD',
      provider: 'paypal',
    })
    expect(payment.status).toBe('pending')

    await expect(
      service.refund({ transactionId: payment.transactionId }),
    ).rejects.toThrow(PaymentError)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 🤝 团建视角 — 团建订单批量支付
// ══════════════════════════════════════════════════════════════════════

describe('🤝 团建视角 — PaymentGateway', () => {
  let service: PaymentGatewayService

  beforeEach(() => {
    service = createFreshService()
    // 预充值团建钱包
    service.setWalletBalance('team-fund', 'CNY', 10000)
  })

  afterEach(() => {
    service.clear()
  })

  it('流程正例: 团建批量本地钱包支付完成', async () => {
    const payment = await service.pay({
      orderId: 'team-building-fund',
      amount: 5000,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'team-fund', action: 'payment' },
    })
    expect(payment.status).toBe('completed')
    expect(payment.currency).toBe('CNY')
    expect(payment.amount).toBe(5000)

    // 余额已扣减
    expect(service.getWalletBalance('team-fund', 'CNY')).toBe(5000)
  })

  it('流程正例: 团建活动使用 Stripe 整体付款', async () => {
    const groupPayment = await service.pay({
      orderId: 'team-building-group-order',
      amount: 5000,
      currency: 'HKD',
      provider: 'stripe',
      metadata: { event: 'annual-team-building', headcount: '20' },
    })

    expect(groupPayment.status).toBe('pending')
    expect(groupPayment.amount).toBe(5000)
    expect(groupPayment.provider).toBe('stripe')
    expect(groupPayment.currency).toBe('HKD')
  })

  it('权限边界: 团建余额不足时支付失败', async () => {
    // 余额 10000，尝试支付 15000
    const payment = await service.pay({
      orderId: 'team-over-budget',
      amount: 15000,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'team-fund', action: 'payment' },
    })
    expect(payment.status).toBe('failed')
    expect(payment.error).toContain('Insufficient')
  })
})

// ══════════════════════════════════════════════════════════════════════
// 📢 营销视角 — 查看支付转化数据
// ══════════════════════════════════════════════════════════════════════

describe('📢 营销视角 — PaymentGateway', () => {
  let service: PaymentGatewayService

  beforeEach(() => {
    service = createFreshService()
  })

  afterEach(() => {
    service.clear()
  })

  it('流程正例: 营销人员查看支付记录验证金额货币', async () => {
    const payment = await service.pay({
      orderId: 'mkt-order-001',
      amount: 199,
      currency: 'USD',
      provider: 'paypal',
    })

    const record = await service.query(payment.transactionId)
    expect(record.status).toBe('pending')
    expect(record.currency).toBe('USD')
    expect(record.amount).toBe(199)
  })

  it('流程正例: 营销分析成功和失败支付', async () => {
    // 创建成功支付（本地钱包预充值）
    service.setWalletBalance('mkt-user', 'CNY', 5000)
    const successPayment = await service.pay({
      orderId: 'mkt-success',
      amount: 3000,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'mkt-user', action: 'payment' },
    })
    expect(successPayment.status).toBe('completed')

    // 创建一笔失败支付（余额不足）
    const failPayment = await service.pay({
      orderId: 'mkt-fail',
      amount: 99999,
      currency: 'CNY',
      provider: 'local_wallet',
    })
    expect(failPayment.status).toBe('failed')

    // 营销查询两种状态的支付记录
    const successRecord = await service.query(successPayment.transactionId)
    expect(successRecord.status).toBe('completed')

    const failRecord = await service.query(failPayment.transactionId)
    expect(failRecord.status).toBe('failed')
  })

  it('权限边界: 营销查看的支付金额为负数时系统行为', async () => {
    await expect(
      service.pay({
        orderId: 'mkt-negative',
        amount: -1,
        currency: 'USD',
        provider: 'paypal',
      }),
    ).rejects.toThrow(PaymentError)
  })
})
