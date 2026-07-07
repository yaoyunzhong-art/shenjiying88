import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import { PaymentGatewayService, PaymentError, PaymentRequest, RefundRequest } from './payment-gateway.service'

describe('PaymentGatewayService', () => {
  let service: PaymentGatewayService

  beforeEach(() => {
    service = new PaymentGatewayService()
  })

  describe('pay', () => {
    it('should create payment with PayPal', async () => {
      const request: PaymentRequest = {
        orderId: 'order1',
        amount: 1000,
        currency: 'USD',
        provider: 'paypal',
      }
      const result = await service.pay(request)
      expect(result.transactionId).toBeDefined()
      expect(result.status).toBe('pending')
    })

    it('should create payment with Stripe', async () => {
      const request: PaymentRequest = {
        orderId: 'order1',
        amount: 1000,
        currency: 'USD',
        provider: 'stripe',
      }
      const result = await service.pay(request)
      expect(result.transactionId).toBeDefined()
    })

    it('should throw error for invalid amount', async () => {
      const request: PaymentRequest = {
        orderId: 'order1',
        amount: 0,
        currency: 'USD',
        provider: 'paypal',
      }
      await expect(service.pay(request)).rejects.toThrow()
    })

    it('should throw error for unsupported currency', async () => {
      const request: PaymentRequest = {
        orderId: 'order1',
        amount: 1000,
        currency: 'EUR' as any,
        provider: 'paypay',
      }
      await expect(service.pay(request)).rejects.toThrow()
    })

    it('should pay with local wallet', async () => {
      service.setWalletBalance('user1', 'USD', 5000)
      const request: PaymentRequest = {
        orderId: 'order1',
        amount: 1000,
        currency: 'USD',
        provider: 'local_wallet',
        metadata: { userId: 'user1' },
      }
      const result = await service.pay(request)
      expect(result.status).toBe('completed')
    })
  })

  describe('query', () => {
    it('should return payment result', async () => {
      const request: PaymentRequest = {
        orderId: 'order1',
        amount: 1000,
        currency: 'USD',
        provider: 'paypal',
      }
      const payment = await service.pay(request)
      const result = await service.query(payment.transactionId)
      expect(result.transactionId).toBe(payment.transactionId)
    })

    it('should throw error for non-existent transaction', async () => {
      await expect(service.query('nonexistent')).rejects.toThrow()
    })
  })

  describe('refund', () => {
    it('should refund completed payment', async () => {
      service.setWalletBalance('user1', 'USD', 5000)
      const payment = await service.pay({
        orderId: 'order1',
        amount: 1000,
        currency: 'USD',
        provider: 'local_wallet',
        metadata: { userId: 'user1' },
      })
      const refundRequest: RefundRequest = {
        transactionId: payment.transactionId,
      }
      const result = await service.refund(refundRequest)
      expect(result.status).toBe('refunded')
    })
  })

  describe('queryRefund', () => {
    it('should return refund result', async () => {
      service.setWalletBalance('user1', 'USD', 5000)
      const payment = await service.pay({
        orderId: 'order1',
        amount: 1000,
        currency: 'USD',
        provider: 'local_wallet',
        metadata: { userId: 'user1' },
      })
      const refund = await service.refund({ transactionId: payment.transactionId })
      const result = await service.queryRefund(refund.transactionId)
      expect(result.transactionId).toBe(refund.transactionId)
    })
  })

  describe('verifyWebhook', () => {
    it('should verify PayPal webhook', async () => {
      const result = await service.verifyWebhook('paypal', '{}', {
        'paypal-transmission-sig': 'sig',
        'paypal-transmission-id': 'id',
        'paypal-transmission-time': 'time',
        'paypal-cert-url': 'url',
      })
      expect(result).toBe(true)
    })

    it('should verify Stripe webhook', async () => {
      const result = await service.verifyWebhook('stripe', '{}', {
        'stripe-signature': 't=123,v1=abc',
      })
      expect(result).toBe(true)
    })
  })

  describe('getSupportedProviders', () => {
    it('should return providers for China', () => {
      const providers = service.getSupportedProviders('CN')
      expect(providers).toContain('alipay')
      expect(providers).toContain('wechat_pay')
    })

    it('should return providers for Japan', () => {
      const providers = service.getSupportedProviders('JP')
      expect(providers).toContain('paypay')
    })
  })

  describe('isCurrencySupported', () => {
    it('should return true for supported currency', () => {
      expect(service.isCurrencySupported('USD')).toBe(true)
      expect(service.isCurrencySupported('CNY')).toBe(true)
    })

    it('should return false for unsupported currency', () => {
      expect(service.isCurrencySupported('EUR' as any)).toBe(false)
    })
  })

  describe('getWalletBalance', () => {
    it('should return wallet balance', () => {
      service.setWalletBalance('user1', 'USD', 5000)
      const balance = service.getWalletBalance('user1', 'USD')
      expect(balance).toBe(5000)
    })

    it('should return 0 for non-existent balance', () => {
      const balance = service.getWalletBalance('user1', 'USD')
      expect(balance).toBe(0)
    })
  })
})
