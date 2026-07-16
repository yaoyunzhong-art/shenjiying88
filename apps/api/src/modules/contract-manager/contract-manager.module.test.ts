import { describe, it } from 'vitest'
/**
 * 🐜 自动: [contract-manager] module 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ContractManagerModule } from './contract-manager.module'
import { ContractManagerController } from './contract-manager.controller'
import { ContractManagerService } from './contract-manager.service'

describe('ContractManagerModule', () => {
  it('should be defined', () => {
    const module = new ContractManagerModule()
    assert.ok(module instanceof ContractManagerModule)
  })

  it('should have correct module metadata', () => {
    const controllers = Reflect.getMetadata('controllers', ContractManagerModule)
    const providers = Reflect.getMetadata('providers', ContractManagerModule)
    const exports = Reflect.getMetadata('exports', ContractManagerModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers.includes(ContractManagerController))
    assert.ok(providers.includes(ContractManagerService))
    assert.ok(exports.includes(ContractManagerService))
  })
})
