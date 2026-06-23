/**
 * products-page.test.ts — Unit tests for products data and page logic
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
} from '../app/products-data';

// Helper: compute margin from price / cost
function marginPercent(item: Pick<ProductItem, 'price' | 'cost'>): number {
  return item.price > 0 ? ((item.price - item.cost) / item.price) * 100 : 0;
}

describe('products-data', () => {
  describe('MOCK_PRODUCTS', () => {
    it('should contain at least 10 products', () => {
      assert.ok(MOCK_PRODUCTS.length >= 10, `expected >= 10, got ${MOCK_PRODUCTS.length}`);
    });

    it('every product should have a unique id', () => {
      const ids = MOCK_PRODUCTS.map((p) => p.id);
      assert.strictEqual(new Set(ids).size, ids.length);
    });

    it('every product should have a unique sku', () => {
      const skus = MOCK_PRODUCTS.map((p) => p.sku);
      assert.strictEqual(new Set(skus).size, skus.length);
    });

    it('every product should have a valid status', () => {
      for (const p of MOCK_PRODUCTS) {
        assert.ok(
          PRODUCT_STATUSES.includes(p.status),
          `invalid status ${p.status} for ${p.id}`
        );
      }
    });

    it('every product should have a valid category', () => {
      for (const p of MOCK_PRODUCTS) {
        assert.ok(
          PRODUCT_CATEGORIES.includes(p.category),
          `invalid category ${p.category} for ${p.id}`
        );
      }
    });

    it('every product price should be positive', () => {
      for (const p of MOCK_PRODUCTS) {
        assert.ok(p.price > 0, `price must be > 0, got ${p.price} for ${p.id}`);
      }
    });

    it('every product cost should be positive', () => {
      for (const p of MOCK_PRODUCTS) {
        assert.ok(p.cost > 0, `cost must be > 0, got ${p.cost} for ${p.id}`);
      }
    });

    it('every product cost should not exceed price', () => {
      for (const p of MOCK_PRODUCTS) {
        assert.ok(
          p.cost <= p.price,
          `cost ${p.cost} exceeds price ${p.price} for ${p.id}`
        );
      }
    });

    it('stock should be non-negative', () => {
      for (const p of MOCK_PRODUCTS) {
        assert.ok(p.stock >= 0, `negative stock for ${p.id}`);
      }
    });

    it('should have products in multiple markets', () => {
      const markets = new Set(MOCK_PRODUCTS.map((p) => p.marketCode));
      assert.ok(markets.size >= 2, `expected >= 2 markets, got ${markets.size}`);
    });

    it('should have products in multiple categories', () => {
      const categories = new Set(MOCK_PRODUCTS.map((p) => p.category));
      assert.ok(categories.size >= 3, `expected >= 3 categories, got ${categories.size}`);
    });

    it('should have at least one product in each status', () => {
      for (const s of PRODUCT_STATUSES) {
        const count = MOCK_PRODUCTS.filter((p) => p.status === s).length;
        assert.ok(count > 0, `no products with status ${s}`);
      }
    });
  });

  describe('PRODUCT_STATUS_MAP', () => {
    it('should have entries for all statuses', () => {
      for (const s of PRODUCT_STATUSES) {
        assert.ok(PRODUCT_STATUS_MAP[s], `missing status ${s}`);
      }
    });

    it('each entry should have label and variant', () => {
      for (const s of PRODUCT_STATUSES) {
        const entry = PRODUCT_STATUS_MAP[s];
        assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
        assert.ok(
          ['success', 'warning', 'danger', 'neutral'].includes(entry.variant)
        );
      }
    });
  });

  describe('PRODUCT_CATEGORY_MAP', () => {
    it('should have entries for all categories', () => {
      for (const c of PRODUCT_CATEGORIES) {
        assert.ok(PRODUCT_CATEGORY_MAP[c], `missing category ${c}`);
      }
    });

    it('each entry should have label and variant', () => {
      for (const c of PRODUCT_CATEGORIES) {
        const entry = PRODUCT_CATEGORY_MAP[c];
        assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
        assert.ok(
          ['success', 'warning', 'danger', 'neutral', 'info'].includes(
            entry.variant
          )
        );
      }
    });
  });
});

describe('products filtering logic', () => {
  describe('status filter', () => {
    it('should filter by active status', () => {
      const result = MOCK_PRODUCTS.filter((p) => p.status === 'active');
      assert.ok(result.length > 0);
      for (const p of result) {
        assert.strictEqual(p.status, 'active');
      }
    });

    it('should filter by inactive status', () => {
      const result = MOCK_PRODUCTS.filter((p) => p.status === 'inactive');
      assert.ok(result.length > 0);
      for (const p of result) {
        assert.strictEqual(p.status, 'inactive');
      }
    });

    it('should filter by discontinued status', () => {
      const result = MOCK_PRODUCTS.filter((p) => p.status === 'discontinued');
      assert.ok(result.length > 0);
      for (const p of result) {
        assert.strictEqual(p.status, 'discontinued');
      }
    });

    it('should filter by draft status', () => {
      const result = MOCK_PRODUCTS.filter((p) => p.status === 'draft');
      assert.ok(result.length > 0);
      for (const p of result) {
        assert.strictEqual(p.status, 'draft');
      }
    });
  });

  describe('category filter', () => {
    it('should have at least 4 categories with products', () => {
      const populated = PRODUCT_CATEGORIES.filter(
        (cat) => MOCK_PRODUCTS.filter((p) => p.category === cat).length >= 1
      );
      assert.ok(populated.length >= 4, `only ${populated.length} categories populated`);
    });

    for (const cat of PRODUCT_CATEGORIES) {
      const count = MOCK_PRODUCTS.filter((p) => p.category === cat).length;
      if (count > 0) {
        it(`category ${cat} should have valid products`, () => {
          for (const p of MOCK_PRODUCTS.filter((pp) => pp.category === cat)) {
            assert.strictEqual(p.category, cat);
          }
        });
      }
    }
  });

  describe('search filter', () => {
    const searchFields: (keyof ProductItem)[] = ['sku', 'name', 'brandName', 'storeName'];

    function searchBy(
      items: ProductItem[],
      term: string
    ): ProductItem[] {
      if (!term.trim()) return items;
      const lower = term.toLowerCase();
      return items.filter((item) =>
        searchFields.some((key) =>
          String(item[key]).toLowerCase().includes(lower)
        )
      );
    }

    it('should match by SKU', () => {
      const result = searchBy(MOCK_PRODUCTS, 'SKU-10001');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 'p-001');
    });

    it('should match by name (case-insensitive)', () => {
      const result = searchBy(MOCK_PRODUCTS, '面包');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 'p-001');
    });

    it('should match by brand', () => {
      const result = searchBy(MOCK_PRODUCTS, '清泉');
      assert.ok(result.length >= 1);
    });

    it('should match by store name', () => {
      const result = searchBy(MOCK_PRODUCTS, '朝阳');
      assert.ok(result.length >= 1);
    });

    it('should return empty for non-matching search', () => {
      const result = searchBy(MOCK_PRODUCTS, 'xyz-nonexistent-99999');
      assert.strictEqual(result.length, 0);
    });

    it('empty search should return all items', () => {
      const result = searchBy(MOCK_PRODUCTS, '');
      assert.strictEqual(result.length, MOCK_PRODUCTS.length);
    });
  });

  describe('market filter', () => {
    it('should filter by CN-BJ market', () => {
      const result = MOCK_PRODUCTS.filter((p) => p.marketCode === 'CN-BJ');
      assert.ok(result.length >= 2);
      for (const p of result) {
        assert.strictEqual(p.marketCode, 'CN-BJ');
      }
    });

    it('should filter by CN-SH market', () => {
      const result = MOCK_PRODUCTS.filter((p) => p.marketCode === 'CN-SH');
      assert.ok(result.length >= 2);
      for (const p of result) {
        assert.strictEqual(p.marketCode, 'CN-SH');
      }
    });

    it('should filter by CN-GZ market', () => {
      const result = MOCK_PRODUCTS.filter((p) => p.marketCode === 'CN-GZ');
      assert.ok(result.length >= 1);
      for (const p of result) {
        assert.strictEqual(p.marketCode, 'CN-GZ');
      }
    });
  });

  describe('margin filter', () => {
    it('should identify high-margin products (>=50%)', () => {
      const result = MOCK_PRODUCTS.filter(
        (p) => marginPercent(p) >= 50
      );
      assert.ok(result.length >= 0);
      for (const p of result) {
        assert.ok(marginPercent(p) >= 50);
      }
    });

    it('should identify medium-margin products (30-50%)', () => {
      const result = MOCK_PRODUCTS.filter(
        (p) => marginPercent(p) >= 30 && marginPercent(p) < 50
      );
      for (const p of result) {
        assert.ok(marginPercent(p) >= 30 && marginPercent(p) < 50);
      }
    });

    it('should identify low-margin products (<30%)', () => {
      const result = MOCK_PRODUCTS.filter(
        (p) => marginPercent(p) < 30
      );
      for (const p of result) {
        assert.ok(marginPercent(p) < 30);
      }
    });

    it('margin should be computable for all products', () => {
      for (const p of MOCK_PRODUCTS) {
        const m = marginPercent(p);
        assert.ok(!Number.isNaN(m), `NaN margin for ${p.id}`);
        assert.ok(m >= 0, `negative margin for ${p.id}: ${m}`);
      }
    });
  });

  describe('pagination logic', () => {
    it('should paginate items correctly', () => {
      const pageSize = 5;
      const page = 0;
      const start = page * pageSize;
      const end = start + pageSize;
      const pageItems = MOCK_PRODUCTS.slice(start, end);
      assert.strictEqual(pageItems.length, pageSize);
      assert.strictEqual(pageItems[0]?.id, MOCK_PRODUCTS[0]?.id);
    });

    it('last page should handle fewer items', () => {
      const pageSize = 10;
      const totalPages = Math.ceil(MOCK_PRODUCTS.length / pageSize);
      const lastPage = totalPages - 1;
      const start = lastPage * pageSize;
      const pageItems = MOCK_PRODUCTS.slice(start);
      assert.ok(pageItems.length <= pageSize);
    });
  });

  describe('sorting logic', () => {
    it('should sort by price ascending', () => {
      const sorted = [...MOCK_PRODUCTS].sort((a, b) => a.price - b.price);
      assert.ok((sorted[0]?.price ?? 0) <= (sorted[sorted.length - 1]?.price ?? 0));
      assert.ok(
        sorted.every(
          (_, i) => i === 0 || (sorted[i]?.price ?? 0) >= (sorted[i - 1]?.price ?? 0)
        )
      );
    });

    it('should sort by stock descending', () => {
      const sorted = [...MOCK_PRODUCTS].sort((a, b) => b.stock - a.stock);
      assert.ok((sorted[0]?.stock ?? 0) >= (sorted[sorted.length - 1]?.stock ?? 0));
      assert.ok(
        sorted.every(
          (_, i) => i === 0 || (sorted[i]?.stock ?? 0) <= (sorted[i - 1]?.stock ?? 0)
        )
      );
    });

    it('should sort by margin', () => {
      const sorted = [...MOCK_PRODUCTS].sort(
        (a, b) => marginPercent(b) - marginPercent(a)
      );
      assert.ok(
        marginPercent(sorted[0] ?? { price: 0, cost: 0 }) >=
          marginPercent(sorted[sorted.length - 1] ?? { price: 0, cost: 0 })
      );
    });
  });

  describe('composite filter: status + category', () => {
    it('active food products should exist', () => {
      const result = MOCK_PRODUCTS.filter(
        (p) => p.status === 'active' && p.category === 'food'
      );
      assert.ok(result.length >= 1);
    });

    it('active electronics should exist', () => {
      const result = MOCK_PRODUCTS.filter(
        (p) => p.status === 'active' && p.category === 'electronics'
      );
      assert.ok(result.length >= 1);
    });
  });

  describe('stats computation', () => {
    it('should compute correct counts', () => {
      const total = MOCK_PRODUCTS.length;
      const active = MOCK_PRODUCTS.filter((p) => p.status === 'active').length;
      const outOfStock = MOCK_PRODUCTS.filter((p) => p.stock === 0).length;
      const lowStock = MOCK_PRODUCTS.filter(
        (p) => p.stock > 0 && p.stock < 50
      ).length;

      assert.ok(active <= total);
      assert.ok(outOfStock >= 1, 'should have at least one out-of-stock product');
      assert.ok(lowStock >= 0);
    });

    it('should compute correct average margin', () => {
      const margins = MOCK_PRODUCTS.map(marginPercent);
      const avg = margins.reduce((sum, m) => sum + m, 0) / margins.length;
      assert.ok(avg > 0);
      assert.ok(avg < 100);
    });
  });
});
