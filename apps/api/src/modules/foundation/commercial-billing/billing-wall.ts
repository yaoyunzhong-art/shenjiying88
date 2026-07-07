import { Inject, Injectable, Logger } from '@nestjs/common'
import {
  type Bill,
  type BillingPeriod,
  type BillingService,
  type BillingWallDecision,
  type PricingPlan,
  type UsageAggregate,
  type BillingMeter
} from './billing.port'
import { BillingServiceImpl, InMemoryBillingMeter } from './billing.service'

/**
 * BillingWall · 业务侧计费墙 (P3-4.3)
 *
 * 业务调用方 (cashier / payment / lyt 等) 在关键路径上:
 *
 *   if (!wall.guard(tenantId, 'payment.wechat')) {
 *     throw new BillingQuotaExceeded(...)
 *   }
 *   await callExternal()
 *   wall.recordUsage(tenantId, 'payment.wechat', 1)
 *
 * 能力:
 *   - guard(tenantId, metric, qty): 调 BillingService.check
 *   - recordUsage: 调 BillingService.charge (自动计费)
 *   - settle(tenantId, period): 月底出账
 *   - getUsageReport(tenantId, period): 业务方查本期用量
 *   - getPricingPlan(tenantId): 查当前套餐
 *   - batchGuard(tenantId, metrics[]): 批量检查
 */
@Injectable()
export class BillingWall {
  private readonly logger = new Logger(BillingWall.name)

  constructor(
    @Inject(BillingServiceImpl) private readonly billing: BillingService,
    @Inject(InMemoryBillingMeter) private readonly meter: BillingMeter
  ) {}

  /**
   * 调用前守卫: 通过则放行, 不通过抛错 (或返回 decision)
   * 推荐用法:
   *   const d = wall.guard(t, 'payment.wechat')
   *   if (!d.allowed) throw new BillingQuotaExceeded(d.reason, d.message)
   */
  guard(tenantId: string, metric: string, quantity: number = 1): BillingWallDecision {
    const d = this.billing.check(tenantId, metric, quantity)
    if (!d.allowed) {
      this.logger.warn(`BillingWall DENY ${tenantId}/${metric} reason=${d.reason} msg=${d.message}`)
    }
    return d
  }

  /**
   * 调用后计费: 自动 record + charge
   * 注意: 已包含计量, 不需要再调 recordUsage
   */
  recordUsage(tenantId: string, metric: string, quantity: number = 1, at: number = Date.now()): void {
    this.billing.charge(tenantId, metric, quantity, at)
  }

  /**
   * 批量守卫: 一次检查多个 metric (避免多次 IO)
   * 任一不过 → 全部拒绝
   */
  batchGuard(tenantId: string, metrics: Array<{ metric: string; quantity?: number }>): BillingWallDecision {
    for (const m of metrics) {
      const d = this.billing.check(tenantId, m.metric, m.quantity ?? 1)
      if (!d.allowed) {
        return {
          ...d,
          message: `batch guard failed at ${m.metric}: ${d.message}`
        }
      }
    }
    return { allowed: true }
  }

  /**
   * 月底出账 (由 cron 调)
   */
  settle(tenantId: string, period: BillingPeriod): Bill {
    const bill = this.billing.settle(tenantId, period)
    this.logger.log(
      `Settled ${tenantId} period=${period} total=${bill.totalAmount} ${bill.currency} lines=${bill.lines.length}`
    )
    return bill
  }

  /**
   * 业务方查本期用量 (前端展示)
   */
  getUsageReport(tenantId: string, period?: BillingPeriod): UsageAggregate[] {
    return this.meter.getAllUsage(tenantId, period ?? this.meter.currentPeriod())
  }

  /**
   * 查租户当前套餐
   */
  getPricingPlan(tenantId: string): PricingPlan | null {
    return this.billing.getPlan(tenantId)
  }
}

/**
 * BillingQuotaExceededError · 计费墙拒绝错误
 * 业务方 catch 后可降级 (拒收/降级到免费通道)
 */
export class BillingQuotaExceededError extends Error {
  readonly reason: string
  readonly decision: BillingWallDecision
  constructor(decision: BillingWallDecision) {
    super(`Billing wall denied: ${decision.reason ?? 'UNKNOWN'} - ${decision.message ?? ''}`)
    this.name = 'BillingQuotaExceededError'
    this.reason = decision.reason ?? 'UNKNOWN'
    this.decision = decision
  }
}
