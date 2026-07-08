/**
 * PaymentGatewayController 集成测试
 *
 * T117-3: 本地化支付
 * 覆盖：路由元数据、DTO 校验 + 正例/反例/边界
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { HttpException, HttpStatus } from '@nestjs/common'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { PaymentGatewayController } from './payment-gateway.controller'
import { PaymentGatewayService, PaymentError } from './payment-gateway.service'

describe('PaymentGatewayController (Integration)', () => {
  let controller: PaymentGatewayController
  let service: PaymentGatewayService

  beforeEach(() => {
    service = new PaymentGatewayService()
    controller = new PaymentGatewayController(service)
  })

  // ── 路由元数据 ────────────────────────────────────────
  describe('route metadata', () => {
    it('controller path should be payment-gateway', () => {
      const path = Reflect.getMetadata('path', PaymentGatewayController)
      assert.equal(path, 'payment-gateway')
    })

    it('pay() should have POST method and path', () => {
      const method = Reflect.getMetadata('method', PaymentGatewayController.prototype.pay)
      const path = Reflect.getMetadata('path', PaymentGatewayController.prototype.pay)
      assert.equal(method, 1) // POST
      assert.equal(path, 'pay')
    })

    it('queryPayment() should have GET method and path', () => {
      const method = Reflect.getMetadata('method', PaymentGatewayController.prototype.queryPayment)
      const path = Reflect.getMetadata('path', PaymentGatewayController.prototype.queryPayment)
      assert.equal(method, 0) // GET
      assert.equal(path, 'pay/:id')
    })

    it('refund() should have POST method and path', () => {
      const method = Reflect.getMetadata('method', PaymentGatewayController.prototype.refund)
      const path = Reflect.getMetadata('path', PaymentGatewayController.prototype.refund)
      assert.equal(method, 1) // POST
      assert.equal(path, 'refund')
    })

    it('queryRefund() should have GET method and path', () => {
      const method = Reflect.getMetadata('method', PaymentGatewayController.prototype.queryRefund)
      const path = Reflect.getMetadata('path', PaymentGatewayController.prototype.queryRefund)
      assert.equal(method, 0) // GET
      assert.equal(path, 'refund/:id')
    })
  })

  // ── 创建支付 ─────────────────────────────────────────
  describe('POST /payment-gateway/pay', () => {
    it('should create PayPal payment and return pending status', async () => {
      const result = await controller.pay({
        orderId: 'order-pay-001',
        amount: 1000,
        currency: 'USD',
        provider: 'paypal',
      })

      assert.ok(result.transactionId, 'should have transactionId')
      assert.equal(result.status, 'pending')
      assert.equal(result.provider, 'paypal')
      assert.equal(result.amount, 1000)
      assert.equal(result.currency, 'USD')
    })

    it('should create Stripe payment with optional fields', async () => {
      const result = await controller.pay({
        orderId: 'order-pay-002',
        amount: 2500,
        currency: 'USD',
        provider: 'stripe',
        locale: 'zh-CN',
        returnUrl: 'https://example.com/success',
      })

      assert.equal(result.provider, 'stripe')
      assert.ok(result.transactionId)
    })

    it('should create Alipay CNY payment', async () => {
      const result = await controller.pay({
        orderId: 'order-pay-003',
        amount: 100,
        currency: 'CNY',
        provider: 'alipay',
      })

      assert.equal(result.provider, 'alipay')
      assert.equal(result.currency, 'CNY')
    })

    it('should create WeChat pay payment', async () => {
      const result = await controller.pay({
        orderId: 'order-pay-004',
        amount: 50,
        currency: 'CNY',
        provider: 'wechat_pay',
      })

      assert.equal(result.provider, 'wechat_pay')
    })

    it('should create PayPay JPY payment', async () => {
      const result = await controller.pay({
        orderId: 'order-pay-005',
        amount: 3000,
        currency: 'JPY',
        provider: 'paypay',
      })

      assert.equal(result.provider, 'paypay')
      assert.equal(result.currency, 'JPY')
    })

    it('should return failed status for local_wallet with insufficient balance', async () => {
      const result = await controller.pay({
        orderId: 'order-pay-006',
        amount: 99999,
        currency: 'CNY',
        provider: 'local_wallet',
        metadata: { userId: 'test-user' },
      })

      assert.equal(result.status, 'failed')
      assert.equal(result.provider, 'local_wallet')
    })

    // ── 反例 ──
    it('should reject zero amount', async () => {
      await expect(
        controller.pay({
          orderId: 'order-bad',
          amount: 0,
          currency: 'USD',
          provider: 'paypal',
        }),
      ).rejects.toThrow(HttpException)
    })

    it('should reject negative amount', async () => {
      await expect(
        controller.pay({
          orderId: 'order-bad',
          amount: -100,
          currency: 'USD',
          provider: 'paypal',
        }),
      ).rejects.toThrow(HttpException)
    })

    it('should reject unknown provider', async () => {
      await expect(
        controller.pay({
          orderId: 'order-bad',
          amount: 100,
          currency: 'USD',
          provider: 'unknown' as any,
        }),
      ).rejects.toThrow(HttpException)
    })

    it('should reject unsupported currency for provider (PayPay does not support USD)', async () => {
      await expect(
        controller.pay({
          orderId: 'order-bad',
          amount: 100,
          currency: 'USD',
          provider: 'paypay',
        }),
      ).rejects.toThrow(HttpException)
    })

    it('should handle empty orderId (accepted as valid by provider)', async () => {
      // Service allows empty orderId and generates a transaction
      const result = await controller.pay({
        orderId: '',
        amount: 100,
        currency: 'USD',
        provider: 'paypal',
      })
      assert.ok(result.transactionId, 'still creates transaction')
      assert.equal(result.status, 'pending')
    })
  })

  // ── 支付查询 ─────────────────────────────────────────
  describe('GET /payment-gateway/pay/:id', () => {
    it('should query existing payment by transaction id', async () => {
      const created = await controller.pay({
        orderId: 'order-query-001',
        amount: 1000,
        currency: 'USD',
        provider: 'stripe',
      })

      const result = await controller.queryPayment(created.transactionId)
      assert.equal(result.transactionId, created.transactionId)
      assert.equal(result.provider, 'stripe')
    })

    it('should return 404 for non-existent transaction', async () => {
      try {
        await controller.queryPayment('txn-nonexistent')
        assert.fail('should have thrown')
      } catch (error) {
        assert.ok(error instanceof HttpException)
        assert.equal((error as HttpException).getStatus(), HttpStatus.NOT_FOUND)
      }
    })

    it('should return 404 for empty id', async () => {
      try {
        await controller.queryPayment('')
        assert.fail('should have thrown')
      } catch (error) {
        assert.ok(error instanceof HttpException)
      }
    })
  })

  // ── 退款 ─────────────────────────────────────────────
  describe('POST /payment-gateway/refund', () => {
    it('should refund completed PayPal payment with webhookUrl', async () => {
      const payment = await controller.pay({
        orderId: 'order-refund-001',
        amount: 1000,
        currency: 'USD',
        provider: 'paypal',
        webhookUrl: 'https://example.com/webhook',
      })

      // Wait for simulated webhook completion
      await new Promise(resolve => setTimeout(resolve, 200))

      const queryResult = await controller.queryPayment(payment.transactionId)
      assert.equal(queryResult.status, 'completed')

      const refundResult = await controller.refund({
        transactionId: payment.transactionId,
        reason: '客户要求退款',
      })

      assert.equal(refundResult.status, 'refunded')
      assert.ok(refundResult.transactionId)
    })

    it('should do partial refund', async () => {
      const payment = await controller.pay({
        orderId: 'order-refund-002',
        amount: 1000,
        currency: 'USD',
        provider: 'paypal',
        webhookUrl: 'https://example.com/webhook',
      })

      await new Promise(resolve => setTimeout(resolve, 200))

      const refundResult = await controller.refund({
        transactionId: payment.transactionId,
        amount: 500,
        reason: '部分退款',
      })

      assert.equal(refundResult.status, 'refunded')
    })

    // ── 反例 ──
    it('should reject refund for non-existent transaction', async () => {
      try {
        await controller.refund({ transactionId: 'txn-nonexistent' })
        assert.fail('should have thrown')
      } catch (error) {
        assert.ok(error instanceof HttpException)
        assert.equal((error as HttpException).getStatus(), HttpStatus.NOT_FOUND)
      }
    })

    it('should reject refund for pending (non-completed) payment', async () => {
      const payment = await controller.pay({
        orderId: 'order-refund-pending',
        amount: 500,
        currency: 'USD',
        provider: 'paypal',
      })

      assert.equal(payment.status, 'pending')

      await expect(
        controller.refund({ transactionId: payment.transactionId }),
      ).rejects.toThrow(HttpException)
    })

    it('should reject refund amount exceeding original', async () => {
      const payment = await controller.pay({
        orderId: 'order-refund-over',
        amount: 100,
        currency: 'USD',
        provider: 'paypal',
        webhookUrl: 'https://example.com/webhook',
      })

      await new Promise(resolve => setTimeout(resolve, 200))

      await expect(
        controller.refund({
          transactionId: payment.transactionId,
          amount: 99999,
        }),
      ).rejects.toThrow(HttpException)
    })
  })

  // ── 退款查询 ─────────────────────────────────────────
  describe('GET /payment-gateway/refund/:id', () => {
    it('should query existing refund by id', async () => {
      const payment = await controller.pay({
        orderId: 'order-qrefund-001',
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
      assert.equal(result.transactionId, refund.transactionId)
      assert.equal(result.status, 'refunded')
    })

    it('should return 404 for non-existent refund', async () => {
      try {
        await controller.queryRefund('refund-nonexistent')
        assert.fail('should have thrown')
      } catch (error) {
        assert.ok(error instanceof HttpException)
        assert.equal((error as HttpException).getStatus(), HttpStatus.NOT_FOUND)
      }
    })

    it('should return 404 for empty refund id', async () => {
      try {
        await controller.queryRefund('')
        assert.fail('should have thrown')
      } catch (error) {
        assert.ok(error instanceof HttpException)
      }
    })
  })

  // ── 错误处理 ─────────────────────────────────────────
  describe('error handling', () => {
    it('should propagate non-PaymentError exceptions', async () => {
      // Mock service to throw non-PaymentError
      const origPay = service.pay.bind(service)
      service.pay = vi.fn().mockRejectedValue(new Error('unexpected error'))

      await expect(
        controller.pay({
          orderId: 'order-err',
          amount: 100,
          currency: 'USD',
          provider: 'paypal',
        }),
      ).rejects.toThrow('unexpected error')
    })

    it('should wrap PaymentError with correct HTTP status code', async () => {
      const paymentError = new PaymentError('INVALID_AMOUNT', '金额无效')
      service.pay = vi.fn().mockRejectedValue(paymentError)

      try {
        await controller.pay({
          orderId: 'order-err',
          amount: -1,
          currency: 'USD',
          provider: 'paypal',
        })
        assert.fail('should have thrown')
      } catch (error) {
        assert.ok(error instanceof HttpException)
        assert.equal((error as HttpException).getStatus(), HttpStatus.BAD_REQUEST)
      }
    })

    it('should return 404 for TRANSACTION_NOT_FOUND error on query', async () => {
      const notFoundError = new PaymentError('TRANSACTION_NOT_FOUND', '交易不存在')
      service.query = vi.fn().mockRejectedValue(notFoundError)

      try {
        await controller.queryPayment('txn-missing')
        assert.fail('should have thrown')
      } catch (error) {
        assert.ok(error instanceof HttpException)
        assert.equal((error as HttpException).getStatus(), HttpStatus.NOT_FOUND)
      }
    })

    it('should return 404 for REFUND_NOT_FOUND error on queryRefund', async () => {
      const notFoundError = new PaymentError('REFUND_NOT_FOUND', '退款不存在')
      service.queryRefund = vi.fn().mockRejectedValue(notFoundError)

      try {
        await controller.queryRefund('refund-missing')
        assert.fail('should have thrown')
      } catch (error) {
        assert.ok(error instanceof HttpException)
        assert.equal((error as HttpException).getStatus(), HttpStatus.NOT_FOUND)
      }
    })
  })
})
