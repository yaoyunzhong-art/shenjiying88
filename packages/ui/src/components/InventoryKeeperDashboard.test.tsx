import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { InventoryKeeperDashboard } = require('./InventoryKeeperDashboard');

// ---- 测试数据 ----

const MOCK_METRICS = {
  totalSku: 1520,
  totalStock: 48500,
  todayInbound: 12,
  todayOutbound: 18,
  stockValue: 3260000,
  lowStockCount: 5,
  expiryWarningCount: 3,
  locationUtilization: 0.72,
};

const MOCK_ALERTS = [
  { id: 'a1', sku: 'SKU-001', name: '蓝牙耳机', category: '数码', currentQty: 8, minQty: 50, status: 'low_stock' as const, updatedAt: '10:30', location: 'A-01-02' },
  { id: 'a2', sku: 'SKU-053', name: '矿泉水', category: '饮品', currentQty: 1200, minQty: 100, status: 'overstock' as const, updatedAt: '09:15', location: 'B-03-01' },
  { id: 'a3', sku: 'SKU-107', name: '进口牛奶', category: '食品', currentQty: 45, minQty: 20, status: 'expiring' as const, updatedAt: '昨天', location: 'B-01-04' },
];

const MOCK_INBOUND = [
  { id: 'i1', orderNo: 'IN-20260628-001', supplier: '广州供应链公司', skuCount: 8, totalQty: 240, status: 'pending' as const, createdAt: '09:30', operator: '张三' },
  { id: 'i2', orderNo: 'IN-20260628-002', supplier: '本地食品厂', skuCount: 3, totalQty: 60, status: 'inspecting' as const, createdAt: '10:15', operator: '李四' },
];

const MOCK_OUTBOUND = [
  { id: 'o1', orderNo: 'OUT-20260628-001', destination: '朝阳旗舰店', skuCount: 5, totalQty: 120, priority: 'high' as const, status: 'picking' as const, createdAt: '08:45' },
  { id: 'o2', orderNo: 'OUT-20260628-002', destination: '海淀分店', skuCount: 12, totalQty: 360, priority: 'medium' as const, status: 'pending' as const, createdAt: '09:00' },
];

const MOCK_ACTIONS = [
  { key: 'scanIn', label: '扫码入库', icon: '📥', primary: true },
  { key: 'scanOut', label: '扫码出库', icon: '📤' },
  { key: 'inventory', label: '盘点', icon: '📋' },
  { key: 'transfer', label: '调拨', icon: '🔄' },
];

// ---- 测试套件 ----

describe('InventoryKeeperDashboard', () => {
  // ── 加载状态 ──
  test('renders loading skeleton when loading is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(InventoryKeeperDashboard, { loading: true })
    );
    assert.match(html, /data-testid="keeper-loading"/);
    assert.match(html, /正在加载库存数据/);
  });

  // ── 错误状态 ──
  test('renders error state', () => {
    const html = renderToStaticMarkup(
      React.createElement(InventoryKeeperDashboard, {
        error: '网络连接失败，无法获取库存数据',
      })
    );
    assert.match(html, /data-testid="keeper-error"/);
    assert.match(html, /网络连接失败/);
    assert.match(html, /data-testid="keeper-retry"/);
  });

  // ── 完整数据渲染 ──
  test('renders dashboard with full data', () => {
    const html = renderToStaticMarkup(
      React.createElement(InventoryKeeperDashboard, {
        warehouseName: '中心仓库',
        metrics: MOCK_METRICS,
        stockAlerts: MOCK_ALERTS,
        inboundTasks: MOCK_INBOUND,
        outboundTasks: MOCK_OUTBOUND,
        quickActions: MOCK_ACTIONS,
      })
    );
    // 标题
    assert.match(html, /仓库工作台/);
    assert.match(html, /中心仓库/);
    // 指标
    assert.match(html, /1,520/);
    assert.match(html, /48,500/);
    assert.match(html, /326\.0万/);
    assert.match(html, /72%/);
    // 预警数量
    assert.match(html, /低库存 5/);
    assert.match(html, /临期 3/);
    // 快速操作
    assert.match(html, /data-testid="keeper-action-scanIn"/);
    assert.match(html, /扫码入库/);
    assert.match(html, /扫码出库/);
    assert.match(html, /盘点/);
    assert.match(html, /调拨/);
    // 入库
    assert.match(html, /IN-20260628-001/);
    assert.match(html, /IN-20260628-002/);
    assert.match(html, /广州供应链公司/);
    // 出库
    assert.match(html, /OUT-20260628-001/);
    assert.match(html, /朝阳旗舰店/);
    assert.match(html, /海淀分店/);
    // 预警表格
    assert.match(html, /SKU-001/);
    assert.match(html, /蓝牙耳机/);
    assert.match(html, /SKU-053/);
    assert.match(html, /低库存/);
    // 入库/出库标题
    assert.match(html, /入库待处理/);
    assert.match(html, /出库待处理/);
    assert.match(html, /库存预警/);
  });

  // ── 空数据渲染 ──
  test('renders empty state when no data', () => {
    const html = renderToStaticMarkup(
      React.createElement(InventoryKeeperDashboard, {
        metrics: MOCK_METRICS,
        stockAlerts: [],
        inboundTasks: [],
        outboundTasks: [],
      })
    );
    assert.match(html, /暂无待处理入库单/);
    assert.match(html, /暂无待处理出库单/);
    assert.match(html, /暂无库存预警/);
  });

  // ── 无快速操作 ──
  test('hides quick action section when empty', () => {
    const html = renderToStaticMarkup(
      React.createElement(InventoryKeeperDashboard, {
        metrics: MOCK_METRICS,
        quickActions: [],
      })
    );
    assert.doesNotMatch(html, /快速操作/);
  });

  // ── 默认仓库名称 ──
  test('uses default warehouse name when not provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(InventoryKeeperDashboard, {
        metrics: MOCK_METRICS,
      })
    );
    assert.match(html, /默认仓库/);
  });

  // ── AlertBadge 不同状态颜色 ──
  test('renders alert badges with correct labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(InventoryKeeperDashboard, {
        metrics: MOCK_METRICS,
        stockAlerts: MOCK_ALERTS,
      })
    );
    assert.match(html, /低库存/);
    assert.match(html, /超库存/);
    assert.match(html, /临期/);
  });

  // ── 出库单优先级样式 ──
  test('renders priority dots for outbound tasks', () => {
    const html = renderToStaticMarkup(
      React.createElement(InventoryKeeperDashboard, {
        metrics: MOCK_METRICS,
        outboundTasks: MOCK_OUTBOUND,
      })
    );
    // 高优先级和高亮
    assert.match(html, /high/);
    assert.match(html, /medium/);
  });
});
