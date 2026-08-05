/**
 * billing.service.spec.ts — 计费 Service 单元测试
 *
 * 覆盖: 各套餐账单计算、优惠码/阶梯折扣、发票生成/支付、
 *       异常输入、多租户隔离、统计汇总
 *
 * 充分性: 15+ tests  |  Jest describe/it 模式
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { BillingService, type BillRequest } from './billing.service'

function makeService(): BillingService {
  return new BillingService()
}

function makeReq(overrides: Partial<BillRequest> = {}): BillRequest {
  return {
    tenantId: 'tenant-001',
    tier: 'basic',
    usage: { apiCalls: 1000, storageGB: 10, bandwidthGB: 50, seats: 5 },
    billingPeriod: { start: '2026-07-01', end: '2026-07-31' },
    currency: 'CNY',
    ...overrides,
  }
}

// ══════════════════════════════════════════════════════════════════
// 1️⃣ 账单计算
// ══════════════════════════════════════════════════════════════════

describe('BillingService — 账单计算', () => {
  let svc: BillingService

  beforeEach(() => {
    svc = makeService()
  })

  it('Basic 套餐: 基础月费 99 + 用量计费', () => {
    const bill = svc.calculateBill(makeReq())
    expect(bill.lineItems[0].subtotal).toBe(99)
    // API: 1000*0.001=1, 存储: 10*0.1=1, 带宽: 50*0.05=2.5, 坐席: 5*10=50
    // subtotal = 99 + 1 + 1 + 2.5 + 50 = 153.5
    expect(bill.subtotal).toBe(153.5)
    expect(bill.tier).toBe('basic')
    expect(bill.tenantId).toBe('tenant-001')
  })

  it('Pro 套餐: 基础月费 499', () => {
    const bill = svc.calculateBill(makeReq({
      tier: 'pro',
      usage: { apiCalls: 5000, storageGB: 100, bandwidthGB: 200, seats: 10 },
    }))
    expect(bill.lineItems[0].subtotal).toBe(499)
    // 5000*0.0005=2.5, 100*0.08=8, 200*0.03=6, 10*8=80
    // subtotal = 499 + 2.5 + 8 + 6 + 80 = 595.5
    expect(bill.subtotal).toBe(595.5)
  })

  it('Enterprise 套餐: 基础月费 2999', () => {
    const bill = svc.calculateBill(makeReq({
      tier: 'enterprise',
      usage: { apiCalls: 50000, storageGB: 500, bandwidthGB: 1000, seats: 30 },
    }))
    expect(bill.lineItems[0].subtotal).toBe(2999)
    expect(bill.total).toBeGreaterThan(2999)
  })

  it('Free 套餐全部免费', () => {
    const bill = svc.calculateBill(makeReq({
      tier: 'free',
      usage: { apiCalls: 0, storageGB: 0, bandwidthGB: 0, seats: 0 },
    }))
    expect(bill.subtotal).toBe(0)
    expect(bill.total).toBe(0)
    expect(bill.discountAmount).toBe(0)
  })

  it('账单含 13% VAT 税费', () => {
    const bill = svc.calculateBill(makeReq())
    const expectedTax = Math.round(153.5 * 0.13 * 100) / 100
    expect(bill.taxAmount).toBe(expectedTax)
    expect(bill.total).toBe(153.5 + expectedTax)
  })

  it('不同币种正确传递', () => {
    const bill = svc.calculateBill(makeReq({ currency: 'USD' }))
    expect(bill.currency).toBe('USD')
  })

  it('账单 calculatedAt 字段非空', () => {
    const bill = svc.calculateBill(makeReq())
    expect(bill.calculatedAt).toBeDefined()
    expect(new Date(bill.calculatedAt).getTime()).not.toBeNaN()
  })
})

// ══════════════════════════════════════════════════════════════════
// 2️⃣ 折扣应用
// ══════════════════════════════════════════════════════════════════

describe('BillingService — 折扣应用', () => {
  let svc: BillingService

  beforeEach(() => {
    svc = makeService()
  })

  it('无优惠码且金额<1000 → 无折扣', () => {
    const result = svc.applyDiscount(500)
    expect(result.amount).toBe(0)
    expect(result.label).toBe('无折扣')
  })

  it('金额≥1000 → 5% 批量折扣', () => {
    const result = svc.applyDiscount(1000)
    expect(result.amount).toBe(50)
    expect(result.label).toContain('批量折扣')
  })

  it('金额≥5000 → 10% 大客户折扣', () => {
    const result = svc.applyDiscount(5000)
    expect(result.amount).toBe(500)
    expect(result.label).toContain('大客户折扣')
  })

  it('金额≥10000 → 15% 企业批量折扣', () => {
    const result = svc.applyDiscount(20000)
    expect(result.amount).toBe(3000)
    expect(result.label).toContain('企业批量')
  })

  it('NEWUSER20 百分折扣 + 封顶 500', () => {
    const result = svc.applyDiscount(3000, 'NEWUSER20', 'pro')
    // 3000*20%=600, capped at 500
    expect(result.amount).toBe(500)
    expect(result.label).toContain('新用户')
  })

  it('ANNUAL30 百分折扣 30%', () => {
    const result = svc.applyDiscount(1000, 'ANNUAL30')
    expect(result.amount).toBe(300)
    expect(result.label).toContain('年付')
  })

  it('VIP100 固定减免 100', () => {
    const result = svc.applyDiscount(500, 'VIP100', 'enterprise')
    expect(result.amount).toBe(100)
    expect(result.label).toContain('VIP固定减免')
  })

  it('无效优惠码返回 amount=0', () => {
    const result = svc.applyDiscount(500, 'INVALID_CODE', 'pro')
    expect(result.amount).toBe(0)
    expect(result.label).toBe('无效优惠码')
  })

  it('优惠码不适用当前套餐层级', () => {
    // NEWUSER20 只适用 basic/pro
    const result = svc.applyDiscount(500, 'NEWUSER20', 'free')
    expect(result.amount).toBe(0)
    expect(result.label).toBe('不适用当前套餐')
  })

  it('金额未达优惠码最低消费', () => {
    // VIP100 minAmount=200
    const result = svc.applyDiscount(50, 'VIP100', 'pro')
    expect(result.amount).toBe(0)
    expect(result.label).toContain('未达最低消费')
  })

  it('折扣使用次数累加', () => {
    const before = svc.listDiscountPolicies().find(p => p.code === 'VIP100')!.currentUses
    svc.applyDiscount(1000, 'VIP100', 'enterprise')
    svc.applyDiscount(1000, 'VIP100', 'enterprise')
    const after = svc.listDiscountPolicies().find(p => p.code === 'VIP100')!.currentUses
    expect(after).toBe(before + 2)
  })
})

// ══════════════════════════════════════════════════════════════════
// 3️⃣ 发票与支付
// ══════════════════════════════════════════════════════════════════

describe('BillingService — 发票与支付', () => {
  let svc: BillingService

  beforeEach(() => {
    svc = makeService()
  })

  it('生成发票 → status=draft, invoiceNo 格式正确', () => {
    const bill = svc.calculateBill(makeReq())
    const inv = svc.generateInvoice(bill)
    expect(inv.status).toBe('draft')
    expect(inv.invoiceNo).toMatch(/^INV-2026-\d{6}$/)
    expect(inv.totalAmount).toBe(bill.total)
    expect(new Date(inv.dueAt) > new Date(inv.issuedAt)).toBe(true)
  })

  it('支付发票 → status=paid, PaymentInfo 完整', () => {
    const bill = svc.calculateBill(makeReq())
    const inv = svc.generateInvoice(bill)
    const payment = svc.payInvoice(inv.id, 'wechat')
    expect(payment.status).toBe('paid')
    expect(payment.method).toBe('wechat')
    expect(payment.amount).toBe(inv.totalAmount)
    expect(payment.paidAt).toBeDefined()
  })

  it('支付后发票状态同步更新为 paid', () => {
    const bill = svc.calculateBill(makeReq())
    const inv = svc.generateInvoice(bill)
    svc.payInvoice(inv.id, 'alipay')

    const status = svc.getPaymentStatus(inv.id)
    expect(status!.status).toBe('paid')
    expect(status!.method).toBe('alipay')
  })

  it('支付不存在的发票抛 Error', () => {
    expect(() => svc.payInvoice('inv_missing', 'card')).toThrow('发票不存在')
  })

  it('未支付的发票 getPaymentStatus 返回 null', () => {
    const bill = svc.calculateBill(makeReq())
    const inv = svc.generateInvoice(bill)
    expect(svc.getPaymentStatus(inv.id)).toBeNull()
  })

  it('不存在的发票 ID getPaymentStatus 返回 null', () => {
    expect(svc.getPaymentStatus('inv_nonexistent')).toBeNull()
  })

  it('连续生成发票编号递增', () => {
    const bill = svc.calculateBill(makeReq())
    const inv1 = svc.generateInvoice(bill)
    const inv2 = svc.generateInvoice(bill)
    expect(inv2.invoiceNo > inv1.invoiceNo).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════
// 4️⃣ 查询与统计
// ══════════════════════════════════════════════════════════════════

describe('BillingService — 查询与统计', () => {
  let svc: BillingService

  beforeEach(() => {
    svc = makeService()
  })

  it('listInvoices 返回指定租户的发票列表', () => {
    const b1 = svc.calculateBill(makeReq({ tenantId: 'tenant-a' }))
    const b2 = svc.calculateBill(makeReq({ tenantId: 'tenant-b' }))
    svc.generateInvoice(b1)
    svc.generateInvoice(b2)
    svc.generateInvoice(b1) // tenant-a 第2张

    expect(svc.listInvoices('tenant-a').length).toBe(2)
    expect(svc.listInvoices('tenant-b').length).toBe(1)
  })

  it('listDiscountPolicies 返回所有预设策略', () => {
    const policies = svc.listDiscountPolicies()
    expect(policies.length).toBe(3)
    const codes = policies.map(p => p.code)
    expect(codes).toContain('NEWUSER20')
    expect(codes).toContain('ANNUAL30')
    expect(codes).toContain('VIP100')
  })

  it('getBillingStats 汇总统计正确', () => {
    const b1 = svc.calculateBill(makeReq({ tier: 'pro', usage: { apiCalls: 5000, storageGB: 50, bandwidthGB: 100, seats: 10 } }))
    const inv1 = svc.generateInvoice(b1)
    svc.payInvoice(inv1.id, 'card')

    const b2 = svc.calculateBill(makeReq())
    svc.generateInvoice(b2)

    const stats = svc.getBillingStats()
    expect(stats.invoiceCount).toBe(2)
    expect(stats.totalInvoiced).toBeGreaterThan(0)
    expect(stats.totalCollected).toBeGreaterThan(0)
    expect(stats.pendingAmount).toBeGreaterThan(0)
    // totalInvoiced - totalCollected = pendingAmount
    expect(stats.totalInvoiced - stats.totalCollected).toBeCloseTo(stats.pendingAmount, 1)
  })

  it('初始化时统计全部为 0', () => {
    const stats = svc.getBillingStats()
    expect(stats.invoiceCount).toBe(0)
    expect(stats.totalInvoiced).toBe(0)
    expect(stats.totalCollected).toBe(0)
    expect(stats.pendingAmount).toBe(0)
  })

  it('多租户数据隔离', () => {
    const bills = [
      svc.calculateBill(makeReq({ tenantId: 't1', tier: 'basic' })),
      svc.calculateBill(makeReq({ tenantId: 't2', tier: 'pro' })),
    ]
    bills.forEach(b => svc.generateInvoice(b))
    expect(svc.listInvoices('t1').length).toBe(1)
    expect(svc.listInvoices('t2').length).toBe(1)
  })

  it('账单计算幂等: 相同参数返回相同结果', () => {
    const b1 = svc.calculateBill(makeReq())
    const b2 = svc.calculateBill(makeReq())
    expect(b1.subtotal).toBe(b2.subtotal)
    expect(b1.total).toBe(b2.total)
    expect(b1.lineItems).toEqual(b2.lineItems)
  })
})
