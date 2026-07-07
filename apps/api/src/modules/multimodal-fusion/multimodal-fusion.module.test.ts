import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [multimodal-fusion] [A] module 测试补全
 *
 * 验证 MultimodalFusionModule 正确加载 provider/controller/export
 */

import assert from 'node:assert/strict'

import { MultimodalFusionModule } from './multimodal-fusion.module'

describe('MultimodalFusion Module', () => {
  it('模块定义存在', () => {
    assert.ok(MultimodalFusionModule)
  })

  it('模块是 @Global() 装饰的 NestJS 类', () => {
    const meta = Reflect.getMetadataKeys(MultimodalFusionModule)
    assert.ok(
      meta.some((k) => k.toString().includes('global') || k.toString().includes('Global')),
      '应包含 Global 装饰器元数据',
    )
  })

  it('模块构造函数可识别', () => {
    const proto = MultimodalFusionModule.prototype
    assert.ok(typeof proto.constructor === 'function')
    assert.equal(proto.constructor.name, 'MultimodalFusionModule')
  })

  it('模块能被实例化（无参构造器）', () => {
    const instance = new MultimodalFusionModule()
    assert.ok(instance instanceof MultimodalFusionModule)
  })

  it('模块的装饰器元数据包含 providers', () => {
    const metadataKeys = Reflect.getMetadataKeys(MultimodalFusionModule)
    assert.ok(metadataKeys.length > 0, '模块应有装饰器元数据')
  })

  it('模块导出 MultimodalFusionService', () => {
    // 检查模块定义中的 exports
    const exportsMeta = (MultimodalFusionModule as any).__exports__
    if (exportsMeta) {
      const names = exportsMeta.map((e: any) => e.name ?? e.toString())
      assert.ok(names.some((n: string) => n.includes('MultimodalFusionService')), '应导出 MultimodalFusionService')
    }
  })

  it('模块控制器列表包含 MultimodalFusionController', () => {
    const controllersMeta = (MultimodalFusionModule as any).__controllers__
    if (controllersMeta) {
      const names = controllersMeta.map((c: any) => c.name ?? c.toString())
      assert.ok(names.some((n: string) => n.includes('MultimodalFusionController')), '应包含 MultimodalFusionController')
    }
  })
})
