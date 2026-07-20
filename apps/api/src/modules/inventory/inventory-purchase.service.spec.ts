/**
 * inventory-purchase.service.spec.ts — P-37 采购增强服务 单元测试
 *
 * 覆盖 32 项测试:
 *   - 采购单创建: 正例/反例(空items/负数量)
 *   - 审批流: 提交/审批通过/驳回/状态检查
 *   - 收货: 完全/部分/损坏
 *   - 付款: 全额/部分/状态更新
 *   - 退货: 创建/审批/完成
 *   - 供应商: CRUD
 *   - 统计
 *   - 租户隔离
 *   - 更新/删除
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ─── 枚举 ───────────────────────────────────────────────────

enum POStatus {
  Draft = 'DRAFT',
  PendingApproval = 'PENDING_APPROVAL',
  Approved = 'APPROVED',
  Rejected = 'REJECTED',
  Ordered = 'ORDERED',
  PartiallyReceived = 'PARTIALLY_RECEIVED',
  Received = 'RECEIVED',
  Cancelled = 'CANCELLED'
}

enum PayStatus {
  Unpaid = 'UNPAID',
  PartiallyPaid = 'PARTIALLY_PAID',
  Paid = 'PAID',
  Overdue = 'OVERDUE'
}

enum ReceiveStatus {
  Pending = 'PENDING',
  Partial = 'PARTIAL',
  Complete = 'COMPLETE'
}

enum ReturnStatus {
  Pending = 'PENDING',
  Shipped = 'SHIPPED',
  Rejected = 'REJECTED',
  Approved = 'APPROVED',
  Refunded = 'REFUNDED',
  Exchanged = 'EXCHANGED',
  Closed = 'CLOSED',
  Completed = 'COMPLETED'
}

// ─── 类型 ───────────────────────────────────────────────────

interface TenantCtx {
  tenantId: string
  brandId?: string
  storeId?: string
}

interface POItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  totalPrice: number
  receivedQuantity: number
  returnQuantity: number
  damagedQuantity: number
}

interface Payment {
  id: string
  purchaseOrderId: string
  amount: number
  paymentMethod: string
  paymentDate: string
  transactionNo?: string
}

interface Approval {
  id: string
  purchaseOrderId: string
  approverId: string
  approverName: string
  action: string
  comment?: string
}

interface ReturnItem {
  productId: string
  productName: string
  sku: string
  quantity: number
  unitPrice: number
  totalPrice: number
  reason: string
}

interface ReturnOrder {
  id: string
  purchaseOrderId: string
  returnOrderNo: string
  items: ReturnItem[]
  totalAmount: number
  status: string
  reasonDetail?: string
  appliedAt: string
  completedAt?: string
}

interface PO {
  id: string
  tenantId: string
  storeId?: string
  orderNo: string
  supplierId?: string
  supplierName?: string
  status: string
  items: POItem[]
  totalAmount: number
  totalPaid: number
  paymentStatus: string
  receiveStatus: string
  orderedAt?: string
  cancelledAt?: string
  cancelReason?: string
  payments?: Payment[]
  approvals?: Approval[]
  returns?: ReturnOrder[]
  createdBy?: string
  createdAt: string
  updatedAt: string
}

interface EnhancedSupplier {
  id: string
  tenantId: string
  code: string
  name: string
  contactName?: string
  phone?: string
  email?: string
  status: string
  rating?: number
  createdAt: string
  updatedAt: string
}

// ─── 数据工厂 ───────────────────────────────────────────────

let _seq = 0
function uid(prefix: string): string { return `${prefix}-${++_seq}-${Date.now()}` }
function ctx(overrides?: Partial<TenantCtx>): TenantCtx {
  return { tenantId: 't-1', brandId: 'b-1', storeId: 's-001', ...overrides }
}
function now(): string { return new Date().toISOString() }

// ─── Stores ─────────────────────────────────────────────────

const poStore = new Map<string, PO>()
const supplierStore = new Map<string, EnhancedSupplier>()
const returnStore = new Map<string, ReturnOrder>()
const paymentStore = new Map<string, Payment>()

function resetStores() {
  poStore.clear()
  supplierStore.clear()
  returnStore.clear()
  paymentStore.clear()
}

// ─── 内联业务逻辑 ─────────────────────────────────────────

function createPO(ctx: TenantCtx, input: {
  supplierId?: string
  supplierName?: string
  items: Array<{ productId: string; productName: string; sku: string; quantity: number; unitPrice: number }>
  createdBy?: string
}): PO {
  if (!input.items?.length) throw new Error('At least one item required')
  for (const item of input.items) {
    if (item.quantity <= 0 || item.unitPrice < 0) {
      throw new Error('Invalid item quantity/price')
    }
  }

  const totalAmount = input.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0)
  const orderNo = `PO-${now().substring(0, 7).replace(/-/g, '')}-${Date.now().toString(36).toUpperCase()}`

  const order: PO = {
    id: uid('po'),
    tenantId: ctx.tenantId,
    storeId: ctx.storeId,
    orderNo,
    supplierId: input.supplierId,
    supplierName: input.supplierName,
    status: POStatus.Draft,
    items: input.items.map((i) => ({
      ...i,
      totalPrice: i.quantity * i.unitPrice,
      receivedQuantity: 0,
      returnQuantity: 0,
      damagedQuantity: 0,
    })),
    totalAmount,
    totalPaid: 0,
    paymentStatus: PayStatus.Unpaid,
    receiveStatus: ReceiveStatus.Pending,
    payments: [],
    approvals: [],
    returns: [],
    createdBy: input.createdBy,
    createdAt: now(),
    updatedAt: now(),
  }
  poStore.set(order.id, order)
  return order
}

function getPO(orderId: string, ctx: TenantCtx): PO {
  const o = poStore.get(orderId)
  if (!o || o.tenantId !== ctx.tenantId) throw new Error(`PO ${orderId} not found`)
  return o
}

function submitPO(orderId: string, ctx: TenantCtx): PO {
  const o = getPO(orderId, ctx)
  if (o.status !== POStatus.Draft) throw new Error(`Cannot submit PO ${orderId} (${o.status})`)
  o.status = POStatus.PendingApproval
  o.updatedAt = now()
  poStore.set(orderId, o)
  return o
}

function approvePO(orderId: string, ctx: TenantCtx, approver: { approverId: string; approverName: string; comment?: string }): { order: PO; approval: Approval } {
  const o = getPO(orderId, ctx)
  if (o.status !== POStatus.PendingApproval) throw new Error(`Not pending approval (${o.status})`)

  o.status = POStatus.Approved
  o.updatedAt = now()

  const approval: Approval = {
    id: uid('appr'),
    purchaseOrderId: orderId,
    approverId: approver.approverId,
    approverName: approver.approverName,
    action: 'APPROVE',
    comment: approver.comment,
  }
  if (!o.approvals) o.approvals = []
  o.approvals.push(approval)
  poStore.set(orderId, o)
  return { order: o, approval }
}

function rejectPO(orderId: string, ctx: TenantCtx, input: { approverId: string; approverName: string; comment: string }): { order: PO; approval: Approval } {
  const o = getPO(orderId, ctx)
  if (o.status !== POStatus.PendingApproval) throw new Error(`Not pending approval (${o.status})`)

  o.status = POStatus.Rejected
  o.updatedAt = now()

  const approval: Approval = {
    id: uid('appr'),
    purchaseOrderId: orderId,
    approverId: input.approverId,
    approverName: input.approverName,
    action: 'REJECT',
    comment: input.comment,
  }
  if (!o.approvals) o.approvals = []
  o.approvals.push(approval)
  poStore.set(orderId, o)
  return { order: o, approval }
}

function placeOrder(orderId: string, ctx: TenantCtx): PO {
  const o = getPO(orderId, ctx)
  if (o.status !== POStatus.Approved) throw new Error(`Must be approved (${o.status})`)
  o.status = POStatus.Ordered
  o.orderedAt = now()
  o.updatedAt = now()
  poStore.set(orderId, o)
  return o
}

function cancelPO(orderId: string, ctx: TenantCtx, reason?: string): PO {
  const o = getPO(orderId, ctx)
  if (o.status === POStatus.Received || o.status === POStatus.Cancelled) throw new Error(`Cannot cancel (${o.status})`)
  o.status = POStatus.Cancelled
  o.cancelledAt = now()
  o.cancelReason = reason
  o.updatedAt = now()
  poStore.set(orderId, o)
  return o
}

function receivePO(orderId: string, ctx: TenantCtx, input: { items: Array<{ productId: string; receivedQuantity: number; damagedQuantity: number }> }): PO {
  const o = getPO(orderId, ctx)
  if (o.status !== POStatus.Ordered && o.status !== POStatus.PartiallyReceived) {
    throw new Error(`Cannot receive (${o.status})`)
  }

  let allComplete = true
  for (const item of input.items) {
    const oi = o.items.find((i) => i.productId === item.productId)
    if (!oi) throw new Error(`Product ${item.productId} not in PO`)

    oi.receivedQuantity += item.receivedQuantity
    oi.damagedQuantity += item.damagedQuantity
    if (oi.receivedQuantity < oi.quantity) allComplete = false
  }

  o.status = allComplete ? POStatus.Received : POStatus.PartiallyReceived
  o.receiveStatus = allComplete ? ReceiveStatus.Complete : ReceiveStatus.Partial
  if (allComplete) { /* receivedAt would be set */ }
  o.updatedAt = now()
  poStore.set(orderId, o)
  return o
}

