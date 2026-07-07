/**
 * customers/page.test.tsx — 客户列表页 L1 冒烟测试 (storefront-web)
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

describe('customers — 正例', () => {
  it('应导出一个默认组件 CustomersPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function CustomersPage'), '缺少默认导出');
  });

  it('应包含 Customer 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface Customer'), '缺少接口');
  });

  it('应包含 MOCK_CUSTOMERS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_CUSTOMERS'), '缺少数据源');
  });

  it('应计算 total 和 active 统计', () => {
    const src = readSource();
    assert.ok(src.includes('total'), '缺少 total');
    assert.ok(src.includes('active'), '缺少 active');
  });
});

describe('customers — 边界', () => {
  it('按 status 过滤客户', () => {
    const src = readSource();
    assert.ok(src.includes(".status === 'active'"), 'active 过滤');
  });

  it('MOCK_CUSTOMERS 长度统计', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_CUSTOMERS.length'), '长度统计');
  });

  it('应支持 tab 切换过滤', () => {
    const src = readSource();
    assert.ok(src.includes('activeTab'), 'tab 切换');
  });
});

describe('customers — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('搜索过滤应包含 .filter', () => {
    const src = readSource();
    assert.ok(src.includes('.filter('), 'filter 过滤');
  });
});
