/**
 * payment-gateway-ringbeam.test.ts - V17#圈梁 Phase3 支付网关模块
 * 用途: PRD对齐测试 - 验证多提供商支付/退款/本地钱包/WebHook/区域支持
 * 覆盖: 正例(PayPal+Stripe+本地钱包+退款) + 反例(无效金额/不支持货币/余额不足) + 边界(全退/部分退/区域切换)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PaymentGatewayService, PaymentError } from './payment-gateway.service'

describe('🔵 PaymentGatewayRingBeam: 支付网关PRD对齐', () => {
  let service: PaymentGatewayService

  beforeEach(() => {
    service = new PaymentGatewayService()
  })

  // ─── 1. 多提供商支付 ──────────────────────────────────────────

  describe('多提供商支付', () => {
    it('[P0] PayPal支付创建pending交易', async () => {
      const result = await service.pay({
        orderId: 'order-001',
        amount: 99.99,
        currency: 'USD',
        provider: 'paypal',
      })
      expect(result.transactionId).toContain('TXN-')
      expect(result.status).toBe('pending')
      expect(result.provider).toBe('paypal')
      expect(result.amount).toBe(99.99)
    })

    it('[P0] Stripe支付创建含paymentIntent的pending交易', async () => {
      const result = await service.pay({
        orderId: 'order-002',
        amount: 50,
        currency: 'CNY',
        provider: 'stripe',
      })
      expect(result.status).toBe('pending')
      expect(result.provider).toBe('stripe')
      expect(result.providerResponse).toBeDefined()
    })

    it('[P0] 本地钱包余额充足时支付成功', async () => {
      service.setWalletBalance('user-wallet', 'CNY', 1000)
      const result = await service.pay({
        orderId: 'order-003',
        amount: 500,
        currency: 'CNY',
        provider: 'local_wallet',
        metadata: { userId: 'user-wallet' },
      })
      expect(result.status).toBe('completed')
      expect(result.paidAt).toBeDefined()
    })

    it('[P1] 金额<=0时抛出INVALID_AMOUNT', async () => {
      await expect(service.pay({
        orderId: 'order-invalid',
        amount: 0,
        currency: 'USD',
        provider: 'paypal',
      })).rejects.toThrow(PaymentError)
    })

    it('[P1] 不支持的货币抛出PaymentError', async () => {
      await expect(service.pay({
        orderId: 'order-004',
        amount: 100,
        currency: 'VND' as any, // paypal不支持VND
        provider: 'paypal',
      })).rejects.toThrow(PaymentError)
    })
  })

  // ─── 2. 本地钱包 ──────────────────────────────────────────────

  describe('本地钱包', () => {
    it('[P0] set/getWalletBalance存取余额', () => {
      service.setWalletBalance('user-1', 'CNY', 500)
      expect(service.getWalletBalance('user-1', 'CNY')).toBe(500)
    })

    it('[P0] 余额不足时支付失败', async () => {
      service.setWalletBalance('user-poor', 'CNY', 10)
      const result = await service.pay({
        orderId: 'order-poor',
        amount: 100,
        currency: 'CNY',
        provider: 'local_wallet',
        metadata: { userId: 'user-poor' },
      })
      expect(result.status).toBe('failed')
      expect(result.error).toContain('Insufficient balance')
    })

    it('[P1] 多币种钱包独立管理', () => {
      service.setWalletBalance('user-multi', 'CNY', 100)
      service.setWalletBalance('user-multi', 'USD', 50)
      expect(service.getWalletBalance('user-multi', 'CNY')).toBe(100)
      expect(service.getWalletBalance('user-multi', 'USD')).toBe(50)
    })
  })

  // ─── 3. 退款 ──────────────────────────────────────────────────

  describe('退款', () => {
    it('[P0] 退款已完成交易成功', async () => {
      service.setWalletBalance('user-refund', 'CNY', 1000)
      const payResult = await service.pay({
        orderId: 'order-refund',
        amount: 200,
        currency: 'CNY',
        provider: 'local_wallet',
        metadata: { userId: 'user-refund' },
      })
      const refundResult = await service.refund({
        transactionId: payResult.transactionId,
        reason: '测试退款',
      })
      expect(refundResult.status).toBe('refunded')
      expect(refundResult.amount).toBe(200)
    })

    it('[P1] 退款金额不超过原金额', async () => {
      service.setWalletBalance('user-partial', 'CNY', 1000)
      const payResult = await service.pay({
        orderId: 'order-partial',
        amount: 100,
        currency: 'CNY',
        provider: 'local_wallet',
        metadata: { userId: 'user-partial' },
      })
      // local_wallet支付完成状态 = completed,可以退款
      expect(payResult.status).toBe('completed')
      const refundResult = await service.refund({
        transactionId: payResult.transactionId,
        amount: 50,
        reason: '部分退款',
      })
      expect(refundResult.status).toBe('refunded')
      expect(refundResult.amount).toBe(50)
    })

    it('[P1] 退款金额超过原金额抛出PaymentError', async () => {
      service.setWalletBalance('user-over', 'CNY', 1000)
      const payResult = await service.pay({
        orderId: 'order-over',
        amount: 100,
        currency: 'CNY',
        provider: 'local_wallet',
        metadata: { userId: 'user-over' },
      })
      await expect(service.refund({
        transactionId: payResult.transactionId,
        amount: 200,
      })).rejects.toThrow(PaymentError)
    })

    it('[P1] 不存在交易refund抛出PaymentError', async () => {
      await expect(service.refund({ transactionId: 'TXN-nonexistent' })).rejects.toThrow(PaymentError)
    })
  })

  // ─── 4. 区域支持 ──────────────────────────────────────────────

  describe('区域支付支持', () => {
    it('[P0] 中国地区支持alipay/wechat_pay/stripe', () => {
      const providers = service.getSupportedProviders('CN')
      expect(providers).toContain('alipay')
      expect(providers).toContain('wechat_pay')
      expect(providers).toContain('stripe')
    })

    it('[P0] 日本地区支持paypay/stripe/paypal', () => {
      const providers = service.getSupportedProviders('JP')
      expect(providers).toContain('paypay')
      expect(providers).toContain('stripe')
      expect(providers).toContain('paypal')
    })

    it('[P0] 默认地区支持paypal/stripe', () => {
      const providers = service.getSupportedProviders('US')
      expect(providers).toContain('paypal')
      expect(providers).toContain('stripe')
    })

    it('[P1] 不识别国家代码返回默认列表', () => {
      const providers = service.getSupportedProviders('XX')
      expect(providers).toContain('paypal')
      expect(providers).toContain('stripe')
    })
  })

  // ─── 5. WebHook验证 ───────────────────────────────────────────

  describe('WebHook验证', () => {
    it('[P0] PayPal webhook含必要header返回true', async () => {
      const valid = await service.verifyWebhook('paypal', '{}', {
        'paypal-transmission-sig': 'sig123',
        'paypal-transmission-id': 'id456',
        'paypal-transmission-time': Date.now().toString(),
      })
      expect(valid).toBe(true)
    })

    it('[P0] Stripe webhook含stripe-signature返回true', async () => {
      const valid = await service.verifyWebhook('stripe', '{}', {
        'stripe-signature': 't=123,v1=abc',
      })
      expect(valid).toBe(true)
    })

    it('[P1] PayPal缺header返回false', async () => {
      const valid = await service.verifyWebhook('paypal', '{}', {})
      expect(valid).toBe(false)
    })

    it('[P1] 未知提供商返回false', async () => {
      const valid = await service.verifyWebhook('unknown_provider' as any, '{}', {})
      expect(valid).toBe(false)
    })

    it('[P1] query返回交易详情', async () => {
      const payResult = await service.pay({
        orderId: 'order-query',
        amount: 10,
        currency: 'USD',
        provider: 'stripe',
      })
      const queryResult = await service.query(payResult.transactionId)
      expect(queryResult.transactionId).toBe(payResult.transactionId)
      expect(queryResult.amount).toBe(10)
    })
  })
})
