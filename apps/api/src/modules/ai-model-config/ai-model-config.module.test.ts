import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-model-config] [D] Module 定义测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiModelConfigModule } from './ai-model-config.module'
import { AiModelConfigController } from './ai-model-config.controller'
import { AiModelConfigService } from './ai-model-config.service'

describe('AiModelConfigModule', () => {
  it('should be defined', () => {
    const moduleClass = AiModelConfigModule
    assert.ok(moduleClass)
  })

  it('should be constructable', () => {
    const moduleInstance = new AiModelConfigModule()
    assert.ok(moduleInstance instanceof AiModelConfigModule)
  })

  it('should have valid controller', () => {
    assert.ok(AiModelConfigController)
    assert.equal(typeof AiModelConfigController.prototype.listPresets, 'function')
    assert.equal(typeof AiModelConfigController.prototype.getPreset, 'function')
    assert.equal(typeof AiModelConfigController.prototype.createStoreConfig, 'function')
    assert.equal(typeof AiModelConfigController.prototype.listStoreConfigs, 'function')
    assert.equal(typeof AiModelConfigController.prototype.switchConfig, 'function')
    assert.equal(typeof AiModelConfigController.prototype.listHistory, 'function')
    assert.equal(typeof AiModelConfigController.prototype.rollback, 'function')
  })

  it('should have valid service', () => {
    assert.ok(AiModelConfigService)
    assert.equal(typeof AiModelConfigService.prototype.listPresets, 'function')
    assert.equal(typeof AiModelConfigService.prototype.getPreset, 'function')
    assert.equal(typeof AiModelConfigService.prototype.createStoreConfig, 'function')
    assert.equal(typeof AiModelConfigService.prototype.listStoreConfigs, 'function')
    assert.equal(typeof AiModelConfigService.prototype.switchConfig, 'function')
    assert.equal(typeof AiModelConfigService.prototype.listHistory, 'function')
    assert.equal(typeof AiModelConfigService.prototype.rollbackToHistory, 'function')
  })
})
