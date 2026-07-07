/**
 * ai-review.controller.ts · AI Code Review REST Controller (Phase-19)
 *
 * 路由:
 *   POST   /ai-review/reviews          — 提交PR评审请求
 *   GET    /ai-review/reviews/:id      — 获取评审结果
 *   GET    /ai-review/history          — 查询评审历史
 *   GET    /ai-review/summary          — 获取评审摘要统计
 *   POST   /ai-review/configs          — 创建评审配置
 *   PUT    /ai-review/configs/:id      — 更新评审配置
 *   GET    /ai-review/configs/:id      — 获取评审配置
 *   DELETE /ai-review/configs/:id      — 删除评审配置
 *   GET    /ai-review/health           — 健康检查
 */

import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query, Headers, HttpCode, HttpStatus,
} from '@nestjs/common'
import { AIReviewService } from './ai-review.service'
import {
  SubmitReviewDto,
  ReviewHistoryQueryDto,
  ReviewSummaryQueryDto,
  CreateReviewConfigDto,
} from './ai-review.dto'
import type {
  ReviewResponse,
  ReviewRecord,
  ReviewSummary,
  ReviewConfig,
} from './ai-review.entity'

@Controller('ai-review')
export class AIReviewController {
  /** 内存存储: 评审结果缓存 (reviewId → ReviewResponse) */
  private readonly reviewStore = new Map<string, ReviewResponse>()
  /** 内存存储: 评审历史 */
  private readonly recordStore = new Map<string, ReviewRecord>()
  /** 内存存储: 评审配置 (configId → ReviewConfig) */
  private readonly configStore = new Map<string, ReviewConfig>()
  /** 自增 ID 计数器 */
  private idCounter = 0

  constructor(private readonly reviewService: AIReviewService) {}

  // ─── 核心评审 ─────────────────────────────────────────────────────

