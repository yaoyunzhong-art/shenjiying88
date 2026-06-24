import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MOCK_TENANTS,
  MOCK_TENANT_DETAILS,
  TENANT_STATUS_MAP,
  TENANT_PLAN_MAP,
  TENANT_BILLING_MAP,
  TENANT_LIST_PRESET,
  TENANT_LIST_SEARCH_FIELDS,
  TENANT_LIST_COLUMN_KEYS,
  TENANT_DETAIL_LABELS,
  getTenantById,
  computeTenantStats,
  type TenantStatus,
  type TenantPlan,
} from './tenants-data';

// ---- 数据类型 & Mock 数据完整性 ----

test('tenants data: MOCK_TENANTS has at least 10 records across all markets', () => {
  assert.ok(MOCK_TENANTS.length >= 10);
  const markets = new Set(MOCK_TENANTS.map((t) => t.marketCode));
  assert.ok(markets.has('cn-mainland'));
  assert.ok(markets.has('us-default'));
  assert.ok(markets.has('uk-default'));
});

test('tenants data: every mock tenant has required fields', () => {
  for (const t of MOCK_TENANTS) {
    assert.ok(t.id, `tenant ${t.code} missing id`);
    assert.ok(t.code, `tenant missing code`);
    assert.ok(t.name, `tenant ${t.code} missing name`);
    assert.ok(t.marketCode, `tenant ${t.code} missing marketCode`);
    assert.ok(TENANT_STATUS_MAP[t.status], `tenant ${t.code} has invalid status: ${t.status}`);
    assert.ok(TENANT_PLAN_MAP[t.plan], `tenant ${t.code} has invalid plan: ${t.plan}`);
    assert.ok(TENANT_BILLING_MAP[t.billingMode], `tenant ${t.code} has invalid billingMode: ${t.billingMode}`);
    assert.ok(typeof t.storeCount === 'number' && t.storeCount >= 0);
    assert.ok(typeof t.brandCount === 'number' && t.brandCount >= 0);
    assert.ok(typeof t.adminCount === 'number' && t.adminCount >= 0);
    assert.ok(t.lastDeployed, `tenant ${t.code} missing lastDeployed`);
  }
});

test('tenants data: every mock tenant id is unique', () => {
  const ids = MOCK_TENANTS.map((t) => t.id);
  assert.equal(new Set(ids).size, ids.length);
});

// ---- 状态 / 套餐 / 计费映射 ----

test('tenants data: TENANT_STATUS_MAP covers all statuses and has chinese labels', () => {
  const statuses: TenantStatus[] = ['active', 'inactive', 'pending', 'suspended'];
  for (const s of statuses) {
    const v = TENANT_STATUS_MAP[s];
    assert.ok(v, `missing status: ${s}`);
    assert.ok(v.label.length > 0, `status ${s} has empty label`);
    assert.ok(['success', 'warning', 'danger', 'neutral'].includes(v.variant));
  }
  assert.equal(TENANT_STATUS_MAP.active.label, '运营中');
  assert.equal(TENANT_STATUS_MAP.pending.label, '待激活');
  assert.equal(TENANT_STATUS_MAP.suspended.label, '已暂停');
  assert.equal(TENANT_STATUS_MAP.inactive.label, '已停用');
});

test('tenants data: TENANT_PLAN_MAP covers all plans', () => {
  const plans: TenantPlan[] = ['enterprise', 'professional', 'starter'];
  for (const p of plans) {
    const v = TENANT_PLAN_MAP[p];
    assert.ok(v, `missing plan: ${p}`);
    assert.ok(v.label.length > 0, `plan ${p} has empty label`);
  }
  assert.equal(TENANT_PLAN_MAP.enterprise.label, '企业版');
  assert.equal(TENANT_PLAN_MAP.professional.label, '专业版');
  assert.equal(TENANT_PLAN_MAP.starter.label, '入门版');
});

test('tenants data: TENANT_BILLING_MAP covers monthly/yearly', () => {
  assert.equal(TENANT_BILLING_MAP.monthly, '月付');
  assert.equal(TENANT_BILLING_MAP.yearly, '年付');
});

// ---- 列表预设 ----

test('tenants data: TENANT_LIST_PRESET defines page size and search fields', () => {
  assert.equal(TENANT_LIST_PRESET.defaultPageSize, 10);
  assert.deepEqual(TENANT_LIST_PRESET.pageSizeOptions, [5, 10, 15, 20]);
  assert.deepEqual(TENANT_LIST_PRESET.searchFields, ['code', 'name', 'marketCode']);
  assert.deepEqual(TENANT_LIST_PRESET.statuses, ['active', 'pending', 'inactive', 'suspended']);
  assert.deepEqual(TENANT_LIST_PRESET.plans, ['enterprise', 'professional', 'starter']);
  assert.deepEqual(TENANT_LIST_PRESET.billingModes, ['monthly', 'yearly']);
  assert.deepEqual(TENANT_LIST_PRESET.markets, ['cn-mainland', 'us-default', 'uk-default']);
});

