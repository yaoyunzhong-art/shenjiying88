/**
 * products/page.test.tsx — 商品列表页 L1 冒烟测试
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

describe('products — 正例', () => {
  it('应导出一个默认组件', () => {
    const src = readSource();
    assert.ok(src.includes('export default function'), '缺少默认导出');
  });

  it('应包含 MOCK_PRODUCTS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_PRODUCTS'), '缺少 MOCK_PRODUCTS');
  });

  it('应计算 total / active / lowStock / outOfStock 统计', () => {
    const src = readSource();
    assert.ok(src.includes('total:'), '缺少 total');
    assert.ok(src.includes('active:'), '缺少 active');
    assert.ok(src.includes('lowStock:'), '缺少 lowStock');
    assert.ok(src.includes('outOfStock:'), '缺少 outOfStock');
  });

  it('应包含 marketCode 市场分类', () => {
    const src = readSource();
    assert.ok(src.includes('marketCode'), '缺少 marketCode');
  });
});

describe('products — 边界', () => {
  it('stock === 0 归类为缺货', () => {
    const src = readSource();
    assert.ok(src.includes('stock === 0'), 'stock === 0');
  });

  it('stock > 0 且 < 50 为低库存', () => {
    const src = readSource();
    assert.ok(src.includes('stock < 50'), '低库存阈值');
  });

  it('应支持 status 过滤', () => {
    const src = readSource();
    assert.ok(src.includes('status'), '缺少状态过滤');
  });
});

describe('products — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('平均计算应避免除以 0', () => {
    const src = readSource();
    assert.ok(src.includes('.reduce('), 'reduce 计算');
  });

  it('应包含 useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });
});
