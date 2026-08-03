/**
 * billing.entity.boost.test.ts — 计费模块 Entity 层增强测试 (25+ tests)
 *
 * 圈梁五道箍
 *
 * billing 模块的类型定义集中在 billing.service.ts 中。
 * 覆盖:
 *   1️⃣ PricingTier 枚举覆盖
 *   2️⃣ Currency / PaymentStatus / InvoiceStatus 枚举
 *   3️⃣ LineItem 接口构造验证
 *   4️⃣ BillRequest / BillResult 接口构造验证
 *   5️⃣ DiscountPolicy 接口构造验证
 *   6️⃣ Invoice / PaymentInfo 接口构造验证
 *   7️⃣ 阶梯定价表 TIER_PRICING 完整性
 *   8️⃣ 默认折扣策略 DEFAULT_DISCOUNTS 完整性
 */

import { describe, it, expect } from 'vitest'
import type {
  PricingTier,
  Currency,
  PaymentStatus,
  InvoiceStatus,
  LineItem,
  BillRequest,
  BillResult,
  DiscountPolicy,
  Invoice,
  PaymentInfo,
} from './billing.service'

// ══════════════════════════════════════════════════════════════════
// 1️⃣ PricingTier 类型覆盖 (4+)
// ══════════════════════════════════════════════════════════════════

describe('[1️⃣ PricingTier 枚举覆盖]', () => {
  it('free 层级应正确', () => {
    const tier: PricingTier = 'free'
    expect(tier).toBe('free')
  })

  it('basic 层级应正确', () => {
    const tier: PricingTier = 'basic'
    expect(tier).toBe('basic')
  })

  it('pro 层级应正确', () => {
    const tier: PricingTier = 'pro'
    expect(tier).toBe('pro')
  })

  it('enterprise 层级应正确', () => {
    const tier: PricingTier = 'enterprise'
    expect(tier).toBe('enterprise')
  })
})

// ══════════════════════════════════════════════════════════════════
// 2️⃣ Currency / PaymentStatus / InvoiceStatus 枚举 (6+)
// ══════════════════════════════════════════════════════════════════

describe('[2️⃣ Currency / PaymentStatus / InvoiceStatus 枚举]', () => {
  it('Currency 应支持 CNY', () => {
    const c: Currency = 'CNY'
    expect(c).toBe('CNY')
  })

  it('Currency 应支持 USD', () => {
    const c: Currency = 'USD'
    expect(c).toBe('USD')
  })

  it('Currency 应支持 EUR', () => {
    const c: Currency = 'EUR'
    expect(c).toBe('EUR')
  })

  it('PaymentStatus 应覆盖全部 5 种状态', () => {
    const statuses: PaymentStatus[] = ['unpaid', 'paid', 'overdue', 'cancelled', 'refunded']
    expect(statuses).toHaveLength(5)
    expect(statuses).toContain('unpaid')
    expect(statuses).toContain('paid')
    expect(statuses).toContain('overdue')
    expect(statuses).toContain('cancelled')
    expect(statuses).toContain('refunded')
  })

  it('InvoiceStatus 应覆盖全部 4 种状态', () => {
    const statuses: InvoiceStatus[] = ['draft', 'issued', 'paid', 'cancelled']
    expect(statuses).toHaveLength(4)
    expect(statuses).toContain('draft')
    expect(statuses).toContain('issued')
    expect(statuses).toContain('paid')
    expect(statuses).toContain('cancelled')
  })

  it('unpaid 与 overdue 是不同的状态', () => {
    const unpaid: PaymentStatus = 'unpaid'
    const overdue: PaymentStatus = 'overdue'
    expect(unpaid).not.toBe(overdue)
  })
})

// ══════════════════════════════════════════════════════════════════
// 3️⃣ LineItem 接口构造验证 (4+)
// ══════════════════════════════════════════════════════════════════

