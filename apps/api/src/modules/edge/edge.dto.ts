import 'reflect-metadata'
import type {
  EdgeNodeStatus,
  EdgeNodePlatform,
  TicketStatusEnum,
  ModelFramework,
} from './edge.entity'

// ============ 查询参数 DTO ============

export class ListEdgeNodesQueryDto {
  status?: EdgeNodeStatus
  platform?: EdgeNodePlatform
  storeId?: string
  limit?: string
}

export class ListTicketsQueryDto {
  storeId?: string
  status?: TicketStatusEnum
  limit?: string
}

export class ListInferenceTasksQueryDto {
  deviceId?: string
  status?: string
  limit?: string
}

// ============ 注册 / 更新边缘节点 DTO ============

export class RegisterEdgeNodeDto {
  name!: string
  platform!: EdgeNodePlatform
  ipAddress?: string
  macAddress?: string
  memoryMb!: number
  cpuCores!: number
  storageMb!: number
  capabilities!: string[]
  storeId?: string
}

export class UpdateEdgeNodeDto {
  name?: string
  status?: EdgeNodeStatus
  ipAddress?: string
  macAddress?: string
  memoryMb?: number
  cpuCores?: number
  storageMb?: number
  capabilities?: string[]
}

// ============ 排队令牌 DTO ============

export class IssueTicketDto {
  storeId!: string
  customerId?: string
  priority?: number
}

export class CallNextDto {
  storeId!: string
}

export class SyncQueueDto {
  storeId!: string
}

// ============ 推理 DTO ============

export class RunInferenceDto {
  modelId!: string
  deviceId!: string
  inputData!: unknown
}

export class LoadModelDto {
  modelId!: string
  deviceId!: string
}

export class CacheModelDto {
  modelId!: string
  version!: string
}

// ============ 时间同步 DTO ============

export class SyncClockDto {
  clientTime!: number
}

export class CalibrateClockDto {
  samples!: Array<{ clientTime: number; serverTime: number }>
}

// ============ 响应 DTO ============

export class EdgeNodeResponseDto {
  id!: string
  tenantId!: string
  storeId?: string
  name!: string
  platform!: EdgeNodePlatform
  status!: EdgeNodeStatus
  ipAddress?: string
  macAddress?: string
  memoryMb!: number
  cpuCores!: number
  storageMb!: number
  capabilities!: string[]
  lastHeartbeat?: string
  createdAt!: string
  updatedAt!: string
}

export class EdgeNodeListResponseDto {
  data!: EdgeNodeResponseDto[]
  total!: number
}

export class TicketResponseDto {
  ticketId!: string
  storeId!: string
  tenantId!: string
  ticketNumber!: number
  status!: TicketStatusEnum
  priority!: number
  customerId?: string
  issuedAt!: string
  calledAt?: string
  completedAt?: string
  syncedToServer!: boolean
}

export class TicketListResponseDto {
  data!: TicketResponseDto[]
  total!: number
}

export class QueuePositionResponseDto {
  ticketId!: string
  position!: number
  estimatedWaitMinutes!: number
  totalWaiting!: number
}

export class CallNextResponseDto {
  calledTicket!: TicketResponseDto | null
  queueAfterCall!: number
  previousTicketId!: string | null
}

export class SyncQueueResponseDto {
  storeId!: string
  syncedAt!: string
  ticketCount!: number
  success!: boolean
}

export class InferenceResultResponseDto {
  modelId!: string
  output!: unknown
  latencyMs!: number
  confidence?: number
  deviceId!: string
  timestamp!: number
}

export class ModelInfoResponseDto {
  modelId!: string
  version!: string
  sizeMb!: number
  framework!: ModelFramework
  inputShape!: number[]
  outputShape!: number[]
}

export class TimeSyncResponseDto {
  serverTime!: number
  offset!: number
  roundTripDelay!: number
  synced!: boolean
}

export class ClockToleranceResponseDto {
  withinTolerance!: boolean
  deviationMs!: number
  serverTime!: number
}

export class CalibrateClockResponseDto {
  offset!: number
  synced!: boolean
}
