/**
 * coupons/page.test.tsx — 优惠券列表页 L1 冒烟测试
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

  it('应从 coupons-data 导入 Coupon 类型', () => {
    const src = readSource();
    assert.ok(src.includes('coupons-data'), '应引用共享数据层');
    assert.ok(src.includes('MOCK_COUPONS'), '应引用 MOCK_COUPONS');
  });



  it('应计算 total / active / totalIssued / totalUsed', () => {
    const src = readSource();
    assert.ok(src.includes('total:'), '缺少 total');
    assert.ok(src.includes('active:'), '缺少 active');
    assert.ok(src.includes('totalIssued'), '缺少 totalIssued');
    assert.ok(src.includes('totalUsed'), '缺少 totalUsed');
  });
});

describe('coupons — 边界', () => {
  it('active 状态统计使用 .filter', () => {
    const src = readSource();
    assert.ok(src.includes(".status === 'active'"), 'active 状态过滤');
  });

  it('MOCK_COUPONS 长度统计', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_COUPONS.length'), '长度统计');
  });

  it('应支持分类过滤', () => {
    const src = readSource();
    assert.ok(src.includes('.filter('), 'filter 过滤');
  });
});

describe('coupons — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('统计应使用 reduce', () => {
    const src = readSource();
    assert.ok(src.includes('.reduce('), 'reduce 求和');
  });

  it('应包含 useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });
});
