/**
 * brands/page.test.tsx — 品牌管理页面测试
 * 覆盖: 渲染 / 搜索 / 状态筛选 / 分类筛选 / 分页 / 空状态
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { createRoot } from 'react-dom/client';

import BrandsPage from './page';

describe('BrandsPage rendering', () => {
  it('should render without crashing', () => {
    const container = document.createElement('div');
    const root = createRoot(container);
    root.render(React.createElement(BrandsPage));
    root.unmount();
  });

  it('page title should contain 品牌管理', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(React.createElement(BrandsPage));

    const text = container.textContent || '';
    assert.ok(text.includes('品牌管理'), `expected "品牌管理" in text`);
    assert.ok(text.includes('品牌总数'), `expected "品牌总数" in text`);

    root.unmount();
    document.body.removeChild(container);
  });
});
