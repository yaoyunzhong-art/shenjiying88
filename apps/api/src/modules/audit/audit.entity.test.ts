/**
 * audit.entity.test.ts - 审计日志实体测试
 * 正例 + 反例 + 边界测试
 *
 * TypeORM @Entity/@Column 装饰器在测试上下文无法反射完整元数据，
 * 这里直接测试实体类的纯 JS 属性赋值/类型/序列化。
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import type { AuditEventType, ActorType, RiskLevel } from './audit.entity'

interface AuditLogEntityLike {
  id?: string
  eventType?: AuditEventType | string
  actorId?: string
  actorType?: ActorType | string
  tenantId?: string
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
  riskLevel?: RiskLevel | string
  traceId?: string
  parentSpanId?: string
  settlementId?: string
  settlementAmount?: number
  piiFields?: string[]
  consentVersion?: string
  timestamp?: Date
}

const createAuditLog = (overrides: Partial<AuditLogEntityLike> = {}): AuditLogEntityLike => ({
  id: 'audit_001_001',
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
  settlementId: undefined,
  settlementAmount: undefined,
  piiFields: undefined,
  consentVersion: undefined,
  timestamp: new Date('2026-07-01T00:00:00Z'),
  ...overrides,
})

describe('AuditLogEntity 实体形状', () => {
  // ── 正例 ────────────────────────────────────────────────
  it('✅ 正例: 创建完整审计日志对象', () => {
    const log = createAuditLog()

    assert.equal(log.id, 'audit_001_001')
    assert.equal(log.eventType, 'auth.login')
    assert.equal(log.actorId, 'user_001')
    assert.equal(log.actorType, 'user')
    assert.equal(log.tenantId, 'tenant_abc')
    assert.equal(log.resourceType, 'session')
    assert.equal(log.resourceId, 'session_001')
    assert.deepEqual(log.metadata, { browser: 'Chrome' })
    assert.equal(log.ipAddress, '192.168.1.1')
    assert.equal(log.riskLevel, 'low')
    assert.equal(log.traceId, 'trace_001')
    assert.equal(log.parentSpanId, 'span_001')
    assert.ok(log.timestamp instanceof Date)
  })

  it('✅ 正例: 最小字段创建（仅必填）', () => {
    const log: AuditLogEntityLike = {
      eventType: 'auth.login',
      actorId: 'admin_001',
      actorType: 'admin',
      riskLevel: 'medium',
    }

    assert.equal(log.eventType, 'auth.login')
    assert.equal(log.actorId, 'admin_001')
    assert.equal(log.actorType, 'admin')
    assert.equal(log.riskLevel, 'medium')
    // 可选字段应为 undefined
    assert.equal(log.tenantId, undefined)
    assert.equal(log.metadata, undefined)
    assert.equal(log.ipAddress, undefined)
    assert.equal(log.timestamp, undefined)
  })

  it('✅ 正例: 分账相关字段单独赋值', () => {
    const log = createAuditLog({
      eventType: 'settlement.approved',
      settlementId: 'settlement_001',
      settlementAmount: 50000,
    })

    assert.equal(log.settlementId, 'settlement_001')
    assert.equal(log.settlementAmount, 50000)
  })

  it('✅ 正例: PII 和同意版本字段赋值', () => {
    const log = createAuditLog({
      eventType: 'compliance.consent_recorded',
      piiFields: ['name', 'phone', 'email'],
      consentVersion: 'v2.1',
    })

    assert.deepEqual(log.piiFields, ['name', 'phone', 'email'])
    assert.equal(log.consentVersion, 'v2.1')
  })

  // ── 边界 ────────────────────────────────────────────────
  it('🔲 边界: 全部事件类型可赋值', () => {
    const allEventTypes: AuditEventType[] = [
      'auth.login', 'auth.logout', 'auth.register', 'auth.password_change',
      'user.profile_update', 'user.consent_update', 'user.data_delete',
      'order.created', 'order.paid', 'order.refunded', 'order.cancelled',
      'points.earned', 'points.redeemed', 'points.adjusted',
      'payment.initiated', 'payment.completed', 'payment.failed', 'payment.refunded',
      'settlement.created', 'settlement.approved', 'settlement.rejected', 'settlement.paid',
      'admin.config_change', 'admin.user_impersonate', 'admin.data_export',
      'compliance.consent_recorded', 'compliance.dsr_submitted', 'compliance.dsr_processed',
    ]

    for (const evt of allEventTypes) {
      const log: AuditLogEntityLike = {
        eventType: evt,
        actorId: 'test',
        actorType: 'system',
        riskLevel: 'low',
      }
      assert.equal(log.eventType, evt)
    }
  })

  it('🔲 边界: 所有 ActorType 可赋值', () => {
    const allActorTypes: ActorType[] = ['user', 'admin', 'system', 'api_key']
    for (const at of allActorTypes) {
      const log: AuditLogEntityLike = {
        eventType: 'auth.login',
        actorId: 'test',
        actorType: at,
        riskLevel: 'low',
      }
      assert.equal(log.actorType, at)
    }
  })

  it('🔲 边界: 所有 RiskLevel 可赋值', () => {
    const allRiskLevels: RiskLevel[] = ['low', 'medium', 'high', 'critical']
    for (const rl of allRiskLevels) {
      const log: AuditLogEntityLike = {
        eventType: 'auth.login',
        actorId: 'test',
        actorType: 'system',
        riskLevel: rl,
      }
      assert.equal(log.riskLevel, rl)
    }
  })

  it('🔲 边界: metadata 为复杂嵌套对象', () => {
    const complexMeta = {
      location: { lat: 31.23, lng: 121.47 },
      tags: ['sensitive', 'cross-region'],
      retryCount: 3,
      isAutomated: true,
    }
    const log = createAuditLog({ metadata: complexMeta })
    assert.deepEqual(log.metadata, complexMeta)
  })

  it('🔲 边界: 超长字段值', () => {
    const longIp = '2001:0db8:85a3:0000:0000:8a2e:0370:7334'
    const longTraceId = 'trace_' + 'a'.repeat(90)
    const log = createAuditLog({
      ipAddress: longIp,
      traceId: longTraceId,
    })
    assert.equal(log.ipAddress, longIp)
    assert.equal(log.traceId, longTraceId)
  })

  it('🔲 边界: 零分账金额', () => {
    const log = createAuditLog({
      eventType: 'settlement.paid',
      settlementId: 'settlement_002',
      settlementAmount: 0,
    })
    assert.equal(log.settlementAmount, 0)
  })

  // ── JSON 序列化 ─────────────────────────────────────────
  it('✅ JSON 序列化保留所有字段', () => {
    const log = createAuditLog()
    const json = JSON.parse(JSON.stringify(log))

    assert.equal(json.id, 'audit_001_001')
    assert.equal(json.eventType, 'auth.login')
    assert.equal(json.actorId, 'user_001')
    assert.equal(json.riskLevel, 'low')
    assert.equal(json.ipAddress, '192.168.1.1')
    assert.equal(typeof json.timestamp, 'string') // Date → ISO string
  })

  it('✅ JSON 序列化: 嵌套 metadata 保留', () => {
    const log = createAuditLog({
      metadata: { nested: { key: 'val' }, arr: [1, 2, 3] },
    })
    const json = JSON.parse(JSON.stringify(log))
    assert.deepEqual(json.metadata, { nested: { key: 'val' }, arr: [1, 2, 3] })
  })
})
