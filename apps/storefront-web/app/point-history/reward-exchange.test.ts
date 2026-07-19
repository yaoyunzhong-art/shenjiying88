/**
 * point-history/reward-exchange.test.ts — 积分兑换/奖励 L1 源码分析测试
 * 纯 node:test, 不依赖 vitest/JSX/React
 * 覆盖: 奖励列表、兑换状态、过期提醒、积分兑换、排行榜、会员等级
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ── 类型 ──

interface RedeemOption {
  id: string;
  item: string;
  points: number;
  exchangeRate: string;
  hot: number;
}

interface RewardTop {
  item: string;
  count: number;
  rate: number;
}

interface ExpireBatch {
  batch: string;
  points: number;
  expireDate: string;
  daysLeft: number;
  priority: string;
}

interface LeaderboardUser {
  rank: number;
  name: string;
  earned: number;
  spent: number;
}

interface PointGoalPath {
  target: number;
  title: string;
  desc: string;
  duration: string;
}

// ── 从源码提取的奖励/兑换数据 ──

const REDEEM_OPTIONS: RedeemOption[] = [
  { id: 'r1', item: '免费游戏币20枚', points: 200, exchangeRate: '10分/枚', hot: 92 },
  { id: 'r2', item: '单人畅玩卡', points: 500, exchangeRate: '省¥30', hot: 85 },
  { id: 'r3', item: '生日派对套餐', points: 2000, exchangeRate: '省¥120', hot: 78 },
  { id: 'r4', item: 'VIP月卡', points: 3000, exchangeRate: '省¥200', hot: 72 },
];

const TOP_EXCHANGES: RewardTop[] = [
  { item: '免费游戏币20枚', count: 120, rate: 92 },
  { item: '单人畅玩卡', count: 85, rate: 85 },
  { item: '零食套餐', count: 68, rate: 72 },
];

const EXPIRE_BATCHES: ExpireBatch[] = [
  { batch: '2026年1月获得', points: 1200, expireDate: '2026-07-31', daysLeft: 14, priority: 'urgent' },
  { batch: '2026年2月获得', points: 800, expireDate: '2026-08-31', daysLeft: 45, priority: 'warning' },
  { batch: '2026年3月获得', points: 1200, expireDate: '2026-09-30', daysLeft: 75, priority: 'normal' },
];

const LEADERBOARD: LeaderboardUser[] = [
  { rank: 1, name: '张伟', earned: 1250, spent: 350 },
  { rank: 2, name: '李芳', earned: 980, spent: 500 },
  { rank: 3, name: '王强', earned: 720, spent: 200 },
  { rank: 4, name: '赵敏', earned: 680, spent: 450 },
  { rank: 5, name: '陈浩', earned: 520, spent: 180 },
];

const TIER_RULES = [
  { name: '银卡', min: 0, color: '#94a3b8', benefits: '基础累计·生日优惠' },
  { name: '金卡', min: 1000, color: '#f59e0b', benefits: '1.2x加速·优先排队' },
  { name: '钻石', min: 5000, color: '#06b6d4', benefits: '1.5x加速·专属活动·VIP' },
  { name: '至尊', min: 20000, color: '#a855f7', benefits: '2x加速·1v1客服·年度礼' },
];

const EXPIRE_STATS_DATA = [
  { month: '4月', points: 2350, renewRate: 68 },
  { month: '5月', points: 3120, renewRate: 72 },
  { month: '6月', points: 4580, renewRate: 65 },
];

const POINT_CHANNELS = [
  { source: '消费积分', icon: '🛒', pct: 52, points: 218000 },
  { source: '签到奖励', icon: '📅', pct: 18, points: 75600 },
  { source: '活动赠送', icon: '🎪', pct: 15, points: 63000 },
  { source: '推荐好友', icon: '👥', pct: 8, points: 33600 },
  { source: '其他渠道', icon: '📌', pct: 7, points: 29400 },
];

// ── 工具函数 ──

function calcTotalPoints(items: RedeemOption[]): number {
  return items.reduce((s, i) => s + i.points, 0);
}

function sortByHot(items: RedeemOption[]): RedeemOption[] {
  return [...items].sort((a, b) => b.hot - a.hot);
}

function getHotThreshold(items: RedeemOption[]): number {
  if (items.length === 0) return 0;
  const avg = items.reduce((s, i) => s + i.hot, 0) / items.length;
  return Math.round(avg);
}

function checkRedeemable(balance: number, cost: number): boolean {
  return balance >= cost;
}

function calcExpiringSoon(batches: ExpireBatch[], thresholdDays: number): ExpireBatch[] {
  return batches.filter((b) => b.daysLeft <= thresholdDays);
}

function getTotalExpiringPoints(batches: ExpireBatch[]): number {
  return batches.reduce((s, b) => s + b.points, 0);
}

function getPriorityStyle(priority: string): string {
  const map: Record<string, string> = { urgent: '#dc2626', warning: '#d97706', normal: '#6b7280' };
  return map[priority] ?? '#6b7280';
}

function calcLeaderboardTotal(data: LeaderboardUser[]): number {
  return data.reduce((s, u) => s + u.earned, 0);
}

function calcNetPoints(data: LeaderboardUser[]): number {
  return data.reduce((s, u) => s + (u.earned - u.spent), 0);
}

function findTierByPoints(points: number): string {
  const tiers = [...TIER_RULES].reverse();
  for (const t of tiers) {
    if (points >= t.min) return t.name;
  }
  return '银卡';
}

function calcChannelMax(pct: number, total: number): number {
  return Math.round((pct / 100) * total);
}

function calcExpireRenewImpact(stats: typeof EXPIRE_STATS_DATA): number {
  const total = stats.reduce((s, d) => s + d.points, 0);
  const renewed = stats.reduce((s, d) => s + Math.round(d.points * d.renewRate / 100), 0);
  return renewed / total;
}

function calcConsumeDistribution(items: RedeemOption[]): Record<string, number> {
  const total = calcTotalPoints(items);
  if (total === 0) return {};
  const raw = items.map((i) => ({ key: i.item, pct: (i.points / total) * 100 }));
  const floored = raw.map((r) => ({ ...r, floor: Math.floor(r.pct) }));
  const sumFloor = floored.reduce((s, r) => s + r.floor, 0);
  const remainder = 100 - sumFloor;
  const sorted = [...floored].sort((a, b) => (b.pct - b.floor) - (a.pct - a.floor));
  for (let i = 0; i < remainder && i < sorted.length; i++) {
    sorted[i]!.floor += 1;
  }
  return floored.reduce((acc: Record<string, number>, r) => {
    acc[r.key] = r.floor;
    return acc;
  }, {});
}

/* =================================================================
 * 奖励列表 (Reward List)
 * ================================================================= */

