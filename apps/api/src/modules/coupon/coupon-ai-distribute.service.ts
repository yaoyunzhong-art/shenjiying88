// CouponAI Distribute Service · T108-2
// AI 自动发放引擎: 评分、决策、发放、优化时序

import { Injectable, Logger } from '@nestjs/common';

// ─── Types ────────────────────────────────────────────────────────────────

interface MemberFeature {
  memberId: string;
  purchaseFrequency: number;    // 月均消费频次
  averageOrderValue: number;   // 客单价
  categoryPreferences: string[]; // 偏好品类
  lifecycleStage: 'new' | 'active' | 'dormant' | 'churned';
  lastPurchaseDays: number;    // 距上次购买天数
}

interface CampaignParams {
  name: string;
  couponId: string;
  budget: number;              // 发放数量上限
  startTime: Date;
  endTime: Date;
  targetCriteria?: {
    minPurchaseFrequency?: number;
    minAverageOrderValue?: number;
    lifecycleStages?: string[];
    categories?: string[];
  };
}

interface Campaign {
  id: string;
  name: string;
  couponId: string;
  budget: number;
  startTime: Date;
  endTime: Date;
  status: 'active' | 'paused' | 'completed';
  targetCriteria?: CampaignParams['targetCriteria'];
  distributedCount: number;
  redeemedCount: number;
}

interface DistributionRecord {
  campaignId: string;
  couponId: string;
  memberId: string;
  score: number;
  distributedAt: Date;
  scheduledAt: Date;
}

interface RedemptionOutcome {
  couponId: string;
  memberId: string;
  distributedAt: Date;
  redeemedAt?: Date;
  actualRedeemed: boolean;
}

interface CampaignStats {
  campaignId: string;
  totalBudget: number;
  distributed: number;
  redeemed: number;
  redemptionRate: number;
  roi: number;
}

// ─── CouponAIScorer: AI 评分 ───────────────────────────────────────────────

@Injectable()
export class CouponAIScorer {
  private readonly logger = new Logger(CouponAIScorer.name);

  /**
   * 给会员对优惠券的匹配度打分（0-100）
   * 综合考虑: 消费频率 + 客单价 + 品类偏好 + 生命周期阶段
   */
  async scoreMember(memberId: string, couponId: string): Promise<number> {
    const features = await this.scoreFeatures(memberId);
    const likelihood = await this.predictRedeemLikelihood(couponId, memberId);
    return Math.round(likelihood * 100);
  }

  /**
   * 提取会员特征（消费频率/客单价/品类偏好/生命周期阶段）
   */
  async scoreFeatures(memberId: string): Promise<MemberFeature> {
    // 模拟会员画像数据
    const mockFeatures = this.getMockMemberFeatures(memberId);
    return mockFeatures;
  }

  /**
   * 预测核销可能性（0-1）
   * 规则:
   * - 高频(>5次/月) + 高客单(>200): 0.8-1.0
   * - 中频(2-5次/月) + 中客单(100-200): 0.5-0.8
   * - 低频(<2次/月) 或 新会员: 0.2-0.5
   * - 流失会员: 0.0-0.2
   */
  async predictRedeemLikelihood(couponId: string, memberId: string): Promise<number> {
    const features = await this.scoreFeatures(memberId);
    const { purchaseFrequency, averageOrderValue, lifecycleStage, lastPurchaseDays } = features;

    let baseScore = 0.0;

    // 消费频率评分 (0-0.4)
    if (purchaseFrequency > 5) {
      baseScore += 0.4;
    } else if (purchaseFrequency >= 2) {
      baseScore += 0.25;
    } else if (purchaseFrequency >= 1) {
      baseScore += 0.15;
    } else {
      baseScore += 0.05;
    }

    // 客单价评分 (0-0.3)
    if (averageOrderValue > 200) {
      baseScore += 0.3;
    } else if (averageOrderValue >= 100) {
      baseScore += 0.2;
    } else if (averageOrderValue >= 50) {
      baseScore += 0.1;
    } else {
      baseScore += 0.05;
    }

    // 生命周期阶段调整 (-0.2 到 +0.15)
    switch (lifecycleStage) {
      case 'active':
        baseScore += 0.15;
        break;
      case 'new':
        baseScore += 0.05;
        break;
      case 'dormant':
        baseScore -= 0.1;
        break;
      case 'churned':
        baseScore -= 0.2;
        break;
    }

    // 距上次购买天数调整 (-0.15 到 0)
    if (lastPurchaseDays > 90) {
      baseScore -= 0.15;
    } else if (lastPurchaseDays > 60) {
      baseScore -= 0.1;
    } else if (lastPurchaseDays > 30) {
      baseScore -= 0.05;
    }

    return Math.max(0, Math.min(1, baseScore));
  }

