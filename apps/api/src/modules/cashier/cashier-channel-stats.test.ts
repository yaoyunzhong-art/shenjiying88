import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CashierController } from './cashier.controller'
import { CashierService } from './cashier.service'
import { MemberService, resetMemberServiceTestState } from '../member/member.service'
import { InventoryItemService } from '../inventory/inventory-item.service'
import type { Order, Payment, Refund, CreateOrderInput, CreatePaymentInput, CreateRefundInput, OrderItem } from '@m5/types'

// ── Mock helpers ──

interface MockOrderService {
  create: (input: CreateOrderInput, context: Record<string, string>) => Order
  submit: (id: string, tenantId: string) => Order
  cancel: (id: string, tenantId: string, reason: string) => Order
  fulfill: (id: string, tenantId: string) => Order
  getById: (id: string, tenantId: string) => Order | undefined
  getItems: (id: string, tenantId: string) => OrderItem[]
  list: (filter: Record<string, unknown>, tenantId: string) => { items: Order[]; total: number }
}
interface MockPaymentService {
  create: (input: CreatePaymentInput, context: Record<string, string>) => Payment
  confirm: (providerTxnId: string, tenantId: string) => Payment
}
interface MockRefundService {
  create: (input: CreateRefundInput, context: Record<string, string>) => Refund
  getById: (id: string, tenantId: string) => Refund | undefined
}

function makeBaseOrder(): Order {
  return {
    id: 'ORD-20260719-00003', tenantId: '', memberId: null,
    status: 'DRAFT', subtotalCents: 0, discountCents: 0, taxCents: 0,
    totalCents: 0, paidCents: 0, refundedCents: 0,
    paymentMethod: null, createdBy: '', clientOrderId: '',
    version: 1, metadata: {},
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    paidAt: null, closedAt: null
  }
}
function makeMockOrderService(): MockOrderService {
  return {
    create: (input, context) => ({
      ...makeBaseOrder(),
      id: 'ORD-20260719-00003',
      status: 'DRAFT',
      clientOrderId: input.clientOrderId,
      memberId: input.memberId ?? null,
      tenantId: context.tenantId
    }),
    submit: (id, tenantId) => ({ ...makeBaseOrder(), id, status: 'PENDING' as const, tenantId }),
    cancel: (id, tenantId, _reason) => ({ ...makeBaseOrder(), id, status: 'CANCELED' as const, closedAt: new Date().toISOString() }),
    fulfill: (id, tenantId) => ({ ...makeBaseOrder(), id, status: 'FULFILLED' as const }),
    getById: (id, tenantId) => ({ ...makeBaseOrder(), id, status: 'PENDING' as const, tenantId }),
    getItems: (_id, tenantId) => ([{
      id: 'OIT-001', orderId: _id, tenantId, productId: 'sku-1',
      productName: 'Product 1', unitPriceCents: 500, quantity: 2,
      subtotalCents: 1000, discountCents: 0, createdAt: new Date().toISOString()
    }]),
    list: () => ({ items: [], total: 0 })
  }
}
function makeBasePayment(): Payment {
  return {
    id: 'PAY-20260719-00003', tenantId: '', orderId: '',
    method: 'WECHAT', amountCents: 0, status: 'PENDING',
    providerTxnId: null, idempotencyKey: '',
    paidAt: null, failureReason: null,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  }
}
function makeMockPaymentService(): MockPaymentService {
  return {
    create: (input) => ({
      ...makeBasePayment(),
      id: 'PAY-20260719-00003',
      status: 'PENDING',
      orderId: input.orderId,
      method: input.method,
      amountCents: input.amountCents,
      idempotencyKey: `${input.orderId}-${input.method}`
    }),
    confirm: (providerTxnId) => ({ ...makeBasePayment(), id: 'PAY-20260719-00003', status: 'SUCCESS' as const, providerTxnId })
  }
}
function makeBaseRefund(): Refund {
  return {
    id: 'RFD-20260719-00003', tenantId: '', orderId: '', paymentId: '',
    amountCents: 0, reason: '', reasonHash: '', status: 'PENDING',
    providerRefundId: null, idempotencyKey: '',
    refundedAt: null, failureReason: null, createdBy: '',
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
  }
}
function makeMockRefundService(): MockRefundService {
  return {
    create: (input) => ({
      ...makeBaseRefund(),
      id: 'RFD-20260719-00003',
      status: 'PENDING',
      orderId: input.orderId,
      paymentId: input.paymentId,
      amountCents: input.amountCents,
      reason: input.reason
    }),
    getById: (id) => ({ ...makeBaseRefund(), id, status: 'PENDING' as const })
  }
}

const TENANT_ID = 't-cashier-stats-001'

class TestHarness {
  readonly controller: CashierController

  constructor() {
    const memberService = new MemberService()
    const inventoryItemService = new InventoryItemService()
    const cashierService = new CashierService(memberService)
    this.controller = new CashierController(
      makeMockOrderService() as never,
      makeMockPaymentService() as never,
      makeMockRefundService() as never,
      cashierService,
      inventoryItemService
    )
  }
}

// ═══════════════════════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════════════════════

describe('CashierController.getChannelStats — POS 支付渠道统计', () => {
  beforeEach(() => {
    resetMemberServiceTestState()
  })

  it('正例: 返回包含 4 个渠道的统计数组', async () => {
    const h = new TestHarness()

    const result = await h.controller.getChannelStats(TENANT_ID)

    assert.ok(Array.isArray(result), '应返回数组')
    assert.equal(result.length, 4)
  })

  it('正例: 每个渠道包含 channel/today/month 字段', async () => {
    const h = new TestHarness()

    const result = await h.controller.getChannelStats(TENANT_ID)

    for (const entry of result) {
      assert.ok(typeof entry.channel === 'string' && entry.channel.length > 0, `channel 应有值: ${entry.channel}`)
      assert.ok(typeof entry.today === 'number' && entry.today > 0, `today 应 > 0: ${entry.channel}: ${entry.today}`)
      assert.ok(typeof entry.month === 'number' && entry.month > 0, `month 应 > 0: ${entry.channel}: ${entry.month}`)
    }
  })

  it('正例: 渠道名称应为 WECHAT/ALIPAY/CASH/CARD', async () => {
    const h = new TestHarness()

    const result = await h.controller.getChannelStats(TENANT_ID)
    const channels = result.map((r) => r.channel).sort()

    assert.deepEqual(channels, ['ALIPAY', 'CARD', 'CASH', 'WECHAT'])
  })
})
