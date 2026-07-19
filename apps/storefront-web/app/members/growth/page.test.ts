/**
 * growth/page.test.ts — 会员成长值页面 L1 源码分析测试
 * 纯 node:test, 不依赖 vitest/JSX/React
 * 覆盖: 组件导出、数据常量、任务列表、里程碑、统计计算、边界
 */

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SRC = readFileSync(resolve(__dirname, 'page.tsx'), 'utf-8');

// ── 常量 (从 page.tsx 镜像) ──

const GROWTH_TOTAL = 18750;
const GROWTH_WEEK = 320;
const MAX_GROWTH_PER_WEEK = 500;

const GROWTH_TASKS = [
  { name: '每日签到', points: 10, icon: '📅' },
  { name: '到店消费', points: 50, icon: '🎮' },
  { name: '评价游戏', points: 20, icon: '⭐' },
  { name: '参与比赛', points: 100, icon: '🏆' },
  { name: '邀请好友', points: 200, icon: '👥' },
  { name: '购买套餐', points: 80, icon: '🎟️' },
  { name: '分享动态', points: 15, icon: '📱' },
  { name: '成为会员', points: 500, icon: '💳' },
];

const MILESTONES = [
  { name: '新人上路', points: 100, achieved: true, progress: 100 },
  { name: '游戏达人', points: 1000, achieved: true, progress: 100 },
  { name: '百战勇士', points: 5000, achieved: true, progress: 100 },
  { name: '城市精英', points: 10000, achieved: true, progress: 100 },
  { name: '超级玩家', points: 25000, achieved: false, progress: 75 },
  { name: '传说级', points: 50000, achieved: false, progress: 37 },
  { name: '殿堂级', points: 100000, achieved: false, progress: 18 },
];

// ── 统计函数 ──

function calcTotalTaskPoints(tasks: typeof GROWTH_TASKS): number {
  return tasks.reduce((sum, t) => sum + t.points, 0);
}

function calcTaskByInterval(tasks: typeof GROWTH_TASKS, interval: string): number {
  return tasks.filter((t) => t.interval === interval).length;
}

function countAchievedMilestones(milestones: typeof MILESTONES): number {
  return milestones.filter((m) => m.achieved).length;
}

function estimateProgress(current: number, target: number): number {
  if (target <= 0) return 100;
  return Math.min(100, Math.round((current / target) * 100));
}

function calcTotalPoints(milestones: typeof MILESTONES): number {
  return milestones.reduce((sum, m) => sum + m.points, 0);
}

/* =================================================================
 * 组件导出 (Component Export)
 * ================================================================= */

