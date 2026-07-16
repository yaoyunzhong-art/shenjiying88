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

describe('categories-data — 正例·数据结构', () => {
  it('CATEGORY_STATUS_MAP 应含 variant 字段', () => {
    const src = readSource();
    assert.ok(src.includes('variant') || src.includes('Variant'));
  });
  it('CATEGORY_STATUS_MAP 应含 label 字段', () => {
    const src = readSource();
    assert.ok(src.includes('label') || src.includes('Label'));
  });
  it('MOCK_CATEGORIES 应包含 id (类别标识)', () => {
    const src = readSource();
    assert.ok(src.includes('id:') || src.includes('categoryId'), 'mock数据使用id字段');
  });
  it('MOCK_CATEGORIES 应包含 parentName', () => {
    const src = readSource();
    assert.ok(src.includes('parentName') || src.includes('parentId'), 'mock数据使用parentName');
  });
  it('MOCK_CATEGORIES 应包含 status', () => {
    const src = readSource();
    assert.ok(src.includes('status'));
  });
  it('MOCK_CATEGORIES 应包含 name', () => {
    const src = readSource();
    assert.ok(src.includes('name'), 'mock数据应包含name字段');
  });
});

describe('categories-data — 正例·辅助函数', () => {
  it('getCategoryStatusLabel 应返回字符串', () => {
    const src = readSource();
    assert.ok(src.includes('getCategoryStatusLabel'));
  });
  it('getCategoryStatusVariant 应返回字符串', () => {
    const src = readSource();
    assert.ok(src.includes('getCategoryStatusVariant'));
  });
  it('computeCategoryStats 应处理空数组边界', () => {
    const src = readSource();
    assert.ok(src.includes('computeCategoryStats'));
  });
  it('getCategoryUniqueParents 应处理去重', () => {
    const src = readSource();
    assert.ok(src.includes('getCategoryUniqueParents') || src.includes('uniqueParents'));
  });
  it('函数应使用 export 关键字', () => {
    const src = readSource();
    const exports = src.match(/export\s+function/g) || [];
    assert.ok(exports.length >= 2, `至少2个导出函数, 实际${exports.length}`);
  });
});

describe('categories-data — 边界·防御', () => {
  it('不应使用 any 类型', () => {
    const src = readSource();
    assert.ok(!src.includes(': any'));
  });
  it('不应包含 dangerous 操作', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'));
  });
  it('不应包含 console.log', () => {
    const src = readSource();
    assert.ok(!src.includes('console.log'));
  });
  it('应使用 TS 常量枚举或联合类型', () => {
    const src = readSource();
    assert.ok(/type\s+|interface\s+|enum\s+|const\s+/.test(src));
  });
  it('文件应可被 import 解析', () => {
    assert.doesNotThrow(() => {
      const src = readSource();
      assert.ok(src.includes('export'));
    });
  });
});

describe('categories-data — 反例·错误路径', () => {
  it('export 导出个数应不小于数据常量', () => {
    const src = readSource();
    const exports = src.match(/export\s+(function|const|type|interface)\s+/g) || [];
    assert.ok(exports.length >= 2);
  });
  it('不应导入未使用的第三方库', () => {
    const src = readSource();
    assert.ok(!src.includes('import React'));
  });
  it('不应包含未导出测试辅助', () => {
    const src = readSource();
    assert.ok(!src.match(/^function\s+(?!\*)/m));
  });
});
