export interface ShopAnalyticsSummary {
  revenueCents: number
  orders: number
  visitors: number
  conversionRate: number
  avgOrderValueCents: number
}

export interface ShopAnalyticsTrendPoint {
  date: string
  revenueCents: number
  orders: number
  visitors: number
}

export interface ShopAnalyticsProductRank {
  id: string
  name: string
  orders: number
  revenueCents: number
}

export interface ShopAnalyticsChannel {
  name: string
  visitors: number
  orders: number
  conversionRate: number
}

export interface ShopAnalyticsSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-shop-analytics-snapshot'
  summary: ShopAnalyticsSummary
  trends: ShopAnalyticsTrendPoint[]
  topProducts: ShopAnalyticsProductRank[]
  channels: ShopAnalyticsChannel[]
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
}

export const SHOP_ANALYTICS_POINTS: ShopAnalyticsTrendPoint[] = [
  { date: '07-01', revenueCents: 1820000, orders: 128, visitors: 2140 },
  { date: '07-02', revenueCents: 1765000, orders: 121, visitors: 2088 },
  { date: '07-03', revenueCents: 1942000, orders: 136, visitors: 2274 },
  { date: '07-04', revenueCents: 2013000, orders: 143, visitors: 2398 },
  { date: '07-05', revenueCents: 2256000, orders: 158, visitors: 2510 },
  { date: '07-06', revenueCents: 2312000, orders: 162, visitors: 2604 },
  { date: '07-07', revenueCents: 2484000, orders: 171, visitors: 2786 },
  { date: '07-08', revenueCents: 2148000, orders: 149, visitors: 2466 },
  { date: '07-09', revenueCents: 2196000, orders: 153, visitors: 2482 },
  { date: '07-10', revenueCents: 2284000, orders: 156, visitors: 2524 },
  { date: '07-11', revenueCents: 2368000, orders: 165, visitors: 2610 },
  { date: '07-12', revenueCents: 2590000, orders: 178, visitors: 2854 },
  { date: '07-13', revenueCents: 2643000, orders: 182, visitors: 2910 },
  { date: '07-14', revenueCents: 2726000, orders: 188, visitors: 3028 },
]

export const SHOP_ANALYTICS_TOP_PRODUCTS: ShopAnalyticsProductRank[] = [
  { id: 'sku-201', name: '旗舰会员卡', orders: 238, revenueCents: 1896000 },
  { id: 'sku-118', name: '扭蛋礼包', orders: 194, revenueCents: 1183000 },
  { id: 'sku-087', name: '游戏币 200 枚', orders: 181, revenueCents: 905000 },
  { id: 'sku-320', name: '暑期畅玩券', orders: 165, revenueCents: 792000 },
]

export const SHOP_ANALYTICS_CHANNELS: ShopAnalyticsChannel[] = [
  { name: '私域社群', visitors: 4850, orders: 362, conversionRate: 7.46 },
  { name: '门店自然流量', visitors: 8120, orders: 511, conversionRate: 6.29 },
  { name: '短视频投流', visitors: 4260, orders: 215, conversionRate: 5.05 },
  { name: '搜索广告', visitors: 3180, orders: 141, conversionRate: 4.43 },
]

function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((total, item) => total + selector(item), 0)
}

export async function loadShopAnalyticsSnapshot(): Promise<ShopAnalyticsSnapshot> {
  const revenueCents = sumBy(SHOP_ANALYTICS_POINTS, (item) => item.revenueCents)
  const orders = sumBy(SHOP_ANALYTICS_POINTS, (item) => item.orders)
  const visitors = sumBy(SHOP_ANALYTICS_POINTS, (item) => item.visitors)

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-shop-analytics-snapshot',
    summary: {
      revenueCents,
      orders,
      visitors,
      conversionRate: Number(((orders / visitors) * 100).toFixed(2)),
      avgOrderValueCents: Math.round(revenueCents / orders),
    },
    trends: SHOP_ANALYTICS_POINTS,
    topProducts: SHOP_ANALYTICS_TOP_PRODUCTS,
    channels: SHOP_ANALYTICS_CHANNELS,
    generatedAt: '2026-07-27T09:30:00.000Z',
    controlPlaneSource: 'loadShopAnalyticsSnapshot -> SHOP_ANALYTICS_POINTS',
    businessDataSource: 'local shop analytics sample records',
    refreshPath: 'ShopAnalyticsPage -> loadShopAnalyticsSnapshot',
    note: '当前页面消费本地店铺经营分析快照，仅用于结构固证与交互演示。',
  }
}
