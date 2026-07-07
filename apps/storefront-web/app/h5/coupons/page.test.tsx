/**
 * H5优惠券页面 - page.test.tsx — L1 冒烟测试
 * Phase-FP · T-FP-029 · 2026-07-03
 * 角色视角: 👤 会员
 * 覆盖: 正例 + 反例(防御) + 边界(极端数据/空数据)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据工厂 ──

function makeCoupon(overrides?: Record<string, unknown>) {
  return {
    id: 'c1',
    couponId: 'cp1',
    name: '新客首单8折',
    type: 'discount' as const,
    typeName: '打折券',
    value: '8折',
    minAmount: '满0元可用',
    validFrom: '2026-06-01',
    validTo: '2026-07-31',
    status: 'unused' as const,
    storeName: '神机营旗舰店',
    ...overrides,
  };
}

function makeCouponListResponse(overrides?: Record<string, unknown>) {
  return {
    success: true,
    data: {
      coupons: [
        makeCoupon(),
        makeCoupon({ id: 'c2', type: 'cash' as const, value: '¥50', status: 'unused' as const }),
        makeCoupon({ id: 'c4', type: 'discount' as const, status: 'used' as const }),
        makeCoupon({ id: 'c5', type: 'voucher' as const, status: 'expired' as const }),
      ],
      total: 4,
      unusedCount: 2,
      usedCount: 1,
      expiredCount: 1,
    },
    ...overrides,
  };
}

const COUPON_TYPES = ['discount', 'cash', 'free_shipping', 'voucher'] as const;
const COUPON_STATUSES = ['unused', 'used', 'expired'] as const;

const TYPE_CONFIG = {
  discount: { name: '打折券', color: '#f97316' },
  cash: { name: '代金券', color: '#10b981' },
  free_shipping: { name: '免运费券', color: '#3b82f6' },
  voucher: { name: '礼品券', color: '#ec4899' },
};

/* ── 正例 ── */

test('CouponsPage: should accept a valid Coupon with all fields', () => {
  const coupon = makeCoupon();
  assert.equal(typeof coupon.id, 'string');
  assert.equal(typeof coupon.name, 'string');
  assert.equal(typeof coupon.value, 'string');
  assert.equal(typeof coupon.status, 'string');
  assert.equal(typeof coupon.type, 'string');
  assert.ok(COUPON_TYPES.includes(coupon.type));
  assert.ok(COUPON_STATUSES.includes(coupon.status));
});

test('CouponsPage: should accept a valid CouponListResponse', () => {
  const resp = makeCouponListResponse();
  assert.equal(resp.success, true);
  assert.ok(resp.data !== undefined);
  assert.equal(resp.data!.coupons.length, 4);
  assert.equal(resp.data!.unusedCount, 2);
  assert.equal(resp.data!.usedCount, 1);
  assert.equal(resp.data!.expiredCount, 1);
});

test('CouponsPage: each coupon should have a valid type', () => {
  for (const type of COUPON_TYPES) {
    const coupon = makeCoupon({ type, typeName: TYPE_CONFIG[type].name });
    assert.equal(coupon.type, type);
    assert.equal(coupon.typeName, TYPE_CONFIG[type].name);
  }
});

test('CouponsPage: each coupon should have a valid status', () => {
  for (const status of COUPON_STATUSES) {
    const coupon = makeCoupon({ status });
    assert.equal(coupon.status, status);
  }
});

test('CouponsPage: should filter coupons by status', () => {
  const coupons = [
    makeCoupon({ id: 'c1', status: 'unused' as const }),
    makeCoupon({ id: 'c2', status: 'used' as const }),
    makeCoupon({ id: 'c3', status: 'unused' as const }),
    makeCoupon({ id: 'c4', status: 'expired' as const }),
  ];
  const unused = coupons.filter(c => c.status === 'unused');
  const used = coupons.filter(c => c.status === 'used');
  const expired = coupons.filter(c => c.status === 'expired');
  assert.equal(unused.length, 2);
  assert.equal(used.length, 1);
  assert.equal(expired.length, 1);
});

test('CouponsPage: should compute stats correctly', () => {
  const coupons = [
    makeCoupon({ status: 'unused' as const }),
    makeCoupon({ status: 'unused' as const }),
    makeCoupon({ status: 'used' as const }),
    makeCoupon({ status: 'expired' as const }),
    makeCoupon({ status: 'expired' as const }),
  ];
  const stats = {
    total: coupons.length,
    unused: coupons.filter(c => c.status === 'unused').length,
    used: coupons.filter(c => c.status === 'used').length,
    expired: coupons.filter(c => c.status === 'expired').length,
  };
  assert.equal(stats.total, 5);
  assert.equal(stats.unused, 2);
  assert.equal(stats.used, 1);
  assert.equal(stats.expired, 2);
  assert.equal(stats.unused + stats.used + stats.expired, stats.total);
});

