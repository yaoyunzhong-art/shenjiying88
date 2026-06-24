import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MOCK_STAFF,
  MOCK_STAFF_DETAILS,
  STAFF_STATUS_MAP,
  STAFF_ROLE_MAP,
  STAFF_STATUSES,
  STAFF_LIST_PRESET,
  STAFF_LIST_SEARCH_FIELDS,
  STAFF_LIST_COLUMN_KEYS,
  STAFF_DETAIL_LABELS,
  getStaffById,
  computeStaffStats,
  type StaffRole,
} from './staff-data';

// ---- 数据类型 & Mock 数据完整性 ----

test('staff data: MOCK_STAFF has at least 15 records across 3+ markets', () => {
  assert.ok(MOCK_STAFF.length >= 15);
  const markets = new Set(MOCK_STAFF.map((s) => s.marketCode));
  assert.ok(markets.has('cn-mainland'));
  assert.ok(markets.has('us-default'));
  assert.ok(markets.has('uk-default'));
});

test('staff data: every mock staff has required fields', () => {
  for (const s of MOCK_STAFF) {
    assert.ok(s.id, `staff ${s.code} missing id`);
    assert.ok(s.code, `staff missing code`);
    assert.ok(s.name, `staff ${s.code} missing name`);
    assert.ok(STAFF_ROLE_MAP[s.role], `staff ${s.code} has invalid role: ${s.role}`);
    assert.ok(s.storeName, `staff ${s.code} missing storeName`);
    assert.ok(s.marketCode, `staff ${s.code} missing marketCode`);
    assert.ok(STAFF_STATUS_MAP[s.status], `staff ${s.code} has invalid status: ${s.status}`);
    assert.ok(s.phone, `staff ${s.code} missing phone`);
    assert.ok(s.email, `staff ${s.code} missing email`);
    assert.ok(s.hiredAt, `staff ${s.code} missing hiredAt`);
    assert.ok(s.lastActiveAt, `staff ${s.code} missing lastActiveAt`);
    assert.ok(typeof s.performanceScore === 'number' && s.performanceScore >= 0 && s.performanceScore <= 100,
      `staff ${s.code} has invalid performanceScore: ${s.performanceScore}`);
  }
});

