/**
 * inventory/page.test.tsx — 库存管理页面 L1 冒烟测试
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

describe('inventory — 正例', () => {
  it('应导出一个默认组件 InventoryPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function InventoryPage'), '缺少默认导出组件');
  });

  it('应包含库存数据数组 ITEMS', () => {
    const src = readSource();
    assert.ok(src.includes('ITEMS'), '缺少库存数据定义');
  });

  it('应包含低库存计算逻辑', () => {
    const src = readSource();
    assert.ok(src.includes('lowStock'), '缺少低库存计算');
  });

  it('应包含 DataTable 表格组件', () => {
    const src = readSource();
    assert.ok(src.includes('DataTable'), '缺少 DataTable');
  });
});

// ---- 边界 ----

describe('inventory — 边界', () => {
  it('应包含 Columns 列定义', () => {
    const src = readSource();
    assert.ok(src.includes('COLUMNS'), '缺少列定义');
  });

  it('应包含库存状态 Tag 颜色', () => {
    const src = readSource();
    assert.ok(src.includes('orange') || src.includes('需补货'), '缺少状态 Tag');
  });

  it('应包含入库/出库操作按钮', () => {
    const src = readSource();
    assert.ok(src.includes('入库') || src.includes('出库'), '缺少入库出库按钮');
  });
});

// ---- 防御 ----

describe('inventory — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 PageShell 布局组件', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell');
  });

  it('不应使用 dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'));
  });
});
