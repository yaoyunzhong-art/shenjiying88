export interface AdminDashboardOverview {
  totalTenants: number
  totalStores: number
  totalRevenue: number
  activeUsers: number
}

export interface RevenueTrendPoint {
  day: string
  revenue: number
}

export interface RegionStat {
  region: string
  count: number
  percentage: number
}

export interface NewTenantPoint {
  month: string
  count: number
}

export interface DashboardAlert {
  id: string
  severity: 'critical' | 'warning' | 'info'
  source: string
  message: string
  time: string
  status: string
}

export interface AdminDashboardSnapshotDelivery {
  deliveryMode: 'mock'
  overview: AdminDashboardOverview
  revenueTrend: RevenueTrendPoint[]
  regionStats: RegionStat[]
  newTenantTrend: NewTenantPoint[]
  alerts: DashboardAlert[]
  generatedAt: string
}

export const defaultOverview: AdminDashboardOverview = {
  totalTenants: 128,
  totalStores: 1847,
  totalRevenue: 45280000,
  activeUsers: 456000,
}

export const defaultRevenueTrend: RevenueTrendPoint[] = [
  { day: '07-01', revenue: 388000 },
  { day: '07-05', revenue: 402000 },
  { day: '07-10', revenue: 421000 },
  { day: '07-15', revenue: 436000 },
  { day: '07-20', revenue: 451000 },
  { day: '07-25', revenue: 468000 },
  { day: '07-30', revenue: 482000 },
]

export const defaultRegionStats: RegionStat[] = [
  { region: '华东', count: 486, percentage: 26.3 },
  { region: '华南', count: 352, percentage: 19.1 },
  { region: '华北', count: 298, percentage: 16.1 },
  { region: '华中', count: 215, percentage: 11.6 },
  { region: '西南', count: 198, percentage: 10.7 },
  { region: '西北', count: 156, percentage: 8.5 },
  { region: '东北', count: 142, percentage: 7.7 },
]

export const defaultNewTenantTrend: NewTenantPoint[] = [
  { month: '2026-02', count: 9 },
  { month: '2026-03', count: 14 },
  { month: '2026-04', count: 16 },
  { month: '2026-05', count: 13 },
  { month: '2026-06', count: 18 },
  { month: '2026-07', count: 20 },
]

export const defaultAlerts: DashboardAlert[] = [
  { id: 'ALT-001', severity: 'critical', source: '支付网关', message: '华东区支付网关响应延迟 > 5s', time: '2026-07-12 02:15:23', status: '未处理' },
  { id: 'ALT-002', severity: 'critical', source: '数据库', message: '主库写入队列堆积超过阈值 (85%)', time: '2026-07-12 01:48:07', status: '处理中' },
  { id: 'ALT-003', severity: 'warning', source: 'API网关', message: '华南区 API 请求错误率上升至 7.2%', time: '2026-07-12 00:32:11', status: '已确认' },
  { id: 'ALT-004', severity: 'warning', source: '缓存服务', message: 'Redis 集群内存使用率达 82%', time: '2026-07-11 23:55:44', status: '未处理' },
  { id: 'ALT-005', severity: 'info', source: '部署服务', message: 'v3.8.2 灰度发布完成 (25% 流量)', time: '2026-07-11 22:30:00', status: '已关闭' },
]

export async function loadAdminDashboardSnapshot(): Promise<AdminDashboardSnapshotDelivery> {
  return {
    deliveryMode: 'mock',
    overview: defaultOverview,
    revenueTrend: defaultRevenueTrend,
    regionStats: defaultRegionStats,
    newTenantTrend: defaultNewTenantTrend,
    alerts: defaultAlerts,
    generatedAt: new Date().toISOString(),
  }
}
