import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { OrderDetailWithStatusFlow } = require('./OrderDetailWithStatusFlow');

const mockOrder = {
  id: 'ord-001',
  orderNo: 'ORD-20260707-0001',
  status: 'pending_approval',
  customerName: '张三',
  customerPhone: '13800138000',
  amount: 2999.00,
  createdAt: '2026-07-07 14:30:00',
  updatedAt: '2026-07-07 14:30:00',
};

const mockTransitions = [
  {
    from: 'pending_approval',
    to: 'approved',
    actionLabel: '审核通过',
    variant: 'primary',
    requiresConfirm: true,
    confirmTitle: '确认审核通过',
    confirmDescription: '确定要通过此订单审核吗？',
  },
  {
    from: 'pending_approval',
    to: 'rejected',
    actionLabel: '驳回',
    variant: 'danger',
    requiresConfirm: true,
    confirmDescription: '确定要驳回此订单吗？',
    requiresRemark: true,
    remarkPlaceholder: '请填写驳回原因',
  },
  {
    from: 'approved',
    to: 'processing',
    actionLabel: '开始处理',
    variant: 'primary',
  },
  {
    from: 'pending_approval',
    to: 'cancelled',
    actionLabel: '取消订单',
    variant: 'danger',
    requiresConfirm: true,
    confirmDescription: '确定要取消此订单吗？',
  },
];

describe('OrderDetailWithStatusFlow', () => {
  test('renders order basic info correctly', () => {
    const html = renderToStaticMarkup(
      React.createElement(OrderDetailWithStatusFlow, { order: mockOrder })
    );
    assert.match(html, /ORD-20260707-0001/);
    assert.match(html, /张三/);
    assert.match(html, /13800138000/);
    assert.match(html, /2,999|2999/);
  });

  test('renders status label', () => {
    const html = renderToStaticMarkup(
      React.createElement(OrderDetailWithStatusFlow, { order: mockOrder })
    );
    assert.match(html, /待审核/);
  });

  test('renders all 5 status step labels', () => {
    const html = renderToStaticMarkup(
      React.createElement(OrderDetailWithStatusFlow, { order: mockOrder })
    );
    assert.match(html, /待审核/);
    assert.match(html, /已审核/);
    assert.match(html, /处理中/);
    assert.match(html, /已发货/);
    assert.match(html, /已完成/);
  });

  test('renders transition action buttons for pending_approval status', () => {
    const html = renderToStaticMarkup(
      React.createElement(OrderDetailWithStatusFlow, {
        order: mockOrder,
        transitions: mockTransitions,
      })
    );
    assert.match(html, /审核通过/);
    assert.match(html, /驳回/);
    assert.match(html, /取消订单/);
  });

  test('does not render irrelevant transitions for completed status', () => {
    const completedOrder = { ...mockOrder, status: 'completed' };
    const html = renderToStaticMarkup(
      React.createElement(OrderDetailWithStatusFlow, {
        order: completedOrder,
        transitions: mockTransitions,
      })
    );
    assert.equal(html.includes('审核通过'), false);
    assert.equal(html.includes('驳回'), false);
    assert.equal(html.includes('开始处理'), false);
  });

  test('renders extra sections', () => {
    const extraSections = [
      {
        title: '商品明细',
        items: [
          { label: '商品名称', value: '高档沙发' },
          { label: '数量', value: '1' },
        ],
      },
    ];
    const html = renderToStaticMarkup(
      React.createElement(OrderDetailWithStatusFlow, {
        order: mockOrder,
        extraSections: extraSections,
      })
    );
    assert.match(html, /商品明细/);
    assert.match(html, /高档沙发/);
  });

  test('renders breadcrumbs', () => {
    const html = renderToStaticMarkup(
      React.createElement(OrderDetailWithStatusFlow, {
        order: mockOrder,
        breadcrumbs: [
          { label: '首页' },
          { label: '订单管理' },
          { label: '订单详情' },
        ],
      })
    );
    assert.match(html, /首页/);
    assert.match(html, /订单管理/);
    assert.match(html, /订单详情/);
  });

  test('renders back link', () => {
    const html = renderToStaticMarkup(
      React.createElement(OrderDetailWithStatusFlow, {
        order: mockOrder,
        backLink: { label: '返回订单列表', href: '/orders' },
      })
    );
    assert.match(html, /返回订单列表/);
  });

  test('renders error state', () => {
    const html = renderToStaticMarkup(
      React.createElement(OrderDetailWithStatusFlow, {
        order: mockOrder,
        error: '无法获取订单数据',
      })
    );
    assert.match(html, /无法获取订单数据/);
  });

  test('handles different order status variants without crashing', () => {
    const statuses = ['approved', 'rejected', 'processing', 'shipped', 'completed', 'cancelled', 'returned'];
    for (const status of statuses) {
      const order = { ...mockOrder, status };
      const html = renderToStaticMarkup(
        React.createElement(OrderDetailWithStatusFlow, { order })
      );
      assert.ok(html.length > 0, `Rendered empty for status: ${status}`);
    }
  });
});
