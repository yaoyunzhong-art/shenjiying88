import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AiContentController } from './ai-content.controller'

describe('AiContentController metadata', () => {
  it('controller should keep ai-content path', () => {
    assert.equal(Reflect.getMetadata('path', AiContentController), 'ai-content')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AiContentController.prototype.generateReport, 1, 'report/generate'],
      [AiContentController.prototype.getReport, 0, 'report/:eventId'],
      [AiContentController.prototype.addHighlights, 2, 'report/:reportId/highlights'],
      [AiContentController.prototype.shareReport, 2, 'report/:reportId/share'],
      [AiContentController.prototype.moderateContent, 1, 'moderate'],
      [AiContentController.prototype.batchModerate, 1, 'moderate/batch'],
      [AiContentController.prototype.flagForReview, 1, 'moderate/:contentId/flag'],
      [AiContentController.prototype.reviewContent, 2, 'moderate/:contentId/review'],
      [AiContentController.prototype.getReviewQueue, 0, 'moderate/queue'],
      [AiContentController.prototype.computeFingerprint, 1, 'video/fingerprint'],
      [AiContentController.prototype.detectDuplicates, 1, 'video/detect-duplicates'],
      [AiContentController.prototype.compareVideos, 1, 'video/compare'],
      [AiContentController.prototype.calculateImprovement, 1, 'progress/improvement'],
      [AiContentController.prototype.comparePerformance, 1, 'progress/compare'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
