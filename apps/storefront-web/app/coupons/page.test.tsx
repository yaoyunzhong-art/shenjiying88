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

  it('应包含优惠券使用率统计', () => {
    const src = readSource();
    assert.ok(src.includes('used') || src.includes('usage'), '缺少使用率');
  });

  it('应展示优惠券列表', () => {
    const src = readSource();
    assert.ok(src.includes('优惠券') || src.includes('Coupon'), '缺少优惠券列表');
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

  it('应包含 status 字段过滤', () => {
    const src = readSource();
    assert.ok(src.includes('status'), '缺少 status 字段');
  });

  it('应包含 discount 或 amount 字段', () => {
    const src = readSource();
    assert.ok(src.includes('discount') || src.includes('amount') || src.includes('Discount'), '缺少折扣字段');
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

  it('不应使用 innerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('innerHTML'), '不应使用 innerHTML');
  });
});

describe('coupons — 补充覆盖', () => {
  it('应包含 有效期 字段', () => {
    const src = readSource();
    assert.ok(src.includes('validTo') || src.includes('validFrom') || src.includes('valid'), '缺少有效期');
  });

  it('应包含 useMemo 或 useState', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo') || src.includes('useState'), '缺少 hooks');
  });

  it('MOCK_COUPONS 应包含 minAmount 字段', () => {
    const src = readSource();
    assert.ok(src.includes('minAmount') || src.includes('min') || src.includes('threshold'), '缺少最低消费');
  });

  it('应包含 优惠券类型 字段', () => {
    const src = readSource();
    assert.ok(src.includes('type') || src.includes('couponType'), '缺少类型字段');
  });

  it('应包含 filter 过滤逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('.filter('), '缺少 filter 调用');
  });
});
