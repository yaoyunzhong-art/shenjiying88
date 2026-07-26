import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { FeedbackController } from './feedback.controller'

describe('FeedbackController metadata', () => {
  it('controller should keep feedback path', () => {
    assert.equal(Reflect.getMetadata('path', FeedbackController), 'feedback')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [FeedbackController.prototype.create, 1, '/'],
      [FeedbackController.prototype.list, 0, '/'],
      [FeedbackController.prototype.stats, 0, 'stats'],
      [FeedbackController.prototype.getById, 0, ':id'],
      [FeedbackController.prototype.reply, 1, ':id/reply'],
      [FeedbackController.prototype.update, 4, ':id'],
      [FeedbackController.prototype.delete, 3, ':id'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