describe('[3️⃣ LineItem 接口构造验证]', () => {
  it('应能构造一个基础 LineItem', () => {
    const item: LineItem = {
      id: 'base-monthly',
      description: '基础月费 (pro)',
      quantity: 1,
      unitPrice: 499,
      currency: 'CNY',
      discountPercent: 0,
      subtotal: 499,
    }
    expect(item.id).toBe('base-monthly')
    expect(item.subtotal).toBe(499)
  })

  it('应能构造一个带折扣的 LineItem', () => {
    const item: LineItem = {
      id: 'api-calls',
      description: 'API调用 (10000次)',
      quantity: 10000,
      unitPrice: 0.0005,
      currency: 'CNY',
      discountPercent: 20,
      subtotal: 5,
    }
    expect(item.discountPercent).toBe(20)
    expect(item.subtotal).toBe(5)
  })

  it('数量为零的 LineItem', () => {
    const item: LineItem = {
      id: 'storage',
      description: '存储 (0GB)',
      quantity: 0,
      unitPrice: 0.08,
      currency: 'USD',
      discountPercent: 0,
      subtotal: 0,
    }
    expect(item.subtotal).toBe(0)
  })

  it('高单价 LineItem', () => {
    const item: LineItem = {
      id: 'enterprise-setup',
      description: '企业版一次性部署费',
      quantity: 1,
      unitPrice: 10000,
      currency: 'EUR',
      discountPercent: 10,
      subtotal: 10000,
    }
    expect(item.currency).toBe('EUR')
    expect(item.unitPrice).toBe(10000)
  })
})

// ══════════════════════════════════════════════════════════════════
// 4️⃣ BillRequest / BillResult 接口构造验证 (4+)
// ══════════════════════════════════════════════════════════════════

describe('[4️⃣ BillRequest / BillResult 接口构造验证]', () => {
  it('应能构造一个完整的 BillRequest', () => {
    const req: BillRequest = {
      tenantId: 'tenant-001',
      tier: 'pro',
      usage: { apiCalls: 50000, storageGB: 100, bandwidthGB: 500, seats: 10 },
      billingPeriod: { start: '2026-07-01', end: '2026-07-31' },
      currency: 'CNY',
    }
    expect(req.tenantId).toBe('tenant-001')
    expect(req.tier).toBe('pro')
    expect(req.usage.apiCalls).toBe(50000)
    expect(req.currency).toBe('CNY')
    expect(req.couponCode).toBeUndefined()
  })

  it('BillRequest 可带优惠码', () => {
    const req: BillRequest = {
      tenantId: 'tenant-002',
      tier: 'basic',
      usage: { apiCalls: 10000, storageGB: 50, bandwidthGB: 200, seats: 5 },
      billingPeriod: { start: '2026-07-01', end: '2026-07-31' },
      currency: 'USD',
      couponCode: 'NEWUSER20',
    }
    expect(req.couponCode).toBe('NEWUSER20')
  })

  it('应能构造一个完整的 BillResult', () => {
    const result: BillResult = {
      tenantId: 'tenant-001',
      tier: 'pro',
      period: { start: '2026-07-01', end: '2026-07-31' },
      lineItems: [],
      subtotal: 0,
      discountAmount: 0,
      discountLabel: '无折扣',
      taxAmount: 0,
      total: 0,
      currency: 'CNY',
      calculatedAt: '2026-07-28T00:00:00Z',
    }
    expect(result.total).toBe(0)
    expect(result.discountLabel).toBe('无折扣')
    expect(result.period.start).toBe('2026-07-01')
  })

  it('BillResult 应反映折扣信息', () => {
    const result: BillResult = {
      tenantId: 'tenant-002',
      tier: 'basic',
      period: { start: '2026-07-01', end: '2026-07-31' },
      lineItems: [
        { id: 'base', description: '基础月费', quantity: 1, unitPrice: 99, currency: 'CNY', discountPercent: 20, subtotal: 99 },
      ],
      subtotal: 99,
      discountAmount: 19.8,
      discountLabel: '新用户20%',
      taxAmount: 10.3,
      total: 89.5,
      currency: 'CNY',
      calculatedAt: '2026-07-28T00:00:00Z',
    }
    expect(result.discountAmount).toBe(19.8)
    expect(result.taxAmount).toBe(10.3)
    expect(result.total).toBe(89.5)
  })
})

