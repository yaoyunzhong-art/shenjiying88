/**
 * coupon-cleanup.service.test.ts · P-48 联名券过期清理 cron
 *
 * 验证 CouponCleanupService.scanExpiredCoupons 核心逻辑:
 *   正例: 有5张过期券→全部clean up
 *   反例: 无过期券→清理0张
 *   边界: 空store→不抛出异常
 *
 * 设计原则: 不依赖数据库,使用模拟 Repository
 * 参考: coupon-ringbeam.test.ts mock 模式 (内存store + vi.fn)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Repository } from 'typeorm';
import { CouponV2 } from './coupon.entity';
import { CouponCleanupService } from './coupon-cleanup.service';

// ─── Helpers ─────────────────────────────────────────────────────────────

function makeCoupon(overrides: Partial<CouponV2> = {}): CouponV2 {
  const now = Date.now();
  return {
    id: overrides.id ?? crypto.randomUUID(),
    tenantId: 'test-tenant',
    code: overrides.code ?? 'TEST-001',
    scope: {
      type: 'single-store',
      storeIds: ['store-1'],
      includeSubordinates: false,
    },
    redemptionRules: {},
    value: 50,
    valueType: 'fixed',
    expiresAt: overrides.expiresAt ?? new Date(now + 7 * 86400000),
    status: overrides.status ?? 'active',
    redemptionCount: 0,
    maxRedemptions: 1000,
    createdAt: new Date(now - 86400000),
    updatedAt: new Date(now),
  } as CouponV2;
}

/** 创建内存 Mock Repository (同 coupon-ringbeam.test.ts 模式) */
function createMockRepo() {
  const store = new Map<string, CouponV2>();

  const repo = {
    // find: 根据 where 条件筛选 (模拟 LessThan + In)
    find: vi.fn(async (opts?: any) => {
      const where = opts?.where ?? {};

      return Array.from(store.values()).filter((entity) => {
        // tenantId 匹配
        if (where.tenantId && entity.tenantId !== where.tenantId) return false;

        // expiresAt LessThan (TypeORM 传过来的是 LessThan(now), 即 { _type: 'lessThan', _value: Date })
        if (where.expiresAt) {
          const threshold = where.expiresAt?._value instanceof Date
            ? where.expiresAt._value
            : where.expiresAt instanceof Date
              ? where.expiresAt
              : new Date();
          if (entity.expiresAt >= threshold) return false;
        }

        // status In([...]) — 检查 status 是否在允许列表中
        const statusVal = where.status;
        if (statusVal) {
          // TypeORM In() 操作符: { _type: 'in', _value: string[] }
          const allowedStatuses = Array.isArray(statusVal)
            ? statusVal
            : statusVal?._value && Array.isArray(statusVal._value)
              ? statusVal._value
              : null;
          if (allowedStatuses !== null && !allowedStatuses.includes(entity.status)) return false;
        }

        return true;
      });
    }),

    update: vi.fn(async (criteria: any, partial: Partial<CouponV2>) => {
      // 模拟 TypeORM update + In() 行为: 仅更新匹配 id 的记录
      const ids = criteria?.id?._value ?? [];
      let affected = 0;
      for (const id of ids) {
        const c = store.get(id);
        if (c) {
          Object.assign(c, partial);
          affected++;
        }
      }
      return { affected, generatedMaps: [], raw: [] };
    }),

    // 测试辅助
    seed: (...coupons: CouponV2[]) => {
      for (const c of coupons) store.set(c.id, c);
    },

    clear: () => store.clear(),

    getById: (id: string) => store.get(id),
  };

  return repo;
}

// ─── Tests ───────────────────────────────────────────────────────────────

