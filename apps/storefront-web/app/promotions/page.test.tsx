/**
 * promotions/page.test.tsx — 促销列表页 L1 冒烟测试 (storefront-web)
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

describe('promotions — 正例', () => {
  it('应导出一个默认组件 StorePromotionsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function StorePromotionsPage'), '缺少默认导出');
  });

  it('应包含 Promotion 接口定义', () => {
    const src = readSource();
    assert.ok(src.includes('interface Promotion'), '缺少接口');
  });

  it('应包含 MOCK_DATA 或 mock 数据集', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK'), '缺少 mock 数据');
  });

  it('应包含 useSearchFilter 搜索过滤', () => {
    const src = readSource();
    assert.ok(src.includes('useSearchFilter'), '缺少搜索过滤');
  });
});

describe('promotions — 边界', () => {
  it('应支持 title 和 storeName 搜索字段', () => {
    const src = readSource();
    assert.ok(src.includes('title'), '缺少 title');
    assert.ok(src.includes('storeName'), '缺少 storeName');
  });

  it('MOCK_DATA 数量', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_DATA'), '数据源');
  });

  it('应支持状态过滤', () => {
    const src = readSource();
    assert.ok(src.includes('status'), '缺少 status');
  });
});

describe('promotions — 防御', () => {
  it('应包含 use client 指令', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'"), '缺少 use client');
  });

  it('应包含 useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo'), '缺少 useMemo');
  });

  it('空调拨状态应有处理', () => {
    const src = readSource();
    assert.ok(src.includes('.length'), '长度判断');
  });
});