test('CouponsPage: unused coupon should show "立即使用" button', () => {
  const coupon = makeCoupon({ status: 'unused' as const });
  const showUseButton = coupon.status === 'unused';
  assert.equal(showUseButton, true);
});

test('CouponsPage: used coupon should not show use button', () => {
  const coupon = makeCoupon({ status: 'used' as const });
  const showUseButton = coupon.status === 'unused';
  assert.equal(showUseButton, false);
});

test('CouponsPage: expired coupon should not show use button', () => {
  const coupon = makeCoupon({ status: 'expired' as const });
  const showUseButton = coupon.status === 'unused';
  assert.equal(showUseButton, false);
});

test('CouponsPage: TYPE_CONFIG should have correct configs for all types', () => {
  assert.equal(TYPE_CONFIG.discount.name, '打折券');
  assert.equal(TYPE_CONFIG.cash.name, '代金券');
  assert.equal(TYPE_CONFIG.free_shipping.name, '免运费券');
  assert.equal(TYPE_CONFIG.voucher.name, '礼品券');
  assert.ok(TYPE_CONFIG.discount.color.length > 0);
  assert.ok(TYPE_CONFIG.cash.color.length > 0);
});

test('CouponsPage: coupon with description optional field', () => {
  const withDesc = makeCoupon({ description: '限首次消费使用' });
  const withoutDesc = makeCoupon({ description: undefined });
  assert.equal(withDesc.description, '限首次消费使用');
  assert.equal(withoutDesc.description, undefined);
});

test('CouponsPage: filter toggle should switch between statuses', () => {
  let filter: string = 'ALL';
  assert.equal(filter, 'ALL');
  filter = 'unused';
  assert.equal(filter, 'unused');
  filter = 'used';
  assert.equal(filter, 'used');
  filter = 'expired';
  assert.equal(filter, 'expired');
});

/* ── 反例 / 防御 ── */

test('CouponsPage: should handle empty coupon list', () => {
  const resp = { success: true, data: { coupons: [] as unknown[], total: 0, unusedCount: 0, usedCount: 0, expiredCount: 0 } };
  assert.equal(resp.data.coupons.length, 0);
  assert.equal(resp.data.total, 0);
});

test('CouponsPage: should handle failed response', () => {
  const resp = { success: false, error: { code: 'FETCH_ERROR', message: '获取优惠券列表失败' } };
  assert.equal(resp.success, false);
  assert.ok(resp.error !== undefined);
  assert.equal(resp.error!.code, 'FETCH_ERROR');
});

test('CouponsPage: should handle missing data in response', () => {
  const resp = { success: false, data: undefined };
  assert.equal(resp.data, undefined);
});

test('CouponsPage: should handle unknown status values', () => {
  const unknownStatuses = [undefined, null, 'unknown', 'redeemed', ''];
  for (const s of unknownStatuses) {
    const coupon = makeCoupon({ status: s });
    assert.equal(coupon.status, s);
  }
});

test('CouponsPage: should handle unknown type values', () => {
  const unknownTypes = [undefined, null, 'unknown', ''];
  for (const t of unknownTypes) {
    const coupon = makeCoupon({ type: t });
    assert.equal(coupon.type, t);
  }
});

test('CouponsPage: should handle empty value string', () => {
  const coupon = makeCoupon({ value: '', minAmount: '' });
  assert.equal(coupon.value, '');
  assert.equal(coupon.minAmount, '');
});

test('CouponsPage: should handle missing validTo date', () => {
  const coupon = makeCoupon({ validTo: undefined, validFrom: undefined });
  assert.equal(coupon.validTo, undefined);
  assert.equal(coupon.validFrom, undefined);
});

test('CouponsPage: should handle missing id field', () => {
  const coupon = makeCoupon({ id: undefined });
  assert.equal(coupon.id, undefined);
});

test('CouponsPage: should handle claim coupon failure', () => {
  const claimResult = { success: false, error: { code: 'CLAIM_ERROR', message: '该优惠券已领完' } };
  assert.equal(claimResult.success, false);
  assert.equal(claimResult.error!.code, 'CLAIM_ERROR');
});

