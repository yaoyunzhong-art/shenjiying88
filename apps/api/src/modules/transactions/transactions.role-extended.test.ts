import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 扩展角色测试: transactions 模块
 *
 * 4 个深度角色视角：
 * 🛒前台 — 快速收银和多商品交易
 * 🔧安监 — 交易审计和退款审核
 * 🎯运行专员 — 支付回调和超时关单处理
 * 🎮导玩员 — 游戏币充值和轻量交易
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MemberService } from '../member/member.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { CashierService } from '../cashier/cashier.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { TransactionsController } from './transactions.controller'
import { TransactionsService } from './transactions.service'

// ── 角色定义 ──
const ROLES = {
  Reception: '🛒前台',
  Safety: '🔧安监',
  Ops: '🎯运行专员',
  Guide: '🎮导玩员',
}

const TX_TENANT = 't-tx-ext'

function createContext(tenantId = TX_TENANT): RequestTenantContext {
  return { tenantId, brandId: 'b-tx-ext', storeId: 's-tx-ext' }
}

let memberCounter = 0
function uniqueMemberId() {
  return `mem-ext-${++memberCounter}-${Date.now()}`
}

/**
 * 创建完整的测试环境（包含 MemberService / LoyaltyService / CashierService / TransactionsService / Controller）
 */
function createFullEnv(memberIdOverride?: string): {
  controller: TransactionsController
  memberService: MemberService
  loyaltyService: LoyaltyService
  cashierService: CashierService
  service: TransactionsService
  memberId: string
} {
  const memberService = new MemberService()
  const memberId = memberIdOverride ?? uniqueMemberId()
  memberService.register({
    memberId,
    tenantContext: createContext(),
    nickname: `Ext User ${memberId}`,
  })
  const loyaltyService = new LoyaltyService(memberService)
  const cashierService = new CashierService(memberService, loyaltyService)
  const service = new TransactionsService(cashierService, loyaltyService)
  const controller = new TransactionsController(service)
  return { controller, memberService, loyaltyService, cashierService, service, memberId }
}

// ──────────────────────────────────────────────────────────────────────
// 🛒前台 — 快速收银和多商品交易
// ──────────────────────────────────────────────────────────────────────
describe('🛒前台 — 快速收银处理视角', () => {
  it('前台快速收银：创建多金额商品订单并支付', async () => {
    const { controller, memberId } = createFullEnv()

    const result = await controller.startCheckout(createContext(), {
      memberId,
      items: [
        { skuId: 'sku-drink', title: '可乐', quantity: 2, price: 8 },
        { skuId: 'sku-snack', title: '薯片', quantity: 1, price: 15 },
        { skuId: 'sku-ticket', title: '游戏币兑换券', quantity: 1, price: 50 },
      ],
      paymentChannel: 'wechat-pay',
    })

    assert.equal(result.order.items.length, 3)
    assert.equal(result.order.totalAmount, 2 * 8 + 15 + 50)
    assert.ok(result.order.orderId)
    assert.ok(result.payment)
  })

  it('前台处理支付回调确认交易完成', async () => {
    const { controller, memberId } = createFullEnv()

    const created = await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-receipt', quantity: 1, price: 100 }],
      paymentChannel: 'alipay',
      externalPaymentId: 'ext-receipt-001',
    })

    const callback = await controller.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: created.order.orderId,
      orderId: created.order.orderId,
      tenantId: TX_TENANT,
      externalPaymentId: 'ext-receipt-001',
      transactionNo: 'txn-receipt-ok',
    })

    assert.equal(callback.payment?.status, 'SUCCEEDED')
    assert.ok(callback.order)
    assert.equal(callback.order.totalAmount, 100)
  })

  it('前台查询会员所有交易时间线', async () => {
    const { controller, memberId } = createFullEnv()

    // 创建两笔交易
    await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-tl1', quantity: 1, price: 30 }],
      paymentChannel: 'wechat-pay',
    })
    await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-tl2', quantity: 2, price: 25 }],
      paymentChannel: 'alipay',
    })

    const timeline = controller.listMemberTransactions(memberId, createContext())
    assert.equal(timeline.length, 2)
    assert.ok(timeline[0].orderId)
    assert.ok(timeline[1].orderId)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🔧安监 — 交易审计和退款审核
