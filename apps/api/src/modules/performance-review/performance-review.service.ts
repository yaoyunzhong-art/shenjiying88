import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import {
  ReviewPeriod,
  ReviewStatus,
  type OverallRating,
  type PerformanceReview,
  type ReviewScore,
} from './performance-review.entity'

// ── In-memory store ──

const reviewStore = new Map<string, PerformanceReview>()

function generateReviewNo(): string {
  const prefix = 'PR'
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, '')
  const seq = String(Math.floor(Math.random() * 9000) + 1000)
  return `${prefix}${date}${seq}`
}

function calculateOverallRating(scores: ReviewScore[]): OverallRating {
  if (scores.length === 0) return 'C'

  const totalWeight = scores.reduce((sum, s) => sum + s.weight, 0)
  if (totalWeight === 0) return 'C'

  const weightedSum = scores.reduce((sum, s) => sum + (s.score / 5) * s.weight, 0)
  const average = weightedSum / totalWeight

  if (average >= 0.9) return 'A'
  if (average >= 0.75) return 'B'
  if (average >= 0.6) return 'C'
  return 'D'
}

@Injectable()
export class PerformanceReviewService {
  // ═══════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════

  createReview(input: {
    tenantId: string
    employeeId: string
    employeeName: string
    reviewer: string
    period: ReviewPeriod
    scores: Array<{ dimension: string; score: number; weight: number; comment: string }>
    comments: string
  }): PerformanceReview {
    const now = new Date().toISOString()
    const scoreEntities: ReviewScore[] = input.scores.map((s) => ({
      id: `score-${randomUUID()}`,
      dimension: s.dimension,
      score: s.score,
      weight: s.weight,
      comment: s.comment,
    }))

    const review: PerformanceReview = {
      id: `review-${randomUUID()}`,
      reviewNo: generateReviewNo(),
      employeeId: input.employeeId,
      employeeName: input.employeeName,
      reviewer: input.reviewer,
      period: input.period,
      status: ReviewStatus.Draft,
      scores: scoreEntities,
      overallRating: calculateOverallRating(scoreEntities),
      comments: input.comments,
      reviewDate: now,
      tenantId: input.tenantId,
      createdAt: now,
    }
    reviewStore.set(review.id, review)
    return review
  }

  getReview(reviewId: string, tenantId: string): PerformanceReview | undefined {
    const r = reviewStore.get(reviewId)
    if (!r || r.tenantId !== tenantId) return undefined
    return r
  }

  listReviews(
    tenantId: string,
    filters?: {
      period?: ReviewPeriod
      status?: ReviewStatus
      employeeId?: string
    },
  ): PerformanceReview[] {
    const all = Array.from(reviewStore.values())
    return all.filter((r) => {
      if (r.tenantId !== tenantId) return false
      if (filters?.period && r.period !== filters.period) return false
      if (filters?.status && r.status !== filters.status) return false
      if (filters?.employeeId && r.employeeId !== filters.employeeId) return false
      return true
    })
  }

  updateScores(
    reviewId: string,
    tenantId: string,
    scores: Array<{ dimension?: string; score?: number; weight?: number; comment?: string }>,
    comments?: string,
  ): PerformanceReview {
    const review = this.getReview(reviewId, tenantId)
    if (!review) {
      throw new Error(`Performance review not found: ${reviewId}`)
    }

    const updatedScores: ReviewScore[] = review.scores.map((s, i) => {
      const update = scores[i]
      if (!update) return s
      return {
        ...s,
        dimension: update.dimension ?? s.dimension,
        score: update.score ?? s.score,
        weight: update.weight ?? s.weight,
        comment: update.comment ?? s.comment,
      }
    })

    const updated: PerformanceReview = {
      ...review,
      scores: updatedScores,
      overallRating: calculateOverallRating(updatedScores),
      comments: comments ?? review.comments,
    }
    reviewStore.set(reviewId, updated)
    return updated
  }

