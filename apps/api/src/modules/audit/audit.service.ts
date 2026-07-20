/**
 * audit.service.ts - T118-2 审计追踪全链路 + 分账日志 + IP 注入
 * 用途: 全链路审计追踪、分账日志记录、异常行为检测、合规报告生成
 */

import { Logger } from '@nestjs/common'

export type AuditEventType =
  | 'auth.login' | 'auth.logout' | 'auth.register' | 'auth.password_change'
  | 'user.profile_update' | 'user.consent_update' | 'user.data_delete'
  | 'order.created' | 'order.paid' | 'order.refunded' | 'order.cancelled'
  | 'points.earned' | 'points.redeemed' | 'points.adjusted'
  | 'payment.initiated' | 'payment.completed' | 'payment.failed' | 'payment.refunded'
  | 'settlement.created' | 'settlement.approved' | 'settlement.rejected' | 'settlement.paid'
  | 'admin.config_change' | 'admin.user_impersonate' | 'admin.data_export'
  | 'admin.role_create' | 'admin.role_update' | 'admin.role_delete'
  | 'admin.permission_grant' | 'admin.permission_revoke'
  | 'user.role_assigned' | 'user.role_unassigned'
  | 'compliance.consent_recorded' | 'compliance.dsr_submitted' | 'compliance.dsr_processed'

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

export interface AuditLog {
  id: string
  eventType: AuditEventType
  actorId: string
  actorType: 'user' | 'admin' | 'system' | 'api_key'
  tenantId?: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  riskLevel: RiskLevel
  timestamp: Date
  // 溯源链
  traceId?: string
  parentSpanId?: string
  // 分账相关
  settlementId?: string
  settlementAmount?: number
  // 合规相关
  piiFields?: string[]  // 本次操作涉及的 PII 字段
  consentVersion?: string
}

export interface AuditQuery {
  actorId?: string
  tenantId?: string
  eventType?: AuditEventType
  riskLevel?: RiskLevel
  from?: Date
  to?: Date
  limit?: number
  cursor?: string
}

export type SettlementEventType = 'created' | 'approved' | 'paid' | 'rejected'

export class AuditService {
  private readonly logger = new Logger(AuditService.name)
  private readonly auditLogs = new Map<string, AuditLog>()
  private clientIP: string | null = null
  private traceId: string | null = null
  private idCounter = 0

  private generateId(): string {
    this.idCounter++
    return `audit_${Date.now()}_${this.idCounter}`
  }

  // ── 事件记录 ─────────────────────────────────────────────────────────

  /** 记录审计事件（异步，不阻塞主流程）*/
  async log(event: Omit<AuditLog, 'id' | 'timestamp'>): Promise<string> {
    const id = this.generateId()
    // 支持测试时通过 timestamp 属性传入时间（内部使用，公共API不显式暴露）
    const timestamp = (event as AuditLog).timestamp ?? new Date()
    const log: AuditLog = {
      ...event,
      id,
      timestamp,
      // 从上下文注入 IP 和 traceId（如果事件中未提供）
      ipAddress: event.ipAddress ?? this.clientIP ?? undefined,
      traceId: event.traceId ?? this.traceId ?? undefined,
    }
    this.auditLogs.set(id, log)

    // 根据风险等级选择日志级别
    const riskLevel = event.riskLevel
    const logMsg = `[AUDIT] ${event.eventType} actor=${event.actorId} type=${event.actorType} id=${id} risk=${riskLevel}`
    if (riskLevel === 'critical' || riskLevel === 'high') {
      this.logger.warn(logMsg)
    } else {
      this.logger.log(logMsg)
    }

    return id
  }

  /** 批量记录（用于高频事件，如积分变动）*/
  async logBatch(events: Omit<AuditLog, 'id' | 'timestamp'>[]): Promise<string[]> {
    const ids = await Promise.all(events.map((e) => this.log(e)))
    this.logger.log(`[AUDIT] Batch ${events.length} events, ids=[${ids.slice(0, 5).join(',')}${ids.length > 5 ? '...' : ''}]`)
    return ids
  }

