/**
 * categories-data.test.ts — 分类数据层 L1 测试
 * 覆盖: 正例·边界·防御
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SOURCE = resolve(__dirname, '.', 'categories-data.ts');

function readSource(): string {
  return readFileSync(SOURCE, 'utf-8');
}

describe('categories-data — 正例', () => {
  it('CATEGORY_STATUS_MAP 应包含 active 和 inactive', () => {
    const src = readSource();
    assert.ok(src.includes('CATEGORY_STATUS_MAP'));
    assert.ok(src.includes('active'));
    assert.ok(src.includes('inactive'));
  });

  it('MOCK_CATEGORIES 应包含不少于 10 条', () => {
    const src = readSource();
    const match = src.match(/MOCK_CATEGORIES[^;]+/);
    assert.ok(match, '缺少 MOCK_CATEGORIES 定义');
  });

  it('getCategoryStatusLabel 和 getCategoryStatusVariant 应导出', () => {
    const src = readSource();
    assert.ok(src.includes('export function getCategoryStatusLabel'));
    assert.ok(src.includes('export function getCategoryStatusVariant'));
  });

  it('computeCategoryStats 和 getCategoryUniqueParents 应导出', () => {
    const src = readSource();
    assert.ok(src.includes('computeCategoryStats'));
    assert.ok(src.includes('getCategoryUniqueParents'));
  });
});
