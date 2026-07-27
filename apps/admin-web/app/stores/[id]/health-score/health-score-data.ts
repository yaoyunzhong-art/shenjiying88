export type HealthDimensionStatus = 'good' | 'fair' | 'poor'
export type HealthDimensionTrend = 'up' | 'down' | 'stable'

export interface HealthDimension {
  key: string
  label: string
  score: number
  status: HealthDimensionStatus
  trend: HealthDimensionTrend
  detail: string
  suggestion: string
}

export interface HealthHistoryPoint {
  period: string
  score: number
  note: string
}

export interface HealthDiagnostic {
  id: string
  title: string
  status: 'stable' | 'watch' | 'risk'
  detail: string
}

export interface HealthScoreSummary {
  overall: number
  goodCount: number
  fairCount: number
  poorCount: number
  attentionCount: number
}

export interface HealthScoreSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'store-health-score-fallback'
  storeId: string
  dimensions: HealthDimension[]
  history: HealthHistoryPoint[]
  diagnostics: HealthDiagnostic[]
  summary: HealthScoreSummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const HEALTH_STATUS_META: Record<HealthDimensionStatus, { color: string; label: string }> = {
  good: { color: 'green', label: '良好' },
  fair: { color: 'orange', label: '一般' },
  poor: { color: 'red', label: '较差' },
}

export const HEALTH_TREND_META: Record<HealthDimensionTrend, string> = {
  up: '上升',
  down: '下降',
  stable: '持平',
}

export const HEALTH_DIMENSIONS: HealthDimension[] = [
  { key: 'revenue', label: '营收健康', score: 85, status: 'good', trend: 'up', detail: '本月营收达标率 105%', suggestion: '保持当前价格策略与夜场组合包结构。' },
  { key: 'staff', label: '人员健康', score: 72, status: 'fair', trend: 'down', detail: '缺编 2 人，培训完成率 68%', suggestion: '补齐高峰班次编制并提升培训到岗率。' },
  { key: 'equipment', label: '设备健康', score: 93, status: 'good', trend: 'up', detail: '设备故障率 1.2%，已修复 5 台', suggestion: '继续执行周保养与高频巡检。' },
  { key: 'inventory', label: '库存健康', score: 68, status: 'fair', trend: 'stable', detail: '临期品 3 项，低库存 7 项', suggestion: '启动临期促销并补货低库存商品。' },
  { key: 'satisfaction', label: '客户满意度', score: 88, status: 'good', trend: 'up', detail: '好评率 92%，投诉 2 起', suggestion: '跟进投诉闭环，沉淀标准话术。' },
  { key: 'compliance', label: '合规健康', score: 90, status: 'good', trend: 'stable', detail: '隐患 0，证件齐全', suggestion: '维持现有合规巡检节奏。' },
  { key: 'safety', label: '安全健康', score: 78, status: 'fair', trend: 'up', detail: '本月安全检查 3 次，发现隐患 1 处', suggestion: '完成整改复核并更新巡检清单。' },
  { key: 'training', label: '培训健康', score: 65, status: 'fair', trend: 'down', detail: '全员培训完成率 62%', suggestion: '设置季度培训考核并补齐关键岗位培训。' },
]

export const HEALTH_HISTORY: HealthHistoryPoint[] = [
  { period: '04 月', score: 74, note: '营收恢复但培训完成率偏低' },
  { period: '05 月', score: 76, note: '安全巡检频次提升' },
  { period: '06 月', score: 78, note: '设备故障率下降' },
  { period: '07 月', score: 80, note: '会员满意度继续走高' },
]

export function buildHealthScoreSummary(dimensions: HealthDimension[]): HealthScoreSummary {
  const overall = Math.round(dimensions.reduce((sum, item) => sum + item.score, 0) / dimensions.length)

  return {
    overall,
    goodCount: dimensions.filter((item) => item.status === 'good').length,
    fairCount: dimensions.filter((item) => item.status === 'fair').length,
    poorCount: dimensions.filter((item) => item.status === 'poor').length,
    attentionCount: dimensions.filter((item) => item.status !== 'good').length,
  }
}

export function buildHealthScoreDiagnostics(storeId: string): HealthDiagnostic[] {
  return [
    {
      id: 'health-source',
      title: '健康评分快照已透明化',
      status: 'stable',
      detail: `门店 ${storeId} 当前通过 snapshot loader 下发维度评分、趋势与建议样本。`,
    },
    {
      id: 'health-indicator',
      title: '指标口径待统一',
      status: 'watch',
      detail: '人员、库存与培训指标仍为本地样本，尚未与正式经营口径联动。',
    },
    {
      id: 'health-history',
      title: '历史趋势未接入真实看板',
      status: 'risk',
      detail: '月度趋势仅用于结构固证演示，暂不能作为真实经营复签依据。',
    },
  ]
}

export async function loadHealthScoreSnapshot(storeId: string): Promise<HealthScoreSnapshot> {
  const dimensions = HEALTH_DIMENSIONS.map((item) => ({ ...item }))

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'store-health-score-fallback',
    storeId,
    dimensions,
    history: HEALTH_HISTORY.map((item) => ({ ...item })),
    diagnostics: buildHealthScoreDiagnostics(storeId),
    summary: buildHealthScoreSummary(dimensions),
    generatedAt: '2026-07-27T18:42:00.000Z',
    controlPlaneSource: 'loadHealthScoreSnapshot fallback -> HEALTH_DIMENSIONS + derived summary',
    businessDataSource: 'local health-score samples + derived counts and monthly history',
    refreshPath: `HealthScorePage -> loadHealthScoreSnapshot(${storeId})`,
    note: '当前页面消费本地健康评分快照，适用于来源态透明化、结构固证与交互演示，不作为正式门店健康考核结论。',
    error: '门店健康评分尚未接入正式指标服务回源，当前展示 fallback 样本快照。',
  }
}
