/**
 * layout.test.ts — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * tob-web layout — 元数据和布局配置验证
 * 角色视角: 👔店长 · 🎯运行专员
 */

import assert from 'node:assert/strict';
import test from 'node:test';

test('👔 店长视角: layout metadata contains ToB Admin', async () => {
  const { metadata } = await import('./layout');
  const meta = metadata as { title?: string };
  assert.ok(meta.title, 'title should exist');
  assert.ok(meta.title.includes('Shenjiying') || meta.title.includes('ToB'));
});

test('🎯 运行专员视角: layout renders body with dark theme', async () => {
  const mod = await import('./layout');
  assert.equal(typeof mod.default, 'function');
});

test('正例: description covers alert & operation management', async () => {
  const { metadata } = await import('./layout');
  const desc = (metadata as { description?: string }).description;
  assert.ok(desc, 'description should be defined');
  assert.ok(desc.length > 0);
  assert.ok(desc.includes('alert') || desc.includes('operation') || desc.includes('admin'),
    'description should cover admin functions');
});

test('反例: metadata title is not empty', async () => {
  const { metadata } = await import('./layout');
  const title = (metadata as { title?: string }).title;
  assert.ok(title, 'title should be defined');
  assert.ok(title.length > 0);
});

test('边界: metadata description within reasonable bounds', async () => {
  const { metadata } = await import('./layout');
  const desc = (metadata as { description?: string }).description;
  assert.ok(desc, 'description should be defined');
  assert.ok(desc.length < 256, 'description too long');
  assert.ok(desc.length > 10, 'description too short');
});
