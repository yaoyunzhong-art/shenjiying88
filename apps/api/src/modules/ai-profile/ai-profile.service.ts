// ai-profile.service.ts · WP-14 C端AI画像与营销引擎
// BS-0189~BS-0198

import { Injectable, Logger } from '@nestjs/common';
import {
  UserProfile,
  TimingRecommendation,
  ContentRecommendation,
  MarketingCampaignPlan,
  WeeklyReport,
  TimingCategory,
  ChannelType,
  Gender,
  AgeGroup,
  UserLevel,
  ConsumptionHabbit,
} from './ai-profile.entity';

@Injectable()
export class AiProfileService {
  private readonly logger = new Logger(AiProfileService.name);

  /** 内存存储（生产应接数据库） */
  private readonly profileStore = new Map<string, UserProfile>();
  private readonly timingStore = new Map<string, TimingRecommendation>();
  private readonly contentStore = new Map<string, ContentRecommendation[]>();
  private readonly campaignStore = new Map<string, MarketingCampaignPlan>();
  private readonly reportStore = new Map<string, WeeklyReport>();

  reset(): void {
    for (const store of [this.profileStore, this.timingStore, this.contentStore, this.campaignStore, this.reportStore]) {
      store.clear();
    }
  }

  // ══════════════════════════════════════════════════════════════
  // BS-0189: 用户画像聚合
  // ══════════════════════════════════════════════════════════════

