import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { RlsController } from './rls.controller'

describe('RlsController metadata', () => {
  it('controller should keep api/rls path', () => {
    assert.equal(Reflect.getMetadata('path', RlsController), 'api/rls')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [RlsController.prototype.getStatus, 0, 'status'],
      [RlsController.prototype.enableRls, 1, 'enable'],
      [RlsController.prototype.createPolicy, 1, 'policy'],
      [RlsController.prototype.getPolicy, 0, 'policy'],
      [RlsController.prototype.listPolicies, 0, 'policies'],
      [RlsController.prototype.updatePolicy, 2, 'policy'],
      [RlsController.prototype.deletePolicy, 3, 'policy'],
      [RlsController.prototype.verifyFilter, 1, 'verify'],
      [RlsController.prototype.setupIsolation, 1, 'setup'],
      [RlsController.prototype.verifyMultitenant, 0, 'verify/isolation'],
      [RlsController.prototype.initTenantPool, 1, 'pool/init'],
      [RlsController.prototype.verifyTenantAccess, 1, 'verify/access'],
      [RlsController.prototype.getAuditLogs, 0, 'audit'],
      [RlsController.prototype.setTenantContext, 1, 'tenant/context'],
      [RlsController.prototype.getTenantPools, 0, 'tenant/pools'],
      [RlsController.prototype.releaseTenantPool, 3, 'tenant/pool'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
