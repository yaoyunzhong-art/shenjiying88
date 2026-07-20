import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Injectable,
  Optional,
  Req,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import type { Request } from 'express'
import type { TenantAwareRequest } from '../tenant/tenant.types'
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service'
import { RFMCalculator } from './rfm-calculator'
import { ABTestEngine } from './ab-test'
import { CouponIssuer } from './coupon-issuer'
import { AttributionEngine } from './attribution'
import { SegmentService } from './segment.service'
import { FrequencyCapService } from './frequency-cap.service'
import { ROICalculator } from './roi-calculator'
import { ChannelRouter } from './channel-router'
import type { TenantId, TouchPoint, CouponIssueRequest, AttributionResult } from './marketing.entity'

/**
 * Phase-42 T172: MarketingController
 *
 * 9 endpoint:
 *  POST /marketing/rfm/compute              批量计算 RFM
 *  GET  /marketing/rfm/stats                RFM 统计
 *  GET  /marketing/rfm/segments             8 分群列表
 *  POST /marketing/ab/create                创建实验
 *  POST /marketing/ab/record                记录事件
 *  GET  /marketing/ab/result                显著性计算
 *  POST /marketing/coupon/issue             发放优惠券
 *  POST /marketing/coupon/redeem            核销
 *  GET  /marketing/coupon/frequency-cap     频控检查
 *  POST /marketing/attribution/attribute     归因计算
 *  POST /marketing/roi/calculate            ROI 计算
 *  GET  /marketing/channel/route            渠道路由
 */

@UseGuards(TenantGuard)
@Controller('marketing')
@Injectable()
export class MarketingController {
  constructor(
    private readonly rfmCalculator: RFMCalculator,
    private readonly abTest: ABTestEngine,
    private readonly couponIssuer: CouponIssuer,
    private readonly attribution: AttributionEngine,
    private readonly segmentService: SegmentService,
    private readonly freqCap: FrequencyCapService,
    private readonly roiCalc: ROICalculator,
    private readonly channelRouter: ChannelRouter,
    @Optional() private readonly marketingMetricsService?: MarketingMetricsService
  ) {}

  private resolveTenantId(req?: Request, tenantIdFromBodyOrQuery?: TenantId): TenantId | undefined {
    if (tenantIdFromBodyOrQuery) {
      return tenantIdFromBodyOrQuery
    }

    const tenantAwareRequest = req as TenantAwareRequest | undefined
    const tenantIdFromContext = tenantAwareRequest?.tenantContext?.tenantId
    if (tenantIdFromContext) {
      return tenantIdFromContext
    }

    const rawHeader = req?.headers?.['x-tenant-id']
    if (typeof rawHeader === 'string' && rawHeader.trim().length > 0) {
      return rawHeader.trim()
    }
    if (Array.isArray(rawHeader) && rawHeader[0]?.trim()) {
      return rawHeader[0].trim()
    }

    return undefined
  }

  // ─── RFM ───

  @Post('rfm/compute')
  computeRFM(@Body() body: { tenantId: TenantId; memberIds?: string[] }) {
    if (body.memberIds && body.memberIds.length > 0) {
      const profiles = []
      for (const id of body.memberIds) {
        const p = this.rfmCalculator.computeForMember(body.tenantId, id)
        if (p) profiles.push(p)
      }
      return { profiles, count: profiles.length }
    }
    const profiles = this.rfmCalculator.computeForTenant(body.tenantId)
    return { profiles, count: profiles.length }
  }

  @Get('rfm/stats')
  rfmStats(@Query('tenantId') tenantId: TenantId) {
    const stats = this.segmentService.getStats(tenantId)
    const healthy = this.segmentService.isHealthy(stats)
    return { stats, healthy }
  }

  @Get('rfm/segments')
  listSegments() {
    return { segments: this.segmentService.listSegments() }
  }

  // ─── A/B ───

  @Post('ab/create')
  createExperiment(@Body() body: Omit<Parameters<ABTestEngine['createExperiment']>[0], never>) {
    const exp = this.abTest.createExperiment(body as Parameters<ABTestEngine['createExperiment']>[0])
    return { experiment: exp }
  }

