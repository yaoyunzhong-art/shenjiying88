/**
 * ai-marketing-campaign-optimizer.service.ts — 活动优化引擎
 *
 * 提供基于机器学习(模拟)的自动化活动优化：
 * - 智能竞价优化
 * - 受众定向优化
 * - 创意优选
 * - 跨渠道频控
 * - 实时出价调整
 */
import { Injectable } from '@nestjs/common'

export interface CampaignPerformance {
  campaignId: string
  currentROI: number
  currentSpend: number
  currentRevenue: number
  currentConversions: number
  currentCVR: number
  trend: 'improving' | 'stable' | 'declining'
  optimizationScore: number
}

export interface BidOptimizationResult {
  currentBid: number
  suggestedBid: number
  expectedImpressions: number
  expectedConversions: number
  expectedCost: number
  expectedROI: number
  confidence: number
}

export interface AudienceSegmentRecommendation {
  segmentName: string
  segmentSize: number
  predictedCVR: number
  predictedROI: number
  recommendedBid: number
  reason: string
}

export interface CreativePerformance {
  creativeId: string
  type: 'image' | 'video' | 'text' | 'carousel'
  impressions: number
  clicks: number
  ctr: number
  conversions: number
  cvr: number
  spend: number
  roas: number
  status: 'active' | 'underperforming' | 'paused'
}

export interface FrequencyCapRecommendation {
  currentFrequency: number
  recommendedDailyCap: number
  recommendedWeeklyCap: number
  saturationPoint: number
  expectedCTRAtCap: number
}

export interface BudgetPacing {
  totalBudget: number
  dailyBudget: number
  spentToday: number
  remaining: number
  daysRemaining: number
  recommendedDailyBudget: number
  pacing: 'ahead' | 'behind' | 'on_track'
  adjustment: 'increase' | 'decrease' | 'maintain'
}

export interface RealTimeBidAdvice {
  currentBid: number
  suggestedBid: number
  minBid: number
  maxBid: number
  winRate: number
  avgPosition: number
  competition: 'low' | 'medium' | 'high'
  timeOfDay: string
  deviceType: 'mobile' | 'desktop' | 'tablet'
}

export interface ChannelFrequencyReport {
  channel: string
  totalReach: number
  averageFrequency: number
  effectiveReach: number
  costPerEffectiveReach: number
  frequencyDistribution: Array<{ times: number; percentage: number }>
  recommendation: string
}

@Injectable()
export class CampaignOptimizerService {
  /**
   * 获取活动性能概览
   */
  getCampaignPerformance(campaignId: string): CampaignPerformance {
    // Simulated performance data
    const random = (min: number, max: number) => Math.round((Math.random() * (max - min) + min) * 100) / 100

    const currentSpend = random(5000, 50000)
    const currentRevenue = random(10000, 150000)
    const conversions = Math.round(random(50, 500))
    const cvr = random(1, 5)
    const roi = currentSpend > 0 ? Math.round((currentRevenue / currentSpend) * 100) / 100 : 0
    const trends: Array<'improving' | 'stable' | 'declining'> = ['improving', 'stable', 'declining']
    const trend = trends[Math.floor(Math.random() * trends.length)]
    const optimizationScore = Math.round(random(40, 95))

    return {
      campaignId,
      currentROI: roi,
      currentSpend,
      currentRevenue,
      currentConversions: conversions,
      currentCVR: cvr,
      trend,
      optimizationScore,
    }
  }

  /**
   * 智能竞价优化
   * 基于历史竞得率和竞争环境调整出价
   */
  optimizeBid(
    campaignId: string,
    currentBid: number,
    dailyBudget: number,
    targetCPA: number
  ): BidOptimizationResult {
    const competitionFactor = 0.7 + Math.random() * 0.6
    const winRate = Math.min(0.95, Math.max(0.1, (currentBid / targetCPA) * competitionFactor))

    // Adjust bid based on performance
    let suggestedBid: number
    if (winRate < 0.3) {
      // Low win rate, increase bid
      suggestedBid = Math.round(currentBid * (1.2 + Math.random() * 0.3) * 100) / 100
    } else if (winRate > 0.8) {
      // High win rate, can lower bid
      suggestedBid = Math.round(currentBid * (0.85 + Math.random() * 0.1) * 100) / 100
    } else {
      suggestedBid = currentBid
    }

    const expectedImpressions = Math.round((dailyBudget / suggestedBid) * 100 * (0.8 + Math.random() * 0.4))
    const expectedConversions = Math.round(expectedImpressions * 0.01 * (0.8 + Math.random() * 0.4))
    const expectedCost = Math.round(expectedImpressions * suggestedBid / 100)
    const expectedRevenue = Math.round(expectedConversions * targetCPA * 2.5)
    const expectedROI = expectedCost > 0 ? Math.round((expectedRevenue / expectedCost) * 100) / 100 : 0
    const confidence = Math.round((40 + Math.random() * 50) * 100) / 100

    return {
      currentBid,
      suggestedBid: Math.min(10, Math.max(0.1, suggestedBid)),
      expectedImpressions,
      expectedConversions,
      expectedCost,
      expectedROI,
      confidence,
    }
  }

