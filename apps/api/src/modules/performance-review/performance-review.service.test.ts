import { describe, it, beforeEach, afterEach } from 'vitest'
/**
 * 🐜 自动: [performance-review] service 测试
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { PerformanceReviewService } from './performance-review.service'
import {
  ReviewPeriod,
  ReviewStatus,
  type ReviewScore,
  type OverallRating,
} from './performance-review.entity'

describe('PerformanceReviewService', () => {
  let service: PerformanceReviewService

  const TENANT = 'tenant-001'

  beforeEach(() => {
    service = new PerformanceReviewService()
  })

  afterEach(() => {
    service.resetReviewStoresForTests()
  })

  function createTestReview(overrides?: Partial<Parameters<PerformanceReviewService['createReview']>[0]>) {
    return service.createReview({
      tenantId: TENANT,
      employeeId: 'EMP-001',
      employeeName: '张三',
      reviewer: '李经理',
      period: ReviewPeriod.Quarterly,
      scores: [
        { dimension: '工作质量', score: 5, weight: 0.3, comment: '优秀' },
        { dimension: '工作效率', score: 4, weight: 0.3, comment: '良好' },
      ],
      comments: '表现不错',
      ...overrides,
    })
  }

  const defaultScores: ReviewScore[] = [
    { id: 's1', dimension: '质量', score: 5, weight: 0.4, comment: '优' },
    { id: 's2', dimension: '效率', score: 4, weight: 0.4, comment: '良' },
    { id: 's3', dimension: '协作', score: 3, weight: 0.2, comment: '中' },
  ]

  // ── Score Calculation ──

  describe('calculateOverallRating', () => {
    it('should return A for scores >= 0.9', () => {
      const scores: ReviewScore[] = [
        { id: 's1', dimension: 'D', score: 5, weight: 1, comment: 'C' },
      ]
      assert.equal(PerformanceReviewService.calculateOverallRating(scores), 'A')
    })

    it('should return B for scores >= 0.75', () => {
      const scores: ReviewScore[] = [
        { id: 's1', dimension: 'D', score: 4, weight: 1, comment: 'C' },
      ]
      assert.equal(PerformanceReviewService.calculateOverallRating(scores), 'B')
    })

    it('should return C for scores >= 0.6', () => {
      const scores: ReviewScore[] = [
        { id: 's1', dimension: 'D', score: 3, weight: 1, comment: 'C' },
      ]
      assert.equal(PerformanceReviewService.calculateOverallRating(scores), 'C')
    })

    it('should return D for scores < 0.6', () => {
      const scores: ReviewScore[] = [
        { id: 's1', dimension: 'D', score: 2, weight: 1, comment: 'C' },
      ]
      assert.equal(PerformanceReviewService.calculateOverallRating(scores), 'D')
    })

    it('should return C for empty scores', () => {
      assert.equal(PerformanceReviewService.calculateOverallRating([]), 'C')
    })
  })

  // ── CRUD ──

  describe('createReview', () => {
    it('should create a review with DRAFT status and computed rating', () => {
      const r = createTestReview()
      assert.equal(r.employeeId, 'EMP-001')
      assert.equal(r.status, ReviewStatus.Draft)
      assert.equal(r.scores.length, 2)
      assert.equal(r.overallRating, 'A') // (5*0.3 + 4*0.3) / 0.6 = 4.5/5 = 0.9 => A
      assert.ok(r.id.startsWith('review-'))
      assert.ok(r.reviewNo.startsWith('PR'))
    })
  })

  describe('getReview', () => {
    it('should return review by id', () => {
      const r = createTestReview()
      const found = service.getReview(r.id, TENANT)
      assert.ok(found)
      assert.equal(found?.id, r.id)
    })

    it('should return undefined for non-existent review', () => {
      assert.equal(service.getReview('nonexistent', TENANT), undefined)
    })

    it('should return undefined for wrong tenant', () => {
      const r = createTestReview()
      assert.equal(service.getReview(r.id, 'other-tenant'), undefined)
    })
  })

  describe('listReviews', () => {
    it('should list all reviews for tenant', () => {
      createTestReview({ employeeId: 'EMP-001' })
      createTestReview({ employeeId: 'EMP-002' })
      assert.equal(service.listReviews(TENANT).length, 2)
    })

    it('should filter by period', () => {
      createTestReview({ period: ReviewPeriod.Quarterly })
      createTestReview({ period: ReviewPeriod.Monthly })

      const monthly = service.listReviews(TENANT, { period: ReviewPeriod.Monthly })
      assert.equal(monthly.length, 1)
    })

    it('should filter by employeeId', () => {
      createTestReview({ employeeId: 'EMP-001' })
      createTestReview({ employeeId: 'EMP-002' })

      const emp1 = service.listReviews(TENANT, { employeeId: 'EMP-001' })
      assert.equal(emp1.length, 1)
    })
  })

  describe('updateScores', () => {
    it('should update scores and recalculate rating', () => {
      const r = createTestReview()
      assert.equal(r.overallRating, 'A')

      const updated = service.updateScores(
        r.id,
        TENANT,
        [{ score: 2 }, { score: 2 }],
      )
      assert.equal(updated.scores[0].score, 2)
      assert.equal(updated.scores[1].score, 2)
      assert.equal(updated.overallRating, 'B') // (2*0.3 + 2*0.3) / 0.6 = 0.4 => 0.4/0.5 = 0.8 => B
    })

    it('should throw on non-existent review', () => {
      assert.throws(() => {
        service.updateScores('nonexistent', TENANT, [{}])
      }, /Performance review not found/)
    })
  })

  describe('updateReviewStatus', () => {
    it('should update status', () => {
      const r = createTestReview()
      const reviewed = service.updateReviewStatus(r.id, ReviewStatus.Reviewed, TENANT)
      assert.equal(reviewed.status, ReviewStatus.Reviewed)
    })

    it('should set ackDate on acknowledged status', () => {
      const r = createTestReview()
      const acked = service.updateReviewStatus(r.id, ReviewStatus.Acknowledged, TENANT)
      assert.equal(acked.status, ReviewStatus.Acknowledged)
      assert.ok(acked.ackDate)
    })

    it('should throw on non-existent review', () => {
      assert.throws(() => {
        service.updateReviewStatus('nonexistent', ReviewStatus.Reviewed, TENANT)
      }, /Performance review not found/)
    })
  })

  // ── Seed ──

  describe('seedMockData', () => {
    it('should seed 20 reviews with various statuses', () => {
      service.seedMockData(TENANT)
      const reviews = service.listReviews(TENANT)
      assert.equal(reviews.length, 20)

      const statuses = new Set(reviews.map((r) => r.status))
      assert.ok(statuses.has(ReviewStatus.Draft))
      assert.ok(statuses.has(ReviewStatus.Reviewed))
      assert.ok(statuses.has(ReviewStatus.Acknowledged))
      assert.ok(statuses.has(ReviewStatus.Archived))

      // All reviews should have scores and ratings
      for (const r of reviews) {
        assert.ok(r.scores.length > 0)
        assert.ok(['A', 'B', 'C', 'D'].includes(r.overallRating))
      }
    })
  })
})