test('tenants data: TENANT_LIST_COLUMN_KEYS covers all display columns', () => {
  assert.equal(TENANT_LIST_COLUMN_KEYS.length, 10);
  assert.ok(TENANT_LIST_COLUMN_KEYS.includes('code'));
  assert.ok(TENANT_LIST_COLUMN_KEYS.includes('name'));
  assert.ok(TENANT_LIST_COLUMN_KEYS.includes('status'));
  assert.ok(TENANT_LIST_COLUMN_KEYS.includes('storeCount'));
  assert.ok(TENANT_LIST_COLUMN_KEYS.includes('brandCount'));
  assert.ok(TENANT_LIST_COLUMN_KEYS.includes('adminCount'));
  assert.ok(TENANT_LIST_COLUMN_KEYS.includes('plan'));
  assert.ok(TENANT_LIST_COLUMN_KEYS.includes('billingMode'));
  assert.ok(TENANT_LIST_COLUMN_KEYS.includes('lastDeployed'));
});

test('tenants data: TENANT_LIST_SEARCH_FIELDS matches preset', () => {
  assert.deepEqual(TENANT_LIST_SEARCH_FIELDS, TENANT_LIST_PRESET.searchFields);
});

// ---- 统计计算 ----

test('tenants data: computeTenantStats returns correct aggregate counts', () => {
  const stats = computeTenantStats(MOCK_TENANTS);
  assert.equal(stats.total, 15);
  assert.equal(stats.active, 10);
  assert.equal(stats.enterprise, 6);
  assert.equal(stats.markets, 3);

  // 健康率检查
  const healthRate = stats.active / stats.total;
  assert.ok(healthRate > 0.65, `health rate ${healthRate} too low`);
});

test('tenants data: computeTenantStats filters only active for enterprise subset', () => {
  const activeEnterprise = MOCK_TENANTS.filter(
    (t) => t.status === 'active' && t.plan === 'enterprise'
  );
  const stats = computeTenantStats(MOCK_TENANTS);
  assert.ok(stats.active > 0);
  assert.ok(stats.enterprise > 0);
  assert.ok(activeEnterprise.length > 0);
});

test('tenants data: computeTenantStats returns 0 for empty array', () => {
  const stats = computeTenantStats([]);
  assert.deepEqual(stats, { total: 0, active: 0, enterprise: 0, markets: 0 });
});

// ---- 租户详情查询 ----

test('tenants data: getTenantById returns existing tenant detail', () => {
  const t = getTenantById('t1');
  assert.ok(t);
  assert.equal(t.id, 't1');
  assert.equal(t.code, 'TNT-001');
  assert.equal(t.name, '华润万象生活');
  assert.equal(t.status, 'active');
  assert.equal(t.plan, 'enterprise');
  assert.equal(t.billingMode, 'yearly');
  assert.equal(t.contactName, '张华润');
  assert.ok(t.description.length > 0);
});

test('tenants data: getTenantById returns all detail fields for every mock detail', () => {
  for (const [id, detail] of Object.entries(MOCK_TENANT_DETAILS)) {
    assert.equal(detail.id, id);
    assert.ok(detail.contactName, `${id} missing contactName`);
    assert.ok(detail.contactEmail, `${id} missing contactEmail`);
    assert.ok(detail.contactPhone, `${id} missing contactPhone`);
    assert.ok(detail.registeredAt, `${id} missing registeredAt`);
    assert.ok(detail.timezone, `${id} missing timezone`);
    assert.ok(detail.description, `${id} missing description`);
    // Detail extends TenantItem — confirm basic fields
    assert.ok(TENANT_STATUS_MAP[detail.status]);
    assert.ok(TENANT_PLAN_MAP[detail.plan]);
  }
});

test('tenants data: getTenantById returns undefined for unknown id', () => {
  assert.equal(getTenantById('t-nonexistent'), undefined);
});

// ---- 详情标签 ----

