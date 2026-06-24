/**
 * Coupon Detail Page — storefront-web
 * Tests: data integrity, business logic, edge cases
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据类型 (与 page.tsx 一致) ──

type CouponType = 'discount' | 'cash' | 'free_shipping' | 'voucher';
type CouponStatus = 'active' | 'expired' | 'disabled';

interface CouponDetail {
  id: string;
  name: string;
  type: CouponType;
  value: string;
  minAmount: string;
  maxAmount: string;
  totalIssued: number;
  issuedCount: number;
  usedCount: number;
  validFrom: string;
  validTo: string;
  storeName: string;
  storeId: string;
  status: CouponStatus;
  description: string;
  usageLimit: number;
  usedLimit: number;
}

const TYPE_LABELS: Record<CouponType, string> = {
  discount: '打折券',
  cash: '代金券',
  free_shipping: '免运费',
  voucher: '礼品券',
};

const STATUS_LABELS: Record<CouponStatus, string> = {
  active: '进行中',
  expired: '已过期',
  disabled: '已停用',
};

// ── Mock 数据 (与 page.tsx 一致) ──

const MOCK_COUPON_DETAILS: Record<string, CouponDetail> = {
  cp1: {
    id: 'cp1', name: '新客首单8折', type: 'discount', value: '8折',
    minAmount: '满0元可用', maxAmount: '最高折扣 ¥50',
    totalIssued: 500, issuedCount: 500, usedCount: 187,
    validFrom: '2026-06-01', validTo: '2026-07-31',
    storeName: 'Demo Store 旗舰店', storeId: 'store-1',
    status: 'active',
    description: '新用户首次下单享受8折优惠。', usageLimit: 1, usedLimit: 187,
  },
  cp2: {
    id: 'cp2', name: '满300减50', type: 'cash', value: '¥50',
    minAmount: '满300元', maxAmount: '—',
    totalIssued: 300, issuedCount: 300, usedCount: 89,
    validFrom: '2026-06-01', validTo: '2026-06-30',
    storeName: 'Demo Store 旗舰店', storeId: 'store-1',
    status: 'active',
    description: '单笔订单满300元减50元。', usageLimit: 1, usedLimit: 89,
  },
  cp5: {
    id: 'cp5', name: '端午节礼券', type: 'voucher', value: '¥100',
    minAmount: '满200元', maxAmount: '—',
    totalIssued: 150, issuedCount: 150, usedCount: 98,
    validFrom: '2026-06-01', validTo: '2026-06-15',
    storeName: 'Demo Store 社区店', storeId: 'store-2',
    status: 'expired',
    description: '端午节限定礼品券。', usageLimit: 1, usedLimit: 98,
  },
  cp3: {
    id: 'cp3', name: '会员专享免运费', type: 'free_shipping', value: '免运费',
    minAmount: '满99元', maxAmount: '—',
    totalIssued: 1000, issuedCount: 1000, usedCount: 412,
    validFrom: '2026-06-01', validTo: '2026-12-31',
    storeName: 'Demo Store 旗舰店', storeId: 'store-1',
    status: 'active',
    description: '会员专享免运费权益。', usageLimit: 99, usedLimit: 412,
  },
  cp8: {
    id: 'cp8', name: '开业庆代价券', type: 'cash', value: '¥30',
    minAmount: '满150元', maxAmount: '—',
    totalIssued: 400, issuedCount: 400, usedCount: 15,
    validFrom: '2026-05-20', validTo: '2026-07-20',
    storeName: 'Demo Store 社区店', storeId: 'store-2',
    status: 'disabled',
    description: '新店开业优惠，全场通用。', usageLimit: 1, usedLimit: 15,
  },
};

const ALL_COUPONS = Object.values(MOCK_COUPON_DETAILS);

// ── 纯逻辑函数 ──

function computeRedemptionRate(coupon: CouponDetail): number {
  if (coupon.totalIssued <= 0) return 0;
  return Math.round((coupon.usedCount / coupon.totalIssued) * 100);
}

function computeRemaining(coupon: CouponDetail): number {
  return Math.max(0, coupon.totalIssued - coupon.usedCount);
}

function isExpired(validTo: string): boolean {
  return new Date(validTo) < new Date('2026-06-24');
}

function filterByStatus(items: CouponDetail[], status: CouponStatus): CouponDetail[] {
  return items.filter((c) => c.status === status);
}

function filterByStore(items: CouponDetail[], storeId: string): CouponDetail[] {
  return items.filter((c) => c.storeId === storeId);
}

function searchCoupons(items: CouponDetail[], term: string, fields: (keyof CouponDetail)[]): CouponDetail[] {
  const q = term.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      return typeof val === 'string' && val.toLowerCase().includes(q);
    }),
  );
}

function getCouponById(id: string): CouponDetail | undefined {
  return MOCK_COUPON_DETAILS[id];
}

function getActionChoices(status: CouponStatus): string[] {
  switch (status) {
    case 'active': return ['disable', 'delete'];
    case 'disabled': return ['enable', 'delete'];
    case 'expired': return ['delete'];
    default: return [];
  }
}

// ── 基础数据测试 ──

test('MOCK_COUPON_DETAILS 有 5 条数据', () => {
  assert.equal(ALL_COUPONS.length, 5);
});

test('所有 ID 唯一', () => {
  const ids = ALL_COUPONS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('所有记录 storeId 已定义', () => {
  for (const c of ALL_COUPONS) {
    assert.ok(typeof c.storeId === 'string' && c.storeId.length > 0,
      `${c.id} 缺少 storeId`);
  }
});

test('所有记录 description 非空', () => {
  for (const c of ALL_COUPONS) {
    assert.ok(c.description.length > 0, `${c.id} description 为空`);
  }
});

test('涵盖 4 种类型 (discount/cash/free_shipping/voucher)', () => {
  const types = new Set(ALL_COUPONS.map((c) => c.type));
  for (const t of ['discount', 'cash', 'free_shipping', 'voucher'] as const) {
    assert.ok(types.has(t), `缺少类型 ${t}`);
  }
});

test('涵盖 3 种状态 (active/expired/disabled)', () => {
  const statuses = new Set(ALL_COUPONS.map((c) => c.status));
  for (const s of ['active', 'expired', 'disabled'] as const) {
    assert.ok(statuses.has(s), `缺少状态 ${s}`);
  }
});

// ── 数据完整性 ──

test('usedCount 不超过 totalIssued', () => {
  for (const c of ALL_COUPONS) {
    assert.ok(c.usedCount <= c.totalIssued,
      `${c.id} usedCount(${c.usedCount}) > totalIssued(${c.totalIssued})`);
  }
});

test('issuedCount 等于 totalIssued', () => {
  for (const c of ALL_COUPONS) {
    assert.equal(c.issuedCount, c.totalIssued,
      `${c.id} issuedCount(${c.issuedCount}) !== totalIssued(${c.totalIssued})`);
  }
});

test('validFrom 早于或等于 validTo', () => {
  for (const c of ALL_COUPONS) {
    assert.ok(c.validFrom <= c.validTo,
      `${c.id} validFrom(${c.validFrom}) > validTo(${c.validTo})`);
  }
});

test('日期格式 YYYY-MM-DD', () => {
  const re = /^\d{4}-\d{2}-\d{2}$/;
  for (const c of ALL_COUPONS) {
    assert.ok(re.test(c.validFrom), `${c.id} validFrom(${c.validFrom}) 格式错误`);
    assert.ok(re.test(c.validTo), `${c.id} validTo(${c.validTo}) 格式错误`);
  }
});

test('usageLimit 为正整数', () => {
  for (const c of ALL_COUPONS) {
    assert.ok(c.usageLimit > 0, `${c.id} usageLimit(${c.usageLimit}) 应为正数`);
  }
});

test('usedLimit 为非负整数', () => {
  for (const c of ALL_COUPONS) {
    assert.ok(c.usedLimit >= 0, `${c.id} usedLimit(${c.usedLimit}) 应为非负数`);
  }
});

// ── 业务逻辑: 核销率 ──

test('核销率: cp1 (187/500) = 37%', () => {
  assert.equal(computeRedemptionRate(MOCK_COUPON_DETAILS.cp1!), 37);
});

test('核销率: cp2 (89/300) = 30%', () => {
  assert.equal(computeRedemptionRate(MOCK_COUPON_DETAILS.cp2!), 30);
});

test('核销率: cp5 (98/150) = 65%', () => {
  assert.equal(computeRedemptionRate(MOCK_COUPON_DETAILS.cp5!), 65);
});

test('核销率: cp3 (412/1000) = 41%', () => {
  assert.equal(computeRedemptionRate(MOCK_COUPON_DETAILS.cp3!), 41);
});

test('核销率: cp8 (15/400) = 4%', () => {
  assert.equal(computeRedemptionRate(MOCK_COUPON_DETAILS.cp8!), 4);
});

test('核销率: totalIssued=0 返回 0', () => {
  const zero = { ...MOCK_COUPON_DETAILS.cp1!, totalIssued: 0, usedCount: 0 };
  assert.equal(computeRedemptionRate(zero), 0);
});

test('核销率: 核销数超过发放数不会出现（已在前置测试约束）', () => {
  for (const c of ALL_COUPONS) {
    const rate = computeRedemptionRate(c);
    assert.ok(rate >= 0 && rate <= 100, `${c.id} 核销率 ${rate} 超出范围`);
  }
});

// ── 业务逻辑: 剩余可用 ──

test('剩余: cp1 = 500 - 187 = 313', () => {
  assert.equal(computeRemaining(MOCK_COUPON_DETAILS.cp1!), 313);
});

test('剩余: cp5 = 150 - 98 = 52', () => {
  assert.equal(computeRemaining(MOCK_COUPON_DETAILS.cp5!), 52);
});

test('剩余: 不会出现负数', () => {
  for (const c of ALL_COUPONS) {
    const r = computeRemaining(c);
    assert.ok(r >= 0, `${c.id} 剩余 ${r} 不应为负数`);
  }
});

// ── 业务逻辑: 状态判断 ──

test('过期判断: cp5 (validTo=2026-06-15) 已过期', () => {
  assert.equal(isExpired('2026-06-15'), true);
});

test('过期判断: cp1 (validTo=2026-07-31) 未过期', () => {
  assert.equal(isExpired('2026-07-31'), false);
});

test('过期券有且仅有 cp5 (expired 状态)', () => {
  const expired = filterByStatus(ALL_COUPONS, 'expired');
  assert.equal(expired.length, 1);
  assert.equal(expired[0]!.id, 'cp5');
});

// ── 业务逻辑: 按门店过滤 ──

test('store-1 (旗舰店) 有 3 张券', () => {
  const r = filterByStore(ALL_COUPONS, 'store-1');
  assert.equal(r.length, 3);
  assert.ok(r.every((c) => c.storeId === 'store-1'));
});

test('store-2 (社区店) 有 2 张券', () => {
  const r = filterByStore(ALL_COUPONS, 'store-2');
  assert.equal(r.length, 2);
  assert.ok(r.every((c) => c.storeId === 'store-2'));
});

test('不存在的 storeId 返回空', () => {
  const r = filterByStore(ALL_COUPONS, 'store-999');
  assert.equal(r.length, 0);
});

// ── 业务逻辑: 搜索 ──

test('搜索: 空字符串返回全部', () => {
  const r = searchCoupons(ALL_COUPONS, '', ['name']);
  assert.equal(r.length, 5);
});

test('搜索: "端午" 匹配 cp5', () => {
  const r = searchCoupons(ALL_COUPONS, '端午', ['name']);
  assert.equal(r.length, 1);
  assert.equal(r[0]!.id, 'cp5');
});

test('搜索: "8" 匹配 cp1 (8折)', () => {
  const r = searchCoupons(ALL_COUPONS, '8', ['value']);
  assert.equal(r.length, 1);
  assert.equal(r[0]!.id, 'cp1');
});

test('搜索: "社区店" 按门店搜索', () => {
  const r = searchCoupons(ALL_COUPONS, '社区店', ['storeName']);
  assert.equal(r.length, 2);
  assert.ok(r.every((c) => c.storeName.includes('社区店')));
});

test('搜索: "满" 搜索名称和门槛', () => {
  const r = searchCoupons(ALL_COUPONS, '满', ['name', 'minAmount']);
  const nameMatch = r.filter((c) => c.name.includes('满'));
  const minMatch = r.filter((c) => c.minAmount.includes('满'));
  assert.ok(nameMatch.length >= 1, 'name 匹配 "满" 的应 ≥1');
  assert.ok(minMatch.length >= 4, 'minAmount 匹配 "满" 的应 ≥4');
});

// ── 业务逻辑: 根据状态选择操作按钮 ──

test('active 券可执行 disable / delete', () => {
  const choices = getActionChoices('active');
  assert.deepEqual(choices.sort(), ['delete', 'disable']);
});

test('disabled 券可执行 enable / delete', () => {
  const choices = getActionChoices('disabled');
  assert.deepEqual(choices.sort(), ['delete', 'enable']);
});

test('expired 券仅可 delete', () => {
  const choices = getActionChoices('expired');
  assert.deepEqual(choices, ['delete']);
});

test('未知状态返回空', () => {
  const choices = getActionChoices('unknown' as CouponStatus);
  assert.deepEqual(choices, []);
});

// ── 业务逻辑: 不存在券时返回 undefined ──

test('ID "non-existent" 返回 undefined', () => {
  assert.equal(getCouponById('non-existent'), undefined);
});

test('ID "cp1" 返回正确数据', () => {
  const c = getCouponById('cp1')!;
  assert.equal(c.name, '新客首单8折');
  assert.equal(c.type, 'discount');
});

// ── 映射常量 ──

test('TYPE_LABELS: 4 个类型都有中文标签', () => {
  assert.equal(Object.keys(TYPE_LABELS).length, 4);
  for (const t of ['discount', 'cash', 'free_shipping', 'voucher'] as const) {
    assert.ok(typeof TYPE_LABELS[t] === 'string' && TYPE_LABELS[t].length > 0,
      `${t} 缺少中文标签`);
  }
});

test('STATUS_LABELS: 3 个状态都有中文标签', () => {
  assert.equal(Object.keys(STATUS_LABELS).length, 3);
  for (const s of ['active', 'expired', 'disabled'] as const) {
    assert.ok(typeof STATUS_LABELS[s] === 'string' && STATUS_LABELS[s].length > 0,
      `${s} 缺少中文标签`);
  }
});

// ── 组件导出 ──

test('CouponDetailPage 是函数组件', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function',
    'CouponDetailPage should be a function component');
});

// ── 数据切片: active vs expired vs disabled ──

test('active 券占比最高', () => {
  const active = filterByStatus(ALL_COUPONS, 'active');
  const expired = filterByStatus(ALL_COUPONS, 'expired');
  const disabled = filterByStatus(ALL_COUPONS, 'disabled');
  assert.ok(active.length > expired.length);
  assert.ok(active.length > disabled.length);
});

// ── 核销率分布 ──

test('最高核销率为 cp5 的 65%', () => {
  const rates = ALL_COUPONS.map(computeRedemptionRate);
  assert.equal(Math.max(...rates), 65);
});

test('最低核销率为 cp8 的 4%', () => {
  const rates = ALL_COUPONS.map(computeRedemptionRate);
  assert.equal(Math.min(...rates), 4);
});

// ── 边界: 所有 active 券都在有效期内 ──

test('active 券的 validTo 不在过去', () => {
  const active = filterByStatus(ALL_COUPONS, 'active');
  for (const c of active) {
    assert.ok(!isExpired(c.validTo),
      `${c.id} 状态为 active 但 validTo(${c.validTo}) 已过期`);
  }
});

test('expired 券的 validTo 已过', () => {
  const expired = filterByStatus(ALL_COUPONS, 'expired');
  for (const c of expired) {
    assert.ok(isExpired(c.validTo),
      `${c.id} 状态为 expired 但 validTo(${c.validTo}) 未过期`);
  }
});