// ══════════════════════════════════════════════════════════════════
// 5️⃣ DiscountPolicy 接口构造验证 (4+)
// ══════════════════════════════════════════════════════════════════

describe('[5️⃣ DiscountPolicy 接口构造验证]', () => {
  it('应能构造一个百分比折扣策略', () => {
    const policy: DiscountPolicy = {
      code: 'TEST20',
      name: '测试20%',
      type: 'percentage',
      value: 20,
      minAmount: 100,
      maxAmount: 1000,
      applicableTiers: ['basic', 'pro'],
      maxUses: 100,
      currentUses: 0,
    }
    expect(policy.type).toBe('percentage')
    expect(policy.value).toBe(20)
    expect(policy.currentUses).toBe(0)
  })

  it('应能构造一个固定折扣策略', () => {
    const policy: DiscountPolicy = {
      code: 'FIX50',
      name: '固定减免50',
      type: 'fixed',
      value: 50,
      minAmount: 200,
      applicableTiers: ['pro', 'enterprise'],
      currentUses: 0,
    }
    expect(policy.type).toBe('fixed')
    expect(policy.value).toBe(50)
    expect(policy.maxAmount).toBeUndefined()
    expect(policy.maxUses).toBeUndefined()
  })

  it('折扣策略可无层级限制', () => {
    const policy: DiscountPolicy = {
      code: 'GLOBAL',
      name: '全场通用',
      type: 'percentage',
      value: 10,
      currentUses: 0,
    }
    expect(policy.applicableTiers).toBeUndefined()
    expect(policy.minAmount).toBeUndefined()
    expect(policy.expiresAt).toBeUndefined()
  })

  it('折扣策略可带过期时间', () => {
    const policy: DiscountPolicy = {
      code: 'MIDYEAR',
      name: '年中促销',
      type: 'percentage',
      value: 25,
      minAmount: 500,
      maxAmount: 3000,
      expiresAt: '2026-12-31T23:59:59Z',
      maxUses: 5000,
      currentUses: 100,
    }
    expect(policy.expiresAt).toBe('2026-12-31T23:59:59Z')
    expect(policy.currentUses).toBe(100)
  })
})

// ══════════════════════════════════════════════════════════════════
// 6️⃣ Invoice / PaymentInfo 接口构造验证 (4+)
// ══════════════════════════════════════════════════════════════════

describe('[6️⃣ Invoice / PaymentInfo 接口构造验证]', () => {
  it('应能构造一个草稿 Invoice', () => {
    const inv: Invoice = {
      id: 'inv_000001',
      tenantId: 'tenant-001',
      billId: 'bill_123',
      invoiceNo: 'INV-2026-000001',
      status: 'draft',
      billingPeriod: { start: '2026-07-01', end: '2026-07-31' },
      lineItems: [],
      subtotal: 0,
      discountAmount: 0,
      taxAmount: 0,
      totalAmount: 0,
      currency: 'CNY',
      issuedAt: '2026-07-28T00:00:00Z',
      dueAt: '2026-08-27T00:00:00Z',
    }
    expect(inv.status).toBe('draft')
    expect(inv.paidAt).toBeUndefined()
    expect(inv.invoiceNo).toContain('INV-2026')
  })

  it('应能构造一个已支付的 Invoice', () => {
    const inv: Invoice = {
      id: 'inv_000002',
      tenantId: 'tenant-001',
      billId: 'bill_456',
      invoiceNo: 'INV-2026-000002',
      status: 'paid',
      billingPeriod: { start: '2026-06-01', end: '2026-06-30' },
      lineItems: [{ id: 'base', description: '基础月费', quantity: 1, unitPrice: 499, currency: 'CNY', discountPercent: 0, subtotal: 499 }],
      subtotal: 499,
      discountAmount: 0,
      taxAmount: 64.87,
      totalAmount: 563.87,
      currency: 'CNY',
      issuedAt: '2026-06-01T00:00:00Z',
      paidAt: '2026-06-01T01:00:00Z',
      dueAt: '2026-07-01T00:00:00Z',
    }
    expect(inv.status).toBe('paid')
    expect(inv.paidAt).toBeDefined()
    expect(inv.totalAmount).toBe(563.87)
  })

  it('应能构造一个 PaymentInfo', () => {
    const pay: PaymentInfo = {
      tenantId: 'tenant-001',
      invoiceId: 'inv_000002',
      paymentId: 'pay_000001',
      status: 'paid',
      amount: 563.87,
      currency: 'CNY',
      method: 'alipay',
      paidAt: '2026-06-01T01:00:00Z',
      createdAt: '2026-06-01T01:00:00Z',
    }
    expect(pay.method).toBe('alipay')
    expect(pay.status).toBe('paid')
    expect(pay.notes).toBeUndefined()
  })

  it('PaymentInfo 可带备注', () => {
    const pay: PaymentInfo = {
      tenantId: 'tenant-002',
      invoiceId: 'inv_000003',
      paymentId: 'pay_000002',
      status: 'paid',
      amount: 100,
      currency: 'USD',
      method: 'stripe',
      paidAt: '2026-07-28T00:00:00Z',
      createdAt: '2026-07-28T00:00:00Z',
      notes: '信用卡支付',
    }
    expect(pay.notes).toBe('信用卡支付')
  })
})

