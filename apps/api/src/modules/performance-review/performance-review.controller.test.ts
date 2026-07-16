import { describe, it, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [performance-review] controller 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { PerformanceReviewController } from './performance-review.controller'
import { PerformanceReviewService } from './performance-review.service'
import { ReviewPeriod, ReviewStatus } from './performance-review.entity'

describe('PerformanceReviewController', () => {
  let controller: InstanceType<typeof PerformanceReviewController>
  let service: InstanceType<typeof PerformanceReviewService>

  const TENANT = { tenantId: 'tenant-001' }

  beforeEach(() => {
    service = new PerformanceReviewService()
    controller = new PerformanceReviewController(service)
  })

  afterEach(() => {
    service.resetReviewStoresForTests()
  })

  // ── Route metadata ──

  describe('route metadata', () => {
    it('controller path should be performance-reviews', () => {
      const path = Reflect.getMetadata('path', PerformanceReviewController)
      assert.equal(path, 'performance-reviews')
    })

    it('createReview should be POST /', () => {
      const method = Reflect.getMetadata('method', PerformanceReviewController.prototype.createReview)
      const path = Reflect.getMetadata('path', PerformanceReviewController.prototype.createReview)
      assert.equal(method, 1)
      assert.equal(path, '/')
    })

    it('listReviews should be GET /', () => {
      const method = Reflect.getMetadata('method', PerformanceReviewController.prototype.listReviews)
      const path = Reflect.getMetadata('path', PerformanceReviewController.prototype.listReviews)
      assert.equal(method, 0)
      assert.equal(path, '/')
    })

    it('getReview should be GET /:reviewId', () => {
      const method = Reflect.getMetadata('method', PerformanceReviewController.prototype.getReview)
      const path = Reflect.getMetadata('path', PerformanceReviewController.prototype.getReview)
      assert.equal(method, 0)
      assert.equal(path, ':reviewId')
    })

    it('updateScores should be PATCH /:reviewId/scores', () => {
      const method = Reflect.getMetadata('method', PerformanceReviewController.prototype.updateScores)
      const path = Reflect.getMetadata('path', PerformanceReviewController.prototype.updateScores)
      assert.equal(method, 4)
      assert.equal(path, ':reviewId/scores')
    })

    it('updateReviewStatus should be PATCH /:reviewId/status', () => {
      const method = Reflect.getMetadata('method', PerformanceReviewController.prototype.updateReviewStatus)
      const path = Reflect.getMetadata('path', PerformanceReviewController.prototype.updateReviewStatus)
      assert.equal(method, 4)
      assert.equal(path, ':reviewId/status')
    })

    it('seedMockData should be POST /seed', () => {
      const method = Reflect.getMetadata('method', PerformanceReviewController.prototype.seedMockData)
      const path = Reflect.getMetadata('path', PerformanceReviewController.prototype.seedMockData)
      assert.equal(method, 1)
      assert.equal(path, 'seed')
    })
  })

  // ── Controller Logic ──

  describe('createReview', () => {
    it('should create review via controller', () => {
      const r = controller.createReview(TENANT, {
        employeeId: 'EMP-001', employeeName: '张三', reviewer: '李经理',
        period: ReviewPeriod.Quarterly,
        scores: [
          { dimension: '质量', score: 5, weight: 1, comment: '优' },
        ],
        comments: '表现优秀',
      })
      assert.equal(r.employeeId, 'EMP-001')
      assert.equal(r.overallRating, 'A')
    })
  })

  describe('listReviews', () => {
    it('should list reviews', () => {
      controller.createReview(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', reviewer: 'M',
        period: ReviewPeriod.Quarterly,
        scores: [{ dimension: 'D', score: 4, weight: 1, comment: 'C' }],
        comments: 'C',
      })
      controller.createReview(TENANT, {
        employeeId: 'EMP-002', employeeName: 'B', reviewer: 'M',
        period: ReviewPeriod.Monthly,
        scores: [{ dimension: 'D', score: 4, weight: 1, comment: 'C' }],
        comments: 'C',
      })
      assert.equal(controller.listReviews(TENANT, {}).length, 2)
    })
  })

  describe('getReview', () => {
    it('should get review by id', () => {
      const r = controller.createReview(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', reviewer: 'M',
        period: ReviewPeriod.Quarterly,
        scores: [{ dimension: 'D', score: 4, weight: 1, comment: 'C' }],
        comments: 'C',
      })
      const found = controller.getReview(TENANT, r.id)
      assert.equal(found.id, r.id)
    })

    it('should throw on non-existent review', () => {
      assert.throws(() => {
        controller.getReview(TENANT, 'nonexistent')
      }, /Performance review not found/)
    })
  })

  describe('updateScores', () => {
    it('should update scores', () => {
      const r = controller.createReview(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', reviewer: 'M',
        period: ReviewPeriod.Quarterly,
        scores: [
          { dimension: 'Q', score: 5, weight: 0.5, comment: 'C' },
          { dimension: 'E', score: 4, weight: 0.5, comment: 'C' },
        ],
        comments: 'C',
      })

      const updated = controller.updateScores(TENANT, r.id, {
        scores: [{ score: 3 }, { score: 3 }],
      })
      assert.equal(updated.scores[0].score, 3)
    })
  })

  describe('updateReviewStatus', () => {
    it('should update status', () => {
      const r = controller.createReview(TENANT, {
        employeeId: 'EMP-001', employeeName: 'A', reviewer: 'M',
        period: ReviewPeriod.Quarterly,
        scores: [{ dimension: 'D', score: 4, weight: 1, comment: 'C' }],
        comments: 'C',
      })

      const updated = controller.updateReviewStatus(TENANT, r.id, {
        status: ReviewStatus.Reviewed,
      })
      assert.equal(updated.status, ReviewStatus.Reviewed)
    })
  })

  describe('seedMockData', () => {
    it('should seed 20 reviews', () => {
      const result = controller.seedMockData(TENANT)
      assert.deepStrictEqual(result, { message: 'Mock performance review data seeded' })
      assert.equal(controller.listReviews(TENANT, {}).length, 20)
    })
  })
})
