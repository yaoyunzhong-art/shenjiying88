import { Injectable, Optional } from '@nestjs/common'
import { LoyaltyService } from '../loyalty/loyalty.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  AnalyticsScope,
  DiagnosticCategory,
  DiagnosticSeverity,
  type Diagnostic,
  type DiagnosticRecommendation,
  type OperationSnapshot,
  type OperationSnapshotGroup,
  type OperationSnapshotMetric
} from './analytics.entity'

interface DiagnosticRule {
  ruleId: string
  category: DiagnosticCategory
  severity: DiagnosticSeverity
  title: string
  buildRecommendation: (evidence: Record<string, unknown>) => DiagnosticRecommendation[]
}

const DIAGNOSTIC_RULES: DiagnosticRule[] = [
  {
    ruleId: 'payment-success-rate-low',
    category: DiagnosticCategory.PaymentHealth,
    severity: DiagnosticSeverity.Critical,
    title: '支付成功率低于健康线',
    buildRecommendation: () => [
      {
        actionCode: 'inspect-payment-gateway',
        description: '检查 LYT 网关连通性与签名校验失败计数',
        priority: 100
      }
    ]
  },
  {
    ruleId: 'blindbox-redemption-shortfall',
    category: DiagnosticCategory.BlindboxEngagement,
    severity: DiagnosticSeverity.Warning,
    title: '盲盒履约转化偏低',
    buildRecommendation: () => [
      {
        actionCode: 'launch-blindbox-promo',
        description: '为转化偏低的盲盒 SKU 上线专项促销或增发低门槛券',
        suggestedCampaignKind: 'BLINDBOX_PROMO',
        priority: 80
      }
    ]
  },
  {
    ruleId: 'coupon-quota-near-exhaustion',
    category: DiagnosticCategory.CouponPerformance,
    severity: DiagnosticSeverity.Warning,
    title: '券计划额度接近耗尽',
    buildRecommendation: () => [
      {
        actionCode: 'restock-coupon-quota',
        description: '为额度告急的券计划补充配额或结束计划',
        priority: 70
      }
    ]
  },
  {
    ruleId: 'no-settlement-activity',
    category: DiagnosticCategory.MemberActivity,
    severity: DiagnosticSeverity.Warning,
    title: '结算活跃度静默',
    buildRecommendation: () => [
      {
        actionCode: 'launch-re-engagement',
        description: '对最近无结算的活跃会员发起回流激励活动',
        suggestedCampaignKind: 'RE_ENGAGEMENT',
        priority: 60
      }
    ]
  },
  {
    ruleId: 'points-outflow-dominant',
    category: DiagnosticCategory.PointEconomy,
    severity: DiagnosticSeverity.Critical,
    title: '积分净流出主导',
    buildRecommendation: () => [
      {
        actionCode: 'rebalance-point-economy',
        description: '暂停高消耗积分活动并提升积分获取通路',
        priority: 90
      }
    ]
  },
  {
    ruleId: 'member-activity-thinning',
    category: DiagnosticCategory.MemberActivity,
    severity: DiagnosticSeverity.Info,
    title: '会员活动节奏稀疏',
    buildRecommendation: () => [
      {
        actionCode: 'increase-touchpoint-frequency',
        description: '增加导购触达节奏或推送积分翻倍激励',
        suggestedCampaignKind: 'POINTS_AWARD',
        priority: 40
      }
    ]
  }
]

interface AnalyticsInputs {
  tenantId: string
  brandId?: string
  storeId?: string
  /** Order/payment aggregates from upstream (optional, may be empty for first deploy) */
  orderCount?: number
  orderAmount?: number
  paymentFailureCount?: number
  memberCount?: number
}

@Injectable()
export class AnalyticsService {
  constructor(@Optional() private readonly loyaltyService?: LoyaltyService) {}

