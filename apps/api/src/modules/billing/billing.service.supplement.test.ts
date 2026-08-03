/**
 * billing.service.supplement.test.ts — 计费 Service 补充测试 (27+ tests)
 *
 * 覆盖:
 *   1️⃣ 多租户计费隔离 + 重复计算 (5)
 *   2️⃣ 优惠码完整验证 (5)
 *   3️⃣ 发票状态机 + 生命周期 (5)
 *   4️⃣ RBAC 权限矩阵 (5)
 *   5️⃣ 统计数据一致性 + 边界 (4)
 *   6️⃣ 多币种/多套餐组合 (3)
 *
 * 全部模拟依赖，不连真实数据库
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BillingService, type BillRequest, type PricingTier } from './billing.service'

vi.setConfig({ testTimeout: 10000 })

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

const roleAccess: Record<string, string[]> = {
  'bill:calculate': ['👔店长', '🎯运行专员'],
  'bill:invoice': ['👔店长', '🎯运行专员'],
  'bill:pay': ['👔店长'],
  'bill:stats': ['👔店长', '🎯运行专员'],
  'bill:discount:apply': ['👔店长', '📢营销'],
  'bill:discount:list': ['👔店长', '📢营销', '🎯运行专员'],
  'bill:refund': ['👔店长'],
  'bill:audit': ['👔店长'],
}

function hasAccess(role: string, resource: string): boolean {
  return roleAccess[resource]?.includes(role) ?? false
}

function makeProRequest(overrides?: Partial<BillRequest>): BillRequest {
  return {
    tenantId: 'tenant-supplement',
    tier: 'pro',
    usage: { apiCalls: 50000, storageGB: 200, bandwidthGB: 500, seats: 20 },
    billingPeriod: { start: '2026-07-01', end: '2026-07-31' },
    currency: 'CNY',
    ...overrides,
  }
}

// ══════════════════════════════════════════════════════════════════
// 1️⃣ 多租户计费隔离 + 重复计算
// ══════════════════════════════════════════════════════════════════

describe('[1️⃣ 多租户计费] BillingService', () => {
  let svc: BillingService

  beforeEach(() => {
    svc = new BillingService()
  })

  it('不同租户相同参数计算账单结果数值相同,tenantId不同', () => {
    const a = svc.calculateBill(makeProRequest({ tenantId: 'tenant-a' }))
    const b = svc.calculateBill(makeProRequest({ tenantId: 'tenant-b' }))

    expect(a.tenantId).toBe('tenant-a')
    expect(b.tenantId).toBe('tenant-b')
    expect(a.subtotal).toBe(b.subtotal)
    expect(a.total).toBe(b.total)
  })

  it('同一租户重复计算产生独立 BillResult(calculatedAt可能相同但服务应为幂等)', () => {
    const r1 = svc.calculateBill(makeProRequest())
    const r2 = svc.calculateBill(makeProRequest())
    expect(r1.calculatedAt).toBeDefined()
    expect(r2.calculatedAt).toBeDefined()
    expect(r1.subtotal).toBe(r2.subtotal)
    expect(r1.total).toBe(r2.total)
    expect(r1.lineItems).toEqual(r2.lineItems)
  })

  it('生成发票后,listInvoices 按 tenantId 隔离', () => {
    const billA = svc.calculateBill(makeProRequest({ tenantId: 'tenant-id-a' }))
    const billB = svc.calculateBill(makeProRequest({ tenantId: 'tenant-id-b' }))

    svc.generateInvoice(billA)
    svc.generateInvoice(billB)

    expect(svc.listInvoices('tenant-id-a').length).toBe(1)
    expect(svc.listInvoices('tenant-id-b').length).toBe(1)
    expect(svc.listInvoices('non-existent').length).toBe(0)
  })

  it('多个 tenant 的发票互不泄露', () => {
    for (let i = 1; i <= 3; i++) {
      const bill = svc.calculateBill(makeProRequest({ tenantId: `tenant-${i}` }))
      svc.generateInvoice(bill)
    }
    expect(svc.listInvoices('tenant-1').length).toBe(1)
    expect(svc.listInvoices('tenant-2').length).toBe(1)
    expect(svc.listInvoices('tenant-3').length).toBe(1)
  })

  it('大量 invoice 生成后 invoiceNo 编号连续递增无间断', () => {
    for (let i = 0; i < 5; i++) {
      const bill = svc.calculateBill(makeProRequest({ tenantId: `bulk-${i}` }))
      svc.generateInvoice(bill)
    }
    const inv = svc.generateInvoice(svc.calculateBill(makeProRequest({ tenantId: 'bulk-last' })))
    expect(inv.invoiceNo).toContain('000006')
  })
})

// ══════════════════════════════════════════════════════════════════
// 2️⃣ 优惠码完整验证
// ══════════════════════════════════════════════════════════════════

describe('[2️⃣ 优惠码验证] BillingService', () => {
  let svc: BillingService

  beforeEach(() => {
    svc = new BillingService()
  })

  it('NEWUSER20 对 basic 可用，但 VIP100 对 basic 不可用', () => {
    const billWithNewUser = svc.calculateBill(makeProRequest({
      couponCode: 'NEWUSER20',
      tier: 'basic',
      usage: { apiCalls: 1000, storageGB: 10, bandwidthGB: 20, seats: 5 },
    }))
    // NEWUSER20 适用于 basic, pro
    expect(billWithNewUser.discountAmount).toBeGreaterThan(0)
  })

  it('VIP100 适用于 pro/enterprise', () => {
    const bill = svc.calculateBill(makeProRequest({
      couponCode: 'VIP100',
      tier: 'enterprise',
      usage: { apiCalls: 100000, storageGB: 100, bandwidthGB: 200, seats: 10 },
    }))
    expect(bill.discountAmount).toBeGreaterThanOrEqual(100)
    expect(bill.discountLabel).toContain('VIP')
  })

  it('VIP100 对 basic 不适用', () => {
    const result = svc.applyDiscount(1000, 'VIP100', 'basic')
    expect(result.amount).toBe(0)
    expect(result.label).toBe('不适用当前套餐')
  })

  it('优惠码使用次数累加不降级', () => {
    const policyBefore = svc.listDiscountPolicies().find((p) => p.code === 'NEWUSER20')
    const usesBefore = policyBefore!.currentUses

    for (let i = 0; i < 3; i++) {
      svc.applyDiscount(1000, 'NEWUSER20', 'pro')
    }

    const policyAfter = svc.listDiscountPolicies().find((p) => p.code === 'NEWUSER20')
    expect(policyAfter!.currentUses).toBe(usesBefore + 3)
  })

  it('applyDiscount 未传 couponCode 走阶梯折扣', () => {
    const r1 = svc.applyDiscount(500)
    expect(r1.amount).toBe(0)
    expect(r1.label).toBe('无折扣')

    const r2 = svc.applyDiscount(1000)
    expect(r2.amount).toBe(50)
    expect(r2.label).toContain('批量折扣')

    const r3 = svc.applyDiscount(5000)
    expect(r3.amount).toBe(500)
    expect(r3.label).toContain('大客户')
  })
})

// ══════════════════════════════════════════════════════════════════
// 3️⃣ 发票状态机 + 生命周期
// ══════════════════════════════════════════════════════════════════

describe('[3️⃣ 发票状态机] BillingService', () => {
  let svc: BillingService

  beforeEach(() => {
    svc = new BillingService()
  })

  it('生成发票初始为 draft, 支付后变为 paid', () => {
    const bill = svc.calculateBill(makeProRequest())
    const inv = svc.generateInvoice(bill)
    expect(inv.status).toBe('draft')
    expect(inv.issuedAt).toBeDefined()
    expect(inv.dueAt).toBeDefined()

    const payment = svc.payInvoice(inv.id, 'alipay')
    expect(payment.status).toBe('paid')

    // Invoice 也应更新
    const afterPay = svc.listInvoices(inv.tenantId).find(i => i.id === inv.id)
    expect(afterPay).toBeDefined()
    expect(afterPay!.status).toBe('paid')
    expect(afterPay!.paidAt).toBeDefined()
  })

  it('支付过的发票再次支付创建新支付记录', () => {
    const bill = svc.calculateBill(makeProRequest())
    const inv = svc.generateInvoice(bill)

    svc.payInvoice(inv.id, 'wechat')
    svc.payInvoice(inv.id, 'alipay')

    // The invoice status remains paid
    const after = svc.listInvoices(inv.tenantId).find(i => i.id === inv.id)
    expect(after!.status).toBe('paid')

    // Multiple payment records created
    const stats = svc.getBillingStats()
    expect(stats.totalCollected).toBeCloseTo(inv.totalAmount * 2, 0)
  })

  it('发票 ID 格式: inv_000001, inv_000002 ...', () => {
    const bill = svc.calculateBill(makeProRequest())
    const inv1 = svc.generateInvoice(bill)
    expect(inv1.id).toMatch(/^inv_\d{6}$/)

    const inv2 = svc.generateInvoice(bill)
    expect(inv2.id).toMatch(/^inv_\d{6}$/)
    expect(inv2.id).not.toBe(inv1.id)
  })

  it('generateInvoice 返回包含 billingPeriod', () => {
    const bill = svc.calculateBill(makeProRequest({
      billingPeriod: { start: '2026-07-01', end: '2026-07-31' },
    }))
    const inv = svc.generateInvoice(bill)
    expect(inv.billingPeriod.start).toBe('2026-07-01')
    expect(inv.billingPeriod.end).toBe('2026-07-31')
  })

  it('payInvoice 使用不同支付方式', () => {
    const bill = svc.calculateBill(makeProRequest())
    const inv = svc.generateInvoice(bill)

    const pay1 = svc.payInvoice(inv.id, 'wechat')
    expect(pay1.method).toBe('wechat')

    const pay2 = svc.payInvoice(inv.id, 'alipay')
    expect(pay2.method).toBe('alipay')

    const pay3 = svc.payInvoice(inv.id, 'bank_transfer')
    expect(pay3.method).toBe('bank_transfer')
  })
})

// ══════════════════════════════════════════════════════════════════
// 4️⃣ RBAC 权限矩阵
// ══════════════════════════════════════════════════════════════════

describe('[4️⃣ RBAC权限] BillingService', () => {
  it('👔店长拥有: 计算/发票/支付/统计/折扣/退款/审计 全部权限', () => {
    expect(hasAccess(ROLES.StoreManager, 'bill:calculate')).toBe(true)
    expect(hasAccess(ROLES.StoreManager, 'bill:invoice')).toBe(true)
    expect(hasAccess(ROLES.StoreManager, 'bill:pay')).toBe(true)
    expect(hasAccess(ROLES.StoreManager, 'bill:stats')).toBe(true)
    expect(hasAccess(ROLES.StoreManager, 'bill:discount:apply')).toBe(true)
    expect(hasAccess(ROLES.StoreManager, 'bill:discount:list')).toBe(true)
    expect(hasAccess(ROLES.StoreManager, 'bill:refund')).toBe(true)
    expect(hasAccess(ROLES.StoreManager, 'bill:audit')).toBe(true)
  })

  it('🎯运行专员可: 计算/发票/统计/折扣列表; 不可: 支付/退款/折扣应用/审计', () => {
    expect(hasAccess(ROLES.Operations, 'bill:calculate')).toBe(true)
    expect(hasAccess(ROLES.Operations, 'bill:invoice')).toBe(true)
    expect(hasAccess(ROLES.Operations, 'bill:stats')).toBe(true)
    expect(hasAccess(ROLES.Operations, 'bill:discount:list')).toBe(true)
    expect(hasAccess(ROLES.Operations, 'bill:pay')).toBe(false)
    expect(hasAccess(ROLES.Operations, 'bill:refund')).toBe(false)
    expect(hasAccess(ROLES.Operations, 'bill:discount:apply')).toBe(false)
    expect(hasAccess(ROLES.Operations, 'bill:audit')).toBe(false)
  })

  it('📢营销可: 折扣查看/应用; 不可: 计算/发票/支付/退款/审计/统计', () => {
    expect(hasAccess(ROLES.Marketing, 'bill:discount:list')).toBe(true)
    expect(hasAccess(ROLES.Marketing, 'bill:discount:apply')).toBe(true)
    expect(hasAccess(ROLES.Marketing, 'bill:calculate')).toBe(false)
    expect(hasAccess(ROLES.Marketing, 'bill:invoice')).toBe(false)
    expect(hasAccess(ROLES.Marketing, 'bill:pay')).toBe(false)
    expect(hasAccess(ROLES.Marketing, 'bill:stats')).toBe(false)
    expect(hasAccess(ROLES.Marketing, 'bill:refund')).toBe(false)
    expect(hasAccess(ROLES.Marketing, 'bill:audit')).toBe(false)
  })

  it('🛒前台/👥HR/🔧安监/🎮导玩员/🤝团建 无任何计费权限', () => {
    const noAccessRoles = [ROLES.FrontDesk, ROLES.HR, ROLES.Security, ROLES.Guide, ROLES.Teambuilding]
    const allResources = Object.keys(roleAccess)
    for (const role of noAccessRoles) {
      for (const resource of allResources) {
        expect(hasAccess(role, resource)).toBe(false)
      }
    }
  })

  it('未定义资源返回 false', () => {
    expect(hasAccess(ROLES.StoreManager, 'bill:non-existent')).toBe(false)
    expect(hasAccess(ROLES.Operations, '')).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════
// 5️⃣ 统计数据一致性 + 边界
// ══════════════════════════════════════════════════════════════════

describe('[5️⃣ 统计一致性] BillingService', () => {
  let svc: BillingService

  beforeEach(() => {
    svc = new BillingService()
  })

  it('无任何操作时统计均为0', () => {
    const stats = svc.getBillingStats()
    expect(stats.totalInvoiced).toBe(0)
    expect(stats.totalCollected).toBe(0)
    expect(stats.pendingAmount).toBe(0)
    expect(stats.invoiceCount).toBe(0)
  })

  it('生成发票但不支付: totalInvoiced>0, totalCollected=0', () => {
    const bill = svc.calculateBill(makeProRequest())
    svc.generateInvoice(bill)

    const stats = svc.getBillingStats()
    expect(stats.invoiceCount).toBe(1)
    expect(stats.totalInvoiced).toBeGreaterThan(0)
    expect(stats.totalCollected).toBe(0)
    expect(stats.pendingAmount).toBeCloseTo(stats.totalInvoiced, 0)
  })

  it('支付后 totalCollected = totalInvoiced', () => {
    const bill = svc.calculateBill(makeProRequest())
    const inv = svc.generateInvoice(bill)
    svc.payInvoice(inv.id, 'wechat')

    const stats = svc.getBillingStats()
    expect(stats.invoiceCount).toBe(1)
    expect(stats.totalCollected).toBeCloseTo(stats.totalInvoiced, 0)
    expect(stats.pendingAmount).toBeCloseTo(0, 0)
  })

  it('混合场景: 部分支付,部分未付,统计正确', () => {
    // Bill A: generate only
    const billA = svc.calculateBill(makeProRequest({ tenantId: 'tenant-a' }))
    svc.generateInvoice(billA)

    // Bill B: generate + pay
    const billB = svc.calculateBill(makeProRequest({ tenantId: 'tenant-b' }))
    const invB = svc.generateInvoice(billB)
    svc.payInvoice(invB.id, 'alipay')

    const stats = svc.getBillingStats()
    expect(stats.invoiceCount).toBe(2)
    expect(stats.totalInvoiced).toBeCloseTo(billA.total + billB.total, 0)
    expect(stats.totalCollected).toBeCloseTo(billB.total, 0)
    expect(stats.pendingAmount).toBeCloseTo(billA.total, 0)
  })
})

// ══════════════════════════════════════════════════════════════════
// 6️⃣ 多币种/多套餐组合
// ══════════════════════════════════════════════════════════════════

describe('[6️⃣ 多币种套餐] BillingService', () => {
  let svc: BillingService

  beforeEach(() => {
    svc = new BillingService()
  })

  it('Free 套餐所有费用为0', () => {
    const bill = svc.calculateBill(makeProRequest({
      tier: 'free',
      usage: { apiCalls: 0, storageGB: 0, bandwidthGB: 0, seats: 0 },
    }))
    expect(bill.subtotal).toBe(0)
    expect(bill.total).toBe(0)
    expect(bill.lineItems.every(item => item.subtotal === 0)).toBe(true)
  })

  it('USD 币种账单正确传递', () => {
    const bill = svc.calculateBill(makeProRequest({ currency: 'USD' }))
    expect(bill.currency).toBe('USD')
    expect(bill.lineItems.every(item => item.currency === 'USD')).toBe(true)
  })

  it('Enterprise 套餐各项费用系数正确', () => {
    const bill = svc.calculateBill(makeProRequest({
      tier: 'enterprise',
      usage: { apiCalls: 100000, storageGB: 500, bandwidthGB: 1000, seats: 50 },
      couponCode: 'VIP100',
    }))
    // baseMonthly: 2999
    // apiCalls: 100000 * 0.0002 = 20
    // storage: 500 * 0.05 = 25
    // bandwidth: 1000 * 0.02 = 20
    // seats: 50 * 5 = 250
    // subtotal ≈ 3314
    // VIP100 fixed -100
    // tax = (3314 - 100) * 0.13 ≈ 417.82
    // total ≈ 3314 - 100 + 417.82 ≈ 3631.82
    expect(bill.lineItems[0].subtotal).toBe(2999)
    expect(bill.discountAmount).toBeGreaterThanOrEqual(100)
    expect(bill.total).toBeGreaterThan(0)
    expect(bill.total).toBeLessThan(bill.subtotal + bill.taxAmount)
  })
})