test('staff data: every mock staff id is unique', () => {
  const ids = MOCK_STAFF.map((s) => s.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('staff data: every mock staff code is unique', () => {
  const codes = MOCK_STAFF.map((s) => s.code);
  assert.equal(new Set(codes).size, codes.length);
});

// ---- 状态映射 ----

test('staff data: STAFF_STATUS_MAP covers all statuses with valid variants', () => {
  const validVariants = ['success', 'warning', 'danger', 'neutral'];
  for (const s of STAFF_STATUSES) {
    const v = STAFF_STATUS_MAP[s];
    assert.ok(v, `missing status: ${s}`);
    assert.ok(v.label.length > 0, `status ${s} has empty label`);
    assert.ok(validVariants.includes(v.variant), `status ${s} has invalid variant: ${v.variant}`);
  }
  assert.equal(STAFF_STATUS_MAP.active.label, '在职');
  assert.equal(STAFF_STATUS_MAP.probation.label, '试用期');
  assert.equal(STAFF_STATUS_MAP.on_leave.label, '休假');
  assert.equal(STAFF_STATUS_MAP.resigned.label, '已离职');
});

test('staff data: STAFF_STATUS_MAP has expected variant mapping', () => {
  assert.equal(STAFF_STATUS_MAP.active.variant, 'success');
  assert.equal(STAFF_STATUS_MAP.resigned.variant, 'danger');
  assert.equal(STAFF_STATUS_MAP.on_leave.variant, 'warning');
  assert.equal(STAFF_STATUS_MAP.probation.variant, 'neutral');
});

// ---- 角色映射 ----

test('staff data: STAFF_ROLE_MAP covers all roles', () => {
  const allRoles: StaffRole[] = [
    'store_manager', 'sales_clerk', 'front_desk', 'warehouse',
    'finance', 'marketing', 'operations', 'cleaner',
  ];
  for (const r of allRoles) {
    const v = STAFF_ROLE_MAP[r];
    assert.ok(v, `missing role: ${r}`);
    assert.ok(v.label.length > 0, `role ${r} has empty label`);
  }
  assert.equal(STAFF_ROLE_MAP.store_manager.label, '店长');
  assert.equal(STAFF_ROLE_MAP.sales_clerk.label, '导购员');
  assert.equal(STAFF_ROLE_MAP.front_desk.label, '前台');
  assert.equal(STAFF_ROLE_MAP.warehouse.label, '仓管员');
});

// ---- 列表预设 ----

test('staff data: STAFF_LIST_PRESET has correct defaults', () => {
  assert.equal(STAFF_LIST_PRESET.defaultPageSize, 10);
  assert.deepEqual(STAFF_LIST_PRESET.pageSizeOptions, [5, 10, 15, 20]);
  assert.deepEqual(STAFF_LIST_PRESET.searchFields, ['code', 'name', 'storeName', 'email']);
});

test('staff data: STAFF_LIST_COLUMN_KEYS has 10 columns', () => {
  assert.equal(STAFF_LIST_COLUMN_KEYS.length, 10);
  assert.ok(STAFF_LIST_COLUMN_KEYS.includes('code'));
  assert.ok(STAFF_LIST_COLUMN_KEYS.includes('name'));
  assert.ok(STAFF_LIST_COLUMN_KEYS.includes('role'));
  assert.ok(STAFF_LIST_COLUMN_KEYS.includes('storeName'));
  assert.ok(STAFF_LIST_COLUMN_KEYS.includes('status'));
  assert.ok(STAFF_LIST_COLUMN_KEYS.includes('phone'));
  assert.ok(STAFF_LIST_COLUMN_KEYS.includes('performanceScore'));
});

test('staff data: STAFF_LIST_SEARCH_FIELDS matches preset', () => {
  assert.deepEqual(STAFF_LIST_SEARCH_FIELDS, STAFF_LIST_PRESET.searchFields);
});

// ---- 统计计算 ----

test('staff data: computeStaffStats returns correct aggregates for full mock data', () => {
  const stats = computeStaffStats(MOCK_STAFF);
  assert.equal(stats.total, 20);
  assert.equal(stats.active, 14);
  assert.ok(stats.managers > 0);
  assert.ok(stats.topPerformers > 0);
});

test('staff data: computeStaffStats active count is at least 60% of total', () => {
  const stats = computeStaffStats(MOCK_STAFF);
  const rate = stats.active / stats.total;
  assert.ok(rate >= 0.6, `active rate ${rate} too low`);
});

test('staff data: computeStaffStats for empty array returns all zeros', () => {
  const stats = computeStaffStats([]);
  assert.deepEqual(stats, { total: 0, active: 0, managers: 0, topPerformers: 0 });
});

test('staff data: computeStaffStats for single active item returns correct counts', () => {
  const single = [MOCK_STAFF[0]!];
  const stats = computeStaffStats(single);
  assert.equal(stats.total, 1);
  assert.equal(stats.active, 1);
  assert.equal(stats.managers, 1); // store_manager
  assert.equal(stats.topPerformers, 1); // score 92
});

// ---- 员工查询 ----

test('staff data: getStaffById returns correct detail for existing staff', () => {
  const staff = getStaffById('sf1');
  assert.ok(staff);
  assert.equal(staff.id, 'sf1');
  assert.equal(staff.code, 'EMP-001');
  assert.equal(staff.name, '张建国');
  assert.equal(staff.role, 'store_manager');
  assert.equal(staff.status, 'active');
  assert.equal(staff.performanceScore, 92);
  assert.ok(staff.idNumber.length > 0);
  assert.ok(staff.emergencyContact.length > 0);
  assert.ok(staff.emergencyPhone.length > 0);
  assert.ok(staff.department.length > 0);
  assert.ok(staff.supervisor.length > 0);
  assert.ok(staff.notes.length > 0);
});

test('staff data: getStaffById returns undefined for nonexistent id', () => {
  assert.equal(getStaffById('sf-nope'), undefined);
  assert.equal(getStaffById(''), undefined);
});

test('staff data: getStaffById returns cross-market staff', () => {
  const james = getStaffById('sf11');
  assert.ok(james);
  assert.equal(james.marketCode, 'us-default');
  assert.equal(james.role, 'store_manager');

  const david = getStaffById('sf16');
  assert.ok(david);
  assert.equal(david.marketCode, 'uk-default');
  assert.equal(david.role, 'operations');
});

// ---- 详情 Mock vs 列表一致性 ----

test('staff data: MOCK_STAFF_DETAILS ids are subset of MOCK_STAFF ids', () => {
  const listIds = new Set(MOCK_STAFF.map((s) => s.id));
  for (const id of Object.keys(MOCK_STAFF_DETAILS)) {
    assert.ok(listIds.has(id), `detail id ${id} not in MOCK_STAFF`);
  }
});

test('staff data: detail fields match corresponding list item fields', () => {
  for (const [id, detail] of Object.entries(MOCK_STAFF_DETAILS)) {
    const listItem = MOCK_STAFF.find((s) => s.id === id);
    assert.ok(listItem, `no list item for detail ${id}`);
    assert.equal(detail.code, listItem!.code);
    assert.equal(detail.name, listItem!.name);
    assert.equal(detail.role, listItem!.role);
    assert.equal(detail.storeName, listItem!.storeName);
    assert.equal(detail.status, listItem!.status);
    assert.equal(detail.marketCode, listItem!.marketCode);
    assert.equal(detail.performanceScore, listItem!.performanceScore);
  }
});

// ---- 详情标签 ----

test('staff data: STAFF_DETAIL_LABELS has all expected keys', () => {
  assert.equal(STAFF_DETAIL_LABELS.code, '员工编号');
  assert.equal(STAFF_DETAIL_LABELS.name, '姓名');
  assert.equal(STAFF_DETAIL_LABELS.role, '岗位角色');
  assert.equal(STAFF_DETAIL_LABELS.storeName, '所属门店');
  assert.equal(STAFF_DETAIL_LABELS.status, '在职状态');
  assert.equal(STAFF_DETAIL_LABELS.phone, '手机号');
  assert.equal(STAFF_DETAIL_LABELS.email, '邮箱');
  assert.equal(STAFF_DETAIL_LABELS.hiredAt, '入职日期');
  assert.equal(STAFF_DETAIL_LABELS.lastActiveAt, '最后活跃');
  assert.equal(STAFF_DETAIL_LABELS.performanceScore, '绩效评分');
  assert.equal(STAFF_DETAIL_LABELS.overviewTitle, '员工信息');
  assert.equal(STAFF_DETAIL_LABELS.saveButton, '保存修改');
  assert.equal(STAFF_DETAIL_LABELS.backToList, '返回员工列表');
});

test('staff data: STAFF_DETAIL_LABELS.notFound returns formatted message', () => {
  const notFoundFn = STAFF_DETAIL_LABELS.notFound as (v: string) => string;
  assert.equal(notFoundFn('EMP-404'), '员工 EMP-404 不存在');
  assert.equal(notFoundFn('EMP-000'), '员工 EMP-000 不存在');
});

// ---- 绩效评分分布 ----

test('staff data: performance scores are well-distributed', () => {
  const scores = MOCK_STAFF.map((s) => s.performanceScore);
  const max = Math.max(...scores);
  const min = Math.min(...scores);
  assert.ok(max >= 90, `max score ${max} is too low`);
  assert.ok(min <= 60, `min score ${min} is too high — need low performers in data`);
  assert.ok(scores.some((s) => s >= 85), 'should have at least one high performer');
  assert.ok(scores.some((s) => s < 70), 'should have at least one low performer');
});

test('staff data: average performance score is between 60 and 90', () => {
  const avg = MOCK_STAFF.reduce((s, item) => s + item.performanceScore, 0) / MOCK_STAFF.length;
  assert.ok(avg >= 60, `avg ${avg} too low`);
  assert.ok(avg <= 90, `avg ${avg} too high`);
});

// ---- 状态分布 ----

test('staff data: all 4 statuses are represented', () => {
  const statusCounts: Record<string, number> = {};
  for (const s of MOCK_STAFF) {
    statusCounts[s.status] = (statusCounts[s.status] ?? 0) + 1;
  }
  assert.ok((statusCounts.active || 0) > 0);
  assert.ok((statusCounts.probation || 0) > 0);
  assert.ok((statusCounts.on_leave || 0) > 0);
  assert.ok((statusCounts.resigned || 0) > 0);
  assert.ok((statusCounts.active || 0) > (statusCounts.resigned || 0));
});

// ---- 角色分布 ----

test('staff data: store_manager and sales_clerk are most represented roles', () => {
  const managers = MOCK_STAFF.filter((s) => s.role === 'store_manager').length;
  const clerks = MOCK_STAFF.filter((s) => s.role === 'sales_clerk').length;
  assert.ok(managers >= 3, 'should have at least 3 store managers (multi-market)');
  assert.ok(clerks >= 3, 'should have at least 3 sales clerks');
});

// ---- 跨市场覆盖 ----

test('staff data: cn-mainland has majority but us/uk have representation', () => {
  const cn = MOCK_STAFF.filter((s) => s.marketCode === 'cn-mainland');
  const us = MOCK_STAFF.filter((s) => s.marketCode === 'us-default');
  const uk = MOCK_STAFF.filter((s) => s.marketCode === 'uk-default');

  assert.ok(cn.length > us.length);
  assert.ok(us.length >= 3);
  assert.ok(uk.length >= 1);
});

// ---- 门店分布 ----

test('staff data: staff are spread across multiple stores', () => {
  const stores = new Set(MOCK_STAFF.map((s) => s.storeName));
  assert.ok(stores.size >= 8, `only ${stores.size} stores — should be spread across more`);
});

// ---- 类型安全检查 ----

test('staff data: no staff has empty name string', () => {
  for (const s of MOCK_STAFF) {
    assert.ok(s.name.trim().length > 0, `staff ${s.code} has empty name`);
  }
});

test('staff data: phone numbers are at least 10 characters', () => {
  for (const s of MOCK_STAFF) {
    assert.ok(s.phone.length >= 10, `staff ${s.code} phone too short: ${s.phone}`);
  }
});

test('staff data: email addresses contain @', () => {
  for (const s of MOCK_STAFF) {
    assert.ok(s.email.includes('@'), `staff ${s.code} invalid email: ${s.email}`);
  }
});
