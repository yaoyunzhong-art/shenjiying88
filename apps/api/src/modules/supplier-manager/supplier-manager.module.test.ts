import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [supplier-manager] [D] module 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { SupplierManagerModule } from './supplier-manager.module'
import { SupplierManagerController } from './supplier-manager.controller'
import { SupplierManagerService } from './supplier-manager.service'

describe('SupplierManagerModule', () => {
  it('should be defined', () => {
    const mod = new SupplierManagerModule()
    assert.ok(mod instanceof SupplierManagerModule)
  })

  it('should have correct module metadata', () => {
    const controllers = Reflect.getMetadata('controllers', SupplierManagerModule)
    const providers = Reflect.getMetadata('providers', SupplierManagerModule)
    const exports = Reflect.getMetadata('exports', SupplierManagerModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers.includes(SupplierManagerController))
    assert.ok(providers.includes(SupplierManagerService))
    assert.ok(exports.includes(SupplierManagerService))
  })
})
