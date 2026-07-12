/**
 * cashier.persistence.spec.ts — P0-A1 Cashier Cache-aside 持久化测试
 *
 * 覆盖:
 *  1. Cache 注入: CashierService 可选的 CacheService 正确注入
 *  2. write-through: createOrder → orderStore + Redis 都有
 *  3. cache-aside: 清除内存后,getOrder 能从 Redis 恢复
 *  4. 支付 write-through + cache-aside 恢复
 *  5. update (closeOrder) → Redis 同步更新
 *  6. resetCashierCacheForTests 清空所有存储
 *  7. 降级: 无 CacheService 时纯内存运行
 *
 * 使用 Nest Test + InMemoryCacheService 模拟 Redis,不依赖真实 Redis。
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { Test } from '@nestjs/testing'
import { CacheModule, CACHE_SERVICE, InMemoryCacheService, type CacheService } from '../../infrastructure/cache/cache.module'
import { MemberService } from '../member/member.service'
import { CashierService } from './cashier.service'
import { CashierOrderStatus, CashierPaymentStatus, type CashierOrder, type CashierPayment } from './cashier.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

// ── Helper ──────────────────────────────────────────────────────────

function makeTenantContext(overrides?: Partial<RequestTenantContext>): RequestTenantContext {
  return { tenantId: 'persist-tenant', brandId: 'persist-brand', storeId: 'persist-store', ...overrides }
}

function makeOrderInput(memberId = 'member-persist-001') {
  return {
    memberId,
    items: [{ skuId: 'sku-persist', title: '持久化商品', quantity: 2, price: 5000 }],
    currency: 'CNY',
  }
}

// ── Setup ───────────────────────────────────────────────────────────

interface TestContext {
  cashierService: CashierService
  cache: InMemoryCacheService
  memberService: MemberService
  ctx: RequestTenantContext
}

/**
 * 创建 Nest 测试模块,注入 CashierService + InMemoryCacheService。
 * 每次调用重置现金存储器 + memberStore + cache。
 */
async function createTestContext(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({
    imports: [CacheModule.forRootInMemory()],
    providers: [
      MemberService,
      CashierService,
    ],
  }).compile()

  const cashierService = moduleRef.get(CashierService)
  const cache = moduleRef.get<CacheService>(CACHE_SERVICE) as InMemoryCacheService
  const memberService = moduleRef.get(MemberService)

  cashierService.resetCashierStoresForTests()
  cache.clear()
  // 清除 MemberService 的模块级 memberStore
  // (通过 ListProfiles -> 删除每个 entry)
  for (const p of memberService.listProfiles()) {
    // MemberService 没有公开的删除方法,用 register 会抛 "already exists"
    // 改用 getProfile 校验: 每个测试用不同的 memberId
  }

  return { cashierService, cache, memberService, ctx: makeTenantContext() }
}

function registerMember(memberService: MemberService, memberId: string): void {
  memberService.register({
    memberId,
    tenantContext: makeTenantContext(),
    nickname: '测试会员',
  })
}

// ══════════════════════════════════════════════════════════════════════
// Cache 注入测试
// ══════════════════════════════════════════════════════════════════════

describe('P0-A1 | Cashier Cache 注入', () => {
  it('CashierService 注入 InMemoryCacheService (backend=memory)', async () => {
    const { cache } = await createTestContext()
    expect(cache.backend).toBe('memory')
  })
})

// ══════════════════════════════════════════════════════════════════════
// Order Cache-aside 测试
// ══════════════════════════════════════════════════════════════════════

describe('P0-A1 | Order write-through', () => {
  let ctx: TestContext

  beforeEach(async () => {
    ctx = await createTestContext()
    registerMember(ctx.memberService, 'wrt-member')
  })

  afterEach(() => {
    ctx.cashierService.resetCashierStoresForTests()
  })

  it('createOrder -> orderStore + Redis 都有数据', async () => {
    const order = await ctx.cashierService.createOrder(ctx.ctx, makeOrderInput('wrt-member'))

    // 通过 getOrder 读取 (走内存)
    const fromMemory = await ctx.cashierService.getOrder(order.orderId, ctx.ctx)
    expect(fromMemory).toBeDefined()
    expect(fromMemory!.orderId).toBe(order.orderId)

    // 直接查 InMemoryCache (模拟 Redis)
    const fromCache = await ctx.cache.get<CashierOrder>(`cashier:order:${order.orderId}`)
    expect(fromCache).toBeDefined()
    expect(fromCache!.orderId).toBe(order.orderId)
    expect(fromCache!.totalAmount).toBe(10000) // 2 * 5000
    expect(fromCache!.status).toBe(CashierOrderStatus.Created)
  })

  it('createOrder -> 租户上下文保留', async () => {
    const order = await ctx.cashierService.createOrder(ctx.ctx, makeOrderInput('wrt-member'))
    const fromCache = await ctx.cache.get<CashierOrder>(`cashier:order:${order.orderId}`)
    expect(fromCache!.tenantContext.tenantId).toBe('persist-tenant')
    expect(fromCache!.tenantContext.brandId).toBe('persist-brand')
  })
})

