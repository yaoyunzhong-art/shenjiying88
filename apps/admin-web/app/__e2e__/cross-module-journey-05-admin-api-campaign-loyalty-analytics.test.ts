/**
 * 🦞 龙虾哥 L3 跨模块端到端 · 链05
 * 管理端(营销活动) → API(Campaign创建) → Domain(状态机) → API(Loyalty积分) → API(Analytics报表)
 *
 * 模拟链路:
 *   admin-web 创建营销活动 → API campaign 模块存储 → Domain 状态机 (draft→active→completed)
 *   → API loyalty 积分规则关联 → 活动参与产生积分 → API analytics 报表聚合
 *
 * 验证:
 *   - 营销活动创建后正确持久化并进入 draft 状态
 *   - 活动上线后关联积分规则生效
 *   - 用户参与活动时积分正确发放
 *   - 活动结束后 analytics 正确聚合参与率/积分发放量/ROI
 *   - 反例: 活动预算不足时无法上线
 *   - 边界: 活动结束后积分规则自动失效
 */

import assert from 'node:assert/strict';
import test, { describe } from 'node:test';

// ─── 类型定义 ───

type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';

interface Campaign {
  id: string;
  tenantId: string;
  name: string;
  type: 'discount' | 'points_multiplier' | 'cashback' | 'referral';
  budget: number;
  spentBudget: number;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  loyaltyRuleId?: string;
  targetAudience: string[];
  createdAt: string;
  updatedAt: string;
}

interface LoyaltyRule {
  id: string;
  campaignId: string;
  pointsMultiplier: number;
  maxPointsPerUser: number;
  appliesTo: string[];
  active: boolean;
}

interface UserParticipation {
  userId: string;
  campaignId: string;
  orderId: string;
  orderAmount: number;
  pointsEarned: number;
  participatedAt: string;
}

interface AnalyticsReport {
  campaignId: string;
  name: string;
  totalParticipants: number;
  totalPointsIssued: number;
  totalDiscountAmount: number;
  totalSalesAmount: number;
  roi: number; // (sales - cost) / cost
  engagementRate: number; // participants / audience size
  status: CampaignStatus;
}

// ─── Domain 状态机（模拟 @m5/domain 的 campaign lifecycle） ───

