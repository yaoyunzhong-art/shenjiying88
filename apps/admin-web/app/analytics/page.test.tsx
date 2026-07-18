/**
 * @ts-no-check — 这是一个静态分析测试套件，不依赖 React 渲染
 * 因为 analytics 是 Server Components + Suspense 混合架构
 */
import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

function extractPageSource(): string | null {
  try {
    const fs = require('fs');
    const path = require('path');
    return fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
  } catch { return null; }
}

describe('analytics page', () => {
  beforeEach(() => {});

  describe('类型定义', () => {
    it('应定义 AnalyticsSnapshot 接口', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('AnalyticsSnapshot'));
      assert.ok(src.includes('periodRevenue'));
      assert.ok(src.includes('totalCustomers'));
      assert.ok(src.includes('avgOrderValue'));
    });

    it('应定义 topSellingProducts 类型', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('topSellingProducts'));
      assert.ok(src.includes('sales'));
      assert.ok(src.includes('revenue'));
    });

    it('应定义品类数据接口', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('Category') || src.includes('category'));
    });
  });

  describe('组件结构', () => {
    it('应使用 Suspense 加载', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('Suspense'));
    });

    it('应使用 AnalyticsClient', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('AnalyticsClient'));
    });

    it('应使用 PageShell 或 ErrorBoundary', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('PageShell') || src.includes('ErrorBoundary'));
    });
  });

  describe('数据结构', () => {
    it('应包含营收数据字段', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('periodRevenue'));
      assert.ok(src.includes('current'));
      assert.ok(src.includes('previous'));
      assert.ok(src.includes('growth'));
    });

    it('应支持同比环比', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('growth') || src.includes('同比') || src.includes('环比'));
    });
  });

  describe('页面结构', () => {
    it('应导出默认组件', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('export default'));
    });

    it('应包含页面标题', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('数据') || src.includes('Analytics') || src.includes('分析'));
    });
  });

  describe('加载与错误处理', () => {
    it('应使用 LoadingSkeleton 或加载态处理', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('LoadingSkeleton') || src.includes('loading'));
    });

    it('应处理数据获取失败', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('ErrorBoundary') || src.includes('error') || src.includes('catch'));
    });
  });
});
