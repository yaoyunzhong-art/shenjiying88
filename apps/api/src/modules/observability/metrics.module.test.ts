import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * metrics.module.test.ts — MetricsModule 初始化测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MetricsModule } from './metrics.module'

describe('MetricsModule', () => {
  it('模块定义包含必要的元数据', () => {
    const metadata = Reflect.getMetadata('imports', MetricsModule) ?? []
    const controllers = Reflect.getMetadata('controllers', MetricsModule) ?? []
    const providers = Reflect.getMetadata('providers', MetricsModule) ?? []
    const exports = Reflect.getMetadata('exports', MetricsModule) ?? []

    assert.ok(Array.isArray(metadata))
    assert.ok(controllers.length > 0, 'should have at least one controller')
    assert.ok(providers.length > 0, 'should have at least one provider')
    assert.ok(exports.length > 0, 'should export service and interceptor')
  })

  it('模块 exports 数量合理 (≤10)', () => {
    const exports = Reflect.getMetadata('exports', MetricsModule) ?? []
    assert.ok(exports.length <= 10, 'exports should be manageable')
  })

  it('模块 controllers 均为 class', () => {
    const controllers: unknown[] = Reflect.getMetadata('controllers', MetricsModule) ?? []
    for (const ctrl of controllers) {
      assert.equal(typeof ctrl, 'function', 'controller should be a class')
    }
  })

  it('模块 providers 均为 class 或 object', () => {
    const providers: unknown[] = Reflect.getMetadata('providers', MetricsModule) ?? []
    for (const provider of providers) {
      assert.ok(
        typeof provider === 'function' || typeof provider === 'object',
        'provider should be class or config object'
      )
    }
  })

  it('模块实例化应存在', () => {
    const instance = new MetricsModule()
    assert.equal(typeof instance, 'object')
    assert.equal(instance.constructor, MetricsModule)
  })
})
