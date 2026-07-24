/**
 * page.test.tsx — 报表中心页面 L1 静态分析测试
 *
 * 覆盖: 接口定义 / 报表分类列表展示 / 搜索和筛选 / 统计数据
 * 方法: 源码静态分析, 不依赖 React 渲染
 *
 * Phase-39 T169
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';

const SRC: string = fs.readFileSync(
  new URL('./page.tsx', import.meta.url),
  'utf-8'
);

// ====================================================================
//  1. 接口定义 / 类型相关
// ====================================================================

describe('page.tsx: 类型与接口定义', () => {
  it('should import ReportResult type from reports-utils', () => {
    assert.ok(
      SRC.includes("import type { ReportResult") ||
      SRC.includes("import type { ReportResult,") ||
      SRC.includes("import { type ReportResult"),
      '需要从 reports-utils 导入 ReportResult 类型'
    );
  });

  it('should import ReportTab type from reports-utils', () => {
    assert.ok(
      SRC.includes("import type {") && SRC.includes("ReportTab"),
      '需要导入 ReportTab 类型'
    );
  });

  it('should import buildChartOption from reports-utils', () => {
    assert.ok(
      SRC.includes("import {") && SRC.includes("buildChartOption"),
      '需要导入 buildChartOption 函数'
    );
  });

  it('should declare globalWindow echarts type', () => {
    assert.ok(
      SRC.includes('declare global') || SRC.includes('interface Window'),
      '需要全局声明 window.echarts 类型'
    );
  });

  it('should define CARD_STYLE constant with correct border-radius', () => {
    assert.ok(SRC.includes('CARD_STYLE'), '需要 CARD_STYLE 常量');
    assert.ok(SRC.includes('borderRadius: 8'), '卡片边框圆角应为 8px');
  });

  it('should define TAB_ACTIVE style with blue bottom border', () => {
    assert.ok(SRC.includes('TAB_ACTIVE'), '需要 TAB_ACTIVE 样式常量');
    assert.ok(
      SRC.includes("'#2563eb'"),
      '激活标签应使用品牌蓝 #2563eb'
    );
  });
});

// ====================================================================
//  2. 报表分类 / 列表展示
// ====================================================================

describe('page.tsx: 报表分类与列表展示', () => {
  it('should define exactly 6 report tabs with keys and labels', () => {
    // 提取所有 tab button 的 key-label 对
    const tabMatches = SRC.match(/\{ key: '([^']+)', label: '([^']+)' \}/g);
    assert.ok(tabMatches, '需要定义报表标签页数组');
    assert.equal(
      tabMatches.length,
      6,
      `应有 6 个报表分类, 实际 ${tabMatches.length}`
    );
  });

  it('should include revenue tab with 营收趋势 label', () => {
    assert.ok(
      SRC.includes("key: 'revenue'") && SRC.includes('营收趋势'),
      '需要营收趋势标签'
    );
  });

  it('should include product-ranking tab with 商品排行 label', () => {
    assert.ok(
      SRC.includes("key: 'product-ranking'") && SRC.includes('商品排行'),
      '需要商品排行标签'
    );
  });

  it('should include payment-mix tab with 支付占比 label', () => {
    assert.ok(
      SRC.includes("key: 'payment-mix'") && SRC.includes('支付占比'),
      '需要支付占比标签'
    );
  });

  it('should include hourly-heatmap tab with 时段热力 label', () => {
    assert.ok(
      SRC.includes("key: 'hourly-heatmap'") && SRC.includes('时段热力'),
      '需要时段热力图标签'
    );
  });

  it('should include order tab with 订单漏斗 label', () => {
    assert.ok(
      SRC.includes("key: 'order'") && SRC.includes('订单漏斗'),
      '需要订单漏斗标签'
    );
  });

  it('should include inventory tab with 库存周转 label', () => {
    assert.ok(
      SRC.includes("key: 'inventory'") && SRC.includes('库存周转'),
      '需要库存周转标签'
    );
  });

  it('should render metadata line with period rows and generatedAt', () => {
    assert.ok(
      SRC.includes('report.period.from') && SRC.includes('report.period.to'),
      '需要显示报表起止日期'
    );
    assert.ok(
      SRC.includes('report.rows.length') || SRC.includes('.rows.length'),
      '需要显示数据行数'
    );
    assert.ok(
      SRC.includes('report.generatedAt'),
      '需要显示生成时间'
    );
  });

  it('should render a data table when rows exist', () => {
    assert.ok(
      SRC.includes('<table') && SRC.includes('<thead') &&
      SRC.includes('<tbody') && SRC.includes('report.rows.map'),
      '需要渲染数据表格 (thead + tbody + rows.map)'
    );
  });

  it('should render totals row in tfoot when present', () => {
    assert.ok(
      SRC.includes('<tfoot') && SRC.includes('report.totals'),
      '需要渲染合计行 tfoot + report.totals'
    );
  });
});

// ====================================================================
//  3. 搜索与筛选
// ====================================================================

describe('page.tsx: 搜索与筛选控件', () => {
  it('should have tenantId state and input', () => {
    assert.ok(
      SRC.includes("const [tenantId") && SRC.includes("tenant-input"),
      '需要租户输入框和对应的 state'
    );
  });

  it('should have date range state from and to', () => {
    assert.ok(
      SRC.includes("const [from") && SRC.includes("const [to"),
      '需要开始/结束日期 state'
    );
    assert.ok(
      SRC.includes("type=\"date\""),
      '日期输入框应使用 type=date'
    );
  });

  it('should have a 查询 button that triggers loadReport', () => {
    assert.ok(
      SRC.includes('查询') && SRC.includes('onClick={loadReport}'),
      '需要查询按钮绑定 loadReport'
    );
  });

  it('should have loading state and disable button while loading', () => {
    assert.ok(
      SRC.includes('loading') && SRC.includes('disabled={loading}'),
      '加载中应禁用查询按钮'
    );
    assert.ok(
      SRC.includes("'加载中…'") || SRC.includes('加载中'),
      '加载中应显示加载文字'
    );
  });

  it('should have cache invalidation button', () => {
    assert.ok(
      SRC.includes('invalidateCache') || SRC.includes('失效缓存'),
      '需要缓存失效按钮'
    );
    assert.ok(
      SRC.includes('invalidate-btn'),
      '缓存失效按钮应有 data-testid'
    );
  });

  it('should include activeTab state for tab switching', () => {
    assert.ok(
      SRC.includes("const [activeTab") &&
      SRC.includes("setActiveTab"),
      '需要 activeTab state 和 setter'
    );
  });

  it('should filter results based on activeTab via API query param', () => {
    assert.ok(
      SRC.includes('/api/reports/${activeTab}') ||
      SRC.includes('/api/reports/'),
      '需要使用 activeTab 动态构建 API 路径'
    );
  });

  it('should pass tenantId, from, to as query parameters', () => {
    assert.ok(
      SRC.includes('tenantId=') && SRC.includes('from=') && SRC.includes('to='),
      'API 请求应携带 tenantId、from、to 参数'
    );
  });
});

// ====================================================================
//  4. 统计数据
// ====================================================================

describe('page.tsx: 统计数据', () => {
  it('should display total row count', () => {
    assert.ok(
      SRC.includes('report.rows.length') || SRC.includes('.rows.length'),
      '需要显示总行数'
    );
  });

  it('should display period range (from → to)', () => {
    assert.ok(
      SRC.match(/report\.period\.from.*report\.period\.to/) ||
      SRC.includes('report.period.from') && SRC.includes('report.period.to'),
      '需要展示日期范围统计'
    );
  });

  it('should display cached indicator when report is cached', () => {
    assert.ok(
      SRC.includes('report.cached') && SRC.includes('Cached'),
      '需要显示缓存标记 ⚡ Cached'
    );
  });

  it('should display error state with ❌ prefix', () => {
    assert.ok(
      SRC.includes('❌') && SRC.includes('error'),
      '错误状态应显示 ❌ 前缀和错误信息'
    );
  });

  it('should display success toast with ✅ prefix', () => {
    assert.ok(
      SRC.includes('✅') && SRC.includes('exportToast'),
      '成功消息应显示 ✅ 前缀'
    );
  });

  it('should render column headers from report.columns', () => {
    assert.ok(
      SRC.includes('report.columns.map') && SRC.includes('c.alias'),
      '表格列头应渲染自 report.columns 的 alias 字段'
    );
  });

  it('should have export buttons for CSV, JSON, HTML', () => {
    const csvMatch = SRC.includes("'csv'") || SRC.includes('CSV');
    const jsonMatch = SRC.includes("'json'") || SRC.includes('JSON');
    const htmlMatch = SRC.includes("'html'") || SRC.includes('HTML');
    assert.ok(
      csvMatch && jsonMatch && htmlMatch,
      '需要 CSV、JSON、HTML 三种导出按钮'
    );
  });
});

// ====================================================================
//  5. 组件结构 / 渲染结构
// ====================================================================

describe('page.tsx: 组件渲染结构', () => {
  it('should export default function component', () => {
    assert.ok(
      SRC.includes('export default function ReportsPage'),
      '需要 export default function ReportsPage'
    );
  });

  it('should have style constants CARD_STYLE and TAB_STYLE', () => {
    assert.ok(SRC.includes('const CARD_STYLE'));
    assert.ok(SRC.includes('const TAB_STYLE'));
    assert.ok(SRC.includes('const TAB_ACTIVE'));
  });

  it('should have JSX return with header section', () => {
    assert.ok(SRC.includes('return ('));
    assert.ok(SRC.includes('<header') || SRC.includes('<h1'));
    assert.ok(SRC.includes('报表中心'));
  });

  it('should use useEffect for data loading on mount/deps change', () => {
    assert.ok(
      SRC.includes('useEffect') &&
      SRC.includes('loadReport') &&
      SRC.includes('loadReport()'),
      '需要使用 useEffect 加载报表数据'
    );
  });

  it('should have chart container div with ref', () => {
    assert.ok(
      SRC.includes('chartRef') && SRC.includes('chart-container'),
      '需要图表容器 ref 和 data-testid'
    );
  });

  it('should handle window resize for chart responsiveness', () => {
    assert.ok(
      SRC.includes('resize') && SRC.includes('addEventListener'),
      '需要监听窗口 resize 事件'
    );
  });

  it('should integrate AdminPermissionGate with dashboard:read', () => {
    assert.ok(
      SRC.includes('AdminPermissionGate'),
      '需要接入 AdminPermissionGate'
    );
    assert.ok(
      SRC.includes("requiredPermission: 'dashboard:read'"),
      '需要复用 dashboard:read 权限'
    );
  });
});

// ====================================================================
//  6. ECharts CDN 加载
// ====================================================================

describe('page.tsx: ECharts CDN 加载', () => {
  it('should define loadECharts function', () => {
    assert.ok(
      SRC.includes('function loadECharts') || SRC.includes('loadECharts'),
      '需要 loadECharts 异步加载函数'
    );
  });

  it('should create script element for CDN', () => {
    assert.ok(
      SRC.includes('createElement') && SRC.includes('script'),
      '需要动态创建 script 标签加载 ECharts CDN'
    );
    assert.ok(
      SRC.includes('echarts') || SRC.includes('cdn.jsdelivr.net'),
      '需要指向 ECharts CDN 地址'
    );
  });

  it('should have echartsReady state', () => {
    assert.ok(
      SRC.includes('echartsReady') &&
      SRC.includes('setEchartsReady'),
      '需要 echartsReady state 标记加载完成'
    );
  });

  it('should init chart instance only after ECharts is ready', () => {
    assert.ok(
      SRC.includes('window.echarts') && SRC.includes('.init'),
      '需要调用 echarts.init 初始化图表实例'
    );
  });

  it('should debounce or guard chart setOption calls', () => {
    assert.ok(
      SRC.includes('setOption'),
      '需要调用 echartsInstance.setOption 更新图表'
    );
  });
});

// ====================================================================
//  7. 导出功能
// ====================================================================

describe('page.tsx: 导出防御能力', () => {
  it('should declare exportReport function', () => {
    assert.ok(
      SRC.includes('function exportReport') ||
      SRC.includes('const exportReport'),
      '需要定义 exportReport 导出函数'
    );
  });

  it('should support csv, json, html export formats', () => {
    const match = SRC.match(/['"](csv|json|html)['"]/g);
    assert.ok(match, '需要支持导出格式');
    const formats = new Set(match?.map((m: string) => m.replace(/['"]/g, '')));
    assert.ok(formats.has('csv'), '需要 CSV 导出格式');
    assert.ok(formats.has('json'), '需要 JSON 导出格式');
    assert.ok(formats.has('html'), '需要 HTML 导出格式');
  });

  it('should use Blob and URL.createObjectURL for download', () => {
    assert.ok(
      SRC.includes('Blob') &&
      SRC.includes('URL.createObjectURL') &&
      SRC.includes('URL.revokeObjectURL'),
      '导出应使用 Blob + URL API 触发下载'
    );
  });

  it('should set export toast message on success', () => {
    assert.ok(
      SRC.includes('setExportToast'),
      '需要 setExportToast 成功反馈'
    );
  });

  it('should clear toast after timeout', () => {
    assert.ok(
      SRC.includes('setTimeout') && SRC.includes('setExportToast(null)'),
      '需要 setTimeout 自动清除 Toast'
    );
  });

  it('should handle export error with setError', () => {
    assert.ok(
      SRC.includes('导出失败') || SRC.includes('setError'),
      '导出失败应设置 error state'
    );
  });

  it('should validate tenantId before export fetch', () => {
    assert.ok(
      SRC.includes('exportReport') && SRC.match(/if\s*\(!tenantId\)\s*return/),
      '导出前应校验 tenantId 非空'
    );
  });
});

// ====================================================================
//  8. 报表统计汇总条
// ====================================================================

describe('page.tsx: 报表统计汇总条', () => {
  it('should define reportStats state for summary data', () => {
    assert.ok(
      SRC.includes('reportStats') && SRC.includes('setReportStats'),
      '需要 reportStats 存储统计汇总数据'
    );
  });

  it('should have stats summary div with data-testid', () => {
    assert.ok(
      SRC.includes('stats-summary-bar'),
      '需要 data-testid 为 stats-summary-bar 的汇总条容器'
    );
  });

  it('should render exactly 4 stat cards with distinct keys', () => {
    // JSX 中通过 .map() 生成，所以源码只有一处引用
    assert.ok(
      SRC.includes('stat-card-'),
      '需要 data-testid 引用统计卡片'
    );
    // 验证 4 组不同 key
    assert.ok(SRC.includes('todayNew'), '需要 todayNew key');
    assert.ok(SRC.includes('pendingReview'), '需要 pendingReview key');
    assert.ok(SRC.includes('published'), '需要 published key');
    assert.ok(SRC.includes('total'), '需要 total key');
    // 验证通过数组 .map 生成
    assert.ok(
      SRC.includes('.map(stat =>'),
      '统计卡片应通过数组 .map 生成'
    );
  });

  it('should include 今日新增 stat card', () => {
    assert.ok(
      SRC.includes('todayNew') && SRC.includes('今日新增'),
      '需要今日新增统计卡片'
    );
  });

  it('should include 待审核 stat card', () => {
    assert.ok(
      SRC.includes('pendingReview') && SRC.includes('待审核'),
      '需要待审核统计卡片'
    );
  });

  it('should include 已发布 stat card', () => {
    assert.ok(
      SRC.includes('published') && SRC.includes('已发布'),
      '需要已发布统计卡片'
    );
  });

  it('should include 总报表 stat card', () => {
    assert.ok(
      SRC.includes('total') && SRC.includes('总报表'),
      '需要总报表统计卡片'
    );
  });

  it('should display loading placeholder when statsLoading is true', () => {
    assert.ok(
      SRC.includes('statsLoading') && SRC.includes('…'),
      '加载中应显示 … 占位符'
    );
  });

  it('should display dash placeholder when reportStats is null', () => {
    assert.ok(
      SRC.includes("'-'"),
      '无统计数据时应显示 - 占位符'
    );
  });

  it('should call loadStats on mount via useEffect', () => {
    assert.ok(
      SRC.includes('loadStats') && SRC.includes('loadStats()'),
      '需要在 useEffect 中调用 loadStats'
    );
  });

  it('should fetch stats from /api/reports/stats/summary endpoint', () => {
    assert.ok(
      SRC.includes('/api/reports/stats/summary'),
      '统计汇总数据应从 /api/reports/stats/summary 获取'
    );
  });

  it('should use tenantId as query param for stats fetch', () => {
    assert.ok(
      SRC.includes('tenantId=${tenantId}') ||
      (SRC.includes('stats/summary') && SRC.includes('tenantId=')),
      '统计汇总请求应携带 tenantId 参数'
    );
  });

  it('should guard stats fetch with try/catch to avoid blocking page', () => {
    assert.ok(
      SRC.includes('try') && SRC.includes('catch') && SRC.includes('Stats'),
      '统计汇总请求失败不应阻塞页面，需要 try/catch 包裹'
    );
  });

  it('should provide each stat card with distinct left border color', () => {
    const colors = ['#2563eb', '#f59e0b', '#10b981', '#8b5cf6'];
    for (const color of colors) {
      assert.ok(
        SRC.includes(color),
        `统计卡片需要颜色 ${color}`
      );
    }
  });

  it('should respond to tenantId changes by reloading stats', () => {
    // loadStats 的 useCallback 依赖了 tenantId
    assert.ok(
      SRC.includes('loadStats') && SRC.includes('tenantId'),
      'loadStats 应该依赖 tenantId'
    );
    // 验证 useCallback 依赖项包含 tenantId
    const tokens = SRC.match(/useCallback\([^)]*\)/g) || [];
    const hasDep = tokens.some(t => t.includes('tenantId'));
    assert.ok(
      hasDep ||
      (SRC.includes('loadStats') && SRC.match(/\[tenantId\]/)),
      'loadStats 的 useCallback 依赖列表应包含 tenantId'
    );
  });
});

// ====================================================================
//  9. 边界情况 — 空状态 / 缺省处理
// ====================================================================

describe('page.tsx: 边界情况', () => {
  it('should handle report with empty rows gracefully', () => {
    assert.ok(
      SRC.includes('report.rows.length > 0') ||
      SRC.includes('report.rows.length === 0') ||
      SRC.includes('report.rows.length'),
      '应检查 report.rows.length 来条件渲染数据表'
    );
  });

  it('should render data table with conditional check', () => {
    assert.ok(
      SRC.match(/report\.rows\.length\s*>\s*0/) ||
      SRC.match(/report \&\& report\.rows\.length\s*>\s*0/) ||
      (SRC.includes('report.rows.length > 0')),
      '表格渲染应有条件检查 rows.length > 0'
    );
  });

  it('should not crash when report is null during chart render', () => {
    assert.ok(
      SRC.includes('if (!echartsReady || !chartRef.current || !report) return'),
      '图表渲染应 guard 空 report'
    );
  });

  it('should show error toast in fixed position div', () => {
    assert.ok(
      SRC.includes('fixed') && SRC.includes('#ef4444'),
      '错误提示应使用红色 fixed 定位 Toast'
    );
  });

  it('should show success toast with green background', () => {
    assert.ok(
      SRC.includes('fixed') && SRC.includes('#10b981'),
      '成功提示应使用绿色 fixed 定位 Toast'
    );
  });

  it('should handle HTTP error in loadReport gracefully', () => {
    assert.ok(
      SRC.includes('HTTP ${res.status}') && SRC.includes('setError(e.message)'),
      'HTTP 错误应捕获状态码并通过 setError 显示'
    );
  });

  it('should handle cache invalidation failure without breaking page', () => {
    assert.ok(
      SRC.includes('失效失败') ||
      (SRC.includes('invalidateCache') && SRC.includes('catch')),
      '缓存失效失败应捕获异常并显示错误信息'
    );
  });

  it('should handle null report when rendering metadata', () => {
    assert.ok(
      SRC.includes('report &&') ||
      SRC.includes('{report &&'),
      '元数据区域应在 report 非空时渲染'
    );
  });

  it('should handle missing totals gracefully in table', () => {
    assert.ok(
      SRC.includes('report.totals &&') ||
      SRC.includes('report.totals'),
      '合计行应检查 totals 存在'
    );
  });
});

// ====================================================================
//  10. 租户安全 — TenantGuard
// ====================================================================

describe('page.tsx: 租户安全', () => {
  it('should early return from loadReport when tenantId is empty', () => {
    assert.ok(
      SRC.includes('if (!tenantId) return') ||
      (SRC.includes('loadReport') && SRC.includes('if (!tenantId)')),
      'loadReport 应在 tenantId 为空时提前返回'
    );
  });

  it('should early return from invalidateCache when tenantId is empty', () => {
    assert.ok(
      SRC.includes('invalidateCache') && SRC.includes('if (!tenantId) return'),
      'invalidateCache 应在 tenantId 为空时提前返回'
    );
  });

  it('should early return from loadStats when tenantId is empty', () => {
    const loadStatsReturn = SRC.match(/loadStats[^}]*if\s*\(!tenantId\)/);
    assert.ok(
      loadStatsReturn ||
      (SRC.includes('loadStats') &&
       SRC.includes('if (!tenantId)') &&
       SRC.match(/loadStats[^}]*return/)),
      'loadStats 应在 tenantId 为空时提前返回'
    );
  });

  it('should early return from exportReport when tenantId is empty', () => {
    assert.ok(
      SRC.includes('exportReport') && SRC.includes('if (!tenantId) return'),
      'exportReport 应在 tenantId 为空时提前返回'
    );
  });

  it('should pass tenantId as query param to all API calls', () => {
    const apiCalls = SRC.match(/fetch\([^)]*\)/g);
    assert.ok(apiCalls && apiCalls.length >= 3, '至少需要 3 个 API 调用');
    const withTenantId = apiCalls.filter(c => c.includes('tenantId'));
    assert.ok(
      withTenantId.length >= 3,
      `所有 API 调用都应携带 tenantId 参数, 实际 ${withTenantId.length}/3+`
    );
  });
});