  /**
   * 受众分群推荐
   * 基于历史转化数据推荐最优受众定向
   */
  recommendAudienceSegments(campaignId: string): AudienceSegmentRecommendation[] {
    const segments: Array<{
      name: string
      baseSize: number
      baseCVR: number
      baseROI: number
      reason: string
    }> = [
      { name: '高价值活跃会员', baseSize: 15000, baseCVR: 4.5, baseROI: 5.2, reason: '历史转化率高，客单价高' },
      { name: '近期浏览未购买', baseSize: 35000, baseCVR: 3.2, baseROI: 3.8, reason: '有购买意向，转化窗口期' },
      { name: '新注册用户', baseSize: 80000, baseCVR: 1.8, baseROI: 2.1, reason: '拉新目标，首单转化激励' },
      { name: '沉睡会员召回', baseSize: 50000, baseCVR: 0.8, baseROI: 1.5, reason: '唤醒成本低，品牌认知基础' },
      { name: '竞品关注人群', baseSize: 25000, baseCVR: 1.2, baseROI: 1.8, reason: '竞品截流，精准打击' },
      { name: '地域定向人群', baseSize: 120000, baseCVR: 1.5, baseROI: 2.0, reason: 'LBS定向，门店引流' },
    ]

    return segments.map((s) => {
      const noise = 0.8 + Math.random() * 0.4
      return {
        segmentName: s.name,
        segmentSize: Math.round(s.baseSize * noise),
        predictedCVR: Math.round(s.baseCVR * noise * 100) / 100,
        predictedROI: Math.round(s.baseROI * noise * 100) / 100,
        recommendedBid: Math.round((1.0 + Math.random() * 2.0) * 100) / 100,
        reason: s.reason,
      }
    }).sort((a, b) => b.predictedROI - a.predictedROI)
  }

  /**
   * 创意素材性能对比
   */
  getCreativePerformance(creativeIds: string[]): CreativePerformance[] {
    const types: Array<'image' | 'video' | 'text' | 'carousel'> = ['image', 'video', 'text', 'carousel']

    return creativeIds.map((id, idx) => {
      const type = types[idx % types.length]
      const impressions = Math.round(10000 + Math.random() * 100000)
      const clicks = Math.round(impressions * (0.01 + Math.random() * 0.05))
      const ctr = impressions > 0 ? Math.round((clicks / impressions) * 10000) / 100 : 0
      const conversions = Math.round(clicks * (0.02 + Math.random() * 0.08))
      const cvr = clicks > 0 ? Math.round((conversions / clicks) * 10000) / 100 : 0
      const spend = Math.round(impressions / 1000 * (20 + Math.random() * 80))
      const roas = spend > 0 ? Math.round((conversions * (50 + Math.random() * 100) / spend) * 100) / 100 : 0
      const status: 'active' | 'underperforming' | 'paused' =
        roas > 2.0 ? 'active' : roas > 0.5 ? 'underperforming' : 'paused'

      return { creativeId: id, type, impressions, clicks, ctr, conversions, cvr, spend, roas, status }
    })
  }

  /**
   * 频控建议
   * 基于用户疲劳度和转化率衰减曲线推荐频控设置
   */
  recommendFrequencyCap(campaignId: string): FrequencyCapRecommendation {
    const currentFreq = Math.round((1.5 + Math.random() * 3.5) * 10) / 10
    const saturationPoint = Math.round((4 + Math.random() * 3) * 10) / 10
    const dailyCap = Math.round(saturationPoint * 0.6)
    const weeklyCap = Math.round(saturationPoint * 2.5)
    const expectedCTR = Math.round(Math.max(0.1, 1.5 - saturationPoint * 0.15) * 100) / 100

    return {
      currentFrequency: currentFreq,
      recommendedDailyCap: dailyCap,
      recommendedWeeklyCap: weeklyCap,
      saturationPoint,
      expectedCTRAtCap: expectedCTR,
    }
  }

  /**
   * 预算消耗节奏分析
   */
  analyzeBudgetPacing(
    totalBudget: number,
    startDate: string,
    endDate: string,
    spentToDate: number,
    elapsedDays: number
  ): BudgetPacing {
    const totalDays = Math.max(1, Math.round(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86400000
    ))
    const remainingDays = Math.max(0, totalDays - elapsedDays)
    const dailyBudget = Math.round(totalBudget / totalDays)
    const expectedSpent = dailyBudget * elapsedDays
    const remaining = totalBudget - spentToDate
    const recommendedDailyBudget = remainingDays > 0 ? Math.round(remaining / remainingDays) : 0

    let pacing: 'ahead' | 'behind' | 'on_track'
    let adjustment: 'increase' | 'decrease' | 'maintain'

    if (spentToDate > expectedSpent * 1.15) {
      pacing = 'ahead'
      adjustment = 'decrease'
    } else if (spentToDate < expectedSpent * 0.85) {
      pacing = 'behind'
      adjustment = 'increase'
    } else {
      pacing = 'on_track'
      adjustment = 'maintain'
    }

    return {
      totalBudget,
      dailyBudget,
      spentToday: Math.round(spentToDate / Math.max(1, elapsedDays)),
      remaining,
      daysRemaining: remainingDays,
      recommendedDailyBudget,
      pacing,
      adjustment,
    }
  }