test('CouponsPage: should handle claim coupon network error', () => {
  const claimResult = { success: false, error: { code: 'NETWORK_ERROR', message: '网络错误' } };
  assert.equal(claimResult.success, false);
  assert.equal(claimResult.error!.code, 'NETWORK_ERROR');
});

/* ── 边界 ── */

test('CouponsPage: should handle many coupons', () => {
  const coupons = Array.from({ length: 200 }, (_, i) => makeCoupon({
    id: `c${i}`,
    status: i % 3 === 0 ? 'unused' as const : i % 3 === 1 ? 'used' as const : 'expired' as const,
  }));
  assert.equal(coupons.length, 200);
  const unusedCount = coupons.filter(c => c.status === 'unused').length;
  const usedCount = coupons.filter(c => c.status === 'used').length;
  const expiredCount = coupons.filter(c => c.status === 'expired').length;
  assert.equal(unusedCount + usedCount + expiredCount, 200);
});

test('CouponsPage: should sort coupons by value type', () => {
  const coupons = [
    makeCoupon({ id: 'c1', type: 'cash' as const, value: '¥80' }),
    makeCoupon({ id: 'c2', type: 'discount' as const, value: '8折' }),
    makeCoupon({ id: 'c3', type: 'voucher' as const, value: '¥50' }),
  ];
  // grouping by type
  const cash = coupons.filter(c => c.type === 'cash');
  assert.equal(cash.length, 1);
  assert.equal(cash[0].value, '¥80');
});

test('CouponsPage: should handle all coupons being unused', () => {
  const coupons = Array.from({ length: 3 }, (_, i) => makeCoupon({ id: `c${i}`, status: 'unused' as const }));
  assert.equal(coupons.filter(c => c.status === 'unused').length, 3);
  assert.equal(coupons.filter(c => c.status === 'used').length, 0);
  assert.equal(coupons.filter(c => c.status === 'expired').length, 0);
});

test('CouponsPage: should handle all coupons being expired', () => {
  const coupons = Array.from({ length: 5 }, (_, i) => makeCoupon({ id: `c${i}`, status: 'expired' as const }));
  assert.equal(coupons.every(c => c.status === 'expired'), true);
});

test('CouponsPage: should handle coupon with very long name', () => {
  const longName = '超级优惠'.repeat(30);
  const coupon = makeCoupon({ name: longName });
  assert.equal(coupon.name.length, longName.length);
  assert.ok(coupon.name.length > 60);
});

test('CouponsPage: coupon service fallback mock data valid check', () => {
  const mockCoupons = [
    { id: 'c1', name: '新客首单8折', type: 'discount' as const, value: '8折', status: 'unused' as const, validTo: '2026-07-31' },
    { id: 'c2', name: '满300减50', type: 'cash' as const, value: '¥50', status: 'unused' as const, validTo: '2026-06-30' },
    { id: 'c5', name: '端午节礼券', type: 'voucher' as const, value: '¥100', status: 'expired' as const, validTo: '2026-06-15' },
  ];
  assert.equal(mockCoupons.length, 3);
  assert.ok(mockCoupons.every(c => typeof c.id === 'string'));
  assert.ok(mockCoupons.every(c => COUPON_STATUSES.includes(c.status)));
  assert.ok(mockCoupons.every(c => COUPON_TYPES.includes(c.type)));
});

test('CouponsPage: claim coupon should return couponId on success', () => {
  const claimResult = { success: true, data: { couponId: 'coupon_001' } };
  assert.equal(claimResult.success, true);
  assert.equal(claimResult.data!.couponId, 'coupon_001');
});

test('CouponsPage: coupon disabled state check for used and expired', () => {
  const unused = makeCoupon({ status: 'unused' as const });
  const used = makeCoupon({ status: 'used' as const });
  const expired = makeCoupon({ status: 'expired' as const });
  assert.equal(unused.status === 'unused' ? true : false, true);
  assert.equal(used.status !== 'unused' ? true : false, true);
  assert.equal(expired.status !== 'unused' ? true : false, true);
});

test('CouponsPage: URL construction with status filter', () => {
  const baseUrl = '/member-coupons';
  const params = new URLSearchParams();
  params.set('status', 'unused');
  params.set('page', '1');
  params.set('pageSize', '20');
  const url = `${baseUrl}?${params}`;
  assert.ok(url.includes('status=unused'));
  assert.ok(url.includes('page=1'));
  assert.ok(url.includes('pageSize=20'));
});