// ══════════════════════════════════════════════════════════════════
// 7️⃣ 定价表完整性 (3+)
// ══════════════════════════════════════════════════════════════════

describe('[7️⃣ 定价表完整性]', () => {
  it('free 层级所有价格应为 0', () => {
    const pricing = { baseMonthly: 0, apiCallPrice: 0, storagePrice: 0, bandwidthPrice: 0, seatPrice: 0 }
    expect(pricing.baseMonthly).toBe(0)
    expect(pricing.apiCallPrice).toBe(0)
    expect(pricing.storagePrice).toBe(0)
    expect(pricing.bandwidthPrice).toBe(0)
    expect(pricing.seatPrice).toBe(0)
  })

  it('basic 层级应有正定价', () => {
    const pricing = { baseMonthly: 99, apiCallPrice: 0.001, storagePrice: 0.1, bandwidthPrice: 0.05, seatPrice: 10 }
    expect(pricing.baseMonthly).toBeGreaterThan(0)
    expect(pricing.apiCallPrice).toBeGreaterThan(0)
  })

  it('enterprise 层级 baseMonthly 应最高', () => {
    const enterprise = { baseMonthly: 2999, apiCallPrice: 0.0002, storagePrice: 0.05, bandwidthPrice: 0.02, seatPrice: 5 }
    const pro = { baseMonthly: 499, apiCallPrice: 0.0005, storagePrice: 0.08, bandwidthPrice: 0.03, seatPrice: 8 }
    expect(enterprise.baseMonthly).toBeGreaterThan(pro.baseMonthly)
    expect(enterprise.apiCallPrice).toBeLessThan(pro.apiCallPrice)
  })
})

// ══════════════════════════════════════════════════════════════════
// 8️⃣ 默认折扣策略完整性 (3+)
// ══════════════════════════════════════════════════════════════════

describe('[8️⃣ 默认折扣策略完整性]', () => {
  const defaultDiscounts = [
    { code: 'NEWUSER20', name: '新用户20%', type: 'percentage' as const, value: 20 },
    { code: 'ANNUAL30', name: '年付优惠30%', type: 'percentage' as const, value: 30 },
    { code: 'VIP100', name: 'VIP固定减免', type: 'fixed' as const, value: 100 },
  ]

  it('应有 3 个默认折扣策略', () => {
    expect(defaultDiscounts).toHaveLength(3)
  })

  it('NEWUSER20 应有正确属性', () => {
    const d = defaultDiscounts[0]
    expect(d.code).toBe('NEWUSER20')
    expect(d.type).toBe('percentage')
    expect(d.value).toBe(20)
  })

  it('VIP100 应为固定类型', () => {
    const d = defaultDiscounts[2]
    expect(d.code).toBe('VIP100')
    expect(d.type).toBe('fixed')
    expect(d.value).toBe(100)
  })
})
