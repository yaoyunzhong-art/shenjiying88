import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * shared.contract.test.ts — Shared 模块契约测试
 *
 * 验证跨模块接口契约：
 * - 健康检查响应 shape
 * - 审计日志查询响应 shape
 * - 租户校验响应 shape
 * - 版本查询响应 shape
 * - 边界条件（空日志、非法租户）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AuditService } from './audit.service'
import { SharedController } from './shared.controller'

function setup() {
  const auditService = new AuditService()
  const controller = new SharedController(auditService)
  return { auditService, controller }
}

describe('Shared 模块契约 — 健康检查', () => {
  it('/shared/health 返回正确 shape', () => {
    const { controller } = setup()
    const health = controller.getHealth()
    assert.equal(typeof health, 'object')
    assert.equal(health.status, 'healthy')
    assert.equal(typeof health.uptimeMs, 'number')
    assert.equal(typeof health.auditLogCount, 'number')
    assert.equal(health.version, '1.0.0')
  })

  it('health.status 只能为 healthy 或 degraded', () => {
    const { controller } = setup()
    const health = controller.getHealth()
    assert.ok(health.status === 'healthy' || health.status === 'degraded')
  })
})

describe('Shared 模块契约 — 审计日志查询', () => {
  beforeEach(() => {
    // 每个 test 前重置
  })

  it('GET /shared/audit 返回 entries + total', async () => {
    const { controller, auditService } = setup()
    await auditService.logCrossTenantAttempt({
      actor: 'user-1',
      tenantId: 't-001',
      resource: 'agent:001',
    })

    const result = await controller.getAuditLog({ tenantId: 't-001' } as any)
    assert.ok(Array.isArray(result.entries))
    assert.equal(typeof result.total, 'number')
    assert.equal(result.entries.length, 1)
    assert.equal(result.entries[0].actor, 'user-1')
  })

  it('审计日志每条 entry 包含完整字段', async () => {
    const { controller, auditService } = setup()
    await auditService.logCrossTenantAttempt({
      actor: 'user-2',
      tenantId: 't-002',
      resource: 'cfg:42',
      metadata: { ip: '10.0.0.1' },
    })
    const result = await controller.getAuditLog({ tenantId: 't-002' } as any)
    const entry = result.entries[0]
    assert.equal(typeof entry.id, 'number')
    assert.equal(typeof entry.occurredAt, 'string')
    assert.equal(typeof entry.actor, 'string')
    assert.equal(typeof entry.tenantId, 'string')
    assert.equal(typeof entry.resource, 'string')
    assert.equal(typeof entry.action, 'string')
    assert.ok(entry.id > 0)
  })

  it('审计日志按 tenantId 过滤 — 不同租户隔离', async () => {
    const { controller, auditService } = setup()
    await auditService.logCrossTenantAttempt({ actor: 'u1', tenantId: 't-001', resource: 'r1' })
    await auditService.logCrossTenantAttempt({ actor: 'u2', tenantId: 't-002', resource: 'r2' })

    const r1 = await controller.getAuditLog({ tenantId: 't-001' } as any)
    const r2 = await controller.getAuditLog({ tenantId: 't-002' } as any)
    assert.equal(r1.entries.length, 1)
    assert.equal(r2.entries.length, 1)
    assert.equal(r1.entries[0].actor, 'u1')
    assert.equal(r2.entries[0].actor, 'u2')
  })

  it('审计日志支持 action 过滤', async () => {
    const { controller, auditService } = setup()
    await auditService.logCrossTenantAttempt({ actor: 'u1', tenantId: 't-001', resource: 'r1' })
    await auditService.logCrossTenantAttempt({
      actor: 'u2',
      tenantId: 't-001',
      resource: 'cfg:1',
      action: 'config_read',
    })

    const result = await controller.getAuditLog({ tenantId: 't-001', action: 'config_read' } as any)
    assert.equal(result.entries.length, 1)
    assert.equal(result.entries[0].action, 'config_read')
  })

  it('GET /shared/audit/all 返回全部日志', async () => {
    const { controller, auditService } = setup()
    await auditService.logCrossTenantAttempt({ actor: 'u1', tenantId: 't-001', resource: 'r1' })
    await auditService.logCrossTenantAttempt({ actor: 'u2', tenantId: 't-002', resource: 'r2' })

    const result = await controller.getAllAuditLog()
    assert.equal(result.entries.length, 2)
    assert.equal(result.total, 2)
  })

  it('GET /shared/audit/:id 通过 ID 查找单条日志', async () => {
    const { controller, auditService } = setup()
    await auditService.logCrossTenantAttempt({ actor: 'u1', tenantId: 't-001', resource: 'r1' })

    const found = await controller.getAuditEntry('1')
    assert.equal(found.found, true)
    assert.equal(found.entry!.actor, 'u1')
  })

  it('GET /shared/audit/:id 不存在的 ID 返回 not found', async () => {
    const { controller } = setup()
    const result = await controller.getAuditEntry('999')
    assert.equal(result.found, false)
    assert.ok(result.message!.includes('not found'))
  })
})

describe('Shared 模块契约 — 租户校验', () => {
  it('POST /shared/validate-tenant 合法 tenantId 返回 valid', () => {
    const { controller } = setup()
    const result = controller.validateTenant({ tenantId: 'tenant-abc' })
    assert.equal(result.valid, true)
    assert.equal(result.tenantId, 'tenant-abc')
  })

  it('POST /shared/validate-tenant 空 tenantId 返回 invalid', () => {
    const { controller } = setup()
    const result = controller.validateTenant({ tenantId: '' })
    assert.equal(result.valid, false)
    assert.equal(typeof result.error, 'string')
  })

  it('POST /shared/validate-tenant null tenantId 返回 invalid', () => {
    const { controller } = setup()
    // @ts-expect-error 测试边界: null tenantId
    const result = controller.validateTenant({ tenantId: null })
    assert.equal(result.valid, false)
  })
})

describe('Shared 模块契约 — 版本查询', () => {
  it('GET /shared/version 返回 version + startedAt', () => {
    const { controller } = setup()
    const info = controller.getVersion()
    assert.equal(typeof info.version, 'string')
    assert.equal(typeof info.startedAt, 'string')
    assert.equal(info.version, '1.0.0')
  })

  it('startedAt 是有效 ISO 日期', () => {
    const { controller } = setup()
    const info = controller.getVersion()
    const date = new Date(info.startedAt)
    assert.ok(date.getTime() > 0)
  })
})
