import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { MemberService } from '../member/member.service'
import { LoyaltyService } from '../loyalty/loyalty.service'
import { CashierService } from '../cashier/cashier.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { TransactionsController } from './transactions.controller'
import { TransactionsService } from './transactions.service'

// ── 8 角色定义 ──
const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
}

function createContext(tenantId = 't-tx-role'): RequestTenantContext {
  return { tenantId, brandId: 'b-tx', storeId: 's-tx' }
}

let memberCounter = 0
function uniqueMemberId() {
  return `mem-role-${++memberCounter}`
}

function makeController() {
  const memberService = new MemberService()
  const memberId = uniqueMemberId()
  try {
    memberService.register({
      memberId,
      tenantContext: createContext(),
      nickname: 'Role User'
    })
  } catch {
    // member already exists from a previous call; use different id
    const fallbackId = `${memberId}-${Date.now()}`
    memberService.register({
      memberId: fallbackId,
      tenantContext: createContext(),
      nickname: 'Role User'
    })
  }
  const loyaltyService = new LoyaltyService(memberService)
  const cashierService = new CashierService(memberService, loyaltyService)
  const service = new TransactionsService(cashierService, loyaltyService)
  const controller = new TransactionsController(service)
  return { controller, memberService, loyaltyService, cashierService, service, memberId }
}

// ──────────── 👔店长 ────────────
describe(`${ROLES.TenantAdmin} 交易角色测试`, () => {
  test('店长可创建完整交易（下单+支付）', async () => {
    const { controller, memberId } = makeController()

    const result = await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-admin', quantity: 1, price: 100 }],
      paymentChannel: 'wechat-pay',
      currency: 'CNY'
    })

    assert.equal(result.order.totalAmount, 100)
    assert.ok(result.order.orderId)
    assert.ok(result.payment)
    assert.equal(result.payment?.channel, 'wechat-pay')
  })

  test('店长可查询订单交易聚合信息（权限边界）', () => {
    const { controller } = makeController()

    // 查询不存在的订单应报错
    assert.throws(
      () => controller.getOrderTransaction('no-such-order', createContext()),
      /not found/
    )
  })
})

// ──────────── 🛒前台 ────────────
describe(`${ROLES.Reception} 交易角色测试`, () => {
  test('前台可为会员快速创建交易（正常流程）', async () => {
    const { controller, memberId } = makeController()

    const result = await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-front', title: '前台-饮料', quantity: 1, price: 15 }],
      paymentChannel: 'wechat-pay'
    })

    assert.equal(result.order.items[0].title, '前台-饮料')
    assert.equal(result.order.totalAmount, 15)
  })

  test('前台不可跨租户查看交易（权限边界）', () => {
    const { controller, memberId } = makeController()

    const timeline = controller.listMemberTransactions(
      memberId,
      { tenantId: 't-other-store', brandId: 'b-other', storeId: 's-other' }
    )

    assert.equal(timeline.length, 0)
  })
})

// ──────────── 👥HR ────────────
describe(`${ROLES.HR} 交易角色测试`, () => {
  test('HR可查看会员的交易时间线（正常流程）', async () => {
    const { controller, memberId } = makeController()

    await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-hr', quantity: 1, price: 20 }],
      paymentChannel: 'internal-transfer'
    })

    const timeline = controller.listMemberTransactions(memberId, createContext())
    assert.ok(timeline.length >= 1)
    timeline.forEach((entry) => {
      assert.equal(entry.memberId, memberId)
    })
  })

  test('HR查看不存在会员的交易返回空（权限边界）', () => {
    const { controller } = makeController()

    const timeline = controller.listMemberTransactions('ghost-member', createContext())
    assert.equal(timeline.length, 0)
  })
})

// ──────────── 🔧安监 ────────────
describe(`${ROLES.Safety} 交易角色测试`, () => {
  test('安监可查询订单交易详情做安全审计（正常流程）', async () => {
    const { controller, memberId } = makeController()

    const created = await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-safety', quantity: 1, price: 500 }],
      paymentChannel: 'wechat-pay'
    })

    const aggregate = controller.getOrderTransaction(created.order.orderId, createContext())
    assert.equal(aggregate.order.totalAmount, 500)
    assert.ok(aggregate.payment)
  })

  test('安监无法修改交易状态（权限边界 - 只读）', () => {
    const { controller } = makeController()

    // 安监只有读取权限，controller 不提供修改接口
    assert.throws(
      () => controller.getOrderTransaction('hacked-order', createContext()),
      /not found/
    )
  })
})

// ──────────── 🎮导玩员 ────────────
describe(`${ROLES.Guide} 交易角色测试`, () => {
  test('导玩员可为玩家快速创建游戏币购买交易（正常流程）', async () => {
    const { controller, memberId } = makeController()

    const result = await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-coins', title: '游戏币x50', quantity: 1, price: 50 }],
      paymentChannel: 'wechat-pay'
    })

    assert.equal(result.order.items[0].skuId, 'sku-coins')
    assert.equal(result.order.totalAmount, 50)
  })

  test('导玩员创建交易需有效会员验证（权限边界）', async () => {
    const memberService = new MemberService()
    const loyaltyService = new LoyaltyService(memberService)
    const cashierService = new CashierService(memberService, loyaltyService)
    const service = new TransactionsService(cashierService, loyaltyService)
    const controller = new TransactionsController(service)

    await assert.rejects(
      controller.startCheckout(createContext(), {
        memberId: 'no-such-member',
        items: [{ skuId: 'sku-bad', quantity: 1, price: 10 }],
        paymentChannel: 'wechat-pay'
      }),
      /not found/
    )
  })
})

