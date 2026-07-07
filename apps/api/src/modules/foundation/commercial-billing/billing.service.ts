import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  type Bill,
  type BillLine,
  type BillingMeter,
  type BillingPeriod,
  type BillingService,
  type BillingWallDecision,
  type PricingEngine,
  type PricingPlan,
  type PricingQuery,
  type PricingResult,
  type UsageAggregate,
  type UsageEvent,
  type Wallet
} from './billing.port'

/**
 * InMemoryBillingMeter · 内存计量器 (P3-4.2)
 *
 * 存储: Map<`${tenantId}:${metric}:${period}`, aggregate>
 * 周期: YYYY-MM (基于本地时区)
 */
@Injectable()
export class InMemoryBillingMeter implements BillingMeter {
  private readonly logger = new Logger(InMemoryBillingMeter.name)
  private readonly aggregates = new Map<string, UsageAggregate>()
  /** 原始事件 (用于回放/审计, 可选) */
  private readonly events = new Map<string, UsageEvent[]>()

  currentPeriod(now: number = Date.now()): BillingPeriod {
    const d = new Date(now)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}`
  }

  private key(tenantId: string, metric: string, period: BillingPeriod): string {
    return `${tenantId}::${metric}::${period}`
  }

  record(event: UsageEvent): void {
    const period = this.currentPeriod(event.at)
    const k = this.key(event.tenantId, event.metric, period)
    const existing = this.aggregates.get(k)
    if (existing) {
      existing.totalQuantity += event.quantity
      existing.eventCount += 1
      if (event.at < existing.firstAt) existing.firstAt = event.at
      if (event.at > existing.lastAt) existing.lastAt = event.at
    } else {
      this.aggregates.set(k, {
        tenantId: event.tenantId,
        metric: event.metric,
        period,
        totalQuantity: event.quantity,
        eventCount: 1,
        firstAt: event.at,
        lastAt: event.at
      })
    }
    // 原始事件也存
    const ek = `${event.tenantId}::${period}`
    let arr = this.events.get(ek)
    if (!arr) {
      arr = []
      this.events.set(ek, arr)
    }
    arr.push(event)
  }

  recordBatch(events: UsageEvent[]): void {
    for (const e of events) this.record(e)
  }

  getUsage(tenantId: string, metric: string, period: BillingPeriod): UsageAggregate {
    return (
      this.aggregates.get(this.key(tenantId, metric, period)) ?? {
        tenantId,
        metric,
        period,
        totalQuantity: 0,
        eventCount: 0,
        firstAt: 0,
        lastAt: 0
      }
    )
  }

  getAllUsage(tenantId: string, period: BillingPeriod): UsageAggregate[] {
    const result: UsageAggregate[] = []
    for (const [k, agg] of this.aggregates) {
      if (k.startsWith(`${tenantId}::`) && k.endsWith(`::${period}`)) {
        result.push(agg)
      }
    }
    return result
  }

  reset(tenantId: string, period?: BillingPeriod): void {
    if (period) {
      for (const k of Array.from(this.aggregates.keys())) {
        if (k.startsWith(`${tenantId}::`) && k.endsWith(`::${period}`)) this.aggregates.delete(k)
      }
      this.events.delete(`${tenantId}::${period}`)
    } else {
      for (const k of Array.from(this.aggregates.keys())) {
        if (k.startsWith(`${tenantId}::`)) this.aggregates.delete(k)
      }
      for (const k of Array.from(this.events.keys())) {
        if (k.startsWith(`${tenantId}::`)) this.events.delete(k)
      }
    }
  }

  /** 内部辅助: 列举本周期所有事件 (供出账) */
  _getEvents(tenantId: string, period: BillingPeriod): UsageEvent[] {
    return [...(this.events.get(`${tenantId}::${period}`) ?? [])]
  }
}

/**
 * DefaultPricingEngine · 计价引擎 (P3-4.2)
 *
 * 模式:
 *   - FREE: amount = 0
 *   - FLAT: amount = plan.flatAmount
 *   - PER_UNIT: amount = totalQuantity * unitPrice
 *   - TIERED: 按 tier 区间分段计算, 含 includedQuota
 */
@Injectable()
export class DefaultPricingEngine implements PricingEngine {
  private readonly logger = new Logger(DefaultPricingEngine.name)

  calculate(query: PricingQuery): PricingResult {
    const { plan, currentUsage, delta, metric } = query
    const totalQuantity = currentUsage + delta
    switch (plan.type) {
      case 'FREE':
        return { amount: 0, breakdown: 'FREE plan', currency: plan.currency }
      case 'FLAT':
        // FLAT 是固定月费, 不在 charge 时扣, 月底出账统一扣
        return {
          amount: 0,
          breakdown: `FLAT ${plan.flatAmount ?? 0} ${plan.currency} (deferred to settle)`,
          currency: plan.currency
        }
      case 'PER_UNIT': {
        const tier = plan.tiers[0]
        if (!tier) return { amount: 0, breakdown: 'no tier', currency: plan.currency }
        const quota = plan.includedQuota ?? 0
        const chargeable = Math.max(0, totalQuantity - quota)
        const amount = chargeable * tier.unitPrice
        return {
          amount,
          tierIndex: 0,
          breakdown: `PER_UNIT ${chargeable} × ${tier.unitPrice} (quota ${quota}) [${metric}]`,
          currency: plan.currency
        }
      }
      case 'TIERED': {
        // 段内计费: [currentUsage, totalQuantity] 跨越的 tier
        // included 视为"已经免费用完的额度", startChargeable 跳过 included
        const included = plan.includedQuota ?? 0
        if (totalQuantity <= included) {
          return {
            amount: 0,
            breakdown: `TIERED within quota ${totalQuantity}/${included} [${metric}]`,
            currency: plan.currency
          }
        }
        const startChargeable = Math.max(currentUsage, included)
        const endChargeable = totalQuantity
        let amount = 0
        const parts: string[] = []
        let hitTier = -1
        let cursor = startChargeable
        for (let i = 0; i < plan.tiers.length; i++) {
          const tier = plan.tiers[i]
          if (cursor >= tier.upTo) continue
          if (endChargeable <= cursor) break
          const to = Math.min(endChargeable, tier.upTo)
          const qty = to - cursor
          if (qty <= 0) continue
          const tierAmount = qty * tier.unitPrice
          amount += tierAmount
          parts.push(`${qty}×${tier.unitPrice}=${tierAmount.toFixed(2)}`)
          hitTier = i
          cursor = to
        }
        return {
          amount,
          tierIndex: hitTier,
          breakdown: `TIERED ${parts.join(' + ')} (quota ${included}) [${metric}]`,
          currency: plan.currency
        }
      }
      default:
        return { amount: 0, breakdown: 'unknown plan type', currency: plan.currency }
    }
  }
}

/**
 * BillingServiceImpl · 计费 + 钱包 + 计费墙 (P3-4.2)
 *
 * 职责:
 *   1. 维护 tenant → 套餐映射
 *   2. 维护 tenant → 钱包
 *   3. 出账 (settle)
 *   4. 计费墙 (check / charge)
 *
 * 计费墙规则:
 *   - NO_PLAN: 未设置套餐 → 拒绝
 *   - PLAN_EXPIRED: 套餐过期 → 拒绝
 *   - FLAT 套餐: 检查余额 >= flatAmount
 *   - PER_UNIT/TIERED: 检查 includedQuota 剩余 + 余额
 */
@Injectable()
export class BillingServiceImpl implements BillingService {
  private readonly logger = new Logger(BillingServiceImpl.name)
  private readonly plans = new Map<string, PricingPlan>()
  private readonly wallets = new Map<string, Wallet>()
  private readonly bills = new Map<string, Bill>()
  private billSeq = 0

  constructor(
    @Inject(InMemoryBillingMeter) private readonly meter: BillingMeter,
    @Inject(DefaultPricingEngine) private readonly engine: PricingEngine
  ) {}

  // ─── 套餐 ─────────────────────────────────────

  setPlan(tenantId: string, plan: PricingPlan): void {
    this.plans.set(tenantId, plan)
    this.logger.log(`Tenant ${tenantId} plan -> ${plan.id} (${plan.type})`)
  }

  getPlan(tenantId: string): PricingPlan | null {
    return this.plans.get(tenantId) ?? null
  }

  // ─── 钱包 ─────────────────────────────────────

  recharge(tenantId: string, amount: number, currency: string = 'CNY'): Wallet {
    const w = this.wallets.get(tenantId) ?? {
      tenantId,
      balance: 0,
      currency,
      totalRecharged: 0,
      totalConsumed: 0,
      updatedAt: Date.now()
    }
    w.balance += amount
    w.totalRecharged += amount
    w.currency = currency
    w.updatedAt = Date.now()
    this.wallets.set(tenantId, w)
    return { ...w }
  }

  getWallet(tenantId: string): Wallet {
    return (
      this.wallets.get(tenantId) ?? {
        tenantId,
        balance: 0,
        currency: 'CNY',
        totalRecharged: 0,
        totalConsumed: 0,
        updatedAt: 0
      }
    )
  }

  deduct(tenantId: string, amount: number): number {
    const w = this.getWallet(tenantId)
    w.balance -= amount
    w.totalConsumed += amount
    w.updatedAt = Date.now()
    this.wallets.set(tenantId, w)
    return w.balance
  }

  // ─── 出账 ─────────────────────────────────────

  settle(tenantId: string, period: BillingPeriod): Bill {
    const plan = this.plans.get(tenantId)
    const usages = this.meter.getAllUsage(tenantId, period)
    const lines: BillLine[] = []
    let total = 0
    if (plan) {
      // 套餐固定费
      if (plan.type === 'FLAT' && plan.flatAmount) {
        lines.push({
          metric: 'subscription',
          quantity: 1,
          unitPrice: plan.flatAmount,
          amount: plan.flatAmount,
          remark: `${plan.name} (${plan.billingCycle})`
        })
        total += plan.flatAmount
      }
      // 按 metric 计费
      for (const u of usages) {
        const result = this.engine.calculate({
          plan,
          metric: u.metric,
          currentUsage: 0, // 出账时按整期计
          delta: u.totalQuantity
        })
        if (result.amount > 0) {
          const tier = plan.tiers[result.tierIndex ?? 0]
          lines.push({
            metric: u.metric,
            quantity: u.totalQuantity,
            unitPrice: tier?.unitPrice ?? 0,
            amount: result.amount,
            remark: result.breakdown
          })
          total += result.amount
        }
      }
    }
    const bill: Bill = {
      id: `B-${String(++this.billSeq).padStart(8, '0')}`,
      tenantId,
      period,
      planId: plan?.id ?? 'NONE',
      lines,
      totalAmount: Math.round(total * 100) / 100,
      currency: plan?.currency ?? 'CNY',
      status: 'ISSUED',
      issuedAt: Date.now(),
      createdAt: Date.now()
    }
    this.bills.set(bill.id, bill)
    // 扣减钱包
    if (total > 0) {
      this.deduct(tenantId, total)
    }
    return { ...bill, lines: [...bill.lines] }
  }

  getBill(billId: string): Bill | null {
    const b = this.bills.get(billId)
    return b ? { ...b, lines: [...b.lines] } : null
  }

  listBills(tenantId: string): Bill[] {
    return Array.from(this.bills.values())
      .filter((b) => b.tenantId === tenantId)
      .map((b) => ({ ...b, lines: [...b.lines] }))
  }

  // ─── 计费墙 ───────────────────────────────────

  check(tenantId: string, metric: string, quantity: number = 1): BillingWallDecision {
    const plan = this.plans.get(tenantId)
    const now = Date.now()
    if (!plan) {
      return { allowed: false, reason: 'NO_PLAN', message: '租户未设置套餐' }
    }
    if (plan.expiresAt !== undefined && plan.expiresAt < now) {
      return { allowed: false, reason: 'PLAN_EXPIRED', message: '套餐已过期' }
    }
    // FREE → 永远放行
    if (plan.type === 'FREE') {
      return { allowed: true, remainingQuota: Infinity, estimatedCost: 0, balance: this.getWallet(tenantId).balance }
    }
    // FLAT → 检查余额 >= flatAmount (只收一次)
    if (plan.type === 'FLAT') {
      const flat = plan.flatAmount ?? 0
      const wallet = this.getWallet(tenantId)
      if (flat > 0 && wallet.balance < flat) {
        return {
          allowed: false,
          reason: 'INSUFFICIENT_BALANCE',
          balance: wallet.balance,
          estimatedCost: flat,
          message: `余额不足 (${wallet.balance} < ${flat})`
        }
      }
      return { allowed: true, estimatedCost: flat, balance: wallet.balance }
    }
    // PER_UNIT / TIERED → 检查 quota + 余额
    const period = this.meter.currentPeriod(now)
    const usage = this.meter.getUsage(tenantId, metric, period)
    const currentUsage = usage.totalQuantity
    const newUsage = currentUsage + quantity
    const included = plan.includedQuota ?? 0
    // 找上限: PER_UNIT 模式 tier[0].upTo 视为无限制 (or Infinity)
    let hardLimit = Infinity
    if (plan.type === 'PER_UNIT' && plan.tiers[0]) {
      hardLimit = plan.tiers[0].upTo
    }
    if (newUsage > hardLimit) {
      return {
        allowed: false,
        reason: 'QUOTA_EXCEEDED',
        remainingQuota: Math.max(0, hardLimit - currentUsage),
        message: `本期配额 (${hardLimit}) 已用尽`
      }
    }
    // 估算费用
    const result = this.engine.calculate({ plan, metric, currentUsage, delta: quantity })
    const wallet = this.getWallet(tenantId)
    if (result.amount > 0 && wallet.balance < result.amount) {
      return {
        allowed: false,
        reason: 'INSUFFICIENT_BALANCE',
        balance: wallet.balance,
        estimatedCost: result.amount,
        remainingQuota: Math.max(0, included - currentUsage),
        message: `余额不足 (${wallet.balance} < ${result.amount.toFixed(2)})`
      }
    }
    return {
      allowed: true,
      remainingQuota: Math.max(0, included - currentUsage),
      estimatedCost: result.amount,
      balance: wallet.balance
    }
  }

  charge(tenantId: string, metric: string, quantity: number, at: number = Date.now()): PricingResult {
    // 1) 先记录 usage (即使没 plan 也记录, 方便审计/补录)
    this.meter.record({ tenantId, metric, quantity, at })
    // 2) 无 plan → 不计费
    const plan = this.plans.get(tenantId)
    if (!plan) {
      return { amount: 0, breakdown: 'NO_PLAN', currency: 'CNY' }
    }
    const period = this.meter.currentPeriod(at)
    const usage = this.meter.getUsage(tenantId, metric, period)
    // 3) 计算费用 (用 record 之前的 usage)
    const result = this.engine.calculate({
      plan,
      metric,
      currentUsage: Math.max(0, usage.totalQuantity - quantity),
      delta: quantity
    })
    // 4) 扣费
    if (result.amount > 0) {
      this.deduct(tenantId, result.amount)
    }
    return result
  }
}
