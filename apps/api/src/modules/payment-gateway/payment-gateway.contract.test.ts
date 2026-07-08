import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * 🐜 自动: [payment-gateway] [D] 合约测试
 *
 * 验证 payment-gateway 模块的实体合约、业务逻辑合约、映射器正确性
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { PaymentGatewayService } from './payment-gateway.service'
import {
  toPaymentTransactionContract,
  toRefundRecordContract,
  toWalletEntryContract,
  toPaymentTransactionContracts,
  toRefundRecordContracts,
} from './payment-gateway.contract'
import type { PaymentTransaction, RefundRecord, WalletEntry } from './payment-gateway.entity'

// ─── 服务实例 helper ──────────────────────────────────

function makeService(): PaymentGatewayService {
  return new PaymentGatewayService()
}

// ─── 合约: 支付服务 ───────────────────────────────────

describe('[payment-gateway] 合约: pay', () => {
  beforeEach(() => {
    const svc = makeService()
    svc.clear()
  })

  it('local_wallet 支付成功 → status=completed', async () => {
    const svc = makeService()
    svc.setWalletBalance('user-001', 'CNY', 1000)

    const result = await svc.pay({
      orderId: 'order-001',
      amount: 500,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'user-001' },
    })

    assert.equal(result.status, 'completed')
    assert.equal(result.provider, 'local_wallet')
    assert.equal(result.amount, 500)
    assert.equal(result.currency, 'CNY')
    assert.equal(typeof result.transactionId, 'string')
    assert.ok(result.transactionId.startsWith('TXN-'))
  })

  it('local_wallet 余额不足 → status=failed', async () => {
    const svc = makeService()
    svc.setWalletBalance('user-002', 'CNY', 100)

    const result = await svc.pay({
      orderId: 'order-002',
      amount: 500,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'user-002' },
    })

    assert.equal(result.status, 'failed')
    assert.equal(result.provider, 'local_wallet')
    assert.ok(result.error?.includes('Insufficient'))
  })

  it('local_wallet 支付成功 → 余额正确扣减', async () => {
    const svc = makeService()
    svc.setWalletBalance('user-003', 'CNY', 1000)

    await svc.pay({
      orderId: 'order-003',
      amount: 300,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'user-003' },
    })

    const balance = svc.getWalletBalance('user-003', 'CNY')
    assert.equal(balance, 700)
  })

  it('金额 <= 0 抛出 INVALID_AMOUNT', async () => {
    const svc = makeService()

    await assert.rejects(
      () =>
        svc.pay({
          orderId: 'order-bad',
          amount: 0,
          currency: 'CNY',
          provider: 'local_wallet',
        }),
      (err: any) => err.code === 'INVALID_AMOUNT',
    )
  })

  it('PayPay 只支持 JPY', async () => {
    const svc = makeService()

    await assert.rejects(
      () =>
        svc.pay({
          orderId: 'order-paypay',
          amount: 100,
          currency: 'CNY',
          provider: 'paypay',
        }),
      (err: any) => err.code === 'CURRENCY_NOT_SUPPORTED',
    )
  })

  it('PayPay 支持 JPY 正常', async () => {
    const svc = makeService()
    const result = await svc.pay({
      orderId: 'order-paypay-jpy',
      amount: 1000,
      currency: 'JPY',
      provider: 'paypay',
    })

    assert.equal(result.status, 'pending')
    assert.equal(result.provider, 'paypay')
  })
})

// ─── 合约: 支付结果查询 ───────────────────────────────

describe('[payment-gateway] 合约: query', () => {
  it('存在的交易返回正确信息', async () => {
    const svc = makeService()
    svc.setWalletBalance('user-q', 'CNY', 1000)

    const payResult = await svc.pay({
      orderId: 'order-q',
      amount: 500,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'user-q' },
    })

    const queryResult = await svc.query(payResult.transactionId)
    assert.equal(queryResult.transactionId, payResult.transactionId)
    assert.equal(queryResult.status, 'completed')
    assert.equal(queryResult.amount, 500)
  })

  it('不存在的交易抛出 TRANSACTION_NOT_FOUND', async () => {
    const svc = makeService()

    await assert.rejects(
      () => svc.query('non-existent-txn'),
      (err: any) => err.code === 'TRANSACTION_NOT_FOUND',
    )
  })
})

// ─── 合约: 退款 ───────────────────────────────────────

