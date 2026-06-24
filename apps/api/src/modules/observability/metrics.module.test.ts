/**
 * metrics.module.test.ts — MetricsModule 初始化测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { MetricsModule } from './metrics.module'

describe('MetricsModule', () => {
  test('模块定义包含必要的元数据', () => {
    const metadata = Reflect.getMetadata('imports', MetricsModule) ?? []
    const controllers = Reflect.getMetadata('controllers', MetricsModule) ?? []
    const providers = Reflect.getMetadata('providers', MetricsModule) ?? []
    const exports = Reflect.getMetadata('exports', MetricsModule) ?? []

    assert.ok(Array.isArray(metadata))
    assert.ok(controllers.length > 0, 'should have at least one controller')
    assert.ok(providers.length > 0, 'should have at least one provider')
    assert.ok(exports.length > 0, 'should export service and interceptor')
  })
})
