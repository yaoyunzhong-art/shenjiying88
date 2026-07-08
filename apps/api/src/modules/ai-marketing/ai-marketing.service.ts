/**
 * ai-marketing.service.ts — AI 营销 Service 主入口
 *
 * 统一暴露 MarketingROIService / CopywritingAssistant / CampaignPlanner / AIMarketingCMOService
 * 提供聚合查询、批量分析和统计聚合功能。
 */

import { Injectable } from '@nestjs/common'
import {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
  AIMarketingCMOService,
} from './ai-marketing-cmo.service'
import type { ROIResult, GeneratedCopy, ReachEstimate, BudgetAllocation, TimelineMilestone, CampaignType, CampaignConfig, CopyBrief, Channel, Locale } from './ai-marketing-cmo.service'

@Injectable()
export class AiMarketingService {
  constructor(
    private readonly roiService: MarketingROIService,
    private readonly copywritingService: CopywritingAssistant,
    private readonly campaignPlanner: CampaignPlanner,
    private readonly cmoService: AIMarketingCMOService,
  ) {}

  /**
   * 计算单个活动 ROI
   */
  calculateCampaignROI(campaignId: string): ROIResult | null {
    return this.roiService.calculateCampaignROI(campaignId)
  }

  /**
   * 比较多个活动 ROI
   */
  compareCampaigns(campaignIds: string[]): ROIResult[] {
    return this.roiService.compareCampaigns(campaignIds)
  }

  /**
   * 预测新活动 ROI
   */
  projectROI(config: CampaignConfig) {
    return this.roiService.projectROI(config)
  }

  /**
   * 获取最优预算分配
   */
  getOptimalBudget(campaignType: CampaignType, totalBudget: number): BudgetAllocation[] {
    return this.roiService.getOptimalBudget(campaignType, totalBudget)
  }

  /**
   * 生成营销文案
   */
  generateCopy(brief: CopyBrief): GeneratedCopy {
    return this.copywritingService.generateCopy(brief)
  }

  /**
   * 优化标题
   */
  optimizeHeadline(headline: string): string {
    return this.copywritingService.optimizeHeadline(headline)
  }

  /**
   * 本地化文案
   */
  localizeCopy(
    content: { headline: string; body: string; cta: string; taglines: string[] },
    locale: string,
  ) {
    return this.copywritingService.localizeCopy(content, locale as Locale)
  }

  /**
   * 生成 A/B 测试变体
   */
  generateABTestVariants(brief: CopyBrief, count: number): GeneratedCopy[] {
    return this.copywritingService.abTestVariants(brief, count)
  }

  /**
   * 推荐活动类型
   */
  suggestCampaignType(goal: 'awareness' | 'conversion' | 'retention' | 'brand', budget: number, audience: number) {
    return this.campaignPlanner.suggestCampaignType(goal, budget, String(audience))
  }

  /**
   * 规划活动时间线
   */
  planCampaignTimeline(goal: string): TimelineMilestone[] {
    return this.campaignPlanner.planCampaignTimeline(goal as 'awareness' | 'conversion' | 'retention')
  }

  /**
   * 预估触达人数
   */
  estimateReach(audience: number, channel: Channel): ReachEstimate {
    return this.campaignPlanner.estimateReach(audience, channel)
  }

  /**
   * 营销综合分析（聚合多个子服务结果）
   */
  analyzeMarketing(campaignId: string, options?: {
    includeROI?: boolean
    includeTimeline?: boolean
    includeReach?: boolean
  }) {
    const roi = options?.includeROI !== false
      ? this.roiService.calculateCampaignROI(campaignId)
      : undefined
    const timeline = options?.includeTimeline
      ? this.campaignPlanner.planCampaignTimeline('conversion')
      : undefined
    const reach = options?.includeReach
      ? [
          this.campaignPlanner.estimateReach(50000, 'wechat' as Channel),
          this.campaignPlanner.estimateReach(50000, 'douyin' as Channel),
        ]
      : undefined

    return {
      campaignId,
      campaignName: `Campaign-${campaignId}`,
      roi,
      timeline,
      reach,
      analyzedAt: new Date().toISOString(),
    }
  }

  /**
   * 获取模块概览统计
   */
  getModuleStats(): {
    totalCampaigns: number
    totalRevenue: number
    totalCost: number
    averageROI: number
    positiveCampaigns: number
    negativeCampaigns: number
  } {
    const knownIds = ['camp-001', 'camp-002', 'camp-003', 'camp-004', 'camp-005']
    let totalRevenue = 0
    let totalCost = 0
    let positiveCount = 0
    let negativeCount = 0

    for (const id of knownIds) {
      const result = this.roiService.calculateCampaignROI(id)
      if (result) {
        totalRevenue += result.revenue
        totalCost += result.cost
        if (result.isPositive) positiveCount++
        else negativeCount++
      }
    }

    const averageROI = totalCost > 0
      ? Math.round(((totalRevenue - totalCost) / totalCost) * 10000) / 100
      : 0

    return {
      totalCampaigns: knownIds.length,
      totalRevenue,
      totalCost,
      averageROI,
      positiveCampaigns: positiveCount,
      negativeCampaigns: negativeCount,
    }
  }
}

export {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
  AIMarketingCMOService,
}
