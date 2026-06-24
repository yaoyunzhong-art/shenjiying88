/**
 * TOB products-data module unit tests
 *
 * Validates the data layer (stateless functions + mock data)
 * used by the product list and detail pages.
 *
 * Covers: search/filter/sort, pagination, aggregate functions,
 * and mock data integrity.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  MOCK_PRODUCTS,
  PRODUCT_STATUSES,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUS_MAP,
  PRODUCT_CATEGORY_MAP,
  searchProducts,
  filterProductsByCategory,
  filterProductsByStatus,
  sortProducts,
  paginateProducts,
  getAggregateStats,
  exportProductCSV,
  type ProductItem,
  type ProductFilterState,
} from './index';

describe('products-data: export contracts', () => {
  it('should export MOCK_PRODUCTS as a non-empty array', () => {
    assert.ok(Array.isArray(MOCK_PRODUCTS), 'MOCK_PRODUCTS should be an array');
    assert.ok(MOCK_PRODUCTS.length > 0, 'MOCK_PRODUCTS should not be empty');
  });

  it('should export PRODUCT_STATUSES as a non-empty string array', () => {
    assert.ok(Array.isArray(PRODUCT_STATUSES), 'PRODUCT_STATUSES should be an array');
    assert.ok(PRODUCT_STATUSES.length >= 4, 'should cover at least 4 statuses');
  });

  it('should export PRODUCT_CATEGORIES covering all categories', () => {
    assert.ok(Array.isArray(PRODUCT_CATEGORIES), 'PRODUCT_CATEGORIES should be an array');
    assert.ok(PRODUCT_CATEGORIES.length >= 6, 'should cover 6 categories');
  });

  it('should export PRODUCT_STATUS_MAP with labels for each status', () => {
    for (const s of PRODUCT_STATUSES) {
      assert.ok(PRODUCT_STATUS_MAP[s], `missing entry for status ${s}`);
      assert.ok(typeof PRODUCT_STATUS_MAP[s].label === 'string');
    }
  });

  it('should export PRODUCT_CATEGORY_MAP with labels for each category', () => {
    for (const c of PRODUCT_CATEGORIES) {
      assert.ok(PRODUCT_CATEGORY_MAP[c], `missing entry for category ${c}`);
      assert.ok(typeof PRODUCT_CATEGORY_MAP[c].label === 'string');
    }
  });

  it('should export all expected utility functions', () => {
    assert.equal(typeof searchProducts, 'function');
    assert.equal(typeof filterProductsByCategory, 'function');
    assert.equal(typeof filterProductsByStatus, 'function');
    assert.equal(typeof sortProducts, 'function');
    assert.equal(typeof paginateProducts, 'function');
    assert.equal(typeof getAggregateStats, 'function');
    assert.equal(typeof exportProductCSV, 'function');
  });
});

describe('products-data: mock data integrity', () => {
  it('every product should have unique id and sku', () => {
    const ids = new Set(MOCK_PRODUCTS.map((p) => p.id));
    const skus = new Set(MOCK_PRODUCTS.map((p) => p.sku));
    assert.equal(ids.size, MOCK_PRODUCTS.length, 'duplicate ids found');
    assert.equal(skus.size, MOCK_PRODUCTS.length, 'duplicate SKUs found');
  });

  it('every product should have valid required fields', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(p.name && p.name.length > 0, `product ${p.id}: missing name`);
      assert.ok(p.price > 0, `product ${p.id}: price must be > 0`);
      assert.ok(p.cost >= 0, `product ${p.id}: cost must be >= 0`);
      assert.ok(p.stock >= 0, `product ${p.id}: stock must be >= 0`);
      assert.ok(
        PRODUCT_STATUSES.includes(p.status),
        `product ${p.id}: invalid status "${p.status}"`,
      );
    }
  });

  it('every product should have price >= cost', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(p.price >= p.cost, `product ${p.id}: price ${p.price} < cost ${p.cost}`);
    }
  });

  it('should have diverse categories, brands, and markets', () => {
    const cats = new Set(MOCK_PRODUCTS.map((p) => p.category));
    const brands = new Set(MOCK_PRODUCTS.map((p) => p.brandName));
    const markets = new Set(MOCK_PRODUCTS.map((p) => p.marketCode));
    assert.ok(cats.size >= 3, `only ${cats.size} categories`);
    assert.ok(brands.size >= 3, `only ${brands.size} brands`);
    assert.ok(markets.size >= 2, `only ${markets.size} markets`);
  });
});

describe('products-data: search', () => {
  it('should return all products for empty query', () => {
    const result = searchProducts(MOCK_PRODUCTS, '');
    assert.equal(result.length, MOCK_PRODUCTS.length);
  });

  it('should find by product name (case-insensitive)', () => {
    const first: ProductItem = MOCK_PRODUCTS[0]!;
    const partial = first.name.slice(0, 4);
    const result = searchProducts(MOCK_PRODUCTS, partial);
    assert.ok(result.length >= 1, `should find at least 1 product matching "${partial}"`);
    assert.ok(
      result.some((p) => p.id === first.id),
      `should include product ${first.id}`,
    );
  });

  it('should find by SKU', () => {
    const first: ProductItem = MOCK_PRODUCTS[0]!;
    const result = searchProducts(MOCK_PRODUCTS, first.sku);
    assert.ok(result.length >= 1, 'should find by SKU');
    assert.ok(
      result.some((p) => p.id === first.id),
      'should include the matched product',
    );
  });

  it('should find by brand name', () => {
    const first: ProductItem = MOCK_PRODUCTS[0]!;
    const result = searchProducts(MOCK_PRODUCTS, first.brandName.slice(0, 4));
    assert.ok(result.length >= 1, 'should find by brand name');
  });

  it('should be case-insensitive', () => {
    const first: ProductItem = MOCK_PRODUCTS[0]!;
    const upper = first.name.toUpperCase();
    const lower = first.name.toLowerCase();
    const upperResult = searchProducts(MOCK_PRODUCTS, upper);
    const lowerResult = searchProducts(MOCK_PRODUCTS, lower);
    assert.ok(upperResult.length >= 1);
    assert.equal(upperResult.length, lowerResult.length);
  });
});

describe('products-data: filter by category', () => {
  it('should return all products when category is empty string', () => {
    const result = filterProductsByCategory(MOCK_PRODUCTS, '');
    assert.equal(result.length, MOCK_PRODUCTS.length);
  });

  it('should return all products when category is "all"', () => {
    const result = filterProductsByCategory(MOCK_PRODUCTS, 'all');
    assert.equal(result.length, MOCK_PRODUCTS.length);
  });

  it('should filter products by specific category', () => {
    const cats = [...new Set(MOCK_PRODUCTS.map((p) => p.category))];
    const targetCat = cats[0]!;
    const result = filterProductsByCategory(MOCK_PRODUCTS, targetCat);
    assert.ok(result.length > 0, `should find products in ${targetCat}`);
    assert.ok(
      result.every((p) => p.category === targetCat),
      'all results should match category',
    );
  });

  it('should return products filtered by category correctly', () => {
    const allResult = filterProductsByCategory(MOCK_PRODUCTS, 'all');
    assert.equal(allResult.length, MOCK_PRODUCTS.length);
    const foodResult = filterProductsByCategory(MOCK_PRODUCTS, 'food');
    assert.ok(foodResult.every((p) => p.category === 'food'));
  });
});

describe('products-data: filter by status', () => {
  it('should return all products when status is empty string', () => {
    const result = filterProductsByStatus(MOCK_PRODUCTS, '');
    assert.equal(result.length, MOCK_PRODUCTS.length);
  });

  it('should return all products when status is "all"', () => {
    const result = filterProductsByStatus(MOCK_PRODUCTS, 'all');
    assert.equal(result.length, MOCK_PRODUCTS.length);
  });

  it('should filter by a specific status', () => {
    const targetStatus = 'active';
    const result = filterProductsByStatus(MOCK_PRODUCTS, targetStatus);
    assert.ok(result.length >= 1, `should find active products`);
    assert.ok(
      result.every((p) => p.status === targetStatus),
      'all results should match status',
    );
  });
});

describe('products-data: sort', () => {
  it('should preserve original order for default/empty sort', () => {
    const result = sortProducts(MOCK_PRODUCTS, undefined);
    assert.deepEqual(
      result.map((p) => p.id),
      MOCK_PRODUCTS.map((p) => p.id),
    );
  });

  it('should sort by price ascending', () => {
    // Check products-data/index for sort field naming — assume "price" or "createdAt"
    const result = sortProducts(MOCK_PRODUCTS, { field: 'price', direction: 'asc' });
    for (let i = 1; i < result.length; i++) {
      assert.ok(result[i]!.price >= result[i - 1]!.price, `price descending at index ${i}`);
    }
  });

  it('should sort by price descending', () => {
    const result = sortProducts(MOCK_PRODUCTS, { field: 'price', direction: 'desc' });
    for (let i = 1; i < result.length; i++) {
      assert.ok(result[i]!.price <= result[i - 1]!.price, `price ascending at index ${i}`);
    }
  });

  it('should sort by name alphabetically', () => {
    const result = sortProducts(MOCK_PRODUCTS, { field: 'name', direction: 'asc' });
    for (let i = 1; i < result.length; i++) {
      assert.ok(result[i]!.name >= result[i - 1]!.name, `name out of order at index ${i}`);
    }
  });

  it('should sort by stock', () => {
    const result = sortProducts(MOCK_PRODUCTS, { field: 'stock', direction: 'desc' });
    for (let i = 1; i < result.length; i++) {
      assert.ok(result[i]!.stock <= result[i - 1]!.stock, `stock descending at index ${i}`);
    }
  });
});

describe('products-data: paginate', () => {
  const allIds = MOCK_PRODUCTS.map((p) => p.id);

  it('should return all items when pageSize > total', () => {
    const result = paginateProducts(allIds, 1, 9999);
    assert.equal(result.length, allIds.length);
  });

  it('should return correct slice for page 1', () => {
    const result = paginateProducts(allIds, 1, 5);
    assert.equal(result.length, 5);
    assert.deepEqual(result, allIds.slice(0, 5));
  });

  it('should return correct slice for page 2', () => {
    const result = paginateProducts(allIds, 2, 5);
    assert.equal(result.length, Math.min(5, Math.max(0, allIds.length - 5)));
    assert.deepEqual(result, allIds.slice(5, 10));
  });

  it('should return empty for page beyond the range', () => {
    const lastPage = Math.ceil(allIds.length / 5);
    const result = paginateProducts(allIds, lastPage + 1, 5);
    assert.equal(result.length, 0);
  });
});

describe('products-data: aggregate stats', () => {
  it('should return counts for all statuses', () => {
    const stats = getAggregateStats(MOCK_PRODUCTS);
    assert.ok(stats, 'stats should be returned');
    assert.ok(
      stats.total === MOCK_PRODUCTS.length,
      `total should be ${MOCK_PRODUCTS.length}, got ${stats.total}`,
    );
    for (const s of PRODUCT_STATUSES) {
      assert.ok(typeof stats.statusCounts[s] === 'number', `missing count for status ${s}`);
    }
  });

  it('status counts should sum to total', () => {
    const stats = getAggregateStats(MOCK_PRODUCTS);
    const sum = Object.values(stats.statusCounts).reduce((a: number, b: number) => a + b, 0);
    assert.equal(sum, stats.total, `status counts ${sum} should equal total ${stats.total}`);
  });
});

describe('products-data: export CSV', () => {
  it('should return a CSV string', () => {
    const csv = exportProductCSV(MOCK_PRODUCTS);
    assert.ok(typeof csv === 'string', 'should return a string');
    assert.ok(csv.startsWith('id,'), 'should start with header row');
  });

  it('should have correct number of data rows', () => {
    const csv = exportProductCSV(MOCK_PRODUCTS);
    const lines = csv.trim().split('\n');
    assert.equal(lines.length, MOCK_PRODUCTS.length + 1, 'header + data rows');
  });

  it('should contain known product names', () => {
    const csv = exportProductCSV(MOCK_PRODUCTS);
    for (const p of MOCK_PRODUCTS) {
      assert.ok(csv.includes(p.name), `CSV should contain product name "${p.name}"`);
    }
  });
});

describe('products-data: ProductFilterState type', () => {
  it('should allow constructing a valid filter state', () => {
    const filter: ProductFilterState = {
      search: '',
      category: 'all',
      status: 'all',
      sortField: 'name',
      sortDirection: 'asc',
      page: 1,
      pageSize: 10,
    };
    assert.equal(filter.page, 1);
    assert.equal(filter.pageSize, 10);
    assert.equal(filter.sortField, 'name');
    assert.equal(filter.sortDirection, 'asc');
  });

  it('should accept relaxed search field', () => {
    const filter: ProductFilterState = {
      search: 'test',
      category: '',
      status: '',
      sortField: 'name',
      sortDirection: 'asc',
      page: 1,
      pageSize: 20,
    };
    assert.equal(filter.search, 'test');
  });
});
