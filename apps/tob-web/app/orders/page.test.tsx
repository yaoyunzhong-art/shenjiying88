/**
 * orders/page.test.tsx — ToB 订单列表页测试
 * 测试数据层、过滤逻辑、格式化工具函数
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import React from 'react';

// ===== 从页面中提取的格式化函数 =====

function formatAmount(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1000).toFixed(1)}K`;
  return `¥${n}`;
}

// ===== 过滤函数 (与页面保持一致) =====

type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type OrderPaymentStatus = 'unpaid' | 'paid' | 'partial' | 'refunded';

interface OrderItem {
  id: string;
  orderNo: string;
  customerName: string;
  customerCompany: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  paidAmount: number;
  status: OrderStatus;
  paymentStatus: OrderPaymentStatus;
  source: string;
  createdAt: string;
  salesPerson: string;
}

function filterOrders(
  items: OrderItem[],
  searchTerm: string,
  statusFilter: OrderStatus | 'all',
  paymentFilter: OrderPaymentStatus | 'all',
): OrderItem[] {
  let result = items;

  if (searchTerm.trim()) {
    const lower = searchTerm.toLowerCase();
    const fields: (keyof OrderItem)[] = ['orderNo', 'customerName', 'customerCompany', 'productName', 'salesPerson'];
    result = result.filter((o) =>
      fields.some((f) => String(o[f]).toLowerCase().includes(lower)),
    );
  }

  if (statusFilter !== 'all') {
    result = result.filter((o) => o.status === statusFilter);
  }

  if (paymentFilter !== 'all') {
    result = result.filter((o) => o.paymentStatus === paymentFilter);
  }

  return result;
}

// ===== Mock 数据 =====

const MOCK_ORDERS: OrderItem[] = [
  {
    id: 'ord-001',
    orderNo: 'PO-2026-06-0001',
    customerName: '张伟',
    customerCompany: '云帆科技',
    productName: 'CRM系统',
    quantity: 1,
    totalAmount: 298000,
    paidAmount: 298000,
    status: 'delivered',
    paymentStatus: 'paid',
    source: 'contract',
    createdAt: '2026-06-01',
    salesPerson: '赵一鸣',
  },
  {
    id: 'ord-002',
    orderNo: 'PO-2026-06-0002',
    customerName: '李芳',
    customerCompany: '星辰超市',
    productName: '门店管理SaaS',
    quantity: 1,
    totalAmount: 158000,
    paidAmount: 0,
    status: 'pending',
    paymentStatus: 'unpaid',
    source: 'portal',
    createdAt: '2026-06-05',
    salesPerson: '钱丽华',
  },
  {
    id: 'ord-003',
    orderNo: 'PO-2026-06-0003',
    customerName: '王强',
    customerCompany: '汇通金融',
    productName: '风控系统',
    quantity: 2,
    totalAmount: 370000,
    paidAmount: 185000,
    status: 'processing',
    paymentStatus: 'partial',
    source: 'api',
    createdAt: '2026-06-10',
    salesPerson: '孙明阳',
  },
];

const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; variant: string }> = {
  pending: { label: '待确认', variant: 'neutral' },
  confirmed: { label: '已确认', variant: 'info' },
  processing: { label: '处理中', variant: 'warning' },
  shipped: { label: '已发货', variant: 'success' },
  delivered: { label: '已签收', variant: 'success' },
  cancelled: { label: '已取消', variant: 'danger' },
};

const ORDER_PAYMENT_STATUS_MAP: Record<OrderPaymentStatus, { label: string; variant: string }> = {
  unpaid: { label: '未付款', variant: 'danger' },
  paid: { label: '已付款', variant: 'success' },
  partial: { label: '部分付款', variant: 'warning' },
  refunded: { label: '已退款', variant: 'neutral' },
};

const ORDER_SOURCE_MAP: Record<string, string> = {
  manual: '手动录入',
  api: 'API导入',
  portal: '门户下单',
  contract: '合同订单',
};

// ===== 测试 =====

test('formatAmount 格式化金额', () => {
  assert.equal(formatAmount(0), '¥0');
  assert.equal(formatAmount(500), '¥500');
  assert.equal(formatAmount(1500), '¥1.5K');
  assert.equal(formatAmount(298000), '¥298.0K');
  assert.equal(formatAmount(1500000), '¥150.0万');
  assert.equal(formatAmount(6800000), '¥680.0万');
  assert.equal(formatAmount(10000000), '¥1000.0万');
});

test('ORDER_STATUS_MAP 包含所有状态', () => {
  const statuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  for (const s of statuses) {
    assert.ok(ORDER_STATUS_MAP[s], `状态 ${s} 应有映射`);
    assert.equal(typeof ORDER_STATUS_MAP[s].label, 'string');
    assert.equal(typeof ORDER_STATUS_MAP[s].variant, 'string');
  }
});

test('ORDER_PAYMENT_STATUS_MAP 包含所有付款状态', () => {
  const statuses: OrderPaymentStatus[] = ['unpaid', 'paid', 'partial', 'refunded'];
  for (const s of statuses) {
    assert.ok(ORDER_PAYMENT_STATUS_MAP[s], `付款状态 ${s} 应有映射`);
    assert.equal(typeof ORDER_PAYMENT_STATUS_MAP[s].label, 'string');
    assert.equal(typeof ORDER_PAYMENT_STATUS_MAP[s].variant, 'string');
  }
});

test('ORDER_SOURCE_MAP 包含所有订单来源', () => {
  assert.equal(ORDER_SOURCE_MAP.manual, '手动录入');
  assert.equal(ORDER_SOURCE_MAP.api, 'API导入');
  assert.equal(ORDER_SOURCE_MAP.portal, '门户下单');
  assert.equal(ORDER_SOURCE_MAP.contract, '合同订单');
});

test('filterOrders 无筛选返回全部', () => {
  const result = filterOrders(MOCK_ORDERS, '', 'all', 'all');
  assert.equal(result.length, MOCK_ORDERS.length);
});

test('filterOrders 按订单号搜索', () => {
  const result = filterOrders(MOCK_ORDERS, 'PO-2026-06-0001', 'all', 'all');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'ord-001');
});

test('filterOrders 按客户公司名搜索', () => {
  const result = filterOrders(MOCK_ORDERS, '云帆', 'all', 'all');
  assert.equal(result.length, 1);
  assert.equal(result[0].customerCompany, '云帆科技');
});

test('filterOrders 按产品名搜索', () => {
  const result = filterOrders(MOCK_ORDERS, 'CRM', 'all', 'all');
  assert.equal(result.length, 1);
});

test('filterOrders 按业务员搜索', () => {
  const result = filterOrders(MOCK_ORDERS, '赵一鸣', 'all', 'all');
  assert.equal(result.length, 1);
});

test('filterOrders 按状态过滤', () => {
  const result = filterOrders(MOCK_ORDERS, '', 'pending', 'all');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'ord-002');
});

test('filterOrders 按付款状态过滤', () => {
  const result = filterOrders(MOCK_ORDERS, '', 'all', 'unpaid');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'ord-002');
});

test('filterOrders 组合过滤: 状态 + 付款', () => {
  const result = filterOrders(MOCK_ORDERS, '', 'processing', 'partial');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'ord-003');
});

test('filterOrders 搜索无结果返回空数组', () => {
  const result = filterOrders(MOCK_ORDERS, '不存在的订单', 'all', 'all');
  assert.equal(result.length, 0);
});

test('filterOrders 大小写不敏感', () => {
  const lower = filterOrders(MOCK_ORDERS, 'crm', 'all', 'all');
  const upper = filterOrders(MOCK_ORDERS, 'CRM', 'all', 'all');
  assert.equal(lower.length, upper.length);
});

test('filterOrders 搜索+状态+付款三者组合', () => {
  const result = filterOrders(MOCK_ORDERS, '汇通', 'processing', 'partial');
  assert.equal(result.length, 1);
  assert.equal(result[0].customerCompany, '汇通金融');
});
