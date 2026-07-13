/**
 * audit-ringbeam.test.ts - V17#圈梁 Phase1 基础设施圈梁
 * 用途: PRD对齐测试 - 验证审计日志核心流程
 * 覆盖: 正例(日志记录/查询) + 反例(无效ID) + 边界(批量/异常检测/导出)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AuditService } from './audit.service'
import type { AuditEventType, RiskLevel } from './audit.service'

describe('🔵 AuditRingBeam: 审计日志PRD对齐', () => {
  let auditService: AuditService

  beforeEach(() => {
    auditService = new AuditService()
  })

  // ─── 正例: 记录审计事件 ──────────────────────────────────────────

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

  // ─── 正例: 查询审计日志 ──────────────────────────────────────────

  it('[P0] 应能通过query查询特定actor的审计记录', async () => {
    // 先写入一条记录
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

  // ─── 反例: 查询不存在的ID ───────────────────────────────────────

  it('[P1] getById查询不存在的ID应返回null', async () => {
    const log = await auditService.getById('non-existent-id')
    expect(log).toBeNull()
  })

  // ─── 边界: 批量记录 ─────────────────────────────────────────────

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

  // ─── 边界: 分账日志记录与查询 ───────────────────────────────────

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

  // ─── 报告导出 ────────────────────────────────────────────────────

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
})
