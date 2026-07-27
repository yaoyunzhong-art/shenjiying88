export type DeviceStatus = 'online' | 'offline' | 'maintenance' | 'fault'

export interface StoreDevice {
  id: string
  name: string
  type: string
  location: string
  status: DeviceStatus
  lastMaintenance: string
  nextMaintenance: string
  usageHours: number
  warranty?: string
}

export interface DeviceMaintenanceLog {
  id: string
  deviceName: string
  type: string
  time: string
  technician: string
  note: string
}

export interface DeviceDiagnostic {
  id: string
  title: string
  status: 'stable' | 'watch' | 'risk'
  detail: string
}

export interface DevicesSummary {
  total: number
  online: number
  offline: number
  maintenance: number
  fault: number
  overdue: number
  warrantyExpired: number
  deviceTypes: number
  onlinePct: number
}

export interface DevicesSnapshot {
  deliveryMode: 'fallback'
  sourceLabel: 'store-devices-fallback'
  storeId: string
  devices: StoreDevice[]
  maintenanceLogs: DeviceMaintenanceLog[]
  diagnostics: DeviceDiagnostic[]
  summary: DevicesSummary
  generatedAt: string
  controlPlaneSource: string
  businessDataSource: string
  refreshPath: string
  note: string
  error?: string
}

export const DEVICE_STATUS_META: Record<DeviceStatus, { color: string; label: string }> = {
  online: { color: 'green', label: '在线' },
  offline: { color: 'default', label: '离线' },
  maintenance: { color: 'orange', label: '维护中' },
  fault: { color: 'red', label: '故障' },
}

export const STORE_DEVICES: StoreDevice[] = [
  { id: 'DEV-001', name: 'VR-01', type: 'VR设备', location: 'A区-VR体验区', status: 'online', lastMaintenance: '2026-07-01', nextMaintenance: '2026-08-01', usageHours: 1860, warranty: '2027-03' },
  { id: 'DEV-002', name: 'PS5-01', type: '游戏主机', location: 'B区-主机区', status: 'online', lastMaintenance: '2026-06-15', nextMaintenance: '2026-07-15', usageHours: 3200, warranty: '2027-06' },
  { id: 'DEV-003', name: '赛车模拟器', type: '模拟设备', location: 'C区-竞赛区', status: 'maintenance', lastMaintenance: '2026-07-10', nextMaintenance: '2026-07-17', usageHours: 980, warranty: '2028-09' },
  { id: 'DEV-004', name: '投篮机-01', type: '彩票机', location: 'D区-娱乐区', status: 'online', lastMaintenance: '2026-06-20', nextMaintenance: '2026-07-20', usageHours: 4500, warranty: '2027-01' },
  { id: 'DEV-005', name: '收银POS-01', type: 'POS机', location: '前台收银台', status: 'fault', lastMaintenance: '2026-06-10', nextMaintenance: '2026-07-10', usageHours: 5800, warranty: '过期' },
  { id: 'DEV-006', name: '台球桌-01', type: '台球桌', location: 'B区-台球区', status: 'offline', lastMaintenance: '2026-06-25', nextMaintenance: '2026-07-25', usageHours: 1200, warranty: '2028-06' },
  { id: 'DEV-007', name: '空调-01', type: '环境', location: '大厅', status: 'online', lastMaintenance: '2026-05-01', nextMaintenance: '2026-08-01', usageHours: 7200, warranty: '过期' },
  { id: 'DEV-008', name: '音响系统', type: '音频', location: '大厅', status: 'online', lastMaintenance: '2026-06-01', nextMaintenance: '2026-09-01', usageHours: 3600, warranty: '2027-12' },
]

export const DEVICE_MAINTENANCE_LOGS: DeviceMaintenanceLog[] = [
  { id: 'M-01', deviceName: 'VR-01', type: '固件升级', time: '2026-07-10 09:00', technician: '赵六', note: '固件升级至 v3.2.1' },
  { id: 'M-02', deviceName: '赛车模拟器', type: '零部件更换', time: '2026-07-10 14:00', technician: '赵六', note: '踏板弹簧更换' },
  { id: 'M-03', deviceName: 'PS5-01', type: '清洁', time: '2026-07-08 10:00', technician: '清洁组', note: '全面清灰与散热检查' },
  { id: 'M-04', deviceName: '投篮机-01', type: '校准', time: '2026-07-05 15:00', technician: '赵六', note: '传感器校准' },
]

export function buildDevicesSummary(devices: StoreDevice[]): DevicesSummary {
  const total = devices.length
  const online = devices.filter((item) => item.status === 'online').length
  const offline = devices.filter((item) => item.status === 'offline').length
  const maintenance = devices.filter((item) => item.status === 'maintenance').length
  const fault = devices.filter((item) => item.status === 'fault').length

  return {
    total,
    online,
    offline,
    maintenance,
    fault,
    overdue: devices.filter((item) => item.nextMaintenance < '2026-07-27').length,
    warrantyExpired: devices.filter((item) => item.warranty === '过期').length,
    deviceTypes: new Set(devices.map((item) => item.type)).size,
    onlinePct: Math.round((online / total) * 100),
  }
}

export function buildDevicesDiagnostics(storeId: string): DeviceDiagnostic[] {
  return [
    {
      id: 'devices-source',
      title: '资产快照已拆层',
      status: 'stable',
      detail: `门店 ${storeId} 设备资产、维护记录与统计摘要均由 snapshot loader 下发。`,
    },
    {
      id: 'devices-maintenance',
      title: '维护闭环待联调',
      status: 'watch',
      detail: '维护申请和报修动作仍为演示态，尚未接入真实工单系统。',
    },
    {
      id: 'devices-iot',
      title: '实时 IoT 状态未接入',
      status: 'risk',
      detail: '在线 / 离线状态仍来自 fallback 样本，正式状态需接入设备遥测。',
    },
  ]
}

export async function loadDevicesSnapshot(storeId: string): Promise<DevicesSnapshot> {
  const devices = STORE_DEVICES.map((item) => ({ ...item }))

  return {
    deliveryMode: 'fallback',
    sourceLabel: 'store-devices-fallback',
    storeId,
    devices,
    maintenanceLogs: DEVICE_MAINTENANCE_LOGS.map((item) => ({ ...item })),
    diagnostics: buildDevicesDiagnostics(storeId),
    summary: buildDevicesSummary(devices),
    generatedAt: '2026-07-27T18:20:00.000Z',
    controlPlaneSource: 'loadDevicesSnapshot fallback -> STORE_DEVICES + buildDevicesSummary',
    businessDataSource: 'local asset register + maintenance logs + derived device statistics',
    refreshPath: `DevicesPage -> loadDevicesSnapshot(${storeId})`,
    note: '当前页面消费本地设备资产快照，适用于来源态透明化、结构固证与交互演示，不作为实时设备遥测证据。',
    error: '设备状态与维护工单尚未接入实时 IoT/ITSM 上游，当前展示 fallback 样本快照。',
  }
}
