// ai-profile.entity.ts · WP-14 C端AI画像与营销引擎
// BS-0189~BS-0198

export type Gender = 'male' | 'female' | 'unknown';

export type AgeGroup = 'under_18' | '18_25' | '26_35' | '36_50' | 'over_50';

export type UserLevel = 'new' | 'regular' | 'vip' | 'vvip';

export type ConsumptionHabbit = 'value' | 'experience' | 'premium' | 'social';

export type InterestTag = string; // 如: '篮球机', '赛车', '盲盒', '抓娃娃'

export type TimingCategory = 'morning' | 'afternoon' | 'evening' | 'weekend' | 'holiday';

export type ChannelType = 'push' | 'sms' | 'email' | 'in_app';

export interface UserProfile {
  id: string;
  userId: string;
  storeId: string;
  baseInfo: {
    gender: Gender;
    ageGroup: AgeGroup;
    level: UserLevel;
    consumptionHabbit: ConsumptionHabbit;
    interests: InterestTag[];
  };
  consumptionMetrics: {
    totalSpend: number;
    avgOrderAmount: number;
    monthSpend: number;
    lastVisitDays: number;
    visitFrequency: number; // 次/月
    favoriteCategory: string;
    couponUsedCount: number;
  };
  activityMetrics: {
    totalVisits: number;
    avgStayMinutes: number;
    preferredTime: TimingCategory;
    preferredDays: string[]; // ['Monday', 'Saturday']
    peakHourRate: number; // 高峰时段到店率
  };
  engagementMetrics: {
    pushOpenRate: number;
    pushClickRate: number;
    messageReadRate: number;
    socialShareCount: number;
    reviewCount: number;
    avgRating: number;
  };
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface TimingRecommendation {
  userId: string;
  bestTime: TimingCategory;
  bestDayOfWeek: string;
  bestHourSlot: string; // '09:00-11:00'
  confidenceScore: number;
  reason: string;
  recommendedChannels: ChannelType[];
  personalPreference: {
    preferWeekend: boolean;
    preferEvening: boolean;
    avoidLateNight: boolean;
    acceptableFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
  };
  updatedAt: Date;
}

export interface ContentRecommendation {
  userId: string;
  contentTitle: string;
  contentType: 'coupon' | 'event' | 'info' | 'social';
  relevanceScore: number;
  predictedOpenRate: number;
  predictedConversionRate: number;
  matchTags: string[];
  expireAt?: Date;
  createdAt: Date;
}

export interface MarketingCampaignPlan {
  id: string;
  campaignName: string;
  targetSegments: string[]; // 用户标签列表
  timing: TimingRecommendation;
  channels: ChannelType[];
  content: ContentRecommendation[];
  predictedROI: number;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  metrics: {
    targetAudience: number;
    reachRate: number;
    conversionRate: number;
    actualROI: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface WeeklyReport {
  id: string;
  storeId: string;
  weekStart: Date;
  weekEnd: Date;
  stats: {
    totalUsers: number;
    activeUsers: number;
    newUsers: number;
    totalCampaigns: number;
    avgOpenRate: number;
    avgConversionRate: number;
    totalRevenue: number;
    roi: number;
  };
  topPerformingSegments: Array<{
    segment: string;
    revenue: number;
    conversionRate: number;
  }>;
  recommendations: string[];
  createdAt: Date;
}
