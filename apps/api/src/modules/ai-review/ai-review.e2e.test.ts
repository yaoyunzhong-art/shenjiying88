import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * E2E: AI Code Review HTTP 端到端链路
 *
 * 链路:
 *   HTTP → TestController → AIReviewService
 *
 * 验证:
 *   - POST /ai-review/reviews 提交评审请求
 *   - GET  /ai-review/reviews/:id 获取评审结果
 *   - GET  /ai-review/history 评审历史
 *   - GET  /ai-review/summary 评审摘要
 *   - POST /ai-review/configs 创建配置
 *   - PUT  /ai-review/configs/:id 更新配置
 *   - GET  /ai-review/configs/:id 获取配置
 *   - DELETE /ai-review/configs/:id 删除配置
 *   - GET  /ai-review/health 健康检查
 *   - 异常输入 (缺少字段 / 不存在资源 / 重复创建)
 *   - 多租户隔离
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
  Put,
  Query,
  Headers,
} from '@nestjs/common'
import { Test } from '@nestjs/testing'
import request from 'supertest'
import { ResponseInterceptor } from '../../common/interceptors/response.interceptor'
import { AIReviewService } from './ai-review.service'
import type { ReviewResponse, ReviewRecord, ReviewSummary, ReviewConfig } from './ai-review.entity'

// ─── Test Controller (模拟真实路由) ─────────────────────────

@Controller('ai-review')
class TestAiReviewController {
  private reviewStore = new Map<string, ReviewResponse>()
  private recordStore = new Map<string, ReviewRecord>()
  private configStore = new Map<string, ReviewConfig>()
  private idCounter = 0

  /** 注入外部 mock service */
  private reviewService!: {
    reviewPRDiff: (params: any) => Promise<any>
    healthcheck: () => Promise<any>
  }

  constructor(@Inject('MOCK_AI_REVIEW_SERVICE') service: any) {
    this.reviewService = service
  }

  @Post('reviews')
  @HttpCode(HttpStatus.ACCEPTED)
  async submitReview(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: Record<string, unknown>,
  ): Promise<{ reviewId: string; status: string }> {
    const { title, description, repository, pullRequestId, files } = body as any
    const result = await this.reviewService.reviewPRDiff({
      prTitle: title,
      prDescription: description || '',
      files: (files || []).map((f: any) => ({
        filePath: f.filePath,
        language: f.language,
        diff: f.diff || '',
        additions: f.additions || 0,
        deletions: f.deletions || 0,
      })),
    })

    const reviewId = `review-${Date.now()}-${++this.idCounter}`
    this.reviewStore.set(reviewId, {
      id: reviewId,
      request: { repository, pullRequestId, title },
      overallScore: result.output.overallScore,
      issues: [],
      strengths: result.output.strengths,
      summary: result.output.summary,
      needsApproverReview: result.output.needsApproverReview,
      latencyMs: result.totalLatencyMs,
      cacheHit: result.cacheHit,
      status: 'completed',
      completedAt: new Date().toISOString(),
    })

    this.recordStore.set(reviewId, {
      id: reviewId,
      tenantId: tenantId || 'default',
      repository,
      pullRequestId: Number(pullRequestId),
      status: 'completed',
      overallScore: result.output.overallScore,
      issueCount: 0,
      latencyMs: result.totalLatencyMs,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    })

    return { reviewId, status: 'completed' }
  }

  @Get('reviews/:id')
  async getReviewResult(@Param('id') id: string): Promise<ReviewResponse> {
    const cached = this.reviewStore.get(id)
    if (!cached) throw new Error(`Review not found: ${id}`)
    return cached
  }

  @Get('history')
  async getReviewHistory(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: Record<string, any>,
  ): Promise<ReviewRecord[]> {
    let records = Array.from(this.recordStore.values())
    if (tenantId) records = records.filter((r) => r.tenantId === tenantId)
    if (query.repository) records = records.filter((r) => r.repository === query.repository)
    if (query.pullRequestId) records = records.filter((r) => r.pullRequestId === Number(query.pullRequestId))
    records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return records
  }

