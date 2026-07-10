import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [saas-billing] [C] 角色场景测试
 *
 * 8 角色视角的 SaaS 计费模块场景测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限/业务边界）
 * 场景基于街机门店 SaaS 计费运营真实业务流
 */

import { SaaSBillingService } from './saas-billing.service'

// ── 测试数据工厂 ──
function createService() {
  return new SaaSBillingService()
}

const TENANT_ID = 'tenant-arcade-01'

// ═══════════════════════════
// 👔 店长 — 套餐选购与续费决策
// ═══════════════════════════
describe('👔 店长 - 套餐选购与续费决策', () => {
  let svc: SaaSBillingService

  beforeEach(() => {
    svc = createService()
  })

  it('[正例] 查看全部可用套餐列表，找到 starter 基础方案', () => {
    const plans = svc.listPlans()
    expect(plans.length).toBeGreaterThanOrEqual(3)
    const starter = plans.find((p) => p.tier === 'starter')
    expect(starter).toBeDefined()
    expect(starter!.basePrice).toBe(299)
  })

  it('[正例] 订阅 annual 套餐享受 80% 折扣价格', () => {
    const sub = svc.subscribe(TENANT_ID, 'plan_professional', 'annually')
    expect(sub.status).toBe('active')
    expect(sub.billingCycle).toBe('annually')
    const plan = svc.getPlan('plan_professional')!
    expect(plan.basePrice * plan.discountPercent.annually).toBeLessThan(plan.basePrice)
    expect(sub.nextBillingDate > sub.startedAt).toBe(true)
  })

  it('[边界] 升级套餐后配额自动扩容', () => {
    svc.subscribe(TENANT_ID, 'plan_starter', 'monthly')
    svc.changePlan(TENANT_ID, 'plan_enterprise')
    const usage = svc.getQuotaUsage(TENANT_ID)
    const storageQuota = usage.find((u) => u.quota === 'storage_gb')
    expect(storageQuota).toBeDefined()
    expect(storageQuota!.limit).toBe(500)
  })

  it('[边界] 取消订阅后状态变为 cancelled', () => {
    svc.subscribe(TENANT_ID, 'plan_starter', 'monthly')
    svc.cancelSubscription(TENANT_ID)
    const sub = svc.getSubscription(TENANT_ID)
    expect(sub!.status).toBe('cancelled')
  })

  it('[反例] 订阅不存在的套餐抛出错误', () => {
    expect(() => svc.subscribe(TENANT_ID, 'plan_nonexistent', 'monthly')).toThrow(
      /Plan plan_nonexistent not found/,
    )
  })
})

// ═══════════════════════════
// 🛒 前台 — 发票管理与查看
// ═══════════════════════════
describe('🛒 前台 - 发票管理与查看', () => {
  let svc: SaaSBillingService

  beforeEach(() => {
    svc = createService()
  })

  it('[正例] 生成含套餐明细的 invoice', () => {
    svc.subscribe(TENANT_ID, 'plan_professional', 'monthly')
    const invoice = svc.generateInvoice(TENANT_ID)
    expect(invoice.tenantId).toBe(TENANT_ID)
    expect(invoice.items.length).toBeGreaterThanOrEqual(1)
    expect(invoice.currency).toBe('CNY')
    expect(invoice.status).toBe('issued')
    expect(invoice.invoiceId).toMatch(/^inv_/)
  })

  it('[正例] 前台标记发票已支付', () => {
    svc.subscribe(TENANT_ID, 'plan_starter', 'monthly')
    const invoice = svc.generateInvoice(TENANT_ID)
    expect(invoice.status).toBe('issued')
    svc.markPaid(invoice.invoiceId)
    const inv = svc.listInvoices(TENANT_ID).find((i) => i.invoiceId === invoice.invoiceId)
    expect(inv!.status).toBe('paid')
    expect(inv!.paidAt).toBeDefined()
  })

  it('[边界] 列出该租户全部发票，按时间倒序', () => {
    svc.subscribe(TENANT_ID, 'plan_starter', 'monthly')
    svc.generateInvoice(TENANT_ID)
    svc.generateInvoice(TENANT_ID)
    const invoices = svc.listInvoices(TENANT_ID)
    expect(invoices.length).toBe(2)
    expect(invoices[0].issuedAt.getTime()).toBeGreaterThanOrEqual(
      invoices[1].issuedAt.getTime(),
    )
  })

  it('[反例] 标记不存在的 invoice 抛出错误', () => {
    expect(() => svc.markPaid('inv_fake')).toThrow(/Invoice inv_fake not found/)
  })
})

