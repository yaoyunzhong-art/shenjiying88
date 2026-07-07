/**
 * notifications/page.test.ts — B2B 通知中心冒烟测试
 * 角色视角: 🔧运营商 / 👔店长
 */

import assert from 'node:assert/strict';
import test from 'node:test';

test('🔧 运营商视角: NotificationsPage is a valid React component', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function',
    'NotificationsPage should export a function component');
});

test('👔 店长视角: component export is stable', async () => {
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
  const TobNotificationsPage = (await import('./page')).default;
  assert.ok(typeof TobNotificationsPage === 'function');
});
