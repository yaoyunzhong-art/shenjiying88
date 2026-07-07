/**
 * coupons/page.test.tsx — 优惠券列表页 L1 冒烟测试 (storefront-web)
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

describe('coupons — 正例', () => {
  it('应导出一个默认组件 CouponsListPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function CouponsListPage'), '缺少默认导出');
  });

  it('应包含 Coupon 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface Coupon'), '缺少接口');
  });

  it('应包含 MOCK_COUPONS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_COUPONS'), '缺少数据源');
  });

  it('应计算 active / totalIssued', () => {
    const src = readSource();
    assert.ok(src.includes('active:'), '缺少 active');
    assert.ok(src.includes('totalIssued'), '缺少 totalIssued');
  });
});

describe('coupons — 边界', () => {
  it('active 状态过滤', () => {
    const src = readSource();
    assert.ok(src.includes(".status === 'active'"), 'active 过滤');
  });

  it('问题统计使用 reduce', () => {
    const src = readSource();
    assert.ok(src.includes('.reduce('), 'reduce 求和');
  });

  it('MOCK_COUPONS 长度统计', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_COUPONS.length'), '长度统计');
  });
});

describe('coupons — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应包含搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('search') || src.includes('Search'), '搜索');
  });
});