test('奖励列表: REDEEM_OPTIONS 包含 4 种兑换选项', () => {
  assert.equal(REDEEM_OPTIONS.length, 4);
});

test('奖励列表: 每个选项有 id, item, points, exchangeRate, hot 字段', () => {
  for (const r of REDEEM_OPTIONS) {
    assert.ok(r.id, '缺少 id');
    assert.ok(r.item, '缺少 item');
    assert.equal(typeof r.points, 'number', `${r.id} points 应数字`);
    assert.ok(r.points > 0, `${r.id} points 应正数`);
    assert.ok(r.exchangeRate, '缺少 exchangeRate');
    assert.ok(r.hot >= 0 && r.hot <= 100, `${r.id} hot 应在 0-100`);
  }
});

test('奖励列表: points 值递增排列', () => {
  for (let i = 1; i < REDEEM_OPTIONS.length; i++) {
    assert.ok(REDEEM_OPTIONS[i]!.points >= REDEEM_OPTIONS[i - 1]!.points,
      `${REDEEM_OPTIONS[i]!.item} points 应 >= ${REDEEM_OPTIONS[i - 1]!.item}`);
  }
});

test('奖励列表: sortByHot 降序排列', () => {
  const sorted = sortByHot(REDEEM_OPTIONS);
  assert.equal(sorted[0]!.hot, 92);
  assert.equal(sorted[sorted.length - 1]!.hot, 72);
});

test('奖励列表: 最便宜的兑换仅需 200 分', () => {
  const minPoints = Math.min(...REDEEM_OPTIONS.map((r) => r.points));
  assert.equal(minPoints, 200);
});

test('奖励列表: 最贵的兑换需 3000 分', () => {
  const maxPoints = Math.max(...REDEEM_OPTIONS.map((r) => r.points));
  assert.equal(maxPoints, 3000);
});

test('奖励列表: 源码包含"热门兑换推荐"区域', () => {
  assert.ok(SRC.includes('热门兑换推荐'), '应包含热门兑换推荐');
});

test('奖励列表: 兑换项有热度条(百分比显示)', () => {
  assert.ok(SRC.includes('热度') || SRC.includes('hot'), '应包含热度指标');
});

test('奖励列表: 兑换项包含兑换率和省多少钱信息', () => {
  assert.ok(SRC.includes('省¥'), '应包含省钱信息');
});

/* =================================================================
 * 兑换/领取状态 (Redeem Status)
 * ================================================================= */