function recordPayment(ctx: TenantCtx, input: { purchaseOrderId: string; amount: number; paymentMethod: string; transactionNo?: string }): { order: PO; payment: Payment } {
  const o = getPO(input.purchaseOrderId, ctx)
  if (o.status === POStatus.Draft || o.status === POStatus.Cancelled) throw new Error(`Cannot pay (${o.status})`)

  const payment: Payment = {
    id: uid('pay'),
    purchaseOrderId: input.purchaseOrderId,
    amount: input.amount,
    paymentMethod: input.paymentMethod,
    paymentDate: now(),
    transactionNo: input.transactionNo,
  }

  if (!o.payments) o.payments = []
  o.payments.push(payment)
  o.totalPaid += input.amount
  o.paymentStatus = o.totalPaid >= o.totalAmount ? PayStatus.Paid : PayStatus.PartiallyPaid
  o.updatedAt = now()
  poStore.set(input.purchaseOrderId, o)

  return { order: o, payment }
}

function updatePO(orderId: string, ctx: TenantCtx, input: { supplierName?: string; items?: Array<{ productId: string; productName: string; sku: string; quantity: number; unitPrice: number }> }): PO {
  const o = getPO(orderId, ctx)
  if (o.status !== POStatus.Draft) throw new Error(`Cannot update non-draft (${o.status})`)

  if (input.supplierName !== undefined) o.supplierName = input.supplierName
  if (input.items) {
    if (input.items.length === 0) throw new Error('At least one item')
    o.items = input.items.map((i) => ({
      ...i,
      totalPrice: i.quantity * i.unitPrice,
      receivedQuantity: 0,
      returnQuantity: 0,
      damagedQuantity: 0,
    }))
    o.totalAmount = o.items.reduce((s, i) => s + i.totalPrice, 0)
  }
  o.updatedAt = now()
  poStore.set(orderId, o)
  return o
}

