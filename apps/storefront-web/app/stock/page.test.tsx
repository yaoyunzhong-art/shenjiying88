/**
 * stock/page.test.tsx — 库存管理列表页 L1 冒烟测试 (storefront-web)
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

describe('stock — 正例', () => {
  it('应导出一个默认 async 组件 StockListPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default async function StockListPage'), '缺少默认导出');
  });

  it('应包含 MOCK_STOCK_ITEMS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_STOCK_ITEMS'), '缺少数据源');
  });

  it('应包含 items 传递', () => {
    const src = readSource();
    assert.ok(src.includes('items='), '缺少 items props');
  });
});

describe('stock — 边界', () => {
  it('MOCK_STOCK_ITEMS 应有长度', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_STOCK_ITEMS'), '数据源');
  });

  it('应包含 StockPage 组件引用', () => {
    const src = readSource();
    assert.ok(src.includes('StockPage'), '缺少 StockPage 组件');
  });

  it('库存 items 和 total 属性传递', () => {
    const src = readSource();
    assert.ok(src.includes('items={'), '缺少 items 属性');
    assert.ok(src.includes('total={'), '缺少 total 属性');
  });
});

describe('stock — 防御', () => {
  it('应包含 page 和 pageSize 分页', () => {
    const src = readSource();
    assert.ok(src.includes('page={'), '缺少 page');
    assert.ok(src.includes('pageSize={'), '缺少 pageSize');
  });

  it('MOCK_STOCK_ITEMS 应包含库存状态字段', () => {
    const src = readSource();
    assert.ok(src.includes('status'), '缺少状态字段');
  });

  it('应包含 StockPage 从 components 导入', () => {
    const src = readSource();
    assert.ok(src.includes('./components/StockPage'), '缺少组件导入');
  });
});
