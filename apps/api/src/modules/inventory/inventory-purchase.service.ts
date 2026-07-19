/**
 * inventory-purchase.service.ts — P-37 库存采购增强服务
 *
 * 功能:
 *   - 采购单全生命周期 (Draft → PendingApproval → Approved → Ordered → Received)
 *   - 审批流 (提审 / 审批 / 驳回)
 *   - 收货处理 (部分收货 / 完全收货 / 损坏登记)
 *   - 付款管理 (分期 / 全额 / 逾期预警)
 *   - 退货管理 (退货申请 / 质检 / 审批 / 驳回 / 完成)
 *   - 采购统计
 *   - 供应商评价
 */

import { randomUUID } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { InventoryService } from './inventory.service'
import {
  PurchaseOrderStatus,
  PurchasePaymentStatus,
  PurchaseReceiveStatus,
  PurchaseReturnReason,
  PurchaseReturnStatus,
  type EnhancedPurchaseOrder,
  type PurchaseOrderItem,
  type PurchasePayment,
  type PurchaseOrderNote,
  type PurchaseApprovalFlow,
  type PurchaseReturn,
  type PurchaseReturnItem,
  type EnhancedSupplier,
} from './inventory-purchase.entity'
import type {
  PurchaseApprovalRequest,
  PurchaseApprovalResult,
  PurchaseReceiveRequest,
  PurchaseReceiveResult,
  PurchasePaymentRequest,
  PurchasePaymentResult,
  PurchaseReturnRequest,
  PurchaseReturnResult,
  PurchaseStats,
  PurchaseAlert,
} from './inventory-purchase.types'

// ─── In-Memory Stores ───────────────────────────────────

const purchaseOrderStore = new Map<string, EnhancedPurchaseOrder>()
const paymentStore = new Map<string, PurchasePayment>()
const noteStore = new Map<string, PurchaseOrderNote>()
const approvalStore = new Map<string, PurchaseApprovalFlow>()
const returnStore = new Map<string, PurchaseReturn>()
const supplierStore = new Map<string, EnhancedSupplier>()

export function resetInventoryPurchaseTestState(): void {
  purchaseOrderStore.clear()
  paymentStore.clear()
  noteStore.clear()
  approvalStore.clear()
  returnStore.clear()
  supplierStore.clear()
}

@Injectable()
export class InventoryPurchaseService {
  private readonly logger = new Logger(InventoryPurchaseService.name)

  constructor(
    private readonly inventoryService: InventoryService
  ) {}

  // ═══════════════════════════════════════════════════════
  // 采购单 CRUD
  // ═══════════════════════════════════════════════════════

  /**
   * 创建采购单 (草稿)
   */
  createPurchaseOrder(
    tenantContext: RequestTenantContext,
    input: {
      supplierId?: string
      supplierName?: string
      supplierContact?: string
      storeId?: string
      items: Array<{
        productId: string
        productName: string
        sku: string
        category?: string
        quantity: number
        unitPrice: number
      }>
      paymentPlan?: string
      expectedDeliveryAt?: string
      createdBy?: string
    }
  ): EnhancedPurchaseOrder {
    const now = new Date().toISOString()

    if (!input.items || input.items.length === 0) {
      throw new Error('Purchase order must have at least one item')
    }

    if (input.items.some((item) => item.quantity <= 0 || item.unitPrice < 0)) {
      throw new Error('Item quantity must be > 0 and unit price must be >= 0')
    }

    const totalAmount = input.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    )

