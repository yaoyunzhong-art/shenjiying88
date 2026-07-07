import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  BadRequestException,
  NotFoundException,
  Logger
} from '@nestjs/common'
import { OrderService } from './order.service'
import { PaymentService } from './payment.service'
import { RefundService } from './refund.service'
import { TenantGuard } from '../agent/tenant.guard'
import type {
  CreateOrderInput,
  CreatePaymentInput,
  CreateRefundInput,
  Order,
  OrderItem,
  Payment,
  Refund
} from '@m5/types'

/**
 * Phase-35 T163: CashierController - 收银台 REST API
 *
 * 11 个端点:
 *   - POST   /orders                创建订单 (草稿)
 *   - POST   /orders/:id/submit     提交订单 DRAFT → PENDING
 *   - POST   /orders/:id/cancel     取消订单
 *   - POST   /orders/:id/fulfill    履约 PAID → FULFILLED
 *   - GET    /orders/:id            查询订单
 *   - GET    /orders/:id/items      查询订单行
 *   - GET    /orders                列表 (按 tenantId + 状态/会员/分页)
 *   - POST   /orders/:id/payments   发起支付
 *   - POST   /payments/:id/callback 支付回调 (webhook, mock)
 *   - POST   /orders/:id/refunds    申请退款
 *   - GET    /refunds/:id           查询退款
 *
 * 全部端点 @UseGuards(TenantGuard), tenantId 从 x-tenant-id header 注入
 * userId 从 x-user-id header 注入 (收银员)
 */
@Controller('cashier')
@UseGuards(TenantGuard)
export class CashierController {
  private readonly logger = new Logger(CashierController.name)

  constructor(
    private readonly orderService: OrderService,
    private readonly paymentService: PaymentService,
    private readonly refundService: RefundService
  ) {}

  // ── Orders ──

  @Post('orders')
  createOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Body() body: CreateOrderInput
  ): Order {
    if (!userId) throw new BadRequestException('x-user-id header required')
    return this.orderService.create(body, { tenantId, userId })
  }

  @Post('orders/:id/submit')
  submitOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ): Order {
    return this.orderService.submit(id, tenantId)
  }

  @Post('orders/:id/cancel')
  cancelOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: { reason?: string }
  ): Order {
    return this.orderService.cancel(id, tenantId, body?.reason ?? 'no_reason')
  }

  @Post('orders/:id/fulfill')
  fulfillOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ): Order {
    return this.orderService.fulfill(id, tenantId)
  }

  @Get('orders/:id')
  getOrder(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ): Order {
    const order = this.orderService.getById(id, tenantId)
    if (!order) throw new NotFoundException(`order ${id} not found or cross-tenant`)
    return order
  }

  @Get('orders/:id/items')
  getOrderItems(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ): OrderItem[] {
    return this.orderService.getItems(id, tenantId)
  }

  @Get('orders')
  listOrders(
    @Headers('x-tenant-id') tenantId: string,
    @Query('status') status?: string,
    @Query('memberId') memberId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string
  ): { items: Order[]; total: number } {
    return this.orderService.list(
      {
        status: status as Order['status'] | undefined,
        memberId,
        fromDate,
        toDate,
        page: page ? Number(page) : undefined,
        pageSize: pageSize ? Number(pageSize) : undefined
      },
      tenantId
    )
  }

  // ── Payments ──

  @Post('orders/:id/payments')
  async createPayment(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id') orderId: string,
    @Body() body: Omit<CreatePaymentInput, 'orderId'>
  ): Promise<Payment> {
    if (!userId) throw new BadRequestException('x-user-id header required')
    return this.paymentService.create(
      { ...body, orderId },
      { tenantId, userId }
    )
  }

  @Post('payments/:id/callback')
  paymentCallback(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') paymentId: string,
    @Body() body: { providerTxnId: string }
  ): Payment {
    if (!body?.providerTxnId) {
      throw new BadRequestException('providerTxnId required in callback body')
    }
    return this.paymentService.confirm(paymentId, body.providerTxnId, tenantId)
  }

  // ── Refunds ──

  @Post('orders/:id/refunds')
  createRefund(
    @Headers('x-tenant-id') tenantId: string,
    @Headers('x-user-id') userId: string,
    @Param('id') orderId: string,
    @Body() body: Omit<CreateRefundInput, 'orderId'>
  ): Refund {
    if (!userId) throw new BadRequestException('x-user-id header required')
    return this.refundService.create(
      { ...body, orderId },
      { tenantId, userId }
    )
  }

  @Get('refunds/:id')
  getRefund(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ): Refund {
    const refund = this.refundService.getById(id, tenantId)
    if (!refund) throw new NotFoundException(`refund ${id} not found or cross-tenant`)
    return refund
  }
}
