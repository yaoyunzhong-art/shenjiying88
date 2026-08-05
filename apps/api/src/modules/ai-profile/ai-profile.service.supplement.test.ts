// ai-profile.service.supplement.spec.ts — 补充测试覆盖剩余边界与业务场景
// 补充 BS-0189~BS-0193 现有 spec 未覆盖的路径（>15 个新增用例）

import { Test } from '@nestjs/testing';
import { AiProfileService } from './ai-profile.service';

describe('AiProfileService — Supplement', () => {
  async function createSvc() {
    const module = await Test.createTestingModule({
      providers: [AiProfileService],
    }).compile();
    const svc = module.get(AiProfileService);
    svc.reset();
    return svc;
  }

  function makeProfile(
    svc: AiProfileService,
    userId: string,
    storeId: string,
    overrides?: {
      level?: string;
      interests?: string[];
      lastVisitDays?: number;
      totalSpend?: number;
      totalVisits?: number;
      avgStayMinutes?: number;
      preferredTime?: 'morning' | 'afternoon' | 'evening' | 'weekend' | 'holiday';
      preferredDays?: string[];
      peakHourRate?: number;
      pushOpenRate?: number;
      pushClickRate?: number;
      messageReadRate?: number;
    },
  ) {
    return svc.createOrUpdateProfile({
      userId,
      storeId,
      baseInfo: {
        gender: 'male',
        ageGroup: '26_35',
        level: (overrides?.level ?? 'regular') as any,
        consumptionHabbit: 'experience',
        interests: overrides?.interests ?? [],
      },
      consumptionMetrics: {
        totalSpend: overrides?.totalSpend ?? 500,
        avgOrderAmount: (overrides?.totalSpend ?? 500) > 50 ? 50 : Math.max(overrides?.totalSpend ?? 500, 1),
        monthSpend: 200,
        lastVisitDays: overrides?.lastVisitDays ?? 1,
        visitFrequency: 4,
        favoriteCategory: '',
        couponUsedCount: 0,
      },
      activityMetrics: {
        totalVisits: overrides?.totalVisits ?? 20,
        avgStayMinutes: overrides?.avgStayMinutes ?? 90,
        preferredTime: overrides?.preferredTime ?? 'evening',
        preferredDays: overrides?.preferredDays ?? ['Saturday'],
        peakHourRate: overrides?.peakHourRate ?? 0.5,
      },
      engagementMetrics: {
        pushOpenRate: overrides?.pushOpenRate ?? 0.5,
        pushClickRate: overrides?.pushClickRate ?? 0.2,
        messageReadRate: overrides?.messageReadRate ?? 0.3,
        socialShareCount: 5,
        reviewCount: 3,
        avgRating: 4.5,
      },
      tags: overrides?.interests ?? [],
    });
  }

  // ══════════════════════════════════════════════════════════════
  // BS-0189: 补充未覆盖的画像边界
  // ══════════════════════════════════════════════════════════════

  it('BS-0189: createOrUpdateProfile 给定 id 则使用该 id', async () => {
    const svc = await createSvc();
    const p = svc.createOrUpdateProfile({
      userId: 'custom-id-user',
      storeId: 's1',
      baseInfo: { gender: 'female', ageGroup: '18_25', level: 'vip' as any, consumptionHabbit: 'premium', interests: ['美妆'] },
      consumptionMetrics: { totalSpend: 2000, avgOrderAmount: 200, monthSpend: 600, lastVisitDays: 2, visitFrequency: 6, favoriteCategory: '化妆品', couponUsedCount: 5 },
      activityMetrics: { totalVisits: 30, avgStayMinutes: 60, preferredTime: 'afternoon', preferredDays: ['Sunday'], peakHourRate: 0.4 },
      engagementMetrics: { pushOpenRate: 0.6, pushClickRate: 0.3, messageReadRate: 0.4, socialShareCount: 8, reviewCount: 10, avgRating: 4.8 },
      tags: ['美妆'],
      id: 'my-custom-id-001',
    });
    expect(p.id).toBe('my-custom-id-001');
  });

  it('BS-0189: getSegmentUsers 同时匹配 tags 和 interests 任一即可', async () => {
    const svc = await createSvc();
    // interests 匹配
    makeProfile(svc, 'user-a', 's1', { interests: ['篮球'] });
    // tags 匹配
    const p2 = svc.createOrUpdateProfile({
      userId: 'user-b',
      storeId: 's1',
      baseInfo: { gender: 'male', ageGroup: '26_35', level: 'regular' as any, consumptionHabbit: 'experience', interests: [] },
      consumptionMetrics: { totalSpend: 100, avgOrderAmount: 50, monthSpend: 50, lastVisitDays: 1, visitFrequency: 2, favoriteCategory: '', couponUsedCount: 0 },
      activityMetrics: { totalVisits: 5, avgStayMinutes: 30, preferredTime: 'morning', preferredDays: ['Monday'], peakHourRate: 0.2 },
      engagementMetrics: { pushOpenRate: 0.2, pushClickRate: 0.1, messageReadRate: 0.1, socialShareCount: 0, reviewCount: 0, avgRating: 0 },
      tags: ['赛车'],
    });
    const result = svc.getSegmentUsers(['赛车', '篮球'], 's1');
    expect(result.length).toBe(2);
  });

  it('BS-0189: getSegmentUsers 按 storeId 过滤正确', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'user-c', 'store-a', { interests: ['赛车'] });
    makeProfile(svc, 'user-d', 'store-b', { interests: ['赛车'] });
    const resultA = svc.getSegmentUsers(['赛车'], 'store-a');
    expect(resultA.length).toBe(1);
    expect(resultA[0].userId).toBe('user-c');
    const resultAll = svc.getSegmentUsers(['赛车']);
    expect(resultAll.length).toBe(2);
  });

  it('BS-0189: listProfiles 无 storeId 返回全部', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'user-e', 's1');
    makeProfile(svc, 'user-f', 's2');
    makeProfile(svc, 'user-g', 's3');
    expect(svc.listProfiles().length).toBe(3);
  });

  it('BS-0189: createOrUpdateProfile 更新时 updatedAt 变更', async () => {
    const svc = await createSvc();
    const p1 = makeProfile(svc, 'user-h', 's1');
    const origUpdated = p1.updatedAt.getTime();
    // 等待微妙差异
    await new Promise(r => setTimeout(r, 1));
    const p2 = svc.createOrUpdateProfile({
      userId: 'user-h',
      storeId: 's1',
      baseInfo: { gender: 'male', ageGroup: '26_35', level: 'vip' as any, consumptionHabbit: 'experience', interests: [] },
      consumptionMetrics: { totalSpend: 500, avgOrderAmount: 50, monthSpend: 200, lastVisitDays: 1, visitFrequency: 4, favoriteCategory: '', couponUsedCount: 0 },
      activityMetrics: { totalVisits: 20, avgStayMinutes: 90, preferredTime: 'evening', preferredDays: ['Saturday'], peakHourRate: 0.5 },
      engagementMetrics: { pushOpenRate: 0.5, pushClickRate: 0.2, messageReadRate: 0.3, socialShareCount: 5, reviewCount: 3, avgRating: 4.5 },
      tags: [],
      id: p1.id,
    });
    expect(p2.updatedAt.getTime()).toBeGreaterThan(origUpdated);
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0190: 补充时机推荐边界
  // ══════════════════════════════════════════════════════════════

  it('BS-0190: getHourSlot 返回正确的时段映射', async () => {
    const svc = await createSvc();
    // 通过 calculateTiming 间接测试 -> bestHourSlot 字段
    makeProfile(svc, 'time-morning', 's1', { preferredTime: 'morning' });
    expect(svc.calculateTiming('time-morning')!.bestHourSlot).toBe('08:00-10:00');

    makeProfile(svc, 'time-afternoon', 's1', { preferredTime: 'afternoon' });
    expect(svc.calculateTiming('time-afternoon')!.bestHourSlot).toBe('14:00-17:00');

    makeProfile(svc, 'time-weekend', 's1', { preferredTime: 'weekend' });
    expect(svc.calculateTiming('time-weekend')!.bestHourSlot).toBe('10:00-20:00');

    makeProfile(svc, 'time-holiday', 's1', { preferredTime: 'holiday' });
    expect(svc.calculateTiming('time-holiday')!.bestHourSlot).toBe('10:00-20:00');
  });

  it('BS-0190: 置信度计算 - 恰好卡在边界值', async () => {
    const svc = await createSvc();
    // totalVisits === 10 阈值
    makeProfile(svc, 'boundary-10', 's1', {
      totalVisits: 10,
      avgStayMinutes: 59, // 低于 60
      peakHourRate: 0.5, // 不触发 0.6
      pushOpenRate: 0.35, // 低于 0.4
    });
    expect(svc.calculateTiming('boundary-10')!.confidenceScore).toBeCloseTo(0.5);

    // totalVisits === 11 触发 +0.2
    makeProfile(svc, 'boundary-11', 's1', {
      totalVisits: 11,
      avgStayMinutes: 59,
      peakHourRate: 0.5,
      pushOpenRate: 0.35,
    });
    expect(svc.calculateTiming('boundary-11')!.confidenceScore).toBeCloseTo(0.7);
  });

  it('BS-0190: calculateTiming 选择 bestDay 为 preferredDays 首项', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'day-test', 's1', { preferredDays: ['Sunday', 'Wednesday'] });
    expect(svc.calculateTiming('day-test')!.bestDayOfWeek).toBe('Sunday');
  });

  it('BS-0190: getTimingReason 高峰时段场景', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'peak-user', 's1', { peakHourRate: 0.7 });
    const reason = svc.calculateTiming('peak-user')!.reason;
    expect(reason).toContain('高峰时段');
  });

  it('BS-0190: getTimingReason 晚间活动场景', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'evening-user', 's1', {
      peakHourRate: 0.3,
      preferredTime: 'evening',
    });
    const reason = svc.calculateTiming('evening-user')!.reason;
    expect(reason).toContain('晚间活动');
  });

  it('BS-0190: getTimingReason 默认综合场景', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'default-user', 's1', {
      peakHourRate: 0.4,
      preferredTime: 'morning',
    });
    const reason = svc.calculateTiming('default-user')!.reason;
    expect(reason).toContain('综合行为分析');
  });

  it('BS-0190: 推荐渠道 - 高推送打开率包含 email', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'email-eligible', 's1', {
      pushOpenRate: 0.6,
      pushClickRate: 0.15,
    });
    const timing = svc.calculateTiming('email-eligible')!;
    expect(timing.recommendedChannels).toContain('email');
    expect(timing.recommendedChannels).toContain('push');
    expect(timing.recommendedChannels).toContain('in_app');
  });

  it('BS-0190: 偏好推导 - preferEvening 为 true', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'pref-evening', 's1', { preferredTime: 'evening' });
    const pref = svc.calculateTiming('pref-evening')!.personalPreference;
    expect(pref.preferEvening).toBe(true);
  });

  it('BS-0190: 偏好推导 - 高频用户优先 biweekly', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'freq-user', 's1', { lastVisitDays: 15 });
    expect(svc.calculateTiming('freq-user')!.personalPreference.acceptableFrequency).toBe('biweekly');
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0191: 补充内容推荐边界
  // ══════════════════════════════════════════════════════════════

  it('BS-0191: 篮球/赛车兴趣生成体育内容', async () => {
    const svc = await createSvc();
    const profile = makeProfile(svc, 'sports-fan', 's1', {
      interests: ['篮球', '电子竞技'],
      totalSpend: 200,
    });
    const recs = svc.generateContentRecommendations('sports-fan', 5);
    const sportsContent = recs.find(r => r.matchTags.includes('sports'));
    expect(sportsContent).toBeTruthy();
    // 应有通用推荐
    const general = recs.find(r => r.matchTags.includes('general'));
    expect(general).toBeTruthy();
  });

  it('BS-0191: 无 tag 匹配时仍返回通用推荐', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'plain-user', 's1', {
      interests: [],
      totalSpend: 100,
      lastVisitDays: 5,
    });
    const recs = svc.generateContentRecommendations('plain-user', 10);
    // 仅触发通用推荐 + 无其他条件分支
    expect(recs.length).toBeGreaterThanOrEqual(1);
    const general = recs.find(r => r.matchTags.includes('general'));
    expect(general).toBeTruthy();
  });

  it('BS-0191: VVIP 级别也获得 VIP 专属推荐', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'vvip-user', 's1', {
      level: 'vvip',
      totalSpend: 10000,
    });
    const recs = svc.generateContentRecommendations('vvip-user', 5);
    const vipContent = recs.find(r => r.matchTags.includes('vip'));
    expect(vipContent).toBeTruthy();
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0192: 补充活动边界
  // ══════════════════════════════════════════════════════════════

  it('BS-0192: 完成未启动的活动仍然可以', async () => {
    const svc = await createSvc();
    const c = svc.createCampaign({
      campaignName: 'DirectComplete',
      targetSegments: ['all'],
      timing: { bestTime: 'afternoon' },
      channels: ['push'],
      contentTitles: ['Item'],
      targetAudience: 50,
    });
    // 不 launch 直接 complete
    const completed = svc.completeCampaign(c.id, { reachRate: 0.5, conversionRate: 0.1, actualROI: 0.2 });
    expect(completed).toBeDefined();
    expect(completed!.status).toBe('completed');
    expect(completed!.metrics.reachRate).toBe(0.5);
  });

  it('BS-0192: 多活动创建后 list 按状态过滤', async () => {
    const svc = await createSvc();
    const c1 = svc.createCampaign({ campaignName: 'A', targetSegments: ['x'], timing: {}, channels: ['push'], contentTitles: ['a'], targetAudience: 0 });
    const c2 = svc.createCampaign({ campaignName: 'B', targetSegments: ['x'], timing: {}, channels: ['push'], contentTitles: ['b'], targetAudience: 0 });
    const c3 = svc.createCampaign({ campaignName: 'C', targetSegments: ['x'], timing: {}, channels: ['push'], contentTitles: ['c'], targetAudience: 0 });
    svc.launchCampaign(c1.id);
    svc.launchCampaign(c3.id);

    expect(svc.listCampaigns('draft').length).toBe(1);
    expect(svc.listCampaigns('draft')[0].campaignName).toBe('B');
    expect(svc.listCampaigns('active').length).toBe(2);
  });

  it('BS-0192: 活动完整生命周期：draft → active → completed', async () => {
    const svc = await createSvc();
    const c = svc.createCampaign({ campaignName: 'Lifecycle', targetSegments: ['all'], timing: { bestTime: 'weekend' }, channels: ['push', 'sms'], contentTitles: ['Event'], targetAudience: 100 });
    expect(c.status).toBe('draft');
    svc.launchCampaign(c.id);
    expect(svc.getCampaign(c.id)!.status).toBe('active');
    svc.completeCampaign(c.id, { reachRate: 0.9, conversionRate: 0.3, actualROI: 1.5 });
    expect(svc.getCampaign(c.id)!.status).toBe('completed');
    expect(svc.getCampaign(c.id)!.metrics.actualROI).toBe(1.5);
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0193: 补充周报边界
  // ══════════════════════════════════════════════════════════════

  it('BS-0193: 周报仅统计已完成活动的转化率', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'report-u1', 'report-store');
    // 已完成的 campaign
    const c1 = svc.createCampaign({ campaignName: 'Done1', targetSegments: ['all'], timing: {}, channels: ['push'], contentTitles: ['a'], targetAudience: 10 });
    svc.completeCampaign(c1.id, { reachRate: 0.8, conversionRate: 0.2, actualROI: 0.3 });
    // 活跃中的 campaign（不计入 completed）
    const c2 = svc.createCampaign({ campaignName: 'Active1', targetSegments: ['all'], timing: {}, channels: ['push'], contentTitles: ['b'], targetAudience: 10 });
    svc.launchCampaign(c2.id);

    const report = svc.generateWeeklyReport('report-store');
    // active 的不算在 completedCampaigns 中
    expect(report.stats.avgConversionRate).toBeCloseTo(0.2, 4);
    expect(report.stats.totalCampaigns).toBe(2);
    expect(report.stats.totalUsers).toBe(1);
  });

  it('BS-0193: getWeeklyReport 通过 storeId 和当天日期正确匹配', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'r-1', 'get-report-store');
    svc.createCampaign({ campaignName: 'C', targetSegments: ['all'], timing: {}, channels: ['push'], contentTitles: ['c'], targetAudience: 5 });
    svc.generateWeeklyReport('get-report-store');
    const report = svc.getWeeklyReport('get-report-store');
    expect(report).toBeDefined();
    expect(report!.storeId).toBe('get-report-store');
  });

  it('BS-0193: 不同门店互不影响周报', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'store-a-u1', 'store-a');
    makeProfile(svc, 'store-b-u1', 'store-b');
    makeProfile(svc, 'store-b-u2', 'store-b');
    svc.generateWeeklyReport('store-a');
    svc.generateWeeklyReport('store-b');
    expect(svc.getWeeklyReport('store-a')!.stats.totalUsers).toBe(1);
    expect(svc.getWeeklyReport('store-b')!.stats.totalUsers).toBe(2);
  });

  it('BS-0193: reset 后所有存储清空', async () => {
    const svc = await createSvc();
    makeProfile(svc, 'reset-user', 's1');
    svc.createCampaign({ campaignName: 'ResetCamp', targetSegments: ['x'], timing: {}, channels: ['push'], contentTitles: ['x'], targetAudience: 0 });
    svc.calculateTiming('reset-user');
    svc.generateContentRecommendations('reset-user', 3);
    svc.generateWeeklyReport('s1');

    svc.reset();
    expect(svc.listProfiles().length).toBe(0);
    expect(svc.listCampaigns().length).toBe(0);
    expect(svc.getTiming('reset-user')).toBeUndefined();
    expect(svc.getContentRecommendations('reset-user')).toEqual([]);
    expect(svc.getWeeklyReport('s1')).toBeUndefined();
  });
});
