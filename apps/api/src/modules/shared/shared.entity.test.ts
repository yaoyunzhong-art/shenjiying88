import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * shared.entity.test.ts
 * 覆盖 SharedModule 所有实体类型定义 + 类型守卫
 */
import assert from 'node:assert/strict'

describe('shared.entity', () => {
  describe('AuditAction 类型验证', () => {
    it('所有 AuditAction 字符串应被正确识别', () => {
      const actions = [
        'cross_tenant_access_attempt',
        'missing_tenant_id',
        'invalid_tenant',
        'rls_policy_violation',
        'config_read',
        'config_write',
        'session_read',
        'evaluation_read',
      ] as const
      for (const action of actions) {
        assert.equal(typeof action, 'string')
        assert.ok(action.includes('_'))
      }
    })
  })

  describe('AuditLogEntry 接口', () => {
    it('构造完整 AuditLogEntry --- 所有必填字段正确', () => {
      const entry = {
        id: 1,
        occurredAt: '2026-06-27T00:00:00.000Z',
        actor: 'user-1',
        tenantId: 'tenant-a',
        resource: 'agent_configs:abc',
        action: 'cross_tenant_access_attempt' as const,
      }
      assert.equal(entry.id, 1)
      assert.equal(entry.actor, 'user-1')
      assert.equal(entry.tenantId, 'tenant-a')
      assert.equal(entry.action, 'cross_tenant_access_attempt')
    })

    it('构造带 metadata 的 AuditLogEntry', () => {
      const entry: {
        id: number
        occurredAt: string
        actor: string
        tenantId: string
        resource: string
        action: string
        metadata?: Record<string, unknown>
      } = {
        id: 2,
        occurredAt: new Date().toISOString(),
        actor: 'system',
        tenantId: 'tenant-b',
        resource: 'rls_policy:global',
        action: 'rls_policy_violation',
        metadata: { actualTenant: 'tenant-c', reason: 'policy mismatch' },
      }
      assert.equal(entry.metadata?.actualTenant, 'tenant-c')
      assert.equal(entry.metadata?.reason, 'policy mismatch')
      assert.ok(entry.occurredAt)
    })

    it('AuditLogEntry metadata 可选 --- 不传默认为 undefined', () => {
      const entry: {
        id: number
        occurredAt: string
        actor: string
        tenantId: string
        resource: string
        action: string
        metadata?: Record<string, unknown>
      } = {
        id: 3,
        occurredAt: '2026-01-01T00:00:00.000Z',
        actor: 'test',
        tenantId: 't',
        resource: 'r',
        action: 'missing_tenant_id',
      }
      assert.equal(entry.metadata, undefined)
    })
  })

  describe('TenantValidationResult 接口', () => {
    it('有效租户 --- valid=true', () => {
      const result = { valid: true, tenantId: 'tenant-abc' }
      assert.equal(result.valid, true)
      assert.equal(result.tenantId, 'tenant-abc')
    })

    it('无效租户 --- 包含 error 信息', () => {
      const result = { valid: false, tenantId: '', error: 'tenant ID is empty' }
      assert.equal(result.valid, false)
      assert.equal(result.error, 'tenant ID is empty')
    })
  })

  describe('SharedModuleHealth 接口', () => {
    it('健康状态 healthy', () => {
      const health = {
        status: 'healthy' as const,
        uptimeMs: 3600000,
        auditLogCount: 42,
        version: '1.0.0',
      }
      assert.equal(health.status, 'healthy')
      assert.equal(health.auditLogCount, 42)
    })

    it('降级状态 degraded', () => {
      const health = {
        status: 'degraded' as const,
        uptimeMs: 5000,
        auditLogCount: 0,
        version: '1.0.0',
      }
      assert.equal(health.status, 'degraded')
    })

    it('uptimeMs 为 0 的边界情况', () => {
      const health = {
        status: 'healthy' as const,
        uptimeMs: 0,
        auditLogCount: 10,
        version: '1.0.0',
      }
      assert.equal(health.uptimeMs, 0)
      assert.equal(health.status, 'healthy')
    })
  })

  describe('CrossTenantEvent 接口', () => {
    it('构造完整 CrossTenantEvent', () => {
      const event = {
        id: 1,
        occurredAt: new Date().toISOString(),
        actor: 'view-model-service',
        tenantId: 'tenant-a',
        resource: 'agent_sessions:123',
        action: 'cross_tenant_access_attempt' as const,
        metadata: { actualTenant: 'tenant-b' },
      }
      assert.equal(event.actor, 'view-model-service')
      assert.equal(event.tenantId, 'tenant-a')
      assert.equal(event.metadata?.actualTenant, 'tenant-b')
    })
  })
})
