import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
/**
 * PaymentGatewayService 单元测试
 *
 * 覆盖:
 * 1. PayPal 完整支付流程（create order → authorize → capture）
 * 2. Stripe PaymentIntent 创建 + webhook 验签
 * 3. PayPay QR 生成（JPY only）
 * 4. 本地钱包余额扣减（余额不足时返回 failed）
 * 5. 退款（全额 + 部分）
 * 6. 不支持货币时拒绝（PayPay 不支持 USD）
 * 7. 支付失败返回 failed status
 * 8. provider 的 query 返回最新状态
 */

import {
  PaymentGatewayService,
  PaymentError,
  type PaymentRequest,
  type RefundRequest,
  type PaymentProvider
} from './payment-gateway.service'

describe('PaymentGatewayService', () => {
  let service: PaymentGatewayService

  beforeEach(() => {
    service = new PaymentGatewayService()
    vi.useFakeTimers()
  })

  afterEach(() => {
    service.clear()
    vi.useRealTimers()
  })

  // ═══════════════════════════════════════════════════════════════
  // 1. PayPal 完整支付流程
  // ═══════════════════════════════════════════════════════════════

  describe('PayPal 支付流程', () => {
    it('创建 PayPal 订单返回 pending 状态和 approvalUrl', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-PP-001',
        amount: 100,
        currency: 'USD',
        provider: 'paypal',
        returnUrl: 'https://example.com/return',
        webhookUrl: 'https://example.com/webhook'
      }

      const result = await service.pay(request)

      expect(result.status).toBe('pending')
      expect(result.provider).toBe('paypal')
      expect(result.amount).toBe(100)
      expect(result.currency).toBe('USD')
      expect(result.transactionId).toBeTruthy()
      expect(result.providerResponse).toBeDefined()
      expect(result.providerResponse?.approvalUrl).toContain('token=')
    })

    it('PayPal capture 将 pending 转为 completed', async () => {
      // 先创建订单
      const request: PaymentRequest = {
        orderId: 'ORD-PP-002',
        amount: 200,
        currency: 'USD',
        provider: 'paypal'
      }

      const createResult = await service.pay(request)
      const paypalOrderId = createResult.providerResponse?.orderId as string

      // 模拟用户授权后 capture
      const captureResult = await service.capturePayPalOrder(paypalOrderId)

      expect(captureResult.status).toBe('completed')
      expect(captureResult.paidAt).toBeDefined()
      expect(captureResult.providerResponse?.status).toBe('COMPLETED')
      expect(captureResult.providerResponse?.captureId).toBeTruthy()
    })

    it('PayPal capture 查询最新状态', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-PP-003',
        amount: 300,
        currency: 'USD',
        provider: 'paypal'
      }

      const createResult = await service.pay(request)
      const paypalOrderId = createResult.providerResponse?.orderId as string

      // capture 前查询 - 应该是 pending
      const pendingResult = await service.query(createResult.transactionId)
      expect(pendingResult.status).toBe('pending')

      // capture
      await service.capturePayPalOrder(paypalOrderId)

      // capture 后查询 - 应该是 completed
      const completedResult = await service.query(createResult.transactionId)
      expect(completedResult.status).toBe('completed')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 2. Stripe PaymentIntent 创建 + webhook 验签
  // ═══════════════════════════════════════════════════════════════

  describe('Stripe 支付流程', () => {
    it('创建 Stripe PaymentIntent 返回 pending 状态和 clientSecret', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-STRIPE-001',
        amount: 150,
        currency: 'USD',
        provider: 'stripe',
        locale: 'en-US',
        returnUrl: 'https://example.com/return'
      }

      const result = await service.pay(request)

      expect(result.status).toBe('pending')
      expect(result.provider).toBe('stripe')
      expect(result.amount).toBe(150)
      expect(result.currency).toBe('USD')
      expect(result.transactionId).toBeTruthy()
      expect(result.providerResponse).toBeDefined()
      expect(result.providerResponse?.clientSecret).toContain('pi_')
      expect(result.providerResponse?.paymentIntentId).toContain('pi_')
    })

    it('Stripe webhook 验签成功（正确格式）', async () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' })
      const headers = {
        'stripe-signature': 't=1234567890,v1=abc123def456'
      }

      const isValid = await service.verifyWebhook('stripe', payload, headers)

      expect(isValid).toBe(true)
    })

    it('Stripe webhook 验签失败（缺少签名）', async () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' })
      const headers = {}

      const isValid = await service.verifyWebhook('stripe', payload, headers)

      expect(isValid).toBe(false)
    })

    it('Stripe webhook 验签失败（格式不完整）', async () => {
      const payload = JSON.stringify({ type: 'payment_intent.succeeded' })
      const headers = {
        'stripe-signature': 't=1234567890' // 缺少 v1
      }

      const isValid = await service.verifyWebhook('stripe', payload, headers)

      expect(isValid).toBe(false)
    })

    it('Stripe 查询返回 pending 状态', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-STRIPE-002',
        amount: 250,
        currency: 'JPY',
        provider: 'stripe'
      }

      const result = await service.pay(request)
      const queried = await service.query(result.transactionId)

      expect(queried.status).toBe('pending')
      expect(queried.transactionId).toBe(result.transactionId)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 3. PayPay QR 生成
  // ═══════════════════════════════════════════════════════════════

  describe('PayPay 支付流程', () => {
    it('PayPay QR 生成返回 JPY 订单', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-PPAY-001',
        amount: 1000,
        currency: 'JPY',
        provider: 'paypay',
        webhookUrl: 'https://example.com/webhook'
      }

      const result = await service.pay(request)

      expect(result.status).toBe('pending')
      expect(result.provider).toBe('paypay')
      expect(result.amount).toBe(1000)
      expect(result.currency).toBe('JPY')
      expect(result.providerResponse).toBeDefined()
      expect(result.providerResponse?.codeType).toBe('ORDER_QR')
      expect(result.providerResponse?.codeData).toBeDefined()
      expect((result.providerResponse as any)?.codeData?.url).toContain('paypay://qr/')
    })

    it('PayPay 查询返回 pending 状态', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-PPAY-002',
        amount: 2000,
        currency: 'JPY',
        provider: 'paypay'
      }

      const result = await service.pay(request)
      const queried = await service.query(result.transactionId)

      expect(queried.status).toBe('pending')
      expect(queried.provider).toBe('paypay')
    })

    it('PayPay webhook 验签成功', async () => {
      const payload = JSON.stringify({ result: 'SUCCESS' })
      const headers = {
        'x-paypay-result-code': 'SUCCESS',
        'x-paypay-response-signature': 'sig123'
      }

      const isValid = await service.verifyWebhook('paypay', payload, headers)

      expect(isValid).toBe(true)
    })

    it('PayPay webhook 验签失败（缺少 header）', async () => {
      const payload = JSON.stringify({ result: 'SUCCESS' })
      const headers = {}

      const isValid = await service.verifyWebhook('paypay', payload, headers)

      expect(isValid).toBe(false)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 4. 本地钱包余额扣减
  // ═══════════════════════════════════════════════════════════════

  describe('本地钱包支付', () => {
    it('余额充足时支付成功', async () => {
      const userId = 'user-wallet-001'
      service.setWalletBalance(userId, 'USD', 500)

      const request: PaymentRequest = {
        orderId: 'ORD-WALLET-001',
        amount: 200,
        currency: 'USD',
        provider: 'local_wallet',
        metadata: { userId }
      }

      const result = await service.pay(request)

      expect(result.status).toBe('completed')
      expect(result.paidAt).toBeDefined()
      expect(result.providerResponse?.userId).toBe(userId)
      expect(result.providerResponse?.balanceAfter).toBe(300)
    })

    it('余额不足时支付失败', async () => {
      const userId = 'user-wallet-002'
      service.setWalletBalance(userId, 'USD', 50)

      const request: PaymentRequest = {
        orderId: 'ORD-WALLET-002',
        amount: 200,
        currency: 'USD',
        provider: 'local_wallet',
        metadata: { userId }
      }

      const result = await service.pay(request)

      expect(result.status).toBe('failed')
      expect(result.error).toBe('Insufficient balance')
    })

    it('余额为零时支付失败', async () => {
      const userId = 'user-wallet-003'
      // 不设置余额，默认为 0

      const request: PaymentRequest = {
        orderId: 'ORD-WALLET-003',
        amount: 100,
        currency: 'USD',
        provider: 'local_wallet',
        metadata: { userId }
      }

      const result = await service.pay(request)

      expect(result.status).toBe('failed')
      expect(result.error).toBe('Insufficient balance')
    })

    it('本地钱包查询返回最新余额状态', async () => {
      const userId = 'user-wallet-004'
      service.setWalletBalance(userId, 'USD', 1000)

      const request: PaymentRequest = {
        orderId: 'ORD-WALLET-004',
        amount: 300,
        currency: 'USD',
        provider: 'local_wallet',
        metadata: { userId }
      }

      const result = await service.pay(request)
      const queried = await service.query(result.transactionId)

      expect(queried.status).toBe('completed')
      expect(queried.providerResponse?.balanceAfter).toBe(700)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 5. 退款（全额 + 部分）
  // ═══════════════════════════════════════════════════════════════

  describe('退款流程', () => {
    it('PayPal 全额退款', async () => {
      // 创建 PayPal 支付
      const payRequest: PaymentRequest = {
        orderId: 'ORD-REFUND-001',
        amount: 500,
        currency: 'USD',
        provider: 'paypal'
      }
      const payResult = await service.pay(payRequest)

      // capture 使其完成
      const orderId = payResult.providerResponse?.orderId as string
      await service.capturePayPalOrder(orderId)

      // 发起全额退款
      const refundRequest: RefundRequest = {
        transactionId: payResult.transactionId,
        reason: 'Customer request'
      }
      const refundResult = await service.refund(refundRequest)

      expect(refundResult.status).toBe('refunded')
      expect(refundResult.amount).toBe(500)
      expect(refundResult.providerResponse?.originalTransactionId).toBe(payResult.transactionId)
    })

    it('PayPal 部分退款', async () => {
      // 创建 PayPal 支付
      const payRequest: PaymentRequest = {
        orderId: 'ORD-REFUND-002',
        amount: 1000,
        currency: 'USD',
        provider: 'paypal'
      }
      const payResult = await service.pay(payRequest)

      // capture 使其完成
      const orderId = payResult.providerResponse?.orderId as string
      await service.capturePayPalOrder(orderId)

      // 发起部分退款
      const refundRequest: RefundRequest = {
        transactionId: payResult.transactionId,
        amount: 300,
        reason: 'Partial refund'
      }
      const refundResult = await service.refund(refundRequest)

      expect(refundResult.status).toBe('refunded')
      expect(refundResult.amount).toBe(300)
    })

    it('本地钱包全额退款（返还余额）', async () => {
      const userId = 'user-refund-001'
      service.setWalletBalance(userId, 'USD', 1000)

      // 创建钱包支付
      const payRequest: PaymentRequest = {
        orderId: 'ORD-REFUND-003',
        amount: 500,
        currency: 'USD',
        provider: 'local_wallet',
        metadata: { userId }
      }
      const payResult = await service.pay(payRequest)

      // 退款
      const refundRequest: RefundRequest = {
        transactionId: payResult.transactionId,
        reason: 'Customer request'
      }
      const refundResult = await service.refund(refundRequest)

      expect(refundResult.status).toBe('refunded')
      expect(refundResult.amount).toBe(500)

      // 验证余额已返还
      const balance = service.getWalletBalance(userId, 'USD')
      expect(balance).toBe(1000) // 500(初始) - 500(支付) + 500(退款) = 500... 等等，初始是1000，支付扣了500，退还500 = 1000
    })

    it('本地钱包部分退款（返还部分余额）', async () => {
      const userId = 'user-refund-002'
      service.setWalletBalance(userId, 'USD', 1000)

      // 创建钱包支付
      const payRequest: PaymentRequest = {
        orderId: 'ORD-REFUND-004',
        amount: 500,
        currency: 'USD',
        provider: 'local_wallet',
        metadata: { userId }
      }
      const payResult = await service.pay(payRequest)

      // 部分退款
      const refundRequest: RefundRequest = {
        transactionId: payResult.transactionId,
        amount: 200,
        reason: 'Partial refund'
      }
      const refundResult = await service.refund(refundRequest)

      expect(refundResult.status).toBe('refunded')
      expect(refundResult.amount).toBe(200)

      // 验证余额：1000 - 500 + 200 = 700
      const balance = service.getWalletBalance(userId, 'USD')
      expect(balance).toBe(700)
    })

    it('退款查询返回退款状态', async () => {
      // 创建并完成支付
      const payRequest: PaymentRequest = {
        orderId: 'ORD-REFUND-005',
        amount: 300,
        currency: 'USD',
        provider: 'paypal'
      }
      const payResult = await service.pay(payRequest)
      const orderId = payResult.providerResponse?.orderId as string
      await service.capturePayPalOrder(orderId)

      // 退款
      const refundRequest: RefundRequest = {
        transactionId: payResult.transactionId,
        amount: 300
      }
      const refundResult = await service.refund(refundRequest)

      // 查询退款状态
      const queried = await service.queryRefund(refundResult.transactionId)

      expect(queried.status).toBe('refunded')
      expect(queried.transactionId).toBe(refundResult.transactionId)
    })

    it('退款金额超限抛错', async () => {
      // 创建并完成支付
      const payRequest: PaymentRequest = {
        orderId: 'ORD-REFUND-006',
        amount: 200,
        currency: 'USD',
        provider: 'paypal'
      }
      const payResult = await service.pay(payRequest)
      const orderId = payResult.providerResponse?.orderId as string
      await service.capturePayPalOrder(orderId)

      // 尝试退款超限金额
      const refundRequest: RefundRequest = {
        transactionId: payResult.transactionId,
        amount: 500 // 超过 200
      }

      await expect(service.refund(refundRequest)).rejects.toThrow('Refund amount exceeds original amount')
    })

    it('对未完成支付退款抛错', async () => {
      // 创建支付但不 capture
      const payRequest: PaymentRequest = {
        orderId: 'ORD-REFUND-007',
        amount: 100,
        currency: 'USD',
        provider: 'paypal'
      }
      const payResult = await service.pay(payRequest)

      // 尝试退款
      const refundRequest: RefundRequest = {
        transactionId: payResult.transactionId
      }

      await expect(service.refund(refundRequest)).rejects.toThrow('Cannot refund transaction with status: pending')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 6. 不支持货币时拒绝
  // ═══════════════════════════════════════════════════════════════

  describe('货币支持验证', () => {
    it('PayPay 不支持 USD - 抛错', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-CURR-001',
        amount: 100,
        currency: 'USD',
        provider: 'paypay'
      }

      await expect(service.pay(request)).rejects.toThrow('Currency USD is not supported by paypay')
    })

    it('PayPay 支持 JPY - 成功', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-CURR-002',
        amount: 1000,
        currency: 'JPY',
        provider: 'paypay'
      }

      const result = await service.pay(request)

      expect(result.status).toBe('pending')
      expect(result.currency).toBe('JPY')
    })

    it('Alipay 只支持 CNY/HKD', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-CURR-003',
        amount: 100,
        currency: 'USD',
        provider: 'alipay'
      }

      await expect(service.pay(request)).rejects.toThrow('Currency USD is not supported by alipay')
    })

    it('WeChat Pay 只支持 CNY/HKD', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-CURR-004',
        amount: 100,
        currency: 'JPY',
        provider: 'wechat_pay'
      }

      await expect(service.pay(request)).rejects.toThrow('Currency JPY is not supported by wechat_pay')
    })

    it('Stripe 支持多币种', async () => {
      const currencies: Array<{ curr: 'CNY' | 'USD' | 'JPY' | 'HKD' | 'THB' | 'VND' | 'MYR' | 'SGD'; expected: boolean }> = [
        { curr: 'CNY', expected: true },
        { curr: 'USD', expected: true },
        { curr: 'JPY', expected: true },
        { curr: 'HKD', expected: true },
        { curr: 'THB', expected: true },
        { curr: 'VND', expected: true },
        { curr: 'MYR', expected: true },
        { curr: 'SGD', expected: true }
      ]

      for (const { curr, expected } of currencies) {
        const request: PaymentRequest = {
          orderId: `ORD-CURR-STRIPE-${curr}`,
          amount: 100,
          currency: curr,
          provider: 'stripe'
        }
        const result = await service.pay(request)
        if (expected) {
          expect(result.status).toBe('pending')
        }
      }
    })

    it('isCurrencySupported 正确返回', () => {
      expect(service.isCurrencySupported('USD')).toBe(true)
      expect(service.isCurrencySupported('JPY')).toBe(true)
      expect(service.isCurrencySupported('CNY')).toBe(true)
      expect(service.isCurrencySupported('EUR' as any)).toBe(false) // 不在支持列表
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 7. 支付失败返回 failed status
  // ═══════════════════════════════════════════════════════════════

  describe('支付失败处理', () => {
    it('本地钱包余额不足返回 failed', async () => {
      const userId = 'user-fail-001'
      service.setWalletBalance(userId, 'USD', 10)

      const request: PaymentRequest = {
        orderId: 'ORD-FAIL-001',
        amount: 100,
        currency: 'USD',
        provider: 'local_wallet',
        metadata: { userId }
      }

      const result = await service.pay(request)

      expect(result.status).toBe('failed')
      expect(result.error).toBe('Insufficient balance')
    })

    it('无效金额抛错', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-FAIL-002',
        amount: -100,
        currency: 'USD',
        provider: 'paypal'
      }

      await expect(service.pay(request)).rejects.toThrow('amount must be > 0')
    })

    it('无效金额（零）抛错', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-FAIL-003',
        amount: 0,
        currency: 'USD',
        provider: 'paypal'
      }

      await expect(service.pay(request)).rejects.toThrow('amount must be > 0')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 8. provider 的 query 返回最新状态
  // ═══════════════════════════════════════════════════════════════

  describe('交易状态查询', () => {
    it('query 返回 pending 状态的交易', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-QUERY-001',
        amount: 100,
        currency: 'USD',
        provider: 'stripe'
      }

      const result = await service.pay(request)
      const queried = await service.query(result.transactionId)

      expect(queried.status).toBe('pending')
      expect(queried.transactionId).toBe(result.transactionId)
      expect(queried.provider).toBe('stripe')
    })

    it('query 不存在的交易抛错', async () => {
      await expect(service.query('TXN-NONEXISTENT')).rejects.toThrow('Transaction TXN-NONEXISTENT not found')
    })

    it('Stripe webhook 回调后状态更新（模拟）', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-QUERY-002',
        amount: 100,
        currency: 'USD',
        provider: 'stripe',
        webhookUrl: 'https://example.com/webhook'
      }

      const result = await service.pay(request)

      // 等待 webhook 处理
      await vi.advanceTimersByTimeAsync(200)

      const queried = await service.query(result.transactionId)
      expect(queried.status).toBe('completed')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 地区支持的支付方式
  // ═══════════════════════════════════════════════════════════════

  describe('getSupportedProviders 按地区', () => {
    it('日本返回 PayPay/Stripe/PayPal/本地钱包', () => {
      const providers = service.getSupportedProviders('JP')
      expect(providers).toContain('paypay')
      expect(providers).toContain('stripe')
      expect(providers).toContain('paypal')
      expect(providers).toContain('local_wallet')
    })

    it('中国大陆返回支付宝/微信/Stripe/本地钱包', () => {
      const providers = service.getSupportedProviders('CN')
      expect(providers).toContain('alipay')
      expect(providers).toContain('wechat_pay')
      expect(providers).toContain('stripe')
      expect(providers).toContain('local_wallet')
    })

    it('香港返回支付宝/微信/Stripe/本地钱包', () => {
      const providers = service.getSupportedProviders('HK')
      expect(providers).toContain('alipay')
      expect(providers).toContain('wechat_pay')
      expect(providers).toContain('stripe')
      expect(providers).toContain('local_wallet')
    })

    it('东南亚返回 Stripe/PayPal/本地钱包', () => {
      const providers = service.getSupportedProviders('TH')
      expect(providers).toContain('stripe')
      expect(providers).toContain('paypal')
      expect(providers).toContain('local_wallet')
      expect(providers).not.toContain('alipay')
      expect(providers).not.toContain('wechat_pay')
    })

    it('美国/欧洲返回 PayPal/Stripe/本地钱包', () => {
      const providers = service.getSupportedProviders('US')
      expect(providers).toContain('paypal')
      expect(providers).toContain('stripe')
      expect(providers).toContain('local_wallet')
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // webhook 验证
  // ═══════════════════════════════════════════════════════════════

  describe('verifyWebhook 各 provider', () => {
    it('PayPal webhook 验证成功', async () => {
      const payload = JSON.stringify({ event_type: 'CHECKOUT.ORDER.APPROVED' })
      const headers = {
        'paypal-transmission-sig': 'sig123',
        'paypal-transmission-id': 'id123',
        'paypal-transmission-time': '2026-07-03T10:00:00Z',
        'paypal-cert-url': 'https://api.paypal.com/cert'
      }

      const isValid = await service.verifyWebhook('paypal', payload, headers)

      expect(isValid).toBe(true)
    })

    it('PayPal webhook 验证失败（缺少 header）', async () => {
      const payload = JSON.stringify({ event_type: 'CHECKOUT.ORDER.APPROVED' })
      const headers = {}

      const isValid = await service.verifyWebhook('paypal', payload, headers)

      expect(isValid).toBe(false)
    })

    it('Alipay webhook 验证', async () => {
      const payload = JSON.stringify({ trade_status: 'TRADE_SUCCESS' })
      const headers = {
        'x-alibaba-signature': 'sig123'
      }

      const isValid = await service.verifyWebhook('alipay', payload, headers)

      expect(isValid).toBe(true)
    })

    it('WeChat Pay webhook 验证', async () => {
      const payload = JSON.stringify({ return_code: 'SUCCESS' })
      const headers = {
        'x-signature': 'sig123'
      }

      const isValid = await service.verifyWebhook('wechat_pay', payload, headers)

      expect(isValid).toBe(true)
    })

    it('本地钱包不需要 webhook 验证', async () => {
      const payload = '{}'
      const headers = {}

      const isValid = await service.verifyWebhook('local_wallet', payload, headers)

      expect(isValid).toBe(true)
    })
  })

  // ═══════════════════════════════════════════════════════════════
  // 第三方支付（支付宝/微信）
  // ═══════════════════════════════════════════════════════════════

  describe('第三方支付', () => {
    it('支付宝创建支付返回 pending', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-ALI-001',
        amount: 100,
        currency: 'CNY',
        provider: 'alipay'
      }

      const result = await service.pay(request)

      expect(result.status).toBe('pending')
      expect(result.provider).toBe('alipay')
      expect(result.providerResponse?.codeUrl).toContain('qr.alipay.com')
    })

    it('微信支付创建支付返回 pending', async () => {
      const request: PaymentRequest = {
        orderId: 'ORD-WX-001',
        amount: 100,
        currency: 'CNY',
        provider: 'wechat_pay'
      }

      const result = await service.pay(request)

      expect(result.status).toBe('pending')
      expect(result.provider).toBe('wechat_pay')
      expect(result.providerResponse?.codeUrl).toContain('qr.wechat.com')
    })
  })
})