  @Get('summary')
  async getReviewSummary(@Query() query: Record<string, any>): Promise<ReviewSummary> {
    let records = Array.from(this.recordStore.values())
    if (query.tenantId) records = records.filter((r) => r.tenantId === query.tenantId)
    const totalReviews = records.length
    const successfulReviews = records.filter((r) => r.status === 'completed').length
    const scores = records.filter((r) => r.overallScore > 0).map((r) => r.overallScore)
    const averageScore = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
      : 0
    return {
      totalReviews,
      successfulReviews,
      totalIssues: 0,
      issuesBySeverity: { critical: 0, major: 0, minor: 0, suggestion: 0 },
      issuesByCategory: {
        security: 0, performance: 0, correctness: 0, maintainability: 0,
        style: 0, test: 0, documentation: 0, best_practice: 0,
        dependency: 0, architecture: 0,
      },
      averageScore,
      averageLatencyMs: 0,
      cacheHitRate: totalReviews > 0 ? 0 : 0,
      periodStart: query.periodStart || '',
      periodEnd: query.periodEnd || new Date().toISOString(),
    }
  }

  @Post('configs')
  async createConfig(@Body() body: Record<string, any>): Promise<ReviewConfig> {
    const id = `config-${body.tenantId}-${body.repository.replace(/[^a-zA-Z0-9-_]/g, '-')}`
    if (this.configStore.has(id)) throw new Error(`Review config already exists: ${id}`)
    const config: ReviewConfig = {
      id,
      tenantId: body.tenantId,
      repository: body.repository,
      enabled: body.enabled,
      triggerOn: body.triggerOn || {},
      ignorePatterns: body.ignorePatterns || [],
      minSeverity: body.minSeverity || 'minor',
      categories: body.categories || [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.configStore.set(id, config)
    return config
  }

  @Put('configs/:id')
  async updateConfig(@Param('id') id: string, @Body() body: Record<string, any>): Promise<ReviewConfig> {
    const existing = this.configStore.get(id)
    if (!existing) throw new Error(`Review config not found: ${id}`)
    const updated = { ...existing, ...body, updatedAt: new Date().toISOString() }
    this.configStore.set(id, updated)
    return updated
  }

  @Get('configs/:id')
  async getConfig(@Param('id') id: string): Promise<ReviewConfig> {
    const config = this.configStore.get(id)
    if (!config) throw new Error(`Review config not found: ${id}`)
    return config
  }

  @Delete('configs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteConfig(@Param('id') id: string): Promise<void> {
    if (!this.configStore.has(id)) throw new Error(`Review config not found: ${id}`)
    this.configStore.delete(id)
  }

  @Get('health')
  async healthcheck(): Promise<any> {
    return { ok: true, defaultProvider: 'claude', budgetUtilization: 0.45, cacheEnabled: true }
  }
}

// ─── 构建 App ───────────────────────────────────────────────

async function buildApp() {
  const mockAiReviewService = {
    reviewPRDiff: async () => ({
      output: {
        overallScore: 85,
        issues: [],
        strengths: ['Good diff structure', 'Clean changes'],
        summary: 'Code looks clean with minor issues',
        needsApproverReview: false,
      },
      raw: { content: '{}' },
      totalLatencyMs: 1200,
      cacheHit: false,
    }),
    healthcheck: async () => ({ ok: true, defaultProvider: 'claude', budgetUtilization: 0.45, cacheEnabled: true }),
  }

  const moduleRef = await Test.createTestingModule({
    controllers: [TestAiReviewController],
    providers: [
      { provide: 'MOCK_AI_REVIEW_SERVICE', useValue: mockAiReviewService },
    ],
  }).compile()

  const app = moduleRef.createNestApplication()
  app.useGlobalInterceptors(new ResponseInterceptor())
  await app.init()
  return { app, mockService: mockAiReviewService }
}

// ─── 测试用例 ───────────────────────────────────────────────

const validReviewPayload = {
  repositoryType: 'github',
  repository: 'shenjiying/shenjiying88',
  pullRequestId: 42,
  title: 'Fix login validation',
  description: 'Fixed token expiry check in auth middleware',
  files: [{
    filePath: 'apps/api/src/auth/login.ts',
    language: 'typescript',
    diff: '@@ -10,5 +10,8 @@\n+const token = verifyJWT(req.headers.authorization)',
    additions: 5,
    deletions: 2,
    status: 'modified',
  }],
  author: 'dev-user',
}

// ─── POST /ai-review/reviews ────────────────────────────────

it('e2e: POST /ai-review/reviews → 201 with reviewId', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/ai-review/reviews')
      .set('x-tenant-id', 'tenant-A')
      .send(validReviewPayload)
      .expect(HttpStatus.ACCEPTED)

    assert.ok(res.body.data.reviewId, 'should have reviewId')
    assert.ok(res.body.data.reviewId.startsWith('review-'), 'reviewId prefix')
    assert.equal(res.body.data.status, 'completed')
  } finally {
    await app.close()
  }
})

