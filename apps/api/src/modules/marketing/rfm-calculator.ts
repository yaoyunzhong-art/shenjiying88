import { Injectable } from '@nestjs/common'
import { RFMAdapter } from './datasources/rfm.adapter'
import { MemberAdapter } from './datasources/member.adapter'
import { OrderAdapter } from './datasources/order.adapter'
import type {
  TenantId,
  RFMProfile,
  RFMStats,
  RFMSegmentType,
  RFMRecency,
  RFMFrequency,
  RFMMonetary
} from './marketing.entity'

/**
 * Phase-42 T172: RFMCalculator (RFM 计算引擎)
 *
 * DR-42-A: 3 维度 → 8 分群
 *  - Recency: 最近订单距今天数 (30d / 60d / 90d / >90d)
 *  - Frequency: 90d 内订单数 (HIGH>=5 / MEDIUM>=2 / LOW>=1 / NONE=0)
 *  - Monetary: 180d 内消费金额 (HIGH>=50000 / MEDIUM>=10000 / LOW)
 *
 * 8 分群映射 (RFM Chart 经典):
 *  - Champions: 高 R + 高 F + 高 M
 *  - Loyal: 高 F + 高 M (老客户)
 *  - Potential Loyalists: 高 R + 中 F + 中 M
 *  - Recent: 高 R + 低 F + 低 M (新客户)
 *  - Promising: 中 R + 低 F + 低 M
 *  - Need Attention: 中 R + 中 F + 中 M
 *  - At Risk: 低 R + 高 F + 高 M (流失风险)
 *  - Hibernating: 低 R + 低 F + 低 M (休眠)
 */

const RECENCY_BUCKETS = { RECENT_30D: 30, RECENT_60D: 60, RECENT_90D: 90, OVER_90D: Infinity }
const FREQUENCY_THRESHOLDS = { HIGH: 5, MEDIUM: 2, LOW: 1 }
const MONETARY_THRESHOLDS = { HIGH: 50000, MEDIUM: 10000 }  // cents

@Injectable()
export class RFMCalculator {
  constructor(
    private readonly rfmAdapter: RFMAdapter,
    private readonly memberAdapter: MemberAdapter,
    private readonly orderAdapter: OrderAdapter
  ) {}

