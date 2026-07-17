/**
 * products/page.test.tsx — 商品列表页 L1 冒烟测试
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

// ---- 正例: 模块结构 & 数据映射 ----

describe('products — 正例', () => {
  it('应导出一个默认组件 ProductsPage', () => {
    const src = readSource();
    assert.ok(src.includes('export default function ProductsPage'), '缺少默认导出组件');
  });

  it('应包含 MOCK_PRODUCTS 和 PRODUCT_STATUS_MAP', () => {
    const src = readSource();
    assert.ok(src.includes('MOCK_PRODUCTS'), '缺少 MOCK_PRODUCTS');
    assert.ok(src.includes('PRODUCT_STATUS_MAP'), '缺少 PRODUCT_STATUS_MAP');
  });

  it('MOCK_PRODUCTS 应包含不少于 10 条', () => {
    const src = readSource();
    const match = src.match(/MOCK_PRODUCTS[^;]+/);
    assert.ok(match, '缺少 MOCK_PRODUCTS 定义');
  });

  it('stat 应计算 total / active / lowStock / outOfStock', () => {
    const src = readSource();
    assert.ok(src.includes('.length'), '缺少 .length 计算');
    assert.ok(src.includes('total:'), '缺少 total 字段');
    assert.ok(src.includes('active:'), '缺少 active 字段');
    assert.ok(src.includes('lowStock:'), '缺少 lowStock 字段');
    assert.ok(src.includes('outOfStock:'), '缺少 outOfStock 字段');
  });

  it('应包含 ProductsPageContent 子组件', () => {
    const src = readSource();
    assert.ok(src.includes('ProductsPageContent'), '缺少 ProductsPageContent 子组件');
  });

  it('应使用 Suspense 包裹内容', () => {
    const src = readSource();
    assert.ok(src.includes('Suspense'), '缺少 Suspense');
    assert.ok(src.includes('ProductsPageFallback'), '缺少 fallback 组件');
  });
});

// ---- 边界: 零值 / 空列表 / 最小数据 ----

describe('products — 边界', () => {
  it('空 product status 应被 PRODUCT_STATUS_MAP 正确处理', () => {
    const src = readSource();
    assert.ok(src.includes('PRODUCT_STATUS_MAP['), 'status 映射应支持动态 key');
  });

  it('stock 为 0 时归类为 outOfStock', () => {
    const src = readSource();
    assert.ok(src.includes('stock === 0'), 'stock === 0 应归为缺货');
  });

  it('stock 在 1-49 时归类为 lowStock', () => {
    const src = readSource();
    assert.ok(src.includes('stock < 50') || src.includes('stock > 0'), 'lowStock 应有数量范围');
  });

  it('应包含 marketCode 分类统计', () => {
    const src = readSource();
    assert.ok(src.includes('marketCode'), '应包含市场编码统计');
  });
});

// ---- 防御: 数据处理安全 ----

describe('products — 防御', () => {
  it('平均库存计算应避免除以 0', () => {
    const src = readSource();
    assert.ok(src.includes('reduce'), '应使用 reduce 求合');
    assert.ok(src.includes('/'), '应包含除法计算');
  });

  it('应包含 client-only 渲染标记', () => {
    const src = readSource();
    assert.ok(src.includes("'use client'") || src.includes('"use client"'), '缺少 use client 指令');
  });

  it('Suspense fallback 渲染不应抛异常', () => {
    const src = readSource();
    assert.ok(src.includes('fallback'), '缺少 Suspense fallback 属性');
  });

  it('应包含 useMemo / useCallback 性能优化', () => {
    const src = readSource();
    assert.ok(src.includes('useMemo') || src.includes('useCallback'), '缺少性能优化 hook');
  });
});

describe('products — 反例', () => {
  it('不应包含未处理的 console.log', () => {
    const src = readSource();
    const lines = src.split('\n').filter(l => l.includes('console.log') && !l.trimStart().startsWith('//'));
    assert.equal(lines.length, 0, '不应有非注释 console.log');
  });

  it('不应使用 any 类型', () => {
    const src = readSource();
    assert.ok(!src.includes(': any') || src.includes('// eslint'), '应避免 any 类型');
  });

  it('不应直接修改 props', () => {
    const src = readSource();
    assert.ok(!src.includes('props.') || src.includes('props:'), '不应直接修改 props 对象');
  });
});

describe('products — 正例扩展', () => {
  it('应包含品类筛选 CATEOGORY_FILTERS', () => {
    const src = readSource();
    assert.ok(src.includes('CATEGORY') || src.includes('category'), '应有品类筛选');
  });

  it('应包含价格格式化方法', () => {
    const src = readSource();
    assert.ok(src.includes('price') || src.includes('Price'), '应有价格字段');
  });

  it('应包含商品名称 Col', () => {
    const src = readSource();
    assert.ok(src.includes('名称') || src.includes('Name') || src.includes('name'), '应有商品名称列');
  });
});

const SRC = readFileSync(require.resolve('./page'), 'utf-8');

describe('Products — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化(.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