  updateReviewStatus(
    reviewId: string,
    status: ReviewStatus,
    tenantId: string,
  ): PerformanceReview {
    const review = this.getReview(reviewId, tenantId)
    if (!review) {
      throw new Error(`Performance review not found: ${reviewId}`)
    }
    const now = new Date().toISOString()
    const updated: PerformanceReview = {
      ...review,
      status,
      ackDate: status === ReviewStatus.Acknowledged ? now : review.ackDate,
    }
    reviewStore.set(reviewId, updated)
    return updated
  }

  // ═══════════════════════════════════════════════════════════════════
  // Score Calculation - exposed for testing
  // ═══════════════════════════════════════════════════════════════════

  static calculateOverallRating(scores: ReviewScore[]): OverallRating {
    return calculateOverallRating(scores)
  }

  // ═══════════════════════════════════════════════════════════════════
  // Mock Data
  // ═══════════════════════════════════════════════════════════════════

  seedMockData(tenantId: string): void {
    const mockReviews: Array<{
      employeeId: string
      employeeName: string
      reviewer: string
      period: ReviewPeriod
      status: ReviewStatus
      scores: Array<{ dimension: string; score: number; weight: number; comment: string }>
      comments: string
    }> = [
      {
        employeeId: 'EMP-001', employeeName: '张三', reviewer: '李经理',
        period: ReviewPeriod.Quarterly, status: ReviewStatus.Reviewed,
        scores: [
          { dimension: '工作质量', score: 5, weight: 0.3, comment: '工作质量极高，零缺陷' },
          { dimension: '工作效率', score: 4, weight: 0.25, comment: '效率良好，能按时完成任务' },
          { dimension: '团队协作', score: 5, weight: 0.2, comment: '团队核心成员，积极帮助他人' },
          { dimension: '创新能力', score: 4, weight: 0.15, comment: '提出多个有效改进建议' },
          { dimension: '出勤率', score: 5, weight: 0.1, comment: '全勤' },
        ],
        comments: '张三本季度表现优异，各项指标均达到或超过预期，建议晋升。',
      },
      {
        employeeId: 'EMP-002', employeeName: '李四', reviewer: '李经理',
        period: ReviewPeriod.Quarterly, status: ReviewStatus.Acknowledged,
        scores: [
          { dimension: '工作质量', score: 4, weight: 0.3, comment: '质量符合要求' },
          { dimension: '工作效率', score: 3, weight: 0.25, comment: '效率中等，偶尔需要加班' },
          { dimension: '团队协作', score: 4, weight: 0.2, comment: '协作良好' },
          { dimension: '创新能力', score: 3, weight: 0.15, comment: '基本保持' },
          { dimension: '出勤率', score: 4, weight: 0.1, comment: '请假2天' },
        ],
        comments: '李四整体表现良好，工作效率方面需要提升。',
      },
      {
        employeeId: 'EMP-003', employeeName: '王五', reviewer: '李经理',
        period: ReviewPeriod.Quarterly, status: ReviewStatus.Draft,
        scores: [
          { dimension: '工作质量', score: 3, weight: 0.3, comment: '偶尔出现错误' },
          { dimension: '工作效率', score: 3, weight: 0.25, comment: '效率一般' },
          { dimension: '团队协作', score: 2, weight: 0.2, comment: '需要改善沟通方式' },
          { dimension: '创新能力', score: 2, weight: 0.15, comment: '较少提出新想法' },
          { dimension: '出勤率', score: 3, weight: 0.1, comment: '请假较多' },
        ],
        comments: '王五本季度表现需要改善，建议制定改进计划。',
      },
      {
        employeeId: 'EMP-004', employeeName: '赵六', reviewer: '李经理',
        period: ReviewPeriod.Monthly, status: ReviewStatus.Reviewed,
        scores: [
          { dimension: '工作质量', score: 5, weight: 0.3, comment: '表现突出' },
          { dimension: '工作效率', score: 5, weight: 0.25, comment: '工作量超额完成' },
          { dimension: '团队协作', score: 4, weight: 0.2, comment: '协作良好' },
          { dimension: '创新能力', score: 4, weight: 0.15, comment: '有创新意识' },
          { dimension: '出勤率', score: 5, weight: 0.1, comment: '全勤' },
        ],
        comments: '赵六本月表现优秀，客户反馈非常好。',
      },
      {
        employeeId: 'EMP-005', employeeName: '孙七', reviewer: '人事部',
        period: ReviewPeriod.Monthly, status: ReviewStatus.Archived,
        scores: [
          { dimension: '工作质量', score: 4, weight: 0.3, comment: '良好' },
          { dimension: '工作效率', score: 4, weight: 0.25, comment: '良好' },
          { dimension: '团队协作', score: 5, weight: 0.2, comment: '很好' },
          { dimension: '创新能力', score: 3, weight: 0.15, comment: '一般' },
          { dimension: '出勤率', score: 4, weight: 0.1, comment: '产假' },
        ],
        comments: '孙七产假前表现稳定。',
      },
      {
        employeeId: 'EMP-006', employeeName: '周八', reviewer: '李经理',
        period: ReviewPeriod.HalfYearly, status: ReviewStatus.PendingReview,
        scores: [
          { dimension: '工作质量', score: 4, weight: 0.3, comment: '良好' },
          { dimension: '工作效率', score: 4, weight: 0.25, comment: '良好' },
          { dimension: '团队协作', score: 4, weight: 0.2, comment: '良好' },
          { dimension: '管理能力', score: 4, weight: 0.15, comment: '值班经理表现合格' },
          { dimension: '出勤率', score: 5, weight: 0.1, comment: '全勤' },
        ],
        comments: '周八作为值班经理表现良好，团队管理有序。',
      },
      {
        employeeId: 'EMP-007', employeeName: '吴九', reviewer: '李经理',
        period: ReviewPeriod.HalfYearly, status: ReviewStatus.Reviewed,
        scores: [
          { dimension: '工作质量', score: 3, weight: 0.3, comment: '基本合格' },
          { dimension: '工作效率', score: 2, weight: 0.25, comment: '需要提速' },
          { dimension: '团队协作', score: 3, weight: 0.2, comment: '一般' },
          { dimension: '创新能力', score: 2, weight: 0.15, comment: '较少' },
          { dimension: '出勤率', score: 2, weight: 0.1, comment: '请假较多' },
        ],
        comments: '吴九需要全面提升工作表现，建议加强培训和辅导。',
      },
      {
        employeeId: 'EMP-008', employeeName: '郑十', reviewer: '人事部',
        period: ReviewPeriod.Yearly, status: ReviewStatus.Archived,
        scores: [
          { dimension: '工作质量', score: 5, weight: 0.3, comment: '优秀' },
          { dimension: '工作效率', score: 5, weight: 0.25, comment: '优秀' },
          { dimension: '团队协作', score: 4, weight: 0.2, comment: '良好' },
          { dimension: '创新能力', score: 5, weight: 0.15, comment: '多次创新' },
          { dimension: '出勤率', score: 5, weight: 0.1, comment: '全勤' },
        ],
        comments: '郑十年终评定为优秀员工，建议加薪留任。',
      },
      {
        employeeId: 'EMP-009', employeeName: '陈一', reviewer: '人事部',
        period: ReviewPeriod.Yearly, status: ReviewStatus.Acknowledged,
        scores: [
          { dimension: '工作质量', score: 4, weight: 0.3, comment: '良好' },
          { dimension: '工作效率', score: 3, weight: 0.25, comment: '中等' },
          { dimension: '团队协作', score: 4, weight: 0.2, comment: '良好' },
          { dimension: '创新能力', score: 3, weight: 0.15, comment: '一般' },
          { dimension: '出勤率', score: 4, weight: 0.1, comment: '良好' },
        ],
        comments: '陈一全年表现中上，建议在新年度设定更高目标。',
      },
      {
        employeeId: 'EMP-002', employeeName: '李四', reviewer: '李经理',
        period: ReviewPeriod.Monthly, status: ReviewStatus.Draft,
        scores: [
          { dimension: '工作质量', score: 3, weight: 0.3, comment: '本月有改善' },
          { dimension: '工作效率', score: 3, weight: 0.25, comment: '仍在提升中' },
          { dimension: '团队协作', score: 4, weight: 0.2, comment: '协作良好' },
          { dimension: '创新能力', score: 3, weight: 0.15, comment: '一般' },
          { dimension: '出勤率', score: 5, weight: 0.1, comment: '全勤' },
        ],
        comments: '李四本月工作表现有所改善，继续努力。',
      },
      {
        employeeId: 'EMP-010', employeeName: '黄二', reviewer: '人事部',
        period: ReviewPeriod.Quarterly, status: ReviewStatus.Reviewed,
        scores: [
          { dimension: '工作质量', score: 5, weight: 0.3, comment: '优秀' },
          { dimension: '工作效率', score: 5, weight: 0.25, comment: '出色' },
          { dimension: '团队协作', score: 5, weight: 0.2, comment: '团队榜样' },
          { dimension: '创新能力', score: 4, weight: 0.15, comment: '良好' },
          { dimension: '出勤率', score: 5, weight: 0.1, comment: '全勤' },
        ],
        comments: '黄二本季度被评为门店之星，各方面表现突出。',
      },
      {
        employeeId: 'EMP-003', employeeName: '王五', reviewer: '李经理',
        period: ReviewPeriod.Monthly, status: ReviewStatus.PendingReview,
        scores: [
          { dimension: '工作质量', score: 3, weight: 0.3, comment: '基本合格' },
          { dimension: '工作效率', score: 3, weight: 0.25, comment: '一般' },
          { dimension: '团队协作', score: 3, weight: 0.2, comment: '有所改善' },
          { dimension: '创新能力', score: 2, weight: 0.15, comment: '仍然不足' },
          { dimension: '出勤率', score: 4, weight: 0.1, comment: '良好' },
        ],
        comments: '王五本月有改善迹象，但仍需继续努力。',
      },
      {
        employeeId: 'EMP-011', employeeName: '林三', reviewer: '李经理',
        period: ReviewPeriod.Quarterly, status: ReviewStatus.Reviewed,
        scores: [
          { dimension: '工作质量', score: 4, weight: 0.3, comment: '良好' },
          { dimension: '工作效率', score: 4, weight: 0.25, comment: '良好' },
          { dimension: '团队协作', score: 4, weight: 0.2, comment: '良好' },
          { dimension: '创新能力', score: 3, weight: 0.15, comment: '一般' },
          { dimension: '出勤率', score: 5, weight: 0.1, comment: '全勤' },
        ],
        comments: '林三本季度表现稳定。',
      },
      {
        employeeId: 'EMP-012', employeeName: '何四', reviewer: '李经理',
        period: ReviewPeriod.HalfYearly, status: ReviewStatus.Draft,
        scores: [
          { dimension: '工作质量', score: 4, weight: 0.3, comment: '良好' },
          { dimension: '工作效率', score: 4, weight: 0.25, comment: '良好' },
          { dimension: '团队协作', score: 5, weight: 0.2, comment: '优秀' },
          { dimension: '创新能力', score: 4, weight: 0.15, comment: '良好' },
          { dimension: '出勤率', score: 5, weight: 0.1, comment: '全勤' },
        ],
        comments: '何四上半年表现优秀，建议列入晋升候选人。',
      },
      {
        employeeId: 'EMP-001', employeeName: '张三', reviewer: '人事部',
        period: ReviewPeriod.Yearly, status: ReviewStatus.Archived,
        scores: [
          { dimension: '工作质量', score: 5, weight: 0.3, comment: '全年优异' },
          { dimension: '工作效率', score: 5, weight: 0.25, comment: '全年超额完成' },
          { dimension: '团队协作', score: 5, weight: 0.2, comment: '团队领袖' },
          { dimension: '创新能力', score: 5, weight: 0.15, comment: '年度最佳创新奖' },
          { dimension: '出勤率', score: 5, weight: 0.1, comment: '全勤' },
        ],
        comments: '张三年度评定为S级，当之无愧的年度最佳员工。',
      },
      {
        employeeId: 'EMP-005', employeeName: '孙七', reviewer: '人事部',
        period: ReviewPeriod.Quarterly, status: ReviewStatus.Draft,
        scores: [
          { dimension: '工作质量', score: 4, weight: 0.3, comment: '复产良好' },
          { dimension: '工作效率', score: 4, weight: 0.25, comment: '恢复良好' },
          { dimension: '团队协作', score: 4, weight: 0.2, comment: '良好' },
          { dimension: '创新能力', score: 3, weight: 0.15, comment: '一般' },
          { dimension: '出勤率', score: 5, weight: 0.1, comment: '良好' },
        ],
        comments: '孙七产假复工后表现良好。',
      },
      {
        employeeId: 'EMP-004', employeeName: '赵六', reviewer: '李经理',
        period: ReviewPeriod.HalfYearly, status: ReviewStatus.Reviewed,
        scores: [
          { dimension: '工作质量', score: 5, weight: 0.3, comment: '优秀' },
          { dimension: '工作效率', score: 4, weight: 0.25, comment: '良好' },
          { dimension: '团队协作', score: 5, weight: 0.2, comment: '优秀' },
          { dimension: '创新能力', score: 4, weight: 0.15, comment: '持续创新' },
          { dimension: '出勤率', score: 5, weight: 0.1, comment: '全勤' },
        ],
        comments: '赵六上半年表现优秀，客户满意度高。',
      },
      {
        employeeId: 'EMP-013', employeeName: '刘五', reviewer: '人事部',
        period: ReviewPeriod.Quarterly, status: ReviewStatus.PendingReview,
        scores: [
          { dimension: '工作质量', score: 3, weight: 0.3, comment: '基本合格' },
          { dimension: '工作效率', score: 3, weight: 0.25, comment: '一般' },
          { dimension: '团队协作', score: 3, weight: 0.2, comment: '一般' },
          { dimension: '创新能力', score: 2, weight: 0.15, comment: '不足' },
          { dimension: '出勤率', score: 2, weight: 0.1, comment: '多次迟到' },
        ],
        comments: '刘五需要引起重视，建议安排绩效改进谈话。',
      },
      {
        employeeId: 'EMP-006', employeeName: '周八', reviewer: '人事部',
        period: ReviewPeriod.Yearly, status: ReviewStatus.Archived,
        scores: [
          { dimension: '工作质量', score: 4, weight: 0.3, comment: '良好' },
          { dimension: '工作效率', score: 4, weight: 0.25, comment: '良好' },
          { dimension: '团队协作', score: 5, weight: 0.2, comment: '优秀' },
          { dimension: '管理能力', score: 4, weight: 0.15, comment: '管理有序' },
          { dimension: '出勤率', score: 5, weight: 0.1, comment: '全勤' },
        ],
        comments: '周八年终评定为A级，优秀管理人员。',
      },
    ]

    for (const m of mockReviews) {
      this.createReview({
        tenantId,
        employeeId: m.employeeId,
        employeeName: m.employeeName,
        reviewer: m.reviewer,
        period: m.period,
        scores: m.scores,
        comments: m.comments,
      })

      const reviewId = Array.from(reviewStore.values()).find(
        (r) => r.employeeId === m.employeeId && r.period === m.period && r.tenantId === tenantId,
      )!.id

      const review = reviewStore.get(reviewId)!
      review.status = m.status

      if (m.status === ReviewStatus.Acknowledged) {
        review.ackDate = new Date().toISOString()
      }

      reviewStore.set(reviewId, review)
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // Test Helpers
  // ═══════════════════════════════════════════════════════════════════

  resetReviewStoresForTests(): void {
    reviewStore.clear()
  }
}
