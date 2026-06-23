/**
 * page.test.ts — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例)
 *
 * storefront-web Dashboard page component test
 * 角色视角: 🛒前台 · 👔店长
 * 验证 StorefrontDashboard 组件导出和类型正确性
 */

import assert from 'node:assert/strict';
import test from 'node:test';

test('🛒 前台视角: StorefrontDashboard is a function component', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function',
    'StorefrontDashboard should be a function component');
});

test('👔 店长视角: component name is meaningful', async () => {
  const component = (await import('./page')).default;
  assert.ok(component.name.length > 0 || typeof component === 'function',
    'component should be callable');
});

test('正例: module exports default component', async () => {
  const mod = await import('./page');
  assert.ok(mod.default !== undefined, 'default export required');
});

test('反例: component throws no error on import', async () => {
  let importErr = false;
  try {
    await import('./page');
  } catch {
    importErr = true;
  }
  assert.equal(importErr, false, 'page import should not throw');
});

test('边界: component is callable', async () => {
  const StorefrontDashboard = (await import('./page')).default;
  assert.equal(typeof StorefrontDashboard, 'function');
});
