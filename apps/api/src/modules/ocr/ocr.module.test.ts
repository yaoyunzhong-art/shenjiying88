import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ocr] [A] module.test 补全
 *
 * 验证 OcrModule 导入/导出/依赖结构
 */

import assert from 'node:assert/strict'
import { OcrModule } from './ocr.module'
import { OcrService } from './ocr.service'
import { OcrController } from './ocr.controller'

describe('OcrModule', () => {
  it('should be defined', () => {
    assert.ok(OcrModule)
  })

  it('should export OcrService', () => {
    const exports = Reflect.getMetadata('exports', OcrModule) ?? []
    assert.ok(exports.includes(OcrService))
  })

  it('should have OcrController in controllers', () => {
    const controllers = Reflect.getMetadata('controllers', OcrModule) ?? []
    assert.ok(controllers.includes(OcrController))
  })

  it('should have OcrService in providers', () => {
    const providers = Reflect.getMetadata('providers', OcrModule) ?? []
    assert.ok(providers.includes(OcrService))
  })

  it('should be @Global() decorated', () => {
    const isGlobal = Reflect.getMetadata('__module:global__', OcrModule) ?? false
    assert.ok(isGlobal)
  })
})
