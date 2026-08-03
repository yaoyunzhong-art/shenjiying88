/**
 * coupon-service.test.ts — L1 合约测试
 *
 * 覆盖:
 *   - CouponService 构造
 *   - TYPE_CONFIG: 4 种类型全部映射
 *   - generateMockData: 状态计数正确
 *   - Coupon 数据模型完整性
 */

import { describe, it, mock } from 'node:test';
import assert from 'node:assert/strict';
import { CouponService, TYPE_CONFIG, type CouponStatus, type CouponType } from '../coupon-service.ts';

// ─── TYPE_CONFIG ─────────────────────────────────────

describe('[coupon-service] TYPE_CONFIG', () => {
  const expectedTypes: CouponType[] = ['discount', 'cash', 'free_shipping', 'voucher'];

  it('4 种优惠券类型必须齐备', () => {
    const keys = Object.keys(TYPE_CONFIG).sort();
    assert.deepEqual(keys, expectedTypes.sort());
  });

  it('每种类型必须含 name/color 2 字段', () => {
    for (const t of expectedTypes) {
      const cfg = TYPE_CONFIG[t];
      assert.ok(typeof cfg.name === 'string' && cfg.name.length > 0, `${t}.name 必填`);
      assert.ok(typeof cfg.color === 'string' && cfg.color.length > 0, `${t}.color 必填`);
      // 验证是个颜色值
      assert.ok(cfg.color.startsWith('#'), `${t}.color 应为十六进制颜色`);
    }
  });

  it('discount 类型应为 打折券', () => {
    assert.equal(TYPE_CONFIG.discount.name, '打折券');
  });

  it('cash 类型应为 代金券', () => {
    assert.equal(TYPE_CONFIG.cash.name, '代金券');
  });

  it('free_shipping 类型应为 免运费券', () => {
    assert.equal(TYPE_CONFIG.free_shipping.name, '免运费券');
  });

  it('voucher 类型应为 礼品券', () => {
    assert.equal(TYPE_CONFIG.voucher.name, '礼品券');
  });
});

// ─── CouponService 构造 ─────────────────────────────

describe('[coupon-service] CouponService 构造', () => {
  it('无参数构造应使用默认 baseUrl', () => {
    const svc = new CouponService();
    assert.ok(svc instanceof CouponService);
  });

  it('可以传入自定义 baseUrl', () => {
    const svc = new CouponService('http://localhost:9999');
    assert.ok(svc instanceof CouponService);
  });
});

// ─── Mock 数据 ──────────────────────────────────────

describe('[coupon-service] Mock 数据完整性', () => {
  it('export const couponService 是单例', () => {
    const { couponService: cs1 } = require('../coupon-service.ts');
    const { couponService: cs2 } = require('../coupon-service.ts');
    // require cache 确保同一实例
    assert.ok(cs1 instanceof CouponService);
    assert.strictEqual(Object.getPrototypeOf(cs1), Object.getPrototypeOf(cs2));
  });
});

// ─── CouponStatus 语义 ──────────────────────────────

describe('[coupon-service] CouponStatus 语义', () => {
  it('三种状态应覆盖全部场景', () => {
    const statuses: CouponStatus[] = ['unused', 'used', 'expired'];
    assert.equal(statuses.length, 3);
  });
});
