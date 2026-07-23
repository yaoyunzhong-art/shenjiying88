// ai-profile.service.spec.ts · WP-14 C端AI画像与营销引擎

import { Test } from '@nestjs/testing';
import { AiProfileService } from './ai-profile.service';

describe('AiProfileService', () => {
  // 每个it独立创建服务，避免vitest共享状态问题

  function makeProfile(svc: AiProfileService, userId: string, storeId: string, level = 'regular', interests: string[] = [], lastVisitDays = 1, totalSpend = 500) {
    return svc.createOrUpdateProfile({
      userId, storeId,
      baseInfo: { gender: 'male', ageGroup: '26_35', level: level as any, consumptionHabbit: 'experience', interests },
      consumptionMetrics: { totalSpend, avgOrderAmount: 50, monthSpend: 200, lastVisitDays, visitFrequency: 4, favoriteCategory: '', couponUsedCount: 0 },
      activityMetrics: { totalVisits: 20, avgStayMinutes: 90, preferredTime: 'evening', preferredDays: ['Saturday'], peakHourRate: 0.5 },
      engagementMetrics: { pushOpenRate: 0.5, pushClickRate: 0.2, messageReadRate: 0.3, socialShareCount: 5, reviewCount: 3, avgRating: 4.5 },
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
});
