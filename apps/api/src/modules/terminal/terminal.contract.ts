/**
 * terminal.contract.ts — 排队终端响应合约
 *
 * WP-12B BS-0161~BS-0163 对外响应接口
 */

import type {
  TerminalEntity,
  TerminalBindingEntity,
  TerminalStatusResponse,
  OfflineDetectionResult,
} from './terminal.entity'

export interface TerminalHeartbeatResponse {
  terminalId: string
  status: 'online' | 'offline'
  lastHeartbeatAt: string | null
  message: string
}

export interface TerminalBindingResponse {
  id: string
  terminalId: string
  storeId: string
  operatorId: string
  operatorName: string
  isActive: boolean
  boundAt: string
}

export interface OfflineDetectionResponse {
  offlineTerminals: OfflineDetectionResult[]
  onlineTerminals: number
  offlineCount: number
  totalCount: number
}

export interface RecoverResponse {
  terminalId: string
  previousStatus: string
  currentStatus: string
  recovered: boolean
}

// ── 转换函数 ──

export function toTerminalStatusResponse(
  terminal: TerminalEntity,
  binding?: TerminalBindingEntity | null,
): TerminalStatusResponse {
  return {
    id: terminal.id,
    name: terminal.name,
    type: terminal.type,
    status: terminal.status,
    lastHeartbeatAt: terminal.lastHeartbeatAt?.toISOString() ?? null,
    binding: binding
      ? {
          storeId: binding.storeId,
          operatorId: binding.operatorId,
          operatorName: binding.operatorName,
          isActive: binding.isActive,
          boundAt: binding.boundAt.toISOString(),
        }
      : undefined,
    createdAt: terminal.createdAt.toISOString(),
    updatedAt: terminal.updatedAt.toISOString(),
  }
}

export function toTerminalBindingResponse(
  binding: TerminalBindingEntity,
): TerminalBindingResponse {
  return {
    id: binding.id,
    terminalId: binding.terminalId,
    storeId: binding.storeId,
    operatorId: binding.operatorId,
    operatorName: binding.operatorName,
    isActive: binding.isActive,
    boundAt: binding.boundAt.toISOString(),
  }
}

export function toHeartbeatResponse(
  terminalId: string,
  status: 'online' | 'offline',
  lastHeartbeatAt: Date | null,
): TerminalHeartbeatResponse {
  return {
    terminalId,
    status,
    lastHeartbeatAt: lastHeartbeatAt?.toISOString() ?? null,
    message: status === 'online'
      ? 'Heartbeat received. Terminal is online.'
      : 'Heartbeat received but terminal was offline; auto-recovered.',
  }
}
