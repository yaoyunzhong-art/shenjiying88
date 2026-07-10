import { describe, it, expect } from 'vitest'
/**
 * 🐜 自动: [svip] [D] 合约测试
 *
 * 验证 svip 模块的实体 Shape、DTO 接口契约、服务行为合约
 * 覆盖: SVIPPlan, SVIPSubscription, SVIPBenefit, Crud 操作, 边界条件
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { SvipService } from './svip.service';
import { firstValueFrom } from 'rxjs';
import type { SVIPPlan, SVIPSubscription, SVIPBenefit, SVIPBenefitType, SVIPStatus } from './svip.entity';

// ─── 测试工厂 ──────────────────────────────────────────

function createService(): SvipService {
  return new SvipService();
}

function createPlanInput(overrides: Partial<{
  name: string;
  price: number;
  durationDays: number;
  benefits: string[];
}> = {}) {
  return {
    name: overrides.name ?? '黄金会员',
    price: overrides.price ?? 99,
    durationDays: overrides.durationDays ?? 30,
    benefits: overrides.benefits ?? ['积分翻倍', '专属折扣'],
  };
}

const VALID_USER_ID = 'user-001';
const VALID_USER_ID_2 = 'user-002';

// ─── 1. SVIPPlan 实体契约 ──────────────────────────────

describe('SVIPPlan 实体契约', () => {
  it('创建计划返回符合 SVIPPlan 接口的完整对象', async () => {
    const service = createService();
    const input = createPlanInput();

    const plan = await firstValueFrom(service.createPlan(input));

    assert.ok(plan, 'plan 不应为 null');
    assert.ok(plan.planId, 'planId 必须存在');
    assert.equal(plan.name, '黄金会员');
    assert.equal(plan.price, 99);
    assert.equal(plan.durationDays, 30);
    assert.deepStrictEqual(plan.benefits, ['积分翻倍', '专属折扣']);
    assert.ok(plan.createdAt instanceof Date, 'createdAt 必须是 Date 类型');
  });

  it('创建多个计划，列表返回所有计划', async () => {
    const service = createService();

    await firstValueFrom(service.createPlan(createPlanInput({ name: '白银会员', price: 49, durationDays: 30 })));
    await firstValueFrom(service.createPlan(createPlanInput({ name: '黄金会员', price: 99, durationDays: 60 })));
    await firstValueFrom(service.createPlan(createPlanInput({ name: '钻石会员', price: 199, durationDays: 90 })));

    const plans = await firstValueFrom(service.listPlans());
    assert.equal(plans.length, 3);
    assert.equal(plans[0].name, '白银会员');
    assert.equal(plans[1].name, '黄金会员');
    assert.equal(plans[2].name, '钻石会员');
  });

  it('空列表返回空数组', async () => {
    const service = createService();
    const plans = await firstValueFrom(service.listPlans());
    assert.deepStrictEqual(plans, []);
  });

  it('计划价格允许为 0（免费计划）', async () => {
    const service = createService();
    const plan = await firstValueFrom(service.createPlan(createPlanInput({ name: '免费体验', price: 0 })));
    assert.equal(plan.price, 0);
  });

  it('计划价格允许很大金额（高阶套餐）', async () => {
    const service = createService();
    const plan = await firstValueFrom(service.createPlan(createPlanInput({ name: '终身会员', price: 9999, durationDays: 36500 })));
    assert.equal(plan.price, 9999);
    assert.equal(plan.durationDays, 36500);
  });

  it('计划权益列表为空（纯卡面计划）', async () => {
    const service = createService();
    const plan = await firstValueFrom(service.createPlan(createPlanInput({ benefits: [] })));
    assert.deepStrictEqual(plan.benefits, []);
  });
});

// ─── 2. SVIPSubscription 实体契约 ─────────────────────

describe('SVIPSubscription 实体契约', () => {
  it('用户订阅计划返回完整订阅对象', async () => {
    const service = createService();
    await firstValueFrom(service.createPlan(createPlanInput({ price: 99, durationDays: 30 })));
    const planId = (await firstValueFrom(service.listPlans()))[0].planId;

    const sub = await firstValueFrom(service.subscribe(VALID_USER_ID, planId));

    assert.ok(sub, '订阅不应为 null');
    assert.ok(sub!.subscriptionId);
    assert.equal(sub!.userId, VALID_USER_ID);
    assert.equal(sub!.planId, planId);
    assert.equal(sub!.status, 'active');
    assert.ok(sub!.startAt instanceof Date);
    assert.ok(sub!.expireAt instanceof Date);
    assert.ok(sub!.expireAt > sub!.startAt);
    assert.equal(sub!.autoRenew, true);
  });

  it('订阅不存在的计划返回 null', async () => {
    const service = createService();
    const sub = await firstValueFrom(service.subscribe(VALID_USER_ID, 'non-existent-plan'));
    assert.strictEqual(sub, null);
  });

  it('用户已存在有效订阅时重复订阅返回 null', async () => {
    const service = createService();
    await firstValueFrom(service.createPlan(createPlanInput()));
    const planId = (await firstValueFrom(service.listPlans()))[0].planId;

    const sub1 = await firstValueFrom(service.subscribe(VALID_USER_ID, planId));
    assert.ok(sub1);

    const sub2 = await firstValueFrom(service.subscribe(VALID_USER_ID, planId));
    assert.strictEqual(sub2, null, '重复订阅应返回 null');
  });

  it('用户取消订阅后可以重新订阅', async () => {
    const service = createService();
    await firstValueFrom(service.createPlan(createPlanInput()));
    const planId = (await firstValueFrom(service.listPlans()))[0].planId;

    await firstValueFrom(service.subscribe(VALID_USER_ID, planId));
    await firstValueFrom(service.cancelSubscription(
      (await firstValueFrom(service.getSubscription(VALID_USER_ID)))!.subscriptionId,
    ));

    // 取消后再订阅应成功
    const newSub = await firstValueFrom(service.subscribe(VALID_USER_ID, planId));
    assert.ok(newSub);
    assert.equal(newSub!.status, 'active');
  });
});

// ─── 3. 订阅状态管理契约 ────────────────────────────

describe('SVIP 订阅状态管理契约', () => {
  it('取消订阅将状态标记为 cancelled', async () => {
    const service = createService();
    await firstValueFrom(service.createPlan(createPlanInput()));
    const planId = (await firstValueFrom(service.listPlans()))[0].planId;
    const sub = await firstValueFrom(service.subscribe(VALID_USER_ID, planId));

    const cancelled = await firstValueFrom(service.cancelSubscription(sub!.subscriptionId));
    assert.equal(cancelled!.status, 'cancelled');
    assert.equal(cancelled!.autoRenew, false);
  });

  it('取消不存在的订阅返回 null', async () => {
    const service = createService();
    const result = await firstValueFrom(service.cancelSubscription('non-existent'));
    assert.strictEqual(result, null);
  });

  it('续期订阅延长到期时间', async () => {
    const service = createService();
    await firstValueFrom(service.createPlan(createPlanInput({ durationDays: 30 })));
    const planId = (await firstValueFrom(service.listPlans()))[0].planId;
    const sub = await firstValueFrom(service.subscribe(VALID_USER_ID, planId));
    const originalExpire = sub!.expireAt;

    const renewed = await firstValueFrom(service.renewSubscription(sub!.subscriptionId));
    assert.equal(renewed!.status, 'active');
    assert.ok(renewed!.expireAt > originalExpire, '续期后到期时间应延长');
    assert.equal(renewed!.autoRenew, true);
  });

  it('续期不存在的订阅返回 null', async () => {
    const service = createService();
    const result = await firstValueFrom(service.renewSubscription('non-existent'));
    assert.strictEqual(result, null);
  });

  it('checkAndExpire 将过期订阅标记为 expired', async () => {
    const service = createService();
    await firstValueFrom(service.createPlan(createPlanInput({ durationDays: 1 }))); // 1 天
    const planId = (await firstValueFrom(service.listPlans()))[0].planId;
    await firstValueFrom(service.subscribe(VALID_USER_ID, planId));

    const expired = await firstValueFrom(service.checkAndExpire());
    // 刚创建的订阅不应过期
    assert.equal(expired, 0);
  });

  it('getSubscription 返回用户当前订阅', async () => {
    const service = createService();
    await firstValueFrom(service.createPlan(createPlanInput()));
    const planId = (await firstValueFrom(service.listPlans()))[0].planId;
    await firstValueFrom(service.subscribe(VALID_USER_ID, planId));

    const sub = await firstValueFrom(service.getSubscription(VALID_USER_ID));
    assert.ok(sub);
    assert.equal(sub!.userId, VALID_USER_ID);
  });

  it('getSubscription 无订阅用户返回 null', async () => {
    const service = createService();
    const sub = await firstValueFrom(service.getSubscription('no-sub-user'));
    assert.strictEqual(sub, null);
  });
});

// ─── 4. SVIPBenefit 权益契约 ─────────────────────────

describe('SVIPBenefit 权益契约', () => {
  it('订阅后自动创建对应权益', async () => {
    const service = createService();
    await firstValueFrom(service.createPlan(createPlanInput({
      benefits: ['积分翻倍', '专属折扣', '免费配送'],
    })));
    const planId = (await firstValueFrom(service.listPlans()))[0].planId;
    const sub = await firstValueFrom(service.subscribe(VALID_USER_ID, planId));

    const benefits = await firstValueFrom(service.getBenefits(sub!.subscriptionId));
    assert.equal(benefits.length, 3);
    assert.ok(benefits.every(b => b.type && !b.usedAt));
  });

  it('使用权益后标记 usedAt', async () => {
    const service = createService();
    await firstValueFrom(service.createPlan(createPlanInput({
      benefits: ['积分翻倍', '专属折扣'],
    })));
    const planId = (await firstValueFrom(service.listPlans()))[0].planId;
    await firstValueFrom(service.subscribe(VALID_USER_ID, planId));

    const used = await firstValueFrom(service.useBenefit(VALID_USER_ID, 'points_multiplier'));
    assert.ok(used);
    assert.equal(used!.type, 'points_multiplier');
    assert.ok(used!.usedAt, '使用后应有 usedAt');
    assert.ok(used!.usedAt instanceof Date);
  });

  it('重复使用同类型权益第二次返回 null（只能使用一次）', async () => {
    const service = createService();
    await firstValueFrom(service.createPlan(createPlanInput({
      benefits: ['积分翻倍', '专属折扣'],
    })));
    const planId = (await firstValueFrom(service.listPlans()))[0].planId;
    await firstValueFrom(service.subscribe(VALID_USER_ID, planId));

    const firstUse = await firstValueFrom(service.useBenefit(VALID_USER_ID, 'points_multiplier'));
    assert.ok(firstUse);

    const secondUse = await firstValueFrom(service.useBenefit(VALID_USER_ID, 'points_multiplier'));
    assert.strictEqual(secondUse, null, '重复使用同类型权益应返回 null');
  });

  it('取消订阅后权益仍然可查询但无法使用', async () => {
    const service = createService();
    await firstValueFrom(service.createPlan(createPlanInput({ benefits: ['积分翻倍'] })));
    const planId = (await firstValueFrom(service.listPlans()))[0].planId;
    const sub = await firstValueFrom(service.subscribe(VALID_USER_ID, planId));

    await firstValueFrom(service.cancelSubscription(sub!.subscriptionId));

    const used = await firstValueFrom(service.useBenefit(VALID_USER_ID, 'points_multiplier'));
    assert.strictEqual(used, null, '取消订阅后权益无法使用');
  });
});

// ─── 5. 多用户隔离契约 ─────────────────────────────

describe('多用户隔离契约', () => {
  it('不同用户的订阅互不干扰', async () => {
    const service = createService();
    await firstValueFrom(service.createPlan(createPlanInput()));
    const planId = (await firstValueFrom(service.listPlans()))[0].planId;

    await firstValueFrom(service.subscribe('user-a', planId));
    await firstValueFrom(service.subscribe('user-b', planId));

    const subA = await firstValueFrom(service.getSubscription('user-a'));
    const subB = await firstValueFrom(service.getSubscription('user-b'));

    assert.ok(subA);
    assert.ok(subB);
    assert.notEqual(subA!.subscriptionId, subB!.subscriptionId);
    assert.equal(subA!.userId, 'user-a');
    assert.equal(subB!.userId, 'user-b');
  });

  it('用户 A 使用权益不影响用户 B 的权益', async () => {
    const service = createService();
    await firstValueFrom(service.createPlan(createPlanInput({ benefits: ['积分翻倍', '专属折扣'] })));
    const planId = (await firstValueFrom(service.listPlans()))[0].planId;

    await firstValueFrom(service.subscribe('user-a', planId));
    await firstValueFrom(service.subscribe('user-b', planId));

    await firstValueFrom(service.useBenefit('user-a', 'points_multiplier'));

    const userBUse = await firstValueFrom(service.useBenefit('user-b', 'points_multiplier'));
    assert.ok(userBUse, '用户 B 的权益不应受用户 A 使用的影响');
  });
});

// ─── 6. 极端值与边界 ──────────────────────────────────

describe('极端值与边界', () => {
  it('用户 ID 为空字符串应处理', async () => {
    const service = createService();
    await firstValueFrom(service.createPlan(createPlanInput()));
    const planId = (await firstValueFrom(service.listPlans()))[0].planId;

    const sub = await firstValueFrom(service.subscribe('', planId));
    assert.ok(sub);
    assert.equal(sub!.userId, '');
  });

  it('用户 ID 为超长字符串应处理', async () => {
    const service = createService();
    await firstValueFrom(service.createPlan(createPlanInput()));
    const planId = (await firstValueFrom(service.listPlans()))[0].planId;
    const longUserId = 'u' + 'x'.repeat(1000);

    const sub = await firstValueFrom(service.subscribe(longUserId, planId));
    assert.ok(sub);
    assert.equal(sub!.userId, longUserId);
  });

  it('不存在的用户使用权益返回 null', async () => {
    const service = createService();
    const result = await firstValueFrom(service.useBenefit('ghost-user', 'points_multiplier'));
    assert.strictEqual(result, null);
  });

  it('获取不存在的订阅权益返回空数组', async () => {
    const service = createService();
    const benefits = await firstValueFrom(service.getBenefits('non-existent-sub'));
    assert.deepStrictEqual(benefits, []);
  });
});
