// session.contract.ts · 会话管理跨模块合约
// Phase-FP P10 · 2026-07-08

import type { DeviceInfo, Session } from './session.entity'

/**
 * 会话合约（跨模块安全子集）
 * 供 auth, tenant, audit, compliance 等模块消费
 */
export interface SessionContract {
  sessionId: string
  userId: string
  tenantId: string
  deviceType: string
  createdAt: number
  lastActiveAt: number
  expiresAt: number
  status: 'active' | 'expired' | 'revoked'
}

/**
 * 设备信息合约（跨模块安全子集）
 */
export interface DeviceInfoContract {
  deviceId: string
  deviceType: string
  browser?: string
  os?: string
}

/**
 * 会话验证结果合约
 */
export interface SessionValidationContract {
  valid: boolean
  userId?: string
  tenantId?: string
}

/**
 * 用户活跃会话概览合约
 */
export interface UserSessionsOverviewContract {
  userId: string
  totalActive: number
  oldestSessionCreatedAt: number
  newestSessionCreatedAt: number
}

// ─── Contract 映射器 ─────────────────────────────────

/** 实体 Session → SessionContract */
export function toSessionContract(entity: Session): SessionContract {
  return {
    sessionId: entity.sessionId,
    userId: entity.userId,
    tenantId: entity.tenantId,
    deviceType: entity.deviceInfo.deviceType,
    createdAt: entity.createdAt,
    lastActiveAt: entity.lastActiveAt,
    expiresAt: entity.expiresAt,
    status: entity.status,
  }
}

/** DeviceInfo → DeviceInfoContract */
export function toDeviceInfoContract(entity: DeviceInfo): DeviceInfoContract {
  return {
    deviceId: entity.deviceId,
    deviceType: entity.deviceType,
    browser: entity.browser,
    os: entity.os,
  }
}

/** 批量映射 Session → SessionContract */
export function toSessionContracts(entities: Session[]): SessionContract[] {
  return entities.map(toSessionContract)
}