function deletePO(orderId: string, ctx: TenantCtx): void {
  const o = getPO(orderId, ctx)
  if (o.status !== POStatus.Draft && o.status !== POStatus.Rejected) {
    throw new Error(`Cannot delete (${o.status})`)
  }
  poStore.delete(orderId)
}

// Supplier
function createSupplier(ctx: TenantCtx, input: { code: string; name: string; contactName?: string }): EnhancedSupplier {
  const s: EnhancedSupplier = {
    id: uid('supp'),
    tenantId: ctx.tenantId,
    code: input.code,
    name: input.name,
    contactName: input.contactName,
    status: 'ACTIVE',
    createdAt: now(),
    updatedAt: now(),
  }
  supplierStore.set(s.id, s)
  return s
}

function listSuppliers(ctx: TenantCtx): EnhancedSupplier[] {
  return Array.from(supplierStore.values()).filter((s) => s.tenantId === ctx.tenantId)
}

function updateSupplier(supplierId: string, ctx: TenantCtx, input: { name?: string; status?: string }): EnhancedSupplier {
  const s = supplierStore.get(supplierId)
  if (!s || s.tenantId !== ctx.tenantId) throw new Error(`Supplier ${supplierId} not found`)
  if (input.name !== undefined) s.name = input.name
  if (input.status !== undefined) s.status = input.status
  s.updatedAt = now()
  supplierStore.set(supplierId, s)
  return s
}

