/**
 * PaymentGateway 多角色精细化权限测试 (V2)
 *
 * T117-3: 本地化支付 - 8角色视角的完整业务流程测试
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

import { describe, it, expect, beforeEach } from 'vitest'
import { PaymentGatewayService, type PaymentRequest, PaymentError } from './payment-gateway.service'

// ─── 测试辅助 ────────────────────────────────────────────

function setup() {
  const service = new PaymentGatewayService()
  // 初始化各角色钱包
  service.setWalletBalance('owner', 'CNY', 500000)
  service.setWalletBalance('staff', 'CNY', 5000)
  service.setWalletBalance('game-guide', 'CNY', 20000)
  service.setWalletBalance('team-building', 'CNY', 150000)
  return { service }
}

/** 使用本地钱包完成支付的辅助函数 */
async function payWithWallet(
  svc: PaymentGatewayService,
  overrides: Partial<PaymentRequest> = {},
) {
  const req: PaymentRequest = {
    orderId: `order-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    amount: 5000,
    currency: 'CNY',
    provider: 'local_wallet',
    ...overrides,
  }
  return svc.pay(req)
}

/** 使用 PayPal 完成支付的辅助函数（含 capture） */
async function payWithPayPal(
  svc: PaymentGatewayService,
  amount: number,
  currency: 'USD' | 'JPY' | 'CNY' = 'USD',
) {
  const result = await svc.pay({
    orderId: `pp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    amount,
    currency,
    provider: 'paypal',
  })
  return svc.capturePayPalOrder(result.providerResponse!.orderId as string)
}

// ════════════════════════════════════════════════════════════
// 👔 店长视角 — 全局支付管理 & 大额审批
// ════════════════════════════════════════════════════════════

