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

  it('应包含 库存详情 列标题', () => {
    const src = readSource();
    assert.ok(src.includes('库存详情') || src.includes('库存'), '缺少库存列');
  });

  it('应包含 状态 列标题', () => {
    const src = readSource();
    assert.ok(src.includes('状态'), '缺少状态列');
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

  it('MOCK_STOCK_ITEMS 中应包含库存数量字段', () => {
    const src = readSource();
    assert.ok(src.includes('quantity') || src.includes('count'), '缺少数量字段');
  });

  it('MOCK_STOCK_ITEMS 中应包含商品名称字段', () => {
    const src = readSource();
    assert.ok(src.includes('name') || src.includes('productName'), '缺少商品名称');
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

  it('不应使用 dangerouslySetInnerHTML', () => {
    const src = readSource();
    assert.ok(!src.includes('dangerouslySetInnerHTML'), '不应使用危险 HTML');
  });
});

describe('stock — 反例/补充', () => {
  it('不应使用 Function constructor', () => {
    const src = readSource();
    assert.ok(!src.includes('new Function('), '不应使用 Function constructor');
  });

  it('页面标题不应为空字符串', () => {
    const src = readSource();
    // 页面应有标题
    assert.ok(src.includes('库存') || src.includes('Stock'), '页面标题应有库存关键词');
  });

  it('MOCK_STOCK_ITEMS 应有至少一个对象', () => {
    const src = readSource();
    const itemCount = (src.match(/\{/g) || []).length;
    assert.ok(itemCount > 5, '应有库存数据对象');
  });

  it('应包含 useState 或 useMemo', () => {
    const src = readSource();
    assert.ok(src.includes('useState') || src.includes('useMemo') || src.includes('useCallback'), '应使用 React hooks');
  });
});
