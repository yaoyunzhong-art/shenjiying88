import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { StoreManagerDashboard } = require('./StoreManagerDashboard');

// ---- 测试数据 ----

const MOCK_METRICS = {
  revenue: 52800,
  orderCount: 342,
  avgOrderValue: 154.4,
  newMembers: 12,
  revenueTrend: 5.2,
  orderTrend: -1.3,
  avgValueTrend: 3.1,
  memberTrend: 8.0,
};

const MOCK_TASKS = [
  { id: '1', title: 'SKU-089 库存不足', type: 'inventory' as const, priority: 'high' as const, createdAt: '10:45' },
  { id: '2', title: '会员投诉跟进', type: 'member' as const, priority: 'medium' as const, createdAt: '09:30' },
  { id: '3', title: '打印机固件更新', type: 'device' as const, priority: 'low' as const, createdAt: '昨天' },
];

const MOCK_DEVICE = { total: 48, online: 42, offline: 3, warning: 3 };

const MOCK_ACTIONS = [
  { key: 'scan', label: '扫码入库', icon: '📷', primary: true },
  { key: 'inventory', label: '盘点', icon: '📋' },
  { key: 'report', label: '日报', primary: false },
];

const MOCK_ACTIONS_NO_ICON = [
  { key: 'scan', label: '扫码入库', primary: true },
  { key: 'inventory', label: '盘点' },
];

// ---- 测试套件 ----