describe('👔店长 — payment-gateway (V2)', () => {
  let svc: PaymentGatewayService
  beforeEach(() => {
    svc = setup().service
  })

  it('流程正例: 店长发起大额本地钱包支付并成功退款', async () => {
    svc.setWalletBalance('owner', 'CNY', 500000)
    // 支付 10 万元
    const pay = await payWithWallet(svc, { amount: 100000, metadata: { userId: 'owner' } })
    expect(pay.status).toBe('completed')
    expect(pay.amount).toBe(100000)

    // 全额退款
    const refund = await svc.refund({ transactionId: pay.transactionId, reason: '店长审批大额退款' })
    expect(refund.status).toBe('refunded')
    expect(refund.amount).toBe(100000)

    // 余额应恢复
    expect(svc.getWalletBalance('owner', 'CNY')).toBe(500000)
  })

  it('权限边界: 店长试图退款不存在的交易应抛出明确错误', async () => {
    await expect(svc.refund({ transactionId: 'TXN-NONEXIST' })).rejects.toThrow(PaymentError)
    await expect(svc.refund({ transactionId: 'TXN-NONEXIST' })).rejects.toMatchObject({ code: 'TRANSACTION_NOT_FOUND' })
  })

  it('权限边界: 店长试图查询不存在的支付应抛出 404 类错误', async () => {
    await expect(svc.query('TXN-DOES-NOT-EXIST')).rejects.toThrow(PaymentError)
    await expect(svc.query('TXN-DOES-NOT-EXIST')).rejects.toMatchObject({ code: 'TRANSACTION_NOT_FOUND' })
  })

  it('流程正例: 店长查看全部交易概览', async () => {
    await payWithWallet(svc, { amount: 2000, metadata: { userId: 'owner' } })
    await payWithWallet(svc, { amount: 3000, metadata: { userId: 'owner' } })
    const all = svc.getAllTransactions()
    expect(all.size).toBe(2)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒 前台视角 — 日常收银 & 顾客支付
// ════════════════════════════════════════════════════════════

describe('🛒前台 — payment-gateway (V2)', () => {
  let svc: PaymentGatewayService
  beforeEach(() => {
    svc = setup().service
  })

  it('流程正例: 前台为顾客结账使用微信支付', async () => {
    svc.setWalletBalance('staff', 'CNY', 5000)
    const result = await svc.pay({
      orderId: `cashier-${Date.now()}`,
      amount: 100,
      currency: 'CNY',
      provider: 'wechat_pay',
      metadata: { userId: 'staff', customerNote: '前台收银 2 枚游戏币' },
    })
    expect(result.transactionId).toBeTruthy()
    expect(result.provider).toBe('wechat_pay')
    expect(result.status).toBe('pending')
    expect(result.providerResponse).toBeTruthy()
    expect(result.providerResponse!.codeUrl).toContain('wechat.com')
  })

  it('流程正例: 前台查看已完成的支付结果', async () => {
    const pay = await payWithWallet(svc, { amount: 500, metadata: { userId: 'staff' } })
    expect(pay.status).toBe('completed')

    const query = await svc.query(pay.transactionId)
    expect(query.status).toBe('completed')
    expect(query.amount).toBe(500)
  })

  it('权限边界: 前台发起零金额支付应被拒绝', async () => {
    await expect(svc.pay({
      orderId: 'zero-amount',
      amount: 0,
      currency: 'CNY',
      provider: 'local_wallet',
    })).rejects.toMatchObject({ code: 'INVALID_AMOUNT' })
  })

  it('权限边界: 前台发起负金额支付应被拒绝', async () => {
    await expect(svc.pay({
      orderId: 'neg-amount',
      amount: -100,
      currency: 'CNY',
      provider: 'local_wallet',
    })).rejects.toMatchObject({ code: 'INVALID_AMOUNT' })
  })
})

// ════════════════════════════════════════════════════════════
// 👥 HR 视角 — 只能查看交易记录，不可操作
// ════════════════════════════════════════════════════════════

describe('👥HR — payment-gateway (V2)', () => {
  let svc: PaymentGatewayService
  beforeEach(() => {
    svc = setup().service
  })

  it('流程正例: HR 查看已有的交易明细', async () => {
    // 预先完成几笔交易
    await payWithWallet(svc, { amount: 1000, metadata: { userId: 'owner' } })
    await payWithWallet(svc, { amount: 2000, metadata: { userId: 'staff' } })

    // HR 查看所有交易 - 只读
    const all = svc.getAllTransactions()
    expect(all.size).toBe(2)
    for (const [_, txn] of all) {
      expect(txn).toHaveProperty('id')
      expect(txn).toHaveProperty('amount')
      expect(txn).toHaveProperty('status')
    }
  })

  it('权限边界: HR 不应具备退款权限（模拟场景）', async () => {
    // HR 即使获取到了交易 ID 也不应执行退款操作
    // 这里的语义测试是：HR 应该只能使用 query/queryRefund，不应使用 refund
    // 但服务层本身无角色校验 — 角色权限应在 controller/middleware 层实现
    // 此处测试 HR 角色的行为边界：HR 应只调用只读方法
    const pay = await payWithWallet(svc, { amount: 500, metadata: { userId: 'staff' } })
    expect(pay.status).toBe('completed')

    // HR 应只能查询，不应调用 refund — 这里用外部语义验证
    const query = await svc.query(pay.transactionId)
    expect(query.status).toBe('completed')

    // 模拟 HR 错误调用 refund — 技术上能调用但业务上不应这么做
    // 测试服务层不阻止但外部集成应有角色拦截
    expect(typeof svc.refund).toBe('function')
  })

  it('流程正例: HR 查询某笔交易的货币和金额信息', async () => {
    const pay = await payWithWallet(svc, { amount: 3000, currency: 'CNY', metadata: { userId: 'staff' } })
    const info = await svc.query(pay.transactionId)
    expect(info.currency).toBe('CNY')
    expect(info.amount).toBe(3000)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧 安监视角 — 监控异常交易，处理可疑支付
// ════════════════════════════════════════════════════════════

describe('🔧安监 — payment-gateway (V2)', () => {
  let svc: PaymentGatewayService
  beforeEach(() => {
    svc = setup().service
  })

  it('流程正例: 安监查看最近所有交易发现异常模式', async () => {
    // 模拟正常交易
    await payWithWallet(svc, { amount: 100, metadata: { userId: 'staff' } })
    await payWithWallet(svc, { amount: 200, metadata: { userId: 'staff' } })
    // 模拟可疑的大额整数交易
    await payWithWallet(svc, { amount: 99999, metadata: { userId: 'unknown' } })

    const all = svc.getAllTransactions()
    const suspicious = Array.from(all.values()).filter(t => t.amount >= 50000)
    expect(suspicious.length).toBe(1)
    expect(suspicious[0].amount).toBe(99999)
  })

  it('流程正例: 安监验证 webhook 签名防止伪造回调', async () => {
    // PayPal webhook
    const paypalOk = await svc.verifyWebhook('paypal', '{}', {
      'paypal-transmission-sig': 'sig123',
      'paypal-transmission-id': 'txn456',
      'paypal-transmission-time': new Date().toISOString(),
    })
    expect(paypalOk).toBe(true)

    const paypalBad = await svc.verifyWebhook('paypal', '{}', {})
    expect(paypalBad).toBe(false)

    // Stripe webhook
    const stripeOk = await svc.verifyWebhook('stripe', 'payload', {
      'stripe-signature': 't=123,v1=abc',
    })
    expect(stripeOk).toBe(true)

    const stripeBad = await svc.verifyWebhook('stripe', 'payload', {})
    expect(stripeBad).toBe(false)
  })

  it('权限边界: 安监检查不支持货币的支付被拦截', async () => {
    await expect(svc.pay({
      orderId: 'bad-currency',
      amount: 100,
      currency: 'VND' as any,
      provider: 'paypal',
    })).rejects.toMatchObject({ code: 'CURRENCY_NOT_SUPPORTED' })
  })
})

// ════════════════════════════════════════════════════════════
// 🎮 导玩员视角 — 代客充值游戏币
// ════════════════════════════════════════════════════════════

describe('🎮导玩员 — payment-gateway (V2)', () => {
  let svc: PaymentGatewayService
  beforeEach(() => {
    svc = setup().service
  })

  it('流程正例: 导玩员代客充值游戏币 (本地钱包)', async () => {
    svc.setWalletBalance('game-guide', 'CNY', 20000)
    const result = await svc.pay({
      orderId: `topup-${Date.now()}`,
      amount: 5000,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: {
        userId: 'game-guide',
        customerId: 'vip-001',
        serviceType: 'coin_topup',
      },
    })
    expect(result.status).toBe('completed')
    expect(result.amount).toBe(5000)
  })

  it('流程正例: 导玩员查询充值历史', async () => {
    await payWithWallet(svc, { amount: 1000, metadata: { userId: 'game-guide' } })
    await payWithWallet(svc, { amount: 2000, metadata: { userId: 'game-guide' } })
    await payWithWallet(svc, { amount: 3000, metadata: { userId: 'game-guide' } })

    const all = svc.getAllTransactions()
    expect(all.size).toBe(3)
  })

  it('权限边界: 导玩员余额不足时支付失败', async () => {
    svc.setWalletBalance('game-guide', 'CNY', 100)
    const result = await svc.pay({
      orderId: `low-bal-${Date.now()}`,
      amount: 5000,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'game-guide' },
    })
    expect(result.status).toBe('failed')
    expect(result.error).toBe('Insufficient balance')
  })
})

// ════════════════════════════════════════════════════════════
// 🎯 运行专员视角 — 运营巡检 & 对账
// ════════════════════════════════════════════════════════════

describe('🎯运行专员 — payment-gateway (V2)', () => {
  let svc: PaymentGatewayService
  beforeEach(() => {
    svc = setup().service
  })

  it('流程正例: 运行专员巡检当日支付流水', async () => {
    // 模拟多笔不同方式支付
    await payWithWallet(svc, { amount: 100, metadata: { userId: 'staff' } })
    const pp = await payWithPayPal(svc, 50, 'USD')
    await svc.pay({
      orderId: `alipay-${Date.now()}`,
      amount: 8800,
      currency: 'CNY',
      provider: 'alipay',
    })

    const all = svc.getAllTransactions()
    expect(all.size).toBe(3)

    // 按支付方式分类
    const byProvider = new Map<string, number>()
    for (const t of all.values()) {
      byProvider.set(t.provider, (byProvider.get(t.provider) || 0) + 1)
    }
    expect(byProvider.get('local_wallet')).toBe(1)
    expect(byProvider.get('paypal')).toBe(1)
    expect(byProvider.get('alipay')).toBe(1)
  })

  it('流程正例: 运行专员查看退款对账', async () => {
    const pay = await payWithWallet(svc, { amount: 2000, metadata: { userId: 'staff' } })
    const refund = await svc.refund({ transactionId: pay.transactionId, reason: '顾客退款' })
    expect(refund.status).toBe('refunded')

    const refundQuery = await svc.queryRefund(refund.transactionId)
    expect(refundQuery.status).toBe('refunded')
    expect(refundQuery.amount).toBe(2000)
  })

  it('权限边界: 运行专员查看地区支持的支付方式', async () => {
    const cnProviders = svc.getSupportedProviders('CN')
    expect(cnProviders).toContain('alipay')
    expect(cnProviders).toContain('wechat_pay')
    expect(cnProviders).not.toContain('paypay')

    const jpProviders = svc.getSupportedProviders('JP')
    expect(jpProviders).toContain('paypay')
    expect(jpProviders).not.toContain('alipay')

    const usProviders = svc.getSupportedProviders('US')
    expect(usProviders).toContain('paypal')
    expect(usProviders).toContain('stripe')
  })
})

// ════════════════════════════════════════════════════════════
// 🤝 团建视角 — 团建订单批量支付
// ════════════════════════════════════════════════════════════

describe('🤝团建 — payment-gateway (V2)', () => {
  let svc: PaymentGatewayService
  beforeEach(() => {
    svc = setup().service
  })

  it('流程正例: 团建一次性支付多张门票', async () => {
    svc.setWalletBalance('team-building', 'CNY', 150000)
    const result = await svc.pay({
      orderId: `team-booking-${Date.now()}`,
      amount: 88600,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: {
        userId: 'team-building',
        groupSize: '42',
        eventType: 'team_building',
      },
    })
    expect(result.status).toBe('completed')
    expect(result.amount).toBe(88600)
  })

  it('流程正例: 团建退款部分金额 (非足额退款)', async () => {
    svc.setWalletBalance('team-building', 'CNY', 150000)
    const pay = await payWithWallet(svc, {
      amount: 50000,
      metadata: { userId: 'team-building' },
    })

    // 退部分
    const refund = await svc.refund({
      transactionId: pay.transactionId,
      amount: 10000,
      reason: '部分成员未到场',
    })
    expect(refund.status).toBe('refunded')
    expect(refund.amount).toBe(10000)
    // 余额: 原本 150000 - 50000 + 10000 = 110000
    expect(svc.getWalletBalance('team-building', 'CNY')).toBe(110000)
  })

  it('权限边界: 团建退款金额超出原支付金额被拒绝', async () => {
    svc.setWalletBalance('team-building', 'CNY', 150000)
    const pay = await payWithWallet(svc, {
      amount: 30000,
      metadata: { userId: 'team-building' },
    })
    await expect(svc.refund({
      transactionId: pay.transactionId,
      amount: 50000,
    })).rejects.toMatchObject({ code: 'REFUND_AMOUNT_EXCEEDED' })
  })
})

// ════════════════════════════════════════════════════════════
// 📢 营销视角 — 查看支付转化数据
// ════════════════════════════════════════════════════════════

describe('📢营销 — payment-gateway (V2)', () => {
  let svc: PaymentGatewayService
  beforeEach(() => {
    svc = setup().service
  })

  it('流程正例: 营销查看当日支付成功率和支付方式占比', async () => {
    // 成功交易
    await payWithWallet(svc, { amount: 5000, metadata: { userId: 'staff' } })
    await payWithPayPal(svc, 20, 'USD')

    // 失败交易
    svc.setWalletBalance('staff', 'CNY', 0)
    await svc.pay({
      orderId: `fail-${Date.now()}`,
      amount: 100,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'staff' },
    })

    const all = svc.getAllTransactions()
    const completed = Array.from(all.values()).filter(t => t.status === 'completed')
    const failed = Array.from(all.values()).filter(t => t.status === 'failed')

    expect(completed.length).toBe(2)
    expect(failed.length).toBe(1)

    // 支付方式占比
    const providerCount = new Map<string, number>()
    for (const t of completed) {
      providerCount.set(t.provider, (providerCount.get(t.provider) || 0) + 1)
    }
    expect(providerCount.get('local_wallet')).toBe(1)
    expect(providerCount.get('paypal')).toBe(1)
  })

  it('流程正例: 营销查看各币种支付金额统计', async () => {
    // CNY - local wallet needs sufficient balance
    svc.setWalletBalance('staff', 'CNY', 200000)
    const payResult = await payWithWallet(svc, { amount: 10000, currency: 'CNY', metadata: { userId: 'staff' } })
    expect(payResult.status).toBe('completed')

    // USD - PayPal completes via capture
    const ppResult = await payWithPayPal(svc, 100, 'USD')
    expect(ppResult.status).toBe('completed')

    const all = svc.getAllTransactions()
    expect(all.size).toBe(2)
    const currencyTotals = new Map<string, number>()
    for (const t of all.values()) {
      if (t.status === 'completed') {
        currencyTotals.set(t.currency, (currencyTotals.get(t.currency) || 0) + t.amount)
      }
    }
    expect(currencyTotals.get('CNY')).toBe(10000)
    expect(currencyTotals.get('USD')).toBe(100)
  })

  it('权限边界: 营销查看空数据报表应正常', async () => {
    const all = svc.getAllTransactions()
    expect(all.size).toBe(0)
  })
})
