import 'reflect-metadata'
import { describe, it, beforeAll } from 'vitest'
import assert from 'node:assert/strict'

describe('SharedController metadata', () => {
  let SharedController: any

  beforeAll(async () => {
    ;({ SharedController } = await import('./shared.controller'))
  })

  it('controller should keep shared path', () => {
    assert.equal(Reflect.getMetadata('path', SharedController), 'shared')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [SharedController.prototype.getHealth, 0, 'health'],
      [SharedController.prototype.getAuditLog, 0, 'audit'],
      [SharedController.prototype.getAllAuditLog, 0, 'audit/all'],
      [SharedController.prototype.getAuditEntry, 0, 'audit/:id'],
      [SharedController.prototype.validateTenant, 1, 'validate-tenant'],
      [SharedController.prototype.getVersion, 0, 'version'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
