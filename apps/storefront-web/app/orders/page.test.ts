import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SOURCE = resolve(import.meta.dirname, 'page.tsx');
const SRC = readFileSync(SOURCE, 'utf-8');

describe('orders list — 真实接口版结构', () => {
  it('应导出 OrdersListPage 默认组件', () => {
    assert.ok(SRC.includes('export default function OrdersListPage'), '缺少默认导出 OrdersListPage');
  });

  it('应接入真实订单 helper 与三态渲染', () => {
    assert.ok(SRC.includes('loadStorefrontOrders'), '应接入真实订单列表 helper');
    assert.ok(SRC.includes('useTriState'), '应使用 useTriState');
    assert.ok(SRC.includes('TriStateRenderer'), '应使用 TriStateRenderer');
    assert.ok(SRC.includes('loadOrdersPage'), '应存在真实拉单函数');
  });

  it('不应再保留 MOCK_ORDERS 与随机生成逻辑', () => {
    assert.equal(SRC.includes('MOCK_ORDERS'), false, '不应继续引用 MOCK_ORDERS');
    assert.equal(SRC.includes('generateMockOrders'), false, '不应继续保留随机订单生成');
    assert.equal(SRC.includes('OrderDetailDialog'), false, '不应继续保留假详情弹窗');
  });

  it('应保留真实筛选链：搜索 -> 状态 -> 支付方式', () => {
    assert.ok(SRC.includes('searchTerm'), '缺少搜索状态');
    assert.ok(SRC.includes('statusFilter'), '缺少状态筛选');
    assert.ok(SRC.includes('paymentFilter'), '缺少支付筛选');
    assert.ok(SRC.includes('matchesStorefrontOrderStatusFilter'), '应使用共享状态过滤 helper');
    assert.ok(SRC.includes('matchesStorefrontOrderPaymentFilter'), '应使用共享支付过滤 helper');
  });

  it('应点击行跳转真实详情页', () => {
    assert.ok(SRC.includes('router.push(`/orders/${item.id}`)'), '应跳转真实订单详情页');
    assert.ok(SRC.includes('onRowClick={handleRowClick}'), '表格行点击应接到详情跳转');
  });

  it('应继续保留表格、分页与统计卡片', () => {
    assert.ok(SRC.includes('<DataTable'), '缺少 DataTable');
    assert.ok(SRC.includes('<Pagination'), '缺少 Pagination');
    assert.ok(SRC.includes('<StatCard'), '缺少 StatCard');
    assert.ok(SRC.includes('实收金额'), '应展示真实收入统计');
  });
});
