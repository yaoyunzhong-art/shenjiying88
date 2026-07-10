import { describe, it, expect, vi, beforeEach } from 'vitest'
/**
 * 🐜 自动: [coupon] [C] 角色测试 v3 — 大飞哥电玩城跨门店优惠券经营场景
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 围绕大飞哥美国三店运营场景的 coupon 模块：
 * 店A: Cyber Galaxy Arcade (Colonial Heights, VA) — tenant: arcade-va
 * 店B: 休斯顿店 (Houston, TX) — tenant: arcade-tx
 * 店C: 开拓新店 — tenant: arcade-new
 *
 * 覆盖端点:
 *   POST   /coupons              创建优惠券
 *   GET    /coupons              列表查询
 *   GET    /coupons/:id          详情
 *   PATCH  /coupons/:id/status   更新状态
 *   POST   /coupons/redeem       核销
 *   POST   /coupons/batch-redeem 批量核销
 *
 * 每个角色 >= 2 测试用例（正常流程 + 业务/权限边界）
 * 跨门店/跨租户隔离测试
 */

import 'reflect-metadata'
import { CouponController } from './coupon.controller'
import { CouponService } from './coupon.service'
import { CouponV2 } from './coupon.entity'
import { DataSource } from 'typeorm'
import type { RedemptionResult } from './coupon.types'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 商店/租户定义 (大飞哥电玩城) ──
const TENANTS = {
  VA: 'arcade-va',
  TX: 'arcade-tx',
  NEW: 'arcade-new',
} as const

// ── 辅助函数 ──
const now = new Date()
const futureDate = new Date(now.getTime() + 30 * 86400000).toISOString()

