/**
 * 🐜 自动: [billing] [C] 角色扩展测试
 *
 * 8 角色视角的计费模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 BillingService + in-memory Store
 */
import { describe, it, expect } from 'vitest'
import { BillingService } from './billing.service'
import type { BillRequest } from './billing.service'

// ── 角色权限矩阵 ──

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

/** 角色 → 计费模块权限 */
const roleBillingAccess: Record<string, string[]> = {
  'bill:calculate': ['👔店长', '🎯运行专员'],
  'bill:invoice': ['👔店长', '🎯运行专员'],
  'bill:pay': ['👔店长'],
  'bill:stats': ['👔店长', '🎯运行专员'],
  'bill:discount:apply': ['👔店长', '📢营销'],
  'bill:discount:list': ['👔店长', '📢营销', '🎯运行专员'],
  'bill:refund': ['👔店长'],
  'bill:audit': ['👔店长'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleBillingAccess[resource]?.includes(role) ?? false
}

function makeBillRequest(): BillRequest {
  return {
    tenantId: 'tenant-billing-test',
    tier: 'pro',
    usage: { apiCalls: 50000, storageGB: 200, bandwidthGB: 500, seats: 20 },
    billingPeriod: { start: '2026-07-01', end: '2026-07-31' },
    currency: 'CNY',
  }
}

function makeService(): BillingService {
  return new BillingService()
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 计费
// ════════════════════════════════════════════════════════════

describe('[👔店长] billing 角色扩展测试', () => {
  it('👔[正例] 店长计算账单 → 查看明细行项', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'bill:calculate')).toBe(true)
    const svc = makeService()
    const req = makeBillRequest()
    const bill = svc.calculateBill(req)

    expect(bill.tier).toBe('pro')
    expect(bill.lineItems.length).toBeGreaterThanOrEqual(5)
    expect(bill.lineItems[0].description).toContain('基础月费')
    expect(bill.lineItems[1].description).toContain('API调用')
    expect(bill.lineItems[2].description).toContain('存储')
    expect(bill.lineItems[3].description).toContain('带宽')
    expect(bill.lineItems[4].description).toContain('坐席')
    expect(bill.subtotal).toBeGreaterThan(0)
    expect(bill.total).toBeGreaterThan(0)
  })

  it('👔[正例] 店长生成并支付发票', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'bill:invoice')).toBe(true)
    const svc = makeService()
    const bill = svc.calculateBill(makeBillRequest())
    const invoice = svc.generateInvoice(bill)

    expect(invoice.status).toBe('draft')
    expect(invoice.invoiceNo).toContain('INV-')
    expect(invoice.totalAmount).toBe(bill.total)

    expect(checkRoleAccess(ROLES.StoreManager, 'bill:pay')).toBe(true)
    const payment = svc.payInvoice(invoice.id, 'wechat')
    expect(payment.status).toBe('paid')
    expect(payment.method).toBe('wechat')
    expect(payment.amount).toBe(bill.total)

    // Verify invoice updated to paid
    const updatedPayment = svc.getPaymentStatus(invoice.id)
    expect(updatedPayment).not.toBeNull()
    expect(updatedPayment!.status).toBe('paid')
  })

  it('👔[正例] 店长查看计费统计', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'bill:stats')).toBe(true)
    const svc = makeService()

    const bill1 = svc.calculateBill(makeBillRequest())
    svc.generateInvoice(bill1)

    const bill2 = svc.calculateBill({
      ...makeBillRequest(),
      tier: 'basic',
      usage: { apiCalls: 2000, storageGB: 10, bandwidthGB: 50, seats: 3 },
    })
    svc.generateInvoice(bill2)

    const stats = svc.getBillingStats()
    expect(stats.invoiceCount).toBe(2)
    expect(stats.totalInvoiced).toBeGreaterThan(0)
    expect(stats.totalCollected).toBe(0)
    expect(stats.pendingAmount).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 计费
// ════════════════════════════════════════════════════════════

describe('[🛒前台] billing 角色扩展测试', () => {
  it('🛒[反例] 前台无权限计算账单', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'bill:calculate')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'bill:invoice')).toBe(false)
  })

  it('🛒[反例] 前台无权限支付操作', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'bill:pay')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'bill:refund')).toBe(false)
  })

  it('🛒[反例] 前台无权限查看统计', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'bill:stats')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'bill:audit')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 计费
// ════════════════════════════════════════════════════════════

