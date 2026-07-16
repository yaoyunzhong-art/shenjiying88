import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreateProcurementOrderDto,
  ProcurementOrderQueryDto,
  ReceiveItemsDto,
  UpdateProcurementOrderDto,
  UpdateProcurementStatusDto,
} from './procurement-order.dto'
import { ProcurementOrderService } from './procurement-order.service'

@Controller('procurement-orders')
export class ProcurementOrderController {
  constructor(private readonly orderService: ProcurementOrderService) {}

  // ── CRUD ──

  @Post()
  createOrder(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateProcurementOrderDto
  ) {
    return this.orderService.createOrder({
      tenantId: tenantContext.tenantId,
      orderNo: body.orderNo,
      supplierId: body.supplierId,
      supplierName: body.supplierName,
      items: body.items,
      remark: body.remark,
      orderedAt: body.orderedAt,
      expectedAt: body.expectedAt,
    })
  }

  @Get()
  listOrders(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ProcurementOrderQueryDto
  ) {
    return this.orderService.listOrders(tenantContext.tenantId, {
      status: query.status,
      supplierId: query.supplierId,
      search: query.search,
    })
  }

  @Get(':orderId')
  getOrder(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('orderId') orderId: string
  ) {
    const order = this.orderService.getOrder(orderId, tenantContext.tenantId)
    if (!order) {
      throw new Error(`Order not found: ${orderId}`)
    }
    return order
  }

  @Patch(':orderId')
  updateOrder(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('orderId') orderId: string,
    @Body() body: UpdateProcurementOrderDto
  ) {
    return this.orderService.updateOrder(orderId, tenantContext.tenantId, body)
  }

  @Delete(':orderId')
  deleteOrder(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('orderId') orderId: string
  ) {
    this.orderService.deleteOrder(orderId, tenantContext.tenantId)
    return { success: true }
  }

  // ── Status management ──

  @Patch(':orderId/status')
  updateOrderStatus(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('orderId') orderId: string,
    @Body() body: UpdateProcurementStatusDto
  ) {
    return this.orderService.updateOrderStatus(
      orderId,
      body.status,
      tenantContext.tenantId
    )
  }

  @Post(':orderId/receive')
  receiveItems(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('orderId') orderId: string,
    @Body() body: ReceiveItemsDto
  ) {
    return this.orderService.receiveItems(
      orderId,
      body.items,
      tenantContext.tenantId
    )
  }

  // ── Query views ──

  @Get('views/overdue')
  getOverdueOrders(
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.orderService.getOverdueOrders(tenantContext.tenantId)
  }

  @Get('supplier/:supplierId')
  getOrdersBySupplier(
    @TenantContext() tenantContext: RequestTenantContext,
    @Param('supplierId') supplierId: string
  ) {
    return this.orderService.getOrdersBySupplier(supplierId, tenantContext.tenantId)
  }
}
