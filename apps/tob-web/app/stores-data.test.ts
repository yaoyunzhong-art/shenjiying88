/**
 * stores-data.test.ts — 门店管理 Mock 数据测试
 */
const assert = require('node:assert/strict');
const { describe, test } = require('node:test');

const {
  MOCK_STORES,
  STORE_STATUS_MAP,
  STORE_STATUSES,
  REGIONS,
  formatCurrency,
} = require('./stores-data');

describe('stores-data', () => {
  test('MOCK_STORES has 12 stores', () => {
    assert.equal(MOCK_STORES.length, 12);
  });

  test('each store has required fields', () => {
    for (const store of MOCK_STORES) {
      assert.ok(store.id);
      assert.ok(store.storeCode);
      assert.ok(store.storeName);
      assert.ok(store.region);
      assert.ok(store.city);
      assert.ok(store.status);
      assert.equal(typeof store.employeeCount, 'number');
      assert.equal(typeof store.monthlyRevenue, 'number');
    }
  });

  test('STORE_STATUSES contains all status values', () => {
    assert.deepEqual(STORE_STATUSES, ['active', 'inactive', 'maintenance']);
  });

  test('STORE_STATUS_MAP has all status entries', () => {
    const statusKeys = Object.keys(STORE_STATUS_MAP);
    assert.deepEqual(statusKeys.sort(), ['active', 'inactive', 'maintenance'].sort());

    assert.equal(STORE_STATUS_MAP.active.label, '营业中');
    assert.equal(STORE_STATUS_MAP.active.variant, 'success');

    assert.equal(STORE_STATUS_MAP.inactive.label, '已停业');
    assert.equal(STORE_STATUS_MAP.inactive.variant, 'default');

    assert.equal(STORE_STATUS_MAP.maintenance.label, '维护中');
    assert.equal(STORE_STATUS_MAP.maintenance.variant, 'warning');
  });

  test('REGIONS has 7 regions', () => {
    assert.equal(REGIONS.length, 7);
    assert.ok(REGIONS.includes('华东'));
    assert.ok(REGIONS.includes('华南'));
    assert.ok(REGIONS.includes('华北'));
  });

  test('multiple stores have active status', () => {
    const activeStores = MOCK_STORES.filter((s) => s.status === 'active');
    assert.ok(activeStores.length >= 6);
  });

  test('formatCurrency formats correctly', () => {
    assert.match(formatCurrency(2580000), /¥258万/);
    assert.match(formatCurrency(1250000), /¥125万/);
    assert.match(formatCurrency(0), /¥0/);
    assert.match(formatCurrency(1450000), /¥145万/);
  });

  test('no duplicate store IDs', () => {
    const ids = MOCK_STORES.map((s) => s.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, ids.length);
  });

  test('no duplicate store codes', () => {
    const codes = MOCK_STORES.map((s) => s.storeCode);
    const uniqueCodes = new Set(codes);
    assert.equal(uniqueCodes.size, codes.length);
  });
});
