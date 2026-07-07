/**
 * 边缘计算 - 实体定义
 *
 * 涵盖边缘节点设备、离线队列、缓存模型及推理任务的领域实体
 */

// ============ 边缘节点设备 ============

export type EdgeNodeStatus = 'online' | 'offline' | 'busy' | 'decommissioned'

export type EdgeNodePlatform = 'linux' | 'android' | 'ios' | 'windows'

export interface EdgeNode {
  id: string
  tenantId: string
  storeId?: string
  name: string
  platform: EdgeNodePlatform
  status: EdgeNodeStatus
  ipAddress?: string
  macAddress?: string
  memoryMb: number
  cpuCores: number
  storageMb: number
  capabilities: string[]
  lastHeartbeat?: string
  createdAt: string
  updatedAt: string
}

// ============ 离线排队令牌 ============

export type TicketStatusEnum = 'WAITING' | 'CALLED' | 'COMPLETED' | 'CANCELLED'

export interface EdgeTicket {
  ticketId: string
  storeId: string
  tenantId: string
  ticketNumber: number
  status: TicketStatusEnum
  priority: number
  customerId?: string
  issuedAt: string
  calledAt?: string
  completedAt?: string
  syncedToServer: boolean
}

// ============ 模型缓存 ============

export type ModelFramework = 'tensorrt' | 'onnx' | 'tflite' | 'coreml'

export interface EdgeModel {
  modelId: string
  version: string
  sizeMb: number
  framework: ModelFramework
  inputShape: number[]
  outputShape: number[]
  tenantId: string
  cachedAt: string
}

// ============ 推理任务 ============

export interface InferenceTask {
  taskId: string
  modelId: string
  deviceId: string
  tenantId: string
  status: 'pending' | 'running' | 'completed' | 'failed'
  inputData: unknown
  outputData?: unknown
  latencyMs?: number
  confidence?: number
  createdAt: string
  completedAt?: string
  errorMessage?: string
}

// ============ 时间同步记录 ============

export interface EdgeTimeSyncRecord {
  syncId: string
  nodeId: string
  tenantId: string
  offsetMs: number
  roundTripDelayMs: number
  syncedAt: string
}

// ============ 常量 ============

export const EDGE_NODE_CAPABILITIES = ['face', 'voice', 'qr', 'ocr', 'nlp'] as const

export const DEFAULT_TIME_TOLERANCE_MS = 500
export const MAX_SYNC_HISTORY = 10
export const MODEL_CACHE_TTL_MS = 86_400_000 // 24 小时

// ============ 装饰器元数据 ============

export const EDGE_GUARD_KEY = 'edgeGuardMeta'

export interface EdgeGuardMeta {
  /** 需要的边缘能力 */
  requiredCapability?: string
  /** 是否允许离线模式 */
  allowOffline?: boolean
}
