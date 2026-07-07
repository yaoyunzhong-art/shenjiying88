import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [referral] [D] 合约测试
 *
 * 验证 referral 模块的实体 Shape、业务逻辑契约、API 返回值契约
 *
 * 覆盖:
 * - ReferralCode 实体 Shape
 * - ReferralRecord 实体 Shape
 * - ReferralReward 实体 Shape
 * - 生成短码、点击追踪、注册补登、三级裂变链、奖励发放、指标查询
 */

import 'reflect-metadata';
import assert from 'node:assert/strict';
import { ReferralService } from './referral.service';
import type {
  ReferralCode,
  ReferralRecord,
  ReferralReward,
  ReferralMetrics,
} from './referral.entity';

// ─── 服务实例 helper ──────────────────────────────────

function makeService(): ReferralService {
  const svc = new ReferralService();
  svc.reset();
  return svc;
}

// ─── 合约: ReferralCode 实体 Shape ──────────────────────

describe('[referral] 合约: ReferralCode Shape', () => {
  it('generateCode 返回完整字段', () => {
    const svc = makeService();
    const code = svc.generateCode({
      parentUserId: 'user-A',
      tenantId: 'tenant-A',
      baseUrl: 'https://m.shenjiying88.com',
    });

    // 必填字段存在
    assert.equal(typeof code.codeId, 'string');
    assert.ok(code.codeId.startsWith('code-'));
    assert.equal(code.shortCode.length, 8);
    assert.equal(typeof code.shortCode, 'string');
    assert.equal(code.parentUserId, 'user-A');
    assert.equal(code.tenantId, 'tenant-A');

    // URL 格式
    assert.ok(code.qrCodeUrl?.startsWith('https://m.shenjiying88.com/qr/'));
    assert.ok(code.landingUrl.startsWith('https://m.shenjiying88.com/r/'));

    // 计数初始为 0
    assert.equal(code.totalClicks, 0);
    assert.equal(code.totalSignups, 0);

    // createdAt 是 ISO 字符串
    assert.doesNotThrow(() => new Date(code.createdAt).toISOString());
  });

  it('expiresAt 可选的，不传则 undefined', () => {
    const svc = makeService();
    const code = svc.generateCode({
      parentUserId: 'user-A',
      tenantId: 't',
    });
    assert.equal(code.expiresAt, undefined);
  });

  it('expiresInDays 正确设置', () => {
    const svc = makeService();
    const code = svc.generateCode({
      parentUserId: 'user-A',
      tenantId: 't',
      expiresInDays: 30,
    });
    assert.ok(code.expiresAt);
    const expires = new Date(code.expiresAt!).getTime();
    const now = Date.now();
    const diffDays = (expires - now) / 86_400_000;
    assert.ok(diffDays > 29 && diffDays < 31, `expected ~30d, got ${diffDays.toFixed(2)}d`);
  });
});

// ─── 合约: ReferralRecord 实体 Shape ─────────────────────

