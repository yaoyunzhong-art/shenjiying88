/**
 * PaymentGatewayEntity 单元测试
 *
 * T117-3: 本地化支付
 * 覆盖 PaymentTransaction / RefundRecord / WalletEntry 实体的类型正确性和构造行为
 */

import { describe, it, expect } from 'vitest'
import type { PaymentTransaction, RefundRecord, WalletEntry } from './payment-gateway.entity'

describe('PaymentGateway Entity', () => {
  // ── PaymentTransaction ─────────────────────────────────────────────────────

  describe('PaymentTransaction', () => {
    it('should construct a completed transaction', () => {
      const transaction: PaymentTransaction = {
        id: 'TXN-001',
        orderId: 'ORD-001',
        provider: 'paypal',
        status: 'completed',
        amount: 1000,
        currency: 'USD',
        paidAt: new Date('2026-07-06T12:00:00Z'),
        createdAt: new Date('2026-07-06T12:00:00Z'),
        updatedAt: new Date('2026-07-06T12:00:00Z'),
      }

      expect(transaction.id).toBe('TXN-001')
      expect(transaction.status).toBe('completed')
      expect(transaction.amount).toBe(1000)
      expect(transaction.currency).toBe('USD')
      expect(transaction.paidAt).toBeInstanceOf(Date)
    })

    it('should construct a failed transaction with error', () => {
      const transaction: PaymentTransaction = {
        id: 'TXN-002',
        orderId: 'ORD-002',
        provider: 'local_wallet',
        status: 'failed',
        amount: 500,
        currency: 'CNY',
        error: 'Insufficient balance',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(transaction.status).toBe('failed')
      expect(transaction.error).toBe('Insufficient balance')
      expect(transaction.paidAt).toBeUndefined()
    })

    it('should construct with provider response metadata', () => {
      const transaction: PaymentTransaction = {
        id: 'TXN-003',
        orderId: 'ORD-003',
        provider: 'stripe',
        status: 'pending',
        amount: 2000,
        currency: 'JPY',
        providerResponse: {
          clientSecret: 'pi_123_secret_abc',
          paymentIntentId: 'pi_123',
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(transaction.providerResponse).toBeDefined()
      expect(transaction.providerResponse!.clientSecret).toBe('pi_123_secret_abc')
    })

    it('should construct with all possible provider types', () => {
      const providers = ['paypal', 'stripe', 'paypay', 'alipay', 'wechat_pay', 'local_wallet'] as const
      for (const provider of providers) {
        const transaction: PaymentTransaction = {
          id: `TXN-${provider}`,
          orderId: `ORD-${provider}`,
          provider,
          status: 'pending',
          amount: 100,
          currency: 'USD',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        expect(transaction.provider).toBe(provider)
      }
    })

    it('should construct with all possible statuses', () => {
      const statuses = ['pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled'] as const
      for (const status of statuses) {
        const transaction: PaymentTransaction = {
          id: `TXN-${status}`,
          orderId: 'ORD',
          provider: 'stripe',
          status,
          amount: 100,
          currency: 'USD',
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        expect(transaction.status).toBe(status)
      }
    })
  })

  // ── RefundRecord ───────────────────────────────────────────────────────────

  describe('RefundRecord', () => {
    it('should construct a full refund record', () => {
      const record: RefundRecord = {
        id: 'REF-001',
        originalTransactionId: 'TXN-001',
        amount: 1000,
        reason: 'Customer request',
        status: 'refunded',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(record.id).toBe('REF-001')
      expect(record.originalTransactionId).toBe('TXN-001')
      expect(record.amount).toBe(1000)
      expect(record.status).toBe('refunded')
    })

    it('should construct a partial refund record', () => {
      const record: RefundRecord = {
        id: 'REF-002',
        originalTransactionId: 'TXN-002',
        amount: 300,
        status: 'refunded',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(record.amount).toBe(300)
      expect(record.reason).toBeUndefined()
    })

    it('should construct with pending refund status', () => {
      const record: RefundRecord = {
        id: 'REF-003',
        originalTransactionId: 'TXN-003',
        amount: 500,
        reason: 'Waiting approval',
        status: 'processing',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(record.status).toBe('processing')
      expect(record.reason).toBe('Waiting approval')
    })

    it('should track timestamps correctly', () => {
      const createdAt = new Date('2026-07-06T10:00:00Z')
      const updatedAt = new Date('2026-07-06T12:00:00Z')

      const record: RefundRecord = {
        id: 'REF-004',
        originalTransactionId: 'TXN-004',
        amount: 100,
        status: 'refunded',
        createdAt,
        updatedAt,
      }

      expect(record.createdAt).toEqual(createdAt)
      expect(record.updatedAt).toEqual(updatedAt)
      // updatedAt should be after createdAt
      expect(record.updatedAt.getTime()).toBeGreaterThan(record.createdAt.getTime())
    })
  })

  // ── WalletEntry ────────────────────────────────────────────────────────────

  describe('WalletEntry', () => {
    it('should construct a wallet entry', () => {
      const entry: WalletEntry = {
        currency: 'USD',
        amount: 10000,
        updatedAt: new Date(),
      }

      expect(entry.currency).toBe('USD')
      expect(entry.amount).toBe(10000)
    })

    it('should construct with zero balance', () => {
      const entry: WalletEntry = {
        currency: 'JPY',
        amount: 0,
        updatedAt: new Date(),
      }

      expect(entry.amount).toBe(0)
    })

    it('should construct with CNY currency', () => {
      const entry: WalletEntry = {
        currency: 'CNY',
        amount: 5000,
        updatedAt: new Date(),
      }

      expect(entry.currency).toBe('CNY')
      expect(entry.amount).toBe(5000)
    })

    it('should construct with all supported currencies', () => {
      const currencies = ['CNY', 'USD', 'JPY', 'HKD', 'THB', 'VND', 'MYR', 'SGD'] as const
      for (const currency of currencies) {
        const entry: WalletEntry = {
          currency,
          amount: 1000,
          updatedAt: new Date(),
        }

        expect(entry.currency).toBe(currency)
      }
    })
  })

  // ── 实体间关联 ─────────────────────────────────────────────────────────────

  describe('Entity relationships', () => {
    it('RefundRecord should reference an existing PaymentTransaction', () => {
      const transaction: PaymentTransaction = {
        id: 'TXN-100',
        orderId: 'ORD-100',
        provider: 'paypal',
        status: 'completed',
        amount: 2000,
        currency: 'USD',
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const refund: RefundRecord = {
        id: 'REF-100',
        originalTransactionId: transaction.id,
        amount: transaction.amount,
        status: 'refunded',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      expect(refund.originalTransactionId).toBe(transaction.id)
      expect(refund.amount).toBe(transaction.amount)
    })

    it('WalletEntry currency should match PaymentTransaction currency', () => {
      const transaction: PaymentTransaction = {
        id: 'TXN-200',
        orderId: 'ORD-200',
        provider: 'local_wallet',
        status: 'completed',
        amount: 500,
        currency: 'CNY',
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      const wallet: WalletEntry = {
        currency: transaction.currency,
        amount: 1000,
        updatedAt: new Date(),
      }

      expect(wallet.currency).toBe(transaction.currency)
    })
  })
})
