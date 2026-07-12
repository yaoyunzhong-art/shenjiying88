/**
 * stocktaking/stocktaking.test.tsx — 盘点页面结构测试
 * 适配实际页面 StocktakingPage
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

describe('StocktakingPage structure', () => {
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
    assert.ok(html.includes('4980/5000'), 'Missing actual/expected for coins');
    assert.ok(html.includes('120/120'), 'Missing zero diff item');
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
});