  /**
   * 实时竞价建议
   */
  getRealTimeBidAdvice(campaignId: string, currentBid: number): RealTimeBidAdvice {
    const now = new Date()
    const hour = now.getHours()
    const timePeriods = ['early_morning', 'morning', 'afternoon', 'evening', 'night']
    const period = timePeriods[hour < 6 ? 0 : hour < 10 ? 1 : hour < 14 ? 2 : hour < 20 ? 3 : 4]

    const competitionLevels: Record<string, 'low' | 'medium' | 'high'> = {
      early_morning: 'low',
      morning: 'high',
      afternoon: 'medium',
      evening: 'high',
      night: 'low',
    }

    const competition = competitionLevels[period]
    const winRate = competition === 'low' ? 0.8 + Math.random() * 0.15 :
                    competition === 'medium' ? 0.5 + Math.random() * 0.2 :
                    0.2 + Math.random() * 0.2

    const multiplier = competition === 'high' ? 1.3 : competition === 'medium' ? 1.0 : 0.8
    const suggestedBid = Math.round(currentBid * multiplier * 100) / 100
    const minBid = Math.round(currentBid * 0.6 * 100) / 100
    const maxBid = Math.round(currentBid * 1.5 * 100) / 100

    return {
      currentBid,
      suggestedBid: Math.max(minBid, Math.min(maxBid, suggestedBid)),
      minBid,
      maxBid,
      winRate: Math.round(winRate * 100) / 100,
      avgPosition: Math.round((1 + Math.random() * 3) * 100) / 100,
      competition,
      timeOfDay: period,
      deviceType: 'mobile',
    }
  }

  /**
   * 跨渠道频控报告
   */
  getChannelFrequencyReport(channels: string[]): ChannelFrequencyReport[] {
    return channels.map(channel => {
      const totalReach = Math.round(50000 + Math.random() * 200000)
      const avgFreq = Math.round((1.5 + Math.random() * 4) * 10) / 10
      const effectiveReach = Math.round(totalReach * Math.max(0.3, 1 - avgFreq * 0.1))
      const costPerEffReach = Math.round((5 + Math.random() * 20) * 100) / 100

      const dist: Array<{ times: number; percentage: number }> = []
      let remaining = 100
      for (let i = 1; i <= 6 && remaining > 0; i++) {
        const pct = i < 6 ? Math.round(Math.min(remaining, (40 - i * 5 + Math.random() * 10)) * 10) / 10 : remaining
        dist.push({ times: i, percentage: pct })
        remaining -= pct
      }

      return {
        channel,
        totalReach,
        averageFrequency: avgFreq,
        effectiveReach,
        costPerEffectiveReach: costPerEffReach,
        frequencyDistribution: dist,
        recommendation: avgFreq > 5
          ? `建议降低${channel}频次，当前平均${avgFreq}次过高，可能导致用户疲劳`
          : avgFreq > 3
            ? `${channel}频次适中，可维持当前设置`
            : `${channel}频次偏低，可适当增加触达频次`,
      }
    })
  }

  /**
   * COST-PER-ACTION (CPA) 优化建议
   */
  optimizeCPA(
    currentCPA: number,
    targetCPA: number,
    conversionRate: number,
    averageOrderValue: number
  ): { recommendedCPA: number; savings: number; expectedConversions: number } {
    // If current is already below target, maintain
    if (currentCPA <= targetCPA) {
      return {
        recommendedCPA: currentCPA,
        savings: 0,
        expectedConversions: Math.round(10000 / currentCPA * (0.9 + Math.random() * 0.2)),
      }
    }

    // Calculate needed improvement
    const optimizationPotential = Math.min(0.4, (currentCPA - targetCPA) / currentCPA)
    const optimizedCPA = Math.round(currentCPA * (1 - optimizationPotential * (0.5 + Math.random() * 0.5)))
    const savings = Math.round((currentCPA - optimizedCPA) * 1000)

    return {
      recommendedCPA: optimizedCPA,
      savings: Math.max(0, savings),
      expectedConversions: Math.round(10000 / optimizedCPA),
    }
  }
}

// Export types for use in entity files
export {
  CampaignPerformance,
  BidOptimizationResult,
  AudienceSegmentRecommendation,
  CreativePerformance,
  FrequencyCapRecommendation,
  BudgetPacing,
  RealTimeBidAdvice,
  ChannelFrequencyReport,
}
