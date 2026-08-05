/**
 * audit.service.spec.ts — 审计日志 Service 深层单元测试
 *
 * 覆盖：AuditService
 *  - log:                正例（登录/带IP/带TraceId）/ 边界（事件IP优先于上下文IP）
 *  - logBatch:           正例（批量3条）/ 边界（空数组）
 *  - query:              正例（全部/按actor/按eventType/按riskLevel）/ 边界（不存在的actor/分页/time范围）
 *  - getById:            正例（查存在）/ 反例（查不存在）
 *  - getUserActivityLog: 正例（有记录）/ 边界（空）
 *  - detectAnomalies:    正例（IP登录失败/管理员模拟）/ 边界（无异常）
 *  - computeRiskScore:   正例（无操作0分/有操作>0）/ 边界（上限100）
 *  - settlement:         正例（创建/审计追踪）/ 边界（不存在的settlementId）
 *  - exportReport:       正例（JSON/CSV）/ 边界（空范围）
 *  - generateComplianceReport: 正例（合规报告）/ 边界（空租户）
 *  - __reset/__getAll:   正例
 *
 * 全部内联 mock，不依赖 NestJS DI。
 *
 * ⚠️ NOTE: 此文件与 audit.service.test.ts 同时存在，是独立的 spec 文件，
 *   采用 ai-content 风格的枚举 + 内联业务逻辑 + ≥18 测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AuditService } from './audit.service'
import type { AuditLog, AuditEventType, RiskLevel } from './audit.service'

// ═══════════════════════════════════════════════════════════════
// 测试常量 - 模拟 DTO + 枚举
// ═══════════════════════════════════════════════════════════════

const MOCK_EVENTS: Array<{ eventType: AuditEventType; actorId: string; actorType: 'user' | 'admin' | 'system'; riskLevel: RiskLevel }> = [
  { eventType: 'auth.login',    actorId: 'user_001', actorType: 'user',  riskLevel: 'low' },
  { eventType: 'order.paid',    actorId: 'user_001', actorType: 'user',  riskLevel: 'medium' },
  { eventType: 'auth.logout',   actorId: 'user_001', actorType: 'user',  riskLevel: 'low' },
  { eventType: 'admin.config_change', actorId: 'admin_01', actorType: 'admin', riskLevel: 'high' },
  { eventType: 'payment.failed', actorId: 'user_002', actorType: 'user', riskLevel: 'high' },
]

// ═══════════════════════════════════════════════════════════════
// mock 工厂（纯函数 — 直接 new，不依赖 DI）
// ═══════════════════════════════════════════════════════════════

function createAuditService(): AuditService {
  const svc = new AuditService()
  svc.__reset()
  return svc
}

// ═══════════════════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════════════════

describe('AuditService', () => {
  let service: AuditService

  beforeEach(() => {
    service = createAuditService()
  })

  // ── log ─────────────────────────────────────────────────────
  describe('log', () => {
    it('✅ 正例: 记录登录事件', async () => {
      const id = await service.log(MOCK_EVENTS[0])
      expect(id).toMatch(/^audit_\d+_\d+$/)
    })

    it('✅ 正例: 记录的包含全部必填字段', async () => {
      const id = await service.log(MOCK_EVENTS[0])
      const log = await service.getById(id)
      expect(log!.eventType).toBe('auth.login')
      expect(log!.actorId).toBe('user_001')
      expect(log!.actorType).toBe('user')
      expect(log!.riskLevel).toBe('low')
      expect(log!.id).toBe(id)
      expect(log!.timestamp).toBeInstanceOf(Date)
    })

    it('✅ 正例: 能从上下文注入 IP', async () => {
      service.setClientIP('10.0.0.1')
      const id = await service.log(MOCK_EVENTS[0])
      const log = await service.getById(id)
      expect(log!.ipAddress).toBe('10.0.0.1')
    })

    it('✅ 正例: 能从上下文注入 TraceId', async () => {
      service.setTraceId('trace-abc-123')
      const id = await service.log(MOCK_EVENTS[0])
      const log = await service.getById(id)
      expect(log!.traceId).toBe('trace-abc-123')
    })

    it('🔲 边界: 事件自带 IP 优先于上下文 IP', async () => {
      service.setClientIP('10.0.0.1')
      const id = await service.log({ ...MOCK_EVENTS[0], ipAddress: '192.168.1.1' })
      const log = await service.getById(id)
      expect(log!.ipAddress).toBe('192.168.1.1')
    })
  })

  // ── logBatch ────────────────────────────────────────────────
  describe('logBatch', () => {
    it('✅ 正例: 批量记录 3 条事件', async () => {
      const ids = await service.logBatch(MOCK_EVENTS.slice(0, 3))
      expect(ids).toHaveLength(3)
      expect(service.__getAll().length).toBe(3)
    })

    it('🔲 边界: 批量记录空数组', async () => {
      const ids = await service.logBatch([])
      expect(ids).toHaveLength(0)
    })
  })

  // ── query ───────────────────────────────────────────────────
  describe('query', () => {
    beforeEach(async () => {
      await service.logBatch(MOCK_EVENTS)
    })

    it('✅ 正例: 全部查询', async () => {
      const result = await service.query({ limit: 10 })
      expect(result.items.length).toBe(5)
      expect(result.total).toBe(5)
    })

    it('✅ 正例: 按 actorId 过滤', async () => {
      const result = await service.query({ actorId: 'user_001' })
      expect(result.items.length).toBe(3)
    })

    it('✅ 正例: 按 eventType 过滤', async () => {
      const result = await service.query({ eventType: 'auth.login' })
      expect(result.items.length).toBe(1)
    })

    it('✅ 正例: 按 riskLevel 过滤', async () => {
      const result = await service.query({ riskLevel: 'high' })
      expect(result.items.length).toBe(2)
    })

    it('🔲 边界: 不存在的 actorId 返回空', async () => {
      const result = await service.query({ actorId: 'nonexistent' })
      expect(result.items.length).toBe(0)
    })

    it('🔲 边界: limit 分页返回 nextCursor', async () => {
      const result = await service.query({ limit: 2 })
      expect(result.items.length).toBe(2)
      expect(result.nextCursor).toBeDefined()
    })

    it('🔲 边界: 时间范围过滤无命中', async () => {
      const result = await service.query({
        from: new Date(Date.now() + 86400000),
        to: new Date(Date.now() + 172800000),
      })
      expect(result.items.length).toBe(0)
    })
  })

  // ── getById ────────────────────────────────────────────────
  describe('getById', () => {
    it('✅ 正例: 查询存在的记录', async () => {
      const id = await service.log(MOCK_EVENTS[0])
      const log = await service.getById(id)
      expect(log).not.toBeNull()
      expect(log!.id).toBe(id)
    })

    it('❌ 反例: 查询不存在的记录返回 null', async () => {
      const log = await service.getById('nonexistent')
      expect(log).toBeNull()
    })
  })

  // ── getUserActivityLog ─────────────────────────────────────
  describe('getUserActivityLog', () => {
    it('✅ 正例: 获取 user_001 活动', async () => {
      await service.logBatch(MOCK_EVENTS.slice(0, 3))
      const logs = await service.getUserActivityLog('user_001', new Date(0), new Date())
      expect(logs.length).toBe(3)
    })

    it('🔲 边界: 非活跃用户返回空', async () => {
      const logs = await service.getUserActivityLog('inactive_user', new Date(0), new Date())
      expect(logs.length).toBe(0)
    })
  })

  // ── detectAnomalies ─────────────────────────────────────────
  describe('detectAnomalies', () => {
    it('✅ 正例: 检测到 IP 登录失败异常', async () => {
      for (let i = 0; i < 5; i++) {
        await service.log({
          eventType: 'auth.login',
          actorId: `user_${i}`,
          actorType: 'user',
          ipAddress: '10.0.0.1',
          riskLevel: 'low',
          metadata: { success: false },
        })
      }
      const anomalies = await service.detectAnomalies(5)
      expect(anomalies.length).toBeGreaterThan(0)
      expect(anomalies[0].riskLevel).toBe('high')
    })

    it('✅ 正例: 检测管理员模拟操作', async () => {
      await service.log({
        eventType: 'admin.user_impersonate',
        actorId: 'admin_01',
        actorType: 'admin',
        riskLevel: 'critical',
      })
      const anomalies = await service.detectAnomalies()
      const found = anomalies.find(a => a.pattern.includes('管理员模拟'))
      expect(found).toBeDefined()
      expect(found!.riskLevel).toBe('critical')
    })

    it('🔲 边界: 无异常时返回空数组', async () => {
      await service.log({ ...MOCK_EVENTS[0], metadata: { success: true } })
      const anomalies = await service.detectAnomalies()
      expect(anomalies.length).toBe(0)
    })
  })

  // ── computeRiskScore ────────────────────────────────────────
  describe('computeRiskScore', () => {
    it('✅ 正例: 无操作评分为 0', async () => {
      const score = await service.computeRiskScore('inactive_user')
      expect(score).toBe(0)
    })

    it('✅ 正例: 有大量操作评分 > 0', async () => {
      for (let i = 0; i < 60; i++) {
        await service.log({ ...MOCK_EVENTS[0] })
      }
      const score = await service.computeRiskScore('user_001')
      expect(score).toBeGreaterThan(0)
    })

    it('🔲 边界: 评分上限 100', async () => {
      await service.log({
        eventType: 'admin.user_impersonate',
        actorId: 'mal_admin',
        actorType: 'admin',
        riskLevel: 'critical',
      })
      for (let i = 0; i < 100; i++) {
        await service.log({ ...MOCK_EVENTS[0], actorId: 'mal_admin' })
      }
      const score = await service.computeRiskScore('mal_admin')
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  // ── settlement ──────────────────────────────────────────────
  describe('settlement', () => {
    it('✅ 正例: 记录分账创建事件', async () => {
      const id = await service.logSettlementEvent('sett_001', 10000, 'created')
      const log = await service.getById(id)
      expect(log!.settlementId).toBe('sett_001')
      expect(log!.settlementAmount).toBe(10000)
    })

    it('✅ 正例: 获取分账审计追踪', async () => {
      await service.logSettlementEvent('sett_002', 20000, 'created')
      await service.logSettlementEvent('sett_002', 20000, 'approved')
      await service.logSettlementEvent('sett_002', 20000, 'paid')
      const trail = await service.getSettlementAuditTrail('sett_002')
      expect(trail.length).toBe(3)
      expect(trail[0].eventType).toBe('settlement.created')
      expect(trail[2].eventType).toBe('settlement.paid')
    })

    it('🔲 边界: 不存在的分账 ID 返回空', async () => {
      const trail = await service.getSettlementAuditTrail('nonexistent')
      expect(trail.length).toBe(0)
    })
  })

  // ── exportReport ────────────────────────────────────────────
  describe('exportReport', () => {
    it('✅ 正例: JSON 导出', async () => {
      await service.log(MOCK_EVENTS[0])
      const json = await service.exportReport(new Date(0), new Date(), 'json')
      const parsed = JSON.parse(json)
      expect(parsed.length).toBe(1)
      expect(parsed[0].eventType).toBe('auth.login')
    })

    it('✅ 正例: CSV 导出包含逗号分隔头', async () => {
      await service.log(MOCK_EVENTS[0])
      const csv = await service.exportReport(new Date(0), new Date(), 'csv')
      expect(csv).toContain('id,eventType')
    })

    it('🔲 边界: 空范围导出为 []', async () => {
      const json = await service.exportReport(new Date('2020-01-01'), new Date('2020-01-02'), 'json')
      expect(json).toBe('[]')
    })
  })

  // ── generateComplianceReport ─────────────────────────────────
  describe('generateComplianceReport', () => {
    it('✅ 正例: 生成合规报告含 processing 和 consent 记录', async () => {
      await service.log({
        eventType: 'compliance.consent_recorded',
        actorId: 'user_001',
        actorType: 'user',
        riskLevel: 'low',
        tenantId: 'tenant_001',
        consentVersion: 'v2',
      })
      await service.log({
        eventType: 'auth.login',
        actorId: 'user_001',
        actorType: 'user',
        riskLevel: 'high',
        tenantId: 'tenant_001',
      })
      const report = await service.generateComplianceReport('tenant_001')
      expect(report.processingActivities.length).toBe(2)
      expect(report.consentRecords.length).toBe(1)
      expect((report.consentRecords[0] as Record<string, unknown>).consentVersion).toBe('v2')
    })

    it('🔲 边界: 空租户返回全空数组', async () => {
      const report = await service.generateComplianceReport('empty_tenant')
      expect(report.processingActivities.length).toBe(0)
      expect(report.consentRecords.length).toBe(0)
      expect(report.dsrRequests.length).toBe(0)
    })
  })

  // ── 测试辅助 ────────────────────────────────────────────────
  describe('__reset / __getAll', () => {
    it('✅ 正例: reset 清空 + getAll 返回快照', async () => {
      await service.logBatch(MOCK_EVENTS)
      expect(service.__getAll().length).toBe(5)
      service.__reset()
      expect(service.__getAll().length).toBe(0)
    })
  })
})