describe('CouponCleanupService', () => {
  let mockRepo: ReturnType<typeof createMockRepo>;
  let service: CouponCleanupService;

  beforeEach(() => {
    mockRepo = createMockRepo();
    const repo = {
      find: mockRepo.find,
      update: mockRepo.update,
    } as unknown as Repository<CouponV2>;
    service = new CouponCleanupService(repo);
  });

  // ── 正例: 有5张过期券→全部clean up ──────────────────────────────

  it('正例: 有5张过期券→全部标记为 expired', async () => {
    const now = Date.now();

    // 准备: 5张已过期 coupon（status 为 active 或 paused）
    mockRepo.seed(
      makeCoupon({ id: 'e1', status: 'active', expiresAt: new Date(now - 86400000) }),
      makeCoupon({ id: 'e2', status: 'active', expiresAt: new Date(now - 2 * 86400000) }),
      makeCoupon({ id: 'e3', status: 'paused', expiresAt: new Date(now - 3600000) }),
      makeCoupon({ id: 'e4', status: 'active', expiresAt: new Date(now - 7 * 86400000) }),
      makeCoupon({ id: 'e5', status: 'paused', expiresAt: new Date(now - 30 * 60000) }),
    );

    // 再插入一张未过期 coupon（不应影响）
    mockRepo.seed(
      makeCoupon({ id: 'v1', status: 'active', expiresAt: new Date(now + 86400000) }),
    );

    // 执行
    const cleaned = await service.scanExpiredCoupons('test-tenant');

    // 验证
    expect(cleaned).toBe(5);
    expect(mockRepo.find).toHaveBeenCalledTimes(1);
    expect(mockRepo.update).toHaveBeenCalledTimes(1);

    // 验证未过期的券状态未改变
    expect(mockRepo.getById('v1')?.status).toBe('active');
    // 验证已过期券状态
    expect(mockRepo.getById('e1')?.status).toBe('expired');
    expect(mockRepo.getById('e4')?.status).toBe('expired');
  });

  // ── 反例: 无过期券→清理0张 ──────────────────────────────────────

  it('反例: 无过期券→清理0张', async () => {
    const now = Date.now();

    // 准备: 所有券均未过期
    mockRepo.seed(
      makeCoupon({ id: 'a1', status: 'active', expiresAt: new Date(now + 86400000) }),
      makeCoupon({ id: 'a2', status: 'active', expiresAt: new Date(now + 7 * 86400000) }),
      makeCoupon({ id: 'a3', status: 'paused', expiresAt: new Date(now + 3600000) }),
    );

    // 执行
    const cleaned = await service.scanExpiredCoupons('test-tenant');

    // 验证
    expect(cleaned).toBe(0);
    expect(mockRepo.find).toHaveBeenCalledTimes(1);
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  // ── 边界: 空store→不抛出异常 ────────────────────────────────────

  it('边界: 空store→不抛出异常,返回0', async () => {
    // store 无数据（未调用 seed）

    // 执行 + 验证: 不抛出异常
    await expect(
      service.scanExpiredCoupons('test-tenant'),
    ).resolves.toBe(0);

    expect(mockRepo.find).toHaveBeenCalledTimes(1);
    expect(mockRepo.update).not.toHaveBeenCalled();
  });

  // ── 边界: 已标记 expired 的券不被重复处理 ───────────────────────

  it('边界: 已标记 expired 的券不被重复扫描', async () => {
    const now = Date.now();

    mockRepo.seed(
      makeCoupon({
        id: 'already-expired',
        status: 'expired',
        expiresAt: new Date(now - 86400000),
      }),
    );

    // 执行
    const cleaned = await service.scanExpiredCoupons('test-tenant');

    // 验证: find 条件排除了 status=expired 的券
    expect(cleaned).toBe(0);
  });

  // ── 边界: 已 exhausted 的券不被重复处理 ─────────────────────────

  it('边界: 已 exhausted 的券不被重复扫描', async () => {
    const now = Date.now();

    mockRepo.seed(
      makeCoupon({
        id: 'exhausted-coupon',
        status: 'exhausted',
        expiresAt: new Date(now - 86400000),
      }),
    );

    // 执行
    const cleaned = await service.scanExpiredCoupons('test-tenant');

    expect(cleaned).toBe(0);
  });
});
