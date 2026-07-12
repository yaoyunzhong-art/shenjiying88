import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * shared.controller.test.ts
 * SharedController 路由元数据 + 单元测试 (遵循项目 *.controller.test.ts 模式)
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'

describe('SharedController', () => {
  const { SharedController } = require('./shared.controller')
  const { AuditService } = require('./audit.service')

  let controller: InstanceType<typeof SharedController>
  let auditService: InstanceType<typeof AuditService>

  beforeEach(() => {
    auditService = new AuditService()
    controller = new SharedController(auditService)
  })

  describe('route metadata', () => {
    it('controller path metadata should be "shared"', () => {
      const path = Reflect.getMetadata('path', SharedController)
      assert.equal(path, 'shared')
    })

    it('GET /shared/health — method GET, path "health"', () => {
      const method = Reflect.getMetadata('method', SharedController.prototype.getHealth)
      const path = Reflect.getMetadata('path', SharedController.prototype.getHealth)
      assert.equal(method, 0) // GET
      assert.equal(path, 'health')
    })

    it('GET /shared/audit — method GET, path "audit"', () => {
      const method = Reflect.getMetadata('method', SharedController.prototype.getAuditLog)
      const path = Reflect.getMetadata('path', SharedController.prototype.getAuditLog)
      assert.equal(method, 0) // GET
      assert.equal(path, 'audit')
    })

    it('GET /shared/audit/all — method GET, path "audit/all"', () => {
      const method = Reflect.getMetadata('method', SharedController.prototype.getAllAuditLog)
      const path = Reflect.getMetadata('path', SharedController.prototype.getAllAuditLog)
      assert.equal(method, 0) // GET
      assert.equal(path, 'audit/all')
    })

    it('GET /shared/audit/:id — method GET, path "audit/:id"', () => {
      const method = Reflect.getMetadata('method', SharedController.prototype.getAuditEntry)
      const path = Reflect.getMetadata('path', SharedController.prototype.getAuditEntry)
      assert.equal(method, 0) // GET
      assert.equal(path, 'audit/:id')
    })

    it('POST /shared/validate-tenant — method POST, path "validate-tenant"', () => {
      const method = Reflect.getMetadata('method', SharedController.prototype.validateTenant)
      const path = Reflect.getMetadata('path', SharedController.prototype.validateTenant)
      assert.equal(method, 1) // POST
      assert.equal(path, 'validate-tenant')
    })

    it('GET /shared/version — method GET, path "version"', () => {
      const method = Reflect.getMetadata('method', SharedController.prototype.getVersion)
      const path = Reflect.getMetadata('path', SharedController.prototype.getVersion)
      assert.equal(method, 0) // GET
      assert.equal(path, 'version')
    })
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
