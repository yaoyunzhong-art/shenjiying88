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
    id: 'ORD-20260719-00002', tenantId: '', memberId: null,
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
      id: 'ORD-20260719-00002',
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
    id: 'PAY-20260719-00002', tenantId: '', orderId: '',
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
      id: 'PAY-20260719-00002',
      status: 'PENDING',
      orderId: input.orderId,
      method: input.method,
      amountCents: input.amountCents,
      idempotencyKey: `${input.orderId}-${input.method}`
    }),
    confirm: (providerTxnId) => ({ ...makeBasePayment(), id: 'PAY-20260719-00002', status: 'SUCCESS' as const, providerTxnId })
  }
}
function makeBaseRefund(): Refund {
  return {
    id: 'RFD-20260719-00002', tenantId: '', orderId: '', paymentId: '',
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
      id: 'RFD-20260719-00002',
      status: 'PENDING',
      orderId: input.orderId,
      paymentId: input.paymentId,
      amountCents: input.amountCents,
      reason: input.reason
    }),
    getById: (id) => ({ ...makeBaseRefund(), id, status: 'PENDING' as const })
  }
}

const TENANT_ID = 't-cashier-prod-001'

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

  addInventoryItem(sku: string, name: string, priceCents: number, tenantId: string = TENANT_ID): void {
    this.inventoryItemService.create({
      tenantId,
      sku,
      name,
      totalQty: 100,
      unitPriceCents: priceCents,
      lowStockThreshold: 10
    })
  }
}

// ═══════════════════════════════════════════════════════════════
//  Tests
// ═══════════════════════════════════════════════════════════════

describe('CashierController.lookupProduct — POS 商品扫码查询', () => {
  beforeEach(() => {
    resetMemberServiceTestState()
  })

  it('正例: 通过 SKU 查到真实库存商品', async () => {
    const h = new TestHarness()
    h.addInventoryItem('SKU-TEST-A', '测试商品A', 12900)

    const result = await h.controller.lookupProduct(TENANT_ID, 'SKU-TEST-A')

    assert.ok(result, '应返回商品对象')
    assert.equal(result!.sku, 'SKU-TEST-A')
    assert.equal(result!.name, '测试商品A')
    assert.equal(result!.price, 129)
  })

  it('反例: SKU 不存在返回 null', async () => {
    const h = new TestHarness()

    const result = await h.controller.lookupProduct(TENANT_ID, 'NONEXISTENT-SKU')
    assert.equal(result, null)
  })

  it('正例: 不存在的 SKU 回落 mock 商品', async () => {
    const h = new TestHarness()

    const result = await h.controller.lookupProduct(TENANT_ID, 'SKU-001')

    // SKU-001 是内置 mock 商品
    assert.ok(result, '应返回 mock 商品对象')
    assert.equal(result!.sku, 'SKU-001')
    assert.equal(result!.name, '经典T恤')
    assert.equal(result!.price, 129)
  })
})
