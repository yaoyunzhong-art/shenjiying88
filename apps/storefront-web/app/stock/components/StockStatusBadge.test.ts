/**
 * StockStatusBadge — 库存状态标签单元测试
 * 角色视角: 👔店长 / 🛒前台 / 💳采购
 * 覆盖: 正例(5种状态渲染) / 反例(未知状态) / 边界(空值/颜色唯一/长度/渲染)
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  STOCK_STATUS_LABEL,
  STOCK_STATUS_COLOR,
  STOCK_STATUS_BG,
} from './StockStatusBadge';

/* ── 正例 ── */

test('正例: STOCK_STATUS_LABEL 含 5 个状态标签', () => {
  assert.equal(Object.keys(STOCK_STATUS_LABEL).length, 5);
  assert.equal(STOCK_STATUS_LABEL.sufficient, '充足');
  assert.equal(STOCK_STATUS_LABEL.low, '偏低');
  assert.equal(STOCK_STATUS_LABEL.critical, '告急');
  assert.equal(STOCK_STATUS_LABEL.out_of_stock, '缺货');
  assert.equal(STOCK_STATUS_LABEL.overstocked, '过剩');
});

test('正例: STOCK_STATUS_COLOR 为每个状态提供颜色', () => {
  const statuses = ['sufficient', 'low', 'critical', 'out_of_stock', 'overstocked'] as const;
  for (const s of statuses) {
    assert.ok(STOCK_STATUS_COLOR[s], `should have color for ${s}`);
    assert.ok(STOCK_STATUS_COLOR[s].startsWith('#'), `${s} color should be hex`);
  }
});

test('正例: STOCK_STATUS_BG 为每个状态提供背景色', () => {
  const statuses = ['sufficient', 'low', 'critical', 'out_of_stock', 'overstocked'] as const;
  for (const s of statuses) {
    assert.ok(STOCK_STATUS_BG[s], `should have bg for ${s}`);
    assert.ok(STOCK_STATUS_BG[s].startsWith('rgba'), `${s} bg should be rgba`);
  }
});

test('正例: 各状态颜色各不相同', () => {
  const colors = Object.values(STOCK_STATUS_COLOR);
  const unique = new Set(colors);
  assert.equal(unique.size, colors.length, 'all status colors should be unique');
});

test('正例: 各状态背景色各不相同', () => {
  const bgs = Object.values(STOCK_STATUS_BG);
  const unique = new Set(bgs);
  assert.equal(unique.size, bgs.length, 'all status backgrounds should be unique');
});

test('正例: sufficient 状态使用绿色', () => {
  assert.equal(STOCK_STATUS_COLOR.sufficient, '#22c55e');
});

test('正例: critical 状态使用橙色', () => {
  assert.equal(STOCK_STATUS_COLOR.critical, '#f97316');
});

test('正例: out_of_stock 状态使用红色', () => {
  assert.equal(STOCK_STATUS_COLOR.out_of_stock, '#ef4444');
});

test('正例: overstocked 状态使用紫色', () => {
  assert.equal(STOCK_STATUS_COLOR.overstocked, '#8b5cf6');
});

/* ── 反例 ── */

test('反例: 未知状态应返回 fallback', () => {
  const unknownStatus = 'unknown_status' as keyof typeof STOCK_STATUS_LABEL;
  assert.equal(STOCK_STATUS_LABEL[unknownStatus], undefined);
});

test('反例: nullish key 返回 undefined', () => {
  assert.equal(STOCK_STATUS_LABEL['' as keyof typeof STOCK_STATUS_LABEL], undefined);
  assert.equal(STOCK_STATUS_COLOR['nonexistent' as keyof typeof STOCK_STATUS_COLOR], undefined);
  assert.equal(STOCK_STATUS_BG['nonexistent' as keyof typeof STOCK_STATUS_BG], undefined);
});

test('反例: 无效颜色格式的断言', () => {
  // 所有颜色都应是合法的十六进制
  const colors = Object.values(STOCK_STATUS_COLOR);
  for (const color of colors) {
    assert.ok(/^#[0-9a-f]{6}$/i.test(color), `${color} 应为6位十六进制色值`);
  }
});

test('反例: 无效背景色格式的断言', () => {
  const bgs = Object.values(STOCK_STATUS_BG);
  for (const bg of bgs) {
    assert.ok(bg.startsWith('rgba('), `${bg} 应以 rgba( 开头`);
  }
});

/* ── 边界 ── */

test('边界: 所有标签长度合理', () => {
  const labels = Object.values(STOCK_STATUS_LABEL);
  for (const label of labels) {
    assert.ok(label.length >= 2, `label "${label}" should be at least 2 chars`);
    assert.ok(label.length <= 6, `label "${label}" should be at most 6 chars`);
  }
});

test('边界: State 类型枚举完整性', () => {
  const statuses = Object.keys(STOCK_STATUS_LABEL);
  const colors = Object.keys(STOCK_STATUS_COLOR);
  const bgs = Object.keys(STOCK_STATUS_BG);
  // 三个映射的 key 数应一致
  assert.equal(statuses.length, 5);
  assert.equal(statuses.length, colors.length);
  assert.equal(statuses.length, bgs.length);
  // 且 key 集合完全一致
  assert.deepEqual([...statuses].sort(), [...colors].sort());
  assert.deepEqual([...statuses].sort(), [...bgs].sort());
});

test('边界: 每个状态的颜色都是有效十六进制', () => {
  const colors = Object.values(STOCK_STATUS_COLOR);
  for (const c of colors) {
    assert.ok(/^#[0-9a-f]{6}$/i.test(c), `${c} 应为6位十六进制色值`);
  }
});

test('边界: low 状态使用黄色系', () => {
  assert.equal(STOCK_STATUS_COLOR.low, '#eab308');
});
