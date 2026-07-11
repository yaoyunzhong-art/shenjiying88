/**
 * purchase-order.service.ts — P-37 采购订单流转服务
 *
 * 专注于采购订单的状态流转、通知、历史记录。
 * 与 InventoryPurchaseService 配合使用。
 */

import { randomUUID } from 'node:crypto'
import { Injectable, Logger } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { InventoryPurchaseService } from './inventory-purchase.service'
import type { EnhancedPurchaseOrder, PurchaseOrderNote } from './inventory-purchase.entity'
import { PurchaseOrderStatus } from './inventory-purchase.entity'
import type { PurchaseAlert } from './inventory-purchase.types'

// ─── Store ──────────────────────────────────────────────────

const orderHistoryStore = new Map<string, OrderHistoryRecord[]>()

export interface OrderHistoryRecord {
  id: string
  purchaseOrderId: string
  action: string
  fromStatus?: string
  toStatus: string
  operatorId?: string
  operatorName?: string
  detail?: string
  createdAt: string
}

export function resetPurchaseOrderStore(): void {
  orderHistoryStore.clear()
}

@Injectable()
export class PurchaseOrderService {
  private readonly logger = new Logger(PurchaseOrderService.name)

  constructor(
    private readonly purchaseService: InventoryPurchaseService
  ) {}

  /**
   * 获取订单历史
   */
  getOrderHistory(
    orderId: string,
    tenantContext: RequestTenantContext
  ): OrderHistoryRecord[] {
    // 验证订单存在
    this.purchaseService.getPurchaseOrder(orderId, tenantContext)
    return orderHistoryStore.get(orderId) ?? []
  }

  /**
   * 记录订单历史
   */
  private recordHistory(
    orderId: string,
    record: Omit<OrderHistoryRecord, 'id' | 'createdAt'>
  ): OrderHistoryRecord {
    const now = new Date().toISOString()
    const history: OrderHistoryRecord = {
      id: `hist-${randomUUID()}`,
      ...record,
      purchaseOrderId: orderId,
      createdAt: now,
    }

    const existing = orderHistoryStore.get(orderId) ?? []
    existing.push(history)
    orderHistoryStore.set(orderId, existing)

    return history
  }

  /**
   * 创建采购单 (含历史记录)
   */
  createWithHistory(
    tenantContext: RequestTenantContext,
    input: Parameters<InventoryPurchaseService['createPurchaseOrder']>[1] & { createdBy?: string }
  ): { order: EnhancedPurchaseOrder; history: OrderHistoryRecord } {
    const order = this.purchaseService.createPurchaseOrder(tenantContext, input)
    const history = this.recordHistory(order.id, {
      purchaseOrderId: order.id,
      action: 'CREATE',
      toStatus: PurchaseOrderStatus.Draft as string,
      operatorName: input.createdBy,
      detail: `采购单 ${order.orderNo} 创建`,
    })

    return { order, history }
  }

  /**
   * 提交审批
   */
  submitWithHistory(
    orderId: string,
    tenantContext: RequestTenantContext,
    submittedBy?: string
  ): { order: EnhancedPurchaseOrder; history: OrderHistoryRecord } {
    const order = this.purchaseService.submitForApproval(orderId, tenantContext, submittedBy)
    const history = this.recordHistory(orderId, {
      purchaseOrderId: orderId,
      action: 'SUBMIT',
      fromStatus: PurchaseOrderStatus.Draft as string,
      toStatus: PurchaseOrderStatus.PendingApproval as string,
      operatorName: submittedBy,
      detail: `采购单 ${order.orderNo} 提交审批`,
    })

    return { order, history }
  }

  /**
   * 审批通过
   */
  approveWithHistory(
    orderId: string,
    tenantContext: RequestTenantContext,
    input: { approverId: string; approverName: string; comment?: string }
  ): { order: EnhancedPurchaseOrder; history: OrderHistoryRecord } {
    const result = this.purchaseService.approvePurchaseOrder(orderId, tenantContext, input)
    const history = this.recordHistory(orderId, {
      purchaseOrderId: orderId,
      action: 'APPROVE',
      fromStatus: PurchaseOrderStatus.PendingApproval as string,
      toStatus: PurchaseOrderStatus.Approved as string,
      operatorId: input.approverId,
      operatorName: input.approverName,
      detail: input.comment ?? '审批通过',
    })

    return { order: result.order, history }
  }

  /**
   * 驳回
   */
  rejectWithHistory(
    orderId: string,
    tenantContext: RequestTenantContext,
    input: { approverId: string; approverName: string; comment: string }
  ): { order: EnhancedPurchaseOrder; history: OrderHistoryRecord } {
    const result = this.purchaseService.rejectPurchaseOrder(orderId, tenantContext, input)
    const history = this.recordHistory(orderId, {
      purchaseOrderId: orderId,
      action: 'REJECT',
      fromStatus: PurchaseOrderStatus.PendingApproval as string,
      toStatus: PurchaseOrderStatus.Rejected as string,
      operatorId: input.approverId,
      operatorName: input.approverName,
      detail: input.comment,
    })

    return { order: result.order, history }
  }