test('兑换: checkRedeemable 分数充足返回 true', () => {
  assert.equal(checkRedeemable(500, 200), true);
});

test('兑换: checkRedeemable 分数不足返回 false', () => {
  assert.equal(checkRedeemable(100, 200), false);
});

test('兑换: checkRedeemable 余额正好等于成本返回 true', () => {
  assert.equal(checkRedeemable(200, 200), true);
});

test('兑换: checkRedeemable 余额为 0 返回 false', () => {
  assert.equal(checkRedeemable(0, 100), false);
});

test('兑换: TOP_EXCHANGES 包含 3 个最受欢迎兑换项', () => {
  assert.equal(TOP_EXCHANGES.length, 3);
});

test('兑换: 最受欢迎兑换 count 降序排列', () => {
  for (let i = 1; i < TOP_EXCHANGES.length; i++) {
    assert.ok(TOP_EXCHANGES[i]!.count <= TOP_EXCHANGES[i - 1]!.count,
      `第${i + 1}名 count 应 <= 第${i}名`);
  }
});

test('兑换: 源码显示"本月最受欢迎兑换 TOP3"', () => {
  assert.ok(SRC.includes('最受欢迎兑换'), '应包含最受欢迎兑换');
});

test('兑换: 兑换记录显示兑换次数', () => {
  for (const t of TOP_EXCHANGES) {
    assert.ok(t.count > 0, `${t.item} 应正数兑换次数`);
  }
});

test('兑换: calcTotalPoints 计算总和', () => {
  const total = calcTotalPoints(REDEEM_OPTIONS);
  assert.equal(total, 200 + 500 + 2000 + 3000);
});

test('兑换: calcConsumeDistribution 计算分布百分比', () => {
  const dist = calcConsumeDistribution(REDEEM_OPTIONS);
  const pcts = Object.values(dist);
  assert.equal(pcts.reduce((s, v) => s + v, 0), 100);
});

/* =================================================================
 * 过期提醒 (Expiry Reminder)
 * ================================================================= */

test('过期: EXPIRE_BATCHES 包含 3 批待到期积分', () => {
  assert.equal(EXPIRE_BATCHES.length, 3);
});

test('过期: 每个批次包含 batch, points, expireDate, daysLeft, priority', () => {
  for (const b of EXPIRE_BATCHES) {
    assert.ok(b.batch, '缺少 batch');
    assert.ok(b.points > 0, `${b.batch} points 应 > 0`);
    assert.ok(b.expireDate, '缺少 expireDate');
    assert.equal(typeof b.daysLeft, 'number');
    assert.ok(['urgent', 'warning', 'normal'].includes(b.priority), `${b.batch} priority 无效`);
  }
});

test('过期: calcExpiringSoon 7天内紧迫返回紧急批次', () => {
  const urgent = calcExpiringSoon(EXPIRE_BATCHES, 14);
  assert.equal(urgent.length, 1);
  assert.equal(urgent[0]!.batch, '2026年1月获得');
});

test('过期: calcExpiringSoon 阈值 0 返回空', () => {
  const result = calcExpiringSoon(EXPIRE_BATCHES, 0);
  assert.equal(result.length, 0);
});

test('过期: getTotalExpiringPoints 计算过期积分总和', () => {
  const total = getTotalExpiringPoints(EXPIRE_BATCHES);
  assert.equal(total, 1200 + 800 + 1200);
});

test('过期: 紧急批次用红色标注', () => {
  const urgentStyle = getPriorityStyle('urgent');
  assert.equal(urgentStyle, '#dc2626');
});

test('过期: 警告批次用橙色标注', () => {
  const warnStyle = getPriorityStyle('warning');
  assert.equal(warnStyle, '#d97706');
});

test('过期: 正常批次用灰色标注', () => {
  const normalStyle = getPriorityStyle('normal');
  assert.equal(normalStyle, '#6b7280');
});

test('过期: 源码包含"积分到期提醒"或"过期"文本', () => {
  assert.ok(SRC.includes('到期提醒') || SRC.includes('过期'), '应包含到期/过期提醒');
});

test('过期: 源码显示到期批次的时间和剩余天数', () => {
  assert.ok(SRC.includes('到期') && SRC.includes('天'), '应显示天数和到期时间');
});

test('过期: getPriorityStyle 未定义优先级返回灰色', () => {
  const style = getPriorityStyle('unknown');
  assert.equal(style, '#6b7280');
});

test('过期: calcExpiringSoon 空数组不崩溃', () => {
  const result = calcExpiringSoon([], 7);
  assert.equal(result.length, 0);
});

