import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-review] [D] controller 测试 (已实现版本)
 * AIReviewController 单元测试 (node:test)
 * 使用真实 Controller + Mock Service 验证行为
 */
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AIReviewController } from './ai-review.controller'
import { AIReviewService } from './ai-review.service'

// ─── Mock Service ──────────────────────────────────────────

function makeMockService(): AIReviewService {
  return {
    reviewPRDiff: async () => ({
      output: { overallScore: 85, issues: [], strengths: ['Clean diff'], summary: 'Good', needsApproverReview: false },
      raw: { content: '{}' },
      totalLatencyMs: 1200,
      cacheHit: false,
    }),
    reviewTestCoverage: async () => { throw new Error('not implemented') },
    reviewPerformance: async () => { throw new Error('not implemented') },
    draftRFC: async () => { throw new Error('not implemented') },
    parseReviewOutput: (_c: string) => ({ overallScore: 0, issues: [], strengths: [], summary: '', needsApproverReview: false }),
    formatFilesContext: (_f: any[]) => '',
    healthcheck: async () => ({ ok: true, defaultProvider: 'claude', budgetUtilization: 0.45, cacheEnabled: true }),
  } as unknown as AIReviewService
}

function createController(): AIReviewController {
  const ctrl = new AIReviewController(makeMockService())
  ctrl.reset()
  return ctrl
}

// ─── POST /ai-review/reviews ────────────────────────────────

void describe('POST /ai-review/reviews', () => {
  const validBody = {
    repositoryType: 'github',
    repository: 'shenjiying/shenjiying88',
    pullRequestId: 42,
    title: 'Fix login validation',
    description: 'Fixed token expiry check',
    files: [{
      filePath: 'src/auth/login.ts',
      language: 'typescript',
      diff: '@@ -10,5 +10,8 @@\n+console.log("test")',
      additions: 5,
      deletions: 2,
      status: 'modified',
    }],
    author: 'dev-user',
  }

  void it('提交评审请求返回 reviewId', async () => {
    const controller = createController()
    const result = await controller.submitReview('tenant-A', validBody as any)
    assert.equal(typeof result.reviewId, 'string')
    assert.ok(result.reviewId.startsWith('review-'))
    assert.equal(result.status, 'completed')
  })

  void it('提交后可通过 getReviewResult 查到结果', async () => {
    const controller = createController()
    const { reviewId } = await controller.submitReview('tenant-A', validBody as any)
    const review = await controller.getReviewResult(reviewId)
    assert.equal(review.id, reviewId)
    assert.equal(review.overallScore, 85)
    assert.equal(review.status, 'completed')
  })
})

// ─── GET /ai-review/reviews/:id ─────────────────────────────

void describe('GET /ai-review/reviews/:id', () => {
  void it('获取已存在的评审结果', async () => {
    const controller = createController()
    const { reviewId } = await controller.submitReview('tenant-A', {
      repositoryType: 'github', repository: 'org/repo',
      pullRequestId: 1, title: 'Test', description: 'Desc',
      files: [{ filePath: 'a.ts', language: 'typescript', diff: '', additions: 1, deletions: 0, status: 'modified' }],
      author: 'dev',
    })
    const result = await controller.getReviewResult(reviewId)
    assert.ok(result.overallScore > 0)
    assert.equal(result.id, reviewId)
  })

  void it('不存在的 reviewId 抛出错误', async () => {
    const controller = createController()
    await assert.rejects(
      () => controller.getReviewResult('nonexistent'),
      /Review not found/,
    )
  })
})

// ─── GET /ai-review/history ─────────────────────────────────

