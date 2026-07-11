/**
 * orders/page.test.tsx — 订单列表页 L1 冒烟测试 (storefront-web)
 * 覆盖: 正例·边界·防御
 * 
 * page.tsx 使用完整内联实现（mock数据+逻辑+弹窗），不依赖 external components/OrdersPage
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

  it('应包含订单数据 mock 生成逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('generateMockOrders'), '缺少 mock 数据生成');
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
  });
});

describe('orders — 边界', () => {
  it('应支持分页', () => {
    const src = readSource();
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
    assert.ok(src.includes('pageItems'), '缺少分页数据切片');
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
  });
});

describe('orders — 防御', () => {
  it('应包含 React 导入', () => {
    const src = readSource();
    assert.ok(src.includes('import React'), '缺少 React 导入');
  });

  it('订单详情弹窗应支持 null 防御', () => {
    const src = readSource();
    assert.ok(src.includes('if (!order) return null'), '缺少 null 防御');
  });

  it('包含时间线渲染', () => {
    const src = readSource();
    assert.ok(src.includes('创建订单'), '缺少时间线');
    assert.ok(src.includes('formatDateTime'), '缺少时间格式化');
  });
});
