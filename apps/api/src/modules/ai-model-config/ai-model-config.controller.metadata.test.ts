import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AiModelConfigController } from './ai-model-config.controller'

describe('AiModelConfigController metadata', () => {
  it('controller should keep ai-model-config path', () => {
    assert.equal(Reflect.getMetadata('path', AiModelConfigController), 'ai-model-config')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AiModelConfigController.prototype.listPresets, 0, 'presets'],
      [AiModelConfigController.prototype.getPreset, 0, 'presets/:id'],
      [AiModelConfigController.prototype.createStoreConfig, 1, 'store-configs'],
      [AiModelConfigController.prototype.listStoreConfigs, 0, 'store-configs'],
      [AiModelConfigController.prototype.switchConfig, 1, 'switch'],
      [AiModelConfigController.prototype.listHistory, 0, 'history/:configId'],
      [AiModelConfigController.prototype.rollback, 1, 'rollback'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
