import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { CrossModuleController } from './cross-module.controller'

describe('CrossModuleController metadata', () => {
  it('controller should keep cross-module path', () => {
    assert.equal(Reflect.getMetadata('path', CrossModuleController), 'cross-module')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [CrossModuleController.prototype.getChainStatus, 0, 'chain-status'],
      [CrossModuleController.prototype.getSummary, 0, 'summary'],
      [CrossModuleController.prototype.validate, 1, 'validate'],
      [CrossModuleController.prototype.validateChain, 1, 'validate/:chainName'],
      [CrossModuleController.prototype.getAllVerified, 0, 'all-verified'],
      [CrossModuleController.prototype.getHasBroken, 0, 'has-broken'],
      [CrossModuleController.prototype.resetAll, 1, 'reset'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
