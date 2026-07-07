/**
 * ReturnGoodsProcessingPanel.test.tsx — 退换货处理面板 L1 冒烟测试
 * 类型: A-共享组件
 * 覆盖: 正例 + 反例 + 边界
 */

import React from 'react';

const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
);
const { ReturnGoodsProcessingPanel } = require('./ReturnGoodsProcessingPanel');

// ── Mock 工厂 ──

function makeReturnRequest(overrides?: Record<string, unknown>) {
  return {
    id: 'RET-20260708-001',
    orderNo: 'ORD-20260708-1001',
    customerName: '张三',
    customerPhone: '13800138000',
    memberTier: 'gold',
    returnType: 'refund',
    status: 'pending_review',
    appliedAt: '2026-07-08T10:00:00Z',
    handler: undefined,
    remark: undefined,
    items: [
      { sku: 'SKU-A001', name: '电竞椅', spec: '黑色/标准', purchasedQty: 1, returnQty: 1, unitPrice: 29900, defective: false, reason: '尺寸不合适' },
    ],
    refundAmount: 29900,
    exchangeExtra: undefined,
    ...overrides,
  };
}

const SAMPLE_REQUESTS = [
  makeReturnRequest({ id: 'RET-001', status: 'pending_review', returnType: 'refund', refundAmount: 29900 }),
  makeReturnRequest({ id: 'RET-002', status: 'approved', returnType: 'exchange', refundAmount: 0 }),
  makeReturnRequest({ id: 'RET-003', status: 'rejected', returnType: 'repair', refundAmount: 0 }),
  makeReturnRequest({ id: 'RET-004', status: 'closed', returnType: 'refund', refundAmount: 15000 }),
];

// ── 正例 ──

describe('ReturnGoodsProcessingPanel — positive cases', () => {

  test('renders panel title', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: SAMPLE_REQUESTS })
    );
    assert.match(html, /退换货处理/);
  });

  test('renders stats summary - total count', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: SAMPLE_REQUESTS })
    );
    assert.match(html, /总申请数/);
    assert.match(html, />4</);
  });

  test('renders return type labels (refund/exchange/repair)', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: SAMPLE_REQUESTS })
    );
    assert.match(html, /仅退款/);
    assert.match(html, /换货/);
    assert.match(html, /维修/);
  });

  test('renders all status badges', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: SAMPLE_REQUESTS })
    );
    assert.match(html, /待审核/);
    assert.match(html, /已通过/);
    assert.match(html, /已拒绝/);
    assert.match(html, /已关闭/);
  });

  test('renders refund amounts in table', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: SAMPLE_REQUESTS })
    );
    assert.match(html, /299\.00/);
    assert.match(html, /150\.00/);
  });

  test('renders action buttons for each row', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: SAMPLE_REQUESTS })
    );
    const count = (html.match(/>处理</g) || []).length;
    assert.equal(count, 4);
  });

  test('renders all table headers', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: SAMPLE_REQUESTS })
    );
    assert.match(html, /退换单号/);
    assert.match(html, /订单号/);
    assert.match(html, /客户/);
    assert.match(html, /类型/);
    assert.match(html, /商品数/);
    assert.match(html, /退款金额/);
    assert.match(html, /状态/);
    assert.match(html, /申请时间/);
    assert.match(html, /操作/);
  });

  test('renders items count per row', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: SAMPLE_REQUESTS })
    );
    const ones = html.match(/>1</g);
    assert.ok(ones && ones.length >= 3);
  });

  test('renders description line with count', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: SAMPLE_REQUESTS })
    );
    assert.match(html, /共 4 条记录/);
  });

});

// ── 反例 / 防御 ──

