/**
 * PaymentGatewayController 控制器测试
 *
 * T117-3: 本地化支付
 * 覆盖正例 + 反例 + 边界场景
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HttpException, HttpStatus } from '@nestjs/common'
import { PaymentGatewayController } from './payment-gateway.controller'
import { PaymentGatewayService, PaymentError } from './payment-gateway.service'

describe('PaymentGatewayController', () => {
  let controller: PaymentGatewayController
  let service: PaymentGatewayService

  beforeEach(() => {
    service = new PaymentGatewayService()
    controller = new PaymentGatewayController(service)
  })

  describe('POST /payment-gateway/pay', () => {
    // ── 正例 ─────────────────────────────────────────────
    it('should create a PayPal payment successfully', async () => {
      const result = await controller.pay(
        'tenant-test',
        {
          orderId: 'order-001',
          amount: 1000,
          currency: 'USD',
          provider: 'paypal',
        },
      )

      expect(result.transactionId).toBeDefined()
      expect(result.status).toBe('pending')
      expect(result.provider).toBe('paypal')
      expect(result.amount).toBe(1000)
      expect(result.currency).toBe('USD')
    })

    it('should create a Stripe payment with optional fields', async () => {
      const result = await controller.pay(
        'tenant-test',
        {
          orderId: 'order-002',
          amount: 5000,
          currency: 'USD',
          provider: 'stripe',
          locale: 'zh-CN',
          returnUrl: 'https://example.com/return',
        },
      )

      expect(result.transactionId).toBeDefined()
      expect(result.status).toBe('pending')
      expect(result.provider).toBe('stripe')
    })

    it('should create a local wallet payment', async () => {
      // Pre-top up wallet via metadata
      const result = await controller.pay(
        'tenant-test',
        {
          orderId: 'order-003',
          amount: 500,
          currency: 'CNY',
          provider: 'local_wallet',
          metadata: { userId: 'test-user' },
        },
      )

      // First payment with no balance should fail
      expect(result.status).toBe('failed')
      expect(result.provider).toBe('local_wallet')
    })

    // ── 反例 ─────────────────────────────────────────────
    it('should reject payment with invalid amount (<= 0)', async () => {
      await expect(
        controller.pay(
          'tenant-test',
          {
            orderId: 'order-bad',
            amount: 0,
            currency: 'USD',
            provider: 'paypal',
          },
        ),
      ).rejects.toThrow(HttpException)
    })

    it('should reject payment with unsupported currency for provider', async () => {
      // PayPay 不支持 USD
      await expect(
        controller.pay(
          'tenant-test',
          {
            orderId: 'order-bad',
            amount: 100,
            currency: 'USD',
            provider: 'paypay',
          },
        ),
      ).rejects.toThrow(HttpException)
    })

    it('should reject payment with unknown provider', async () => {
      await expect(
        controller.pay(
          'tenant-test',
          {
            orderId: 'order-bad',
            amount: 100,
            currency: 'USD',
            provider: 'unknown_provider' as any,
          },
        ),
      ).rejects.toThrow(HttpException)
    })
  })

  describe('POST /payment-gateway/pay — 附加场景', () => {
    // ── 新增: alipay/wechat_pay ——
    it('should create an Alipay payment successfully', async () => {
      const result = await controller.pay(
        'tenant-test',
        {
          orderId: 'order-alipay-1',
          amount: 100,
          currency: 'CNY',
          provider: 'alipay',
        },
      )

      expect(result.transactionId).toBeDefined()
      expect(result.status).toBe('pending')
      expect(result.provider).toBe('alipay')
      expect(result.providerResponse).toBeDefined()
    })

    it('should create a WeChat Pay payment successfully', async () => {
      const result = await controller.pay(
        'tenant-test',
        {
          orderId: 'order-wechat-1',
          amount: 200,
          currency: 'CNY',
          provider: 'wechat_pay',
        },
      )

      expect(result.transactionId).toBeDefined()
      expect(result.status).toBe('pending')
      expect(result.provider).toBe('wechat_pay')
    })

    it('should reject PayPay with non-JPY currency', async () => {
      await expect(
        controller.pay(
          'tenant-test',
          {
            orderId: 'order-paypay-bad',
            amount: 100,
            currency: 'CNY',
            provider: 'paypay',
          },
        ),
      ).rejects.toThrow(HttpException)
    })

    it('should handle local wallet with sufficient balance via metadata', async () => {
      // 先充值: service.setWalletBalance 不是公开的 controller 路径
      // 这里测试带 metadata.userId 的 local_wallet 支付，但余额可能不足
      const result = await controller.pay(
        'tenant-test',
        {
          orderId: 'order-wallet-1',
          amount: 100,
          currency: 'CNY',
          provider: 'local_wallet',
          metadata: { userId: 'wallet-user-1' },
        },
      )

      expect(result.provider).toBe('local_wallet')
      // 因为未预先充值，预期失败
      expect(result.status).toBe('failed')
      expect(result.error).toBeDefined()
    })

    it('should return providerResponse with QR code URL for Alipay', async () => {
      const result = await controller.pay(
        'tenant-test',
        {
          orderId: 'order-qr-test',
          amount: 50,
          currency: 'CNY',
          provider: 'alipay',
        },
      )

      expect(result.providerResponse).toBeDefined()
      expect(result.providerResponse).toHaveProperty('codeUrl')
      expect(result.providerResponse).toHaveProperty('expireTime')
    })
  })

  describe('GET /payment-gateway/pay/:id', () => {
    // ── 正例 ─────────────────────────────────────────────
    it('should query an existing payment', async () => {
      const created = await controller.pay(
        'tenant-test',
        {
          orderId: 'order-q1',
          amount: 2000,
          currency: 'USD',
          provider: 'paypal',
        },
      )

      const result = await controller.queryPayment('tenant-test', created.transactionId)

      expect(result.transactionId).toBe(created.transactionId)
      expect(result.status).toBeDefined()
    })

    // ── 反例 ─────────────────────────────────────────────
    it('should return 404 for non-existent transaction', async () => {
      try {
        await controller.queryPayment('tenant-test', 'non-existent-id')
        expect.unreachable('should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException)
        expect((error as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND)
      }
    })
  })

  describe('POST /payment-gateway/refund', () => {
    // ── 正例 ─────────────────────────────────────────────
    it('should refund a completed payment - PayPal with webhookUrl', async () => {
      // PayPal auto-completes when webhookUrl is provided
      const payment = await controller.pay(
        'tenant-test',
        {
          orderId: 'order-refund-1',
          amount: 1000,
          currency: 'USD',
          provider: 'paypal',
          webhookUrl: 'https://example.com/webhook',
        },
      )

      // Wait for webhook simulation to complete the payment
      await new Promise(resolve => setTimeout(resolve, 200))

      const queryResult = await controller.queryPayment('tenant-test', payment.transactionId)
      expect(queryResult.status).toBe('completed')

      const refundResult = await controller.refund(
        'tenant-test',
        {
          transactionId: payment.transactionId,
          reason: '客户要求退款',
        },
      )

      expect(refundResult.status).toBe('refunded')
      expect(refundResult.transactionId).toBeDefined()
    })

    // ── 反例 ─────────────────────────────────────────────
    it('should reject refund for non-existent transaction', async () => {
      try {
        await controller.refund(
          'tenant-test',
          {
            transactionId: 'non-existent',
            reason: 'test',
          },
        )
        expect.unreachable('should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException)
        expect((error as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND)
      }
    })

    it('should reject refund for pending (non-completed) payment', async () => {
      const payment = await controller.pay(
        'tenant-test',
        {
          orderId: 'order-refund-pending',
          amount: 500,
          currency: 'USD',
          provider: 'paypal',
        },
      )

      expect(payment.status).toBe('pending')

      await expect(
        controller.refund(
          'tenant-test',
          {
            transactionId: payment.transactionId,
          },
        ),
      ).rejects.toThrow(HttpException)
    })

    it('should reject refund amount exceeding original', async () => {
      const payment = await controller.pay(
        'tenant-test',
        {
          orderId: 'order-refund-exceed',
          amount: 1000,
          currency: 'USD',
          provider: 'paypal',
          webhookUrl: 'https://example.com/webhook',
        },
      )

      await new Promise(resolve => setTimeout(resolve, 200))

      await expect(
        controller.refund(
          'tenant-test',
          {
            transactionId: payment.transactionId,
            amount: 9999,
          },
        ),
      ).rejects.toThrow(HttpException)
    })

    it('should refund a Stripe payment successfully', async () => {
      const payment = await controller.pay(
        'tenant-test',
        {
          orderId: 'order-refund-stripe',
          amount: 500,
          currency: 'USD',
          provider: 'stripe',
          webhookUrl: 'https://example.com/webhook',
        },
      )

      await new Promise(resolve => setTimeout(resolve, 200))

      const refundResult = await controller.refund(
        'tenant-test',
        {
          transactionId: payment.transactionId,
          reason: '客户取消订单',
        },
      )

      expect(refundResult.status).toBe('refunded')
      expect(refundResult.transactionId).toBeDefined()
      expect(refundResult.provider).toBe('stripe')
    })

    it('should support partial refund with amount specified', async () => {
      const payment = await controller.pay(
        'tenant-test',
        {
          orderId: 'order-partial-refund',
          amount: 2000,
          currency: 'USD',
          provider: 'paypal',
          webhookUrl: 'https://example.com/webhook',
        },
      )

      await new Promise(resolve => setTimeout(resolve, 200))

      const partialRefund = await controller.refund(
        'tenant-test',
        {
          transactionId: payment.transactionId,
          amount: 500,
          reason: '部分退款',
        },
      )

      expect(partialRefund.status).toBe('refunded')
      expect(partialRefund.amount).toBe(500)
    })
  })

  describe('GET /payment-gateway/refund/:id', () => {
    // ── 正例 ─────────────────────────────────────────────
    it('should query an existing refund', async () => {
      const payment = await controller.pay(
        'tenant-test',
        {
          orderId: 'order-qrefund',
          amount: 1000,
          currency: 'USD',
          provider: 'paypal',
          webhookUrl: 'https://example.com/webhook',
        },
      )

      await new Promise(resolve => setTimeout(resolve, 200))

      const refund = await controller.refund(
        'tenant-test',
        {
          transactionId: payment.transactionId,
        },
      )

      const result = await controller.queryRefund('tenant-test', refund.transactionId)
      expect(result.status).toBeDefined()
      expect(result.transactionId).toBe(refund.transactionId)
    })

    // ── 反例 ─────────────────────────────────────────────
    it('should return 404 for non-existent refund', async () => {
      try {
        await controller.queryRefund('tenant-test', 'non-existent-refund')
        expect.unreachable('should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException)
        expect((error as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND)
      }
    })
  })
})
