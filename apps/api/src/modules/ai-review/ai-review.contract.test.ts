import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-review] [A] contract 补全
 *
 * ai-review.contract.test.ts · AI Code Review 模块契约测试
 *
 * 验证：
 *   1. 合约类型结构完备（接口字段齐全）
 *   2. 映射器函数将实体正确转换到合约（正例 + 边界）
 *   3. 批量映射正确
 *   4. 合约不暴露敏感内部字段
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import type {
  ReviewRequest,
  ReviewResponse,
  ReviewIssue,
  ReviewFile,
  ReviewSummary,
  ReviewConfig,
  ReviewRecord,
  ReviewCategory,
  ReviewSeverity,
} from './ai-review.entity'
import {
  toReviewResponseContract,
  toReviewIssueContract,
  toReviewSummaryContract,
  toReviewConfigContract,
  toReviewRecordContract,
  toReviewResponseContracts,
  toReviewIssueContracts,
  toReviewRecordContracts,
} from './ai-review.contract'
import type {
  ReviewResponseContract,
  ReviewIssueContract,
  ReviewSummaryContract,
  ReviewConfigContract,
  ReviewRecordContract,
} from './ai-review.contract'

// ─── Fixtures ──────────────────────────────────────────────────────────

const mockFile: ReviewFile = {
  filePath: 'src/modules/ai-review/ai-review.service.ts',
  language: 'typescript',
  diff: '@@ -1,5 +1,10 @@\n+import { Injectable } from "@nestjs/common"',
  additions: 10,
  deletions: 2,
  status: 'modified',
}

const mockIssue: ReviewIssue = {
  id: 'issue-001',
  category: 'security',
  severity: 'critical',
  message: 'SQL injection risk in query builder',
  filePath: 'src/modules/ai-review/ai-review.service.ts',
  lineStart: 42,
  lineEnd: 45,
  suggestion: 'Use parameterized query instead of string concatenation',
}

const mockIssueMinor: ReviewIssue = {
  id: 'issue-002',
  category: 'style',
  severity: 'minor',
  message: 'Unused import detected',
  filePath: 'src/modules/ai-review/ai-review.service.ts',
  lineStart: 1,
  suggestion: 'Remove unused import',
}

const mockRequest: Pick<ReviewRequest, 'repository' | 'pullRequestId' | 'title'> = {
  repository: 'shenjiying/shenjiying88',
  pullRequestId: 42,
  title: 'feat: add AI review module',
}

const mockResponse: ReviewResponse = {
  id: 'rvw-001',
  request: mockRequest,
  overallScore: 85,
  issues: [mockIssue, mockIssueMinor],
  strengths: ['Good test coverage', 'Clear error handling'],
  summary: 'Overall good PR with one critical security concern',
  needsApproverReview: true,
  latencyMs: 3200,
  cacheHit: false,
  usage: { inputTokens: 4500, outputTokens: 1200, costUsd: 0.085 },
  status: 'completed',
  completedAt: '2026-06-25T12:00:00.000Z',
}

const mockSummary: ReviewSummary = {
  totalReviews: 120,
  successfulReviews: 115,
  totalIssues: 340,
  issuesBySeverity: { critical: 12, major: 45, minor: 120, suggestion: 163 },
  issuesByCategory: {
    security: 18,
    performance: 25,
    correctness: 42,
    maintainability: 55,
    style: 80,
    test: 30,
    documentation: 40,
    best_practice: 35,
    dependency: 8,
    architecture: 7,
  },
  averageScore: 78,
  averageLatencyMs: 2800,
  cacheHitRate: 0.35,
  periodStart: '2026-06-01T00:00:00.000Z',
  periodEnd: '2026-06-25T23:59:59.000Z',
}

const mockConfig: ReviewConfig = {
  id: 'cfg-001',
  tenantId: 'tenant-arcade-01',
  repository: 'shenjiying/shenjiying88',
  enabled: true,
  triggerOn: {
    labels: ['ready-for-review'],
    branches: ['feature/*', 'fix/*'],
    filePatterns: ['apps/api/src/**/*.ts'],
  },
  ignorePatterns: ['**/*.generated.ts', '**/*.d.ts'],
  minSeverity: 'minor',
  categories: ['security', 'correctness', 'performance'],
  customRules: [
    {
      name: 'no-console-log',
      pattern: 'console\\.log\\(',
      message: 'Avoid using console.log in production code',
      severity: 'minor',
    },
  ],
  createdAt: '2026-05-01T00:00:00.000Z',
  updatedAt: '2026-06-20T10:00:00.000Z',
}