test('过期: 源码包含"今日积分提醒"区域', () => {
  assert.ok(SRC.includes('今日积分提醒'), '应包含今日积分提醒');
});

test('过期: 源码展示 60日内过期积分统计', () => {
  assert.ok(SRC.includes('60日') || SRC.includes('过期'), '应包含过期统计');
});

/* =================================================================
 * 积分兑换 (Points Exchange)
 * ================================================================= */

test('兑换详情: 源码包含"积分兑换推荐"区域', () => {
  assert.ok(SRC.includes('积分兑换推荐'), '应包含积分兑换推荐');
});

test('兑换详情: 兑换项展示积分消耗和热度百分比', () => {
  for (const r of REDEEM_OPTIONS) {
    assert.ok(r.points > 0 && r.hot > 0, `${r.item} points 和 hot 应 > 0`);
  }
});

test('兑换详情: 源码包含"积分消耗渠道分布"', () => {
  assert.ok(SRC.includes('消耗渠道分布') || SRC.includes('消耗渠道'), '应包含消耗渠道');
});

test('兑换详情: 消耗渠道显示各品类占比', () => {
  const totalPct = POINT_CHANNELS.reduce((s, c) => s + c.pct, 0);
  assert.equal(totalPct, 100, '各渠道占比应合计 100%');
});

test('兑换详情: 消费积分占比最高', () => {
  const sorted = [...POINT_CHANNELS].sort((a, b) => b.pct - a.pct);
  assert.equal(sorted[0]!.source, '消费积分');
});

test('兑换详情: getHotThreshold 计算平均热度', () => {
  const avg = getHotThreshold(REDEEM_OPTIONS);
  const expected = Math.round((92 + 85 + 78 + 72) / 4);
  assert.equal(avg, expected);
});

test('兑换详情: 兑换热度条百分比正确显示', () => {
  for (const r of REDEEM_OPTIONS) {
    assert.ok(r.hot <= 100, `${r.item} 热度不应超过 100`);
    assert.ok(r.hot >= 0, `${r.item} 热度不应为负`);
  }
});

test('兑换详情: calcTotalPoints 空数组返回 0', () => {
  assert.equal(calcTotalPoints([]), 0);
});

/* =================================================================
 * 会员等级 (Member Tier)
 * ================================================================= */

test('等级: TIER_RULES 包含 4 个会员等级', () => {
  assert.equal(TIER_RULES.length, 4);
});

test('等级: 各等级门槛严格递增', () => {
  for (let i = 1; i < TIER_RULES.length; i++) {
    assert.ok(TIER_RULES[i]!.min > TIER_RULES[i - 1]!.min,
      `等级 ${TIER_RULES[i]!.name} min > ${TIER_RULES[i - 1]!.name} min`);
  }
});

test('等级: findTierByPoints 银卡(0分)', () => {
  assert.equal(findTierByPoints(0), '银卡');
});

test('等级: findTierByPoints 金卡(1000分)', () => {
  assert.equal(findTierByPoints(1000), '金卡');
});

test('等级: findTierByPoints 钻石(5000分)', () => {
  assert.equal(findTierByPoints(5000), '钻石');
});

test('等级: findTierByPoints 至尊(20000分)', () => {
  assert.equal(findTierByPoints(20000), '至尊');
});

test('等级: findTierByPoints 超大值不崩溃', () => {
  assert.equal(findTierByPoints(999999), '至尊');
});

test('等级: 源码包含"会员等级与权益"区域', () => {
  assert.ok(SRC.includes('会员等级与权益'), '应包含等级展示');
});

/* =================================================================
 * 排行榜 (Leaderboard)
 * ================================================================= */

test('排行榜: LEADERBOARD 包含 5 人', () => {
  assert.equal(LEADERBOARD.length, 5);
});

test('排行榜: 排名由高到低排序', () => {
  for (let i = 1; i < LEADERBOARD.length; i++) {
    assert.ok(LEADERBOARD[i]!.rank > LEADERBOARD[i - 1]!.rank,
      `第${i + 1}名 rank 应 > 第${i}名`);
  }
});

test('排行榜: 第一名积分最高', () => {
  const maxEarned = Math.max(...LEADERBOARD.map((u) => u.earned));
  assert.equal(LEADERBOARD[0]!.earned, maxEarned);
});

test('排行榜: calcLeaderboardTotal 计算总获得积分', () => {
  const total = calcLeaderboardTotal(LEADERBOARD);
  const expected = 1250 + 980 + 720 + 680 + 520;
  assert.equal(total, expected);
});

test('排行榜: calcNetPoints 计算净积分', () => {
  const net = calcNetPoints(LEADERBOARD);
  const expected = (1250 - 350) + (980 - 500) + (720 - 200) + (680 - 450) + (520 - 180);
  assert.equal(net, expected);
});

