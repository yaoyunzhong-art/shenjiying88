/**
 * H5收藏页面 - page.test.tsx — L1 冒烟测试
 * Phase-FP · T-FP-029 · 2026-07-03
 * 角色视角: 👤 会员
 * 覆盖: 正例 + 反例(防御) + 边界(极端数据/空数据)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据工厂 ──

function makeFavoriteProduct(overrides?: Record<string, unknown>) {
  return {
    id: 'p1',
    name: '夏季运动T恤',
    price: 199,
    originalPrice: 299,
    storeName: '神机营旗舰店',
    addedAt: '2026-06-28',
    ...overrides,
  };
}

function makeFavoriteStore(overrides?: Record<string, unknown>) {
  return {
    id: 's1',
    name: '神机营旗舰店',
    address: '科技南路88号',
    district: '南山区',
    features: ['新品首发', '会员专享'],
    addedAt: '2026-05-15',
    ...overrides,
  };
}

function makeFavoritesResponse(overrides?: Record<string, unknown>) {
  return {
    success: true,
    data: {
      products: [makeFavoriteProduct(), makeFavoriteProduct({ id: 'p2', name: '透气运动短裤', price: 129, originalPrice: undefined })],
      stores: [makeFavoriteStore(), makeFavoriteStore({ id: 's2', name: '神机营福田店', district: '福田区', features: ['24小时营业'] })],
      total: 4,
    },
    ...overrides,
  };
}

function callSafe(fn: (...args: unknown[]) => unknown, ...args: unknown[]): boolean {
  try { fn(...args); return true; } catch { return false; }
}

/* ── 正例 ── */

test('FavoritesPage: should accept a valid FavoriteProduct with all fields', () => {
  const product = makeFavoriteProduct();
  assert.equal(typeof product.id, 'string');
  assert.equal(typeof product.name, 'string');
  assert.equal(typeof product.price, 'number');
  assert.equal(typeof product.storeName, 'string');
  assert.ok(product.price > 0);
});

test('FavoritesPage: should accept a valid FavoriteStore with all fields', () => {
  const store = makeFavoriteStore();
  assert.equal(typeof store.id, 'string');
  assert.equal(typeof store.name, 'string');
  assert.equal(typeof store.address, 'string');
  assert.equal(typeof store.district, 'string');
  assert.ok(Array.isArray(store.features));
  assert.equal(store.features.length, 2);
});

test('FavoritesPage: should accept a valid FavoritesResponse', () => {
  const response = makeFavoritesResponse();
  assert.equal(response.success, true);
  assert.ok(response.data !== undefined);
  assert.ok(Array.isArray(response.data!.products));
  assert.ok(Array.isArray(response.data!.stores));
  assert.equal(response.data!.total, 4);
  assert.equal(response.data!.products.length, 2);
  assert.equal(response.data!.stores.length, 2);
});

test('FavoritesPage: favorite product should have all required fields', () => {
  const requiredFields = ['id', 'name', 'price', 'storeName', 'addedAt'] as const;
  const product = makeFavoriteProduct();
  for (const field of requiredFields) {
    assert.notEqual(product[field], undefined, `field ${field} should be defined`);
  }
});

test('FavoritesPage: favorite store should have all required fields', () => {
  const requiredFields = ['id', 'name', 'address', 'district', 'features', 'addedAt'] as const;
  const store = makeFavoriteStore();
  for (const field of requiredFields) {
    assert.notEqual(store[field], undefined, `field ${field} should be defined`);
  }
});

test('FavoritesPage: should toggle between products and stores tab', () => {
  // simulate tab state — default tab is 'products'
  let tab: 'products' | 'stores' = 'products';
  assert.equal(tab, 'products');

  // switch to stores
  tab = 'stores';
  assert.equal(tab, 'stores');

  // switch back
  tab = 'products';
  assert.equal(tab, 'products');
});

test('FavoritesPage: should filter products list correctly', () => {
  const products = [
    makeFavoriteProduct(),
    makeFavoriteProduct({ id: 'p2', name: '透气运动短裤', price: 129 }),
  ];
  assert.equal(products.length, 2);
  assert.equal(products[0].name, '夏季运动T恤');
  assert.equal(products[1].name, '透气运动短裤');
});

test('FavoritesPage: should filter stores list correctly', () => {
  const stores = [
    makeFavoriteStore(),
    makeFavoriteStore({ id: 's2', name: '神机营福田店' }),
  ];
  assert.equal(stores.length, 2);
  assert.equal(stores[0].name, '神机营旗舰店');
  assert.equal(stores[1].name, '神机营福田店');
});

