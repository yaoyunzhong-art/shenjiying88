/**
 * 未成年保护模块 - 数据类型定义
 */
import { randomUUID } from 'node:crypto'

export type MinorProtectionCheckResult = 'pass' | 'blocked' | 'review'

export type IdentityVerifyMethod = 'id_card' | 'facial' | 'parental_consent' | 'none'

export type TimeRestrictionType = 'curfew' | 'duration_limit' | 'weekday_limit'

export interface MinorProtectionConfig {
  facialRecognitionEnabled: boolean
  identityVerificationEnabled: boolean
  timeRestrictionEnabled: boolean
  curfewStart: string
  curfewEnd: string
  maxSessionMinutes: number
  weekdayStart: string
  weekdayEnd: string
}

export const DEFAULT_MINOR_CONFIG: MinorProtectionConfig = {
  facialRecognitionEnabled: true,
  identityVerificationEnabled: true,
  timeRestrictionEnabled: true,
  curfewStart: '22:00',
  curfewEnd: '06:00',
  maxSessionMinutes: 120,
  weekdayStart: '08:00',
  weekdayEnd: '21:00',
}

export interface IdentityVerificationRecord {
  id: string
  tenantId: string
  memberId: string
  method: IdentityVerifyMethod
  identityNumber: string
  name: string
  isMinor: boolean
  birthday: string
  guardianConsent: boolean
  verifiedAt: string
  expiresAt: string
  createdAt: string
}

export interface MinorAccessLog {
  id: string
  tenantId: string
  memberId: string
  action: 'enter' | 'exit' | 'purchase' | 'game_play'
  checkResult: MinorProtectionCheckResult
  timeRestricted: boolean
  blockedReason: string
  createdAt: string
}

export function createVerificationId(): string {
  return `mv-${randomUUID()}`
}

export function createAccessLogId(): string {
  return `mal-${randomUUID()}`
}
