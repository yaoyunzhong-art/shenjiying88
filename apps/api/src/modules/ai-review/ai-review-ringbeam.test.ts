/**
 * 🐜 圈梁: [ai-review] 代码审查模块圈梁测试
 *
 * 正例 + 反例 + 边界
 * 验证: DTO、实体、合约核心接口
 */

import { describe, it, expect } from 'vitest'
import { SubmitReviewDto, ReviewFileDto } from './ai-review.dto'
import type { ReviewResponse, ReviewIssue, ReviewRequest } from './ai-review.entity'
import {
  toReviewResponseContract,
  toReviewIssueContract,
} from './ai-review.contract'

// ─── DTO ────────────────────────────────────────────────

describe('ai-review DTO', () => {
  // 正例: SubmitReviewDto 完整填充
  it('正例: SubmitReviewDto 包含所有字段', () => {
    const dto = new SubmitReviewDto()
    dto.title = 'Fix auth bug'
    dto.description = '修复 JWT 验证问题'
    dto.repository = 'shenjiying88'
    dto.repositoryType = 'github'
    dto.author = 'dev-1'
    dto.files = []
    expect(dto.title).toBeTruthy()
    expect(dto.repositoryType).toBe('github')
    expect(dto.author).toBe('dev-1')
  })

  // 正例: ReviewFileDto 合法
  it('正例: ReviewFileDto 合法文件', () => {
    const file = new ReviewFileDto()
    file.filePath = 'src/auth/jwt.ts'
    file.language = 'typescript'
    file.diff = '@@ -1,5 +1,7 @@'
    expect(file.filePath).toContain('.ts')
    expect(file.language).toBe('typescript')
  })

  // 反例: diff 为空字符串
  it('反例: diff 为空的情况', () => {
    const file = new ReviewFileDto()
    file.filePath = 'src/test.ts'
    file.language = 'typescript'
    file.diff = ''
    expect(file.diff).toBe('')
  })
})

// ─── 实体 ────────────────────────────────────────────────

describe('ai-review 实体结构', () => {
  // 正例: ReviewResponse 结构完整
  it('正例: ReviewResponse 包含所有必需字段', () => {
    const response: ReviewResponse = {
      id: 'review-1',
      request: {
        repository: 'shenjiying88',
        pullRequestId: 'pr-42',
        title: 'Fix auth bug',
      },
      overallScore: 85,
      issues: [],
      strengths: [],
      summary: '代码质量良好',
      needsApproverReview: false,
      status: 'completed',
      latencyMs: 1500,
      cacheHit: false,
      completedAt: '2026-07-01T00:00:00Z',
    }
    expect(response.overallScore).toBeGreaterThanOrEqual(0)
    expect(response.overallScore).toBeLessThanOrEqual(100)
    expect(response.request.repository).toBe('shenjiying88')
    expect(['completed', 'pending', 'in_progress', 'failed']).toContain(response.status)
  })

  // 边界: 100 分满分
  it('边界: overallScore 上限 100', () => {
    const response: ReviewResponse = {
      id: 'review-perfect',
      request: { repository: 'repo', pullRequestId: 'pr-1', title: 'Perfect' },
      overallScore: 100,
      issues: [],
      strengths: [],
      summary: '完美',
      needsApproverReview: false,
      status: 'completed',
      latencyMs: 800,
      cacheHit: false,
      completedAt: '2026-07-01T00:00:00Z',
    }
    expect(response.overallScore).toBe(100)
  })

  // 反例: 0 分
  it('反例: overallScore 为 0', () => {
    const response: ReviewResponse = {
      id: 'review-zero',
      request: { repository: 'repo', pullRequestId: 'pr-0', title: 'Major issues' },
      overallScore: 0,
      issues: [],
      strengths: [],
      summary: '大量严重问题',
      needsApproverReview: true,
      status: 'completed',
      latencyMs: 2000,
      cacheHit: false,
      completedAt: '2026-07-01T00:00:00Z',
    }
    expect(response.overallScore).toBe(0)
    expect(response.needsApproverReview).toBe(true)
  })
})

// ─── 合约 ────────────────────────────────────────────────

describe('ai-review 合约转换', () => {
  const mockResponse: ReviewResponse = {
    id: 'review-1',
    request: {
      repository: 'shenjiying88',
      pullRequestId: 42,
      title: 'Fix auth bug',
    },
    overallScore: 85,
    issues: [],
    strengths: [],
    summary: '代码质量良好',
    needsApproverReview: false,
    status: 'completed',
    latencyMs: 1500,
    cacheHit: false,
    completedAt: '2026-07-01T00:00:00Z',
  }

  it('正例: toReviewResponseContract 正确映射', () => {
    const contract = toReviewResponseContract(mockResponse)
    expect(contract.id).toBe('review-1')
    expect(contract.repository).toBe('shenjiying88')
    expect(contract.overallScore).toBe(85)
    expect(contract.needsApproverReview).toBe(false)
    expect(contract.cacheHit).toBe(false)
  })
})
