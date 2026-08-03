import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { CashierController } from './cashier.controller'
import { CashierService } from './cashier.service'
import { InventoryItemService } from '../inventory/inventory-item.service'
import { MemberService, resetMemberServiceTestState } from '../member/member.service'
import type { Order, Payment, Refund, CreateOrderInput, CreatePaymentInput, CreateRefundInput, OrderItem } from '@m5/types'

// ── Mock helpers (reuse pattern from cashier.controller.test.ts) ──

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
    id: 'ORD-20260719-00001', tenantId: '', memberId: null,
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
      id: 'ORD-20260719-00001',
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
    id: 'PAY-20260719-00001', tenantId: '', orderId: '',
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
      id: 'PAY-20260719-00001',
      status: 'PENDING',
      orderId: input.orderId,
      method: input.method,
      amountCents: input.amountCents,
      idempotencyKey: `${input.orderId}-${input.method}`
    }),
    confirm: (providerTxnId) => ({ ...makeBasePayment(), id: 'PAY-20260719-00001', status: 'SUCCESS' as const, providerTxnId })
  }
}
function makeBaseRefund(): Refund {
  return {
    id: 'RFD-20260719-00001', tenantId: '', orderId: '', paymentId: '',
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
      id: 'RFD-20260719-00001',
      status: 'PENDING',
      orderId: input.orderId,
      paymentId: input.paymentId,
      amountCents: input.amountCents,
      reason: input.reason
    }),
    getById: (id) => ({ ...makeBaseRefund(), id, status: 'PENDING' as const })
  }
}

const TENANT_ID = 't-cashier-mem-001'

class TestHarness {
  readonly memberService: MemberService
  readonly inventoryItemService: InventoryItemService
  readonly cashierService: CashierService
  readonly controller: CashierController

  constructor() {
    this.memberService = new MemberService()
    this.inventoryItemService = new InventoryItemService()
    this.cashierService = new CashierService(this.memberService)
    this.controller = new CashierController(
      makeMockOrderService() as never,
      makeMockPaymentService() as never,
      makeMockRefundService() as never,
      this.cashierService,
      this.inventoryItemService
    )
  }

  addTestMember(overrides?: Partial<{
    memberId: string
    mobile: string
    nickname: string
    points: number
  }>): void {
    const mid = overrides?.memberId ?? 'mem-test-001'
    this.memberService.register({
      memberId: mid,
      tenantContext: { tenantId: TENANT_ID, brandId: undefined, storeId: undefined, marketCode: undefined },
      nickname: overrides?.nickname ?? '测试会员'
    })
    if (overrides?.points) {
      this.memberService.addPoints(mid, overrides.points)
    }
  }
}

// ═══════════════════════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════════════════════

describe('CashierController.lookupMember — POS 会员查询', () => {
  beforeEach(() => {
    resetMemberServiceTestState()
  })

  it('正例: 按 memberId 查询到会员', async () => {
    const h = new TestHarness()
    h.addTestMember({ memberId: 'mem-zhang-001', nickname: '张三', points: 1500 })

    const result = await h.controller.lookupMember(TENANT_ID, 'mem-zhang-001')

    assert.ok(result, '应返回会员对象')
    assert.equal(result!.id, 'mem-zhang-001')
    assert.equal(result!.name, '张三')
    assert.equal(result!.points, 1500)
  })

  it('反例: 未找到会员返回 null', async () => {
    const h = new TestHarness()

    const result = await h.controller.lookupMember(TENANT_ID, 'nonexistent-member')
    assert.equal(result, null)
  })

  it('边界: 空查询返回 null', async () => {
    const h = new TestHarness()

    const result = await h.controller.lookupMember(TENANT_ID, '')
    assert.equal(result, null)
  })
})