  @Post('ab/record')
  recordEvent(@Body() body: { experimentId: string; memberId: string; event: 'impression' | 'click' | 'conversion'; revenueCents?: number }) {
    if (body.event === 'impression') this.abTest.recordImpression(body.experimentId, body.memberId)
    else if (body.event === 'click') this.abTest.recordClick(body.experimentId, body.memberId)
    else if (body.event === 'conversion') this.abTest.recordConversion(body.experimentId, body.memberId, body.revenueCents || 0)
    return { success: true }
  }

  @Get('ab/result')
  abResult(@Query('experimentId') experimentId: string) {
    const result = this.abTest.computeResult(experimentId)
    const canStop = this.abTest.canStopEarly(experimentId)
    // 从 engine 内部获取完整 experiment (含 pValue)
    const exp = this.abTest.getExperimentAny(experimentId)
    return { result, canStopEarly: canStop, pValue: exp?.pValue, metrics: exp?.metrics }
  }

  @Get('ab/list')
  listExperiments(@Query('tenantId') tenantId: TenantId) {
    return { experiments: this.abTest.listExperiments(tenantId) }
  }

  // ─── Coupon ───

  @Post('coupon/issue')
  issueCoupon(@Body() body: CouponIssueRequest, @Req() req?: Request) {
    const result = this.couponIssuer.issueCoupon(body)
    if (result.success) {
      this.marketingMetricsService?.incrCouponIssued(1, this.resolveTenantId(req, body.tenantId))
    }
    return result
  }

  @Post('coupon/auto-issue')
  autoIssue(@Body() body: { tenantId: TenantId; memberId: string; campaignId: string }, @Req() req?: Request) {
    const result = this.couponIssuer.autoIssue(body.tenantId, body.memberId, body.campaignId)
    if (result.success) {
      this.marketingMetricsService?.incrCouponIssued(1, this.resolveTenantId(req, body.tenantId))
    }
    return result
  }

  @Post('coupon/redeem')
  redeemCoupon(@Body() body: { tenantId: TenantId; recordId: string }, @Req() req?: Request) {
    const result = this.couponIssuer.redeemCoupon(body.tenantId, body.recordId)
    if (result?.redeemed) {
      this.marketingMetricsService?.incrCouponRedemption(false, this.resolveTenantId(req, body.tenantId))
    }
    return { success: !!result, record: result }
  }

  @Get('coupon/frequency-cap')
  freqCapStatus(@Query('tenantId') tenantId: TenantId, @Query('memberId') memberId: string, @Query('windowDays') windowDays?: string, @Query('maxPerWindow') maxPerWindow?: string) {
    return this.freqCap.checkCap(tenantId, memberId, windowDays ? parseInt(windowDays) : 7, maxPerWindow ? parseInt(maxPerWindow) : 1)
  }

  // ─── Attribution ───

  @Post('attribution/attribute')
  attribute(@Body() body: { memberId: string; conversionId: string; revenueCents: number; mode?: 'last' | 'multi' }): AttributionResult {
    if (body.mode === 'multi') {
      return this.attribution.attributeMultiTouch(body.memberId, body.conversionId, body.revenueCents)
    }
    return this.attribution.attributeLastNonDirect(body.memberId, body.conversionId, body.revenueCents)
  }

  @Post('attribution/record')
  recordTouch(@Body() body: TouchPoint) {
    return this.attribution.recordTouchPoint(body)
  }

  // ─── ROI ───

  @Post('roi/calculate')
  calculateROI(@Body() body: {
    campaignId: string
    campaignName: string
    sent: number
    clicked: number
    converted: number
    revenueCents: number
    costCents: number
    periodDays: number
  }) {
    return this.roiCalc.compute(body)
  }

  // ─── Channel ───

  @Get('channel/route')
  routeChannel(@Query('tenantId') tenantId: TenantId, @Query('memberId') memberId: string) {
    const channel = this.channelRouter.route(tenantId, memberId)
    const cost = this.channelRouter.costOf(channel)
    return { channel, costCents: cost }
  }

  // ─── Health ───

  @Get('health')
  health() {
    return { status: 'ok', module: 'marketing', timestamp: new Date().toISOString() }
  }
}