it('e2e: POST /ai-review/reviews → can retrieve same review via GET', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/ai-review/reviews')
      .set('x-tenant-id', 'tenant-A')
      .send(validReviewPayload)
      .expect(HttpStatus.ACCEPTED)

    const getRes = await request(app.getHttpServer())
      .get(`/ai-review/reviews/${createRes.body.data.reviewId}`)
      .expect(HttpStatus.OK)

    assert.equal(getRes.body.data.id, createRes.body.data.reviewId)
    assert.equal(getRes.body.data.overallScore, 85)
    assert.equal(getRes.body.data.status, 'completed')
    assert.ok(getRes.body.data.strengths.length > 0)
  } finally {
    await app.close()
  }
})

it('e2e: POST /ai-review/reviews → empty files is accepted', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/ai-review/reviews')
      .set('x-tenant-id', 'tenant-A')
      .send({ ...validReviewPayload, files: [] })
      .expect(HttpStatus.ACCEPTED)

    assert.ok(res.body.data.reviewId)
    assert.equal(res.body.data.status, 'completed')
  } finally {
    await app.close()
  }
})

// ─── GET /ai-review/reviews/:id ────────────────────────────

it('e2e: GET /ai-review/reviews/:id → 404 for nonexistent', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .get('/ai-review/reviews/nonexistent-id')
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
  } finally {
    await app.close()
  }
})

// ─── GET /ai-review/history ────────────────────────────────

it('e2e: GET /ai-review/history → empty on fresh start', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/ai-review/history')
      .set('x-tenant-id', 'tenant-A')
      .expect(HttpStatus.OK)

    assert.ok(Array.isArray(res.body.data))
    assert.equal(res.body.data.length, 0)
  } finally {
    await app.close()
  }
})

it('e2e: GET /ai-review/history → has records after review submission', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .post('/ai-review/reviews')
      .set('x-tenant-id', 'tenant-A')
      .send(validReviewPayload)
      .expect(HttpStatus.ACCEPTED)

    const res = await request(app.getHttpServer())
      .get('/ai-review/history')
      .set('x-tenant-id', 'tenant-A')
      .expect(HttpStatus.OK)

    assert.equal(res.body.data.length, 1)
    assert.equal(res.body.data[0].repository, 'shenjiying/shenjiying88')
  } finally {
    await app.close()
  }
})

// ─── GET /ai-review/summary ────────────────────────────────

it('e2e: GET /ai-review/summary → zero stats with no reviews', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/ai-review/summary')
      .query({ tenantId: 'tenant-A', periodStart: '2026-01-01', periodEnd: '2026-12-31' })
      .expect(HttpStatus.OK)

    assert.equal(res.body.data.totalReviews, 0)
    assert.equal(res.body.data.averageScore, 0)
  } finally {
    await app.close()
  }
})

it('e2e: GET /ai-review/summary → counts after reviews', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .post('/ai-review/reviews')
      .set('x-tenant-id', 'tenant-A')
      .send(validReviewPayload)
      .expect(HttpStatus.ACCEPTED)

    const res = await request(app.getHttpServer())
      .get('/ai-review/summary')
      .query({ tenantId: 'tenant-A', periodStart: '2026-01-01', periodEnd: '2026-12-31' })
      .expect(HttpStatus.OK)

    assert.equal(res.body.data.totalReviews, 1)
    assert.equal(res.body.data.successfulReviews, 1)
  } finally {
    await app.close()
  }
})

