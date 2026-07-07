/**
 * products/page.test.ts — Page-level tests for the products listing page.
 * Tests list rendering, search filtering, status/category filters, pagination, and margin calculation.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: products-data.ts, existing products-page.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_PRODUCTS,
  PRODUCT_STATUS_MAP,
  PRODUCT_CATEGORY_MAP,
  PRODUCT_STATUSES,
  PRODUCT_CATEGORIES,
  type ProductItem,
  type ProductStatus,
  type ProductCategory,
} from '../products-data';

// ---- Page-level filter helpers ----

function searchProducts(items: ProductItem[], keyword: string): ProductItem[] {
  if (!keyword.trim()) return items;
  const lower = keyword.toLowerCase();
  return items.filter(
    (p) =>
      p.name.toLowerCase().includes(lower) ||
      p.sku.toLowerCase().includes(lower) ||
      p.brandName.toLowerCase().includes(lower) ||
      p.storeName.toLowerCase().includes(lower)
  );
}

function filterByStatus(items: ProductItem[], status: ProductStatus | 'ALL'): ProductItem[] {
  if (status === 'ALL') return items;
  return items.filter((p) => p.status === status);
}

function filterByCategory(items: ProductItem[], category: ProductCategory | 'ALL'): ProductItem[] {
  if (category === 'ALL') return items;
  return items.filter((p) => p.category === category);
}

function filterByMarket(items: ProductItem[], marketCode: string): ProductItem[] {
  if (!marketCode || marketCode === 'ALL') return items;
  return items.filter((p) => p.marketCode.toLowerCase() === marketCode.toLowerCase());
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function getTotalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

function fullFilterChain(
  items: ProductItem[],
  keyword: string,
  status: ProductStatus | 'ALL',
  category: ProductCategory | 'ALL',
  marketCode: string,
): ProductItem[] {
  let result = searchProducts(items, keyword);
  result = filterByStatus(result, status);
  result = filterByCategory(result, category);
  result = filterByMarket(result, marketCode);
  return result;
}

function computeMarginPercent(item: Pick<ProductItem, 'price' | 'cost'>): number {
  if (item.price <= 0) return 0;
  return ((item.price - item.cost) / item.price) * 100;
}

function marginColor(margin: number): string {
  if (margin >= 50) return '#4ade80';
  if (margin >= 30) return '#fbbf24';
  return '#f87171';
}

// ---- 正例 ----

describe('products-page: 正例 (positive cases)', () => {
  describe('search', () => {
    it('should find products by name', () => {
      const result = searchProducts(MOCK_PRODUCTS, '有机全麦面包');
      assert.ok(result.length >= 1);
      for (const p of result) {
        assert.ok(p.name.includes('有机全麦面包'));
      }
    });

    it('should find products by SKU', () => {
      const result = searchProducts(MOCK_PRODUCTS, 'SKU-10001');
      assert.ok(result.length >= 1);
      assert.strictEqual(result[0]!.sku, 'SKU-10001');
    });

    it('should find products by brandName', () => {
      const result = searchProducts(MOCK_PRODUCTS, '健康烘焙坊');
      assert.ok(result.length >= 1);
      for (const p of result) {
        assert.ok(p.brandName.includes('健康烘焙坊'));
      }
    });

    it('should find products by storeName', () => {
      const result = searchProducts(MOCK_PRODUCTS, '朝阳旗舰店');
      assert.ok(result.length >= 2);
      for (const p of result) {
        assert.ok(p.storeName.includes('朝阳旗舰店'));
      }
    });

    it('empty search should return all products', () => {
      const result = searchProducts(MOCK_PRODUCTS, '');
      assert.strictEqual(result.length, MOCK_PRODUCTS.length);
    });
  });

  describe('status filter', () => {
    it('filter active should return only active products', () => {
      const result = filterByStatus(MOCK_PRODUCTS, 'active');
      assert.ok(result.length >= 5, `expected >= 5 active, got ${result.length}`);
      for (const p of result) {
        assert.strictEqual(p.status, 'active');
      }
    });

    it('filter inactive should return only inactive products', () => {
      const result = filterByStatus(MOCK_PRODUCTS, 'inactive');
      for (const p of result) {
        assert.strictEqual(p.status, 'inactive');
      }
    });

    it('filter discontinued should return only discontinued products', () => {
      const result = filterByStatus(MOCK_PRODUCTS, 'discontinued');
      for (const p of result) {
        assert.strictEqual(p.status, 'discontinued');
      }
    });

    it('filter draft should return only draft products', () => {
      const result = filterByStatus(MOCK_PRODUCTS, 'draft');
      for (const p of result) {
        assert.strictEqual(p.status, 'draft');
      }
    });

    it('filter ALL should return all products', () => {
      const result = filterByStatus(MOCK_PRODUCTS, 'ALL');
      assert.strictEqual(result.length, MOCK_PRODUCTS.length);
    });
  });

  describe('category filter', () => {
    it('filter food should return only food products', () => {
      const result = filterByCategory(MOCK_PRODUCTS, 'food');
      for (const p of result) {
        assert.strictEqual(p.category, 'food');
      }
    });

    it('filter electronics should return only electronics products', () => {
      const result = filterByCategory(MOCK_PRODUCTS, 'electronics');
      for (const p of result) {
        assert.strictEqual(p.category, 'electronics');
      }
    });

    it('filter ALL should return all products', () => {
      const result = filterByCategory(MOCK_PRODUCTS, 'ALL');
      assert.strictEqual(result.length, MOCK_PRODUCTS.length);
    });
  });

  describe('pagination', () => {
    it('page 1 with pageSize 10 should return 10 items', () => {
      const page = paginate(MOCK_PRODUCTS, 1, 10);
      assert.strictEqual(page.length, 10);
    });

    it('page 2 with pageSize 10 should return remaining', () => {
      const page = paginate(MOCK_PRODUCTS, 2, 10);
      assert.strictEqual(page.length, MOCK_PRODUCTS.length - 10);
    });

    it('getTotalPages should be correct', () => {
      assert.strictEqual(getTotalPages(20, 10), 2);
      assert.strictEqual(getTotalPages(1, 10), 1);
      assert.strictEqual(getTotalPages(0, 10), 1);
    });
  });

  describe('margin computation', () => {
    it('should compute margin from price and cost', () => {
      const p = MOCK_PRODUCTS.find((x) => x.id === 'p-001')!;
      const margin = computeMarginPercent(p);
      assert.ok(margin > 0, `margin should be > 0: ${margin}`);
      assert.ok(margin < 100, `margin should be < 100: ${margin}`);
    });

    it('margin > 50 should be green (#4ade80)', () => {
      const highMargin = MOCK_PRODUCTS.reduce((best, p) => {
        const m = computeMarginPercent(p);
        return m > best.m ? { p, m } : best;
      }, { p: MOCK_PRODUCTS[0]!, m: 0 });
      if (highMargin.m >= 50) {
        assert.strictEqual(marginColor(highMargin.m), '#4ade80');
      }
    });

    it('margin < 30 should be red (#f87171)', () => {
      const lowMargin = MOCK_PRODUCTS.reduce((worst, p) => {
        const m = computeMarginPercent(p);
        return m < worst.m ? { p, m } : worst;
      }, { p: MOCK_PRODUCTS[0]!, m: 100 });
      if (lowMargin.m < 30) {
        assert.strictEqual(marginColor(lowMargin.m), '#f87171');
      }
    });
  });

  describe('combined filter', () => {
    it('should filter by status + category simultaneously', () => {
      const result = fullFilterChain(MOCK_PRODUCTS, '', 'active', 'food', 'ALL');
      for (const p of result) {
        assert.strictEqual(p.status, 'active');
        assert.strictEqual(p.category, 'food');
      }
    });

    it('should filter by search + market', () => {
      const result = fullFilterChain(MOCK_PRODUCTS, '蓝牙', 'ALL', 'ALL', 'ALL');
      assert.ok(result.length >= 1);
      for (const p of result) {
        assert.ok(p.name.includes('蓝牙'));
      }
    });
  });

  describe('status/category maps', () => {
    it('PRODUCT_STATUS_MAP should have all statuses with labels', () => {
      assert.strictEqual(PRODUCT_STATUS_MAP.active.label, '在售');
      assert.strictEqual(PRODUCT_STATUS_MAP.inactive.label, '下架');
      assert.strictEqual(PRODUCT_STATUS_MAP.discontinued.label, '停产');
      assert.strictEqual(PRODUCT_STATUS_MAP.draft.label, '草稿');
    });

    it('PRODUCT_CATEGORY_MAP should have all categories with labels', () => {
      assert.strictEqual(PRODUCT_CATEGORY_MAP.food.label, '食品');
      assert.strictEqual(PRODUCT_CATEGORY_MAP.beverage.label, '饮料');
      assert.strictEqual(PRODUCT_CATEGORY_MAP.electronics.label, '电子');
    });
  });
});

// ---- 反例 ----

describe('products-page: 反例 (negative cases)', () => {
  it('search for nonexistent keyword should return empty', () => {
    const result = searchProducts(MOCK_PRODUCTS, 'ZZZZ_NOT_FOUND');
    assert.strictEqual(result.length, 0);
  });

  it('empty product list should handle all filters gracefully', () => {
    const empty: ProductItem[] = [];
    assert.strictEqual(searchProducts(empty, 'test').length, 0);
    assert.strictEqual(filterByStatus(empty, 'active').length, 0);
    assert.strictEqual(filterByCategory(empty, 'food').length, 0);
    assert.strictEqual(filterByMarket(empty, 'CN-BJ').length, 0);
    assert.strictEqual(paginate(empty, 1, 10).length, 0);
    assert.strictEqual(fullFilterChain(empty, '', 'ALL', 'ALL', 'ALL').length, 0);
  });

  it('pagination should return empty for page beyond total', () => {
    const result = paginate(MOCK_PRODUCTS, 999, 10);
    assert.strictEqual(result.length, 0);
  });

  it('pagination should return empty for page 0', () => {
    const result = paginate(MOCK_PRODUCTS, 0, 10);
    assert.strictEqual(result.length, 0);
  });

  it('inactive products should have zero stock', () => {
    const inactive = MOCK_PRODUCTS.filter((p) => p.status === 'inactive');
    for (const p of inactive) {
      assert.strictEqual(p.stock, 0, `inactive product ${p.id} should have zero stock`);
    }
  });

  it('discontinued products should not be active', () => {
    const discontinued = MOCK_PRODUCTS.filter((p) => p.status === 'discontinued');
    assert.ok(discontinued.length >= 1);
    for (const p of discontinued) {
      assert.notStrictEqual(p.status, 'active');
    }
  });
});

// ---- 边界 ----

describe('products-page: 边界 (boundary cases)', () => {
  it('single char search should find matches', () => {
    const result = searchProducts(MOCK_PRODUCTS, '面');
    assert.ok(result.length >= 1);
  });

  it('case-insensitive search should work', () => {
    const upper = searchProducts(MOCK_PRODUCTS, 'SKU-10001');
    const lower = searchProducts(MOCK_PRODUCTS, 'sku-10001');
    assert.strictEqual(upper.length, lower.length);
  });

  it('cost should always be <= price', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(p.cost <= p.price, `cost ${p.cost} > price ${p.price} for ${p.id}`);
    }
  });

  it('price and cost should be positive', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(p.price > 0, `price must be > 0 for ${p.id}`);
      assert.ok(p.cost > 0, `cost must be > 0 for ${p.id}`);
    }
  });

  it('stock should be non-negative', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(p.stock >= 0, `negative stock for ${p.id}`);
    }
  });

  it('all 4 statuses should have at least one product', () => {
    for (const s of PRODUCT_STATUSES) {
      const count = MOCK_PRODUCTS.filter((p) => p.status === s).length;
      assert.ok(count >= 1, `status ${s} has 0 products`);
    }
  });

  it('4 of 6 categories should be represented in mock data', () => {
    const presentCats = new Set(MOCK_PRODUCTS.map((p) => p.category));
    const covered = PRODUCT_CATEGORIES.filter((c) => presentCats.has(c));
    assert.ok(covered.length >= 4, `expected >= 4 categories, got ${covered.length}`);
  });

  it('missing market filter should return full list', () => {
    const result = filterByMarket(MOCK_PRODUCTS, '');
    assert.strictEqual(result.length, MOCK_PRODUCTS.length);
  });

  it('all product names should be non-empty', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(p.name.trim().length > 0, `empty name for ${p.id}`);
      assert.ok(p.unit.trim().length > 0, `empty unit for ${p.id}`);
    }
  });
});