void describe('GET /ai-review/history', () => {
  void it('空历史返回空数组', async () => {
    const controller = createController()
    const result = await controller.getReviewHistory('tenant-A', {})
    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  void it('提交后历史包含记录', async () => {
    const controller = createController()
    await controller.submitReview('tenant-A', {
      repositoryType: 'github', repository: 'org/repo',
      pullRequestId: 1, title: 'T', description: 'D',
      files: [{ filePath: 'a.ts', language: 'typescript', diff: '', additions: 1, deletions: 0, status: 'modified' }],
      author: 'dev',
    })
    const history = await controller.getReviewHistory('tenant-A', {})
    assert.equal(history.length, 1)
    assert.equal(history[0].repository, 'org/repo')
  })
})

// ─── GET /ai-review/summary ─────────────────────────────────

void describe('GET /ai-review/summary', () => {
  void it('无记录时返回全零摘要', async () => {
    const controller = createController()
    const result = await controller.getReviewSummary({
      tenantId: 'tenant-A',
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
    })
    assert.equal(result.totalReviews, 0)
    assert.equal(result.averageScore, 0)
  })

  void it('有记录时正确汇总', async () => {
    const controller = createController()
    await controller.submitReview('tenant-A', {
      repositoryType: 'github', repository: 'org/repo',
      pullRequestId: 1, title: 'T', description: 'D',
      files: [{ filePath: 'a.ts', language: 'typescript', diff: '', additions: 1, deletions: 0, status: 'modified' }],
      author: 'dev',
    })
    const result = await controller.getReviewSummary({
      tenantId: 'tenant-A',
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
    })
    assert.equal(result.totalReviews, 1)
    assert.equal(result.successfulReviews, 1)
    assert.equal(result.averageScore, 85)
  })
})

// ─── POST /ai-review/configs ───────────────────────────────

void describe('POST /ai-review/configs', () => {
  void it('创建配置成功', async () => {
    const controller = createController()
    const config = await controller.createReviewConfig({
      tenantId: 'tenant-A',
      repository: 'org/repo',
      enabled: true,
    })
    assert.ok(config.id.startsWith('config-'))
    assert.equal(config.enabled, true)
  })

  void it('重复创建抛出错误', async () => {
    const controller = createController()
    await controller.createReviewConfig({ tenantId: 'tenant-A', repository: 'org/repo', enabled: true })
    await assert.rejects(
      () => controller.createReviewConfig({ tenantId: 'tenant-A', repository: 'org/repo', enabled: false }),
      /already exists/,
    )
  })
})

// ─── PUT /ai-review/configs/:id ─────────────────────────────

void describe('PUT /ai-review/configs/:id', () => {
  void it('更新配置成功', async () => {
    const controller = createController()
    const config = await controller.createReviewConfig({ tenantId: 'tenant-A', repository: 'org/repo', enabled: true })
    const updated = await controller.updateReviewConfig(config.id, { enabled: false })
    assert.equal(updated.enabled, false)
    assert.equal(updated.id, config.id)
  })

  void it('不存在的配置抛出错误', async () => {
    const controller = createController()
    await assert.rejects(
      () => controller.updateReviewConfig('nonexistent', { enabled: false }),
      /not found/,
    )
  })
})

// ─── GET /ai-review/configs/:id ─────────────────────────────

void describe('GET /ai-review/configs/:id', () => {
  void it('获取已存在的配置', async () => {
    const controller = createController()
    const config = await controller.createReviewConfig({ tenantId: 'tenant-A', repository: 'org/repo', enabled: true })
    const fetched = await controller.getReviewConfig(config.id)
    assert.equal(fetched.id, config.id)
  })

  void it('不存在的配置抛出错误', async () => {
    const controller = createController()
    await assert.rejects(() => controller.getReviewConfig('nonexistent'), /not found/)
  })
})

// ─── DELETE /ai-review/configs/:id ──────────────────────────

void describe('DELETE /ai-review/configs/:id', () => {
  void it('删除已有配置成功', async () => {
    const controller = createController()
    const config = await controller.createReviewConfig({ tenantId: 'tenant-A', repository: 'org/repo', enabled: true })
    await controller.deleteReviewConfig(config.id)
    await assert.rejects(() => controller.getReviewConfig(config.id), /not found/)
  })

  void it('删除不存在的配置抛出错误', async () => {
    const controller = createController()
    await assert.rejects(() => controller.deleteReviewConfig('nonexistent'), /not found/)
  })
})

// ─── GET /ai-review/health ──────────────────────────────────

void describe('GET /ai-review/health', () => {
  void it('健康检查返回正确结构', async () => {
    const controller = createController()
    const result = await controller.healthcheck()
    assert.equal(result.ok, true)
    assert.equal(result.defaultProvider, 'claude')
    assert.equal(typeof result.budgetUtilization, 'number')
  })
})