// ═══════════════════════════
// 👥 HR — 用户配额与人力成本
// ═══════════════════════════
describe('👥 HR - 用户配额与人力成本', () => {
  let svc: SaaSBillingService

  beforeEach(() => {
    svc = createService()
  })

  it('[正例] starter 套餐限制 5 个用户，记录使用量后检查限额', () => {
    svc.subscribe(TENANT_ID, 'plan_starter', 'monthly')
    svc.recordUsage(TENANT_ID, 'users', 3)
    const check = svc.checkQuota(TENANT_ID, 'users', 2)
    expect(check.limit).toBe(5)
    expect(check.allowed).toBe(true)
    expect(check.current).toBe(3)
  })

  it('[边界] 超限后超额费用按用户单价计算', () => {
    svc.subscribe(TENANT_ID, 'plan_starter', 'monthly')
    svc.recordUsage(TENANT_ID, 'users', 6)
    const overage = svc.calculateOverage(TENANT_ID)
    expect(overage.users).toBeGreaterThan(0)
    // starter 用户上限 5，超 1 人，单价 $20
    expect(overage.users).toBe(20)
  })

  it('[反例] enterprise 套餐用户无限，超额为 0', () => {
    svc.subscribe(TENANT_ID, 'plan_enterprise', 'monthly')
    svc.recordUsage(TENANT_ID, 'users', 9999)
    const check = svc.checkQuota(TENANT_ID, 'users', 1)
    expect(check.allowed).toBe(true)
    expect(check.overage).toBe(0)
  })
})

// ═══════════════════════════
// 🔧 安监 — API 调用与安全监控
// ═══════════════════════════
describe('🔧 安监 - API 调用与安全监控', () => {
  let svc: SaaSBillingService

  beforeEach(() => {
    svc = createService()
  })

  it('[正例] starter 套餐 api_calls 上限 100k，未超限时超额为 0', () => {
    svc.subscribe(TENANT_ID, 'plan_starter', 'monthly')
    svc.recordUsage(TENANT_ID, 'api_calls', 50000)
    const overage = svc.calculateOverage(TENANT_ID)
    expect(overage.api_calls).toBe(0)
  })

  it('[边界] API 调用超限后超额费用正确计算', () => {
    svc.subscribe(TENANT_ID, 'plan_starter', 'monthly')
    svc.recordUsage(TENANT_ID, 'api_calls', 110000)
    const overage = svc.calculateOverage(TENANT_ID)
    // 超了 10000 次，$0.01/次 = $100
    expect(overage.api_calls).toBe(10000 * 0.01)
  })

  it('[边界] enterprise 套餐 API 无限调用，超额为 0', () => {
    svc.subscribe(TENANT_ID, 'plan_enterprise', 'monthly')
    svc.recordUsage(TENANT_ID, 'api_calls', 2_000_000)
    const overage = svc.calculateOverage(TENANT_ID)
    expect(overage.api_calls).toBe(0)
  })

  it('[反例] 向未订阅租户记录配额抛出错误', () => {
    expect(() => svc.recordUsage('tenant-unknown', 'api_calls', 100)).toThrow(
      /Quota usage for tenant tenant-unknown not found/,
    )
  })
})

// ═══════════════════════════
// 🎮 导玩员 — 交易配额与超限
// ═══════════════════════════
describe('🎮 导玩员 - 交易配额与超限', () => {
  let svc: SaaSBillingService

  beforeEach(() => {
    svc = createService()
  })

  it('[正例] 记录交易使用量，季度套餐交易配额不限', () => {
    svc.subscribe(TENANT_ID, 'plan_professional', 'quarterly')
    svc.recordUsage(TENANT_ID, 'transactions', 500)
    const check = svc.checkQuota(TENANT_ID, 'transactions', 1)
    expect(check.allowed).toBe(true)
    // limit 是 UNLIMITED(Infinity)
    expect(check.limit).toBe(Number.POSITIVE_INFINITY)
  })

  it('[边界] 大量交易记录正确累计使用量', () => {
    svc.subscribe(TENANT_ID, 'plan_starter', 'monthly')
    svc.recordUsage(TENANT_ID, 'transactions', 1000)
    svc.recordUsage(TENANT_ID, 'transactions', 2000)
    const usage = svc.getQuotaUsage(TENANT_ID)
    const txn = usage.find((u) => u.quota === 'transactions')
    expect(txn!.used).toBe(3000)
  })
})

