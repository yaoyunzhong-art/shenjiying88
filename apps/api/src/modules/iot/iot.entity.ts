/**
 * iot.entity.ts - IoT 模块实体定义
 *
 * 定义 IoT 设备管理、OTA 升级、心跳监控相关的实体类型
 */

// ── 设备基础 ─────────────────────────────────────────────────────────────────

export type DeviceType = 'ESP32_S3' | 'ESP32_C3' | 'ESP32' | 'ESP8266'
export type DeviceStatus = 'ONLINE' | 'OFFLINE' | 'BUSY' | 'ERROR'
export type NetworkStatus = 'online' | 'offline' | 'weak'
export type DeviceState = 'idle' | 'upgrading' | 'error' | 'maintenance'

/** ESP32 设备实体 */
export interface ESP32Device {
  deviceId: string
  type: DeviceType
  name: string
  status: DeviceStatus
  lastHeartbeat: number | null
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

/** MQTT 消息实体 */
export interface MQTTMessage {
  topic: string
  payload: string
  timestamp: number
  qos?: 0 | 1 | 2
}

/** 心跳记录实体 */
export interface HeartbeatRecord {
  deviceId: string
  latency: number
  timestamp: number
}

/** 心跳状态实体 */
export interface HeartbeatStatus {
  deviceId: string
  currentInterval: number
  optimalInterval: number
  avgLatency: number
  lastHeartbeat: number | null
  consecutiveTimeouts: number
  isTimeout: boolean
}

// ── OTA 升级 ─────────────────────────────────────────────────────────────────

export type OTAStatus = 'pending' | 'scheduled' | 'upgrading' | 'completed' | 'failed' | 'cancelled'

/** 固件二进制实体 */
export interface FirmwareBinary {
  size: number
  checksum: string
  data: Buffer
}

/** 固件记录实体 */
export interface FirmwareRecord {
  id: string
  deviceType: string
  version: string
  binary: FirmwareBinary
  uploadedAt: Date
  uploadedBy: string
}

/** OTA 任务记录实体 */
export interface OTATaskRecord {
  id: string
  deviceId: string
  firmwareId: string
  status: OTAStatus
  progress: number
  startedAt?: Date
  completedAt?: Date
  error?: string
}

/** 设备信息实体 */
export interface DeviceInfo {
  deviceId: string
  deviceType: string
  batteryLevel: number
  networkStatus: NetworkStatus
  currentState: DeviceState
  lastSeen: Date
}

// ── 工单与运维 ───────────────────────────────────────────────────────────────

export type WorkOrderPriority = 'P1' | 'P2' | 'P3' | 'P4'
export type WorkOrderStatus = 'open' | 'assigned' | 'in_progress' | 'resolved' | 'closed'

/** 设备健康报告实体 */
export interface DeviceHealthReport {
  deviceId: string
  score: number
  battery: { level: number; health: 'good' | 'degraded' | 'critical' }
  network: { status: 'good' | 'weak' | 'unstable' }
  sensors: { workingCount: number; totalCount: number }
  firmware: { version: string; upToDate: boolean }
  overall: 'healthy' | 'degraded' | 'critical'
}

/** 工单记录实体 */
export interface WorkOrderRecord {
  id: string
  deviceId: string
  issue: string
  priority: WorkOrderPriority
  status: WorkOrderStatus
  assigneeId?: string
  createdAt: Date
  assignedAt?: Date
  resolvedAt?: Date
}

/** 技术人员信息实体 */
export interface TechnicianInfo {
  id: string
  name: string
  skills: string[]
  currentWorkload: number
  location?: { lat: number; lng: number }
  activeTasks: string[]
}

/** 工单问题实体 */
export interface WorkOrderIssue {
  deviceId: string
  deviceType: string
  description: string
  priority: WorkOrderPriority
  requiredSkills?: string[]
  location?: { lat: number; lng: number }
}

// ── 设备过滤与响应 ───────────────────────────────────────────────────────────

/** 设备过滤条件 */
export interface DeviceFilter {
  type?: DeviceType
  status?: DeviceStatus
}

/** 设备列表响应 */
export interface DeviceListResponse {
  total: number
  devices: ESP32Device[]
}

/** OTA 升级前校验结果 */
export interface OTAPreValidateResult {
  valid: boolean
  reasons: string[]
}

/** OTA 升级后校验结果 */
export interface OTAPostValidateResult {
  valid: boolean
  issues: string[]
}

/** 延迟统计 */
export interface LatencyStats {
  avg: number
  min: number
  max: number
  count: number
}
