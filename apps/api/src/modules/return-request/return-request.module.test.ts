import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [return-request] [D] module 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { ReturnRequestModule } from './return-request.module'
import { ReturnRequestController } from './return-request.controller'
import { ReturnRequestService } from './return-request.service'

describe('ReturnRequestModule', () => {
  it('should be defined', () => {
    const mod = new ReturnRequestModule()
    assert.ok(mod instanceof ReturnRequestModule)
  })

  it('should have correct module metadata', () => {
    const controllers = Reflect.getMetadata('controllers', ReturnRequestModule)
    const providers = Reflect.getMetadata('providers', ReturnRequestModule)
    const exports = Reflect.getMetadata('exports', ReturnRequestModule)

    assert.ok(controllers)
    assert.ok(providers)
    assert.ok(exports)

    assert.ok(controllers.includes(ReturnRequestController))
    assert.ok(providers.includes(ReturnRequestService))
    assert.ok(exports.includes(ReturnRequestService))
  })
})
