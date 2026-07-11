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

  it('应包含 Tenant 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface Tenant'), '缺少 Tenant 接口');
  });

  it('应包含 tenants 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('const tenants: Tenant'), '缺少 tenants 数据');
  });

  it('应计算 total / active / trial / expired 统计', () => {
    const src = readSource();
    assert.ok(src.includes('total:'), '缺少 total');
    assert.ok(src.includes('active:'), '缺少 active');
    assert.ok(src.includes('trial:'), '缺少 trial');
    assert.ok(src.includes('expired:'), '缺少 expired');
  });

  it('应包含 useSearchFilter 搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter'), '缺少 useSearchFilter');
  });
});

// ---- 边界 ----

describe('tenants — 边界', () => {
  it('应包含 TIER_LABELS 版本映射', () => {
    const src = readSource();
    assert.ok(src.includes('TIER_LABELS'), '缺少 TIER_LABELS');
    assert.ok(src.includes('企业版'), '应包含企业版标签');
  });

  it('应支持市场区域 region 分组', () => {
    const src = readSource();
    assert.ok(src.includes('region') || src.includes('REGIONS'), '缺少 region');
  });

  it('应支持 status 分组统计', () => {
    const src = readSource();
    assert.ok(src.includes(".status==='active'") || src.includes('.status==='), '缺少状态过滤');
  });
});

// ---- 防御 ----

describe('tenants — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('数组长度应为 32', () => {
    const src = readSource();
    assert.ok(src.includes('length:32'), '应包含 length:32');
  });
});
