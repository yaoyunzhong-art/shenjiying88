import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,

import { TenantGuard } from '../agent/tenant.guard'

} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreatePerformanceReviewDto,
  ReviewQueryDto,
  UpdateReviewStatusDto,
  UpdateScoresDto,
} from './performance-review.dto'
import { PerformanceReviewService } from './performance-review.service'

@UseGuards(TenantGuard)
@Controller('performance-reviews')
export class PerformanceReviewController {
  constructor(private readonly reviewService: PerformanceReviewService) {}

  // ── Review CRUD ──

  @Post()
  createReview(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreatePerformanceReviewDto,
  ) {
    return this.reviewService.createReview({
      tenantId: tenantContext.tenantId,
      employeeId: body.employeeId,
      employeeName: body.employeeName,
      reviewer: body.reviewer,
      period: body.period,
      scores: body.scores,
      comments: body.comments,
    })
  }

  @Get()
  listReviews(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewService.listReviews(tenantContext.tenantId, {
      period: query.period,
      status: query.status,
      employeeId: query.employeeId,
    })
  }

  @Get(':reviewId')
  getReview(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('reviewId') reviewId: string,
  ) {
    const review = this.reviewService.getReview(reviewId, tenantContext.tenantId)
    if (!review) {
      throw new Error(`Performance review not found: ${reviewId}`)
    }
    return review
  }

  @Patch(':reviewId/scores')
  updateScores(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('reviewId') reviewId: string,
    @Body() body: UpdateScoresDto,
  ) {
    return this.reviewService.updateScores(
      reviewId,
      tenantContext.tenantId,
      body.scores,
      body.comments,
    )
  }

  @Patch(':reviewId/status')
  updateReviewStatus(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('reviewId') reviewId: string,
    @Body() body: UpdateReviewStatusDto,
  ) {
    return this.reviewService.updateReviewStatus(
      reviewId,
      body.status,
      tenantContext.tenantId,
    )
  }

  // ── Mock Seed ──

  @Post('seed')
  seedMockData(@TenantContext() tenantContext: RequestTenantContext) {
    this.reviewService.seedMockData(tenantContext.tenantId)
    return { message: 'Mock performance review data seeded' }
  }
}