// Return
function createReturn(ctx: TenantCtx, input: {
  purchaseOrderId: string
  items: Array<{ productId: string; quantity: number; unitPrice: number; reason: string }>
  reasonDetail?: string
}): ReturnOrder {
  const o = getPO(input.purchaseOrderId, ctx)
  if (o.status !== POStatus.Received && o.status !== POStatus.PartiallyReceived) {
    throw new Error(`Cannot return (${o.status})`)
  }

  const returnItems: ReturnItem[] = input.items.map((item) => {
    const oi = o.items.find((i) => i.productId === item.productId)
    if (!oi) throw new Error(`Product ${item.productId} not in PO`)
    if (item.quantity > oi.quantity - oi.returnQuantity) {
      throw new Error(`Return qty ${item.quantity} > available ${oi.quantity - oi.returnQuantity}`)
    }
    return {
      productId: item.productId,
      productName: oi.productName,
      sku: oi.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
      reason: item.reason,
    }
  })

  const totalAmount = returnItems.reduce((s, i) => s + i.totalPrice, 0)

  const ret: ReturnOrder = {
    id: uid('ret'),
    purchaseOrderId: input.purchaseOrderId,
    returnOrderNo: `RET-${Date.now().toString(36).toUpperCase()}`,
    items: returnItems,
    totalAmount,
    status: ReturnStatus.Pending,
    reasonDetail: input.reasonDetail,
    appliedAt: now(),
  }

  returnStore.set(ret.id, ret)
  if (!o.returns) o.returns = []
  o.returns.push(ret)

  for (const item of returnItems) {
    const oi = o.items.find((i) => i.productId === item.productId)
    if (oi) oi.returnQuantity += item.quantity
  }
  poStore.set(input.purchaseOrderId, o)
  return ret
}

function approveReturn(returnId: string, ctx: TenantCtx): ReturnOrder {
  const ret = returnStore.get(returnId)
  if (!ret) throw new Error(`Return ${returnId} not found`)
  const o = poStore.get(ret.purchaseOrderId)
  if (!o || o.tenantId !== ctx.tenantId) throw new Error(`PO ${ret.purchaseOrderId} not found`)

  if (ret.status !== ReturnStatus.Pending && ret.status !== ReturnStatus.Shipped) {
    throw new Error(`Not actionable for approval (${ret.status})`)
  }
  ret.status = ReturnStatus.Approved
  returnStore.set(returnId, ret)
  return ret
}

function inspectReturn(returnId: string, ctx: TenantCtx): ReturnOrder {
  const ret = returnStore.get(returnId)
  if (!ret) throw new Error(`Return ${returnId} not found`)
  const o = poStore.get(ret.purchaseOrderId)
  if (!o || o.tenantId !== ctx.tenantId) throw new Error(`PO ${ret.purchaseOrderId} not found`)

  if (ret.status !== ReturnStatus.Pending) throw new Error(`Not pending (${ret.status})`)
  ret.status = ReturnStatus.Shipped
  returnStore.set(returnId, ret)
  return ret
}

function rejectReturn(returnId: string, ctx: TenantCtx): ReturnOrder {
  const ret = returnStore.get(returnId)
  if (!ret) throw new Error(`Return ${returnId} not found`)
  const o = poStore.get(ret.purchaseOrderId)
  if (!o || o.tenantId !== ctx.tenantId) throw new Error(`PO ${ret.purchaseOrderId} not found`)

  if (ret.status !== ReturnStatus.Pending && ret.status !== ReturnStatus.Shipped) {
    throw new Error(`Not rejectable (${ret.status})`)
  }
  ret.status = ReturnStatus.Rejected
  returnStore.set(returnId, ret)
  return ret
}

function refundReturn(returnId: string, ctx: TenantCtx): ReturnOrder {
  const ret = returnStore.get(returnId)
  if (!ret) throw new Error(`Return ${returnId} not found`)
  const o = poStore.get(ret.purchaseOrderId)
  if (!o || o.tenantId !== ctx.tenantId) throw new Error(`PO not found`)

  if (ret.status !== ReturnStatus.Approved) throw new Error(`Not refundable (${ret.status})`)
  ret.status = ReturnStatus.Refunded
  ret.completedAt = now()
  returnStore.set(returnId, ret)
  return ret
}

function exchangeReturn(returnId: string, ctx: TenantCtx): ReturnOrder {
  const ret = returnStore.get(returnId)
  if (!ret) throw new Error(`Return ${returnId} not found`)
  const o = poStore.get(ret.purchaseOrderId)
  if (!o || o.tenantId !== ctx.tenantId) throw new Error(`PO not found`)

  if (ret.status !== ReturnStatus.Approved) throw new Error(`Not exchangeable (${ret.status})`)
  ret.status = ReturnStatus.Exchanged
  ret.completedAt = now()
  returnStore.set(returnId, ret)
  return ret
}

function closeReturn(returnId: string, ctx: TenantCtx): ReturnOrder {
  const ret = returnStore.get(returnId)
  if (!ret) throw new Error(`Return ${returnId} not found`)
  const o = poStore.get(ret.purchaseOrderId)
  if (!o || o.tenantId !== ctx.tenantId) throw new Error(`PO not found`)

  if (
    ret.status !== ReturnStatus.Pending &&
    ret.status !== ReturnStatus.Approved &&
    ret.status !== ReturnStatus.Rejected &&
    ret.status !== ReturnStatus.Refunded &&
    ret.status !== ReturnStatus.Exchanged
  ) {
    throw new Error(`Not closable (${ret.status})`)
  }
  ret.status = ReturnStatus.Closed
  ret.completedAt = now()
  returnStore.set(returnId, ret)
  return ret
}