  getOperationSnapshot(
    tenantContext: RequestTenantContext,
    options?: { scope?: AnalyticsScope; brandId?: string; storeId?: string }
  ): OperationSnapshot {
    const scope = options?.scope ?? AnalyticsScope.Tenant
    const inputs: AnalyticsInputs = this.resolveInputs(tenantContext, scope, options)

    const loyalty = this.loyaltyService?.getLoyaltySummary({
      tenantId: inputs.tenantId,
      brandId: inputs.brandId,
      storeId: inputs.storeId
    }) ?? {
      settlementCount: 0,
      settlementSuccessCount: 0,
      couponRedemptionCount: 0,
      blindboxFulfillmentCount: 0,
      pointsIn: 0,
      pointsOut: 0
    }

    const orderGroup: OperationSnapshotGroup = {
      groupKey: 'orders',
      groupLabel: '订单与支付',
      metrics: [
        {
          key: 'settlementCount',
          label: '结算笔数',
          value: loyalty.settlementCount,
          unit: '笔'
        },
        {
          key: 'settlementSuccessRate',
          label: '结算成功率',
          value:
            loyalty.settlementCount > 0
              ? Math.round((loyalty.settlementSuccessCount / loyalty.settlementCount) * 1000) / 10
              : 0,
          unit: '%',
          ratio:
            loyalty.settlementCount > 0
              ? (loyalty.settlementSuccessCount / loyalty.settlementCount) * 100
              : 0
        },
        {
          key: 'couponRedemptionCount',
          label: '券核销数',
          value: loyalty.couponRedemptionCount,
          unit: '张'
        },
        {
          key: 'blindboxFulfillmentCount',
          label: '盲盒履约数',
          value: loyalty.blindboxFulfillmentCount,
          unit: '盒'
        }
      ]
    }

    const loyaltyGroup: OperationSnapshotGroup = {
      groupKey: 'loyalty',
      groupLabel: '积分与会员',
      metrics: [
        {
          key: 'pointsIn',
          label: '积分发放',
          value: loyalty.pointsIn,
          unit: '分'
        },
        {
          key: 'pointsOut',
          label: '积分消耗',
          value: loyalty.pointsOut,
          unit: '分'
        },
        {
          key: 'pointsNet',
          label: '积分净流',
          value: loyalty.pointsIn - loyalty.pointsOut,
          unit: '分',
          trend: loyalty.pointsIn > loyalty.pointsOut ? 'UP' : loyalty.pointsIn < loyalty.pointsOut ? 'DOWN' : 'FLAT'
        }
      ]
    }

    const totals: OperationSnapshotMetric[] = [
      {
        key: 'totalSettlements',
        label: '总结算笔数',
        value: loyalty.settlementCount,
        unit: '笔'
      },
      {
        key: 'totalRedemptions',
        label: '总券核销',
        value: loyalty.couponRedemptionCount,
        unit: '张'
      },
      {
        key: 'totalBlindboxes',
        label: '总盲盒履约',
        value: loyalty.blindboxFulfillmentCount,
        unit: '盒'
      }
    ]

    return {
      tenantId: inputs.tenantId,
      scope,
      brandId: inputs.brandId,
      storeId: inputs.storeId,
      generatedAt: new Date().toISOString(),
      groups: [orderGroup, loyaltyGroup],
      totals
    }
  }