describe('[payment-gateway] 合约: refund', () => {
  it('已完成交易可全额退款', async () => {
    const svc = makeService()
    svc.setWalletBalance('user-r', 'CNY', 1000)

    const payResult = await svc.pay({
      orderId: 'order-refund',
      amount: 500,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'user-r' },
    })

    const refundResult = await svc.refund({
      transactionId: payResult.transactionId,
    })

    assert.equal(refundResult.status, 'refunded')
    assert.equal(refundResult.amount, 500)
  })

  it('退款后余额恢复', async () => {
    const svc = makeService()
    svc.setWalletBalance('user-rb', 'CNY', 1000)

    const payResult = await svc.pay({
      orderId: 'order-rb',
      amount: 300,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'user-rb' },
    })

    assert.equal(svc.getWalletBalance('user-rb', 'CNY'), 700)

    await svc.refund({
      transactionId: payResult.transactionId,
      amount: 300,
    })

    assert.equal(svc.getWalletBalance('user-rb', 'CNY'), 1000)
  })

  it('不存在的交易抛出 TRANSACTION_NOT_FOUND', async () => {
    const svc = makeService()

    await assert.rejects(
      () => svc.refund({ transactionId: 'nonexistent' }),
      (err: any) => err.code === 'TRANSACTION_NOT_FOUND',
    )
  })

  it('未完成交易不能退款', async () => {
    const svc = makeService()

    const payResult = await svc.pay({
      orderId: 'order-pending-ref',
      amount: 100,
      currency: 'JPY',
      provider: 'paypay',
    })

    // PayPay async webhook hasn't fired yet -> status is still 'pending'
    await assert.rejects(
      () => svc.refund({ transactionId: payResult.transactionId }),
      (err: any) => err.code === 'REFUND_NOT_ALLOWED',
    )
  })

  it('退款金额不能超过原金额', async () => {
    const svc = makeService()
    svc.setWalletBalance('user-ex', 'CNY', 1000)

    const payResult = await svc.pay({
      orderId: 'order-ex',
      amount: 500,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'user-ex' },
    })

    await assert.rejects(
      () => svc.refund({ transactionId: payResult.transactionId, amount: 999 }),
      (err: any) => err.code === 'REFUND_AMOUNT_EXCEEDED',
    )
  })
})

// ─── 合约: 退款查询 ───────────────────────────────────

describe('[payment-gateway] 合约: queryRefund', () => {
  it('存在退款返回正确信息', async () => {
    const svc = makeService()
    svc.setWalletBalance('user-qr', 'CNY', 1000)

    const payResult = await svc.pay({
      orderId: 'order-qr',
      amount: 500,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'user-qr' },
    })

    const refundResult = await svc.refund({
      transactionId: payResult.transactionId,
    })

    const queryResult = await svc.queryRefund(refundResult.transactionId)
    assert.equal(queryResult.status, 'refunded')
    assert.equal(queryResult.transactionId, refundResult.transactionId)
  })

  it('不存在的退款抛出 REFUND_NOT_FOUND', async () => {
    const svc = makeService()

    await assert.rejects(
      () => svc.queryRefund('non-existent-refund'),
      (err: any) => err.code === 'REFUND_NOT_FOUND',
    )
  })
})

// ─── 合约: 支持的支付方式 ─────────────────────────────

describe('[payment-gateway] 合约: getSupportedProviders', () => {
  it('中国返回 alipay, wechat_pay, stripe, local_wallet', () => {
    const svc = makeService()
    const providers = svc.getSupportedProviders('CN')
    assert.ok(providers.includes('alipay'))
    assert.ok(providers.includes('wechat_pay'))
    assert.ok(providers.includes('stripe'))
    assert.ok(providers.includes('local_wallet'))
  })

  it('日本返回 paypay, stripe, paypal, local_wallet', () => {
    const svc = makeService()
    const providers = svc.getSupportedProviders('JP')
    assert.ok(providers.includes('paypay'))
    assert.ok(providers.includes('stripe'))
    assert.ok(providers.includes('paypal'))
  })

  it('泰国返回 stripe, paypal, local_wallet', () => {
    const svc = makeService()
    const providers = svc.getSupportedProviders('TH')
    assert.ok(providers.includes('stripe'))
    assert.ok(providers.includes('paypal'))
    assert.ok(providers.includes('local_wallet'))
    assert.ok(!providers.includes('alipay'))
  })

  it('欧美默认返回 paypal, stripe, local_wallet', () => {
    const svc = makeService()
    const providers = svc.getSupportedProviders('US')
    assert.ok(providers.includes('paypal'))
    assert.ok(providers.includes('stripe'))
    assert.ok(providers.includes('local_wallet'))
  })

  it('香港返回 alipay, wechat_pay, stripe, local_wallet', () => {
    const svc = makeService()
    const providers = svc.getSupportedProviders('HK')
    assert.ok(providers.includes('alipay'))
    assert.ok(providers.includes('local_wallet'))
  })
})

