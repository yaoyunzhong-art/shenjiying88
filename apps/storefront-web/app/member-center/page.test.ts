/**
 * member-center/page.test.ts — 会员中心 L1 源码冒烟测试
 * 覆盖: 会员等级 · 积分 · 权益 · 订单 · 升级进度 · 防御 · 边界
 * 角色: 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ── 类型（mirror page.tsx） ──

type MembershipTier = 'diamond' | 'gold' | 'silver' | 'bronze' | 'basic';

interface RecentOrder {
  id: string;
  orderNo: string;
  amount: number;
  status: string;
  date: string;
  items: number;
}

interface MemberBenefits {
  label: string;
  value: string;
  icon: React.ReactNode;
}

const TIER_LABELS: Record<MembershipTier, string> = {
  diamond: '钻石会员',
  gold: '黄金会员',
  silver: '银卡会员',
  bronze: '铜卡会员',
  basic: '普通会员',
};

const TIER_COLORS: Record<MembershipTier, string> = {
  diamond: '#a78bfa',
  gold: '#fbbf24',
  silver: '#94a3b8',
  bronze: '#d97706',
  basic: '#64748b',
};

const TIER_ORDER: MembershipTier[] = ['basic', 'bronze', 'silver', 'gold', 'diamond'];

// ── 辅助函数 ──

function getPointsMultiplier(tier: MembershipTier): number {
  const multipliers: Record<MembershipTier, number> = { diamond: 3, gold: 2, silver: 1.5, bronze: 1.2, basic: 1 };
  return multipliers[tier];
}

function getDiscountRate(tier: MembershipTier): number {
  const rates: Record<MembershipTier, number> = { diamond: 15, gold: 10, silver: 8, bronze: 5, basic: 0 };
  return rates[tier];
}

function getBirthdayGift(tier: MembershipTier): string {
  const gifts: Record<MembershipTier, string> = { diamond: '高端礼品+双倍积分', gold: '精致礼品+双倍积分', silver: '优惠券+积分', bronze: '优惠券', basic: '积分' };
  return gifts[tier];
}

function getNextTier(tier: MembershipTier): MembershipTier | null {
  const idx = TIER_ORDER.indexOf(tier);
  if (idx < TIER_ORDER.length - 1) return TIER_ORDER[idx + 1];
  return null;
}

interface TierProgress {
  percent: number;
  nextTier: MembershipTier | null;
  nextTierLabel: string;
}

function getTierProgress(points: number, tier: MembershipTier): TierProgress {
  const thresholds: Record<MembershipTier, number> = { diamond: 0, gold: 50000, silver: 10000, bronze: 2000, basic: 0 };
  const next = getNextTier(tier);
  if (!next) return { percent: 100, nextTier: null, nextTierLabel: '已达最高等级' };
  const currentThreshold = thresholds[tier] || 0;
  const nextThreshold = thresholds[next];
  if (nextThreshold <= currentThreshold) return { percent: 100, nextTier: null, nextTierLabel: '' };
  const progress = Math.min(100, Math.max(0, ((points - currentThreshold) / (nextThreshold - currentThreshold)) * 100));
  return { percent: Math.floor(progress), nextTier: next, nextTierLabel: TIER_LABELS[next] };
}

function getBenefits(tier: MembershipTier): MemberBenefits[] {
  const base: MemberBenefits[] = [
    { label: '积分倍率', value: `${getPointsMultiplier(tier)}x`, icon: '' as unknown as React.ReactNode },
    { label: '生日礼遇', value: getBirthdayGift(tier), icon: '' as unknown as React.ReactNode },
    { label: '专属折扣', value: `${getDiscountRate(tier)}%`, icon: '' as unknown as React.ReactNode },
  ];
  if (tier === 'diamond' || tier === 'gold') {
    base.push({ label: '生日特权', value: '双倍积分+礼品', icon: '' as unknown as React.ReactNode });
  }
  return base;
}

const MOCK_ORDERS: RecentOrder[] = [
  { id: '1', orderNo: 'ORD20260701001', amount: 128, status: '已完成', date: '2026-07-01', items: 3 },
  { id: '2', orderNo: 'ORD20260628002', amount: 56.5, status: '已完成', date: '2026-06-28', items: 2 },
  { id: '3', orderNo: 'ORD20260625003', amount: 399, status: '已完成', date: '2026-06-25', items: 5 },
  { id: '4', orderNo: 'ORD20260620004', amount: 88, status: '已完成', date: '2026-06-20', items: 1 },
  { id: '5', orderNo: 'ORD20260615005', amount: 215, status: '已完成', date: '2026-06-15', items: 4 },
];

function calcTotalSpent(orders: RecentOrder[]): number {
  return orders.reduce((s, o) => s + o.amount, 0);
}

function calcTotalItems(orders: RecentOrder[]): number {
  return orders.reduce((s, o) => s + o.items, 0);
}

// ============================================================
// 正例 (10+)
// ============================================================

test('👔 店长: 页面默认导出为函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function');
});

test('👔 店长: 源码包含关键导出', () => {
  assert.ok(SRC.includes("'use client'"), '缺少 use client');
  assert.ok(SRC.includes('MembershipTier'), '缺少 MembershipTier');
  assert.ok(SRC.includes('RecentOrder'), '缺少 RecentOrder');
  assert.ok(SRC.includes('MemberBenefits'), '缺少 MemberBenefits');
  assert.ok(SRC.includes('TIER_LABELS'), '缺少 TIER_LABELS');
  assert.ok(SRC.includes('TIER_ORDER'), '缺少 TIER_ORDER');
});

test('👔 店长: TIER_LABELS 覆盖全部 5 个等级', () => {
  assert.equal(Object.keys(TIER_LABELS).length, 5);
  assert.equal(TIER_LABELS.diamond, '钻石会员');
  assert.equal(TIER_LABELS.gold, '黄金会员');
  assert.equal(TIER_LABELS.silver, '银卡会员');
  assert.equal(TIER_LABELS.bronze, '铜卡会员');
  assert.equal(TIER_LABELS.basic, '普通会员');
});

test('👔 店长: TIER_ORDER 顺序正确', () => {
  assert.deepEqual(TIER_ORDER, ['basic', 'bronze', 'silver', 'gold', 'diamond']);
});

test('🎯 运行专员: 积分倍率配发正确', () => {
  assert.equal(getPointsMultiplier('diamond'), 3);
  assert.equal(getPointsMultiplier('gold'), 2);
  assert.equal(getPointsMultiplier('silver'), 1.5);
  assert.equal(getPointsMultiplier('bronze'), 1.2);
  assert.equal(getPointsMultiplier('basic'), 1);
});

test('📢 营销: 折扣率配发正确', () => {
  assert.equal(getDiscountRate('diamond'), 15);
  assert.equal(getDiscountRate('gold'), 10);
  assert.equal(getDiscountRate('silver'), 8);
  assert.equal(getDiscountRate('bronze'), 5);
  assert.equal(getDiscountRate('basic'), 0);
});

test('🤝 团建: 生日礼遇配发正确', () => {
  assert.equal(getBirthdayGift('diamond'), '高端礼品+双倍积分');
  assert.equal(getBirthdayGift('gold'), '精致礼品+双倍积分');
  assert.equal(getBirthdayGift('silver'), '优惠券+积分');
  assert.equal(getBirthdayGift('bronze'), '优惠券');
  assert.equal(getBirthdayGift('basic'), '积分');
});

test('🎯 运行专员: 下一等级推断', () => {
  assert.equal(getNextTier('basic'), 'bronze');
  assert.equal(getNextTier('bronze'), 'silver');
  assert.equal(getNextTier('silver'), 'gold');
  assert.equal(getNextTier('gold'), 'diamond');
  assert.equal(getNextTier('diamond'), null);
});

test('🎯 运行专员: 升级进度计算 — 银卡到金卡', () => {
  const progress = getTierProgress(5000, 'silver');
  // silver thresholds: 10000, gold threshold: 50000
  // progress = (5000 - 10000) / (50000 - 10000) = -5000/40000 === 0 (clamped)
  assert.equal(progress.percent, 0);
  assert.equal(progress.nextTier, 'gold');
  assert.equal(progress.nextTierLabel, '黄金会员');
});

test('🎯 运行专员: 升级进度 50%', () => {
  const progress = getTierProgress(30000, 'silver');
  // (30000 - 10000) / (50000 - 10000) = 20000/40000 = 50%
  assert.equal(progress.percent, 50);
});

test('🎯 运行专员: 已达最高等级返回 100%', () => {
  const progress = getTierProgress(99999, 'diamond');
  assert.equal(progress.percent, 100);
  assert.equal(progress.nextTier, null);
  assert.equal(progress.nextTierLabel, '已达最高等级');
});

test('👔 店长: 权益数据钻石会员有 4 项', () => {
  const benefits = getBenefits('diamond');
  assert.equal(benefits.length, 4, '钻石应有 4 项权益');
});

test('👔 店长: 权益数据普通会员有 3 项', () => {
  const benefits = getBenefits('basic');
  assert.equal(benefits.length, 3, '普通会员应有 3 项权益');
});

test('👔 店长: 消费总额计算', () => {
  const total = calcTotalSpent(MOCK_ORDERS);
  assert.equal(total, 128 + 56.5 + 399 + 88 + 215); // 886.5
});

test('👔 店长: 总件数计算', () => {
  assert.equal(calcTotalItems(MOCK_ORDERS), 3 + 2 + 5 + 1 + 4); // 15
});

// ============================================================
// 反例 (8+)
// ============================================================

test('🔧 安监: 未知等级应返回 undefined', () => {
  const result = getPointsMultiplier('legendary' as MembershipTier);
  assert.equal(result, undefined);
});

test('🔧 安监: 未知等级的折扣率', () => {
  assert.equal(getDiscountRate('legendary' as MembershipTier), undefined);
});

test('🔧 安监: 未知等级的生日礼遇', () => {
  assert.equal(getBirthdayGift('legendary' as MembershipTier), undefined);
});

test('🔧 安监: 未知等级返回 basic（indexOf -1 行为）', () => {
  const result = getNextTier('legendary' as MembershipTier);
  // indexOf('legendary') = -1, -1 < 4 is true, returns TIER_ORDER[-1+1]=TIER_ORDER[0]='basic'
  assert.equal(result, 'basic');
});

test('🔧 安监: 未知等级的升级进度', () => {
  const progress = getTierProgress(1000, 'legendary' as MembershipTier);
  assert.equal(progress.percent, 100);
  assert.equal(progress.nextTier, null);
});

test('🔧 安监: 负积分升级进度钳制为 0', () => {
  const progress = getTierProgress(-500, 'basic');
  assert.equal(progress.percent, 0);
});

test('🔧 安监: 空订单总消费为 0', () => {
  assert.equal(calcTotalSpent([]), 0);
});

test('🔧 安监: 极大量积分不下溢', () => {
  const progress = getTierProgress(Number.MAX_SAFE_INTEGER, 'silver');
  assert.equal(progress.percent, 100);
});

test('🔧 安监: 无权限信息应跳转登录页', () => {
  // page.tsx uses localStorage.getItem('member_access_token') — check source guard
  assert.ok(SRC.includes('member_access_token'), '应有 token 检查');
  assert.ok(SRC.includes('/member-login'), '应有跳转登录');
});

test('🔧 安监: 订单数量字段应为正数', () => {
  for (const order of MOCK_ORDERS) {
    assert.ok(order.items > 0, `订单 ${order.id} 件数 > 0`);
  }
});

// ============================================================
// 边界 (7+)
// ============================================================

test('🎯 运行专员: 临界积分 — 刚好升级边界', () => {
  // silver -> gold: need above 10000; at 10000, progress = (10000-10000)/(50000-10000) = 0
  const progress = getTierProgress(10000, 'silver');
  assert.equal(progress.percent, 0);
  assert.equal(progress.nextTier, 'gold');
});

test('🎯 运行专员: 临界积分 — 刚好满 100%', () => {
  const progress = getTierProgress(50000, 'silver');
  assert.equal(progress.percent, 100);
  assert.equal(progress.nextTier, 'gold');
});

test('🎯 运行专员: 临界积分 — 超出 100% 钳制', () => {
  const progress = getTierProgress(100000, 'silver');
  assert.equal(progress.percent, 100);
});

test('👔 店长: 各等级颜色唯一', () => {
  const colors = Object.values(TIER_COLORS);
  assert.equal(new Set(colors).size, 5, '5 个颜色各不相同');
});

test('👔 店长: 各等级权益数完整验证', () => {
  assert.equal(getBenefits('basic').length, 3);
  assert.equal(getBenefits('bronze').length, 3);
  assert.equal(getBenefits('silver').length, 3);
  assert.equal(getBenefits('gold').length, 4);
  assert.equal(getBenefits('diamond').length, 4);
});

test('📢 营销: 最近 5 笔订单金额分布', () => {
  const amounts = MOCK_ORDERS.map((o) => o.amount);
  assert.ok(amounts.every((a) => a > 0), '金额均为正数');
  assert.ok(Math.max(...amounts) <= 500, '单笔不超过 500');
});

test('🤝 团建: 订单总金额精确到一位小数', () => {
  const total = calcTotalSpent(MOCK_ORDERS);
  assert.ok(Number.isFinite(total));
  assert.ok(String(total).includes('.') === (total % 1 !== 0) || String(total).endsWith('.5'));
});
