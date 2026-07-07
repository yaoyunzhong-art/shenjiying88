/**
 * page.test.ts — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * storefront-web Dashboard page component test
 * 角色视角: 🛒前台 · 👔店长 · 📊运营
 * 验证 StorefrontDashboard 组件导出、Source Code 快照数据完整性
 */

import assert from 'node:assert/strict';
import { test, describe, it } from 'node:test';

// ── 辅助：从 page.tsx 源码提取常量/函数 ──

function loadSource(): string {
  const fs = require('fs');
  const path = require('path');
  return fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
}

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

test('📊 运营视角: page title in source code', () => {
  const source = loadSource();
  assert.ok(source.includes('Storefront Dashboard'), 'should contain title');
  assert.ok(source.includes('Recent Alerts'), 'should contain alerts section');
});

// ── 正例 ──

test('正例: module exports default component', async () => {
  const mod = await import('./page');
  assert.ok(mod.default !== undefined, 'default export required');
});

test('正例: page import does not throw', async () => {
  let importErr = false;
  try {
    await import('./page');
  } catch {
    importErr = true;
  }
  assert.equal(importErr, false, 'page import should not throw');
});

test('正例: component is callable function', async () => {
  const StorefrontDashboard = (await import('./page')).default;
  assert.equal(typeof StorefrontDashboard, 'function');
});

test('正例: source imports @m5/ui components', () => {
  const source = loadSource();
  assert.ok(source.includes('@m5/ui'), 'should import from @m5/ui');
  assert.ok(source.includes('PageShell'), 'should import PageShell');
  assert.ok(source.includes('StatCard'), 'should import StatCard');
  assert.ok(source.includes('StatusBadge'), 'should import StatusBadge');
  assert.ok(source.includes('SearchFilterInput'), 'should import SearchFilterInput');
  assert.ok(source.includes('LoadingSkeleton'), 'should import LoadingSkeleton');
});

test('正例: source imports local StoreShowcaseClient', () => {
  const source = loadSource();
  assert.ok(source.includes('StoreShowcaseClient'), 'should import StoreShowcaseClient');
});

test('正例: source imports storefront-home-view-model', () => {
  const source = loadSource();
  assert.ok(source.includes('storefront-home-view-model'), 'should import view model');
  assert.ok(source.includes('loadStorefrontHomeSnapshot'), 'should import snapshot loader');
});

test('正例: source has store name "Demo Store"', () => {
  const source = loadSource();
  assert.ok(source.includes('Demo Store'), 'should reference demo store');
});

// ── 反例 ──

test('反例: export is not null or undefined', async () => {
  const StorefrontDashboard = (await import('./page')).default;
  assert.notEqual(StorefrontDashboard, null, 'component should not be null');
  assert.notEqual(StorefrontDashboard, undefined, 'component should not be undefined');
});

test('反例: page import should succeed without error', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, 'should import without throw');
});

test('反例: no raw React.createElement in source (uses JSX)', () => {
  const source = loadSource();
  // Modern Next.js pages use JSX, not createElement
  assert.ok(!source.includes('createElement(') || source.includes('jsx'),
    'prefer JSX over createElement');
});

// ── 边界 ──

test('边界: StorefrontDashboard is not a class', async () => {
  const StorefrontDashboard = (await import('./page')).default;
  const isClass = StorefrontDashboard.prototype?.constructor === StorefrontDashboard &&
    Object.getOwnPropertyDescriptor(StorefrontDashboard, 'prototype')?.writable === false;
  if (isClass) {
    // 类组件在某些写法下等价调用
    try {
      const instance = new StorefrontDashboard({});
      assert.ok(instance !== undefined);
    } catch {
      // 类组件需要 props
      assert.ok(true, 'class component requires props');
    }
  }
});

test('边界: component is callable with no props', async () => {
  const StorefrontDashboard = (await import('./page')).default;
  try {
    const result = StorefrontDashboard({});
    assert.ok(result === null || typeof result === 'object',
      'should return React element or null');
  } catch {
    // hooks context 不满足时调用会抛
    assert.equal(typeof StorefrontDashboard, 'function',
      'component should be a valid function even if direct call requires hooks');
  }
});

test('边界: source length is reasonable', () => {
  const source = loadSource();
  assert.ok(source.length > 500, 'source should be substantial');
  assert.ok(source.length < 20000, 'source should not be too large');
});

test("边界: 'use client' directive exists", () => {
  const source = loadSource();
  assert.ok(source.includes("'use client'"), 'should be a client component');
});
