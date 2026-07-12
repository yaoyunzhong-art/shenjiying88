/**
 * store-manager/page.test.tsx — 店长工作台页 L1 冒烟测试 (storefront-web)
 * 适配实际页面 StoreManagerPage
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
const { default: StoreManagerPage } = await import('./page');

describe('store-manager — 正例', () => {
  it('应导出一个默认函数组件 StoreManagerPage', () => {
    assert.equal(typeof StoreManagerPage, 'function');
  });

  it('渲染页面标题"门店管理"', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerPage));
    assert.ok(html.includes('门店管理'));
  });

  it('渲染门店名称"神机营电竞乐园 · 旗舰店"', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerPage));
    assert.ok(html.includes('神机营电竞乐园'));
  });

  it('渲染地址信息', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerPage));
    assert.ok(html.includes('北京市朝阳区'));
  });

  it('渲染营业时间', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerPage));
    assert.ok(html.includes('10:00-22:00'));
  });

  it('渲染营业状态标签', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerPage));
    assert.ok(html.includes('营业中'));
  });

  it('包含保存按钮', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerPage));
    assert.ok(html.includes('保存修改'));
  });
});

describe('store-manager — 防御', () => {
  it('应包含 use client 指令', () => {
    const fs = require('node:fs');
    const src = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname, 'utf-8'
    );
    assert.ok(src.includes("'use client'"));
  });

  it('不应包含危险的 innerHTML', () => {
    const fs = require('node:fs');
    const src = fs.readFileSync(
      new URL('./page.tsx', import.meta.url).pathname, 'utf-8'
    );
    assert.doesNotMatch(src, /dangerouslySetInnerHTML/);
  });
});
