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
      const result = await controller.pay({
        orderId: 'order-001',
        amount: 1000,
        currency: 'USD',
        provider: 'paypal',
      })

      expect(result.transactionId).toBeDefined()
      expect(result.status).toBe('pending')
      expect(result.provider).toBe('paypal')
      expect(result.amount).toBe(1000)
      expect(result.currency).toBe('USD')
    })

    it('should create a Stripe payment with optional fields', async () => {
      const result = await controller.pay({
        orderId: 'order-002',
        amount: 5000,
        currency: 'USD',
        provider: 'stripe',
        locale: 'zh-CN',
        returnUrl: 'https://example.com/return',
      })

      expect(result.transactionId).toBeDefined()
      expect(result.status).toBe('pending')
      expect(result.provider).toBe('stripe')
    })

    it('should create a local wallet payment', async () => {
      // Pre-top up wallet via metadata
      const result = await controller.pay({
        orderId: 'order-003',
        amount: 500,
        currency: 'CNY',
        provider: 'local_wallet',
        metadata: { userId: 'test-user' },
      })

      // First payment with no balance should fail
      expect(result.status).toBe('failed')
      expect(result.provider).toBe('local_wallet')
    })

    // ── 反例 ─────────────────────────────────────────────
    it('should reject payment with invalid amount (<= 0)', async () => {
      await expect(
        controller.pay({
          orderId: 'order-bad',
          amount: 0,
          currency: 'USD',
          provider: 'paypal',
        }),
      ).rejects.toThrow(HttpException)
    })

    it('should reject payment with unsupported currency for provider', async () => {
      // PayPay 不支持 USD
      await expect(
        controller.pay({
          orderId: 'order-bad',
          amount: 100,
          currency: 'USD',
          provider: 'paypay',
        }),
      ).rejects.toThrow(HttpException)
    })

    it('should reject payment with unknown provider', async () => {
      await expect(
        controller.pay({
          orderId: 'order-bad',
          amount: 100,
          currency: 'USD',
          provider: 'unknown_provider' as any,
        }),
      ).rejects.toThrow(HttpException)
    })
  })

  describe('GET /payment-gateway/pay/:id', () => {
    // ── 正例 ─────────────────────────────────────────────
    it('should query an existing payment', async () => {
      const created = await controller.pay({
        orderId: 'order-q1',
        amount: 2000,
        currency: 'USD',
        provider: 'paypal',
      })

      const result = await controller.queryPayment(created.transactionId)

      expect(result.transactionId).toBe(created.transactionId)
      expect(result.status).toBeDefined()
    })

    // ── 反例 ─────────────────────────────────────────────
    it('should return 404 for non-existent transaction', async () => {
      try {
        await controller.queryPayment('non-existent-id')
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
      const payment = await controller.pay({
        orderId: 'order-refund-1',
        amount: 1000,
        currency: 'USD',
        provider: 'paypal',
        webhookUrl: 'https://example.com/webhook',
      })

      // Wait for webhook simulation to complete the payment
      await new Promise(resolve => setTimeout(resolve, 200))

      const queryResult = await controller.queryPayment(payment.transactionId)
      expect(queryResult.status).toBe('completed')

      const refundResult = await controller.refund({
        transactionId: payment.transactionId,
        reason: '客户要求退款',
      })

      expect(refundResult.status).toBe('refunded')
      expect(refundResult.transactionId).toBeDefined()
    })

    // ── 反例 ─────────────────────────────────────────────
    it('should reject refund for non-existent transaction', async () => {
      try {
        await controller.refund({
          transactionId: 'non-existent',
          reason: 'test',
        })
        expect.unreachable('should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException)
        expect((error as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND)
      }
    })

    it('should reject refund for pending (non-completed) payment', async () => {
      const payment = await controller.pay({
        orderId: 'order-refund-pending',
        amount: 500,
        currency: 'USD',
        provider: 'paypal',
      })

      expect(payment.status).toBe('pending')

      await expect(
        controller.refund({
          transactionId: payment.transactionId,
        }),
      ).rejects.toThrow(HttpException)
    })

    it('should reject refund amount exceeding original', async () => {
      const payment = await controller.pay({
        orderId: 'order-refund-exceed',
        amount: 1000,
        currency: 'USD',
        provider: 'paypal',
        webhookUrl: 'https://example.com/webhook',
      })

      await new Promise(resolve => setTimeout(resolve, 200))

      await expect(
        controller.refund({
          transactionId: payment.transactionId,
          amount: 9999,
        }),
      ).rejects.toThrow(HttpException)
    })
  })

  describe('GET /payment-gateway/refund/:id', () => {
    // ── 正例 ─────────────────────────────────────────────
    it('should query an existing refund', async () => {
      const payment = await controller.pay({
        orderId: 'order-qrefund',
        amount: 1000,
        currency: 'USD',
        provider: 'paypal',
        webhookUrl: 'https://example.com/webhook',
      })

      await new Promise(resolve => setTimeout(resolve, 200))

      const refund = await controller.refund({
        transactionId: payment.transactionId,
      })

      const result = await controller.queryRefund(refund.transactionId)
      expect(result.status).toBeDefined()
      expect(result.transactionId).toBe(refund.transactionId)
    })

    // ── 反例 ─────────────────────────────────────────────
    it('should return 404 for non-existent refund', async () => {
      try {
        await controller.queryRefund('non-existent-refund')
        expect.unreachable('should have thrown')
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException)
        expect((error as HttpException).getStatus()).toBe(HttpStatus.NOT_FOUND)
      }
    })
  })
})
