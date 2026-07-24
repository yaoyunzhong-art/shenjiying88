/**
 * 未成年保护服务
 *
 * 功能:
 * 1. 身份认证 (AI人脸识别 + 身份证验证)
 * 2. 时段管控 (宵禁 + 限时)
 * 3. 合规审计日志
 */
import { Injectable, Logger, Optional } from '@nestjs/common'
import type {
  MinorProtectionConfig,
  MinorProtectionCheckResult,
  IdentityVerifyMethod,
  IdentityVerificationRecord,
  MinorAccessLog,
} from './minor-protection.entity'
import { MinorProtectionPrismaStore } from './minor-protection.prisma-store'
import { AuditService } from '../audit/audit.service'
import {
  DEFAULT_MINOR_CONFIG,
  createVerificationId,
  createAccessLogId,
} from './minor-protection.entity'

// ── In-memory stores ──
const verificationStore = new Map<string, IdentityVerificationRecord>()
const accessLogStore = new Map<string, MinorAccessLog>()

export function resetMinorProtectionStores(): void {
  verificationStore.clear()
  accessLogStore.clear()
}

export function setVerificationStoreEntry(id: string, record: IdentityVerificationRecord): void {
  verificationStore.set(id, record)
}

export function setAccessLogStoreEntry(tenantId: string, log: MinorAccessLog): void {
  accessLogStore.set(log.id, log)
}

export function clearVerificationStore(): void { verificationStore.clear() }
export function clearAccessLogStore(): void { accessLogStore.clear() }

@Injectable()
export class MinorProtectionService {
  constructor(
    @Optional() private readonly prismaStore?: MinorProtectionPrismaStore,
    @Optional() private readonly auditService?: AuditService
  ) {}
  private readonly logger = new Logger(MinorProtectionService.name)

  // ═══════════════════════════════════════════
  //  配置管理
  // ═══════════════════════════════════════════

  getDefaultConfig(): MinorProtectionConfig {
    return { ...DEFAULT_MINOR_CONFIG }
  }

  // ═══════════════════════════════════════════
  //  身份认证
  // ═══════════════════════════════════════════

  verifyIdentity(input: {
    tenantId: string
    memberId: string
    method: IdentityVerifyMethod
    identityNumber: string
    name: string
    birthday: string
    guardianConsent?: boolean
  }): IdentityVerificationRecord {
    // 简单年龄计算逻辑
    const age = this.calculateAge(input.birthday)
    const isMinor = age < 18

    const now = new Date().toISOString()
    const expiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()

    const record: IdentityVerificationRecord = {
      id: createVerificationId(),
      tenantId: input.tenantId,
      memberId: input.memberId,
      method: input.method,
      identityNumber: this.maskIdentityNumber(input.identityNumber),
      name: input.name,
      isMinor,
      birthday: input.birthday,
      guardianConsent: input.guardianConsent ?? false,
      verifiedAt: now,
      expiresAt,
      createdAt: now,
    }

    verificationStore.set(record.id, record)

    // fire-and-forget persist to DB
    this.prismaStore?.persistVerification(record).catch(err => this.logger?.error?.("persist failed", err))

    // audit: identity verification
    this.auditService?.log({
      eventType: record.isMinor ? 'compliance.consent_recorded' : 'compliance.consent_recorded',
      actorId: input.memberId, actorType: 'user', tenantId: input.tenantId,
      resourceType: 'minor_verification', resourceId: record.id,
      riskLevel: record.isMinor ? 'medium' : 'low',
      metadata: { method: input.method, isMinor: record.isMinor, hasGuardianConsent: !!record.guardianConsent },
    }).catch(err => this.logger?.error?.('audit log failed', err))
    this.logger.log(`身份认证: ${input.memberId} -> ${isMinor ? '未成年人' : '成年人'} (${age}岁)`)
    return record
  }

  getVerification(id: string, tenantId: string): IdentityVerificationRecord | undefined {
    const record = verificationStore.get(id)
    if (!record || record.tenantId !== tenantId) return undefined
    return record
  }

