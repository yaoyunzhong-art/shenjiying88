/**
 * terminal.entity.ts - 排队终端实体
 *
 * WP-12B BS-0161~BS-0163
 * - BS-0161: 终端心跳检测
 * - BS-0162: 终端 2FA 认证（终端+操作员+门店三重绑定）
 * - BS-0163: 离线检测与自动恢复
 */

// ── 终端类型 ──
export enum TerminalType {
  Queue = 'queue',
  Kiosk = 'kiosk',
  Tablet = 'tablet',
  POS = 'pos',
}

// ── 终端在线状态 ──
export enum TerminalOnlineStatus {
  Online = 'online',
  Offline = 'offline',
}

// ── 终端实体 ──
export class TerminalEntity {
  id!: string
  tenantId!: string
  type!: TerminalType
  name!: string
  status!: TerminalOnlineStatus
  lastHeartbeatAt!: Date | null
  createdAt!: Date
  updatedAt!: Date
}

// ── 终端心跳记录 ──
export interface TerminalHeartbeatRecord {
  terminalId: string
  timestamp: number
  latencyMs: number
}

// ── 终端 2FA 绑定 ──
export class TerminalBindingEntity {
  id!: string
  terminalId!: string
  tenantId!: string
  storeId!: string
  operatorId!: string
  operatorName!: string
  isActive!: boolean
  boundAt!: Date
  unboundAt?: Date
}

// ── 离线检测结果 ──
export interface OfflineDetectionResult {
  terminalId: string
  status: TerminalOnlineStatus
  lastHeartbeatAt: Date | null
  offlineDurationMinutes: number | null
  tenantId: string
}

// ── 终端在线状态响应 ──
export interface TerminalStatusResponse {
  id: string
  name: string
  type: TerminalType
  status: TerminalOnlineStatus
  lastHeartbeatAt: string | null
  binding?: {
    storeId: string
    operatorId: string
    operatorName: string
    isActive: boolean
    boundAt: string
  }
  createdAt: string
  updatedAt: string
}
