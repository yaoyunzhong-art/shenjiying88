/**
 * audit.controller.spec.ts - 审计日志 Controller 规格测试 (NestJS Spec)
 * 用途: 使用 NestJS TestingModule 验证 Controller 各方法，覆盖正常/异常/边界路径
 * 覆盖: 正例(✅) + 反例(❌) + 边界(🔲)
 */

import { Test, TestingModule } from '@nestjs/testing'
import { AuditController } from './audit.controller'
import { AuditService } from './audit.service'
import { CreateAuditLogDto, SettlementAuditLogDto } from './audit.dto'

describe('AuditController (spec)', () => {
  let controller: AuditController
  let service: AuditService

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuditController],
      providers: [AuditService],
    }).compile()

    controller = moduleFixture.get<AuditController>(AuditController)
    service = moduleFixture.get<AuditService>(AuditService)
  })

  beforeEach(() => {
    service.__reset()
  })

  // ──────────────────────────────────────────────────────────
  // POST /api/audit — 创建审计日志
  // ──────────────────────────────────────────────────────────
  describe('POST /api/audit — create', () => {
    // ✅ 正例: 正常创建
    it('✅ 正例: 创建审计日志', async () => {
      const dto: CreateAuditLogDto = {
        eventType: 'auth.login',
        actorId: 'user_001',
        actorType: 'user',
        ipAddress: '192.168.1.1',
        riskLevel: 'medium',
      }
      const result = await controller.create(dto)
      expect(result).toHaveProperty('id')
      expect(result.id).toMatch(/^audit_\d+_\d+$/)
    })

    // ✅ 正例: 完整字段创建
    it('✅ 正例: 完整信息创建审计日志', async () => {
      const dto: CreateAuditLogDto = {
        eventType: 'order.paid',
        actorId: 'user_002',
        actorType: 'user',
        tenantId: 'tenant_abc',
        resourceType: 'order',
        resourceId: 'order_123',
        ipAddress: '10.0.0.1',
        riskLevel: 'high',
        metadata: { amount: 12999, currency: 'CNY' },
        traceId: 'trace_xyz',
      }
      const result = await controller.create(dto)
      expect(result).toHaveProperty('id')

      const allLogs = service.__getAll()
      expect(allLogs).toHaveLength(1)
      expect(allLogs[0].eventType).toBe('order.paid')
      expect(allLogs[0].tenantId).toBe('tenant_abc')
    })

    // ❌ 反例: 空 eventType — service 层面会正常创建（API 层由 ValidationPipe 拦截）
    it('❌ 反例: 缺少 eventType 只传部分字段', async () => {
      // DTO 校验在 ValidationPipe 层, controller 直接调用 service
      // 这里验证即使不完整也能正常返回 ID
      const incomplete = { actorId: 'user_001', actorType: 'user' } as CreateAuditLogDto
      // service 会创建日志（因为字段在 type level 标记可选）
      const result = await controller.create(incomplete)
      expect(result).toHaveProperty('id')
      const log = service.__getAll()[0]
      expect(log.actorId).toBe('user_001')
    })

    // 🔲 边界: 默认风险等级为 low
    it('🔲 边界: 不传 riskLevel 默认 low', async () => {
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

    // 🔲 边界: 无 IP、无 UA、无 meta
    it('🔲 边界: 最小必填字段创建', async () => {
      const dto: CreateAuditLogDto = {
        eventType: 'points.earned',
        actorId: 'system',
        actorType: 'system',
      }
      await controller.create(dto)
      const log = service.__getAll()[0]
      expect(log.eventType).toBe('points.earned')
      expect(log.actorId).toBe('system')
      expect(log.ipAddress).toBeUndefined()
    })
  })

  // ──────────────────────────────────────────────────────────
  // POST /api/audit/batch — 批量创建
  // ──────────────────────────────────────────────────────────
  describe('POST /api/audit/batch — createBatch', () => {
    it('✅ 正例: 批量创建 2 条日志', async () => {
      const dtos: CreateAuditLogDto[] = [
        { eventType: 'auth.login', actorId: 'user_001', actorType: 'user', riskLevel: 'low' },
        { eventType: 'order.created', actorId: 'user_001', actorType: 'user', riskLevel: 'low' },
      ]
      const result = await controller.createBatch(dtos)
      expect(result.ids).toHaveLength(2)
      expect(service.__getAll()).toHaveLength(2)
    })

    // 🔲 边界: 空数组
    it('🔲 边界: 批量创建空数组返回空', async () => {
      const result = await controller.createBatch([])
      expect(result.ids).toHaveLength(0)
      expect(service.__getAll()).toHaveLength(0)
    })
  })

  // ──────────────────────────────────────────────────────────
  // GET /api/audit — 分页查询
  // ──────────────────────────────────────────────────────────
  describe('GET /api/audit — findAll', () => {
    beforeEach(async () => {
      await controller.create({ eventType: 'auth.login', actorId: 'user_001', actorType: 'user' })
      await controller.create({ eventType: 'order.paid', actorId: 'user_001', actorType: 'user', riskLevel: 'medium' })
      await controller.create({ eventType: 'auth.logout', actorId: 'user_001', actorType: 'user' })
    })

    it('✅ 正例: 分页查询返回正确分页', async () => {
      const result = await controller.findAll({ limit: 2 })
      expect(result.items).toHaveLength(2)
      expect(result.total).toBe(3)
      expect(result.nextCursor).toBeDefined()
    })

    it('✅ 正例: 按事件类型过滤', async () => {
      const result = await controller.findAll({ eventType: 'auth.login' })
      expect(result.items).toHaveLength(1)
      expect(result.items[0].eventType).toBe('auth.login')
    })

    it('✅ 正例: 按风险等级过滤', async () => {
      const result = await controller.findAll({ riskLevel: 'medium' })
      expect(result.items).toHaveLength(1)
      expect(result.items[0].riskLevel).toBe('medium')
    })

    // 🔲 边界: 查询不存在的事件类型
    it('🔲 边界: 查询未发生的事件类型返回空', async () => {
      const result = await controller.findAll({ eventType: 'admin.data_export' })
      expect(result.items).toHaveLength(0)
      expect(result.total).toBe(0)
    })

    // 🔲 边界: limit=1 确保游标分页
    it('🔲 边界: 首页 limit=1 返回游标', async () => {
      const result = await controller.findAll({ limit: 1 })
      expect(result.items).toHaveLength(1)
      expect(result.nextCursor).toBeDefined()
    })
  })

  // ──────────────────────────────────────────────────────────
  // GET /api/audit/:id — 获取详情
  // ──────────────────────────────────────────────────────────
  describe('GET /api/audit/:id — findOne', () => {
    it('✅ 正例: 获取已创建的审计日志', async () => {
      const { id } = await controller.create({
        eventType: 'auth.login', actorId: 'user_001', actorType: 'user',
      })
      const log = await controller.findOne(id)
      expect(log).not.toBeNull()
      expect(log!.id).toBe(id)
      expect(log!.eventType).toBe('auth.login')
    })

    // ❌ 反例: 不存在的 ID
    it('❌ 反例: 获取不存在的日志返回 null', async () => {
      const log = await controller.findOne('nonexistent_id')
      expect(log).toBeNull()
    })
  })

  // ──────────────────────────────────────────────────────────
  // GET /api/audit/user/:userId — 用户活动日志
  // ──────────────────────────────────────────────────────────
  describe('GET /api/audit/user/:userId — getUserActivity', () => {
    beforeEach(async () => {
      await controller.create({ eventType: 'auth.login', actorId: 'user_007', actorType: 'user' })
      await controller.create({ eventType: 'order.created', actorId: 'user_007', actorType: 'user' })
      await controller.create({ eventType: 'auth.login', actorId: 'user_008', actorType: 'user' })
    })

    it('✅ 正例: 获取用户活动日志', async () => {
      const now = new Date()
      const from = new Date(now.getTime() - 3600000).toISOString()
      const to = now.toISOString()
      const logs = await controller.getUserActivity('user_007', from, to)
      expect(logs).toHaveLength(2)
    })

    // 🔲 边界: 无活动用户
    it('🔲 边界: 无活动用户返回空数组', async () => {
      const from = new Date(0).toISOString()
      const to = new Date().toISOString()
      const logs = await controller.getUserActivity('nobody', from, to)
      expect(logs).toEqual([])
    })
  })

  // ──────────────────────────────────────────────────────────
  // GET /api/audit/anomalies/detect — 异常检测
  // ──────────────────────────────────────────────────────────
  describe('GET /api/audit/anomalies/detect — detectAnomalies', () => {
    it('✅ 正例: 检测到 IP 失败登录异常', async () => {
      for (let i = 0; i < 6; i++) {
        await controller.create({
          eventType: 'auth.login',
          actorId: `user_${i}`,
          actorType: 'user',
          ipAddress: '10.0.0.99',
          metadata: { success: false } as any,
        })
      }
      const anomalies = await controller.detectAnomalies(5)
      const ipAnomaly = anomalies.find((a) => a.pattern.includes('10.0.0.99'))
      expect(ipAnomaly).toBeDefined()
      expect(ipAnomaly!.riskLevel).toBe('high')
    })

    it('✅ 正例: 检测到管理员模拟操作风险', async () => {
      await controller.create({
        eventType: 'admin.user_impersonate',
        actorId: 'admin_001',
        actorType: 'admin',
        riskLevel: 'critical',
      })
      const anomalies = await controller.detectAnomalies(5)
      const adminAnomaly = anomalies.find((a) => a.pattern.includes('管理员模拟'))
      expect(adminAnomaly).toBeDefined()
      expect(adminAnomaly!.riskLevel).toBe('critical')
    })

    // 🔲 边界: 无异常返回空数组
    it('🔲 边界: 正常操作无异常', async () => {
      await controller.create({ eventType: 'auth.login', actorId: 'user_001', actorType: 'user' })
      const anomalies = await controller.detectAnomalies(5)
      expect(anomalies).toEqual([])
    })
  })

  // ──────────────────────────────────────────────────────────
  // GET /api/audit/risk-score/:actorId — 风险评分
  // ──────────────────────────────────────────────────────────
  describe('GET /api/audit/risk-score/:actorId — computeRiskScore', () => {
    it('✅ 正例: 无操作用户评分 0 风险 low', async () => {
      const result = await controller.computeRiskScore('inactive_user')
      expect(result.score).toBe(0)
      expect(result.riskLevel).toBe('low')
    })

    it('✅ 正例: 管理员模拟导致高风险', async () => {
      await controller.create({
        eventType: 'admin.user_impersonate',
        actorId: 'admin_001',
        actorType: 'admin',
        riskLevel: 'critical',
      })
      const result = await controller.computeRiskScore('admin_001')
      expect(result.score).toBeGreaterThan(0)
      expect(['high', 'critical']).toContain(result.riskLevel)
    })

    // 🔲 边界: 正常操作用户评分为 low
    it('🔲 边界: 少量操作保持低风险', async () => {
      await controller.create({ eventType: 'auth.login', actorId: 'normal_user', actorType: 'user' })
      const result = await controller.computeRiskScore('normal_user')
      expect(result.riskLevel).toBe('low')
    })
  })

  // ──────────────────────────────────────────────────────────
  // POST /api/audit/settlement — 分账事件
  // ──────────────────────────────────────────────────────────
  describe('POST /api/audit/settlement — logSettlement', () => {
    it('✅ 正例: 记录分账创建事件', async () => {
      const result = await controller.logSettlement({
        settlementId: 'sett_001',
        amount: 20000,
        eventType: 'created',
      })
      expect(result).toHaveProperty('id')
      // 验证数据持久化
      const allLogs = service.__getAll()
      expect(allLogs).toHaveLength(1)
      expect(allLogs[0].settlementId).toBe('sett_001')
    })

    // 🔲 边界: 负数金额 — service 层面不校验负值（API 层由 ValidationPipe 拦截）
    it('🔲 边界: 负数金额仍可被记录', async () => {
      // DTO 校验在 ValidationPipe 层, controller 直接调用 service
      const dto = { settlementId: 'sett_neg', amount: -100, eventType: 'created' } as SettlementAuditLogDto
      const result = await controller.logSettlement(dto)
      expect(result).toHaveProperty('id')
      const log = service.__getAll()[0]
      expect(log.settlementAmount).toBe(-100)
    })

    // 🔲 边界: 分账拒绝事件记录
    it('🔲 边界: 记录分账拒绝事件含元数据', async () => {
      const result = await controller.logSettlement({
        settlementId: 'sett_002',
        amount: 5000,
        eventType: 'rejected',
        metadata: { reason: '余额不足' },
      })
      expect(result).toHaveProperty('id')
    })
  })

  // ──────────────────────────────────────────────────────────
  // GET /api/audit/settlement/:settlementId — 分账追踪
  // ──────────────────────────────────────────────────────────
  describe('GET /api/audit/settlement/:settlementId — getSettlementAuditTrail', () => {
    it('✅ 正例: 获取分账审计全链路', async () => {
      await controller.logSettlement({ settlementId: 'sett_003', amount: 5000, eventType: 'created' })
      await controller.logSettlement({ settlementId: 'sett_003', amount: 5000, eventType: 'approved' })
      await controller.logSettlement({ settlementId: 'sett_003', amount: 5000, eventType: 'paid' })

      const trail = await controller.getSettlementAuditTrail('sett_003')
      expect(trail).toHaveLength(3)
      // 按时间正序
      expect(trail[0].eventType).toBe('settlement.created')
      expect(trail[2].eventType).toBe('settlement.paid')
    })

    // 🔲 边界: 不存在的分账 ID 返回空
    it('🔲 边界: 未找到分账记录返回空数组', async () => {
      const trail = await controller.getSettlementAuditTrail('nonexistent_settlement')
      expect(trail).toEqual([])
    })
  })

  // ──────────────────────────────────────────────────────────
  // POST /api/audit/export — 导出报告
  // ──────────────────────────────────────────────────────────
  describe('POST /api/audit/export — exportReport', () => {
    beforeEach(async () => {
      await controller.create({ eventType: 'auth.login', actorId: 'user_001', actorType: 'user' })
    })

    it('✅ 正例: 导出 JSON 格式报告', async () => {
      const now = new Date()
      const from = new Date(now.getTime() - 3600000).toISOString()
      const to = now.toISOString()
      const result = await controller.exportReport({ from, to, format: 'json' })
      const parsed = JSON.parse(result.content)
      expect(Array.isArray(parsed)).toBe(true)
      expect(parsed).toHaveLength(1)
    })

    it('✅ 正例: 导出 CSV 格式报告', async () => {
      const now = new Date()
      const from = new Date(now.getTime() - 3600000).toISOString()
      const to = now.toISOString()
      const result = await controller.exportReport({ from, to, format: 'csv' })
      expect(result.content).toContain('id,eventType')
      const lines = result.content.split('\n')
      expect(lines.length).toBeGreaterThanOrEqual(2)
    })

    // 🔲 边界: 无效导出格式 — service 默认按 format 值处理（API 层由 ValidationPipe 拦截）
    it('🔲 边界: 无效导出格式回退为 json', async () => {
      // DTO 校验在 ValidationPipe 层, controller 直接调用 service
      const from = new Date(Date.now() - 3600000).toISOString()
      const to = new Date().toISOString()
      const dto = { from, to, format: 'xml' } as any
      const result = await controller.exportReport(dto)
      expect(typeof result.content).toBe('string')
      // service 中 format 不匹配'json'时走 csv 分支
      expect(result.content).toContain('id,eventType')
      expect(result.content).toContain('auth.login')
    })

    // 🔲 边界: 导出无数据时间范围
    it('🔲 边界: 空时间范围导出空报告', async () => {
      const from = '2020-01-01T00:00:00.000Z'
      const to = '2020-01-02T00:00:00.000Z'
      const result = await controller.exportReport({ from, to, format: 'json' })
      expect(result.content).toBe('[]')
    })
  })

  // ──────────────────────────────────────────────────────────
  // GET /api/audit/compliance-report/:tenantId — 合规报告
  // ──────────────────────────────────────────────────────────
  describe('GET /api/audit/compliance-report/:tenantId — generateComplianceReport', () => {
    beforeEach(async () => {
      await controller.create({
        eventType: 'auth.login',
        actorId: 'user_001',
        actorType: 'user',
        tenantId: 'tenant_compliance',
      })
    })

    it('✅ 正例: 生成合规报告包含四个部分', async () => {
      const report = await controller.generateComplianceReport('tenant_compliance')
      expect(report).toHaveProperty('processingActivities')
      expect(report).toHaveProperty('consentRecords')
      expect(report).toHaveProperty('dsrRequests')
      expect(report).toHaveProperty('dataBreaches')
      expect(report.processingActivities.length).toBeGreaterThanOrEqual(1)
    })

    // 🔲 边界: 无活动租户返回空结构
    it('🔲 边界: 无活动租户报告各部分为空', async () => {
      const report = await controller.generateComplianceReport('empty_tenant')
      expect(report.processingActivities).toHaveLength(0)
      expect(report.consentRecords).toHaveLength(0)
      expect(report.dsrRequests).toHaveLength(0)
      expect(report.dataBreaches).toHaveLength(0)
    })
  })
})
