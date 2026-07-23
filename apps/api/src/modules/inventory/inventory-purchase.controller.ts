/**
 * inventory-purchase.controller.ts — P-37 库存采购增强 REST API
 *
 * 端点覆盖：
 *   - 采购单 CRUD
 *   - 审批流 (提交/审批/驳回)
 *   - 收货
 *   - 付款
 *   - 备注
 *   - 退货
 *   - 供应商管理
 *   - 统计
 *   - 预警
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'
import {
  CurrentActor,
  type CurrentActorValue
} from '../foundation/identity-access/identity-access.decorator'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { InventoryPurchaseService } from './inventory-purchase.service'
import { PurchaseOrderService } from './purchase-order.service'

function resolveActorId(actorContext: CurrentActorValue, fallback?: string) {
  return actorContext?.actorId ?? fallback
}

function resolveActorName(actorContext: CurrentActorValue, fallback?: string) {
  return actorContext?.actorName ?? actorContext?.actorId ?? fallback
}

@UseGuards(TenantGuard)
@Controller('inventory/purchase')
export class InventoryPurchaseController {
  private readonly logger = new Logger(InventoryPurchaseController.name)

  constructor(
    private readonly purchaseService: InventoryPurchaseService,
    private readonly orderService: PurchaseOrderService
  ) {}

  // ═══════════════════════════════════════════════════════════════
  // 采购单 CRUD
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /api/inventory/purchase/orders
   * 创建采购单
   */
  @Post('orders')
  createPurchaseOrder(
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: {
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
  ) {
    return this.orderService.createWithHistory(tenantContext, {
      ...body,
      createdBy: resolveActorName(actorContext, body.createdBy)
    })
  }

  /**
   * GET /api/inventory/purchase/orders
   * 查询采购单列表
   */
  @Get('orders')
  listPurchaseOrders(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: {
      status?: string
      supplierId?: string
      storeId?: string
      paymentStatus?: string
      dateFrom?: string
      dateTo?: string
      keyword?: string
      limit?: number
      offset?: number
    } = {}
  ) {
    return this.purchaseService.listPurchaseOrders(tenantContext, query as unknown as Record<string, unknown>)
  }

  /**
   * GET /api/inventory/purchase/orders/:orderId
   * 获取采购单详情
   */
  @Get('orders/:orderId')
  getPurchaseOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.purchaseService.getPurchaseOrder(orderId, tenantContext)
  }

  /**
   * PUT /api/inventory/purchase/orders/:orderId
   * 更新采购单
   */
  @Put('orders/:orderId')
  updatePurchaseOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: {
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
  ) {
    return this.purchaseService.updatePurchaseOrder(orderId, tenantContext, body)
  }

  /**
   * DELETE /api/inventory/purchase/orders/:orderId
   * 删除采购单 (仅草稿)
   */
  @Delete('orders/:orderId')
  deletePurchaseOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    this.purchaseService.deletePurchaseOrder(orderId, tenantContext)
    return { success: true, message: `Purchase order ${orderId} deleted` }
  }

  // ═══════════════════════════════════════════════════════════════
  // 审批流
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /api/inventory/purchase/orders/:orderId/submit
   * 提交审批
   */
  @Post('orders/:orderId/submit')
  submitForApproval(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: { submittedBy?: string } = {}
  ) {
    return this.orderService.submitWithHistory(
      orderId,
      tenantContext,
      resolveActorName(actorContext, body.submittedBy)
    )
  }

  /**
   * POST /api/inventory/purchase/orders/:orderId/approve
   * 审批通过
   */
  @Post('orders/:orderId/approve')
  approveOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: { approverId: string; approverName: string; comment?: string }
  ) {
    return this.orderService.approveWithHistory(orderId, tenantContext, {
      ...body,
      approverId: resolveActorId(actorContext, body.approverId) ?? '',
      approverName: resolveActorName(actorContext, body.approverName) ?? ''
    })
  }

  /**
   * POST /api/inventory/purchase/orders/:orderId/reject
   * 驳回
   */
  @Post('orders/:orderId/reject')
  rejectOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: { approverId: string; approverName: string; comment: string }
  ) {
    return this.orderService.rejectWithHistory(orderId, tenantContext, {
      ...body,
      approverId: resolveActorId(actorContext, body.approverId) ?? '',
      approverName: resolveActorName(actorContext, body.approverName) ?? ''
    })
  }

  /**
   * POST /api/inventory/purchase/orders/:orderId/place
   * 下单 (Approved → Ordered)
   */
  @Post('orders/:orderId/place')
  placeOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: { placedBy?: string } = {}
  ) {
    return this.orderService.placeWithHistory(
      orderId,
      tenantContext,
      resolveActorName(actorContext, body.placedBy)
    )
  }

  /**
   * POST /api/inventory/purchase/orders/:orderId/cancel
   * 取消
   */
  @Post('orders/:orderId/cancel')
  cancelOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: { cancelledBy?: string; reason?: string } = {}
  ) {
    return this.orderService.cancelWithHistory(orderId, tenantContext, {
      ...body,
      cancelledBy: resolveActorName(actorContext, body.cancelledBy)
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // 收货
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /api/inventory/purchase/orders/:orderId/receive
   * 收货
   */
  @Post('orders/:orderId/receive')
  receiveOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: {
      items: Array<{ productId: string; receivedQuantity: number; damagedQuantity: number }>
      warehouseNote?: string
      operatorId?: string
    }
  ) {
    const receiveInput: import('./inventory-purchase.types').PurchaseReceiveRequest = {
      purchaseOrderId: orderId,
      ...body,
      operatorId: resolveActorId(actorContext, body.operatorId)
    } as import('./inventory-purchase.types').PurchaseReceiveRequest
    return this.orderService.receiveWithHistory(orderId, tenantContext, receiveInput)
  }

  // ═══════════════════════════════════════════════════════════════
  // 付款
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /api/inventory/purchase/payments
   * 记录付款
   */
  @Post('payments')
  recordPayment(
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: {
      purchaseOrderId: string
      amount: number
      paymentMethod: string
      transactionNo?: string
      remark?: string
      operatorId?: string
    }
  ) {
    return this.purchaseService.recordPayment(tenantContext, {
      ...body,
      operatorId: resolveActorId(actorContext, body.operatorId)
    })
  }

  /**
   * GET /api/inventory/purchase/orders/:orderId/payments
   * 获取付款历史
   */
  @Get('orders/:orderId/payments')
  getPayments(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.purchaseService.getPayments(orderId, tenantContext)
  }

  // ═══════════════════════════════════════════════════════════════
  // 备注
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /api/inventory/purchase/orders/:orderId/notes
   * 添加备注
   */
  @Post('orders/:orderId/notes')
  addNote(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: { content: string; authorId?: string; authorName?: string }
  ) {
    return this.purchaseService.addNote(orderId, tenantContext, {
      ...body,
      authorId: resolveActorId(actorContext, body.authorId),
      authorName: resolveActorName(actorContext, body.authorName)
    })
  }

  /**
   * GET /api/inventory/purchase/orders/:orderId/notes
   * 获取备注
   */
  @Get('orders/:orderId/notes')
  getNotes(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.purchaseService.getNotes(orderId, tenantContext)
  }

  // ═══════════════════════════════════════════════════════════════
  // 退货
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /api/inventory/purchase/returns
   * 创建退货单
   */
  @Post('returns')
  createReturn(
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: {
      purchaseOrderId: string
      items: Array<{
        productId: string
        quantity: number
        unitPrice: number
        reason: string
      }>
      reasonDetail?: string
      appliedBy?: string
    }
  ) {
    return this.purchaseService.createReturn(tenantContext, {
      ...body,
      appliedBy: resolveActorName(actorContext, body.appliedBy)
    } as import('./inventory-purchase.types').PurchaseReturnRequest)
  }

  /**
   * POST /api/inventory/purchase/returns/:returnId/approve
   * 审批退货
   */
  @Post('returns/:returnId/approve')
  approveReturn(
    @Param('returnId') returnId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: { approverId: string; approverName: string }
  ) {
    return this.purchaseService.approveReturn(returnId, tenantContext, {
      ...body,
      approverId: resolveActorId(actorContext, body.approverId) ?? '',
      approverName: resolveActorName(actorContext, body.approverName) ?? ''
    })
  }

  /**
   * POST /api/inventory/purchase/returns/:returnId/inspect
   * 退货质检
   */
  @Post('returns/:returnId/inspect')
  inspectReturn(
    @Param('returnId') returnId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: { inspectorId: string; inspectorName: string; comment?: string }
  ) {
    return this.purchaseService.inspectReturn(returnId, tenantContext, {
      ...body,
      inspectorId: resolveActorId(actorContext, body.inspectorId) ?? '',
      inspectorName: resolveActorName(actorContext, body.inspectorName) ?? ''
    })
  }

  /**
   * POST /api/inventory/purchase/returns/:returnId/reject
   * 驳回退货
   */
  @Post('returns/:returnId/reject')
  rejectReturn(
    @Param('returnId') returnId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: { reviewerId: string; reviewerName: string; comment?: string }
  ) {
    return this.purchaseService.rejectReturn(returnId, tenantContext, {
      ...body,
      reviewerId: resolveActorId(actorContext, body.reviewerId) ?? '',
      reviewerName: resolveActorName(actorContext, body.reviewerName) ?? ''
    })
  }

  /**
   * POST /api/inventory/purchase/returns/:returnId/refund
   * 退款
   */
  @Post('returns/:returnId/refund')
  refundReturn(
    @Param('returnId') returnId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: { operatorId?: string; operatorName?: string; comment?: string } = {}
  ) {
    return this.purchaseService.refundReturn(returnId, tenantContext, {
      ...body,
      operatorId: resolveActorId(actorContext, body.operatorId),
      operatorName: resolveActorName(actorContext, body.operatorName)
    })
  }

  /**
   * POST /api/inventory/purchase/returns/:returnId/exchange
   * 换货
   */
  @Post('returns/:returnId/exchange')
  exchangeReturn(
    @Param('returnId') returnId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: { operatorId?: string; operatorName?: string; comment?: string } = {}
  ) {
    return this.purchaseService.exchangeReturn(returnId, tenantContext, {
      ...body,
      operatorId: resolveActorId(actorContext, body.operatorId),
      operatorName: resolveActorName(actorContext, body.operatorName)
    })
  }

  /**
   * POST /api/inventory/purchase/returns/:returnId/close
   * 关闭退货
   */
  @Post('returns/:returnId/close')
  closeReturn(
    @Param('returnId') returnId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: { operatorId?: string; operatorName?: string; comment?: string } = {}
  ) {
    return this.purchaseService.closeReturn(returnId, tenantContext, {
      ...body,
      operatorId: resolveActorId(actorContext, body.operatorId),
      operatorName: resolveActorName(actorContext, body.operatorName)
    })
  }

  /**
   * POST /api/inventory/purchase/returns/:returnId/complete
   * 完成退货（兼容旧接口，内部收口到 close）
   */
  @Post('returns/:returnId/complete')
  completeReturn(
    @Param('returnId') returnId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.purchaseService.completeReturn(returnId, tenantContext)
  }

  // ═══════════════════════════════════════════════════════════════
  // 供应商
  // ═══════════════════════════════════════════════════════════════

  /**
   * POST /api/inventory/purchase/suppliers
   * 创建供应商
   */
  @Post('suppliers')
  createSupplier(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: {
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
  ) {
    return this.purchaseService.createSupplier(tenantContext, body)
  }

  /**
   * GET /api/inventory/purchase/suppliers
   * 查询供应商列表
   */
  @Get('suppliers')
  listSuppliers(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: {
      status?: string
      category?: string
      keyword?: string
      limit?: number
      offset?: number
    } = {}
  ) {
    return this.purchaseService.listSuppliers(tenantContext, query)
  }

  /**
   * GET /api/inventory/purchase/suppliers/:supplierId
   * 获取供应商详情
   */
  @Get('suppliers/:supplierId')
  getSupplier(
    @Param('supplierId') supplierId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.purchaseService.getSupplier(supplierId, tenantContext)
  }

  /**
   * PUT /api/inventory/purchase/suppliers/:supplierId
   * 更新供应商
   */
  @Put('suppliers/:supplierId')
  updateSupplier(
    @Param('supplierId') supplierId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: {
      name?: string
      contactName?: string
      phone?: string
      email?: string
      address?: string
      bankName?: string
      bankAccount?: string
      taxId?: string
      category?: string
      rating?: number
      status?: 'ACTIVE' | 'INACTIVE' | 'BLACKLISTED'
    }
  ) {
    return this.purchaseService.updateSupplier(supplierId, tenantContext, body)
  }

  // ═══════════════════════════════════════════════════════════════
  // 统计 & 预警
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET /api/inventory/purchase/stats
   * 获取采购统计
   */
  @Get('stats')
  getStats(
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.purchaseService.getPurchaseStats(tenantContext)
  }

  /**
   * GET /api/inventory/purchase/alerts
   * 获取采购预警
   */
  @Get('alerts')
  getAlerts(
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.purchaseService.getAlerts(tenantContext)
  }

  // ═══════════════════════════════════════════════════════════════
  // 订单历史 & 时间线
  // ═══════════════════════════════════════════════════════════════

  /**
   * GET /api/inventory/purchase/orders/:orderId/history
   * 获取订单历史
   */
  @Get('orders/:orderId/history')
  getOrderHistory(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.orderService.getOrderHistory(orderId, tenantContext)
  }

  /**
   * GET /api/inventory/purchase/orders/:orderId/timeline
   * 获取订单时间线
   */
  @Get('orders/:orderId/timeline')
  getOrderTimeline(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.orderService.getTimeline(orderId, tenantContext)
  }

  /**
   * POST /api/inventory/purchase/orders/batch-summary
   * 批量查询订单摘要
   */
  @Post('orders/batch-summary')
  getBatchSummary(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: { orderIds: string[] }
  ) {
    return this.orderService.getBatchSummary(body.orderIds, tenantContext)
  }

  /**
   * POST /api/inventory/purchase/orders/batch-approve
   * 批量审批
   */
  @Post('orders/batch-approve')
  batchApprove(
    @TenantContext() tenantContext: RequestTenantContext,
    @CurrentActor() actorContext: CurrentActorValue,
    @Body() body: {
      orderIds: string[]
      approverId: string
      approverName: string
      comment?: string
    }
  ) {
    return this.orderService.batchApprove(body.orderIds, tenantContext, {
      approverId: resolveActorId(actorContext, body.approverId) ?? '',
      approverName: resolveActorName(actorContext, body.approverName) ?? '',
      comment: body.comment
    })
  }
}
