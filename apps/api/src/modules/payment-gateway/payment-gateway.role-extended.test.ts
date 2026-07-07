import { describe, it, expect, beforeEach } from 'vitest'
import {
  PaymentGatewayService,
  PaymentChannelHandler,
} from './payment-gateway.service'

/**
 * 🐜 [payment-gateway] 角色扩展测试
 * 覆盖支付渠道处理、退款、查询边界场景
 */

function setup() {
  const handler = new PaymentChannelHandler()
  const service = new PaymentGatewayService(handler)
  return { handler, service }
}

describe('👔店长 payment-gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('发起支付交易', async () => {
    const txn = await svc.service.createTransaction({
      amount: 10000,
      currency: 'CNY',
      channel: 'wechat',
      description: '游戏充值',
      customerId: 'c1',
    })
    expect(txn.transactionId).toBeTruthy()
    expect(txn.amount).toBe(10000)
    expect(txn.status).toBe('pending')
  })

  it('查询交易状态', async () => {
    const txn = await svc.service.createTransaction({
      amount: 5000, currency: 'CNY', channel: 'alipay',
      description: '商品购买', customerId: 'c2',
    })
    const status = svc.service.getTransactionStatus(txn.transactionId)
    expect(status).toBeDefined()
  })
})

describe('🛒前台 payment-gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('处理退款', async () => {
    const txn = await svc.service.createTransaction({
      amount: 2000, currency: 'CNY', channel: 'wechat',
      description: '测试', customerId: 'c3',
    })
    const refund = await svc.service.processRefund(txn.transactionId, 2000)
    expect(refund.refundId).toBeTruthy()
    expect(refund.amount).toBe(2000)
  })
})

describe('🔧安监 payment-gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('部分退款', async () => {
    const txn = await svc.service.createTransaction({
      amount: 10000, currency: 'CNY', channel: 'alipay',
      description: '部分退款测试', customerId: 'c4',
    })
    const refund = await svc.service.processRefund(txn.transactionId, 3000)
    expect(refund.amount).toBe(3000)
  })

  it('查询不存在交易返回 null', () => {
    const status = svc.service.getTransactionStatus('no-such')
    expect(status).toBeNull()
  })
})

describe('🎯运行专员 payment-gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('不同支付渠道处理', async () => {
    const wx = await svc.service.createTransaction({
      amount: 100, currency: 'CNY', channel: 'wechat',
      description: '微信支付', customerId: 'c5',
    })
    const ali = await svc.service.createTransaction({
      amount: 200, currency: 'CNY', channel: 'alipay',
      description: '支付宝支付', customerId: 'c6',
    })
    expect(wx.channel).toBe('wechat')
    expect(ali.channel).toBe('alipay')
  })

  it('列出所有交易', async () => {
    await svc.service.createTransaction({
      amount: 100, currency: 'CNY', channel: 'wechat',
      description: 'T1', customerId: 'c7',
    })
    await svc.service.createTransaction({
      amount: 200, currency: 'CNY', channel: 'alipay',
      description: 'T2', customerId: 'c8',
    })
    const list = svc.service.listTransactions()
    expect(list.length).toBeGreaterThanOrEqual(2)
  })
})

describe('📢营销 payment-gateway 扩展测试', () => {
  let svc: ReturnType<typeof setup>
  beforeEach(() => { svc = setup() })

  it('按客户查询交易记录', async () => {
    await svc.service.createTransaction({
      amount: 500, currency: 'CNY', channel: 'wechat',
      description: '营销充值', customerId: 'mkt-c1',
    })
    await svc.service.createTransaction({
      amount: 300, currency: 'CNY', channel: 'alipay',
      description: '营销充值2', customerId: 'mkt-c1',
    })
    const txns = svc.service.getTransactionsByCustomer('mkt-c1')
    expect(txns.length).toBeGreaterThanOrEqual(2)
  })

  it('按日期范围过滤交易', async () => {
    await svc.service.createTransaction({
      amount: 100, currency: 'CNY', channel: 'wechat',
      description: 'D1', customerId: 'c9',
    })
    const filtered = svc.service.getTransactionsByDateRange(
      new Date(Date.now() - 86400000),
      new Date(Date.now() + 86400000),
    )
    expect(filtered.length).toBeGreaterThanOrEqual(1)
  })
})
