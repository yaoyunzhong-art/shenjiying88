// marketing-metrics.dto.ts - Phase-17 T12
// 用途: 营销指标 API DTO
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEnum, IsNumber, IsObject, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// ── 计数器名称枚举 ──────────────────────────────────────────────────
export enum CounterNameEnum {
  COUPON_REDEMPTION_TOTAL = 'coupon_redemption_total',
  COUPON_ISSUED_TOTAL = 'coupon_issued_total',
  COUPON_CROSS_STORE_TOTAL = 'coupon_cross_store_total',
  CAMPAIGN_TRIGGER_TOTAL = 'campaign_trigger_total',
  CAMPAIGN_DISPATCHED_TOTAL = 'campaign_dispatched_total',
  REFERRAL_TRACK_TOTAL = 'referral_track_total',
  REFERRAL_REWARD_TOTAL = 'referral_reward_total',
  NOTIFICATION_DISPATCH_TOTAL = 'notification_dispatch_total',
  LEAD_INGEST_TOTAL = 'lead_ingest_total',
  LEAD_CLOSE_WON_TOTAL = 'lead_close_won_total',
}

// ── 递增计数器 DTO ──────────────────────────────────────────────────

export class IncrCouponRedemptionDto {
  @ApiPropertyOptional({ default: false, description: '是否为跨店核销' })
  @IsOptional()
  @IsBoolean()
  crossStore?: boolean;
}

export class IncrCouponIssuedDto {
  @ApiPropertyOptional({ default: 1, description: '发放数量' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  count?: number;
}

export class IncrCampaignTriggerDto {
  @ApiProperty({ description: '匹配数' })
  @IsNumber()
  @Min(0)
  matched!: number;

  @ApiProperty({ description: '下发数' })
  @IsNumber()
  @Min(0)
  dispatched!: number;
}

export class IncrLeadCloseWonDto {
  @ApiPropertyOptional({ default: 10000, description: '赢单金额' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;
}

export class RecordHistogramDto {
  @ApiProperty({ description: '直方图名称' })
  @IsString()
  name!: string;

  @ApiProperty({ description: '值' })
  @IsNumber()
  value!: number;
}

// ── 指标查询 DTO ─────────────────────────────────────────────────────

export class MetricsSnapshotResponseDto {
  @ApiProperty({ description: '优惠券核销总数' })
  couponRedemptionTotal!: number;

  @ApiProperty({ description: '优惠券发放总数' })
  couponIssuedTotal!: number;

  @ApiProperty({ description: '跨店核销总数' })
  couponCrossStoreTotal!: number;

  @ApiProperty({ description: '营销活动触发总数' })
  campaignTriggerTotal!: number;

  @ApiProperty({ description: '营销活动下发总数' })
  campaignDispatchedTotal!: number;

  @ApiProperty({ description: '裂变追踪总数' })
  referralTrackTotal!: number;

  @ApiProperty({ description: '裂变奖励总数' })
  referralRewardTotal!: number;

  @ApiProperty({ description: '通知发送总数' })
  notificationDispatchTotal!: number;

  @ApiProperty({ description: '线索流入总数' })
  leadIngestTotal!: number;

  @ApiProperty({ description: '赢单总数' })
  leadCloseWonTotal!: number;

  @ApiProperty({ description: 'ROI 值' })
  roi!: number;

  @ApiProperty({ description: '平均客单价' })
  avgOrderValue!: number;

  @ApiProperty({ description: '转化漏斗' })
  funnelByStage!: Record<string, number>;
}

export class PrometheusExportResponseDto {
  @ApiProperty({ description: 'Prometheus 文本' })
  text!: string;

  @ApiProperty({ description: '大小(bytes)' })
  sizeBytes!: number;
}

export class MetricTrendDto {
  @ApiProperty({ description: '指标名称' })
  @IsString()
  metricName!: string;

  @ApiProperty({ description: '时间范围起始' })
  @IsString()
  from!: string;

  @ApiProperty({ description: '时间范围结束' })
  @IsString()
  to!: string;
}

export class ResetMetricsDto {
  @ApiPropertyOptional({ description: '确认重置标记' })
  @IsOptional()
  @IsString()
  confirm?: string;
}

export class MetricsComparisonDto {
  @ApiProperty({ description: '对比基准快照标签' })
  @IsString()
  baselineLabel!: string;
}
