import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [warehouse-bin] [D] module 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { WarehouseBinModule } from './warehouse-bin.module'
import { WarehouseBinController } from './warehouse-bin.controller'
import { WarehouseBinService } from './warehouse-bin.service'

describe('WarehouseBinModule', () => {
  it('should be defined', () => {
    const mod = new WarehouseBinModule()
    assert.ok(mod instanceof WarehouseBinModule)
  })

  it('should have correct module metadata', () => {
    const controllers = Reflect.getMetadata('controllers', WarehouseBinModule)
    const providers = Reflect.getMetadata('providers', WarehouseBinModule)
    const exports = Reflect.getMetadata('exports', WarehouseBinModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers.includes(WarehouseBinController))
    assert.ok(providers.includes(WarehouseBinService))
    assert.ok(exports.includes(WarehouseBinService))
  })
})
