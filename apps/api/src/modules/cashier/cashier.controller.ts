import { Body, Controller, Get, Param, Post } from '@nestjs/common'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { CashierPaymentCallbackDto, CreateCashierOrderDto, CreateCashierPaymentDto } from './cashier.dto'
import { CashierService } from './cashier.service'

@Controller('cashier')
export class CashierController {
  constructor(private readonly cashierService: CashierService) {}

  @Get('orders')
  listOrders(@TenantContext() tenantContext: RequestTenantContext) {
    return this.cashierService.listOrders(tenantContext)
  }

  @Get('orders/:orderId')
  getOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    const order = this.cashierService.getOrder(orderId, tenantContext)
    if (!order) {
      throw new Error(`Cashier order ${orderId} not found`)
    }
    return order
  }

  @Post('orders')
  createOrder(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateCashierOrderDto
  ) {
    return this.cashierService.createOrder(tenantContext, body)
  }

  @Post('orders/:orderId/payments')
  createPayment(
    @Param('orderId') orderId: string,
    @Body() body: CreateCashierPaymentDto
  ) {
    return this.cashierService.createPayment(orderId, body)
  }

  @Get('payments')
  listPayments(@TenantContext() tenantContext: RequestTenantContext) {
    return this.cashierService.listPayments(tenantContext)
  }

  @Post('payments/standardized-callback')
  applyPaymentCallback(@Body() body: CashierPaymentCallbackDto) {
    return this.cashierService.applyPaymentCallback(body)
  }
}
