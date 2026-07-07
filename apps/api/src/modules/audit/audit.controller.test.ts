/**
 * audit.controller.test.ts - 审计日志 Controller 测试
 * 正例 + 反例 + 边界测试
 */

import { Test, TestingModule } from '@nestjs/testing'
import { AuditController } from './audit.controller'
import { AuditService } from './audit.service'
import { CreateAuditLogDto } from './audit.dto'

describe('AuditController', () => {
  let controller: AuditController
  let service: AuditService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [AuditService],
    }).compile()

    controller = module.get<AuditController>(AuditController)
    service = module.get<AuditService>(AuditService)
    service.__reset()
  })

  describe('POST /api/audit — create', () => {
    // ── 正例 ──────────────────────────────────────────────
    it('✅ 正例: 创建审计日志', async () => {
      const dto: CreateAuditLogDto = {
        eventType: 'auth.login',
        actorId: 'user_001',
        actorType: 'user',
        ipAddress: '192.168.1.1',
        riskLevel: 'low',
      }
      const result = await controller.create(dto)
      expect(result).toHaveProperty('id')
      expect(result.id).toMatch(/^audit_\d+_\d+$/)
    })

    it('✅ 正例: 创建完整信息审计日志', async () => {
      const dto: CreateAuditLogDto = {
        eventType: 'order.paid',
        actorId: 'user_002',
        actorType: 'user',
        tenantId: 'tenant_abc',
        resourceType: 'order',
        resourceId: 'order_123',
        ipAddress: '10.0.0.1',
        riskLevel: 'medium',
        metadata: { amount: 2999, currency: 'CNY' },
        traceId: 'trace_abc',
      }
      const result = await controller.create(dto)
      expect(result).toHaveProperty('id')

      // 验证已写入
      const allLogs = service.__getAll()
      expect(allLogs.length).toBe(1)
      expect(allLogs[0].eventType).toBe('order.paid')
    })

    // ── 边界 ──────────────────────────────────────────────
    it('🔲 边界: 默认风险等级为 low', async () => {
      const dto: CreateAuditLogDto = {
        eventType: 'auth.register',
        actorId: 'user_003',
        actorType: 'user',
      }
      const result = await controller.create(dto)
      expect(result).toHaveProperty('id')

      const log = service.__getAll()[0]
      expect(log.riskLevel).toBe('low')
    })

    it('🔲 边界: 不使用 IP 和 User-Agent', async () => {
      const dto: CreateAuditLogDto = {
        eventType: 'points.earned',
        actorId: 'system',
        actorType: 'system',
      }
      await controller.create(dto)
      const log = service.__getAll()[0]
      expect(log.ipAddress).toBeUndefined()
      expect(log.userAgent).toBeUndefined()
    })
  })

  describe('POST /api/audit/batch — batch create', () => {
    it('✅ 正例: 批量创建审计日志', async () => {
      const dtos: CreateAuditLogDto[] = [
        { eventType: 'auth.login', actorId: 'user_001', actorType: 'user', riskLevel: 'low' },
        { eventType: 'order.created', actorId: 'user_001', actorType: 'user', riskLevel: 'low' },
      ]
      const result = await controller.createBatch(dtos)
      expect(result.ids).toHaveLength(2)
      expect(service.__getAll().length).toBe(2)
    })

    it('🔲 边界: 批量创建空数组', async () => {
      const result = await controller.createBatch([])
      expect(result.ids).toHaveLength(0)
    })
  })

  describe('GET /api/audit — findAll', () => {
    beforeEach(async () => {
      // 准备测试数据
      await controller.create({ eventType: 'auth.login', actorId: 'user_001', actorType: 'user', riskLevel: 'low' })
      await controller.create({ eventType: 'order.paid', actorId: 'user_001', actorType: 'user', riskLevel: 'medium' })
      await controller.create({ eventType: 'auth.logout', actorId: 'user_001', actorType: 'user', riskLevel: 'low' })
    })

    it('✅ 正例: 分页查询', async () => {
      const result = await controller.findAll({ limit: 2 })
      expect(result.items.length).toBe(2)
      expect(result.total).toBe(3)
      expect(result.nextCursor).toBeDefined()
    })

    it('✅ 正例: 按事件类型过滤', async () => {
      const result = await controller.findAll({ eventType: 'auth.login' })
      expect(result.items.length).toBe(1)
      expect(result.items[0].eventType).toBe('auth.login')
    })

    it('🔲 边界: 查询不存在的事件类型', async () => {
      const result = await controller.findAll({ eventType: 'nonexistent.event' })
      expect(result.items.length).toBe(0)
      expect(result.total).toBe(0)
    })

    it('🔲 边界: 分页参数 limit=1', async () => {
      const result = await controller.findAll({ limit: 1 })
      expect(result.items.length).toBe(1)
      expect(result.nextCursor).toBeDefined()
    })
  })

  describe('GET /api/audit/:id — findOne', () => {
    it('✅ 正例: 获取日志详情', async () => {
      const { id } = await controller.create({
        eventType: 'auth.login',
        actorId: 'user_001',
        actorType: 'user',
        riskLevel: 'low',
      })
      const log = await controller.findOne(id)
      expect(log).not.toBeNull()
      expect(log!.id).toBe(id)
    })

    it('❌ 反例: 获取不存在的日志', async () => {
      const log = await controller.findOne('nonexistent_id')
      expect(log).toBeNull()
    })
  })

  describe('GET /api/audit/user/:userId — getUserActivity', () => {
    beforeEach(async () => {
      await controller.create({ eventType: 'auth.login', actorId: 'user_007', actorType: 'user', riskLevel: 'low' })
      await controller.create({ eventType: 'order.created', actorId: 'user_007', actorType: 'user', riskLevel: 'low' })
      await controller.create({ eventType: 'auth.login', actorId: 'user_008', actorType: 'user', riskLevel: 'low' })
    })

    it('✅ 正例: 获取用户活动日志', async () => {
      const now = new Date()
      const from = new Date(now.getTime() - 3600000).toISOString()
      const to = now.toISOString()
      const logs = await controller.getUserActivity('user_007', from, to)
      expect(logs.length).toBe(2)
    })

    it('🔲 边界: 获取无活动用户日志', async () => {
      const from = new Date(0).toISOString()
      const to = new Date().toISOString()
      const logs = await controller.getUserActivity('nonexistent_user', from, to)
      expect(logs.length).toBe(0)
    })
  })

  describe('GET /api/audit/anomalies/detect — detectAnomalies', () => {
    it('✅ 正例: 检测到 IP 登录失败异常', async () => {
      // 同一 IP 连续 5 次失败登录
      for (let i = 0; i < 6; i++) {
        await controller.create({
          eventType: 'auth.login',
          actorId: `user_${i}`,
          actorType: 'user',
          ipAddress: '192.168.1.100',
          riskLevel: 'low',
          metadata: { success: false },
        })
      }
      const anomalies = await controller.detectAnomalies(5)
      const ipAnomaly = anomalies.find((a) => a.pattern.includes('192.168.1.100'))
      expect(ipAnomaly).toBeDefined()
      expect(ipAnomaly!.riskLevel).toBe('high')
    })

    it('🔲 边界: 无异常时返回空数组', async () => {
      await controller.create({ eventType: 'auth.login', actorId: 'user_001', actorType: 'user', riskLevel: 'low' })
      const anomalies = await controller.detectAnomalies(5)
      expect(anomalies.length).toBe(0)
    })
  })

  describe('GET /api/audit/risk-score/:actorId — computeRiskScore', () => {
    it('✅ 正例: 无操作记录风险评分为 0', async () => {
      const result = await controller.computeRiskScore('inactive_user')
      expect(result.score).toBe(0)
      expect(result.riskLevel).toBe('low')
    })

    it('✅ 正例: 有管理员模拟操作返回高风险', async () => {
      await controller.create({
        eventType: 'admin.user_impersonate',
        actorId: 'admin_001',
        actorType: 'admin',
        riskLevel: 'critical',
      })
      const result = await controller.computeRiskScore('admin_001')
      expect(result.score).toBeGreaterThan(0)
    })
  })

  describe('POST /api/audit/settlement — logSettlement', () => {
    it('✅ 正例: 记录分账事件', async () => {
      const result = await controller.logSettlement({
        settlementId: 'settlement_001',
        amount: 10000,
        eventType: 'created',
      })
      expect(result).toHaveProperty('id')
    })

    it('🔲 边界: 记录分账拒绝事件', async () => {
      const result = await controller.logSettlement({
        settlementId: 'settlement_002',
        amount: 5000,
        eventType: 'rejected',
        metadata: { reason: '余额不足' },
      })
      expect(result).toHaveProperty('id')
    })
  })

  describe('GET /api/audit/settlement/:settlementId — getSettlementAuditTrail', () => {
    it('✅ 正例: 获取分账审计追踪', async () => {
      await controller.logSettlement({ settlementId: 'sett_001', amount: 10000, eventType: 'created' })
      await controller.logSettlement({ settlementId: 'sett_001', amount: 10000, eventType: 'approved' })
      const trail = await controller.getSettlementAuditTrail('sett_001')
      expect(trail.length).toBe(2)
    })

    it('🔲 边界: 不存在的分账 ID', async () => {
      const trail = await controller.getSettlementAuditTrail('nonexistent')
      expect(trail.length).toBe(0)
    })
  })

  describe('POST /api/audit/export — exportReport', () => {
    beforeEach(async () => {
      await controller.create({ eventType: 'auth.login', actorId: 'user_001', actorType: 'user', riskLevel: 'low' })
    })

    it('✅ 正例: 导出 JSON 报告', async () => {
      const now = new Date()
      const from = new Date(now.getTime() - 3600000).toISOString()
      const to = now.toISOString()
      const result = await controller.exportReport({ from, to, format: 'json' })
      const parsed = JSON.parse(result.content)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed.length).toBe(1)
    })

    it('✅ 正例: 导出 CSV 报告', async () => {
      const now = new Date()
      const from = new Date(now.getTime() - 3600000).toISOString()
      const to = now.toISOString()
      const result = await controller.exportReport({ from, to, format: 'csv' })
      expect(result.content).toContain('id,eventType')
      const lines = result.content.split('\n')
      expect(lines.length).toBeGreaterThanOrEqual(2)
    })

    it('🔲 边界: 导出空报告', async () => {
      const from = new Date('2020-01-01').toISOString()
      const to = new Date('2020-01-02').toISOString()
      const result = await controller.exportReport({ from, to, format: 'json' })
      expect(result.content).toBe('[]')
    })
  })

  describe('GET /api/audit/compliance-report/:tenantId — generateComplianceReport', () => {
    it('✅ 正例: 生成合规报告', async () => {
      await controller.create({
        eventType: 'auth.login',
        actorId: 'user_001',
        actorType: 'user',
        riskLevel: 'low',
      })
      const report = await controller.generateComplianceReport('default')
      expect(report).toHaveProperty('processingActivities')
      expect(report).toHaveProperty('consentRecords')
      expect(report).toHaveProperty('dsrRequests')
      expect(report).toHaveProperty('dataBreaches')
    })
  })
})