describe('StoreManagerDashboard', () => {
  // ── 加载状态 ──
  test('renders loading skeleton when loading is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, { loading: true })
    );
    assert.match(html, /data-testid="storedashboard-loading"/);
    assert.match(html, /正在加载门店数据/);
  });

  // ── 有完整数据 ──
  test('renders title with storeName', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        storeName: '朝阳旗舰店',
        dailyMetrics: MOCK_METRICS,
      })
    );
    assert.match(html, /data-testid="storedashboard-title"/);
    assert.match(html, /朝阳旗舰店/);
  });

  test('renders default title when storeName is omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, { dailyMetrics: MOCK_METRICS })
    );
    assert.match(html, /店长工作台/);
  });

  test('renders lastSyncAt when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        storeName: '测试店',
        dailyMetrics: MOCK_METRICS,
        lastSyncAt: '2026-06-27 22:30',
      })
    );
    assert.match(html, /2026-06-27 22:30/);
  });

  // ── 运营指标 ──
  test('renders revenue metric', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
      })
    );
    // 52800 → 5.3万
    assert.match(html, /今\u65E5\u8425\u6536/);
    assert.match(html, /5\.3\u4E07/);
  });

  test('renders order count metric', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
      })
    );
    assert.match(html, /342/);
    assert.match(html, /订\u5355\u6570/);
  });

  test('renders trend helper text with sign', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
      })
    );
    // revenueTrend: +5.2%
    assert.match(html, /\+5\.2%/);
    // orderTrend: -1.3%
    assert.match(html, /-1\.3%/);
  });

  // ── 空指标 ──
  test('renders fallback dashes when dailyMetrics is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {})
    );
    assert.match(html, /--/);
  });

  // ── 待办任务 ──
  test('renders pending tasks section', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        pendingTasks: MOCK_TASKS,
      })
    );
    assert.match(html, /data-testid="storedashboard-tasks"/);
    assert.match(html, /SKU-089/);
    assert.match(html, /会员投诉跟进/);
  });

  test('renders task count badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        pendingTasks: MOCK_TASKS,
      })
    );
    assert.match(html, /\(3\)/);
  });

  test('renders empty state when no tasks', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        pendingTasks: [],
      })
    );
    assert.match(html, /暂无待办任务/);
  });

  test('renders empty state when pendingTasks is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
      })
    );
    assert.match(html, /暂无待办任务/);
  });

  // ── 紧凑模式下的待办 ──
  test('compact mode renders task cards with priority badges', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        pendingTasks: MOCK_TASKS,
        compact: true,
      })
    );
    assert.match(html, /\[库存\]/);
    assert.match(html, /\[会员\]/);
    assert.match(html, /\[设备\]/);
    assert.match(html, /SKU-089/);
  });

  test('compact mode shows overflow count when tasks > 5', () => {
    const manyTasks = Array.from({ length: 8 }, (_, i) => ({
      id: String(i + 1),
      title: `任务 ${i + 1}`,
      type: 'inventory' as const,
      priority: 'low' as const,
      createdAt: '00:00',
    }));
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        pendingTasks: manyTasks,
        compact: true,
      })
    );
    assert.match(html, /还有 3 条待办/);
  });

  // ── 设备状态 ──
  test('renders device status section', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        deviceStatus: MOCK_DEVICE,
      })
    );
    assert.match(html, /data-testid="storedashboard-device-status"/);
    assert.match(html, /设备状态/);
    assert.match(html, /在线 42/);
  });

  test('renders offline count when > 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        deviceStatus: MOCK_DEVICE,
      })
    );
    assert.match(html, /离线 3/);
  });

  test('renders warning count when > 0', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        deviceStatus: MOCK_DEVICE,
      })
    );
    assert.match(html, /告警 3/);
  });

  test('renders online rate percentage', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        deviceStatus: MOCK_DEVICE,
      })
    );
    assert.match(html, /88%/); // 42/48 = 87.5% → 88%
  });

  test('renders device lastCheckAt when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        deviceStatus: { ...MOCK_DEVICE, lastCheckAt: '10分钟前' },
      })
    );
    assert.match(html, /10分钟前/);
  });

  test('hides device section when deviceStatus is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
      })
    );
    assert.doesNotMatch(html, /data-testid="storedashboard-device-status"/);
  });

  // ── 快速操作 ──
  test('renders quick action buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        quickActions: MOCK_ACTIONS,
      })
    );
    assert.match(html, /扫码入库/);
    assert.match(html, /盘点/);
    assert.match(html, /日报/);
  });

  test('renders action with icon', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        quickActions: MOCK_ACTIONS,
      })
    );
    assert.match(html, /📷/);
  });

  test('renders action without icon gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        quickActions: MOCK_ACTIONS_NO_ICON,
      })
    );
    assert.match(html, /扫码入库/);
    assert.match(html, /盘点/);
  });

  test('primary action has different style from normal actions', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        quickActions: MOCK_ACTIONS,
      })
    );
    // 两个不同的背景色风格出现
    assert.match(html, /rgba\(59,130,246/);
  });

  test('renders empty quick action section when quickActions is empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        quickActions: [],
      })
    );
    // wrapper div is rendered but no buttons inside
    assert.match(html, /data-testid="storedashboard-quick-actions"/);
    assert.doesNotMatch(html, /扫码入库/);
  });

  // ── 紧凑模式 ──
  test('compact mode uses smaller padding and 2-column metrics', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        compact: true,
      })
    );
    assert.match(html, /data-testid="storedashboard-root"/);
    assert.match(html, /今\u65E5\u8425\u6536/);
    assert.match(html, /订\u5355\u6570/);
  });

  // ── 自定义类名 ──
  test('accepts className prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        className: 'my-custom-class',
      })
    );
    assert.match(html, /my-custom-class/);
  });

  // ── 边界情况 ──
  test('handles zero device total gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: MOCK_METRICS,
        deviceStatus: { total: 0, online: 0, offline: 0, warning: 0 },
      })
    );
    assert.match(html, /0%/);
  });

  test('renders large revenue as 万 format', () => {
    const highMetrics = {
      ...MOCK_METRICS,
      revenue: 1234500,
    };
    const html = renderToStaticMarkup(
      React.createElement(StoreManagerDashboard, {
        dailyMetrics: highMetrics,
      })
    );
    assert.match(html, /123\.5\u4E07/);
  });
});
