import { nanoid } from 'nanoid'
import type {
  BillingCycle,
  PricingTier,
  QuotaType,
  PricingPlan,
  TenantSubscription,
  QuotaUsage,
  Invoice,
} from './saas-billing.entity'

const UNLIMITED = Infinity

const DEFAULT_OVERAGE_RATES: Record<QuotaType, number> = {
  api_calls: 0.01,
  storage_gb: 1,
  users: 20,
  transactions: 0.001,
  devices: 5,
}

const DEFAULT_DISCOUNTS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 0.9,
  annually: 0.8,
}

export class SaaSBillingService {
  private readonly plans: Map<string, PricingPlan> = new Map()
  private readonly subscriptions: Map<string, TenantSubscription> = new Map()
  private readonly quotaUsage: Map<string, Map<QuotaType, QuotaUsage>> = new Map()
  private readonly invoices: Map<string, Invoice> = new Map()

  constructor() {
    this.initDefaultPlans()
  }

  private initDefaultPlans() {
    const starter: PricingPlan = {
      planId: 'plan_starter',
      tier: 'starter',
      name: 'Starter',
      basePrice: 299,
      billingCycles: ['monthly', 'quarterly', 'annually'],
      features: ['基础API', '5GB存储', '5个用户', '10个设备'],
      quotas: {
        api_calls: 100000,
        storage_gb: 5,
        users: 5,
        transactions: UNLIMITED,
        devices: 10,
      },
      overageRates: { ...DEFAULT_OVERAGE_RATES },
      discountPercent: { ...DEFAULT_DISCOUNTS },
    }

    const professional: PricingPlan = {
      planId: 'plan_professional',
      tier: 'professional',
      name: 'Professional',
      basePrice: 999,
      billingCycles: ['monthly', 'quarterly', 'annually'],
      features: ['高级API', '50GB存储', '50个用户', '100个设备'],
      quotas: {
        api_calls: 1000000,
        storage_gb: 50,
        users: 50,
        transactions: UNLIMITED,
        devices: 100,
      },
      overageRates: { ...DEFAULT_OVERAGE_RATES },
      discountPercent: { ...DEFAULT_DISCOUNTS },
    }

    const enterprise: PricingPlan = {
      planId: 'plan_enterprise',
      tier: 'enterprise',
      name: 'Enterprise',
      basePrice: 2999,
      billingCycles: ['monthly', 'quarterly', 'annually'],
      features: ['无限API', '500GB存储', '无限用户', '无限设备'],
      quotas: {
        api_calls: UNLIMITED,
        storage_gb: 500,
        users: UNLIMITED,
        transactions: UNLIMITED,
        devices: UNLIMITED,
      },
      overageRates: { ...DEFAULT_OVERAGE_RATES },
      discountPercent: { ...DEFAULT_DISCOUNTS },
    }

    this.plans.set(starter.planId, starter)
    this.plans.set(professional.planId, professional)
    this.plans.set(enterprise.planId, enterprise)
  }

  // ── 套餐管理 ──────────────────────────────────────────────────────

  createPlan(plan: Omit<PricingPlan, 'planId'>): PricingPlan {
    const planId = `plan_${nanoid(8)}`
    const newPlan: PricingPlan = { ...plan, planId }
    this.plans.set(planId, newPlan)
    return newPlan
  }

  getPlan(planId: string): PricingPlan | null {
    return this.plans.get(planId) ?? null
  }

  listPlans(): PricingPlan[] {
    return Array.from(this.plans.values())
  }

  // ── 订阅管理 ──────────────────────────────────────────────────────

  subscribe(tenantId: string, planId: string, billingCycle: BillingCycle): TenantSubscription {
    const plan = this.plans.get(planId)
    if (!plan) {
      throw new Error(`Plan ${planId} not found`)
    }

    const now = new Date()
    const months = billingCycle === 'monthly' ? 1 : billingCycle === 'quarterly' ? 3 : 12
    const nextBillingDate = new Date(now)
    nextBillingDate.setMonth(nextBillingDate.getMonth() + months)

    const subscription: TenantSubscription = {
      tenantId,
      planId,
      tier: plan.tier,
      status: 'active',
      startedAt: now,
      billingCycle,
      nextBillingDate,
      autoRenew: true,
    }

    this.subscriptions.set(tenantId, subscription)
    this.initQuotaUsage(tenantId, plan)
    return subscription
  }

