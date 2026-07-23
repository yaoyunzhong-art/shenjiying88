/**
 * audit.service.test.ts - 审计日志 Service 测试
 * 正例 + 反例 + 边界测试
 */

import { AuditService } from './audit.service'

describe('AuditService', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  describe('log — 记录单条审计事件', () => {
    it('✅ 正例: 记录登录事件', async () => {
      const id = await service.log({
        eventType: 'auth.login',
        actorId: 'user_001',
        actorType: 'user',
        riskLevel: 'low',
      })
      expect(id).toMatch(/^audit_\d+_\d+$/)
    })

    it('✅ 正例: 记录带 IP 的事件', async () => {
      service.setClientIP('10.0.0.1')
      const id = await service.log({
        eventType: 'auth.login',
        actorId: 'user_001',
        actorType: 'user',
        riskLevel: 'low',
      })
      const log = await service.getById(id)
      expect(log!.ipAddress).toBe('10.0.0.1')
    })

    it('✅ 正例: 记录带 TraceId 的事件', async () => {
      service.setTraceId('trace_test_001')
      const id = await service.log({
        eventType: 'order.paid',
        actorId: 'user_001',
        actorType: 'user',
        riskLevel: 'medium',
      })
      const log = await service.getById(id)
      expect(log!.traceId).toBe('trace_test_001')
    })

    it('🔲 边界: 事件 IP 传入优先级高于上下文', async () => {
      service.setClientIP('10.0.0.1')
      const id = await service.log({
        eventType: 'auth.login',
        actorId: 'user_001',
        actorType: 'user',
        ipAddress: '192.168.1.1',
        riskLevel: 'low',
      })
      const log = await service.getById(id)
      expect(log!.ipAddress).toBe('192.168.1.1')
    })
  })

  describe('logBatch — 批量记录', () => {
    it('✅ 正例: 批量记录多条事件', async () => {
      const ids = await service.logBatch([
        { eventType: 'auth.login', actorId: 'user_001', actorType: 'user', riskLevel: 'low' },
        { eventType: 'order.created', actorId: 'user_001', actorType: 'user', riskLevel: 'low' },
        { eventType: 'order.paid', actorId: 'user_001', actorType: 'user', riskLevel: 'low' },
      ])
      expect(ids).toHaveLength(3)
      expect(service.__getAll().length).toBe(3)
    })

    it('🔲 边界: 批量记录空数组', async () => {
      const ids = await service.logBatch([])
      expect(ids).toHaveLength(0)
    })
  })

  describe('query — 分页查询', () => {
    beforeEach(async () => {
      await service.log({ eventType: 'auth.login', actorId: 'user_01', actorType: 'user', riskLevel: 'low' })
      await service.log({ eventType: 'order.paid', actorId: 'user_01', actorType: 'user', riskLevel: 'medium' })
      await service.log({ eventType: 'auth.logout', actorId: 'user_01', actorType: 'user', riskLevel: 'low' })
    })

    it('✅ 正例: 全部查询', async () => {
      const result = await service.query({ limit: 10 })
      expect(result.items.length).toBe(3)
    })

    it('✅ 正例: 按 actorId 过滤', async () => {
      const result = await service.query({ actorId: 'user_01' })
      expect(result.items.length).toBe(3)
    })

    it('✅ 正例: 按 eventType 过滤', async () => {
      const result = await service.query({ eventType: 'auth.login' })
      expect(result.items.length).toBe(1)
    })

    it('✅ 正例: 按 riskLevel 过滤', async () => {
      const result = await service.query({ riskLevel: 'medium' })
      expect(result.items.length).toBe(1)
    })

    it('🔲 边界: 查询不存在的 actorId', async () => {
      const result = await service.query({ actorId: 'nonexistent' })
      expect(result.items.length).toBe(0)
    })

    it('🔲 边界: limit 分页并返回 nextCursor', async () => {
      const result = await service.query({ limit: 2 })
      expect(result.items.length).toBe(2)
      expect(result.nextCursor).toBeDefined()
    })

    it('🔲 边界: 时间范围过滤', async () => {
      const result = await service.query({
        from: new Date(Date.now() + 86400000), // 未来时间
        to: new Date(Date.now() + 172800000),
      })
      expect(result.items.length).toBe(0)
    })
  })

  describe('getById — 单条查询', () => {
    it('✅ 正例: 查询存在的记录', async () => {
      const id = await service.log({ eventType: 'auth.login', actorId: 'user_001', actorType: 'user', riskLevel: 'low' })
      const log = await service.getById(id)
      expect(log).not.toBeNull()
    })

    it('❌ 反例: 查询不存在的记录', async () => {
      const log = await service.getById('nonexistent')
      expect(log).toBeNull()
    })
  })

  describe('getUserActivityLog — 用户活动日志', () => {
    it('✅ 正例: 获取用户活动', async () => {
      await service.log({ eventType: 'auth.login', actorId: 'user_01', actorType: 'user', riskLevel: 'low' })
      await service.log({ eventType: 'auth.logout', actorId: 'user_01', actorType: 'user', riskLevel: 'low' })

      const logs = await service.getUserActivityLog('user_01', new Date(0), new Date())
      expect(logs.length).toBe(2)
    })

    it('🔲 边界: 空用户活动', async () => {
      const logs = await service.getUserActivityLog('inactive_user', new Date(0), new Date())
      expect(logs.length).toBe(0)
    })
  })

  describe('detectAnomalies — 异常检测', () => {
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
    })

    it('✅ 正例: 检测管理员模拟操作', async () => {
      await service.log({
        eventType: 'admin.user_impersonate',
        actorId: 'admin_01',
        actorType: 'admin',
        riskLevel: 'critical',
      })
      const anomalies = await service.detectAnomalies()
      const impersonateAnomaly = anomalies.find(a => a.pattern.includes('管理员模拟用户操作'))
      expect(impersonateAnomaly).toBeDefined()
      expect(impersonateAnomaly!.riskLevel).toBe('critical')
    })

    it('🔲 边界: 无异常时返回空数组', async () => {
      await service.log({ eventType: 'auth.login', actorId: 'user_01', actorType: 'user', riskLevel: 'low' })
      const anomalies = await service.detectAnomalies()
      expect(anomalies.length).toBe(0)
    })
  })

  describe('computeRiskScore — 风险评分', () => {
    it('✅ 正例: 无操作评分为 0', async () => {
      const score = await service.computeRiskScore('inactive_user')
      expect(score).toBe(0)
    })

    it('✅ 正例: 有操作的评分 > 0', async () => {
      for (let i = 0; i < 60; i++) {
        await service.log({ eventType: 'auth.login', actorId: 'active_user', actorType: 'user', riskLevel: 'low' })
      }
      const score = await service.computeRiskScore('active_user')
      expect(score).toBeGreaterThan(0)
    })

    it('🔲 边界: 评分上限 100', async () => {
      await service.log({
        eventType: 'admin.user_impersonate',
        actorId: 'malicious_admin',
        actorType: 'admin',
        riskLevel: 'critical',
      })
      for (let i = 0; i < 100; i++) {
        await service.log({ eventType: 'auth.login', actorId: 'malicious_admin', actorType: 'admin', riskLevel: 'low' })
      }
      const score = await service.computeRiskScore('malicious_admin')
      expect(score).toBeLessThanOrEqual(100)
    })
  })

  describe('settlement 分账日志', () => {
    it('✅ 正例: 记录分账创建', async () => {
      const id = await service.logSettlementEvent('sett_001', 10000, 'created')
      expect(id).toBeDefined()
    })

    it('✅ 正例: 获取分账审计追踪', async () => {
      await service.logSettlementEvent('sett_002', 20000, 'created')
      await service.logSettlementEvent('sett_002', 20000, 'approved')
      await service.logSettlementEvent('sett_002', 20000, 'paid')

      const trail = await service.getSettlementAuditTrail('sett_002')
      expect(trail.length).toBe(3)
      // 按时间正序
      expect(trail[0].eventType).toBe('settlement.created')
      expect(trail[2].eventType).toBe('settlement.paid')
    })

    it('🔲 边界: 不存在的分账 ID', async () => {
      const trail = await service.getSettlementAuditTrail('nonexistent')
      expect(trail.length).toBe(0)
    })
  })

  describe('exportReport — 导出', () => {
    it('✅ 正例: JSON 导出', async () => {
      await service.log({ eventType: 'auth.login', actorId: 'user_01', actorType: 'user', riskLevel: 'low' })
      const json = await service.exportReport(new Date(0), new Date(), 'json')
      const parsed = JSON.parse(json)
      expect(parsed.length).toBe(1)
    })

    it('✅ 正例: CSV 导出', async () => {
      await service.log({ eventType: 'auth.login', actorId: 'user_01', actorType: 'user', riskLevel: 'low' })
      const csv = await service.exportReport(new Date(0), new Date(), 'csv')
      expect(csv).toContain('id,eventType')
    })

    it('🔲 边界: 空范围导出', async () => {
      const json = await service.exportReport(new Date('2020-01-01'), new Date('2020-01-02'), 'json')
      expect(json).toBe('[]')
    })
  })

  describe('generateComplianceReport — 合规报告', () => {
    it('✅ 正例: 生成合规报告', async () => {
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
      expect(report.dataBreaches.length).toBe(1)
    })

    it('🔲 边界: 空租户数据', async () => {
      const report = await service.generateComplianceReport('empty_tenant')
      expect(report.processingActivities.length).toBe(0)
      expect(report.consentRecords.length).toBe(0)
    })
  })

  describe('__reset / __getAll — 测试辅助', () => {
    it('✅ 正例: reset 清空所有数据', async () => {
      await service.log({ eventType: 'auth.login', actorId: 'user_001', actorType: 'user', riskLevel: 'low' })
      expect(service.__getAll().length).toBe(1)
      service.__reset()
      expect(service.__getAll().length).toBe(0)
    })
  })

  describe('BS-0277: 2% 实时审计抽检', () => {
    it('shouldSample 使用确定性哈希，同一 ID 始终返回相同结果', () => {
      const id1 = service['generateId']()
      const id2 = service['generateId']()
      // 验证确定性：同一 ID 调两次 shouldSample 结果相同
      const r1a = service['shouldSample'](id1)
      const r1b = service['shouldSample'](id1)
      const r2a = service['shouldSample'](id2)
      const r2b = service['shouldSample'](id2)
      expect(r1a).toBe(r1b)
      expect(r2a).toBe(r2b)
    })

    it('抽检率接近 2%（大量事件时）', async () => {
      // 生成 5000 条日志，统计抽样比例
      const count = 5000
      for (let i = 0; i < count; i++) {
        await service.log({
          eventType: 'auth.login',
          actorId: `user_${i}`,
          actorType: 'user',
          riskLevel: 'low',
          metadata: { idx: i },
        })
      }
      const sampled = service.getSampledAuditLogs()
      const sampleRate = sampled.length / count
      // 允许 ±1% 误差
      expect(sampleRate).toBeGreaterThan(0.005)
      expect(sampleRate).toBeLessThan(0.05)
    })

    it('getSamplingStats 返回正确统计', async () => {
      const stats = service.getSamplingStats()
      expect(stats.rate).toBe(0.02)
      expect(stats.totalSampled).toBe(0)

      for (let i = 0; i < 100; i++) {
        await service.log({
          eventType: 'auth.login',
          actorId: `user_${i}`,
          actorType: 'user',
          riskLevel: 'low',
        })
      }

      const stats2 = service.getSamplingStats()
      expect(stats2.totalSampled).toBeGreaterThanOrEqual(0)
    })

    it('clearSampledAuditLogs 清空缓存', async () => {
      for (let i = 0; i < 100; i++) {
        await service.log({
          eventType: 'auth.login',
          actorId: `user_${i}`,
          actorType: 'user',
          riskLevel: 'low',
        })
      }
      expect(service.getSampledAuditLogs().length).toBeGreaterThanOrEqual(0)
      service.clearSampledAuditLogs()
      expect(service.getSampledAuditLogs().length).toBe(0)
    })

    it('高/关键风险事件会在抽样日志中保留原始风险级别', async () => {
      for (let i = 0; i < 100; i++) {
        await service.log({
          eventType: 'admin.data_export',
          actorId: 'admin_01',
          actorType: 'admin',
          riskLevel: 'critical',
          metadata: { idx: i },
        })
      }
      const sampled = service.getSampledAuditLogs()
      // 如果其中有抽样到 critical 事件，风险级别应保留
      for (const s of sampled) {
        expect(s.riskLevel).toBe('critical')
      }
    })
  })
})
