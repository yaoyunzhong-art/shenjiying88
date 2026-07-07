/**
 * PaymentGatewayDto 单元测试
 *
 * T117-3: 本地化支付
 * 覆盖 PayRequestDto / RefundRequestDto / QueryPaymentDto / QueryRefundDto 的
 * 类型正确性和构造行为（class-validator 类需运行在 NestJS 环境中）
 */

import { describe, it, expect } from 'vitest'
import {
  PayRequestDto,
  PayResultDto,
  RefundRequestDto,
  QueryPaymentDto,
  QueryRefundDto,
} from './payment-gateway.dto'

describe('PaymentGateway DTO', () => {
  // ── PayRequestDto ──────────────────────────────────────────────────────────

  describe('PayRequestDto', () => {
    it('should construct with all required fields', () => {
      const dto = new PayRequestDto()
      dto.orderId = 'ORD-001'
      dto.amount = 1000
      dto.currency = 'USD' as any
      dto.provider = 'paypal' as any

      expect(dto.orderId).toBe('ORD-001')
      expect(dto.amount).toBe(1000)
      expect(dto.currency).toBe('USD')
      expect(dto.provider).toBe('paypal')
    })

    it('should construct with optional fields', () => {
      const dto = new PayRequestDto()
      dto.orderId = 'ORD-002'
      dto.amount = 5000
      dto.currency = 'JPY' as any
      dto.provider = 'paypay' as any
      dto.metadata = { userId: 'u-1' }
      dto.locale = 'ja-JP'
      dto.returnUrl = 'https://example.com/return'
      dto.webhookUrl = 'https://example.com/webhook'

      expect(dto.metadata).toEqual({ userId: 'u-1' })
      expect(dto.locale).toBe('ja-JP')
      expect(dto.returnUrl).toBe('https://example.com/return')
      expect(dto.webhookUrl).toBe('https://example.com/webhook')
    })

    it('should allow missing optional fields', () => {
      const dto = new PayRequestDto()
      dto.orderId = 'ORD-003'
      dto.amount = 100
      dto.currency = 'CNY' as any
      dto.provider = 'alipay' as any

      expect(dto.metadata).toBeUndefined()
      expect(dto.locale).toBeUndefined()
      expect(dto.returnUrl).toBeUndefined()
      expect(dto.webhookUrl).toBeUndefined()
    })
  })

  // ── PayResultDto ───────────────────────────────────────────────────────────

  describe('PayResultDto', () => {
    it('should construct with completed status', () => {
      const dto = new PayResultDto()
      dto.transactionId = 'TXN-001'
      dto.status = 'completed' as any
      dto.provider = 'local_wallet' as any
      dto.amount = 200
      dto.currency = 'USD' as any
      dto.paidAt = new Date('2026-07-06T12:00:00Z')

      expect(dto.transactionId).toBe('TXN-001')
      expect(dto.status).toBe('completed')
      expect(dto.paidAt).toBeInstanceOf(Date)
    })

    it('should construct with failed status and error message', () => {
      const dto = new PayResultDto()
      dto.transactionId = 'TXN-002'
      dto.status = 'failed' as any
      dto.provider = 'local_wallet' as any
      dto.amount = 500
      dto.currency = 'USD' as any
      dto.error = 'Insufficient balance'

      expect(dto.status).toBe('failed')
      expect(dto.error).toBe('Insufficient balance')
    })

    it('should include provider response when available', () => {
      const dto = new PayResultDto()
      dto.transactionId = 'TXN-003'
      dto.status = 'pending' as any
      dto.provider = 'paypal' as any
      dto.amount = 300
      dto.currency = 'USD' as any
      dto.providerResponse = { approvalUrl: 'https://paypal.com/approve' }

      expect(dto.providerResponse).toBeDefined()
      expect(dto.providerResponse!.approvalUrl).toContain('paypal.com')
    })
  })

  // ── RefundRequestDto ───────────────────────────────────────────────────────

  describe('RefundRequestDto', () => {
    it('should construct with required transactionId', () => {
      const dto = new RefundRequestDto()
      dto.transactionId = 'TXN-001'

      expect(dto.transactionId).toBe('TXN-001')
      expect(dto.amount).toBeUndefined()
      expect(dto.reason).toBeUndefined()
    })

    it('should construct with optional amount', () => {
      const dto = new RefundRequestDto()
      dto.transactionId = 'TXN-002'
      dto.amount = 500

      expect(dto.amount).toBe(500)
    })

    it('should construct with optional reason', () => {
      const dto = new RefundRequestDto()
      dto.transactionId = 'TXN-003'
      dto.reason = 'Customer request'

      expect(dto.reason).toBe('Customer request')
    })

    it('should construct with all fields', () => {
      const dto = new RefundRequestDto()
      dto.transactionId = 'TXN-004'
      dto.amount = 1000
      dto.reason = 'Partial refund'

      expect(dto.transactionId).toBe('TXN-004')
      expect(dto.amount).toBe(1000)
      expect(dto.reason).toBe('Partial refund')
    })
  })

  // ── QueryPaymentDto ────────────────────────────────────────────────────────

  describe('QueryPaymentDto', () => {
    it('should construct with transaction id', () => {
      const dto = new QueryPaymentDto()
      dto.transactionId = 'TXN-001'

      expect(dto.transactionId).toBe('TXN-001')
    })
  })

  // ── QueryRefundDto ─────────────────────────────────────────────────────────

  describe('QueryRefundDto', () => {
    it('should construct with refund id', () => {
      const dto = new QueryRefundDto()
      dto.refundId = 'REF-001'

      expect(dto.refundId).toBe('REF-001')
    })
  })

  // ── DTO 类型安全验证 ────────────────────────────────────────────────────────

  describe('DTO type consistency', () => {
    it('PayResultDto should be compatible with service PaymentResult', () => {
      // PayResultDto 字段与 service 的 PaymentResult 接口兼容
      const result: PayResultDto = {
        transactionId: 'TXN-001',
        status: 'completed' as any,
        provider: 'stripe' as any,
        amount: 100,
        currency: 'USD' as any,
        paidAt: new Date(),
      }

      expect(result.transactionId).toBe('TXN-001')
      expect(result.status).toBe('completed')
      expect(result.amount).toBe(100)
    })

    it('should handle all possible payment statuses', () => {
      const statuses = ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled']
      for (const status of statuses) {
        const dto = new PayResultDto()
        dto.transactionId = 'TXN'
        dto.status = status as any
        dto.provider = 'stripe' as any
        dto.amount = 100
        dto.currency = 'USD' as any

        expect(dto.status).toBe(status)
      }
    })

    it('should handle all possible payment providers', () => {
      const providers = ['paypal', 'stripe', 'paypay', 'alipay', 'wechat_pay', 'local_wallet']
      for (const provider of providers) {
        const dto = new PayResultDto()
        dto.transactionId = 'TXN'
        dto.status = 'pending' as any
        dto.provider = provider as any
        dto.amount = 100
        dto.currency = 'USD' as any

        expect(dto.provider).toBe(provider)
      }
    })

    it('should handle all possible currencies', () => {
      const currencies = ['CNY', 'USD', 'JPY', 'HKD', 'THB', 'VND', 'MYR', 'SGD']
      for (const currency of currencies) {
        const dto = new PayRequestDto()
        dto.orderId = 'ORD'
        dto.amount = 100
        dto.currency = currency as any
        dto.provider = 'stripe' as any

        expect(dto.currency).toBe(currency)
      }
    })
  })
})