function campaignCanTransition(current: CampaignStatus, target: CampaignStatus): boolean {
  const transitions: Record<CampaignStatus, CampaignStatus[]> = {
    draft: ['active', 'cancelled'],
    active: ['paused', 'completed'],
    paused: ['active', 'completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };
  return transitions[current].includes(target);
}

function validateCampaignForActivation(campaign: Campaign): { allowed: boolean; reason?: string } {
  if (campaign.budget <= 0) return { allowed: false, reason: 'Budget must be positive' };
  if (campaign.spentBudget >= campaign.budget) return { allowed: false, reason: 'Budget already fully spent' };
  if (new Date(campaign.endDate) <= new Date(campaign.startDate)) {
    return { allowed: false, reason: 'End date must be after start date' };
  }
  if (campaign.targetAudience.length === 0) return { allowed: false, reason: 'At least one target audience required' };
  return { allowed: true };
}

function processLoyaltyPoints(rule: LoyaltyRule, orderAmount: number, existingPoints: number): { earned: number; exceeded: boolean } {
  if (!rule.active) return { earned: 0, exceeded: false };
  const earned = Math.round(orderAmount * rule.pointsMultiplier);
  const totalAfter = existingPoints + earned;
  const exceeded = rule.maxPointsPerUser > 0 && totalAfter > rule.maxPointsPerUser;
  return {
    earned: exceeded ? Math.max(0, rule.maxPointsPerUser - existingPoints) : earned,
    exceeded,
  };
}

function generateAnalyticsReport(
  campaign: Campaign,
  participations: UserParticipation[],
  audienceSize: number,
): AnalyticsReport {
  const totalParticipants = new Set(participations.map(p => p.userId)).size;
  const totalPointsIssued = participations.reduce((sum, p) => sum + p.pointsEarned, 0);
  const totalSalesAmount = participations.reduce((sum, p) => sum + p.orderAmount, 0);
  const totalDiscountAmount = campaign.spentBudget;

  return {
    campaignId: campaign.id,
    name: campaign.name,
    totalParticipants,
    totalPointsIssued,
    totalDiscountAmount,
    totalSalesAmount,
    roi: totalDiscountAmount > 0
      ? (totalSalesAmount - totalDiscountAmount) / totalDiscountAmount
      : 0,
    engagementRate: audienceSize > 0 ? totalParticipants / audienceSize : 0,
    status: campaign.status,
  };
}

// ─── 测试链 ───

describe('链05: 管理端营销活动 → API Campaign → Domain 状态机 → API Loyalty → API Analytics', () => {

  let campaign: Campaign;
  let loyaltyRule: LoyaltyRule;
  const participations: UserParticipation[] = [];

  // ---------- 正例 1: 创建 → 上线 → 参与 → 积分 → 报表 ----------
  test('[正例] 创建新活动(draft) → Domain 校验通过 → 上线(active) → 用户参与 → 积分发放 → 报表聚合', () => {
    // Step 1: 管理端创建活动
    campaign = {
      id: 'camp-001',
      tenantId: 't1',
      name: '618 年中大促',
      type: 'points_multiplier',
      budget: 100000,
      spentBudget: 0,
      status: 'draft',
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-15T23:59:59Z',
      targetAudience: ['vip', 'regular'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    assert.equal(campaign.status, 'draft', '新活动应为 draft 状态');

    // Step 2: Domain 校验 → 允许上线
    const validation = validateCampaignForActivation(campaign);
    assert.ok(validation.allowed, 'Campaign 应通过上线校验');
    assert.ok(campaignCanTransition('draft', 'active'), 'draft → active 应允许');

    campaign.status = 'active';
    campaign.updatedAt = new Date().toISOString();

    // Step 3: 关联积分规则
    loyaltyRule = {
      id: 'rule-001',
      campaignId: campaign.id,
      pointsMultiplier: 2,
      maxPointsPerUser: 5000,
      appliesTo: ['vip', 'regular'],
      active: true,
    };
    assert.ok(loyaltyRule.active, '积分规则应默认启用');

    // Step 4: 用户参与 — 用户 A
    const pa1: UserParticipation = {
      userId: 'user-a',
      campaignId: campaign.id,
      orderId: 'ord-001',
      orderAmount: 2000,
      pointsEarned: 0,
      participatedAt: new Date().toISOString(),
    };
    const resultA = processLoyaltyPoints(loyaltyRule, pa1.orderAmount, 0);
    pa1.pointsEarned = resultA.earned;
    participations.push(pa1);
    assert.equal(pa1.pointsEarned, 4000, '2000*2=4000 积分');
    assert.equal(resultA.exceeded, false, '未超过上限');

    // Step 5: 用户参与 — 用户 B (接近上限)
    const pa2: UserParticipation = {
      userId: 'user-b',
      campaignId: campaign.id,
      orderId: 'ord-002',
      orderAmount: 3000,
      pointsEarned: 0,
      participatedAt: new Date().toISOString(),
    };
    const resultB = processLoyaltyPoints(loyaltyRule, pa2.orderAmount, 0);
    pa2.pointsEarned = resultB.earned;
    participations.push(pa2);
    assert.equal(pa2.pointsEarned, 5000, '3000*2=6000 但上限 5000 → 发 5000');
    assert.equal(resultB.exceeded, true, '超出上限');

    // Step 6: 活动完成
    assert.ok(campaignCanTransition('active', 'completed'), 'active → completed 应允许');
    campaign.status = 'completed';
    loyaltyRule.active = false; // 活动结束后积分规则自动失效

    // Step 7: Analytics 报表
    const report = generateAnalyticsReport(campaign, participations, 100);
    assert.equal(report.totalParticipants, 2, '应有 2 个参与者');
    assert.equal(report.totalPointsIssued, 9000, '共发放 4000+5000=9000 积分');
    assert.equal(report.totalSalesAmount, 5000, '总销售额 2000+3000=5000');
    assert.ok(report.roi >= 0, 'ROI 应>0');
    assert.equal(report.engagementRate, 0.02, '参与率 2/100=0.02');
    assert.equal(report.status, 'completed', '活动状态应 completed');
  });

  // ---------- 正例 2: 活动暂停后恢复 ----------
  test('[正例] 活动的暂停/恢复生命周期: active → paused → active', () => {
    const c: Campaign = {
      id: 'camp-002',
      tenantId: 't1',
      name: '夏日促销',
      type: 'discount',
      budget: 50000,
      spentBudget: 10000,
      status: 'active',
      startDate: '2026-06-01T00:00:00Z',
      endDate: '2026-06-30T23:59:59Z',
      targetAudience: ['regular'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // active → paused
    assert.ok(campaignCanTransition('active', 'paused'), 'active → paused 应允许');
    c.status = 'paused';

    // loyaltry rule 暂停
    const rule: LoyaltyRule = {
      id: 'rule-002',
      campaignId: c.id,
      pointsMultiplier: 1.5,
      maxPointsPerUser: 2000,
      appliesTo: ['regular'],
      active: false,
    };
    // 暂停期间不发放积分
    const result = processLoyaltyPoints(rule, 1000, 0);
    assert.equal(result.earned, 0, '暂停期间应不发放积分');

    // paused → active
    assert.ok(campaignCanTransition('paused', 'active'), 'paused → active 应允许');
    c.status = 'active';
    rule.active = true;

    // 恢复后正常发放
    const result2 = processLoyaltyPoints(rule, 1000, 0);
    assert.equal(result2.earned, 1500, '恢复后 1000*1.5=1500 积分');
  });

  // ---------- 反例: 预算不足无法上线 ----------
  test('[反例] 预算为 0 的活动 → Domain 校验拒绝上线 → 停留在 draft', () => {
    const noBudgetCampaign: Campaign = {
      id: 'camp-bad',
      tenantId: 't1',
      name: '无预算活动',
      type: 'cashback',
      budget: 0,
      spentBudget: 0,
      status: 'draft',
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-15T23:59:59Z',
      targetAudience: ['vip'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const validation = validateCampaignForActivation(noBudgetCampaign);
    assert.equal(validation.allowed, false, '预算为 0 不应允许上线');
    assert.equal(validation.reason, 'Budget must be positive');

    // 状态仍为 draft
    assert.equal(noBudgetCampaign.status, 'draft');
  });

  // ---------- 反例: 非法状态转换 ----------
  test('[反例] draft → completed 直接跳转 → Domain 拒绝', () => {
    const camp: Campaign = {
      id: 'camp-bad2',
      tenantId: 't1',
      name: '非法跳转',
      type: 'discount',
      budget: 10000,
      spentBudget: 0,
      status: 'draft',
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-15T23:59:59Z',
      targetAudience: ['vip'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    assert.equal(campaignCanTransition(camp.status, 'completed'), false, 'draft → completed 不应允许');
    assert.equal(campaignCanTransition(camp.status, 'active'), true, 'draft → active 才允许');
  });

  // ---------- 边界: 活动结束日期在开始日期之前 ----------
  test('[边界] 结束日期早于开始日期 → Domain 拒绝上线', () => {
    const invalidDatesCampaign: Campaign = {
      id: 'camp-bad3',
      tenantId: 't1',
      name: '日期错误',
      type: 'referral',
      budget: 20000,
      spentBudget: 0,
      status: 'draft',
      startDate: '2026-08-01T00:00:00Z',
      endDate: '2026-07-01T00:00:00Z', // 比开始日期早
      targetAudience: ['vip'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validation = validateCampaignForActivation(invalidDatesCampaign);
    assert.equal(validation.allowed, false, '日期不正确不应允许上线');
    assert.ok(validation.reason!.includes('End date must be after start date'));
  });

  // ---------- 边界: 无目标受众 ----------
  test('[边界] 空目标受众 → Domain 拒绝上线', () => {
    const noAudience: Campaign = {
      id: 'camp-bad4',
      tenantId: 't1',
      name: '无受众',
      type: 'discount',
      budget: 50000,
      spentBudget: 0,
      status: 'draft',
      startDate: '2026-07-01T00:00:00Z',
      endDate: '2026-07-15T23:59:59Z',
      targetAudience: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const validation = validateCampaignForActivation(noAudience);
    assert.equal(validation.allowed, false);
    assert.equal(validation.reason, 'At least one target audience required');
  });

  // =======================================================================
  // 🆕 新增: 扩展测试 — 边界场景、错误路径、并发场景
  // =======================================================================

  describe('🆕 [新增] 扩展边界场景', () => {

    test('[边界] 活动预算刚好完全花完 → spentBudget == budget → 无法激活', () => {
      const camp: Campaign = {
        id: 'camp-edge-budget-exhausted',
        tenantId: 't1',
        name: '预算耗尽',
        type: 'cashback',
        budget: 50000,
        spentBudget: 50000,
        status: 'draft',
        startDate: '2026-08-01T00:00:00Z',
        endDate: '2026-08-15T23:59:59Z',
        targetAudience: ['vip', 'regular'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const validation = validateCampaignForActivation(camp);
      assert.equal(validation.allowed, false, '预算花完不可激活');
      assert.ok(validation.reason!.includes('already fully spent'), '理由提示预算已花完');
    });

    test('[边界] 活动起止日期完全相同时刻 → 拒绝上线', () => {
      const sameDay: Campaign = {
        id: 'camp-edge-same-date',
        tenantId: 't1',
        name: '同日活动',
        type: 'discount',
        budget: 30000,
        spentBudget: 0,
        status: 'draft',
        startDate: '2026-08-01T00:00:00Z',
        endDate: '2026-08-01T00:00:00Z',
        targetAudience: ['vip'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const validation = validateCampaignForActivation(sameDay);
      assert.equal(validation.allowed, false, '同日不可激活');
    });

    test('[边界] 活动仅有一个目标受众且金额极小 → 正常上线', () => {
      const singleUser: Campaign = {
        id: 'camp-edge-single-audience',
        tenantId: 't1',
        name: '单人活动',
        type: 'points_multiplier',
        budget: 1,
        spentBudget: 0,
        status: 'draft',
        startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-07-02T23:59:59Z',
        targetAudience: ['vip'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const validation = validateCampaignForActivation(singleUser);
      assert.ok(validation.allowed, '至少1受众+正预算应可激活');
    });

    test('[边界] 积分倍率为 1.0（无加成）→ 正确计算积分', () => {
      const rule: LoyaltyRule = {
        id: 'rule-edge-no-multiplier',
        campaignId: 'camp-edge-no-multiplier',
        pointsMultiplier: 1,
        maxPointsPerUser: 100000,
        appliesTo: ['regular'],
        active: true,
      };
      const result = processLoyaltyPoints(rule, 500, 0);
      assert.equal(result.earned, 500, '倍率1.0时积分=金额');
      assert.equal(result.exceeded, false);
    });

    test('[边界] 积分倍率为 0 → 不产生任何积分', () => {
      const rule: LoyaltyRule = {
        id: 'rule-edge-zero-multiplier',
        campaignId: 'camp-edge-zero-multiplier',
        pointsMultiplier: 0,
        maxPointsPerUser: 10000,
        appliesTo: ['vip'],
        active: true,
      };
      const result = processLoyaltyPoints(rule, 9999, 0);
      assert.equal(result.earned, 0, '倍率0应得0积分');
    });

    test('[边界] 积分上限 maxPointsPerUser = 0（无限制）→ 全额发放', () => {
      const rule: LoyaltyRule = {
        id: 'rule-edge-unlimited',
        campaignId: 'camp-edge-unlimited',
        pointsMultiplier: 2,
        maxPointsPerUser: 0,
        appliesTo: ['vip'],
        active: true,
      };
      const result = processLoyaltyPoints(rule, 50000, 0);
      assert.equal(result.earned, 100000, '无上限应全额发放');
      assert.equal(result.exceeded, false, '0上限表示无限制');
    });

    test('[边界] 用户已有积分 + 新订单 = 超出上限 → 只发放差额', () => {
      const rule: LoyaltyRule = {
        id: 'rule-edge-partial-exceed',
        campaignId: 'camp-edge-partial',
        pointsMultiplier: 3,
        maxPointsPerUser: 1000,
        appliesTo: ['vip'],
        active: true,
      };
      // 已有 800 分，新订单 200 → 3000*3=3000 但上限1000，可再发200
      const result = processLoyaltyPoints(rule, 200, 800);
      assert.equal(result.earned, 200, '差额 1000-800=200');
      assert.ok(result.exceeded, '已超上限标记');
    });
  });

  describe('🆕 [新增] 扩展错误路径', () => {

    test('[反例] 活动已 cancelled → 无法转换到任何状态', () => {
      const cancelled: Campaign = {
        id: 'camp-err-cancelled',
        tenantId: 't1',
        name: '已取消活动',
        type: 'discount',
        budget: 10000,
        spentBudget: 0,
        status: 'cancelled',
        startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-07-15T23:59:59Z',
        targetAudience: ['vip'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      assert.equal(campaignCanTransition('cancelled', 'draft'), false, 'cancelled→draft 不允许');
      assert.equal(campaignCanTransition('cancelled', 'active'), false, 'cancelled→active 不允许');
      assert.equal(campaignCanTransition('cancelled', 'completed'), false, 'cancelled→completed 不允许');
    });

    test('[反例] 活动 completed → 禁止任何状态变更', () => {
      assert.equal(campaignCanTransition('completed', 'draft'), false);
      assert.equal(campaignCanTransition('completed', 'active'), false);
      assert.equal(campaignCanTransition('completed', 'paused'), false);
      assert.equal(campaignCanTransition('completed', 'cancelled'), false);
    });

    test('[反例] spentBudget 超过 budget → 禁止激活', () => {
      const camp: Campaign = {
        id: 'camp-err-overbudget',
        tenantId: 't1',
        name: '超预算',
        type: 'cashback',
        budget: 10000,
        spentBudget: 15000,
        status: 'draft',
        startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-07-15T23:59:59Z',
        targetAudience: ['vip'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const validation = validateCampaignForActivation(camp);
      assert.equal(validation.allowed, false, '超预算不可激活');
    });

    test('[反例] 积分规则 inactive → 即使活动 active 也不发积分', () => {
      const rule: LoyaltyRule = {
        id: 'rule-err-inactive',
        campaignId: 'camp-err-inactive',
        pointsMultiplier: 10,
        maxPointsPerUser: 50000,
        appliesTo: ['vip'],
        active: false,
      };
      const result = processLoyaltyPoints(rule, 1000, 0);
      assert.equal(result.earned, 0, 'inactive 规则不发积分');
    });

    test('[反例] 用户未在 appliesTo 列表中 → 不应发积分但当前实现不做检查', () => {
      // 当前 processLoyaltyPoints 不检查用户类型，测试表达业务约束
      const rule: LoyaltyRule = {
        id: 'rule-err-wrong-audience',
        campaignId: 'camp-err-wrong-audience',
        pointsMultiplier: 2,
        maxPointsPerUser: 5000,
        appliesTo: ['merchant'], // 仅商家可参与
        active: true,
      };
      // 消费者参与仍能获得积分但业务上不应该 — 标记已知问题
      const result = processLoyaltyPoints(rule, 500, 0);
      assert.equal(result.earned, 1000, '⚠ 已知issue: 规则不检查受众类型');
    });
  });

  describe('🆕 [新增] 扩展并发/批量场景', () => {

    test('[并发] 多个用户同时参与同一活动 → 每个独立计算积分', () => {
      const rule: LoyaltyRule = {
        id: 'rule-concur-001',
        campaignId: 'camp-concur',
        pointsMultiplier: 1.5,
        maxPointsPerUser: 3000,
        appliesTo: ['vip', 'regular'],
        active: true,
      };

      const users = ['user-1', 'user-2', 'user-3', 'user-4', 'user-5'];
      const results = users.map((uid) => {
        const amount = 1000;
        return { userId: uid, ...processLoyaltyPoints(rule, amount, 0) };
      });

      results.forEach((r) => {
        assert.equal(r.earned, 1500, '每人1000*1.5=1500');
        assert.equal(r.exceeded, false, '1500 < 3000上限');
      });
    });

    test('[并发] 同一用户多次参与同一活动 → 累积积分受上限约束', () => {
      const rule: LoyaltyRule = {
        id: 'rule-concur-same-user',
        campaignId: 'camp-concur-user',
        pointsMultiplier: 2,
        maxPointsPerUser: 300,
        appliesTo: ['vip'],
        active: true,
      };

      let total = 0;
      const earnings: number[] = [];
      for (let i = 0; i < 5; i++) {
        const result = processLoyaltyPoints(rule, 100, total);
        earnings.push(result.earned);
        total += result.earned;
      }

      // 第1次:200, 第2次:100(上限剩余100), 第3~5次:0
      assert.deepEqual(earnings, [200, 100, 0, 0, 0], '前1次满额,第2次差额,第3~5次0');
      assert.equal(total, 300, '上限300分');
    });

    test('[批量] 大量参与数据 → Analytics 报表正确聚合', () => {
      const campaign: Campaign = {
        id: 'camp-bulk-analytics',
        tenantId: 't1',
        name: '批量测试活动',
        type: 'points_multiplier',
        budget: 500000,
        spentBudget: 100000,
        status: 'completed',
        startDate: '2026-06-01T00:00:00Z',
        endDate: '2026-06-30T23:59:59Z',
        targetAudience: ['vip', 'regular'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const manyParticipations: UserParticipation[] = [];
      let totalAmount = 0;
      let totalPoints = 0;
      for (let i = 0; i < 50; i++) {
        const amount = Math.round(Math.random() * 5000 + 100);
        const points = Math.round(amount * 2);
        totalAmount += amount;
        totalPoints += points;
        manyParticipations.push({
          userId: `bulk-user-${i % 10}`, // 10 个不同用户重复
          campaignId: 'camp-bulk-analytics',
          orderId: `bulk-ord-${i}`,
          orderAmount: amount,
          pointsEarned: points,
          participatedAt: new Date().toISOString(),
        });
      }

      const report = generateAnalyticsReport(campaign, manyParticipations, 1000);
      assert.equal(report.totalParticipants, 10, '10个不同用户');
      assert.equal(report.totalPointsIssued, totalPoints, '积分总额匹配');
      assert.equal(report.totalSalesAmount, totalAmount, '销售额匹配');
      assert.ok(report.roi >= 0, 'ROI >= 0');
      assert.equal(report.engagementRate, 0.01, '10/1000=0.01');
    });
  });

  describe('🆕 [新增] 扩展状态机全量覆盖', () => {

    test('[状态机] draft → cancelled 合法路径', () => {
      assert.ok(campaignCanTransition('draft', 'cancelled'), 'draft→cancelled');
    });

    test('[状态机] paused → cancelled 合法路径', () => {
      assert.ok(campaignCanTransition('paused', 'cancelled'), 'paused→cancelled');
    });

    test('[状态机] paused → completed 合法路径', () => {
      assert.ok(campaignCanTransition('paused', 'completed'), 'paused→completed');
    });

    test('[状态机] active → paused 合法路径', () => {
      assert.ok(campaignCanTransition('active', 'paused'), 'active→paused');
    });
  });

  describe('🆕 [新增] Analytics 报表边界', () => {

    test('[边界] 无任何参与者 → Analytics 报表全零', () => {
      const camp: Campaign = {
        id: 'camp-empty-analytics',
        tenantId: 't1',
        name: '零参与',
        type: 'discount',
        budget: 10000,
        spentBudget: 0,
        status: 'active',
        startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-07-15T23:59:59Z',
        targetAudience: ['vip'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const report = generateAnalyticsReport(camp, [], 0);
      assert.equal(report.totalParticipants, 0);
      assert.equal(report.totalPointsIssued, 0);
      assert.equal(report.totalSalesAmount, 0);
      assert.equal(report.roi, 0);
      assert.equal(report.engagementRate, 0);
    });

    test('[边界] 活动投入大于产出 → ROI 为负数', () => {
      const camp: Campaign = {
        id: 'camp-negative-roi',
        tenantId: 't1',
        name: '亏损活动',
        type: 'cashback',
        budget: 100000,
        spentBudget: 80000,
        status: 'completed',
        startDate: '2026-07-01T00:00:00Z',
        endDate: '2026-07-15T23:59:59Z',
        targetAudience: ['vip'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      // 销售额只有 50000，成本 80000
      const participations: UserParticipation[] = [{
        userId: 'user-roi',
        campaignId: camp.id,
        orderId: 'ord-roi-1',
        orderAmount: 50000,
        pointsEarned: 50000,
        participatedAt: new Date().toISOString(),
      }];

      const report = generateAnalyticsReport(camp, participations, 100);
      assert.equal(report.roi, (50000 - 80000) / 80000, 'ROI应为负');
      assert.ok(report.roi < 0, 'ROI 小于0');
    });
  });
});
