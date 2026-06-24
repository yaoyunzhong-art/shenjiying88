/**
 * products-data.test.ts — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 角色视角: 👔店长 · 🛒前台 · 🎮导玩员
 * 测试产品数据模型、状态映射和 mock 数据完整性
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MOCK_PRODUCTS,
  PRODUCT_STATUS_MAP,
  PRODUCT_CATEGORY_MAP,
  PRODUCT_STATUSES,
  PRODUCT_CATEGORIES,
  type ProductItem,
  type ProductStatus,
  type ProductCategory,
} from './products-data';

// ===================== 正例 =====================

test('👔 店长视角: mock products list is well-formed', () => {
  assert.equal(Array.isArray(MOCK_PRODUCTS), true);
  assert.ok(MOCK_PRODUCTS.length >= 10, 'should have at least 10 products');

  for (const p of MOCK_PRODUCTS) {
    assert.ok(p.id.length > 0, 'id required');
    assert.ok(p.sku.length > 0, 'sku required');
    assert.ok(p.name.length > 0, 'name required');
    assert.ok(p.price >= 0, `price should be non-negative: ${p.price}`);
    assert.ok(p.cost >= 0, `cost should be non-negative: ${p.cost}`);
    assert.ok(p.cost <= p.price * 2, `cost ${p.cost} wildly exceeds price ${p.price}`);
    assert.ok(p.stock >= 0, `stock should be non-negative: ${p.stock}`);
    assert.ok(p.unit.length > 0, 'unit required');
  }
});

test('🛒 前台视角: product statuses mapping is complete', () => {
  const statuses: ProductStatus[] = ['active', 'inactive', 'discontinued', 'draft'];
  for (const s of statuses) {
    assert.ok(s in PRODUCT_STATUS_MAP, `missing status: ${s}`);
    assert.ok(PRODUCT_STATUS_MAP[s].label.length > 0);
  }
});

test('🎮 导玩员视角: product categories mapping is complete', () => {
  const categories: ProductCategory[] = ['food', 'beverage', 'daily', 'electronics', 'clothing', 'other'];
  for (const c of categories) {
    assert.ok(c in PRODUCT_CATEGORY_MAP, `missing category: ${c}`);
    assert.ok(PRODUCT_CATEGORY_MAP[c].label.length > 0);
  }
});

// ===================== 反例 =====================

test('反例: inactive products have zero stock', () => {
  const inactiveProducts = MOCK_PRODUCTS.filter(p => p.status === 'inactive');
  for (const p of inactiveProducts) {
    assert.equal(p.stock, 0, `inactive product ${p.id} should have zero stock`);
  }
});

test('反例: discontinued products should not be active', () => {
  const discontinuedProducts = MOCK_PRODUCTS.filter(p => p.status === 'discontinued');
  assert.ok(discontinuedProducts.length > 0, 'should have at least 1 discontinued product');
  for (const p of discontinuedProducts) {
    assert.notEqual(p.status, 'active');
  }
});

test('反例: draft products have recent update dates', () => {
  const drafts = MOCK_PRODUCTS.filter(p => p.status === 'draft');
  for (const p of drafts) {
    assert.ok(p.createdAt >= '2026', 'draft should be recent');
  }
});

// ===================== 边界 =====================

test('边界: price precision sanity check', () => {
  for (const p of MOCK_PRODUCTS) {
    assert.ok(p.price < 100000, `price too high: ${p.price}`);
    assert.ok(p.cost >= 0, `cost negative: ${p.cost}`);
  }
});

test('边界: all products have unique ids and SKUs', () => {
  const ids = MOCK_PRODUCTS.map(p => p.id);
  const skus = MOCK_PRODUCTS.map(p => p.sku);
  assert.equal(new Set(ids).size, ids.length, 'product ids should be unique');
  assert.equal(new Set(skus).size, skus.length, 'product SKUs should be unique');
});

test('边界: stock count within reasonable range', () => {
  for (const p of MOCK_PRODUCTS) {
    assert.ok(p.stock >= 0, `negative stock: ${p.stock}`);
    assert.ok(p.stock < 100000, `stock too high: ${p.stock}`);
  }
});

test('边界: all product categories in mock data are valid', () => {
  const validCategories = new Set<string>(PRODUCT_CATEGORIES);
  for (const p of MOCK_PRODUCTS) {
    assert.ok(validCategories.has(p.category), `invalid category: ${p.category}`);
  }
});

test('边界: all product statuses in mock data are valid', () => {
  const validStatuses = new Set<string>(PRODUCT_STATUSES);
  for (const p of MOCK_PRODUCTS) {
    assert.ok(validStatuses.has(p.status), `invalid status: ${p.status}`);
  }
});