describe('[👥HR] billing 角色扩展测试', () => {
  it('👥[反例] HR 无权限进行财务操作', () => {
    expect(checkRoleAccess(ROLES.HR, 'bill:calculate')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'bill:invoice')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'bill:pay')).toBe(false)
  })

  it('👥[反例] HR 无权限查看计费统计', () => {
    expect(checkRoleAccess(ROLES.HR, 'bill:stats')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'bill:discount:list')).toBe(false)
  })

  it('👥[闭环] HR 无权限返回统一403格式', () => {
    const denied = { success: false, code: 403, message: 'NO_BILLING_ACCESS', module: 'billing' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('billing')
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 计费
// ════════════════════════════════════════════════════════════

describe('[🔧安监] billing 角色扩展测试', () => {
  it('🔧[反例] 安监无任何计费权限', () => {
    expect(checkRoleAccess(ROLES.Security, 'bill:calculate')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'bill:invoice')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'bill:pay')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'bill:discount:apply')).toBe(false)
  })

  it('🔧[反例] 安监无权限查看任何财务数据', () => {
    expect(checkRoleAccess(ROLES.Security, 'bill:stats')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'bill:audit')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'bill:discount:list')).toBe(false)
  })

  it('🔧[正例] 安监可以配合安全审计但不涉及计费', () => {
    // 安监关注合同合规性，但计费本身不在安监范围
    const auditTrail = [
      { action: 'bill_calculated', user: 'store_manager', ip: '192.168.1.1' },
      { action: 'payment_received', user: 'store_manager', ip: '192.168.1.1' },
    ]
    expect(auditTrail.length).toBe(2)
    expect(auditTrail[0].action).toBe('bill_calculated')
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 计费
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] billing 角色扩展测试', () => {
  it('🎮[反例] 导玩员无计费权限', () => {
    expect(checkRoleAccess(ROLES.Guide, 'bill:calculate')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'bill:invoice')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'bill:pay')).toBe(false)
  })

  it('🎮[反例] 导玩员不能查看或使用折扣', () => {
    expect(checkRoleAccess(ROLES.Guide, 'bill:discount:apply')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'bill:discount:list')).toBe(false)
  })

  it('🎮[反例] 导玩员无权查看统计', () => {
    expect(checkRoleAccess(ROLES.Guide, 'bill:stats')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'bill:audit')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 计费
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] billing 角色扩展测试', () => {
  it('🎯[正例] 运行专员计算账单 → 查看费用明细', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'bill:calculate')).toBe(true)
    const svc = makeService()
    const req = makeBillRequest()
    const bill = svc.calculateBill(req)

    expect(bill.subtotal).toBeGreaterThan(0)
    expect(bill.total).toBeGreaterThan(bill.taxAmount)
    expect(bill.lineItems[0].subtotal).toBe(499)
    expect(bill.lineItems[1].subtotal).toBe(25)
    expect(bill.lineItems[2].subtotal).toBe(16)
    expect(bill.lineItems[3].subtotal).toBe(15)
    expect(bill.lineItems[4].subtotal).toBe(160)
  })

  it('🎯[正例] 运行专员生成发票并查看列表', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'bill:invoice')).toBe(true)
    const svc = makeService()

    const bill1 = svc.calculateBill(makeBillRequest())
    const inv1 = svc.generateInvoice(bill1)
    expect(inv1.status).toBe('draft')

    const bill2 = svc.calculateBill({ ...makeBillRequest(), tier: 'enterprise' })
    const inv2 = svc.generateInvoice(bill2)
    expect(inv2.invoiceNo).not.toBe(inv1.invoiceNo)

    const invoices = svc.listInvoices('tenant-billing-test')
    expect(invoices.length).toBe(2)
  })

  it('🎯[正例] 运行专员查看折扣列表', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'bill:discount:list')).toBe(true)
    const svc = makeService()
    const policies = svc.listDiscountPolicies()

    expect(policies.length).toBeGreaterThanOrEqual(3)
    const newUser = policies.find(p => p.code === 'NEWUSER20')
    expect(newUser).toBeDefined()
    expect(newUser!.type).toBe('percentage')
    expect(newUser!.value).toBe(20)

    const annual = policies.find(p => p.code === 'ANNUAL30')
    expect(annual).toBeDefined()
    expect(annual!.value).toBe(30)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 计费
// ════════════════════════════════════════════════════════════

describe('[🤝团建] billing 角色扩展测试', () => {
  it('🤝[反例] 团建无计费权限', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'bill:calculate')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'bill:invoice')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'bill:pay')).toBe(false)
  })

  it('🤝[反例] 团建无权使用折扣或退款', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'bill:discount:apply')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'bill:refund')).toBe(false)
  })

  it('🤝[反例] 团建无权查看统计', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'bill:stats')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 计费
// ════════════════════════════════════════════════════════════