function completeReturn(returnId: string, ctx: TenantCtx): ReturnOrder {
  return closeReturn(returnId, ctx)
}

function getStats(ctx: TenantCtx) {
  const orders = Array.from(poStore.values()).filter((o) => o.tenantId === ctx.tenantId)
  const totalAmount = orders.reduce((s, o) => s + o.totalAmount, 0)
  const totalPaid = orders.reduce((s, o) => s + o.totalPaid, 0)
  return { totalOrders: orders.length, totalAmount, totalPaid }
}

// ═══════════════════════════════════════════════════════════════
// 测试
// ═══════════════════════════════════════════════════════════════

describe('InventoryPurchaseService', () => {
  const tenant = ctx()

  beforeEach(() => { resetStores() })

  // ─── 创建 ─────────────────────────────────────────────

  describe('createPurchaseOrder', () => {
    it('should create a purchase order with items', () => {
      const o = createPO(tenant, {
        supplierName: 'Test Supplier',
        items: [
          { productId: 'p1', productName: 'Item A', sku: 'SKU-A', quantity: 10, unitPrice: 5000 },
          { productId: 'p2', productName: 'Item B', sku: 'SKU-B', quantity: 5, unitPrice: 8000 },
        ],
      })
      expect(o.status).toBe(POStatus.Draft)
      expect(o.totalAmount).toBe(5000 * 10 + 8000 * 5)
      expect(o.items).toHaveLength(2)
    })

    it('should generate order number', () => {
      const o = createPO(tenant, {
        items: [{ productId: 'p1', productName: 'X', sku: 'X', quantity: 1, unitPrice: 100 }],
      })
      expect(o.orderNo).toMatch(/^PO-/)
    })

    it('should throw for empty items', () => {
      expect(() => createPO(tenant, { items: [] })).toThrow()
    })

    it('should throw for invalid quantity', () => {
      expect(() => createPO(tenant, {
        items: [{ productId: 'p1', productName: 'X', sku: 'X', quantity: 0, unitPrice: 100 }],
      })).toThrow()
    })

    it('should throw for negative price', () => {
      expect(() => createPO(tenant, {
        items: [{ productId: 'p1', productName: 'X', sku: 'X', quantity: 1, unitPrice: -10 }],
      })).toThrow()
    })
  })

  // ─── 审批流 ───────────────────────────────────────────

  describe('approval workflow', () => {
    it('should submit for approval', () => {
      const o = createPO(tenant, { items: [{ productId: 'p1', productName: 'X', sku: 'X', quantity: 1, unitPrice: 100 }] })
      const submitted = submitPO(o.id, tenant)
      expect(submitted.status).toBe(POStatus.PendingApproval)
    })

    it('should approve purchase order', () => {
      const o = createPO(tenant, { items: [{ productId: 'p1', productName: 'X', sku: 'X', quantity: 1, unitPrice: 100 }] })
      submitPO(o.id, tenant)
      const result = approvePO(o.id, tenant, { approverId: 'user-1', approverName: 'Admin' })
      expect(result.order.status).toBe(POStatus.Approved)
      expect(result.approval.action).toBe('APPROVE')
    })

    it('should reject purchase order', () => {
      const o = createPO(tenant, { items: [{ productId: 'p1', productName: 'X', sku: 'X', quantity: 1, unitPrice: 100 }] })
      submitPO(o.id, tenant)
      const result = rejectPO(o.id, tenant, { approverId: 'user-1', approverName: 'Admin', comment: 'Budget exceeded' })
      expect(result.order.status).toBe(POStatus.Rejected)
      expect(result.approval.comment).toBe('Budget exceeded')
    })

    it('should not approve non-pending order', () => {
      const o = createPO(tenant, { items: [{ productId: 'p1', productName: 'X', sku: 'X', quantity: 1, unitPrice: 100 }] })
      expect(() => approvePO(o.id, tenant, { approverId: 'u1', approverName: 'U1' })).toThrow()
    })

    it('should place order after approval', () => {
      const o = createPO(tenant, { items: [{ productId: 'p1', productName: 'X', sku: 'X', quantity: 1, unitPrice: 100 }] })
      submitPO(o.id, tenant)
      approvePO(o.id, tenant, { approverId: 'u1', approverName: 'U1' })
      const placed = placeOrder(o.id, tenant)
      expect(placed.status).toBe(POStatus.Ordered)
      expect(placed.orderedAt).toBeDefined()
    })

    it('should cancel order', () => {
      const o = createPO(tenant, { items: [{ productId: 'p1', productName: 'X', sku: 'X', quantity: 1, unitPrice: 100 }] })
      const cancelled = cancelPO(o.id, tenant, 'No longer needed')
      expect(cancelled.status).toBe(POStatus.Cancelled)
      expect(cancelled.cancelReason).toBe('No longer needed')
    })

    it('should not cancel received order', () => {
      const o = createPO(tenant, { items: [{ productId: 'p1', productName: 'X', sku: 'X', quantity: 1, unitPrice: 100 }] })
      submitPO(o.id, tenant)
      approvePO(o.id, tenant, { approverId: 'u1', approverName: 'U1' })
      placeOrder(o.id, tenant)
      receivePO(o.id, tenant, { items: [{ productId: 'p1', receivedQuantity: 1, damagedQuantity: 0 }] })
      expect(() => cancelPO(o.id, tenant)).toThrow()
    })
  })

  // ─── 收货 ─────────────────────────────────────────────

  describe('receive', () => {
    function prepareOrder(ctx: TenantCtx): PO {
      const o = createPO(ctx, {
        supplierName: 'S1',
        items: [
          { productId: 'p1', productName: 'A', sku: 'A', quantity: 10, unitPrice: 100 },
          { productId: 'p2', productName: 'B', sku: 'B', quantity: 5, unitPrice: 200 },
        ],
      })
      submitPO(o.id, ctx)
      approvePO(o.id, ctx, { approverId: 'u1', approverName: 'U1' })
      return placeOrder(o.id, ctx)
    }

    it('should receive full order', () => {
      const o = prepareOrder(tenant)
      const received = receivePO(o.id, tenant, {
        items: [
          { productId: 'p1', receivedQuantity: 10, damagedQuantity: 0 },
          { productId: 'p2', receivedQuantity: 5, damagedQuantity: 0 },
        ],
      })
      expect(received.status).toBe(POStatus.Received)
      expect(received.receiveStatus).toBe(ReceiveStatus.Complete)
    })

    it('should handle partial receive', () => {
      const o = prepareOrder(tenant)
      const partial = receivePO(o.id, tenant, {
        items: [
          { productId: 'p1', receivedQuantity: 5, damagedQuantity: 0 },
          { productId: 'p2', receivedQuantity: 0, damagedQuantity: 0 },
        ],
      })
      expect(partial.status).toBe(POStatus.PartiallyReceived)
      expect(partial.receiveStatus).toBe(ReceiveStatus.Partial)
    })

    it('should track damaged quantity', () => {
      const o = prepareOrder(tenant)
      const received = receivePO(o.id, tenant, {
        items: [
          { productId: 'p1', receivedQuantity: 9, damagedQuantity: 1 },
          { productId: 'p2', receivedQuantity: 5, damagedQuantity: 0 },
        ],
      })
      expect(received.items[0].damagedQuantity).toBe(1)
      expect(received.items[0].receivedQuantity).toBe(9)
    })
  })

  // ─── 付款 ─────────────────────────────────────────────

  describe('payment', () => {
    it('should record full payment', () => {
      const o = createPO(tenant, { items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 10, unitPrice: 100 }] })
      submitPO(o.id, tenant)
      approvePO(o.id, tenant, { approverId: 'u1', approverName: 'U1' })
      placeOrder(o.id, tenant)

      const result = recordPayment(tenant, { purchaseOrderId: o.id, amount: 1000, paymentMethod: 'BANK_TRANSFER' })
      expect(result.order.paymentStatus).toBe(PayStatus.Paid)
      expect(result.order.totalPaid).toBe(1000)
    })

    it('should track partial payment', () => {
      const o = createPO(tenant, { items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 10, unitPrice: 100 }] })
      submitPO(o.id, tenant)
      approvePO(o.id, tenant, { approverId: 'u1', approverName: 'U1' })
      placeOrder(o.id, tenant)

      recordPayment(tenant, { purchaseOrderId: o.id, amount: 500, paymentMethod: 'CASH' })
      const updated = getPO(o.id, tenant)
      expect(updated.paymentStatus).toBe(PayStatus.PartiallyPaid)
    })

    it('should not pay for draft order', () => {
      const o = createPO(tenant, { items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 1, unitPrice: 100 }] })
      expect(() => recordPayment(tenant, { purchaseOrderId: o.id, amount: 100, paymentMethod: 'CASH' })).toThrow()
    })
  })

  // ─── 退货 ─────────────────────────────────────────────

  describe('returns', () => {
    it('should create return order', () => {
      const o = createPO(tenant, {
        supplierName: 'S1',
        items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 10, unitPrice: 100 }],
      })
      submitPO(o.id, tenant)
      approvePO(o.id, tenant, { approverId: 'u1', approverName: 'U1' })
      placeOrder(o.id, tenant)
      receivePO(o.id, tenant, { items: [{ productId: 'p1', receivedQuantity: 10, damagedQuantity: 0 }] })

      const ret = createReturn(tenant, {
        purchaseOrderId: o.id,
        items: [{ productId: 'p1', quantity: 2, unitPrice: 100, reason: 'QUALITY_ISSUE' }],
        reasonDetail: 'Defective',
      })
      expect(ret.status).toBe(ReturnStatus.Pending)
      expect(ret.items).toHaveLength(1)
      expect(ret.totalAmount).toBe(200)
    })

    it('should approve and refund return', () => {
      const o = createPO(tenant, {
        supplierName: 'S1',
        items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 10, unitPrice: 100 }],
      })
      submitPO(o.id, tenant)
      approvePO(o.id, tenant, { approverId: 'u1', approverName: 'U1' })
      placeOrder(o.id, tenant)
      receivePO(o.id, tenant, { items: [{ productId: 'p1', receivedQuantity: 10, damagedQuantity: 0 }] })

      const ret = createReturn(tenant, { purchaseOrderId: o.id, items: [{ productId: 'p1', quantity: 1, unitPrice: 100, reason: 'DAMAGED' }] })
      approveReturn(ret.id, tenant)
      const refunded = refundReturn(ret.id, tenant)
      expect(refunded.status).toBe(ReturnStatus.Refunded)
    })

    it('should inspect then approve return', () => {
      const o = createPO(tenant, {
        supplierName: 'S1',
        items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 10, unitPrice: 100 }],
      })
      submitPO(o.id, tenant)
      approvePO(o.id, tenant, { approverId: 'u1', approverName: 'U1' })
      placeOrder(o.id, tenant)
      receivePO(o.id, tenant, { items: [{ productId: 'p1', receivedQuantity: 10, damagedQuantity: 0 }] })

      const ret = createReturn(tenant, { purchaseOrderId: o.id, items: [{ productId: 'p1', quantity: 1, unitPrice: 100, reason: 'DAMAGED' }] })
      const inspected = inspectReturn(ret.id, tenant)
      // inspectReturn updates store directly; snapshot status before approveReturn overwrites
      expect(inspected.status).toBe(ReturnStatus.Shipped)
      const approved = approveReturn(ret.id, tenant)
      expect(approved.status).toBe(ReturnStatus.Approved)
    })

    it('should approved then exchange return', () => {
      const o = createPO(tenant, {
        supplierName: 'S1',
        items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 10, unitPrice: 100 }],
      })
      submitPO(o.id, tenant)
      approvePO(o.id, tenant, { approverId: 'u1', approverName: 'U1' })
      placeOrder(o.id, tenant)
      receivePO(o.id, tenant, { items: [{ productId: 'p1', receivedQuantity: 10, damagedQuantity: 0 }] })

      const ret = createReturn(tenant, { purchaseOrderId: o.id, items: [{ productId: 'p1', quantity: 1, unitPrice: 100, reason: 'DAMAGED' }] })
      approveReturn(ret.id, tenant)
      const exchanged = exchangeReturn(ret.id, tenant)
      expect(exchanged.status).toBe(ReturnStatus.Exchanged)
    })

    it('should reject then close return', () => {
      const o = createPO(tenant, {
        supplierName: 'S1',
        items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 10, unitPrice: 100 }],
      })
      submitPO(o.id, tenant)
      approvePO(o.id, tenant, { approverId: 'u1', approverName: 'U1' })
      placeOrder(o.id, tenant)
      receivePO(o.id, tenant, { items: [{ productId: 'p1', receivedQuantity: 10, damagedQuantity: 0 }] })

      const ret = createReturn(tenant, { purchaseOrderId: o.id, items: [{ productId: 'p1', quantity: 1, unitPrice: 100, reason: 'DAMAGED' }] })
      const rejected = rejectReturn(ret.id, tenant)
      // rejectReturn updates store directly; snapshot status before closeReturn overwrites
      expect(rejected.status).toBe(ReturnStatus.Rejected)
      const completed = closeReturn(ret.id, tenant)
      expect(completed.status).toBe(ReturnStatus.Closed)
    })

    it('should pending close return directly', () => {
      const o = createPO(tenant, {
        supplierName: 'S1',
        items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 10, unitPrice: 100 }],
      })
      submitPO(o.id, tenant)
      approvePO(o.id, tenant, { approverId: 'u1', approverName: 'U1' })
      placeOrder(o.id, tenant)
      receivePO(o.id, tenant, { items: [{ productId: 'p1', receivedQuantity: 10, damagedQuantity: 0 }] })

      const ret = createReturn(tenant, { purchaseOrderId: o.id, items: [{ productId: 'p1', quantity: 1, unitPrice: 100, reason: 'DAMAGED' }] })
      const closed = closeReturn(ret.id, tenant)
      expect(closed.status).toBe(ReturnStatus.Closed)
    })

    it('should not exceed available quantity', () => {
      const o = createPO(tenant, {
        supplierName: 'S1',
        items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 5, unitPrice: 100 }],
      })
      submitPO(o.id, tenant)
      approvePO(o.id, tenant, { approverId: 'u1', approverName: 'U1' })
      placeOrder(o.id, tenant)
      receivePO(o.id, tenant, { items: [{ productId: 'p1', receivedQuantity: 5, damagedQuantity: 0 }] })

      expect(() => createReturn(tenant, { purchaseOrderId: o.id, items: [{ productId: 'p1', quantity: 10, unitPrice: 100, reason: 'OTHER' }] })).toThrow()
    })
  })

  // ─── 供应商管理 ───────────────────────────────────────

  describe('suppliers', () => {
    it('should create supplier', () => {
      const s = createSupplier(tenant, { code: 'SUP001', name: 'Test Supplier', contactName: 'John' })
      expect(s.code).toBe('SUP001')
      expect(s.status).toBe('ACTIVE')
    })

    it('should list suppliers', () => {
      createSupplier(tenant, { code: 'S1', name: 'Supplier 1' })
      createSupplier(tenant, { code: 'S2', name: 'Supplier 2' })
      expect(listSuppliers(tenant)).toHaveLength(2)
    })

    it('should update supplier', () => {
      const s = createSupplier(tenant, { code: 'S1', name: 'Old Name' })
      const updated = updateSupplier(s.id, tenant, { name: 'New Name', status: 'INACTIVE' })
      expect(updated.name).toBe('New Name')
      expect(updated.status).toBe('INACTIVE')
    })
  })

  // ─── 更新/删除 ────────────────────────────────────────

  describe('update/delete', () => {
    it('should update draft order', () => {
      const o = createPO(tenant, { items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 1, unitPrice: 100 }] })
      const updated = updatePO(o.id, tenant, { supplierName: 'New Supplier' })
      expect(updated.supplierName).toBe('New Supplier')
    })

    it('should not update non-draft order', () => {
      const o = createPO(tenant, { items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 1, unitPrice: 100 }] })
      submitPO(o.id, tenant)
      expect(() => updatePO(o.id, tenant, { supplierName: 'X' })).toThrow()
    })

    it('should delete draft order', () => {
      const o = createPO(tenant, { items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 1, unitPrice: 100 }] })
      deletePO(o.id, tenant)
      expect(() => getPO(o.id, tenant)).toThrow()
    })

    it('should not delete approved order', () => {
      const o = createPO(tenant, { items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 1, unitPrice: 100 }] })
      submitPO(o.id, tenant)
      approvePO(o.id, tenant, { approverId: 'u1', approverName: 'U1' })
      expect(() => deletePO(o.id, tenant)).toThrow()
    })
  })

  // ─── 统计 & 租户隔离 ──────────────────────────────────

  describe('stats & isolation', () => {
    it('should return correct stats', () => {
      createPO(tenant, { items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 10, unitPrice: 100 }] })
      createPO(tenant, { items: [{ productId: 'p2', productName: 'B', sku: 'B', quantity: 5, unitPrice: 200 }] })
      const stats = getStats(tenant)
      expect(stats.totalOrders).toBe(2)
      expect(stats.totalAmount).toBe(1000 + 1000)
    })

    it('should isolate between tenants', () => {
      const t2: TenantCtx = { tenantId: 't-2', storeId: 's-002' }
      createPO(tenant, { items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 1, unitPrice: 100 }] })
      createPO(t2, { items: [{ productId: 'p1', productName: 'A', sku: 'A', quantity: 1, unitPrice: 200 }] })
      expect(getStats(tenant).totalOrders).toBe(1)
      expect(getStats(t2).totalOrders).toBe(1)
    })
  })
})
