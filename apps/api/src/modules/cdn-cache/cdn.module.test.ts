import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [cdn-cache] [A] module.test 补全
 *
 * 验证 CdnCacheModule 导入/导出/依赖结构
 */

import assert from 'node:assert/strict'
import { CdnCacheModule } from './cdn.module'
import { CdnCacheService } from './cdn.service'
import { CdnCacheController } from './cdn.controller'

describe('CdnCacheModule', () => {
  it('should be defined', () => {
    assert.ok(CdnCacheModule)
  })

  it('should export CdnCacheService', () => {
    const exports = Reflect.getMetadata('exports', CdnCacheModule) ?? []
    assert.ok(exports.includes(CdnCacheService))
  })

  it('should have CdnCacheController in controllers', () => {
    const controllers = Reflect.getMetadata('controllers', CdnCacheModule) ?? []
    assert.ok(controllers.includes(CdnCacheController))
  })

  it('should have CdnCacheService in providers', () => {
    const providers = Reflect.getMetadata('providers', CdnCacheModule) ?? []
    assert.ok(providers.includes(CdnCacheService))
  })

  it('should be @Global() decorated', () => {
    const isGlobal = Reflect.getMetadata('__module:global__', CdnCacheModule) ?? false
    assert.ok(isGlobal)
  })
})