  private getMockMemberFeatures(memberId: string): MemberFeature {
    // 模拟不同会员ID对应不同特征
    const idHash = memberId.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    const patterns = [
      { purchaseFrequency: 8, averageOrderValue: 350, lifecycleStage: 'active' as const, lastPurchaseDays: 5 },
      { purchaseFrequency: 6, averageOrderValue: 280, lifecycleStage: 'active' as const, lastPurchaseDays: 10 },
      { purchaseFrequency: 4, averageOrderValue: 180, lifecycleStage: 'active' as const, lastPurchaseDays: 15 },
      { purchaseFrequency: 2, averageOrderValue: 120, lifecycleStage: 'new' as const, lastPurchaseDays: 3 },
      { purchaseFrequency: 1, averageOrderValue: 80, lifecycleStage: 'new' as const, lastPurchaseDays: 7 },
      { purchaseFrequency: 0.5, averageOrderValue: 50, lifecycleStage: 'dormant' as const, lastPurchaseDays: 45 },
      { purchaseFrequency: 0.2, averageOrderValue: 30, lifecycleStage: 'churned' as const, lastPurchaseDays: 120 },
    ];
    const pattern = patterns[idHash % patterns.length];
    return {
      memberId,
      categoryPreferences: ['dining', 'retail'],
      ...pattern,
    };
  }
}

// ─── CouponAIDistributor: AI 发放决策 ─────────────────────────────────────

@Injectable()
export class CouponAIDistributor {
  private readonly logger = new Logger(CouponAIDistributor.name);
  private distributionRecords: DistributionRecord[] = [];
  private redemptionOutcomes: RedemptionOutcome[] = [];
  private campaignGetter: (id: string) => Campaign | undefined;

  constructor(
    private readonly scorer: CouponAIScorer,
    campaignGetter?: (id: string) => Campaign | undefined,
  ) {
    this.campaignGetter = campaignGetter ?? (() => undefined);
  }

  /**
   * 基于评分决定发放名单（不超预算）
   * @param couponId 优惠券ID
   * @param budget 预算（发放数量上限）
   * @returns 排序后的发放名单（按评分降序）
   */
  async decideRecipients(couponId: string, budget: number): Promise<string[]> {
    // 获取所有候选会员（模拟）
    const candidateMemberIds = this.generateCandidateMembers();

    // 对每个候选会员评分
    const scoredMembers: { memberId: string; score: number }[] = [];
    for (const memberId of candidateMemberIds) {
      const score = await this.scorer.scoreMember(memberId, couponId);
      scoredMembers.push({ memberId, score });
    }

    // 按评分降序排序
    scoredMembers.sort((a, b) => b.score - a.score);

    // 取前 budget 名
    const recipients = scoredMembers.slice(0, budget).map(s => s.memberId);
    this.logger.log(`Decided ${recipients.length} recipients for coupon ${couponId} (budget=${budget})`);

    return recipients;
  }

  /**
   * 优化发放时间（返回最佳发送时间戳）
   * 规则:
   * - 工作日: 10:00-11:30（工间时段）
   * - 周末: 14:00-16:00（午后时段）
   */
  async optimizeTiming(couponId: string, memberId: string): Promise<Date> {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    let targetHour: number;
    let targetMinute = Math.floor(Math.random() * 30); // 0-29

    if (isWeekend) {
      targetHour = 14 + Math.floor(Math.random() * 2); // 14-15
    } else {
      targetHour = 10 + Math.floor(Math.random() * 2); // 10-11
    }

    const scheduledAt = new Date(now);
    scheduledAt.setHours(targetHour, targetMinute, 0, 0);

    // 如果时间已过，设置为明天
    if (scheduledAt.getTime() <= now.getTime()) {
      scheduledAt.setDate(scheduledAt.getDate() + 1);
    }

    this.logger.log(`Optimized timing for member ${memberId}: ${scheduledAt.toISOString()}`);
    return scheduledAt;
  }

