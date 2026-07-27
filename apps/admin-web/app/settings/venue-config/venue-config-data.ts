export type VenueFacilityStatus = 'operating' | 'maintenance'

export interface VenueFacility {
  name: string
  count: number
  status: VenueFacilityStatus
  manager: string
  utilization: string
}

export interface VenueOperationWindow {
  key: string
  value: string
  hint: string
}

export interface VenueConfigSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'local-venue-config-snapshot'
  facilities: VenueFacility[]
  operationWindows: VenueOperationWindow[]
  generatedAt: string
}

export const VENUE_FACILITIES: VenueFacility[] = [
  { name: '羽毛球场地', count: 8, status: 'operating', manager: '王班长', utilization: '工作日 76%' },
  { name: '篮球场地', count: 4, status: 'operating', manager: '刘调度', utilization: '工作日 68%' },
  { name: '乒乓球台', count: 6, status: 'operating', manager: '陈值班', utilization: '工作日 71%' },
  { name: '游泳馆', count: 1, status: 'maintenance', manager: '赵工程', utilization: '本周检修中' },
]

export const VENUE_OPERATION_WINDOWS: VenueOperationWindow[] = [
  { key: '工作日营业时间', value: '09:00 - 22:00', hint: '高峰集中在 18:00 - 21:00' },
  { key: '周末及节假日', value: '08:00 - 23:00', hint: '需额外排班 2 名巡场人员' },
  { key: '预约提前时间', value: '提前 30 分钟', hint: '统一由门店运营控制面下发' },
  { key: '最长预约时长', value: '4 小时', hint: '超时需人工审核' },
  { key: '取消预约时限', value: '提前 2 小时', hint: '逾期取消将扣减信用分' },
]

export function summarizeVenueConfig(facilities: VenueFacility[]) {
  const totalFacilityCount = facilities.reduce((sum, item) => sum + item.count, 0)
  const operatingCount = facilities.filter((item) => item.status === 'operating').length
  const maintenanceCount = facilities.filter((item) => item.status === 'maintenance').length
  return {
    totalFacilityCount,
    operatingCount,
    maintenanceCount,
  }
}

export async function loadVenueConfigSnapshot(): Promise<VenueConfigSnapshot> {
  return {
    deliveryMode: 'fallback',
    sourceLabel: 'local-venue-config-snapshot',
    facilities: VENUE_FACILITIES,
    operationWindows: VENUE_OPERATION_WINDOWS,
    generatedAt: new Date().toISOString(),
  }
}
