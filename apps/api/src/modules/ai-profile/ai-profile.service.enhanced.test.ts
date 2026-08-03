// ai-profile.service.enhanced.test.ts
// 深度补强：新增18个 test/it 用例，覆盖 normal path / edge cases / error handling 三大维度
// BS-0189~BS-0193

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { AiProfileService } from './ai-profile.service';
import type { TimingCategory } from './ai-profile.entity';

describe('AiProfileService — Enhanced Tests', () => {
  let svc: AiProfileService;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await Test.createTestingModule({
      providers: [AiProfileService],
    }).compile();
    svc = module.get(AiProfileService);
    svc.reset();
  });

  // ── 帮助函数 ──

  function makeProfile(
    userId: string,
    storeId: string,
    overrides?: {
      level?: string;
      interests?: string[];
      lastVisitDays?: number;
      totalSpend?: number;
      totalVisits?: number;
      avgStayMinutes?: number;
      preferredTime?: TimingCategory;
      preferredDays?: string[];
      peakHourRate?: number;
      pushOpenRate?: number;
      pushClickRate?: number;
      messageReadRate?: number;
      avgOrderAmount?: number;
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
        avgOrderAmount: overrides?.avgOrderAmount ?? (overrides?.totalSpend && overrides.totalSpend > 50 ? 50 : Math.max(overrides?.totalSpend ?? 500, 1)),
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

  // ═══════════════════════════════════════════════════════════
  // 正常路径 (Normal Path) — 6 个用例
  // ═══════════════════════════════════════════════════════════

  describe('normal path', () => {
    it('应该能创建多个画像并正确列出全部', () => {
      makeProfile('u1', 's1');
      makeProfile('u2', 's1');
      makeProfile('u3', 's2');
      const all = svc.listProfiles();
      expect(all).toHaveLength(3);
    });

    it('应该能通过 getProfileByUserId 找到正确的用户', () => {
      makeProfile('alice', 's1');
      makeProfile('bob', 's2', { level: 'vip' });
      const found = svc.getProfileByUserId('bob');
      expect(found).toBeDefined();
      expect(found!.baseInfo.level).toBe('vip');
      expect(found!.storeId).toBe('s2');
    });

    it('calculateTiming 应该生成完整的 TimingRecommendation', () => {
      makeProfile('timing-u1', 's1', { totalVisits: 30, peakHourRate: 0.7, pushOpenRate: 0.6 });
      const timing = svc.calculateTiming('timing-u1');
      expect(timing).toBeDefined();
      expect(timing!.recommendedChannels.length).toBeGreaterThanOrEqual(1);
      expect(timing!.personalPreference).toBeDefined();
      expect(timing!.personalPreference.acceptableFrequency).toBe('biweekly');
    });

    it('generateContentRecommendations 应该返回排好序的结果', () => {
      makeProfile('rec-u1', 's1', {
        interests: ['盲盒', '篮球', '赛车'],
        level: 'vip',
        totalSpend: 5000,
        lastVisitDays: 3,
      });
      const recs = svc.generateContentRecommendations('rec-u1', 10);
      expect(recs.length).toBeGreaterThanOrEqual(2);
      // 验证排序：vip 应该排在前列
      expect(recs[0].relevanceScore).toBeGreaterThanOrEqual(recs[recs.length - 1].relevanceScore);
    });

    it('createCampaign → launchCampaign → completeCampaign 完整生命周期', () => {
      const c = svc.createCampaign({
        campaignName: '夏季促销',
        targetSegments: ['vip'],
        timing: { bestTime: 'weekend' },
        channels: ['push', 'sms'],
        contentTitles: ['VIP专享折扣', '周末特惠'],
        targetAudience: 500,
      });
      expect(c.status).toBe('draft');
      expect(c.metrics.targetAudience).toBe(500);

      svc.launchCampaign(c.id);
      expect(svc.getCampaign(c.id)!.status).toBe('active');

      svc.completeCampaign(c.id, { reachRate: 0.65, conversionRate: 0.18, actualROI: 0.4 });
      const done = svc.getCampaign(c.id)!;
      expect(done.status).toBe('completed');
      expect(done.metrics.reachRate).toBe(0.65);
      expect(done.metrics.conversionRate).toBe(0.18);
      expect(done.metrics.actualROI).toBe(0.4);
    });

    it('generateWeeklyReport 应该包含完整统计信息', () => {
      makeProfile('report-u1', 'store-r1', { lastVisitDays: 2 });
      makeProfile('report-u2', 'store-r1', { lastVisitDays: 15 });
      makeProfile('report-u3', 'store-r1', { level: 'new', lastVisitDays: 1, totalSpend: 0 });

      const c = svc.createCampaign({
        campaignName: 'ReportCamp',
        targetSegments: ['all'],
        timing: {},
        channels: ['push'],
        contentTitles: ['X'],
        targetAudience: 100,
      });
      svc.completeCampaign(c.id, { reachRate: 0.75, conversionRate: 0.22, actualROI: 0.35 });

      const report = svc.generateWeeklyReport('store-r1');
      expect(report.stats.totalUsers).toBe(3);
      // activeUsers = users with lastVisitDays <= 7
      expect(report.stats.activeUsers).toBe(2); // u1 (2) + u3 (1)
      // 所有3个用户都是在当前测试中创建的，因此都是 newUsers
      expect(report.stats.newUsers).toBe(3);
      expect(report.stats.totalCampaigns).toBe(1);
      expect(report.stats.avgConversionRate).toBe(0.22);
      expect(report.recommendations.length).toBeGreaterThanOrEqual(1);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 边界条件 (Edge Cases) — 6 个用例
  // ═══════════════════════════════════════════════════════════

  describe('edge cases', () => {
    it('createOrUpdateProfile 不传 id 时应该自动生成', () => {
      const p1 = svc.createOrUpdateProfile({
        userId: 'auto-id',
        storeId: 's1',
        baseInfo: { gender: 'female', ageGroup: '18_25', level: 'regular' as any, consumptionHabbit: 'value', interests: [] },
        consumptionMetrics: { totalSpend: 100, avgOrderAmount: 30, monthSpend: 50, lastVisitDays: 1, visitFrequency: 2, favoriteCategory: '', couponUsedCount: 0 },
        activityMetrics: { totalVisits: 5, avgStayMinutes: 30, preferredTime: 'morning', preferredDays: ['Monday'], peakHourRate: 0.2 },
        engagementMetrics: { pushOpenRate: 0.1, pushClickRate: 0.05, messageReadRate: 0.1, socialShareCount: 0, reviewCount: 0, avgRating: 0 },
        tags: [],
      });
      expect(p1.id).toMatch(/^profile-/);
    });

    it('多个门店同名 userId 应该共存（相同 userId 不同 storeId）', () => {
      // 同名 userId 在不同门店是允许的
      const p1 = makeProfile('multi-store-user', 'store-a');
      const p2 = makeProfile('multi-store-user', 'store-b');
      // getProfileByUserId 只返回第一个匹配
      const found = svc.getProfileByUserId('multi-store-user');
      expect(found).toBeDefined();
      // 两个 profile 是不同的记录（id 不同）
      expect(p1.id).not.toBe(p2.id);
      expect(p1.storeId).toBe('store-a');
      expect(p2.storeId).toBe('store-b');
      expect(svc.listProfiles().length).toBe(2);
    });

    it('generateContentRecommendations limit = 1 只返回最相关的一条', () => {
      makeProfile('limit-1', 's1', {
        level: 'vvip',
        interests: ['盲盒', '赛车'],
        totalSpend: 10000,
        lastVisitDays: 1,
      });
      const recs = svc.generateContentRecommendations('limit-1', 1);
      expect(recs).toHaveLength(1);
      // 应该返回最相关的（VVIP 专属，score 0.95）
      expect(recs[0].relevanceScore).toBe(0.95);
    });

    it('getSegmentUsers 应该去重（同一用户匹配多个 tag 只返回一次）', () => {
      makeProfile('tag-user', 's1', { interests: ['赛车', '篮球'] });
      const result = svc.getSegmentUsers(['赛车', '篮球'], 's1');
      expect(result).toHaveLength(1);
    });

    it('getWeeklyReport 无用户无活动时统计数据为 0', () => {
      const report = svc.generateWeeklyReport('empty-store');
      expect(report.stats.totalUsers).toBe(0);
      expect(report.stats.activeUsers).toBe(0);
      expect(report.stats.newUsers).toBe(0);
      expect(report.stats.totalCampaigns).toBe(0);
      expect(report.stats.avgOpenRate).toBe(0);
      expect(report.stats.roi).toBe(0);
    });

    it('completeCampaign 允许设置所有指标为 0', () => {
      const c = svc.createCampaign({
        campaignName: 'ZeroMetrics',
        targetSegments: ['all'],
        timing: {},
        channels: ['push'],
        contentTitles: ['Z'],
        targetAudience: 0,
      });
      svc.completeCampaign(c.id, { reachRate: 0, conversionRate: 0, actualROI: 0 });
      const done = svc.getCampaign(c.id)!;
      expect(done.metrics.reachRate).toBe(0);
      expect(done.metrics.conversionRate).toBe(0);
      expect(done.metrics.actualROI).toBe(0);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // 异常路径 (Error Handling) — 6 个用例
  // ═══════════════════════════════════════════════════════════

  describe('error handling', () => {
    it('getProfileByUserId 找不到时返回 undefined（非异常抛出）', () => {
      const result = svc.getProfileByUserId('nonexistent-user');
      expect(result).toBeUndefined();
    });

    it('getProfile 用不存在的 id 查询返回 undefined', () => {
      const result = svc.getProfile('fake-id-12345');
      expect(result).toBeUndefined();
    });

    it('calculateTiming 对不存在的用户返回 undefined', () => {
      const result = svc.calculateTiming('no-such-user');
      expect(result).toBeUndefined();
    });

    it('launchCampaign 不存在时返回 undefined', () => {
      const result = svc.launchCampaign('campaign-not-exist');
      expect(result).toBeUndefined();
    });

    it('completeCampaign 不存在时返回 undefined', () => {
      const result = svc.completeCampaign('non-existent-campaign', {
        reachRate: 0.5,
        conversionRate: 0.1,
        actualROI: 0.2,
      });
      expect(result).toBeUndefined();
    });

    it('getWeeklyReport 不存在时报 undefined（未生成）', () => {
      const result = svc.getWeeklyReport('no-report-store');
      expect(result).toBeUndefined();
    });
  });
});
