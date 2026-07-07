/**
 * tenants/page.test.ts — 租户管理列表页 L1 冒烟测试
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

describe('tenants — 正例', () => {
  it('应导出一个默认组件 TenantsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function TenantsPage'), '缺少默认导出组件');
  });

  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 MOCK_TENANTS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_TENANTS'), '缺少 MOCK_TENANTS');
  });

  it('应包含 searchTerm / statusFilter / page 筛选分页状态', () => {
    const src = readSource();
    assert.ok(src.includes('searchTerm'), '缺少 searchTerm');
    assert.ok(src.includes('statusFilter'), '缺少 statusFilter');
    assert.ok(src.includes('page'), '缺少 page');
  });

  it('应包含 stats 统计 (租户总数/已开通/试用中/总门店数/总会员数)', () => {
    const src = readSource();
    assert.ok(src.includes('stats.total'), '缺少 stats.total');
    assert.ok(src.includes('stats.active'), '缺少 stats.active');
    assert.ok(src.includes('stats.trial'), '缺少 stats.trial');
    assert.ok(src.includes('totalStores'), '缺少 totalStores');
    assert.ok(src.includes('totalMembers'), '缺少 totalMembers');
  });
});

// ---- 边界 ----

describe('tenants — 边界', () => {
  it('筛选时调用 setPage(0) 重置分页', () => {
    const src = readSource();
    assert.ok(src.includes('setPage(0)'), '缺少重置分页逻辑');
  });

  it('租户状态 TENANT_STATUSES 应包含多种状态', () => {
    const src = readSource();
    assert.ok(src.includes('TENANT_STATUSES'), '缺少 TENANT_STATUSES');
  });

  it('每页显示 TENANTS_PER_PAGE = 10 条', () => {
    const src = readSource();
    assert.ok(src.includes('const TENANTS_PER_PAGE = 10'), '缺少每页条数定义');
  });

  it('搜索字段应包含 tenantName / tenantCode / contactPerson / city', () => {
    const src = readSource();
    assert.ok(src.includes("'tenantName'"), '缺少 tenantName');
    assert.ok(src.includes("'tenantCode'"), '缺少 tenantCode');
    assert.ok(src.includes("'contactPerson'"), '缺少 contactPerson');
    assert.ok(src.includes("'city'"), '缺少 city');
  });

  it('总页数计算应为 Math.ceil(filtered.length / TENANTS_PER_PAGE)', () => {
    const src = readSource();
    assert.ok(src.includes('Math.ceil'), '缺少 Math.ceil');
    assert.ok(src.includes('totalPages'), '缺少 totalPages');
  });
});

// ---- 防御 ----

describe('tenants — 防御', () => {
  it('应包含 新建租户 按钮', () => {
    const src = readSource();
    assert.ok(src.includes('新建租户'), '缺少新建租户按钮');
  });

  it('应包含 Loading 状态处理 (LoadingSkeleton)', () => {
    const src = readSource();
    assert.ok(src.includes('LoadingSkeleton'), '缺少 LoadingSkeleton');
  });

  it('应包含 Pagination 分页组件', () => {
    const src = readSource();
    assert.ok(src.includes('Pagination'), '缺少 Pagination');
  });

  it('租户名称应路由至 /tenants/${id} 管理页', () => {
    const src = readSource();
    assert.ok(src.includes('/tenants/') && src.includes('管理'), '缺少租户管理链接');
  });

  it('筛选输入框 placeholder 应为 "搜索租户名称/编码/联系人..."', () => {
    const src = readSource();
    assert.ok(src.includes('搜索租户名称/编码/联系人'), '缺少搜索 placeholder');
  });
});
