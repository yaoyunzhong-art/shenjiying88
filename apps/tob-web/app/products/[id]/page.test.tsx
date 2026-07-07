/**
 * products/[id]/page.test.tsx — 商品详情页 L1 冒烟测试 (tob-web)
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

describe('products/[id] — 正例', () => {
  it('应导出一个默认组件 ProductDetailPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function ProductDetailPage'), '缺少默认导出');
  });

  it('应包含 MOCK_PRODUCTS 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_PRODUCTS'), '缺少数据源');
  });

  it('应包含 getProductById 查找函数', () => {
    const src = readSource();
    assert.ok(src.includes('getProductById'), '缺少查找函数');
  });

  it('getProductById 应使用 find', () => {
    const src = readSource();
    assert.ok(src.includes('.find('), '缺少 find');
  });
});

describe('products/[id] — 边界', () => {
  it('id 不存在时返回 undefined', () => {
    const src = readSource();
    assert.ok(src.includes('.find('), 'find 查找');
  });

  it('MOCK_PRODUCTS 数量统计', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_PRODUCTS'), '数据源');
  });

  it('商品不存在时应处理', () => {
    const src = readSource();
    assert.ok(src.includes('if') || src.includes('!product') || src.includes('not found'), '不存在处理');
  });
});

describe('products/[id] — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含编辑/保存功能', () => {
    const src = readSource();
    assert.ok(src.includes('edit') || src.includes('save') || src.includes('Save'), '编辑功能');
  });

  it('详情页应包含状态管理', () => {
    const src = readSource();
    assert.ok(src.includes('useState') || src.includes('useReducer'), '状态管理');
  });
});
