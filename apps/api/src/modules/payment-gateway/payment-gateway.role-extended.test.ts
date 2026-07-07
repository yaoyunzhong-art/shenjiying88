import { describe, it, expect, beforeEach } from 'vitest'
import { PaymentGatewayService, type PaymentRequest } from './payment-gateway.service'

/**
 * 🐜 [payment-gateway] 角色扩展测试 (修复版)
 * 覆盖支付、退款、查询、钱包、边界场景
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 每个角色 ≥ 2 测试用例 (正常流程 + 权限/边界)
 *
 * 实际 API: pay(PaymentRequest) -> 结果 (status=pending for third-party, completed for local_wallet)
 *           query(txnId) / refund(RefundRequest) / queryRefund(refundId)
 *           getSupportedProviders(countryCode) / setWalletBalance / getWalletBalance
 *           getAllTransactions() / capturePayPalOrder(orderId)
 */

function setup() {
  const service = new PaymentGatewayService()
  service.setWalletBalance('default-user', 'CNY', 100000)
  return { service }
}

// ── 辅助：使用本地钱包创建已完成支付 ──
async function createWalletPayment(service: PaymentGatewayService, overrides: Partial<PaymentRequest> = {}) {
  const req: PaymentRequest = {
    orderId: `wallet-order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    amount: 5000,
    currency: 'CNY',
    provider: 'local_wallet',
    ...overrides,
  }
  return service.pay(req)
}

// ═══════════════════════════════════════════════════════════
// 👔 店长 - 日常运营 & 概览
// ═══════════════════════════════════════════════════════════
describe('👔店长 payment-gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('发起本地钱包支付并查询结果', async () => {
    svc.service.setWalletBalance('store-mgr', 'CNY', 20000)
    const result = await svc.service.pay({
      orderId: 'order-store-001',
      amount: 10000,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'store-mgr' },
    })
    expect(result.transactionId).toBeTruthy()
    expect(result.transactionId).toMatch(/^TXN-/)
    expect(result.status).toBe('completed')
    expect(result.amount).toBe(10000)
    expect(result.currency).toBe('CNY')

    // 查询交易
    const query = await svc.service.query(result.transactionId)
    expect(query.transactionId).toBe(result.transactionId)
    expect(query.status).toBe('completed')
  })

  it('门店支持地区支付方式检查', () => {
    const cnProviders = svc.service.getSupportedProviders('CN')
    expect(cnProviders).toContain('alipay')
    expect(cnProviders).toContain('wechat_pay')
    expect(cnProviders).toContain('local_wallet')

    const jpProviders = svc.service.getSupportedProviders('JP')
    expect(jpProviders).toContain('paypay')
    expect(jpProviders).toContain('local_wallet')

    const sgProviders = svc.service.getSupportedProviders('SG')
    expect(sgProviders.length).toBeGreaterThan(0)
  })
})

// ═══════════════════════════════════════════════════════════
// 🛒 前台 - 收银 & 退款
// ═══════════════════════════════════════════════════════════
describe('🛒前台 payment-gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => {
    svc = setup()
    svc.service.setWalletBalance('cashier-user', 'CNY', 50000)
  })

  it('第三方支付返回 pending，然后查询', async () => {
    const result = await svc.service.pay({
      orderId: 'front-order-001',
      amount: 2000,
      currency: 'CNY',
      provider: 'wechat_pay',
    })
    // 第三方支付初始状态为 pending
    expect(result.status).toBe('pending')
    expect(result.provider).toBe('wechat_pay')
    expect(result.amount).toBe(2000)

    // 可以查询
    const query = await svc.service.query(result.transactionId)
    expect(query.transactionId).toBe(result.transactionId)
    expect(query.status).toBe('pending')
  })

  it('本地钱包退款流程', async () => {
    const payResult = await createWalletPayment(svc.service, { amount: 3000 })
    expect(payResult.status).toBe('completed')

    const refund = await svc.service.refund({
      transactionId: payResult.transactionId,
      amount: 3000,
      reason: '客户退货',
    })
    expect(refund.status).toBe('refunded')
    expect(refund.amount).toBe(3000)

    // 查询退款
    const refundQuery = await svc.service.queryRefund(refund.transactionId)
    expect(refundQuery.status).toBe('refunded')
  })
})

// ═══════════════════════════════════════════════════════════
// 👥 HR - 权限 & 员工钱包
// ═══════════════════════════════════════════════════════════
describe('👥HR payment-gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('员工本地钱包充值查询', () => {
    svc.service.setWalletBalance('emp-001', 'CNY', 50000)
    const bal = svc.service.getWalletBalance('emp-001', 'CNY')
    expect(bal).toBe(50000)

    // 未充值的币种返回 0
    const usdBal = svc.service.getWalletBalance('emp-001', 'USD')
    expect(usdBal).toBe(0)
  })

  it('钱包余额不足时本地钱包支付失败', async () => {
    svc.service.setWalletBalance('emp-002', 'CNY', 100)
    const pay = await svc.service.pay({
      orderId: 'order-hr-001',
      amount: 200,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'emp-002' },
    })
    expect(pay.status).toBe('failed')
    expect(pay.error).toContain('Insufficient')
  })
})

// ═══════════════════════════════════════════════════════════
// 🔧 安监 - 异常检测 & 安全边界
// ═══════════════════════════════════════════════════════════
describe('🔧安监 payment-gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('查询不存在的交易应报错 (PaymentError)', async () => {
    await expect(
      svc.service.query('no-such-txn-123')
    ).rejects.toThrow(/not found/)
  })

  it('部分退款后检查金额', async () => {
    svc.service.setWalletBalance('sec-user', 'CNY', 20000)
    const pay = await svc.service.pay({
      orderId: 'sec-pay-001',
      amount: 10000,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'sec-user' },
    })
    expect(pay.status).toBe('completed')

    // 部分退款
    const refund = await svc.service.refund({
      transactionId: pay.transactionId,
      amount: 3000,
      reason: '部分退货',
    })
    expect(refund.amount).toBe(3000)

    // 超额退款
    await expect(
      svc.service.refund({ transactionId: pay.transactionId, amount: 99999 })
    ).rejects.toThrow(/exceeds/)
  })
})

// ═══════════════════════════════════════════════════════════
// 🎮 导玩员 - 小额支付 & 游戏充值
// ═══════════════════════════════════════════════════════════
describe('🎮导玩员 payment-gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('游戏小额充值 (本地钱包)', async () => {
    svc.service.setWalletBalance('gamer-001', 'CNY', 1000)
    const result = await svc.service.pay({
      orderId: 'game-topup-001',
      amount: 100,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'gamer-001', gameId: 'g01' },
    })
    expect(result.status).toBe('completed')
    expect(result.amount).toBe(100)

    // 余额已扣减
    expect(svc.service.getWalletBalance('gamer-001', 'CNY')).toBe(900)
  })

  it('PayPal 美元游戏充值', async () => {
    const orderId = 'game-usd-001'
    const result = await svc.service.pay({
      orderId,
      amount: 999,
      currency: 'USD',
      provider: 'paypal',
    })
    expect(result.status).toBe('pending')
    expect(result.currency).toBe('USD')
    expect(result.provider).toBe('paypal')
    expect(result.providerResponse).toBeTruthy()

    // capturePayPalOrder 需要 providerResponse.orderId (格式: PP-{orderId}-{ts})
    const ppOrderId = (result.providerResponse as Record<string, unknown>)?.orderId as string
    expect(ppOrderId).toMatch(/^PP-/)
    const captured = await svc.service.capturePayPalOrder(ppOrderId)
    expect(captured.status).toBe('completed')
  })
})

// ═══════════════════════════════════════════════════════════
// 🎯 运行专员 - 多渠道 & webhook
// ═══════════════════════════════════════════════════════════
describe('🎯运行专员 payment-gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('多渠道支付 (pending 状态验证)', async () => {
    const wx = await svc.service.pay({
      orderId: 'ops-wechat-001',
      amount: 100, currency: 'CNY', provider: 'wechat_pay',
    })
    expect(wx.status).toBe('pending')

    const ali = await svc.service.pay({
      orderId: 'ops-alipay-001',
      amount: 200, currency: 'CNY', provider: 'alipay',
    })
    expect(ali.status).toBe('pending')

    // 多渠道交易 ID 不同
    expect(wx.transactionId).not.toBe(ali.transactionId)
  })

  it('webhook 验证', async () => {
    const valid = await svc.service.verifyWebhook(
      'alipay',
      JSON.stringify({ trade_status: 'TRADE_SUCCESS' }),
      { 'x-signature': 'test-sig' },
    )
    expect(valid).toBe(true)

    // 无签名头
    const noSig = await svc.service.verifyWebhook(
      'wechat_pay',
      JSON.stringify({}),
      {},
    )
    expect(noSig).toBe(false)

    // local_wallet 总是 true
    const lw = await svc.service.verifyWebhook('local_wallet', '', {})
    expect(lw).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════
// 🤝 团建 - 活动资金 & 多币种
// ═══════════════════════════════════════════════════════════
describe('🤝团建 payment-gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('团建采购 (本地钱包)', async () => {
    svc.service.setWalletBalance('team-budget', 'CNY', 100000)
    const result = await svc.service.pay({
      orderId: 'team-building-001',
      amount: 50000,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'team-budget', event: 'annual-party' },
    })
    expect(result.status).toBe('completed')
    expect(result.amount).toBe(50000)

    // 余额扣减
    expect(svc.service.getWalletBalance('team-budget', 'CNY')).toBe(50000)
  })

  it('多币种支付支持验证', async () => {
    const thP = svc.service.getSupportedProviders('TH')
    expect(thP.length).toBeGreaterThan(0)

    // 多笔 pending 支付
    const results = await Promise.all([
      svc.service.pay({ orderId: 'team-001', amount: 1000, currency: 'CNY', provider: 'alipay' }),
      svc.service.pay({ orderId: 'team-002', amount: 50, currency: 'USD', provider: 'paypal' }),
    ])
    expect(results.every(r => r.status === 'pending')).toBe(true)
    expect(results.every(r => r.transactionId)).toBe(true)
  })
})

// ═══════════════════════════════════════════════════════════
// 📢 营销 - 营销活动充值
// ═══════════════════════════════════════════════════════════
describe('📢营销 payment-gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('营销活动充值 (alipay pending)', async () => {
    const result = await svc.service.pay({
      orderId: 'mkt-campaign-pay-001',
      amount: 30000,
      currency: 'CNY',
      provider: 'alipay',
      metadata: { campaignId: 'summer-sale-2026' },
    })
    expect(result.status).toBe('pending')
    expect(result.amount).toBe(30000)
    expect(result.provider).toBe('alipay')
    expect(result.providerResponse).toBeTruthy()
  })

  it('获取所有交易用于对账', async () => {
    await Promise.all([
      svc.service.pay({ orderId: 'mkt-001', amount: 1000, currency: 'CNY', provider: 'alipay' }),
      svc.service.pay({ orderId: 'mkt-002', amount: 2000, currency: 'CNY', provider: 'wechat_pay' }),
    ])
    const allTxns = svc.service.getAllTransactions()
    expect(allTxns.size).toBe(2)
  })
})

// ═══════════════════════════════════════════════════════════
// 📊 边界场景 - 错误处理
// ═══════════════════════════════════════════════════════════
describe('边界场景：错误与异常处理', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('支付金额为 0 应抛错', async () => {
    await expect(
      svc.service.pay({ orderId: 'zero', amount: 0, currency: 'CNY', provider: 'alipay' })
    ).rejects.toThrow(/amount must be/)
  })

  it('不支持的货币组合应抛错', async () => {
    await expect(
      svc.service.pay({ orderId: 'unsupported', amount: 100, currency: 'VND', provider: 'paypal' })
    ).rejects.toThrow(/not supported/)
  })

  it('查询不存在的退款应抛错', async () => {
    await expect(
      svc.service.queryRefund('refund-not-exist')
    ).rejects.toThrow(/not found/)
  })

  it('订单ID重复不影响支付 (各自独立)', async () => {
    const r1 = await svc.service.pay({ orderId: 'dup-order', amount: 100, currency: 'CNY', provider: 'alipay' })
    const r2 = await svc.service.pay({ orderId: 'dup-order', amount: 200, currency: 'CNY', provider: 'wechat_pay' })
    expect(r1.transactionId).not.toBe(r2.transactionId)
    expect(r1.status).toBe('pending')
    expect(r2.status).toBe('pending')
  })

  it('PayPal 支付 + 订单捕获', async () => {
    const pay = await svc.service.pay({
      orderId: 'paypal-cap-001',
      amount: 150,
      currency: 'USD',
      provider: 'paypal',
    })
    expect(pay.status).toBe('pending')

    // capturePayPalOrder 需要 providerResponse.orderId
    const ppOrderId = (pay.providerResponse as Record<string, unknown>)?.orderId as string
    expect(ppOrderId).toMatch(/^PP-/)
    const captured = await svc.service.capturePayPalOrder(ppOrderId)
    expect(captured.status).toBe('completed')

    // 捕获后查询状态更新
    const query = await svc.service.query(pay.transactionId)
    expect(query.status).toBe('completed')
  })
})