describe('P0-A1 | Order cache-aside (内存清空后从 Redis 恢复)', () => {
  let ctx: TestContext
  let order: CashierOrder

  beforeEach(async () => {
    ctx = await createTestContext()
    registerMember(ctx.memberService, 'aside-member')
    order = await ctx.cashierService.createOrder(ctx.ctx, makeOrderInput('aside-member'))
  })

  afterEach(() => {
    ctx.cashierService.resetCashierStoresForTests()
  })

  it('getOrder 内存 Miss 后从 Redis 恢复', async () => {
    // 清除内存,保留 Redis
    ctx.cashierService.resetCashierStoresForTests()

    // 验证 Redis 仍有数据
    const fromCache = await ctx.cache.get<CashierOrder>(`cashier:order:${order.orderId}`)
    expect(fromCache).toBeDefined()

    // getOrder 应通过 cache-aside 从 Redis 恢复
    const recovered = await ctx.cashierService.getOrder(order.orderId, ctx.ctx)
    expect(recovered).toBeDefined()
    expect(recovered!.orderId).toBe(order.orderId)
    expect(recovered!.totalAmount).toBe(10000)
    expect(recovered!.status).toBe(CashierOrderStatus.Created)

    // 验证内存已回填 (第二次走内存)
    const fromMemoryAgain = await ctx.cashierService.getOrder(order.orderId, ctx.ctx)
    expect(fromMemoryAgain).toBeDefined()
  })

  it('Redis 也无数据时返回 undefined', async () => {
    ctx.cashierService.resetCashierStoresForTests()
    await ctx.cache.del(`cashier:order:${order.orderId}`)

    const result = await ctx.cashierService.getOrder(order.orderId, ctx.ctx)
    expect(result).toBeUndefined()
  })

  it('跨租户不可见 (即使 Redis 有)', async () => {
    ctx.cashierService.resetCashierStoresForTests()

    const wrongCtx = makeTenantContext({ tenantId: 'other-tenant' })
    const result = await ctx.cashierService.getOrder(order.orderId, wrongCtx)
    expect(result).toBeUndefined()
  })
})

describe('P0-A1 | Order update -> Redis 同步更新', () => {
  let ctx: TestContext
  let order: CashierOrder

  beforeEach(async () => {
    ctx = await createTestContext()
    registerMember(ctx.memberService, 'update-member')
    order = await ctx.cashierService.createOrder(ctx.ctx, makeOrderInput('update-member'))
  })

  afterEach(() => {
    ctx.cashierService.resetCashierStoresForTests()
  })

  it('closeOrder 后 Redis 同步为 Closed 状态', async () => {
    await ctx.cashierService.closeOrder(order.orderId, ctx.ctx, {
      reason: '测试关闭',
      operator: 'test-operator',
    })

    // 内存
    const fromMemory = await ctx.cashierService.getOrder(order.orderId, ctx.ctx)
    expect(fromMemory).toBeDefined()
    expect(fromMemory!.status).toBe(CashierOrderStatus.Closed)

    // Redis
    const fromCache = await ctx.cache.get<CashierOrder>(`cashier:order:${order.orderId}`)
    expect(fromCache!.status).toBe(CashierOrderStatus.Closed)
    expect(fromCache!.closeReason).toBeDefined()
    expect(fromCache!.closedBy).toBe('test-operator')
  })

  it('关闭后 cache-aside 恢复仍为 Closed', async () => {
    await ctx.cashierService.closeOrder(order.orderId, ctx.ctx, { reason: 'test' })
    ctx.cashierService.resetCashierStoresForTests()

    const recovered = await ctx.cashierService.getOrder(order.orderId, ctx.ctx)
    expect(recovered!.status).toBe(CashierOrderStatus.Closed)
  })
})

// ══════════════════════════════════════════════════════════════════════
// Payment Cache-aside 测试
// ══════════════════════════════════════════════════════════════════════

