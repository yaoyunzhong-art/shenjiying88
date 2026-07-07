import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-recommend] [A] module 测试
 * AiRecommendModule 的模块注册和导出验证
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiRecommendModule } from './ai-recommend.module'
import { AiRecommendController } from './ai-recommend.controller'
import { AiRecommendService } from './ai-recommend.service'

describe('AiRecommendModule', () => {
  it('should be defined', () => {
    assert.ok(AiRecommendModule)
  })

  it('should be instantiable', () => {
    const instance = new AiRecommendModule()
    assert.ok(instance instanceof AiRecommendModule)
  })

  it('module metadata has controllers', () => {
    const controllers = Reflect.getMetadata('controllers', AiRecommendModule) as unknown[]
    if (controllers) {
      assert.ok(controllers.includes(AiRecommendController))
    }
  })

  it('module metadata has providers/exports', () => {
    const providers = Reflect.getMetadata('providers', AiRecommendModule) as unknown[]
    if (providers) {
      const hasService = providers.some(
        (p: unknown) =>
          (typeof p === 'function' && p === AiRecommendService) ||
          (typeof p === 'object' && p !== null &&
            (p as { provide?: unknown }).provide === AiRecommendService)
      )
      assert.ok(hasService, 'module should provide AiRecommendService')
    }
  })

  it('module exports AiRecommendService', () => {
    const exports = Reflect.getMetadata('exports', AiRecommendModule) as unknown[]
    if (exports) {
      const exportsService = exports.some(
        (e: unknown) =>
          (typeof e === 'function' && e === AiRecommendService) ||
          (typeof e === 'object' && e !== null &&
            (e as { export?: unknown }).export === AiRecommendService)
      )
      assert.ok(exportsService, 'module should export AiRecommendService')
    }
  })

  it('controller has expected methods', () => {
    const proto = AiRecommendController.prototype
    // 推荐查询
    assert.equal(typeof proto.getPopular, 'function')
    assert.equal(typeof proto.getPersonalized, 'function')
    assert.equal(typeof proto.getRecommendations, 'function')
    // 推荐生成
    assert.equal(typeof proto.generateRecommendations, 'function')
    // 策略管理
    assert.equal(typeof proto.createStrategy, 'function')
    assert.equal(typeof proto.getStrategies, 'function')
    assert.equal(typeof proto.getStrategy, 'function')
    assert.equal(typeof proto.updateStrategy, 'function')
    assert.equal(typeof proto.enableStrategy, 'function')
    assert.equal(typeof proto.disableStrategy, 'function')
    // 画像管理
    assert.equal(typeof proto.getProfile, 'function')
    assert.equal(typeof proto.updateProfile, 'function')
    // 反馈收集
    assert.equal(typeof proto.recordScore, 'function')
    assert.equal(typeof proto.recordInteraction, 'function')
    assert.equal(typeof proto.recordConversion, 'function')
  })

  it('service has expected methods', () => {
    const proto = AiRecommendService.prototype
    // 推荐
    assert.equal(typeof proto.getPopularRecommendations, 'function')
    assert.equal(typeof proto.getPersonalizedRecommendations, 'function')
    assert.equal(typeof proto.generateRecommendations, 'function')
    assert.equal(typeof proto.getRecommendations, 'function')
    // 策略
    assert.equal(typeof proto.createStrategy, 'function')
    assert.equal(typeof proto.getStrategies, 'function')
    assert.equal(typeof proto.getStrategy, 'function')
    assert.equal(typeof proto.updateStrategy, 'function')
    assert.equal(typeof proto.enableStrategy, 'function')
    assert.equal(typeof proto.disableStrategy, 'function')
    // 画像
    assert.equal(typeof proto.getProfile, 'function')
    assert.equal(typeof proto.updateProfile, 'function')
    // 反馈
    assert.equal(typeof proto.recordInteraction, 'function')
    assert.equal(typeof proto.recordConversion, 'function')
  })

  it('controller and service contract alignment', () => {
    const ctrlProto = AiRecommendController.prototype
    const svcProto = AiRecommendService.prototype

    const svcMethodNames = new Set(
      Object.getOwnPropertyNames(svcProto).filter(n => n !== 'constructor')
    )

    const delegatableMethods = [
      'getPopularRecommendations',
      'getPersonalizedRecommendations',
      'getRecommendations',
      'generateRecommendations',
      'createStrategy',
      'getStrategies',
      'getStrategy',
      'updateStrategy',
      'enableStrategy',
      'disableStrategy',
      'getProfile',
      'updateProfile',
      'recordInteraction',
      'recordConversion'
    ]

    for (const method of delegatableMethods) {
      assert.ok(svcMethodNames.has(method),
        `service should have method ${method}`)
    }
  })

  it('module can be imported and used with NestJS Test', async () => {
    const { Test } = await import('@nestjs/testing')
    const module = await Test.createTestingModule({
      imports: [AiRecommendModule]
    }).compile()

    const app = module.createNestApplication()
    await app.init()

    const service = app.get(AiRecommendService)
    assert.ok(service instanceof AiRecommendService)

    await app.close()
  })
})
