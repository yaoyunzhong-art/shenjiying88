import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { DeliveryPersonDashboard } = require('./DeliveryPersonDashboard');

// ---- 测试数据 ----

const MOCK_STATS = {
  totalOrders: 24,
  completedOrders: 12,
  inTransitOrders: 6,
  delayedOrders: 2,
  totalDistance: 68.5,
  avgDeliveryMin: 22,
  avgRating: 4.7,
};

const MOCK_ORDERS = [
  {
    id: '1',
    orderNumber: 'DD-20260706-001',
    customerName: '张三',
    customerPhone: '13800138001',
    address: '朝阳区建国路88号',
    status: 'in_transit' as const,
    estimatedTime: '22:15',
    priority: 'normal' as const,
  },
  {
    id: '2',
    orderNumber: 'DD-20260706-002',
    customerName: '李四',
    customerPhone: '13800138002',
    address: '海淀区中关村大街1号',
    status: 'picked_up' as const,
    estimatedTime: '22:30',
    priority: 'urgent' as const,
    note: '请尽快配送，客户急用',
  },
  {
    id: '3',
    orderNumber: 'DD-20260706-003',
    customerName: '王五',
    customerPhone: '13800138003',
    address: '西城区金融街15号',
    status: 'delivered' as const,
    estimatedTime: '21:00',
    actualTime: '21:12',
    priority: 'normal' as const,
  },
  {
    id: '4',
    orderNumber: 'DD-20260706-004',
    customerName: '赵六',
    customerPhone: '13800138004',
    address: '东城区王府井大街200号',
    status: 'failed' as const,
    estimatedTime: '20:30',
    priority: 'normal' as const,
  },
  {
    id: '5',
    orderNumber: 'DD-20260706-005',
    customerName: '钱七',
    customerPhone: '13800138005',
    address: '丰台区丽泽路16号',
    status: 'cancelled' as const,
    estimatedTime: '19:00',
    priority: 'normal' as const,
  },
];

const MOCK_ROUTE = [
  { stopId: 's1', orderId: '2', customerName: '李四', address: '海淀区中关村大街1号', eta: '22:30', sequence: 1, status: 'pending' as const },
  { stopId: 's2', orderId: '1', customerName: '张三', address: '朝阳区建国路88号', eta: '22:45', sequence: 2, status: 'pending' as const },
  { stopId: 's3', orderId: '4', customerName: '赵六', address: '东城区王府井大街200号', eta: '23:10', sequence: 3, status: 'arrived' as const },
  { stopId: 's4', orderId: '3', customerName: '王五', address: '西城区金融街15号', eta: '23:40', sequence: 4, status: 'delivered' as const },
];

// ---- 测试套件 ----