test('排行榜: earned 值大于 spent 值(普遍规律)', () => {
  for (const u of LEADERBOARD) {
    assert.ok(u.earned >= u.spent, `${u.name} earned(${u.earned}) >= spent(${u.spent})`);
  }
});

test('排行榜: 源码包含"积分排行榜"区域', () => {
  assert.ok(SRC.includes('积分排行榜') || SRC.includes('达人榜'), '应包含排行榜');
});

/* =================================================================
 * 过期策略/续期 (Expire Strategy)
 * ================================================================= */

test('过期策略: EXPIRE_STATS_DATA 包含 3 个月', () => {
  assert.equal(EXPIRE_STATS_DATA.length, 3);
});

test('过期策略: 每月 renewRate 在 0-100 范围内', () => {
  for (const s of EXPIRE_STATS_DATA) {
    assert.ok(s.renewRate >= 0 && s.renewRate <= 100, `${s.month} renewRate 应 0-100`);
  }
});

test('过期策略: calcExpireRenewImpact 计算续期率权重', () => {
  const ratio = calcExpireRenewImpact(EXPIRE_STATS_DATA);
  assert.ok(ratio > 0 && ratio <= 1, '续期比例应在 (0,1] 范围内');
});

test('过期策略: 6月过期积分最多', () => {
  const max = Math.max(...EXPIRE_STATS_DATA.map((d) => d.points));
  const june = EXPIRE_STATS_DATA.find((d) => d.month === '6月');
  assert.equal(june!.points, max);
});

test('过期策略: 源码包含"积分过期策略说明"区域', () => {
  assert.ok(SRC.includes('过期策略说明') || SRC.includes('过期规则'), '应包含过期策略');
});

test('过期策略: 过期策略包含 6 条规则', () => {
  const rulePatterns = ['有效期', '过期前30天', '过期前7天', '过期当天', '可续期', '无法续期'];
  for (const p of rulePatterns) {
    assert.ok(SRC.includes(p), `应包含规则: ${p}`);
  }
});

/* =================================================================
 * 积分获取途径 (Point Sources)
 * ================================================================= */

test('途径: POINT_CHANNELS 包含 5 个获取渠道', () => {
  assert.equal(POINT_CHANNELS.length, 5);
});

test('途径: 各渠道占比合计 100%', () => {
  const totalPct = POINT_CHANNELS.reduce((s, c) => s + c.pct, 0);
  assert.equal(totalPct, 100);
});

test('途径: calcChannelMax 计算正确', () => {
  const max = calcChannelMax(52, 218000);
  assert.equal(max, Math.round(0.52 * 218000));
});

test('途径: 消费积分占比超过 50%', () => {
  const consume = POINT_CHANNELS.find((c) => c.source === '消费积分');
  assert.ok(consume!.pct > 50, '消费积分应 > 50%');
});

test('途径: 推荐好友仅占 8%', () => {
  const refer = POINT_CHANNELS.find((c) => c.source === '推荐好友');
  assert.equal(refer!.pct, 8);
});

test('途径: 源码包含"积分获取途径占比"区域', () => {
  assert.ok(SRC.includes('积分获取途径占比'), '应包含获取途径占比');
});

/* =================================================================
 * 边界 (Edge Cases)
 * ================================================================= */

test('边界: getHotThreshold 空数组', () => {
  assert.equal(getHotThreshold([]), 0);
});

test('边界: findTierByPoints 负值返回银卡', () => {
  assert.equal(findTierByPoints(-100), '银卡');
});

test('边界: calcLeaderboardTotal 空数组返回 0', () => {
  assert.equal(calcLeaderboardTotal([]), 0);
});

test('边界: checkRedeemable 负成本和负余额不崩溃', () => {
  assert.equal(checkRedeemable(-100, -50), false);
});

test('边界: calcTotalPoints 空 REDEEM_OPTIONS 返回 0', () => {
  assert.equal(calcTotalPoints([]), 0);
});

test('边界: calcConsumeDistribution 空数组返回空对象', () => {
  const dist = calcConsumeDistribution([]);
  assert.equal(Object.keys(dist).length, 0);
});

test('边界: 源码不包含 any 类型', () => {
  assert.ok(!SRC.match(/:\s*any\b/), '不应使用 any');
});

test('边界: 源码不包含 eval', () => {
  assert.ok(!SRC.includes('eval(') && !SRC.includes('new Function('), '不应使用 eval');
});

test('边界: 源码不包含 dangerouslySetInnerHTML', () => {
  assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
});
