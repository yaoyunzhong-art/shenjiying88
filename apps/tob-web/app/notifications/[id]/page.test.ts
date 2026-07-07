/**
 * notifications/[id]/page.test.ts — B2B 通知详情冒烟测试
 * 角色视角: 🔧运营商 / 👔店长
 */

import assert from 'node:assert/strict';
import test from 'node:test';

test('🔧 运营商视角: NotificationDetailPage has default export', async () => {
  const mod = await import('./page');
  assert.ok('default' in mod, 'should have default export');
});

test('👔 店长视角: default export is defined', async () => {
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

test('边界: default is callable (React function component)', async () => {
  const mod = await import('./page');
  const Component = mod.default;
  assert.ok(typeof Component === 'function' || (typeof Component === 'object' && Component !== null),
    'default export should be a function or object (client component)');
});
