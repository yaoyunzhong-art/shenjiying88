/**
 * device-adapter.entity.ts - 设备适配器模块实体定义
 *
 * 定义设备注册、连接、命令执行的实体类型：
 * - DeviceConfig: 设备注册配置
 * - DeviceCommand: 设备命令记录
 * - DeviceResponse: 设备响应
 * - DeviceStatus: 设备状态枚举
 * - DeviceType: 设备类型枚举
 * - DeviceBrand: 设备品牌枚举
 * - DeviceAdapterInfo: 适配器信息
 * - DeviceMetrics: 设备运行指标
 */

export type DeviceType = 'pos' | 'gate' | 'scanner' | 'printer' | 'scale' | 'kiosk'
export type DeviceBrand = 'huawei' | 'honeywell' | 'zebra' | 'epson' | 'deli' | 'generic'
export type DeviceStatus = 'online' | 'offline' | 'error' | 'maintenance'
export type ConnectionType = 'usb' | 'serial' | 'bluetooth' | 'wifi' | 'ethernet'

/** 设备注册配置 */
export interface DeviceConfig {
  deviceId: string
  deviceType: DeviceType
  brand: DeviceBrand
  model?: string
  connection: ConnectionType
  timeout: number
  retries: number
}

/** 设备命令记录 */
export interface DeviceCommand {
  commandId: string
  deviceId: string
  action: string
  params?: Record<string, unknown>
  issuedAt: Date
  issuedBy?: string
}

/** 设备响应 */
export interface DeviceResponse {
  commandId: string
  deviceId?: string
  success: boolean
  data?: unknown
  error?: string
  receivedAt: Date
}

/** 适配器信息 */
export interface DeviceAdapterInfo {
  brand: DeviceBrand
  protocol: string
  supportedActions: string[]
}

/** 扫描解析结果 */
export interface ScannedData {
  format: 'qr' | 'code128' | 'ean13' | 'upc'
  value: string
  metadata?: Record<string, unknown>
}

/** 设备过滤条件 */
export interface DeviceFilter {
  type?: DeviceType
  brand?: DeviceBrand
  status?: DeviceStatus
}

/** 设备列表响应 */
export interface DeviceListResponse {
  total: number
  devices: DeviceConfig[]
}

/** 连接结果 */
export interface ConnectionResult {
  success: boolean
  deviceId: string
  status: DeviceStatus
  message?: string
}
