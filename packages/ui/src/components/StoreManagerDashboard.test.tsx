import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { StoreManagerDashboard } = require('./StoreManagerDashboard');

const defaultMetrics = {
  revenue: 52800,
  orderCount: 342,
  avgOrderValue: 154.4,
  newMembers: 12,
  revenueTrend: 5.2,
  orderTrend: -1.3,
  avgValueTrend: 3.1,
  memberTrend: 8.0,
};

const defaultTasks = [
  { id: 't1', title: 'SKU-089 库存不足，需补货', type: 'inventory' as const, priority: 'high' as const, createdAt: '10:45' },
  { id: 't2', title: '会员 138****5678 等级变更审核', type: 'member' as const, priority: 'medium' as const, createdAt: '11:02' },
  { id: 't3', title: '订单 #ORD-20240614-012 异常退款', type: 'order' as const, priority: 'high' as const, createdAt: '11:15' },
];

const defaultDeviceStatus = {
  total: 48,
  online: 42,
  offline: 3,
  warning: 3,
  lastCheckAt: '11:50',
};

const defaultActions = [
  { key: 'scan', label: '扫码入库', primary: true },
  { key: 'order', label: '创建订单' },
  { key: 'member', label: '会员管理' },
  { key: 'report', label: '营业报表' },
];

describe('StoreManagerDashboard', () => {
  // ==================== 基础渲染 ====================

  test('渲染门店名称', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        storeName: '朝阳旗舰店',
      })
    );
    assert.match(html, /朝阳旗舰店/);
  });

  test('未传入 storeName 时显示默认标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {})
    );
    assert.match(html, /店长工作台/);
  });

  // ==================== 运营指标 ====================

  test('渲染今日营收指标', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
      })
    );
    assert.match(html, /今日营收/);
    assert.match(html, /5\.3万/); // 52800 → 5.3万 (toFixed(1) rounds)
    assert.match(html, /\+5\.2%/); // 同比趋势
  });

  test('渲染订单数指标', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
      })
    );
    assert.match(html, /订单数/);
    assert.match(html, />342</);
    assert.match(html, /-1\.3%/); // 同比下降
  });

  test('渲染客单价指标', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
      })
    );
    assert.match(html, /客单价/);
    assert.match(html, /154\.4/);
    assert.match(html, /\+3\.1%/);
  });

  test('渲染新增会员指标', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
      })
    );
    assert.match(html, /新增会员/);
    assert.match(html, />12</);
    assert.match(html, /\+8\.0%/);
  });

  test('无 dailyMetrics 时显示占位', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {})
    );
    assert.match(html, /营收/);
    assert.match(html, /--/);
  });

  // ==================== 同步时间 ====================

  test('渲染最后同步时间', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
        lastSyncAt: '2026-06-14 11:52',
      })
    );
    assert.match(html, /2026-06-14 11:52/);
  });

  // ==================== 快速操作 ====================

  test('渲染快速操作按钮', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
        quickActions: defaultActions,
      })
    );
    assert.match(html, /扫码入库/);
    assert.match(html, /创建订单/);
    assert.match(html, /会员管理/);
    assert.match(html, /营业报表/);
  });

  test('无 quickActions 时不渲染操作栏', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
      })
    );
    assert.ok(!html.includes('扫码入库'));
  });

  // ==================== 设备状态 ====================

  test('渲染设备状态摘要', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
        deviceStatus: defaultDeviceStatus,
      })
    );
    assert.match(html, /设备状态/);
    assert.match(html, /总计 48/);
    assert.match(html, /在线 42/);
    assert.match(html, /离线 3/);
    assert.match(html, /告警 3/);
  });

  test('渲染在线率', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
        deviceStatus: defaultDeviceStatus,
      })
    );
    // 42/48 = 87.5%
    assert.match(html, /88%/);
  });

  test('渲染最后检查时间', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
        deviceStatus: defaultDeviceStatus,
      })
    );
    assert.match(html, /11:50/);
  });

  test('无 deviceStatus 时不渲染设备条', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
      })
    );
    assert.ok(!html.includes('设备状态'));
  });

  // ==================== 待办任务 ====================

  test('渲染待办任务标题', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
        pendingTasks: defaultTasks,
      })
    );
    assert.match(html, /待办任务/);
    assert.match(html, /\(3\)/); // 任务数量
  });

  test('渲染任务内容与类型标签', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
        pendingTasks: defaultTasks,
      })
    );
    assert.match(html, /库存不足/);
    assert.match(html, /等级变更审核/);
    assert.match(html, /异常退款/);
  });

  test('渲染任务优先级标签', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
        pendingTasks: defaultTasks,
      })
    );
    assert.match(html, /高/);
    assert.match(html, /中/);
  });

  test('空待办任务显示空消息', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
        pendingTasks: [],
      })
    );
    assert.match(html, /暂无待办任务/);
  });

  // ==================== 加载状态 ====================

  test('loading 状态显示骨架占位', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        loading: true,
      })
    );
    assert.match(html, /正在加载门店数据/);
    // 应该不渲染指标
    assert.ok(!html.includes('今日营收'));
  });

  // ==================== 紧凑模式 ====================

  test('compact 模式使用 2 列统计', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
        compact: true,
      })
    );
    assert.match(html, /repeat\(2/);
  });

  test('compact 模式最多显示 5 条任务并提示省略', () => {
    const manyTasks = Array.from({ length: 8 }, (_, i) => ({
      id: `t${i}`,
      title: `任务 ${i + 1}`,
      type: 'inventory' as const,
      priority: 'low' as const,
      createdAt: '12:00',
    }));
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: defaultMetrics,
        pendingTasks: manyTasks,
        compact: true,
      })
    );
    assert.match(html, /还有 3 条待办/);
  });

  // ==================== 趋势颜色 ====================

  test('正向趋势显示绿色', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: { ...defaultMetrics, revenueTrend: 10, orderTrend: 5, avgValueTrend: 2, memberTrend: 3 },
      })
    );
    assert.match(html, /#4ade80/); // 绿色
    assert.ok(!html.includes('#f87171')); // 没有红色
  });

  test('负向趋势显示红色', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: { ...defaultMetrics, revenueTrend: -8, orderTrend: -5, avgValueTrend: -2, memberTrend: -3 },
      })
    );
    assert.match(html, /#f87171/); // 红色
  });
});
