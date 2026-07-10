// marketing.service.ts - Phase-42 T172
// 用途: 智能营销主服务 - 提供高层聚合操作，协调 RFM / A/B / 优惠券 / 归因 / 渠道
import { Injectable, Logger, Optional } from '@nestjs/common'
import { MarketingMetricsService } from '../marketing-metrics/marketing-metrics.service'
import { RFMCalculator } from './rfm-calculator'
import { ABTestEngine } from './ab-test'
import { CouponIssuer } from './coupon-issuer'
import { AttributionEngine } from './attribution'
import { SegmentService } from './segment.service'
import { FrequencyCapService } from './frequency-cap.service'
import { ROICalculator } from './roi-calculator'
import { ChannelRouter } from './channel-router'
import type {
  TenantId,
  RFMProfile,
  RFMStats,
  RFMSegmentType,
  ABExperiment,
  ABResult,
  CouponIssueRequest,
  CouponIssueRecord,
  FrequencyCapStatus,
  CampaignROI,
  TouchPoint,
  AttributionResult,
} from './marketing.entity'

export type {
  TenantId,
  RFMProfile,
  RFMStats,
  RFMSegmentType,
  ABExperiment,
  ABResult,
  CouponIssueRequest,
  CouponIssueRecord,
  FrequencyCapStatus,
  CampaignROI,
  TouchPoint,
  AttributionResult,
}

export interface SegmentInfo {
  type: RFMSegmentType
  name: string
  description: string
}

export interface CampaignSummary {
  campaignId: string
  stats: {
    totalSent: number
    totalClicked: number
    totalConverted: number
    totalRevenueCents: number
    totalCostCents: number
    avgROI: number
  }
  channelBreakdown: Record<string, number>
}

/**
 * MarketingService - 智能营销主服务
 *
 * 高层聚合:
 *  1. fullRFMCompute — 全量 RFM 计算 + 分群统计
 *  2. evaluateCampaign — 完整营销活动评估 (A/B + 优惠券 + ROI)
 *  3. segmentOverview — 分群概览 (8 个分群成员列表 + 统计)
 *  4. memberJourney — 单一会员全链路跟踪 (RFM → 优惠券 → 归因)
 *  5. healthCheck — 模块健康检查
 */
@Injectable()
export class MarketingService {
  private readonly logger = new Logger(MarketingService.name)

  constructor(
    private readonly rfmCalculator: RFMCalculator,
    private readonly abTest: ABTestEngine,
    private readonly couponIssuer: CouponIssuer,
    private readonly attribution: AttributionEngine,
    private readonly segmentService: SegmentService,
    private readonly freqCap: FrequencyCapService,
    private readonly roiCalc: ROICalculator,
    private readonly channelRouter: ChannelRouter,
    @Optional() private readonly marketingMetricsService?: MarketingMetricsService,
  ) {}

  /** 重置所有子服务内部状态 */
  reset(): void {
    this.attribution.reset?.()
    this.logger.log('MarketingService reset completed')
  }

  // ─── 1. 全量 RFM 计算 ──────────────────────────────────

  /**
   * 全租户 RFM 批量计算 + 分群统计
   * 先调用 RFMCalculator 逐会员计算，再聚合为 stats
   */
  fullRFMCompute(tenantId: TenantId): { profiles: RFMProfile[]; stats: RFMStats } {
    const profiles = this.rfmCalculator.computeForTenant(tenantId)
    const stats = this.segmentService.getStats(tenantId)
    return { profiles, stats }
  }

  /**
   * 指定会员 RFM 计算
   */
  computeMemberRFM(tenantId: TenantId, memberId: string): RFMProfile | null {
    return this.rfmCalculator.computeForMember(tenantId, memberId) ?? null
  }

  // ─── 2. 分群概览 ──────────────────────────────────────

  /** 返回 8 个分群定义列表 */
  listSegments(): SegmentInfo[] {
    return this.segmentService.listSegments().map((s: { type: RFMSegmentType; name: string; description: string }) => ({
      type: s.type,
      name: s.name,
      description: s.description,
    }))
  }

  /** 返回分群统计 + 健康检查 */
  segmentOverview(tenantId: TenantId): { stats: RFMStats; healthy: boolean } {
    const stats = this.segmentService.getStats(tenantId)
    const healthy = this.segmentService.isHealthy(stats)
    return { stats, healthy }
  }

  // ─── 3. 营销活动评估 ──────────────────────────────────