// ──────────────────────────────────────────────────────────────────────
describe('🔧安监 — 交易安全审计视角', () => {
  it('安监查询订单交易详情做安全审计', async () => {
    const { controller, memberId } = createFullEnv()

    const created = await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-safe', quantity: 1, price: 200 }],
      paymentChannel: 'wechat-pay',
      externalPaymentId: 'ext-audit-001',
    })

    // 确认交易成功
    const callback = await controller.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: created.order.orderId,
      orderId: created.order.orderId,
      tenantId: TX_TENANT,
      externalPaymentId: 'ext-audit-001',
      transactionNo: 'txn-audit-ok',
    })
    assert.equal(callback.payment?.status, 'SUCCEEDED')

    // 安监查询完整交易聚合
    const aggregate = await controller.getOrderTransaction(created.order.orderId, createContext())
    assert.equal(aggregate.order.totalAmount, 200)
    assert.ok(aggregate.payment)
  })

  it('安监创建退款请求（退款审核流程）', async () => {
    const { controller, memberId } = createFullEnv()

    const created = await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-refund', quantity: 1, price: 150 }],
      paymentChannel: 'wechat-pay',
      externalPaymentId: 'ext-refund-001',
    })

    await controller.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: created.order.orderId,
      orderId: created.order.orderId,
      tenantId: TX_TENANT,
      externalPaymentId: 'ext-refund-001',
      transactionNo: 'txn-refund-ok',
    })

    // 发起退款（返回 TransactionAggregate，退款 ID 在 aggregate.refunds 中）
    const refundAggregate = await controller.requestRefund(created.order.orderId, createContext(), {
      reason: '商品质量问题',
      refundAmount: 150,
    })
    assert.ok(refundAggregate.refunds.length > 0)
    const refundRecord = refundAggregate.refunds[0]
    assert.ok(refundRecord.refundId)
    assert.equal(refundRecord.refundAmount, 150)
    assert.equal(refundRecord.reason, '商品质量问题')

    // 安监审批退款
    const approvedAggregate = await controller.approveRefund(refundRecord.refundId, createContext(), {
      note: '审核通过，全额退款',
    })
    assert.ok(approvedAggregate)
    assert.ok(approvedAggregate.refunds.length > 0)
    const approvedRefund = approvedAggregate.refunds.find((r: any) => r.refundId === refundRecord.refundId)
    assert.ok(approvedRefund, '已审批的退款应在聚合结果中')
    assert.equal(approvedRefund.status, 'COMPLETED')
  })

  it('安监查询不存在订单应抛异常（审计边界检查）', async () => {
    const { controller } = createFullEnv()

    await assert.rejects(
      () => controller.getOrderTransaction('non-existent-order-id', createContext()),
      /not found/
    )
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🎯运行专员 — 支付回调和超时关单处理
// ──────────────────────────────────────────────────────────────────────
describe('🎯运行专员 — 支付回调和关单处理视角', () => {
  it('运行专员处理支付成功回调更新订单状态', async () => {
    const { controller, memberId } = createFullEnv()

    const created = await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-op-success', quantity: 1, price: 300 }],
      paymentChannel: 'bank-transfer',
      externalPaymentId: 'ext-ops-success-001',
    })

    const callback = await controller.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: created.order.orderId,
      orderId: created.order.orderId,
      tenantId: TX_TENANT,
      externalPaymentId: 'ext-ops-success-001',
      transactionNo: 'txn-ops-success',
    })

    assert.equal(callback.payment?.status, 'SUCCEEDED')
    assert.ok(callback.pointsLedger.length >= 1)
  })

  it('运行专员处理支付失败回调闭环', async () => {
    const { controller, memberId } = createFullEnv()

    const created = await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-op-fail', quantity: 1, price: 180 }],
      paymentChannel: 'card',
      externalPaymentId: 'ext-ops-fail-001',
    })

    const callback = await controller.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-failed',
      aggregateId: created.order.orderId,
      orderId: created.order.orderId,
      tenantId: TX_TENANT,
      externalPaymentId: 'ext-ops-fail-001',
      transactionNo: 'txn-ops-fail',
    })

    assert.equal(callback.payment?.status, 'FAILED')
  })

  it('运行专员执行超时关单（订单超过支付时限自动关闭）', async () => {
    const { controller, memberId } = createFullEnv()

    const created = await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-timeout', quantity: 1, price: 250 }],
      paymentChannel: 'wechat-pay',
      externalPaymentId: 'ext-timeout-001',
    })

    // 超时关单
    const closed = await controller.timeoutCloseOrder(created.order.orderId, createContext(), {
      reason: '支付超时自动关闭',
    })
    assert.ok(closed.order)
    // timeoutCloseOrder 会标记订单状态
    assert.ok(closed.order.orderId)

    // 超时后尝试支付应失败或报错
    await assert.rejects(
      controller.applyPaymentCallback({
        standardizedEventName: 'cashier.payment-succeeded',
        aggregateId: created.order.orderId,
        orderId: created.order.orderId,
        tenantId: TX_TENANT,
        externalPaymentId: 'ext-timeout-001',
        transactionNo: 'txn-timeout',
      }),
    )
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🎮导玩员 — 游戏币充值和轻量交易
// ──────────────────────────────────────────────────────────────────────
describe('🎮导玩员 — 游戏币充值交易视角', () => {
  it('导玩员为玩家创建游戏币购买交易', async () => {
    const { controller, memberId } = createFullEnv()

    const result = await controller.startCheckout(createContext(), {
      memberId,
      items: [
        { skuId: 'sku-coins-50', title: '游戏币x50', quantity: 1, price: 50 },
        { skuId: 'sku-coins-100', title: '游戏币x100', quantity: 2, price: 90 },
      ],
      paymentChannel: 'wechat-pay',
    })

    assert.equal(result.order.items.length, 2)
    assert.equal(result.order.totalAmount, 50 + 2 * 90)
    assert.ok(result.order.orderId)
  })

  it('导玩员创建含优惠码的会员充值', async () => {
    const { controller, memberId } = createFullEnv()

    const result = await controller.startCheckout(createContext(), {
      memberId,
      items: [
        { skuId: 'sku-vip-month', title: 'SVIP 月卡', quantity: 1, price: 199 },
      ],
      paymentChannel: 'alipay',
      couponCode: 'VIPFIRST',
    })

    assert.equal(result.order.couponCode, 'VIPFIRST')
    assert.equal(result.order.totalAmount, 199)
    assert.ok(result.order.orderId)
  })

  it('导玩员尝试无效会员交易应被拒绝（边界校验）', async () => {
    const memberService = new MemberService()
    const loyaltyService = new LoyaltyService(memberService)
    const cashierService = new CashierService(memberService, loyaltyService)
    const service = new TransactionsService(cashierService, loyaltyService)
    const controller = new TransactionsController(service)

    // 不存在会员的交易
    await assert.rejects(
      controller.startCheckout(createContext(), {
        memberId: 'totally-invalid-member-id',
        items: [{ skuId: 'sku-test', quantity: 1, price: 10 }],
        paymentChannel: 'wechat-pay',
      }),
      /not found/
    )
  })
})
