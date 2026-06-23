/**
 * page.test.ts — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例)
 *
 * tob-web Dashboard page — 组件导出验证
 * 角色视角: 👔店长 · 🔧安监
 */

import assert from 'node:assert/strict';
import test from 'node:test';

test('👔 店长视角: DashboardPage is a valid React component', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function',
    'DashboardPage should export a function component');
});

test('🔧 安监视角: component export is stable', async () => {
  const mod = await import('./page');
  assert.ok(mod.default !== undefined);
  assert.ok(mod.default !== null);
});

test('正例: module has default export', async () => {
  const mod = await import('./page');
  assert.ok('default' in mod, 'should have default export');
});

test('反例: page import should not throw', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, 'page import should succeed');
});

test('边界: component function name is defined', async () => {
  const DashboardPage = (await import('./page')).default;
  assert.ok(typeof DashboardPage === 'function');
});