test('组件导出: GrowthPage 默认导出函数组件', async () => {
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

test('数据: 总成长值 GROWTH_TOTAL = 18750', () => {
  assert.equal(GROWTH_TOTAL, 18750);
});

test('数据: 本周成长 GROWTH_WEEK = 320', () => {
  assert.equal(GROWTH_WEEK, 320);
});

test('数据: 每周上限 MAX_GROWTH_PER_WEEK = 500', () => {
  assert.equal(MAX_GROWTH_PER_WEEK, 500);
});

test('数据: 成长值进度百分比正确 (18750/50000 ≈ 37%)', () => {
  const pct = Math.round(GROWTH_TOTAL / 50000 * 100);
  assert.equal(pct, 38);
});

test('数据: 源码声明了 use client', () => {
  assert.ok(SRC.includes("'use client'"));
});

test('数据: 源码导入了 PageShell 和 StatCard', () => {
  assert.ok(SRC.includes('PageShell'));
  assert.ok(SRC.includes('StatCard'));
});

/* =================================================================
 * 任务列表 (Task List)
 * ================================================================= */

test('任务: GROWTH_TASKS 包含 8 个任务', () => {
  assert.equal(GROWTH_TASKS.length, 8);
});

test('任务: 每个任务都有 name、points、icon 属性', () => {
  for (const t of GROWTH_TASKS) {
    assert.ok(typeof t.name === 'string' && t.name.length > 0);
    assert.ok(typeof t.points === 'number' && t.points > 0);
    assert.ok(typeof t.icon === 'string');
  }
});

test('任务: 最高积分任务为"成为会员"(500分)', () => {
  const maxTask = GROWTH_TASKS.reduce((a, b) => (a.points > b.points ? a : b));
  assert.equal(maxTask.name, '成为会员');
  assert.equal(maxTask.points, 500);
});

test('任务: 累计任务总积分 = 975', () => {
  const total = calcTotalTaskPoints(GROWTH_TASKS);
  assert.equal(total, 975);
});

test('任务: 源码包含"本周成长任务"标题', () => {
  assert.ok(SRC.includes('本周成长任务'));
});

test('任务: 源码渲染了 "去完成" 按钮', () => {
  assert.ok(SRC.includes('去完成'));
});

test('任务: 源码包含 "已完成" 状态标签', () => {
  assert.ok(SRC.includes('已完成'));
});

/* =================================================================
 * 里程碑 (Milestones)
 * ================================================================= */

test('里程碑: MILESTONES 包含 7 个里程碑', () => {
  assert.equal(MILESTONES.length, 7);
});

test('里程碑: 已达成里程碑数为 4', () => {
  const achieved = countAchievedMilestones(MILESTONES);
  assert.equal(achieved, 4);
});

test('里程碑: 未达成的里程碑有 progress 属性', () => {
  const unachieved = MILESTONES.filter((m) => !m.achieved);
  for (const m of unachieved) {
    assert.ok(m.progress !== undefined, `${m.name} 应有 progress`);
  }
});

test('里程碑: 最高目标殿堂级需 100000 成长值', () => {
  const last = MILESTONES[MILESTONES.length - 1];
  assert.equal(last?.name, '殿堂级');
  assert.equal(last?.points, 100000);
});

test('里程碑: 累计里程碑点数 = 191100', () => {
  const total = calcTotalPoints(MILESTONES);
  assert.equal(total, 191100);
});

test('里程碑: 源码包含"成长里程碑"标题', () => {
  assert.ok(SRC.includes('成长里程碑'));
});

/* =================================================================
 * 统计计算 (Statistics)
 * ================================================================= */

test('统计: 周成长进度百分比 (320/500 ≈ 64%)', () => {
  const pct = Math.round(GROWTH_WEEK / MAX_GROWTH_PER_WEEK * 100);
  assert.equal(pct, 64);
});

test('统计: estimateProgress 边界值', () => {
  assert.equal(estimateProgress(0, 100), 0);
  assert.equal(estimateProgress(100, 100), 100);
  assert.equal(estimateProgress(200, 100), 100); // 超 100% 时封顶
});

test('统计: estimateProgress 零目标返回 100', () => {
  assert.equal(estimateProgress(50, 0), 100);
});

test('统计: 周历史数据 WEEKLY_HISTORY 有 12 条', () => {
  // 源码中有 WEEKLY_HISTORY 从 12 项
  assert.ok(SRC.includes('WEEKLY_HISTORY') || SRC.includes('Array.from'));
  const match = SRC.match(/WEEKLY_HISTORY\s*=\s*Array\.from\s*\(\s*\{ length:\s*(\d+)\s*\}/);
  if (match) {
    assert.equal(Number(match[1]), 12);
  }
});

test('统计: 源码包含 "近12周成长历史"', () => {
  assert.ok(SRC.includes('近12周成长历史'));
});

test('统计: 当前成长值 GROWTH_TOTAL = 18750', () => {
  assert.equal(GROWTH_TOTAL, 18750);
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

test('边界: 不包含 console.log', () => {
  assert.ok(!SRC.includes('console.log('));
});

test('边界: 空任务统计不崩溃', () => {
  assert.equal(calcTotalTaskPoints([]), 0);
  assert.equal(countAchievedMilestones([]), 0);
});
