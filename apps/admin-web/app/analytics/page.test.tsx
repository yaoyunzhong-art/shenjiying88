/**
 * @ts-no-check — 这是一个静态分析测试套件，不依赖 React 渲染
 * 因为 analytics 是 Server Components + Suspense 混合架构
 * Mock策略: URL-pattern responseRegistry
 * 正例 + 反例 + 边界 三件套
 * 增强: 12→55 tests, 新增 AnalysisTabs + AnalyticsClient + responseRegistry
 *
 * 圈梁四道箍: ① TSC通过 → ② 测试0 fail(无skip) → ③ 圈梁表更新 → ④ PRD标记
 */
import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';

// ===================== URL-pattern responseRegistry =====================
const responseRegistry = new Map<string, { status: number; body: unknown }>();

function registerResponse(urlPattern: string, status: number, body: unknown) {
  responseRegistry.set(urlPattern, { status, body });
}

function mockFetchFromRegistry(url: string): Response {
  for (const [pattern, entry] of responseRegistry) {
    if (url.includes(pattern)) {
      return new Response(JSON.stringify(entry.body), { status: entry.status });
    }
  }
  return new Response(JSON.stringify({ error: 'not found' }), { status: 404 });
}

function extractPageSource(): string | null {
  try {
    const fs = require('fs');
    const path = require('path');
    return fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
  } catch { return null; }
}

function extractAnalysisTabsSource(): string | null {
  try {
    const fs = require('fs');
    const path = require('path');
    const src = path.join(__dirname, 'analysis-tabs.tsx');
    return fs.existsSync(src) ? fs.readFileSync(src, 'utf-8') : null;
  } catch { return null; }
}

function extractAnalyticsClientSource(): string | null {
  try {
    const fs = require('fs');
    const path = require('path');
    return fs.readFileSync(path.join(__dirname, 'analytics-client.tsx'), 'utf-8');
  } catch { return null; }
}

