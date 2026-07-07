/**
 * page.test.ts — 进销存页面 L1 冒烟测试
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

describe('inventory/page — 正向测试', () => {
  it('应包含"进销存管理"页面标题', () => {
    const src = readSource();
    assert.ok(src.includes('进销存管理'), '缺少"进销存管理"标题');
  });

  it('应包含"商品管理"Tab', () => {
    const src = readSource();
    assert.ok(src.includes('商品管理'), '缺少"商品管理"Tab');
  });

  it('应包含"采购订单"Tab', () => {
    const src = readSource();
    assert.ok(src.includes('采购订单'), '缺少"采购订单"Tab');
  });

  it('应包含"库存盘点"Tab', () => {
    const src = readSource();
    assert.ok(src.includes('库存盘点'), '缺少"库存盘点"Tab');
  });

  it('应包含"跨店调拨"Tab', () => {
    const src = readSource();
    assert.ok(src.includes('跨店调拨'), '缺少"跨店调拨"Tab');
  });

  it('应包含新增商品按钮', () => {
    const src = readSource();
    assert.ok(src.includes('新增商品'), '缺少"新增商品"按钮');
  });
});

describe('inventory/page — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应导入 PageShell from @m5/ui', () => {
    const src = readSource();
    assert.ok(src.includes('PageShell'), '缺少 PageShell 导入');
    assert.ok(src.includes("@m5/ui"), '缺少 @m5/ui 导入');
  });

  it('应导入 inventory-data', () => {
    const src = readSource();
    assert.ok(src.includes('./inventory-data'), '缺少 inventory-data 导入');
  });

  it('应导入 inventory-service', () => {
    const src = readSource();
    assert.ok(src.includes('./inventory-service'), '缺少 inventory-service 导入');
  });
});
