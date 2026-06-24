import type { RequestTenantContext } from '../tenant/tenant.types'

/**
 * LYT 设备类型枚举
 */
export enum LytDeviceType {
  GateReader = 'GATE_READER',
  PrizeMachine = 'PRIZE_MACHINE',
  CastScreen = 'CAST_SCREEN',
  Camera = 'CAMERA',
  Sensor = 'SENSOR'
}

/**
 * LYT 设备状态枚举
 */
export enum LytDeviceStatus {
  Online = 'ONLINE',
  Offline = 'OFFLINE',
  Maintenance = 'MAINTENANCE'
}

/**
 * LYT 设备实体核心属性
 */
export interface LytDevice {
  /** 设备唯一标识 */
  deviceId: string
  /** 租户上下文 */
  tenantContext: RequestTenantContext
  /** 所属门店 ID */
  storeId: string
  /** 设备类型 */
  deviceType: LytDeviceType
  /** 设备名称 */
  name: string
  /** 设备状态 */
  status: LytDeviceStatus
  /** 最后心跳时间 */
  lastHeartbeatAt?: string
  /** 注册时间 */
  registeredAt: string
  /** 固件版本 */
  firmwareVersion?: string
}

/**
 * LYT 连接会话实体
 */
export interface LytConnectionSession {
  /** 会话 ID */
  sessionId: string
  /** 关联设备 ID */
  deviceId: string
  /** 连接建立时间 */
  connectedAt: string
  /** 连接断开时间 */
  disconnectedAt?: string
  /** 连接状态 */
  status: 'ACTIVE' | 'CLOSED'
}

export interface LytResolvedConnection {
  vendor: string
  tenantId: string
  brandId?: string
  storeId: string
  vendorTenantId: string
  vendorBrandId?: string
  vendorStoreId: string
  endpoint: string
  authMode: string
  hasCredential: boolean
  credentialRef?: string
  capabilities: string[]
  connectionStatus: 'configured' | 'pending-configuration'
  source: 'prisma' | 'fallback'
  resolutionLevel?: 'store' | 'brand' | 'tenant' | 'fallback'
  resolutionKey?: string
  resolutionChain?: string[]
  healthStatus?: 'healthy' | 'stale' | 'pending-configuration'
  lastCheckedAt?: string
  updatedAt?: string
}

/**
 * LYT 设备 bootstrap 响应
 */
export interface LytBootstrap {
  tenantContext: RequestTenantContext
  capabilities: string[]
  phase: string
}

/**
 * 判断设备是否在线
 */
export function isDeviceOnline(status: LytDeviceStatus): boolean {
  return status === LytDeviceStatus.Online
}

/**
 * 判断设备是否需要关注（离线或维护超过指定分钟数视为异常）
 */
export function isDeviceAnomalous(
  device: LytDevice,
  thresholdMinutes: number = 5
): boolean {
  if (device.status === LytDeviceStatus.Online) return false
  if (!device.lastHeartbeatAt) return true

  const now = new Date()
  const heartbeat = new Date(device.lastHeartbeatAt)
  const diffMinutes = (now.getTime() - heartbeat.getTime()) / 60_000

  return diffMinutes > thresholdMinutes
}

/**
 * LYT 设备健康汇总
 */
export interface LytDeviceHealthSummary {
  total: number
  online: number
  offline: number
  maintenance: number
  anomalous: number
  healthRate: number
  deviceTypeBreakdown: Record<LytDeviceType, { total: number; online: number; offline: number; maintenance: number }>
}

/**
 * 计算设备健康汇总
 */
export function computeDeviceHealthSummary(
  devices: LytDevice[],
  thresholdMinutes: number = 5
): LytDeviceHealthSummary {
  const total = devices.length
  let online = 0
  let offline = 0
  let maintenance = 0
  let anomalous = 0

  const typeBreakdown: Record<LytDeviceType, { total: number; online: number; offline: number; maintenance: number }> = {
    [LytDeviceType.GateReader]: { total: 0, online: 0, offline: 0, maintenance: 0 },
    [LytDeviceType.PrizeMachine]: { total: 0, online: 0, offline: 0, maintenance: 0 },
    [LytDeviceType.CastScreen]: { total: 0, online: 0, offline: 0, maintenance: 0 },
    [LytDeviceType.Camera]: { total: 0, online: 0, offline: 0, maintenance: 0 },
    [LytDeviceType.Sensor]: { total: 0, online: 0, offline: 0, maintenance: 0 }
  }

  for (const device of devices) {
    const breakdown = typeBreakdown[device.deviceType]
    if (breakdown) {
      breakdown.total++
      if (device.status === LytDeviceStatus.Online) breakdown.online++
      else if (device.status === LytDeviceStatus.Offline) breakdown.offline++
      else if (device.status === LytDeviceStatus.Maintenance) breakdown.maintenance++
    }

    if (device.status === LytDeviceStatus.Online) online++
    else if (device.status === LytDeviceStatus.Offline) offline++
    else if (device.status === LytDeviceStatus.Maintenance) maintenance++

    if (isDeviceAnomalous(device, thresholdMinutes)) {
      anomalous++
    }
  }

  const healthRate = total > 0 ? roundTo((online / total) * 100, 2) : 100

  return { total, online, offline, maintenance, anomalous, healthRate, deviceTypeBreakdown: typeBreakdown }
}

function roundTo(value: number, precision: number): number {
  const factor = 10 ** precision
  return Math.round(value * factor) / factor
}

/**
 * 构造默认 LYT bootstrap
 */
export function makeLytBootstrap(
  tenantContext: RequestTenantContext,
  overrides: Partial<Pick<LytBootstrap, 'capabilities' | 'phase'>> = {}
): LytBootstrap {
  return {
    tenantContext,
    capabilities: ['device-management', 'connection-pool', 'gate-control', 'cast-screen'],
    phase: 'scaffold',
    ...overrides
  }
}
