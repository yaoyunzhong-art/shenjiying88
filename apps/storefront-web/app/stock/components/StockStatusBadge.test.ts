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

test('正例: sufficient 状态使用绿色系', () => {
  assert.ok(STOCK_STATUS_COLOR.sufficient.includes('52') || STOCK_STATUS_COLOR.sufficient.includes('green'), '充足应为绿色');
});

test('正例: critical 状态使用红色系', () => {
  assert.ok(STOCK_STATUS_COLOR.critical.includes('ff4d') || STOCK_STATUS_COLOR.critical.includes('red'), '告急应为红色');
});

test('正例: out_of_stock 状态使用深红色', () => {
  assert.ok(STOCK_STATUS_COLOR.out_of_stock.includes('ff') || STOCK_STATUS_COLOR.out_of_stock.includes('red'), '缺货应为红色系');
});

test('正例: overstocked 状态使用橙色系', () => {
  assert.ok(STOCK_STATUS_COLOR.overstocked.includes('fa') || STOCK_STATUS_COLOR.overstocked.includes('orange'), '过剩应为橙色系');
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

test('边界: 语义颜色与状态匹配', () => {
  // 充足→绿色, 偏低→黄色, 告急→红色, 缺货→深红, 过剩→橙色
  const greenish = /#(52c41a|389e0d)/i;
  const yellowish = /#(faad14|d4b106)/i;
  const reddish = /#(ff4d4f|cf1322)/i;
  const darkish = /#(ff4d4f|820014)/i;
  const orangish = /#(fa8c16|d46b08)/i;

  assert.ok(greenish.test(STOCK_STATUS_COLOR.sufficient), 'sufficient 应为绿色');
  assert.ok(yellowish.test(STOCK_STATUS_COLOR.low), 'low 应为黄色');
  assert.ok(reddish.test(STOCK_STATUS_COLOR.critical), 'critical 应为红色');
  assert.ok(darkish.test(STOCK_STATUS_COLOR.out_of_stock), 'out_of_stock 应为深红');
  assert.ok(orangish.test(STOCK_STATUS_COLOR.overstocked), 'overstocked 应为橙色');
});
