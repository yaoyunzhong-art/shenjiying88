/**
 * billing.controller.test.ts — Billing Controller 测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BillingController } from './billing.controller'
import { BillingService } from './billing.service'

describe('BillingController', () => {
  let controller: BillingController
  let service: BillingService

  const defaultBillBody = {
    tenantId: 'tenant-001',
    tier: 'pro' as const,
    usage: { apiCalls: 10000, storageGB: 50, bandwidthGB: 200, seats: 10 },
    billingPeriod: { start: '2026-07-01', end: '2026-07-31' },
    currency: 'CNY' as const,
  }

  beforeEach(() => {
    service = new BillingService()
    controller = new BillingController(service)
  })

  // ── Calculate ──

  it('should calculate bill with default params', () => {
    const res = controller.calculateBill(defaultBillBody)
    expect(res.success).toBe(true)
    expect(res.data.subtotal).toBeGreaterThan(0)
    expect(res.data.total).toBeGreaterThan(0)
    expect(res.data.tenantId).toBe('tenant-001')
  })

  it('should calculate bill with coupon code', () => {
    const res = controller.calculateBill({ ...defaultBillBody, couponCode: 'ANNUAL30' })
    expect(res.success).toBe(true)
    expect(res.data.discountAmount).toBeGreaterThan(0)
    expect(res.data.discountLabel).toBe('年付优惠30%')
  })

  it('should calculate bill with invalid coupon', () => {
    const res = controller.calculateBill({ ...defaultBillBody, couponCode: 'INVALID' })
    expect(res.success).toBe(true)
    expect(res.data.discountAmount).toBe(0)
    expect(res.data.discountLabel).toBe('无效优惠码')
  })

  it('should calculate bill for free tier', () => {
    const res = controller.calculateBill({
      ...defaultBillBody,
      tier: 'free',
      usage: { apiCalls: 0, storageGB: 0, bandwidthGB: 0, seats: 0 },
    })
    expect(res.success).toBe(true)
    expect(res.data.total).toBe(0)
  })

  it('should calculate bill for enterprise tier', () => {
    const res = controller.calculateBill({
      ...defaultBillBody,
      tier: 'enterprise',
    })
    expect(res.success).toBe(true)
    expect(res.data.subtotal).toBeGreaterThan(3000)
  })

  // ── Invoices ──

  it('should generate invoice', () => {
    const res = controller.generateInvoice(defaultBillBody)
    expect(res.success).toBe(true)
    expect(res.data.invoiceNo).toBeDefined()
    expect(res.data.status).toBe('draft')
    expect(res.data.totalAmount).toBeGreaterThan(0)
  })

  it('should list invoices for tenant', () => {
    controller.generateInvoice(defaultBillBody)
    controller.generateInvoice({ ...defaultBillBody, tenantId: 'tenant-002' })
    const res = controller.listInvoices({ tenantId: 'tenant-001' })
    expect(res.success).toBe(true)
    expect(res.data.total).toBe(1)
  })

  it('should return empty list for unknown tenant', () => {
    const res = controller.listInvoices({ tenantId: 'unknown' })
    expect(res.success).toBe(true)
    expect(res.data.invoices).toHaveLength(0)
  })

  // ── Pay ──

  it('should pay invoice', () => {
    const invRes = controller.generateInvoice(defaultBillBody)
    const res = controller.payInvoice(invRes.data.id, { method: 'wechat' })
    expect(res.success).toBe(true)
    expect(res.data.status).toBe('paid')
    expect(res.data.method).toBe('wechat')
  })

  // ── Payment Status ──

  it('should return false for unpaid invoice (no payment record)', () => {
    const invRes = controller.generateInvoice(defaultBillBody)
    const res = controller.getPaymentStatus(invRes.data.id)
    expect(res.success).toBe(false)
    expect(res.data).toBeNull()
    expect(res.message).toContain('未找到')
  })

  it('should return error for nonexistent invoice', () => {
    const res = controller.getPaymentStatus('nonexistent')
    expect(res.success).toBe(false)
    expect(res.data).toBeNull()
  })

  it('should get paid payment status', () => {
    const invRes = controller.generateInvoice(defaultBillBody)
    controller.payInvoice(invRes.data.id, { method: 'alipay' })
    const res = controller.getPaymentStatus(invRes.data.id)
    expect(res.success).toBe(true)
    expect(res.data!.status).toBe('paid')
  })

  // ── Discounts ──

  it('should list discount policies', () => {
    const res = controller.listDiscounts()
    expect(res.success).toBe(true)
    expect(res.data.discounts.length).toBeGreaterThanOrEqual(3)
  })

  // ── Stats ──

  it('should get billing stats', () => {
    const res = controller.getStats()
    expect(res.success).toBe(true)
    expect(res.data.totalInvoiced).toBe(0)
    expect(res.data.totalCollected).toBe(0)
    expect(res.data.pendingAmount).toBe(0)
  })

  it('should reflect paid invoice in stats', () => {
    const invRes = controller.generateInvoice(defaultBillBody)
    controller.payInvoice(invRes.data.id, { method: 'card' })
    const res = controller.getStats()
    expect(res.data.totalCollected).toBeGreaterThan(0)
    expect(res.data.totalInvoiced).toBeGreaterThan(0)
  })

  // ── Edge cases ──

  it('should handle basic tier calculation', () => {
    const res = controller.calculateBill({
      ...defaultBillBody,
      tier: 'basic',
      usage: { apiCalls: 1000, storageGB: 10, bandwidthGB: 50, seats: 2 },
    })
    expect(res.success).toBe(true)
    expect(res.data.total).toBeGreaterThan(0)
  })
})
// Total: 18 tests