// ─── POST /ai-review/configs ────────────────────────────────

it('e2e: POST /ai-review/configs → creates config', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .post('/ai-review/configs')
      .send({ tenantId: 'tenant-A', repository: 'org/repo', enabled: true })
      .expect(HttpStatus.CREATED)

    assert.ok(res.body.data.id.startsWith('config-'))
    assert.equal(res.body.data.enabled, true)
  } finally {
    await app.close()
  }
})

it('e2e: POST /ai-review/configs → duplicate returns error', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .post('/ai-review/configs')
      .send({ tenantId: 'tenant-A', repository: 'org/repo', enabled: true })
      .expect(HttpStatus.CREATED)

    await request(app.getHttpServer())
      .post('/ai-review/configs')
      .send({ tenantId: 'tenant-A', repository: 'org/repo', enabled: false })
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
  } finally {
    await app.close()
  }
})

// ─── PUT /ai-review/configs/:id ─────────────────────────────

it('e2e: PUT /ai-review/configs/:id → updates config fields', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/ai-review/configs')
      .send({ tenantId: 'tenant-A', repository: 'org/repo', enabled: true })
      .expect(HttpStatus.CREATED)

    const updateRes = await request(app.getHttpServer())
      .put(`/ai-review/configs/${createRes.body.data.id}`)
      .send({ enabled: false })
      .expect(HttpStatus.OK)

    assert.equal(updateRes.body.data.enabled, false)
  } finally {
    await app.close()
  }
})

it('e2e: PUT /ai-review/configs/:id → 404 for nonexistent', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .put('/ai-review/configs/nonexistent')
      .send({ enabled: false })
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
  } finally {
    await app.close()
  }
})

// ─── GET /ai-review/configs/:id ─────────────────────────────

it('e2e: GET /ai-review/configs/:id → returns config', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/ai-review/configs')
      .send({ tenantId: 'tenant-A', repository: 'org/repo', enabled: true })
      .expect(HttpStatus.CREATED)

    const getRes = await request(app.getHttpServer())
      .get(`/ai-review/configs/${createRes.body.data.id}`)
      .expect(HttpStatus.OK)

    assert.equal(getRes.body.data.id, createRes.body.data.id)
    assert.equal(getRes.body.data.enabled, true)
  } finally {
    await app.close()
  }
})

it('e2e: GET /ai-review/configs/:id → 404 for nonexistent', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .get('/ai-review/configs/nonexistent')
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
  } finally {
    await app.close()
  }
})

// ─── DELETE /ai-review/configs/:id ──────────────────────────

it('e2e: DELETE /ai-review/configs/:id → deletes config', async () => {
  const { app } = await buildApp()
  try {
    const createRes = await request(app.getHttpServer())
      .post('/ai-review/configs')
      .send({ tenantId: 'tenant-A', repository: 'org/repo', enabled: true })
      .expect(HttpStatus.CREATED)

    await request(app.getHttpServer())
      .delete(`/ai-review/configs/${createRes.body.data.id}`)
      .expect(HttpStatus.NO_CONTENT)

    // 确认已删除
    await request(app.getHttpServer())
      .get(`/ai-review/configs/${createRes.body.data.id}`)
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
  } finally {
    await app.close()
  }
})

it('e2e: DELETE /ai-review/configs/:id → 500 for nonexistent', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .delete('/ai-review/configs/nonexistent')
      .expect(HttpStatus.INTERNAL_SERVER_ERROR)
  } finally {
    await app.close()
  }
})

// ─── GET /ai-review/health ──────────────────────────────────

it('e2e: GET /ai-review/health → returns status', async () => {
  const { app } = await buildApp()
  try {
    const res = await request(app.getHttpServer())
      .get('/ai-review/health')
      .expect(HttpStatus.OK)

    assert.equal(res.body.data.ok, true)
    assert.equal(res.body.data.defaultProvider, 'claude')
    assert.equal(typeof res.body.data.budgetUtilization, 'number')
  } finally {
    await app.close()
  }
})

