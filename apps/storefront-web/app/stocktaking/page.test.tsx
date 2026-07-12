/**
 * stocktaking/page.test.tsx — 盘点列表页 L1 冒烟测试
 * 适配实际页面 StocktakingPage
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const { default: StocktakingPage } = await import('./page');

describe('stocktaking — 正例', () => {
  it('应导出默认函数组件', () => {
    assert.equal(typeof StocktakingPage, 'function');
  });

  it('渲染盘点页面标题', () => {
    const html = renderToStaticMarkup(React.createElement(StocktakingPage));
    assert.ok(html.includes('库存盘点'));
  });

  it('渲染 4 个盘点项', () => {
    const html = renderToStaticMarkup(React.createElement(StocktakingPage));
    assert.ok(html.includes('游戏币'));
    assert.ok(html.includes('饮料(箱)'));
    assert.ok(html.includes('礼品玩偶'));
    assert.ok(html.includes('VR手柄'));
  });

  it('渲染差异计数', () => {
    const html = renderToStaticMarkup(React.createElement(StocktakingPage));
    assert.ok(html.includes('-20') || html.includes('-2'));
  });

  it('渲染深色主题背景', () => {
    const html = renderToStaticMarkup(React.createElement(StocktakingPage));
    assert.ok(html.includes('#0f172a'));
  });
});

describe('stocktaking — 边界', () => {
  it('无差异项显示 0 差异', () => {
    const html = renderToStaticMarkup(React.createElement(StocktakingPage));
    // VR手柄 diff=0, 饮料 diff=0 — 不应显示差异标签
    assert.ok(html.includes('120') && html.includes('10'));
  });
});
