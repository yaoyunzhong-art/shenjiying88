/**
 * audit.dto.test.ts - 审计日志 DTO 验证测试
 * 正例 + 反例 + 边界测试
 *
 * 使用 class-validator + class-transformer 对 DTO 进行验证。
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { validate } from 'class-validator'
import { plainToInstance } from 'class-transformer'

import {
  CreateAuditLogDto,
  AuditLogQueryDto,
  AuditLogResponseDto,
  AuditLogPaginatedResponseDto,
  SettlementAuditLogDto,
  AuditReportExportDto,
  AnomalyDetectionResultDto,
  RiskScoreResponseDto,
} from './audit.dto'

describe('AuditLog DTOs', () => {
  // ── CreateAuditLogDto ─────────────────────────────────
  describe('CreateAuditLogDto', () => {
    it('✅ 正例: 完整创建审计日志 DTO', async () => {
      const dto = plainToInstance(CreateAuditLogDto, {
        eventType: 'auth.login',
        actorId: 'user_001',
        actorType: 'user',
        tenantId: 'tenant_abc',
        resourceType: 'session',
        resourceId: 'session_001',
        metadata: { browser: 'Chrome' },
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        riskLevel: 'low',
        traceId: 'trace_001',
        parentSpanId: 'span_001',
        settlementId: 'settlement_001',
        settlementAmount: 50000,
        piiFields: ['name', 'phone'],
        consentVersion: 'v2.1',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('✅ 正例: 最小字段创建（仅必填）', async () => {
      const dto = plainToInstance(CreateAuditLogDto, {
        eventType: 'order.created',
        actorId: 'admin_001',
        actorType: 'admin',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('✅ 正例: 高风控场景（riskLevel=critical）', async () => {
      const dto = plainToInstance(CreateAuditLogDto, {
        eventType: 'admin.user_impersonate',
        actorId: 'admin_001',
        actorType: 'admin',
        riskLevel: 'critical',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('❌ 反例: 缺少 eventType 应被拒绝', async () => {
      const dto = plainToInstance(CreateAuditLogDto, {
        actorId: 'user_001',
        actorType: 'user',
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'eventType'))
    })

    it('❌ 反例: 缺少 actorId 应被拒绝', async () => {
      const dto = plainToInstance(CreateAuditLogDto, {
        eventType: 'auth.login',
        actorType: 'user',
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'actorId'))
    })

    it('❌ 反例: 无效的 actorType 应被拒绝', async () => {
      const dto = plainToInstance(CreateAuditLogDto, {
        eventType: 'auth.login',
        actorId: 'user_001',
        actorType: 'unknown_type',
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'actorType'))
    })

    it('❌ 反例: 无效的 riskLevel 应被拒绝', async () => {
      const dto = plainToInstance(CreateAuditLogDto, {
        eventType: 'auth.login',
        actorId: 'user_001',
        actorType: 'user',
        riskLevel: 'extreme',
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'riskLevel'))
    })

    it('🔲 边界: 超长 eventType（超过50字符）', async () => {
      const dto = plainToInstance(CreateAuditLogDto, {
        eventType: 'x'.repeat(55),
        actorId: 'user_001',
        actorType: 'user',
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'eventType'))
    })

    it('🔲 边界: 超长 actorId（超过100字符）', async () => {
      const dto = plainToInstance(CreateAuditLogDto, {
        eventType: 'auth.login',
        actorId: 'a'.repeat(110),
        actorType: 'user',
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'actorId'))
    })

    it('🔲 边界: 负数 settlementAmount 应被拒绝', async () => {
      const dto = plainToInstance(CreateAuditLogDto, {
        eventType: 'settlement.paid',
        actorId: 'admin_001',
        actorType: 'admin',
        settlementAmount: -100,
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'settlementAmount'))
    })

    it('🔲 边界: 空字符串字段', async () => {
      const dto = plainToInstance(CreateAuditLogDto, {
        eventType: '',
        actorId: '',
        actorType: 'user',
      })
      const errors = await validate(dto)
      // eventType 和 actorId 空字符串通过 @IsString，但注意若需拒绝应加 @IsNotEmpty
      assert.ok(errors.length === 0 || errors.every(e => !['eventType', 'actorId'].includes(e.property)))
    })
  })

  // ── AuditLogQueryDto ──────────────────────────────────
  describe('AuditLogQueryDto', () => {
    it('✅ 正例: 完整查询 DTO', async () => {
      const dto = plainToInstance(AuditLogQueryDto, {
        actorId: 'user_001',
        tenantId: 'tenant_abc',
        eventType: 'auth.login',
        riskLevel: 'medium',
        from: '2026-01-01T00:00:00Z',
        to: '2026-03-01T00:00:00Z',
        limit: 50,
        cursor: 'cursor_001',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('✅ 正例: 空查询参数（全部可选）', async () => {
      const dto = plainToInstance(AuditLogQueryDto, {})
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('❌ 反例: 无效的 limit（超过 100）', async () => {
      const dto = plainToInstance(AuditLogQueryDto, { limit: 200 })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'limit'))
    })

    it('❌ 反例: 无效的 limit（小于 1）', async () => {
      const dto = plainToInstance(AuditLogQueryDto, { limit: 0 })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'limit'))
    })

    it('❌ 反例: 无效的日期格式', async () => {
      const dto = plainToInstance(AuditLogQueryDto, { from: 'not-a-date' })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'from'))
    })

    it('🔲 边界: riskLevel 枚举值不合法', async () => {
      const dto = plainToInstance(AuditLogQueryDto, { riskLevel: 'unknown' })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'riskLevel'))
    })
  })

  // ── SettlementAuditLogDto ─────────────────────────────
  describe('SettlementAuditLogDto', () => {
    it('✅ 正例: 创建有效分账日志 DTO', async () => {
      const dto = plainToInstance(SettlementAuditLogDto, {
        settlementId: 'settlement_001',
        amount: 10000,
        eventType: 'approved',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('✅ 正例: 带可选 metadata', async () => {
      const dto = plainToInstance(SettlementAuditLogDto, {
        settlementId: 'settlement_001',
        amount: 5000,
        eventType: 'paid',
        metadata: { batchId: 'batch_001' },
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('❌ 反例: 缺少 settlementId', async () => {
      const dto = plainToInstance(SettlementAuditLogDto, {
        amount: 1000,
        eventType: 'created',
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'settlementId'))
    })

    it('❌ 反例: 负数金额', async () => {
      const dto = plainToInstance(SettlementAuditLogDto, {
        settlementId: 'stl_001',
        amount: -1,
        eventType: 'created',
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'amount'))
    })

    it('❌ 反例: 无效的 eventType', async () => {
      const dto = plainToInstance(SettlementAuditLogDto, {
        settlementId: 'stl_001',
        amount: 1000,
        eventType: 'invalid_status',
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'eventType'))
    })

    it('🔲 边界: 所有 eventType 枚举值', async () => {
      const types = ['created', 'approved', 'paid', 'rejected'] as const
      for (const et of types) {
        const dto = plainToInstance(SettlementAuditLogDto, {
          settlementId: `stl_${et}`,
          amount: 1000,
          eventType: et,
        })
        const errors = await validate(dto)
        assert.equal(errors.length, 0, `枚举值 ${et} 应通过验证`)
      }
    })
  })

  // ── AuditReportExportDto ──────────────────────────────
  describe('AuditReportExportDto', () => {
    it('✅ 正例: 默认格式导出', async () => {
      const dto = plainToInstance(AuditReportExportDto, {
        from: '2026-01-01T00:00:00Z',
        to: '2026-06-30T00:00:00Z',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('✅ 正例: CSV 格式导出', async () => {
      const dto = plainToInstance(AuditReportExportDto, {
        from: '2026-01-01T00:00:00Z',
        to: '2026-06-30T00:00:00Z',
        format: 'csv',
      })
      const errors = await validate(dto)
      assert.equal(errors.length, 0)
    })

    it('❌ 反例: 缺少 from 日期', async () => {
      const dto = plainToInstance(AuditReportExportDto, {
        to: '2026-06-30T00:00:00Z',
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'from'))
    })

    it('❌ 反例: 无效的导出格式', async () => {
      const dto = plainToInstance(AuditReportExportDto, {
        from: '2026-01-01T00:00:00Z',
        to: '2026-06-30T00:00:00Z',
        format: 'xlsx',
      })
      const errors = await validate(dto)
      assert.ok(errors.some(e => e.property === 'format'))
    })
  })

  // ── 响应 DTO 形状 ─────────────────────────────────────
  describe('AuditLogResponseDto', () => {
    it('✅ 响应 DTO 结构正确', () => {
      const dto = new AuditLogResponseDto()
      dto.id = 'audit_001'
      dto.eventType = 'auth.login'
      dto.actorId = 'user_001'
      dto.actorType = 'user'
      dto.riskLevel = 'low'
      dto.timestamp = new Date()

      assert.equal(dto.id, 'audit_001')
      assert.equal(dto.eventType, 'auth.login')
      assert.equal(dto.riskLevel, 'low')
      assert.ok(dto.timestamp instanceof Date)
    })
  })

  describe('AuditLogPaginatedResponseDto', () => {
    it('✅ 分页响应 DTO 可包含 nextCursor', () => {
      const dto = new AuditLogPaginatedResponseDto()
      dto.items = []
      dto.total = 0
      dto.nextCursor = 'cursor_next'

      assert.equal(dto.total, 0)
      assert.equal(dto.nextCursor, 'cursor_next')
      assert.ok(Array.isArray(dto.items))
    })

    it('✅ 分页响应 DTO 可无 nextCursor（最后一页）', () => {
      const dto = new AuditLogPaginatedResponseDto()
      dto.items = []
      dto.total = 0
      // nextCursor 不设置 = undefined
      assert.equal(dto.nextCursor, undefined)
    })
  })

  describe('AnomalyDetectionResultDto', () => {
    it('✅ 异常检测结果可赋值', () => {
      const dto = new AnomalyDetectionResultDto()
      dto.pattern = '高频登录失败'
      dto.riskLevel = 'high'
      dto.count = 12

      assert.equal(dto.pattern, '高频登录失败')
      assert.equal(dto.riskLevel, 'high')
      assert.equal(dto.count, 12)
    })
  })

  describe('RiskScoreResponseDto', () => {
    it('✅ 风险评分 DTO 结构正确', () => {
      const dto = new RiskScoreResponseDto()
      dto.actorId = 'user_001'
      dto.score = 85
      dto.riskLevel = 'high'

      assert.equal(dto.actorId, 'user_001')
      assert.equal(dto.score, 85)
      assert.equal(dto.riskLevel, 'high')
    })
  })
})