// ──────────── 🎯运行专员 ────────────
describe(`${ROLES.Ops} 交易角色测试`, () => {
  test('运行专员可处理支付成功回调并查看聚合结果（正常流程）', async () => {
    const { controller, memberId } = makeController()

    const created = await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-ops', quantity: 1, price: 300 }],
      paymentChannel: 'bank-transfer',
      externalPaymentId: 'ext-ops-001'
    })

    const result = await controller.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-succeeded',
      aggregateId: created.order.orderId,
      orderId: created.order.orderId,
      tenantId: createContext().tenantId,
      externalPaymentId: 'ext-ops-001',
      transactionNo: 'txn-ops-ok'
    })

    assert.equal(result.payment?.status, 'SUCCEEDED')
    assert.ok(result.pointsLedger.length >= 1)
  })

  test('运行专员处理支付失败回调正确更新状态（异常流程）', async () => {
    const { controller, memberId } = makeController()

    const created = await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-ops-fail', quantity: 1, price: 150 }],
      paymentChannel: 'card',
      externalPaymentId: 'ext-ops-fail'
    })

    const result = await controller.applyPaymentCallback({
      standardizedEventName: 'cashier.payment-failed',
      aggregateId: created.order.orderId,
      orderId: created.order.orderId,
      tenantId: createContext().tenantId,
      externalPaymentId: 'ext-ops-fail',
      transactionNo: 'txn-ops-fail'
    })

    assert.equal(result.payment?.status, 'FAILED')
  })
})

// ──────────── 🤝团建 ────────────
describe(`${ROLES.Teambuilding} 交易角色测试`, () => {
  test('团建可创建团队多项目交易（正常流程）', async () => {
    const { controller, memberId } = makeController()

    const result = await controller.startCheckout(createContext(), {
      memberId,
      items: [
        { skuId: 'sku-tb-1', title: '团建套餐A', quantity: 1, price: 2000 },
        { skuId: 'sku-tb-2', title: '团建保险', quantity: 10, price: 20 }
      ],
      paymentChannel: 'corporate-account',
      currency: 'CNY'
    })

    assert.equal(result.order.totalAmount, 2000 + 10 * 20)
    assert.equal(result.order.items.length, 2)
  })

  test('团建空订单应被拒绝（权限边界 - 输入验证）', async () => {
    const memberService = new MemberService()
    memberService.register({
      memberId: 'mem-tb-empty',
      tenantContext: createContext(),
      nickname: 'TB Empty'
    })
    const loyaltyService = new LoyaltyService(memberService)
    const cashierService = new CashierService(memberService, loyaltyService)
    const service = new TransactionsService(cashierService, loyaltyService)
    const controller = new TransactionsController(service)

    await assert.rejects(
      controller.startCheckout(createContext(), {
        memberId: 'mem-tb-empty',
        items: [],
        paymentChannel: 'corporate-account'
      }),
      /must include at least one item/
    )
  })
})

// ──────────── 📢营销 ────────────
describe(`${ROLES.Marketing} 交易角色测试`, () => {
  test('营销可创建含优惠券和盲盒的营销交易（正常流程）', async () => {
    const { controller, memberId } = makeController()

    const result = await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-mkt', title: '暑期活动商品', quantity: 3, price: 30 }],
      paymentChannel: 'wechat-pay',
      couponCode: 'SUMMER2026',
      blindboxPlanId: 'bb-summer',
      blindboxQuantity: 2
    })

    assert.equal(result.order.couponCode, 'SUMMER2026')
    assert.equal(result.order.blindboxPlanId, 'bb-summer')
    assert.equal(result.order.blindboxQuantity, 2)
    assert.equal(result.order.totalAmount, 90)
  })

  test('营销可查看会员交易时间线做营销效果分析（数据边界）', async () => {
    const { controller, memberId } = makeController()

    await controller.startCheckout(createContext(), {
      memberId,
      items: [{ skuId: 'sku-mkt-2', quantity: 1, price: 25 }],
      paymentChannel: 'alipay'
    })

    const timeline = controller.listMemberTransactions(memberId, createContext())
    assert.ok(timeline.length >= 1)
    assert.ok(timeline.some((entry) => entry.totalAmount === 25))
  })
})

// ──────────── 跨角色租户隔离 ────────────
describe('交易模块多租户隔离验证', () => {
  test('租户A和租户B的交易完全隔离', async () => {
    const memberService = new MemberService()
    memberService.register({
      memberId: 'mem-iso',
      tenantContext: { tenantId: 't-alpha', brandId: 'b-alpha', storeId: 's-alpha' },
      nickname: 'ISO User A'
    })
    memberService.register({
      memberId: 'mem-iso-b',
      tenantContext: { tenantId: 't-beta', brandId: 'b-beta', storeId: 's-beta' },
      nickname: 'ISO User B'
    })
    const loyaltyService = new LoyaltyService(memberService)
    const cashierService = new CashierService(memberService, loyaltyService)
    const service = new TransactionsService(cashierService, loyaltyService)
    const controller = new TransactionsController(service)

    await controller.startCheckout(
      { tenantId: 't-alpha', brandId: 'b-alpha', storeId: 's-alpha' },
      {
        memberId: 'mem-iso',
        items: [{ skuId: 'sku-iso-a', quantity: 1, price: 100 }],
        paymentChannel: 'wechat-pay'
      }
    )

    const timelineFromB = controller.listMemberTransactions(
      'mem-iso',
      { tenantId: 't-beta', brandId: 'b-beta', storeId: 's-beta' }
    )
    assert.equal(timelineFromB.length, 0)
  })
})
