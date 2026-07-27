export interface RevenueRow {
  month: string
  revenue: number
  cost: number
  roi: string
  leads: number
  conversion: string
  [key: string]: unknown
}

export interface BrandMetric {
  brand: string
  posts: number
  reach: number
  engagement: string
  sentiment: string
  [key: string]: unknown
}

export interface BrandDashboardSnapshot {
  deliveryMode: 'mock'
  sourceLabel: 'dev-tools-brand-dashboard-mock'
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  revenue: RevenueRow[]
  brandMetrics: BrandMetric[]
}

const REVENUE: RevenueRow[] = [
  { month: '1月', revenue: 128000, cost: 72000, roi: '56%', leads: 45, conversion: '33%' },
  { month: '2月', revenue: 145000, cost: 78000, roi: '60%', leads: 52, conversion: '35%' },
  { month: '3月', revenue: 162000, cost: 85000, roi: '62%', leads: 58, conversion: '34%' },
  { month: '4月', revenue: 158000, cost: 82000, roi: '61%', leads: 48, conversion: '38%' },
  { month: '5月', revenue: 175000, cost: 88000, roi: '66%', leads: 55, conversion: '36%' },
  { month: '6月', revenue: 192000, cost: 95000, roi: '67%', leads: 62, conversion: '40%' },
]

const BRAND_METRICS: BrandMetric[] = [
  { brand: '火星蹦床公园', posts: 28, reach: 45000, engagement: '3.2%', sentiment: '正82%' },
  { brand: '银河电竞馆', posts: 18, reach: 32000, engagement: '4.1%', sentiment: '正78%' },
  { brand: '极速卡丁车', posts: 22, reach: 28000, engagement: '2.8%', sentiment: '正85%' },
]

export async function loadBrandDashboardSnapshot(): Promise<BrandDashboardSnapshot> {
  return {
    deliveryMode: 'mock',
    sourceLabel: 'dev-tools-brand-dashboard-mock',
    generatedAt: new Date().toISOString(),
    controlPlaneSource: 'loadBrandDashboardSnapshot -> local E54 snapshot shell',
    businessDataSource: 'brand-dashboard-data.ts mock dashboard rows',
    refreshPath: 'BrandDashboardPage -> loadBrandDashboardSnapshot',
    note: '当前页面已按 E54 三层模板壳层化，营收趋势与品牌社媒表现仍使用本地 mock 数据。',
    revenue: REVENUE,
    brandMetrics: BRAND_METRICS,
  }
}
