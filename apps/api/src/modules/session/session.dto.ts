// session.dto.ts · 会话管理 DTO
// Phase-FP P10 · 2026-07-08

import { DeviceInfo } from './session.entity'

/**
 * 创建会话请求
 */
export interface CreateSessionDto {
  userId: string
  tenantId: string
  deviceInfo: DeviceInfo
}

/**
 * 创建会话响应
 */
export interface CreateSessionResponseDto {
  sessionId: string
  userId: string
  tenantId: string
  deviceInfo: DeviceInfo
  createdAt: number
  expiresAt: number
  status: string
}

/**
 * 验证会话请求
 */
export interface ValidateSessionDto {
  sessionId: string
}

/**
 * 验证会话响应
 */
export interface ValidateSessionResponseDto {
  valid: boolean
  userId?: string
  tenantId?: string
}

/**
 * 作废会话请求
 */
export interface RevokeSessionDto {
  sessionId: string
}

/**
 * 作废会话响应
 */
export interface RevokeSessionResponseDto {
  success: boolean
  revokedAt: string
}

/**
 * 会话信息响应
 */
export interface SessionInfoDto {
  sessionId: string
  userId: string
  tenantId: string
  deviceType: string
  deviceId?: string
  browser?: string
  os?: string
  ip?: string
  createdAt: number
  lastActiveAt: number
  expiresAt: number
  status: string
}

/**
 * 活跃会话列表响应
 */
export interface ActiveSessionsResponseDto {
  sessions: SessionInfoDto[]
  count: number
}

/**
 * 作废所有会话请求
 */
export interface RevokeAllSessionsDto {
  userId: string
}

/**
 * 作废所有会话响应
 */
export interface RevokeAllSessionsResponseDto {
  success: boolean
  revokedCount: number
}