  /**
   * 执行发放活动（含评分→排序→发放）
   */
  async runDistributionCampaign(campaignId: string): Promise<{ distributed: number }> {
    const campaign = this.campaignGetter(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    if (campaign.status !== 'active') {
      throw new Error(`Campaign ${campaignId} is not active`);
    }

    const now = new Date();
    if (now < campaign.startTime || now > campaign.endTime) {
      throw new Error(`Campaign ${campaignId} is not within valid time window`);
    }

    // 决定发放名单
    const recipients = await this.decideRecipients(campaign.couponId, campaign.budget);

    // 发放并记录
    let distributed = 0;
    for (const memberId of recipients) {
      const scheduledAt = await this.optimizeTiming(campaign.couponId, memberId);
      const score = await this.scorer.scoreMember(memberId, campaign.couponId);

      this.distributionRecords.push({
        campaignId,
        couponId: campaign.couponId,
        memberId,
        score,
        distributedAt: new Date(),
        scheduledAt,
      });

      distributed++;
      campaign.distributedCount++;
    }

    this.logger.log(`Campaign ${campaignId} distributed ${distributed} coupons`);
    return { distributed };
  }

  /**
   * 记录实际核销结果（用于反馈学习）
   */
  async recordOutcome(couponId: string, memberId: string, actualRedeemed: boolean): Promise<void> {
    const outcome: RedemptionOutcome = {
      couponId,
      memberId,
      distributedAt: new Date(),
      actualRedeemed,
      redeemedAt: actualRedeemed ? new Date() : undefined,
    };

    this.redemptionOutcomes.push(outcome);

    // 更新 campaign 的 redeemedCount
    const record = this.distributionRecords.find(
      r => r.couponId === couponId && r.memberId === memberId
    );
    if (record) {
      const campaign = this.campaignGetter(record.campaignId);
      if (campaign && actualRedeemed) {
        campaign.redeemedCount++;
      }
    }

    this.logger.log(`Recorded outcome: coupon=${couponId} member=${memberId} redeemed=${actualRedeemed}`);
  }

  // ─── 内部辅助 ────────────────────────────────────────────────────────────

  private generateCandidateMembers(): string[] {
    // 模拟生成候选会员列表
    return Array.from({ length: 1000 }, (_, i) => `member-${String(i).padStart(4, '0')}`);
  }
}

// ─── CouponCampaign: 营销活动 ──────────────────────────────────────────────

@Injectable()
export class CouponCampaign {
  private readonly logger = new Logger(CouponCampaign.name);
  private campaigns: Map<string, Campaign> = new Map();

  /**
   * 创建发放活动
   */
  createCampaign(params: CampaignParams): Campaign {
    const campaign: Campaign = {
      id: `campaign-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: params.name,
      couponId: params.couponId,
      budget: params.budget,
      startTime: params.startTime,
      endTime: params.endTime,
      status: 'active',
      targetCriteria: params.targetCriteria,
      distributedCount: 0,
      redeemedCount: 0,
    };

    this.campaigns.set(campaign.id, campaign);
    this.logger.log(`Created campaign: ${campaign.id} (budget=${campaign.budget})`);
    return campaign;
  }

  /**
   * 暂停活动
   */
  pauseCampaign(campaignId: string): Campaign {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    campaign.status = 'paused';
    this.logger.log(`Paused campaign: ${campaignId}`);
    return campaign;
  }

  /**
   * 获取活动统计
   */
  getCampaignStats(campaignId: string): CampaignStats {
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) {
      throw new Error(`Campaign ${campaignId} not found`);
    }

    const redemptionRate = campaign.distributedCount > 0
      ? campaign.redeemedCount / campaign.distributedCount
      : 0;

    // 简化 ROI 计算: 假设每核销带来 100 价值
    const roi = campaign.redeemedCount * 100 / Math.max(campaign.distributedCount, 1);

    return {
      campaignId,
      totalBudget: campaign.budget,
      distributed: campaign.distributedCount,
      redeemed: campaign.redeemedCount,
      redemptionRate: Math.round(redemptionRate * 100) / 100,
      roi: Math.round(roi * 100) / 100,
    };
  }

  getCampaign(campaignId: string): Campaign | undefined {
    return this.campaigns.get(campaignId);
  }

  getAllCampaigns(): Campaign[] {
    return Array.from(this.campaigns.values());
  }
}

// ─── CouponAIDistributionModule 整合 ──────────────────────────────────────

@Injectable()
export class CouponAIDistributionService {
  private readonly logger = new Logger(CouponAIDistributionService.name);

  constructor(
    private readonly scorer: CouponAIScorer,
    private readonly distributor: CouponAIDistributor,
    private readonly campaign: CouponCampaign,
  ) {
    // 将 campaign getter 注入到 distributor，使其能访问共享的 campaign 存储
    this.distributor['campaignGetter'] = (id: string) => this.campaign.getCampaign(id);
  }

  /**
   * 创建并执行 AI 发放活动
   */
  async createAndRun(params: CampaignParams): Promise<{ campaign: Campaign; distributed: number }> {
    const created = this.campaign.createCampaign(params);
    const result = await this.distributor.runDistributionCampaign(created.id);
    return { campaign: created, distributed: result.distributed };
  }

  getCampaignStats(campaignId: string): CampaignStats {
    return this.campaign.getCampaignStats(campaignId);
  }

  pauseCampaign(campaignId: string): Campaign {
    return this.campaign.pauseCampaign(campaignId);
  }

  async recordOutcome(couponId: string, memberId: string, actualRedeemed: boolean): Promise<void> {
    return this.distributor.recordOutcome(couponId, memberId, actualRedeemed);
  }

  async scoreMember(memberId: string, couponId: string): Promise<number> {
    return this.scorer.scoreMember(memberId, couponId);
  }

  async predictRedeemLikelihood(couponId: string, memberId: string): Promise<number> {
    return this.scorer.predictRedeemLikelihood(couponId, memberId);
  }

  async decideRecipients(couponId: string, budget: number): Promise<string[]> {
    return this.distributor.decideRecipients(couponId, budget);
  }

  async optimizeTiming(couponId: string, memberId: string): Promise<Date> {
    return this.distributor.optimizeTiming(couponId, memberId);
  }
}