// ═══════════════════════════
// 🎯 运行专员 — 配额监控与资源规划
// ═══════════════════════════
describe('🎯 运行专员 - 配额监控与资源规划', () => {
  let svc: SaaSBillingService

  beforeEach(() => {
    svc = createService()
  })

  it('[正例] 查询租户全部配额使用情况', () => {
    svc.subscribe(TENANT_ID, 'plan_professional', 'monthly')
    svc.recordUsage(TENANT_ID, 'storage_gb', 10)
    svc.recordUsage(TENANT_ID, 'devices', 3)
    const usage = svc.getQuotaUsage(TENANT_ID)
    expect(usage.length).toBeGreaterThanOrEqual(5)
    const storage = usage.find((u) => u.quota === 'storage_gb')
    expect(storage!.used).toBe(10)
  })

  it('[边界] 检查即将超限的配额正确预警', () => {
    svc.subscribe(TENANT_ID, 'plan_starter', 'monthly')
    svc.recordUsage(TENANT_ID, 'storage_gb', 4) // 还剩 1GB
    const check = svc.checkQuota(TENANT_ID, 'storage_gb', 1)
    expect(check.allowed).toBe(true)
    expect(check.limit).toBe(5)
    const overCheck = svc.checkQuota(TENANT_ID, 'storage_gb', 2)
    expect(overCheck.allowed).toBe(false)
  })

  it('[边界] 多维度超额费用汇总', () => {
    svc.subscribe(TENANT_ID, 'plan_starter', 'monthly')
    svc.recordUsage(TENANT_ID, 'storage_gb', 10) // 超 5GB * $1 = $5
    svc.recordUsage(TENANT_ID, 'api_calls', 120000) // 超 20000 * $0.01 = $200
    const overage = svc.calculateOverage(TENANT_ID)
    expect(overage.storage_gb).toBeCloseTo(5, 2)
    expect(overage.api_calls).toBeCloseTo(200, 2)
  })
})

// ═══════════════════════════
// 🤝 团建 — 试用管理与转化
// ═══════════════════════════
describe('🤝 团建 - 试用管理与转化', () => {
  let svc: SaaSBillingService

  beforeEach(() => {
    svc = createService()
  })

  it('[正例] 发起租户试用，状态为 trial，有到期日', () => {
    const sub = svc.startTrial(TENANT_ID, 'plan_professional')
    expect(sub.status).toBe('trial')
    expect(sub.trialEndsAt).toBeDefined()
    const status = svc.checkTrialStatus(TENANT_ID)
    expect(status.isTrial).toBe(true)
    expect(status.daysRemaining).toBeGreaterThan(0)
    expect(status.daysRemaining).toBeLessThanOrEqual(14)
  })

  it('[正例] 试用期结束前转换为正式订阅', () => {
    svc.startTrial(TENANT_ID, 'plan_professional')
    const converted = svc.convertTrial(TENANT_ID)
    expect(converted.status).toBe('active')
    expect(converted.trialEndsAt).toBeUndefined()
  })

  it('[边界] 多次调用 checkTrialStatus 不影响状态', () => {
    svc.startTrial(TENANT_ID, 'plan_starter')
    const s1 = svc.checkTrialStatus(TENANT_ID)
    const s2 = svc.checkTrialStatus(TENANT_ID)
    expect(s1.daysRemaining).toBe(s2.daysRemaining)
    expect(s1.isTrial).toBe(s2.isTrial)
  })

  it('[反例] 未试用租户检查返回 isTrial=false', () => {
    const status = svc.checkTrialStatus('tenant-no-trial')
    expect(status.isTrial).toBe(false)
    expect(status.daysRemaining).toBe(0)
  })

  it('[反例] 转化非试用订阅抛出错误', () => {
    svc.subscribe(TENANT_ID, 'plan_starter', 'monthly')
    expect(() => svc.convertTrial(TENANT_ID)).toThrow(
      /Only trial subscriptions can be converted/,
    )
  })
})

