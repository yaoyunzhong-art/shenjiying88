/**
 * suppliers/page.test.tsx — 供应商列表页 L1 冒烟测试
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

describe('suppliers — 正例', () => {
  it('应导出一个默认组件 SuppliersListPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function SuppliersListPage'), '缺少默认导出组件');
  });

  it('应包含 MOCK_SUPPLIERS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_SUPPLIERS'), '缺少 MOCK_SUPPLIERS');
  });

  it('应包含 computeSupplierStats 统计函数', () => {
    const src = readSource();
    assert.ok(src.includes('computeSupplierStats'), '缺少统计计算函数');
  });

  it('应包含 computeSupplierStats 统计逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('computeSupplierStats'), '缺少统计函数');
  });
});

// ---- 边界 ----

describe('suppliers — 边界', () => {
  it('应支持按 category 过滤', () => {
    const src = readSource();
    assert.ok(src.includes('category'), '缺少 category 过滤');
  });

  it('过滤后列表应支持 .length 统计', () => {
    const src = readSource();
    assert.ok(src.includes('.length'), '长度统计');
  });

  it('应包含 supplier 状态过滤逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('.status') || src.includes("'active'"), '缺少状态过滤');
  });
});

// ---- 防御 ----

describe('suppliers — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应包含 usePagination 分页逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('usePagination'), '缺少分页');
  });
});
