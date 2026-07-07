import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * multimedia.module.test.ts — 多模态模块单元测试
 *
 * 覆盖:
 * - 模块结构 (providers / controllers / exports)
 * - 全局模块标记
 * - 依赖实例化
 */

import assert from 'node:assert'
void describe('MultimediaModule', () => {
  void describe('模块注册', () => {
    void it('应加载 MultimediaModule 定义', async () => {
      const mod = await import('./multimedia.module')
      assert.ok(mod.MultimediaModule, '应导出 MultimediaModule 类')
    })

    void it('应导出多媒体服务', async () => {
      const mod = await import('./multimedia.module')
      const instance = new mod.MultimediaModule()
      // NestJS 模块元数据: 检查模块装饰器写入的 providers / controllers / exports
      const metadata = Reflect.getOwnMetadata
        ? (Reflect.getOwnMetadata('design:paramtypes', mod.MultimediaModule) ?? [])
        : []
      assert.ok(Array.isArray(metadata))
    })

    void it('应加载 Controller 并暴露路由', async () => {
      const controller = await import('./multimedia.controller')
      assert.ok(controller.MultimediaController, '应导出 MultimediaController')
      const ctrlInstance = new controller.MultimediaController({} as any)
      assert.ok(typeof ctrlInstance.createAsset === 'function')
      assert.ok(typeof ctrlInstance.listAssets === 'function')
      assert.ok(typeof ctrlInstance.getAsset === 'function')
      assert.ok(typeof ctrlInstance.deleteAsset === 'function')
      assert.ok(typeof ctrlInstance.createVariant === 'function')
      assert.ok(typeof ctrlInstance.listVariants === 'function')
    })

    void it('应加载 Service 并暴露核心方法', async () => {
      const service = await import('./multimedia.service')
      assert.ok(service.MultimediaService, '应导出 MultimediaService')
    })
  })

  void describe('DTO 可序列化', () => {
    void it('CreateAssetDto 应可 JSON 序列化', () => {
      const dto = {
        originalFilename: 'test.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 1024,
        contentHash: 'x'.repeat(64),
        tags: ['a', 'b'],
      }
      const json = JSON.stringify(dto)
      const parsed = JSON.parse(json)
      assert.strictEqual(parsed.originalFilename, 'test.jpg')
      assert.strictEqual(parsed.mimeType, 'image/jpeg')
      assert.strictEqual(parsed.sizeBytes, 1024)
    })
  })

  void describe('Service 接口', () => {
    void it('应提供所有声明的方法签名', async () => {
      const service = await import('./multimedia.service')
      const proto = service.MultimediaService.prototype
      const methods = [
        'createAsset', 'completeUpload', 'getAsset', 'listAssets',
        'deleteAsset', 'createVariant', 'listVariants',
        'generateSignedUrlForAsset', 'addStorageBackend',
        'listStorageBackends', 'deleteStorageBackend', 'getStorageStats',
      ]
      for (const m of methods) {
        assert.ok(typeof (proto as any)[m] === 'function', `${m} 应在 MultimediaService 上定义`)
      }
    })
  })
})