// ─── 合约: webhook 验证 ───────────────────────────────

describe('[payment-gateway] 合约: verifyWebhook', () => {
  it('local_wallet 始终返回 true', async () => {
    const svc = makeService()
    const result = await svc.verifyWebhook('local_wallet', '{}', {})
    assert.equal(result, true)
  })

  it('PayPal webhook 验证检查必要 header', async () => {
    const svc = makeService()
    // 缺少必要 header
    const result = await svc.verifyWebhook('paypal', '{}', {})
    assert.equal(result, false)
  })

  it('PayPal webhook 验证通过有正确 header', async () => {
    const svc = makeService()
    const result = await svc.verifyWebhook('paypal', '{}', {
      'paypal-transmission-sig': 'sig123',
      'paypal-transmission-id': 'id456',
      'paypal-transmission-time': '2024-01-01T00:00:00Z',
      'paypal-cert-url': 'https://api.paypal.com/cert',
    })
    assert.equal(result, true)
  })

  it('Stripe webhook 签名格式验证', async () => {
    const svc = makeService()
    // 正确格式
    const result1 = await svc.verifyWebhook('stripe', '{}', {
      'stripe-signature': 't=1704067200,v1=abc123',
    })
    assert.equal(result1, true)

    // 缺少签名
    const result2 = await svc.verifyWebhook('stripe', '{}', {})
    assert.equal(result2, false)
  })

  it('未知 provider → false', async () => {
    const svc = makeService()
    const result = await svc.verifyWebhook('unknown' as any, '{}', {})
    assert.equal(result, false)
  })
})

// ─── 合约: 货币支持 ───────────────────────────────────

describe('[payment-gateway] 合约: isCurrencySupported', () => {
  it('支持的货币返回 true', () => {
    const svc = makeService()
    assert.equal(svc.isCurrencySupported('CNY'), true)
    assert.equal(svc.isCurrencySupported('USD'), true)
    assert.equal(svc.isCurrencySupported('JPY'), true)
    assert.equal(svc.isCurrencySupported('THB'), true)
  })

  it('不支持的货币返回 false', () => {
    const svc = makeService()
    assert.equal(svc.isCurrencySupported('EUR' as any), false)
    assert.equal(svc.isCurrencySupported('GBP' as any), false)
  })
})

// ─── 合约: 映射器 ─────────────────────────────────────

