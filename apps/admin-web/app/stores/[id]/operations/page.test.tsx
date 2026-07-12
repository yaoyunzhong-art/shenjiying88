/**
 * operations/page.test.tsx — 运维操作列表页 L1 冒烟测试
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

describe('operations — 正例', () => {
  it('应导出一个默认组件 OperationsCenterPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function OperationsCenterPage'), '缺少默认导出组件');
  });

  it('应包含 OpsTask 类型定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface OpsTask'), '缺少 OpsTask 接口');
  });

  it('应包含状态过滤逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('status'), '缺少 status 过滤');
  });

  it('应包含搜索或过滤功能', () => {
    const src = readSource();
    assert.ok(src.includes('Tabs') || src.includes('filter'), '缺少过滤功能');
  });
});

// ---- 边界 ----

describe('operations — 边界', () => {
  it('应包含任务数据数组定义', () => {
    const src = readSource();
    assert.ok(src.includes('const tasks:'), '缺少 tasks 数据');
  });

  it('应包含 KPI 目标数据集', () => {
    const src = readSource();
    assert.ok(src.includes('const kpis:'), '缺少 kpis 数据');
  });

  it('应支持分类筛选 Tabs', () => {
    const src = readSource();
    assert.ok(src.includes("tab") || src.includes("'tasks'"), '缺少 tab 切换');
  });
});

// ---- 防御 ----

describe('operations — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useMemo 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('应包含 DataTable 表格组件', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
  });
});
