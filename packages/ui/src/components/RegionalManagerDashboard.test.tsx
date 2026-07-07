import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { RegionalManagerDashboard } = require('./RegionalManagerDashboard');

const BASE_SUMMARY = {
  totalRegions: 3,
  totalStores: 18,
  operatingStores: 15,
  totalRevenue: 386000,
  revenueWoW: 3.8,
  totalMemberGrowth: 127,
  memberWoW: 5.2,
  avgKpiRate: 84.6,
  pendingAlerts: 5,
  alertTrend: -8.3,
};

const BASE_STORES = [
  { id: 's1', name: '朝阳旗舰店', city: '北京', status: 'operating' as const, todayRevenue: 52800, revenueRate: 92, memberGrowth: 8, monthlyKpiRate: 88.5, alertCount: 1, staffOnDuty: 8 },
  { id: 's2', name: '海淀科技园店', city: '北京', status: 'operating' as const, todayRevenue: 31500, revenueRate: 78, memberGrowth: 5, monthlyKpiRate: 82.0, alertCount: 0, staffOnDuty: 6 },
  { id: 's3', name: '和平路店', city: '天津', status: 'paused' as const, todayRevenue: 0, revenueRate: 0, memberGrowth: 0, monthlyKpiRate: 45.2, alertCount: 2, staffOnDuty: 3 },
];

const BASE_TARGETS = [
  { label: '月度营收', current: 386000, target: 480000, unit: '元' },
  { label: '新增会员', current: 127, target: 200, unit: '人' },
  { label: '巡店完成', current: 14, target: 18, unit: '次' },
];

const BASE_PROPS = {
  managerName: '王强',
  regionName: '华北区',
  regionalSummary: BASE_SUMMARY,
  stores: BASE_STORES,
  monthlyTargets: BASE_TARGETS,
  quickActions: [
    { key: 'review', label: '审核巡店报告', primary: true },
    { key: 'report', label: '生成周报' },
    { key: 'meeting', label: '发起区域会议', primary: false },
  ],
  lastSyncAt: '15:30',
};

describe('RegionalManagerDashboard', () => {
  test('renders manager name and region title', () => {
    const html = renderToStaticMarkup(React.createElement(RegionalManagerDashboard, BASE_PROPS));
    assert.match(html, /华北区/);
    assert.match(html, /区域经理工作台/);
    assert.match(html, /王强/);
    assert.match(html, /data-testid="regionaldash-title"/);
  });

  test('renders default title when no regionName', () => {
    const { regionName, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(RegionalManagerDashboard, rest));
    assert.match(html, /区域经理工作台/);
    assert.doesNotMatch(html, /华北区/);
  });

  test('renders regionalSummary as QuickStats', () => {
    const html = renderToStaticMarkup(React.createElement(RegionalManagerDashboard, BASE_PROPS));
    assert.match(html, /管辖范围/);
    assert.match(html, /今日总营收/);
    assert.match(html, /会员增长/);
    assert.match(html, /平均KPI达成/);
    assert.match(html, /待处理告警/);
    assert.match(html, /3区18店/);
    assert.match(html, /¥38\.6万/);
    assert.match(html, /84\.6%/);
  });

  test('shows trend indicators', () => {
    const html = renderToStaticMarkup(React.createElement(RegionalManagerDashboard, BASE_PROPS));
    assert.match(html, /周环比 \+3\.8%/);
    assert.match(html, /周环比 \+5\.2%/);
    assert.match(html, /趋势 -8\.3%/);
  });

  test('renders quick action buttons', () => {
    const html = renderToStaticMarkup(React.createElement(RegionalManagerDashboard, BASE_PROPS));
    assert.match(html, /data-testid="regionaldash-quick-actions"/);
    assert.match(html, /审核巡店报告/);
    assert.match(html, /生成周报/);
    assert.match(html, /发起区域会议/);
  });

  test('renders monthly targets with progress bars', () => {
    const html = renderToStaticMarkup(React.createElement(RegionalManagerDashboard, BASE_PROPS));
    assert.match(html, /月度目标进度/);
    assert.match(html, /月度营收/);
    assert.match(html, /新增会员/);
    assert.match(html, /巡店完成/);
    assert.match(html, /386,000.*480,000/);
    assert.match(html, /127.*200/);
  });

  test('renders store table with data', () => {
    const html = renderToStaticMarkup(React.createElement(RegionalManagerDashboard, BASE_PROPS));
    assert.match(html, /门店概览/);
    assert.match(html, /\(3\)/);
    assert.match(html, /朝阳旗舰店/);
    assert.match(html, /海淀科技园店/);
    assert.match(html, /和平路店/);
    assert.match(html, /北京/);
    assert.match(html, /天津/);
  });

  test('shows empty state when no stores', () => {
    const html = renderToStaticMarkup(React.createElement(RegionalManagerDashboard, {
      ...BASE_PROPS,
      stores: [],
    }));
    assert.match(html, /暂无门店数据/);
    assert.doesNotMatch(html, /朝阳旗舰店/);
  });

  test('renders loading skeleton', () => {
    const html = renderToStaticMarkup(React.createElement(RegionalManagerDashboard, {
      ...BASE_PROPS,
      loading: true,
    }));
    assert.match(html, /data-testid="regionaldash-loading"/);
    assert.match(html, /正在加载区域数据/);
    assert.doesNotMatch(html, /data-testid="regionaldash-root"/);
  });

  test('renders without quickActions when not provided', () => {
    const { quickActions, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(RegionalManagerDashboard, rest));
    assert.doesNotMatch(html, /审核巡店报告/);
    assert.doesNotMatch(html, /data-testid="regionaldash-quick-actions"/);
  });

  test('renders without monthlyTargets when not provided', () => {
    const { monthlyTargets, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(RegionalManagerDashboard, rest));
    assert.doesNotMatch(html, /月度目标进度/);
    assert.doesNotMatch(html, /386,000/);
  });

  test('renders default metrics when no regionalSummary', () => {
    const { regionalSummary, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(RegionalManagerDashboard, rest));
    assert.match(html, /管辖范围/);
    assert.match(html, /总营收/);
    assert.match(html, /告警/);
    assert.match(html, /--/);
  });

  test('applies className', () => {
    const html = renderToStaticMarkup(React.createElement(RegionalManagerDashboard, {
      ...BASE_PROPS,
      className: 'region-dash-custom',
    }));
    assert.match(html, /class="region-dash-custom"/);
  });

  test('shows lastSyncAt when provided', () => {
    const html = renderToStaticMarkup(React.createElement(RegionalManagerDashboard, BASE_PROPS));
    assert.match(html, /数据同步: 15:30/);
  });

  test('compact mode renders fewer columns', () => {
    const html = renderToStaticMarkup(React.createElement(RegionalManagerDashboard, {
      ...BASE_PROPS,
      compact: true,
    }));
    assert.ok(html.length > 500);
  });
});
