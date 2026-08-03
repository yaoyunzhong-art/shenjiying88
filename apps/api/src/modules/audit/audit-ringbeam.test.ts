/**
 * audit-ringbeam.test.ts - V17#圈梁 Phase1 基础设施圈梁
 * 用途: PRD对齐测试 - 验证审计日志核心流程 (扩展版)
 * 覆盖: 正例(日志记录/查询/分账/异常检测) + 反例(无效ID/空结果/边界) + 边界(批量/导出/合规/风险评分)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AuditService } from './audit.service'
import type { AuditEventType, RiskLevel, AuditLog, AuditQuery } from './audit.service'

describe('🔵 AuditRingBeam: 审计日志PRD对齐', () => {
  let auditService: AuditService

  beforeEach(() => {
    auditService = new AuditService()
  })

  // ═══════ 正例: 记录审计事件 ══════════════════════════════════════

  it('[P0] 应能成功记录登录审计事件并返回ID', async () => {
    const id = await auditService.log({
      eventType: 'auth.login' as AuditEventType,
      actorId: 'user_admin_001',
      actorType: 'user',
      tenantId: 'tenant-demo',
      riskLevel: 'low' as RiskLevel,
      metadata: { success: true, loginType: 'password' },
      ipAddress: '192.168.1.100',
    })

    expect(id).toBeTruthy()
    expect(id).toMatch(/^audit_\d+_\d+$/)
  })

  it('[P0] 应能记录全字段审计事件', async () => {
    const id = await auditService.log({
      eventType: 'order.created' as AuditEventType,
      actorId: 'user_001',
      actorType: 'user',
      tenantId: 'tenant_abc',
      resourceType: 'order',
      resourceId: 'ord_001',
      metadata: { items: 3, total: 299.99 },
      ipAddress: '10.0.0.1',
      userAgent: 'Mozilla/5.0',
      riskLevel: 'low' as RiskLevel,
      traceId: 'trace_abc',
      parentSpanId: 'span_001',
    })
    const log = await auditService.getById(id)
    expect(log).not.toBeNull()
    expect(log!.resourceType).toBe('order')
    expect(log!.resourceId).toBe('ord_001')
    expect(log!.userAgent).toBe('Mozilla/5.0')
  })

  it('[P0] 应能记录 critical 级别审计事件', async () => {
    const id = await auditService.log({
      eventType: 'admin.user_impersonate' as AuditEventType,
      actorId: 'admin_super',
      actorType: 'admin',
      riskLevel: 'critical' as RiskLevel,
      metadata: { impersonatedUser: 'user_002' },
    })
    const log = await auditService.getById(id)
    expect(log!.riskLevel).toBe('critical')
  })

  it('[P0] 应能为特定事件记录 PII 字段和同意版本', async () => {
    const id = await auditService.log({
      eventType: 'compliance.consent_recorded' as AuditEventType,
      actorId: 'user_003',
      actorType: 'user',
      riskLevel: 'low' as RiskLevel,
      piiFields: ['name', 'email'],
      consentVersion: 'v2.1',
    })
    const log = await auditService.getById(id)
    expect(log!.piiFields).toEqual(['name', 'email'])
    expect(log!.consentVersion).toBe('v2.1')
  })

  // ═══════ 正例: 查询审计日志 ══════════════════════════════════════

  it('[P0] 应能通过query查询特定actor的审计记录', async () => {
    await auditService.log({
      eventType: 'auth.login' as AuditEventType,
      actorId: 'user_query_test',
      actorType: 'user',
      riskLevel: 'low' as RiskLevel,
    })

    const result = await auditService.query({
      actorId: 'user_query_test',
    })

    expect(result.total).toBeGreaterThanOrEqual(1)
    expect(result.items[0].actorId).toBe('user_query_test')
  })

  it('[P0] query 支持按 eventType 过滤', async () => {
    await auditService.log({ eventType: 'auth.login' as AuditEventType, actorId: 'u1', actorType: 'user', riskLevel: 'low' as RiskLevel })
    await auditService.log({ eventType: 'order.created' as AuditEventType, actorId: 'u1', actorType: 'user', riskLevel: 'low' as RiskLevel })

    const result = await auditService.query({ eventType: 'auth.login' as AuditEventType })
    expect(result.total).toBe(1)
    expect(result.items[0].eventType).toBe('auth.login')
  })

  it('[P0] query 支持按 riskLevel 过滤', async () => {
    await auditService.log({ eventType: 'auth.login' as AuditEventType, actorId: 'u2', actorType: 'user', riskLevel: 'low' as RiskLevel })
    await auditService.log({ eventType: 'admin.user_impersonate' as AuditEventType, actorId: 'admin', actorType: 'admin', riskLevel: 'critical' as RiskLevel })

    const result = await auditService.query({ riskLevel: 'critical' as RiskLevel })
    expect(result.total).toBe(1)
  })

  it('[P0] query 支持按 tenantId 过滤', async () => {
    await auditService.log({ eventType: 'auth.login' as AuditEventType, actorId: 'u3', actorType: 'user', tenantId: 't1', riskLevel: 'low' as RiskLevel })
    await auditService.log({ eventType: 'order.created' as AuditEventType, actorId: 'u3', actorType: 'user', tenantId: 't2', riskLevel: 'low' as RiskLevel })

    const result = await auditService.query({ tenantId: 't1' })
    expect(result.total).toBe(1)
  })

  it('[P0] query 支持 limit 分页', async () => {
    for (let i = 0; i < 10; i++) {
      await auditService.log({ eventType: 'auth.login' as AuditEventType, actorId: `u_pg_${i}`, actorType: 'user', riskLevel: 'low' as RiskLevel })
    }
    const result = await auditService.query({ limit: 3 })
    expect(result.items.length).toBe(3)
    expect(result.total).toBe(10)
    expect(result.nextCursor).toBeTruthy()
  })

  it('[P0] query 支持 cursor 游标翻页', async () => {
    // 插入 5 条
    for (let i = 0; i < 5; i++) {
      await auditService.log({ eventType: 'auth.login' as AuditEventType, actorId: `u_c_${i}`, actorType: 'user', riskLevel: 'low' as RiskLevel })
    }
    const page1 = await auditService.query({ limit: 2 })
    expect(page1.items.length).toBe(2)

    const page2 = await auditService.query({ limit: 2, cursor: page1.nextCursor })
    expect(page2.items.length).toBe(2)
    expect(page2.items[0].actorId).not.toBe(page1.items[0].actorId)
  })

  it('[P0] query 支持时间范围过滤', async () => {
    const now = new Date()
    await auditService.log({ eventType: 'auth.login' as AuditEventType, actorId: 'u_ts', actorType: 'user', riskLevel: 'low' as RiskLevel, timestamp: now } as any)

    const from = new Date(now.getTime() - 1000)
    const to = new Date(now.getTime() + 1000)
    const result = await auditService.query({ from, to })
    expect(result.total).toBeGreaterThanOrEqual(1)
  })

  // ═══════ 反例: 无效输入 ══════════════════════════════════════════

  it('[P1] getById查询不存在的ID应返回null', async () => {
    const log = await auditService.getById('non-existent-id')
    expect(log).toBeNull()
  })

  it('[P1] query 过滤无匹配结果返回空', async () => {
    const result = await auditService.query({ actorId: 'nonexistent_user' })
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('[P1] getUserActivityLog 无匹配时返回空数组', async () => {
    const logs = await auditService.getUserActivityLog('unknown_user', new Date(0), new Date())
    expect(logs).toEqual([])
  })

  // ═══════ 边界: 批量记录 ══════════════════════════════════════════

  it('[P1] logBatch应能批量记录多条审计事件', async () => {
    const ids = await auditService.logBatch([
      {
        eventType: 'order.created' as AuditEventType,
        actorId: 'user_batch',
        actorType: 'user',
        riskLevel: 'low' as RiskLevel,
        resourceType: 'order',
        resourceId: 'ord_001',
      },
      {
        eventType: 'order.paid' as AuditEventType,
        actorId: 'user_batch',
        actorType: 'user',
        riskLevel: 'low' as RiskLevel,
        resourceType: 'order',
        resourceId: 'ord_001',
      },
      {
        eventType: 'order.refunded' as AuditEventType,
        actorId: 'user_batch',
        actorType: 'user',
        riskLevel: 'medium' as RiskLevel,
        resourceType: 'order',
        resourceId: 'ord_001',
      },
    ])

    expect(ids).toHaveLength(3)
    ids.forEach((id) => expect(id).toMatch(/^audit_\d+_\d+$/))
  })

  it('[P1] logBatch 空数组应返回空数组', async () => {
    const ids = await auditService.logBatch([])
    expect(ids).toEqual([])
  })

  // ═══════ 边界: 分账日志记录与查询 ═══════════════════════════════

  it('[P1] logSettlementEvent应记录并可通过settlementId查询', async () => {
    const id = await auditService.logSettlementEvent(
      'settlement_001', 1000.00, 'approved',
      { approvedBy: 'admin_001' },
    )

    expect(id).toBeTruthy()

    const trail = await auditService.getSettlementAuditTrail('settlement_001')
    expect(trail).toHaveLength(1)
    expect(trail[0].settlementId).toBe('settlement_001')
    expect(trail[0].settlementAmount).toBe(1000.00)
  })

  it('[P1] 分账事件四种类型均可记录', async () => {
    const types = ['created', 'approved', 'paid', 'rejected'] as const
    for (const t of types) {
      const id = await auditService.logSettlementEvent('settlement_multi', 500, t)
      expect(id).toBeTruthy()
    }
    const trail = await auditService.getSettlementAuditTrail('settlement_multi')
    expect(trail).toHaveLength(4)
  })

  it('[P1] rejected 分账事件风险等级为 medium', async () => {
    await auditService.logSettlementEvent('settlement_rej', 100, 'rejected')
    const trail = await auditService.getSettlementAuditTrail('settlement_rej')
    expect(trail[0].riskLevel).toBe('medium')
  })

  it('[P1] logSettlementEvent 不涉及 PII', async () => {
    await auditService.logSettlementEvent('settlement_pii', 200, 'approved')
    const trail = await auditService.getSettlementAuditTrail('settlement_pii')
    expect(trail[0].piiFields).toEqual([])
  })

  it('[P1] 不存在的 settlementId 返回空数组', async () => {
    const trail = await auditService.getSettlementAuditTrail('non_existent')
    expect(trail).toEqual([])
  })

  // ═══════ 正例/边界: 报告导出 ════════════════════════════════════

  it('[P1] exportReport应生成JSON格式的审计报告', async () => {
    const from = new Date(Date.now() - 3600000)
    const to = new Date(Date.now() + 3600000)

    await auditService.log({
      eventType: 'auth.login' as AuditEventType,
      actorId: 'user_report',
      actorType: 'user',
      riskLevel: 'low' as RiskLevel,
    })

    const report = await auditService.exportReport(from, to, 'json')
    expect(report).toBeTruthy()
    expect(() => JSON.parse(report)).not.toThrow()
    const parsed = JSON.parse(report)
    expect(Array.isArray(parsed)).toBe(true)
  })

  it('[P1] exportReport 生成 CSV 格式报告', async () => {
    const from = new Date(Date.now() - 3600000)
    const to = new Date(Date.now() + 3600000)

    await auditService.log({
      eventType: 'auth.login' as AuditEventType,
      actorId: 'user_csv',
      actorType: 'user',
      riskLevel: 'low' as RiskLevel,
    })

    const report = await auditService.exportReport(from, to, 'csv')
    expect(report).toContain('id,eventType,actorId')
    expect(report).toContain('user_csv')
  })

  it('[P1] exportReport 空时间范围返回空结果', async () => {
    const from = new Date('2020-01-01')
    const to = new Date('2020-01-02')
    const report = await auditService.exportReport(from, to, 'json')
    expect(JSON.parse(report)).toEqual([])
  })

  // ═══════ 正例/边界: IP 和 TraceId 注入 ══════════════════════════

  it('[P1] setClientIP 自动注入到后续日志', async () => {
    auditService.setClientIP('10.0.0.99')
    const id = await auditService.log({
      eventType: 'auth.login' as AuditEventType,
      actorId: 'user_ip',
      actorType: 'user',
      riskLevel: 'low' as RiskLevel,
    })
    const log = await auditService.getById(id)
    expect(log!.ipAddress).toBe('10.0.0.99')
  })

  it('[P1] setTraceId 自动注入到后续日志', async () => {
    auditService.setTraceId('trace_ip_001')
    const id = await auditService.log({
      eventType: 'order.created' as AuditEventType,
      actorId: 'user_trace',
      actorType: 'user',
      riskLevel: 'low' as RiskLevel,
    })
    const log = await auditService.getById(id)
    expect(log!.traceId).toBe('trace_ip_001')
  })

  it('[P1] getClientIP / getTraceId 返回当前值', () => {
    expect(auditService.getClientIP()).toBeNull()
    auditService.setClientIP('1.2.3.4')
    expect(auditService.getClientIP()).toBe('1.2.3.4')

    expect(auditService.getTraceId()).toBeNull()
    auditService.setTraceId('tr_001')
    expect(auditService.getTraceId()).toBe('tr_001')
  })

  it('[P1] 日志中自带的 ipAddress 优先于注入值', async () => {
    auditService.setClientIP('10.0.0.99')
    const id = await auditService.log({
      eventType: 'auth.login' as AuditEventType,
      actorId: 'user_override',
      actorType: 'user',
      riskLevel: 'low' as RiskLevel,
      ipAddress: '1.1.1.1',
    })
    const log = await auditService.getById(id)
    expect(log!.ipAddress).toBe('1.1.1.1')
  })

  // ═══════ 边界: 异常检测 ══════════════════════════════════════════

  it('[P1] detectAnomalies 空日志返回空数组', async () => {
    const anomalies = await auditService.detectAnomalies()
    expect(anomalies).toEqual([])
  })

  it('[P1] detectAnomalies 检测到同一IP多次登录失败', async () => {
    const now = new Date()
    for (let i = 0; i < 5; i++) {
      await auditService.log({
        eventType: 'auth.login' as AuditEventType,
        actorId: `user_fail_${i}`,
        actorType: 'user',
        riskLevel: 'low' as RiskLevel,
        metadata: { success: false },
        ipAddress: '1.2.3.4',
        timestamp: now,
      } as any)
    }
    const anomalies = await auditService.detectAnomalies(60) // 60 min window
    expect(anomalies.length).toBeGreaterThanOrEqual(1)
    expect(anomalies[0].riskLevel).toBe('high')
  })

  it('[P1] detectAnomalies 检测到管理员模拟用户操作', async () => {
    await auditService.log({
      eventType: 'admin.user_impersonate' as AuditEventType,
      actorId: 'admin_super',
      actorType: 'admin',
      riskLevel: 'critical' as RiskLevel,
    })
    const anomalies = await auditService.detectAnomalies()
    const impersonateAnomaly = anomalies.find(a => a.pattern.includes('管理员模拟'))
    expect(impersonateAnomaly).toBeDefined()
    expect(impersonateAnomaly!.riskLevel).toBe('critical')
  })

  // ═══════ 边界: 风险评分 ══════════════════════════════════════════

  it('[P1] computeRiskScore 无活动返回 0', async () => {
    const score = await auditService.computeRiskScore('unknown_user')
    expect(score).toBe(0)
  })

  it('[P1] computeRiskScore 正常活动返回低分', async () => {
    for (let i = 0; i < 5; i++) {
      await auditService.log({
        eventType: 'auth.login' as AuditEventType,
        actorId: 'normal_user',
        actorType: 'user',
        riskLevel: 'low' as RiskLevel,
      })
    }
    const score = await auditService.computeRiskScore('normal_user')
    expect(score).toBeLessThan(40)
  })

  // ═══════ 边界: 合规报告 ══════════════════════════════════════════

  it('[P1] generateComplianceReport 返回空合规结构', async () => {
    const report = await auditService.generateComplianceReport('nonexistent_tenant')
    expect(report).toHaveProperty('processingActivities')
    expect(report).toHaveProperty('consentRecords')
    expect(report).toHaveProperty('dsrRequests')
    expect(report).toHaveProperty('dataBreaches')
    expect(report.processingActivities).toEqual([])
    expect(report.consentRecords).toEqual([])
    expect(report.dsrRequests).toEqual([])
    expect(report.dataBreaches).toEqual([])
  })

  it('[P1] generateComplianceReport 返回具有数据的合规报告', async () => {
    await auditService.log({
      eventType: 'auth.login' as AuditEventType,
      actorId: 'user_comp',
      actorType: 'user',
      tenantId: 'tenant_compliance',
      riskLevel: 'low' as RiskLevel,
    })
    await auditService.log({
      eventType: 'compliance.consent_recorded' as AuditEventType,
      actorId: 'user_comp',
      actorType: 'user',
      tenantId: 'tenant_compliance',
      riskLevel: 'low' as RiskLevel,
      consentVersion: 'v1',
    })

    const report = await auditService.generateComplianceReport('tenant_compliance')
    expect(report.processingActivities.length).toBe(2)
    expect(report.consentRecords.length).toBe(1)
  })

  // ═══════ 边界: 测试辅助方法 ══════════════════════════════════════

  it('[P2] __reset 清空所有状态', async () => {
    await auditService.log({ eventType: 'auth.login' as AuditEventType, actorId: 'u1', actorType: 'user', riskLevel: 'low' as RiskLevel })
    auditService.__reset()
    expect(auditService.__getAll()).toHaveLength(0)
    expect(auditService.getClientIP()).toBeNull()
    expect(auditService.getTraceId()).toBeNull()
  })

  it('[P2] __getAll 返回所有日志快照', async () => {
    await auditService.log({ eventType: 'auth.login' as AuditEventType, actorId: 'u1', actorType: 'user', riskLevel: 'low' as RiskLevel })
    await auditService.log({ eventType: 'order.created' as AuditEventType, actorId: 'u2', actorType: 'user', riskLevel: 'low' as RiskLevel })
    expect(auditService.__getAll()).toHaveLength(2)
  })
})
