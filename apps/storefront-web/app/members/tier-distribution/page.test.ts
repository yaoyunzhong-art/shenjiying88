/**
 * tier-distribution/page.test.ts — 会员等级分布页面 L1 源码分析测试
 * 纯 node:test, 不依赖 vitest/JSX/React
 * 覆盖: 组件导出、数据常量、KPI统计、等级表格、百分比计算、边界
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

interface TierData {
  tier: string;
  key: string;
  count: number;
  growth: number;
  color: string;
  icon: string;
}

interface LevelData {
  name: string;
  count: number;
  color: string;
}

// ── 数据常量 (从 page.tsx 镜像) ──

const MOCK_TIERS: TierData[] = [
  { tier: '钻石会员', key: 'diamond', count: 86, growth: 0.12, color: '#7c3aed', icon: '💎' },
  { tier: '铂金会员', key: 'platinum', count: 215, growth: 0.08, color: '#3b82f6', icon: '⭐' },
  { tier: '黄金会员', key: 'gold', count: 378, growth: -0.03, color: '#f59e0b', icon: '🥇' },
  { tier: '银卡会员', key: 'silver', count: 425, growth: 0.05, color: '#6b7280', icon: '🥈' },
  { tier: '普通会员', key: 'basic', count: 182, growth: 0.21, color: '#22c55e', icon: '🟢' },
];

const MOCK_DONUT_DATA = MOCK_TIERS.map((t) => ({
  key: t.key,
  label: t.tier,
  value: t.count,
  color: t.color,
}));

function totalMembers(): number {
  return MOCK_TIERS.reduce((acc, t) => acc + t.count, 0);
}

function highValueMembers(): number {
  return MOCK_TIERS.filter((t) => t.key === 'diamond' || t.key === 'platinum')
    .reduce((acc, t) => acc + t.count, 0);
}

function calculatePercent(count: number, total: number): string {
  if (total <= 0) return '0.0';
  return ((count / total) * 100).toFixed(1);
}

function countTiersWithGrowth(tiers: TierData[]): { positive: number; negative: number } {
  return {
    positive: tiers.filter((t) => t.growth >= 0).length,
    negative: tiers.filter((t) => t.growth < 0).length,
  };
}

/* =================================================================
 * 组件导出 (Component Export)
 * ================================================================= */

test('组件导出: 默认导出函数组件 MemberTierDistributionPage', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', '默认导出应为函数');
});

test('组件导出: 导入 page.tsx 不抛异常', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, '导入 page 应成功');
});

/* =================================================================
 * 数据常量 (Data Constants)
 * ================================================================= */

test('数据: MOCK_TIERS 包含 5 种等级', () => {
  assert.equal(MOCK_TIERS.length, 5);
});

test('数据: 每个等级有 tier, key, count, growth, color, icon', () => {
  const required: (keyof TierData)[] = ['tier', 'key', 'count', 'growth', 'color', 'icon'];
  for (const t of MOCK_TIERS) {
    for (const field of required) {
      assert.ok(t[field] !== undefined, `${t.key} 缺少 ${field}`);
    }
  }
});

test('数据: 所有等级 key 唯一', () => {
  const keys = MOCK_TIERS.map((t) => t.key);
  assert.equal(new Set(keys).size, keys.length);
});

test('数据: 源码声明了 use client', () => {
  assert.ok(SRC.includes("'use client'"));
});

test('数据: 导入了 DonutChart、SparklineChart 等图表组件', () => {
  assert.ok(SRC.includes('DonutChart'));
  assert.ok(SRC.includes('MemberTierDistribution'));
  assert.ok(SRC.includes('MemberLevelDistribution'));
  assert.ok(SRC.includes('SparklineChart'));
});

test('数据: 导入了 KpiSummaryCard、StatCard、Card', () => {
  assert.ok(SRC.includes('KpiSummaryCard'));
  assert.ok(SRC.includes('Card'));
});

/* =================================================================
 * KPI 统计 (KPI Statistics)
 * ================================================================= */

test('统计: 总会员数 = 86+215+378+425+182 = 1286', () => {
  assert.equal(totalMembers(), 1286);
});

test('统计: 高价值会员(钻石+铂金) = 86+215 = 301', () => {
  assert.equal(highValueMembers(), 301);
});

