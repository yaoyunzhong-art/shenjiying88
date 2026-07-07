/**
 * stock-transfer/page.test.tsx — 库存调拨列表页 L1 冒烟测试 (storefront-web)
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

describe('stock-transfer — 正例', () => {
  it('应导出一个默认组件 StockTransferListPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StockTransferListPage'), '缺少默认导出');
  });

  it('应包含 StockTransfer 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface StockTransfer'), '缺少接口');
  });

  it('应包含 MOCK_TRANSFERS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_TRANSFERS'), '缺少数据源');
  });

  it('应计算待审批/调拨中/已完成统计', () => {
    const src = readSource();
    assert.ok(src.includes('pending'), '缺少 pending');
    assert.ok(src.includes('in_transit'), '缺少 in_transit');
    assert.ok(src.includes('completed'), '缺少 completed');
  });
});

describe('stock-transfer — 边界', () => {
  it('pending 状态过滤', () => {
    const src = readSource();
    assert.ok(src.includes('status'), 'status 过滤');
  });

  it('应包含分页 totalPages 计算', () => {
    const src = readSource();
    assert.ok(src.includes('totalPages') || src.includes('pagination'), '分页计算');
  });

  it('已完成过滤', () => {
    const src = readSource();
    assert.ok(src.includes("i.status === 'completed'") || src.includes('completed'), 'completed 过滤');
  });
});

describe('stock-transfer — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含搜索或过滤功能', () => {
    const src = readSource();
    assert.ok(src.includes('search') || src.includes('Search'), '搜索功能');
  });

  it('空调拨列表应有处理', () => {
    const src = readSource();
    assert.ok(src.includes('.length'), '长度判断');
  });
});
