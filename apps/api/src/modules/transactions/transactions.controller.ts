import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { CashierPaymentCallbackDto } from '../cashier/cashier.dto'
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

@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Post('checkout')
  startCheckout(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateTransactionCheckoutDto
  ) {
    return this.transactionsService.startCheckout(tenantContext, body)
  }

  @Post('payments/standardized-callback')
  applyPaymentCallback(@Body() body: CashierPaymentCallbackDto) {
    return this.transactionsService.applyPaymentCallback(body)
  }

  @Get('orders/:orderId')
  getOrderTransaction(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.transactionsService.getOrderTransaction(orderId, tenantContext)
  }

  @Get('orders')
  listOrderTransactions(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ListTransactionOrdersQueryDto = {} as ListTransactionOrdersQueryDto
  ) {
    return this.transactionsService.listOrderListPage(tenantContext, query)
  }

  @Get('persistent/snapshots/orders')
  listLytOrderSnapshots(@TenantContext() tenantContext: RequestTenantContext) {
    return this.transactionsService.listLytOrderSnapshots(tenantContext)
  }

  @Get('persistent/snapshots/orders/:externalOrderId')
  getLytOrderSnapshot(
    @Param('externalOrderId') externalOrderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.transactionsService.getLytOrderSnapshot(externalOrderId, tenantContext)
  }

  @Get('persistent/snapshots/payments')
  listLytPaymentSnapshots(@TenantContext() tenantContext: RequestTenantContext) {
    return this.transactionsService.listLytPaymentSnapshots(tenantContext)
  }

  @Get('persistent/snapshots/payments/:externalPaymentId')
  getLytPaymentSnapshot(
    @Param('externalPaymentId') externalPaymentId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.transactionsService.getLytPaymentSnapshot(externalPaymentId, tenantContext)
  }

  @Post('orders/:orderId/timeout-close')
  timeoutCloseOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: RequestTransactionTimeoutCloseDto
  ) {
    return this.transactionsService.timeoutCloseOrder(orderId, tenantContext, body)
  }

  @Post('orders/batch-timeout-close')
  batchTimeoutCloseOrders(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: BatchTimeoutCloseOrdersDto
  ) {
    return this.transactionsService.batchTimeoutCloseOrders(tenantContext, body)
  }

  @Post('orders/:orderId/manual-close')
  manualCloseOrder(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: RequestTransactionManualCloseDto
  ) {
    return this.transactionsService.manualCloseOrder(orderId, tenantContext, body)
  }

  @Get('orders/:orderId/refunds')
  listOrderRefunds(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.transactionsService.listOrderRefunds(orderId, tenantContext)
  }

  @Get('refunds')
  listRefunds(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ListTransactionRefundsQueryDto = {} as ListTransactionRefundsQueryDto
  ) {
    return this.transactionsService.listRefunds(tenantContext, query)
  }

  @Get('refunds/pending')
  listPendingRefunds(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ListTransactionRefundsQueryDto = {} as ListTransactionRefundsQueryDto
  ) {
    return this.transactionsService.listPendingRefunds(tenantContext, query)
  }

  @Get('refunds/dashboard')
  getRefundDashboard(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: GetTransactionRefundDashboardQueryDto = {} as GetTransactionRefundDashboardQueryDto
  ) {
    return this.transactionsService.getRefundDashboard(tenantContext, query)
  }

  @Get('refunds/:refundId')
  getRefund(
    @Param('refundId') refundId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.transactionsService.getRefund(refundId, tenantContext)
  }

  @Post('orders/:orderId/refunds')
  requestRefund(
    @Param('orderId') orderId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: RequestTransactionRefundDto
  ) {
    return this.transactionsService.requestRefund(orderId, tenantContext, body)
  }

  @Post('refunds/:refundId/approve')
  approveRefund(
    @Param('refundId') refundId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: ReviewTransactionRefundDto
  ) {
    return this.transactionsService.approveRefund(refundId, tenantContext, body)
  }

  @Post('refunds/:refundId/reject')
  rejectRefund(
    @Param('refundId') refundId: string,
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: ReviewTransactionRefundDto
  ) {
    return this.transactionsService.rejectRefund(refundId, tenantContext, body)
  }

  @Post('refunds/batch-approve')
  batchApproveRefunds(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: BatchReviewTransactionRefundsDto
  ) {
    return this.transactionsService.batchApproveRefunds(tenantContext, body)
  }

  @Post('refunds/batch-reject')
  batchRejectRefunds(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: BatchReviewTransactionRefundsDto
  ) {
    return this.transactionsService.batchRejectRefunds(tenantContext, body)
  }

  @Post('refunds/batch-assign')
  batchAssignRefunds(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: BatchAssignTransactionRefundsDto
  ) {
    return this.transactionsService.batchAssignRefunds(tenantContext, body)
  }

  @Post('refunds/batch-claim')
  batchClaimRefunds(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: BatchClaimTransactionRefundsDto
  ) {
    return this.transactionsService.batchClaimRefunds(tenantContext, body)
  }

  @Get('members/:memberId')
  listMemberTransactions(
    @Param('memberId') memberId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.transactionsService.listMemberTransactions(memberId, tenantContext)
  }

  @Get('members/:memberId/refunds')
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
