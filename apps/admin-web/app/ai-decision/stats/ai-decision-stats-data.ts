import type { DonutSlice, GaugeSegment } from '@m5/ui'

export interface RuleStat {
  id: string
  name: string
  source: 'rule' | 'model' | 'hybrid'
  executionCount: number
  successCount: number
  avgResponseMs: number
  liftPercent: number
}

export interface AiDecisionSummary {
  totalDecisions: number
  adoptedCount: number
  rejectedCount: number
  pendingReviewCount: number
}

export interface AiDecisionStatsSnapshotDelivery {
  deliveryMode: 'mock'
  rules: RuleStat[]
  generatedAt: string
}

export const MOCK_RULES: RuleStat[] = [
  { id: 'r1', name: '动态定价规则', source: 'rule', executionCount: 1240, successCount: 1100, avgResponseMs: 38, liftPercent: 12.4 },
  { id: 'r2', name: '库存预警模型', source: 'model', executionCount: 980, successCount: 870, avgResponseMs: 210, liftPercent: 8.7 },
  { id: 'r3', name: '促销推荐 (混合)', source: 'hybrid', executionCount: 2100, successCount: 1650, avgResponseMs: 145, liftPercent: 15.2 },
  { id: 'r4', name: '会员等级分配', source: 'rule', executionCount: 640, successCount: 620, avgResponseMs: 22, liftPercent: 3.1 },
  { id: 'r5', name: '客诉预判模型', source: 'model', executionCount: 780, successCount: 610, avgResponseMs: 180, liftPercent: 10.0 },
  { id: 'r6', name: '套餐推荐 (混合)', source: 'hybrid', executionCount: 1500, successCount: 1300, avgResponseMs: 98, liftPercent: 18.3 },
]

export const RESULT_COLORS: Record<string, string> = {
  success: '#4ade80',
  partial: '#fbbf24',
  failure: '#f87171',
}

export const SOURCE_COLORS: Record<string, string> = {
  rule: '#60a5fa',
  model: '#a78bfa',
  hybrid: '#2dd4bf',
}

export const SEGMENTS: GaugeSegment[] = [
  { from: 0, to: 70, color: '#f87171', label: '需改进' },
  { from: 70, to: 90, color: '#fbbf24', label: '良好' },
  { from: 90, to: 100, color: '#4ade80', label: '优秀' },
]

function getLatestGeneratedAt(rules: RuleStat[]): string {
  if (rules.length === 0) return '—'
  return new Date().toISOString()
}

export async function loadAiDecisionStatsSnapshot(): Promise<AiDecisionStatsSnapshotDelivery> {
  return {
    deliveryMode: 'mock',
    rules: MOCK_RULES,
    generatedAt: getLatestGeneratedAt(MOCK_RULES),
  }
}

export function computeStats(rules: RuleStat[]) {
  const total = rules.reduce((sum, rule) => sum + rule.executionCount, 0)
  const success = rules.reduce((sum, rule) => sum + rule.successCount, 0)
  const avgResp =
    total > 0
      ? Math.round(
          rules.reduce((sum, rule) => sum + rule.avgResponseMs * rule.executionCount, 0) / total
        )
      : 0
  const avgLift =
    rules.length > 0
      ? +(rules.reduce((sum, rule) => sum + rule.liftPercent, 0) / rules.length).toFixed(1)
      : 0

  return {
    total,
    success,
    successRate: total > 0 ? +((success / total) * 100).toFixed(1) : 0,
    avgResp,
    avgLift,
  }
}

export function computeAiDecisionSummary(rules: RuleStat[]): AiDecisionSummary {
  const totalDecisions = rules.reduce((sum, rule) => sum + rule.executionCount, 0)
  const adoptedCount = rules.reduce((sum, rule) => sum + rule.successCount, 0)
  const rejectedCount = rules.reduce(
    (sum, rule) => sum + (rule.executionCount - rule.successCount),
    0
  )
  const pendingReviewCount = Math.round(totalDecisions * 0.05)

  return { totalDecisions, adoptedCount, rejectedCount, pendingReviewCount }
}

export function buildResultSlices(rules: RuleStat[]): DonutSlice[] {
  const success = rules.reduce((sum, rule) => sum + rule.successCount, 0)
  const partial = Math.round(success * 0.12)
  const failure =
    rules.reduce((sum, rule) => sum + (rule.executionCount - rule.successCount), 0) - partial

  return [
    {
      key: 'success',
      label: '成功',
      value: success,
      color: RESULT_COLORS.success,
    },
    {
      key: 'partial',
      label: '部分成功',
      value: Math.max(partial, 1),
      color: RESULT_COLORS.partial,
    },
    {
      key: 'failure',
      label: '失败',
      value: Math.max(failure, 1),
      color: RESULT_COLORS.failure,
    },
  ]
}

export function buildSourceSlices(rules: RuleStat[]): DonutSlice[] {
  const groups: Record<string, number> = {}

  for (const rule of rules) {
    groups[rule.source] = (groups[rule.source] ?? 0) + rule.executionCount
  }

  return Object.entries(groups).map(([key, value]) => ({
    key,
    label: key === 'rule' ? '规则引擎' : key === 'model' ? '模型推理' : '混合决策',
    value,
    color: SOURCE_COLORS[key] ?? '#94a3b8',
  }))
}

export function sortRulesByLift(rules: RuleStat[]): RuleStat[] {
  return [...rules].sort((left, right) => right.liftPercent - left.liftPercent)
}
