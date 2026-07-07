// marketing-metrics.entity.ts - Phase-17 T12
// 用途: 营销指标体系实体定义
import { MarketingMetrics } from './marketing-metrics.service';

/**
 * 营销指标快照实体
 * 封装营销 ROI 相关的一系列核心指标
 */
export interface MetricsSnapshot {
  /** 优惠券核销总数 */
  couponRedemptionTotal: number;
  /** 优惠券发放总数 */
  couponIssuedTotal: number;
  /** 跨店核销总数 */
  couponCrossStoreTotal: number;
  /** 营销活动触发总数 */
  campaignTriggerTotal: number;
  /** 营销活动下发总数 */
  campaignDispatchedTotal: number;
  /** 裂变追踪总数 */
  referralTrackTotal: number;
  /** 裂变奖励总数 */
  referralRewardTotal: number;
  /** 通知发送总数 */
  notificationDispatchTotal: number;
  /** 线索流入总数 */
  leadIngestTotal: number;
  /** 赢单总数 */
  leadCloseWonTotal: number;
  /** ROI 值 */
  roi: number;
  /** 平均客单价 */
  avgOrderValue: number;
  /** 转化漏斗 (按阶段) */
  funnelByStage: Record<string, number>;
}

/**
 * Prometheus 文本格式导出接口
 */
export interface PrometheusExport {
  text: string;
  sizeBytes: number;
}

/**
 * 指标趋势点
 */
export interface MetricsTrendPoint {
  /** 时间戳 */
  timestamp: string;
  /** 标签（如渠道、活动名） */
  label?: string;
  /** 原始值 */
  value: number;
}

/**
 * 营销指标趋势
 */
export interface MetricsTrend {
  /** 指标名称 */
  metricName: string;
  /** 趋势数据点 */
  points: MetricsTrendPoint[];
  /** 趋势方向: up / down / flat */
  direction: 'up' | 'down' | 'flat';
  /** 环比变化率 (%) */
  changeRate: number;
}

/**
 * 指标比较结果
 */
export interface MetricsComparison {
  /** 当前快照 */
  current: MetricsSnapshot;
  /** 对比基准 */
  baseline: MetricsSnapshot;
  /** 差值 */
  diff: Partial<MetricsSnapshot>;
  /** 变化率 (%) */
  changeRate: Partial<Record<keyof MetricsSnapshot, number>>;
}

/**
 * 计数器名枚举
 */
export type CounterName =
  | 'coupon_redemption_total'
  | 'coupon_issued_total'
  | 'coupon_cross_store_total'
  | 'campaign_trigger_total'
  | 'campaign_dispatched_total'
  | 'referral_track_total'
  | 'referral_reward_total'
  | 'notification_dispatch_total'
  | 'lead_ingest_total'
  | 'lead_close_won_total';

/**
 * 直方图名枚举
 */
export type HistogramName =
  | 'lead_won_amount'
  | 'order_value'
  | 'campaign_response_time';
