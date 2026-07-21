/**
 * orders/page.test.tsx — 订单列表页真实接口版结构护栏
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, 'page.tsx');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('orders — 正例', () => {
  it('应导出一个默认组件 OrdersListPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function OrdersListPage'), '缺少默认导出');
  });

  it('应接入真实订单 helper 与三态渲染', () => {
    const src = readSource();
    assert.ok(src.includes('loadStorefrontOrders'), '应接入真实订单列表 helper');
    assert.ok(src.includes('useTriState'), '应使用 useTriState');
    assert.ok(src.includes('TriStateRenderer'), '应使用 TriStateRenderer');
    assert.ok(src.includes('loadOrdersPage'), '应存在真实拉单函数');
  });

  it('应包含统计信息和 StatCard', () => {
    const src = readSource();
    assert.ok(src.includes('StatCard'), '缺少 StatCard 组件');
    assert.ok(src.includes('stats.'), '缺少统计数据引用');
  });

  it('应包含 DataTable 表格渲染', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), '缺少 DataTable 组件');
    assert.ok(src.includes('rowKey'), '缺少行键');
  });

  it('应包含搜索过滤逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('SearchFilterInput'), '缺少 SearchFilterInput');
    assert.ok(src.includes('searchTerm'), '缺少搜索状态');
    assert.ok(src.includes('statusFilter'), '缺少状态筛选');
    assert.ok(src.includes('paymentFilter'), '缺少支付方式筛选');
  });

  it('应包含真实订单金额渲染', () => {
    const src = readSource();
    assert.ok(src.includes('totalAmount'), '缺少金额字段');
    assert.ok(src.includes('paidAmount'), '缺少实付金额字段');
  });

  it('应包含订单号渲染', () => {
    const src = readSource();
    assert.ok(src.includes('orderNo') || src.includes('orderId'), '缺少订单号');
  });

  it('应包含会员 ID 渲染', () => {
    const src = readSource();
    assert.ok(src.includes('memberId'), '缺少会员字段');
  });
});

describe('orders — 边界', () => {
  it('应支持分页', () => {
    const src = readSource();
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
    assert.ok(src.includes('pagedData'), '缺少分页数据切片');
  });

  it('应包含 EmptyState 空数据兜底', () => {
    const src = readSource();
    assert.ok(src.includes('EmptyState'), '缺少 EmptyState');
    assert.ok(src.includes('暂无订单'), '缺少空状态文案');
  });

  it('应支持多维筛选（状态+支付方式）', () => {
    const src = readSource();
    assert.ok(src.includes('statusFilter'), '缺少状态筛选');
    assert.ok(src.includes('paymentFilter'), '缺少支付方式筛选');
    assert.ok(src.includes('matchesStorefrontOrderStatusFilter'), '应使用共享状态过滤 helper');
    assert.ok(src.includes('matchesStorefrontOrderPaymentFilter'), '应使用共享支付过滤 helper');
  });

  it('应支持按真实时间字段排序展示', () => {
    const src = readSource();
    assert.ok(src.includes('createdAt'), '缺少时间字段');
  });

  it('应点击行跳转真实详情页', () => {
    const src = readSource();
    assert.ok(src.includes('router.push(`/orders/${item.id}`)'), '应跳转真实详情页');
    assert.ok(src.includes('onRowClick={handleRowClick}'), '应支持行点击');
  });
});

describe('orders — 防御', () => {
  it('应包含 React 导入', () => {
    const src = readSource();
    assert.ok(src.includes('import React'), '缺少 React 导入');
  });

  it('不应再保留 mock 页面遗留结构', () => {
    const src = readSource();
    assert.equal(src.includes('generateMockOrders'), false, '不应继续保留随机 mock 订单');
    assert.equal(src.includes('MOCK_ORDERS'), false, '不应继续保留 MOCK_ORDERS');
    assert.equal(src.includes('OrderDetailDialog'), false, '不应继续保留假详情弹窗');
  });

  it('应包含统计卡片中的真实收入口径', () => {
    const src = readSource();
    assert.ok(src.includes('实收金额'), '应展示真实收入统计');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包 useMemo/useCallback 优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo') || src.includes('useCallback'), '缺少性能优化');
  });

  it('应使用可选链避免深层属性报错', () => {
    const src = readSource();
    assert.ok(src.includes('?.') || src.includes('??'), '缺少可选链');
  });
});