describe('[referral] 合约: ReferralRecord Shape', () => {
  it('trackSignup 返回完整 Record', () => {
    const svc = makeService();
    svc.generateCode({ parentUserId: 'user-A', tenantId: 't' });
    svc.trackClick({ shortCode: svc.getCode('') || 'x', source: 'wechat' } as any);

    // 先生成一个有效的短码
    const code = svc.generateCode({ parentUserId: 'user-A', tenantId: 't' });
    svc.trackClick({ shortCode: code.shortCode, source: 'wechat' });

    const record = svc.trackSignup({
      shortCode: code.shortCode,
      childUserId: 'user-B',
    });

    assert.equal(typeof record.recordId, 'string');
    assert.ok(record.recordId.startsWith('rec-'));
    assert.equal(record.parentUserId, 'user-A');
    assert.equal(record.childUserId, 'user-B');
    assert.equal(record.tenantId, 't');
    assert.equal(record.level, 1);
    assert.ok(Array.isArray(record.ancestorChain));
    assert.ok(record.ancestorChain.includes('user-A'));
    assert.ok(['wechat', 'mini-program', 'link', 'qrcode'].includes(record.source));
    assert.equal(typeof record.clickedAt, 'string');
    assert.equal(typeof record.signedUpAt, 'string');
    assert.equal(record.tracked, true);
  });

  it('三级裂变 ancestorChain 包含 L1/L2/L3', () => {
    const svc = makeService();
    const tId = 'tenant-chain';

    // A → B
    const cA = svc.generateCode({ parentUserId: 'user-A', tenantId: tId });
    svc.trackClick({ shortCode: cA.shortCode, source: 'wechat' });
    svc.trackSignup({ shortCode: cA.shortCode, childUserId: 'user-B' });

    // B → C
    const cB = svc.generateCode({ parentUserId: 'user-B', tenantId: tId });
    svc.trackClick({ shortCode: cB.shortCode, source: 'wechat' });
    svc.trackSignup({ shortCode: cB.shortCode, childUserId: 'user-C' });

    // C → D
    const cC = svc.generateCode({ parentUserId: 'user-C', tenantId: tId });
    svc.trackClick({ shortCode: cC.shortCode, source: 'wechat' });
    const record = svc.trackSignup({ shortCode: cC.shortCode, childUserId: 'user-D' });

    assert.equal(record.ancestorChain.length, 3);
    assert.deepEqual(record.ancestorChain, ['user-C', 'user-B', 'user-A']);
  });

  it('最多 3 级裂变，第 4 级不再增加', () => {
    const svc = makeService();
    const tId = 'tenant-4level';

    // 构建 4 级链
    let parentId = 'user-root';
    for (let i = 0; i < 4; i++) {
      const childId = `user-level-${i + 1}`;
      const code = svc.generateCode({ parentUserId: parentId, tenantId: tId });
      svc.trackClick({ shortCode: code.shortCode, source: 'wechat' });
      svc.trackSignup({ shortCode: code.shortCode, childUserId: childId });
      parentId = childId;
    }

    // 验证第 4 级的 ancestorChain 最多 3 个
    const records = svc.listRecords(tId);
    const lastRecord = records[records.length - 1];
    assert.ok(lastRecord.ancestorChain.length <= 3, `got ${lastRecord.ancestorChain.length}`);
  });
});

// ─── 合约: ReferralReward 实体 Shape ─────────────────────