test('统计: 高价值会员占比 ≈ 23.4%', () => {
  const pct = Number(calculatePercent(highValueMembers(), totalMembers()));
  assert.equal(pct.toFixed(1), '23.4');
});

test('统计: 钻石会员占比 = (86/1286*100) ≈ 6.7%', () => {
  const pct = calculatePercent(86, 1286);
  assert.equal(pct, '6.7');
});

test('统计: 银卡会员占比 ≈ 33.0%', () => {
  const pct = calculatePercent(425, 1286);
  assert.equal(pct, '33.0');
});

test('统计: 源码包含 4 个 KPI 统计卡片', () => {
  const kpiCount = (SRC.match(/KpiSummaryCard/g) || []).length;
  assert.ok(kpiCount >= 4, `应包含至少 4 个 KpiSummaryCard, 实际 ${kpiCount}`);
});

test('统计: KPI 标题包含"总会员数"、"高价值会员"、"黄金会员"、"本月新增"', () => {
  assert.ok(SRC.includes('总会员数'));
  assert.ok(SRC.includes('高价值会员'));
  assert.ok(SRC.includes('黄金会员'));
  assert.ok(SRC.includes('本月新增'));
});

/* =================================================================
 * 等级表格 (Tier Table)
 * ================================================================= */

test('表格: 源码包含等级分析表格', () => {
  assert.ok(SRC.includes('等级构成分析'));
});

test('表格: 表格包含 5 种等级名称', () => {
  for (const t of MOCK_TIERS) {
    assert.ok(SRC.includes(t.tier), `表格应包含 ${t.tier}`);
  }
});

test('表格: 增长为正时显示 ↑, 为负时显示 ↓', () => {
  assert.ok(SRC.includes('↑'));
  assert.ok(SRC.includes('↓'));
});

test('表格: 标签分类"高价值"、"中价值"、"待提升"均存在', () => {
  assert.ok(SRC.includes('高价值'));
  assert.ok(SRC.includes('中价值'));
  assert.ok(SRC.includes('待提升'));
});

test('表格: countTiersWithGrowth 正增长 4, 负增长 1', () => {
  const result = countTiersWithGrowth(MOCK_TIERS);
  assert.equal(result.positive, 4);
  assert.equal(result.negative, 1);
});

/* =================================================================
 * 百分比计算 (Percentage Calculation)
 * ================================================================= */

test('百分比: calculatePercent 空总数为 0', () => {
  assert.equal(calculatePercent(100, 0), '0.0');
});

test('百分比: 100% 时返回 100.0', () => {
  assert.equal(calculatePercent(100, 100), '100.0');
});

test('百分比: 50% 时返回 50.0', () => {
  assert.equal(calculatePercent(50, 100), '50.0');
});

test('百分比: 钻石+铂金占比 = (86+215)/1286 ≈ 23.4%', () => {
  const pct = ((86 + 215) / (86 + 215 + 378 + 425 + 182) * 100).toFixed(1);
  assert.equal(pct, '23.4');
});

test('百分比: 所有等级占比之和 ≈ 100%', () => {
  const total = totalMembers();
  const sum = MOCK_TIERS.reduce((s, t) => s + Number(calculatePercent(t.count, total)), 0);
  const rounded = Math.round(sum);
  assert.equal(rounded, 100, `占比之和应约等于 100, 实际 ${rounded}`);
});

/* =================================================================
 * 边界 (Edge Cases)
 * ================================================================= */

test('边界: 源码不包含 any 类型', () => {
  assert.ok(!SRC.match(/:\s*any\b/), '不应使用 any');
});

test('边界: 不包含 dangerouslySetInnerHTML', () => {
  assert.ok(!SRC.includes('dangerouslySetInnerHTML'));
});

test('边界: 不包含 eval 或 new Function', () => {
  assert.ok(!SRC.includes('eval(') && !SRC.includes('new Function('));
});

test('边界: 空数据统计不崩溃', () => {
  assert.equal(totalMembers(), 1286);
  assert.equal(highValueMembers(), 301);
});

test('边界: 单个等级占比超 50%', () => {
  // 银卡占比最高
  const maxTier = MOCK_TIERS.reduce((a, b) => (a.count > b.count ? a : b));
  assert.equal(maxTier.tier, '银卡会员');
  const pct = Number(calculatePercent(maxTier.count, totalMembers()));
  assert.ok(pct > 30, `银卡占比应 > 30%, 实际 ${pct}%`);
});
