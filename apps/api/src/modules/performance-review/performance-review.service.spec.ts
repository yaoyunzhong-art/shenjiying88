/**
 * performance-review.service.spec.ts — 绩效考评 Service 单元测试
 *
 * 覆盖:
 *   createReview        — 正例(3) + 反例(1) + 边界(1)
 *   getReview           — 正例(1) + 反例(2) + 边界(1)
 *   listReviews         — 正例(3) + 反例(2) + 边界(1)
 *   updateScores        — 正例(2) + 反例(2) + 边界(1)
 *   updateReviewStatus  — 正例(3) + 反例(1) + 边界(1)
 *   calculateOverallRating — 正例(4) + 反例(1) + 边界(1)
 *
 * 原则: 无 as any · 无 describe.skip · 无 it.only
 * 隔离: beforeEach 重置 Store
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { PerformanceReviewService } from './performance-review.service'
import { ReviewPeriod, ReviewStatus, type ReviewScore, type OverallRating } from './performance-review.entity'

function createFreshService(): PerformanceReviewService {
  const svc = new PerformanceReviewService()
  svc.resetReviewStoresForTests()
  return svc
}

const TENANT = 'tenant-001'

function makeDefaultReview() {
  return {
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
  }
}

// ═══════════════════════════════════════════════════════════════════
// calculateOverallRating (static)
// ═══════════════════════════════════════════════════════════════════

describe('PerformanceReviewService · calculateOverallRating', () => {
  it('正例: 评分 >= 0.9 返回 A', () => {
    const scores: ReviewScore[] = [
      { id: 's1', dimension: '质量', score: 5, weight: 1, comment: '' },
    ]
    expect(PerformanceReviewService.calculateOverallRating(scores)).toBe('A')
  })

  it('正例: 评分 >= 0.75 返回 B', () => {
    const scores: ReviewScore[] = [
      { id: 's1', dimension: '质量', score: 4, weight: 1, comment: '' },
    ]
    expect(PerformanceReviewService.calculateOverallRating(scores)).toBe('B')
  })

  it('正例: 评分 >= 0.6 返回 C', () => {
    const scores: ReviewScore[] = [
      { id: 's1', dimension: '质量', score: 3, weight: 1, comment: '' },
    ]
    expect(PerformanceReviewService.calculateOverallRating(scores)).toBe('C')
  })

  it('正例: 评分 < 0.6 返回 D', () => {
    const scores: ReviewScore[] = [
      { id: 's1', dimension: '质量', score: 2, weight: 1, comment: '' },
    ]
    expect(PerformanceReviewService.calculateOverallRating(scores)).toBe('D')
  })

  it('反例: 空分数数组返回 C', () => {
    expect(PerformanceReviewService.calculateOverallRating([])).toBe('C')
  })

  it('边界: totalWeight 为 0 返回 C', () => {
    const scores: ReviewScore[] = [
      { id: 's1', dimension: '质量', score: 5, weight: 0, comment: '' },
    ]
    expect(PerformanceReviewService.calculateOverallRating(scores)).toBe('C')
  })
})

// ═══════════════════════════════════════════════════════════════════
// createReview
// ═══════════════════════════════════════════════════════════════════

describe('PerformanceReviewService · createReview', () => {
  let service: PerformanceReviewService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 创建考评返回完整对象', () => {
    const r = service.createReview(makeDefaultReview())
    expect(r.id).toMatch(/^review-/)
    expect(r.reviewNo).toMatch(/^PR/)
    expect(r.employeeId).toBe('EMP-001')
    expect(r.employeeName).toBe('张三')
    expect(r.reviewer).toBe('李经理')
    expect(r.status).toBe(ReviewStatus.Draft)
    expect(r.scores).toHaveLength(2)
    expect(r.comments).toBe('表现不错')
    expect(r.tenantId).toBe(TENANT)
  })

  it('正例: overallRating 根据分数正确计算', () => {
    const r = service.createReview(makeDefaultReview())
    // (5*0.3 + 4*0.3) / 0.6 = 4.5/5 = 0.9 => A
    expect(r.overallRating).toBe('A')
  })

  it('正例: 支持所有考评周期类型', () => {
    for (const period of [ReviewPeriod.Monthly, ReviewPeriod.Quarterly, ReviewPeriod.HalfYearly, ReviewPeriod.Yearly]) {
      const r = service.createReview({ ...makeDefaultReview(), period })
      expect(r.period).toBe(period)
    }
  })

  it('反例: 空分数也能创建（整体评分为 C）', () => {
    const r = service.createReview({ ...makeDefaultReview(), scores: [] })
    expect(r.scores).toHaveLength(0)
    expect(r.overallRating).toBe('C')
  })

  it('边界: 5 项评分权重之和为 1', () => {
    const r = service.createReview({
      ...makeDefaultReview(),
      scores: [
        { dimension: 'a', score: 5, weight: 0.3, comment: '' },
        { dimension: 'b', score: 4, weight: 0.25, comment: '' },
        { dimension: 'c', score: 3, weight: 0.2, comment: '' },
        { dimension: 'd', score: 4, weight: 0.15, comment: '' },
        { dimension: 'e', score: 5, weight: 0.1, comment: '' },
      ],
    })
    expect(r.scores).toHaveLength(5)
    // (1*0.3 + 0.8*0.25 + 0.6*0.2 + 0.8*0.15 + 1*0.1) / 1.0 = 0.84 => B
    expect(r.overallRating).toBe('B')
  })
})

// ═══════════════════════════════════════════════════════════════════
// getReview
// ═══════════════════════════════════════════════════════════════════

describe('PerformanceReviewService · getReview', () => {
  let service: PerformanceReviewService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 通过 ID 获取考评', () => {
    const r = service.createReview(makeDefaultReview())
    const found = service.getReview(r.id, TENANT)
    expect(found).toBeDefined()
    expect(found!.id).toBe(r.id)
    expect(found!.employeeName).toBe('张三')
  })

  it('反例: 不存在的 ID 返回 undefined', () => {
    expect(service.getReview('review-nonexistent', TENANT)).toBeUndefined()
  })

  it('反例: 不同 tenant 无法获取', () => {
    const r = service.createReview(makeDefaultReview())
    expect(service.getReview(r.id, 'tenant-other')).toBeUndefined()
  })

  it('边界: 空字符串 ID 返回 undefined', () => {
    expect(service.getReview('', TENANT)).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════
// listReviews
// ═══════════════════════════════════════════════════════════════════

describe('PerformanceReviewService · listReviews', () => {
  let service: PerformanceReviewService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 列出 tenant 下所有考评', () => {
    service.createReview(makeDefaultReview())
    service.createReview({ ...makeDefaultReview(), employeeId: 'EMP-002', employeeName: '李四' })
    const list = service.listReviews(TENANT)
    expect(list).toHaveLength(2)
  })

  it('正例: 按 period 筛选', () => {
    service.createReview({ ...makeDefaultReview(), period: ReviewPeriod.Quarterly })
    service.createReview({ ...makeDefaultReview(), period: ReviewPeriod.Monthly })
    const monthly = service.listReviews(TENANT, { period: ReviewPeriod.Monthly })
    expect(monthly).toHaveLength(1)
    expect(monthly[0].period).toBe(ReviewPeriod.Monthly)
  })

  it('正例: 按 employeeId 筛选', () => {
    service.createReview({ ...makeDefaultReview(), employeeId: 'EMP-001' })
    service.createReview({ ...makeDefaultReview(), employeeId: 'EMP-002' })
    const emp1 = service.listReviews(TENANT, { employeeId: 'EMP-001' })
    expect(emp1).toHaveLength(1)
  })

  it('反例: 不存在的 tenant 返回空', () => {
    const list = service.listReviews('tenant-nonexistent')
    expect(list).toHaveLength(0)
  })

  it('反例: 组合筛选无匹配返回空', () => {
    service.createReview(makeDefaultReview())
    const list = service.listReviews(TENANT, {
      period: ReviewPeriod.Monthly,
      employeeId: 'EMP-999',
    })
    expect(list).toHaveLength(0)
  })

  it('边界: 空筛选条件等同无筛选', () => {
    service.createReview(makeDefaultReview())
    const all = service.listReviews(TENANT)
    const filtered = service.listReviews(TENANT, {})
    expect(filtered).toHaveLength(all.length)
  })
})

// ═══════════════════════════════════════════════════════════════════
// updateScores
// ═══════════════════════════════════════════════════════════════════

describe('PerformanceReviewService · updateScores', () => {
  let service: PerformanceReviewService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 更新分数后 overallRating 重新计算', () => {
    const r = service.createReview(makeDefaultReview())
    // 初始 A: (5*0.3 + 4*0.3) / 0.6 = 0.9 => A
    expect(r.overallRating).toBe('A')

    const updated = service.updateScores(r.id, TENANT, [
      { score: 2 },
      { score: 2 },
    ])
    expect(updated.scores[0].score).toBe(2)
    expect(updated.scores[1].score).toBe(2)
    // (2/5*0.3 + 2/5*0.3) / 0.6 = 0.24/0.6 = 0.4 => < 0.6 => D
    expect(updated.overallRating).toBe('D')
  })

  it('正例: updateScores 同时更新 comments', () => {
    const r = service.createReview(makeDefaultReview())
    const updated = service.updateScores(r.id, TENANT, [{}, {}], '新的评语')
    expect(updated.comments).toBe('新的评语')
  })

  it('反例: 不存在的 review ID 抛异常', () => {
    expect(() => service.updateScores('nonexistent', TENANT, [{}])).toThrow('Performance review not found')
  })

  it('反例: 不同 tenant 抛异常', () => {
    const r = service.createReview(makeDefaultReview())
    expect(() => service.updateScores(r.id, 'tenant-other', [{}])).toThrow('not found')
  })

  it('边界: scores 数组长度不足时只更新对应索引', () => {
    const r = service.createReview(makeDefaultReview())
    const updated = service.updateScores(r.id, TENANT, [{ score: 1 }]) // 只更新第一个
    expect(updated.scores[0].score).toBe(1)
    expect(updated.scores[1].score).toBe(4) // 第二个不变
  })
})

// ═══════════════════════════════════════════════════════════════════
// updateReviewStatus
// ═══════════════════════════════════════════════════════════════════

describe('PerformanceReviewService · updateReviewStatus', () => {
  let service: PerformanceReviewService

  beforeEach(() => {
    service = createFreshService()
  })

  it('正例: 从 Draft 更新为 Reviewed', () => {
    const r = service.createReview(makeDefaultReview())
    const updated = service.updateReviewStatus(r.id, ReviewStatus.Reviewed, TENANT)
    expect(updated.status).toBe(ReviewStatus.Reviewed)
  })

  it('正例: 更新为 Acknowledged 时设置 ackDate', () => {
    const r = service.createReview(makeDefaultReview())
    const acked = service.updateReviewStatus(r.id, ReviewStatus.Acknowledged, TENANT)
    expect(acked.status).toBe(ReviewStatus.Acknowledged)
    expect(acked.ackDate).toBeDefined()
    expect(typeof acked.ackDate).toBe('string')
  })

  it('正例: 支持所有状态流转', () => {
    const r = service.createReview(makeDefaultReview())
    const statuses = [ReviewStatus.PendingReview, ReviewStatus.Reviewed, ReviewStatus.Acknowledged, ReviewStatus.Archived]
    let current = r
    for (const s of statuses) {
      current = service.updateReviewStatus(r.id, s, TENANT)
      expect(current.status).toBe(s)
    }
  })

  it('反例: 不存在的 review ID 抛异常', () => {
    expect(() => service.updateReviewStatus('nonexistent', ReviewStatus.Reviewed, TENANT)).toThrow('not found')
  })

  it('边界: 不同 tenant 抛异常', () => {
    const r = service.createReview(makeDefaultReview())
    expect(() => service.updateReviewStatus(r.id, ReviewStatus.Reviewed, 'tenant-other')).toThrow('not found')
  })
})
