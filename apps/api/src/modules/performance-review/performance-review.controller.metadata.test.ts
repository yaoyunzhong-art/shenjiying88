import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { PerformanceReviewController } from './performance-review.controller'

describe('PerformanceReviewController metadata', () => {
  it('controller should keep performance-reviews path', () => {
    assert.equal(Reflect.getMetadata('path', PerformanceReviewController), 'performance-reviews')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [PerformanceReviewController.prototype.createReview, 1, '/'],
      [PerformanceReviewController.prototype.listReviews, 0, '/'],
      [PerformanceReviewController.prototype.getReview, 0, ':reviewId'],
      [PerformanceReviewController.prototype.updateScores, 4, ':reviewId/scores'],
      [PerformanceReviewController.prototype.updateReviewStatus, 4, ':reviewId/status'],
      [PerformanceReviewController.prototype.seedMockData, 1, 'seed'],
    ] as const

    cases.forEach(([handler, method, path]) => {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    })
  })
})
