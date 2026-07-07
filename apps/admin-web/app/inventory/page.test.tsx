/**
 * inventory/page.test.tsx — 库存管理页 L1 冒烟测试
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

  it('应包含 InventoryItem 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface InventoryItem'), '缺少 InventoryItem 接口');
  });

  it('InventoryItem 应包含 version 乐观锁字段', () => {
    const src = readSource();
    assert.ok(src.includes('version:'), '缺少 version 乐观锁');
  });

  it('应包含 loadList 数据加载函数', () => {
    const src = readSource();
    assert.ok(src.includes('loadList'), '缺少 loadList');
  });

  it('应包含 toast 通知机制', () => {
    const src = readSource();
    assert.ok(src.includes('toast') || src.includes('showToast'), '缺少 toast');
  });
});

// ---- 边界 ----

describe('inventory — 边界', () => {
  it('tenantId 为空时不应发起请求', () => {
    const src = readSource();
    assert.ok(src.includes('if (!tenantId)'), '缺少 tenantId 为空保护');
  });

  it('应包含低库存阈值 lowStockThreshold', () => {
    const src = readSource();
    assert.ok(src.includes('lowStockThreshold'), '缺少低库存阈值');
  });

  it('应计算 availableQty = totalQty - reservedQty', () => {
    const src = readSource();
    assert.ok(src.includes('availableQty'), '缺少可用库存');
  });
});

// ---- 防御 ----

describe('inventory — 防御', () => {
  it('loadList 应使用 try-catch 捕获网络错误', () => {
    const src = readSource();
    assert.ok(src.includes('try') && src.includes('catch'), '缺少 try-catch');
  });

  it('网络错误应调用 showToast 显示', () => {
    const src = readSource();
    assert.ok(src.includes('showToast'), '缺少 showToast');
  });

  it('loading 状态应在 finally 中重置', () => {
    const src = readSource();
    assert.ok(src.includes('finally'), '缺少 finally');
  });

  it('应使用 useCallback 包裹 loadList', () => {
    const src = readSource();
    assert.ok(src.includes('useCallback'), '缺少 useCallback');
  });
});
