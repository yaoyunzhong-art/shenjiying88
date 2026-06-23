import type {
  OperationSnapshot,
  OperationSnapshotMetric,
  OperationSnapshotGroup,
  Diagnostic,
  DiagnosticRecommendation
} from './analytics.entity'
import { AnalyticsScope, DiagnosticSeverity, DiagnosticCategory } from './analytics.entity'

/**
 * 运营快照合约：对外暴露的 summary 视图
 */
export interface OperationSnapshotContract {
  tenantId: string
  scope: AnalyticsScope
  brandId?: string
  storeId?: string
  generatedAt: string
  groups: OperationSnapshotGroup[]
  totals: OperationSnapshotMetric[]
}

/**
 * 诊断合约：对外暴露的诊断项
 */
export interface DiagnosticContract {
  diagnosticId: string
  ruleId: string
  tenantId: string
  brandId?: string
  storeId?: string
  scope: AnalyticsScope
  category: DiagnosticCategory
  severity: DiagnosticSeverity
  title: string
  summary: string
  evidence: Record<string, unknown>
  recommendations: DiagnosticRecommendation[]
  generatedAt: string
}

/**
 * 诊断推荐合约
 */
export interface DiagnosticRecommendationContract {
  actionCode: string
  description: string
  suggestedCampaignKind?: 'POINTS_AWARD' | 'COUPON_ISSUE' | 'BLINDBOX_PROMO' | 'RE_ENGAGEMENT'
  priority: number
}

/**
 * 运营摘要合约：snapshot + diagnostics 汇总
 */
export interface AnalyticsBootstrapContract {
  snapshot: OperationSnapshotContract
  diagnostics: DiagnosticContract[]
  recommendations: DiagnosticRecommendationContract[]
  generatedAt: string
}

// ─── Mappers ───

export function toOperationSnapshotContract(
  snapshot: OperationSnapshot
): OperationSnapshotContract {
  return {
    tenantId: snapshot.tenantId,
    scope: snapshot.scope,
    brandId: snapshot.brandId,
    storeId: snapshot.storeId,
    generatedAt: snapshot.generatedAt,
    groups: snapshot.groups.map((g) => ({
      groupKey: g.groupKey,
      groupLabel: g.groupLabel,
      metrics: g.metrics.map((m) => ({
        key: m.key,
        label: m.label,
        value: m.value,
        unit: m.unit,
        ratio: m.ratio,
        trend: m.trend
      }))
    })),
    totals: snapshot.totals.map((m) => ({
      key: m.key,
      label: m.label,
      value: m.value,
      unit: m.unit,
      ratio: m.ratio,
      trend: m.trend
    }))
  }
}

export function toDiagnosticContract(diagnostic: Diagnostic): DiagnosticContract {
  return {
    diagnosticId: diagnostic.diagnosticId,
    ruleId: diagnostic.ruleId,
    tenantId: diagnostic.tenantContext.tenantId,
    brandId: diagnostic.tenantContext.brandId,
    storeId: diagnostic.tenantContext.storeId,
    scope: diagnostic.scope,
    category: diagnostic.category,
    severity: diagnostic.severity,
    title: diagnostic.title,
    summary: diagnostic.summary,
    evidence: diagnostic.evidence,
    recommendations: diagnostic.recommendations.map((r) => ({
      actionCode: r.actionCode,
      description: r.description,
      suggestedCampaignKind: r.suggestedCampaignKind,
      priority: r.priority
    })),
    generatedAt: diagnostic.generatedAt
  }
}

export function toDiagnosticRecommendationContract(
  recommendation: DiagnosticRecommendation
): DiagnosticRecommendationContract {
  return {
    actionCode: recommendation.actionCode,
    description: recommendation.description,
    suggestedCampaignKind: recommendation.suggestedCampaignKind,
    priority: recommendation.priority
  }
}

export function toAnalyticsBootstrapContract(input: {
  snapshot: OperationSnapshot
  diagnostics: Diagnostic[]
  recommendations: DiagnosticRecommendation[]
}): AnalyticsBootstrapContract {
  return {
    snapshot: toOperationSnapshotContract(input.snapshot),
    diagnostics: input.diagnostics.map(toDiagnosticContract),
    recommendations: input.recommendations.map(toDiagnosticRecommendationContract),
    generatedAt: input.snapshot.generatedAt
  }
}
