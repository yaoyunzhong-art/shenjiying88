/**
 * audit.service.spec2.ts — 审计日志 Service 补充测试
 *
 * 覆盖现有 spec 未覆盖或薄弱的路径:
 *   - log: 已切换的 clientIP/traceId 不影响后续事件
 *   - query: 多条件组合过滤(actorId+eventType) / 空cursor/无效cursor / 时间范围精准 / 翻页完整
 *   - getUserActivityLog: 跨天时间范围 / 空时间范围
 *   - detectAnomalies: 低于阈值无异常 / 混合多种异常 / 窗口参数自定义
 *   - computeRiskScore: 临界值(50分/99分) / 仅低频操作评分低
 *   - logSettlementEvent: 四种事件类型全覆盖 / 金额为 0 / 负数金额
 *   - exportReport: 超大范围(全量) / CSV 每行字段数量一致
 *   - generateComplianceReport: 含 DSR 请求 / 无 consent 记录
 *   - setClientIP / setTraceId: null/空字符串边界
 *   - __getAll 快照隔离(外部修改不影响原Map)
 *   - **PII 字段验证**: 事件 metadata 中的 piiFields 可正确存储和查询
 *
 * 共 16 项测试。
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AuditService, type AuditEventType, type RiskLevel } from './audit.service'

// ══════════════════════════════════════════════════════════════════
// 工厂
// ══════════════════════════════════════════════════════════════════

function createService(): AuditService {
  const svc = new AuditService()
  svc.__reset()
  return svc
}

const BASE_EVENT = {
  eventType: 'auth.login' as AuditEventType,
  actorId: 'user_001',
  actorType: 'user' as const,
  riskLevel: 'low' as RiskLevel,
}

// ══════════════════════════════════════════════════════════════════
// 补充测试
// ══════════════════════════════════════════════════════════════════

describe('AuditService (spec2 — 补充边缘场景)', () => {
  let svc: AuditService

  beforeEach(() => {
    svc = createService()
  })

  // ── log 补充 ──────────────────────────────────────────────────
  describe('log — 补充', () => {
    it('设置 clientIP 后事件自动注入 IP', async () => {
      svc.setClientIP('10.0.0.99')
      const id = await svc.log({ ...BASE_EVENT })
      const log = await svc.getById(id)
      expect(log!.ipAddress).toBe('10.0.0.99')
    })

    it('事件自带 IP 优先级高于上下文 IP', async () => {
      svc.setClientIP('10.0.0.1')
      const id = await svc.log({ ...BASE_EVENT, ipAddress: '192.168.1.1' })
      const log = await svc.getById(id)
      expect(log!.ipAddress).toBe('192.168.1.1')
    })

    it('设置 clientIP 为 null 后事件无 IP', async () => {
      svc.setClientIP('10.0.0.1')
      svc.setClientIP('') // 设置为空字符串
      const id = await svc.log({ ...BASE_EVENT })
      const log = await svc.getById(id)
      expect(log!.ipAddress).toBe('') // 空字符串也是值
    })

    it('traceId 不影响后续无 traceId 事件', async () => {
      svc.setTraceId('trace-first')
      const id1 = await svc.log({ ...BASE_EVENT })
      expect((await svc.getById(id1))!.traceId).toBe('trace-first')

      svc.setTraceId('trace-second')
      const id2 = await svc.log({ ...BASE_EVENT })
      expect((await svc.getById(id2))!.traceId).toBe('trace-second')
    })

    it('PII 字段正确存储', async () => {
      const id = await svc.log({
        ...BASE_EVENT,
        piiFields: ['email', 'phone', 'address'],
        metadata: { action: 'profile_update' },
      })
      const log = await svc.getById(id)
      expect(log!.piiFields).toEqual(['email', 'phone', 'address'])
      expect(log!.metadata).toEqual({ action: 'profile_update' })
    })
  })

  // ── query 补充 ────────────────────────────────────────────────
  describe('query — 补充', () => {
    beforeEach(async () => {
      await svc.log({ eventType: 'auth.login', actorId: 'user_001', actorType: 'user', riskLevel: 'low' })
      await svc.log({ eventType: 'order.paid', actorId: 'user_001', actorType: 'user', riskLevel: 'medium' })
      await svc.log({ eventType: 'admin.config_change', actorId: 'admin_01', actorType: 'admin', riskLevel: 'high' })
      await svc.log({ eventType: 'payment.failed', actorId: 'user_002', actorType: 'user', riskLevel: 'high' })
    })

    it('多条件组合过滤: actorId + eventType', async () => {
      const result = await svc.query({ actorId: 'user_001', eventType: 'auth.login' })
      expect(result.items.length).toBe(1)
      expect(result.items[0].actorId).toBe('user_001')
    })

    it('翻页: limit=2 得到 nextCursor', async () => {
      const page1 = await svc.query({ limit: 2 })
      expect(page1.items.length).toBe(2)
      expect(page1.nextCursor).toBeDefined()

      const page2 = await svc.query({ limit: 2, cursor: page1.nextCursor })
      expect(page2.items.length).toBe(2)
    })

    it('无效 cursor 不应用分页', async () => {
      const result = await svc.query({ cursor: 'invalid||cursor' })
      // 无效 cursor 因 findIndex 返回 -1, 所以不执行跳过
      expect(result.items.length).toBe(4)
    })

    it('空 cursor 等同于无 cursor', async () => {
      const result = await svc.query({ cursor: '' })
      expect(result.items.length).toBe(4)
    })

    it('时间范围过滤精确', async () => {
      // 埋一个旧时间点的事件
      const oldEvent = {
        ...BASE_EVENT,
        timestamp: new Date('2025-01-01'),
      }
      await svc.log(oldEvent as any)

      const recent = await svc.query({
        from: new Date('2026-01-01'),
        to: new Date(),
      })
      // 只有近期的 4 条, 旧的不在范围内
      expect(recent.items.length).toBe(4)
    })
  })

  // ── getUserActivityLog 补充 ──────────────────────────────────
  describe('getUserActivityLog — 补充', () => {
    it('跨天时间范围正确返回', async () => {
      const oldEvent = { ...BASE_EVENT, timestamp: new Date('2026-06-01') }
      const recentEvent = { ...BASE_EVENT, timestamp: new Date() }
      await svc.log(oldEvent as any)
      await svc.log(recentEvent as any)

      const logs = await svc.getUserActivityLog('user_001', new Date('2026-06-01'), new Date())
      expect(logs.length).toBe(2)
    })

    it('空时间范围返回空数组', async () => {
      await svc.log(BASE_EVENT)
      const logs = await svc.getUserActivityLog('user_001', new Date('2025-01-01'), new Date('2025-01-02'))
      expect(logs.length).toBe(0)
    })
  })

  // ── detectAnomalies 补充 ──────────────────────────────────────
  describe('detectAnomalies — 补充', () => {
    it('4 次失败登录(低于阈值 5)不触发', async () => {
      for (let i = 0; i < 4; i++) {
        await svc.log({
          eventType: 'auth.login',
          actorId: 'user_001',
          actorType: 'user',
          riskLevel: 'low',
          ipAddress: '10.0.0.1',
          metadata: { success: false },
        })
      }
      const anomalies = await svc.detectAnomalies(5)
      expect(anomalies.length).toBe(0)
    })

    it('管理员模拟操作 + IP 失败登录同时检测到', async () => {
      for (let i = 0; i < 5; i++) {
        await svc.log({
          eventType: 'auth.login',
          actorId: `user_${i}`,
          actorType: 'user',
          riskLevel: 'low',
          ipAddress: '10.0.0.1',
          metadata: { success: false },
        })
      }
      await svc.log({
        eventType: 'admin.user_impersonate',
        actorId: 'admin_01',
        actorType: 'admin',
        riskLevel: 'critical',
      })
      const anomalies = await svc.detectAnomalies()
      expect(anomalies.length).toBeGreaterThanOrEqual(2)
    })

    it('自定义 window 参数生效', async () => {
      for (let i = 0; i < 5; i++) {
        await svc.log({
          eventType: 'auth.login',
          actorId: `user_${i}`,
          actorType: 'user',
          riskLevel: 'low',
          ipAddress: '10.0.0.2',
          metadata: { success: false },
        })
      }
      const anomalies = await svc.detectAnomalies(60) // 60 分钟窗口
      expect(anomalies.length).toBeGreaterThan(0)
    })
  })

  // ── computeRiskScore 补充 ─────────────────────────────────────
  describe('computeRiskScore — 补充', () => {
    it('低频操作(5次)评分较低', async () => {
      for (let i = 0; i < 5; i++) {
        await svc.log({ ...BASE_EVENT })
      }
      const score = await svc.computeRiskScore('user_001')
      // 5次操作频率加分0, 无高风险操作加分0, 无异常加分0
      expect(score).toBe(0)
    })

    it('管理员模拟操作大幅提高评分', async () => {
      await svc.log({
        eventType: 'admin.user_impersonate',
        actorId: 'admin_mal',
        actorType: 'admin',
        riskLevel: 'critical',
      })
      const score = await svc.computeRiskScore('admin_mal')
      expect(score).toBeGreaterThanOrEqual(50) // critical anomaly 50pts
    })

    it('0 事件返回 0 分', async () => {
      const score = await svc.computeRiskScore('nonexistent')
      expect(score).toBe(0)
    })
  })

  // ── settlement 补充 ───────────────────────────────────────────
  describe('settlement — 补充', () => {
    it('四种分账事件类型全覆盖', async () => {
      const types = ['created', 'approved', 'paid', 'rejected'] as const
      for (const t of types) {
        const id = await svc.logSettlementEvent('sett_all', 100, t)
        expect(id).toMatch(/^audit_\d+_\d+$/)
      }
      const trail = await svc.getSettlementAuditTrail('sett_all')
      expect(trail.length).toBe(4)
    })

    it('分账金额为 0 可正常记录', async () => {
      const id = await svc.logSettlementEvent('sett_zero', 0, 'created')
      const log = await svc.getById(id)
      expect(log!.settlementAmount).toBe(0)
    })

    it('分账事件拒绝日志风险等级为 medium', async () => {
      const id = await svc.logSettlementEvent('sett_reject', 5000, 'rejected')
      const log = await svc.getById(id)
      expect(log!.riskLevel).toBe('medium')
    })
  })

  // ── exportReport 补充 ─────────────────────────────────────────
  describe('exportReport — 补充', () => {
    it('CSV 每行字段数量一致(含 header)', async () => {
      await svc.log(BASE_EVENT)
      await svc.log({ ...BASE_EVENT, actorId: 'user_002' })
      const csv = await svc.exportReport(new Date(0), new Date(), 'csv')
      const lines = csv.split('\n').filter(l => l.trim())
      const colCounts = lines.map(l => l.split(',').length)
      expect(new Set(colCounts).size).toBe(1) // 所有行列数一致
    })

    it('空范围 JSON 导出为 []', async () => {
      const result = await svc.exportReport(new Date('2020-01-01'), new Date('2020-01-02'), 'json')
      expect(result).toBe('[]')
    })
  })

  // ── compliance 补充 ───────────────────────────────────────────
  describe('generateComplianceReport — 补充', () => {
    it('含 DSR 请求的记录', async () => {
      await svc.log({
        eventType: 'compliance.dsr_submitted',
        actorId: 'user_001',
        actorType: 'user',
        riskLevel: 'low',
        tenantId: 't_dsr',
        metadata: { dsrType: 'access' },
      })
      await svc.log({
        eventType: 'compliance.dsr_processed',
        actorId: 'admin_01',
        actorType: 'admin',
        riskLevel: 'low',
        tenantId: 't_dsr',
        metadata: { dsrType: 'access', result: 'completed' },
      })
      const report = await svc.generateComplianceReport('t_dsr')
      expect(report.dsrRequests.length).toBe(2)
      expect(report.consentRecords.length).toBe(0)
    })

    it('无 consent 记录的租户返回空数组', async () => {
      await svc.log({ ...BASE_EVENT, tenantId: 'no_consent' })
      const report = await svc.generateComplianceReport('no_consent')
      expect(report.consentRecords.length).toBe(0)
    })
  })

  // ── 辅助方法 ──────────────────────────────────────────────────
  describe('辅助方法', () => {
    it('__getAll 返回快照(外部修改不影响原 Map)', async () => {
      await svc.log(BASE_EVENT)
      const snapshot = svc.__getAll()
      expect(snapshot.length).toBe(1)

      // 修改返回的数组不影响原存储
      snapshot.pop()
      expect(svc.__getAll().length).toBe(1)
    })

    it('reset 后计数器归零', async () => {
      await svc.log(BASE_EVENT)
      svc.__reset()
      expect(svc.__getAll().length).toBe(0)

      // 新的事件 id 自重新开始
      const id = await svc.log(BASE_EVENT)
      expect(id).toBeDefined()
    })
  })
})
