export interface CohortMatrix {
  cohort: string
  size: number
  retention: number[]
}

export interface FunnelResult {
  id: string
  name: string
  totalConversionRate: number
  stepResults: Array<{
    stepName: string
    enteredCount: number
    conversionRate: number
    dropOffRate: number
  }>
}

export interface RetentionHealth {
  score: number
  level: 'POOR' | 'FAIR' | 'GOOD' | 'EXCELLENT'
  d1: number
  d7: number
  d30: number
  recommendations: string[]
}

export interface MetricCard {
  name: string
  value: number
  unit: string
  trend?: 'UP' | 'DOWN' | 'STABLE'
}

export interface MetricsSummary {
  tenantId: string
  period: string
  metrics: MetricCard[]
}

export interface CDCStatus {
  currentWatermark: number
  events: number
}

export interface LiveEvent {
  id: string
  type: string
  who: string
  what: string
  revenueCents?: number
  timestamp: string
}

export interface AnalyticsV2SnapshotDelivery {
  deliveryMode: 'mock'
  tenantId: string
  cohorts: CohortMatrix[]
  funnels: FunnelResult[]
  retentionHealth: RetentionHealth
  summary: MetricsSummary
  cdcStatus: CDCStatus
  recentEvents: LiveEvent[]
  generatedAt: string
}

export async function loadAnalyticsV2Snapshot(): Promise<AnalyticsV2SnapshotDelivery> {
  const generatedAt = new Date().toISOString()
  return {
    deliveryMode: 'mock',
    tenantId: 'demo-tenant',
    generatedAt,
    cohorts: [
      { cohort: '2025-W22', size: 120, retention: [1, 0.45, 0.32, 0.21, 0.15, 0.1] },
      { cohort: '2025-W23', size: 145, retention: [1, 0.52, 0.38, 0.25, 0.18, 0.12] },
      { cohort: '2025-W24', size: 168, retention: [1, 0.48, 0.35, 0.22, 0.16, 0.11] },
      { cohort: '2025-W25', size: 192, retention: [1, 0.55, 0.42, 0.28, 0.2, 0.14] },
      { cohort: '2025-W26', size: 215, retention: [1, 0.58, 0.45, 0.3, 0.22, 0.15] },
    ],
    funnels: [
      {
        id: 'f1',
        name: '电商转化漏斗',
        totalConversionRate: 0.18,
        stepResults: [
          { stepName: '浏览商品', enteredCount: 1000, conversionRate: 1, dropOffRate: 0 },
          { stepName: '加入购物车', enteredCount: 450, conversionRate: 0.45, dropOffRate: 0.55 },
          { stepName: '提交订单', enteredCount: 280, conversionRate: 0.62, dropOffRate: 0.38 },
          { stepName: '完成支付', enteredCount: 180, conversionRate: 0.64, dropOffRate: 0.36 },
        ],
      },
    ],
    retentionHealth: {
      score: 72,
      level: 'GOOD',
      d1: 0.55,
      d7: 0.32,
      d30: 0.18,
      recommendations: ['D1 表现良好', '建议增加 7 日回流激励', '继续观察 D30 留存变化'],
    },
    summary: {
      tenantId: 'demo-tenant',
      period: '7d',
      metrics: [
        { name: '总事件数', value: 12580, unit: 'count', trend: 'UP' },
        { name: '活跃会员数', value: 3450, unit: 'members', trend: 'UP' },
        { name: '转化率', value: 0.062, unit: 'ratio', trend: 'UP' },
        { name: '点击率', value: 0.182, unit: 'ratio', trend: 'STABLE' },
        { name: '营收', value: 12580000, unit: 'cents', trend: 'UP' },
      ],
    },
    cdcStatus: { currentWatermark: Date.now(), events: 1248 },
    recentEvents: [
      { id: 'e1', type: 'PAGEVIEW', who: 'm1', what: 'home', timestamp: generatedAt },
      { id: 'e2', type: 'CLICK', who: 'm2', what: 'add_cart', timestamp: generatedAt },
      { id: 'e3', type: 'PURCHASE', who: 'm3', what: 'checkout', revenueCents: 12800, timestamp: generatedAt },
    ],
  }
}
