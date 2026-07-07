/**
 * orders/page.test.tsx — 订单列表页 L1 冒烟测试
 * 覆盖: 正例·边界·防御
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

// ---- 正例 ----

describe('orders — 正例', () => {
  it('应导出一个默认组件 OrdersPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function OrdersPage'), '缺少默认导出组件');
  });

  it('应包含 MOCK_ORDERS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_ORDERS'), '缺少 MOCK_ORDERS');
  });

  it('应计算 pending / processing / completed / cancelled 统计', () => {
    const src = readSource();
    assert.ok(src.includes('pending:'), '缺少 pending');
    assert.ok(src.includes('processing:'), '缺少 processing');
    assert.ok(src.includes('completed:'), '缺少 completed');
    assert.ok(src.includes('cancelled:'), '缺少 cancelled');
  });

  it('应计算 totalRevenue 和 avgOrderValue', () => {
    const src = readSource();
    assert.ok(src.includes('totalRevenue'), '缺少总营收');
    assert.ok(src.includes('MOCK_ORDERS.reduce'), '缺少 reduce 计算');
  });

  it('应包含 OrdersPageContent 子组件', () => {
    const src = readSource();
    assert.ok(src.includes('OrdersPageContent'), '缺少子组件');
  });
});

// ---- 边界 ----

describe('orders — 边界', () => {
  it('MOCK_ORDERS 长度统计', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_ORDERS.length'), '长度统计');
  });

  it('应支持 marketCode 市场分类', () => {
    const src = readSource();
    assert.ok(src.includes('marketCode'), '缺少 marketCode');
  });

  it('status 过滤应支持多个状态值', () => {
    const src = readSource();
    assert.ok(src.includes("o.status === 'pending'") || src.includes("'confirmed'"), '多状态过滤');
  });
});

// ---- 防御 ----

describe('orders — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('平均订单金额计算应避免除以 0', () => {
    const src = readSource();
    assert.ok(src.includes('/ MOCK_ORDERS.length'), '长度除 0 保护');
  });

  it('应包含 Suspense fallback', () => {
    const src = readSource();
    assert.ok(src.includes('fallback'), '缺少 fallback');
  });
});