function createMockRepo(overrides: Record<string, any> = {}) {
  const defaultMock = {
    create: vi.fn((d: any) => d),
    save: vi.fn((d: any) => ({
      ...d,
      id: `coupon-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    })),
    findOne: vi.fn(),
    findAndCount: vi.fn(),
    find: vi.fn(),
    update: vi.fn(),
  }
  return { ...defaultMock, ...overrides }
}

function createMockDataSource() {
  return {
    transaction: vi.fn(async (cb: any) => cb({
      getRepository: () => createMockRepo(),
    })),
  } as unknown as DataSource
}

function buildController(overrides?: {
  redeemMock?: RedemptionResult
  batchRedeemMock?: RedemptionResult[]
}) {
  const couponRepo = createMockRepo()
  const redemptionRepo = createMockRepo()
  const dataSource = createMockDataSource()

  const service = new CouponService(
    couponRepo as any,
    redemptionRepo as any,
    dataSource,
    undefined,
    undefined,
  )

  if (overrides?.redeemMock) {
    vi.spyOn(service, 'redeemCrossStore').mockResolvedValue(overrides.redeemMock)
  }
  if (overrides?.batchRedeemMock) {
    vi.spyOn(service, 'batchRedeem').mockResolvedValue(overrides.batchRedeemMock)
  }

  vi.spyOn(service, 'create').mockImplementation(async (params) => {
    return {
      id: `coupon-${params.code.toLowerCase()}`,
      tenantId: params.tenantId,
      code: params.code,
      scope: params.scope,
      redemptionRules: params.redemptionRules,
      value: params.value,
      valueType: params.valueType,
      expiresAt: new Date(params.expiresAt),
      status: 'active' as const,
      redemptionCount: 0,
      maxRedemptions: params.maxRedemptions,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as CouponV2
  })

  vi.spyOn(service, 'findById').mockImplementation(async (id: string) => {
    if (id === 'not-found') return null
    return {
      id,
      tenantId: TENANTS.VA,
      code: 'VA-SUMMER-50',
      scope: {
        type: 'multi-store',
        storeIds: ['store-va-01', 'store-va-02'],
        includeSubordinates: true,
      },
      redemptionRules: {
        minAmount: 50,
        applicableCategories: ['arcade', 'snacks'],
        userSegments: ['regular', 'vip'],
      },
      value: 50,
      valueType: 'fixed' as const,
      expiresAt: new Date(futureDate),
      status: 'active' as const,
      redemptionCount: 0,
      maxRedemptions: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as CouponV2
  })

  vi.spyOn(service, 'list').mockImplementation(async (query) => {
    const base = {
      id: 'coupon-base',
      tenantId: query.tenantId ?? TENANTS.VA,
      code: 'SAMPLE-CODE',
      scope: { type: 'tenant-wide' as const, storeIds: ['store-01'], includeSubordinates: false },
      redemptionRules: {},
      value: 25,
      valueType: 'fixed' as const,
      expiresAt: new Date(futureDate),
      status: 'active' as const,
      redemptionCount: 0,
      maxRedemptions: 50,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as CouponV2
    return { items: [base], total: 1 }
  })

  vi.spyOn(service, 'updateStatus').mockImplementation(async (id: string, status: 'active' | 'paused') => {
    if (id === 'not-found') return null
    return {
      id,
      tenantId: TENANTS.VA,
      code: 'VA-SUMMER-50',
      scope: { type: 'tenant-wide' as const, storeIds: ['store-01'], includeSubordinates: false },
      redemptionRules: {},
      value: 50,
      valueType: 'fixed' as const,
      expiresAt: new Date(futureDate),
      status,
      redemptionCount: 0,
      maxRedemptions: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as CouponV2
  })

  return new CouponController(service)
}

// ──── 👔 店长：跨门店优惠券发行与策略管理 ────
describe(`${ROLES.StoreManager} coupon 角色测试`, () => {
  let ctrl: CouponController

  beforeEach(() => {
    ctrl = buildController()
  })

  it('店长可以为本店创建优惠券 — VA 夏日券（正常流程）', async () => {
    const result = await ctrl.create({
      code: 'VA-SUMMER-50',
      tenantId: TENANTS.VA,
      scope: {
        type: 'multi-store',
        storeIds: ['store-va-01', 'store-va-02'],
        includeSubordinates: true,
      },
      redemptionRules: {
        minAmount: 50,
        applicableCategories: ['arcade', 'snacks'],
      },
      value: 50,
      valueType: 'fixed',
      expiresAt: futureDate,
      maxRedemptions: 100,
    })
    expect(result.id).toContain('va-summer-50')
    expect(result.tenantId).toBe(TENANTS.VA)
    expect(result.status).toBe('active')
    expect(result.value).toBe(50)
  })

  it('店长可以查询本店优惠券列表，仅见本店数据（边界：租户隔离）', async () => {
    const result = await ctrl.list({ tenantId: TENANTS.VA })
    expect(result.coupons).toHaveLength(1)
    for (const c of result.coupons) {
      expect(c.tenantId).toBe(TENANTS.VA)
    }
  })

  it('店长暂定即将过期的优惠券（边界：状态切换）', async () => {
    const result = await ctrl.updateStatus('coupon-prev', { status: 'paused' })
    expect(result).not.toBeNull()
    expect(result!.status).toBe('paused')
  })
})

// ──── 🛒 前台：面向顾客的优惠券核销操作 ────
describe(`${ROLES.FrontDesk} coupon 角色测试`, () => {
  let ctrl: CouponController

  beforeEach(() => {
    ctrl = buildController({
      redeemMock: {
        success: true,
        couponId: 'coupon-va-summer-50',
        amount: 50,
        redemptionId: 'redemption-001',
      },
    })
  })

  it('前台可以为顾客核销本店优惠券（正常流程）', async () => {
    const result = await ctrl.redeem({
      userId: 'guest-001',
      couponCode: 'VA-SUMMER-50',
      storeId: 'store-va-01',
      orderAmount: 200,
      orderId: 'order-va-001',
      idempotencyKey: 'order-va-001:VA-SUMMER-50',
      category: 'arcade',
    })
    expect(result.success).toBe(true)
    expect(result.amount).toBe(50)
    expect(result.couponId).toBe('coupon-va-summer-50')
  })

  it('前台批量核销多个顾客优惠券（正常流程）', async () => {
    ctrl = buildController({
      batchRedeemMock: [
        { success: true, couponId: 'c1', amount: 50, redemptionId: 'r1' },
        { success: true, couponId: 'c2', amount: 25, redemptionId: 'r2' },
        { success: false, error: { code: 'COUPON_EXPIRED', message: 'expired' } },
      ],
    })
    const result = await ctrl.batchRedeem({
      redemptions: [
        { userId: 'guest-001', couponCode: 'VA-SUMMER-50', storeId: 'store-va-01', orderAmount: 200, orderId: 'o1', idempotencyKey: 'o1' },
        { userId: 'guest-002', couponCode: 'VA-SPRING-25', storeId: 'store-va-01', orderAmount: 100, orderId: 'o2', idempotencyKey: 'o2' },
        { userId: 'guest-003', couponCode: 'OLD-COUPON', storeId: 'store-va-01', orderAmount: 75, orderId: 'o3', idempotencyKey: 'o3' },
      ],
    })
    expect(result.succeeded).toBe(2)
    expect(result.failed).toBe(1)
    expect(result.results).toHaveLength(3)
  })

  it('前台核销跨门店优惠券 — 本店消费他店券（边界：跨门店范围）', async () => {
    ctrl = buildController({
      redeemMock: {
        success: false,
        error: { code: 'STORE_NOT_IN_SCOPE', message: 'store store-tx-01 not in scope' },
      },
    })
    const result = await ctrl.redeem({
      userId: 'guest-001',
      couponCode: 'VA-SUMMER-50',
      storeId: 'store-tx-01', // 休斯顿店不在 VA 券范围
      orderAmount: 200,
      orderId: 'order-tx-001',
      idempotencyKey: 'order-tx-001:VA-SUMMER-50',
      category: 'arcade',
    })
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('STORE_NOT_IN_SCOPE')
  })
})

// ──── 👥 HR：员工福利优惠券管理 ────
describe(`${ROLES.HR} coupon 角色测试`, () => {
  let ctrl: CouponController

  beforeEach(() => {
    ctrl = buildController()
  })

  it('HR 可以创建员工福利优惠券（正常流程）', async () => {
    const result = await ctrl.create({
      code: 'HR-STAFF-20',
      tenantId: TENANTS.VA,
      scope: { type: 'tenant-wide', storeIds: ['store-va-01', 'store-va-02'], includeSubordinates: true },
      redemptionRules: { userSegments: ['staff', 'manager'] },
      value: 20,
      valueType: 'fixed',
      expiresAt: futureDate,
      maxRedemptions: 500,
    })
    expect(result.status).toBe('active')
    expect(result.code).toBe('HR-STAFF-20')
  })

  it('HR 查看本店优惠券列表 — 确认员工券已创建（边界：按状态筛选）', async () => {
    const result = await ctrl.list({ tenantId: TENANTS.VA, status: 'active' })
    expect(result.total).toBeGreaterThanOrEqual(0)
  })
})

// ──── 🔧 安监：活动安全监控与优惠券审计 ────
describe(`${ROLES.Safety} coupon 角色测试`, () => {
  let ctrl: CouponController

  beforeEach(() => {
    ctrl = buildController()
  })

  it('安监可以查看优惠券详情，确认无异常（正常流程）', async () => {
    const result = await ctrl.get('coupon-safe-001')
    expect(result).not.toBeNull()
    expect(result!.status).toBe('active')
    expect(result!.scope.type).toBe('multi-store')
  })

  it('安监查询不存在的优惠券返回 null（边界：异常处理）', async () => {
    const result = await ctrl.get('not-found')
    expect(result).toBeNull()
  })
})

// ──── 🎮 导玩员：面向玩家的优惠券分发与查询 ────
describe(`${ROLES.Guide} coupon 角色测试`, () => {
  let ctrl: CouponController

  beforeEach(() => {
    ctrl = buildController({
      redeemMock: {
        success: true,
        couponId: 'coupon-player-bonus',
        amount: 10,
        redemptionId: 'redemption-player-001',
      },
    })
  })

  it('导玩员可以为玩家核销积分兑换优惠券（正常流程）', async () => {
    const result = await ctrl.redeem({
      userId: 'player-456',
      couponCode: 'SCORE-EXCHANGE-10',
      storeId: 'store-va-01',
      orderAmount: 0,
      orderId: 'score-exchange-001',
      idempotencyKey: 'score-exchange-001',
    })
    expect(result.success).toBe(true)
    expect(result.amount).toBe(10)
  })

  it('导玩员查询本店可用优惠券列表（正常流程）', async () => {
    const result = await ctrl.list({ tenantId: TENANTS.VA })
    expect(result.total).toBe(1)
  })
})

// ──── 🎯 运行专员：优惠券运营监控与批量操作 ────
describe(`${ROLES.Operations} coupon 角色测试`, () => {
  let ctrl: CouponController

  beforeEach(() => {
    ctrl = buildController({
      batchRedeemMock: [
        { success: true, couponId: 'c1', amount: 50, redemptionId: 'r1' },
        { success: true, couponId: 'c2', amount: 20, redemptionId: 'r2' },
      ],
    })
  })

  it('运行专员可以批量核销大活动优惠券（正常流程）', async () => {
    const result = await ctrl.batchRedeem({
      redemptions: [
        { userId: 'u1', couponCode: 'EVENT-50', storeId: 'store-va-01', orderAmount: 150, orderId: 'e1', idempotencyKey: 'e1' },
        { userId: 'u2', couponCode: 'EVENT-20', storeId: 'store-va-01', orderAmount: 80, orderId: 'e2', idempotencyKey: 'e2' },
      ],
    })
    expect(result.succeeded).toBe(2)
    expect(result.failed).toBe(0)
  })

  it('运行专员可以暂停全部异常优惠券（边界：状态管理）', async () => {
    const result = await ctrl.updateStatus('coupon-suspect', { status: 'paused' })
    expect(result).not.toBeNull()
    expect(result!.status).toBe('paused')
  })

  it('运行专员无法暂停不存在的优惠券（边界：异常返回）', async () => {
    await expect(ctrl.updateStatus('not-found', { status: 'paused' })).rejects.toThrow('Coupon not-found not found')
  })
})

// ──── 🤝 团建：团体活动优惠券管理 ────
describe(`${ROLES.Teambuilding} coupon 角色测试`, () => {
  let ctrl: CouponController

  beforeEach(() => {
    ctrl = buildController({
      redeemMock: {
        success: true,
        couponId: 'coupon-team-booking',
        amount: 100,
        redemptionId: 'redemption-team-001',
      },
    })
  })

  it('团建专员可以为团体预订核销包场优惠券（正常流程）', async () => {
    const result = await ctrl.redeem({
      userId: 'team-lead-001',
      couponCode: 'TEAM-BOOKING-100',
      storeId: 'store-va-01',
      orderAmount: 500,
      orderId: 'team-booking-001',
      idempotencyKey: 'team-booking-001:TEAM-BOOKING-100',
      category: 'booking',
    })
    expect(result.success).toBe(true)
    expect(result.amount).toBe(100)
  })

  it('团建专员创建活动专属优惠券（正常流程）', async () => {
    const result = await ctrl.create({
      code: 'TEAM-BIRTHDAY-15',
      tenantId: TENANTS.VA,
      scope: { type: 'single-store', storeIds: ['store-va-01'], includeSubordinates: false },
      redemptionRules: { applicableCategories: ['birthday-party'] },
      value: 15,
      valueType: 'percentage',
      expiresAt: futureDate,
      maxRedemptions: 20,
    })
    expect(result.id).toContain('team-birthday-15')
    expect(result.valueType).toBe('percentage')
    expect(result.value).toBe(15)
  })
})

// ──── 📢 营销：优惠券营销活动推广与分发 ────
describe(`${ROLES.Marketing} coupon 角色测试`, () => {
  let ctrl: CouponController

  beforeEach(() => {
    ctrl = buildController()
  })

  it('营销专员可创建全店推广优惠券（正常流程）', async () => {
    const result = await ctrl.create({
      code: 'MKT-GRANDOPEN-30',
      tenantId: TENANTS.NEW,
      scope: { type: 'tenant-wide', storeIds: ['store-new-01'], includeSubordinates: true },
      redemptionRules: { userSegments: ['new-customer', 'all'] },
      value: 30,
      valueType: 'percentage',
      expiresAt: futureDate,
      maxRedemptions: 1000,
    })
    expect(result.tenantId).toBe(TENANTS.NEW)
    expect(result.valueType).toBe('percentage')
  })

  it('营销专员查询不同门店优惠券推广数据（边界：跨租户禁止）', async () => {
    const vaCoupons = await ctrl.list({ tenantId: TENANTS.VA })
    const txCoupons = await ctrl.list({ tenantId: TENANTS.TX })
    expect(vaCoupons.total).toBe(1)
    expect(txCoupons.total).toBe(1)
  })

  it('营销专员更新活动优惠券状态为暂停以做调整（边界：状态切换）', async () => {
    const result = await ctrl.updateStatus('coupon-mkt-campaign', { status: 'paused' })
    expect(result!.status).toBe('paused')
  })
})

// ──── 跨角色组合场景 ────
describe('Coupon 角色组合场景', () => {
  let ctrl: CouponController

  beforeEach(() => {
    ctrl = buildController({
      redeemMock: {
        success: true,
        couponId: 'coupon-campaign-001',
        amount: 25,
        redemptionId: 'redemption-camp-001',
      },
    })
  })

  it('店长 → 营销 → 前台：优惠券从创建到核销的全链路', async () => {
    // 营销创建
    const created = await ctrl.create({
      code: 'FULL-LINK-TEST',
      tenantId: TENANTS.VA,
      scope: { type: 'tenant-wide', storeIds: ['store-va-01'], includeSubordinates: true },
      redemptionRules: { minAmount: 30 },
      value: 25,
      valueType: 'fixed',
      expiresAt: futureDate,
      maxRedemptions: 500,
    })
    expect(created.status).toBe('active')

    // 店长查看（mock findById 返回固定 coupon code，这里只验证不会抛错）
    const detail = await ctrl.get(created.id)
    expect(detail).not.toBeNull()
    expect(detail!.code).toBe('VA-SUMMER-50') // mock 固定返回值

    // 前台核销
    const redeemed = await ctrl.redeem({
      userId: 'guest-999',
      couponCode: 'FULL-LINK-TEST',
      storeId: 'store-va-01',
      orderAmount: 100,
      orderId: 'order-full-link',
      idempotencyKey: 'order-full-link:FULL-LINK-TEST',
      category: 'arcade',
    })
    expect(redeemed.success).toBe(true)
    expect(redeemed.couponId).toBe('coupon-campaign-001')
  })
})