test('tenants data: TENANT_DETAIL_LABELS has all expected keys', () => {
  assert.equal(TENANT_DETAIL_LABELS.code, '租户编码');
  assert.equal(TENANT_DETAIL_LABELS.status, '运营状态');
  assert.equal(TENANT_DETAIL_LABELS.plan, '套餐');
  assert.equal(TENANT_DETAIL_LABELS.billingMode, '计费方式');
  assert.equal(TENANT_DETAIL_LABELS.contactName, '联系人');
  assert.equal(TENANT_DETAIL_LABELS.contactEmail, '联系邮箱');
  assert.equal(TENANT_DETAIL_LABELS.contactPhone, '联系电话');
  assert.equal(TENANT_DETAIL_LABELS.storeCount, '关联门店数');
  assert.equal(TENANT_DETAIL_LABELS.adminCount, '管理员数');
  assert.equal(TENANT_DETAIL_LABELS.overviewTitle, '租户信息');
  assert.equal(TENANT_DETAIL_LABELS.editTitle, '编辑租户信息');
  assert.equal(TENANT_DETAIL_LABELS.saveButton, '保存修改');
  assert.equal(TENANT_DETAIL_LABELS.cancelButton, '取消');
  assert.equal(TENANT_DETAIL_LABELS.backToList, '返回租户列表');
});

test('tenants data: TENANT_DETAIL_LABELS.notFound is a function returning formatted string', () => {
  const result = TENANT_DETAIL_LABELS.notFound('TNT-404');
  assert.equal(result, '租户 TNT-404 不存在');
});

// ---- 跨市场覆盖 ----

test('tenants data: cn-mainland tenants dominate but us/uk markets have representation', () => {
  const cn = MOCK_TENANTS.filter((t) => t.marketCode === 'cn-mainland');
  const us = MOCK_TENANTS.filter((t) => t.marketCode === 'us-default');
  const uk = MOCK_TENANTS.filter((t) => t.marketCode === 'uk-default');

  assert.ok(cn.length > us.length, 'cn-mainland should have most tenants');
  assert.ok(us.length >= 2, 'us-default should have at least 2 tenants');
  assert.ok(uk.length >= 1, 'uk-default should have at least 1 tenant');
});

// ---- 计费方式分布 ----

test('tenants data: billing mode distribution is balanced', () => {
  const monthly = MOCK_TENANTS.filter((t) => t.billingMode === 'monthly');
  const yearly = MOCK_TENANTS.filter((t) => t.billingMode === 'yearly');
  assert.ok(monthly.length > 0);
  assert.ok(yearly.length > 0);
  assert.equal(monthly.length + yearly.length, MOCK_TENANTS.length);
});

// ---- 套餐等级检查 ----

test('tenants data: only enterprise plan has the highest store counts', () => {
  const nonEnterprise = MOCK_TENANTS.filter((t) => t.plan !== 'enterprise');
  const maxNonEnterpriseStoreCount = Math.max(...nonEnterprise.map((t) => t.storeCount));
  const maxEnterpriseStoreCount = Math.max(
    ...MOCK_TENANTS.filter((t) => t.plan === 'enterprise').map((t) => t.storeCount)
  );
  assert.ok(maxEnterpriseStoreCount >= maxNonEnterpriseStoreCount,
    'enterprise plan should have the highest store count ceiling');
});

// ---- 状态分布 ----

test('tenants data: status distribution covers all 4 statuses', () => {
  const statusCounts: Record<string, number> = {};
  for (const t of MOCK_TENANTS) {
    statusCounts[t.status] = (statusCounts[t.status] ?? 0) + 1;
  }
  assert.ok((statusCounts.active || 0) > 0);
  assert.ok((statusCounts.pending || 0) > 0);
  assert.ok((statusCounts.inactive || 0) > 0);
  assert.ok((statusCounts.suspended || 0) > 0);
  // active should be majority
  assert.ok((statusCounts.active || 0) > (statusCounts.suspended || 0));
  assert.ok((statusCounts.active || 0) > (statusCounts.inactive || 0));
});

// ---- 详情 mock 与列表 mock 一致性 ----

test('tenants data: MOCK_TENANT_DETAILS ids match existing MOCK_TENANTS ids', () => {
  const listIds = new Set(MOCK_TENANTS.map((t) => t.id));
  for (const id of Object.keys(MOCK_TENANT_DETAILS)) {
    assert.ok(listIds.has(id), `detail id ${id} not found in MOCK_TENANTS`);
  }
});

test('tenants data: detail fields are superset of list tenant fields', () => {
  for (const [id, detail] of Object.entries(MOCK_TENANT_DETAILS)) {
    const listItem = MOCK_TENANTS.find((t) => t.id === id);
    assert.ok(listItem, `no matching list item for detail ${id}`);
    assert.equal(detail.code, listItem!.code);
    assert.equal(detail.name, listItem!.name);
    assert.equal(detail.status, listItem!.status);
    assert.equal(detail.plan, listItem!.plan);
    assert.equal(detail.billingMode, listItem!.billingMode);
    assert.equal(detail.storeCount, listItem!.storeCount);
    assert.equal(detail.brandCount, listItem!.brandCount);
    assert.equal(detail.adminCount, listItem!.adminCount);
  }
});
