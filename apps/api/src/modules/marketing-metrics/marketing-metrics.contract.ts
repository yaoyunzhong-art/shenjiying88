// marketing-metrics.contract.ts - Phase-17 T12
// 用途: 营销指标模块跨模块合约定义
import type {
  MetricsSnapshot,
  PrometheusExport,
  CounterName,
  HistogramName,
} from './marketing-metrics.entity';
import type { MarketingMetrics } from './marketing-metrics.service';

// ── 跨模块安全合约类型 ──────────────────────────────────────────────

/**
 * 营销指标快照合约（跨模块安全子集）
 */
export interface MetricsSnapshotContract {
  couponRedemptionTotal: number;
  couponIssuedTotal: number;
  couponCrossStoreTotal: number;
  campaignTriggerTotal: number;
  campaignDispatchedTotal: number;
  referralTrackTotal: number;
  referralRewardTotal: number;
  notificationDispatchTotal: number;
  leadIngestTotal: number;
  leadCloseWonTotal: number;
  roi: number;
  avgOrderValue: number;
  funnelByStage: Record<string, number>;
}

/**
 * Prometheus 导出合约
 */
export interface PrometheusExportContract {
  text: string;
  sizeBytes: number;
}

/**
 * 计数器值合约
 */
export interface CounterValueContract {
  name: CounterName;
  value: number;
}

/**
 * 指标趋势点合约
 */
export interface MetricsTrendPointContract {
  timestamp: string;
  label?: string;
  value: number;
}

/**
 * 营销指标概要合约（给其他模块消费的聚合结果）
 */
export interface MarketingMetricsSummaryContract {
  roi: number;
  avgOrderValue: number;
  activeCampaigns: number;
  couponRedemptionRate: number;
  leadConversionRate: number;
  totalRevenue: number;
  totalCost: number;
}

// ── 转换函数 ─────────────────────────────────────────────────────────

/**
 * 将内部 MetricsSnapshot 转换为跨模块合约
 */
export function toMetricsSnapshotContract(snapshot: MetricsSnapshot): MetricsSnapshotContract {
  return {
    couponRedemptionTotal: snapshot.couponRedemptionTotal,
    couponIssuedTotal: snapshot.couponIssuedTotal ?? 0,
    couponCrossStoreTotal: snapshot.couponCrossStoreTotal ?? 0,
    campaignTriggerTotal: snapshot.campaignTriggerTotal,
    campaignDispatchedTotal: snapshot.campaignDispatchedTotal ?? 0,
    referralTrackTotal: snapshot.referralTrackTotal,
    referralRewardTotal: snapshot.referralRewardTotal ?? 0,
    notificationDispatchTotal: snapshot.notificationDispatchTotal,
    leadIngestTotal: snapshot.leadIngestTotal ?? 0,
    leadCloseWonTotal: snapshot.leadCloseWonTotal ?? 0,
    roi: snapshot.roi,
    avgOrderValue: snapshot.avgOrderValue,
    funnelByStage: snapshot.funnelByStage,
  };
}

/**
 * 将内部 PrometheusExport 转换为跨模块合约
 */
export function toPrometheusExportContract(exp: PrometheusExport): PrometheusExportContract {
  return {
    text: exp.text,
    sizeBytes: exp.sizeBytes,
  };
}

/**
 * 将内部 MarketingMetrics 汇总为跨模块概要合约
 */
export function toMarketingMetricsSummary(
  internal: MarketingMetrics,
  issuedCount: number,
): MarketingMetricsSummaryContract {
  const couponRedemptionRate = issuedCount > 0
    ? internal.couponRedemptionTotal / issuedCount
    : 0;
  const leadConversionRate = internal.leadIngestTotal > 0
    ? internal.leadCloseWonTotal / internal.leadIngestTotal
    : 0;
  const totalCost = issuedCount * 5 + internal.notificationDispatchTotal * 0.1;
  const totalRevenue = internal.leadCloseWonTotal * internal.avgOrderValue;
  return {
    roi: internal.roi,
    avgOrderValue: internal.avgOrderValue,
    activeCampaigns: internal.campaignTriggerTotal,
    couponRedemptionRate,
    leadConversionRate,
    totalRevenue,
    totalCost,
  };
}
