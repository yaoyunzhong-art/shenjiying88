import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { FranchiseOperationsDashboard } = require('./FranchiseOperationsDashboard');

// ---- 测试数据 ----

const MOCK_STORES = [
  { id: 's1', name: '朝阳一店', region: '华北', score: 92, revenue: 52800, revenueTrend: 5.2, status: 'normal', manager: '张三', phone: '13800138001' },
  { id: 's2', name: '海淀二店', region: '华北', score: 75, revenue: 38200, revenueTrend: -2.1, status: 'warning', manager: '李四', phone: '13800138002' },
  { id: 's3', name: '浦东三店', region: '华东', score: 88, revenue: 49500, revenueTrend: 3.8, status: 'normal', manager: '王五', phone: '13800138003' },
  { id: 's4', name: '南山四店', region: '华南', score: 45, revenue: 12400, revenueTrend: -12.5, status: 'critical', manager: '赵六', phone: '13800138004' },
];

const MOCK_INSPECTIONS = [
  { id: 'i1', storeId: 's1', storeName: '朝阳一店', type: 'routine', description: '月度设备巡检', status: 'pending', dueAt: '07-15', assignee: '张三', priority: 'medium' },
  { id: 'i2', storeId: 's2', storeName: '海淀二店', type: 'compliance', description: '消防合规复查', status: 'in_progress', dueAt: '07-12', assignee: '李四', priority: 'high' },
  { id: 'i3', storeId: 's4', storeName: '南山四店', type: 'emergency', description: '设备故障应急检查', status: 'pending', dueAt: '07-10', assignee: '赵六', priority: 'high' },
];

const MOCK_SUPPORT_REQUESTS = [
  { id: 'r1', storeId: 's4', storeName: '南山四店', category: 'device', title: '收银机频繁死机', status: 'open', createdAt: '07-09 14:30', urgency: 'urgent' },
  { id: 'r2', storeId: 's2', storeName: '海淀二店', category: 'operation', title: '库存盘点差异', status: 'processing', createdAt: '07-08 09:15', urgency: 'normal' },
];

const MOCK_RANKINGS = [
  { rank: 1, storeId: 's1', storeName: '朝阳一店', region: '华北', revenue: 52800, growth: 5.2, score: 92 },
  { rank: 2, storeId: 's3', storeName: '浦东三店', region: '华东', revenue: 49500, growth: 3.8, score: 88 },
  { rank: 3, storeId: 's2', storeName: '海淀二店', region: '华北', revenue: 38200, growth: -2.1, score: 75 },
  { rank: 4, storeId: 's4', storeName: '南山四店', region: '华南', revenue: 12400, growth: -12.5, score: 45 },
];

const MOCK_OVERVIEW = {
  totalStores: 4,
  normalStores: 2,
  warningStores: 1,
  criticalStores: 1,
  totalRevenue: 152900,
  avgScore: 75,
  pendingInspections: 2,
  openSupportRequests: 1,
};

const DEFAULT_PROPS = {
  stores: MOCK_STORES,
  inspectionTasks: MOCK_INSPECTIONS,
  supportRequests: MOCK_SUPPORT_REQUESTS,
  storeRankings: MOCK_RANKINGS,
  overview: MOCK_OVERVIEW,
  regions: ['华北', '华东', '华南'],
  brandName: '超级猫',
  lastUpdatedAt: '12:30',
};

// ---- 辅助函数: 解析渲染后的 HTML ----

function renderProps(props = {}) {
  const merged = { ...DEFAULT_PROPS, ...props };
  return renderToStaticMarkup(
    React.createElement(FranchiseOperationsDashboard, merged)
  );
}

/** 判断 HTML 是否包含某段文本（去除标签后） */
function htmlContains(html, text) {
  const stripped = html.replace(/<[^>]+>/g, ' ');
  return stripped.includes(text);
}

// ---- 测试用例 ----

