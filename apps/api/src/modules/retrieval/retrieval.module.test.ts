// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * retrieval.module.test.ts · RetrievalModule 注册测试
 *
 * 验证:
 *   - 模块可被 Nest DI 系统正确实例化
 *   - 导出正确的 provider / controller
 *   - 配置加载
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'

describe('RetrievalModule', () => {
  const { RetrievalModule } = require('./retrieval.module')

  it('module should be defined', () => {
    assert.ok(RetrievalModule)
    assert.equal(typeof RetrievalModule, 'function')
  })

  it('module metadata should include RetrievalService as provider', () => {
    const providers = Reflect.getMetadata('providers', RetrievalModule) ?? []
    const providerNames = providers.map((p: unknown) =>
      typeof p === 'function' ? p.name : p
    )

    assert.ok(providerNames.some((n: string) => n.includes('RetrievalService')), 'RetrievalService provider missing')
    assert.ok(providerNames.some((n: string) => n.includes('QdrantClientWrapper')), 'QdrantClientWrapper provider missing')
    assert.ok(providerNames.some((n: string) => n.includes('EmbeddingService')), 'EmbeddingService provider missing')
  })

  it('module metadata should include controllers', () => {
    const controllers = Reflect.getMetadata('controllers', RetrievalModule) ?? []

    assert.ok(controllers.length >= 2, 'should have at least 2 controllers')
    const controllerNames = controllers.map((c: unknown) => typeof c === 'function' ? c.name : String(c))
    assert.ok(controllerNames.some((n: string) => n.includes('RetrievalController')), 'RetrievalController missing')
    assert.ok(controllerNames.some((n: string) => n.includes('RetrievalHealthController')), 'RetrievalHealthController missing')
  })

  it('module metadata should export RetrievalService', () => {
    const exports = Reflect.getMetadata('exports', RetrievalModule) ?? []
    const exportNames = exports.map((e: unknown) =>
      typeof e === 'function' ? e.name : e
    )

    assert.ok(exportNames.some((n: string) => n.includes('RetrievalService')), 'RetrievalService export missing')
    assert.ok(exportNames.some((n: string) => n.includes('QdrantClientWrapper')), 'QdrantClientWrapper export missing')
    assert.ok(exportNames.some((n: string) => n.includes('EmbeddingService')), 'EmbeddingService export missing')
  })

  it('module metadata should import ConfigModule and CacheModule', () => {
    const imports = Reflect.getMetadata('imports', RetrievalModule) ?? []
    const importNames = imports.map((i: unknown) => {
      if (typeof i === 'function') return i.name
      if (i && typeof i === 'object' && 'module' in i) return (i as any).module?.name ?? JSON.stringify(i)
      return String(i)
    })

    assert.ok(importNames.some((n: string) => n.includes('Config')), 'ConfigModule import missing')
    assert.ok(importNames.some((n: string) => n.includes('Cache')), 'CacheModule import missing')
  })
})
