export interface AnalyticsTrendPoint {
  day: string
  revenue: number
  traffic: number
  deviceUsage: number
  newMember: number
  avgOrder: number
}

export interface AnalyticsCategoryItem {
  category: string
  amount: number
  ratio: number
  trend: string
  items: string
}

export interface AnalyticsTrafficSlot {
  hour: string
  traffic: number
}

export interface AnalyticsDeviceRank {
  name: string
  usage: number
  revenue: number
}

export interface AnalyticsDiagnostic {
  id: string
  title: string
  status: 'stable' | 'watch' | 'risk'
  detail: string
}

export interface AnalyticsSummary {
  totalRevenue: number
  averageRevenue: number
  totalTraffic: number
  averageTraffic: number
  averageOrder: number
  totalNewMembers: number
  trendPercent: number
  topDeviceUsage: number
}

export interface AnalyticsSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'store-analytics-fallback'
  storeId: string
  trends: AnalyticsTrendPoint[]
  categories: AnalyticsCategoryItem[]
  trafficDistribution: AnalyticsTrafficSlot[]
  topDevices: AnalyticsDeviceRank[]
  diagnostics: AnalyticsDiagnostic[]
  summary: AnalyticsSummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const ANALYTICS_TRENDS: AnalyticsTrendPoint[] = [
  { day: '07/07', revenue: 14500, traffic: 320, deviceUsage: 82, newMember: 12, avgOrder: 45 },
  { day: '07/08', revenue: 12600, traffic: 280, deviceUsage: 76, newMember: 8, avgOrder: 45 },
  { day: '07/09', revenue: 15200, traffic: 340, deviceUsage: 85, newMember: 15, avgOrder: 45 },
  { day: '07/10', revenue: 13800, traffic: 310, deviceUsage: 79, newMember: 10, avgOrder: 45 },
  { day: '07/11', revenue: 16100, traffic: 360, deviceUsage: 88, newMember: 18, avgOrder: 45 },
  { day: '07/12', revenue: 17900, traffic: 400, deviceUsage: 91, newMember: 22, avgOrder: 45 },
  { day: '07/13', revenue: 15800, traffic: 350, deviceUsage: 84, newMember: 14, avgOrder: 45 },
]

export const ANALYTICS_CATEGORIES: AnalyticsCategoryItem[] = [
  { category: '游戏收入', amount: 56000, ratio: 39, trend: 'up', items: '主机 / VR / 彩票机' },
  { category: '会员充值', amount: 48000, ratio: 33, trend: 'up', items: '充值卡 / 套餐' },
  { category: '饮品销售', amount: 18500, ratio: 13, trend: 'stable', items: '水饮 / 零食' },
  { category: '门票收入', amount: 12500, ratio: 9, trend: 'down', items: '入场 / 通票' },
  { category: '其他', amount: 10000, ratio: 6, trend: 'up', items: '礼品 / 活动' },
]

export const ANALYTICS_TRAFFIC_DISTRIBUTION: AnalyticsTrafficSlot[] = [
  { hour: '09-10', traffic: 20 },
  { hour: '10-11', traffic: 45 },
  { hour: '11-12', traffic: 60 },
  { hour: '12-14', traffic: 85 },
  { hour: '14-16', traffic: 120 },
  { hour: '16-18', traffic: 95 },
  { hour: '18-20', traffic: 70 },
  { hour: '20-22', traffic: 55 },
]

export const ANALYTICS_TOP_DEVICES: AnalyticsDeviceRank[] = [
  { name: 'PS5-01', usage: 92, revenue: 4200 },
  { name: 'VR-01', usage: 88, revenue: 3800 },
  { name: '投篮机-01', usage: 85, revenue: 2100 },
  { name: '赛车模拟器', usage: 76, revenue: 1800 },
  { name: '跳绳机', usage: 72, revenue: 1500 },
]

export function buildAnalyticsSummary(trends: AnalyticsTrendPoint[]): AnalyticsSummary {
  const totalRevenue = trends.reduce((sum, item) => sum + item.revenue, 0)
  const totalTraffic = trends.reduce((sum, item) => sum + item.traffic, 0)
  const totalNewMembers = trends.reduce((sum, item) => sum + item.newMember, 0)

  return {
    totalRevenue,
    averageRevenue: Math.round(totalRevenue / trends.length),
    totalTraffic,
    averageTraffic: Math.round(totalTraffic / trends.length),
    averageOrder: Math.round(trends.reduce((sum, item) => sum + item.avgOrder, 0) / trends.length),
    totalNewMembers,
    trendPercent: Math.round(((trends[trends.length - 1].revenue - trends[0].revenue) / trends[0].revenue) * 100),
    topDeviceUsage: Math.max(...ANALYTICS_TOP_DEVICES.map((item) => item.usage)),
  }
}

export function buildAnalyticsDiagnostics(storeId: string): AnalyticsDiagnostic[] {
  return [
    {
      id: 'analytics-source',
      title: '来源态已透出',
      status: 'stable',
      detail: `门店 ${storeId} 当前通过 snapshot loader 下发经营分析样本。`,
    },
    {
      id: 'analytics-traffic',
      title: '高峰客流待联动',
      status: 'watch',
      detail: '时段客流仍为本地样本，尚未与实时闸机和预约热度闭环。',
    },
    {
      id: 'analytics-export',
      title: '导出链路仍为演示态',
      status: 'risk',
      detail: '经营分析导出只做结构固证，正式报表仍需接入真实数仓任务。',
    },
  ]
}

export async function loadAnalyticsSnapshot(storeId: string): Promise<AnalyticsSnapshot> {
  const trends = ANALYTICS_TRENDS.map((item) => ({ ...item }))

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'store-analytics-fallback',
    storeId,
    trends,
    categories: ANALYTICS_CATEGORIES.map((item) => ({ ...item })),
    trafficDistribution: ANALYTICS_TRAFFIC_DISTRIBUTION.map((item) => ({ ...item })),
    topDevices: ANALYTICS_TOP_DEVICES.map((item) => ({ ...item })),
    diagnostics: buildAnalyticsDiagnostics(storeId),
    summary: buildAnalyticsSummary(trends),
    generatedAt: '2026-07-27T18:10:00.000Z',
    controlPlaneSource: 'loadAnalyticsSnapshot fallback -> ANALYTICS_TRENDS + derived summary',
    businessDataSource: 'local analytics samples + derived category, traffic and device rankings',
    refreshPath: `AnalyticsPage -> loadAnalyticsSnapshot(${storeId})`,
    note: '当前页面消费本地经营分析快照，适用于来源态透明化、结构固证与交互演示，不作为实时经营复签证据。',
    error: '门店经营分析尚未接入实时数仓回源，当前展示 fallback 样本快照。',
  }
}
