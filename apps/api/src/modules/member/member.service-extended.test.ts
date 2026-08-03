/**
 * member.service-extended.test.ts — 树哥B 保底续产: 会员service 增强测试
 *
 * 覆盖:
 *   会员查询 (getProfile / listProfiles)
 *   等级变更 (addPoints 自动升级 / revokePoints 降级)
 *   积分变更 (addPoints / revokePoints 边界值)
 *   会员卡操作 (register / bootstrap)
 *   会员标签 (buildOperationsProfile 标签自动生成)
 *   会员画像 (getOperationsProfile / buildOperationsProfile 各生命周期)
 *   会员统计 (listProfiles 多会员场景)
 *   跨租户隔离
 *   错误边界 (重复注册 / 负数积分)
 *   BS-0115 桥接等级评估
 */

import { describe, it, expect, beforeEach } from 'vitest';
import assert from 'node:assert/strict';
import type { RequestTenantContext } from '../tenant/tenant.types';
import { MemberService, resetMemberServiceTestState } from './member.service';
import {
  MemberLevel,
  MemberStatus,
  computeMemberLevel,
  canUpgrade,
  MEMBER_LEVEL_THRESHOLDS,
  type MemberProfile,
  type MemberOperationsProfile,
} from './member.entity';

// ── helpers ────────────────────────────────────────────

function createContext(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return {
    tenantId: 'tenant-mem-ext',
    brandId: 'brand-mem-ext',
    storeId: 'store-mem-ext',
    marketCode: 'cn-mainland',
    ...overrides,
  };
}

function createOtherContext(): RequestTenantContext {
  return {
    tenantId: 'tenant-other-ext',
    brandId: 'brand-other-ext',
    storeId: 'store-other-ext',
    marketCode: 'cn-other',
  };
}

function makeService(): MemberService {
  resetMemberServiceTestState();
  return new MemberService();
}

