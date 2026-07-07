import React from 'react';

const assert = require('node:assert/strict');
const { test } = require('node:test');

const { ReceiptPreview } = require('./ReceiptPreview');
const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88';
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js',
);

const MOCK_DATA = {
  header: {
    storeName: '朝阳旗舰店',
    storeAddress: '北京市朝阳区建国路88号',
    storePhone: '010-88886666',
    tagline: '品质美妆 悦享生活',
  },
  receiptNo: 'RX-20260706-0001',
  cashier: '张三',
  createdAt: '2026-07-06T15:30:00+08:00',
  items: [
    { name: '玫瑰精华面霜', quantity: 2, unitPrice: 298 },
    { name: '玻尿酸补水面膜', quantity: 1, unitPrice: 129 },
    { name: '唇釉 #05', quantity: 3, unitPrice: 79 },
  ],
  payments: [
    { method: 'wechat' as const, amount: 764, transactionId: 'WX2026070600001' },
  ],
  change: 0,
  note: '感谢您的支持，欢迎再次光临！',
};

function renderHTML(props: Record<string, unknown> = {}) {
  return renderToStaticMarkup(React.createElement(ReceiptPreview, props));
}

test('ReceiptPreview: renders store name from data', () => {
  const html = renderHTML({ data: MOCK_DATA });
  assert.ok(html.includes('朝阳旗舰店'), 'should show store name');
});

test('ReceiptPreview: renders receipt number', () => {
  const html = renderHTML({ data: MOCK_DATA });
  assert.ok(html.includes('RX-20260706-0001'), 'should show receipt no');
});

test('ReceiptPreview: renders cashier name', () => {
  const html = renderHTML({ data: MOCK_DATA });
  assert.ok(html.includes('张三'), 'should show cashier');
});

test('ReceiptPreview: renders all line items', () => {
  const html = renderHTML({ data: MOCK_DATA });
  assert.ok(html.includes('玫瑰精华面霜'), 'should render item 1');
  assert.ok(html.includes('玻尿酸补水面膜'), 'should render item 2');
  assert.ok(html.includes('唇釉 #05'), 'should render item 3');
});

test('ReceiptPreview: renders quantity values for items', () => {
  const html = renderHTML({ data: MOCK_DATA });
  // 2 + 1 + 3 = 6 个数量标记 (present once each)
  assert.ok(html.includes('>2<'));
  assert.ok(html.includes('>1<'));
  assert.ok(html.includes('>3<'));
});

test('ReceiptPreview: renders payment method label', () => {
  const html = renderHTML({ data: MOCK_DATA });
  assert.ok(html.includes('微信支付'), 'should show wechat pay label');
});

test('ReceiptPreview: renders transaction id', () => {
  const html = renderHTML({ data: MOCK_DATA });
  assert.ok(html.includes('WX2026070600001'));
});

test('ReceiptPreview: renders subtotal correctly', () => {
  const html = renderHTML({ data: MOCK_DATA });
  const subtotal = 298 * 2 + 129 * 1 + 79 * 3;
  assert.ok(html.includes(`¥${subtotal.toFixed(2)}`));
});

test('ReceiptPreview: renders change amount when provided', () => {
  const dataWithChange = {
    ...MOCK_DATA,
    change: 36.5,
    payments: [{ ...MOCK_DATA.payments[0], amount: 800 }],
  };
  const html = renderHTML({ data: dataWithChange });
  assert.ok(html.includes('¥36.50'), 'should show change');
});

test('ReceiptPreview: renders tagline when provided', () => {
  const html = renderHTML({ data: MOCK_DATA });
  assert.ok(html.includes('品质美妆 悦享生活'));
});

test('ReceiptPreview: renders store address', () => {
  const html = renderHTML({ data: MOCK_DATA });
  assert.ok(html.includes('北京市朝阳区建国路88号'));
});

test('ReceiptPreview: renders store phone', () => {
  const html = renderHTML({ data: MOCK_DATA });
  assert.ok(html.includes('010-88886666'));
});

test('ReceiptPreview: renders member info when provided', () => {
  const dataWithMember = {
    ...MOCK_DATA,
    memberName: '李美丽',
    memberPhone: '138****8888',
  };
  const html = renderHTML({ data: dataWithMember });
  assert.ok(html.includes('李美丽'));
  assert.ok(html.includes('138****8888'));
});

test('ReceiptPreview: renders discount when present', () => {
  const dataWithDiscount = {
    ...MOCK_DATA,
    items: [
      { name: '面霜', quantity: 1, unitPrice: 298, discount: 30 },
      { name: '面膜', quantity: 1, unitPrice: 129 },
    ],
  };
  const html = renderHTML({ data: dataWithDiscount });
  assert.ok(html.includes('优惠'), 'discount label should show');
});

test('ReceiptPreview: renders print button', () => {
  const html = renderHTML({ data: MOCK_DATA });
  assert.ok(html.includes('🖨️'), 'should have print icon');
  assert.ok(html.includes('打印小票'), 'should have print label');
});

test('ReceiptPreview: accepts custom test id', () => {
  const html = renderHTML({ data: MOCK_DATA, 'data-testid': 'my-receipt' });
  assert.ok(html.includes('data-testid="my-receipt"'));
});

test('ReceiptPreview: renders footer thank you message', () => {
  const html = renderHTML({ data: MOCK_DATA });
  assert.ok(html.includes('感谢您的惠顾'));
});