  changePlan(tenantId: string, newPlanId: string): TenantSubscription {
    const subscription = this.subscriptions.get(tenantId)
    if (!subscription) {
      throw new Error(`Subscription for tenant ${tenantId} not found`)
    }

    const newPlan = this.plans.get(newPlanId)
    if (!newPlan) {
      throw new Error(`Plan ${newPlanId} not found`)
    }

    subscription.planId = newPlanId
    subscription.tier = newPlan.tier

    this.initQuotaUsage(tenantId, newPlan)
    return subscription
  }

  cancelSubscription(tenantId: string): void {
    const subscription = this.subscriptions.get(tenantId)
    if (!subscription) {
      throw new Error(`Subscription for tenant ${tenantId} not found`)
    }
    subscription.status = 'cancelled'
  }

  renew(tenantId: string): TenantSubscription {
    const subscription = this.subscriptions.get(tenantId)
    if (!subscription) {
      throw new Error(`Subscription for tenant ${tenantId} not found`)
    }

    const months =
      subscription.billingCycle === 'monthly'
        ? 1
        : subscription.billingCycle === 'quarterly'
          ? 3
          : 12

    subscription.nextBillingDate = new Date(subscription.nextBillingDate)
    subscription.nextBillingDate.setMonth(subscription.nextBillingDate.getMonth() + months)

    return subscription
  }

  getSubscription(tenantId: string): TenantSubscription | null {
    return this.subscriptions.get(tenantId) ?? null
  }

  // ── 配额监控 ──────────────────────────────────────────────────────

  private initQuotaUsage(tenantId: string, plan: PricingPlan): void {
    const usageMap = new Map<QuotaType, QuotaUsage>()
    const now = new Date()
    const resetAt = new Date(now)
    resetAt.setMonth(resetAt.getMonth() + 1)

    for (const quota of Object.keys(plan.quotas) as QuotaType[]) {
      usageMap.set(quota, {
        tenantId,
        quota,
        used: 0,
        limit: plan.quotas[quota],
        resetAt,
        overage: 0,
      })
    }

    this.quotaUsage.set(tenantId, usageMap)
  }

  recordUsage(tenantId: string, quota: QuotaType, amount: number): void {
    const usageMap = this.quotaUsage.get(tenantId)
    if (!usageMap) {
      throw new Error(`Quota usage for tenant ${tenantId} not found`)
    }

    const usage = usageMap.get(quota)
    if (!usage) {
      throw new Error(`Quota ${quota} not found for tenant ${tenantId}`)
    }

    usage.used += amount
    if (usage.limit !== UNLIMITED && usage.used > usage.limit) {
      usage.overage = usage.used - usage.limit
    } else {
      usage.overage = 0
    }
  }

  getQuotaUsage(tenantId: string): QuotaUsage[] {
    const usageMap = this.quotaUsage.get(tenantId)
    if (!usageMap) {
      return []
    }
    return Array.from(usageMap.values())
  }

  checkQuota(
    tenantId: string,
    quota: QuotaType,
    amount: number,
  ): { allowed: boolean; current: number; limit: number; overage: number } {
    const usageMap = this.quotaUsage.get(tenantId)
    if (!usageMap) {
      throw new Error(`Quota usage for tenant ${tenantId} not found`)
    }

    const usage = usageMap.get(quota)
    if (!usage) {
      throw new Error(`Quota ${quota} not found for tenant ${tenantId}`)
    }

    const allowed = usage.limit === UNLIMITED || usage.used + amount <= usage.limit
    return {
      allowed,
      current: usage.used,
      limit: usage.limit,
      overage: usage.overage,
    }
  }

  calculateOverage(tenantId: string): Record<QuotaType, number> {
    const subscription = this.subscriptions.get(tenantId)
    if (!subscription) {
      throw new Error(`Subscription for tenant ${tenantId} not found`)
    }

    const plan = this.plans.get(subscription.planId)
    if (!plan) {
      throw new Error(`Plan ${subscription.planId} not found`)
    }

    const usageMap = this.quotaUsage.get(tenantId)
    if (!usageMap) {
      return { api_calls: 0, storage_gb: 0, users: 0, transactions: 0, devices: 0 }
    }

    const overage: Record<QuotaType, number> = {
      api_calls: 0,
      storage_gb: 0,
      users: 0,
      transactions: 0,
      devices: 0,
    }

    for (const quota of Object.keys(plan.quotas) as QuotaType[]) {
      const usage = usageMap.get(quota)
      if (usage && usage.overage > 0) {
        overage[quota] = usage.overage * plan.overageRates[quota]
      }
    }

    return overage
  }