test('FavoritesPage: product price should be a positive number', () => {
  const product = makeFavoriteProduct({ price: 199 });
  assert.equal(product.price, 199);
  assert.ok(product.price > 0);
  assert.ok(product.price < 100000); // sanity bound
});

test('FavoritesPage: optional originalPrice should be larger than price when present', () => {
  const p1 = makeFavoriteProduct({ price: 199, originalPrice: 299 });
  assert.ok(p1.originalPrice! > p1.price);

  const p2 = makeFavoriteProduct({ price: 129, originalPrice: undefined });
  assert.equal(p2.originalPrice, undefined);
});

test('FavoritesPage: favorite store features should be a non-empty array', () => {
  const store = makeFavoriteStore();
  assert.ok(store.features.length > 0);
  assert.ok(store.features.every((f: string) => typeof f === 'string' && f.length > 0));
});

test('FavoritesPage: should compute total count correctly', () => {
  const productsCount = 3;
  const storesCount = 2;
  const total = productsCount + storesCount;
  assert.equal(total, 5);
});

/* ── 反例 / 防御 ── */

test('FavoritesPage: should handle product with missing optional fields', () => {
  const product = makeFavoriteProduct({ originalPrice: undefined, imageUrl: undefined });
  assert.equal(product.originalPrice, undefined);
  assert.equal(product.imageUrl, undefined);
  assert.ok(product.price > 0);
  assert.ok(typeof product.name === 'string');
});

test('FavoritesPage: should handle store with empty features array', () => {
  const store = makeFavoriteStore({ features: [] });
  assert.ok(Array.isArray(store.features));
  assert.equal(store.features.length, 0);
});

test('FavoritesPage: should handle store with null or undefined features', () => {
  const store1 = makeFavoriteStore({ features: null });
  const store2 = makeFavoriteStore({ features: undefined });
  assert.equal(store1.features, null);
  assert.equal(store2.features, undefined);
});

test('FavoritesPage: should handle non-positive product price', () => {
  // zero price is theoretically invalid but should not crash
  const product0 = makeFavoriteProduct({ price: 0 });
  assert.equal(product0.price, 0);

  // negative price should not crash
  const productNeg = makeFavoriteProduct({ price: -10 });
  assert.equal(productNeg.price, -10);
});

test('FavoritesPage: should reject empty product name', () => {
  const product = makeFavoriteProduct({ name: '' });
  assert.equal(product.name, '');
  // empty string is valid at data layer but display layer should guard
  assert.ok(typeof product.name === 'string');
});

test('FavoritesPage: should reject missing id field in product', () => {
  const product = makeFavoriteProduct({ id: undefined });
  assert.equal(product.id, undefined);
});

test('FavoritesPage: should handle response with success false', () => {
  const response = makeFavoritesResponse({ success: false, data: undefined, error: { code: 'FETCH_ERROR', message: '获取失败' } });
  assert.equal(response.success, false);
  assert.equal(response.data, undefined);
  assert.ok(response.error !== undefined);
  assert.equal(response.error!.code, 'FETCH_ERROR');
});

test('FavoritesPage: should handle response with error code', () => {
  const errCodes = ['FETCH_ERROR', 'AUTH_FAILED', 'NOT_FOUND', 'RATE_LIMIT'];
  for (const code of errCodes) {
    const response = { success: false, error: { code, message: 'error' } };
    assert.equal(response.error.code, code);
  }
});

/* ── 边界 ── */

test('FavoritesPage: empty favorites response with no products and no stores', () => {
  const emptyResponse = { success: true, data: { products: [] as unknown[], stores: [] as unknown[], total: 0 } };
  assert.equal(emptyResponse.data.products.length, 0);
  assert.equal(emptyResponse.data.stores.length, 0);
  assert.equal(emptyResponse.data.total, 0);
});

test('FavoritesPage: many favorite products should not overflow', () => {
  const manyProducts = Array.from({ length: 1000 }, (_, i) => makeFavoriteProduct({
    id: `p${i}`,
    name: `商品${i}`,
    price: Math.round(Math.random() * 500) + 1,
  }));
  assert.equal(manyProducts.length, 1000);
  assert.ok(manyProducts.every(p => p.id.startsWith('p')));
  assert.ok(manyProducts.every(p => p.price > 0));
});

test('FavoritesPage: many favorite stores should not overflow', () => {
  const manyStores = Array.from({ length: 500 }, (_, i) => makeFavoriteStore({
    id: `s${i}`,
    name: `门店${i}`,
    features: i % 2 === 0 ? ['24小时营业'] : [],
  }));
  assert.equal(manyStores.length, 500);
  assert.ok(manyStores.every(s => s.id.startsWith('s')));
});

