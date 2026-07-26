// @ts-nocheck
import { describe, it, beforeEach, beforeAll } from 'vitest'
/**
 * shared.controller.test.ts
 * SharedController 单元测试 (遵循项目 *.controller.test.ts 模式)
 */
import assert from 'node:assert/strict'

describe('SharedController', () => {
  let SharedController: any
  let AuditService: any

  let controller: any
  let auditService: any

  beforeAll(async () => {
    ;({ SharedController } = await import('./shared.controller.ts'))
    ;({ AuditService } = await import('./audit.service.ts'))
  })

  beforeEach(() => {
    auditService = new AuditService()
    controller = new SharedController(auditService)
  })

  describe('controller instantiation', () => {
    it('controller is instantiated with AuditService', () => {
      assert.ok(controller instanceof SharedController)
      assert.ok(typeof controller.getHealth === 'function')
      assert.ok(typeof controller.getAuditLog === 'function')
      assert.ok(typeof controller.getVersion === 'function')
    })
  })

  describe('getHealth — positive', () => {
    it('returns healthy status with metadata', () => {
      const result = controller.getHealth()
      assert.equal(result.status, 'healthy')
      assert.equal(typeof result.uptimeMs, 'number')
      assert.equal(typeof result.auditLogCount, 'number')
      assert.equal(result.version, '1.0.0')
    })

    it('uptimeMs increases over time', async () => {
      const r1 = controller.getHealth()
      await new Promise((r) => setTimeout(r, 5))
      const r2 = controller.getHealth()
      assert.ok(r2.uptimeMs >= r1.uptimeMs)
    })
  })

  describe('validateTenant — positive + negative', () => {
    it('valid tenant returns { valid: true }', () => {
      const result = controller.validateTenant({ tenantId: 'tenant-valid-123' })
      assert.equal(result.valid, true)
      assert.equal(result.tenantId, 'tenant-valid-123')
    })

    it('empty tenant returns { valid: false }', () => {
      const result = controller.validateTenant({ tenantId: '' })
      assert.equal(result.valid, false)
      assert.ok(result.error)
    })

    it('whitespace-only tenant returns invalid', () => {
      const result = controller.validateTenant({ tenantId: '   ' })
      assert.equal(result.valid, false)
    })

    it('single char tenant is valid', () => {
      const result = controller.validateTenant({ tenantId: 'a' })
      assert.equal(result.valid, true)
    })
  })

  describe('getVersion — positive', () => {
    it('returns version and startedAt', () => {
      const result = controller.getVersion()
      assert.equal(result.version, '1.0.0')
      assert.equal(typeof result.startedAt, 'string')
      assert.ok(new Date(result.startedAt).getTime() > 0)
    })
  })

  describe('getAuditEntry — boundary', () => {
    it('non-existent id returns { found: false }', async () => {
      const result = await controller.getAuditEntry('999')
      assert.equal(result.found, false)
    })

    it('string "0" returns not found if no entries', async () => {
      const result = await controller.getAuditEntry('0')
      assert.equal(result.found, false)
    })
  })

  describe('getAuditLog — boundary', () => {
    it('unknown tenantId returns empty array', async () => {
      const result = await controller.getAuditLog({
        tenantId: 'nonexistent-tenant',
        limit: 10,
        action: undefined,
        since: undefined,
      })
      assert.equal(result.total, 0)
      assert.deepEqual(result.entries, [])
    })
  })
})
