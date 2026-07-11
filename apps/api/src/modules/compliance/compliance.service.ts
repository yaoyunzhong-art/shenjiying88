/**
 * compliance.service.ts - 合规模块编排服务
 *
 * 编排层：整合 PIIDetectorService / PIIMaskerService / GDPRErasureService /
 *         AuditLogService / AuditQueryService 并提供统一 Facade
 *
 * 职责：
 *   - PII 扫描 + 脱敏批量编排
 *   - GDPR 删除生命周期编排
 *   - 审计日志写 + 查询编排
 *   - 合规健康检查
 *
 * 树哥后台自动执行：合规服务编排层
 */

import { Injectable } from '@nestjs/common'
import { PIIDetectorService } from './pii-detector.service'
import { PIIMaskerService } from './pii-masker.service'
import { GDPRErasureService } from './gdpr-erasure.service'
import { AuditLogService } from './audit-log.service'
import { AuditQueryService } from './audit-query.service'
import type { PIIKind, PIIMatch } from './pii-detector.service'
import type { AuditAction, AuditEntry } from './audit-log.service'

// ── 类型 ──

export interface ComplianceScanRequest {
  text: string
  kinds?: PIIKind[]
  minConfidence?: number
  maskAfterScan?: boolean
  maskChar?: string
}

export interface ComplianceScanResult {
  hasPII: boolean
  matches: PIIMatch[]
  counts: Record<PIIKind, number>
  sensitivityScore: number
  maskedText?: string
  auditLogged: boolean
}

export interface ComplianceAuditRequest {
  tenantId: string
  actorId: string
  action: AuditAction
  resource: string
  resourceId: string
  before?: unknown
  after?: unknown
}

export interface ComplianceHealthSummary {
  status: 'healthy' | 'degraded' | 'down'
  piiDetector: string
  piiMasker: string
  gdprErasure: string
  auditLog: string
  auditQuery: string
  auditLogSize: number
  pendingErasures: number
  cascadeModules: string[]
  checkedAt: string
}

@Injectable()
export class ComplianceService {
  constructor(
    private readonly piiDetector: PIIDetectorService,
    private readonly piiMasker: PIIMaskerService,
    private readonly gdprErasure: GDPRErasureService,
    private readonly auditLog: AuditLogService,
    private readonly auditQuery: AuditQueryService,
  ) {}

  /**
   * 扫描并可选脱敏文本 — 合规扫描一站式
   */
  scanAndMask(request: ComplianceScanRequest): ComplianceScanResult {
    const options = {
      kinds: request.kinds,
      minConfidence: request.minConfidence,
    }

    const matches = this.piiDetector.detect(request.text, options)
    const counts = this.piiDetector.count(request.text, options)
    const sensitivityScore = this.computeSensitivity(matches)

    let maskedText: string | undefined
    if (request.maskAfterScan && matches.length > 0) {
      maskedText = this.piiMasker.maskText(request.text, {
        maskChar: request.maskChar,
      })
    }

    // 审计日志 — 记录扫描行为
    this.auditLog.append({
      tenantId: 'system',
      actorId: 'compliance-scanner',
      action: 'READ',
      resource: 'pii-scan',
      resourceId: `scan-${Date.now()}`,
      after: { matchesCount: matches.length, sensitivityScore },
    })

    return {
      hasPII: matches.length > 0,
      matches,
      counts,
      sensitivityScore,
      maskedText,
      auditLogged: true,
    }
  }

  /**
   * 批量扫描 — 并发合规扫描
   */
  batchScan(texts: string[], minConfidence?: number): ComplianceScanResult[] {
    return texts.map(text => this.scanAndMask({ text, minConfidence }))
  }

  /**
   * 合规审计 — 记录操作 + 返回 entry
   */
  audit(request: ComplianceAuditRequest): AuditEntry {
    return this.auditLog.append({
      tenantId: request.tenantId,
      actorId: request.actorId,
      action: request.action,
      resource: request.resource,
      resourceId: request.resourceId,
      before: request.before,
      after: request.after,
    })
  }

  /**
   * 删除用户数据（完整生命周期编排）
   * 1. 请求删除 → PENDING_ERASURE
   * 2. grace period 到期后硬删除
   * 3. 记录审计日志
   */
  async deleteUserData(userId: string, tenantId: string): Promise<{
    requestId: string
    status: string
    erasedAt?: string
    totalDeleted: number
  }> {
    // 1. 请求删除
    const record = this.gdprErasure.requestErasure({ userId, tenantId })

    // 2. 审计日志
    this.auditLog.append({
      tenantId,
      actorId: 'compliance-service',
      action: 'DELETE',
      resource: 'erasure-request',
      resourceId: userId,
      after: { status: record.status, deletionRequestedAt: record.deletionRequestedAt },
    })

    // 3. 如果未指定 grace period，直接硬删除
    if (!record.erasureDeadlineAt || new Date(record.erasureDeadlineAt) <= new Date()) {
      const result = await this.gdprErasure.hardDelete(userId)
      this.auditLog.append({
        tenantId,
        actorId: 'compliance-service',
        action: 'DELETE',
        resource: 'erasure-hard-delete',
        resourceId: userId,
        after: { totalDeleted: result.totalDeleted },
      })
      return {
        requestId: `${tenantId}:${userId}`,
        status: 'ERASED',
        erasedAt: new Date().toISOString(),
        totalDeleted: result.totalDeleted,
      }
    }

    return {
      requestId: `${tenantId}:${userId}`,
      status: record.status,
      totalDeleted: 0,
    }
  }

  /**
   * 合规健康摘要
   */
  getHealthSummary(): ComplianceHealthSummary {
    const auditLogSize = this.auditLog.size()
    const pendingErasures = this.gdprErasure.listReadyForHardDelete()
    const cascadeModules = this.gdprErasure.listRegisteredModules()

    let status: 'healthy' | 'degraded' | 'down' = 'healthy'
    if (cascadeModules.length === 0 && auditLogSize === 0) {
      status = 'degraded'
    }

    return {
      status,
      piiDetector: 'UP',
      piiMasker: 'UP',
      gdprErasure: 'UP',
      auditLog: 'UP',
      auditQuery: 'UP',
      auditLogSize,
      pendingErasures: pendingErasures.length,
      cascadeModules,
      checkedAt: new Date().toISOString(),
    }
  }

  // ── Private ──

  private computeSensitivity(matches: Array<{ kind: PIIKind; confidence: number }>): number {
    if (matches.length === 0) return 0
    const weights: Record<PIIKind, number> = {
      phone: 0.6,
      email: 0.5,
      idCard: 0.9,
      creditCard: 0.85,
      ip: 0.4,
    }
    const score = matches.reduce((sum, m) => sum + (weights[m.kind] ?? 0.5) * m.confidence, 0) / 2
    return Math.min(1, Math.round(score * 100) / 100)
  }
}
