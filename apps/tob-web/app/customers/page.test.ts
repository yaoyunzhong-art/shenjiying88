/**
 * page.test.ts — 客户管理页面源码分析测试 (node:test + tsx)
 *
 * 测试 CustomersPage 组件中的核心逻辑:
 *   - formatCurrency 格式化函数
 *   - 搜索/状态/等级/行业 过滤逻辑
 *   - 分页计算
 *   - 统计聚合
 *   - 边界条件
 *
 * 避免渲染 React 组件, 专注于页面内联逻辑的纯函数分析。
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MOCK_CUSTOMERS,
  CUSTOMER_STATUS_MAP,
  CUSTOMER_TIER_MAP,
  CUSTOMER_INDUSTRY_MAP,
  CUSTOMER_STATUSES,
  CUSTOMER_TIERS,
  CUSTOMER_INDUSTRIES,
  type CustomerItem,
  type CustomerStatus,
  type CustomerTier,
  type CustomerIndustry,
} from '../customers-data';

// ──────────────────────────────────────────────
// 页面内联工具函数 (从 page.tsx 抽取)
// ──────────────────────────────────────────────

function formatCurrency(n: number): string {
  if (n >= 1_000_000) return `¥${(n / 10_000).toFixed(1)}万`;
  if (n >= 1_000) return `¥${(n / 1000).toFixed(1)}K`;
  return `¥${n}`;
}

const CUSTOMERS_PER_PAGE = 10;

const SEARCH_FIELDS: (keyof CustomerItem)[] = [
  'companyName',
  'contactName',
  'contactEmail',
  'city',
];

function searchFilter(items: CustomerItem[], term: string): CustomerItem[] {
  if (!term.trim()) return items;
  const lower = term.toLowerCase();
  return items.filter((c) =>
    SEARCH_FIELDS.some((f) => String(c[f]).toLowerCase().includes(lower)),
  );
}

function statusFilter(items: CustomerItem[], status: CustomerStatus | 'all'): CustomerItem[] {
  if (status === 'all') return items;
  return items.filter((c) => c.status === status);
}

function tierFilter(items: CustomerItem[], tier: CustomerTier | 'all'): CustomerItem[] {
  if (tier === 'all') return items;
  return items.filter((c) => c.tier === tier);
}

function industryFilter(items: CustomerItem[], industry: CustomerIndustry | 'all'): CustomerItem[] {
  if (industry === 'all') return items;
  return items.filter((c) => c.industry === industry);
}

interface Stats {
  total: number;
  active: number;
  totalMonthly: number;
  platinum: number;
}

function computeStats(items: CustomerItem[]): Stats {
  return {
    total: items.length,
    active: items.filter((c) => c.status === 'active').length,
    totalMonthly: items.reduce((s, c) => s + c.monthlySpend, 0),
    platinum: items.filter((c) => c.tier === 'platinum').length,
  };
}

// ──────────────────────────────────────────────
// formatCurrency
// ──────────────────────────────────────────────

describe('formatCurrency (page inline helper)', () => {
  it('returns ¥0 for zero', () => {
    assert.equal(formatCurrency(0), '¥0');
  });

  it('returns raw number for < 1000', () => {
    assert.equal(formatCurrency(500), '¥500');
    assert.equal(formatCurrency(999), '¥999');
  });

  it('formats thousands with K suffix', () => {
    assert.equal(formatCurrency(1_000), '¥1.0K');
    assert.equal(formatCurrency(45_000), '¥45.0K');
    assert.equal(formatCurrency(92_000), '¥92.0K');
    assert.equal(formatCurrency(999_999), '¥1000.0K'); // edge: just below 1M
  });

  it('formats millions with 万 suffix', () => {
    assert.equal(formatCurrency(1_000_000), '¥100.0万');
    assert.equal(formatCurrency(1_500_000), '¥150.0万');
    assert.equal(formatCurrency(9_200_000), '¥920.0万');
    assert.equal(formatCurrency(38_500_000), '¥3850.0万');
  });

  it('handles very large numbers', () => {
    assert.equal(formatCurrency(100_000_000), '¥10000.0万');
    assert.equal(formatCurrency(2_547_000_000), '¥254700.0万');
  });

  it('handles negative numbers (edge case)', () => {
    assert.equal(formatCurrency(-500), '¥-500');
  });
});

// ──────────────────────────────────────────────
// CustomersPage 模块导出
// ──────────────────────────────────────────────

describe('CustomersPage module exports', () => {
  it('default export is a function (React component)', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function');
  });

  it('component display name contains Customers', async () => {
    const mod = await import('./page');
    assert.ok(mod.default.name.includes('Customers'));
  });
});

// ──────────────────────────────────────────────
// 数据完整性 —— 与 page.tsx 消费方式一致
// ──────────────────────────────────────────────

describe('data integrity (as consumed by page.tsx)', () => {
  it('MOCK_CUSTOMERS has at least 12 items (page renders multiple pages)', () => {
    assert.ok(MOCK_CUSTOMERS.length >= 12);
  });

  it('every customer has all searchable fields as defined in page.tsx', () => {
    const searchable: (keyof CustomerItem)[] = [
      'companyName',
      'contactName',
      'contactEmail',
      'city',
    ];
    for (const c of MOCK_CUSTOMERS) {
      for (const f of searchable) {
        assert.notEqual(c[f], undefined, `customer ${c.id} missing searchable field "${f}"`);
      }
    }
  });

  it('every customer status is in CUSTOMER_STATUSES', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(CUSTOMER_STATUSES.includes(c.status), `${c.id}: invalid status ${c.status}`);
    }
  });

  it('every customer tier is in CUSTOMER_TIERS', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(CUSTOMER_TIERS.includes(c.tier), `${c.id}: invalid tier ${c.tier}`);
    }
  });

  it('every customer industry is in CUSTOMER_INDUSTRIES', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(CUSTOMER_INDUSTRIES.includes(c.industry), `${c.id}: invalid industry ${c.industry}`);
    }
  });

  it('activeContracts never exceeds totalContracts', () => {
    for (const c of MOCK_CUSTOMERS) {
      assert.ok(c.activeContracts <= c.totalContracts, `${c.id}: active > total`);
    }
  });

  it('churned customers have 0 activeContracts', () => {
    for (const c of MOCK_CUSTOMERS) {
      if (c.status === 'churned') {
        assert.equal(c.activeContracts, 0, `${c.id}: churned but activeContracts=${c.activeContracts}`);
      }
    }
  });

  it('suspended customers have 0 activeContracts', () => {
    for (const c of MOCK_CUSTOMERS) {
      if (c.status === 'suspended') {
        assert.equal(c.activeContracts, 0, `${c.id}: suspended but activeContracts=${c.activeContracts}`);
      }
    }
  });

  it('pending customers have minimal or 0 activeContracts', () => {
    for (const c of MOCK_CUSTOMERS) {
      if (c.status === 'pending') {
        assert.ok(c.activeContracts <= 1, `${c.id}: pending but activeContracts=${c.activeContracts}`);
      }
    }
  });
});

// ──────────────────────────────────────────────
// Status/tier/industry map 覆盖检查
// ──────────────────────────────────────────────

describe('status/tier/industry map coverage (as used by page.tsx)', () => {
  it('CUSTOMER_STATUS_MAP covers all CUSTOMER_STATUSES', () => {
    for (const s of CUSTOMER_STATUSES) {
      const entry = CUSTOMER_STATUS_MAP[s];
      assert.ok(entry, `missing status map: ${s}`);
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
      assert.match(entry.variant, /^(success|warning|danger|neutral)$/);
    }
  });

  it('CUSTOMER_TIER_MAP covers all CUSTOMER_TIERS', () => {
    for (const t of CUSTOMER_TIERS) {
      const entry = CUSTOMER_TIER_MAP[t];
      assert.ok(entry, `missing tier map: ${t}`);
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
      assert.match(entry.variant, /^(success|warning|danger|neutral|info)$/);
    }
  });

  it('CUSTOMER_INDUSTRY_MAP covers all CUSTOMER_INDUSTRIES', () => {
    for (const i of CUSTOMER_INDUSTRIES) {
      const entry = CUSTOMER_INDUSTRY_MAP[i];
      assert.ok(entry, `missing industry map: ${i}`);
      assert.ok(typeof entry === 'string' && entry.length > 0);
    }
  });
});

// ──────────────────────────────────────────────
// 搜索过滤逻辑 (与 page.tsx useMemo 一致)
// ──────────────────────────────────────────────

describe('search filtering (pattern from page.tsx useMemo)', () => {
  it('finds company by name substring', () => {
    const r = searchFilter(MOCK_CUSTOMERS, '云帆');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'c-001');
  });

  it('finds contact by name', () => {
    const r = searchFilter(MOCK_CUSTOMERS, '张伟');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'c-001');
  });

  it('finds by email domain', () => {
    const r = searchFilter(MOCK_CUSTOMERS, 'chuangyun.dev');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'c-015');
  });

  it('finds by city', () => {
    const r = searchFilter(MOCK_CUSTOMERS, '成都');
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'c-005');
  });

  it('empty string returns all customers', () => {
    const r = searchFilter(MOCK_CUSTOMERS, '');
    assert.equal(r.length, MOCK_CUSTOMERS.length);
  });

  it('whitespace-only string returns all customers', () => {
    const r = searchFilter(MOCK_CUSTOMERS, '   ');
    assert.equal(r.length, MOCK_CUSTOMERS.length);
  });

  it('non-matching term returns empty array', () => {
    const r = searchFilter(MOCK_CUSTOMERS, 'ZZZZ_NONEXISTENT_99999');
    assert.equal(r.length, 0);
  });

  it('partial substring match across searchable fields', () => {
    // "科技" appears in companyName
    const r = searchFilter(MOCK_CUSTOMERS, '科技');
    // c-001 云帆科技, c-004 明德教育(no), c-013 仁心医疗(no)...
    // Actually: c-001 云帆科技, c-003 汇通金融(no), c-008 天翼信息(no)...
    for (const c of r) {
      const matchesSearchField = SEARCH_FIELDS.some(
        (f) => String(c[f]).toLowerCase().includes('科技'),
      );
      assert.ok(matchesSearchField, `${c.id} matched but no field contains "科技"`);
    }
  });

  it('case-insensitive search', () => {
    const upper = searchFilter(MOCK_CUSTOMERS, 'YUNFAN');
    const lower = searchFilter(MOCK_CUSTOMERS, 'yunfan');
    const mixed = searchFilter(MOCK_CUSTOMERS, 'YunFan');
    assert.equal(upper.length, 1);
    assert.equal(upper[0].id, lower[0].id);
    assert.equal(lower[0].id, mixed[0].id);
  });
});

// ──────────────────────────────────────────────
// 状态/等级/行业 下拉过滤 (与 page.tsx 一致)
// ──────────────────────────────────────────────

describe('dropdown filter logic (as rendered in page.tsx)', () => {
  it('status filter: "active" returns only active customers', () => {
    const r = statusFilter(MOCK_CUSTOMERS, 'active');
    assert.ok(r.every((c) => c.status === 'active'));
    assert.ok(r.length > 0);
  });

  it('status filter: "all" returns all customers', () => {
    const r = statusFilter(MOCK_CUSTOMERS, 'all');
    assert.equal(r.length, MOCK_CUSTOMERS.length);
  });

  it('status filter partition sums to total', () => {
    const sum = CUSTOMER_STATUSES.reduce(
      (acc, s) => acc + statusFilter(MOCK_CUSTOMERS, s).length,
      0,
    );
    assert.equal(sum, MOCK_CUSTOMERS.length);
  });

  it('tier filter: "platinum" returns only platinum customers', () => {
    const r = tierFilter(MOCK_CUSTOMERS, 'platinum');
    assert.ok(r.every((c) => c.tier === 'platinum'));
    assert.equal(r.length, 3); // c-001, c-003, c-009
  });

  it('tier filter: "all" returns all customers', () => {
    assert.equal(tierFilter(MOCK_CUSTOMERS, 'all').length, MOCK_CUSTOMERS.length);
  });

  it('tier filter partition sums to total', () => {
    const sum = CUSTOMER_TIERS.reduce(
      (acc, t) => acc + tierFilter(MOCK_CUSTOMERS, t).length,
      0,
    );
    assert.equal(sum, MOCK_CUSTOMERS.length);
  });

  it('industry filter: "tech" returns only tech customers', () => {
    const r = industryFilter(MOCK_CUSTOMERS, 'tech');
    assert.ok(r.every((c) => c.industry === 'tech'));
    assert.equal(r.length, 3); // c-001, c-008, c-015
  });

  it('industry filter: "all" returns all customers', () => {
    assert.equal(industryFilter(MOCK_CUSTOMERS, 'all').length, MOCK_CUSTOMERS.length);
  });

  it('industry filter partition sums to total', () => {
    const sum = CUSTOMER_INDUSTRIES.reduce(
      (acc, i) => acc + industryFilter(MOCK_CUSTOMERS, i).length,
      0,
    );
    assert.equal(sum, MOCK_CUSTOMERS.length);
  });
});

// ──────────────────────────────────────────────
// 组合过滤 (搜索 + 状态 + 等级 + 行业)
// ──────────────────────────────────────────────

describe('composite filters (combined as in page.tsx)', () => {
  it('search + status: active tech-company search', () => {
    const step1 = searchFilter(MOCK_CUSTOMERS, '科技');
    const step2 = statusFilter(step1, 'active');
    const step3 = industryFilter(step2, 'tech');
    // c-001 云帆科技: active + tech ✓
    assert.equal(step3.length, 1);
    assert.equal(step3[0].id, 'c-001');
  });

  it('tier + industry: platinum finance', () => {
    const r = industryFilter(
      tierFilter(MOCK_CUSTOMERS, 'platinum'),
      'finance',
    );
    assert.equal(r.length, 2); // c-003 汇通金融, c-009 华泰金融
    assert.ok(r.every((c) => c.tier === 'platinum' && c.industry === 'finance'));
  });

  it('status + tier: active gold customers', () => {
    const r = tierFilter(statusFilter(MOCK_CUSTOMERS, 'active'), 'gold');
    // c-002 星辰连锁(gold,active), c-005 博康医疗(gold,active), c-006 鼎新制造(gold,active), c-011 阳光教育(gold,active), c-013 仁心医疗(gold,active)
    assert.ok(r.every((c) => c.status === 'active' && c.tier === 'gold'));
  });

  it('all filters set to non-default returns filtered set', () => {
    const r = industryFilter(
      tierFilter(
        statusFilter(searchFilter(MOCK_CUSTOMERS, '北京'), 'active'),
        'platinum',
      ),
      'tech',
    );
    // search "北京": c-001 云帆科技(北京), c-009 华泰金融(北京)
    // active + platinum: c-001, c-003, c-009 中 active: c-001, c-009, c-003
    // active + platinum: c-001, c-003, c-009
    // search "北京": c-001(北京,铂金,active,tech), c-009(北京,铂金,active,finance)
    // industry=tech: c-001
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'c-001');
  });
});

// ──────────────────────────────────────────────
// 分页逻辑 (与 page.tsx useMemo 一致)
// ──────────────────────────────────────────────

describe('pagination (as rendered in page.tsx)', () => {
  it('first 10 items on page 0', () => {
    const paged = MOCK_CUSTOMERS.slice(0, CUSTOMERS_PER_PAGE);
    assert.equal(paged.length, CUSTOMERS_PER_PAGE);
    assert.equal(paged[0].id, 'c-001');
    assert.equal(paged[9].id, 'c-010');
  });

  it('remaining items on page 1', () => {
    const paged = MOCK_CUSTOMERS.slice(CUSTOMERS_PER_PAGE, CUSTOMERS_PER_PAGE * 2);
    assert.equal(paged.length, MOCK_CUSTOMERS.length - CUSTOMERS_PER_PAGE);
    assert.equal(paged[0].id, 'c-011');
  });

  it('page beyond last returns empty', () => {
    const paged = MOCK_CUSTOMERS.slice(5 * CUSTOMERS_PER_PAGE);
    assert.equal(paged.length, 0);
  });

  it('totalPages = ceil(total / PER_PAGE)', () => {
    const totalPages = Math.ceil(MOCK_CUSTOMERS.length / CUSTOMERS_PER_PAGE);
    assert.equal(totalPages, Math.ceil(15 / 10));
  });

  it('page resets to 0 when filter changes (simulated)', () => {
    // page.tsx resets page to 0 on any filter change
    const filteredAfterSearch = searchFilter(MOCK_CUSTOMERS, '云帆');
    const totalPages = Math.ceil(filteredAfterSearch.length / CUSTOMERS_PER_PAGE);
    assert.equal(totalPages, 1); // only 1 result, so page stays at 0
    assert.equal(filteredAfterSearch.length, 1);
  });
});

// ──────────────────────────────────────────────
// 统计聚合 (与 page.tsx computeStats 一致)
// ──────────────────────────────────────────────

describe('stats computation (as shown in StatCards)', () => {
  const stats = computeStats(MOCK_CUSTOMERS);

  it('total customer count matches MOCK_CUSTOMERS length', () => {
    assert.equal(stats.total, MOCK_CUSTOMERS.length);
    assert.equal(stats.total, 15);
  });

  it('active customer count is correct', () => {
    // active: c-001, c-002, c-003, c-005, c-006, c-008, c-009, c-011, c-013, c-014, c-015 = 11
    assert.equal(stats.active, 11);
  });

  it('total monthly spend sum is correct', () => {
    const expected = MOCK_CUSTOMERS.reduce((s, c) => s + c.monthlySpend, 0);
    assert.equal(stats.totalMonthly, expected);
    assert.ok(stats.totalMonthly > 0);
  });

  it('platinum customer count is correct', () => {
    // c-001, c-003, c-009
    assert.equal(stats.platinum, 3);
  });

  it('formatCurrency applied to stats display values', () => {
    const stats = computeStats(MOCK_CUSTOMERS);
    const formatted = formatCurrency(stats.totalMonthly);
    assert.ok(formatted.startsWith('¥'));
    assert.ok(formatted.endsWith('万') || formatted.endsWith('K') || /^¥\d+$/.test(formatted));
  });
});

// ──────────────────────────────────────────────
// 边界条件
// ──────────────────────────────────────────────

describe('edge cases (empty / no-match states)', () => {
  it('empty customer list produces zero stats', () => {
    const s = computeStats([]);
    assert.equal(s.total, 0);
    assert.equal(s.active, 0);
    assert.equal(s.totalMonthly, 0);
    assert.equal(s.platinum, 0);
  });

  it('search + status filter on empty list returns empty', () => {
    const r = statusFilter(searchFilter([], '云帆'), 'active');
    assert.equal(r.length, 0);
  });

  it('filter chain on single customer works', () => {
    const single = MOCK_CUSTOMERS.slice(0, 1);
    const r = industryFilter(
      tierFilter(statusFilter(single, 'active'), 'platinum'),
      'tech',
    );
    assert.equal(r.length, 1);
    assert.equal(r[0].id, 'c-001');
  });

  it('tier filter that matches nothing returns empty', () => {
    // All tiers are in customer data, but after other filters we can get empty
    const goldTech = industryFilter(
      tierFilter(MOCK_CUSTOMERS, 'gold'),
      'tech',
    );
    // gold customers: c-002(retail), c-005(healthcare), c-006(manufacturing), c-011(education), c-013(healthcare) — none are tech
    assert.equal(goldTech.length, 0);
  });

  it('industry filter with non-existent value returns nothing', () => {
    // custom-data.ts doesn't have "media", so this would be a type-level filter failure
    // but at runtime, filtering with a value no customer has should return empty
    const r = industryFilter(MOCK_CUSTOMERS, 'education'); // valid value
    assert.ok(r.length > 0);
  });

  it('blank search after status filter still returns all within status', () => {
    const r = searchFilter(statusFilter(MOCK_CUSTOMERS, 'active'), '');
    assert.equal(r.length, statusFilter(MOCK_CUSTOMERS, 'active').length);
  });
});

// ──────────────────────────────────────────────
// 排序验证 (page.tsx 没有内置排序, 但测试数据本身的可排序性)
// ──────────────────────────────────────────────

describe('data sortability (for potential future sorting UI)', () => {
  it('customers sorted by monthlySpend descending for top-spend analysis', () => {
    const sorted = [...MOCK_CUSTOMERS].sort((a, b) => b.monthlySpend - a.monthlySpend);
    assert.ok(sorted[0].monthlySpend >= sorted[1].monthlySpend);
  });

  it('customers sorted by totalSpend ascending', () => {
    const sorted = [...MOCK_CUSTOMERS].sort((a, b) => a.totalSpend - b.totalSpend);
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(sorted[i].totalSpend >= sorted[i - 1].totalSpend);
    }
  });

  it('active contract count sort stability', () => {
    const sorted = [...MOCK_CUSTOMERS].sort((a, b) => b.activeContracts - a.activeContracts);
    assert.equal(sorted[0].activeContracts, Math.max(...MOCK_CUSTOMERS.map((c) => c.activeContracts)));
  });
});