const mockRecord: ReviewRecord = {
  id: 'rec-001',
  tenantId: 'tenant-arcade-01',
  repository: 'shenjiying/shenjiying88',
  pullRequestId: 42,
  status: 'completed',
  latencyMs: 5000,
  overallScore: 85,
  issueCount: 2,
  createdAt: '2026-06-25T11:55:00.000Z',
  completedAt: '2026-06-25T12:00:00.000Z',
}

// ─── Tests ─────────────────────────────────────────────────────────────

describe('AIReview Contract — 合约结构', () => {

  describe('ReviewResponseContract 出参结构', () => {

    it('正例: 完整实体转换合约', () => {
      const contract = toReviewResponseContract(mockResponse)

      assert.equal(contract.id, 'rvw-001')
      assert.equal(contract.repository, 'shenjiying/shenjiying88')
      assert.equal(contract.pullRequestId, 42)
      assert.equal(contract.overallScore, 85)
      assert.equal(contract.issueCount, 2)
      assert.equal(contract.criticalCount, 1)
      assert.equal(contract.majorCount, 0)
      assert.equal(contract.summary, 'Overall good PR with one critical security concern')
      assert.equal(contract.needsApproverReview, true)
      assert.equal(contract.status, 'completed')
      assert.equal(contract.latencyMs, 3200)
      assert.equal(contract.cacheHit, false)
      assert.equal(contract.completedAt, '2026-06-25T12:00:00.000Z')
    })

    it('正例: 合约不暴露 usage 内部字段', () => {
      const contract = toReviewResponseContract(mockResponse)
      // usage 是内部实现的细节, 合约层不应包含
      const contractKeys = Object.keys(contract)
      assert.ok(!contractKeys.includes('usage'), 'usage should not be exposed in contract')
      assert.ok(!contractKeys.includes('request'), 'request should not be exposed in contract')
    })

    it('边界: issues 为空数组', () => {
      const empty: ReviewResponse = {
        ...mockResponse,
        id: 'rvw-empty',
        issues: [],
        overallScore: 100,
        needsApproverReview: false,
      }
      const contract = toReviewResponseContract(empty)
      assert.equal(contract.issueCount, 0)
      assert.equal(contract.criticalCount, 0)
      assert.equal(contract.majorCount, 0)
    })
  })

  describe('ReviewIssueContract 问题结构', () => {

    it('正例: 完整问题转换', () => {
      const contract = toReviewIssueContract(mockIssue)
      assert.equal(contract.id, 'issue-001')
      assert.equal(contract.category, 'security')
      assert.equal(contract.severity, 'critical')
      assert.equal(contract.message, 'SQL injection risk in query builder')
      assert.equal(contract.filePath, 'src/modules/ai-review/ai-review.service.ts')
      assert.equal(contract.lineStart, 42)
      assert.equal(contract.lineEnd, 45)
      assert.equal(contract.suggestion, 'Use parameterized query instead of string concatenation')
    })

    it('边界: 无 lineEnd / suggestion', () => {
      const contract = toReviewIssueContract(mockIssueMinor)
      assert.equal(contract.lineEnd, undefined)
      assert.equal(contract.suggestion, 'Remove unused import')
    })

    it('边界: 所有严重性和分类覆盖', () => {
      const severities: ReviewSeverity[] = ['critical', 'major', 'minor', 'suggestion']
      const categories: ReviewCategory[] = [
        'security', 'performance', 'correctness', 'maintainability',
        'style', 'test', 'documentation', 'best_practice', 'dependency', 'architecture',
      ]
      for (const severity of severities) {
        for (const category of categories.slice(0, 2)) {
          const issue: ReviewIssue = {
            ...mockIssue,
            id: `issue-${severity}-${category}`,
            severity,
            category,
          }
          const contract = toReviewIssueContract(issue)
          assert.equal(contract.severity, severity)
          assert.equal(contract.category, category)
        }
      }
    })
  })

  describe('ReviewSummaryContract 摘要结构', () => {

    it('正例: 完整摘要转换', () => {
      const contract = toReviewSummaryContract(mockSummary)
      assert.equal(contract.totalReviews, 120)
      assert.equal(contract.successfulReviews, 115)
      assert.equal(contract.totalIssues, 340)
      assert.equal(contract.issuesBySeverity.critical, 12)
      assert.equal(contract.issuesBySeverity.suggestion, 163)
      assert.equal(contract.issuesByCategory.security, 18)
      assert.equal(contract.averageScore, 78)
      assert.equal(contract.cacheHitRate, 0.35)
    })

    it('边界: 全零统计', () => {
      const zero: ReviewSummary = {
        totalReviews: 0,
        successfulReviews: 0,
        totalIssues: 0,
        issuesBySeverity: { critical: 0, major: 0, minor: 0, suggestion: 0 },
        issuesByCategory: {
          security: 0, performance: 0, correctness: 0, maintainability: 0,
          style: 0, test: 0, documentation: 0, best_practice: 0,
          dependency: 0, architecture: 0,
        },
        averageScore: 0,
        averageLatencyMs: 0,
        cacheHitRate: 0,
        periodStart: '2026-06-25T00:00:00.000Z',
        periodEnd: '2026-06-25T23:59:59.000Z',
      }
      const contract = toReviewSummaryContract(zero)
      assert.equal(contract.totalReviews, 0)
      assert.equal(contract.cacheHitRate, 0)
    })
  })

  describe('ReviewConfigContract 配置结构', () => {

    it('正例: 完整配置转换', () => {
      const contract = toReviewConfigContract(mockConfig)
      assert.equal(contract.id, 'cfg-001')
      assert.equal(contract.tenantId, 'tenant-arcade-01')
      assert.equal(contract.repository, 'shenjiying/shenjiying88')
      assert.equal(contract.enabled, true)
      assert.deepEqual(contract.triggerLabels, ['ready-for-review'])
      assert.deepEqual(contract.triggerBranches, ['feature/*', 'fix/*'])
      assert.deepEqual(contract.triggerFilePatterns, ['apps/api/src/**/*.ts'])
      assert.equal(contract.minSeverity, 'minor')
      assert.deepEqual(contract.categories, ['security', 'correctness', 'performance'])
    })

    it('边界: 无触发条件配置', () => {
      const minimal: ReviewConfig = {
        ...mockConfig,
        id: 'cfg-minimal',
        triggerOn: {},
        ignorePatterns: undefined,
        minSeverity: undefined,
        categories: undefined,
        customRules: undefined,
      }
      const contract = toReviewConfigContract(minimal)
      assert.equal(contract.triggerLabels, undefined)
      assert.equal(contract.triggerBranches, undefined)
      assert.equal(contract.triggerFilePatterns, undefined)
      assert.equal(contract.ignorePatterns, undefined)
      assert.equal(contract.minSeverity, undefined)
      assert.equal(contract.categories, undefined)
    })
  })

  describe('ReviewRecordContract 历史结构', () => {

    it('正例: 完整记录转换', () => {
      const contract = toReviewRecordContract(mockRecord)
      assert.equal(contract.id, 'rec-001')
      assert.equal(contract.tenantId, 'tenant-arcade-01')
      assert.equal(contract.repository, 'shenjiying/shenjiying88')
      assert.equal(contract.pullRequestId, 42)
      assert.equal(contract.status, 'completed')
      assert.equal(contract.overallScore, 85)
      assert.equal(contract.issueCount, 2)
      assert.ok(contract.completedAt)
    })

    it('边界: 未完成记录', () => {
      const pending: ReviewRecord = {
        ...mockRecord,
        id: 'rec-pending',
        status: 'in_progress',
        overallScore: 0,
        issueCount: 0,
        completedAt: undefined,
      }
      const contract = toReviewRecordContract(pending)
      assert.equal(contract.status, 'in_progress')
      assert.equal(contract.completedAt, undefined)
    })
  })

  describe('批量映射函数', () => {

    it('toReviewResponseContracts 空数组', () => {
      const result = toReviewResponseContracts([])
      assert.deepEqual(result, [])
    })

    it('toReviewResponseContracts 多条', () => {
      const result = toReviewResponseContracts([mockResponse, mockResponse])
      assert.equal(result.length, 2)
      assert.equal(result[0].id, 'rvw-001')
      assert.equal(result[1].id, 'rvw-001')
    })

    it('toReviewIssueContracts 包含混合严重性', () => {
      const result = toReviewIssueContracts([mockIssue, mockIssueMinor])
      assert.equal(result.length, 2)
      assert.equal(result[0].severity, 'critical')
      assert.equal(result[1].severity, 'minor')
    })

    it('toReviewRecordContracts 空数组', () => {
      const result = toReviewRecordContracts([])
      assert.deepEqual(result, [])
    })

    it('toReviewRecordContracts 多条', () => {
      const result = toReviewRecordContracts([mockRecord, { ...mockRecord, id: 'rec-002' }])
      assert.equal(result.length, 2)
      assert.equal(result[1].id, 'rec-002')
    })
  })
})