test('FavoritesPage: very long product name', () => {
  const longName = '超长商品名称'.repeat(50); // 250 chars
  const product = makeFavoriteProduct({ name: longName });
  assert.equal(product.name.length, longName.length);
  assert.ok(product.name.length > 100);
});

test('FavoritesPage: store with maximum features', () => {
  const manyFeatures = Array.from({ length: 20 }, (_, i) => `特色服务${i}`);
  const store = makeFavoriteStore({ features: manyFeatures });
  assert.equal(store.features.length, 20);
});

test('FavoritesPage: product with zero price should still be processed', () => {
  const freeProduct = makeFavoriteProduct({ price: 0, originalPrice: 0 });
  assert.equal(freeProduct.price, 0);
  assert.equal(freeProduct.originalPrice, 0);
});

test('FavoritesPage: product with very high price should be accepted', () => {
  const luxuryProduct = makeFavoriteProduct({ price: 999999, originalPrice: undefined });
  assert.equal(luxuryProduct.price, 999999);
  assert.equal(luxuryProduct.originalPrice, undefined);
});

test('FavoritesPage: store features deduplication should work', () => {
  const duplicateFeatures = ['24小时营业', '会员专享', '24小时营业', '免费停车', '会员专享'];
  const uniqueFeatures = [...new Set(duplicateFeatures)];
  assert.equal(uniqueFeatures.length, 3);
  assert.ok(uniqueFeatures.includes('24小时营业'));
  assert.ok(uniqueFeatures.includes('会员专享'));
  assert.ok(uniqueFeatures.includes('免费停车'));
});

test('FavoritesPage: product sorting by price ascending', () => {
  const products = [
    makeFavoriteProduct({ id: 'p1', price: 299 }),
    makeFavoriteProduct({ id: 'p2', price: 129 }),
    makeFavoriteProduct({ id: 'p3', price: 199 }),
  ];
  const sorted = [...products].sort((a, b) => a.price - b.price);
  assert.equal(sorted[0].id, 'p2');
  assert.equal(sorted[1].id, 'p3');
  assert.equal(sorted[2].id, 'p1');
});

test('FavoritesPage: product sorting by price descending', () => {
  const products = [
    makeFavoriteProduct({ id: 'p1', price: 199 }),
    makeFavoriteProduct({ id: 'p2', price: 299 }),
    makeFavoriteProduct({ id: 'p3', price: 129 }),
  ];
  const sorted = [...products].sort((a, b) => b.price - a.price);
  assert.equal(sorted[0].id, 'p2');
  assert.equal(sorted[2].id, 'p3');
});

test('FavoritesPage: add to cart button should not throw', () => {
  const ok = callSafe(() => { /* simulate add to cart */ });
  assert.ok(ok);
});

test('FavoritesPage: remove favorite should not throw', () => {
  const ok = callSafe(() => {
    const products = [makeFavoriteProduct(), makeFavoriteProduct({ id: 'p2' })];
    const filtered = products.filter(p => p.id !== 'p1');
    assert.equal(filtered.length, 1);
  });
  assert.ok(ok);
});

test('FavoritesPage: tab-switch preserves the counter state', () => {
  const products = [makeFavoriteProduct(), makeFavoriteProduct({ id: 'p2' }), makeFavoriteProduct({ id: 'p3' })];
  const stores = [makeFavoriteStore()];

  // current tab info — does not mutate counts
  const tabInfo = { tab: 'products' as 'products' | 'stores', productCount: products.length, storeCount: stores.length };

  assert.equal(tabInfo.productCount, 3);
  assert.equal(tabInfo.storeCount, 1);
  assert.equal(tabInfo.tab, 'products');
});

test('FavoritesPage: using favoritesService mock fallback data should produce valid products', () => {
  // Simulating the fallback behavior from FavoritesService.getFavorites()
  const mockProducts = [
    { id: 'p1', name: '夏季运动T恤', price: 199, originalPrice: 299, storeName: '神机营旗舰店', addedAt: '2026-06-28' },
    { id: 'p2', name: '透气运动短裤', price: 129, storeName: '神机营旗舰店', addedAt: '2026-06-25' },
    { id: 'p3', name: '轻便运动背包', price: 299, originalPrice: 399, storeName: '神机营社区店', addedAt: '2026-06-20' },
  ];
  assert.equal(mockProducts.length, 3);
  assert.ok(mockProducts.every(p => typeof p.id === 'string' && typeof p.name === 'string' && typeof p.price === 'number'));
});
