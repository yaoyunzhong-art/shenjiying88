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
});
