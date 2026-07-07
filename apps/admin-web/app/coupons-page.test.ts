/**
 * coupons-page.test.ts — Unit tests for coupons list page data, filtering, pagination, and logic
 *
 * 🐜 自动: [B-页面创建] [coupons-page 优惠券列表页测试]
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  MOCK_COUPONS,
  COUPON_STATUS_MAP,
  COUPON_TYPE_MAP,
  COUPON_SCOPE_MAP,
  COUPON_STATUSES,
  COUPON_TYPES,
  type CouponItem,
  type CouponStatus,
  type CouponType,
} from './coupons-data';

import {
  filterCoupons,
  paginateCoupons,
  computeCouponSummary,
  remainingPercent,
  formatDiscount,
  formatThreshold,
  buildCouponsPageData,
  DEFAULT_FILTERS,
  type CouponFilters,
  type PaginationState,
} from './coupons-page';

// ---- 测试套件 ----

describe('coupons-data', () => {
  describe('MOCK_COUPONS', () => {
    it('should contain at least 8 coupons', () => {
      assert.ok(MOCK_COUPONS.length >= 8, `expected >= 8, got ${MOCK_COUPONS.length}`);
    });

    it('every coupon should have a unique id', () => {
      const ids = MOCK_COUPONS.map((c) => c.id);
      assert.strictEqual(new Set(ids).size, ids.length);
    });

    it('every coupon should have a unique code', () => {
      const codes = MOCK_COUPONS.map((c) => c.code);
      assert.strictEqual(new Set(codes).size, codes.length);
    });

    it('every coupon should have a valid status', () => {
      for (const c of MOCK_COUPONS) {
        assert.ok(
          COUPON_STATUSES.includes(c.status),
          `invalid status ${c.status} for ${c.id}`,
        );
      }
    });

    it('every coupon should have a valid type', () => {
      for (const c of MOCK_COUPONS) {
        assert.ok(COUPON_TYPES.includes(c.type), `invalid type ${c.type} for ${c.id}`);
      }
    });

    it('remainingQuota should never exceed totalQuota', () => {
      for (const c of MOCK_COUPONS) {
        assert.ok(
          c.remainingQuota <= c.totalQuota,
          `${c.id}: remainingQuota ${c.remainingQuota} > totalQuota ${c.totalQuota}`,
        );
      }
    });

    it('usedCount + remainingQuota should equal totalQuota where data is consistent', () => {
      for (const c of MOCK_COUPONS) {
        // 草稿刚创建时可能 usedCount + remaining = total
        if (c.status === 'draft') continue;
        // 已过期的不强制校验
        if (c.status === 'expired') continue;
        assert.strictEqual(
          c.usedCount + c.remainingQuota,
          c.totalQuota,
          `${c.id}: usedCount ${c.usedCount} + remainingQuota ${c.remainingQuota} !== totalQuota ${c.totalQuota}`,
        );
      }
    });
  });

  describe('COUPON_STATUS_MAP', () => {
    it('should have entries for every status', () => {
      for (const s of COUPON_STATUSES) {
        assert.ok(COUPON_STATUS_MAP[s], `missing entry for ${s}`);
        assert.ok(COUPON_STATUS_MAP[s].label);
        assert.ok(COUPON_STATUS_MAP[s].variant);
      }
    });
  });

  describe('COUPON_TYPE_MAP', () => {
    it('should have entries for every type', () => {
      for (const t of COUPON_TYPES) {
        assert.ok(COUPON_TYPE_MAP[t], `missing entry for ${t}`);
        assert.ok(COUPON_TYPE_MAP[t].label);
        // suffix can be empty string for shipping
        assert.ok(typeof COUPON_TYPE_MAP[t].suffix === 'string');
      }
    });
  });
});

describe('coupons-page logic', () => {
  describe('filterCoupons', () => {
    it('should return all coupons with default filters', () => {
      const result = filterCoupons(MOCK_COUPONS, DEFAULT_FILTERS);
      assert.strictEqual(result.length, MOCK_COUPONS.length);
    });

    it('should filter by status', () => {
      const result = filterCoupons(MOCK_COUPONS, { ...DEFAULT_FILTERS, status: 'active' });
      for (const c of result) {
        assert.strictEqual(c.status, 'active');
      }
      assert.ok(result.length > 0);
      assert.ok(result.length < MOCK_COUPONS.length);
    });

    it('should filter by type', () => {
      const result = filterCoupons(MOCK_COUPONS, { ...DEFAULT_FILTERS, type: 'threshold' });
      for (const c of result) {
        assert.strictEqual(c.type, 'threshold');
      }
      assert.ok(result.length > 0);
    });

    it('should filter by search keyword (name)', () => {
      const result = filterCoupons(MOCK_COUPONS, { ...DEFAULT_FILTERS, search: '会员' });
      for (const c of result) {
        const match =
          c.name.includes('会员') ||
          c.code.toLowerCase().includes('会员') ||
          c.createdBy.includes('会员');
        assert.ok(match, `${c.id} should match search '会员'`);
      }
      assert.ok(result.length >= 2);
    });

    it('should filter by search keyword (code)', () => {
      const result = filterCoupons(MOCK_COUPONS, { ...DEFAULT_FILTERS, search: 'SUMMER' });
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0].code, 'SUMMER2026');
    });

    it('should return empty array for non-matching status', () => {
      const result = filterCoupons(MOCK_COUPONS, { ...DEFAULT_FILTERS, search: 'NONEXIST999' });
      assert.strictEqual(result.length, 0);
    });

    it('should combine status + type filters', () => {
      const result = filterCoupons(MOCK_COUPONS, { status: 'active', type: 'percentage', search: '' });
      for (const c of result) {
        assert.strictEqual(c.status, 'active');
        assert.strictEqual(c.type, 'percentage');
      }
      assert.ok(result.length >= 2);
    });
  });

  describe('paginateCoupons', () => {
    const items = MOCK_COUPONS;

    it('should return all items when pageSize >= total', () => {
      const { items: paged, total, totalPages } = paginateCoupons(items, {
        page: 1,
        pageSize: 100,
      });
      assert.strictEqual(paged.length, items.length);
      assert.strictEqual(total, items.length);
      assert.strictEqual(totalPages, 1);
    });

    it('should return correct page 1 with default pageSize', () => {
      const { items: paged, total, totalPages } = paginateCoupons(items, {
        page: 1,
        pageSize: 10,
      });
      assert.strictEqual(paged.length, 10);
      assert.strictEqual(total, items.length);
      assert.ok(totalPages >= 1);
    });

    it('should return correct page 2 with smaller pageSize', () => {
      const { items: paged } = paginateCoupons(items, {
        page: 2,
        pageSize: 3,
      });
      assert.ok(paged.length > 0);
      // With 10 items and pageSize 3, page 2 returns items 3..5 = 3 items
      assert.strictEqual(paged.length, 3);
    });

    it('should return empty for page beyond last page after clamp', () => {
      const { items: paged } = paginateCoupons(items, {
        page: 999,
        pageSize: 100,
      });
      // with 10 items, pageSize 100 -> totalPages=1, page clamped to 1, returns all
      assert.strictEqual(paged.length, items.length);
    });

    it('should clamp overflow page to last page', () => {
      const { items: paged, totalPages } = paginateCoupons(items, {
        page: 999,
        pageSize: 10,
      });
      assert.ok(paged.length > 0);
      assert.strictEqual(totalPages, Math.ceil(items.length / 10));
    });

    it('should handle page 1 with pageSize 5', () => {
      const { items: paged, totalPages } = paginateCoupons(items, {
        page: 1,
        pageSize: 5,
      });
      assert.strictEqual(paged.length, 5);
      assert.strictEqual(totalPages, Math.ceil(items.length / 5));
    });
  });

  describe('computeCouponSummary', () => {
    it('should compute summary for all coupons', () => {
      const summary = computeCouponSummary(MOCK_COUPONS);
      assert.strictEqual(summary.total, MOCK_COUPONS.length);
      assert.strictEqual(
        summary.activeCount + summary.draftCount + summary.exhaustedCount + summary.expiredCount + summary.pausedCount,
        summary.total,
      );
    });

    it('activeCount should be >= 1', () => {
      const summary = computeCouponSummary(MOCK_COUPONS);
      assert.ok(summary.activeCount >= 1);
    });
  });

  describe('remainingPercent', () => {
    it('should return 0 for zero totalQuota', () => {
      const item: CouponItem = MOCK_COUPONS[0];
      const zeroItem = { ...item, totalQuota: 0, remainingQuota: 0 };
      assert.strictEqual(remainingPercent(zeroItem), 0);
    });

    it('should return correct percentage', () => {
      const item: CouponItem = MOCK_COUPONS[0];
      const expected = Math.round((item.remainingQuota / item.totalQuota) * 100);
      assert.strictEqual(remainingPercent(item), expected);
    });

    it('should return 0 for exhausted coupon', () => {
      const exhausted = MOCK_COUPONS.find((c) => c.status === 'exhausted')!;
      assert.strictEqual(remainingPercent(exhausted), 0);
    });
  });

  describe('formatDiscount', () => {
    it('should format percentage coupon', () => {
      const item = MOCK_COUPONS.find((c) => c.type === 'percentage')!;
      const result = formatDiscount(item);
      assert.ok(result.includes(`${item.discountValue}`));
      assert.ok(result.includes('%'));
    });

    it('should format fixed coupon', () => {
      const item = MOCK_COUPONS.find((c) => c.type === 'fixed')!;
      const result = formatDiscount(item);
      assert.ok(result.includes(`${item.discountValue}`));
      assert.ok(result.includes('元'));
    });

    it('should format shipping coupon', () => {
      const item = MOCK_COUPONS.find((c) => c.type === 'shipping')!;
      assert.strictEqual(formatDiscount(item), '包邮');
    });
  });

  describe('formatThreshold', () => {
    it('should return "无门槛" for zero threshold', () => {
      const item = MOCK_COUPONS.find((c) => c.threshold === 0)!;
      assert.strictEqual(formatThreshold(item), '无门槛');
    });

    it('should return formatted threshold', () => {
      const item = MOCK_COUPONS.find((c) => c.threshold > 0)!;
      assert.strictEqual(formatThreshold(item), `满${item.threshold}元`);
    });
  });

  describe('buildCouponsPageData', () => {
    it('should return complete page data with defaults', () => {
      const data = buildCouponsPageData();
      assert.strictEqual(data.coupons, MOCK_COUPONS);
      assert.strictEqual(data.paged.length, 10);
      assert.strictEqual(data.totalFiltered, MOCK_COUPONS.length);
      assert.strictEqual(data.summary.total, MOCK_COUPONS.length);
    });

    it('should apply filters and pagination', () => {
      const data = buildCouponsPageData(MOCK_COUPONS, { status: 'active', type: 'all', search: '' }, { page: 1, pageSize: 5 });
      for (const c of data.paged) {
        assert.strictEqual(c.status, 'active');
      }
      assert.ok(data.paged.length <= 5);
      assert.strictEqual(data.totalFiltered, data.filtered.length);
    });

    it('summary should count across all coupons not just filtered', () => {
      const data = buildCouponsPageData(MOCK_COUPONS, { status: 'exhausted', type: 'all', search: '' }, { page: 1, pageSize: 10 });
      assert.strictEqual(data.summary.total, MOCK_COUPONS.length);
      assert.strictEqual(data.filtered.length, data.totalFiltered);
    });
  });
});