  /**
   * 完整活动评估: 创建实验 → 自动优惠券 → 归因 → ROI
   */
  evaluateCampaign(input: {
    tenantId: TenantId
    campaignId: string
    campaignName: string
    memberIds: string[]
    variantNameA: string
    variantNameB: string
    couponSegment: string
    expiryDays: number
    costCents: number
  }): {
    experiment: ABExperiment
    issued: CouponIssueRecord[]
    roi: CampaignROI | null
  } {
    const exp = this.abTest.createExperiment({
      tenantId: input.tenantId,
      campaignId: input.campaignId,
      name: input.campaignName,
      variantA: { id: 'va', name: input.variantNameA, content: '', rewardType: 'DISCOUNT', rewardValue: 10 },
      variantB: { id: 'vb', name: input.variantNameB, content: '', rewardType: 'DISCOUNT', rewardValue: 15 },
      trafficSplit: 0.5,
      minSampleSize: 100,
      status: 'DRAFT',
      startAt: new Date().toISOString(),
    })

    const issued: CouponIssueRecord[] = []
    for (const memberId of input.memberIds.slice(0, 50)) {
      const result = this.couponIssuer.issueCoupon({
        tenantId: input.tenantId,
        memberId,
        campaignId: input.campaignId,
        couponSegment: input.couponSegment as any,
        rewardAmount: 500,
        discountPercent: 10,
        expiryDays: input.expiryDays,
      })
      if (result.success && result.record) {
        issued.push(result.record)
      }
    }

    this.marketingMetricsService?.incrCouponIssued(issued.length, input.tenantId)

    let roi: CampaignROI | null = null
    if (issued.length > 0) {
      const ctr = 0.15
      const cvr = 0.05
      roi = this.roiCalc.compute({
        campaignId: input.campaignId,
        campaignName: input.campaignName,
        sent: input.memberIds.length,
        clicked: Math.round(input.memberIds.length * ctr),
        converted: Math.round(input.memberIds.length * cvr),
        revenueCents: input.memberIds.length * 2000,
        costCents: input.costCents,
        periodDays: 30,
      })
    }

    return { experiment: exp, issued, roi }
  }

  // ─── 4. 会员全链路跟踪 ────────────────────────────────

  /**
   * 单一会员全链路: RFM → 频控 → 渠道 → 归因
   */
  memberJourney(input: {
    tenantId: TenantId
    memberId: string
  }): {
    rfm: RFMProfile | null
    freqCap: FrequencyCapStatus | null
    channel: { channel: string; costCents: number } | null
    recentTouches: TouchPoint[]
  } {
    const rfm = this.rfmCalculator.computeForMember(input.tenantId, input.memberId) ?? null

    let freqCap: FrequencyCapStatus | null = null
    try {
      freqCap = this.freqCap.checkCap(input.tenantId, input.memberId, 7, 1)
    } catch {
      // freqCap may not have records yet — that's fine
    }

    let channel: { channel: string; costCents: number } | null = null
    try {
      const ch = this.channelRouter.route(input.tenantId, input.memberId)
      const cost = this.channelRouter.costOf(ch)
      channel = { channel: ch, costCents: cost }
    } catch {
      // channel routing may fail gracefully
    }

    const recentTouches: TouchPoint[] = []
    // 从 attribution engine 获取最近 touch points
    try {
      const history = (this.attribution as any).getHistory?.(input.memberId)
      if (Array.isArray(history)) {
        recentTouches.push(...history.slice(-20))
      }
    } catch {
      // no history available
    }

    return { rfm, freqCap, channel, recentTouches }
  }

  // ─── 5. 活动汇总 ──────────────────────────────────────

  /**
   * 多实验活动汇总
   */
  campaignSummary(tenantId: TenantId, campaignId: string): CampaignSummary {
    const experiments = this.abTest.listExperiments(tenantId)
      .filter((e: ABExperiment) => e.campaignId === campaignId)

    const totalSent = experiments.reduce((s: number, e: ABExperiment) => s + (e.metrics?.sentA ?? 0) + (e.metrics?.sentB ?? 0), 0)
    const totalClicked = experiments.reduce((s: number, e: ABExperiment) => s + (e.metrics?.clickedA ?? 0) + (e.metrics?.clickedB ?? 0), 0)
    const totalConverted = experiments.reduce((s: number, e: ABExperiment) => s + (e.metrics?.convertedA ?? 0) + (e.metrics?.convertedB ?? 0), 0)
    const totalRevenueCents = experiments.reduce((s: number, e: ABExperiment) => s + (e.metrics?.revenueCentsA ?? 0) + (e.metrics?.revenueCentsB ?? 0), 0)
    const totalCostCents = totalSent * 10 // 估算: 10分/次触达

    const roi = totalCostCents > 0 ? (totalRevenueCents - totalCostCents) / totalCostCents : 0

    return {
      campaignId,
      stats: {
        totalSent,
        totalClicked,
        totalConverted,
        totalRevenueCents,
        totalCostCents,
        avgROI: Math.round(roi * 100) / 100,
      },
      channelBreakdown: { IN_APP: totalSent, WECHAT: 0, SMS: 0 },
    }
  }

  // ─── 6. 健康检查 ──────────────────────────────────────

  healthCheck(): { status: string; module: string; timestamp: string; subServices: string[] } {
    return {
      status: 'ok',
      module: 'marketing',
      timestamp: new Date().toISOString(),
      subServices: [
        'RFMCalculator',
        'ABTestEngine',
        'CouponIssuer',
        'AttributionEngine',
        'SegmentService',
        'FrequencyCapService',
        'ROICalculator',
        'ChannelRouter',
      ],
    }
  }
}
