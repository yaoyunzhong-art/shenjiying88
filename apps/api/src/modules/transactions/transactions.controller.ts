import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common'
import { CashierPaymentCallbackDto } from '../cashier/cashier.dto'
import {
  RequirePermissions,
  RequireTenantScope
} from '../foundation/identity-access/identity-access.decorator'
import { Public } from '../foundation/identity-access/public.decorator'
import { TenantOptional } from '../agent/tenant-guard.decorator'
import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  BatchAssignTransactionRefundsDto,
  BatchClaimTransactionRefundsDto,
  BatchReviewTransactionRefundsDto,
  BatchTimeoutCloseOrdersDto,
  CreateTransactionCheckoutDto,
  GetTransactionRefundDashboardQueryDto,
  ListTransactionOrdersQueryDto,
  ListTransactionRefundsQueryDto,
  RequestTransactionManualCloseDto,
  RequestTransactionRefundDto,
  RequestTransactionTimeoutCloseDto,
  ReviewTransactionRefundDto
} from './transactions.dto'
import { TransactionsService } from './transactions.service'
import { TenantGuard } from '../agent/tenant.guard';

const ORDER_READ_PERMISSION = 'order:read'
const ORDER_WRITE_PERMISSION = 'order:write'
const ORDER_REFUND_PERMISSION = 'order:refund'

@Controller('transactions')
@UseGuards(TenantGuard)
export class TransactionsController {
  constructor(@Inject(TransactionsService) private readonly transactionsService: TransactionsService) {}

  @Post('checkout')
  @RequireTenantScope()
  @RequirePermissions(ORDER_WRITE_PERMISSION)
  startCheckout(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateTransactionCheckoutDto
  ) {
    return this.transactionsService.startCheckout(tenantContext, body)
  }

  @Post('payments/standardized-callback')
  @Public()
  @TenantOptional()
  applyPaymentCallback(@Body() body: CashierPaymentCallbackDto) {
    return this.transactionsService.applyPaymentCallback(body)
  }

  @Get('orders/:orderId')
  @RequireTenantScope()
  @RequirePermissions(ORDER_READ_PERMISSION)
  getOrderTransaction(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.transactionsService.getOrderTransaction(orderId, tenantContext)
  }

  @Get('orders')
  @RequireTenantScope()
  @RequirePermissions(ORDER_READ_PERMISSION)
  listOrderTransactions(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ListTransactionOrdersQueryDto = {} as ListTransactionOrdersQueryDto
  ) {
    return this.transactionsService.listOrderListPage(tenantContext, query)
  }

  @Get('persistent/snapshots/orders')
  @RequireTenantScope()
  @RequirePermissions(ORDER_READ_PERMISSION)
  listLytOrderSnapshots(@TenantContext() tenantContext: RequestTenantContext) {
    return this.transactionsService.listLytOrderSnapshots(tenantContext)
  }

  @Get('persistent/snapshots/orders/:externalOrderId')
  @RequireTenantScope()
  @RequirePermissions(ORDER_READ_PERMISSION)
  getLytOrderSnapshot(
    @Param('externalOrderId') externalOrderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.transactionsService.getLytOrderSnapshot(externalOrderId, tenantContext)
  }

  @Get('persistent/snapshots/payments')
  @RequireTenantScope()
  @RequirePermissions(ORDER_READ_PERMISSION)
  listLytPaymentSnapshots(@TenantContext() tenantContext: RequestTenantContext) {
    return this.transactionsService.listLytPaymentSnapshots(tenantContext)
  }

  @Get('persistent/snapshots/payments/:externalPaymentId')
  @RequireTenantScope()
  @RequirePermissions(ORDER_READ_PERMISSION)
  getLytPaymentSnapshot(
    @Param('externalPaymentId') externalPaymentId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.transactionsService.getLytPaymentSnapshot(externalPaymentId, tenantContext)
  }

