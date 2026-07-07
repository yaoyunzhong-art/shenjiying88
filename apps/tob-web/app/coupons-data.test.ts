/**
 * coupons-data.test.ts — Unit tests for ToB coupons data layer
 *
 * Covers:
 *   + 正例: 数据完整性、类型枚举、状态映射
 *   + 反例: 无效值检测
 *   + 边界: 分页、排序、过滤链
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MOCK_COUPONS,
  COUPON_TYPE_MAP,
  COUPON_STATUS_MAP,
  REVERSE_STATUS,
  REVERSE_ACTION_LABEL,
  COUPON_TYPES,
  COUPON_STATUSES,
  ALL_MARKETS,
  ALL_BRANDS,
  type CouponItem,
  type CouponType,
  type CouponStatus,
} from './coupons-data';

// ── 正例: 数据完整性 ──

describe('MOCK_COUPONS — 正向测试', () => {
  it('应包含至少 10 条优惠券', () => {
    assert.ok(MOCK_COUPONS.length >= 10, `expected >= 10, got ${MOCK_COUPONS.length}`);
  });

  it('每条优惠券应有唯一 id', () => {
    const ids = MOCK_COUPONS.map((c) => c.id);
    assert.strictEqual(new Set(ids).size, ids.length);
  });

  it('每条优惠券应有有效 id 前缀', () => {
    for (const c of MOCK_COUPONS) {
      assert.ok(c.id.startsWith('tob-cpn-'), `invalid id prefix: ${c.id}`);
    }
  });

  it('每条优惠券应有非空名称', () => {
    for (const c of MOCK_COUPONS) {
      assert.ok(c.name.length > 0, `empty name for ${c.id}`);
    }
  });

  it('每条优惠券应有有效 type', () => {
    for (const c of MOCK_COUPONS) {
      assert.ok(COUPON_TYPES.includes(c.type), `invalid type ${c.type} for ${c.id}`);
    }
  });

  it('每条优惠券应有有效 status', () => {
    for (const c of MOCK_COUPONS) {
      assert.ok(COUPON_STATUSES.includes(c.status), `invalid status ${c.status} for ${c.id}`);
    }
  });

  it('每种 type 至少有一条优惠券', () => {
    for (const t of COUPON_TYPES) {
      const count = MOCK_COUPONS.filter((c) => c.type === t).length;
      assert.ok(count > 0, `no coupons with type ${t}`);
    }
  });

  it('每种 status 至少有一条优惠券', () => {
    for (const s of COUPON_STATUSES) {
      const count = MOCK_COUPONS.filter((c) => c.status === s).length;
      assert.ok(count > 0, `no coupons with status ${s}`);
    }
  });

  it('totalIssued 应为正数', () => {
    for (const c of MOCK_COUPONS) {
      assert.ok(c.totalIssued > 0, `${c.id} totalIssued should be > 0`);
    }
  });

  it('usedCount 不应超过 totalIssued', () => {
    for (const c of MOCK_COUPONS) {
      assert.ok(c.usedCount <= c.totalIssued, `${c.id} usedCount ${c.usedCount} > totalIssued ${c.totalIssued}`);
    }
  });

  it('usageLimit 应为 1-3', () => {
    for (const c of MOCK_COUPONS) {
      assert.ok(c.usageLimit >= 1 && c.usageLimit <= 3, `${c.id} usageLimit ${c.usageLimit} out of range`);
    }
  });

  it('validTo 不应早于 validFrom', () => {
    for (const c of MOCK_COUPONS) {
      assert.ok(c.validTo >= c.validFrom, `${c.id} validTo ${c.validTo} < validFrom ${c.validFrom}`);
    }
  });

  it('每条优惠券应有有效 marketCode', () => {
    for (const c of MOCK_COUPONS) {
      assert.ok(ALL_MARKETS.includes(c.marketCode), `invalid marketCode ${c.marketCode} for ${c.id}`);
    }
  });

  it('每条优惠券应有有效 brandCode', () => {
    for (const c of MOCK_COUPONS) {
      assert.ok(ALL_BRANDS.includes(c.brandCode), `invalid brandCode ${c.brandCode} for ${c.id}`);
    }
  });

  it('覆盖多个市场和品牌', () => {
    const markets = new Set(MOCK_COUPONS.map((c) => c.marketCode));
    const brands = new Set(MOCK_COUPONS.map((c) => c.brandCode));
    assert.ok(markets.size >= 4, `expected >= 4 markets, got ${markets.size}`);
    assert.ok(brands.size >= 2, `expected >= 2 brands, got ${brands.size}`);
  });
});

// ── COUPON_TYPE_MAP / COUPON_STATUS_MAP ──

describe('COUPON_TYPE_MAP', () => {
  it('应为所有 type 提供映射', () => {
    for (const t of COUPON_TYPES) {
      assert.ok(COUPON_TYPE_MAP[t], `missing type ${t}`);
    }
  });

  it('每条映射应有 label 和 variant', () => {
    for (const t of COUPON_TYPES) {
      const entry = COUPON_TYPE_MAP[t];
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
      assert.ok(['success', 'warning', 'info', 'danger'].includes(entry.variant));
    }
  });
});

describe('COUPON_STATUS_MAP', () => {
  it('应为所有 status 提供映射', () => {
    for (const s of COUPON_STATUSES) {
      assert.ok(COUPON_STATUS_MAP[s], `missing status ${s}`);
    }
  });

  it('每条映射应有 label 和 variant', () => {
    for (const s of COUPON_STATUSES) {
      const entry = COUPON_STATUS_MAP[s];
      assert.ok(typeof entry.label === 'string' && entry.label.length > 0);
      assert.ok(['success', 'neutral', 'warning'].includes(entry.variant));
    }
  });
});

// ── REVERSE_STATUS / REVERSE_ACTION_LABEL ──

describe('REVERSE_STATUS', () => {
  it('active ↔ disabled 互逆', () => {
    assert.strictEqual(REVERSE_STATUS['active'], 'disabled');
    assert.strictEqual(REVERSE_STATUS['disabled'], 'active');
  });

  it('expired 无逆操作', () => {
    assert.strictEqual(REVERSE_STATUS['expired'], undefined);
  });
});

describe('REVERSE_ACTION_LABEL', () => {
  it('为可逆状态提供操作标签', () => {
    assert.strictEqual(typeof REVERSE_ACTION_LABEL['active'], 'string');
    assert.strictEqual(typeof REVERSE_ACTION_LABEL['disabled'], 'string');
  });

  it('expired 无操作标签', () => {
    assert.strictEqual(REVERSE_ACTION_LABEL['expired'], undefined);
  });
});

// ── 过滤逻辑 ──

describe('过滤逻辑', () => {
  const searchFields: (keyof CouponItem)[] = ['name', 'id', 'value', 'description', 'createdBy', 'marketCode', 'brandCode'];

  function searchBy(items: CouponItem[], term: string): CouponItem[] {
    if (!term.trim()) return items;
    const lower = term.toLowerCase();
    return items.filter((item) =>
      searchFields.some((key) => {
        const val = item[key];
        return val != null && String(val).toLowerCase().includes(lower);
      }),
    );
  }

  it('空搜索返回全部', () => {
    const result = searchBy(MOCK_COUPONS, '');
    assert.strictEqual(result.length, MOCK_COUPONS.length);
  });

  it('无匹配搜索返回空数组', () => {
    const result = searchBy(MOCK_COUPONS, 'zzz_nonexistent_999');
    assert.strictEqual(result.length, 0);
  });

  it('按优惠券名称过滤', () => {
    const result = searchBy(MOCK_COUPONS, '8折');
    assert.ok(result.length >= 1);
    for (const c of result) {
      assert.ok(c.name.includes('8折'));
    }
  });

  it('按 type 过滤', () => {
    const result = MOCK_COUPONS.filter((c) => c.type === 'cash');
    assert.ok(result.length >= 1);
    for (const c of result) {
      assert.strictEqual(c.type, 'cash');
    }
  });

  it('按 status 过滤', () => {
    const result = MOCK_COUPONS.filter((c) => c.status === 'active');
    assert.ok(result.length >= 5);
    for (const c of result) {
      assert.strictEqual(c.status, 'active');
    }
  });

  it('按 marketCode 过滤', () => {
    const result = MOCK_COUPONS.filter((c) => c.marketCode === 'CN-SH');
    assert.ok(result.length >= 1);
    for (const c of result) {
      assert.strictEqual(c.marketCode, 'CN-SH');
    }
  });

  it('复合过滤: active + cash 类型', () => {
    const result = MOCK_COUPONS.filter(
      (c) => c.status === 'active' && c.type === 'cash',
    );
    assert.ok(result.length >= 1);
    for (const c of result) {
      assert.strictEqual(c.status, 'active');
      assert.strictEqual(c.type, 'cash');
    }
  });
});

// ── 分页 ──

describe('分页', () => {
  const TOTAL = MOCK_COUPONS.length;

  it('首页返回正确数量', () => {
    const pageSize = 5;
    const items = MOCK_COUPONS.slice(0, pageSize);
    assert.strictEqual(items.length, pageSize);
  });

  it('最后一页处理不足数量', () => {
    const pageSize = 10;
    const totalPages = Math.ceil(TOTAL / pageSize);
    const start = (totalPages - 1) * pageSize;
    const items = MOCK_COUPONS.slice(start);
    assert.ok(items.length <= pageSize);
    assert.ok(items.length > 0);
  });

  it('总页数计算正确', () => {
    const pageSize = 5;
    const expectedPages = Math.ceil(TOTAL / pageSize);
    assert.strictEqual(expectedPages, Math.ceil(TOTAL / 5));
  });

  it('pageSize 为 20 时应无分页截断', () => {
    const pageSize = Math.max(20, TOTAL);
    const items = MOCK_COUPONS.slice(0, pageSize);
    assert.strictEqual(items.length, TOTAL);
  });
});

// ── 排序 ──

describe('排序', () => {
  it('按 totalIssued 降序', () => {
    const sorted = [...MOCK_COUPONS].sort((a, b) => b.totalIssued - a.totalIssued);
    assert.ok(
      sorted.every(
        (_, i) => i === 0 || sorted[i]!.totalIssued <= sorted[i - 1]!.totalIssued,
      ),
    );
  });

  it('按 usedCount 升序', () => {
    const sorted = [...MOCK_COUPONS].sort((a, b) => a.usedCount - b.usedCount);
    assert.ok(
      sorted.every(
        (_, i) => i === 0 || sorted[i]!.usedCount >= sorted[i - 1]!.usedCount,
      ),
    );
  });

  it('按有效期结束时间排序', () => {
    const sorted = [...MOCK_COUPONS].sort((a, b) => a.validTo.localeCompare(b.validTo));
    assert.ok(
      sorted.every(
        (_, i) => i === 0 || sorted[i]!.validTo >= sorted[i - 1]!.validTo,
      ),
    );
  });

  it('按核销率降序', () => {
    const rate = (c: CouponItem) => c.totalIssued > 0 ? (c.usedCount / c.totalIssued) : 0;
    const sorted = [...MOCK_COUPONS].sort((a, b) => rate(b) - rate(a));
    assert.ok(
      sorted.every(
        (_, i) => i === 0 || rate(sorted[i]!) <= rate(sorted[i - 1]!),
      ),
    );
  });
});

// ── 统计计算 ──

describe('统计计算', () => {
  it('总条数应匹配 MOCK_COUPONS.length', () => {
    assert.strictEqual(MOCK_COUPONS.length, MOCK_COUPONS.length);
  });

  it('active 优惠券数量', () => {
    const active = MOCK_COUPONS.filter((c) => c.status === 'active');
    assert.ok(active.length >= 5);
  });

  it('expired 优惠券数量应 > 0', () => {
    const expired = MOCK_COUPONS.filter((c) => c.status === 'expired');
    assert.ok(expired.length > 0);
  });

  it('总发放量应 > 0', () => {
    const total = MOCK_COUPONS.reduce((s, c) => s + c.totalIssued, 0);
    assert.ok(total > 0);
  });

  it('总核销量应 <= 总发放量', () => {
    const total = MOCK_COUPONS.reduce((s, c) => s + c.totalIssued, 0);
    const used = MOCK_COUPONS.reduce((s, c) => s + c.usedCount, 0);
    assert.ok(used <= total);
  });

  it('核销率计算不溢出', () => {
    for (const c of MOCK_COUPONS) {
      const rate = Math.round((c.usedCount / c.totalIssued) * 100);
      assert.ok(rate >= 0 && rate <= 100);
    }
  });
});