  /**
   * POST /ai-review/reviews
   * 提交 PR 评审请求
   */
  @Post('reviews')
  @HttpCode(HttpStatus.ACCEPTED)
  async submitReview(
    @Headers('x-tenant-id') tenantId: string,
    @Body() dto: SubmitReviewDto,
  ): Promise<{ reviewId: string; status: string }> {
    const result = await this.reviewService.reviewPRDiff({
      prTitle: dto.title,
      prDescription: dto.description,
      files: dto.files.map((f) => ({
        filePath: f.filePath,
        language: f.language,
        diff: f.diff,
        additions: f.additions,
        deletions: f.deletions,
      })),
    })

    const reviewId = `review-${Date.now()}-${this.nextId()}`
    this.reviewStore.set(reviewId, {
      id: reviewId,
      request: { repository: dto.repository, pullRequestId: dto.pullRequestId, title: dto.title },
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

    // 同时写入历史
    this.recordStore.set(reviewId, {
      id: reviewId,
      tenantId: tenantId ?? 'default',
      repository: dto.repository,
      pullRequestId: dto.pullRequestId,
      status: 'completed',
      overallScore: result.output.overallScore,
      issueCount: 0,
      latencyMs: result.totalLatencyMs,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    })

    return { reviewId, status: 'completed' }
  }

  /**
   * GET /ai-review/reviews/:id
   * 获取指定评审结果
   */
  @Get('reviews/:id')
  async getReviewResult(
    @Param('id') id: string,
  ): Promise<ReviewResponse> {
    const cached = this.reviewStore.get(id)
    if (!cached) {
      throw new Error(`Review not found: ${id}`)
    }
    return cached
  }

  // ─── 评审历史 ─────────────────────────────────────────────────────

  /**
   * GET /ai-review/history
   * 查询评审历史记录
   */
  @Get('history')
  async getReviewHistory(
    @Headers('x-tenant-id') tenantId: string,
    @Query() query: ReviewHistoryQueryDto,
  ): Promise<ReviewRecord[]> {
    let records = Array.from(this.recordStore.values())

    // 按 tenantId 过滤
    if (tenantId) {
      records = records.filter((r) => r.tenantId === tenantId)
    }

    // 按 repository 过滤
    if (query.repository) {
      records = records.filter((r) => r.repository === query.repository)
    }

    // 按 pullRequestId 过滤
    if (query.pullRequestId !== undefined) {
      records = records.filter((r) => r.pullRequestId === query.pullRequestId)
    }

    // 按 status 过滤
    if (query.status) {
      records = records.filter((r) => r.status === query.status)
    }

    // 分页
    const limit = query.limit ?? 20
    const offset = query.offset ?? 0
    records.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return records.slice(offset, offset + limit)
  }

  // ─── 评审摘要 ─────────────────────────────────────────────────────

  /**
   * GET /ai-review/summary
   * 获取评审摘要统计
   */
  @Get('summary')
  async getReviewSummary(
    @Query() query: ReviewSummaryQueryDto,
  ): Promise<ReviewSummary> {
    // 按 tenant 过滤记录
    let records = Array.from(this.recordStore.values())
    if (query.tenantId) {
      records = records.filter((r) => r.tenantId === query.tenantId)
    }
    if (query.repository) {
      records = records.filter((r) => r.repository === query.repository)
    }
    // 按时间窗口过滤
    if (query.periodStart) {
      records = records.filter((r) => r.createdAt >= query.periodStart)
    }
    if (query.periodEnd) {
      records = records.filter((r) => r.createdAt <= query.periodEnd)
    }

    const totalReviews = records.length
    const successfulReviews = records.filter((r) => r.status === 'completed').length
    const totalIssues = records.reduce((s, r) => s + (r.issueCount ?? 0), 0)
    const scores = records.filter((r) => r.overallScore > 0).map((r) => r.overallScore)
    const averageScore = scores.length > 0
      ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
      : 0
    const latencies = records.filter((r) => r.latencyMs > 0).map((r) => r.latencyMs)
    const averageLatencyMs = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0

    return {
      totalReviews,
      successfulReviews,
      totalIssues,
      issuesBySeverity: { critical: 0, major: 0, minor: 0, suggestion: 0 },
      issuesByCategory: {
        security: 0, performance: 0, correctness: 0, maintainability: 0,
        style: 0, test: 0, documentation: 0, best_practice: 0,
        dependency: 0, architecture: 0,
      },
      averageScore,
      averageLatencyMs,
      cacheHitRate: records.length > 0
        ? Math.round((records.filter((r) => r.status === 'completed').length / records.length) * 10000) / 100
        : 0,
      periodStart: query.periodStart,
      periodEnd: query.periodEnd || new Date().toISOString(),
    }
  }

  // ─── 评审配置 ─────────────────────────────────────────────────────

  /**
   * POST /ai-review/configs
   * 创建评审配置
   */
  @Post('configs')
  async createReviewConfig(
    @Body() dto: CreateReviewConfigDto,
  ): Promise<ReviewConfig> {
    const id = `config-${dto.tenantId}-${dto.repository.replace(/[^a-zA-Z0-9-_]/g, '-')}`
    if (this.configStore.has(id)) {
      throw new Error(`Review config already exists: ${id}`)
    }
    const config: ReviewConfig = {
      id,
      tenantId: dto.tenantId,
      repository: dto.repository,
      enabled: dto.enabled,
      triggerOn: dto.triggerOn ?? { labels: [], branches: [], filePatterns: [] },
      ignorePatterns: dto.ignorePatterns ?? [],
      minSeverity: (dto.minSeverity as ReviewConfig['minSeverity']) ?? 'minor',
      categories: dto.categories as ReviewConfig['categories'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    this.configStore.set(id, config)
    return config
  }

  /**
   * PUT /ai-review/configs/:id
   * 更新评审配置
   */
  @Put('configs/:id')
  async updateReviewConfig(
    @Param('id') id: string,
    @Body() dto: Partial<CreateReviewConfigDto>,
  ): Promise<ReviewConfig> {
    const existing = this.configStore.get(id)
    if (!existing) {
      throw new Error(`Review config not found: ${id}`)
    }
    const updated: ReviewConfig = {
      ...existing,
      ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      ...(dto.tenantId ? { tenantId: dto.tenantId } : {}),
      ...(dto.repository ? { repository: dto.repository } : {}),
      ...(dto.triggerOn ? { triggerOn: { ...existing.triggerOn, ...dto.triggerOn } } : {}),
      ...(dto.ignorePatterns ? { ignorePatterns: dto.ignorePatterns } : {}),
      ...(dto.minSeverity ? { minSeverity: dto.minSeverity as ReviewConfig['minSeverity'] } : {}),
      ...(dto.categories ? { categories: dto.categories as ReviewConfig['categories'] } : {}),
      updatedAt: new Date().toISOString(),
    }
    this.configStore.set(id, updated)
    return updated
  }

  /**
   * GET /ai-review/configs/:id
   * 获取评审配置
   */
  @Get('configs/:id')
  async getReviewConfig(
    @Param('id') id: string,
  ): Promise<ReviewConfig> {
    const config = this.configStore.get(id)
    if (!config) {
      throw new Error(`Review config not found: ${id}`)
    }
    return config
  }

  /**
   * DELETE /ai-review/configs/:id
   * 删除评审配置
   */
  @Delete('configs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReviewConfig(
    @Param('id') id: string,
  ): Promise<void> {
    if (!this.configStore.has(id)) {
      throw new Error(`Review config not found: ${id}`)
    }
    this.configStore.delete(id)
  }

  // ─── 健康检查 ─────────────────────────────────────────────────────

  /**
   * GET /ai-review/health
   * 服务健康检查
   */
  @Get('health')
  async healthcheck(): Promise<{
    ok: boolean
    defaultProvider: string
    budgetUtilization: number
    cacheEnabled: boolean
  }> {
    return this.reviewService.healthcheck()
  }

  // ─── 测试辅助 ─────────────────────────────────────────────────────

  /** 测试 helper: 清空内存存储 */
  reset(): void {
    this.reviewStore.clear()
    this.recordStore.clear()
    this.configStore.clear()
    this.idCounter = 0
  }

  /** 测试 helper: 注入一条评审记录 */
  injectReview(reviewId: string, review: ReviewResponse): void {
    this.reviewStore.set(reviewId, review)
    this.recordStore.set(reviewId, {
      id: reviewId,
      tenantId: review.request?.repository ?? 'default',
      repository: review.request?.repository ?? 'unknown',
      pullRequestId: Number(review.request?.pullRequestId) ?? 0,
      status: review.status,
      overallScore: review.overallScore,
      issueCount: review.issues.length,
      latencyMs: review.latencyMs,
      createdAt: review.completedAt ?? new Date().toISOString(),
      completedAt: review.completedAt,
    })
  }

  /** 测试 helper: 注入一条配置 */
  injectConfig(config: ReviewConfig): void {
    this.configStore.set(config.id, config)
  }

  private nextId(): number {
    return ++this.idCounter
  }
}
