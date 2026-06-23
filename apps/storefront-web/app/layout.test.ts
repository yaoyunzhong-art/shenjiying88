/**
 * layout.test.ts — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * storefront-web layout — 元数据和布局配置验证
 * 角色视角: 🛒前台 · 🎯运行专员
 */

import assert from 'node:assert/strict';
import test from 'node:test';

test('🛒 前台视角: layout metadata title contains Shenjiying', async () => {
  const { metadata } = await import('./layout');
  assert.ok((metadata as Record<string, unknown>).title, 'title should exist');
  const title = (metadata as { title?: string | null }).title;
  assert.ok(title, 'title should be defined');
  assert.ok(title.includes('Shenjiying') || title.includes('Storefront'));
});

test('🎯 运行专员视角: layout metadata description is set', async () => {
  const { metadata } = await import('./layout');
  const desc = (metadata as { description?: string }).description;
  assert.ok(desc, 'description should be defined');
  assert.ok(desc.length > 0, 'description should not be empty');
});

test('正例: RootLayout is a function component', async () => {
  const mod = await import('./layout');
  assert.equal(typeof mod.default, 'function', 'RootLayout should be a function');
});

test('反例: metadata title is not empty', async () => {
  const { metadata } = await import('./layout');
  const title = (metadata as { title?: string }).title;
  assert.ok(title, 'title should be defined');
  assert.ok(title.length > 0);
  assert.notEqual(title, '');
});

test('边界: metadata description is reasonable length', async () => {
  const { metadata } = await import('./layout');
  const desc = (metadata as { description?: string }).description;
  assert.ok(desc, 'description should be defined');
  assert.ok(desc.length < 256, 'description too long');
  assert.ok(desc.length > 5, 'description too short');
});
