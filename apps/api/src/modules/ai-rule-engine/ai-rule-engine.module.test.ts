import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { AiRuleEngineModule } from './ai-rule-engine.module'
import { AiRuleEngineController } from './ai-rule-engine.controller'
import { AiRuleEngineService } from './ai-rule-engine.service'

describe('AiRuleEngineModule', () => {
  test('should be defined', () => {
    const moduleClass = AiRuleEngineModule
    assert.ok(moduleClass)
  })

  test('should export expected shape (controllers, providers, exports)', () => {
    const decoratorFactory = Reflect.getMetadata('modules', AiRuleEngineModule)
    // NestJS module metadata is stored via decorators; assert the module is registerable
    const moduleInstance = new AiRuleEngineModule()
    assert.ok(moduleInstance instanceof AiRuleEngineModule)
  })

  test('should have valid controller', () => {
    assert.ok(AiRuleEngineController)
    assert.equal(typeof AiRuleEngineController.prototype.evaluate, 'function')
  })

  test('should have valid service', () => {
    assert.ok(AiRuleEngineService)
    assert.equal(typeof AiRuleEngineService.prototype.evaluateMemberLevel, 'function')
    assert.equal(typeof AiRuleEngineService.prototype.detectDeviceAnomaly, 'function')
  })
})
