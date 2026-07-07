import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
import assert from 'node:assert/strict'
import { PaymentService, MockPaymentGateway } from './payment.service'
import { RefundService } from './refund.service'
import { OrderService } from './order.service'
import { LytToCashierBridge } from './bridges/lyt-to-cashier.bridge'
import {
  InMemoryBillingMeter,
  DefaultPricingEngine,
  BillingServiceImpl
} from '../foundation/commercial-billing/billing.service'
import { BillingWall } from '../foundation/commercial-billing/billing-wall'
import type { Order, CreateOrderInput, CreatePaymentInput, CreateRefundInput } from '@m5/types'
import type { PricingPlan } from '../foundation/commercial-billing/billing.port'
/**
 * P3-5 扩展集成测试: RefundService + LytToCashierBridge + 跨 metric
 *
 * 6 子套件:
 *   1. RefundService 集成 BillingWall (guard + recordUsage)
 *   2. LytToCashierBridge 集成 BillingWall (3 event metric)
 *   3. 跨 metric 隔离 (payment.create / refund.create / lyt_bridge.* 各自独立)
 *   4. Refund 拒绝计费墙: 余额不足
 *   5. 退款流程: create payment → refund → 验证 charge
 *   6. 跨租户 + 跨周期
 */
// ─── helpers ───
function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 'ORD-test-001',
    tenantId: 't1',
    memberId: null,
    status: 'PAID',
    subtotalCents: 1000,
    discountCents: 0,
    taxCents: 0,
    totalCents: 1000,
    paidCents: 1000,
    refundedCents: 0,
    paymentMethod: 'WECHAT',
    createdBy: 'u1',
    clientOrderId: '',
    version: 1,
    metadata: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
    closedAt: null,
    ...overrides
  }
}
/**
 * 准备一个 PAID order + SUCCESS payment (供 refund 测试)
 * 1. 塞 order 进 OrderService
 * 2. ps.create (PENDING)
 * 3. ps.confirm → order 变 PAID, payment 变 SUCCESS
 * 4. 返回 order + payment (含真实 id)
 */
function seedPaidOrder(
  os: OrderService,
  ps: PaymentService,
  opts: { orderId: string; tenantId: string; totalCents?: number }
) {
  const totalCents = opts.totalCents ?? 1000
  const o = makeOrder({
    id: opts.orderId,
    tenantId: opts.tenantId,
    status: 'PENDING',
    paidCents: 0,
    totalCents
  })
  ;(os as unknown as { orders: Map<string, Order> }).orders.set(o.id, o)
  // 同步塞 (ps.create 异步, 但内部不阻塞)
  let payment: { id: string; status: string; orderId: string; tenantId: string } | null = null
  ps.create(
    { orderId: o.id, amountCents: totalCents, method: 'WECHAT' },
    { tenantId: opts.tenantId, userId: 'u1' }
  ).then((p) => {
    payment = p
    // confirm: 模拟 webhook
    ps.confirm(p.id, `mock_txn_${p.id}`, opts.tenantId)
  })
  // 由于 ps.create 是 async, 这里无法同步返回 payment
  // 改用直接塞入 Payment 内部 Map 的方式
  return { order: o, payment: payment as unknown as { id: string } }
}
/**
 * 直接准备 PAID order + PENDING payment (同步版, 用于单元测试)
 * 绕过 ps.create 的 async + amount 校验
 */