  getDiagnostics(
    tenantContext: RequestTenantContext,
    options?: { scope?: AnalyticsScope; brandId?: string; storeId?: string }
  ): Diagnostic[] {
    const scope = options?.scope ?? AnalyticsScope.Tenant
    const inputs: AnalyticsInputs = this.resolveInputs(tenantContext, scope, options)
    const snapshot = this.getOperationSnapshot(tenantContext, options)
    const loyalty = this.loyaltyService?.getLoyaltySummary({
      tenantId: inputs.tenantId,
      brandId: inputs.brandId,
      storeId: inputs.storeId
    }) ?? {
      settlementCount: 0,
      settlementSuccessCount: 0,
      couponRedemptionCount: 0,
      blindboxFulfillmentCount: 0,
      pointsIn: 0,
      pointsOut: 0
    }

    const nowIso = new Date().toISOString()
    const diagnostics: Diagnostic[] = []

    // Rule 1: payment success rate low
    const successRate =
      loyalty.settlementCount > 0 ? loyalty.settlementSuccessCount / loyalty.settlementCount : 1
    if (loyalty.settlementCount > 0 && successRate < 0.8) {
      const rule = DIAGNOSTIC_RULES.find((r) => r.ruleId === 'payment-success-rate-low')!
      diagnostics.push(
        this.buildDiagnostic({
          rule,
          tenantContext,
          scope: options?.scope ?? AnalyticsScope.Tenant,
          evidence: {
            settlementCount: loyalty.settlementCount,
            successCount: loyalty.settlementSuccessCount,
            successRate: Math.round(successRate * 1000) / 10
          },
          nowIso
        })
      )
    }

    // Rule 2: blindbox redemption shortfall (use fulfillment vs redemption ratio as proxy)
    if (loyalty.blindboxFulfillmentCount === 0 && loyalty.couponRedemptionCount > 5) {
      const rule = DIAGNOSTIC_RULES.find((r) => r.ruleId === 'blindbox-redemption-shortfall')!
      diagnostics.push(
        this.buildDiagnostic({
          rule,
          tenantContext,
          scope: options?.scope ?? AnalyticsScope.Tenant,
          evidence: {
            blindboxFulfillmentCount: loyalty.blindboxFulfillmentCount,
            couponRedemptionCount: loyalty.couponRedemptionCount
          },
          nowIso
        })
      )
    }

    // Rule 3: coupon quota near exhaustion (delegate to loyalty couponPlanStore if exposed)
    if (this.loyaltyService) {
      const exhaustedPlans = this.loyaltyService.listCouponPlans(tenantContext.tenantId).filter(
        (plan) => plan.remainingQuota / Math.max(1, plan.totalQuota) < 0.1 && plan.status === 'ACTIVE'
      )
      if (exhaustedPlans.length > 0) {
        const rule = DIAGNOSTIC_RULES.find((r) => r.ruleId === 'coupon-quota-near-exhaustion')!
        diagnostics.push(
          this.buildDiagnostic({
            rule,
            tenantContext,
            scope: options?.scope ?? AnalyticsScope.Tenant,
            evidence: {
              exhaustedPlanIds: exhaustedPlans.map((p) => p.planId),
              exhaustedCodes: exhaustedPlans.map((p) => p.code)
            },
            nowIso
          })
        )
      }
    }

    // Rule 4: no settlement activity
    if (loyalty.settlementCount === 0) {
      const rule = DIAGNOSTIC_RULES.find((r) => r.ruleId === 'no-settlement-activity')!
      diagnostics.push(
        this.buildDiagnostic({
          rule,
          tenantContext,
          scope: options?.scope ?? AnalyticsScope.Tenant,
          evidence: { settlementCount: 0 },
          nowIso
        })
      )
    }

    // Rule 5: points outflow dominant
    if (loyalty.pointsOut > loyalty.pointsIn * 1.3 && loyalty.pointsOut > 0) {
      const rule = DIAGNOSTIC_RULES.find((r) => r.ruleId === 'points-outflow-dominant')!
      diagnostics.push(
        this.buildDiagnostic({
          rule,
          tenantContext,
          scope: options?.scope ?? AnalyticsScope.Tenant,
          evidence: {
            pointsIn: loyalty.pointsIn,
            pointsOut: loyalty.pointsOut,
            netFlow: loyalty.pointsIn - loyalty.pointsOut
          },
          nowIso
        })
      )
    }

    // Rule 6: member activity thinning (low settlement density)
    if (
      loyalty.settlementCount > 0 &&
      loyalty.settlementCount < 3 &&
      loyalty.pointsOut === 0 &&
      loyalty.couponRedemptionCount === 0
    ) {
      const rule = DIAGNOSTIC_RULES.find((r) => r.ruleId === 'member-activity-thinning')!
      diagnostics.push(
        this.buildDiagnostic({
          rule,
          tenantContext,
          scope: options?.scope ?? AnalyticsScope.Tenant,
          evidence: {
            settlementCount: loyalty.settlementCount,
            couponRedemptionCount: loyalty.couponRedemptionCount,
            pointsOut: loyalty.pointsOut
          },
          nowIso
        })
      )
    }

    // Carry the snapshot metadata into the diagnostics for traceability
    void snapshot
    return diagnostics
  }

  getRecommendations(
    tenantContext: RequestTenantContext,
    options?: { scope?: AnalyticsScope; brandId?: string; storeId?: string }
  ): DiagnosticRecommendation[] {
    const diagnostics = this.getDiagnostics(tenantContext, options)
    return diagnostics
      .flatMap((diagnostic) => diagnostic.recommendations)
      .sort((a, b) => b.priority - a.priority)
  }

  private resolveInputs(
    tenantContext: RequestTenantContext,
    scope: AnalyticsScope,
    options?: { brandId?: string; storeId?: string }
  ): AnalyticsInputs {
    return {
      tenantId: tenantContext.tenantId,
      brandId: scope === AnalyticsScope.Brand ? options?.brandId ?? tenantContext.brandId : undefined,
      storeId: scope === AnalyticsScope.Store ? options?.storeId ?? tenantContext.storeId : undefined
    }
  }

  private buildDiagnostic(input: {
    rule: DiagnosticRule
    tenantContext: RequestTenantContext
    scope: AnalyticsScope
    evidence: Record<string, unknown>
    nowIso: string
  }): Diagnostic {
    const { rule, tenantContext, scope, evidence, nowIso } = input
    return {
      diagnosticId: `${rule.ruleId}-${tenantContext.tenantId}-${nowIso}`,
      ruleId: rule.ruleId,
      tenantContext: {
        tenantId: tenantContext.tenantId,
        brandId: tenantContext.brandId,
        storeId: tenantContext.storeId
      },
      scope,
      category: rule.category,
      severity: rule.severity,
      title: rule.title,
      summary: rule.title,
      evidence,
      recommendations: rule.buildRecommendation(evidence),
      generatedAt: nowIso
    }
  }
}