  @Post('orders/:orderId/timeout-close')
  @RequireTenantScope()
  @RequirePermissions(ORDER_WRITE_PERMISSION)
  timeoutCloseOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: RequestTransactionTimeoutCloseDto
  ) {
    return this.transactionsService.timeoutCloseOrder(orderId, tenantContext, body)
  }

  @Post('orders/batch-timeout-close')
  @RequireTenantScope()
  @RequirePermissions(ORDER_WRITE_PERMISSION)
  batchTimeoutCloseOrders(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: BatchTimeoutCloseOrdersDto
  ) {
    return this.transactionsService.batchTimeoutCloseOrders(tenantContext, body)
  }

  @Post('orders/:orderId/manual-close')
  @RequireTenantScope()
  @RequirePermissions(ORDER_WRITE_PERMISSION)
  manualCloseOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: RequestTransactionManualCloseDto
  ) {
    return this.transactionsService.manualCloseOrder(orderId, tenantContext, body)
  }

  @Get('orders/:orderId/refunds')
  @RequireTenantScope()
  @RequirePermissions(ORDER_READ_PERMISSION)
  listOrderRefunds(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.transactionsService.listOrderRefunds(orderId, tenantContext)
  }

  @Get('refunds')
  @RequireTenantScope()
  @RequirePermissions(ORDER_READ_PERMISSION)
  listRefunds(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ListTransactionRefundsQueryDto = {} as ListTransactionRefundsQueryDto
  ) {
    return this.transactionsService.listRefunds(tenantContext, query)
  }

  @Get('refunds/pending')
  @RequireTenantScope()
  @RequirePermissions(ORDER_READ_PERMISSION)
  listPendingRefunds(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ListTransactionRefundsQueryDto = {} as ListTransactionRefundsQueryDto
  ) {
    return this.transactionsService.listPendingRefunds(tenantContext, query)
  }

  @Get('refunds/dashboard')
  @RequireTenantScope()
  @RequirePermissions(ORDER_READ_PERMISSION)
  getRefundDashboard(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: GetTransactionRefundDashboardQueryDto = {} as GetTransactionRefundDashboardQueryDto
  ) {
    return this.transactionsService.getRefundDashboard(tenantContext, query)
  }

  @Get('refunds/:refundId')
  @RequireTenantScope()
  @RequirePermissions(ORDER_READ_PERMISSION)
  getRefund(
    @Param('refundId') refundId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.transactionsService.getRefund(refundId, tenantContext)
  }

  @Post('orders/:orderId/refunds')
  @RequireTenantScope()
  @RequirePermissions(ORDER_REFUND_PERMISSION)
  requestRefund(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: RequestTransactionRefundDto
  ) {
    return this.transactionsService.requestRefund(orderId, tenantContext, body)
  }

  @Post('refunds/:refundId/approve')
  @RequireTenantScope()
  @RequirePermissions(ORDER_REFUND_PERMISSION)
  approveRefund(
    @Param('refundId') refundId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: ReviewTransactionRefundDto
  ) {
    return this.transactionsService.approveRefund(refundId, tenantContext, body)
  }

  @Post('refunds/:refundId/reject')
  @RequireTenantScope()
  @RequirePermissions(ORDER_REFUND_PERMISSION)
  rejectRefund(
    @Param('refundId') refundId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: ReviewTransactionRefundDto
  ) {
    return this.transactionsService.rejectRefund(refundId, tenantContext, body)
  }

  @Post('refunds/batch-approve')
  @RequireTenantScope()
  @RequirePermissions(ORDER_REFUND_PERMISSION)
  batchApproveRefunds(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: BatchReviewTransactionRefundsDto
  ) {
    return this.transactionsService.batchApproveRefunds(tenantContext, body)
  }

  @Post('refunds/batch-reject')
  @RequireTenantScope()
  @RequirePermissions(ORDER_REFUND_PERMISSION)
  batchRejectRefunds(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: BatchReviewTransactionRefundsDto
  ) {
    return this.transactionsService.batchRejectRefunds(tenantContext, body)
  }

  @Post('refunds/batch-assign')
  @RequireTenantScope()
  @RequirePermissions(ORDER_REFUND_PERMISSION)
  batchAssignRefunds(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: BatchAssignTransactionRefundsDto
  ) {
    return this.transactionsService.batchAssignRefunds(tenantContext, body)
  }

  @Post('refunds/batch-claim')
  @RequireTenantScope()
  @RequirePermissions(ORDER_REFUND_PERMISSION)
  batchClaimRefunds(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: BatchClaimTransactionRefundsDto
  ) {
    return this.transactionsService.batchClaimRefunds(tenantContext, body)
  }

  @Get('members/:memberId')
  @RequireTenantScope()
  @RequirePermissions(ORDER_READ_PERMISSION)
  listMemberTransactions(
    @Param('memberId') memberId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.transactionsService.listMemberTransactions(memberId, tenantContext)
  }

  @Get('members/:memberId/refunds')
  @RequireTenantScope()
  @RequirePermissions(ORDER_READ_PERMISSION)
  listMemberRefunds(
    @Param('memberId') memberId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ListTransactionRefundsQueryDto
  ) {
    return this.transactionsService.listRefunds(tenantContext, {
      ...query,
      memberId
    })
  }
}
