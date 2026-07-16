import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [procurement-order] [D] module 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ProcurementOrderModule } from './procurement-order.module'
import { ProcurementOrderController } from './procurement-order.controller'
import { ProcurementOrderService } from './procurement-order.service'

describe('ProcurementOrderModule', () => {
  it('should be defined', () => {
    const mod = new ProcurementOrderModule()
    assert.ok(mod instanceof ProcurementOrderModule)
  })

  it('should have correct module metadata', () => {
    const controllers = Reflect.getMetadata('controllers', ProcurementOrderModule)
    const providers = Reflect.getMetadata('providers', ProcurementOrderModule)
    const exports = Reflect.getMetadata('exports', ProcurementOrderModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers.includes(ProcurementOrderController))
    assert.ok(providers.includes(ProcurementOrderService))
    assert.ok(exports.includes(ProcurementOrderService))
  })
})