describe('P0-A1 | Payment cache-aside', () => {
  let ctx: TestContext
  let order: CashierOrder

  beforeEach(async () => {
    ctx = await createTestContext()
    registerMember(ctx.memberService, 'pay-member')
    order = await ctx.cashierService.createOrder(ctx.ctx, makeOrderInput('pay-member'))
  })

  afterEach(() => {
    ctx.cashierService.resetCashierStoresForTests()
  })

  it('createPayment -> paymentStore + Redis 都有', async () => {
    const payment = await ctx.cashierService.createPayment(order.orderId, {
      channel: 'wechat_pay',
      amount: 5000,
    })

    expect(payment.paymentId).toBeDefined()
    expect(payment.status).toBe(CashierPaymentStatus.Pending)

    // Redis
    const fromCache = await ctx.cache.get<CashierPayment>(`cashier:payment:${payment.paymentId}`)
    expect(fromCache).toBeDefined()
    expect(fromCache!.paymentId).toBe(payment.paymentId)
    expect(fromCache!.channel).toBe('wechat_pay')
    expect(fromCache!.amount).toBe(5000)
    expect(fromCache!.status).toBe(CashierPaymentStatus.Pending)
  })

  it('内存清空后 getLatestPayment 从 Redis 恢复', async () => {
    const payment = await ctx.cashierService.createPayment(order.orderId, { channel: 'alipay' })
    ctx.cashierService.resetCashierStoresForTests()

    const recovered = await ctx.cashierService.getLatestPayment(order.orderId, ctx.ctx)
    expect(recovered).toBeDefined()
    expect(recovered!.paymentId).toBe(payment.paymentId)
    expect(recovered!.channel).toBe('alipay')
  })

  it('applyPaymentCallback 同步 Redis', async () => {
    await ctx.cashierService.createPayment(order.orderId, { channel: 'card' })
    ctx.cashierService.resetCashierStoresForTests()

    const { order: updatedOrder, payment: updatedPayment } = await ctx.cashierService.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: order.orderId,
      orderId: order.orderId,
      tenantId: ctx.ctx.tenantId,
      transactionNo: 'TXN-PERSIST-001',
      channel: 'card',
    })

    // Redis 中的支付
    const fromCache = await ctx.cache.get<CashierPayment>(
      `cashier:payment:${updatedPayment.paymentId}`
    )
    expect(fromCache!.status).toBe(CashierPaymentStatus.Succeeded)
    expect(fromCache!.transactionNo).toBe('TXN-PERSIST-001')

    // Redis 中的订单
    const orderFromCache = await ctx.cache.get<CashierOrder>(
      `cashier:order:${updatedOrder.orderId}`
    )
    expect(orderFromCache!.status).toBe(CashierOrderStatus.Paid)
    expect(orderFromCache!.latestPaymentId).toBe(updatedPayment.paymentId)
  })
})

// ══════════════════════════════════════════════════════════════════════
// resetCashierCacheForTests
// ══════════════════════════════════════════════════════════════════════

describe('P0-A1 | resetCashierCacheForTests', () => {
  it('清空内存 + Redis', async () => {
    const ctx = await createTestContext()
    registerMember(ctx.memberService, 'reset-member')

    const order = await ctx.cashierService.createOrder(ctx.ctx, makeOrderInput('reset-member'))
    const fromMemory = await ctx.cashierService.getOrder(order.orderId, ctx.ctx)
    expect(fromMemory).toBeDefined()

    // 配置了 Cache 时,reset 清空全部
    await ctx.cashierService.resetCashierCacheForTests()

    const afterReset = await ctx.cashierService.getOrder(order.orderId, ctx.ctx)
    expect(afterReset).toBeUndefined()

    // Redis 也清空
    const fromCache = await ctx.cache.get(`cashier:order:${order.orderId}`)
    expect(fromCache).toBeNull()
  })
})

// ══════════════════════════════════════════════════════════════════════
// 降级: Cache 不可用时纯内存运行
// ══════════════════════════════════════════════════════════════════════

describe('P0-A1 | 降级 (无 CacheService)', () => {
  it('不注入 CacheService 时正常创建+读取订单', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MemberService,
        CashierService,
      ],
    }).compile()

    const cashierService = moduleRef.get(CashierService)
    const memberService = moduleRef.get(MemberService)
    cashierService.resetCashierStoresForTests()

    registerMember(memberService, 'member-no-cache')

    const order = await cashierService.createOrder(makeTenantContext(), makeOrderInput('member-no-cache'))
    expect(order.orderId).toBeDefined()
    expect(order.status).toBe(CashierOrderStatus.Created)

    const fetched = await cashierService.getOrder(order.orderId, makeTenantContext())
    expect(fetched).toBeDefined()
  })

  it('不注入 CacheService 时 closeOrder 正常', async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [MemberService, CashierService],
    }).compile()

    const cashierService = moduleRef.get(CashierService)
    const memberService = moduleRef.get(MemberService)
    cashierService.resetCashierStoresForTests()

    registerMember(memberService, 'member-no-cache-2')

    const order = await cashierService.createOrder(
      makeTenantContext(),
      makeOrderInput('member-no-cache-2'),
    )
    await cashierService.closeOrder(order.orderId, makeTenantContext(), { reason: '降级测试' })
    const closed = await cashierService.getOrder(order.orderId, makeTenantContext())
    expect(closed!.status).toBe(CashierOrderStatus.Closed)
  })
})
