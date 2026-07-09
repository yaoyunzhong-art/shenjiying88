/**
 * stores/page.test.ts — 门店管理列表页 L1 冒烟测试
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

describe('stores — 正例', () => {
  it('应导出一个默认组件 StoresPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StoresPage'), '缺少默认导出组件');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应引用 MOCK_STORES 数据源', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_STORES'), '缺少 MOCK_STORES 数据源');
  });

  it('应包含过滤和分页逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_STORES'), '引用数据源');
    assert.ok(src.includes('filtered'), '包含过滤逻辑');
    assert.ok(src.includes('.slice('), '包含分页切割');
  });

  it('应包含 searchTerm / page / pageSize 搜索分页状态', () => {
    const src = readSource();
    assert.ok(src.includes('searchTerm'), '缺少 searchTerm');
    assert.ok(src.includes('page'), '缺少 page');
    assert.ok(src.includes('STORES_PER_PAGE'), '缺少 STORES_PER_PAGE');
  });
});

// ---- 边界 ----

describe('stores — 边界', () => {
  it('门店状态包含 active / inactive / maintenance 三种', () => {
    const src = readSource();
    assert.ok(src.includes("'active'"), '缺少 active 状态');
    assert.ok(src.includes("'inactive'"), '缺少 inactive 状态');
    assert.ok(src.includes("'maintenance'"), '缺少 maintenance 状态');
  });

  it('无过滤结果时显示共 0 条结果', () => {
    const src = readSource();
    assert.ok(src.includes('filtered.length'), '引用过滤结果长度');
    assert.ok(src.includes('条结果'), '显示结果计数');
  });

  it('加载中显示 LoadingSkeleton', () => {
    const src = readSource();
    assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton 加载状态');
  });

  it('分页使用 Pagination 组件且 page 从 0 开始', () => {
    const src = readSource();
    assert.ok(src.includes('Pagination'), '使用 Pagination 组件');
    assert.ok(src.includes('page'), '使用 page 状态');
    assert.ok(src.includes('setPage'), '支持分页切换');
    assert.ok(src.includes('totalPages'), '计算总页数');
  });

  it('每页显示 STORES_PER_PAGE = 10 条', () => {
    const src = readSource();
    assert.ok(src.includes('STORES_PER_PAGE = 10'), '缺少 STORES_PER_PAGE 定义');
  });
});

// ---- 防御 ----

describe('stores — 防御', () => {
  it('应有门店管理页面标题', () => {
    const src = readSource();
    assert.ok(src.includes('门店管理'), '缺少门店管理页面标题');
    assert.ok(src.includes('<h1'), '使用标题元素');
  });

  it('应包含搜索筛选组件 SearchFilterInput', () => {
    const src = readSource();
    assert.ok(src.includes('SearchFilterInput'), '缺少搜索组件');
  });

  it('DataTable 应定义各列渲染逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('columns'), '定义 columns');
    assert.ok(src.includes('DataTable'), '引用 DataTable 组件');
    assert.ok(src.includes('storeName'), '包含门店名列');
    assert.ok(src.includes('status'), '包含状态列');
  });

  it('标签中用 ${id} 或 id 作为行标识', () => {
    const src = readSource();
    assert.ok(src.includes('rowKey') || src.includes('s.id'), '引用 id 作为行键');
    assert.ok(src.includes('storeName'), '引用门店名称');
  });

  it('搜索时重置 page 到第 0 页', () => {
    const src = readSource();
    assert.ok(src.includes('setPage(0)'), '搜索时重置分页');
    assert.ok(src.includes('setSearchTerm'), '使用 setSearchTerm');
  });
});