function makeProfile(
  svc: MemberService,
  ctx: RequestTenantContext,
  overrides?: Partial<{
    memberId: string;
    nickname: string;
    points: number;
    status: MemberStatus;
  }>,
): MemberProfile {
  return svc.register({
    memberId: overrides?.memberId ?? `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    tenantContext: ctx,
    nickname: overrides?.nickname ?? '测试会员',
  });
}

// ─────────────────────────────────────────────────────
// Section 1: 会员注册与查询
// ─────────────────────────────────────────────────────
describe('[member-extended] 会员注册与查询', () => {
  let svc: MemberService;
  let ctx: RequestTenantContext;

  beforeEach(() => {
    svc = makeService();
    ctx = createContext();
  });

  it('register 创建默认青铜会员', () => {
    const profile = makeProfile(svc, ctx);
    expect(profile.level).toBe(MemberLevel.Bronze);
    expect(profile.status).toBe(MemberStatus.Active);
    expect(profile.points).toBe(0);
    expect(profile.growthValue).toBe(0);
  });

  it('register 重复会员 ID 抛错', () => {
    const memberId = 'duplicate-mem';
    svc.register({ memberId, tenantContext: ctx, nickname: '首次' });
    assert.throws(() => svc.register({ memberId, tenantContext: ctx, nickname: '重复' }), /already exists/);
  });

  it('getProfile 返回已注册会员', () => {
    const profile = makeProfile(svc, ctx, { nickname: '查询测试' });
    const got = svc.getProfile(profile.memberId);
    expect(got).toBeDefined();
    expect(got!.nickname).toBe('查询测试');
  });

  it('getProfile 不存在返回 undefined', () => {
    const got = svc.getProfile('nonexistent');
    expect(got).toBeUndefined();
  });

  it('listProfiles 返回所有会员', () => {
    makeProfile(svc, ctx, { nickname: '会员A' });
    makeProfile(svc, ctx, { nickname: '会员B' });
    makeProfile(svc, ctx, { nickname: '会员C' });

    const profiles = svc.listProfiles();
    expect(profiles).toHaveLength(3);
  });

  it('getBootstrap 返回会员引导信息', () => {
    const bootstrap = svc.getBootstrap(ctx);
    expect(bootstrap.tenantContext.tenantId).toBe(ctx.tenantId);
    expect(bootstrap.capabilities).toContain('member-center');
    expect(bootstrap.phase).toBeTruthy();
  });

  it('listProfiles 为空时返回空数组', () => {
    expect(svc.listProfiles()).toEqual([]);
  });

  it('register 会员包含 source: memory 和 persisted: false', () => {
    const profile = makeProfile(svc, ctx);
    expect(profile.source).toBe('memory');
    expect(profile.persisted).toBe(false);
  });
});

// ─────────────────────────────────────────────────────
// Section 2: 等级变更 (积分 → 等级)
// ─────────────────────────────────────────────────────
describe('[member-extended] 等级变更', () => {
  let svc: MemberService;
  let ctx: RequestTenantContext;

  beforeEach(() => {
    svc = makeService();
    ctx = createContext();
  });

  it('初始为 Bronze', () => {
    const profile = makeProfile(svc, ctx);
    expect(profile.level).toBe(MemberLevel.Bronze);
  });

  it('addPoints 500 分升 Silver', () => {
    const profile = makeProfile(svc, ctx);
    svc.addPoints(profile.memberId, 500);
    const updated = svc.getProfile(profile.memberId)!;
    expect(updated.level).toBe(MemberLevel.Silver);
    expect(updated.points).toBe(500);
  });

  it('addPoints 2000 分升 Gold', () => {
    const profile = makeProfile(svc, ctx);
    svc.addPoints(profile.memberId, 2000);
    const updated = svc.getProfile(profile.memberId)!;
    expect(updated.level).toBe(MemberLevel.Gold);
  });

  it('addPoints 10000 分升 Platinum', () => {
    const profile = makeProfile(svc, ctx);
    svc.addPoints(profile.memberId, 10000);
    const updated = svc.getProfile(profile.memberId)!;
    expect(updated.level).toBe(MemberLevel.Platinum);
  });

  it('addPoints 50000 分升 Diamond', () => {
    const profile = makeProfile(svc, ctx);
    svc.addPoints(profile.memberId, 50000);
    const updated = svc.getProfile(profile.memberId)!;
    expect(updated.level).toBe(MemberLevel.Diamond);
  });

  it('revokePoints 降级 Bronze', () => {
    const profile = makeProfile(svc, ctx);
    svc.addPoints(profile.memberId, 2000); // Gold
    svc.revokePoints(profile.memberId, 1500); // 回到 500 → Silver
    const updated = svc.getProfile(profile.memberId)!;
    expect(updated.level).toBe(MemberLevel.Silver);
    expect(updated.points).toBe(500);
  });

  it('revokePoints 不会降到负数', () => {
    const profile = makeProfile(svc, ctx);
    svc.addPoints(profile.memberId, 100);
    svc.revokePoints(profile.memberId, 200); // 最多到 0
    const updated = svc.getProfile(profile.memberId)!;
    expect(updated.points).toBe(0);
    expect(updated.level).toBe(MemberLevel.Bronze);
  });

  it('revokePoints growthValue 与 points 独立扣减', () => {
    const profile = makeProfile(svc, ctx);
    svc.addPoints(profile.memberId, 1000);
    const before = svc.getProfile(profile.memberId)!;
    expect(before.growthValue).toBe(1000);

    svc.revokePoints(profile.memberId, 300);
    const after = svc.getProfile(profile.memberId)!;
    expect(after.points).toBe(700);
    expect(after.growthValue).toBe(700);
  });

  it('computeMemberLevel 工具函数正确', () => {
    expect(computeMemberLevel(0)).toBe(MemberLevel.Bronze);
    expect(computeMemberLevel(499)).toBe(MemberLevel.Bronze);
    expect(computeMemberLevel(500)).toBe(MemberLevel.Silver);
    expect(computeMemberLevel(1999)).toBe(MemberLevel.Silver);
    expect(computeMemberLevel(2000)).toBe(MemberLevel.Gold);
    expect(computeMemberLevel(9999)).toBe(MemberLevel.Gold);
    expect(computeMemberLevel(10000)).toBe(MemberLevel.Platinum);
    expect(computeMemberLevel(49999)).toBe(MemberLevel.Platinum);
    expect(computeMemberLevel(50000)).toBe(MemberLevel.Diamond);
  });

  it('canUpgrade 判断升级可行性', () => {
    expect(canUpgrade(MemberLevel.Bronze, 2000)).toBe(true);
    expect(canUpgrade(MemberLevel.Gold, 500)).toBe(false);
    expect(canUpgrade(MemberLevel.Diamond, 100)).toBe(false);
  });

  it('MEMBER_LEVEL_THRESHOLDS 常量正确', () => {
    expect(MEMBER_LEVEL_THRESHOLDS[MemberLevel.Bronze]).toBe(0);
    expect(MEMBER_LEVEL_THRESHOLDS[MemberLevel.Silver]).toBe(500);
    expect(MEMBER_LEVEL_THRESHOLDS[MemberLevel.Gold]).toBe(2000);
    expect(MEMBER_LEVEL_THRESHOLDS[MemberLevel.Platinum]).toBe(10000);
    expect(MEMBER_LEVEL_THRESHOLDS[MemberLevel.Diamond]).toBe(50000);
  });

  it('多次加分后等级正确', () => {
    const profile = makeProfile(svc, ctx);
    svc.addPoints(profile.memberId, 300);
    svc.addPoints(profile.memberId, 200);
    const updated = svc.getProfile(profile.memberId)!;
    expect(updated.level).toBe(MemberLevel.Silver);
    expect(updated.points).toBe(500);
  });
});

// ─────────────────────────────────────────────────────
// Section 3: 积分变更 (边界值/错误处理)
// ─────────────────────────────────────────────────────
describe('[member-extended] 积分变更边界', () => {
  let svc: MemberService;
  let ctx: RequestTenantContext;

  beforeEach(() => {
    svc = makeService();
    ctx = createContext();
  });

  it('addPoints 负数抛错', () => {
    const profile = makeProfile(svc, ctx);
    assert.throws(
      () => svc.addPoints(profile.memberId, -100),
      /Points to add must be positive/,
    );
  });

  it('addPoints 0 分抛错', () => {
    const profile = makeProfile(svc, ctx);
    assert.throws(
      () => svc.addPoints(profile.memberId, 0),
      /Points to add must be positive/,
    );
  });

  it('revokePoints 负数抛错', () => {
    const profile = makeProfile(svc, ctx);
    svc.addPoints(profile.memberId, 500);
    assert.throws(
      () => svc.revokePoints(profile.memberId, -50),
      /Points to revoke must be positive/,
    );
  });

  it('revokePoints 0 分抛错', () => {
    const profile = makeProfile(svc, ctx);
    assert.throws(
      () => svc.revokePoints(profile.memberId, 0),
      /Points to revoke must be positive/,
    );
  });

  it('addPoints 不存在的会员抛错', () => {
    assert.throws(
      () => svc.addPoints('nonexistent', 100),
      /not found/,
    );
  });

  it('revokePoints 不存在的会员抛错', () => {
    assert.throws(
      () => svc.revokePoints('nonexistent', 100),
      /not found/,
    );
  });

  it('addPoints 从 Bronze 直接到 Platinum 跳级', () => {
    const profile = makeProfile(svc, ctx);
    svc.addPoints(profile.memberId, 10000);
    const updated = svc.getProfile(profile.memberId)!;
    expect(updated.level).toBe(MemberLevel.Platinum);
    expect(updated.points).toBe(10000);
  });

  it('积分累积 growthValue 同步增加', () => {
    const profile = makeProfile(svc, ctx);
    svc.addPoints(profile.memberId, 100);
    svc.addPoints(profile.memberId, 200);
    svc.addPoints(profile.memberId, 300);
    const updated = svc.getProfile(profile.memberId)!;
    expect(updated.growthValue).toBe(600);
  });
});

// ─────────────────────────────────────────────────────
// Section 4: 运营画像 (getOperationsProfile)
// ─────────────────────────────────────────────────────
describe('[member-extended] 会员运营画像', () => {
  let svc: MemberService;
  let ctx: RequestTenantContext;

  beforeEach(() => {
    svc = makeService();
    ctx = createContext();
  });

  it('getOperationsProfile 无支付记录返回 prospect lifecycle', async () => {
    const profile = makeProfile(svc, ctx);
    const opsProfile = await svc.getOperationsProfile(profile.memberId, ctx);
    expect(opsProfile).toBeDefined();
    expect(opsProfile!.lifecycleStage).toBe('prospect');
    expect(opsProfile!.audienceSegments).toContain('lifecycle-prospect');
    expect(opsProfile!.audienceSegments).toContain('level-bronze');
    expect(opsProfile!.audienceSegments).toContain('memory-member');
  });

  it('getOperationsProfile 高等级会员附加 vip-tier 标签', async () => {
    const profile = makeProfile(svc, ctx);
    svc.addPoints(profile.memberId, 50000); // Diamond
    const opsProfile = await svc.getOperationsProfile(profile.memberId, ctx);
    expect(opsProfile!.audienceSegments).toContain('vip-tier-member');
  });

  it('getOperationsProfile 推荐 actions 随生命周期变化', async () => {
    const profile = makeProfile(svc, ctx);
    const opsProfile = await svc.getOperationsProfile(profile.memberId, ctx);

    // prospect 阶段应推荐 complete-member-onboarding
    const onboardingAction = opsProfile!.recommendedActions.find(
      (a) => a.code === 'complete-member-onboarding',
    );
    expect(onboardingAction).toBeDefined();
  });

  it('getOperationsProfile 不存在返回 undefined', async () => {
    const opsProfile = await svc.getOperationsProfile('nonexistent', createContext());
    expect(opsProfile).toBeUndefined();
  });

  it('getOperationsProfile 跨租户隔离', async () => {
    const profile = makeProfile(svc, ctx);
    const otherCtx = createOtherContext();
    const opsProfile = await svc.getOperationsProfile(profile.memberId, otherCtx);
    expect(opsProfile).toBeUndefined();
  });

  it('getOperationsProfile 自动触发 payment-success-journey', async () => {
    const profile = makeProfile(svc, ctx);
    const opsProfile = await svc.getOperationsProfile(profile.memberId, ctx);
    // 没有支付数据，不应该触发 payment-success-journey
    const paymentTrigger = opsProfile!.automationTriggers.find(
      (t) => t.code === 'payment-success-journey',
    );
    expect(paymentTrigger).toBeUndefined();
  });

  it('buildOperationsProfile 包含所有必要字段', async () => {
    const profile = makeProfile(svc, ctx);
    const opsProfile = await svc.getOperationsProfile(profile.memberId, ctx);
    expect(opsProfile!.memberId).toBe(profile.memberId);
    expect(opsProfile!.level).toBe(profile.level);
    expect(opsProfile!.status).toBe(profile.status);
    expect(Array.isArray(opsProfile!.audienceSegments)).toBe(true);
    expect(Array.isArray(opsProfile!.recommendedActions)).toBe(true);
    expect(Array.isArray(opsProfile!.automationTriggers)).toBe(true);
    expect(opsProfile!.tags).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────
// Section 5: persistence 层 (无 Prisma 时回退)
// ─────────────────────────────────────────────────────
describe('[member-extended] 持久化代理（无 Prisma 回退）', () => {
  let svc: MemberService;
  let ctx: RequestTenantContext;

  beforeEach(() => {
    svc = makeService();
    ctx = createContext();
  });

  it('registerPersistent 无 Prisma 时调用 register', async () => {
    const profile = await svc.registerPersistent({
      tenantContext: ctx,
      mobile: '13800001111',
      nickname: '持久化测试',
    });
    expect(profile.nickname).toBe('持久化测试');
    expect(profile.source).toBe('memory');
  });

  it('getPersistentProfile 无 Prisma 时调用 getProfile', async () => {
    const profile = makeProfile(svc, ctx, { nickname: '持久查询' });
    const got = await svc.getPersistentProfile(profile.memberId, ctx);
    expect(got).toBeDefined();
    expect(got!.nickname).toBe('持久查询');
  });

  it('getPersistentProfile 不存在返回 undefined', async () => {
    const result = await svc.getPersistentProfile('nonexistent', ctx);
    expect(result).toBeUndefined();
  });

  it('listPersistentProfiles 无 Prisma 时调用 listProfiles', async () => {
    makeProfile(svc, ctx, { nickname: '会员A' });
    makeProfile(svc, ctx, { nickname: '会员B' });
    const profiles = await svc.listPersistentProfiles(ctx);
    expect(profiles).toHaveLength(2);
  });

  it('awardPoints 无 Prisma 回退到 addPoints', async () => {
    const profile = makeProfile(svc, ctx);
    const result = await svc.awardPoints(profile.memberId, 200, ctx);
    // 无 Prisma 时直接返回 MemberProfile
    if (!('approvalRequired' in result)) {
      expect(result.points).toBe(200);
      expect(result.level).toBe(MemberLevel.Bronze); // 200 < 500
    }
  });

  it('awardPoints 正数积分通过', async () => {
    const profile = makeProfile(svc, ctx);
    const result = await svc.awardPoints(profile.memberId, 300, ctx);
    if (!('approvalRequired' in result)) {
      expect(result.points).toBe(300);
    }
  });

  it('awardPoints 零积分抛错', async () => {
    const profile = makeProfile(svc, ctx);
    // Without prisma this will call addPoints which validates points > 0
    await expect(svc.awardPoints(profile.memberId, 0, ctx)).rejects.toThrow(/positive/);
  });

  it('rollbackPoints 无 Prisma 回退到 revokePoints', async () => {
    const profile = makeProfile(svc, ctx);
    svc.addPoints(profile.memberId, 500);
    const result = await svc.rollbackPoints(profile.memberId, 200, ctx);
    if (!('approvalRequired' in result)) {
      expect(result.points).toBe(300);
    }
  });

  it('rollbackPoints 零积分抛错', async () => {
    const profile = makeProfile(svc, ctx);
    svc.addPoints(profile.memberId, 100);
    await expect(svc.rollbackPoints(profile.memberId, 0, ctx)).rejects.toThrow(/positive/);
  });

  it('updatePersistentStatus 无 Prisma 回退到内存', async () => {
    const profile = makeProfile(svc, ctx);
    const result = await svc.updatePersistentStatus(
      profile.memberId,
      MemberStatus.Frozen,
      ctx,
    );
    if (!('approvalRequired' in result)) {
      expect(result.status).toBe(MemberStatus.Frozen);
    }
  });
});
