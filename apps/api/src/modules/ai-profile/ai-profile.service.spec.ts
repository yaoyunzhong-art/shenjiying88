// ai-profile.service.spec.ts · WP-14 C端AI画像与营销引擎

import { Test } from '@nestjs/testing';
import { AiProfileService } from './ai-profile.service';

describe('AiProfileService', () => {
  // 每个it独立创建服务，避免vitest共享状态问题

  function makeProfile(
    svc: AiProfileService,
    userId: string, storeId: string,
    level = 'regular', interests: string[] = [],
    lastVisitDays = 1, totalSpend = 500,
    activityOverrides?: { totalVisits: number; avgStayMinutes: number; preferredTime: 'morning' | 'afternoon' | 'evening' | 'weekend' | 'holiday'; preferredDays: string[]; peakHourRate: number },
    engagementOverrides?: { pushOpenRate: number; pushClickRate: number; messageReadRate: number; socialShareCount: number; reviewCount: number; avgRating: number },
  ) {
    return svc.createOrUpdateProfile({
      userId, storeId,
      baseInfo: { gender: 'male', ageGroup: '26_35', level: level as any, consumptionHabbit: 'experience', interests },
      consumptionMetrics: {
        totalSpend,
        avgOrderAmount: totalSpend > 50 ? 50 : Math.max(totalSpend, 1),
        monthSpend: 200,
        lastVisitDays,
        visitFrequency: 4,
        favoriteCategory: '',
        couponUsedCount: 0,
      },
      activityMetrics: activityOverrides ?? { totalVisits: 20, avgStayMinutes: 90, preferredTime: 'evening', preferredDays: ['Saturday'], peakHourRate: 0.5 },
      engagementMetrics: engagementOverrides ?? { pushOpenRate: 0.5, pushClickRate: 0.2, messageReadRate: 0.3, socialShareCount: 5, reviewCount: 3, avgRating: 4.5 },
      tags: interests,
    });
  }

  async function createSvc() {
    const module = await Test.createTestingModule({ providers: [AiProfileService] }).compile();
    return module.get(AiProfileService);
  }

  // ── BS-0189: 用户画像 ──────────────────────────

  it('创建画像并返回完整信息', async () => {
    const svc = await createSvc();
    const p = makeProfile(svc, 'u1', 's1');
    expect(p.userId).toBe('u1');
    expect(p.baseInfo.level).toBe('regular');
  });

  it('按用户ID查询', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u2', 's2', 'vip');
    expect(svc.getProfileByUserId('u2')!.baseInfo.level).toBe('vip');
  });

  it('按门店列出', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u3', 's1');
    makeProfile(svc, 'u4', 's2');
    expect(svc.listProfiles('s1').length).toBe(1);
    expect(svc.listProfiles().length).toBe(2);
  });

  it('按标签分组', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u5', 's1', 'regular', ['赛车']);
    makeProfile(svc, 'u6', 's1', 'regular', ['抓娃娃']);
    expect(svc.getSegmentUsers(['赛车']).length).toBe(1);
  });

  it('用户不存在返回 undefined', async () => {
    const svc = await createSvc();
    expect(svc.getProfileByUserId('none')).toBeUndefined();
  });

  // ── BS-0190: 时机推荐 ──────────────────────────

  it('计算最佳时机', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u10', 's1', 'vip', ['赛车'], 1, 8000);
    expect(svc.calculateTiming('u10')!.confidenceScore).toBeGreaterThan(0.5);
  });

  it('无画像返回 undefined', async () => {
    const svc = await createSvc();
    expect(svc.calculateTiming('no')).toBeUndefined();
  });

  it('新用户频次 weekly', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u11', 's1', 'new', [], 60, 0);
    expect(svc.calculateTiming('u11')!.personalPreference.acceptableFrequency).toBe('weekly');
  });

  // ── BS-0191: 内容推荐 ──────────────────────────

  it('生成个性化推荐', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u20', 's1', 'vip', ['盲盒', '抓娃娃'], 3, 3000);
    expect(svc.generateContentRecommendations('u20', 3).length).toBeGreaterThanOrEqual(1);
  });

  it('无画像推荐为空', async () => {
    const svc = await createSvc();
    expect(svc.generateContentRecommendations('no')).toEqual([]);
  });

  // ── BS-0192: 活动 ──────────────────────────────

  it('创建并运营活动', async () => {
    const svc = await createSvc();
    const c = svc.createCampaign({ campaignName: 'A', targetSegments: ['VIP'], timing: { bestTime: 'weekend' }, channels: ['push'], contentTitles: ['折扣'], targetAudience: 100 });
    svc.launchCampaign(c.id);
    svc.completeCampaign(c.id, { reachRate: 0.8, conversionRate: 0.25, actualROI: 0.35 });
    expect(svc.getCampaign(c.id)!.metrics.reachRate).toBe(0.8);
  });

  it('按状态过滤', async () => {
    const svc = await createSvc();
    const c1 = svc.createCampaign({ campaignName: 'ActiveCamp', targetSegments: ['all'], timing: {}, channels: ['push'], contentTitles: [], targetAudience: 0 });
    svc.launchCampaign(c1.id);
    svc.createCampaign({ campaignName: 'CompletedCamp', targetSegments: ['all'], timing: {}, channels: ['push'], contentTitles: [], targetAudience: 0 });
    // c2 stays as draft, only c1 is active
    const actives = svc.listCampaigns('active');
    expect(actives.length).toBe(1);
    expect(actives[0].campaignName).toBe('ActiveCamp');
  });

  it('不存在的活动返回 undefined', async () => {
    const svc = await createSvc();
    expect(svc.getCampaign('none')).toBeUndefined();
  });

  // ── BS-0193: 周报 ──────────────────────────────

  it('生成周报含统计', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'r1', 's-report');
    makeProfile(svc, 'r2', 's-report', 'new', [], 30, 0);
    const c = svc.createCampaign({ campaignName: 'R', targetSegments: ['all'], timing: {}, channels: ['push'], contentTitles: ['A'], targetAudience: 10 });
    svc.completeCampaign(c.id, { reachRate: 0.7, conversionRate: 0.2, actualROI: 0.3 });
    const report = svc.generateWeeklyReport('s-report');
    expect(report.stats.totalUsers).toBe(2);
    expect(report.recommendations.length).toBeGreaterThanOrEqual(1);
  });

  it('空数据周报仍可生成', async () => {
    const svc = await createSvc();
    const report = svc.generateWeeklyReport('empty');
    expect(report.stats.totalUsers).toBe(0);
    expect(report.stats.totalCampaigns).toBe(0);
  });

  it('获取已有周报', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'r3', 's-get');
    const c = svc.createCampaign({ campaignName: 'G', targetSegments: ['all'], timing: {}, channels: ['push'], contentTitles: ['G'], targetAudience: 5 });
    svc.completeCampaign(c.id, { reachRate: 0.6, conversionRate: 0.15, actualROI: 0.2 });
    svc.generateWeeklyReport('s-get');
    expect(svc.getWeeklyReport('s-get')).toBeTruthy();
  });

  // ══════════════════════════════════════════════════════════════
  //  BS-0189 补充: 用户画像边界
  // ══════════════════════════════════════════════════════════════

  it('更新已存在的画像保留 createdAt', async () => {
    const svc = await createSvc();
    const p1 = makeProfile(svc, 'u30', 's1');
    const p2 = svc.createOrUpdateProfile({
      userId: 'u30',
      storeId: 's1',
      baseInfo: { gender: 'male', ageGroup: '26_35', level: 'vip' as any, consumptionHabbit: 'experience', interests: [] },
      consumptionMetrics: { totalSpend: 100, avgOrderAmount: 50, monthSpend: 200, lastVisitDays: 1, visitFrequency: 4, favoriteCategory: '', couponUsedCount: 0 },
      activityMetrics: { totalVisits: 20, avgStayMinutes: 90, preferredTime: 'evening', preferredDays: ['Saturday'], peakHourRate: 0.5 },
      engagementMetrics: { pushOpenRate: 0.5, pushClickRate: 0.2, messageReadRate: 0.3, socialShareCount: 5, reviewCount: 3, avgRating: 4.5 },
      tags: [],
      id: p1.id,
    });
    expect(p2.createdAt.getTime()).toBe(p1.createdAt.getTime());
    expect(p2.baseInfo.level).toBe('vip');
  });

  it('getProfile 通过 id 查询', async () => {
    const svc = await createSvc();
    const p = makeProfile(svc, 'u31', 's1');
    const found = svc.getProfile(p.id);
    expect(found).toBeTruthy();
    expect(found!.userId).toBe('u31');
  });

  it('getProfile 不存在返回 undefined', async () => {
    const svc = await createSvc();
    expect(svc.getProfile('nonexist')).toBeUndefined();
  });

  it('getSegmentUsers 无匹配标签返回空数组', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u32', 's1', 'regular', ['赛车', '篮球']);
    const result = svc.getSegmentUsers(['美食', '旅行']);
    expect(result).toEqual([]);
  });

  it('getSegmentUsers 空标签返回空数组', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u33', 's1');
    const result = svc.getSegmentUsers([]);
    expect(result).toEqual([]);
  });

  it('listProfiles 空存储返回空数组', async () => {
    const svc = await createSvc();
    expect(svc.listProfiles()).toEqual([]);
  });

  // ══════════════════════════════════════════════════════════════
  //  BS-0190 补充: 时机推荐边界
  // ══════════════════════════════════════════════════════════════

  it('高频用户置信度更高', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u40', 's1', 'regular', [], 1, 500, {
      totalVisits: 50, avgStayMinutes: 120, preferredTime: 'evening', preferredDays: ['Saturday'], peakHourRate: 0.8,
    });
    const timing = svc.calculateTiming('u40')!;
    expect(timing.confidenceScore).toBeGreaterThanOrEqual(0.8);
  });

  it('低活跃用户置信度为基础值 0.5', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u41', 's1', 'regular', [], 30, 50, {
      totalVisits: 2, avgStayMinutes: 10, preferredTime: 'morning', preferredDays: ['Monday'], peakHourRate: 0.1,
    }, {
      pushOpenRate: 0.3, pushClickRate: 0.1, messageReadRate: 0.1, socialShareCount: 0, reviewCount: 0, avgRating: 3,
    });
    const timing = svc.calculateTiming('u41')!;
    expect(timing.confidenceScore).toBe(0.5);
  });

  it('推荐渠道根据用户行为生成', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u42', 's1', 'regular', [], 1, 500, {
      totalVisits: 20, avgStayMinutes: 90, preferredTime: 'evening', preferredDays: ['Saturday'], peakHourRate: 0.5,
    }, {
      pushOpenRate: 0.6, pushClickRate: 0.2, messageReadRate: 0.4, socialShareCount: 5, reviewCount: 3, avgRating: 4.5,
    });
    const timing = svc.calculateTiming('u42')!;
    expect(timing.recommendedChannels).toContain('push');
    expect(timing.recommendedChannels).toContain('in_app');
  });

  it('getTiming 返回已计算的时机', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u43', 's1', 'regular', ['赛车'], 1, 8000);
    svc.calculateTiming('u43');
    const timing = svc.getTiming('u43');
    expect(timing).toBeTruthy();
    expect(timing!.userId).toBe('u43');
  });

  it('getTiming 未计算返回 undefined', async () => {
    const svc = await createSvc();
    expect(svc.getTiming('nocalc')).toBeUndefined();
  });

  // ══════════════════════════════════════════════════════════════
  //  BS-0191 补充: 内容推荐边界
  // ══════════════════════════════════════════════════════════════

  it('VIP 用户获得专属推荐', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u50', 's1', 'vip', ['盲盒'], 1, 3000);
    const recs = svc.generateContentRecommendations('u50', 5);
    const vipContent = recs.find(r => r.matchTags.includes('vip'));
    expect(vipContent).toBeTruthy();
  });

  it('低消费用户获得新人优惠推荐', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u51', 's1', 'regular', [], 1, 30); // avgOrder < 50
    const recs = svc.generateContentRecommendations('u51', 5);
    const coupon = recs.find(r => r.contentTitle.includes('新人优惠'));
    expect(coupon).toBeTruthy();
  });

  it('休眠用户获得回归推荐', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u52', 's1', 'regular', [], 25, 500); // lastVisitDays > 20
    const recs = svc.generateContentRecommendations('u52', 5);
    const dormant = recs.find(r => r.matchTags.includes('dormancy'));
    expect(dormant).toBeTruthy();
  });

  it('推荐按相关性排序', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u53', 's1', 'vip', ['盲盒', '赛车'], 1, 3000);
    const recs = svc.generateContentRecommendations('u53', 5);
    for (let i = 1; i < recs.length; i++) {
      expect(recs[i - 1].relevanceScore).toBeGreaterThanOrEqual(recs[i].relevanceScore);
    }
  });

  it('limit 参数正确截断', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u54', 's1', 'vip', ['盲盒', '赛车'], 1, 3000);
    const recs = svc.generateContentRecommendations('u54', 2);
    expect(recs.length).toBeLessThanOrEqual(2);
  });

  it('getContentRecommendations 返回已生成内容', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'u55', 's1', 'vip', ['盲盒'], 1, 3000);
    svc.generateContentRecommendations('u55', 3);
    const stored = svc.getContentRecommendations('u55');
    expect(stored.length).toBeGreaterThanOrEqual(1);
  });

  it('getContentRecommendations 未生成返回空数组', async () => {
    const svc = await createSvc();
    expect(svc.getContentRecommendations('nogen')).toEqual([]);
  });

  // ══════════════════════════════════════════════════════════════
  //  BS-0192 补充: 活动边界
  // ══════════════════════════════════════════════════════════════

  it('launchCampaign 不存在应返回 undefined', async () => {
    const svc = await createSvc();
    expect(svc.launchCampaign('nonexist')).toBeUndefined();
  });

  it('completeCampaign 不存在应返回 undefined', async () => {
    const svc = await createSvc();
    expect(svc.completeCampaign('nonexist', { reachRate: 0, conversionRate: 0, actualROI: 0 })).toBeUndefined();
  });

  it('listCampaigns 空存储返回空数组', async () => {
    const svc = await createSvc();
    expect(svc.listCampaigns()).toEqual([]);
  });

  it('campaign 创建时状态为 draft', async () => {
    const svc = await createSvc();
    const c = svc.createCampaign({ campaignName: 'Test', targetSegments: ['all'], timing: {}, channels: ['push'], contentTitles: ['A'], targetAudience: 0 });
    expect(c.status).toBe('draft');
    expect(c.predictedROI).toBe(0);
    expect(c.metrics.targetAudience).toBe(0);
  });

  // ══════════════════════════════════════════════════════════════
  //  BS-0193 补充: 周报边界
  // ══════════════════════════════════════════════════════════════

  it('getWeeklyReport 不存在返回 undefined', async () => {
    const svc = await createSvc();
    expect(svc.getWeeklyReport('nonexist')).toBeUndefined();
  });

  it('未完成活动不贡献 ROI（但计入 campaign 总数）', async () => {
    const svc = await createSvc();
    svc.createCampaign({ campaignName: 'Draft', targetSegments: ['all'], timing: {}, channels: ['push'], contentTitles: ['A'], targetAudience: 10 });
    const report = svc.generateWeeklyReport('s1');
    // 活动虽然未完成，但 createdAt 在最近 7 天内，计入 totalCampaigns
    // 但是 completedCampaigns 为 0，所以 ROI 为 0
    expect(report.stats.roi).toBe(0);
    expect(report.stats.avgOpenRate).toBe(0);
    expect(report.stats.avgConversionRate).toBe(0);
  });
});