  // ── 计费与账单 ────────────────────────────────────────────────────

  generateInvoice(tenantId: string): Invoice {
    const subscription = this.subscriptions.get(tenantId)
    if (!subscription) {
      throw new Error(`Subscription for tenant ${tenantId} not found`)
    }

    const plan = this.plans.get(subscription.planId)
    if (!plan) {
      throw new Error(`Plan ${subscription.planId} not found`)
    }

    const now = new Date()
    const dueAt = new Date(now)
    dueAt.setDate(dueAt.getDate() + 30)

    const discount = plan.discountPercent[subscription.billingCycle]
    const baseAmount = plan.basePrice * discount

    const overage = this.calculateOverage(tenantId)
    const totalOverage = Object.values(overage).reduce((sum, val) => sum + val, 0)

    const amount = Math.max(0, baseAmount - totalOverage)

    const items: { description: string; amount: number }[] = [
      { description: `${plan.name} 套餐 (${subscription.billingCycle})`, amount: baseAmount },
    ]

    for (const [quota, cost] of Object.entries(overage)) {
      if (cost > 0) {
        items.push({ description: `超额使用 - ${quota}`, amount: -cost })
      }
    }

    const invoice: Invoice = {
      invoiceId: `inv_${nanoid(12)}`,
      tenantId,
      amount,
      currency: 'CNY',
      status: 'issued',
      items,
      issuedAt: now,
      dueAt,
    }

    this.invoices.set(invoice.invoiceId, invoice)
    return invoice
  }

  markPaid(invoiceId: string): void {
    const invoice = this.invoices.get(invoiceId)
    if (!invoice) {
      throw new Error(`Invoice ${invoiceId} not found`)
    }
    invoice.status = 'paid'
    invoice.paidAt = new Date()
  }

  listInvoices(tenantId: string): Invoice[] {
    return Array.from(this.invoices.values())
      .filter((inv) => inv.tenantId === tenantId)
      .sort((a, b) => b.issuedAt.getTime() - a.issuedAt.getTime())
  }

  // ── 试用管理 ──────────────────────────────────────────────────────

  startTrial(tenantId: string, planId: string): TenantSubscription {
    const plan = this.plans.get(planId)
    if (!plan) {
      throw new Error(`Plan ${planId} not found`)
    }

    const now = new Date()
    const trialEndsAt = new Date(now)
    trialEndsAt.setDate(trialEndsAt.getDate() + 14)

    const subscription: TenantSubscription = {
      tenantId,
      planId,
      tier: plan.tier,
      status: 'trial',
      startedAt: now,
      trialEndsAt,
      billingCycle: 'monthly',
      nextBillingDate: trialEndsAt,
      autoRenew: true,
    }

    this.subscriptions.set(tenantId, subscription)
    this.initQuotaUsage(tenantId, plan)
    return subscription
  }

  convertTrial(tenantId: string): TenantSubscription {
    const subscription = this.subscriptions.get(tenantId)
    if (!subscription) {
      throw new Error(`Subscription for tenant ${tenantId} not found`)
    }

    if (subscription.status !== 'trial') {
      throw new Error('Only trial subscriptions can be converted')
    }

    subscription.status = 'active'
    subscription.startedAt = new Date()
    subscription.trialEndsAt = undefined
    return subscription
  }

  checkTrialStatus(
    tenantId: string,
  ): { isTrial: boolean; daysRemaining: number; expiresAt: Date } {
    const subscription = this.subscriptions.get(tenantId)
    if (!subscription) {
      return { isTrial: false, daysRemaining: 0, expiresAt: new Date() }
    }

    if (subscription.status !== 'trial' || !subscription.trialEndsAt) {
      return { isTrial: false, daysRemaining: 0, expiresAt: new Date() }
    }

    const now = new Date()
    const diff = subscription.trialEndsAt.getTime() - now.getTime()
    const daysRemaining = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))

    return {
      isTrial: true,
      daysRemaining,
      expiresAt: subscription.trialEndsAt,
    }
  }
}
