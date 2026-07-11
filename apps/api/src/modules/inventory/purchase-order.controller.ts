/**
 * purchase-order.controller.ts — P-37 采购订单流转 REST API
 *
 * 专注订单的状态流转操作。
 * 与 InventoryPurchaseController 互补。
 *
 * 端点:
 *   - GET  /api/inventory/purchase-orders/:orderId/history  — 获取历史
 *   - GET  /api/inventory/purchase-orders/:orderId/timeline — 获取时间线
 *   - POST /api/inventory/purchase-orders/batch-summary    — 批量摘要
 *   - POST /api/inventory/purchase-orders/batch-approve    — 批量审批
 */

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Logger
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { PurchaseOrderService } from './purchase-order.service'

@Controller('inventory/purchase-orders')
export class PurchaseOrderController {
  private readonly logger = new Logger(PurchaseOrderController.name)

  constructor(
    private readonly orderService: PurchaseOrderService
  ) {}

  /**
   * GET /api/inventory/purchase-orders/:orderId/history
   */
  @Get(':orderId/history')
  getOrderHistory(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.orderService.getOrderHistory(orderId, tenantContext)
  }

  /**
   * GET /api/inventory/purchase-orders/:orderId/timeline
   */
  @Get(':orderId/timeline')
  getOrderTimeline(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.orderService.getTimeline(orderId, tenantContext)
  }

  /**
   * POST /api/inventory/purchase-orders/batch-summary
   */
  @Post('batch-summary')
  getBatchSummary(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: { orderIds: string[] }
  ) {
    return this.orderService.getBatchSummary(body.orderIds, tenantContext)
  }

  /**
   * POST /api/inventory/purchase-orders/batch-approve
   */
  @Post('batch-approve')
  batchApprove(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: {
      orderIds: string[]
      approverId: string
      approverName: string
      comment?: string
    }
  ) {
    return this.orderService.batchApprove(body.orderIds, tenantContext, {
      approverId: body.approverId,
      approverName: body.approverName,
      comment: body.comment,
    })
  }
}
