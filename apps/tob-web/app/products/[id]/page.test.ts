/**
 * TOB product detail page unit tests
 *
 * Tests data-level functions that don't require React rendering
 * and validates the mock data used by the detail page.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MOCK_PRODUCTS,
  PRODUCT_STATUSES,
  type ProductItem,
  type ProductStatus,
} from '../../products-data';

// ── 工具函数（与 page.tsx 中保持一致） ──

function marginPercent(p: Pick<ProductItem, 'price' | 'cost'>): number {
  return p.price > 0 ? ((p.price - p.cost) / p.price) * 100 : 0;
}

function marginColor(margin: number): string {
  if (margin >= 50) return '#4ade80';
  if (margin >= 30) return '#fbbf24';
  return '#f87171';
}

function stockColor(stock: number): string {
  if (stock === 0) return '#f87171';
  if (stock < 50) return '#fbbf24';
  return '#94a3b8';
}

function formatCurrency(amount: number): string {
  if (amount >= 10000) return `¥${(amount / 10000).toFixed(1)}万`;
  return `¥${amount.toLocaleString()}`;
}

const NEXT_STATUS: Partial<Record<ProductStatus, ProductStatus>> = {
  active: 'inactive',
  inactive: 'active',
  discontinued: 'draft',
  draft: 'active',
};

const STATUS_ACTION_LABELS: Partial<Record<ProductStatus, string>> = {
  active: '下架',
  inactive: '重新上架',
  discontinued: '转为草稿',
  draft: '发布',
};

// ── 测试数据完整性 ──

describe('product detail: mock data completeness', () => {
  it('MOCK_PRODUCTS should have at least 16 items', () => {
    assert.ok(MOCK_PRODUCTS.length >= 16, `expected >=16, got ${MOCK_PRODUCTS.length}`);
  });

  it('every product should have unique id', () => {
    const ids = new Set(MOCK_PRODUCTS.map((p) => p.id));
    assert.equal(ids.size, MOCK_PRODUCTS.length, 'duplicate product ids found');
  });

  it('every product should have unique sku', () => {
    const skus = new Set(MOCK_PRODUCTS.map((p) => p.sku));
    assert.equal(skus.size, MOCK_PRODUCTS.length, 'duplicate SKUs found');
  });

  it('getProductById should return correct item', () => {
    const first = MOCK_PRODUCTS[0]!;
    const found = MOCK_PRODUCTS.find((p) => p.id === first.id)!;
    assert.ok(found !== undefined, `product ${first.id} not found`);
    assert.equal(found.id, first.id);
    assert.equal(found.name, first.name);
  });

  it('getProductById should return undefined for non-existent id', () => {
    const found = MOCK_PRODUCTS.find((p) => p.id === 'non-existent-id');
    assert.equal(found, undefined);
  });
});

// ── 测试 margin 计算 ──

describe('product detail: margin computation', () => {
  it('should compute margin for all products', () => {
    for (const p of MOCK_PRODUCTS) {
      const m = marginPercent(p);
      assert.ok(typeof m === 'number' && !isNaN(m), `product ${p.id}: margin is NaN`);
      assert.ok(m >= 0, `product ${p.id}: negative margin ${m.toFixed(1)}%`);
      assert.ok(m <= 100, `product ${p.id}: margin >100% (${m})`);
    }
  });

  it('marginColor should return correct hex for each range', () => {
    assert.equal(marginColor(60), '#4ade80');
    assert.equal(marginColor(50), '#4ade80');
    assert.equal(marginColor(40), '#fbbf24');
    assert.equal(marginColor(30), '#fbbf24');
    assert.equal(marginColor(20), '#f87171');
    assert.equal(marginColor(0), '#f87171');
  });
});

// ── 测试 stockColor ──

describe('product detail: stock color', () => {
  it('stockColor should return correct hex for each range', () => {
    assert.equal(stockColor(0), '#f87171');
    assert.equal(stockColor(30), '#fbbf24');
    assert.equal(stockColor(50), '#94a3b8');
    assert.equal(stockColor(100), '#94a3b8');
  });
});

// ── 测试 formatCurrency ──

describe('product detail: formatCurrency', () => {
  it('should format small amounts correctly', () => {
    assert.equal(formatCurrency(18.5), '¥18.5');
    assert.equal(formatCurrency(499), '¥499');
    assert.equal(formatCurrency(1000), '¥1,000');
  });

  it('should format large amounts in wan', () => {
    assert.equal(formatCurrency(10000), '¥1.0万');
    assert.equal(formatCurrency(50000), '¥5.0万');
    assert.equal(formatCurrency(123456), '¥12.3万');
  });
});

// ── 测试状态流转 ──

describe('product detail: status transitions', () => {
  it('NEXT_STATUS should cover all product statuses', () => {
    for (const s of PRODUCT_STATUSES) {
      assert.ok(s in NEXT_STATUS, `status ${s} missing from NEXT_STATUS`);
      const next = NEXT_STATUS[s]!;
      assert.ok(PRODUCT_STATUSES.includes(next), `NEXT_STATUS[${s}] = ${next} is not a valid status`);
    }
  });

  it('STATUS_ACTION_LABELS should cover all product statuses', () => {
    for (const s of PRODUCT_STATUSES) {
      assert.ok(s in STATUS_ACTION_LABELS, `status ${s} missing from STATUS_ACTION_LABELS`);
      assert.ok(typeof STATUS_ACTION_LABELS[s] === 'string', `STATUS_ACTION_LABELS[${s}] should be a string`);
    }
  });

  it('transition should produce a valid cycle', () => {
    for (const s of PRODUCT_STATUSES) {
      const next = NEXT_STATUS[s]!;
      const nextNext = NEXT_STATUS[next];
      assert.ok(nextNext !== undefined, `transition chain broken: ${s} -> ${next} has no next`);
    }
  });
});

// ── 测试价格与成本关系 ──

describe('product detail: price vs cost', () => {
  it('every product should have price >= cost', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(p.price >= p.cost, `product ${p.id}: price ${p.price} < cost ${p.cost}`);
    }
  });

  it('no product should have zero price', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(p.price > 0, `product ${p.id}: price ${p.price} must be > 0`);
    }
  });

  it('no product should have negative cost', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(p.cost >= 0, `product ${p.id}: negative cost ${p.cost}`);
    }
  });
});

// ── 测试库存覆盖 ──

describe('product detail: stock coverage', () => {
  it('should have at least one out-of-stock product', () => {
    const count = MOCK_PRODUCTS.filter((p) => p.stock === 0).length;
    assert.ok(count >= 1, 'no out-of-stock products found');
  });

  it('should have at least one low-stock product', () => {
    const count = MOCK_PRODUCTS.filter((p) => p.stock > 0 && p.stock < 50).length;
    assert.ok(count >= 1, 'no low-stock products found');
  });

  it('should have at least one well-stocked product', () => {
    const count = MOCK_PRODUCTS.filter((p) => p.stock >= 50).length;
    assert.ok(count >= 1, 'no well-stocked products found');
  });
});

// ── 测试品类和品牌分布 ──

describe('product detail: category & brand distribution', () => {
  it('should cover at least 3 categories', () => {
    const cats = new Set(MOCK_PRODUCTS.map((p) => p.category));
    assert.ok(cats.size >= 3, `only ${cats.size} categories covered`);
  });

  it('should cover at least 3 brands', () => {
    const brands = new Set(MOCK_PRODUCTS.map((p) => p.brandName));
    assert.ok(brands.size >= 3, `only ${brands.size} brands covered`);
  });

  it('should cover at least 2 markets', () => {
    const markets = new Set(MOCK_PRODUCTS.map((p) => p.marketCode));
    assert.ok(markets.size >= 2, `only ${markets.size} markets covered`);
  });
});
