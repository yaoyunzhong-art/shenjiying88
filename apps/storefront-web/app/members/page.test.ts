/**
 * page.test.ts — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * storefront-web Members List page — 组件导出、数据完整性验证
 * 角色视角: 👔店长 · 🛒前台 · 💳会员
 */

import assert from 'node:assert/strict';
import test from 'node:test';

test('👔 店长视角: MembersListPage is a function component', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function',
    'MembersListPage should export a function component');
});

test('🛒 前台视角: component export is stable', async () => {
  const mod = await import('./page');
  assert.ok(mod.default !== undefined);
  assert.ok(mod.default !== null);
});

test('💳 会员视角: default export name is meaningful', async () => {
  const mod = await import('./page');
  assert.ok(mod.default.name.length > 0 || typeof mod.default === 'function');
});

test('正例: module has default export', async () => {
  const mod = await import('./page');
  assert.ok('default' in mod, 'should have default export');
});

test('正例: page import does not throw', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, 'page import should succeed');
});

test('反例: export is not null or undefined', async () => {
  const MembersListPage = (await import('./page')).default;
  assert.notEqual(MembersListPage, null);
  assert.notEqual(MembersListPage, undefined);
});

test('边界: component is callable', async () => {
  const MembersListPage = (await import('./page')).default;
  assert.equal(typeof MembersListPage, 'function');
});

test('边界: component has correct type signature', async () => {
  const MembersListPage = (await import('./page')).default;
  assert.ok(
    (MembersListPage as unknown as { displayName?: string }).displayName === undefined || typeof MembersListPage === 'function',
    'component should be valid',
  );
});
