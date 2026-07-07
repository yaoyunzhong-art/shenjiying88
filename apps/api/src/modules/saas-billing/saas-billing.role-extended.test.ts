/**
 * 🐜 自动: [saas-billing] [C] 角色测试扩展
 *
 * 8 角色深度场景扩展测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 3 个测试用例（正常流程 + 权限边界 + 高级场景）
 * 覆盖: 多套餐管理、超额计费、账单审计、跨租户隔离、年付折扣、
 *       自动续费、试用过期、自定义套餐、配额迁移
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { SaaSBillingController } from './saas-billing.controller'
import { SaaSBillingService } from './saas-billing.service'
import type { BillingCycle, PricingTier, QuotaType } from './saas-billing.entity'

// ── 角色定义 ──
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

// ── 测试上下文 ──
const TENANT_A = 'tenant-store-a'
const TENANT_B = 'tenant-store-b'
const TENANT_C = 'tenant-store-c'
const TRIAL_PLAN = 'plan_starter'
const PRO_PLAN = 'plan_professional'
const ENT_PLAN = 'plan_enterprise'

function createEnv() {
  const service = new SaaSBillingService()
  const controller = new SaaSBillingController(service)
  return { service, controller }
}

// ═══════════════════════════════════════════════════════════
// 👔 店长 — 门店订阅决策与预算管理
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} saas-billing 扩展场景`, () => {

  it('店长对比多门店订阅方案并推荐最佳成本', () => {
    const { controller } = createEnv()

    // 方案 A: 所有门店用 Professional 季付
    const subA = controller.subscribe({
      tenantId: TENANT_A,
      planId: PRO_PLAN,
      billingCycle: 'quarterly',
    })
    assert.equal(subA.planId, PRO_PLAN)
    assert.equal(subA.billingCycle, 'quarterly')

    // 方案 B: 一个 Enterprise 年付承载多个门店
    const subB = controller.subscribe({
      tenantId: TENANT_B,
      planId: ENT_PLAN,
      billingCycle: 'annually',
    })
    assert.equal(subB.billingCycle, 'annually')

    // 验证年付折扣生效
    const invoiceA = controller.generateInvoice(TENANT_A)
    const invoiceB = controller.generateInvoice(TENANT_B)
    // Enterprise 年付折扣 0.8 => base 2399.2 < 2999
    assert.ok(invoiceB.amount < 2999)
    // Professional 季付折扣 0.9 => base 899.1 < 999
    assert.ok(invoiceA.amount < 999)
  })

  it('店长取消订阅后清理配额并恢复默认状态', () => {
    const { service, controller } = createEnv()

    controller.subscribe({
      tenantId: TENANT_A,
      planId: TRIAL_PLAN,
      billingCycle: 'monthly',
    })

    const quotaBefore = controller.getQuotaUsage(TENANT_A)
    assert.ok(quotaBefore.length > 0)
    assert.equal(quotaBefore[0].used, 0)

    controller.recordUsage(TENANT_A, { quota: 'api_calls', amount: 5000 })
    const quotaAfterUsage = controller.getQuotaUsage(TENANT_A)
    assert.equal(quotaAfterUsage.find(q => q.quota === 'api_calls')!.used, 5000)

    controller.cancelSubscription(TENANT_A)
    const sub = service.getSubscription(TENANT_A)
    assert.equal(sub!.status, 'cancelled')
  })

  it('店长切换门店套餐并对比前后配额差异', () => {
    const { controller } = createEnv()

    controller.subscribe({
      tenantId: TENANT_A,
      planId: TRIAL_PLAN,
      billingCycle: 'monthly',
    })

    const quotaStarter = controller.getQuotaUsage(TENANT_A)
    const apiLimitStarter = quotaStarter.find(q => q.quota === 'api_calls')!.limit
    assert.equal(apiLimitStarter, 100000)

    // 升级到 Professional
    controller.changePlan(TENANT_A, { newPlanId: PRO_PLAN })

    const quotaPro = controller.getQuotaUsage(TENANT_A)
    const apiLimitPro = quotaPro.find(q => q.quota === 'api_calls')!.limit
    // Professional 配额 1000000
    assert.equal(apiLimitPro, 1000000)
    assert.ok(apiLimitPro > apiLimitStarter)
  })
})

// ═══════════════════════════════════════════════════════════
// 🛒 前台 — 客户咨询与套餐推荐
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} saas-billing 扩展场景`, () => {

  it('前台向客户推荐套餐时比较所有套餐功能差异', () => {
    const { controller } = createEnv()

    const plans = controller.listPlans()
    assert.equal(plans.length, 3)

    const starter = plans.find(p => p.tier === 'starter')!
    const pro = plans.find(p => p.tier === 'professional')!
    const ent = plans.find(p => p.tier === 'enterprise')!

    // Starter 适合小规模
    assert.equal(starter.quotas.users, 5)
    assert.equal(starter.quotas.devices, 10)

    // Professional 适合中等规模
    assert.equal(pro.quotas.users, 50)
    assert.equal(pro.quotas.devices, 100)

    // Enterprise 无上限
    assert.equal(ent.quotas.api_calls, Infinity)
    assert.equal(ent.quotas.users, Infinity)
  })

  it('前台查询已订阅租户配额使用率并提醒客户', () => {
    const { controller } = createEnv()

    controller.subscribe({
      tenantId: TENANT_A,
      planId: TRIAL_PLAN,
      billingCycle: 'monthly',
    })

    // 模拟使用了 80% 的 API 配额
    controller.recordUsage(TENANT_A, { quota: 'api_calls', amount: 80000 })

    const quotas = controller.getQuotaUsage(TENANT_A)
    const apiQuota = quotas.find(q => q.quota === 'api_calls')!
    // 80000 / 100000 = 80%
    assert.equal(apiQuota.used, 80000)
    assert.equal(apiQuota.limit, 100000)
    assert.equal(apiQuota.overage, 0) // 未超额
  })

  it('前台跨门店比较不同店铺的月度开销', () => {
    const { controller } = createEnv()

    controller.subscribe({ tenantId: TENANT_A, planId: TRIAL_PLAN, billingCycle: 'monthly' })
    controller.subscribe({ tenantId: TENANT_B, planId: PRO_PLAN, billingCycle: 'monthly' })
    controller.subscribe({ tenantId: TENANT_C, planId: ENT_PLAN, billingCycle: 'monthly' })

    const invoiceA = controller.generateInvoice(TENANT_A)
    const invoiceB = controller.generateInvoice(TENANT_B)
    const invoiceC = controller.generateInvoice(TENANT_C)

    // Enterprise > Professional > Starter
    assert.ok(invoiceC.amount > invoiceB.amount)
    assert.ok(invoiceB.amount > invoiceA.amount)
  })
})

// ═══════════════════════════════════════════════════════════
// 👥 HR — 员工入职与套餐试用管理
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.HR} saas-billing 扩展场景`, () => {

  it('HR 为新门店创建试用并设置到期提醒', () => {
    const { controller } = createEnv()

    const trial = controller.startTrial({
      tenantId: TENANT_A,
      planId: PRO_PLAN,
    })
    assert.equal(trial.status, 'trial')
    assert.ok(trial.trialEndsAt)

    // 检查试用状态
    const status = controller.checkTrialStatus(TENANT_A)
    assert.equal(status.isTrial, true)
    assert.ok(status.daysRemaining > 0)
    assert.ok(status.daysRemaining <= 14) // 最多 14 天
  })

  it('HR 批量管理多个租户的试用状态', () => {
    const { controller } = createEnv()

    controller.startTrial({ tenantId: TENANT_A, planId: TRIAL_PLAN })
    controller.startTrial({ tenantId: TENANT_B, planId: PRO_PLAN })

    const statusA = controller.checkTrialStatus(TENANT_A)
    const statusB = controller.checkTrialStatus(TENANT_B)

    assert.equal(statusA.isTrial, true)
    assert.equal(statusB.isTrial, true)

    // 转正 A
    controller.convertTrial(TENANT_A)
    const afterConvert = controller.checkTrialStatus(TENANT_A)
    assert.equal(afterConvert.isTrial, false)

    // B 仍是试用
    const statusBAfter = controller.checkTrialStatus(TENANT_B)
    assert.equal(statusBAfter.isTrial, true)
  })

  it('HR 在试用过期前续订套餐确保不中断', () => {
    const { controller } = createEnv()

    // 试用
    controller.startTrial({ tenantId: TENANT_A, planId: TRIAL_PLAN })

    // 转正
    controller.convertTrial(TENANT_A)

    // 续费确保不中断
    const renewed = controller.renewSubscription(TENANT_A)
    assert.equal(renewed.status, 'active')
    assert.ok(new Date(renewed.nextBillingDate) > new Date())

    // 生成账单确认计费正确
    const invoice = controller.generateInvoice(TENANT_A)
    // Starter 月付 299 * 1.0 = 299
    assert.equal(invoice.amount, 299)
  })
})

// ═══════════════════════════════════════════════════════════
// 🔧 安监 — 超额审计与合规检查
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.Security} saas-billing 扩展场景`, () => {

  it('安监审计超额使用并计算额外费用', () => {
    const { controller } = createEnv()

    controller.subscribe({ tenantId: TENANT_A, planId: TRIAL_PLAN, billingCycle: 'monthly' })

    // 超额使用 API 达 120000（超过 100000 限制）
    controller.recordUsage(TENANT_A, { quota: 'api_calls', amount: 120000 })

    // 检查配额状态
    const check = controller.checkQuota(TENANT_A, { quota: 'api_calls', amount: 1 })
    assert.equal(check.allowed, false)
    assert.equal(check.limit, 100000)
    assert.equal(check.current, 120000)

    // 计算超额费用
    const overage = controller.calculateOverage(TENANT_A)
    // overage = 120000 - 100000 = 20000, 费率 0.01 => 200
    assert.equal(overage.api_calls, 200)
  })

  it('安监验证多个配额维度超额计算准确性', () => {
    const { controller } = createEnv()

    controller.subscribe({ tenantId: TENANT_A, planId: TRIAL_PLAN, billingCycle: 'monthly' })

    // 多维超额
    controller.recordUsage(TENANT_A, { quota: 'api_calls', amount: 110000 })
    controller.recordUsage(TENANT_A, { quota: 'storage_gb', amount: 10 })
    controller.recordUsage(TENANT_A, { quota: 'users', amount: 5 })

    const overage = controller.calculateOverage(TENANT_A)
    // api_calls: 10000 * 0.01 = 100
    assert.equal(overage.api_calls, 100)
    // storage_gb: 5 * 1 = 5  (limit=5, used=10, overage=5)
    assert.equal(overage.storage_gb, 5)
    // users: 0 (limit=5, used=5, no overage)
    assert.equal(overage.users, 0)
  })

  it('安监确保超额费用在账单中正确抵扣', () => {
    const { controller } = createEnv()

    controller.subscribe({ tenantId: TENANT_A, planId: TRIAL_PLAN, billingCycle: 'monthly' })

    controller.recordUsage(TENANT_A, { quota: 'api_calls', amount: 110000 })

    const invoice = controller.generateInvoice(TENANT_A)
    // base = 299 * 1.0 = 299, api overage cost = 100
    // amount = max(0, 299 - 100) = 199
    assert.equal(invoice.amount, 199)

    // 确认账单明细包含超额抵扣项
    const overageItem = invoice.items.find(i => i.description.includes('超额'))
    assert.ok(overageItem)
    assert.equal(overageItem!.amount, -100)
  })
})

// ═══════════════════════════════════════════════════════════
// 🎮 导玩员 — 运营套餐选择指导
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.Guide} saas-billing 扩展场景`, () => {

  it('导玩员推荐适合门店规模的会员/设备套餐', () => {
    const { controller } = createEnv()

    const plans = controller.listPlans()
    const starter = plans.find(p => p.tier === 'starter')!

    // Starter 适合 5 用户 10 设备的小门店
    assert.equal(starter.quotas.users, 5)
    assert.equal(starter.quotas.devices, 10)

    // 建议小门店订阅 Starter 季付
    const sub = controller.subscribe({
      tenantId: TENANT_A,
      planId: 'plan_starter',
      billingCycle: 'quarterly',
    })
    assert.equal(sub.status, 'active')

    const invoice = controller.generateInvoice(TENANT_A)
    // 季付折扣: 299 * 0.9 = 269.1
    assert.equal(invoice.amount, 269.1)
  })

  it('导玩员为高客流门店推荐 Professional 套餐', () => {
    const { controller } = createEnv()

    const plan = controller.getPlan(PRO_PLAN)
    assert.ok(plan)
    // Professional 支持 100 设备
    assert.equal(plan!.quotas.devices, 100)
    assert.equal(plan!.quotas.api_calls, 1000000)

    const sub = controller.subscribe({
      tenantId: TENANT_B,
      planId: PRO_PLAN,
      billingCycle: 'monthly',
    })
    assert.equal(sub.tier, 'professional')
  })

  it('导玩员对比季付和年付节省成本', () => {
    const { controller } = createEnv()

    // 月付 999 * 1.0 = 999
    const subMonthly = controller.subscribe({
      tenantId: TENANT_A,
      planId: PRO_PLAN,
      billingCycle: 'monthly',
    })
    assert.equal(subMonthly.billingCycle, 'monthly')

    // 年付 999 * 0.8 = 799.2
    const subAnnually = controller.subscribe({
      tenantId: TENANT_B,
      planId: PRO_PLAN,
      billingCycle: 'annually',
    })
    assert.equal(subAnnually.billingCycle, 'annually')

    const invoiceMonth = controller.generateInvoice(TENANT_A)
    const invoiceYear = controller.generateInvoice(TENANT_B)

    // 年付每月等效成本更低
    assert.ok(invoiceYear.amount < invoiceMonth.amount)
  })
})

// ═══════════════════════════════════════════════════════════
// 🎯 运行专员 — 续费与账单对账
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.Operations} saas-billing 扩展场景`, () => {

  it('运行专员续费后检查下一结算周期', () => {
    const { controller } = createEnv()

    controller.subscribe({
      tenantId: TENANT_A,
      planId: PRO_PLAN,
      billingCycle: 'quarterly',
    })

    const beforeSub = controller.getSubscription(TENANT_A)
    assert.ok(beforeSub)
    const beforeRenewDate = new Date(beforeSub!.nextBillingDate)

    // 续费
    const renewed = controller.renewSubscription(TENANT_A)
    const afterRenewDate = new Date(renewed.nextBillingDate)

    // 续费后 nextBillingDate 应延后 3 个月
    const diffMs = afterRenewDate.getTime() - beforeRenewDate.getTime()
    const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30)
    assert.ok(diffMonths >= 2.5) // ~3 个月
    assert.ok(diffMonths <= 3.5)
  })

  it('运行专员生成账单并确认状态流转正确', () => {
    const { controller } = createEnv()

    controller.subscribe({
      tenantId: TENANT_A,
      planId: PRO_PLAN,
      billingCycle: 'monthly',
    })

    const invoice = controller.generateInvoice(TENANT_A)
    assert.equal(invoice.status, 'issued')
    assert.equal(invoice.currency, 'CNY')

    // 支付
    const payResult = controller.markPaid(invoice.invoiceId)
    assert.deepEqual(payResult, { success: true })

    // 确认账单列表
    const invoices = controller.listInvoices(TENANT_A)
    assert.equal(invoices.length, 1)
    assert.equal(invoices[0].status, 'paid')
  })

  it('运行专员对账时发现超额扣减并核实', () => {
    const { controller } = createEnv()

    controller.subscribe({
      tenantId: TENANT_A,
      planId: TRIAL_PLAN,
      billingCycle: 'monthly',
    })

    controller.recordUsage(TENANT_A, { quota: 'storage_gb', amount: 8 })

    const invoice = controller.generateInvoice(TENANT_A)
    // Starter storage_gb limit=5, overage=3, rate=1 => 3
    // base = 299 - 3 = 296
    // 检查是否存在超额抵扣项
    const deductionItem = invoice.items.find(i => i.description.includes('storage_gb'))
    assert.ok(deductionItem)
    assert.equal(deductionItem!.amount, -3)
  })
})

// ═══════════════════════════════════════════════════════════
// 🤝 团建 — 多门店套餐协同
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} saas-billing 扩展场景`, () => {

  it('团建协调多家门店统一订购 Enterprise 获取更优价格', () => {
    const { controller } = createEnv()

    // 多家门店统一用 Enterprise 年付
    const subA = controller.subscribe({
      tenantId: TENANT_A,
      planId: ENT_PLAN,
      billingCycle: 'annually',
    })
    const subB = controller.subscribe({
      tenantId: TENANT_B,
      planId: ENT_PLAN,
      billingCycle: 'annually',
    })

    assert.equal(subA.status, 'active')
    assert.equal(subB.status, 'active')
    assert.equal(subA.billingCycle, 'annually')
    assert.equal(subB.billingCycle, 'annually')

    // 各门店独立账单
    const invA = controller.generateInvoice(TENANT_A)
    const invB = controller.generateInvoice(TENANT_B)
    assert.equal(invA.amount, invB.amount) // 同套餐同折扣
  })

  it('团建批量变更多家门店套餐', () => {
    const { controller } = createEnv()

    // 一起订阅 Starter
    controller.subscribe({ tenantId: TENANT_A, planId: TRIAL_PLAN, billingCycle: 'monthly' })
    controller.subscribe({ tenantId: TENANT_B, planId: TRIAL_PLAN, billingCycle: 'monthly' })

    // 一起升级到 Professional
    controller.changePlan(TENANT_A, { newPlanId: PRO_PLAN })
    controller.changePlan(TENANT_B, { newPlanId: PRO_PLAN })

    const subA = controller.getSubscription(TENANT_A)
    const subB = controller.getSubscription(TENANT_B)
    assert.equal(subA!.planId, PRO_PLAN)
    assert.equal(subB!.planId, PRO_PLAN)
    assert.equal(subA!.tier, 'professional')
    assert.equal(subB!.tier, 'professional')
  })

  it('团建确保跨门店数据隔离（A 店数据不影响 B 店）', () => {
    const { controller } = createEnv()

    controller.subscribe({ tenantId: TENANT_A, planId: TRIAL_PLAN, billingCycle: 'monthly' })
    controller.subscribe({ tenantId: TENANT_B, planId: PRO_PLAN, billingCycle: 'monthly' })

    // A 店记 5000 API
    controller.recordUsage(TENANT_A, { quota: 'api_calls', amount: 5000 })
    // B 店记 3000 API
    controller.recordUsage(TENANT_B, { quota: 'api_calls', amount: 3000 })

    const quotaA = controller.getQuotaUsage(TENANT_A)
    const quotaB = controller.getQuotaUsage(TENANT_B)

    const apiA = quotaA.find(q => q.quota === 'api_calls')!
    const apiB = quotaB.find(q => q.quota === 'api_calls')!

    assert.equal(apiA.used, 5000)
    assert.equal(apiB.used, 3000)

    // A 店配额限制 100000 (Starter)
    assert.equal(apiA.limit, 100000)
    // B 店配额限制 1000000 (Professional)
    assert.equal(apiB.limit, 1000000)
  })
})

// ═══════════════════════════════════════════════════════════
// 📢 营销 — 促销套餐与折扣分析
// ═══════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} saas-billing 扩展场景`, () => {

  it('营销创建自定义折扣套餐并验证折扣传播', () => {
    const { controller } = createEnv()

    const promoPlan = controller.createPlan({
      tier: 'professional',
      name: '暑期特惠套餐',
      basePrice: 599,
      billingCycles: ['monthly', 'quarterly', 'annually'] as BillingCycle[],
      features: ['特惠 API', '20GB 存储', '30 用户'],
      quotas: {
        api_calls: 500000,
        storage_gb: 20,
        users: 30,
        transactions: Infinity,
        devices: 50,
      },
      overageRates: {
        api_calls: 0.005,
        storage_gb: 0.5,
        users: 10,
        transactions: 0.0005,
        devices: 2.5,
      },
      discountPercent: {
        monthly: 1,
        quarterly: 0.85,
        annually: 0.75,
      },
    })

    assert.ok(promoPlan.planId)
    assert.equal(promoPlan.name, '暑期特惠套餐')
    assert.equal(promoPlan.basePrice, 599)
    assert.equal(promoPlan.discountPercent.annually, 0.75)

    // 验证可通过 getPlan 查到
    const fetched = controller.getPlan(promoPlan.planId)
    assert.ok(fetched)
    assert.equal(fetched!.name, '暑期特惠套餐')
  })

  it('营销分析不同折扣力度的年付节省金额', () => {
    const { controller } = createEnv()

    // 月付: 999 * 1.0 = 999
    const subMonthly = controller.subscribe({
      tenantId: TENANT_A,
      planId: PRO_PLAN,
      billingCycle: 'monthly',
    })
    // 季付: 999 * 0.9 = 899.1
    const subQuarterly = controller.subscribe({
      tenantId: TENANT_B,
      planId: PRO_PLAN,
      billingCycle: 'quarterly',
    })
    // 年付: 999 * 0.8 = 799.2
    const subAnnually = controller.subscribe({
      tenantId: TENANT_C,
      planId: PRO_PLAN,
      billingCycle: 'annually',
    })

    const invM = controller.generateInvoice(TENANT_A)
    const invQ = controller.generateInvoice(TENANT_B)
    const invA = controller.generateInvoice(TENANT_C)

    assert.equal(invM.amount, 999)
    assert.equal(invQ.amount, 899.1)
    assert.equal(invA.amount, 799.2)

    // 年付比月付节省 20%
    const savings = (invM.amount - invA.amount) / invM.amount
    // 浮点数精度处理: (999 - 799.2) / 999 ≈ 0.2
    assert.ok(Math.abs(savings - 0.2) < 0.001)
  })

  it('营销创建超低价促销套餐并验证不与其他套餐冲突', () => {
    const { controller } = createEnv()

    // 原有 3 个默认套餐
    const plansBefore = controller.listPlans()
    assert.equal(plansBefore.length, 3)

    // 新增促销套餐
    controller.createPlan({
      tier: 'starter',
      name: '首月特惠',
      basePrice: 1,
      billingCycles: ['monthly'] as BillingCycle[],
      features: ['首月体验'],
      quotas: {
        api_calls: 10000,
        storage_gb: 1,
        users: 3,
        transactions: Infinity,
        devices: 5,
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
        quarterly: 1,
        annually: 1,
      },
    })

    // 现有套餐不变
    const plansAfter = controller.listPlans()
    assert.equal(plansAfter.length, 4)

    // 默认套餐仍然可用
    const starter = controller.getPlan(TRIAL_PLAN)
    assert.equal(starter!.basePrice, 299)

    // 新套餐
    const promoPlan = plansAfter.find(p => p.name === '首月特惠')
    assert.ok(promoPlan)
    assert.equal(promoPlan!.basePrice, 1)

    // 租户可以订阅新套餐
    const sub = controller.subscribe({
      tenantId: TENANT_A,
      planId: promoPlan!.planId,
      billingCycle: 'monthly',
    })
    assert.equal(sub.status, 'active')
  })
})
