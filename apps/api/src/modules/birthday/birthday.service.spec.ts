// birthday.service.spec.ts · WP-15 生日趴引擎
// BS-0199~BS-0206 — service 层测试 ≥15 个

import { Test } from '@nestjs/testing';
import { BirthdayService } from './birthday.service';
import { BirthdayTier } from './birthday.entity';

describe('BirthdayService', () => {
  async function createSvc() {
    const module = await Test.createTestingModule({
      providers: [BirthdayService],
    }).compile();
    const svc = module.get(BirthdayService);
    svc.reset();
    return svc;
  }

  function makePlan(
    svc: BirthdayService,
    overrides: Partial<{
      memberId: string;
      birthday: string;
      advanceDays: number;
      tier: BirthdayTier;
      rewardType: string;
      rewardValue: number;
      allowFriends: boolean;
      friendDiscount: number;
    }> = {},
  ) {
    const allowFriends = overrides.allowFriends ?? false;
    return svc.createPlan({
      memberId: overrides.memberId ?? 'm1',
      birthday: overrides.birthday ?? '07-25',
      advanceDays: overrides.advanceDays ?? 3,
      tier: overrides.tier ?? BirthdayTier.Standard,
      rewardType: (overrides.rewardType as any) ?? 'coupon',
      rewardValue: overrides.rewardValue ?? 50,
      allowFriends,
      // 只有 allowFriends=true 时提供默认折扣值
      friendDiscount: allowFriends ? (overrides.friendDiscount ?? 0.8) : undefined,
    });
  }

  // ══════════════════════════════════════════════════════════════
  // BS-0199: 生日识别
  // ══════════════════════════════════════════════════════════════

  it('BS-0199: 标记近30天即将生日的会员（正例）', async () => {
    const svc = await createSvc();
    makePlan(svc, { memberId: 'm1', birthday: '08-01' });
    makePlan(svc, { memberId: 'm2', birthday: '12-25' });

    // markUpcomingBirthdays 标记所有传入的会员（有方案即标），不自行过滤日期
    const result = svc.markUpcomingBirthdays(['m1', 'm2'], { m1: '08-01', m2: '12-25' });
    expect(result.marked).toBe(2);
  });

  it('BS-0199: 标记不存在会员返回0', async () => {
    const svc = await createSvc();
    const result = svc.markUpcomingBirthdays(['nonexist'], { nonexist: '08-01' });
    expect(result.marked).toBe(0);
  });

  it('BS-0199: checkIsUpcoming 近30天生日返回 true', async () => {
    const svc = await createSvc();
    // 使用一个在未来几天的日期
    const now = new Date();
    const future = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
    const mm = String(future.getMonth() + 1).padStart(2, '0');
    const dd = String(future.getDate()).padStart(2, '0');
    expect(svc.checkIsUpcoming('m1', `${mm}-${dd}`)).toBe(true);
  });

  it('BS-0199: checkIsUpcoming 30天外返回 false', async () => {
    const svc = await createSvc();
    expect(svc.checkIsUpcoming('m1', '01-01')).toBe(false);
  });

  it('BS-0199: 无效生日格式返回 false', async () => {
    const svc = await createSvc();
    expect(svc.checkIsUpcoming('m1', '')).toBe(false);
    expect(svc.checkIsUpcoming('m1', 'invalid')).toBe(false);
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0200~BS-0202: 自动营销
  // ══════════════════════════════════════════════════════════════

  it('BS-0200: 创建生日方案（正例）', async () => {
    const svc = await createSvc();
    const plan = makePlan(svc);
    expect(plan.id).toBeTruthy();
    expect(plan.memberId).toBe('m1');
    expect(plan.birthday).toBe('07-25');
    expect(plan.status).toBe('pending');
    expect(plan.planDate).toBeTruthy();
  });

  it('BS-0200: 空 memberId 抛 BadRequest', async () => {
    const svc = await createSvc();
    expect(() =>
      svc.createPlan({
        memberId: '',
        birthday: '07-25',
        advanceDays: 3,
        tier: BirthdayTier.Standard,
        rewardType: 'coupon',
        rewardValue: 50,
      }),
    ).toThrow('memberId 不能为空');
  });

  it('BS-0200: 无效生日格式抛 BadRequest', async () => {
    const svc = await createSvc();
    expect(() =>
      svc.createPlan({
        memberId: 'm1',
        birthday: '0725',
        advanceDays: 3,
        tier: BirthdayTier.Standard,
        rewardType: 'coupon',
        rewardValue: 50,
      }),
    ).toThrow('birthday 格式必须为 MM-DD');
  });

  it('BS-0200: advanceDays 边界值', async () => {
    const svc = await createSvc();
    expect(() =>
      svc.createPlan({
        memberId: 'm1',
        birthday: '07-25',
        advanceDays: 31,
        tier: BirthdayTier.Standard,
        rewardType: 'coupon',
        rewardValue: 50,
      }),
    ).toThrow('advanceDays 必须在 0~30 范围内');
    expect(() =>
      svc.createPlan({
        memberId: 'm1',
        birthday: '07-25',
        advanceDays: -1,
        tier: BirthdayTier.Standard,
        rewardType: 'coupon',
        rewardValue: 50,
      }),
    ).toThrow('advanceDays 必须在 0~30 范围内');
  });

  it('BS-0200: rewardValue <= 0 抛 BadRequest', async () => {
    const svc = await createSvc();
    expect(() =>
      svc.createPlan({
        memberId: 'm1',
        birthday: '07-25',
        advanceDays: 3,
        tier: BirthdayTier.Standard,
        rewardType: 'coupon',
        rewardValue: 0,
      }),
    ).toThrow('rewardValue 必须大于 0');
  });

  it('BS-0201: 同一会员重复创建抛 Conflict', async () => {
    const svc = await createSvc();
    makePlan(svc, { memberId: 'm2' });
    expect(() => makePlan(svc, { memberId: 'm2' })).toThrow('已有进行中的方案');
  });

  it('BS-0201: 触发生日推送（正例）', async () => {
    const svc = await createSvc();
    const plan = makePlan(svc);
    const reward = svc.triggerPush(plan.id);
    expect(reward.planId).toBe(plan.id);
    expect(reward.sentAt).toBeTruthy();
    expect(svc.getPlan(plan.id).status).toBe('active');
  });

  it('BS-0201: 重复触发已激活方案抛 BadRequest', async () => {
    const svc = await createSvc();
    const plan = makePlan(svc);
    svc.triggerPush(plan.id);
    expect(() => svc.triggerPush(plan.id)).toThrow('不可触发推送');
  });

  it('BS-0202: 领取奖励（正例）', async () => {
    const svc = await createSvc();
    const plan = makePlan(svc);
    svc.triggerPush(plan.id);
    const claimed = svc.claimReward(plan.id);
    expect(claimed.claimedAt).toBeTruthy();
    expect(svc.getPlan(plan.id).status).toBe('completed');
  });

  it('BS-0202: 已完成方案不可重复领取', async () => {
    const svc = await createSvc();
    const plan = makePlan(svc);
    svc.triggerPush(plan.id);
    svc.claimReward(plan.id);
    // plan 状态改为 completed 后，claimReward 会先检查 status !== 'active'
    expect(() => svc.claimReward(plan.id)).toThrow('不可领取奖励');
  });

  it('BS-0202: pending 状态下领取抛 BadRequest', async () => {
    const svc = await createSvc();
    const plan = makePlan(svc);
    expect(() => svc.claimReward(plan.id)).toThrow('不可领取奖励');
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0203~BS-0204: 传播裂变
  // ══════════════════════════════════════════════════════════════

  it('BS-0203: 记录消费追踪（正例）', async () => {
    const svc = await createSvc();
    const plan = makePlan(svc, { memberId: 'm3', allowFriends: true, friendDiscount: 0.8 });
    const tracking = svc.recordTracking({
      planId: plan.id,
      friendInvited: 2,
      totalSpend: 300,
      returnVisitDays: 7,
    });
    expect(tracking.friendInvited).toBe(2);
    expect(tracking.totalSpend).toBe(300);
  });

  it('BS-0203: 不允许带好友时邀请好友抛 BadRequest', async () => {
    const svc = await createSvc();
    const plan = makePlan(svc, { memberId: 'm4', allowFriends: false });
    expect(() =>
      svc.recordTracking({ planId: plan.id, friendInvited: 1 }),
    ).toThrow('不允许带好友');
  });

  it('BS-0203: 无效追踪参数抛 BadRequest', async () => {
    const svc = await createSvc();
    const plan = makePlan(svc, { memberId: 'm5', allowFriends: true, friendDiscount: 0.8 });
    expect(() =>
      svc.recordTracking({ planId: plan.id, totalSpend: -1 }),
    ).toThrow('不能为负');
    expect(() =>
      svc.recordTracking({ planId: plan.id, friendInvited: -1 }),
    ).toThrow('不能为负');
    expect(() =>
      svc.recordTracking({ planId: plan.id, returnVisitDays: -1 }),
    ).toThrow('不能为负');
  });

  it('BS-0204: 查询会员裂变数据', async () => {
    const svc = await createSvc();
    const plan = makePlan(svc, { memberId: 'm6', allowFriends: true, friendDiscount: 0.8 });
    svc.recordTracking({ planId: plan.id, friendInvited: 3, totalSpend: 500 });
    const stats = svc.getFriendStats('m6');
    expect(stats.totalInvited).toBe(3);
    expect(stats.avgSpend).toBe(500);
  });

  it('BS-0204: 无追踪数据的会员返回0', async () => {
    const svc = await createSvc();
    const stats = svc.getFriendStats('nonexist');
    expect(stats.totalInvited).toBe(0);
    expect(stats.avgSpend).toBe(0);
  });

  // ══════════════════════════════════════════════════════════════
  // BS-0205~BS-0206: 复购追踪与看板
  // ══════════════════════════════════════════════════════════════

  it('BS-0205: 看板返回聚合数据', async () => {
    const svc = await createSvc();
    const plan = makePlan(svc, { memberId: 'm7', birthday: '08-15', allowFriends: true, friendDiscount: 0.8 });
    svc.triggerPush(plan.id);
    svc.claimReward(plan.id);
    svc.recordTracking({ planId: plan.id, totalSpend: 200, returnVisitDays: 10 });

    const dashboard = svc.getDashboard();
    expect(dashboard.monthlyBirthdays).toBe(0); // 不在当月，planDate 是未来
    expect(typeof dashboard.conversionRate).toBe('number');
    expect(typeof dashboard.avgSpend).toBe('number');
    expect(typeof dashboard.returnRate).toBe('number');
  });

  it('BS-0205: 指定月份看板可过滤', async () => {
    const svc = await createSvc();
    const dashboard = svc.getDashboard('2026-08');
    expect(dashboard.month).toBe('2026-08');
  });

  it('BS-0205: 空数据看板返回0值', async () => {
    const svc = await createSvc();
    const dashboard = svc.getDashboard();
    expect(dashboard.monthlyBirthdays).toBe(0);
    expect(dashboard.activePlans).toBe(0);
    expect(dashboard.conversionRate).toBe(0);
    expect(dashboard.avgSpend).toBe(0);
    expect(dashboard.returnRate).toBe(0);
  });

  it('BS-0206: 会员生日统计返回正确', async () => {
    const svc = await createSvc();
    const plan = makePlan(svc, { memberId: 'm8', birthday: '08-20', allowFriends: true, friendDiscount: 0.8 });
    svc.triggerPush(plan.id);
    svc.claimReward(plan.id);
    svc.recordTracking({ planId: plan.id, friendInvited: 2, totalSpend: 400, returnVisitDays: 7 });

    const stats = svc.getMemberStats('m8');
    expect(stats.planCount).toBe(1);
    expect(stats.totalSpend).toBe(400);
    expect(stats.totalInvited).toBe(2);
    expect(stats.avgReturnVisitDays).toBe(7);
  });

  it('BS-0206: 无活动的会员统计为0', async () => {
    const svc = await createSvc();
    const stats = svc.getMemberStats('nobody');
    expect(stats.planCount).toBe(0);
    expect(stats.totalSpend).toBe(0);
    expect(stats.totalInvited).toBe(0);
  });

  it('BS-0206: 会员统计含最近生日日期', async () => {
    const svc = await createSvc();
    const plan = makePlan(svc, { memberId: 'm9' });
    const stats = svc.getMemberStats('m9');
    expect(stats.planCount).toBe(1);
    expect(stats.lastBirthday).toBe(plan.planDate);
  });

  it('getPlan: 不存在的方案抛 NotFound', async () => {
    const svc = await createSvc();
    expect(() => svc.getPlan('nonexist')).toThrow('生日方案不存在');
  });

  it('listPlans: 按状态筛选', async () => {
    const svc = await createSvc();
    const p1 = makePlan(svc, { memberId: 'm10' });
    const p2 = makePlan(svc, { memberId: 'm11' });
    svc.triggerPush(p1.id);

    const activePlans = svc.listPlans({ status: 'active' });
    expect(activePlans.length).toBe(1);
    expect(activePlans[0].id).toBe(p1.id);
  });

  it('friendDiscount 越界抛 BadRequest', async () => {
    const svc = await createSvc();
    expect(() =>
      svc.createPlan({
        memberId: 'm12',
        birthday: '08-01',
        advanceDays: 3,
        tier: BirthdayTier.Standard,
        rewardType: 'coupon',
        rewardValue: 50,
        allowFriends: true,
        friendDiscount: 1.5,
      }),
    ).toThrow('friendDiscount 必须在 0~1 范围内');
  });
});