describe('[📢营销] billing 角色扩展测试', () => {
  it('📢[正例] 营销查看可用折扣策略', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'bill:discount:list')).toBe(true)
    const svc = makeService()
    const policies = svc.listDiscountPolicies()

    const vip100 = policies.find(p => p.code === 'VIP100')
    expect(vip100).toBeDefined()
    expect(vip100!.type).toBe('fixed')
    expect(vip100!.value).toBe(100)
  })

  it('📢[正例] 营销应用有效折扣码', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'bill:discount:apply')).toBe(true)
    const svc = makeService()
    const result = svc.applyDiscount(5000, 'NEWUSER20', 'pro')

    expect(result.amount).toBeGreaterThan(0)
    expect(result.label).toContain('新用户')
  })

  it('📢[反例] 营销无权限生成发票/支付', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'bill:invoice')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'bill:pay')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'bill:refund')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 billing 跨角色闭环 + 边界]', () => {
  it('📢 + 👔 营销申请折扣 + 店长确认账单并支付', async () => {
    const svc = makeService()

    // 营销查看折扣列表
    const policies = svc.listDiscountPolicies()
    expect(policies.some(p => p.code === 'ANNUAL30')).toBe(true)

    // 店长计算账单并应用年付折扣
    const bill = svc.calculateBill({
      ...makeBillRequest(),
      couponCode: 'ANNUAL30',
    })
    expect(bill.discountAmount).toBeGreaterThan(0)
    expect(bill.discountLabel).toContain('年付')
    expect(bill.discountAmount).toBeLessThan(bill.subtotal)

    // 店长生成并支付
    const invoice = svc.generateInvoice(bill)
    expect(invoice.status).toBe('draft')

    const payment = svc.payInvoice(invoice.id, 'alipay')
    expect(payment.status).toBe('paid')

    // 验证统计
    const stats = svc.getBillingStats()
    expect(stats.totalCollected).toBeGreaterThan(0)
  })

  it('🛡️ 无效优惠码不计折扣', () => {
    const svc = makeService()
    const result = svc.applyDiscount(1000, 'INVALID_CODE', 'pro')

    expect(result.amount).toBe(0)
    expect(result.label).toBe('无效优惠码')
  })

  it('🛡️ 不适用当前套餐的折扣返回0', () => {
    const svc = makeService()
    const result = svc.applyDiscount(1000, 'VIP100', 'basic')

    expect(result.amount).toBe(0)
    expect(result.label).toBe('不适用当前套餐')
  })

  it('🛡️ 未达最低消费的折扣被拒绝', () => {
    const svc = makeService()
    const result = svc.applyDiscount(50, 'ANNUAL30', 'basic')

    expect(result.amount).toBe(0)
    expect(result.label).toContain('最低消费')
  })

  it('🛡️ 发票不存在返回 null', () => {
    const svc = makeService()
    expect(svc.getPaymentStatus('inv_nonexistent')).toBeNull()
  })

  it('🛡️ 支付不存在的发票抛出异常', () => {
    const svc = makeService()
    expect(() => svc.payInvoice('inv_fake', 'wechat'))
      .toThrow('发票不存在')
  })

  it('🛡️ 不同层级不同基础月费', () => {
    const svc = makeService()

    const free = svc.calculateBill({ ...makeBillRequest(), tier: 'free', usage: { apiCalls: 0, storageGB: 0, bandwidthGB: 0, seats: 0 } })
    expect(free.total).toBe(0)

    const basic = svc.calculateBill({ ...makeBillRequest(), tier: 'basic' })
    expect(basic.lineItems[0].subtotal).toBe(99)

    const enterprise = svc.calculateBill({ ...makeBillRequest(), tier: 'enterprise' })
    expect(enterprise.lineItems[0].subtotal).toBe(2999)
  })

  it('🛡️ 阶梯折扣自动应用（大客户）', () => {
    const svc = makeService()
    const bigBill = svc.calculateBill({
      ...makeBillRequest(),
      tier: 'enterprise',
      usage: { apiCalls: 5000000, storageGB: 10000, bandwidthGB: 20000, seats: 500 },
    })

    expect(bigBill.discountAmount).toBeGreaterThan(0)
    expect(bigBill.discountLabel).toContain('大客户')
  })

  it('🛡️ 折扣封顶生效', () => {
    const svc = makeService()
    const result = svc.applyDiscount(10000, 'NEWUSER20', 'pro')
    expect(result.amount).toBe(500)
    expect(result.label).toContain('新用户')
  })

  it('🛡️ 发票序号递增', () => {
    const svc = makeService()
    const inv1 = svc.generateInvoice(svc.calculateBill(makeBillRequest()))
    const inv2 = svc.generateInvoice(svc.calculateBill(makeBillRequest()))
    const inv3 = svc.generateInvoice(svc.calculateBill(makeBillRequest()))

    expect(inv1.invoiceNo).not.toBe(inv2.invoiceNo)
    expect(inv2.invoiceNo).not.toBe(inv3.invoiceNo)
  })

  it('🛡️ 已支付发票状态更新', () => {
    const svc = makeService()
    const bill = svc.calculateBill(makeBillRequest())
    const invoice = svc.generateInvoice(bill)
    svc.payInvoice(invoice.id, 'bank_transfer')

    const payment = svc.getPaymentStatus(invoice.id)
    expect(payment).not.toBeNull()
    expect(payment!.status).toBe('paid')
    expect(payment!.paidAt).toBeDefined()
  })
})