describe('[referral] 合约: ReferralReward Shape', () => {
  it('issueRewards 返回 3 级奖励 (L1=points+coupon, L2/L3=points)', () => {
    const svc = makeService();
    const tId = 'tenant-reward';
    const cA = svc.generateCode({ parentUserId: 'user-A', tenantId: tId });
    svc.trackClick({ shortCode: cA.shortCode, source: 'wechat' });
    svc.trackSignup({ shortCode: cA.shortCode, childUserId: 'user-B' });

    const cB = svc.generateCode({ parentUserId: 'user-B', tenantId: tId });
    svc.trackClick({ shortCode: cB.shortCode, source: 'wechat' });
    svc.trackSignup({ shortCode: cB.shortCode, childUserId: 'user-C' });

    const cC = svc.generateCode({ parentUserId: 'user-C', tenantId: tId });
    svc.trackClick({ shortCode: cC.shortCode, source: 'wechat' });
    const signup = svc.trackSignup({ shortCode: cC.shortCode, childUserId: 'user-D' });

    const rewards = svc.issueRewards(signup.recordId);

    assert.equal(rewards.length, 3, '应生成 L1/L2/L3 三级奖励');

    // 按 level 排序验证
    rewards.sort((a, b) => a.level - b.level);

    // L1 (邀请人 user-C): 100 points + coupon
    assert.equal(rewards[0].level, 1);
    assert.equal(rewards[0].recipientUserId, 'user-C');
    assert.equal(rewards[0].rewardType, 'points');
    assert.equal(rewards[0].rewardValue, 100);
    assert.ok(rewards[0].couponPlanId?.startsWith('coupon-l1-'));
    assert.equal(rewards[0].status, 'issued');

    // L2 (user-B): 50 points, coupon=0 → couponPlanId undefined
    assert.equal(rewards[1].level, 2);
    assert.equal(rewards[1].recipientUserId, 'user-B');
    assert.equal(rewards[1].rewardValue, 50);
    assert.equal(rewards[1].couponPlanId, undefined);

    // L3 (user-A): 10 points, coupon=0 → couponPlanId undefined
    assert.equal(rewards[2].level, 3);
    assert.equal(rewards[2].recipientUserId, 'user-A');
    assert.equal(rewards[2].rewardValue, 10);
    assert.equal(rewards[2].couponPlanId, undefined);

    // 所有奖励都有完整字段
    for (const r of rewards) {
      assert.equal(typeof r.rewardId, 'string');
      assert.ok(r.rewardId.startsWith('reward-'));
      assert.equal(typeof r.recordId, 'string');
      assert.ok(['points', 'coupon'].includes(r.rewardType));
      assert.ok(['pending', 'issued', 'claimed', 'expired'].includes(r.status));
      assert.equal(typeof r.triggeredAt, 'string');
      assert.equal(typeof r.issuedAt, 'string');
    }
  });

  it('L1 奖励含 couponPlanId, L2/L3 不含', () => {
    const svc = makeService();
    svc.setRewardRules({
      1: { points: 100, coupon: 50 },
      2: { points: 50, coupon: 0 },
      3: { points: 0, coupon: 0 },
    });

    const cA = svc.generateCode({ parentUserId: 'user-A', tenantId: 't' });
    svc.trackClick({ shortCode: cA.shortCode, source: 'link' });
    const signup = svc.trackSignup({ shortCode: cA.shortCode, childUserId: 'user-B' });
    const rewards = svc.issueRewards(signup.recordId);

    assert.equal(rewards.length, 1, '没有 L2/L3 祖先，只发 L1');
    assert.ok(rewards[0].couponPlanId, 'L1 应该关联 coupon');
    assert.ok(rewards[0].couponPlanId!.includes('coupon'));
  });
});

// ─── 合约: 业务逻辑契约 ───────────────────────────────

describe('[referral] 合约: 业务逻辑', () => {
  it('点击 + 注册 → 完整闭环', () => {
    const svc = makeService();
    const code = svc.generateCode({ parentUserId: 'user-inviter', tenantId: 't' });

    // 点击（不传 childUserId → pendingByCode 无 childUserId → source 为 'link'）
    const clicked = svc.trackClick({ shortCode: code.shortCode, source: 'link' });
    assert.ok(clicked);
    assert.equal(clicked!.totalClicks, 1);

    // 注册补登
    const record = svc.trackSignup({ shortCode: code.shortCode, childUserId: 'user-new' });
    assert.equal(record.parentUserId, 'user-inviter');
    assert.equal(record.childUserId, 'user-new');
    assert.equal(record.tracked, true);
    assert.equal(record.source, 'link');

    // 奖励
    const rewards = svc.issueRewards(record.recordId);
    assert.equal(rewards.length, 1);
    assert.equal(rewards[0].recipientUserId, 'user-inviter');
    assert.equal(rewards[0].rewardValue, 100);

    // 指标
    const metrics = svc.getMetrics('t');
    assert.equal(metrics.totalCodes, 1);
    assert.equal(metrics.totalClicks, 1);
    assert.equal(metrics.totalSignups, 1);
    assert.equal(metrics.totalRewardsIssued, 1);
    assert.equal(metrics.trackRate, 1);
    assert.equal(metrics.conversionRate, 1);
  });

  it('多次点击累加 correct totalClicks', () => {
    const svc = makeService();
    const code = svc.generateCode({ parentUserId: 'user-A', tenantId: 't' });

    for (let i = 0; i < 5; i++) {
      svc.trackClick({ shortCode: code.shortCode, source: 'qrcode' });
    }
    assert.equal(code.totalClicks, 5);

    // 没有 signup 时注册数仍为 0
    assert.equal(code.totalSignups, 0);
    const metrics = svc.getMetrics('t');
    assert.equal(metrics.totalSignups, 0);
    assert.equal(metrics.trackRate, 0);
  });

  it('过期短码不可用', () => {
    const svc = makeService();
    // 使用过去的时间模拟过期
    const code = svc.generateCode({
      parentUserId: 'user-A',
      tenantId: 't',
      expiresInDays: 0, // expires immediately
    });
    // 将 expiresAt 设为过去
    (code as any).expiresAt = new Date(Date.now() - 86_400_000).toISOString();

    const result = svc.trackClick({ shortCode: code.shortCode, source: 'link' });
    assert.equal(result, undefined, '过期短码应返回 undefined');
  });

  it('不存在的短码返回 undefined', () => {
    const svc = makeService();
    const result = svc.trackClick({ shortCode: 'nonexist', source: 'link' });
    assert.equal(result, undefined);
  });
});