  /** 设置 IP 地址（从请求上下文提取，X-Forwarded-For / X-Real-IP）*/
  setClientIP(ip: string): void {
    this.clientIP = ip
    this.logger.log(`[AUDIT] Client IP set: ${ip}`)
  }

  /** 获取当前设置的 IP 地址 */
  getClientIP(): string | null {
    return this.clientIP
  }

  /** 设置 TraceId（用于分布式链路追踪）*/
  setTraceId(traceId: string): void {
    this.traceId = traceId
  }

  /** 获取当前设置的 TraceId */
  getTraceId(): string | null {
    return this.traceId
  }

  // ── 查询 ──────────────────────────────────────────────────────────────

  /** 分页查询审计日志 */
  async query(filter: AuditQuery): Promise<{ items: AuditLog[]; nextCursor?: string; total: number }> {
    this.logger.log(`[AUDIT] Query: actorId=${filter.actorId ?? '-'} tenantId=${filter.tenantId ?? '-'} eventType=${filter.eventType ?? '-'} riskLevel=${filter.riskLevel ?? '-'} limit=${filter.limit ?? '-'}`)
    let results = Array.from(this.auditLogs.values())

    // 按过滤条件筛选
    if (filter.actorId) {
      results = results.filter((l) => l.actorId === filter.actorId)
    }
    if (filter.tenantId) {
      results = results.filter((l) => l.tenantId === filter.tenantId)
    }
    if (filter.eventType) {
      results = results.filter((l) => l.eventType === filter.eventType)
    }
    if (filter.riskLevel) {
      results = results.filter((l) => l.riskLevel === filter.riskLevel)
    }
    if (filter.from) {
      results = results.filter((l) => l.timestamp >= filter.from!)
    }
    if (filter.to) {
      results = results.filter((l) => l.timestamp <= filter.to!)
    }

    const total = results.length

    // 按时间戳倒序
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())

    // cursor 分页：cursor 格式为 "timestamp||id"，使用 || 分隔避免 id 中下划线干扰
    if (filter.cursor) {
      const sepIdx = filter.cursor.indexOf('||')
      if (sepIdx > 0) {
        const cursorTs = filter.cursor.substring(0, sepIdx)
        const cursorId = filter.cursor.substring(sepIdx + 2)
        const cursorTime = new Date(parseInt(cursorTs, 10)).getTime()
        const cursorIdx = results.findIndex(
          (l) => l.timestamp.getTime() === cursorTime && l.id === cursorId,
        )
        if (cursorIdx >= 0) {
          results = results.slice(cursorIdx + 1)
        }
      }
    }

    // limit
    if (filter.limit && filter.limit > 0) {
      results = results.slice(0, filter.limit)
    }

    // 生成 nextCursor
    let nextCursor: string | undefined
    if (filter.limit && results.length === filter.limit) {
      const last = results[results.length - 1]
      nextCursor = `${last.timestamp.getTime()}||${last.id}`
    }