  listVerifications(tenantId: string): IdentityVerificationRecord[] {
    return Array.from(verificationStore.values())
      .filter((v) => v.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  findVerificationByMember(memberId: string, tenantId: string): IdentityVerificationRecord | undefined {
    return Array.from(verificationStore.values())
      .find((v) => v.memberId === memberId && v.tenantId === tenantId)
  }

  // ═══════════════════════════════════════════
  //  时段管控
  // ═══════════════════════════════════════════

  checkAccess(input: {
    tenantId: string
    memberId: string
    action: 'enter' | 'purchase' | 'game_play'
    config?: MinorProtectionConfig
  }): {
    result: MinorProtectionCheckResult
    blockedReason: string
    timeRestricted: boolean
  } {
    const config = input.config ?? DEFAULT_MINOR_CONFIG
    const now = new Date()
    const currentHour = now.getHours()
    const currentMinute = now.getMinutes()

    // 1. 检查身份认证
    const verification = this.findVerificationByMember(input.memberId, input.tenantId)
    if (!verification) {
      return this.logAccess(input.tenantId, input.memberId, input.action, 'review', false, '未完成身份认证')
    }

    if (!verification.isMinor) {
      // 成年人直接通
      return this.logAccess(input.tenantId, input.memberId, input.action, 'pass', false, '')
    }

    // 2. 未成年 → 检查时段管控
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`

    // 宵禁检查
    if (config.timeRestrictionEnabled) {
      if (currentTime >= config.curfewStart || currentTime < config.curfewEnd) {
        return this.logAccess(
          input.tenantId, input.memberId, input.action, 'blocked', true,
          `宵禁时段 (${config.curfewStart}-${config.curfewEnd}) 不允许进入`,
        )
      }

      // 工作日限时
      const dayOfWeek = now.getDay() // 0=Sun, 6=Sat
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        if (currentTime < config.weekdayStart) {
          return this.logAccess(
            input.tenantId, input.memberId, input.action, 'blocked', true,
            `工作日营业开始时间 ${config.weekdayStart}`,
          )
        }
        if (currentTime >= config.weekdayEnd) {
          return this.logAccess(
            input.tenantId, input.memberId, input.action, 'blocked', true,
            `工作日营业结束时间 ${config.weekdayEnd}`,
          )
        }
      }
    }

    // 3. 监护人同意检查
    if (verification.isMinor && !verification.guardianConsent) {
      return this.logAccess(input.tenantId, input.memberId, input.action, 'review', false, '需要监护人同意')
    }

    return this.logAccess(input.tenantId, input.memberId, input.action, 'pass', false, '')
  }

  // ═══════════════════════════════════════════
  //  日志审计
  // ═══════════════════════════════════════════

  private logAccess(
    tenantId: string, memberId: string, action: string,
    result: MinorProtectionCheckResult, timeRestricted: boolean, blockedReason: string,
  ): { result: MinorProtectionCheckResult; blockedReason: string; timeRestricted: boolean } {
    const log: MinorAccessLog = {
      id: createAccessLogId(),
      tenantId,
      memberId,
      action: action as any,
      checkResult: result,
      timeRestricted,
      blockedReason,
      createdAt: new Date().toISOString(),
    }
    accessLogStore.set(log.id, log)

    // fire-and-forget persist to DB
    this.prismaStore?.persistAccessLog(log).catch(err => this.logger?.error?.('persist log failed', err))
    return { result, blockedReason, timeRestricted }
  }

  getAccessLogs(tenantId: string, limit = 50): MinorAccessLog[] {
    return Array.from(accessLogStore.values())
      .filter((l) => l.tenantId === tenantId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, limit)
  }

  // ═══════════════════════════════════════════
  //  辅助方法
  // ═══════════════════════════════════════════

  private calculateAge(birthday: string): number {
    const birth = new Date(birthday)
    const today = new Date()
    let age = today.getFullYear() - birth.getFullYear()
    const monthDiff = today.getMonth() - birth.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--
    }
    return age
  }

  private maskIdentityNumber(id: string): string {
    if (id.length <= 4) return id
    return id.slice(0, 2) + '*'.repeat(id.length - 4) + id.slice(-2)
  }
}
