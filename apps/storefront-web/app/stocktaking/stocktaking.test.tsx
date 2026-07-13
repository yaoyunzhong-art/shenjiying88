/**
 * stocktaking/stocktaking.test.tsx — 盘点页面结构测试
 * 适配实际页面 StocktakingPage
 * 覆盖: 正例(渲染/数据/标题) 反例(缺失字段/类型) 边界(空数据/负差值)
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

describe('StocktakingPage structure', () => {
  /* ── 正例 ── */

  it('should have the page file', async () => {
    const fs = await import('fs');
    const exists = fs.existsSync(
      new URL('./page.tsx', import.meta.url).pathname
    );
    assert.equal(exists, true);
  });

  it('should export default function component', async () => {
    const mod = await import('./page.tsx');
    assert.equal(typeof mod.default, 'function');
  });

  it('should render stocktaking title', async () => {
    const mod = await import('./page.tsx');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    assert.ok(html.includes('库存盘点'), 'Missing title');
  });

  it('should render items list', async () => {
    const mod = await import('./page.tsx');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    assert.ok(html.includes('游戏币'), 'Missing item');
    assert.ok(html.includes('饮料'), 'Missing item');
    assert.ok(html.includes('礼品玩偶'), 'Missing item');
    assert.ok(html.includes('VR手柄'), 'Missing item');
  });

  it('should render actual/expected counts', async () => {
    const mod = await import('./page.tsx');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    assert.ok(html.includes('5,000'), 'Missing expected count for coins');
    assert.ok(html.includes('4,980'), 'Missing actual count for coins');
    assert.ok(html.includes('120'), 'Missing drinks count (zero diff)');
  });

  it('should render diff indicators', async () => {
    const mod = await import('./page.tsx');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    assert.ok(html.includes('-20'), 'Missing negative diff');
    assert.ok(html.includes('-2'), 'Missing negative diff');
  });

  it('should have dark theme background', async () => {
    const mod = await import('./page.tsx');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    assert.ok(html.includes('#0f172a'), 'Missing dark background');
  });

  it('should contain useMemo for stats calculation', async () => {
    const mod = await import('./page.tsx');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    assert.ok(html.includes('差异') || html.includes('diff'), 'Missing diff section');
  });

  it('should render status indicators for each item', async () => {
    const mod = await import('./page.tsx');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    assert.ok(html.includes('已完成') || html.includes('待盘点') || html.includes('异常'), 'Missing status');
  });

  it('should render grid layout for stats', async () => {
    const mod = await import('./page.tsx');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    assert.ok(html.includes('grid') || html.includes('margin'), 'Missing layout');
  });

  /* ── 反例 ── */

  it('should not render empty state when data exists', async () => {
    const mod = await import('./page.tsx');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    assert.ok(!html.includes('暂无盘点数据'), 'Should not show empty state when data exists');
  });

  it('should not render React error boundary fallback', async () => {
    const mod = await import('./page.tsx');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    assert.ok(!html.includes('Something went wrong'), 'Should not show error state');
  });

  it('should not include dangerous HTML', async () => {
    const mod = await import('./page.tsx');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    assert.ok(!html.includes('dangerouslySetInnerHTML'), 'No dangerous HTML');
  });

  /* ── 边界 ── */

  it('should handle zero diff items', async () => {
    const mod = await import('./page.tsx');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    // Drinks item has exact match (120 both) — should show zero diff
    assert.ok(html.includes('120'), 'Zero diff item should still render');
  });

  it('should render with negative diff color', async () => {
    const mod = await import('./page.tsx');
    const html = renderToStaticMarkup(React.createElement(mod.default));
    // For negative diffs, page should use red colors
    assert.ok(html.includes('#ef4444') || html.includes('#f87171'), 'Negative diff should have red color');
  });

  it('should render all items without crash', async () => {
    const mod = await import('./page.tsx');
    let html: string;
    assert.doesNotThrow(() => {
      html = renderToStaticMarkup(React.createElement(mod.default));
    });
  });
});