  /**
   * 下单
   */
  placeWithHistory(
    orderId: string,
    tenantContext: RequestTenantContext,
    placedBy?: string
  ): { order: EnhancedPurchaseOrder; history: OrderHistoryRecord } {
    const order = this.purchaseService.placeOrder(orderId, tenantContext)
    const history = this.recordHistory(orderId, {
      purchaseOrderId: orderId,
      action: 'PLACE_ORDER',
      fromStatus: PurchaseOrderStatus.Approved as string,
      toStatus: PurchaseOrderStatus.Ordered as string,
      operatorName: placedBy,
      detail: `采购单 ${order.orderNo} 已向供应商下达`,
    })

    return { order, history }
  }

  /**
   * 取消
   */
  cancelWithHistory(
    orderId: string,
    tenantContext: RequestTenantContext,
    input?: { cancelledBy?: string; reason?: string }
  ): { order: EnhancedPurchaseOrder; history: OrderHistoryRecord } {
    const order = this.purchaseService.cancelPurchaseOrder(orderId, tenantContext, input?.reason)
    const history = this.recordHistory(orderId, {
      purchaseOrderId: orderId,
      action: 'CANCEL',
      fromStatus: order.status as string,
      toStatus: PurchaseOrderStatus.Cancelled as string,
      operatorName: input?.cancelledBy,
      detail: input?.reason ?? '采购单取消',
    })

    return { order, history }
  }

  /**
   * 收货
   */
  receiveWithHistory(
    orderId: string,
    tenantContext: RequestTenantContext,
    input: Parameters<InventoryPurchaseService['receivePurchaseOrder']>[2] & { operatorId?: string }
  ): { order: EnhancedPurchaseOrder; history: OrderHistoryRecord } {
    const result = this.purchaseService.receivePurchaseOrder(orderId, tenantContext, input)
    const history = this.recordHistory(orderId, {
      purchaseOrderId: orderId,
      action: 'RECEIVE',
      fromStatus: result.order.status === PurchaseOrderStatus.PartiallyReceived
        ? (PurchaseOrderStatus.PartiallyReceived as string)
        : (PurchaseOrderStatus.Ordered as string),
      toStatus: result.order.status as string,
      operatorId: input.operatorId,
      detail: `采购单 ${result.order.orderNo} 收货 (${result.order.receiveStatus === 'COMPLETE' ? '完全' : '部分'})`,
    })

    return { order: result.order, history }
  }

  /**
   * 获取全生命周期时间线
   */
  getTimeline(
    orderId: string,
    tenantContext: RequestTenantContext
  ): Array<{ step: string; date: string; detail?: string }> {
    const order = this.purchaseService.getPurchaseOrder(orderId, tenantContext)
    const timeline: Array<{ step: string; date: string; detail?: string }> = []

    timeline.push({ step: 'CREATED', date: order.createdAt })
    if (order.orderedAt) timeline.push({ step: 'ORDERED', date: order.orderedAt })
    if (order.confirmedAt) timeline.push({ step: 'APPROVED', date: order.confirmedAt })
    if (order.receivedAt) timeline.push({ step: 'RECEIVED', date: order.receivedAt })
    if (order.cancelledAt) timeline.push({ step: 'CANCELLED', date: order.cancelledAt, detail: order.cancelReason })
    // 从历史记录补充更多步骤
    const history = this.getOrderHistory(orderId, tenantContext)
    for (const h of history) {
      if (!timeline.some((t) => t.step === h.action && t.date === h.createdAt)) {
        timeline.push({ step: h.action, date: h.createdAt, detail: h.detail })
      }
    }

    return timeline.sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * 获取批量采购订单摘要
   */
  getBatchSummary(
    orderIds: string[],
    tenantContext: RequestTenantContext
  ): {
    totalOrders: number
    totalAmount: number
    totalPaid: number
    totalReceived: number
    statusCounts: Record<string, number>
  } {
    const orders = orderIds
      .map((id) => {
        try {
          return this.purchaseService.getPurchaseOrder(id, tenantContext)
        } catch {
          return null
        }
      })
      .filter((o): o is EnhancedPurchaseOrder => o !== null)

    const statusCounts: Record<string, number> = {}
    for (const o of orders) {
      const key = o.status as string
      statusCounts[key] = (statusCounts[key] ?? 0) + 1
    }

    return {
      totalOrders: orders.length,
      totalAmount: orders.reduce((s, o) => s + o.totalAmount, 0),
      totalPaid: orders.reduce((s, o) => s + o.totalPaid, 0),
      totalReceived: orders.filter((o) => o.status === PurchaseOrderStatus.Received || o.status === PurchaseOrderStatus.PartiallyReceived).length,
      statusCounts,
    }
  }

  /**
   * 批量状态操作
   */
  batchApprove(
    orderIds: string[],
    tenantContext: RequestTenantContext,
    input: { approverId: string; approverName: string; comment?: string }
  ): Array<{ orderId: string; success: boolean; error?: string }> {
    return orderIds.map((orderId) => {
      try {
        this.approveWithHistory(orderId, tenantContext, input)
        return { orderId, success: true }
      } catch (err) {
        return { orderId, success: false, error: (err as Error).message }
      }
    })
  }
}