  createOrUpdateProfile(dto: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): UserProfile {
    const id = dto.id ?? `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const existing = this.profileStore.get(id);
    const now = new Date();
    const profile: UserProfile = {
      ...dto,
      id,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    this.profileStore.set(id, profile);
    this.logger.log(`用户画像更新: ${profile.userId}`);
    return profile;
  }

  getProfile(id: string): UserProfile | undefined {
    return this.profileStore.get(id);
  }

  getProfileByUserId(userId: string): UserProfile | undefined {
    return Array.from(this.profileStore.values()).find(p => p.userId === userId);
  }

  listProfiles(storeId?: string): UserProfile[] {
    const all = Array.from(this.profileStore.values());
    return storeId ? all.filter(p => p.storeId === storeId) : all;
  }

  /** 画像相似用户分组（用于批量推送） */
  getSegmentUsers(tags: string[], storeId?: string): UserProfile[] {
    return this.listProfiles(storeId).filter(p =>
      tags.some(tag => p.tags.includes(tag) || p.baseInfo.interests.includes(tag))
    );
  }

  // ══════════════════════════════════════════════════════════════
  // BS-0190: 营销时机推荐
  // ══════════════════════════════════════════════════════════════

  calculateTiming(userId: string): TimingRecommendation | undefined {
    const profile = this.getProfileByUserId(userId);
    if (!profile) return undefined;

    const { activityMetrics, engagementMetrics, consumptionMetrics } = profile;

    // 基于行为的时机推荐逻辑
    const bestTime = activityMetrics.preferredTime;
    const bestDay = activityMetrics.preferredDays[0] ?? 'Saturday';
    const bestHourSlot = this.getHourSlot(bestTime);
    const confidenceScore = this.calculateTimingConfidence(profile);

    // 个人偏好推导
    const preferWeekend = activityMetrics.preferredDays.includes('Saturday') && activityMetrics.preferredDays.includes('Sunday');
    const preferEvening = activityMetrics.preferredTime === 'evening';
    const avoidLateNight = activityMetrics.peakHourRate < 0.3;
    const acceptableFrequency = consumptionMetrics.lastVisitDays > 30 ? 'weekly' : 'biweekly';

    // 推荐渠道
    const recommendedChannels: ChannelType[] = [];
    if (engagementMetrics.pushOpenRate > 0.3) recommendedChannels.push('push');
    if (engagementMetrics.messageReadRate > 0.2) recommendedChannels.push('sms');
    if (engagementMetrics.pushOpenRate > 0.5 && engagementMetrics.pushClickRate > 0.1) recommendedChannels.push('email');
    recommendedChannels.push('in_app'); // 默认可达

    const timing: TimingRecommendation = {
      userId,
      bestTime,
      bestDayOfWeek: bestDay,
      bestHourSlot,
      confidenceScore,
      reason: this.getTimingReason(profile),
      recommendedChannels,
      personalPreference: {
        preferWeekend,
        preferEvening,
        avoidLateNight,
        acceptableFrequency,
      },
      updatedAt: new Date(),
    };

    this.timingStore.set(userId, timing);
    return timing;
  }

  private getHourSlot(time: TimingCategory): string {
    const map: Record<TimingCategory, string> = {
      morning: '08:00-10:00',
      afternoon: '14:00-17:00',
      evening: '18:00-21:00',
      weekend: '10:00-20:00',
      holiday: '10:00-20:00',
    };
    return map[time] ?? '10:00-18:00';
  }

  private calculateTimingConfidence(profile: UserProfile): number {
    let score = 0.5;
    if (profile.activityMetrics.totalVisits > 10) score += 0.2;
    if (profile.activityMetrics.avgStayMinutes > 60) score += 0.1;
    if (profile.activityMetrics.peakHourRate > 0.6) score += 0.1;
    if (profile.engagementMetrics.pushOpenRate > 0.4) score += 0.1;
    return Math.min(score, 1.0);
  }

  private getTimingReason(profile: UserProfile): string {
    if (profile.activityMetrics.peakHourRate > 0.6) {
      return '用户经常在高峰时段到店，适合在高峰前推送';
    }
    if (profile.activityMetrics.preferredTime === 'evening') {
      return '用户偏好晚间活动，适合在下午推送晚间活动预告';
    }
    return '基于综合行为分析的最佳推送时间';
  }

  getTiming(userId: string): TimingRecommendation | undefined {
    return this.timingStore.get(userId);
  }

  // ══════════════════════════════════════════════════════════════
  // BS-0191: 营销内容推荐
  // ══════════════════════════════════════════════════════════════

  generateContentRecommendations(userId: string, limit = 5): ContentRecommendation[] {
    const timing = this.timingStore.get(userId);
    const profile = this.getProfileByUserId(userId);
    if (!profile) return [];

    const interests = profile.baseInfo.interests;
    const avgOrder = profile.consumptionMetrics.avgOrderAmount;

    const recommendations: ContentRecommendation[] = [];

    // 根据画像生成个性化内容
    if (avgOrder < 50) {
      recommendations.push({
        userId,
        contentTitle: '新人优惠券大礼包',
        contentType: 'coupon',
        relevanceScore: 0.85,
        predictedOpenRate: 0.6,
        predictedConversionRate: 0.3,
        matchTags: ['value', 'new_user'],
        createdAt: new Date(),
      });
    }

    if (interests.includes('抓娃娃') || interests.includes('盲盒')) {
      recommendations.push({
        userId,
        contentTitle: '最新上架精品盲盒',
        contentType: 'event',
        relevanceScore: 0.9,
        predictedOpenRate: 0.7,
        predictedConversionRate: 0.35,
        matchTags: ['blind_box', 'interests'],
        createdAt: new Date(),
      });
    }

    if (profile.baseInfo.level === 'vip' || profile.baseInfo.level === 'vvip') {
      recommendations.push({
        userId,
        contentTitle: 'VIP专属会员活动',
        contentType: 'event',
        relevanceScore: 0.95,
        predictedOpenRate: 0.8,
        predictedConversionRate: 0.5,
        matchTags: ['vip', 'exclusive'],
        createdAt: new Date(),
      });
    }

    if (profile.consumptionMetrics.lastVisitDays > 20) {
      recommendations.push({
        userId,
        contentTitle: '好久不见！送你一张回归券',
        contentType: 'coupon',
        relevanceScore: 0.75,
        predictedOpenRate: 0.5,
        predictedConversionRate: 0.25,
        matchTags: ['dormancy', 'return'],
        createdAt: new Date(),
      });
    }

    if (interests.includes('赛车') || interests.includes('篮球')) {
      recommendations.push({
        userId,
        contentTitle: '周末燃脂挑战赛',
        contentType: 'social',
        relevanceScore: 0.8,
        predictedOpenRate: 0.65,
        predictedConversionRate: 0.3,
        matchTags: ['sports', 'social'],
        createdAt: new Date(),
      });
    }

    // 通用推荐
    recommendations.push({
      userId,
      contentTitle: '本周精选活动推荐',
      contentType: 'info',
      relevanceScore: 0.6,
      predictedOpenRate: 0.4,
      predictedConversionRate: 0.15,
      matchTags: ['general'],
      createdAt: new Date(),
    });

    const sorted = recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
    this.contentStore.set(userId, sorted);
    return sorted.slice(0, limit);
  }

  getContentRecommendations(userId: string): ContentRecommendation[] {
    return this.contentStore.get(userId) ?? [];
  }

  // ══════════════════════════════════════════════════════════════
  // BS-0192: 营销活动策划
  // ══════════════════════════════════════════════════════════════

  createCampaign(dto: {
    campaignName: string;
    targetSegments: string[];
    timing: Partial<TimingRecommendation>;
    channels: ChannelType[];
    contentTitles: string[];
    targetAudience: number;
  }): MarketingCampaignPlan {
    const id = `campaign-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const campaign: MarketingCampaignPlan = {
      id,
      campaignName: dto.campaignName,
      targetSegments: dto.targetSegments,
      timing: {
        userId: 'system',
        bestTime: dto.timing.bestTime ?? 'afternoon',
        bestDayOfWeek: dto.timing.bestDayOfWeek ?? 'Saturday',
        bestHourSlot: dto.timing.bestHourSlot ?? '14:00-17:00',
        confidenceScore: 0.8,
        reason: '由运营手动配置的活动时机',
        recommendedChannels: dto.channels,
        personalPreference: {
          preferWeekend: false,
          preferEvening: false,
          avoidLateNight: true,
          acceptableFrequency: 'weekly',
        },
        updatedAt: new Date(),
      },
      channels: dto.channels,
      content: dto.contentTitles.map(title => ({
        userId: 'system',
        contentTitle: title,
        contentType: 'event',
        relevanceScore: 0.7,
        predictedOpenRate: 0.5,
        predictedConversionRate: 0.2,
        matchTags: dto.targetSegments,
        createdAt: new Date(),
      })),
      predictedROI: 0,
      status: 'draft',
      metrics: {
        targetAudience: dto.targetAudience ?? 0,
        reachRate: 0,
        conversionRate: 0,
        actualROI: 0,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.campaignStore.set(id, campaign);
    return campaign;
  }

  launchCampaign(id: string): MarketingCampaignPlan | undefined {
    const campaign = this.campaignStore.get(id);
    if (!campaign) return undefined;
    campaign.status = 'active';
    this.campaignStore.set(id, campaign);
    return campaign;
  }

  completeCampaign(id: string, metrics: { reachRate: number; conversionRate: number; actualROI: number }): MarketingCampaignPlan | undefined {
    const campaign = this.campaignStore.get(id);
    if (!campaign) return undefined;
    campaign.status = 'completed';
    campaign.metrics.reachRate = metrics.reachRate;
    campaign.metrics.conversionRate = metrics.conversionRate;
    campaign.metrics.actualROI = metrics.actualROI;
    this.campaignStore.set(id, campaign);
    return campaign;
  }

  getCampaign(id: string): MarketingCampaignPlan | undefined {
    return this.campaignStore.get(id);
  }

  listCampaigns(status?: string): MarketingCampaignPlan[] {
    const all = Array.from(this.campaignStore.values());
    return status ? all.filter(c => c.status === status) : all;
  }

  // ══════════════════════════════════════════════════════════════
  // BS-0193: 周报
  // ══════════════════════════════════════════════════════════════

  generateWeeklyReport(storeId: string): WeeklyReport {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - 7);
    const weekEnd = now;

    const profiles = this.listProfiles(storeId);
    const campaigns = this.listCampaigns().filter(c =>
      c.createdAt >= weekStart && c.createdAt <= weekEnd
    );

    const activeUsers = profiles.filter(p => p.consumptionMetrics.lastVisitDays <= 7).length;
    const newUsers = profiles.filter(p =>
      p.createdAt >= weekStart && p.createdAt <= weekEnd
    ).length;

    const completedCampaigns = campaigns.filter(c => c.status === 'completed');
    const avgOpenRate = completedCampaigns.length > 0
      ? completedCampaigns.reduce((s, c) => s + c.metrics.reachRate, 0) / completedCampaigns.length
      : 0;
    const avgConversionRate = completedCampaigns.length > 0
      ? completedCampaigns.reduce((s, c) => s + c.metrics.conversionRate, 0) / completedCampaigns.length
      : 0;
    const totalRevenue = campaigns.reduce((s, c) => s + c.metrics.actualROI * 1000, 0);
    const roi = campaigns.length > 0
      ? campaigns.reduce((s, c) => s + c.metrics.actualROI, 0) / campaigns.length
      : 0;

    const id = `report-${storeId}-${weekStart.toISOString().slice(0, 10)}`;
    const report: WeeklyReport = {
      id,
      storeId,
      weekStart,
      weekEnd,
      stats: {
        totalUsers: profiles.length,
        activeUsers,
        newUsers,
        totalCampaigns: campaigns.length,
        avgOpenRate: Number(avgOpenRate.toFixed(4)),
        avgConversionRate: Number(avgConversionRate.toFixed(4)),
        totalRevenue,
        roi: Number(roi.toFixed(4)),
      },
      topPerformingSegments: [],
      recommendations: [
        '基于画像优化推送时段',
        '对来访超20天有效用户推送回归券',
        'VIP用户推送专属活动提升复购',
      ],
      createdAt: now,
    };

    this.reportStore.set(id, report);
    return report;
  }

  getWeeklyReport(storeId: string): WeeklyReport | undefined {
    const now = new Date();
    const weekStart = now.toISOString().slice(0, 10);
    return Array.from(this.reportStore.values()).find(
      r => r.storeId === storeId && r.createdAt.toISOString().slice(0, 10) === weekStart
    );
  }
}