  /**
   * 计算单个会员的 RFM profile
   */
  computeForMember(tenantId: TenantId, memberId: string, now: number = Date.now()): RFMProfile | null {
    const member = this.memberAdapter.query(tenantId, memberId)
    if (!member) return null

    const orders = this.orderAdapter.queryByMember(tenantId, memberId)
      .filter(o => o.status === 'COMPLETED')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Recency
    const daysSinceLastOrder = orders.length > 0
      ? Math.floor((now - new Date(orders[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))
      : 9999

    // Frequency (90d 内)
    const ninetyDaysAgo = now - 90 * 24 * 60 * 60 * 1000
    const orderCount90d = orders.filter(o => new Date(o.createdAt).getTime() >= ninetyDaysAgo).length
    const lifetimeOrderCount = orders.length

    // Monetary (180d 内)
    const oneEightyDaysAgo = now - 180 * 24 * 60 * 60 * 1000
    const totalSpendCents = orders
      .filter(o => new Date(o.createdAt).getTime() >= oneEightyDaysAgo)
      .reduce((sum, o) => sum + o.totalCents, 0)

    const recency = this.classifyRecency(daysSinceLastOrder)
    const frequency = this.classifyFrequency(orderCount90d, lifetimeOrderCount, daysSinceLastOrder)
    const monetary = this.classifyMonetary(totalSpendCents)
    const segment = this.classifySegment(recency, frequency, monetary)

    const profile: RFMProfile = {
      id: `rfm-${memberId}`,
      tenantId,
      memberId,
      recency,
      frequency,
      monetary,
      segment,
      daysSinceLastOrder,
      orderCount90d,
      totalSpendCents,
      computedAt: new Date(now).toISOString(),
      updatedAt: new Date(now).toISOString()
    }

    return this.rfmAdapter.save(profile)
  }

  /**
   * 批量计算租户下所有会员的 RFM
   */
  computeForTenant(tenantId: TenantId): RFMProfile[] {
    const members = this.memberAdapter.queryByTenant(tenantId)
    const profiles: RFMProfile[] = []
    for (const m of members) {
      const p = this.computeForMember(tenantId, m.id)
      if (p) profiles.push(p)
    }
    return profiles
  }

  /**
   * 租户级别 RFM 统计
   */
  getStats(tenantId: TenantId): RFMStats {
    const profiles = this.rfmAdapter.queryByTenant(tenantId)
    const distribution: Record<RFMSegmentType, number> = {
      CHAMPIONS: 0,
      LOYAL: 0,
      POTENTIAL_LOYALIST: 0,
      RECENT: 0,
      PROMISING: 0,
      NEED_ATTENTION: 0,
      AT_RISK: 0,
      HIBERNATING: 0
    }
    let totalRecency = 0
    let totalFrequency = 0
    let totalMonetary = 0

    for (const p of profiles) {
      distribution[p.segment]++
      totalRecency += p.daysSinceLastOrder
      totalFrequency += p.orderCount90d
      totalMonetary += p.totalSpendCents
    }

    const n = profiles.length
    return {
      totalMembers: n,
      segmentDistribution: distribution,
      avgRecencyDays: n > 0 ? Math.round(totalRecency / n) : 0,
      avgFrequency: n > 0 ? Number((totalFrequency / n).toFixed(2)) : 0,
      avgMonetaryCents: n > 0 ? Math.round(totalMonetary / n) : 0
    }
  }

  /**
   * 反模式 v4 ab-test-bias-pattern: 反向分布检测
   * 提示数据是否健康 (各分群占比不应过度集中)
   */
  isDistributionHealthy(stats: RFMStats): boolean {
    if (stats.totalMembers < 10) return false  // 样本太少
    const counts = Object.values(stats.segmentDistribution)
    const max = Math.max(...counts)
    const total = counts.reduce((a, b) => a + b, 0)
    return max / total < 0.7  // 任一分群占比不超过 70%
  }

  // ─── 私有分类方法 ──────────────────────────────────

  private classifyRecency(days: number): RFMRecency {
    if (days <= RECENCY_BUCKETS.RECENT_30D) return 'RECENT_30D'
    if (days <= RECENCY_BUCKETS.RECENT_60D) return 'RECENT_60D'
    if (days <= RECENCY_BUCKETS.RECENT_90D) return 'RECENT_90D'
    return 'OVER_90D'
  }

  private classifyFrequency(orderCount90d: number, lifetimeCount?: number, daysSinceLast?: number): RFMFrequency {
    // AT_RISK 检测: 90d 无订单 但历史高频 → 仍算 HIGH
    if (orderCount90d === 0 && (lifetimeCount ?? 0) >= 5 && (daysSinceLast ?? 0) <= 180) {
      return 'HIGH'
    }
    if (orderCount90d >= FREQUENCY_THRESHOLDS.HIGH) return 'HIGH'
    if (orderCount90d >= FREQUENCY_THRESHOLDS.MEDIUM) return 'MEDIUM'
    if (orderCount90d >= FREQUENCY_THRESHOLDS.LOW) return 'LOW'
    return 'NONE'
  }

  private classifyMonetary(totalSpendCents: number): RFMMonetary {
    if (totalSpendCents >= MONETARY_THRESHOLDS.HIGH) return 'HIGH'
    if (totalSpendCents >= MONETARY_THRESHOLDS.MEDIUM) return 'MEDIUM'
    return 'LOW'
  }

  private classifySegment(r: RFMRecency, f: RFMFrequency, m: RFMMonetary): RFMSegmentType {
    // Champions: 高 R + 高 F + 高 M (最佳客户, 最近活跃)
    if (r === 'RECENT_30D' && f === 'HIGH' && m === 'HIGH') return 'CHAMPIONS'
    // At Risk: 低 R + 高 F + 高 M (流失风险, 优先匹配)
    if ((r === 'RECENT_90D' || r === 'OVER_90D') && f === 'HIGH' && m === 'HIGH') return 'AT_RISK'
    // Loyal: 高 F + 高 M (活跃老客户)
    if (f === 'HIGH' && m === 'HIGH') return 'LOYAL'
    // Potential Loyalists: 高 R + 中 F + 中 M
    if (r === 'RECENT_30D' && (f === 'MEDIUM' || f === 'HIGH') && m !== 'LOW') return 'POTENTIAL_LOYALIST'
    // Recent: 高 R + 低 F + 低 M (新客户)
    if (r === 'RECENT_30D' && (f === 'LOW' || f === 'NONE') && m === 'LOW') return 'RECENT'
    // Promising: 中 R + 低 F + 低 M
    if ((r === 'RECENT_60D' || r === 'RECENT_90D') && (f === 'LOW' || f === 'NONE') && m === 'LOW') return 'PROMISING'
    // Need Attention: 中 R + 中 F + 中 M
    if ((r === 'RECENT_60D' || r === 'RECENT_90D') && f === 'MEDIUM' && m === 'MEDIUM') return 'NEED_ATTENTION'
    // Hibernating: 低 R + 低 F + 低 M
    return 'HIBERNATING'
  }
}