/**
 * tenants-data.test.ts — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 角色视角: 👔店长 · 🛒前台 · 🎯运行专员
 * 测试租户管理数据结构、状态映射和统计计算
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MOCK_TENANTS,
  MOCK_TENANT_DETAILS,
  TENANT_STATUS_MAP,
  TENANT_PLAN_MAP,
  TENANT_BILLING_MAP,
  TENANT_LIST_PRESET,
  TENANT_LIST_COLUMN_KEYS,
  TENANT_LIST_SEARCH_FIELDS,
  TENANT_DETAIL_LABELS,
  getTenantById,
  computeTenantStats,
  type TenantItem,
  type TenantStatus,
  type TenantPlan,
} from './tenants-data';

// ===================== 正例 =====================

test('👔 店长视角: mock tenants list is well-formed', () => {
  assert.equal(Array.isArray(MOCK_TENANTS), true);
  assert.ok(MOCK_TENANTS.length >= 10, 'should have at least 10 tenants');

  for (const t of MOCK_TENANTS) {
    assert.ok(t.id.length > 0, 'id required');
    assert.ok(t.code.length > 0, 'code required');
    assert.ok(t.name.length > 0, 'name required');
    assert.ok(t.marketCode.length > 0, 'marketCode required');
    assert.equal(
      ['active', 'inactive', 'pending', 'suspended'].includes(t.status),
      true,
      `invalid status: ${t.status}`
    );
  }
});

test('🛒 前台视角: tenant status map covers all statuses', () => {
  const statuses: TenantStatus[] = ['active', 'inactive', 'pending', 'suspended'];
  for (const s of statuses) {
    assert.ok(s in TENANT_STATUS_MAP, `missing status: ${s}`);
    assert.ok(TENANT_STATUS_MAP[s].label.length > 0);
    assert.ok(TENANT_STATUS_MAP[s].variant.length > 0);
  }
});

test('🎯 运行专员视角: computeTenantStats returns correct counts', () => {
  const stats = computeTenantStats(MOCK_TENANTS);

  assert.equal(stats.total, MOCK_TENANTS.length);
  assert.ok(stats.active <= stats.total);
  assert.ok(stats.enterprise <= stats.total);
  assert.ok(stats.markets >= 1);
});

test('正例: plan map covers enterprise/professional/starter', () => {
  const plans: TenantPlan[] = ['enterprise', 'professional', 'starter'];
  for (const p of plans) {
    assert.ok(p in TENANT_PLAN_MAP, `missing plan: ${p}`);
  }
});

test('正例: billing modes covered', () => {
  assert.equal(TENANT_BILLING_MAP['monthly'], '月付');
  assert.equal(TENANT_BILLING_MAP['yearly'], '年付');
});

// ===================== 反例 =====================

test('反例: getTenantById returns undefined for unknown id', () => {
  assert.equal(getTenantById('non-existent-id'), undefined);
  assert.equal(getTenantById(''), undefined);
});

test('反例: computeTenantStats with empty array', () => {
  const stats = computeTenantStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.active, 0);
  assert.equal(stats.enterprise, 0);
  assert.equal(stats.markets, 0);
});

test('反例: tenant list column keys exclude invalid fields', () => {
  // Code, Name, Plan, Market, Status, Counts, Billing, Deployed
  assert.ok(TENANT_LIST_COLUMN_KEYS.includes('code'));
  assert.ok(TENANT_LIST_COLUMN_KEYS.includes('name'));
  assert.ok(TENANT_LIST_COLUMN_KEYS.includes('status'));
  // There should be at least 6 columns
  assert.ok(TENANT_LIST_COLUMN_KEYS.length >= 6);
});

// ===================== 边界 =====================

test('边界: preset has valid page size configuration', () => {
  assert.equal(TENANT_LIST_PRESET.defaultPageSize, 10);
  assert.ok(TENANT_LIST_PRESET.pageSizeOptions.includes(5));
  assert.ok(TENANT_LIST_PRESET.pageSizeOptions.includes(20));
  assert.ok(TENANT_LIST_PRESET.statuses.length === 4);
  assert.ok(TENANT_LIST_PRESET.markets.length >= 1);
});

test('边界: all mock tenants have unique ids', () => {
  const ids = MOCK_TENANTS.map((t: TenantItem) => t.id);
  const uniqueIds = new Set(ids);
  assert.equal(uniqueIds.size, ids.length, 'all tenant ids should be unique');
});

test('边界: search fields are string array matching TenantItem keys', () => {
  assert.ok(TENANT_LIST_SEARCH_FIELDS.includes('code'));
  assert.ok(TENANT_LIST_SEARCH_FIELDS.includes('name'));
  assert.ok(TENANT_LIST_SEARCH_FIELDS.includes('marketCode'));
});

test('边界: detail labels contain all required UI strings', () => {
  const requiredLabels = ['code', 'name', 'marketCode', 'status', 'plan', 'storeCount', 'brandCount', 'adminCount', 'registeredAt', 'overviewTitle', 'editTitle', 'saveButton'];
  for (const label of requiredLabels) {
    assert.ok(label in TENANT_DETAIL_LABELS, `missing label: ${label}`);
  }
});

test('边界: mock tenant details match their list items', () => {
  const detailIds = Object.keys(MOCK_TENANT_DETAILS);
  for (const id of detailIds) {
    const detail = MOCK_TENANT_DETAILS[id];
    const listItem = MOCK_TENANTS.find((t: TenantItem) => t.id === id);
    assert.ok(listItem, `detail ${id} missing from list`);
    if (listItem && detail) {
      assert.equal(detail.code, listItem.code);
      assert.equal(detail.name, listItem.name);
      assert.equal(detail.status, listItem.status);
    }
  }
});
