import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * shared.dto.test.ts
 * SharedModule DTO 测试 (构造 + 序列化)
 */
import assert from 'node:assert/strict'
import { AuditLogQueryDto, AuditLogEntryDto, SharedHealthDto, ValidateTenantDto } from './shared.dto'

describe('shared.dto', () => {
  describe('AuditLogQueryDto', () => {
    it('构造完整 DTO', () => {
      const dto = new AuditLogQueryDto()
      dto.tenantId = 't-001'
      dto.since = '2026-01-01T00:00:00.000Z'
      dto.limit = 50
      dto.action = 'config_read'

      assert.equal(dto.tenantId, 't-001')
      assert.equal(dto.since, '2026-01-01T00:00:00.000Z')
      assert.equal(dto.limit, 50)
      assert.equal(dto.action, 'config_read')
    })

    it('仅必填字段 tenantId', () => {
      const dto = new AuditLogQueryDto()
      dto.tenantId = 't-002'

      assert.equal(dto.tenantId, 't-002')
      assert.equal(dto.since, undefined)
      assert.equal(dto.limit, undefined)
      assert.equal(dto.action, undefined)
    })
  })

  describe('AuditLogEntryDto', () => {
    it('构造完整 DTO', () => {
      const dto = new AuditLogEntryDto()
      dto.id = 1
      dto.occurredAt = '2026-06-27T00:00:00.000Z'
      dto.actor = 'system'
      dto.tenantId = 't-001'
      dto.resource = 'agent:123'
      dto.action = 'cross_tenant_access_attempt'

      assert.equal(dto.id, 1)
      assert.equal(dto.actor, 'system')
      assert.equal(dto.tenantId, 't-001')
    })

    it('可选 metadata', () => {
      const dto = new AuditLogEntryDto()
      dto.id = 2
      dto.occurredAt = new Date().toISOString()
      dto.actor = 'admin'
      dto.tenantId = 't-002'
      dto.resource = 'cfg:1'
      dto.action = 'config_read'
      dto.metadata = { reason: 'debug' }

      assert.deepEqual(dto.metadata, { reason: 'debug' })
    })
  })

  describe('SharedHealthDto', () => {
    it('健康状态', () => {
      const dto = new SharedHealthDto()
      dto.status = 'healthy'
      dto.uptimeMs = 10000
      dto.auditLogCount = 5
      dto.version = '1.0.0'

      assert.equal(dto.status, 'healthy')
      assert.equal(dto.uptimeMs, 10000)
    })

    it('降级状态', () => {
      const dto = new SharedHealthDto()
      dto.status = 'degraded'
      dto.uptimeMs = 0
      dto.auditLogCount = 0
      dto.version = '1.0.0'

      assert.equal(dto.status, 'degraded')
    })
  })

  describe('ValidateTenantDto', () => {
    it('构造 DTO', () => {
      const dto = new ValidateTenantDto()
      dto.tenantId = 'tenant-abc'
      assert.equal(dto.tenantId, 'tenant-abc')
    })
  })
})
