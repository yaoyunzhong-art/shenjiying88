import 'reflect-metadata'
import assert from 'node:assert/strict'
import { describe, it } from 'vitest'
import { AIReviewController } from './ai-review.controller'

describe('AIReviewController metadata', () => {
  it('controller should keep ai-review path', () => {
    assert.equal(Reflect.getMetadata('path', AIReviewController), 'ai-review')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AIReviewController.prototype.submitReview, 1, 'reviews'],
      [AIReviewController.prototype.getReviewResult, 0, 'reviews/:id'],
      [AIReviewController.prototype.getReviewHistory, 0, 'history'],
      [AIReviewController.prototype.getReviewSummary, 0, 'summary'],
      [AIReviewController.prototype.createReviewConfig, 1, 'configs'],
      [AIReviewController.prototype.updateReviewConfig, 2, 'configs/:id'],
      [AIReviewController.prototype.getReviewConfig, 0, 'configs/:id'],
      [AIReviewController.prototype.deleteReviewConfig, 3, 'configs/:id'],
      [AIReviewController.prototype.healthcheck, 0, 'health'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
