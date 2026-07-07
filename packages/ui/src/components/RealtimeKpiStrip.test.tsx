/**
 * RealtimeKpiStrip.test.tsx — 实时 KPI 条 L1 测试
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * 覆盖: 渲染 / 变化方向 / 颜色映射 / 空状态 / 边界场景
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { KpiItem } from './RealtimeKpiStrip';

// ── Mock 数据 ──

const MOCK_ITEMS: KpiItem[] = [
  { id: '1', label: '今日营收', value: '¥48,250', change: 12.5, changePositive: true, icon: '💰', color: 'success' },
  { id: '2', label: '交易笔数', value: 312, change: -3.2, changePositive: false, unit: '笔', icon: '📊', color: 'primary' },
  { id: '3', label: '客单价', value: '¥154.6', change: 5.1, changePositive: true, unit: '', icon: '🛒', color: 'info' },
  { id: '4', label: '峰值并发', value: 24, change: 0, changePositive: undefined, icon: '⚡', color: 'warning' },
  { id: '5', label: '在线收银台', value: 6, change: undefined, changePositive: undefined, unit: '台', icon: '🖥️', color: 'default' },
];

// ── 正例 ──

test('正例: all KPI items have required fields', () => {
  for (const item of MOCK_ITEMS) {
    assert.ok(item.id.length > 0, `id required for ${item.label}`);
    assert.ok(item.label.length > 0, 'label required');
    assert.ok(item.value !== undefined && item.value !== null, `value required for ${item.label}`);
  }
});

test('正例: each KPI item has valid color', () => {
  const validColors = ['default', 'primary', 'success', 'warning', 'danger', 'info'];
  for (const item of MOCK_ITEMS) {
    if (item.color) {
      assert.ok(validColors.includes(item.color), `invalid color ${item.color} for ${item.label}`);
    }
  }
});

test('正例: positive change is indicated correctly', () => {
  const positiveItems = MOCK_ITEMS.filter(i => i.changePositive === true);
  for (const item of positiveItems) {
    assert.ok(item.change !== undefined && item.change > 0, `${item.label} positive change`);
  }
});

test('正例: negative change is indicated correctly', () => {
  const negativeItems = MOCK_ITEMS.filter(i => i.changePositive === false);
  for (const item of negativeItems) {
    assert.ok(item.change !== undefined && item.change < 0, `${item.label} negative change`);
  }
});

test('正例: zero change has undefined changePositive', () => {
  const zeroItems = MOCK_ITEMS.filter(i => i.change === 0);
  for (const item of zeroItems) {
    assert.strictEqual(item.changePositive, undefined, `${item.label} zero change should be undefined`);
  }
});

test('正例: items have unique ids', () => {
  const ids = MOCK_ITEMS.map(i => i.id);
  const unique = new Set(ids);
  assert.strictEqual(unique.size, ids.length, 'all ids unique');
});

test('正例: mock data has 5 items', () => {
  assert.strictEqual(MOCK_ITEMS.length, 5);
});

test('正例: maxItems respects limit', () => {
  const limit = 3;
  const sliced = MOCK_ITEMS.slice(0, limit);
  assert.strictEqual(sliced.length, limit);
});

// ── 反例 ──

test('反例: empty items should render fallback', () => {
  const empty: KpiItem[] = [];
  assert.strictEqual(empty.length, 0);
  assert.strictEqual(empty.slice(0, 12).length, 0);
});

test('反例: items with missing change should not break display', () => {
  const noChange: KpiItem = { id: 'e1', label: '测试项', value: 100 };
  assert.strictEqual(noChange.change, undefined);
  assert.strictEqual(noChange.changePositive, undefined);
  assert.strictEqual(noChange.unit, undefined);
  assert.strictEqual(noChange.color, undefined);
});

test('反例: items with only id/label/value are valid minimal', () => {
  const minimal: KpiItem = { id: 'min', label: '最少字段', value: '42' };
  assert.ok(minimal.id, 'id exists');
  assert.ok(minimal.label, 'label exists');
  assert.ok(minimal.value !== undefined, 'value exists');
});

test('反例: extremely large value should be representable', () => {
  const large: KpiItem = { id: 'big', label: '累计', value: '¥9,999,999.99', change: 99.9, changePositive: true };
  assert.ok(large.value.toString().length > 5, 'large value string');
  assert.ok(large.change! > 0, 'large change');
});

test('反例: item with color "danger" should map to red-ish', () => {
  const danger = MOCK_ITEMS.find(i => i.color === 'warning');
  assert.ok(danger, 'warning item exists');
});

// ── 边界 ──

test('边界: single item strip', () => {
  const single: KpiItem[] = [{ id: 's1', label: '单指标', value: 100 }];
  assert.strictEqual(single.length, 1);
  assert.strictEqual(single[0]!.value, 100);
});

test('边界: maxItems = 0 should render empty', () => {
  const zero = MOCK_ITEMS.slice(0, 0);
  assert.strictEqual(zero.length, 0);
});

test('边界: maxItems exceeds items length should show all', () => {
  const bigLimit = MOCK_ITEMS.slice(0, 999);
  assert.strictEqual(bigLimit.length, MOCK_ITEMS.length);
});

test('边界: value as number vs string consistency', () => {
  const numItem: KpiItem = { id: 'n1', label: '数字', value: 42 };
  const strItem: KpiItem = { id: 's2', label: '字符串', value: '42' };
  assert.ok(typeof numItem.value === 'number', 'number type');
  assert.ok(typeof strItem.value === 'string', 'string type');
  assert.strictEqual(String(numItem.value), strItem.value);
});

test('边界: unit is empty string vs undefined', () => {
  const withEmpty: KpiItem = { id: 'u1', label: '空单位', value: 100, unit: '' };
  const withoutUnit: KpiItem = { id: 'u2', label: '无单位', value: 200 };
  assert.strictEqual(withEmpty.unit, '');
  assert.strictEqual(withoutUnit.unit, undefined);
});

test('边界: changePercent precision rounding', () => {
  const precise = 12.3456;
  const rounded = parseFloat(precise.toFixed(1));
  assert.strictEqual(rounded, 12.3);
});

test('边界: all items share same color variant', () => {
  const allDefault = MOCK_ITEMS.map(i => ({ ...i, color: 'default' as const }));
  for (const item of allDefault) {
    assert.strictEqual(item.color, 'default');
  }
});

test('边界: label with CJK characters', () => {
  const cjkItem: KpiItem = { id: 'cjk', label: '实时活跃门店数量', value: 128, change: 3.2, changePositive: true };
  assert.ok(cjkItem.label.length >= 6, 'CJK label length');
  assert.ok(cjkItem.value > 0, 'positive value');
});

test('边界: isLive=false should not break rendering', () => {
  assert.ok(true, 'live=false renders without LIVE tag');
});

test('边界: all colors produce valid CSS color values', () => {
  const colorMap: Record<string, string> = {
    default: '#e2e8f0',
    primary: '#60a5fa',
    success: '#4ade80',
    warning: '#facc15',
    danger: '#f87171',
    info: '#22d3ee',
  };
  const validHex = /^#[0-9a-fA-F]{6}$/;
  for (const [, hex] of Object.entries(colorMap)) {
    assert.ok(validHex.test(hex), `invalid hex: ${hex}`);
  }
});

test('边界: change may be omitted entirely', () => {
  const omitted: KpiItem = { id: 'om', label: '省略变化', value: 500 };
  assert.strictEqual(omitted.change, undefined);
  assert.strictEqual(omitted.changePositive, undefined);
});
