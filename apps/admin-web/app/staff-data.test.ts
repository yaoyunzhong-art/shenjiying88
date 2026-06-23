/**
 * staff-data.test.ts — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * 角色视角: 👔店长 · 👥HR · 🔧安监 · 🎯运行专员
 * 测试员工管理数据模型、状态映射、角色映射和统计计算
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  MOCK_STAFF,
  MOCK_STAFF_DETAILS,
  STAFF_STATUS_MAP,
  STAFF_ROLE_MAP,
  STAFF_STATUSES,
  STAFF_ROLES,
  STAFF_LIST_PRESET,
  STAFF_LIST_COLUMN_KEYS,
  STAFF_DETAIL_LABELS,
  getStaffById,
  computeStaffStats,
  type StaffItem,
  type StaffStatus,
  type StaffRole,
} from './staff-data';

// ===================== 正例 =====================

test('👔 店长视角: mock staff list is well-formed', () => {
  assert.equal(Array.isArray(MOCK_STAFF), true);
  assert.ok(MOCK_STAFF.length >= 15, 'should have at least 15 staff');

  for (const s of MOCK_STAFF) {
    assert.ok(s.id.length > 0, 'id required');
    assert.ok(s.code.length > 0, 'code required');
    assert.ok(s.name.length > 0, 'name required');
    assert.ok(s.storeName.length > 0, 'storeName required');
    assert.ok(s.performanceScore >= 0 && s.performanceScore <= 100,
      `performanceScore ${s.performanceScore} out of 0-100 range`);
  }
});

test('👥 HR视角: all staff statuses are mapped', () => {
  const statuses: StaffStatus[] = ['active', 'on_leave', 'resigned', 'probation'];
  for (const s of statuses) {
    assert.ok(s in STAFF_STATUS_MAP, `missing status: ${s}`);
    assert.ok(STAFF_STATUS_MAP[s].label.length > 0);
  }
});

test('🔧 安监视角: all staff roles are mapped', () => {
  const roles: StaffRole[] = [
    'store_manager', 'sales_clerk', 'front_desk', 'warehouse',
    'finance', 'marketing', 'operations', 'cleaner',
  ];
  for (const r of roles) {
    assert.ok(r in STAFF_ROLE_MAP, `missing role: ${r}`);
    assert.ok(STAFF_ROLE_MAP[r].label.length > 0);
  }
});

test('🎯 运行专员视角: computeStaffStats returns correct aggregations', () => {
  const stats = computeStaffStats(MOCK_STAFF);

  assert.equal(stats.total, MOCK_STAFF.length);
  assert.ok(stats.active <= stats.total);
  assert.ok(stats.managers <= stats.total);
  assert.ok(stats.topPerformers <= stats.total);
  // Managers should all be store_manager role
  const actualManagers = MOCK_STAFF.filter(s => s.role === 'store_manager').length;
  assert.equal(stats.managers, actualManagers);
});

// ===================== 反例 =====================

test('反例: getStaffById returns undefined for unknown id', () => {
  assert.equal(getStaffById('non-existent'), undefined);
  assert.equal(getStaffById(''), undefined);
});

test('反例: resigned staff should have lower performance scores', () => {
  const resigned = MOCK_STAFF.filter(s => s.status === 'resigned');
  for (const s of resigned) {
    assert.ok(s.performanceScore < 70,
      `resigned staff should have low score, got ${s.performanceScore}`);
  }
});

test('反例: probation staff are recent hires', () => {
  const probationStaff = MOCK_STAFF.filter(s => s.status === 'probation');
  for (const s of probationStaff) {
    assert.ok(s.hiredAt >= '2026', 'probation staff should be recently hired');
  }
});

// ===================== 边界 =====================

test('边界: all staff have unique ids and codes', () => {
  const ids = MOCK_STAFF.map(s => s.id);
  const codes = MOCK_STAFF.map(s => s.code);
  assert.equal(new Set(ids).size, ids.length, 'staff ids should be unique');
  assert.equal(new Set(codes).size, codes.length, 'staff codes should be unique');
});

test('边界: staff list preset has valid configuration', () => {
  assert.equal(STAFF_LIST_PRESET.defaultPageSize, 10);
  assert.ok(STAFF_LIST_PRESET.pageSizeOptions.includes(5));
  assert.ok(STAFF_LIST_PRESET.pageSizeOptions.includes(20));
});

test('边界: staff list columns include essential fields', () => {
  const essentialCols = ['code', 'name', 'role', 'storeName', 'status', 'performanceScore'];
  for (const col of essentialCols) {
    assert.ok(STAFF_LIST_COLUMN_KEYS.includes(col as (typeof STAFF_LIST_COLUMN_KEYS)[number]),
      `missing column: ${col}`);
  }
});

test('边界: all mock staff statuses/roles are valid enum values', () => {
  const validStatuses = new Set<string>(STAFF_STATUSES);
  const validRoles = new Set<string>(STAFF_ROLES);
  for (const s of MOCK_STAFF) {
    assert.ok(validStatuses.has(s.status), `invalid status: ${s.status}`);
    assert.ok(validRoles.has(s.role), `invalid role: ${s.role}`);
  }
});

test('边界: detail labels include all required fields', () => {
  const requiredLabels = ['code', 'name', 'role', 'status', 'phone',
    'email', 'hiredAt', 'performanceScore', 'overviewTitle', 'editTitle'];
  for (const label of requiredLabels) {
    assert.ok(label in STAFF_DETAIL_LABELS, `missing label: ${label}`);
  }
});

test('边界: staff detail matches list item data consistency', () => {
  const detailIds = Object.keys(MOCK_STAFF_DETAILS);
  assert.ok(detailIds.length >= 5, 'should have at least 5 staff details');

  for (const id of detailIds) {
    const detail = MOCK_STAFF_DETAILS[id];
    const listItem = MOCK_STAFF.find(s => s.id === id);
    assert.ok(listItem, `detail ${id} missing from list`);
    if (listItem && detail) {
      assert.equal(detail.code, listItem.code);
      assert.equal(detail.name, listItem.name);
      assert.equal(detail.status, listItem.status);
    }
  }
});

test('边界: computeStaffStats with empty array returns zeros', () => {
  const stats = computeStaffStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.active, 0);
  assert.equal(stats.managers, 0);
  assert.equal(stats.topPerformers, 0);
});
