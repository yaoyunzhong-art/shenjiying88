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
  it('应导出一个默认组件 StoreSuppliersPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StoreSuppliersPage'), '缺少默认导出组件');
  });

  it('应包含 suppliers 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('const suppliers: Supplier'), '缺少 suppliers 数据');
  });

  it('应包含统计逻辑 (total/active/totalOrders/totalAmount)', () => {
    const src = readSource();
    assert.ok(src.includes('total:') && src.includes('active:'), '缺少统计字段');
  });

  it('应包含供应商类型 SC 映射表', () => {
    const src = readSource();
    assert.ok(src.includes('const SC:'), '缺少 SC 映射');
  });

  it('应包含供应商状态 SSTATUS 映射表', () => {
    const src = readSource();
    assert.ok(src.includes('const SSTATUS:'), '缺少 SSTATUS 映射');
  });

  it('应包含 Supplier 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface Supplier'), '缺少 Supplier 接口');
  });
});

// ---- 边界 ----

describe('suppliers — 边界', () => {
  it('应支持按 category 过滤', () => {
    const src = readSource();
    assert.ok(src.includes('SC[') || src.includes('.category'), '缺少 category 过滤');
  });

  it('应支持状态过滤', () => {
    const src = readSource();
    assert.ok(src.includes('statusFilter'), '缺少 statusFilter');
  });

  it('应包含搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter') || src.includes('SearchFilterInput'), '缺少搜索功能');
  });
});

// ---- 防御 ----

describe('suppliers — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应包含 DataTable 和 Pagination', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
  });

  it('应包含 ratingStars 评分显示函数', () => {
    const src = readSource();
    assert.ok(src.includes('function ratingStars'), '缺少 ratingStars');
  });
});
