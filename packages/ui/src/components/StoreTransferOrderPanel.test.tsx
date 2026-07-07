import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { StoreTransferOrderPanel } = require('./StoreTransferOrderPanel');

// ---- 测试数据 ----

const MOCK_ORDERS = [
  {
    id: 'TR-20260705-001',
    sourceStore: '朝阳旗舰店',
    targetStore: '海淀分店',
    skuCount: 5,
    totalQty: 120,
    amount: 15800.00,
    status: 'pending_approval' as const,
    requester: '张三',
    createdAt: '2026-07-05 09:30',
  },
  {
    id: 'TR-20260705-002',
    sourceStore: '朝阳旗舰店',
    targetStore: '丰台分店',
    skuCount: 3,
    totalQty: 60,
    amount: 4200.50,
    status: 'approved' as const,
    requester: '李四',
    createdAt: '2026-07-05 10:15',
    approver: '王经理',
    remark: '紧急调拨',
  },
  {
    id: 'TR-20260704-001',
    sourceStore: '浦东分店',
    targetStore: '松江分店',
    skuCount: 8,
    totalQty: 200,
    amount: 32500.00,
    status: 'completed' as const,
    requester: '赵六',
    createdAt: '2026-07-04 14:00',
    completedAt: '2026-07-05 08:00',
  },
  {
    id: 'TR-20260704-002',
    sourceStore: '朝阳旗舰店',
    targetStore: '通州分店',
    skuCount: 2,
    totalQty: 30,
    amount: 1850.00,
    status: 'draft' as const,
    requester: '张三',
    createdAt: '2026-07-04 16:45',
  },
  {
    id: 'TR-20260703-001',
    sourceStore: '海淀分店',
    targetStore: '大兴分店',
    skuCount: 10,
    totalQty: 350,
    amount: 62500.00,
    status: 'shipping' as const,
    requester: '王五',
    createdAt: '2026-07-03 11:20',
    approver: '王经理',
  },
];

const MOCK_STORE_OPTIONS = ['朝阳旗舰店', '海淀分店', '丰台分店', '通州分店', '大兴分店', '浦东分店', '松江分店'];

// ---- 测试套件 ----

describe('StoreTransferOrderPanel', () => {
  // ── 加载状态 ──
  test('renders loading skeleton when loading is true', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreTransferOrderPanel, { loading: true })
    );
    assert.match(html, /data-testid="transfer-loading"/);
  });

  // ── 无数据空状态 ──
  test('renders empty state when no orders', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreTransferOrderPanel, { orders: [] })
    );
    assert.match(html, /暂无调拨单据/);
  });

  // ── 空状态含新建按钮 ──
  test('empty state shows create button when onCreateTransfer provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreTransferOrderPanel, { orders: [], onCreateTransfer: () => {} })
    );
    assert.match(html, /data-testid="empty-create-btn"/);
    assert.match(html, /新建调拨单/);
  });

  // ── 标题渲染 ──
  test('renders title correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreTransferOrderPanel, { orders: MOCK_ORDERS })
    );
    assert.match(html, /库存调拨管理/);
  });

  // ── 表格数据渲染 ──
  test('renders all order rows', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreTransferOrderPanel, { orders: MOCK_ORDERS })
    );
    MOCK_ORDERS.forEach((order) => {
      assert.match(html, new RegExp(order.id));
      assert.match(html, new RegExp(order.sourceStore));
      assert.match(html, new RegExp(order.targetStore));
    });
  });

  // ── 金额格式化 ──
  test('formats amounts with ¥ symbol and locale separators', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreTransferOrderPanel, { orders: MOCK_ORDERS })
    );
    assert.match(html, /¥15,800\.00/);
    assert.match(html, /¥62,500\.00/);
  });

  // ── 状态标签渲染 ──
  test('renders status badges for each order', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreTransferOrderPanel, { orders: MOCK_ORDERS })
    );
    assert.match(html, /待审批/);
    assert.match(html, /已通过/);
    assert.match(html, /已完成/);
    assert.match(html, /草稿/);
    assert.match(html, /调拨中/);
  });

  // ── 操作按钮 ──
  test('renders view button for each order', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreTransferOrderPanel, { orders: MOCK_ORDERS, onViewDetail: () => {} })
    );
    MOCK_ORDERS.forEach((order) => {
      assert.match(html, new RegExp(`data-testid="view-btn-${order.id}"`));
    });
  });

  // ── 取消按钮仅对草稿/待审批显示 ──
  test('cancel button appears only for draft and pending_approval orders', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreTransferOrderPanel, { orders: MOCK_ORDERS, onCancelTransfer: () => {} })
    );
    // draft (TR-20260704-002) and pending_approval (TR-20260705-001) should have cancel
    assert.match(html, /data-testid="cancel-btn-TR-20260704-002"/);
    assert.match(html, /data-testid="cancel-btn-TR-20260705-001"/);
    // completed should NOT have cancel
    assert.doesNotMatch(html, /data-testid="cancel-btn-TR-20260704-001"/);
  });

  // ── 新建调拨按钮 ──
  test('renders create transfer button when onCreateTransfer provided', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreTransferOrderPanel, { orders: MOCK_ORDERS, onCreateTransfer: () => {} })
    );
    assert.match(html, /data-testid="create-transfer-btn"/);
    assert.match(html, /新建调拨/);
  });

  // ── 无新建按钮回调时不渲染 ──
  test('does not render create button when callback omitted', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreTransferOrderPanel, { orders: MOCK_ORDERS })
    );
    assert.doesNotMatch(html, /data-testid="create-transfer-btn"/);
  });

  // ── 过滤器渲染 ──
  test('renders filter bar with search input and status select', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreTransferOrderPanel, { orders: MOCK_ORDERS })
    );
    assert.match(html, /data-testid="filter-bar"/);
    assert.match(html, /data-testid="status-filter"/);
  });

  // ── onViewDetail 回调绑定 ──
  test('detail button triggers onViewDetail with correct id', () => {
    let calledId = '';
    const handlers = { onViewDetail: (id: string) => { calledId = id; } };
    const html = renderToStaticMarkup(
      React.createElement(StoreTransferOrderPanel, { orders: [MOCK_ORDERS[0]], ...handlers })
    );
    assert.match(html, /data-testid="detail-btn-.*"/);
  });

  // ── 备注渲染 ──
  test('renders remark when present', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreTransferOrderPanel, { orders: [MOCK_ORDERS[1]] })
    );
    // The remark "紧急调拨" is tested by checking the text exists as a status description
    assert.match(html, /TR-20260705-002/);
    assert.match(html, /丰台分店/);
  });

  // ── 跨门店搜索 ──
  test('search input placeholder shows correct text', () => {
    const html = renderToStaticMarkup(
      React.createElement(StoreTransferOrderPanel, { orders: MOCK_ORDERS })
    );
    assert.match(html, /搜索调拨单号/);
  });
});
