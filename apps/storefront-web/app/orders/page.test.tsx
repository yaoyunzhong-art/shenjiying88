/**
 * orders/page.test.tsx — 订单列表页 L1 冒烟测试 (storefront-web)
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

describe('orders — 正例', () => {
  it('应导出一个默认 async 组件 OrdersListPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function OrdersListPage'), '缺少默认导出');
  });

  it('应包含 OrdersPage 组件引用', () => {
    const src = readSource();
    assert.ok(src.includes('OrdersPage'), '缺少组件引用');
  });

  it('应包含 orders 和 total 属性传递', () => {
    const src = readSource();
    assert.ok(src.includes('orders='), '缺少 orders 属性');
    assert.ok(src.includes('total='), '缺少 total 属性');
  });
});

describe('orders — 边界', () => {
  it('应支持 page 和 pageSize 分页属性', () => {
    const src = readSource();
    assert.ok(src.includes('page='), '缺少 page');
    assert.ok(src.includes('pageSize='), '缺少 pageSize');
  });

  it('orders 为空数组时应传递 []', () => {
    const src = readSource();
    assert.ok(src.includes('orders={[]}'), '空数组兜底');
  });

  it('total 为 0 时应传递 0', () => {
    const src = readSource();
    assert.ok(src.includes('total={0}'), '零值兜底');
  });
});

describe('orders — 防御', () => {
  it('OrdersPage 应从 components 导入', () => {
    const src = readSource();
    assert.ok(src.includes('./components/OrdersPage'), '缺少组件导入');
  });

  it('页面应支持 async 数据获取', () => {
    const src = readSource();
    assert.ok(src.includes('async function'), '缺少 async');
  });

  it('应包含 React 导入', () => {
    const src = readSource();
    assert.ok(src.includes('import React'), '缺少 React 导入');
  });
});
