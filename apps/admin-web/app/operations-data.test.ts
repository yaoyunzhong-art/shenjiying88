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

// ===================== 边界 =====================

test('边界: route strings within max lengths', () => {
  ['href', 'detailHrefBase', 'backHref', 'title'] as const satisfies (keyof typeof adminRuntimeOperationsRoute)[];
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
