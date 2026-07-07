import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [open-api] [A] module.test 补全
 *
 * 验证 OpenApiModule 导入/导出/依赖结构
 */

import assert from 'node:assert/strict'
import { OpenApiModule } from './open-api.module'
import { OpenApiService } from './open-api.service'
import { OpenApiController } from './open-api.controller'

describe('OpenApiModule', () => {
  it('should be defined', () => {
    assert.ok(OpenApiModule)
  })

  it('should export OpenApiService', () => {
    const exports = Reflect.getMetadata('exports', OpenApiModule) ?? []
    assert.ok(exports.includes(OpenApiService))
  })

  it('should have OpenApiController in controllers', () => {
    const controllers = Reflect.getMetadata('controllers', OpenApiModule) ?? []
    assert.ok(controllers.includes(OpenApiController))
  })

  it('should have OpenApiService in providers', () => {
    const providers = Reflect.getMetadata('providers', OpenApiModule) ?? []
    assert.ok(providers.includes(OpenApiService))
  })

  it('should be @Global() decorated', () => {
    const isGlobal = Reflect.getMetadata('__module:global__', OpenApiModule) ?? false
    assert.ok(isGlobal)
  })
})
