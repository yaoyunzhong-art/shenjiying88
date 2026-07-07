/**
 * 报表/看板 - 类型 (V10 Day 7)
 */

export type ReportPeriod = 'daily' | 'weekly' | 'monthly' | 'custom'

export type ReportMetric =
  | 'sales.amount' | 'sales.count' | 'member.new' | 'member.active'
  | 'inventory.turnover' | 'marketing.roi' | 'ai.tokens' | 'ai.latency'

export type ReportDimension =
  | 'store' | 'tenant' | 'brand' | 'category' | 'product' | 'campaign' | 'member_tier'

export type CardDisplay = 'line' | 'bar' | 'pie' | 'number' | 'table' | 'heatmap'

export interface ReportDefinition {
  id: string
  name: string
  period: ReportPeriod
  metrics: ReportMetric[]
  dimensions: ReportDimension[]
  source: 'orders' | 'members' | 'inventory' | 'marketing' | 'ai_logs'
  cacheTtl: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

export interface ReportDataPoint {
  bucket: string
  dimension: string
  metric: ReportMetric
  value: number
  yoy?: number
  qoq?: number
}

export interface DashboardCard {
  id: string
  reportId: string
  display: CardDisplay
  title: string
  size: { w: number; h: number }
  position: { x: number; y: number }
  config?: Record<string, unknown>
}

export interface DashboardLayout {
  id: string
  name: string
  cards: DashboardCard[]
  ownerId: string
  isShared: boolean
  createdAt: string
  updatedAt: string
}

export interface ReportQueryResponse {
  reportId: string
  period: ReportPeriod
  generatedAt: string
  data: ReportDataPoint[]
  totalPoints: number
}

export const METRIC_LABELS: Record<ReportMetric, string> = {
  'sales.amount': '销售额', 'sales.count': '订单数',
  'member.new': '新增会员', 'member.active': '活跃会员',
  'inventory.turnover': '库存周转', 'marketing.roi': '营销 ROI',
  'ai.tokens': 'AI Token', 'ai.latency': 'AI 延迟',
}

export const METRIC_UNITS: Record<ReportMetric, string> = {
  'sales.amount': '元', 'sales.count': '单',
  'member.new': '人', 'member.active': '人',
  'inventory.turnover': '%', 'marketing.roi': '倍',
  'ai.tokens': 'tokens', 'ai.latency': 'ms',
}

export const DISPLAY_LABELS: Record<CardDisplay, string> = {
  line: '折线图', bar: '柱状图', pie: '饼图',
  number: '数字', table: '表格', heatmap: '热力图',
}