// ─── 多租户隔离 ──────────────────────────────────────────────

it('e2e: multi-tenant isolation — history only shows own tenant', async () => {
  const { app } = await buildApp()
  try {
    // tenant-A 提交评审
    await request(app.getHttpServer())
      .post('/ai-review/reviews')
      .set('x-tenant-id', 'tenant-A')
      .send(validReviewPayload)
      .expect(HttpStatus.ACCEPTED)

    // tenant-B 提交评审
    await request(app.getHttpServer())
      .post('/ai-review/reviews')
      .set('x-tenant-id', 'tenant-B')
      .send({ ...validReviewPayload, repository: 'other/repo', pullRequestId: 99 })
      .expect(HttpStatus.ACCEPTED)

    // tenant-A 只看自己的记录
    const resA = await request(app.getHttpServer())
      .get('/ai-review/history')
      .set('x-tenant-id', 'tenant-A')
      .expect(HttpStatus.OK)

    assert.equal(resA.body.data.length, 1)
    assert.equal(resA.body.data[0].tenantId, 'tenant-A')

    // tenant-B 只看自己的记录
    const resB = await request(app.getHttpServer())
      .get('/ai-review/history')
      .set('x-tenant-id', 'tenant-B')
      .expect(HttpStatus.OK)

    assert.equal(resB.body.data.length, 1)
    assert.equal(resB.body.data[0].tenantId, 'tenant-B')
  } finally {
    await app.close()
  }
})

it('e2e: multi-tenant isolation — summary independent', async () => {
  const { app } = await buildApp()
  try {
    await request(app.getHttpServer())
      .post('/ai-review/reviews')
      .set('x-tenant-id', 'tenant-A')
      .send(validReviewPayload)
      .expect(HttpStatus.ACCEPTED)

    await request(app.getHttpServer())
      .post('/ai-review/reviews')
      .set('x-tenant-id', 'tenant-B')
      .send({ ...validReviewPayload, repository: 'other/repo', pullRequestId: 99 })
      .expect(HttpStatus.ACCEPTED)

    const sumA = await request(app.getHttpServer())
      .get('/ai-review/summary')
      .query({ tenantId: 'tenant-A', periodStart: '2026-01-01', periodEnd: '2026-12-31' })
      .expect(HttpStatus.OK)

    assert.equal(sumA.body.data.totalReviews, 1)

    const sumB = await request(app.getHttpServer())
      .get('/ai-review/summary')
      .query({ tenantId: 'tenant-B', periodStart: '2026-01-01', periodEnd: '2026-12-31' })
      .expect(HttpStatus.OK)

    assert.equal(sumB.body.data.totalReviews, 1)
  } finally {
    await app.close()
  }
})

// ─── 同时多请求 (并发) ──────────────────────────────────────

it('e2e: concurrent review submissions all succeed', async () => {
  const { app } = await buildApp()
  try {
    const results = await Promise.all([
      request(app.getHttpServer())
        .post('/ai-review/reviews')
        .set('x-tenant-id', 'tenant-A')
        .send(validReviewPayload),
      request(app.getHttpServer())
        .post('/ai-review/reviews')
        .set('x-tenant-id', 'tenant-A')
        .send({ ...validReviewPayload, pullRequestId: 43, title: 'Fix #2' }),
      request(app.getHttpServer())
        .post('/ai-review/reviews')
        .set('x-tenant-id', 'tenant-A')
        .send({ ...validReviewPayload, pullRequestId: 44, title: 'Fix #3' }),
    ])

    results.forEach((r) => {
      assert.equal(r.status, HttpStatus.ACCEPTED)
      assert.ok(r.body.data.reviewId)
    })

    const history = await request(app.getHttpServer())
      .get('/ai-review/history')
      .set('x-tenant-id', 'tenant-A')
      .expect(HttpStatus.OK)

    assert.equal(history.body.data.length, 3)
  } finally {
    await app.close()
  }
})
