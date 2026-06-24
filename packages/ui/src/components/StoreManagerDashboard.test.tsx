import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { StoreManagerDashboard } = require('./StoreManagerDashboard');

const BASE_PROPS = {
  storeName: '朝阳旗舰店',
  dailyMetrics: {
    revenue: 52800,
    orderCount: 342,
    avgOrderValue: 154.4,
    newMembers: 12,
    revenueTrend: 5.2,
    orderTrend: -1.3,
    avgValueTrend: 3.1,
    memberTrend: 8.0,
  },
  pendingTasks: [
    { id: '1', title: 'SKU-089 库存不足', type: 'inventory', priority: 'high', createdAt: '10:45' },
    { id: '2', title: '新会员入会审核', type: 'member', priority: 'medium', createdAt: '11:20' },
    { id: '3', title: '订单配送异常', type: 'order', priority: 'high', createdAt: '09:30' },
  ],
  deviceStatus: { total: 48, online: 42, offline: 3, warning: 3, lastCheckAt: '15:30' },
  quickActions: [
    { key: 'scan', label: '扫码入库', primary: true },
    { key: 'report', label: '生成日报' },
    { key: 'inspect', label: '巡店检查', primary: false },
  ],
  lastSyncAt: '16:00',
};

describe('StoreManagerDashboard', () => {
  test('renders store name', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerDashboard, BASE_PROPS));
    assert.match(html, /朝阳旗舰店/);
    assert.match(html, /data-testid="storedashboard-title"/);
  });

  test('renders default title when no storeName', () => {
    const { storeName, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(StoreManagerDashboard, rest));
    assert.match(html, /店长工作台/);
  });

  test('renders dailyMetrics as QuickStats', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerDashboard, BASE_PROPS));
    assert.match(html, /今日营收/);
    assert.match(html, /订单数/);
    assert.match(html, /客单价/);
    assert.match(html, /新增会员/);
    assert.match(html, /¥5\.3万/);
    assert.match(html, /342/);
  });

  test('shows trend indicators', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerDashboard, BASE_PROPS));
    assert.match(html, /同比 \+5\.2%/);
    assert.match(html, /同比 -1\.3%/);
    assert.match(html, /同比 \+3\.1%/);
    assert.match(html, /同比 \+8\.0%/);
  });

  test('renders quick action buttons', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerDashboard, BASE_PROPS));
    assert.match(html, /data-testid="storedashboard-quick-actions"/);
    assert.match(html, /扫码入库/);
    assert.match(html, /生成日报/);
    assert.match(html, /巡店检查/);
  });

  test('renders device status bar', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerDashboard, BASE_PROPS));
    assert.match(html, /data-testid="storedashboard-device-status"/);
    assert.match(html, /总计 48/);
    assert.match(html, /在线 42/);
    assert.match(html, /离线 3/);
    assert.match(html, /告警 3/);
    assert.match(html, /在线率 88%/);
    assert.match(html, /15:30/);
  });

  test('renders pending tasks', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerDashboard, BASE_PROPS));
    assert.match(html, /data-testid="storedashboard-tasks"/);
    assert.match(html, /待办任务/);
    assert.match(html, /SKU-089 库存不足/);
    assert.match(html, /新会员入会审核/);
    assert.match(html, /订单配送异常/);
    assert.match(html, /\(3\)/);
  });

  test('shows empty state when no tasks', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerDashboard, {
      ...BASE_PROPS,
      pendingTasks: [],
    }));
    assert.match(html, /暂无待办任务/);
    assert.doesNotMatch(html, /\(0\)/);
  });

  test('renders loading skeleton', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerDashboard, {
      ...BASE_PROPS,
      loading: true,
    }));
    assert.match(html, /data-testid="storedashboard-loading"/);
    assert.match(html, /正在加载门店数据/);
    assert.doesNotMatch(html, /data-testid="storedashboard-root"/);
  });

  test('renders without deviceStatus when not provided', () => {
    const { deviceStatus, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(StoreManagerDashboard, rest));
    assert.doesNotMatch(html, /data-testid="storedashboard-device-status"/);
  });

  test('renders without quickActions when not provided', () => {
    const { quickActions, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(StoreManagerDashboard, rest));
    assert.doesNotMatch(html, /扫码入库/);
    assert.doesNotMatch(html, /生成日报/);
  });

  test('shows lastSyncAt when provided', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerDashboard, BASE_PROPS));
    assert.match(html, /数据同步: 16:00/);
  });

  test('renders default metrics when no dailyMetrics', () => {
    const { dailyMetrics, ...rest } = BASE_PROPS;
    const html = renderToStaticMarkup(React.createElement(StoreManagerDashboard, rest));
    assert.match(html, /营收/);
    assert.match(html, /订单/);
    assert.match(html, /客单价/);
    assert.match(html, /新会员/);
  });

  test('applies className', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerDashboard, {
      ...BASE_PROPS,
      className: 'custom-dashboard',
    }));
    assert.match(html, /class="custom-dashboard"/);
  });

  test('shows task count badge', () => {
    const html = renderToStaticMarkup(React.createElement(StoreManagerDashboard, BASE_PROPS));
    assert.match(html, /\(3\)/);
  });
});
