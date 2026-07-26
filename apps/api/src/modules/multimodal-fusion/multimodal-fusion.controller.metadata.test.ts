import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { MultimodalFusionController } from './multimodal-fusion.controller'

describe('MultimodalFusionController metadata', () => {
  it('controller should keep fusion path', () => {
    assert.equal(Reflect.getMetadata('path', MultimodalFusionController), 'fusion')
  })

  it('routes should keep REST metadata and http codes', () => {
    const cases = [
      [MultimodalFusionController.prototype.createTask, 1, 'tasks', 201],
      [MultimodalFusionController.prototype.listTasks, 0, 'tasks', undefined],
      [MultimodalFusionController.prototype.getTask, 0, 'tasks/:id', undefined],
      [MultimodalFusionController.prototype.cancelTask, 1, 'tasks/:id/cancel', 200],
      [MultimodalFusionController.prototype.crossModalSearch, 1, 'search', undefined],
      [MultimodalFusionController.prototype.indexItem, 1, 'index/item', 201],
      [MultimodalFusionController.prototype.indexTabular, 1, 'index/tabular', undefined],
      [MultimodalFusionController.prototype.listTemplates, 0, 'templates', undefined],
      [MultimodalFusionController.prototype.listEngines, 0, 'engines', undefined],
      [MultimodalFusionController.prototype.stats, 0, 'stats', undefined],
    ] as const

    cases.forEach(([handler, method, path, statusCode]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
      if (statusCode !== undefined) {
        assert.equal(Reflect.getMetadata('__httpCode__', handler), statusCode)
      }
    })
  })
})
