// marketing-metrics.controller.ts - Phase-17 T12
// 用途: 营销指标 API 端点
import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import type { Request } from 'express';
import type { TenantAwareRequest } from '../tenant/tenant.types';
import { MarketingMetricsService } from './marketing-metrics.service';
import type { MetricsSnapshot, PrometheusExport } from './marketing-metrics.entity';
import {
  IncrCouponRedemptionDto,
  IncrCouponIssuedDto,
  IncrCampaignTriggerDto,
  IncrLeadCloseWonDto,
  RecordHistogramDto,
} from './marketing-metrics.dto';

@UseGuards(TenantGuard)
@Controller('marketing-metrics')
export class MarketingMetricsController {
  constructor(private readonly metricsService: MarketingMetricsService) {}

  private resolveTenantId(req?: Request): string | undefined {
    const tenantAwareRequest = req as TenantAwareRequest | undefined;
    const tenantIdFromContext = tenantAwareRequest?.tenantContext?.tenantId?.trim();
    if (tenantIdFromContext) {
      return tenantIdFromContext;
    }

    const rawHeader = req?.headers?.['x-tenant-id'];
    if (typeof rawHeader === 'string' && rawHeader.trim().length > 0) {
      return rawHeader.trim();
    }

    if (Array.isArray(rawHeader) && rawHeader[0]?.trim()) {
      return rawHeader[0].trim();
    }

    return undefined;
  }

  /**
   * GET /marketing-metrics/snapshot
   * 获取当前营销指标快照
   */
  @Get('snapshot')
  getSnapshot(@Req() req?: Request): MetricsSnapshot {
    return this.metricsService.snapshot(this.resolveTenantId(req));
  }

  /**
   * GET /marketing-metrics/prometheus
   * 导出 Prometheus 格式指标
   */
  @Get('prometheus')
  getPrometheus(@Req() req?: Request): PrometheusExport {
    const text = this.metricsService.toPrometheus(this.resolveTenantId(req));
    return {
      text,
      sizeBytes: Buffer.byteLength(text, 'utf-8'),
    };
  }

  /**
   * POST /marketing-metrics/coupon/redemption
   * 记录一次优惠券核销
   */
  @Post('coupon/redemption')
  recordCouponRedemption(@Body() dto: IncrCouponRedemptionDto, @Req() req?: Request): { success: boolean } {
    this.metricsService.incrCouponRedemption(dto.crossStore ?? false, this.resolveTenantId(req));
    return { success: true };
  }

  /**
   * POST /marketing-metrics/coupon/issued
   * 记录优惠券发放
   */
  @Post('coupon/issued')
  recordCouponIssued(@Body() dto: IncrCouponIssuedDto, @Req() req?: Request): { success: boolean } {
    this.metricsService.incrCouponIssued(dto.count ?? 1, this.resolveTenantId(req));
    return { success: true };
  }

  /**
   * POST /marketing-metrics/campaign/trigger
   * 记录营销活动触发
   */
  @Post('campaign/trigger')
  recordCampaignTrigger(@Body() dto: IncrCampaignTriggerDto, @Req() req?: Request): { success: boolean } {
    this.metricsService.incrCampaignTrigger(dto.matched, dto.dispatched, this.resolveTenantId(req));
    return { success: true };
  }

  /**
   * POST /marketing-metrics/referral/track
   * 记录裂变追踪
   */
  @Post('referral/track')
  recordReferralTrack(@Req() req?: Request): { success: boolean } {
    this.metricsService.incrReferralTrack(this.resolveTenantId(req));
    return { success: true };
  }

  /**
   * POST /marketing-metrics/referral/reward
   * 记录裂变奖励发放
   */
  @Post('referral/reward')
  recordReferralReward(@Req() req?: Request): { success: boolean } {
    this.metricsService.incrReferralReward(this.resolveTenantId(req));
    return { success: true };
  }

  /**
   * POST /marketing-metrics/notification/dispatch
   * 记录通知下发
   */
  @Post('notification/dispatch')
  recordNotificationDispatch(@Req() req?: Request): { success: boolean } {
    this.metricsService.incrNotificationDispatch(this.resolveTenantId(req));
    return { success: true };
  }

  /**
   * POST /marketing-metrics/lead/ingest
   * 记录线索流入
   */
  @Post('lead/ingest')
  recordLeadIngest(@Req() req?: Request): { success: boolean } {
    this.metricsService.incrLeadIngest(this.resolveTenantId(req));
    return { success: true };
  }

  /**
   * POST /marketing-metrics/lead/close-won
   * 记录赢单
   */
  @Post('lead/close-won')
  recordLeadCloseWon(@Body() dto: IncrLeadCloseWonDto, @Req() req?: Request): { success: boolean } {
    this.metricsService.incrLeadCloseWon(dto.amount ?? 10000, this.resolveTenantId(req));
    return { success: true };
  }

  /**
   * POST /marketing-metrics/histogram
   * 记录直方图数据点
   */
  @Post('histogram')
  recordHistogram(@Body() dto: RecordHistogramDto, @Req() req?: Request): { success: boolean } {
    this.metricsService.recordHistogram(dto.name, dto.value, this.resolveTenantId(req));
    return { success: true };
  }

  /**
   * POST /marketing-metrics/reset
   * 重置所有指标计数器
   */
  @Post('reset')
  resetMetrics(@Req() req?: Request): { success: boolean } {
    this.metricsService.reset(this.resolveTenantId(req));
    return { success: true };
  }
}
