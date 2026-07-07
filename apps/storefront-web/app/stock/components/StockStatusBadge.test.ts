/**
 * StockStatusBadge — 库存状态标签单元测试
 * 角色视角: 👔店长 / 🛒前台 / 💳采购
 * 覆盖: 正例(5种状态渲染) / 反例(未知状态) / 边界(空值)
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

/* ── 反例 ── */

test('反例: 未知状态应返回 fallback', () => {
  const unknownStatus = 'unknown_status' as keyof typeof STOCK_STATUS_LABEL;
  assert.equal(STOCK_STATUS_LABEL[unknownStatus], undefined);
});

/* ── 边界 ── */

test('边界: 所有标签长度合理', () => {
  const labels = Object.values(STOCK_STATUS_LABEL);
  for (const label of labels) {
    assert.ok(label.length >= 2, `label "${label}" should be at least 2 chars`);
    assert.ok(label.length <= 6, `label "${label}" should be at most 6 chars`);
  }
});