describe('[payment-gateway] 合约: 映射器', () => {
  it('toPaymentTransactionContract 映射完整', () => {
    const now = new Date('2024-06-01T12:00:00Z')
    const entity: PaymentTransaction = {
      id: 'txn-001',
      orderId: 'order-001',
      provider: 'stripe',
      status: 'completed',
      amount: 2999,
      currency: 'CNY',
      paidAt: now,
      createdAt: now,
      updatedAt: now,
    }

    const contract = toPaymentTransactionContract(entity)
    assert.equal(contract.id, 'txn-001')
    assert.equal(contract.provider, 'stripe')
    assert.equal(contract.status, 'completed')
    assert.equal(contract.amount, 2999)
    assert.equal(contract.currency, 'CNY')
    assert.equal(contract.paidAt, '2024-06-01T12:00:00.000Z')
    assert.equal(contract.createdAt, '2024-06-01T12:00:00.000Z')
  })

  it('toPaymentTransactionContract 无 paidAt → paidAt undefined', () => {
    const now = new Date()
    const entity: PaymentTransaction = {
      id: 'txn-002',
      orderId: 'order-002',
      provider: 'paypal',
      status: 'pending',
      amount: 500,
      currency: 'USD',
      createdAt: now,
      updatedAt: now,
    }

    const contract = toPaymentTransactionContract(entity)
    assert.equal(contract.paidAt, undefined)
    assert.equal(contract.error, undefined)
  })

  it('toPaymentTransactionContract 含 error 字段', () => {
    const now = new Date()
    const entity: PaymentTransaction = {
      id: 'txn-003',
      orderId: 'order-003',
      provider: 'local_wallet',
      status: 'failed',
      amount: 100,
      currency: 'CNY',
      createdAt: now,
      updatedAt: now,
      error: 'Insufficient balance',
    }

    const contract = toPaymentTransactionContract(entity)
    assert.equal(contract.error, 'Insufficient balance')
  })

  it('toRefundRecordContract 映射完整', () => {
    const now = new Date()
    const entity: RefundRecord = {
      id: 'ref-001',
      originalTransactionId: 'txn-001',
      amount: 500,
      reason: '用户申请退款',
      status: 'refunded',
      createdAt: now,
      updatedAt: now,
    }

    const contract = toRefundRecordContract(entity)
    assert.equal(contract.id, 'ref-001')
    assert.equal(contract.originalTransactionId, 'txn-001')
    assert.equal(contract.amount, 500)
    assert.equal(contract.reason, '用户申请退款')
    assert.equal(contract.status, 'refunded')
  })

  it('toRefundRecordContract 无 reason → reason undefined', () => {
    const now = new Date()
    const entity: RefundRecord = {
      id: 'ref-002',
      originalTransactionId: 'txn-002',
      amount: 100,
      status: 'refunded',
      createdAt: now,
      updatedAt: now,
    }

    const contract = toRefundRecordContract(entity)
    assert.equal(contract.reason, undefined)
  })

  it('toWalletEntryContract 映射完整', () => {
    const now = new Date('2024-06-01T12:00:00Z')
    const entity: WalletEntry = {
      currency: 'CNY',
      amount: 10000,
      updatedAt: now,
    }

    const contract = toWalletEntryContract(entity)
    assert.equal(contract.currency, 'CNY')
    assert.equal(contract.amount, 10000)
    assert.equal(contract.updatedAt, '2024-06-01T12:00:00.000Z')
  })

  it('toPaymentTransactionContracts 批量映射', () => {
    const now = new Date()
    const entities: PaymentTransaction[] = [
      {
        id: 'txn-b1',
        orderId: 'o1',
        provider: 'stripe',
        status: 'completed',
        amount: 100,
        currency: 'USD',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'txn-b2',
        orderId: 'o2',
        provider: 'paypal',
        status: 'pending',
        amount: 200,
        currency: 'JPY',
        createdAt: now,
        updatedAt: now,
      },
    ]

    const contracts = toPaymentTransactionContracts(entities)
    assert.equal(contracts.length, 2)
    assert.equal(contracts[0].id, 'txn-b1')
    assert.equal(contracts[1].id, 'txn-b2')
  })

  it('toRefundRecordContracts 批量映射', () => {
    const now = new Date()
    const entities: RefundRecord[] = [
      {
        id: 'ref-b1',
        originalTransactionId: 'txn-01',
        amount: 100,
        status: 'refunded',
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'ref-b2',
        originalTransactionId: 'txn-02',
        amount: 200,
        status: 'refunded',
        createdAt: now,
        updatedAt: now,
      },
    ]

    const contracts = toRefundRecordContracts(entities)
    assert.equal(contracts.length, 2)
    assert.equal(contracts[0].id, 'ref-b1')
    assert.equal(contracts[1].id, 'ref-b2')
  })
})

// ─── 合约: PayPay capture ─────────────────────────────

describe('[payment-gateway] 合约: capturePayPalOrder', () => {
  it('捕获已创建订单 → completed', async () => {
    const svc = makeService()
    const payResult = await svc.pay({
      orderId: 'order-capture',
      amount: 100,
      currency: 'USD',
      provider: 'paypal',
    })

    const providerResponse = payResult.providerResponse as any
    const captureResult = await svc.capturePayPalOrder(providerResponse?.orderId)
    assert.equal(captureResult.status, 'completed')
    assert.ok(captureResult.paidAt)
  })
})

// ─── 合约: 钱包余额操作 ───────────────────────────────

describe('[payment-gateway] 合约: wallet balance', () => {
  it('setWalletBalance / getWalletBalance 正确读写', () => {
    const svc = makeService()
    svc.setWalletBalance('user-w', 'CNY', 5000)
    assert.equal(svc.getWalletBalance('user-w', 'CNY'), 5000)

    svc.setWalletBalance('user-w', 'USD', 100)
    assert.equal(svc.getWalletBalance('user-w', 'USD'), 100)
  })

  it('未设置余额返回 0', () => {
    const svc = makeService()
    assert.equal(svc.getWalletBalance('nonexistent', 'CNY'), 0)
  })
})

// ─── 合约: 清除数据 ───────────────────────────────────

describe('[payment-gateway] 合约: clear', () => {
  it('clear 后交易记录为空', async () => {
    const svc = makeService()
    svc.setWalletBalance('user-c', 'CNY', 1000)

    await svc.pay({
      orderId: 'order-clear',
      amount: 500,
      currency: 'CNY',
      provider: 'local_wallet',
      metadata: { userId: 'user-c' },
    })

    assert.equal(svc.getAllTransactions().size, 1)

    svc.clear()
    assert.equal(svc.getAllTransactions().size, 0)
    assert.equal(svc.getWalletBalance('user-c', 'CNY'), 0)
  })
})
