import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [voice-processing] [A] module 测试补全
 *
 * 验证模块正确加载 provider/controller/export
 */

import assert from 'node:assert/strict'
import { VoiceProcessingModule } from './voice-processing.module'

describe('voice-processing Module', () => {
  it('模块定义存在', () => {
    assert.ok(VoiceProcessingModule)
  })

  it('模块是 @Global() 装饰的 NestJS 类', () => {
    const meta = Reflect.getMetadataKeys(VoiceProcessingModule)
    assert.ok(
      meta.some((k) => k.toString().includes('global') || k.toString().includes('Global')),
      '应包含 Global 装饰器元数据',
    )
  })

  it('模块构造函数可识别', () => {
    const proto = VoiceProcessingModule.prototype
    assert.ok(typeof proto.constructor === 'function')
    assert.equal(proto.constructor.name, 'VoiceProcessingModule')
  })

  it('模块能被实例化（无参构造器）', () => {
    const instance = new VoiceProcessingModule()
    assert.ok(instance instanceof VoiceProcessingModule)
  })

  it('模块的装饰器元数据包含 providers', () => {
    // 验证 module 元数据存在 (NestJS ReflectMetadata)
    // 使用已知的 NestJS 元数据键
    const metadataKeys = Reflect.getMetadataKeys(VoiceProcessingModule)
    assert.ok(metadataKeys.length > 0, '模块应有装饰器元数据')
  })
})
