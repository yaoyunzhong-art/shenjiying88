import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { InsightController } from './insight.controller'

describe('InsightController metadata', () => {
  it('controller should keep insight path', () => {
    assert.equal(Reflect.getMetadata('path', InsightController), 'insight')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [InsightController.prototype.generate, 1, 'generate'],
      [InsightController.prototype.list, 0, 'list'],
      [InsightController.prototype.getTemplates, 0, 'templates'],
      [InsightController.prototype.getById, 0, ':id'],
      [InsightController.prototype.pruneCache, 1, 'cache/prune'],
      [InsightController.prototype.delete, 3, ':id'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
