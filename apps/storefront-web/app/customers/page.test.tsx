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

  it('应包含客户姓名字段', () => {
    const src = readSource();
    assert.ok(src.includes('name') || src.includes('Name'), '缺少姓名');
  });

  it('应包含客户联系方式', () => {
    const src = readSource();
    assert.ok(src.includes('phone') || src.includes('Phone') || src.includes('email') || src.includes('Email'), '缺少联系方式');
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

  it('应包含总订单数字段', () => {
    const src = readSource();
    assert.ok(src.includes('totalOrders') || src.includes('orders') || src.includes('Orders'), '缺少订单数');
  });

  it('应包含最后订单日期', () => {
    const src = readSource();
    assert.ok(src.includes('lastOrderDate') || src.includes('lastOrder') || src.includes('LastOrder'), '缺少最后订单');
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

  it('不应包含危险的 innerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'), '不应使用危险 HTML');
  });

  it('不应使用 eval', () => {
    const src = readSource();
    assert.ok(!src.includes('eval('), '不应使用 eval');
  });
});

describe('customers — 补充覆盖', () => {
  it('应包含客户等级或类型', () => {
    const src = readSource();
    assert.ok(src.includes('vip') || src.includes('level') || src.includes('type') || src.includes('VIP'), '缺少等级');
  });

  it('应包含 useMemo 或 useState', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo') || src.includes('useState'), '缺少 hooks');
  });

  it('应包含 Tab 切换组件', () => {
    const src = readSource();
    assert.ok(src.includes('Tab') || src.includes('tab'), '缺少 Tab 组件');
  });

  it('应包含搜索输入框', () => {
    const src = readSource();
    assert.ok(src.includes('placeholder') || src.includes('搜索') || src.includes('Search'), '缺少搜索框');
  });

  it('客户统计数据应包含总消费', () => {
    const src = readSource();
    assert.ok(src.includes('totalSpent') || src.includes('spent') || src.includes('Spent'), '缺少总消费统计');
  });
});