    this.logger.log(`[AUDIT] Query result: ${results.length} items (total=${total})`)
    return { items: results, nextCursor, total }
  }

  /** 获取单条审计详情 */
  async getById(id: string): Promise<AuditLog | null> {
    const log = this.auditLogs.get(id) ?? null
    this.logger.log(`[AUDIT] GetById id=${id} found=${log !== null}`)
    return log
  }

  /** 获取用户在时间范围内的所有操作（用于 DSR access）*/
  async getUserActivityLog(userId: string, from: Date, to: Date): Promise<AuditLog[]> {
    this.logger.log(`[AUDIT] GetUserActivity userId=${userId} from=${from.toISOString()} to=${to.toISOString()}`)
    const results = Array.from(this.auditLogs.values()).filter(
      (l) => l.actorId === userId && l.timestamp >= from && l.timestamp <= to,
    )
    // 按时间正序排列
    results.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    this.logger.log(`[AUDIT] User activity: ${results.length} records for userId=${userId}`)
    return results
  }

  // ── 安全分析 ─────────────────────────────────────────────────────────

  /** 分析异常行为（同一IP短时间内大量失败登录 → high risk）*/
  async detectAnomalies(
    windowMinutes = 5,
  ): Promise<Array<{ pattern: string; riskLevel: RiskLevel; count: number }>> {
    const anomalies: Array<{ pattern: string; riskLevel: RiskLevel; count: number }> = []
    const now = Date.now()
    const windowMs = windowMinutes * 60 * 1000

    this.logger.log(`[AUDIT] Running anomaly detection, window=${windowMinutes}min`)

    // 收集所有日志
    const logs = Array.from(this.auditLogs.values())

    // 规则1: 同一 IP 5 分钟内 5+ 次失败登录 → high
    const ipLoginFailures = new Map<string, AuditLog[]>()
    for (const log of logs) {
      if (log.eventType === 'auth.login' && log.metadata?.success === false) {
        const ip = log.ipAddress ?? 'unknown'
        if (!ipLoginFailures.has(ip)) ipLoginFailures.set(ip, [])
        ipLoginFailures.get(ip)!.push(log)
      }
    }
    for (const [ip, logList] of ipLoginFailures) {
      const recent = logList.filter((l) => now - l.timestamp.getTime() <= windowMs)
      if (recent.length >= 5) {
        anomalies.push({
          pattern: `同一 IP ${ip} 短时间内 ${recent.length} 次失败登录`,
          riskLevel: 'high',
          count: recent.length,
        })
      }
    }

    // 规则2: 同一用户 1 小时内 20+ 次敏感操作 → medium
    const userSensitiveOps = new Map<string, AuditLog[]>()
    const sensitiveEvents = [
      'user.profile_update',
      'user.data_delete',
      'auth.password_change',
      'admin.config_change',
      'admin.user_impersonate',
      'admin.data_export',
      'admin.role_create',
      'admin.role_update',
      'admin.role_delete',
      'admin.permission_grant',
      'admin.permission_revoke',
      'user.role_assigned',
      'user.role_unassigned',
    ]
    for (const log of logs) {
      if (sensitiveEvents.includes(log.eventType)) {
        if (!userSensitiveOps.has(log.actorId)) userSensitiveOps.set(log.actorId, [])
        userSensitiveOps.get(log.actorId)!.push(log)
      }
    }
    const oneHourMs = 60 * 60 * 1000
    for (const [userId, logList] of userSensitiveOps) {
      const recent = logList.filter((l) => now - l.timestamp.getTime() <= oneHourMs)
      if (recent.length >= 20) {
        anomalies.push({
          pattern: `用户 ${userId} 1 小时内 ${recent.length} 次敏感操作`,
          riskLevel: 'medium',
          count: recent.length,
        })
      }
    }

    // 规则3: 管理员模拟用户操作 → critical
    const adminImpersonations = logs.filter(
      (l) => l.actorType === 'admin' && l.eventType === 'admin.user_impersonate',
    )
    if (adminImpersonations.length > 0) {
      anomalies.push({
        pattern: `管理员模拟用户操作 ${adminImpersonations.length} 次`,
        riskLevel: 'critical',
        count: adminImpersonations.length,
      })
    }

    if (anomalies.length > 0) {
      this.logger.warn(`[AUDIT] Anomalies detected: ${anomalies.length} patterns found`)
      for (const a of anomalies) {
        this.logger.warn(`[AUDIT]   Anomaly: risk=${a.riskLevel} count=${a.count} pattern=${a.pattern}`)
      }
    } else {
      this.logger.log('[AUDIT] No anomalies detected')
    }

    return anomalies
  }

  /** 计算风险评分（0-100）*/
  async computeRiskScore(actorId: string): Promise<number> {
    this.logger.log(`[AUDIT] Computing risk score for actorId=${actorId}`)
    const logs = Array.from(this.auditLogs.values()).filter((l) => l.actorId === actorId)
    if (logs.length === 0) {
      this.logger.log(`[AUDIT] No audit logs found for actorId=${actorId}, score=0`)
      return 0
    }

    const now = Date.now()
    const oneDayMs = 24 * 60 * 60 * 1000
    const oneHourMs = 60 * 60 * 1000

    // 基于异常检测结果加分
    const anomalies = await this.detectAnomalies()
    let score = 0

    for (const anomaly of anomalies) {
      const relatedLogs = logs.filter((l) => {
        if (anomaly.riskLevel === 'critical') return l.eventType === 'admin.user_impersonate'
        if (anomaly.riskLevel === 'high') {
          return l.ipAddress && anomaly.pattern.includes(l.ipAddress)
        }
        return false
      })
      if (relatedLogs.length > 0) {
        if (anomaly.riskLevel === 'critical') score += 50
        else if (anomaly.riskLevel === 'high') score += 30
        else if (anomaly.riskLevel === 'medium') score += 15
        else score += 5
      }
    }

    // 基于操作频率：最近 1 小时内操作数
    const recentOps = logs.filter((l) => now - l.timestamp.getTime() <= oneHourMs)
    if (recentOps.length > 50) score += 20
    else if (recentOps.length > 20) score += 10
    else if (recentOps.length > 10) score += 5

    // 基于时间：最近 24 小时内有高风险操作
    const recentHighRisk = logs.filter(
      (l) =>
        (l.riskLevel === 'high' || l.riskLevel === 'critical') &&
        now - l.timestamp.getTime() <= oneDayMs,
    )
    if (recentHighRisk.length >= 3) score += 20
    else if (recentHighRisk.length >= 1) score += 10

    const finalScore = Math.min(100, score)
    this.logger.log(`[AUDIT] Risk score for actorId=${actorId}: ${finalScore}/100 (anomalies=${anomalies.length}, recentOps=${recentOps.length})`)
    return finalScore
  }

  // ── 分账日志 ─────────────────────────────────────────────────────────

  /** 记录分账事件（关联 settlementId）*/
  async logSettlementEvent(
    settlementId: string,
    amount: number,
    eventType: SettlementEventType,
    metadata?: Record<string, unknown>,
  ): Promise<string> {
    const eventTypeMap: Record<SettlementEventType, AuditEventType> = {
      created: 'settlement.created',
      approved: 'settlement.approved',
      paid: 'settlement.paid',
      rejected: 'settlement.rejected',
    }
    this.logger.log(`[AUDIT] Settlement event: ${eventType} settlementId=${settlementId} amount=${amount}`)
    return this.log({
      eventType: eventTypeMap[eventType],
      actorId: 'system',
      actorType: 'system',
      settlementId,
      settlementAmount: amount,
      piiFields: [],
      riskLevel: eventType === 'rejected' ? 'medium' : 'low',
      metadata,
    })
  }

  /** 查询分账关联的所有审计记录 */
  async getSettlementAuditTrail(settlementId: string): Promise<AuditLog[]> {
    this.logger.log(`[AUDIT] Query settlement trail: settlementId=${settlementId}`)
    const results = Array.from(this.auditLogs.values()).filter(
      (l) => l.settlementId === settlementId,
    )
    results.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    this.logger.log(`[AUDIT] Settlement trail: ${results.length} records for settlementId=${settlementId}`)
    return results
  }

  // ── 导出 ──────────────────────────────────────────────────────────────

  /** 导出审计报告（用于合规审查）*/
  async exportReport(from: Date, to: Date, format: 'json' | 'csv'): Promise<string> {
    this.logger.log(`[AUDIT] Export report: from=${from.toISOString()} to=${to.toISOString()} format=${format}`)
    const logs = Array.from(this.auditLogs.values()).filter(
      (l) => l.timestamp >= from && l.timestamp <= to,
    )
    logs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())

    if (format === 'json') {
      this.logger.log(`[AUDIT] Export complete: ${logs.length} records, format=json`)
      return JSON.stringify(logs, null, 2)
    }

    // CSV 格式：每条记录一行，逗号分隔
    const headers = [
      'id',
      'eventType',
      'actorId',
      'actorType',
      'tenantId',
      'resourceType',
      'resourceId',
      'ipAddress',
      'riskLevel',
      'timestamp',
      'settlementId',
      'settlementAmount',
    ]
    const rows = logs.map((l) =>
      [
        l.id,
        l.eventType,
        l.actorId,
        l.actorType,
        l.tenantId ?? '',
        l.resourceType ?? '',
        l.resourceId ?? '',
        l.ipAddress ?? '',
        l.riskLevel,
        l.timestamp.toISOString(),
        l.settlementId ?? '',
        l.settlementAmount ?? '',
      ].join(','),
    )
    this.logger.log(`[AUDIT] Export complete: ${logs.length} records, format=csv`)
    return [headers.join(','), ...rows].join('\n')
  }

  /** 生成合规报告（GDPR Article 30）*/
  async generateComplianceReport(tenantId: string): Promise<{
    processingActivities: unknown[]
    consentRecords: unknown[]
    dsrRequests: unknown[]
    dataBreaches: unknown[]
  }> {
    this.logger.log(`[AUDIT] Generating compliance report for tenantId=${tenantId}`)
    const logs = Array.from(this.auditLogs.values()).filter((l) => l.tenantId === tenantId)

    // processing activities: 所有数据处理操作
    const processingActivities = logs.map((l) => ({
      eventType: l.eventType,
      actorId: l.actorId,
      resourceType: l.resourceType,
      resourceId: l.resourceId,
      timestamp: l.timestamp,
      riskLevel: l.riskLevel,
    }))

    // consent records: 同意记录
    const consentRecords = logs
      .filter((l) => l.eventType === 'compliance.consent_recorded')
      .map((l) => ({
        actorId: l.actorId,
        consentVersion: l.consentVersion,
        timestamp: l.timestamp,
        metadata: l.metadata,
      }))

    // dsr requests: 数据主体请求
    const dsrRequests = logs
      .filter(
        (l) =>
          l.eventType === 'compliance.dsr_submitted' || l.eventType === 'compliance.dsr_processed',
      )
      .map((l) => ({
        actorId: l.actorId,
        eventType: l.eventType,
        timestamp: l.timestamp,
        metadata: l.metadata,
      }))

    // data breaches: 数据泄露（高风险或关键操作）
    const dataBreaches = logs
      .filter((l) => l.riskLevel === 'critical' || l.riskLevel === 'high')
      .map((l) => ({
        eventType: l.eventType,
        actorId: l.actorId,
        ipAddress: l.ipAddress,
        timestamp: l.timestamp,
        riskLevel: l.riskLevel,
      }))

    this.logger.log(`[AUDIT] Compliance report generated: tenantId=${tenantId} activities=${processingActivities.length} consents=${consentRecords.length} dsr=${dsrRequests.length} breaches=${dataBreaches.length}`)
    return {
      processingActivities,
      consentRecords,
      dsrRequests,
      dataBreaches,
    }
  }

  // ── 测试辅助 ─────────────────────────────────────────────────────────

  /** 清空所有日志（仅用于测试）*/
  __reset(): void {
    this.auditLogs.clear()
    this.clientIP = null
    this.traceId = null
    this.idCounter = 0
    this.logger.warn('[AUDIT] In-memory logs cleared (test mode)')
  }

  /** 获取所有日志（仅用于测试）*/
  __getAll(): AuditLog[] {
    return Array.from(this.auditLogs.values())
  }
}