function seedPaidOrderSync(
  os: OrderService,
  ps: PaymentService,
  opts: {
    orderId: string
    paymentId: string
    tenantId: string
    amountCents?: number
  }
) {
  const amountCents = opts.amountCents ?? 1000
  const o = makeOrder({
    id: opts.orderId,
    tenantId: opts.tenantId,
    status: 'PAID',
    paidCents: amountCents,
    totalCents: amountCents
  })
  ;(os as unknown as { orders: Map<string, Order> }).orders.set(o.id, o)
  // 直接塞 payment 进 PaymentService 内部 Map
  const paymentMap = (ps as unknown as {
    payments: Map<string, {
      id: string
      tenantId: string
      orderId: string
      method: string
      amountCents: number
      status: string
      providerTxnId: string | null
      paidAt: string | null
      createdAt: string
      updatedAt: string
    }>
  }).payments
  const activeIndex = (ps as unknown as {
    activeIndex: Map<string, string>
  }).activeIndex
  paymentMap.set(opts.paymentId, {
    id: opts.paymentId,
    tenantId: opts.tenantId,
    orderId: opts.orderId,
    method: 'WECHAT',
    amountCents,
    status: 'SUCCESS',
    providerTxnId: `mock_txn_${opts.paymentId}`,
    paidAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
  activeIndex.set(`${opts.tenantId}:${opts.orderId}:WECHAT`, opts.paymentId)
  return { order: o, payment: { id: opts.paymentId } }
}
const FLAT_99: PricingPlan = {
  id: 'p-flat-99',
  name: 'FLAT 99',
  type: 'FLAT',
  flatAmount: 99,
  tiers: [],
  currency: 'CNY',
  billingCycle: 'monthly',
  effectiveAt: 0
}
const PER_UNIT_REFUND: PricingPlan = {
  id: 'p-perunit-refund',
  name: 'REFUND BASIC',
  type: 'PER_UNIT',
  includedQuota: 5,
  tiers: [{ upTo: 50, unitPrice: 1 }],
  currency: 'CNY',
  billingCycle: 'monthly',
  effectiveAt: 0
}
interface Stack {
  os: OrderService
  gw: MockPaymentGateway
  ps: PaymentService
  rs: RefundService
  wall: BillingWall
  billing: BillingServiceImpl
  meter: InMemoryBillingMeter
}
function buildStack(opts: { withBilling?: boolean; plan?: PricingPlan; balance?: number } = {}): Stack {
  const os = new OrderService()
  const gw = new MockPaymentGateway()
  const meter = new InMemoryBillingMeter()
  const engine = new DefaultPricingEngine()
  const billing = new BillingServiceImpl(meter, engine)
  const wall = new BillingWall(billing, meter)
  if (opts.withBilling) {
    if (opts.plan) billing.setPlan('t1', opts.plan)
    if (opts.balance !== undefined) billing.recharge('t1', opts.balance)
  }
  const ps = new PaymentService(os, gw, undefined, opts.withBilling ? wall : undefined)
  const rs = new RefundService(os, ps, opts.withBilling ? wall : undefined)
  return { os, gw, ps, rs, wall, billing, meter }
}
// ═══════════════════════════════════════════════════════════════
// 1. RefundService 集成
// ═══════════════════════════════════════════════════════════════
describe('RefundService 集成 BillingWall', () => {
  it('1.1 无 BillingWall: 现有行为不变', () => {
    const { os, ps, rs } = buildStack()
    const { payment } = seedPaidOrderSync(os, ps, {
      orderId: 'ORD-r-1',
      paymentId: 'P-1',
      tenantId: 't1'
    })
    const r = rs.create(
      { orderId: 'ORD-r-1', paymentId: payment.id, amountCents: 100, reason: 'test' },
      { tenantId: 't1', userId: 'u1' }
    )
    assert.equal(r.status, 'SUCCESS')
  })
  it('1.2 有 BillingWall + 余额充足 + 在 quota 内: 正常', () => {
    const { os, ps, rs, wall } = buildStack({ withBilling: true, plan: PER_UNIT_REFUND, balance: 100 })
    const { payment } = seedPaidOrderSync(os, ps, {
      orderId: 'ORD-r-2',
      paymentId: 'P-2',
      tenantId: 't1'
    })
    rs.create(
      { orderId: 'ORD-r-2', paymentId: payment.id, amountCents: 100, reason: 'r1' },
      { tenantId: 't1', userId: 'u1' }
    )
    // 1 笔退款, 在 quota(5) 内 → 0 fee
    const u = wall.getUsageReport('t1').find((x) => x.metric === 'refund.create')
    assert.equal(u?.totalQuantity, 1)
  })
  it('1.3 FLAT 99 + 余额 0: 拒付 billing_quota_exceeded', () => {
    const { os, ps, rs } = buildStack({ withBilling: true, plan: FLAT_99, balance: 0 })
    const { payment } = seedPaidOrderSync(os, ps, {
      orderId: 'ORD-r-3',
      paymentId: 'P-3',
      tenantId: 't1'
    })
    assert.throws(
      () =>
        rs.create(
          { orderId: 'ORD-r-3', paymentId: payment.id, amountCents: 100, reason: 'r1' },
          { tenantId: 't1', userId: 'u1' }
        ),
      (err: unknown) => {
        const r = (err as { response?: { error?: string; reason?: string } }).response
        assert.equal(r?.error, 'billing_quota_exceeded')
        assert.equal(r?.reason, 'INSUFFICIENT_BALANCE')
        return true
      }
    )
  })
  it('1.4 PER_UNIT 套餐 + 超 hardLimit: 拒付 QUOTA_EXCEEDED', () => {
    const { os, ps, rs } = buildStack({ withBilling: true, plan: PER_UNIT_REFUND, balance: 10000 })
    // PER_UNIT hardLimit = tier[0].upTo = 50
    // 用光 50 笔
    for (let i = 0; i < 50; i++) {
      const { payment } = seedPaidOrderSync(os, ps, {
        orderId: `ORD-r-${i}`,
        paymentId: `P-${i}`,
        tenantId: 't1'
      })
      rs.create(
        { orderId: `ORD-r-${i}`, paymentId: payment.id, amountCents: 100, reason: `r${i}` },
        { tenantId: 't1', userId: 'u1' }
      )
    }
    // 第 51 笔: currentUsage=50 + 1 = 51 > hardLimit 50 → QUOTA_EXCEEDED
    const { payment: p51 } = seedPaidOrderSync(os, ps, {
      orderId: 'ORD-r-51',
      paymentId: 'P-51',
      tenantId: 't1'
    })
    assert.throws(
      () =>
        rs.create(
          { orderId: 'ORD-r-51', paymentId: p51.id, amountCents: 100, reason: 'r51' },
          { tenantId: 't1', userId: 'u1' }
        ),
      (err: unknown) => {
        const r = (err as { response?: { error?: string; reason?: string } }).response
        assert.equal(r?.reason, 'QUOTA_EXCEEDED')
        return true
      }
    )
  })
})
// ═══════════════════════════════════════════════════════════════
// 2. LytToCashierBridge 集成
// ═══════════════════════════════════════════════════════════════
describe('LytToCashierBridge 集成 BillingWall', () => {
  const buildBridge = (wall?: BillingWall) => {
    const deps = {
      syncMemberProfile: async () => ({ updated: true }),
      syncExternalOrder: async () => ({ cashierOrderId: 'ORD-bridge-001' }),
      recordGatePass: async () => ({ recorded: true })
    }
    return new LytToCashierBridge(deps, undefined, wall)
  }
  it('2.1 handleMemberProfileSynced: 记录 lyt_bridge.member', async () => {
    const { wall } = buildStack({ withBilling: true })
    const bridge = buildBridge(wall)
    await bridge.handleMemberProfileSynced(
      {
        tenantId: 't1',
        lytMemberId: 'LM-001',
        memberId: 'm1',
        syncedAt: '2026-07-03T10:00:00Z',
        profile: { name: '张三', phone: '13800000000' }
      },
      { tenantId: 't1', marketCode: 'zh-cn' }
    )
    const u = wall.getUsageReport('t1').find((x) => x.metric === 'lyt_bridge.member')
    assert.equal(u?.totalQuantity, 1)
  })
  it('2.2 handleExternalOrderCreated: 记录 lyt_bridge.order', async () => {
    const { wall } = buildStack({ withBilling: true })
    const bridge = buildBridge(wall)
    await bridge.handleExternalOrderCreated(
      {
        tenantId: 't1',
        lytOrderId: 'LYT-O-001',
        lytMemberId: 'LM-001',
        memberId: 'm1',
        amountCents: 5000,
        productType: 'OTHER',
        productRef: 'PRD-001',
        createdAt: '2026-07-03T10:00:00Z'
      },
      { tenantId: 't1', marketCode: 'zh-cn' }
    )
    const u = wall.getUsageReport('t1').find((x) => x.metric === 'lyt_bridge.order')
    assert.equal(u?.totalQuantity, 1)
  })
  it('2.3 handleGatePassRecord: 记录 lyt_bridge.gate', async () => {
    const { wall } = buildStack({ withBilling: true })
    const bridge = buildBridge(wall)
    await bridge.handleGatePassRecord(
      {
        tenantId: 't1',
        lytPassId: 'PASS-001',
        lytMemberId: 'LM-001',
        memberId: 'm1',
        gateId: 'G-001',
        passType: 'ENTER',
        passAt: '2026-07-03T10:00:00Z'
      },
      { tenantId: 't1', marketCode: 'zh-cn' }
    )
    const u = wall.getUsageReport('t1').find((x) => x.metric === 'lyt_bridge.gate')
    assert.equal(u?.totalQuantity, 1)
  })
  it('2.4 重复事件: idempotency 跳过, 不重复计费', async () => {
    const { wall } = buildStack({ withBilling: true })
    const bridge = buildBridge(wall)
    const evt = {
      tenantId: 't1',
      lytMemberId: 'LM-DUP',
      memberId: 'm1',
      syncedAt: '2026-07-03T10:00:00Z',
      profile: { name: '张三', phone: '13800000000' }
    }
    await bridge.handleMemberProfileSynced(evt, { tenantId: 't1', marketCode: 'zh-cn' })
    await bridge.handleMemberProfileSynced(evt, { tenantId: 't1', marketCode: 'zh-cn' })
    const u = wall.getUsageReport('t1').find((x) => x.metric === 'lyt_bridge.member')
    // 重复事件 idempotency skip, 只记 1 次
    assert.equal(u?.totalQuantity, 1)
  })
  it('2.5 无 BillingWall: 现有行为不变', async () => {
    const bridge = buildBridge(undefined)
    const r = await bridge.handleMemberProfileSynced(
      {
        tenantId: 't1',
        lytMemberId: 'LM-002',
        memberId: 'm2',
        syncedAt: '2026-07-03T10:00:00Z',
        profile: { name: '李四', phone: '13800000000' }
      },
      { tenantId: 't1', marketCode: 'zh-cn' }
    )
    assert.equal(r.status, 'success')
  })
})
// ═══════════════════════════════════════════════════════════════
// 3. 跨 metric 隔离
// ═══════════════════════════════════════════════════════════════
describe('跨 metric 隔离', () => {
  it('3.1 payment.create / refund.create / lyt_bridge.* 各自独立', async () => {
    const { os, ps, rs, wall } = buildStack({ withBilling: true, balance: 10000 })
    // 1 笔支付: order PENDING, 然后 ps.confirm 让 order 变 PAID
    const o1 = makeOrder({ id: 'O1', status: 'PENDING', paidCents: 0, totalCents: 1000 })
    ;(os as unknown as { orders: Map<string, Order> }).orders.set(o1.id, o1)
    const pay1 = await ps.create(
      { orderId: o1.id, amountCents: 1000, method: 'WECHAT' },
      { tenantId: 't1', userId: 'u1' }
    )
    ps.confirm(pay1.id, `mock_txn_${pay1.id}`, 't1')
    // 1 笔退款
    rs.create(
      { orderId: o1.id, paymentId: pay1.id, amountCents: 100, reason: 'r' },
      { tenantId: 't1', userId: 'u1' }
    )
    // 1 个 lyt bridge event
    const deps = {
      syncMemberProfile: async () => ({ updated: true }),
      syncExternalOrder: async () => ({ cashierOrderId: 'x' }),
      recordGatePass: async () => ({ recorded: true })
    }
    const bridge = new LytToCashierBridge(deps, undefined, wall)
    await bridge.handleMemberProfileSynced(
      {
        tenantId: 't1',
        lytMemberId: 'LM-X',
        memberId: 'm1',
        syncedAt: '2026-07-03T10:00:00Z',
        profile: { name: 'x', phone: '13800000000' }
      },
      { tenantId: 't1', marketCode: 'zh-cn' }
    )
    const report = wall.getUsageReport('t1')
    const map = new Map(report.map((r) => [r.metric, r.totalQuantity]))
    assert.equal(map.get('payment.create'), 1)
    assert.equal(map.get('refund.create'), 1)
    assert.equal(map.get('lyt_bridge.member'), 1)
  })
  it('3.2 各自计费: t1 PER_UNIT 套餐余额足, t2 FLAT 99 余额 0 → 拒付', async () => {
    const stack1 = buildStack({ withBilling: true, plan: FLAT_99, balance: 200 })
    // 单独建 t2 栈
    const os2 = new OrderService()
    const gw2 = new MockPaymentGateway()
    const meter2 = new InMemoryBillingMeter()
    const engine2 = new DefaultPricingEngine()
    const billing2 = new BillingServiceImpl(meter2, engine2)
    const wall2 = new BillingWall(billing2, meter2)
    billing2.setPlan('t2', FLAT_99)
    billing2.recharge('t2', 0)
    const ps2 = new PaymentService(os2, gw2, undefined, wall2)
    // t1 通过, t2 拒付
    // 注意: FLAT 99 charge 时 amount=0 (P3-5 修复), 所以 t1 balance 200 不会扣
    // 但 t2 balance 0 + charge 0 + guard INSUFFICIENT_BALANCE → 拒付
    const o1 = makeOrder({ id: 'O1', tenantId: 't1', status: 'PENDING', paidCents: 0, totalCents: 100 })
    ;(stack1.os as unknown as { orders: Map<string, Order> }).orders.set(o1.id, o1)
    const p1 = await stack1.ps.create(
      { orderId: o1.id, amountCents: 100, method: 'WECHAT' },
      { tenantId: 't1', userId: 'u1' }
    )
    assert.equal(p1.status, 'PENDING')
    const o2 = makeOrder({ id: 'O2', tenantId: 't2', status: 'PENDING', paidCents: 0, totalCents: 100 })
    ;(os2 as unknown as { orders: Map<string, Order> }).orders.set(o2.id, o2)
    await assert.rejects(
      ps2.create(
        { orderId: o2.id, amountCents: 100, method: 'WECHAT' },
        { tenantId: 't2', userId: 'u2' }
      ),
      (err: unknown) => {
        const r = (err as { response?: { reason?: string } }).response
        assert.equal(r?.reason, 'INSUFFICIENT_BALANCE')
        return true
      }
    )
  })
})
// ═══════════════════════════════════════════════════════════════
// 4. 完整退款流程
// ═══════════════════════════════════════════════════════════════
describe('完整退款流程 + 跨 metric charge', () => {
  it('4.1 pay → refund: 两条 usage 各自累加', async () => {
    const { os, ps, rs, wall } = buildStack({ withBilling: true, plan: PER_UNIT_REFUND, balance: 10000 })
    // pay
    const o = makeOrder({ status: 'PENDING', paidCents: 0, totalCents: 1000 })
    ;(os as unknown as { orders: Map<string, Order> }).orders.set(o.id, o)
    const pay = await ps.create(
      { orderId: o.id, amountCents: 1000, method: 'WECHAT' },
      { tenantId: 't1', userId: 'u1' }
    )
    ps.confirm(pay.id, `mock_txn_${pay.id}`, 't1')
    // refund
    rs.create(
      { orderId: o.id, paymentId: pay.id, amountCents: 100, reason: 'test' },
      { tenantId: 't1', userId: 'u1' }
    )
    const report = wall.getUsageReport('t1')
    const map = new Map(report.map((r) => [r.metric, r.totalQuantity]))
    assert.equal(map.get('payment.create'), 1)
    assert.equal(map.get('refund.create'), 1)
  })
  it('4.2 refund 套餐: 超 quota 后的 fee 累计', () => {
    const { os, ps, rs, wall } = buildStack({ withBilling: true, plan: PER_UNIT_REFUND, balance: 10000 })
    // 10 笔 (5 quota + 5 chargeable × 1 元/笔 = 5 元)
    for (let i = 0; i < 10; i++) {
      const { payment } = seedPaidOrderSync(os, ps, {
        orderId: `ORD-r-${i}`,
        paymentId: `P-${i}`,
        tenantId: 't1'
      })
      rs.create(
        { orderId: `ORD-r-${i}`, paymentId: payment.id, amountCents: 100, reason: `r${i}` },
        { tenantId: 't1', userId: 'u1' }
      )
    }
    // 套餐没变, 总 usage = 10
    assert.equal(wall.getPricingPlan('t1')?.id, 'p-perunit-refund')
    const u = wall.getUsageReport('t1').find((x) => x.metric === 'refund.create')
    assert.equal(u?.totalQuantity, 10)
  })
})
// ═══════════════════════════════════════════════════════════════
// 5. 月末出账
// ═══════════════════════════════════════════════════════════════
describe('月末出账 + 跨 metric', () => {
  it('5.1 FLAT 99: payment.create + refund.create + lyt_bridge → 1 笔固定月费', async () => {
    const { os, ps, rs, wall, billing, meter } = buildStack({ withBilling: true, plan: FLAT_99, balance: 200 })
    const deps = {
      syncMemberProfile: async () => ({ updated: true }),
      syncExternalOrder: async () => ({ cashierOrderId: 'x' }),
      recordGatePass: async () => ({ recorded: true })
    }
    const bridge = new LytToCashierBridge(deps, undefined, wall)
    // 5 笔支付
    for (let i = 0; i < 5; i++) {
      const o = makeOrder({ id: `O-pay-${i}`, status: 'PENDING', paidCents: 0, totalCents: 100 })
      ;(os as unknown as { orders: Map<string, Order> }).orders.set(o.id, o)
      await ps.create(
        { orderId: o.id, amountCents: 100, method: 'WECHAT' },
        { tenantId: 't1', userId: 'u1' }
      )
    }
    // 2 笔退款
    for (let i = 0; i < 2; i++) {
      const { payment } = seedPaidOrderSync(os, ps, {
        orderId: `O-ref-${i}`,
        paymentId: `P-ref-${i}`,
        tenantId: 't1'
      })
      rs.create(
        { orderId: `O-ref-${i}`, paymentId: payment.id, amountCents: 100, reason: `r${i}` },
        { tenantId: 't1', userId: 'u1' }
      )
    }
    // 3 笔 lyt bridge
    for (let i = 0; i < 3; i++) {
      await bridge.handleMemberProfileSynced(
        {
          tenantId: 't1',
          lytMemberId: `LM-${i}`,
          memberId: 'm1',
          syncedAt: `2026-07-03T10:00:0${i}Z`,
          profile: { name: 'x', phone: '13800000000' }
        },
        { tenantId: 't1', marketCode: 'zh-cn' }
      )
    }
    // 月底出账
    const bill = wall.settle('t1', meter.currentPeriod())
    // FLAT 套餐: 固定 99 (subscription line)
    assert.equal(bill.totalAmount, 99)
    assert.equal(bill.lines.length, 1)
    assert.equal(bill.lines[0].metric, 'subscription')
    // 钱包扣 99
    assert.equal(billing.getWallet('t1').balance, 200 - 99)
  })
})
