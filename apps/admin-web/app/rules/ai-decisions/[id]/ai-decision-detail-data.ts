export type AiDecisionStatus = 'executing' | 'success' | 'failure' | 'rejected' | 'timeout'
export type DecisionCategory = 'pricing' | 'inventory' | 'promotion' | 'allocation' | 'recommendation'

export interface AiDecisionDetail {
  id: string
  ruleName: string
  ruleId: string
  status: AiDecisionStatus
  category: DecisionCategory
  confidence: number
  executionMs: number
  triggeredBy: string
  triggeredAt: string
  completedAt: string
  inputContext: Record<string, unknown>
  reasoning: string
  decision: Record<string, unknown>
  expectedOutcome: string
  actualOutcome: string | null
  deviationScore: number | null
  anomalyFlags: string[]
  retryCount: number
  version: string
}

export interface AiDecisionDetailSnapshotDelivery {
  deliveryMode: 'mock'
  sourceLabel: 'rules-ai-decision-detail-mock'
  generatedAt: string
  detail: AiDecisionDetail
}

const STATUSES: AiDecisionStatus[] = ['success', 'failure', 'rejected', 'timeout', 'executing']
const CATEGORIES: DecisionCategory[] = ['pricing', 'inventory', 'promotion', 'allocation', 'recommendation']

function hashCode(input: string): number {
  let hash = 0
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(index)
    hash |= 0
  }
  return hash
}

export function buildAiDecisionDetail(id: string): AiDecisionDetail {
  const safeId = id || 'decision-001'
  const seed = Math.abs(hashCode(safeId))
  const status = STATUSES[seed % STATUSES.length] ?? 'executing'
  const category = CATEGORIES[seed % CATEGORIES.length] ?? 'pricing'
  const confidence = Number((status === 'success' ? 0.9 : 0.52 + (seed % 18) / 100).toFixed(2))
  const completedAt = `2026-07-${String((seed % 28) + 1).padStart(2, '0')}T${String(10 + (seed % 10)).padStart(2, '0')}:${String((seed * 3) % 60).padStart(2, '0')}:00Z`

  return {
    id: safeId,
    ruleName: `AI 决策规则 ${safeId.slice(-4)}`,
    ruleId: `rule-${safeId.slice(-4)}`,
    status,
    category,
    confidence,
    executionMs: 280 + (seed % 2400),
    triggeredBy: 'system:cron',
    triggeredAt: `2026-07-${String(((seed + 3) % 28) + 1).padStart(2, '0')}T08:00:00Z`,
    completedAt,
    inputContext: {
      storeId: 'store-sh-001',
      productSku: `SKU-${1000 + (seed % 9000)}`,
      currentPrice: 129,
      competitorPrice: 118,
      inventoryLevel: 342,
      salesVelocity: 'high',
      timeWindow: 'promo-period',
    },
    reasoning:
      '基于库存、竞品价格与时段流量，当前推荐以更保守的价格带完成一次受控试探，同时保留监控回放窗口。',
    decision: {
      recommendedPrice: 118,
      originalPrice: 129,
      discountRate: 0.915,
      expectedSalesLift: 0.15,
      riskLevel: status === 'success' ? 'low' : 'medium',
    },
    expectedOutcome: '预计销量提升 12% 到 15%，库存周转天数缩短 2 到 3 天。',
    actualOutcome: status === 'success' ? '实际销量提升 13.2%，库存周转天数缩短 2.5 天。' : null,
    deviationScore: status === 'success' ? 0.12 : status === 'failure' ? 0.31 : null,
    anomalyFlags:
      status === 'failure' || status === 'timeout'
        ? ['confidence_degradation', 'deviation_exceeded_threshold']
        : status === 'rejected'
          ? ['manually_reverted']
          : [],
    retryCount: status === 'success' ? 0 : 2,
    version: 'ai-model-v2.3.1',
  }
}

export async function loadAiDecisionDetailSnapshot(
  id: string
): Promise<AiDecisionDetailSnapshotDelivery> {
  const detail = buildAiDecisionDetail(id)

  return {
    deliveryMode: 'mock',
    sourceLabel: 'rules-ai-decision-detail-mock',
    generatedAt: detail.completedAt,
    detail,
  }
}
