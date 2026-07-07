/**
 * categories/page.test.tsx — 分类列表页 L1 冒烟测试
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

describe('categories/page — 正例', () => {
  it('应导出默认组件 CategoriesListPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function CategoriesListPage'), '缺少默认导出');
  });

  it('应包含 DataTable / SearchFilterInput / Pagination', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
    assert.ok(src.includes('SearchFilterInput'), '缺少 SearchFilterInput');
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
  });

  it('应包含 Tabs 和 statusFilter', () => {
    const src = readSource();
    assert.ok(src.includes('Tabs'), '缺少 Tabs');
    assert.ok(src.includes('statusFilter'), '缺少 statusFilter');
  });

  it('应使用 useSearchFilter / useSortedItems', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter'), '缺少 useSearchFilter');
    assert.ok(src.includes('useSortedItems'), '缺少 useSortedItems');
  });

  it('应包含 summaryCards', () => {
    const src = readSource();
    assert.ok(src.includes('summaryCards'), '缺少 summaryCards');
    assert.ok(src.includes('stats.total'), '缺少 stats.total');
    assert.ok(src.includes('stats.rootCount'), '缺少 stats.rootCount');
  });

  it('应包含 "新建分类" 操作按钮', () => {
    const src = readSource();
    assert.ok(src.includes('新建分类'), '缺少新建分类按钮文字');
  });
});

describe('categories/page — 边界', () => {
  it('搜索应覆盖 name, code, parentName', () => {
    const src = readSource();
    assert.ok(src.includes("'name'") || src.includes('"name"'), '搜索应包含 name');
    assert.ok(src.includes("'code'") || src.includes('"code"'), '搜索应包含 code');
    assert.ok(src.includes("'parentName'") || src.includes('"parentName"'), '搜索应包含 parentName');
  });

  it('分页 pageSize 应为 10', () => {
    const src = readSource();
    assert.ok(src.includes('pageSize = 10'), 'pageSize 应为 10');
  });

  it('空数据时应显示 emptyText', () => {
    const src = readSource();
    assert.ok(src.includes('emptyText'), '缺少 emptyText');
    assert.ok(src.includes('暂无分类数据'), '缺少暂无数据文案');
  });
});

describe('categories/page — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 useMemo / useCallback 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
    assert.ok(src.includes('useCallback'), '缺少 useCallback');
  });

  it('handleAction 应处理 add 路由跳转', () => {
    const src = readSource();
    assert.ok(src.includes("action === 'add'"), '缺少 add action 处理');
  });
});