describe('ReturnGoodsProcessingPanel — negative / defensive', () => {

  test('handles empty requests gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: [] })
    );
    assert.match(html, /退换货处理/);
    assert.match(html, /0 条记录/);
  });

  test('handles null requests gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: null as any })
    );
    assert.match(html, /退换货处理/);
    assert.match(html, /0 条记录/);
  });

  test('handles undefined requests gracefully', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: undefined as any })
    );
    assert.match(html, /退换货处理/);
    assert.match(html, /0 条记录/);
  });

  test('handles empty items array in a request', () => {
    const req = makeReturnRequest({ items: [] });
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: [req] })
    );
    assert.match(html, /共 1 条记录/);
  });

  test('handles missing memberTier', () => {
    const req = makeReturnRequest({ memberTier: undefined });
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: [req] })
    );
    assert.match(html, /待审核/);
  });

  test('handles missing handler', () => {
    const req = makeReturnRequest({ handler: undefined });
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: [req] })
    );
    assert.match(html, /共 1 条记录/);
  });

  test('handles missing remark', () => {
    const req = makeReturnRequest({ remark: undefined });
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: [req] })
    );
    assert.match(html, /共 1 条记录/);
  });

  test('handles zero refund amount', () => {
    const req = makeReturnRequest({ refundAmount: 0 });
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: [req] })
    );
    assert.match(html, /0\.00/);
  });

  test('handles large refund amount without throwing', () => {
    const req = makeReturnRequest({ refundAmount: 99999999 });
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: [req] })
    );
    assert.match(html, /999999/);
  });

});

// ── 边界条件 ──

describe('ReturnGoodsProcessingPanel — edge cases', () => {

  test('single request renders correctly', () => {
    const req = makeReturnRequest();
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: [req] })
    );
    assert.match(html, /共 1 条记录/);
  });

  test('all three return types render labels', () => {
    const requests = [
      makeReturnRequest({ id: 'R1', returnType: 'refund' }),
      makeReturnRequest({ id: 'R2', returnType: 'exchange' }),
      makeReturnRequest({ id: 'R3', returnType: 'repair' }),
    ];
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests })
    );
    assert.match(html, /仅退款/);
    assert.match(html, /换货/);
    assert.match(html, /维修/);
  });

  test('handles exchangeExtra field without crashing', () => {
    const req = makeReturnRequest({ returnType: 'exchange', exchangeExtra: 5000 });
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: [req] })
    );
    assert.match(html, /换货/);
  });

  test('handles readonly config', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, {
        requests: SAMPLE_REQUESTS,
        config: { readOnly: true },
      })
    );
    assert.match(html, /退换货处理/);
  });

  test('handles custom title', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, {
        requests: SAMPLE_REQUESTS,
        config: { title: '售后退换管理' },
      })
    );
    assert.match(html, /售后退换管理/);
  });

  test('all 7 statuses render without error', () => {
    const allStatuses: string[] = ['pending_review', 'approved', 'rejected', 'return_received', 'refund_issued', 'replacement_sent', 'closed'];
    const requests = allStatuses.map((s) =>
      makeReturnRequest({ id: `s-${s}`, status: s })
    );
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests })
    );
    assert.match(html, /待审核/);
    assert.match(html, /已通过/);
    assert.match(html, /已拒绝/);
    assert.match(html, /已收货/);
    assert.match(html, /已退款/);
    assert.match(html, /已换货/);
    assert.match(html, /已关闭/);
    assert.match(html, /共 7 条记录/);
  });

  test('handles defective items without crashing', () => {
    const item = { sku: 'SKU-D', name: '破损商品', spec: '红色/L', purchasedQty: 1, returnQty: 1, unitPrice: 50000, defective: true, reason: '运输破损' };
    const req = makeReturnRequest({ items: [item] });
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: [req] })
    );
    assert.match(html, /共 1 条记录/);
  });

  test('handles multiple items per request', () => {
    const items = [
      { sku: 'SKU-A', name: '商品A', spec: '红色', purchasedQty: 2, returnQty: 1, unitPrice: 10000, defective: false, reason: '不想要' },
      { sku: 'SKU-B', name: '商品B', spec: '蓝色', purchasedQty: 1, returnQty: 1, unitPrice: 20000, defective: true, reason: '瑕疵' },
    ];
    const req = makeReturnRequest({ items });
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: [req] })
    );
    assert.match(html, />2</); // item count
  });

  test('handles appliedAt date formatting', () => {
    const req = makeReturnRequest();
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: [req] })
    );
    assert.match(html, /07\/08/);
  });

  test('renders QuickStats in the panel', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: SAMPLE_REQUESTS })
    );
    assert.match(html, /退款总额/);
    assert.match(html, /待审核/);
    assert.match(html, /待换货/);
  });

  test('stats show correct pending count', () => {
    const html = renderToStaticMarkup(
      React.createElement(ReturnGoodsProcessingPanel, { requests: SAMPLE_REQUESTS })
    );
    assert.match(html, />1</);
  });

});
