import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [canary] [A] module.test 补全
 *
 * 验证 CanaryModule 导入/导出/依赖结构
 */

import assert from 'node:assert/strict'
import { CanaryModule } from './canary.module'
import { CanaryService } from './canary.service'
import { CanaryController } from './canary.controller'

describe('CanaryModule', () => {
  it('should be defined', () => {
    assert.ok(CanaryModule)
  })

  it('should export CanaryService', () => {
    const exports = Reflect.getMetadata('exports', CanaryModule) ?? []
    assert.ok(exports.includes(CanaryService))
  })

  it('should have CanaryController in controllers', () => {
    const controllers = Reflect.getMetadata('controllers', CanaryModule) ?? []
    assert.ok(controllers.includes(CanaryController))
  })

  it('should have CanaryService in providers', () => {
    const providers = Reflect.getMetadata('providers', CanaryModule) ?? []
    assert.ok(providers.includes(CanaryService))
  })

  it('should be @Global() decorated', () => {
    const isGlobal = Reflect.getMetadata('__module:global__', CanaryModule) ?? false
    assert.ok(isGlobal)
  })
})