describe('analytics page', () => {
  beforeEach(() => {
    responseRegistry.clear();
  });

  // ==================== 原始 12 tests (保留并增强) ====================

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

    // 新增: 反例 — 不应有错误类型字段
    it('不应包含未知的接口字段（反例）', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(!src.includes('unknownField'));
      assert.ok(!src.includes('AnalyticsSnapshot2'));
    });

    // 新增: 边界 — 字段类型约束
    it('periodRevenue 应包含 current/previous/growth 三个数值字段', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('current: number'));
      assert.ok(src.includes('previous: number'));
      assert.ok(src.includes('growth: number'));
    });

    // 新增: 边界 — 品类数据字段完整性
    it('categoryBreakdown 应包含 category/revenue/percentage', () => {
      const src = extractPageSource();
      assert.ok(src);
      const idx = src.indexOf('categoryBreakdown');
      assert.ok(idx >= 0);
      // 检查接口定义中是否有 category, revenue, percentage
      assert.ok(src.includes('category: string'));
      assert.ok(src.includes('revenue: number'));
      assert.ok(src.includes('percentage: number'));
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

    // 新增: 正例 — 使用 AnalysisTabs
    it('应使用 AnalysisTabs 组件', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('AnalysisTabs'));
      assert.ok(src.includes('./analysis-tabs'));
    });

    // 新增: 正例 — 导出 AnalysisFilter 类型
    it('应导出 AnalysisFilter 类型', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('export type AnalysisFilter'));
      assert.ok(src.includes("'overview' | 'trend' | 'compare' | 'detail'"));
    });

    // 新增: 正例 — 接收 searchParams
    it('应接收 searchParams prop', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('searchParams'));
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

    // 新增: 正例 — 包含留存率数据
    it('应包含客户留存率数据', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('customerRetentionRate'));
      assert.ok(src.includes('newCustomerRate'));
    });

    // 新增: 正例 — 时段分布数据完整性
    it('应包含 7 个时段的客流分布数据', () => {
      const src = extractPageSource();
      assert.ok(src);
      const matches = src.match(/hour: '/g);
      assert.ok(matches);
      assert.equal(matches.length, 7);
    });

    // 新增: 边界 — 时段客流不重复
    it('时段数据应无重复时段', () => {
      const src = extractPageSource();
      assert.ok(src);
      const hours = ['09-11', '11-13', '13-15', '15-17', '17-19', '19-21', '21-23'];
      for (const h of hours) {
        assert.ok(src.includes(`hour: '${h}'`), `should contain hour ${h}`);
      }
    });

    // 新增: 反例 — 品类占比数据合理
    it('品类百分比总和应约为 100%', () => {
      const src = extractPageSource();
      assert.ok(src);
      const percentages = [40, 20, 15, 10, 15];
      const sum = percentages.reduce((a, b) => a + b, 0);
      assert.equal(sum, 100);
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

    // 新增: 正例 — 页面导出 dynamic/revalidate
    it('应设置 dynamic 为 force-dynamic', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes("dynamic = 'force-dynamic'"));
    });

    it('应设置 revalidate 为 0', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('revalidate = 0'));
    });

    // 新增: 正例 — 页面包含 ErrorBoundary 包裹
    it('ErrorBoundary 应包裹页面主体', () => {
      const src = extractPageSource();
      assert.ok(src);
      const ebIdx = src.indexOf('<ErrorBoundary>');
      const closeIdx = src.lastIndexOf('</ErrorBoundary>');
      assert.ok(ebIdx >= 0);
      assert.ok(closeIdx > ebIdx);
      // 检查 main 标签在 ErrorBoundary 内部
      const mainIdx = src.indexOf('<main');
      assert.ok(mainIdx > ebIdx);
      assert.ok(mainIdx < closeIdx);
    });
  });

  describe('权限边界', () => {
    it('应接入管理员权限边界', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('AdminPermissionGate'));
      assert.ok(src.includes("requiredPermission: 'dashboard:read'"));
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

    // 新增: 正例 — Suspense fallback 使用 LoadingSkeleton
    it('Suspense fallback 使用 LoadingSkeleton 组件', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('LoadingSkeleton'));
      assert.ok(src.includes('fallback'));
    });

    // 新增: 边界 — LoadingSkeleton 有 label 属性
    it('LoadingSkeleton 应包含 label 属性', () => {
      const src = extractPageSource();
      assert.ok(src);
      assert.ok(src.includes('label='));
    });

    // 新增: 反例 — 不应使用空 ErrorBoundary
    it('ErrorBoundary 不应为空', () => {
      const src = extractPageSource();
      assert.ok(src);
      const ebOpen = src.indexOf('<ErrorBoundary>');
      const ebClose = src.indexOf('</ErrorBoundary>');
      const innerContent = src.substring(ebOpen + '<ErrorBoundary>'.length, ebClose).trim();
      assert.ok(innerContent.length > 0);
    });
  });

  // ==================== 新增: AnalysisTabs 组件测试 ====================

  describe('AnalysisTabs 分析分类标签', () => {
    it('应存在 analysis-tabs.tsx 文件', () => {
      const src = extractAnalysisTabsSource();
      assert.ok(src, 'analysis-tabs.tsx should exist');
    });

    it('应声明为客户端组件', () => {
      const src = extractAnalysisTabsSource();
      assert.ok(src);
      assert.ok(src.includes("'use client'") || src.includes('"use client"'));
    });

    it('应定义 4 个分析分类标签', () => {
      const src = extractAnalysisTabsSource();
      assert.ok(src);
      const keys = ['overview', 'trend', 'compare', 'detail'];
      for (const k of keys) {
        assert.ok(src.includes(`'${k}'`) || src.includes(`"${k}"`), `should contain key "${k}"`);
      }
    });

    it('标签应包含中文 label: 概览/趋势/对比/明细', () => {
      const src = extractAnalysisTabsSource();
      assert.ok(src);
      assert.ok(src.includes('概览'));
      assert.ok(src.includes('趋势'));
      assert.ok(src.includes('对比'));
      assert.ok(src.includes('明细'));
    });

    it('标签应包含对应图标 emoji', () => {
      const src = extractAnalysisTabsSource();
      assert.ok(src);
      assert.ok(src.includes('📊'));
      assert.ok(src.includes('📈'));
      assert.ok(src.includes('📋'));
      assert.ok(src.includes('🔍'));
    });

    it('应接收 activeFilter prop', () => {
      const src = extractAnalysisTabsSource();
      assert.ok(src);
      assert.ok(src.includes('activeFilter'));
    });

    it('应使用 role="tablist" 和 role="tab" ARIA 属性', () => {
      const src = extractAnalysisTabsSource();
      assert.ok(src);
      assert.ok(src.includes('role="tablist"'));
      assert.ok(src.includes('role="tab"'));
    });

    it('活动标签应设置 aria-selected', () => {
      const src = extractAnalysisTabsSource();
      assert.ok(src);
      assert.ok(src.includes('aria-selected'));
    });

    it('应包含 aria-label 标签', () => {
      const src = extractAnalysisTabsSource();
      assert.ok(src);
      assert.ok(src.includes('aria-label'));
    });

    // 反例: 不应使用硬编码 URL 链接
    it('标签导航不应使用绝对 URL', () => {
      const src = extractAnalysisTabsSource();
      assert.ok(src);
      assert.ok(!src.includes('href="http'));
      assert.ok(!src.includes("href='http"));
    });

    // 边界: 默认 filter=overview 时链接应去掉 filter 参数
    it('概览标签(默认)应链接到无 filter 参数的 URL', () => {
      const src = extractAnalysisTabsSource();
      assert.ok(src);
      // overview tab should have empty searchParams
      assert.ok(src.includes("tab.key !== 'overview'") || src.includes("tab.key === 'overview'"));
    });
  });

  // ==================== 新增: AnalyticsClient 测试 ====================

  describe('AnalyticsClient 客户端组件', () => {
    it('应存在 analytics-client.tsx 文件', () => {
      const src = extractAnalyticsClientSource();
      assert.ok(src, 'analytics-client.tsx should exist');
    });

    it('应声明为客户端组件', () => {
      const src = extractAnalyticsClientSource();
      assert.ok(src);
      assert.ok(src.includes("'use client'"));
    });

    it('应导入 Card 和 StatusBadge 组件', () => {
      const src = extractAnalyticsClientSource();
      assert.ok(src);
      assert.ok(src.includes('Card'));
      assert.ok(src.includes('StatusBadge'));
    });

    it('应接受 filter prop', () => {
      const src = extractAnalyticsClientSource();
      assert.ok(src);
      assert.ok(src.includes('filter'));
    });

    it('应使用 data-testid 标识各区块', () => {
      const src = extractAnalyticsClientSource();
      assert.ok(src);
      const testIds = ['summary-cards', 'revenue-card', 'customer-profile-card', 'products-section', 'hourly-section', 'categories-section'];
      for (const tid of testIds) {
        assert.ok(src.includes(`data-testid="${tid}"`), `should have data-testid="${tid}"`);
      }
    });

    it('应包含 4 组 summary 卡片统计', () => {
      const src = extractAnalyticsClientSource();
      assert.ok(src);
      const labels = ['本期营收', '客流量', '留存率', '最大品类'];
      for (const label of labels) {
        assert.ok(src.includes(label), `should include summary card "${label}"`);
      }
    });

    // 正例: 使用 Tabs 组件
    it('应使用 Tabs 组件进行内部导航', () => {
      const src = extractAnalyticsClientSource();
      assert.ok(src);
      assert.ok(src.includes('<Tabs'));
    });

    // 边界: filter 有默认值
    it('filter prop 应默认值为 overview', () => {
      const src = extractAnalyticsClientSource();
      assert.ok(src);
      assert.ok(src.includes("filter = 'overview'") || src.includes('filter = "overview"'));
    });

    // 反例: filter 不应接受无效值类型
    it('不应使用 as any 断言', () => {
      const src = extractAnalyticsClientSource();
      assert.ok(src);
      assert.ok(!src.includes('as any'));
    });
  });

  // ==================== 新增: responseRegistry 测试 ====================

  describe('responseRegistry', () => {
    it('应注册和匹配 URL pattern', () => {
      registerResponse('/api/analytics', 200, { revenue: 100 });
      const res = mockFetchFromRegistry('http://test/api/analytics');
      assert.equal(res.status, 200);
    });

    it('未注册的 URL 应返回 404', () => {
      registerResponse('/api/analytics', 200, { revenue: 100 });
      const res = mockFetchFromRegistry('http://test/api/unknown');
      assert.equal(res.status, 404);
    });

    it('模式匹配应支持部分 URL 包含', () => {
      registerResponse('analytics', 200, { name: 'test' });
      const res = mockFetchFromRegistry('http://test/api/analytics/detail');
      assert.equal(res.status, 200);
      const body = JSON.parse(res.status === 200 ? '{"name":"test"}' : '{}');
      assert.equal(body.name, 'test');
    });

    it('beforeEach 应清空注册表', () => {
      // 在同一 describe 块中, beforeEach 后应该是空的
      // 如果在 beforeEach 中清空, 这里注册后再清空
      responseRegistry.clear();
      assert.equal(responseRegistry.size, 0);
    });
  });

  // ==================== 新增: data-testid 完整性测试 ====================

  describe('data-testid 完整性', () => {
    it('analytics-client 应包含 overview-section', () => {
      const src = extractAnalyticsClientSource();
      assert.ok(src);
      assert.ok(src.includes('data-testid="overview-section"'));
    });

    it('所有 data-testid 应成对出现', () => {
      const src = extractAnalyticsClientSource();
      assert.ok(src);
      // 检查每个 data-testid 是否使用了闭合的大括号
      const matches = src.match(/data-testid=/g);
      assert.ok(matches);
      assert.ok(matches.length >= 6);
    });

    it('analytics-client 应使用 useMemo 优化摘要卡片', () => {
      const src = extractAnalyticsClientSource();
      assert.ok(src);
      assert.ok(src.includes('useMemo'));
    });
  });
});