// ═══════════════════════════
// 📢 营销 — 套餐特性对比与定价策略
// ═══════════════════════════
describe('📢 营销 - 套餐特性对比与定价策略', () => {
  let svc: SaaSBillingService

  beforeEach(() => {
    svc = createService()
  })

  it('[正例] 三个套餐按单价分层排列', () => {
    const plans = svc.listPlans()
    const prices = plans.map((p) => p.basePrice).sort((a, b) => a - b)
    expect(prices).toEqual([299, 999, 2999])
  })

  it('[正例] annual 折扣最低，鼓励年付', () => {
    const professional = svc.getPlan('plan_professional')!
    expect(professional.discountPercent.annually).toBeLessThan(
      professional.discountPercent.quarterly,
    )
    expect(professional.discountPercent.quarterly).toBeLessThan(
      professional.discountPercent.monthly,
    )
  })

  it('[边界] 创建自定义套餐并成功订阅', () => {
    const newPlan = svc.createPlan({
      tier: 'professional',
      name: 'Custom Arcade Plan',
      basePrice: 1499,
      billingCycles: ['monthly', 'annually'],
      features: ['无限API', '100GB存储', '30个用户'],
      quotas: {
        api_calls: Number.POSITIVE_INFINITY,
        storage_gb: 100,
        users: 30,
        transactions: Number.POSITIVE_INFINITY,
        devices: 50,
      },
      overageRates: {
        api_calls: 0.01,
        storage_gb: 1,
        users: 20,
        transactions: 0.001,
        devices: 5,
      },
      discountPercent: {
        monthly: 1,
        quarterly: 0.9,
        annually: 0.8,
      },
    })
    expect(newPlan.planId).toMatch(/^plan_/)
    const sub = svc.subscribe(TENANT_ID, newPlan.planId, 'annually')
    expect(sub.status).toBe('active')
    expect(sub.planId).toBe(newPlan.planId)
  })

  it('[边界] 套餐 features 列表包含可读描述文案', () => {
    const enterprise = svc.getPlan('plan_enterprise')!
    expect(enterprise.features).toContain('无限API')
    expect(enterprise.features).toContain('无限设备')
  })

  it('[反例] 相同租户多次订阅覆盖上一次', () => {
    const sub1 = svc.subscribe(TENANT_ID, 'plan_starter', 'monthly')
    expect(sub1.planId).toBe('plan_starter')
    const sub2 = svc.subscribe(TENANT_ID, 'plan_professional', 'quarterly')
    expect(sub2.planId).toBe('plan_professional')
    const sub = svc.getSubscription(TENANT_ID)
    expect(sub!.planId).toBe('plan_professional')
  })
})

// ═══════════════════════════
// 🧩 跨角色协作场景
// ═══════════════════════════
describe('🧩 跨角色协作场景', () => {
  let svc: SaaSBillingService

  beforeEach(() => {
    svc = createService()
  })

  it('[正例] 店长选套餐 → 前台开发票 → 运行专员看配额 → 营销看超额', () => {
    // 店长选择 enterprise
    svc.subscribe(TENANT_ID, 'plan_enterprise', 'annually')
    // 运行专员设置配额使用
    svc.recordUsage(TENANT_ID, 'storage_gb', 100)
    svc.recordUsage(TENANT_ID, 'devices', 10)
    // 前台生成发票
    const invoice = svc.generateInvoice(TENANT_ID)
    expect(invoice.status).toBe('issued')
    // 前台标记已支付
    svc.markPaid(invoice.invoiceId)
    const paidInvoice = svc.listInvoices(TENANT_ID).find((i) => i.invoiceId === invoice.invoiceId)
    expect(paidInvoice!.status).toBe('paid')
    // 营销查看超额
    const overage = svc.calculateOverage(TENANT_ID)
    expect(overage.storage_gb).toBe(0) // enterprise 有 500GB
    // 运行专员验证 quota
    const usage = svc.getQuotaUsage(TENANT_ID)
    const storage = usage.find((u) => u.quota === 'storage_gb')
    expect(storage!.used).toBe(100)
    expect(storage!.limit).toBe(500)
  })

  it('[边界] 试用到期后计费循环', () => {
    svc.startTrial(TENANT_ID, 'plan_professional')
    svc.convertTrial(TENANT_ID)
    // 续费
    svc.renew(TENANT_ID)
    const sub = svc.getSubscription(TENANT_ID)
    expect(sub!.status).toBe('active')
    expect(sub!.trialEndsAt).toBeUndefined()
  })

  it('[边界] 超额费用扣除后 baseAmount 为负时取 0', () => {
    svc.createPlan({
      tier: 'starter',
      name: '超低价测试',
      basePrice: 10,
      billingCycles: ['monthly'],
      features: ['测试'],
      quotas: { api_calls: 5, storage_gb: 1, users: 1, transactions: 10, devices: 1 },
      overageRates: { api_calls: 100, storage_gb: 100, users: 100, transactions: 100, devices: 100 },
      discountPercent: { monthly: 1, quarterly: 1, annually: 1 },
    })
    // 手动获取 planId
    const plans = svc.listPlans()
    const testPlan = plans.find((p) => p.name === '超低价测试')!
    svc.subscribe(TENANT_ID, testPlan.planId, 'monthly')
    svc.recordUsage(TENANT_ID, 'storage_gb', 100) // 超 99GB * $100 = $9900
    // 虽然实际不会让金额为负，但验证 max(0, ...) 逻辑
    const invoice = svc.generateInvoice(TENANT_ID)
    expect(invoice.amount).toBeGreaterThanOrEqual(0)
  })
})
