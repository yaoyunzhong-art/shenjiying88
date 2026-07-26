import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AiController } from './ai.controller'

describe('AiController metadata', () => {
  it('controller should keep ai path', () => {
    assert.equal(Reflect.getMetadata('path', AiController), 'ai')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AiController.prototype.analyze, 1, 'analyze'],
      [AiController.prototype.sentiment, 1, 'sentiment'],
      [AiController.prototype.keywords, 1, 'keywords'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