    const items: PurchaseOrderItem[] = input.items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      category: item.category,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.quantity * item.unitPrice,
      receivedQuantity: 0,
      returnQuantity: 0,
      damagedQuantity: 0,
    }))

    const orderNo = `PO-${new Date().getFullYear()}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${Date.now().toString(36).toUpperCase()}`

    const order: EnhancedPurchaseOrder = {
      id: `po-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      storeId: input.storeId ?? tenantContext.storeId,
      orderNo,
      supplierId: input.supplierId,
      supplierName: input.supplierName,
      supplierContact: input.supplierContact,
      status: PurchaseOrderStatus.Draft,
      items,
      totalAmount,
      totalPaid: 0,
      paymentStatus: PurchasePaymentStatus.Unpaid,
      receiveStatus: PurchaseReceiveStatus.Pending,
      paymentPlan: input.paymentPlan,
      expectedDeliveryAt: input.expectedDeliveryAt,
      notes: [],
      payments: [],
      approvals: [],
      attachments: [],
      returns: [],
      createdBy: input.createdBy,
      createdAt: now,
      updatedAt: now,
    }

    purchaseOrderStore.set(order.id, order)
    this.logger.log(`Purchase order created: ${order.orderNo} (${order.id})`)
    return order
  }

  /**
   * 获取采购单
   */
  getPurchaseOrder(
    orderId: string,
    tenantContext: RequestTenantContext
  ): EnhancedPurchaseOrder {
    const order = purchaseOrderStore.get(orderId)
    if (!order || order.tenantId !== tenantContext.tenantId) {
      throw new Error(`Purchase order ${orderId} not found`)
    }
    return order
  }

  /**
   * 查询采购单列表
   */
  listPurchaseOrders(
    tenantContext: RequestTenantContext,
    query?: {
      status?: PurchaseOrderStatus
      supplierId?: string
      storeId?: string
      paymentStatus?: PurchasePaymentStatus
      dateFrom?: string
      dateTo?: string
      keyword?: string
      limit?: number
      offset?: number
    }
  ): EnhancedPurchaseOrder[] {
    const limit = query?.limit && query.limit > 0 ? query.limit : undefined
    const offset = query?.offset && query.offset > 0 ? query.offset : 0

    let orders = Array.from(purchaseOrderStore.values())
      .filter((o) => o.tenantId === tenantContext.tenantId)

    if (query?.status) {
      orders = orders.filter((o) => o.status === query.status)
    }
    if (query?.supplierId) {
      orders = orders.filter((o) => o.supplierId === query.supplierId)
    }
    if (query?.storeId) {
      orders = orders.filter((o) => o.storeId === query.storeId)
    }
    if (query?.paymentStatus) {
      orders = orders.filter((o) => o.paymentStatus === query.paymentStatus)
    }
    if (query?.dateFrom) {
      orders = orders.filter((o) => o.createdAt >= query.dateFrom!)
    }
    if (query?.dateTo) {
      orders = orders.filter((o) => o.createdAt <= query.dateTo!)
    }
    if (query?.keyword) {
      const kw = query.keyword.toLowerCase()
      orders = orders.filter(
        (o) =>
          o.orderNo.toLowerCase().includes(kw) ||
          (o.supplierName && o.supplierName.toLowerCase().includes(kw)) ||
          o.id.toLowerCase().includes(kw)
      )
    }

    orders.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    if (typeof limit === 'number') {
      orders = orders.slice(offset, offset + limit)
    }

    return orders
  }

  /**
   * 更新采购单基本信息
   */
  updatePurchaseOrder(
    orderId: string,
    tenantContext: RequestTenantContext,
    input: {
      supplierId?: string
      supplierName?: string
      supplierContact?: string
      paymentPlan?: string
      expectedDeliveryAt?: string
      items?: Array<{
        productId: string
        productName: string
        sku: string
        category?: string
        quantity: number
        unitPrice: number
      }>
    }
  ): EnhancedPurchaseOrder {
    const order = this.getPurchaseOrder(orderId, tenantContext)

    if (order.status !== PurchaseOrderStatus.Draft) {
      throw new Error(`Cannot update non-draft purchase order ${orderId} (status: ${order.status})`)
    }

    if (input.supplierId !== undefined) order.supplierId = input.supplierId
    if (input.supplierName !== undefined) order.supplierName = input.supplierName
    if (input.supplierContact !== undefined) order.supplierContact = input.supplierContact
    if (input.paymentPlan !== undefined) order.paymentPlan = input.paymentPlan
    if (input.expectedDeliveryAt !== undefined) order.expectedDeliveryAt = input.expectedDeliveryAt

    if (input.items) {
      if (input.items.length === 0) {
        throw new Error('Purchase order must have at least one item')
      }
      order.items = input.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        sku: item.sku,
        category: item.category,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        receivedQuantity: 0,
        returnQuantity: 0,
        damagedQuantity: 0,
      }))
      order.totalAmount = order.items.reduce((sum, item) => sum + item.totalPrice, 0)
    }

    order.updatedAt = new Date().toISOString()
    purchaseOrderStore.set(orderId, order)
    return order
  }

  /**
   * 删除草稿采购单
   */
  deletePurchaseOrder(
    orderId: string,
    tenantContext: RequestTenantContext
  ): void {
    const order = this.getPurchaseOrder(orderId, tenantContext)
    if (order.status !== PurchaseOrderStatus.Draft && order.status !== PurchaseOrderStatus.Rejected) {
      throw new Error(`Cannot delete purchase order ${orderId} in status ${order.status}`)
    }
    purchaseOrderStore.delete(orderId)
  }

  // ═══════════════════════════════════════════════════════
  // 审批流
  // ═══════════════════════════════════════════════════════

  /**
   * 提交审批 (Draft → PendingApproval)
   */
  submitForApproval(
    orderId: string,
    tenantContext: RequestTenantContext,
    submittedBy?: string
  ): EnhancedPurchaseOrder {
    const order = this.getPurchaseOrder(orderId, tenantContext)

    if (order.status !== PurchaseOrderStatus.Draft) {
      throw new Error(`Purchase order ${orderId} cannot be submitted (status: ${order.status})`)
    }

    order.status = PurchaseOrderStatus.PendingApproval
    order.updatedAt = new Date().toISOString()
    purchaseOrderStore.set(orderId, order)

    this.logger.log(`Purchase order submitted for approval: ${order.orderNo}`)
    return order
  }

  /**
   * 审批通过 (PendingApproval → Approved)
   */
  approvePurchaseOrder(
    orderId: string,
    tenantContext: RequestTenantContext,
    input: { approverId: string; approverName: string; comment?: string }
  ): PurchaseApprovalResult {
    const order = this.getPurchaseOrder(orderId, tenantContext)

    if (order.status !== PurchaseOrderStatus.PendingApproval) {
      throw new Error(`Purchase order ${orderId} is not pending approval (status: ${order.status})`)
    }

    const now = new Date().toISOString()
    order.status = PurchaseOrderStatus.Approved
    order.confirmedAt = now
    order.updatedAt = now

    const approval: PurchaseApprovalFlow = {
      id: `appr-${randomUUID()}`,
      purchaseOrderId: orderId,
      approverId: input.approverId,
      approverName: input.approverName,
      action: 'APPROVE',
      comment: input.comment,
      decidedAt: now,
      createdAt: now,
    }

    if (!order.approvals) order.approvals = []
    order.approvals.push(approval)

    approvalStore.set(approval.id, approval)
    purchaseOrderStore.set(orderId, order)

    this.logger.log(`Purchase order approved: ${order.orderNo} by ${input.approverName}`)
    return { success: true, order, approval }
  }

  /**
   * 驳回 (PendingApproval → Rejected)
   */
  rejectPurchaseOrder(
    orderId: string,
    tenantContext: RequestTenantContext,
    input: { approverId: string; approverName: string; comment: string }
  ): PurchaseApprovalResult {
    const order = this.getPurchaseOrder(orderId, tenantContext)

    if (order.status !== PurchaseOrderStatus.PendingApproval) {
      throw new Error(`Purchase order ${orderId} is not pending approval (status: ${order.status})`)
    }

    const now = new Date().toISOString()
    order.status = PurchaseOrderStatus.Rejected
    order.updatedAt = now

    const approval: PurchaseApprovalFlow = {
      id: `appr-${randomUUID()}`,
      purchaseOrderId: orderId,
      approverId: input.approverId,
      approverName: input.approverName,
      action: 'REJECT',
      comment: input.comment,
      decidedAt: now,
      createdAt: now,
    }

    if (!order.approvals) order.approvals = []
    order.approvals.push(approval)

    approvalStore.set(approval.id, approval)
    purchaseOrderStore.set(orderId, order)

    this.logger.log(`Purchase order rejected: ${order.orderNo} by ${input.approverName}`)
    return { success: true, order, approval }
  }

  /**
   * 转采购单 (Approved → Ordered)
   */
  placeOrder(
    orderId: string,
    tenantContext: RequestTenantContext
  ): EnhancedPurchaseOrder {
    const order = this.getPurchaseOrder(orderId, tenantContext)

    if (order.status !== PurchaseOrderStatus.Approved) {
      throw new Error(`Purchase order ${orderId} must be approved before placing order (status: ${order.status})`)
    }

    order.status = PurchaseOrderStatus.Ordered
    order.orderedAt = new Date().toISOString()
    order.updatedAt = new Date().toISOString()
    purchaseOrderStore.set(orderId, order)

    this.logger.log(`Purchase order placed: ${order.orderNo}`)
    return order
  }

  /**
   * 取消采购单
   */
  cancelPurchaseOrder(
    orderId: string,
    tenantContext: RequestTenantContext,
    reason?: string
  ): EnhancedPurchaseOrder {
    const order = this.getPurchaseOrder(orderId, tenantContext)

    if (order.status === PurchaseOrderStatus.Received || order.status === PurchaseOrderStatus.Cancelled) {
      throw new Error(`Purchase order ${orderId} cannot be cancelled (status: ${order.status})`)
    }

    order.status = PurchaseOrderStatus.Cancelled
    order.cancelledAt = new Date().toISOString()
    order.cancelReason = reason
    order.updatedAt = new Date().toISOString()
    purchaseOrderStore.set(orderId, order)

    this.logger.log(`Purchase order cancelled: ${order.orderNo} — ${reason ?? ''}`)
    return order
  }

  // ═══════════════════════════════════════════════════════
  // 收货
  // ═══════════════════════════════════════════════════════

  /**
   * 收货处理
   */
  receivePurchaseOrder(
    orderId: string,
    tenantContext: RequestTenantContext,
    input: PurchaseReceiveRequest
  ): PurchaseReceiveResult {
    const order = this.getPurchaseOrder(orderId, tenantContext)

    if (order.status !== PurchaseOrderStatus.Ordered && order.status !== PurchaseOrderStatus.PartiallyReceived) {
      throw new Error(`Purchase order ${orderId} cannot be received (status: ${order.status})`)
    }

    const now = new Date().toISOString()
    let allComplete = true

    for (const item of input.items) {
      const orderItem = order.items.find((oi) => oi.productId === item.productId)
      if (!orderItem) {
        throw new Error(`Product ${item.productId} not found in purchase order ${orderId}`)
      }

      orderItem.receivedQuantity += item.receivedQuantity
      orderItem.damagedQuantity += item.damagedQuantity

      if (orderItem.receivedQuantity < orderItem.quantity) {
        allComplete = false
      }
    }

    // 更新库存
    for (const item of input.items) {
      if (item.receivedQuantity > 0) {
        try {
          this.inventoryService.stockIn(tenantContext, {
            productId: item.productId,
            quantity: item.receivedQuantity,
            reason: `采购收货 PO#${order.orderNo}`,
            batchNo: orderId,
          })
        } catch (err) {
          this.logger.warn(`Failed to update stock for ${item.productId}: ${(err as Error).message}`)
        }
      }
    }

    order.status = allComplete
      ? PurchaseOrderStatus.Received
      : PurchaseOrderStatus.PartiallyReceived
    order.receiveStatus = allComplete
      ? PurchaseReceiveStatus.Complete
      : PurchaseReceiveStatus.Partial
    if (allComplete) {
      order.receivedAt = now
    }
    order.updatedAt = now
    purchaseOrderStore.set(orderId, order)

    this.logger.log(`Purchase order received: ${order.orderNo} (${allComplete ? 'complete' : 'partial'})`)
    return { success: true, order, stockUpdated: true }
  }

  // ═══════════════════════════════════════════════════════
  // 付款管理
  // ═══════════════════════════════════════════════════════

  /**
   * 记录付款
   */
  recordPayment(
    tenantContext: RequestTenantContext,
    input: PurchasePaymentRequest
  ): PurchasePaymentResult {
    const order = this.getPurchaseOrder(input.purchaseOrderId, tenantContext)

    if (order.status === PurchaseOrderStatus.Draft || order.status === PurchaseOrderStatus.Cancelled) {
      throw new Error(`Cannot pay for purchase order ${input.purchaseOrderId} in status ${order.status}`)
    }

    const now = new Date().toISOString()

    const payment: PurchasePayment = {
      id: `pay-${randomUUID()}`,
      purchaseOrderId: input.purchaseOrderId,
      amount: input.amount,
      paymentMethod: input.paymentMethod,
      paymentDate: now,
      transactionNo: input.transactionNo,
      remark: input.remark,
      operatorId: input.operatorId,
      createdAt: now,
    }

    paymentStore.set(payment.id, payment)

    if (!order.payments) order.payments = []
    order.payments.push(payment)

    order.totalPaid += input.amount
    if (order.totalPaid >= order.totalAmount) {
      order.paymentStatus = PurchasePaymentStatus.Paid
    } else {
      order.paymentStatus = PurchasePaymentStatus.PartiallyPaid
    }
    order.updatedAt = now
    purchaseOrderStore.set(input.purchaseOrderId, order)

    this.logger.log(`Payment recorded for ${order.orderNo}: ${input.amount} via ${input.paymentMethod}`)
    return { success: true, order, payment }
  }

  /**
   * 获取付款历史
   */
  getPayments(
    orderId: string,
    tenantContext: RequestTenantContext
  ): PurchasePayment[] {
    const order = this.getPurchaseOrder(orderId, tenantContext)
    return order.payments ?? []
  }

  // ═══════════════════════════════════════════════════════
  // 备注
  // ═══════════════════════════════════════════════════════

  /**
   * 添加备注
   */
  addNote(
    orderId: string,
    tenantContext: RequestTenantContext,
    input: { content: string; authorId?: string; authorName?: string }
  ): PurchaseOrderNote {
    const order = this.getPurchaseOrder(orderId, tenantContext)
    const now = new Date().toISOString()

    const note: PurchaseOrderNote = {
      id: `note-${randomUUID()}`,
      purchaseOrderId: orderId,
      content: input.content,
      authorId: input.authorId,
      authorName: input.authorName,
      createdAt: now,
    }

    noteStore.set(note.id, note)
    if (!order.notes) order.notes = []
    order.notes.push(note)
    order.updatedAt = now
    purchaseOrderStore.set(orderId, order)

    return note
  }

  /**
   * 获取备注
   */
  getNotes(
    orderId: string,
    tenantContext: RequestTenantContext
  ): PurchaseOrderNote[] {
    const order = this.getPurchaseOrder(orderId, tenantContext)
    return order.notes ?? []
  }

  // ═══════════════════════════════════════════════════════
  // 退货管理
  // ═══════════════════════════════════════════════════════

  /**
   * 创建退货单
   */
  createReturn(
    tenantContext: RequestTenantContext,
    input: PurchaseReturnRequest
  ): PurchaseReturnResult {
    const order = this.getPurchaseOrder(input.purchaseOrderId, tenantContext)

    if (order.status !== PurchaseOrderStatus.Received && order.status !== PurchaseOrderStatus.PartiallyReceived) {
      throw new Error(`Cannot create return for purchase order ${input.purchaseOrderId} (status: ${order.status})`)
    }

    const now = new Date().toISOString()

    const returnItems: PurchaseReturnItem[] = input.items.map((item) => {
      const orderItem = order.items.find((oi) => oi.productId === item.productId)
      if (!orderItem) {
        throw new Error(`Product ${item.productId} not found in purchase order ${input.purchaseOrderId}`)
      }
      if (item.quantity > orderItem.quantity - orderItem.returnQuantity) {
        throw new Error(`Return quantity ${item.quantity} exceeds available quantity ${orderItem.quantity - orderItem.returnQuantity} for product ${item.productId}`)
      }
      return {
        productId: item.productId,
        productName: orderItem.productName,
        sku: orderItem.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        reason: item.reason,
      }
    })

    const totalAmount = returnItems.reduce((sum, item) => sum + item.totalPrice, 0)
    const returnOrderNo = `RET-${Date.now().toString(36).toUpperCase()}`

    const returnOrder: PurchaseReturn = {
      id: `ret-${randomUUID()}`,
      purchaseOrderId: input.purchaseOrderId,
      returnOrderNo,
      items: returnItems,
      reason: PurchaseReturnReason.QualityIssue,
      totalAmount,
      status: PurchaseReturnStatus.Pending,
      reasonDetail: input.reasonDetail,
      appliedBy: input.appliedBy,
      appliedAt: now,
      createdAt: now,
      updatedAt: now,
    }

    returnStore.set(returnOrder.id, returnOrder)

    if (!order.returns) order.returns = []
    order.returns.push(returnOrder)

    // 更新订单项的退货数量
    for (const item of returnItems) {
      const orderItem = order.items.find((oi) => oi.productId === item.productId)
      if (orderItem) {
        orderItem.returnQuantity += item.quantity
      }
    }

    order.updatedAt = now
    purchaseOrderStore.set(input.purchaseOrderId, order)

    this.logger.log(`Return created: ${returnOrderNo} for PO ${order.orderNo}`)
    return { success: true, returnOrder, order }
  }

  /**
   * 审批退货
   */
  approveReturn(
    returnId: string,
    tenantContext: RequestTenantContext,
    approverInfo: { approverId: string; approverName: string }
  ): PurchaseReturn {
    const returnOrder = returnStore.get(returnId)
    if (!returnOrder) {
      throw new Error(`Return order ${returnId} not found`)
    }

    const order = purchaseOrderStore.get(returnOrder.purchaseOrderId)
    if (!order || order.tenantId !== tenantContext.tenantId) {
      throw new Error(`Purchase order ${returnOrder.purchaseOrderId} not found`)
    }

    if (
      returnOrder.status !== PurchaseReturnStatus.Pending &&
      returnOrder.status !== PurchaseReturnStatus.Shipped
    ) {
      throw new Error(`Return order ${returnId} is not actionable for approval (status: ${returnOrder.status})`)
    }

    returnOrder.status = PurchaseReturnStatus.Approved
    returnOrder.approvedBy = approverInfo.approverId
    returnOrder.approvedAt = new Date().toISOString()
    returnOrder.updatedAt = new Date().toISOString()
    returnStore.set(returnId, returnOrder)

    return returnOrder
  }

  /**
   * 退货质检
   */
  inspectReturn(
    returnId: string,
    tenantContext: RequestTenantContext,
    inspectorInfo: { inspectorId: string; inspectorName: string; comment?: string }
  ): PurchaseReturn {
    const returnOrder = returnStore.get(returnId)
    if (!returnOrder) {
      throw new Error(`Return order ${returnId} not found`)
    }

    const order = purchaseOrderStore.get(returnOrder.purchaseOrderId)
    if (!order || order.tenantId !== tenantContext.tenantId) {
      throw new Error(`Purchase order ${returnOrder.purchaseOrderId} not found`)
    }

    if (returnOrder.status !== PurchaseReturnStatus.Pending) {
      throw new Error(`Return order ${returnId} must be pending for inspection (status: ${returnOrder.status})`)
    }

    const now = new Date().toISOString()
    returnOrder.status = PurchaseReturnStatus.Shipped
    returnOrder.approvedBy = inspectorInfo.inspectorId
    returnOrder.approvedAt = now
    returnOrder.reasonDetail = inspectorInfo.comment ?? returnOrder.reasonDetail
    returnOrder.updatedAt = now
    returnStore.set(returnId, returnOrder)

    this.logger.log(`Return inspected: ${returnOrder.returnOrderNo} by ${inspectorInfo.inspectorName}`)
    return returnOrder
  }

  /**
   * 驳回退货
   */
  rejectReturn(
    returnId: string,
    tenantContext: RequestTenantContext,
    reviewerInfo: { reviewerId: string; reviewerName: string; comment?: string }
  ): PurchaseReturn {
    const returnOrder = returnStore.get(returnId)
    if (!returnOrder) {
      throw new Error(`Return order ${returnId} not found`)
    }

    const order = purchaseOrderStore.get(returnOrder.purchaseOrderId)
    if (!order || order.tenantId !== tenantContext.tenantId) {
      throw new Error(`Purchase order ${returnOrder.purchaseOrderId} not found`)
    }

    if (
      returnOrder.status !== PurchaseReturnStatus.Pending &&
      returnOrder.status !== PurchaseReturnStatus.Shipped
    ) {
      throw new Error(`Return order ${returnId} cannot be rejected (status: ${returnOrder.status})`)
    }

    const now = new Date().toISOString()
    returnOrder.status = PurchaseReturnStatus.Rejected
    returnOrder.approvedBy = reviewerInfo.reviewerId
    returnOrder.approvedAt = now
    returnOrder.reasonDetail = reviewerInfo.comment ?? returnOrder.reasonDetail
    returnOrder.updatedAt = now
    returnStore.set(returnId, returnOrder)

    this.logger.log(`Return rejected: ${returnOrder.returnOrderNo} by ${reviewerInfo.reviewerName}`)
    return returnOrder
  }

  /**
   * 完成退货
   */
  completeReturn(
    returnId: string,
    tenantContext: RequestTenantContext
  ): PurchaseReturn {
    const returnOrder = returnStore.get(returnId)
    if (!returnOrder) {
      throw new Error(`Return order ${returnId} not found`)
    }

    const order = purchaseOrderStore.get(returnOrder.purchaseOrderId)
    if (!order || order.tenantId !== tenantContext.tenantId) {
      throw new Error(`Purchase order ${returnOrder.purchaseOrderId} not found`)
    }

    if (
      returnOrder.status !== PurchaseReturnStatus.Approved &&
      returnOrder.status !== PurchaseReturnStatus.Rejected
    ) {
      throw new Error(`Return order ${returnId} must be approved or rejected before completion (status: ${returnOrder.status})`)
    }

    const now = new Date().toISOString()
    returnOrder.status = PurchaseReturnStatus.Completed
    returnOrder.completedAt = now
    returnOrder.updatedAt = now
    returnStore.set(returnId, returnOrder)

    this.logger.log(`Return completed: ${returnOrder.returnOrderNo}`)
    return returnOrder
  }

  // ═══════════════════════════════════════════════════════
  // 供应商管理
  // ═══════════════════════════════════════════════════════

  /**
   * 创建供应商
   */
  createSupplier(
    tenantContext: RequestTenantContext,
    input: {
      code: string
      name: string
      contactName?: string
      phone?: string
      email?: string
      address?: string
      bankName?: string
      bankAccount?: string
      taxId?: string
      category?: string
      rating?: number
    }
  ): EnhancedSupplier {
    const now = new Date().toISOString()

    const supplier: EnhancedSupplier = {
      id: `supp-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      code: input.code,
      name: input.name,
      contactName: input.contactName,
      phone: input.phone,
      email: input.email,
      address: input.address,
      bankName: input.bankName,
      bankAccount: input.bankAccount,
      taxId: input.taxId,
      category: input.category,
      rating: input.rating,
      status: 'ACTIVE',
      totalOrders: 0,
      totalAmount: 0,
      createdAt: now,
      updatedAt: now,
    }

    supplierStore.set(supplier.id, supplier)
    return supplier
  }

  /**
   * 获取供应商
   */
  getSupplier(
    supplierId: string,
    tenantContext: RequestTenantContext
  ): EnhancedSupplier {
    const supplier = supplierStore.get(supplierId)
    if (!supplier || supplier.tenantId !== tenantContext.tenantId) {
      throw new Error(`Supplier ${supplierId} not found`)
    }
    return supplier
  }

  /**
   * 更新供应商
   */
  updateSupplier(
    supplierId: string,
    tenantContext: RequestTenantContext,
    input: Partial<{
      name: string
      contactName: string
      phone: string
      email: string
      address: string
      bankName: string
      bankAccount: string
      taxId: string
      category: string
      rating: number
      status: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED'
    }>
  ): EnhancedSupplier {
    const supplier = this.getSupplier(supplierId, tenantContext)

    if (input.name !== undefined) supplier.name = input.name
    if (input.contactName !== undefined) supplier.contactName = input.contactName
    if (input.phone !== undefined) supplier.phone = input.phone
    if (input.email !== undefined) supplier.email = input.email
    if (input.address !== undefined) supplier.address = input.address
    if (input.bankName !== undefined) supplier.bankName = input.bankName
    if (input.bankAccount !== undefined) supplier.bankAccount = input.bankAccount
    if (input.taxId !== undefined) supplier.taxId = input.taxId
    if (input.category !== undefined) supplier.category = input.category
    if (input.rating !== undefined) supplier.rating = input.rating
    if (input.status !== undefined) supplier.status = input.status

    supplier.updatedAt = new Date().toISOString()
    supplierStore.set(supplierId, supplier)
    return supplier
  }

  /**
   * 列出供应商
   */
  listSuppliers(
    tenantContext: RequestTenantContext,
    query?: {
      status?: string
      category?: string
      keyword?: string
      limit?: number
      offset?: number
    }
  ): EnhancedSupplier[] {
    const limit = query?.limit && query.limit > 0 ? query.limit : undefined
    const offset = query?.offset && query.offset > 0 ? query.offset : 0

    let suppliers = Array.from(supplierStore.values())
      .filter((s) => s.tenantId === tenantContext.tenantId)

    if (query?.status) {
      suppliers = suppliers.filter((s) => s.status === query.status)
    }
    if (query?.category) {
      suppliers = suppliers.filter((s) => s.category === query.category)
    }
    if (query?.keyword) {
      const kw = query.keyword.toLowerCase()
      suppliers = suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(kw) ||
          s.code.toLowerCase().includes(kw) ||
          (s.contactName && s.contactName.toLowerCase().includes(kw))
      )
    }

    suppliers.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    if (typeof limit === 'number') {
      suppliers = suppliers.slice(offset, offset + limit)
    }

    return suppliers
  }

  // ═══════════════════════════════════════════════════════
  // 统计
  // ═══════════════════════════════════════════════════════

  /**
   * 采购统计
   */
  getPurchaseStats(
    tenantContext: RequestTenantContext
  ): PurchaseStats {
    const orders = Array.from(purchaseOrderStore.values())
      .filter((o) => o.tenantId === tenantContext.tenantId)

    const returns = Array.from(returnStore.values())
    const tenantReturns = returns.filter((r) => {
      const o = purchaseOrderStore.get(r.purchaseOrderId)
      return o && o.tenantId === tenantContext.tenantId
    })

    const totalOrders = orders.length
    const totalAmount = orders.reduce((sum, o) => sum + o.totalAmount, 0)
    const totalPaid = orders.reduce((sum, o) => sum + o.totalPaid, 0)
    const totalPending = orders
      .filter((o) => o.paymentStatus === PaymentStatusName.Unpaid || o.paymentStatus === PaymentStatusName.PartiallyPaid)
      .reduce((sum, o) => sum + (o.totalAmount - o.totalPaid), 0)
    const totalOverdue = 0 // 简化：生产环境需要按expectedDeliveryAt判断
    const totalReturns = tenantReturns.length
    const returnAmount = tenantReturns.reduce((sum, r) => sum + r.totalAmount, 0)

    // 状态分布
    const statusCounts = new Map<string, { count: number; totalAmount: number }>()
    for (const o of orders) {
      const key = o.status as string
      const entry = statusCounts.get(key) ?? { count: 0, totalAmount: 0 }
      entry.count++
      entry.totalAmount += o.totalAmount
      statusCounts.set(key, entry)
    }

    return {
      totalOrders,
      totalAmount,
      totalPaid,
      totalPending,
      totalOverdue,
      totalReturns,
      returnAmount,
      monthlyStats: [],
      statusBreakdown: Array.from(statusCounts.entries()).map(([status, stats]) => ({
        status,
        ...stats,
      })),
      topSuppliers: [],
    }
  }

  /**
   * 获取预警列表
   */
  getAlerts(
    tenantContext: RequestTenantContext
  ): PurchaseAlert[] {
    const orders = Array.from(purchaseOrderStore.values())
      .filter((o) => o.tenantId === tenantContext.tenantId)
    const alerts: PurchaseAlert[] = []
    const now = new Date()

    // 待审批预警
    const pendingApproval = orders.filter((o) => o.status === PurchaseOrderStatus.PendingApproval)
    for (const o of pendingApproval) {
      alerts.push({
        type: 'PENDING_APPROVAL',
        purchaseOrderId: o.id,
        orderNo: o.orderNo,
        supplierName: o.supplierName,
        message: `采购单 ${o.orderNo} 待审批`,
        createdAt: o.updatedAt,
      })
    }

    // 逾期预警
    const overdueOrders = orders.filter((o) => {
      if (!o.expectedDeliveryAt || o.status === PurchaseOrderStatus.Received || o.status === PurchaseOrderStatus.Cancelled) return false
      return new Date(o.expectedDeliveryAt) < now
    })
    for (const o of overdueOrders) {
      alerts.push({
        type: 'OVERDUE',
        purchaseOrderId: o.id,
        orderNo: o.orderNo,
        supplierName: o.supplierName,
        message: `采购单 ${o.orderNo} 已逾期`,
        createdAt: o.updatedAt,
      })
    }

    return alerts
  }
}

// 辅助常量（用于统计中引用）
const PaymentStatusName = {
  Unpaid: 'UNPAID',
  PartiallyPaid: 'PARTIALLY_PAID',
  Paid: 'PAID',
  Overdue: 'OVERDUE',
}
