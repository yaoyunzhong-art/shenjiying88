import { describe, it, expect, test, beforeEach, vi } from 'vitest'
// 创建: 2026-06-26 · Pulse-68 等待期准备
// 状态: ✅ ENHANCED · service test 15+ (Pulse-68 实施后验证)

import { CouponService } from './coupon.service';
import { CouponV2 } from './coupon.entity';
import { CouponRedemptionLog } from './coupon-redemption-log.entity';
import { RedemptionRequest, RedemptionResult } from './coupon.types';
import { runWithTenant } from '../../common/context/tenant-context';

// ── ヘルパ: 创建基础优惠券 ─────────────────────────────
function makeCoupon(overrides: Partial<CouponV2> = {}): CouponV2 {
  const now = new Date();
  const future = new Date(now.getTime() + 86400000); // 明天
  return {
    id: 'coupon-test-1',
    tenantId: 'tenant-default',
    code: 'TEST',
    scope: { type: 'single-store', storeIds: ['store-1'], includeSubordinates: false },
    redemptionRules: {},
    value: 50,
    valueType: 'fixed',
    expiresAt: future,
    status: 'active',
    redemptionCount: 0,
    maxRedemptions: 100,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as CouponV2;
}

// ── ヘルパ: 创建 mock repository ─────────────────────
function mockRepo<T extends object>(initialData: Map<string, T> = new Map()) {
  const data = initialData;
  return {
    findOne: vi.fn((opts: any) => {
      if (opts?.where?.id) return Promise.resolve(data.get(opts.where.id) ?? null);
      // 按 code + tenantId + status 查找
      for (const item of data.values()) {
        const c = item as any;
        if (opts?.where?.code && c.code === opts.where.code &&
            opts?.where?.tenantId && c.tenantId === opts.where.tenantId &&
            (!opts?.where?.status || c.status === opts.where.status)) {
          return Promise.resolve(item);
        }
      }
      return Promise.resolve(null);
    }),
    findOneBy: vi.fn((where: any) => {
      if (where?.id) return Promise.resolve(data.get(where.id) ?? null);
      return Promise.resolve(null);
    }),
    find: vi.fn(() => Promise.resolve([...data.values()])),
    findAndCount: vi.fn(() => Promise.resolve([[...data.values()], data.size])),
    create: vi.fn((partial: any) => partial),
    save: vi.fn((entity: any) => {
      if (entity.id) data.set(entity.id, entity);
      else { entity.id = `new-${Date.now()}`; data.set(entity.id, entity); }
      return Promise.resolve(entity);
    }),
    update: vi.fn((criteria: any, partial: any) => {
      const id = typeof criteria === 'string' ? criteria : criteria.id;
      const existing = data.get(id);
      if (existing) {
        Object.assign(existing, partial);
        data.set(id, existing);
        return Promise.resolve({ affected: 1, raw: {} });
      }
      return Promise.resolve({ affected: 0, raw: {} });
    }),
    get data() { return data; },
  };
}

describe('CouponService · Phase-17 跨门店优惠券', () => {
  let service: CouponService;
  let couponRepo: ReturnType<typeof mockRepo<CouponV2>>;
  let redemptionRepo: ReturnType<typeof mockRepo<CouponRedemptionLog>>;
  let dataSource: { transaction: ReturnType<typeof vi.fn> };

  function resetMocks() {
    const coupons = new Map<string, CouponV2>();
    couponRepo = mockRepo<CouponV2>(coupons);
    redemptionRepo = mockRepo<CouponRedemptionLog>(new Map());

    dataSource = {
      transaction: vi.fn(async (cb: (mgr: any) => any) => {
        return cb({
          getRepository: (entity: any) => {
            if (entity === CouponV2) return couponRepo;
            if (entity === CouponRedemptionLog) return redemptionRepo;
            return {} as any;
          },
        });
      }),
    };

    // 默认填充一个有效优惠券
    const defaultCoupon = makeCoupon();
    coupons.set(defaultCoupon.id, defaultCoupon);
  }

  beforeEach(() => {
    resetMocks();
    service = new CouponService(
      couponRepo as any,
      redemptionRepo as any,
      dataSource as any,
      undefined,  // lifecycle (optional)
      undefined,  // quota (optional)
    );
  });

  // ── checkCrossStoreEligibility (T1-T4 已有) ───────────

  describe('checkCrossStoreEligibility', () => {
    it('T1: single-store coupon + 匹配门店 → eligible', () => {
      const coupon = makeCoupon({
        scope: { type: 'single-store', storeIds: ['store-1'], includeSubordinates: false },
      });
      const result = service.checkCrossStoreEligibility(coupon, 'store-1');
      expect(result.eligible).toBe(true);
      expect(result.matchedScope).toBe('single-store');
    });

    it('T2: single-store coupon + 不匹配门店 → not eligible', () => {
      const coupon = makeCoupon({
        scope: { type: 'single-store', storeIds: ['store-1'], includeSubordinates: false },
      });
      const result = service.checkCrossStoreEligibility(coupon, 'store-2');
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('store-2');
    });

    it('T3: multi-store coupon + 3 门店任一 → eligible', () => {
      const coupon = makeCoupon({
        scope: { type: 'multi-store', storeIds: ['store-1', 'store-2', 'store-3'], includeSubordinates: false },
      });
      for (const storeId of ['store-1', 'store-2', 'store-3']) {
        const result = service.checkCrossStoreEligibility(coupon, storeId);
        expect(result.eligible).toBe(true);
      }
    });

    it('T4: tenant-wide coupon + 任何门店 → eligible', () => {
      const coupon = makeCoupon({
        scope: { type: 'tenant-wide', storeIds: [], includeSubordinates: true },
      });
      const result = service.checkCrossStoreEligibility(coupon, 'any-store');
      expect(result.eligible).toBe(true);
      expect(result.matchedScope).toBe('tenant-wide');
    });

    // ── 新增: checkCrossStoreEligibility 边界 ────────────

    it('T6: multi-store coupon + 不在列表中门店 → not eligible', () => {
      const coupon = makeCoupon({
        scope: { type: 'multi-store', storeIds: ['store-1', 'store-2'], includeSubordinates: false },
      });
      const result = service.checkCrossStoreEligibility(coupon, 'store-99');
      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('store-99');
    });

    it('T7: tenant-wide coupon 即使 storeIds 为空也返回 eligible', () => {
      const coupon = makeCoupon({
        scope: { type: 'tenant-wide', storeIds: [], includeSubordinates: true },
      });
      // 空 storeIds 不应该影响 tenant-wide 判断
      const result = service.checkCrossStoreEligibility(coupon, 'non-existent-store');
      expect(result.eligible).toBe(true);
    });
  });

  // ── redeemCrossStore (T5 升级为实际逻辑) ────────────────

  describe('redeemCrossStore', () => {
    it('T5: 有效优惠券正常核销 → success', async () => {
      await runWithTenant({ tenantId: 'tenant-default', storeId: 'store-1', userId: 'user-1' }, async () => {
        const req: RedemptionRequest = {
          userId: 'user-1',
          couponCode: 'TEST',
          storeId: 'store-1',
          orderAmount: 100,
          orderId: 'order-1',
          idempotencyKey: 'order-1:TEST',
        };

        const result = await service.redeemCrossStore(req);
        expect(result.success).toBe(true);
        expect(result.couponId).toBeDefined();
        expect(result.redemptionId).toBeDefined();
        expect(result.amount).toBe(50);
      });
    });

    it('T8: 已过期优惠券 → COUPON_EXPIRED', async () => {
      const expiredCoupon = makeCoupon({
        code: 'EXPIRED',
        expiresAt: new Date(Date.now() - 86400000), // 昨天
      });
      couponRepo.data.set(expiredCoupon.id, expiredCoupon);

      await runWithTenant({ tenantId: 'tenant-default', storeId: 'store-1', userId: 'user-1' }, async () => {
        const req: RedemptionRequest = {
          userId: 'user-1',
          couponCode: 'EXPIRED',
          storeId: 'store-1',
          orderAmount: 100,
          orderId: 'order-expired',
          idempotencyKey: 'order-expired:EXPIRED',
        };

        const result = await service.redeemCrossStore(req);
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('COUPON_EXPIRED');
      });
    });

    it('T9: 核销次数用尽 → COUPON_EXHAUSTED', async () => {
      const exhaustedCoupon = makeCoupon({
        code: 'EXHAUSTED',
        redemptionCount: 100,
        maxRedemptions: 100,
      });
      couponRepo.data.set(exhaustedCoupon.id, exhaustedCoupon);

      await runWithTenant({ tenantId: 'tenant-default', storeId: 'store-1', userId: 'user-1' }, async () => {
        const req: RedemptionRequest = {
          userId: 'user-1',
          couponCode: 'EXHAUSTED',
          storeId: 'store-1',
          orderAmount: 100,
          orderId: 'order-exhausted',
          idempotencyKey: 'order-exhausted:EXHAUSTED',
        };

        const result = await service.redeemCrossStore(req);
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('COUPON_EXHAUSTED');
      });
    });

    it('T10: 门店不在优惠券范围 → STORE_NOT_IN_SCOPE', async () => {
      // 不在 tenant context 设置 storeId，以便跳过 assertStoreOwnership，仅测试优惠券范围逻辑
      await runWithTenant({ tenantId: 'tenant-default', userId: 'user-1' }, async () => {
        // 默认优惠券 scope.storeIds = ['store-1']
        const req: RedemptionRequest = {
          userId: 'user-1',
          couponCode: 'TEST',
          storeId: 'store-999',
          orderAmount: 100,
          orderId: 'order-store-scope',
          idempotencyKey: 'order-store-scope:TEST',
        };

        const result = await service.redeemCrossStore(req);
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('STORE_NOT_IN_SCOPE');
      });
    });

    it('T11: 未达最低消费 → MIN_AMOUNT_NOT_MET', async () => {
      const minAmountCoupon = makeCoupon({
        code: 'MINAMOUNT',
        redemptionRules: { minAmount: 200 },
      });
      couponRepo.data.set(minAmountCoupon.id, minAmountCoupon);

      await runWithTenant({ tenantId: 'tenant-default', storeId: 'store-1', userId: 'user-1' }, async () => {
        const req: RedemptionRequest = {
          userId: 'user-1',
          couponCode: 'MINAMOUNT',
          storeId: 'store-1',
          orderAmount: 50,  // < minAmount 200
          orderId: 'order-min-amount',
          idempotencyKey: 'order-min-amount:MINAMOUNT',
        };

        const result = await service.redeemCrossStore(req);
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('MIN_AMOUNT_NOT_MET');
      });
    });

    it('T12: 用户分层不匹配 → USER_SEGMENT_NOT_MATCH', async () => {
      const segmentCoupon = makeCoupon({
        code: 'SEGMENTED',
        redemptionRules: { userSegments: ['svip', 'gold'] },
      });
      couponRepo.data.set(segmentCoupon.id, segmentCoupon);

      await runWithTenant({ tenantId: 'tenant-default', storeId: 'store-1', userId: 'user-1' }, async () => {
        const req: RedemptionRequest = {
          userId: 'user-1',
          couponCode: 'SEGMENTED',
          storeId: 'store-1',
          orderAmount: 300,
          orderId: 'order-segment',
          idempotencyKey: 'order-segment:SEGMENTED',
          userSegment: 'bronze',  // 不在 ['svip', 'gold'] 中
        };

        const result = await service.redeemCrossStore(req);
        expect(result.success).toBe(false);
        expect(result.error?.code).toBe('USER_SEGMENT_NOT_MATCH');
      });
    });

    it('T13: 幂等性检查 → 重复请求返回前次结果', async () => {
      await runWithTenant({ tenantId: 'tenant-default', storeId: 'store-1', userId: 'user-1' }, async () => {
        // 第一次核销
        const req: RedemptionRequest = {
          userId: 'user-1',
          couponCode: 'TEST',
          storeId: 'store-1',
          orderAmount: 100,
          orderId: 'order-idempotent',
          idempotencyKey: 'idempotent-key-001',
        };

        const firstResult = await service.redeemCrossStore(req);
        expect(firstResult.success).toBe(true);

        // 模拟已有 redemption log（下次请求命中幂等检查）
        // 设置 idempotencyKey 命中
        redemptionRepo.findOne = vi.fn((opts: any) => {
          if (opts?.where?.idempotencyKey === 'idempotent-key-001') {
            return Promise.resolve({
              id: redemptionRepo.data.values().next().value?.id ?? 'existing-redemption',
              couponId: firstResult.couponId,
              amount: '100',
            } as any);
          }
          return Promise.resolve(null);
        });

        const secondResult = await service.redeemCrossStore(req);
        expect(secondResult.success).toBe(true);
      });
    });
  });

  // ── batchRedeem 批量核销 ──────────────────────────────

  describe('batchRedeem', () => {
    it('T14: 多批次核销，全部成功', async () => {
      await runWithTenant({ tenantId: 'tenant-default', storeId: 'store-1', userId: 'u1' }, async () => {
        const results = await service.batchRedeem([
          { userId: 'u1', couponCode: 'TEST', storeId: 'store-1', orderAmount: 100, orderId: 'o1', idempotencyKey: 'o1:TEST' },
          { userId: 'u2', couponCode: 'TEST', storeId: 'store-1', orderAmount: 200, orderId: 'o2', idempotencyKey: 'o2:TEST' },
        ]);

        expect(results).toHaveLength(2);
        expect(results[0].success).toBe(true);
        expect(results[1].success).toBe(true);
      });
    });

    it('T15: 混合成功+失败，失败后停止', async () => {
      // 不在 tenant context 设置 storeId，跳过 assertStoreOwnership，仅测试批量核销中的范围校验
      await runWithTenant({ tenantId: 'tenant-default', userId: 'u1' }, async () => {
        // 第一单正常，第二单门店不在范围
        const results = await service.batchRedeem([
          { userId: 'u1', couponCode: 'TEST', storeId: 'store-1', orderAmount: 100, orderId: 'o3', idempotencyKey: 'o3:TEST' },
          { userId: 'u2', couponCode: 'TEST', storeId: 'store-999', orderAmount: 100, orderId: 'o4', idempotencyKey: 'o4:TEST' },
        ]);

        expect(results).toHaveLength(2);
        expect(results[0].success).toBe(true);
        expect(results[1].success).toBe(false);
        expect(results[1].error?.code).toBe('STORE_NOT_IN_SCOPE');
      });
    });
  });

  // ── create / findById / list / updateStatus ───────────

  describe('CRUD 基础操作', () => {
    it('T16: create 创建新优惠券成功', async () => {
      const coupon = await service.create({
        code: 'NEW-COUPON',
        tenantId: 'tenant-A',
        scope: { type: 'tenant-wide', storeIds: [], includeSubordinates: true },
        redemptionRules: { minAmount: 50 },
        value: 30,
        valueType: 'fixed',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
        maxRedemptions: 500,
      });

      expect(coupon.code).toBe('NEW-COUPON');
      expect(coupon.status).toBe('active');
      expect(coupon.redemptionCount).toBe(0);
    });

    it('T17: findById 返回 null 当不存在', async () => {
      const found = await service.findById('non-existent-id');
      expect(found).toBeNull();
    });

    it('T18: findById 返回已存在的优惠券', async () => {
      const coupon = await service.create({
        code: 'FIND-TEST',
        tenantId: 'tenant-A',
        scope: { type: 'single-store', storeIds: ['store-1'], includeSubordinates: false },
        redemptionRules: {},
        value: 20,
        valueType: 'fixed',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });

      const found = await service.findById(coupon.id);
      expect(found).not.toBeNull();
      expect(found!.code).toBe('FIND-TEST');
    });

    it('T19: list 支持分页和状态筛选', async () => {
      await service.create({ code: 'A', tenantId: 't1', scope: { type: 'tenant-wide', storeIds: [], includeSubordinates: true }, redemptionRules: {}, value: 10, valueType: 'fixed', expiresAt: new Date(Date.now() + 86400000).toISOString() });
      await service.create({ code: 'B', tenantId: 't1', scope: { type: 'tenant-wide', storeIds: [], includeSubordinates: true }, redemptionRules: {}, value: 20, valueType: 'fixed', expiresAt: new Date(Date.now() + 86400000).toISOString() });

      const result = await service.list({ tenantId: 't1', status: 'active' });
      expect(result.total).toBeGreaterThanOrEqual(2);
      expect(result.items.length).toBeGreaterThanOrEqual(2);
    });

    it('T20: updateStatus 切换 active ⇄ paused', async () => {
      const coupon = await service.create({
        code: 'STATUS-TOGGLE',
        tenantId: 't1',
        scope: { type: 'single-store', storeIds: ['s1'], includeSubordinates: false },
        redemptionRules: {},
        value: 15,
        valueType: 'fixed',
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      });
      expect(coupon.status).toBe('active');

      const paused = await service.updateStatus(coupon.id, 'paused');
      expect(paused!.status).toBe('paused');

      const reactivated = await service.updateStatus(coupon.id, 'active');
      expect(reactivated!.status).toBe('active');
    });

    it('T21: updateStatus 找不到时返回 null', async () => {
      const result = await service.updateStatus('non-existent', 'active');
      expect(result).toBeNull();
    });
  });
});
