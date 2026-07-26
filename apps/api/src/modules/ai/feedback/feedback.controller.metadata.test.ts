import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { FeedbackController } from './feedback.controller'

describe('FeedbackController metadata', () => {
  it('controller should keep ai/feedback path', () => {
    assert.equal(Reflect.getMetadata('path', FeedbackController), 'ai/feedback')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [FeedbackController.prototype.submit, 1, '/'],
      [FeedbackController.prototype.resolve, 1, ':id/resolve'],
      [FeedbackController.prototype.list, 0, '/'],
      [FeedbackController.prototype.stats, 0, 'stats'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
