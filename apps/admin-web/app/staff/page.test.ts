/**
 * staff-page.test.ts — Page-level tests for the staff listing page.
 * Tests list rendering, role/status filtering, search, and empty state.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: staff-data.ts, staff-page.test.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_STAFF,
  STAFF_STATUS_MAP,
  STAFF_ROLE_MAP,
  STAFF_STATUSES,
  STAFF_LIST_PRESET,
  STAFF_LIST_SEARCH_FIELDS,
  STAFF_LIST_COLUMN_KEYS,
  STAFF_DETAIL_LABELS,
  getStaffById,
  computeStaffStats,
  type StaffItem,
  type StaffRole,
  type StaffStatus,
} from '../staff-data';

// ---- Page-level filter helpers ----

function filterByStatus(items: StaffItem[], status: StaffStatus | 'ALL'): StaffItem[] {
  if (status === 'ALL') return items;
  return items.filter((s) => s.status === status);
}

function filterByRole(items: StaffItem[], role: StaffRole | 'ALL'): StaffItem[] {
  if (role === 'ALL') return items;
  return items.filter((s) => s.role === role);
}

function searchStaff(items: StaffItem[], keyword: string): StaffItem[] {
  if (!keyword.trim()) return items;
  const lower = keyword.toLowerCase();
  return items.filter((s) =>
    STAFF_LIST_SEARCH_FIELDS.some((field) =>
      String(s[field]).toLowerCase().includes(lower)
    )
  );
}

function filterByMarket(items: StaffItem[], marketCode: string | 'ALL'): StaffItem[] {
  if (marketCode === 'ALL') return items;
  return items.filter((s) => s.marketCode === marketCode);
}

function fullFilterChain(
  items: StaffItem[],
  keyword: string,
  status: StaffStatus | 'ALL',
  role: StaffRole | 'ALL',
  market: string,
): StaffItem[] {
  let result = searchStaff(items, keyword);
  result = filterByStatus(result, status);
  result = filterByRole(result, role);
  result = filterByMarket(result, market);
  return result;
}

function sortByPerformance(items: StaffItem[], dir: 'asc' | 'desc'): StaffItem[] {
  const sorted = [...items].sort((a, b) => {
    return dir === 'asc'
      ? a.performanceScore - b.performanceScore
      : b.performanceScore - a.performanceScore;
  });
  return sorted;
}

// ---- 正例 ----

describe('staff-page: 正例 (positive cases)', () => {
  describe('MOCK_STAFF data integrity', () => {
    it('should contain at least 20 records across 3+ markets', () => {
      assert.ok(MOCK_STAFF.length >= 20, `expected >= 20, got ${MOCK_STAFF.length}`);
      const markets = new Set(MOCK_STAFF.map((s) => s.marketCode));
      assert.ok(markets.has('cn-mainland'));
      assert.ok(markets.has('us-default'));
      assert.ok(markets.has('uk-default'));
    });

    it('every staff should have unique id and code', () => {
      const ids = MOCK_STAFF.map((s) => s.id);
      const codes = MOCK_STAFF.map((s) => s.code);
      assert.strictEqual(new Set(ids).size, ids.length);
      assert.strictEqual(new Set(codes).size, codes.length);
    });

    it('every staff should have valid role and status', () => {
      for (const s of MOCK_STAFF) {
        assert.ok(STAFF_ROLE_MAP[s.role], `invalid role ${s.role} for ${s.code}`);
        assert.ok(STAFF_STATUS_MAP[s.status], `invalid status ${s.status} for ${s.code}`);
      }
    });

    it('every staff should have non-empty name and valid phone', () => {
      for (const s of MOCK_STAFF) {
        assert.ok(s.name.trim().length > 0, `empty name for ${s.code}`);
        assert.ok(s.phone.length >= 10, `phone too short for ${s.code}: ${s.phone}`);
      }
    });

    it('all 4 statuses should be represented', () => {
      const statuses = new Set(MOCK_STAFF.map((s) => s.status));
      assert.ok(statuses.has('active'));
      assert.ok(statuses.has('probation'));
      assert.ok(statuses.has('on_leave'));
      assert.ok(statuses.has('resigned'));
    });

    it('performance score should be between 0-100 for everyone', () => {
      for (const s of MOCK_STAFF) {
        assert.ok(s.performanceScore >= 0 && s.performanceScore <= 100,
          `invalid score ${s.performanceScore} for ${s.code}`);
      }
    });
  });

  describe('STAFF_LIST_PRESET', () => {
    it('should have correct default page size and options', () => {
      assert.strictEqual(STAFF_LIST_PRESET.defaultPageSize, 10);
      assert.deepStrictEqual(STAFF_LIST_PRESET.pageSizeOptions, [5, 10, 15, 20]);
      assert.deepStrictEqual(STAFF_LIST_PRESET.searchFields, ['code', 'name', 'storeName', 'email']);
    });

    it('STAFF_LIST_COLUMN_KEYS should have 10 columns', () => {
      assert.strictEqual(STAFF_LIST_COLUMN_KEYS.length, 10);
      assert.ok(STAFF_LIST_COLUMN_KEYS.includes('code'));
      assert.ok(STAFF_LIST_COLUMN_KEYS.includes('name'));
      assert.ok(STAFF_LIST_COLUMN_KEYS.includes('role'));
      assert.ok(STAFF_LIST_COLUMN_KEYS.includes('status'));
      assert.ok(STAFF_LIST_COLUMN_KEYS.includes('performanceScore'));
    });
  });

  describe('staff status filter', () => {
    it('filter active should return only active staff', () => {
      const result = filterByStatus(MOCK_STAFF, 'active');
      assert.ok(result.length >= 10, `expected >= 10 active, got ${result.length}`);
      for (const s of result) {
        assert.strictEqual(s.status, 'active');
      }
    });

    it('filter probation should return only probation staff', () => {
      const result = filterByStatus(MOCK_STAFF, 'probation');
      assert.ok(result.length >= 1);
      for (const s of result) {
        assert.strictEqual(s.status, 'probation');
      }
    });

    it('filter resigned should return only resigned staff', () => {
      const result = filterByStatus(MOCK_STAFF, 'resigned');
      assert.ok(result.length >= 1);
      for (const s of result) {
        assert.strictEqual(s.status, 'resigned');
      }
    });
  });

  describe('role filter', () => {
    it('filter store_manager should return only managers', () => {
      const result = filterByRole(MOCK_STAFF, 'store_manager');
      assert.ok(result.length >= 3, `expected >= 3 managers, got ${result.length}`);
      for (const s of result) {
        assert.strictEqual(s.role, 'store_manager');
      }
    });

    it('filter sales_clerk should return only clerks', () => {
      const result = filterByRole(MOCK_STAFF, 'sales_clerk');
      assert.ok(result.length >= 3);
      for (const s of result) {
        assert.strictEqual(s.role, 'sales_clerk');
      }
    });
  });

  describe('search', () => {
    it('should find staff by name', () => {
      const result = searchStaff(MOCK_STAFF, '张建国');
      assert.ok(result.length >= 1);
    });

    it('should find staff by code', () => {
      const result = searchStaff(MOCK_STAFF, 'EMP-001');
      assert.ok(result.length >= 1);
    });

    it('should find staff by storeName', () => {
      const result = searchStaff(MOCK_STAFF, '朝阳大悦城');
      assert.ok(result.length >= 1);
    });

    it('should find staff by email', () => {
      const result = searchStaff(MOCK_STAFF, 'zhangjg@m5.com');
      assert.ok(result.length >= 1);
    });

    it('empty search should return all staff', () => {
      const result = searchStaff(MOCK_STAFF, '');
      assert.strictEqual(result.length, MOCK_STAFF.length);
    });
  });

  describe('getStaffById', () => {
    it('should return correct detail for existing staff', () => {
      const staff = getStaffById('sf1');
      assert.ok(staff, 'sf1 should exist');
      assert.strictEqual(staff!.id, 'sf1');
      assert.strictEqual(staff!.name, '张建国');
      assert.strictEqual(staff!.role, 'store_manager');
      assert.ok(staff!.idNumber.length > 0);
      assert.ok(staff!.emergencyContact.length > 0);
    });

    it('getStaffById should return undefined for nonexistent', () => {
      assert.strictEqual(getStaffById('sf-nope'), undefined);
    });
  });

  describe('computeStaffStats', () => {
    it('should return correct aggregates', () => {
      const stats = computeStaffStats(MOCK_STAFF);
      assert.strictEqual(stats.total, MOCK_STAFF.length);
      assert.ok(stats.active > 0);
      assert.ok(stats.managers > 0);
      assert.ok(stats.topPerformers > 0);
    });

    it('computeStaffStats for empty array returns all zeros', () => {
      const stats = computeStaffStats([]);
      assert.deepStrictEqual(stats, { total: 0, active: 0, managers: 0, topPerformers: 0 });
    });
  });

  describe('STAFF_DETAIL_LABELS', () => {
    it('should have all expected labels', () => {
      assert.strictEqual(STAFF_DETAIL_LABELS.code, '员工编号');
      assert.strictEqual(STAFF_DETAIL_LABELS.name, '姓名');
      assert.strictEqual(STAFF_DETAIL_LABELS.role, '岗位角色');
      assert.strictEqual(STAFF_DETAIL_LABELS.status, '在职状态');
      assert.strictEqual(STAFF_DETAIL_LABELS.phone, '手机号');
      assert.strictEqual(STAFF_DETAIL_LABELS.email, '邮箱');
      assert.strictEqual(STAFF_DETAIL_LABELS.overviewTitle, '员工信息');
      assert.strictEqual(STAFF_DETAIL_LABELS.backToList, '返回员工列表');
    });
  });
});

// ---- 反例 ----

describe('staff-page: 反例 (negative cases)', () => {
  it('search for nonexistent keyword returns empty', () => {
    const result = searchStaff(MOCK_STAFF, 'ZZZZ_NOT_FOUND');
    assert.strictEqual(result.length, 0);
  });

  it('empty staff list should handle all filters gracefully', () => {
    const empty: StaffItem[] = [];
    assert.strictEqual(filterByStatus(empty, 'active').length, 0);
    assert.strictEqual(filterByRole(empty, 'store_manager').length, 0);
    assert.strictEqual(searchStaff(empty, 'test').length, 0);
    assert.strictEqual(fullFilterChain(empty, '', 'ALL', 'ALL', 'ALL').length, 0);
  });

  it('getStaffById returns undefined for empty or nonexistent id', () => {
    assert.strictEqual(getStaffById(''), undefined);
    assert.strictEqual(getStaffById('non-existent-id'), undefined);
  });

  it('filter ALL should return the same as no filter', () => {
    const allStatus = filterByStatus(MOCK_STAFF, 'ALL');
    const allRole = filterByRole(MOCK_STAFF, 'ALL');
    assert.strictEqual(allStatus.length, MOCK_STAFF.length);
    assert.strictEqual(allRole.length, MOCK_STAFF.length);
  });
});

// ---- 边界 ----

describe('staff-page: 边界 (boundary cases)', () => {
  it('single char search should find matches', () => {
    const result = searchStaff(MOCK_STAFF, '张');
    assert.ok(result.length >= 1);
  });

  it('case-insensitive search should work', () => {
    const upper = searchStaff(MOCK_STAFF, 'EMP-001');
    const lower = searchStaff(MOCK_STAFF, 'emp-001');
    assert.strictEqual(upper.length, lower.length);
  });

  it('combined filter: status + role', () => {
    const result = fullFilterChain(MOCK_STAFF, '', 'active', 'store_manager', 'ALL');
    for (const s of result) {
      assert.strictEqual(s.status, 'active');
      assert.strictEqual(s.role, 'store_manager');
    }
  });

  it('performance sorting: top performer should be >= 90', () => {
    const sorted = sortByPerformance(MOCK_STAFF, 'desc');
    assert.ok(sorted[0]!.performanceScore >= 90, `top score ${sorted[0]!.performanceScore} should be >= 90`);
  });

  it('performance sorting: lowest performer should be < 60', () => {
    const sorted = sortByPerformance(MOCK_STAFF, 'asc');
    assert.ok(sorted[0]!.performanceScore < 60, `lowest score ${sorted[0]!.performanceScore} should be < 60`);
  });

  it('probation + on_leave + resigned should be less than active', () => {
    const active = MOCK_STAFF.filter((s) => s.status === 'active').length;
    const others = MOCK_STAFF.filter((s) => s.status !== 'active').length;
    assert.ok(active > others, `active ${active} should be > non-active ${others}`);
  });

  it('emails should all contain @', () => {
    for (const s of MOCK_STAFF) {
      assert.ok(s.email.includes('@'), `invalid email for ${s.code}: ${s.email}`);
    }
  });

  it('staff are spread across 8+ stores', () => {
    const stores = new Set(MOCK_STAFF.map((s) => s.storeName));
    assert.ok(stores.size >= 8, `only ${stores.size} stores — expected >= 8`);
  });
});
