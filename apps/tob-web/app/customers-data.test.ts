/**
 * customers-data.test.ts — Unit tests for ToB customers data & filtering logic
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_CUSTOMERS,
  CUSTOMER_STATUS_MAP,
  CUSTOMER_TIER_MAP,
  CUSTOMER_INDUSTRY_MAP,
  CUSTOMER_STATUSES,
  CUSTOMER_TIERS,
  CUSTOMER_INDUSTRIES,
  type CustomerItem,
} from './customers-data';

function annualizedSpend(item: CustomerItem): number {
  return item.monthlySpend * 12;
}

describe('customers-data', () => {
  describe('MOCK_CUSTOMERS', () => {
    it('should contain at least 10 customers', () => {
      assert.ok(MOCK_CUSTOMERS.length >= 10, `expected >= 10, got ${MOCK_CUSTOMERS.length}`);
    });

    it('every customer should have a unique id', () => {
      const ids = MOCK_CUSTOMERS.map((c) => c.id);
      assert.strictEqual(new Set(ids).size, ids.length);
    });

    it('every customer should have a valid status', () => {
      for (const c of MOCK_CUSTOMERS) {
        assert.ok(
          CUSTOMER_STATUSES.includes(c.status),
          `invalid status ${c.status} for ${c.id}`,
        );
      }
    });

    it('every customer should have a valid tier', () => {
      for (const c of MOCK_CUSTOMERS) {
        assert.ok(
          CUSTOMER_TIERS.includes(c.tier),
          `invalid tier ${c.tier} for ${c.id}`,
        );
      }
    });

    it('every customer should have a valid industry', () => {
      for (const c of MOCK_CUSTOMERS) {
        assert.ok(
          CUSTOMER_INDUSTRIES.includes(c.industry),
          `invalid industry ${c.industry} for ${c.id}`,
        );
      }
    });

    it('every customer should have positive monthlySpend if active', () => {
      for (const c of MOCK_CUSTOMERS) {
        if (c.status === 'active') {
          assert.ok(c.monthlySpend > 0, `active customer ${c.id} should have monthlySpend > 0`);
        }
      }
    });

    it('every customer should have totalSpend >= monthlySpend', () => {
      for (const c of MOCK_CUSTOMERS) {
        assert.ok(
          c.totalSpend >= c.monthlySpend,
          `${c.id} totalSpend ${c.totalSpend} < monthlySpend ${c.monthlySpend}`,
        );
      }
    });

    it('has customers from multiple industries', () => {
      const industries = new Set(MOCK_CUSTOMERS.map((c) => c.industry));
      assert.ok(industries.size >= 4, `expected >= 4 industries, got ${industries.size}`);
    });

    it('has customers from multiple regions', () => {
      const regions = new Set(MOCK_CUSTOMERS.map((c) => c.region));
      assert.ok(regions.size >= 4, `expected >= 4 regions, got ${regions.size}`);
    });

    it('has at least one customer in each status', () => {
      for (const s of CUSTOMER_STATUSES) {
        const count = MOCK_CUSTOMERS.filter((c) => c.status === s).length;
        assert.ok(count > 0, `no customers with status ${s}`);
      }
    });

    it('has at least one customer in each tier', () => {
      for (const t of CUSTOMER_TIERS) {
        const count = MOCK_CUSTOMERS.filter((c) => c.tier === t).length;
        assert.ok(count > 0, `no customers with tier ${t}`);
      }
    });

    it('totalContracts >= activeContracts for all customers', () => {
      for (const c of MOCK_CUSTOMERS) {
        assert.ok(
          c.totalContracts >= c.activeContracts,
          `${c.id} totalContracts ${c.totalContracts} < activeContracts ${c.activeContracts}`,
        );
      }
    });
  });

  describe('CUSTOMER_STATUS_MAP', () => {
    it('should have entries for all statuses', () => {
      for (const s of CUSTOMER_STATUSES) {
        assert.ok(CUSTOMER_STATUS_MAP[s], `missing status ${s}`);
      }
    });

    it('each entry should have label and variant', () => {
      for (const s of CUSTOMER_STATUSES) {
        const entry = CUSTOMER_STATUS_MAP[s];
        assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
        assert.ok(
          ['success', 'warning', 'danger', 'neutral'].includes(entry.variant),
        );
      }
    });
  });

  describe('CUSTOMER_TIER_MAP', () => {
    it('should have entries for all tiers', () => {
      for (const t of CUSTOMER_TIERS) {
        assert.ok(CUSTOMER_TIER_MAP[t], `missing tier ${t}`);
      }
    });

    it('each entry should have label and variant', () => {
      for (const t of CUSTOMER_TIERS) {
        const entry = CUSTOMER_TIER_MAP[t];
        assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
        assert.ok(
          ['success', 'warning', 'danger', 'neutral', 'info'].includes(entry.variant),
        );
      }
    });
  });

  describe('CUSTOMER_INDUSTRY_MAP', () => {
    it('should have entries for all industries', () => {
      for (const ind of CUSTOMER_INDUSTRIES) {
        assert.ok(CUSTOMER_INDUSTRY_MAP[ind], `missing industry ${ind}`);
      }
    });

    it('each entry should have a non-empty label', () => {
      for (const ind of CUSTOMER_INDUSTRIES) {
        assert.ok(CUSTOMER_INDUSTRY_MAP[ind].length > 0);
      }
    });
  });

  describe('filtering logic', () => {
    const searchFields: (keyof CustomerItem)[] = ['companyName', 'contactName', 'contactEmail', 'city'];

    function searchBy(items: CustomerItem[], term: string): CustomerItem[] {
      if (!term.trim()) return items;
      const lower = term.toLowerCase();
      return items.filter((item) =>
        searchFields.some((key) => String(item[key]).toLowerCase().includes(lower)),
      );
    }

    it('should filter by company name', () => {
      const result = searchBy(MOCK_CUSTOMERS, '云帆');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 'c-001');
    });

    it('should filter by contact name', () => {
      const result = searchBy(MOCK_CUSTOMERS, '张伟');
      assert.ok(result.length >= 1);
    });

    it('should filter by city', () => {
      const result = searchBy(MOCK_CUSTOMERS, '成都');
      assert.ok(result.length >= 1);
      for (const c of result) {
        assert.strictEqual(c.city, '成都');
      }
    });

    it('empty search returns all items', () => {
      const result = searchBy(MOCK_CUSTOMERS, '');
      assert.strictEqual(result.length, MOCK_CUSTOMERS.length);
    });

    it('non-matching search returns empty', () => {
      const result = searchBy(MOCK_CUSTOMERS, 'zzz-nonexistent-99999');
      assert.strictEqual(result.length, 0);
    });

    it('should filter by tier', () => {
      const result = MOCK_CUSTOMERS.filter((c) => c.tier === 'platinum');
      assert.ok(result.length >= 1);
      for (const c of result) {
        assert.strictEqual(c.tier, 'platinum');
      }
    });

    it('should filter by industry', () => {
      const result = MOCK_CUSTOMERS.filter((c) => c.industry === 'tech');
      assert.ok(result.length >= 1);
      for (const c of result) {
        assert.strictEqual(c.industry, 'tech');
      }
    });

    it('should filter by region', () => {
      const result = MOCK_CUSTOMERS.filter((c) => c.region === '华东');
      assert.ok(result.length >= 3);
      for (const c of result) {
        assert.strictEqual(c.region, '华东');
      }
    });

    it('composite filter: active tech customers', () => {
      const result = MOCK_CUSTOMERS.filter(
        (c) => c.status === 'active' && c.industry === 'tech',
      );
      assert.ok(result.length >= 1);
      for (const c of result) {
        assert.strictEqual(c.status, 'active');
        assert.strictEqual(c.industry, 'tech');
      }
    });

    it('composite filter: platinum gold customers', () => {
      const result = MOCK_CUSTOMERS.filter(
        (c) => c.tier === 'platinum' || c.tier === 'gold',
      );
      assert.ok(result.length >= 5);
    });
  });

  describe('pagination', () => {
    it('first page returns correct number of items', () => {
      const pageSize = 5;
      const page = 0;
      const items = MOCK_CUSTOMERS.slice(page * pageSize, (page + 1) * pageSize);
      assert.strictEqual(items.length, pageSize);
      assert.strictEqual(items[0]?.id, MOCK_CUSTOMERS[0]?.id);
    });

    it('last page handles fewer items', () => {
      const pageSize = 10;
      const totalPages = Math.ceil(MOCK_CUSTOMERS.length / pageSize);
      const lastPage = totalPages - 1;
      const start = lastPage * pageSize;
      const items = MOCK_CUSTOMERS.slice(start);
      assert.ok(items.length <= pageSize);
    });

    it('page count is correct', () => {
      const pageSize = 5;
      const totalPages = Math.ceil(MOCK_CUSTOMERS.length / pageSize);
      assert.strictEqual(totalPages, Math.ceil(15 / 5));
    });
  });

  describe('sorting', () => {
    it('should sort by monthlySpend descending', () => {
      const sorted = [...MOCK_CUSTOMERS].sort((a, b) => b.monthlySpend - a.monthlySpend);
      assert.ok(
        sorted.every(
          (_, i) =>
            i === 0 || sorted[i]!.monthlySpend <= sorted[i - 1]!.monthlySpend,
        ),
      );
    });

    it('should sort by totalSpend ascending', () => {
      const sorted = [...MOCK_CUSTOMERS].sort((a, b) => a.totalSpend - b.totalSpend);
      assert.ok(
        sorted.every(
          (_, i) =>
            i === 0 || sorted[i]!.totalSpend >= sorted[i - 1]!.totalSpend,
        ),
      );
    });

    it('should sort by annualized spend', () => {
      const sorted = [...MOCK_CUSTOMERS].sort(
        (a, b) => annualizedSpend(b) - annualizedSpend(a),
      );
      assert.ok(
        sorted.every(
          (_, i) =>
            i === 0 || annualizedSpend(sorted[i]!) <= annualizedSpend(sorted[i - 1]!),
        ),
      );
    });

    it('should sort by activeContracts descending', () => {
      const sorted = [...MOCK_CUSTOMERS].sort((a, b) => b.activeContracts - a.activeContracts);
      assert.ok(sorted[0]!.activeContracts >= sorted[sorted.length - 1]!.activeContracts);
    });
  });

  describe('stats computation', () => {
    it('total customer count matches', () => {
      assert.strictEqual(MOCK_CUSTOMERS.length, 15);
    });

    it('should count active customers', () => {
      const active = MOCK_CUSTOMERS.filter((c) => c.status === 'active');
      assert.ok(active.length > MOCK_CUSTOMERS.filter((c) => c.status !== 'active').length);
    });

    it('should average monthly spend correctly', () => {
      const totalMonthly = MOCK_CUSTOMERS.reduce((sum, c) => sum + c.monthlySpend, 0);
      const avg = totalMonthly / MOCK_CUSTOMERS.length;
      assert.ok(avg > 0);
      assert.ok(avg < 1000000);
    });

    it('should compute total revenue', () => {
      const total = MOCK_CUSTOMERS.reduce((sum, c) => sum + c.totalSpend, 0);
      assert.ok(total > 10000000, `total revenue should be > 10M, got ${total}`);
    });

    it('should count platinum customers', () => {
      const platinum = MOCK_CUSTOMERS.filter((c) => c.tier === 'platinum');
      assert.ok(platinum.length >= 2);
    });
  });
});
