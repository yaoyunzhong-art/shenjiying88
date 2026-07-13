/**
 * operations-data.test.ts — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 角色视角: 🔧安监 · 🎯运行专员 · 👔店长
 * 测试运行时操作路由配置和预置数据
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  adminRuntimeOperationsRoute,
  adminRuntimeOperationsPreset,
  adminRuntimeOperationDetails,
} from './operations-data';

// ===================== 正例 =====================

test('🔧 安监视角: operations route configuration is complete', () => {
  const route = adminRuntimeOperationsRoute;

  assert.ok(route.href.startsWith('/'));
  assert.equal(route.href, '/operations');
  assert.equal(route.detailHrefBase, '/operations');
  assert.equal(route.backHref, '/operations');

  assert.ok(route.title.includes('操作'));
  assert.ok(route.description.length > 0);
  assert.equal(typeof route.emptyMessage, 'function');
});

test('🎯 运行专员视角: operations route builds detail links', () => {
  const route = adminRuntimeOperationsRoute;

  assert.equal(route.detailHrefBase + '/OP-001', '/operations/OP-001');
  assert.equal(route.backHref, '/operations');
});

test('👔 店长视角: preset and detail presets are defined', () => {
  assert.ok(adminRuntimeOperationsPreset !== undefined);
  assert.ok(adminRuntimeOperationDetails !== undefined);
  assert.equal(typeof adminRuntimeOperationsPreset, 'object');
  assert.equal(typeof adminRuntimeOperationDetails, 'object');
});

// ===================== 反例 =====================

test('反例: emptyMessage with non-existent operationId', () => {
  const msg = adminRuntimeOperationsRoute.emptyMessage('NONEXIST-999');
  assert.ok(msg.includes('NONEXIST-999'));
  assert.ok(msg.includes('不存在'));
});

test('反例: emptyMessage should handle empty string', () => {
  const msg = adminRuntimeOperationsRoute.emptyMessage('');
  assert.ok(typeof msg === 'string');
});

test('反例: route title should not be empty', () => {
  assert.ok(adminRuntimeOperationsRoute.title.length > 0);
});

test('反例: route href must not contain protocol', () => {
  assert.ok(!adminRuntimeOperationsRoute.href.startsWith('http'));
  assert.ok(!adminRuntimeOperationsRoute.href.startsWith('//'));
});

test('反例: emptyMessage with operationId containing special characters', () => {
  const msg = adminRuntimeOperationsRoute.emptyMessage('<script>alert(1)</script>');
  assert.ok(typeof msg === 'string');
  assert.ok(msg.includes('<script>'));
});

// ===================== 边界 =====================

test('边界: route strings within max lengths', () => {
  for (const key of ['href', 'detailHrefBase', 'backHref', 'title'] as const) {
    const val = adminRuntimeOperationsRoute[key] as string;
    assert.ok(val.length <= 256, `${key} too long: ${val.length}`);
    assert.ok(val.length > 0, `${key} is empty`);
  }
});

test('边界: preset object has expected keys', () => {
  const keys = Object.keys(adminRuntimeOperationsPreset);
  assert.ok(keys.length > 0, 'preset should not be empty');
});

test('边界: admin preset and detail presets are distinct references', () => {
  assert.notEqual(adminRuntimeOperationsPreset, adminRuntimeOperationDetails);
});

test('边界: route href path must be absolute', () => {
  assert.ok(adminRuntimeOperationsRoute.href.startsWith('/'), '路径应以 / 开头');
  assert.ok(adminRuntimeOperationsRoute.backHref.startsWith('/'), '返回路径应以 / 开头');
});

test('边界: route description is not excessively long', () => {
  assert.ok(adminRuntimeOperationsRoute.description.length <= 500, '描述不应超过 500 字符');
  assert.ok(adminRuntimeOperationsRoute.description.length >= 5, '描述不应少于 5 字符');
});

test('边界: route object has no extra unexpected keys', () => {
  const allowed = ['href', 'detailHrefBase', 'backHref', 'title', 'description', 'emptyTitle', 'emptyMessage'];
  const keys = Object.keys(adminRuntimeOperationsRoute) as Array<keyof typeof adminRuntimeOperationsRoute>;
  for (const key of keys) {
    assert.ok(allowed.includes(key),
      `不允许意外键: ${key}`);
  }
});

test('边界: preset values are not null or undefined', () => {
  const preset = adminRuntimeOperationsPreset;
  assert.notEqual(preset, null);
  assert.notEqual(preset, undefined);
  const detail = adminRuntimeOperationDetails;
  assert.notEqual(detail, null);
  assert.notEqual(detail, undefined);
});