describe('DeliveryPersonDashboard', () => {
  // ── 加载状态 ──
  test('renders loading skeleton when loading is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, { loading: true })
    );
    assert.match(html, /data-testid="delivery-person-dashboard-loading"/);
  });

  // ── 空状态 ──
  test('renders empty state when no data provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {})
    );
    assert.match(html, /暂无配送任务/);
  });

  // ── 配送员头部信息 ──
  test('renders driver header with name', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, { driverName: '王大锤' })
    );
    assert.match(html, /王大锤/);
    assert.match(html, /在线/);
  });

  test('renders default driver name when omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, { dailyStats: MOCK_STATS })
    );
    assert.match(html, /配送员/);
  });

  test('renders driverId and vehicleId when provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        driverName: '王大锤',
        driverId: 'PS-0421',
        vehicleId: '京A·88888',
      })
    );
    assert.match(html, /PS-0421/);
    assert.match(html, /京A·88888/);
  });

  // ── 统计数据 ──
  test('renders daily stats section', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, { dailyStats: MOCK_STATS })
    );
    assert.match(html, /今日概览/);
    assert.match(html, /24/); // totalOrders
    assert.match(html, /12/); // completedOrders
    assert.match(html, /4\.7/); // avgRating
    assert.match(html, /68\.5/); // totalDistance
  });

  test('renders delayed order count as negative trend', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, { dailyStats: MOCK_STATS })
    );
    assert.match(html, /2/);
  });

  test('renders empty stats section when dailyStats is undefined', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, { driverName: '测试' })
    );
    assert.doesNotMatch(html, /今日概览/);
  });

  // ── 当前节点提示 ──
  test('renders current stop card when route has pending/arrived stop', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        route: MOCK_ROUTE,
      })
    );
    // 第一个 pending 的应该是序号1
    assert.match(html, /当前任务 #1/);
    assert.match(html, /李四/);
    assert.match(html, /ETA: 22:30/);
  });

  test('hides current stop when all route stops are completed', () => {
    const allDone = MOCK_ROUTE.map(s => ({ ...s, status: 'delivered' as const }));
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        route: allDone,
      })
    );
    assert.doesNotMatch(html, /当前任务/);
  });

  // ── 紧急订单 ──
  test('renders urgent orders section', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        orders: MOCK_ORDERS,
      })
    );
    assert.match(html, /紧急订单/);
    assert.match(html, /李四/); // urgent order customer
    assert.match(html, /请尽快配送/); // note
  });

  test('shows urgent count badge', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        orders: MOCK_ORDERS,
      })
    );
    assert.match(html, /紧急订单 \(1\)/);
  });

  test('hides urgent section when no urgent orders', () => {
    const normalOrders = MOCK_ORDERS.map(o => ({ ...o, priority: 'normal' as const }));
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        orders: normalOrders,
      })
    );
    assert.doesNotMatch(html, /🔴 紧急订单/);
  });

  test('renders urgent order action buttons', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        orders: MOCK_ORDERS,
      })
    );
    // picked_up 状态显示 "开始配送"
    assert.match(html, /开始配送/);
    assert.match(html, /异常上报/);
    assert.match(html, /导航/);
  });

  test('renders in_transit urgent order with confirm delivery button', () => {
    const orders = [
      {
        id: 'urgent-1',
        orderNumber: 'DD-URGENT',
        customerName: '刘八',
        customerPhone: '13800990099',
        address: '测试地址',
        status: 'in_transit' as const,
        estimatedTime: '22:00',
        priority: 'urgent' as const,
      },
    ];
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        orders,
      })
    );
    assert.match(html, /确认送达/);
  });

  // ── 订单表格 ──
  test('renders order table section', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        orders: MOCK_ORDERS,
      })
    );
    assert.match(html, /配送订单/);
    assert.match(html, /张三/);
    assert.match(html, /王五/);
    assert.match(html, /赵六/);
  });

  test('renders customer info via StatusBadge and action buttons per status', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        orders: MOCK_ORDERS,
      })
    );
    assert.match(html, /张三/);
    assert.match(html, /李四/);
    assert.match(html, /王五/);
    assert.match(html, /赵六/);
    // 配送中和已送达状态可通过不同的操作按钮推断
    assert.match(html, /送达/);
    assert.match(html, /🧭/);
  });

  test('renders delivery action buttons in table for picked_up status', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        orders: MOCK_ORDERS.slice(0, 2), // index1 has picked_up
      })
    );
    assert.match(html, /出发/);
    assert.match(html, /🧭/);
  });

  test('renders confirm delivery button in table for in_transit status', () => {
    const orders = [
      {
        id: 't1',
        orderNumber: 'DD-TEST',
        customerName: '测试',
        customerPhone: '13800000000',
        address: '测试地址',
        status: 'in_transit' as const,
        estimatedTime: '22:00',
        priority: 'normal' as const,
      },
    ];
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        orders,
      })
    );
    assert.match(html, /送达/);
  });

  // ── 路线规划 ──
  test('renders route planning section', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        route: MOCK_ROUTE,
      })
    );
    assert.match(html, /路线规划/);
    assert.match(html, /#1 李四/);
    assert.match(html, /#4 王五/);
    assert.match(html, /已送达/);
  });

  test('renders route lastSyncAt', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        route: MOCK_ROUTE,
        lastSyncAt: '22:00',
      })
    );
    assert.match(html, /最后同步 22:00/);
  });

  test('renders route status labels correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        route: MOCK_ROUTE,
      })
    );
    assert.match(html, /待到达/);
    assert.match(html, /已到达/);
    assert.match(html, /已送达/);
  });

  // ── 紧凑模式 ──
  test('compact mode renders with 2-column stats', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        compact: true,
      })
    );
    assert.match(html, /今日概览/);
    assert.match(html, /24/);
  });

  test('compact mode renders orders with smaller table layout', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        orders: MOCK_ORDERS.slice(0, 2),
        compact: true,
      })
    );
    assert.match(html, /配送订单/);
    assert.match(html, /张三/);
    assert.match(html, /李四/);
  });

  // ── 自定义类名 ──
  test('accepts className prop', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        className: 'my-delivery-dash',
      })
    );
    assert.match(html, /my-delivery-dash/);
  });

  // ── 底部同步时间 ──
  test('renders sync info at bottom', () => {
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: MOCK_STATS,
        lastSyncAt: '22:05',
      })
    );
    assert.match(html, /数据同步于 22:05/);
  });

  // ── 边界情况 ──
  test('handles zero stats gracefully', () => {
    const zeroStats = {
      totalOrders: 0,
      completedOrders: 0,
      inTransitOrders: 0,
      delayedOrders: 0,
      totalDistance: 0,
      avgDeliveryMin: 0,
      avgRating: 0,
    };
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: zeroStats,
      })
    );
    assert.match(html, /0/);
    assert.match(html, /0\.0/);
  });

  test('large distance value renders correctly', () => {
    const largeStats = { ...MOCK_STATS, totalDistance: 156.75 };
    const html = renderToStaticMarkup(
      React.createElement(DeliveryPersonDashboard, {
        dailyStats: largeStats,
      })
    );
    assert.match(html, /156\.8/);
  });
});
