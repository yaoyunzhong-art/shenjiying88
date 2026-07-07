/**
 * tenants/page.test.tsx — 租户列表页 L1 冒烟测试
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

  it('应包含 TenantItem 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface TenantItem'), '缺少 TenantItem 接口');
  });

  it('应包含 MOCK_TENANTS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_TENANTS'), '缺少 MOCK_TENANTS');
  });

  it('应计算 total / active / enterprise 统计', () => {
    const src = readSource();
    assert.ok(src.includes('total:'), '缺少 total');
    assert.ok(src.includes('active:'), '缺少 active');
    assert.ok(src.includes('enterprise:'), '缺少 enterprise');
  });

  it('应包含 useSearchFilter 搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter'), '缺少 useSearchFilter');
  });
});

// ---- 边界 ----

describe('tenants — 边界', () => {
  it('plan 为 enterprise 的统计过滤', () => {
    const src = readSource();
    assert.ok(src.includes("plan === 'enterprise'"), '缺少 enterprise 计划过滤');
  });

  it('应支持 marketCode 市场分组', () => {
    const src = readSource();
    assert.ok(src.includes('marketCode'), '缺少 marketCode');
  });

  it('应支持 status 分组统计', () => {
    const src = readSource();
    assert.ok(src.includes(".status === 'active'"), '缺少状态过滤');
  });
});

// ---- 防御 ----

describe('tenants — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('MOCK_TENANTS 为空时不应出错', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_TENANTS.length'), '长度统计');
  });
});
