export interface RevenueTrendPoint {
  date: string
  revenue: number
  orders: number
  prevPeriodRevenue: number
}

export interface RevenueSourceBreakdown {
  id: 'membership' | 'games' | 'merchandise' | 'events'
  label: string
  amount: number
}

export interface RevenueSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'reports-revenue-mock'
  trend: RevenueTrendPoint[]
  sourceBreakdown: RevenueSourceBreakdown[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

const REVENUE_TREND: RevenueTrendPoint[] = [
  { date: '2026-07-21', revenue: 128600, orders: 412, prevPeriodRevenue: 116400 },
  { date: '2026-07-22', revenue: 136200, orders: 438, prevPeriodRevenue: 121300 },
  { date: '2026-07-23', revenue: 142800, orders: 465, prevPeriodRevenue: 126500 },
  { date: '2026-07-24', revenue: 151400, orders: 488, prevPeriodRevenue: 133100 },
  { date: '2026-07-25', revenue: 162900, orders: 526, prevPeriodRevenue: 145200 },
  { date: '2026-07-26', revenue: 174500, orders: 558, prevPeriodRevenue: 152800 },
  { date: '2026-07-27', revenue: 169300, orders: 541, prevPeriodRevenue: 149600 },
]

const SOURCE_BREAKDOWN: RevenueSourceBreakdown[] = [
  { id: 'membership', label: '会籍收入', amount: 138600 },
  { id: 'games', label: '游戏收入', amount: 403200 },
  { id: 'merchandise', label: '商品收入', amount: 227400 },
  { id: 'events', label: '团建包场', amount: 296500 },
]

export async function loadRevenueSnapshot(): Promise<RevenueSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'reports-revenue-mock',
    trend: REVENUE_TREND.map((item) => ({ ...item })),
    sourceBreakdown: SOURCE_BREAKDOWN.map((item) => ({ ...item })),
    generatedAt: '2026-07-27T16:40:00.000Z',
    controlPlaneSource: 'loadRevenueSnapshot -> REVENUE_TREND + SOURCE_BREAKDOWN',
    businessDataSource: 'local revenue report samples + derived revenue deltas',
    refreshPath: 'RevenuePage -> loadRevenueSnapshot()',
    note: '营收报表当前展示本地 revenue snapshot，趋势、来源拆分与同比差额均为 mock 固证样本。',
    error: '营收报表尚未接入实时报表编排服务，当前页面展示 mock 快照。',
  }
}
