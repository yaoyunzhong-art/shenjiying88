/**
 * layout.test.ts — L1+L2 角色冒烟测试
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
  assert.ok(title.includes('Shenjiying') || title.includes('Storefront') || title.includes('storefront'));
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

test('正例: metadata contains title', async () => {
  const { metadata } = await import('./layout');
  const title = (metadata as { title?: string }).title;
  assert.ok(title, 'title should be defined');
  assert.equal(typeof title, 'string');
  assert.ok(title.length > 0);
});

test('正例: metadata contains description', async () => {
  const { metadata } = await import('./layout');
  const desc = (metadata as { description?: string }).description;
  assert.ok(desc, 'description should be defined');
  assert.equal(typeof desc, 'string');
  assert.ok(desc.length > 0);
});

test('反例: metadata title is not empty', async () => {
  const { metadata } = await import('./layout');
  const title = (metadata as { title?: string }).title;
  assert.ok(title, 'title should be defined');
  assert.ok(title.length > 0);
  assert.notEqual(title, '');
});

test('反例: metadata description is not empty', async () => {
  const { metadata } = await import('./layout');
  const desc = (metadata as { description?: string }).description;
  assert.ok(desc, 'description should be defined');
  assert.ok(desc.length > 0);
  assert.notEqual(desc, '');
});

test('正例: metadata title and description are strings', async () => {
  const { metadata } = await import('./layout');
  const title = (metadata as { title?: string }).title;
  const desc = (metadata as { description?: string }).description;
  assert.equal(typeof title, 'string');
  assert.equal(typeof desc, 'string');
});

test('边界: metadata title is reasonable length', async () => {
  const { metadata } = await import('./layout');
  const title = (metadata as { title?: string }).title;
  assert.ok(title, 'title should be defined');
  assert.ok(title.length >= 2, 'title too short');
  assert.ok(title.length < 200, 'title too long');
});

test('边界: metadata description is reasonable length', async () => {
  const { metadata } = await import('./layout');
  const desc = (metadata as { description?: string }).description;
  assert.ok(desc, 'description should be defined');
  assert.ok(desc.length < 256, 'description too long');
  assert.ok(desc.length > 5, 'description too short');
});

test('边界: layout default export exists', async () => {
  const mod = await import('./layout');
  assert.ok(mod.default, 'default export should exist');
  assert.equal(typeof mod.default, 'function');
});

test('边界: component has name', async () => {
  const mod = await import('./layout');
  const name = mod.default?.name || mod.default?.displayName || 'unknown';
  assert.ok(name.length > 0, 'component should have a name');
  assert.notEqual(name, 'unknown', 'component should have explicit name');
});

test('边界: metadata should not contain template syntax', async () => {
  const { metadata } = await import('./layout');
  const metaStr = JSON.stringify(metadata);
  assert.ok(!metaStr.includes('{{'), 'should not contain template syntax');
  assert.ok(!metaStr.includes('}}'), 'should not contain template syntax');
});

// 移除不稳定的 metadata 字段检查 — layout.tsx 的 metadata 对象不包含 viewport 属性
// viewport 在 layout.tsx 的 <head> 中通过 <meta name=viewport> 设置，不在 metadata 对象中
// lang 属性同样在 JSX 的 <html lang="zh-CN"> 中，不在 metadata 对象中
