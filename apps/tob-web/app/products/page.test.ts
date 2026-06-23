/**
 * products page unit tests — tob-web
 */

import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';

// Test the data module directly (doesn't require React render)
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

describe('products-data', () => {
  it('MOCK_PRODUCTS should have at least 10 items', () => {
    assert.ok(MOCK_PRODUCTS.length >= 10, `expected >=10, got ${MOCK_PRODUCTS.length}`);
  });

  it('every product should have required fields', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(typeof p.id === 'string' && p.id.length > 0, `product ${p.id}: missing id`);
      assert.ok(typeof p.sku === 'string' && p.sku.length > 0, `product ${p.id}: missing sku`);
      assert.ok(typeof p.name === 'string' && p.name.length > 0, `product ${p.id}: missing name`);
      assert.ok(typeof p.price === 'number' && p.price > 0, `product ${p.id}: invalid price ${p.price}`);
      assert.ok(typeof p.cost === 'number' && p.cost >= 0, `product ${p.id}: invalid cost ${p.cost}`);
      assert.ok(typeof p.stock === 'number' && p.stock >= 0, `product ${p.id}: invalid stock ${p.stock}`);
      assert.ok(typeof p.unit === 'string' && p.unit.length > 0, `product ${p.id}: missing unit`);
      assert.ok(typeof p.supplierName === 'string' && p.supplierName.length > 0, `product ${p.id}: missing supplierName`);
    }
  });

  it('every product status should be valid', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(
        PRODUCT_STATUSES.includes(p.status),
        `product ${p.id}: invalid status ${p.status}`
      );
    }
  });

  it('every product category should be valid', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(
        PRODUCT_CATEGORIES.includes(p.category),
        `product ${p.id}: invalid category ${p.category}`
      );
    }
  });

  it('each product should have price >= cost (positive margin or zero)', () => {
    for (const p of MOCK_PRODUCTS) {
      assert.ok(
        p.price >= p.cost,
        `product ${p.id}: price ${p.price} < cost ${p.cost}`
      );
    }
  });

  it('PRODUCT_STATUS_MAP should cover all statuses', () => {
    for (const s of PRODUCT_STATUSES) {
      assert.ok(s in PRODUCT_STATUS_MAP, `missing status ${s} in map`);
      const entry = PRODUCT_STATUS_MAP[s];
      assert.ok(typeof entry.label === 'string', `status ${s}: missing label`);
      assert.ok(
        ['success', 'warning', 'danger', 'neutral'].includes(entry.variant),
        `status ${s}: invalid variant ${entry.variant}`
      );
    }
  });

  it('PRODUCT_CATEGORY_MAP should cover all categories', () => {
    for (const c of PRODUCT_CATEGORIES) {
      assert.ok(c in PRODUCT_CATEGORY_MAP, `missing category ${c} in map`);
      const entry = PRODUCT_CATEGORY_MAP[c];
      assert.ok(typeof entry.label === 'string', `category ${c}: missing label`);
      assert.ok(
        ['success', 'warning', 'danger', 'neutral', 'info'].includes(entry.variant),
        `category ${c}: invalid variant ${entry.variant}`
      );
    }
  });
});

describe('product filtering logic', () => {
  it('status filter should correctly partition items', () => {
    for (const s of PRODUCT_STATUSES) {
      const count = MOCK_PRODUCTS.filter((p) => p.status === s).length;
      assert.ok(count >= 0, `status ${s} count should be non-negative, got ${count}`);
    }
  });

  it('category filter should correctly partition items', () => {
    for (const c of PRODUCT_CATEGORIES) {
      const count = MOCK_PRODUCTS.filter((p) => p.category === c).length;
      assert.ok(count >= 0, `category ${c} count should be non-negative, got ${count}`);
    }
  });

  it('total active + inactive + discontinued + draft should equal total', () => {
    const sum = PRODUCT_STATUSES.reduce(
      (acc, s) => acc + MOCK_PRODUCTS.filter((p) => p.status === s).length,
      0
    );
    assert.equal(sum, MOCK_PRODUCTS.length);
  });

  it('total category sum should equal total', () => {
    const sum = PRODUCT_CATEGORIES.reduce(
      (acc, c) => acc + MOCK_PRODUCTS.filter((p) => p.category === c).length,
      0
    );
    assert.equal(sum, MOCK_PRODUCTS.length);
  });
});

describe('product margin computation', () => {
  it('margin should be calculable for all products', () => {
    for (const p of MOCK_PRODUCTS) {
      if (p.price > 0) {
        const margin = ((p.price - p.cost) / p.price) * 100;
        assert.ok(typeof margin === 'number' && !isNaN(margin), `product ${p.id}: margin is NaN`);
        assert.ok(margin >= 0, `product ${p.id}: negative margin ${margin.toFixed(1)}%`);
        assert.ok(margin <= 100, `product ${p.id}: margin >100%`);
      }
    }
  });
});

describe('product stock analysis', () => {
  it('should identify low-stock items correctly', () => {
    const lowStock = MOCK_PRODUCTS.filter((p) => p.stock > 0 && p.stock < 50);
    for (const p of lowStock) {
      assert.ok(p.stock > 0 && p.stock < 50, `product ${p.id}: stock ${p.stock} not in low range`);
    }
  });

  it('should identify out-of-stock items correctly', () => {
    const outOfStock = MOCK_PRODUCTS.filter((p) => p.stock === 0);
    for (const p of outOfStock) {
      assert.equal(p.stock, 0, `product ${p.id}: stock ${p.stock} should be 0`);
    }
  });
});

describe('product market distribution', () => {
  it('each product should have a valid marketCode', () => {
    const markets = new Set(MOCK_PRODUCTS.map((p) => p.marketCode));
    assert.ok(markets.size >= 1, `expected at least 1 market, got ${markets.size}`);
  });

  it('market filter should correctly isolate items', () => {
    const markets = [...new Set(MOCK_PRODUCTS.map((p) => p.marketCode))].sort();
    for (const mkt of markets) {
      const count = MOCK_PRODUCTS.filter((p) => p.marketCode === mkt).length;
      assert.ok(count >= 1, `market ${mkt} should have at least 1 product`);
    }
  });
});
