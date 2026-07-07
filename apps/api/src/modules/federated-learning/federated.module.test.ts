import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [federated-learning] [A] module.test 补全
 *
 * 验证 FederatedLearningModule 导入/导出/依赖结构
 */

import assert from 'node:assert/strict'
import { FederatedLearningModule } from './federated.module'
import { FederatedLearningService } from './federated.service'
import { FederatedLearningController } from './federated.controller'

describe('FederatedLearningModule', () => {
  it('should be defined', () => {
    assert.ok(FederatedLearningModule)
  })

  it('should export FederatedLearningService', () => {
    const exports = Reflect.getMetadata('exports', FederatedLearningModule) ?? []
    assert.ok(exports.includes(FederatedLearningService))
  })

  it('should have FederatedLearningController in controllers', () => {
    const controllers = Reflect.getMetadata('controllers', FederatedLearningModule) ?? []
    assert.ok(controllers.includes(FederatedLearningController))
  })

  it('should have FederatedLearningService in providers', () => {
    const providers = Reflect.getMetadata('providers', FederatedLearningModule) ?? []
    assert.ok(providers.includes(FederatedLearningService))
  })

  it('should be @Global() decorated', () => {
    const isGlobal = Reflect.getMetadata('__module:global__', FederatedLearningModule) ?? false
    assert.ok(isGlobal)
  })
})
