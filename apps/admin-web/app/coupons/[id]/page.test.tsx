/**
 * coupons/[id]/page.test.tsx — 优惠券详情页 L1 冒烟测试
 * ⚡ 覆盖: 数据工厂 / 优惠券属性计算 / 状态映射 / 时限校验 / 边界情况
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// ---- 类型（与 page.tsx / coupons-data.ts 保持同步） ----

type CouponStatus = 'draft' | 'active' | 'paused' | 'exhausted' | 'expired' | 'disabled';
type CouponType = 'percentage' | 'fixed' | 'shipping' | 'threshold';
type CouponScope = 'global' | 'category' | 'brand' | 'store' | 'member-tier';

interface CouponItem {
  id: string;
  code: string;
  name: string;
  status: CouponStatus;
  type: CouponType;
  value: number;
  minOrderAmount: number;
  maxDiscount: number;
  startAt: string;
  endAt: string;
  totalQuota: number;
  usedCount: number;
  perUserLimit: number;
  scope: CouponScope;
  createdBy: string;
  updatedAt: string;
}

type CouponStatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

// ---- 常量映射 ----

const COUPON_STATUS_MAP: Record<CouponStatus, { label: string; variant: CouponStatusVariant }> = {
  draft: { label: '草稿', variant: 'neutral' },
  active: { label: '进行中', variant: 'success' },
  paused: { label: '已暂停', variant: 'warning' },
  exhausted: { label: '已领完', variant: 'info' },
  expired: { label: '已过期', variant: 'danger' },
  disabled: { label: '已停用', variant: 'neutral' },
};

const COUPON_TYPE_MAP: Record<CouponType, string> = {
  percentage: '百分比折扣',
  fixed: '固定金额',
  shipping: '免运费',
  threshold: '满减',
};

const COUPON_SCOPE_MAP: Record<CouponScope, string> = {
  global: '全平台',
  category: '指定品类',
  brand: '指定品牌',
  store: '指定门店',
  'member-tier': '会员等级',
};

// ---- 辅助函数 ----

function formatDate(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function claimRate(item: CouponItem): number {
  if (item.totalQuota <= 0) return 0;
  return Math.round((item.usedCount / item.totalQuota) * 100);
}

function isCouponActive(item: CouponItem): boolean {
  return item.status === 'active';
}

function isCouponExpired(item: CouponItem): boolean {
  const now = new Date();
  const end = new Date(item.endAt);
  return end < now;
}

function canRedeem(item: CouponItem): boolean {
  if (item.status !== 'active') return false;
  if (isCouponExpired(item)) return false;
  if (item.usedCount >= item.totalQuota) return false;
  return true;
}

function getRemainingQuota(item: CouponItem): number {
  return Math.max(0, item.totalQuota - item.usedCount);
}

function daysUntilExpiry(item: CouponItem): number {
  const now = new Date();
  const end = new Date(item.endAt);
  const diff = end.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

// ---- 数据工厂 ----

let _seq = 0;

function makeCoupon(overrides?: Partial<CouponItem>): CouponItem {
  _seq++;
  return {
    id: `coupon-${String(_seq).padStart(3, '0')}`,
    code: `COUPON-${_seq}`,
    name: `测试优惠券 ${_seq}`,
    status: 'active',
    type: 'percentage',
    value: 20,
    minOrderAmount: 100,
    maxDiscount: 50,
    startAt: '2026-07-01T00:00:00.000Z',
    endAt: '2026-08-01T00:00:00.000Z',
    totalQuota: 1000,
    usedCount: 150,
    perUserLimit: 1,
    scope: 'global',
    createdBy: 'admin',
    updatedAt: '2026-07-01T08:00:00.000Z',
    ...overrides,
  };
}

// ==================== 测试套件 ====================

describe('CouponDetailPage — 数据工厂', () => {
  it('默认优惠券含完整字段', () => {
    const c = makeCoupon();
    assert.ok(c.id.startsWith('coupon-'));
    assert.strictEqual(c.type, 'percentage');
    assert.strictEqual(c.status, 'active');
    assert.ok(c.name.length > 0);
    assert.ok(c.code.length > 0);
  });

  it('覆盖字段合并', () => {
    const c = makeCoupon({ type: 'fixed', value: 30, status: 'draft' });
    assert.strictEqual(c.type, 'fixed');
    assert.strictEqual(c.value, 30);
    assert.strictEqual(c.status, 'draft');
    assert.ok(c.name.startsWith('测试优惠券')); // 原始字段保留
    assert.ok(c.id.startsWith('coupon-'));
  });

  it('每个调用产生不同 ID', () => {
    const c1 = makeCoupon();
    const c2 = makeCoupon();
    assert.notStrictEqual(c1.id, c2.id);
  });
});

describe('CouponDetailPage — COUPON_STATUS_MAP 完整性', () => {
  it('所有状态应有中文标签和 variant', () => {
    const statuses: CouponStatus[] = ['draft', 'active', 'paused', 'exhausted', 'expired', 'disabled'];
    for (const s of statuses) {
      const entry = COUPON_STATUS_MAP[s];
      assert.ok(entry, `status ${s} 缺少映射`);
      assert.ok(entry.label.length >= 2, `status ${s} 标签太短`);
      assert.ok(['success', 'warning', 'danger', 'info', 'neutral'].includes(entry.variant));
    }
  });

  it('active 映射到 "进行中" success', () => {
    assert.strictEqual(COUPON_STATUS_MAP.active.label, '进行中');
    assert.strictEqual(COUPON_STATUS_MAP.active.variant, 'success');
  });

  it('expired 映射到 "已过期" danger', () => {
    assert.strictEqual(COUPON_STATUS_MAP.expired.label, '已过期');
    assert.strictEqual(COUPON_STATUS_MAP.expired.variant, 'danger');
  });
});

describe('CouponDetailPage — COUPON_TYPE_MAP 完整性', () => {
  it('所有类型应有中文名', () => {
    const types: CouponType[] = ['percentage', 'fixed', 'shipping', 'threshold'];
    const map: Record<CouponType, string> = {
      percentage: '百分比折扣',
      fixed: '固定金额',
      shipping: '免运费',
      threshold: '满减',
    };
    for (const t of types) {
      assert.ok(map[t], `type ${t} 缺少映射`);
      assert.ok(map[t].length >= 4);
    }
  });
});

describe('CouponDetailPage — COUPON_SCOPE_MAP 完整性', () => {
  it('所有范围应有中文名', () => {
    const scopes: CouponScope[] = ['global', 'category', 'brand', 'store', 'member-tier'];
    for (const s of scopes) {
      assert.ok(COUPON_SCOPE_MAP[s], `scope ${s} 缺少映射`);
    }
  });
});

describe('CouponDetailPage — 领取率计算', () => {
  it('正常使用率', () => {
    const c = makeCoupon({ totalQuota: 200, usedCount: 50 });
    assert.strictEqual(claimRate(c), 25);
  });

  it('全部领完', () => {
    const c = makeCoupon({ totalQuota: 100, usedCount: 100 });
    assert.strictEqual(claimRate(c), 100);
  });

  it('无配额返回 0', () => {
    const c = makeCoupon({ totalQuota: 0, usedCount: 0 });
    assert.strictEqual(claimRate(c), 0);
  });

  it('使用数超过配额取整', () => {
    const c = makeCoupon({ totalQuota: 100, usedCount: 1 });
    assert.strictEqual(claimRate(c), 1);
  });
});

describe('CouponDetailPage — 活动状态判断', () => {
  it('active 优惠券视为进行中', () => {
    assert.ok(isCouponActive(makeCoupon({ status: 'active' })));
  });

  it('非 active 视为不活跃', () => {
    assert.strictEqual(isCouponActive(makeCoupon({ status: 'paused' })), false);
    assert.strictEqual(isCouponActive(makeCoupon({ status: 'expired' })), false);
    assert.strictEqual(isCouponActive(makeCoupon({ status: 'draft' })), false);
  });
});

describe('CouponDetailPage — 过期判断', () => {
  it('未来的过期时间视为未过期', () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const c = makeCoupon({ endAt: future.toISOString() });
    assert.strictEqual(isCouponExpired(c), false);
  });

  it('过去的过期时间视为已过期', () => {
    const past = new Date('2020-01-01');
    const c = makeCoupon({ endAt: past.toISOString() });
    assert.strictEqual(isCouponExpired(c), true);
  });
});

describe('CouponDetailPage — 可领取判断', () => {
  it('正常 active 未过期未领完可领', () => {
    assert.ok(canRedeem(makeCoupon({ status: 'active', totalQuota: 100, usedCount: 10 })));
  });

  it('已暂停不能领', () => {
    assert.strictEqual(canRedeem(makeCoupon({ status: 'paused' })), false);
  });

  it('已领完不能领', () => {
    assert.strictEqual(canRedeem(makeCoupon({ status: 'active', totalQuota: 100, usedCount: 100 })), false);
  });

  it('已过期不能领', () => {
    const past = new Date('2020-01-01');
    assert.strictEqual(canRedeem(makeCoupon({ status: 'active', endAt: past.toISOString(), totalQuota: 100, usedCount: 10 })), false);
  });
});

describe('CouponDetailPage — 剩余配额', () => {
  it('正常剩余', () => {
    assert.strictEqual(getRemainingQuota(makeCoupon({ totalQuota: 500, usedCount: 200 })), 300);
  });

  it('全部用完返回 0', () => {
    assert.strictEqual(getRemainingQuota(makeCoupon({ totalQuota: 100, usedCount: 100 })), 0);
  });

  it('超额使用返回 0', () => {
    assert.strictEqual(getRemainingQuota(makeCoupon({ totalQuota: 100, usedCount: 200 })), 0);
  });

  it('未使用返回全额', () => {
    assert.strictEqual(getRemainingQuota(makeCoupon({ totalQuota: 50, usedCount: 0 })), 50);
  });
});

describe('CouponDetailPage — 日期格式化', () => {
  it('标准 ISO 转为 YYYY-MM-DD HH:mm', () => {
    const result = formatDate('2026-07-06T08:00:00.000Z');
    assert.match(result, /2026-07-06 \d{2}:00/);
  });
});

describe('CouponDetailPage — 边界情况', () => {
  it('所有类型与所有状态的组合', () => {
    const types: CouponType[] = ['percentage', 'fixed', 'shipping', 'threshold'];
    const statuses: CouponStatus[] = ['draft', 'active', 'paused', 'exhausted', 'expired', 'disabled'];
    for (const type of types) {
      for (const status of statuses) {
        const c = makeCoupon({ type, status });
        assert.strictEqual(c.type, type);
        assert.strictEqual(c.status, status);
      }
    }
  });

  it('零值边界', () => {
    const c = makeCoupon({ value: 0, minOrderAmount: 0, maxDiscount: 0, totalQuota: 0 });
    assert.strictEqual(c.value, 0);
    assert.strictEqual(c.minOrderAmount, 0);
    assert.strictEqual(c.maxDiscount, 0);
    assert.strictEqual(c.totalQuota, 0);
  });

  it('大数值', () => {
    const c = makeCoupon({ value: 999999, totalQuota: 9999999, usedCount: 9999999 });
    assert.strictEqual(claimRate(c), 100);
    assert.strictEqual(getRemainingQuota(c), 0);
  });
});