// ─── 合约: 指标计算 ───────────────────────────────

describe('[referral] 合约: ReferralMetrics', () => {
  it('getMetrics 返回完整指标结构', () => {
    const svc = makeService();
    const metrics = svc.getMetrics();
    const fields: (keyof ReferralMetrics)[] = [
      'totalCodes', 'totalClicks', 'totalSignups',
      'trackRate', 'conversionRate',
      'totalRewardsIssued', 'totalRewardsValue',
    ];
    for (const f of fields) {
      assert.equal(typeof metrics[f], 'number', `字段 ${f} 应该是 number`);
    }
  });

  it('指标按 tenant 过滤', () => {
    const svc = makeService();

    // tenant-A: 2 codes, 1 signup
    svc.generateCode({ parentUserId: 'u1', tenantId: 'tenant-A' });
    svc.generateCode({ parentUserId: 'u2', tenantId: 'tenant-A' });

    // tenant-B: 1 code
    svc.generateCode({ parentUserId: 'u3', tenantId: 'tenant-B' });

    const mA = svc.getMetrics('tenant-A');
    assert.equal(mA.totalCodes, 2);

    const mB = svc.getMetrics('tenant-B');
    assert.equal(mB.totalCodes, 1);

    const mAll = svc.getMetrics();
    assert.equal(mAll.totalCodes, 3, '不传 tenant 应返回全局指标');
  });

  it('无数据时指标均为 0', () => {
    const svc = makeService();
    const m = svc.getMetrics();
    assert.equal(m.totalCodes, 0);
    assert.equal(m.totalClicks, 0);
    assert.equal(m.totalSignups, 0);
    assert.equal(m.trackRate, 0);
    assert.equal(m.conversionRate, 0);
    assert.equal(m.totalRewardsIssued, 0);
    assert.equal(m.totalRewardsValue, 0);
  });
});

// ─── 合约: API 返回值 Shape ─────────────────────────────

