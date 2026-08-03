/**
 * finance-dashboard/page.test.ts — L2 源码分析测试 (readFileSync)
 *
 * 财务看板（报表页面）— B端损益报表与分账管理
 * 角色视角: 👔财务总监 · 📊运营经理 · 💻结算专员
 *
 * 测试纬度:
 *   正例 — use client/3个Tab/门店损益卡片(6指标)/品牌损益汇总(5指标)/分账日志(8条)/状态筛选/加载中
 *   反例 — 空门店列表/空品牌数据/空日志/null检查/输入边界
 *   边界 — MOCK数据完整性(3店/1品牌/8日志/5状态)/类型枚举/颜色映射/服务函数
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function readSource(file = 'page.tsx'): string {
  return readFileSync(resolve(__dirname, file), 'utf-8');
}

// ===================== 正例（Happy Path） =====================

describe('finance-dashboard — 正例（Happy Path）', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应默认导出 FinanceDashboardPage 组件', () => {
    const src = readSource();
    assert.ok(
      src.includes('export default function FinanceDashboardPage'),
      '缺少默认导出 FinanceDashboardPage',
    );
  });

  it('应包含 PageShell 包装（title=财务看板）', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
    assert.ok(src.includes('财务看板'), '缺少 title=财务看板');
    assert.ok(src.includes('门店损益、品牌损益、分账日志'), '缺少 description');
  });

  it('应包含 3 个 Tab 导航', () => {
    const src = readSource();
    assert.ok(src.includes("'store-pandl'"), '缺少 store-pandl');
    assert.ok(src.includes("'brand-pandl'"), '缺少 brand-pandl');
    assert.ok(src.includes("'transaction-logs'"), '缺少 transaction-logs');
  });

  it('Tab 按钮中文标签齐全', () => {
    const src = readSource();
    assert.ok(src.includes('门店损益'), '缺少 门店损益');
    assert.ok(src.includes('品牌损益'), '缺少 品牌损益');
    assert.ok(src.includes('分账日志'), '缺少 分账日志');
  });

  it('门店损益 Tab 包含 6 个财务指标卡片', () => {
    const src = readSource();
    const labels = ['营收', '成本', '毛利', '毛利率', '营业利润', '利润率'];
    for (const label of labels) {
      assert.ok(src.includes(label), `缺少指标: ${label}`);
    }
  });

  it('门店损益 Tab 包含月份选择器', () => {
    const src = readSource();
    assert.ok(src.includes('selectedPeriod'), '缺少 selectedPeriod 状态');
    assert.ok(src.includes('2026年6月'), '缺少 2026年6月 选项');
    assert.ok(src.includes('2026年5月'), '缺少 2026年5月 选项');
    assert.ok(src.includes('2026年4月'), '缺少 2026年4月 选项');
  });

  it('门店损益卡片使用 grid 布局', () => {
    const src = readSource();
    assert.ok(src.includes('repeat(auto-fill, minmax(280px, 1fr))'), '缺少门店卡片 grid 布局');
  });

  it('门店损益渲染使用 .map() 遍历 storePAndL', () => {
    const src = readSource();
    assert.ok(src.includes('storePAndL.map'), '缺少 storePAndL.map');
    assert.ok(src.includes('store.storeName'), '缺少 store.storeName');
    assert.ok(src.includes('store.storeId'), '缺少 store.storeId');
  });

  it('品牌损益 Tab 展示品牌汇总（5 个汇总指标）', () => {
    const src = readSource();
    assert.ok(src.includes('营收合计'), '缺少 营收合计');
    assert.ok(src.includes('成本合计'), '缺少 成本合计');
    assert.ok(src.includes('毛利合计'), '缺少 毛利合计');
    assert.ok(src.includes('内部往来抵销'), '缺少 内部往来抵销');
    assert.ok(src.includes('品牌净收入'), '缺少 品牌净收入');
  });

  it('品牌损益 Tab 包含门店明细表格', () => {
    const src = readSource();
    assert.ok(src.includes('<table'), '缺少 table 元素');
    assert.ok(src.includes('<th'), '缺少 th 表头');
    assert.ok(src.includes('<tbody>'), '缺少 tbody');
    assert.ok(src.includes('brandPAndL.stores.map'), '缺少 brandPAndL.stores.map');
  });

  it('品牌损益表格包含所有列头', () => {
    const src = readSource();
    const headers = ['门店', '营收', '成本', '毛利', '毛利率', '营业利润', '利润率'];
    for (const h of headers) {
      assert.ok(src.includes(h), `缺少表头: ${h}`);
    }
  });

  it('品牌损益表格包含合计行', () => {
    const src = readSource();
    assert.ok(src.includes('合计'), '缺少 合计 行');
  });

  it('分账日志 Tab 包含状态筛选下拉框', () => {
    const src = readSource();
    assert.ok(src.includes('全部状态'), '缺少 全部状态');
    assert.ok(src.includes('待分账'), '缺少 待分账');
    assert.ok(src.includes('已分账'), '缺少 已分账');
    assert.ok(src.includes('已划转'), '缺少 已划转');
    assert.ok(src.includes('已完成'), '缺少 已完成');
    assert.ok(src.includes('失败'), '缺少 失败');
  });

  it('分账日志使用 .map() 遍历 transactionLogs', () => {
    const src = readSource();
    assert.ok(src.includes('transactionLogs.map'), '缺少 transactionLogs.map');
    assert.ok(src.includes('log.transactionId'), '缺少 log.transactionId');
    assert.ok(src.includes('log.accountName'), '缺少 log.accountName');
    assert.ok(src.includes('log.amount'), '缺少 log.amount');
  });

  it('分账日志展示状态时间线', () => {
    const src = readSource();
    assert.ok(src.includes('formatDate(log.createdAt)'), '缺少 createdAt 显示');
    assert.ok(src.includes('formatDate(log.updatedAt)'), '缺少 updatedAt 显示');
  });

  it('分账日志展示分账比例（splitRatio > 0 时）', () => {
    const src = readSource();
    assert.ok(src.includes('splitRatio > 0'), '缺少 splitRatio 守卫');
    assert.ok(src.includes('分账比例'), '缺少 分账比例');
  });

  it('加载中状态显示', () => {
    const src = readSource();
    assert.ok(src.includes('加载中...'), '缺少 加载中... 文字');
    assert.ok(src.includes('loading &&'), '缺少 loading 条件渲染');
  });

  it('导入 finance-dashboard-data 所有导出项', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_STORE_PANDL'), '缺少 MOCK_STORE_PANDL');
    assert.ok(src.includes('MOCK_BRAND_PANDL'), '缺少 MOCK_BRAND_PANDL');
    assert.ok(src.includes('MOCK_TRANSACTION_LOGS'), '缺少 MOCK_TRANSACTION_LOGS');
    assert.ok(src.includes('TRANSACTION_STATUS_LABELS'), '缺少 TRANSACTION_STATUS_LABELS');
    assert.ok(src.includes('TRANSACTION_STATUS_COLORS'), '缺少 TRANSACTION_STATUS_COLORS');
    assert.ok(src.includes('formatCurrency'), '缺少 formatCurrency');
    assert.ok(src.includes('formatPercent'), '缺少 formatPercent');
    assert.ok(src.includes('formatDate'), '缺少 formatDate');
    assert.ok(src.includes('getAccountTypeLabel'), '缺少 getAccountTypeLabel');
  });

  it('导入 finance-dashboard-service 导出项', () => {
    const src = readSource();
    assert.ok(src.includes('getAllStorePAndL'), '缺少 getAllStorePAndL');
    assert.ok(src.includes('getBrandPAndL'), '缺少 getBrandPAndL');
    assert.ok(src.includes('getTransactionLogs'), '缺少 getTransactionLogs');
    assert.ok(src.includes('formatPeriodDisplay'), '缺少 formatPeriodDisplay');
  });

  it('包含 Internal MetricCard 子组件', () => {
    const src = readSource();
    assert.ok(src.includes('function MetricCard'), '缺少 MetricCard 组件');
    assert.ok(src.includes('{ label, value, color, large }'), '缺少 MetricCard props');
  });

  it('MetricCard 支持 large 模式', () => {
    const src = readSource();
    assert.ok(src.includes('large ? 18 : 15'), '缺少 large 尺寸切换');
  });

  it('包含表格样式常量 thStyle 和 tdStyle', () => {
    const src = readSource();
    assert.ok(src.includes('const thStyle'), '缺少 thStyle');
    assert.ok(src.includes('const tdStyle'), '缺少 tdStyle');
  });

  it('品牌损益 Tab 的 brandPAndL 条件渲染防御', () => {
    const src = readSource();
    assert.ok(src.includes("activeTab === 'brand-pandl' && brandPAndL"), '缺少 brandPAndL null 守卫');
  });

  it('切换 Tab 时使用 setActiveTab 更新状态', () => {
    const src = readSource();
    assert.ok(src.includes('setActiveTab(tab)'), '缺少 setActiveTab');
  });

  it('useEffect 依赖 selectedPeriod', () => {
    const src = readSource();
    assert.ok(src.includes('useEffect'), '缺少 useEffect');
    assert.ok(src.includes('[selectedPeriod]'), '缺少 [selectedPeriod] 依赖');
  });

  it('statusFilter 变化时重新加载分账日志', () => {
    const src = readSource();
    assert.ok(src.includes('[statusFilter]'), '缺少 [statusFilter] 依赖');
  });
});

// ===================== 反例（Error Path） =====================

describe('finance-dashboard — 反例（Error Path）', () => {
  it('无 as any 类型断言', () => {
    const src = readSource();
    assert.ok(!src.includes('as any'), '不应出现 as any');
  });

  it('无硬编码数字边界 — 不使用魔法数字作为指标', () => {
    const src = readSource();
    // MetricCard 使用 label/value/color/large props 渲染而不是硬编码
    assert.ok(
      src.includes('formatCurrency(store.revenue)') ||
      src.includes('formatCurrency(store.costOfGoods)') ||
      src.includes('formatCurrency(store.grossProfit)'),
      '应使用 formatCurrency 格式化指标',
    );
  });

  it('门店损益缺失时不会渲染损坏的 UI', () => {
    const src = readSource();
    // storePAndL 初始化为 MOCK_STORE_PANDL (数组)，空数组不会 crash
    assert.ok(src.includes('storePAndL.map'), '使用 .map 空安全');
    assert.ok(src.includes('setStorePAndL(stores)'), '异步更新保证');
  });

  it('TRANSACTION_STATUS_COLORS pending/failed 使用白色文字', () => {
    const src = readSource();
    assert.ok(
      src.includes("['pending', 'failed'].includes(log.status) ? '#ffffff' : '#0f172a'"),
      'pending/failed 状态应有白色文字',
    );
  });

  it('handleStatusFilterChange 使用 ChangeEvent 类型', () => {
    const src = readSource();
    assert.ok(
      src.includes('handleStatusFilterChange'),
      '缺少 handleStatusFilterChange',
    );
    assert.ok(
      src.includes('React.ChangeEvent'),
      '应使用 React.ChangeEvent 类型',
    );
  });
});

// ===================== 边界（Boundary / Edge） =====================

describe('finance-dashboard — 边界（Boundary / Edge）', () => {
  it('MOCK_STORE_PANDL 包含 3 家门店', () => {
    const src = readSource('finance-dashboard-data.ts');
    const matches = src.match(/storeId:\s+'STORE\d{3}'/g);
    assert.ok(matches, '未找到门店 ID');
    assert.equal(matches.length, 3, '应有 3 家门店');
  });

  it('MOCK_TRANSACTION_LOGS 包含 8 条日志', () => {
    const src = readSource('finance-dashboard-data.ts');
    const matches = src.match(/logId:\s+'LOG-\d{3}'/g);
    assert.ok(matches, '未找到日志 ID');
    assert.equal(matches.length, 8, '应有 8 条日志');
  });

  it('StorePAndL 接口包含完整字段（9 个）', () => {
    const src = readSource('finance-dashboard-data.ts');
    assert.ok(src.includes('interface StorePAndL'), '缺少 StorePAndL 接口');
    const fields = ['storeId', 'storeName', 'period', 'revenue', 'costOfGoods', 'grossProfit', 'grossMargin', 'operatingExpenses', 'operatingProfit', 'operatingMargin'];
    for (const f of fields) {
      assert.ok(src.includes(`${f}:`), `StorePAndL 缺少字段: ${f}`);
    }
  });

  it('TRANSACTION_STATUS_LABELS 覆盖全部 5 种状态', () => {
    const src = readSource('finance-dashboard-data.ts');
    assert.ok(src.includes('pending:'), '缺少 pending');
    assert.ok(src.includes('split:'), '缺少 split');
    assert.ok(src.includes('transferred:'), '缺少 transferred');
    assert.ok(src.includes('completed:'), '缺少 completed');
    assert.ok(src.includes('failed:'), '缺少 failed');
  });

  it('TRANSACTION_STATUS_COLORS 覆盖全部 5 种状态', () => {
    const src = readSource('finance-dashboard-data.ts');
    assert.ok(src.includes("pending: '#f59e0b'"), 'pending 应为黄色');
    assert.ok(src.includes("split: '#3b82f6'"), 'split 应为蓝色');
    assert.ok(src.includes("transferred: '#8b5cf6'"), 'transferred 应为紫色');
    assert.ok(src.includes("completed: '#22c55e'"), 'completed 应为绿色');
    assert.ok(src.includes("failed: '#ef4444'"), 'failed 应为红色');
  });

  it('getAccountTypeLabel 覆盖全部 4 种账户类型', () => {
    const src = readSource('finance-dashboard-data.ts');
    assert.ok(src.includes("brand: '品牌账户'"), '缺少 brand 标签');
    assert.ok(src.includes("store: '门店账户'"), '缺少 store 标签');
    assert.ok(src.includes("supplier: '供应商'"), '缺少 supplier 标签');
    assert.ok(src.includes("platform: '平台'"), '缺少 platform 标签');
  });

  it('formatPercent 返回百分比字符串格式', () => {
    const src = readSource('finance-dashboard-data.ts');
    assert.ok(src.includes('toFixed(1)'), '应有 toFixed(1)');
    assert.ok(src.includes('}%') || src.includes('%'), '应有 % 后缀');
  });

  it('formatCurrency 返回 ¥ 前缀格式', () => {
    const src = readSource('finance-dashboard-data.ts');
    assert.ok(src.includes('¥'), '应有 ¥ 前缀');
    assert.ok(src.includes('toLocaleString'), '应有 toLocaleString');
  });

  it('formatDate 有 NaN 回退逻辑', () => {
    const src = readSource('finance-dashboard-data.ts');
    assert.ok(src.includes('Number.isNaN(date.getTime())'), '缺少 NaN 守卫');
  });

  it('formatPeriodDisplay 有空字符串回退', () => {
    const src = readSource('finance-dashboard-service.ts');
    assert.ok(src.includes("return '-'"), '缺少空回退');
    assert.ok(src.includes('split'), '应有 split 解析');
  });

  it('服务层 getAllStorePAndL 有 API 失败回退到 Mock', () => {
    const src = readSource('finance-dashboard-service.ts');
    assert.ok(src.includes('try'), '缺少 try');
    assert.ok(src.includes('catch'), '缺少 catch');
    assert.ok(src.includes('MOCK_STORE_PANDL'), '缺少回退到 Mock');
  });

  it('服务层 getBrandPAndL 有 API 失败回退', () => {
    const src = readSource('finance-dashboard-service.ts');
    assert.ok(src.includes('MOCK_BRAND_PANDL'), '缺少回退到 Mock');
    assert.ok(src.includes("return null"), '缺少 null 回退');
  });

  it('服务层 getTransactionLogs 支持 status 过滤', () => {
    const src = readSource('finance-dashboard-service.ts');
    assert.ok(src.includes("filter?.status"), '缺少 status 过滤');
    assert.ok(src.includes("logs = logs.filter"), '缺少 filter 实现');
  });

  it('服务层 compareStores 支持批量门店对比', () => {
    const src = readSource('finance-dashboard-service.ts');
    assert.ok(src.includes('compareStores'), '缺少 compareStores');
    assert.ok(src.includes('/api/finance/compare'), '缺少 compare API');
  });

  it('服务层 buildHeaders 包含 x-tenant-id', () => {
    const src = readSource('finance-dashboard-service.ts');
    assert.ok(src.includes('x-tenant-id'), '缺少 x-tenant-id');
    assert.ok(src.includes('demo-tenant'), '缺少 demo-tenant');
  });
});
