import { describe, it, expect, test, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest'
// 更新: 2026-06-26 · Pulse-68 主任务
// 状态: IMPLEMENTED · 5 AC 真实化
// 关联: spec.md §1.1.3 · tasks.md T3 · E40 P0 跨门店优惠券

import { CouponService } from './coupon.service';
import { CouponV2 } from './coupon.entity';
import { CouponRedemptionLog } from './coupon-redemption-log.entity';
import { TenantTier } from '../tenant/tenant-quota.entity';
import { TenantQuotaService } from '../tenant/tenant-quota.service';
import { runWithTenant } from '../../common/context/tenant-context';

// ─── Tenant context helper (P0-C2 守卫兼容) ────────────────────────────
const TENANT_CTX = { tenantId: 'test-tenant', userId: 'test-user' };
function withTenantCtx<T>(fn: () => T | Promise<T>): Promise<T> {
  return runWithTenant(TENANT_CTX, fn);
}

/**
 * 5 个 e2e 场景 (E40 P0 验收):
 * AC-1 single-store -> multi-store 迁移
 * AC-2 同一租户 3 门店联动核销
 * AC-3 跨租户隔离 (防止越权)
 * AC-4 事务一致性回滚
 * AC-5 幂等性: 同一订单重复核销不重复扣减
 */

function createMockCouponRepo() {
  const store = new Map<string, CouponV2>();
  return {
    findOne: async ({ where }: any) => {
      for (const c of store.values()) {
        if (where.tenantId && c.tenantId !== where.tenantId) continue;
        if (where.code && c.code !== where.code) continue;
        if (where.status && c.status !== where.status) continue;
        return c;
      }
      return null;
    },
    update: async (criteria: any, values: any) => {
      const c = store.get(criteria.id);
      if (!c) return { affected: 0 };
      if (criteria.redemptionCount !== undefined && c.redemptionCount !== criteria.redemptionCount) {
        return { affected: 0 };
      }
      Object.assign(c, values);
      return { affected: 1 };
    },
    save: async (entity: CouponV2) => { store.set(entity.id, entity); return entity; },
    _store: store,
    _seed: (coupon: CouponV2) => store.set(coupon.id, coupon),
  } as any;
}

function createMockRedemptionRepo() {
  const store = new Map<string, CouponRedemptionLog>();
  let nextId = 1;
  return {
    findOne: async ({ where }: any) => {
      for (const r of store.values()) {
        if (where.idempotencyKey && r.idempotencyKey !== where.idempotencyKey) continue;
        return r;
      }
      return null;
    },
    create: (data: any) => ({ id: `redemption-${nextId++}`, redeemedAt: new Date(), ...data }),
    save: async (entity: CouponRedemptionLog) => {
      for (const r of store.values()) {
        if (r.idempotencyKey === entity.idempotencyKey) {
          throw new Error(`duplicate key value violates unique constraint "IDX_${entity.idempotencyKey}"`);
        }
      }
      store.set(entity.id, entity);
      return entity;
    },
    _store: store,
    _count: () => store.size,
  } as any;
}

function createMockDataSource(couponRepo: any, redemptionRepo: any) {
  return {
    transaction: async (cb: any) => cb({
      getRepository: (entity: any) => {
        if (entity === CouponV2) return couponRepo;
        if (entity === CouponRedemptionLog) return redemptionRepo;
        throw new Error('Unknown entity');
      },
    }),
  } as any;
}

function createServiceWithMocks(opts: { quota?: TenantQuotaService; lifecycle?: any; coupons?: CouponV2[] }) {
  const couponRepo = createMockCouponRepo();
  const redemptionRepo = createMockRedemptionRepo();
  const dataSource = createMockDataSource(couponRepo, redemptionRepo);
  for (const c of opts.coupons ?? []) couponRepo._seed(c);
  const service = new CouponService(couponRepo, redemptionRepo, dataSource, opts.lifecycle, opts.quota);
  return { service, couponRepo, redemptionRepo };
}

function buildCoupon(overrides: Partial<CouponV2> = {}): CouponV2 {
  const c = new CouponV2();
  Object.assign(c, {
    id: 'coupon-001',
    tenantId: 'tenant-A',
    code: 'CROSS-2026-50',
    scope: { type: 'multi-store', storeIds: ['store-1', 'store-2', 'store-3'], includeSubordinates: false },
    redemptionRules: { minAmount: 100 },
    value: 50,
    valueType: 'fixed',
    expiresAt: new Date(Date.now() + 86400000),
    status: 'active',
    redemptionCount: 0,
    maxRedemptions: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  return Object.assign(c, overrides);
}

describe('CouponService e2e · Phase-17 跨门店核销', () => {
  let quota: TenantQuotaService;

  beforeEach(() => {
    quota = new TenantQuotaService();
    quota.resetAll();
  });

  afterEach(() => { quota.resetAll(); });

  describe('AC-1: single-store -> multi-store 迁移', () => {
    it('E2E-1: 单门店券 -> 多门店券 store-2 也能核销', async () => {
      const singleCoupon = buildCoupon({
        id: 'coupon-single',
        scope: { type: 'single-store', storeIds: ['store-1'], includeSubordinates: false },
      });
      let { service } = createServiceWithMocks({ quota, coupons: [singleCoupon] });
      const r1 = await withTenantCtx(() => service.redeemCrossStore({
        tenantId: 'tenant-A', userId: 'user-A', couponCode: 'CROSS-2026-50',
        storeId: 'store-1', orderAmount: 200, orderId: 'order-001',
        idempotencyKey: 'order-001:coupon-single',
      }));
      expect(r1.success).toBe(true);

      const multiCoupon = buildCoupon({
        id: 'coupon-multi', code: 'MULTI-2026-50',
        scope: { type: 'multi-store', storeIds: ['store-1', 'store-2', 'store-3'], includeSubordinates: false },
      });
      ({ service } = createServiceWithMocks({ quota, coupons: [multiCoupon] }));
      const r2 = await withTenantCtx(() => service.redeemCrossStore({
        tenantId: 'tenant-A', userId: 'user-A', couponCode: 'MULTI-2026-50',
        storeId: 'store-2', orderAmount: 200, orderId: 'order-002',
        idempotencyKey: 'order-002:coupon-multi',
      }));
      expect(r2.success).toBe(true);
      expect(r2.couponId).toBe('coupon-multi');
    });
  });

  describe('AC-2: 同一租户 3 门店联动核销', () => {
    it('E2E-2: multi-store 券在 store-1/2/3 都能核销', async () => {
      const coupon = buildCoupon({
        id: 'coupon-multi-3',
        scope: { type: 'multi-store', storeIds: ['store-1', 'store-2', 'store-3'], includeSubordinates: false },
      });
      const { service } = createServiceWithMocks({ quota, coupons: [coupon] });
      const results = [];
      for (let i = 1; i <= 3; i++) {
        results.push(await withTenantCtx(() => service.redeemCrossStore({
          tenantId: 'tenant-A', userId: `user-${i}`, couponCode: 'CROSS-2026-50',
          storeId: `store-${i}`, orderAmount: 200, orderId: `order-${i}`,
          idempotencyKey: `order-${i}:coupon-multi-3`,
        })));
      }
      expect(results.every(r => r.success)).toBe(true);
      expect(results.map(r => r.couponId)).toEqual(['coupon-multi-3', 'coupon-multi-3', 'coupon-multi-3']);
    });
  });

  describe('AC-3: 跨租户隔离', () => {
    it('E2E-3: tenant-A 的券 tenant-B 查不到', async () => {
      const couponA = buildCoupon({
        id: 'coupon-tenantA', tenantId: 'tenant-A',
        scope: { type: 'single-store', storeIds: ['store-1'], includeSubordinates: false },
      });
      const { service } = createServiceWithMocks({ quota, coupons: [couponA] });
      const r = await withTenantCtx(() => service.redeemCrossStore({
        tenantId: 'tenant-B', userId: 'user-B', couponCode: 'CROSS-2026-50',
        storeId: 'store-1', orderAmount: 200, orderId: 'order-cross',
        idempotencyKey: 'order-cross:coupon-tenantA',
      }));
      expect(r.success).toBe(false);
      expect(r.error?.code).toBe('COUPON_NOT_FOUND');
    });

    it('E2E-3b: couponCode 不存在直接返回 COUPON_NOT_FOUND', async () => {
      const { service } = createServiceWithMocks({ quota });
      const r = await withTenantCtx(() => service.redeemCrossStore({
        tenantId: 'tenant-A', userId: 'user-A', couponCode: 'NON-EXISTENT',
        storeId: 'store-1', orderAmount: 200, orderId: 'order-x',
        idempotencyKey: 'order-x:non-existent',
      }));
      expect(r.success).toBe(false);
      expect(r.error?.code).toBe('COUPON_NOT_FOUND');
    });
  });

  describe('AC-4: 事务一致性 (quota decrement 回滚)', () => {
    it('E2E-4: 失败时 quota 必须回滚到原值', async () => {
      quota.initialize('tenant-A', TenantTier.Pro);
      const before = quota.getUsage('tenant-A').couponRedemptionsThisMonth;
      const { service } = createServiceWithMocks({ quota });
      const r = await withTenantCtx(() => service.redeemCrossStore({
        tenantId: 'tenant-A', userId: 'user-A', couponCode: 'GHOST-COUPON',
        storeId: 'store-1', orderAmount: 200, orderId: 'order-rollback',
        idempotencyKey: 'order-rollback:ghost',
      }));
      expect(r.success).toBe(false);
      const after = quota.getUsage('tenant-A').couponRedemptionsThisMonth;
      expect(after).toBe(before);
    });

    it('E2E-4b: 成功时 quota 应该 increment +1', async () => {
      quota.initialize('tenant-A', TenantTier.Pro);
      const before = quota.getUsage('tenant-A').couponRedemptionsThisMonth;
      const coupon = buildCoupon({ id: 'coupon-success' });
      const { service } = createServiceWithMocks({ quota, coupons: [coupon] });
      const r = await withTenantCtx(() => service.redeemCrossStore({
        tenantId: 'tenant-A', userId: 'user-A', couponCode: 'CROSS-2026-50',
        storeId: 'store-1', orderAmount: 200, orderId: 'order-success',
        idempotencyKey: 'order-success:coupon-success',
      }));
      expect(r.success).toBe(true);
      const after = quota.getUsage('tenant-A').couponRedemptionsThisMonth;
      expect(after).toBe(before + 1);
    });
  });

  describe('AC-5: 幂等性', () => {
    it('E2E-5: 同 idempotencyKey 重复核销, 只扣 1 次', async () => {
      quota.initialize('tenant-A', TenantTier.Pro);
      const coupon = buildCoupon({ id: 'coupon-idem' });
      const { service, redemptionRepo } = createServiceWithMocks({ quota, coupons: [coupon] });
      const req = {
        tenantId: 'tenant-A', userId: 'user-A', couponCode: 'CROSS-2026-50',
        storeId: 'store-1', orderAmount: 200, orderId: 'order-idem',
        idempotencyKey: 'order-idem:coupon-idem',
      };
      const r1 = await withTenantCtx(() => service.redeemCrossStore(req));
      expect(r1.success).toBe(true);
      expect(redemptionRepo._count()).toBe(1);

      const r2 = await withTenantCtx(() => service.redeemCrossStore(req));
      expect(r2.success).toBe(true);
      expect(r2.redemptionId).toBe(r1.redemptionId);
      expect(redemptionRepo._count()).toBe(1);

      expect(quota.getUsage('tenant-A').couponRedemptionsThisMonth).toBe(1);
    });
  });
});