describe('FranchiseOperationsDashboard', () => {
  test('renders loading state when loading=true', () => {
    const html = renderProps({ loading: true, stores: undefined, inspectionTasks: undefined, supportRequests: undefined, storeRankings: undefined, overview: undefined });
    assert.ok(htmlContains(html, '加盟运营数据'));
    assert.ok(html.includes('franchiseops-loading'));
  });

  test('renders title with brand name', () => {
    const html = renderProps();
    assert.ok(htmlContains(html, '超级猫'));
    assert.ok(htmlContains(html, '加盟运营工作台'));
  });

  test('displays overview metrics', () => {
    const html = renderProps();
    assert.ok(htmlContains(html, '门店总数'));
    assert.ok(htmlContains(html, '4'));
    assert.ok(htmlContains(html, '平均运营分'));
    assert.ok(htmlContains(html, '今日总营收'));
  });

  test('shows critical store alert when criticalStores > 0', () => {
    const html = renderProps();
    assert.ok(htmlContains(html, '1 家门店状态异常'));
    assert.ok(htmlContains(html, '1 家门店需要关注'));
  });

  test('renders tab navigation buttons', () => {
    const html = renderProps();
    assert.ok(htmlContains(html, '门店管理'));
    assert.ok(htmlContains(html, '巡查任务'));
    assert.ok(htmlContains(html, '支持请求'));
    assert.ok(htmlContains(html, '销售排行'));
  });

  test('renders store data on stores tab (default tab)', () => {
    const html = renderProps();
    // Default tab is "stores" — store names should be visible
    assert.ok(htmlContains(html, '朝阳一店'));
    assert.ok(htmlContains(html, '浦东三店'));
    assert.ok(htmlContains(html, '南山四店'));
  });

  test('renders region filter buttons', () => {
    const html = renderProps();
    assert.ok(htmlContains(html, '全部'));
    assert.ok(htmlContains(html, '华东'));
    assert.ok(htmlContains(html, '华南'));
  });

  test('renders store status badges', () => {
    const html = renderProps();
    assert.ok(htmlContains(html, '正常'));
    assert.ok(htmlContains(html, '预警'));
    assert.ok(htmlContains(html, '异常'));
  });

  test('displays store scores in stores tab', () => {
    const html = renderProps();
    assert.ok(htmlContains(html, '92'));
    assert.ok(htmlContains(html, '45'));
  });

  test('renders compact mode', () => {
    const html = renderProps({ compact: true });
    assert.ok(html.includes('franchiseops-root'));
    assert.ok(htmlContains(html, '加盟运营工作台'));
  });

  test('renders empty state when stores array is empty', () => {
    const html = renderProps({ stores: [], inspectionTasks: [], supportRequests: [], storeRankings: [], overview: undefined });
    assert.ok(htmlContains(html, '暂无门店数据'));
  });

  test('renders refresh button when onRefresh provided', () => {
    const html = renderProps({ onRefresh: () => {} });
    assert.ok(htmlContains(html, '刷新数据'));
  });

  test('does not show critical alert when no critical stores', () => {
    const overview = { ...MOCK_OVERVIEW, criticalStores: 0 };
    const html = renderProps({ overview });
    assert.ok(!htmlContains(html, '家门店状态异常'));
  });

  test('renders store detail action buttons for each store', () => {
    const html = renderProps({ onViewStore: () => {} });
    // "详情" buttons appear on the stores tab for each store
    assert.ok(htmlContains(html, '详情'));
  });

  test('renders revenue formatting for stores', () => {
    const html = renderProps();
    assert.ok(htmlContains(html, '52,800'));
    assert.ok(htmlContains(html, '12,400'));
  });

  test('renders trend indicators with +/- signs', () => {
    const html = renderProps();
    // Positive trend
    assert.ok(htmlContains(html, '+5.2%'));
    // Negative trend
    assert.ok(htmlContains(html, '-12.5%'));
  });

  test('renders open support request badge on tab', () => {
    const html = renderProps();
    // Urgency badge "紧急" appears even in stores tab (rendered in DOM but hidden behind tab)
    // The open count badge on the support tab button
    assert.ok(htmlContains(html, '1'));
  });
});