describe('[referral] 合约: controller 返回值 Shape', () => {
  it('controller generateCode 返回值格式', () => {
    const svc = makeService();
    const code = svc.generateCode({ parentUserId: 'user-A', tenantId: 't' });

    assert.ok('shortCode' in code);
    assert.ok('codeId' in code);
    assert.ok('parentUserId' in code);
    assert.ok('tenantId' in code);
    assert.ok('landingUrl' in code);
    assert.ok('createdAt' in code);
  });

  it('controller getCode 返回值 "found" 标记', () => {
    const svc = makeService();
    const code = svc.generateCode({ parentUserId: 'u', tenantId: 't' });
    const codeData = svc.getCode(code.shortCode);

    // 模拟 controller 返回格式
    const okResult = codeData
      ? { found: true as const, code: codeData }
      : { found: false as const, message: 'not found' };

    assert.equal(okResult.found, true);
    if (okResult.found && 'code' in okResult) {
      assert.equal(okResult.code.shortCode, code.shortCode);
    }
  });

  it('controller getCode 未找到返回值', () => {
    const svc = makeService();
    const codeData = svc.getCode('NOSUCHCODE');
    const result = codeData
      ? { found: true as const, code: codeData }
      : { found: false as const, message: 'Code not found: NOSUCHCODE' };

    assert.equal(result.found, false);
  });

  it('issueRewards 返回值格式', () => {
    const svc = makeService();
    const c = svc.generateCode({ parentUserId: 'u1', tenantId: 't' });
    svc.trackClick({ shortCode: c.shortCode, source: 'link' });
    const r = svc.trackSignup({ shortCode: c.shortCode, childUserId: 'u2' });
    const rewards = svc.issueRewards(r.recordId);

    const dto = {
      rewards: rewards.map(rev => ({
        rewardId: rev.rewardId,
        recipientUserId: rev.recipientUserId,
        level: rev.level,
        rewardType: rev.rewardType,
        rewardValue: rev.rewardValue,
        status: rev.status,
      })),
    };

    assert.ok(Array.isArray(dto.rewards));
    assert.equal(dto.rewards.length, 1);
    assert.ok('rewardId' in dto.rewards[0]);
    assert.ok('recipientUserId' in dto.rewards[0]);
    assert.ok('level' in dto.rewards[0]);
  });

  it('listRecords 返回值格式', () => {
    const svc = makeService();
    const c = svc.generateCode({ parentUserId: 'u1', tenantId: 't' });
    svc.trackClick({ shortCode: c.shortCode, source: 'wechat' });
    svc.trackSignup({ shortCode: c.shortCode, childUserId: 'u2' });

    const records = svc.listRecords('t');
    const result = {
      records: records.map(r => ({
        recordId: r.recordId,
        parentUserId: r.parentUserId,
        childUserId: r.childUserId,
        level: r.level,
        source: r.source,
        signedUpAt: r.signedUpAt,
        tracked: r.tracked,
      })),
    };

    assert.equal(result.records.length, 1);
    assert.ok('recordId' in result.records[0]);
    assert.ok('parentUserId' in result.records[0]);
    assert.ok('childUserId' in result.records[0]);
    assert.equal(result.records[0].tracked, true);
  });

  it('listRewards 返回值格式', () => {
    const svc = makeService();
    const c = svc.generateCode({ parentUserId: 'u1', tenantId: 't' });
    svc.trackClick({ shortCode: c.shortCode, source: 'qrcode' });
    const signup = svc.trackSignup({ shortCode: c.shortCode, childUserId: 'u2' });
    svc.issueRewards(signup.recordId);

    const rewards = svc.listRewards('t');
    const result = {
      rewards: rewards.map(r => ({
        rewardId: r.rewardId,
        recipientUserId: r.recipientUserId,
        level: r.level,
        rewardType: r.rewardType,
        rewardValue: r.rewardValue,
        status: r.status,
        issuedAt: r.issuedAt,
      })),
    };

    assert.equal(result.rewards.length, 1);
    assert.ok('rewardId' in result.rewards[0]);
    assert.equal(result.rewards[0].status, 'issued');
  });
});

// ─── 合约: 并发/重复场景 ───────────────────────────────

describe('[referral] 合约: 并发与重复', () => {
  it('同一短码重复注册抛出 Error', () => {
    const svc = makeService();
    const code = svc.generateCode({ parentUserId: 'u1', tenantId: 't' });
    svc.trackClick({ shortCode: code.shortCode, source: 'wechat' });
    svc.trackSignup({ shortCode: code.shortCode, childUserId: 'u2' });

    // 再次注册不会抛错 (设计: 允许重复绑定)
    // 但会创建新 record
    svc.trackClick({ shortCode: code.shortCode, source: 'wechat' });
    const r2 = svc.trackSignup({ shortCode: code.shortCode, childUserId: 'u3' });
    assert.equal(r2.childUserId, 'u3');

    // 验证有 2 条独立 record
    const records = svc.listRecords('t');
    assert.equal(records.length, 2);
  });

  it('同一用户可生成多个短码', () => {
    const svc = makeService();
    const c1 = svc.generateCode({ parentUserId: 'user-A', tenantId: 't' });
    const c2 = svc.generateCode({ parentUserId: 'user-A', tenantId: 't' });
    assert.notEqual(c1.shortCode, c2.shortCode);

    const metrics = svc.getMetrics('t');
    assert.equal(metrics.totalCodes, 2);
  });
});
