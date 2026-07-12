/**
 * 补货管理页 — 单元测试
 * 适配实际页面组件 ReplenishmentPage
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const { default: ReplenishmentPage } = await import('./page');

function render(ui: React.ReactElement): string {
  return renderToStaticMarkup(ui);
}

describe('ReplenishmentPage', () => {
  it('应导出默认函数组件', () => {
    assert.equal(typeof ReplenishmentPage, 'function');
  });

  it('渲染页面标题 补货管理', () => {
    const html = render(React.createElement(ReplenishmentPage));
    assert.ok(html.includes('补货管理'), '应包含页面标题');
  });

  it('渲染 3 个补货项', () => {
    const html = render(React.createElement(ReplenishmentPage));
    assert.ok(html.includes('打印纸'));
    assert.ok(html.includes('饮品-可乐'));
    assert.ok(html.includes('游戏币'));
  });

  it('显示优先级标签', () => {
    const html = render(React.createElement(ReplenishmentPage));
    assert.ok(html.includes('高优先级') || html.includes('中优先级'));
  });

  it('显示状态标签', () => {
    const html = render(React.createElement(ReplenishmentPage));
    assert.ok(html.includes('待采购') || html.includes('已下单'));
  });

  it('渲染深色主题背景', () => {
    const html = render(React.createElement(ReplenishmentPage));
    assert.ok(html.includes('#0f172a'));
  });
});
