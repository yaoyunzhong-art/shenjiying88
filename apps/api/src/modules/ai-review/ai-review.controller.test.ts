import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-review] [D] controller spec 补全
 * AIReviewController 全面单元测试 (node:test)
 *
 * 覆盖策略: 正例 + 反例 + 边界
 * 所有路由端点: 评审提交/查询、历史、摘要、配置 CRUD、健康检查
 */
import assert from 'node:assert/strict'
import { AIReviewController } from './ai-review.controller'
import { AIReviewService } from './ai-review.service'

// ─── Mock 辅助 ─────────────────────────────────────────────────

function makeMockService(): AIReviewService {
  // 创建一个最小 Mock service (只提供 healthcheck)
  // 真实 submitReview 依赖 reviewPRDiff → 我们直接 mock
  const svc = {
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
  return svc
}

function createController(): AIReviewController {
  const ctrl = new AIReviewController(makeMockService())
  ctrl.reset()
  return ctrl
}

const VALID_BODY = {
  repositoryType: 'github',
  repository: 'shenjiying/shenjiying88',
  pullRequestId: 42,
  title: 'Fix login validation',
  description: 'Fixed token expiry check',
  files: [{
    filePath: 'src/auth/login.ts',
    language: 'typescript',
    diff: '@@ -10,5 +10,8 @@',
    additions: 5,
    deletions: 2,
    status: 'modified',
  }],
  author: 'dev-user',
}

// ════════════════════════════════════════════════════════════════
// POST /ai-review/reviews
// ════════════════════════════════════════════════════════════════

void describe('POST /ai-review/reviews — submitReview', () => {
  void it('正例: 正常提交返回 reviewId + status', async () => {
    const ctrl = createController()
    const result = await ctrl.submitReview('tenant-A', VALID_BODY as any)
    assert.equal(typeof result.reviewId, 'string')
    assert.ok(result.reviewId.startsWith('review-'))
    assert.equal(result.status, 'completed')
  })

  void it('正例: 提交后可通过 getReviewResult 查到', async () => {
    const ctrl = createController()
    const { reviewId } = await ctrl.submitReview('tenant-A', VALID_BODY as any)
    const review = await ctrl.getReviewResult(reviewId)
    assert.equal(review.id, reviewId)
    assert.equal(review.overallScore, 85)
    assert.equal(review.status, 'completed')
    assert.deepEqual(review.strengths, ['Clean diff'])
  })

  void it('反例: 空 tenantId 也能正常提交', async () => {
    const ctrl = createController()
    const result = await ctrl.submitReview('', VALID_BODY as any)
    assert.equal(typeof result.reviewId, 'string')
  })

  void it('边界: 无文件列表 — service 层处理', async () => {
    const ctrl = createController()
    // 修改 mock 使得空文件时正常返回 (skeleton 实现不抛)
    const ctrl2 = new AIReviewController({
      ...makeMockService(),
      reviewPRDiff: async () => ({
        output: { overallScore: 0, issues: [], strengths: [], summary: 'No files', needsApproverReview: true },
        raw: { content: '{}' },
        totalLatencyMs: 100,
        cacheHit: false,
      }),
    } as unknown as AIReviewService)
    ctrl2.reset()
    // 即使 files 为空, controller 的 map 仍会传空数组 → 应在 service 层处理
    // 这里验证 controller 不崩溃
    const result = await ctrl2.submitReview('tenant-A', { ...VALID_BODY, files: [] } as any)
    assert.equal(typeof result.reviewId, 'string')
    assert.equal(result.status, 'completed')
  })
})

// ════════════════════════════════════════════════════════════════
// GET /ai-review/reviews/:id
// ════════════════════════════════════════════════════════════════

void describe('GET /ai-review/reviews/:id — getReviewResult', () => {
  void it('正例: 获取已存在的评审结果', async () => {
    const ctrl = createController()
    const { reviewId } = await ctrl.submitReview('tenant-A', VALID_BODY as any)
    const result = await ctrl.getReviewResult(reviewId)
    assert.equal(result.id, reviewId)
    assert.ok(typeof result.overallScore === 'number')
    assert.ok(Array.isArray(result.strengths))
  })

  void it('正例: injectReview 后能查询', async () => {
    const ctrl = createController()
    ctrl.injectReview('review-custom-1', {
      id: 'review-custom-1',
      request: { repository: 'org/repo', pullRequestId: 1, title: 'Test' },
      overallScore: 92,
      issues: [{ id: 'issue-1', category: 'security', severity: 'critical', message: 'SQL injection', filePath: 'db.ts', suggestion: 'Use parameterized queries' }],
      strengths: ['Good test coverage'],
      summary: 'Well-structured PR',
      needsApproverReview: false,
      latencyMs: 800,
      cacheHit: true,
      status: 'completed',
      completedAt: new Date().toISOString(),
    })
    const result = await ctrl.getReviewResult('review-custom-1')
    assert.equal(result.overallScore, 92)
    assert.equal(result.issues.length, 1)
    assert.equal(result.issues[0].category, 'security')
  })

  void it('反例: 不存在的 reviewId 抛出错误', async () => {
    const ctrl = createController()
    await assert.rejects(
      () => ctrl.getReviewResult('nonexistent-id'),
      /Review not found/,
    )
  })

  void it('反例: 空字符串 reviewId 抛出错误', async () => {
    const ctrl = createController()
    await assert.rejects(
      () => ctrl.getReviewResult(''),
      /Review not found/,
    )
  })
})

// ════════════════════════════════════════════════════════════════
// GET /ai-review/history
// ════════════════════════════════════════════════════════════════

void describe('GET /ai-review/history — getReviewHistory', () => {
  void it('正例: 空历史返回空数组', async () => {
    const ctrl = createController()
    const result = await ctrl.getReviewHistory('tenant-A', {})
    assert.ok(Array.isArray(result))
    assert.equal(result.length, 0)
  })

  void it('正例: 提交后历史中有记录', async () => {
    const ctrl = createController()
    await ctrl.submitReview('tenant-A', VALID_BODY as any)
    const history = await ctrl.getReviewHistory('tenant-A', {})
    assert.equal(history.length, 1)
    assert.equal(history[0].repository, 'shenjiying/shenjiying88')
    assert.equal(history[0].pullRequestId, 42)
    assert.equal(history[0].status, 'completed')
  })

  void it('边界: 按 repository 过滤', async () => {
    const ctrl = createController()
    await ctrl.submitReview('tenant-A', { ...VALID_BODY, repository: 'org/repo-a' } as any)
    await ctrl.submitReview('tenant-A', { ...VALID_BODY, repository: 'org/repo-b' } as any)
    const filtered = await ctrl.getReviewHistory('tenant-A', { repository: 'org/repo-a' })
    assert.equal(filtered.length, 1)
    assert.equal(filtered[0].repository, 'org/repo-a')
  })

  void it('边界: 分页 limit/offset 生效', async () => {
    const ctrl = createController()
    for (let i = 0; i < 5; i++) {
      await ctrl.submitReview('tenant-A', { ...VALID_BODY, title: `PR #${i}` } as any)
    }
    const page1 = await ctrl.getReviewHistory('tenant-A', { limit: 2, offset: 0 })
    const page2 = await ctrl.getReviewHistory('tenant-A', { limit: 2, offset: 2 })
    assert.equal(page1.length, 2)
    assert.equal(page2.length, 2)
    // 排序: 最新在前
    assert.notEqual(page1[0].id, page2[0].id)
  })

  void it('边界: 默认 limit 为 20', async () => {
    const ctrl = createController()
    for (let i = 0; i < 25; i++) {
      await ctrl.submitReview('tenant-A', { ...VALID_BODY, title: `PR #${i}` } as any)
    }
    const result = await ctrl.getReviewHistory('tenant-A', {})
    assert.equal(result.length, 20)
  })
})

// ════════════════════════════════════════════════════════════════
// GET /ai-review/summary
// ════════════════════════════════════════════════════════════════

void describe('GET /ai-review/summary — getReviewSummary', () => {
  void it('正例: 无记录时返回全零摘要', async () => {
    const ctrl = createController()
    const result = await ctrl.getReviewSummary({
      tenantId: 'tenant-A',
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
    })
    assert.equal(result.totalReviews, 0)
    assert.equal(result.successfulReviews, 0)
    assert.equal(result.averageScore, 0)
    assert.equal(result.periodStart, '2026-01-01')
    assert.equal(typeof result.periodEnd, 'string')
  })

  void it('正例: 有记录时正确汇总', async () => {
    const ctrl = createController()
    await ctrl.submitReview('tenant-A', VALID_BODY as any)
    const result = await ctrl.getReviewSummary({
      tenantId: 'tenant-A',
      periodStart: '2026-01-01',
      periodEnd: '2026-12-31',
    })
    assert.equal(result.totalReviews, 1)
    assert.equal(result.successfulReviews, 1)
    assert.equal(result.averageScore, 85)
    assert.ok(result.averageLatencyMs > 0)
  })

  void it('边界: 按时间窗口过滤 (periodStart/periodEnd)', async () => {
    const ctrl = createController()
    await ctrl.submitReview('tenant-A', VALID_BODY as any)
    // 过去的窗口
    const past = await ctrl.getReviewSummary({
      tenantId: 'tenant-A',
      periodStart: '2020-01-01',
      periodEnd: '2020-12-31',
    })
    assert.equal(past.totalReviews, 0)
    // 将来的窗口
    const future = await ctrl.getReviewSummary({
      tenantId: 'tenant-A',
      periodStart: '2030-01-01',
      periodEnd: '2030-12-31',
    })
    assert.equal(future.totalReviews, 0)
  })

  void it('边界: 按 repository 过滤', async () => {
    const ctrl = createController()
    await ctrl.submitReview('tenant-A', { ...VALID_BODY, repository: 'org/repo-a' } as any)
    const filtered = await ctrl.getReviewSummary({
      tenantId: 'tenant-A',
      repository: 'org/repo-a',
      periodStart: '2020-01-01',
      periodEnd: '2030-12-31',
    })
    assert.equal(filtered.totalReviews, 1)
    const noMatch = await ctrl.getReviewSummary({
      tenantId: 'tenant-A',
      repository: 'org/nonexistent',
      periodStart: '2020-01-01',
      periodEnd: '2030-12-31',
    })
    assert.equal(noMatch.totalReviews, 0)
  })
})

// ════════════════════════════════════════════════════════════════
// POST /ai-review/configs
// ════════════════════════════════════════════════════════════════

void describe('POST /ai-review/configs — createReviewConfig', () => {
  void it('正例: 创建配置成功, 返回完整配置对象', async () => {
    const ctrl = createController()
    const config = await ctrl.createReviewConfig({
      tenantId: 'tenant-A',
      repository: 'org/repo',
      enabled: true,
    })
    assert.ok(config.id.startsWith('config-'))
    assert.equal(config.tenantId, 'tenant-A')
    assert.equal(config.enabled, true)
    assert.equal(typeof config.createdAt, 'string')
    assert.equal(typeof config.updatedAt, 'string')
    assert.equal(config.minSeverity, 'minor')
  })

  void it('边界: 带 triggerOn 和 categories 参数', async () => {
    const ctrl = createController()
    const config = await ctrl.createReviewConfig({
      tenantId: 'tenant-A',
      repository: 'org/repo',
      enabled: true,
      triggerOn: { labels: ['needs-review'], branches: ['main'], filePatterns: ['src/**/*.ts'] },
      ignorePatterns: ['**/*.test.ts'],
      minSeverity: 'critical',
      categories: ['security', 'performance'],
    })
    assert.ok(config.triggerOn.labels?.includes('needs-review'))
    assert.ok(config.ignorePatterns?.includes('**/*.test.ts'))
    assert.equal(config.minSeverity, 'critical')
    assert.ok(config.categories?.includes('security'))
  })

  void it('反例: 重复创建同 repo 配置应抛出错误', async () => {
    const ctrl = createController()
    await ctrl.createReviewConfig({ tenantId: 'tenant-A', repository: 'org/repo', enabled: true })
    await assert.rejects(
      () => ctrl.createReviewConfig({ tenantId: 'tenant-A', repository: 'org/repo', enabled: false }),
      /already exists/,
    )
  })
})

// ════════════════════════════════════════════════════════════════
// PUT /ai-review/configs/:id
// ════════════════════════════════════════════════════════════════

void describe('PUT /ai-review/configs/:id — updateReviewConfig', () => {
  void it('正例: 更新 enabled 字段', async () => {
    const ctrl = createController()
    const config = await ctrl.createReviewConfig({ tenantId: 'tenant-A', repository: 'org/repo', enabled: true })
    const updated = await ctrl.updateReviewConfig(config.id, { enabled: false })
    assert.equal(updated.enabled, false)
    assert.equal(updated.id, config.id)
    assert.ok(typeof updated.updatedAt === 'string')
    assert.ok(updated.updatedAt.length > 0)
  })

  void it('正例: 局部更新不丢失原有字段', async () => {
    const ctrl = createController()
    const config = await ctrl.createReviewConfig({
      tenantId: 'tenant-A', repository: 'org/repo', enabled: true,
      minSeverity: 'critical',
      ignorePatterns: ['*.test.ts'],
    })
    const updated = await ctrl.updateReviewConfig(config.id, { enabled: false })
    assert.equal(updated.enabled, false)
    assert.equal(updated.minSeverity, 'critical')  // 保留
    assert.deepEqual(updated.ignorePatterns, ['*.test.ts'])  // 保留
  })

  void it('反例: 不存在的配置 ID 抛出错误', async () => {
    const ctrl = createController()
    await assert.rejects(
      () => ctrl.updateReviewConfig('nonexistent-id', { enabled: false }),
      /not found/,
    )
  })
})

// ════════════════════════════════════════════════════════════════
// GET /ai-review/configs/:id
// ════════════════════════════════════════════════════════════════

void describe('GET /ai-review/configs/:id — getReviewConfig', () => {
  void it('正例: 获取已创建的配置', async () => {
    const ctrl = createController()
    const config = await ctrl.createReviewConfig({ tenantId: 'tenant-A', repository: 'org/repo', enabled: true })
    const fetched = await ctrl.getReviewConfig(config.id)
    assert.equal(fetched.id, config.id)
    assert.equal(fetched.enabled, true)
  })

  void it('正例: injectConfig 后能查询', async () => {
    const ctrl = createController()
    ctrl.injectConfig({
      id: 'config-manual-1',
      tenantId: 'tenant-B',
      repository: 'org/repo-b',
      enabled: false,
      triggerOn: { labels: [], branches: [], filePatterns: [] },
      createdAt: '2026-06-01T00:00:00Z',
      updatedAt: '2026-06-01T00:00:00Z',
    })
    const fetched = await ctrl.getReviewConfig('config-manual-1')
    assert.equal(fetched.tenantId, 'tenant-B')
    assert.equal(fetched.enabled, false)
  })

  void it('反例: 不存在的配置 ID 抛出错误', async () => {
    const ctrl = createController()
    await assert.rejects(() => ctrl.getReviewConfig('nonexistent'), /not found/)
  })
})

// ════════════════════════════════════════════════════════════════
// DELETE /ai-review/configs/:id
// ════════════════════════════════════════════════════════════════

void describe('DELETE /ai-review/configs/:id — deleteReviewConfig', () => {
  void it('正例: 删除已有配置', async () => {
    const ctrl = createController()
    const config = await ctrl.createReviewConfig({ tenantId: 'tenant-A', repository: 'org/repo', enabled: true })
    await ctrl.deleteReviewConfig(config.id)
    // 删除后再查应抛出
    await assert.rejects(() => ctrl.getReviewConfig(config.id), /not found/)
  })

  void it('正例: 删除后不能再删除 (noop)', async () => {
    const ctrl = createController()
    const config = await ctrl.createReviewConfig({ tenantId: 'tenant-A', repository: 'org/repo', enabled: true })
    await ctrl.deleteReviewConfig(config.id)
    await assert.rejects(() => ctrl.deleteReviewConfig(config.id), /not found/)
  })

  void it('反例: 删除不存在的配置抛出错误', async () => {
    const ctrl = createController()
    await assert.rejects(() => ctrl.deleteReviewConfig('nonexistent'), /not found/)
  })
})

// ════════════════════════════════════════════════════════════════
// GET /ai-review/health
// ════════════════════════════════════════════════════════════════

void describe('GET /ai-review/health — healthcheck', () => {
  void it('正例: 健康检查返回正确结构', async () => {
    const ctrl = createController()
    const result = await ctrl.healthcheck()
    assert.equal(result.ok, true)
    assert.equal(result.defaultProvider, 'claude')
    assert.equal(typeof result.budgetUtilization, 'number')
    assert.equal(typeof result.cacheEnabled, 'boolean')
  })
})

// ════════════════════════════════════════════════════════════════
// reset / injectReview / injectConfig 辅助方法
// ════════════════════════════════════════════════════════════════

void describe('测试辅助方法', () => {
  void it('reset 清除所有存储', async () => {
    const ctrl = createController()
    await ctrl.submitReview('tenant-A', VALID_BODY as any)
    ctrl.reset()
    const history = await ctrl.getReviewHistory('tenant-A', {})
    assert.equal(history.length, 0)
  })

  void it('injectReview + getReviewResult 往返', async () => {
    const ctrl = createController()
    ctrl.injectReview('test-review', {
      id: 'test-review',
      request: { repository: 'org/repo', pullRequestId: 1, title: 'Test' },
      overallScore: 75,
      issues: [],
      strengths: [],
      summary: '',
      needsApproverReview: false,
      latencyMs: 500,
      cacheHit: false,
      status: 'completed',
      completedAt: new Date().toISOString(),
    })
    const result = await ctrl.getReviewResult('test-review')
    assert.equal(result.overallScore, 75)
  })

  void it('injectConfig + getReviewConfig 往返', async () => {
    const ctrl = createController()
    ctrl.injectConfig({
      id: 'cfg-test',
      tenantId: 't1',
      repository: 'r1',
      enabled: true,
      triggerOn: { labels: [], branches: [], filePatterns: [] },
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    })
    const cfg = await ctrl.getReviewConfig('cfg-test')
    assert.equal(cfg.repository, 'r1')
  })
})

// ════════════════════════════════════════════════════════════════
// 集成: 完整工作流
// ════════════════════════════════════════════════════════════════

void describe('集成: 完整工作流', () => {
  void it('提交 → 查询 → 历史 → 摘要 → 配置', async () => {
    const ctrl = createController()

    // 1. 提交评审
    const { reviewId } = await ctrl.submitReview('tenant-A', VALID_BODY as any)

    // 2. 查询结果
    const review = await ctrl.getReviewResult(reviewId)
    assert.equal(review.id, reviewId)

    // 3. 查历史
    const history = await ctrl.getReviewHistory('tenant-A', {})
    assert.equal(history.length, 1)

    // 4. 查摘要
    const summary = await ctrl.getReviewSummary({
      tenantId: 'tenant-A',
      periodStart: '2020-01-01',
      periodEnd: '2030-12-31',
    })
    assert.equal(summary.totalReviews, 1)

    // 5. 创建配置
    const config = await ctrl.createReviewConfig({
      tenantId: 'tenant-A',
      repository: 'org/repo',
      enabled: true,
    })

    // 6. 更新配置
    const updated = await ctrl.updateReviewConfig(config.id, { enabled: false })
    assert.equal(updated.enabled, false)

    // 7. 删除配置
    await ctrl.deleteReviewConfig(config.id)
    await assert.rejects(() => ctrl.getReviewConfig(config.id), /not found/)
  })
})
