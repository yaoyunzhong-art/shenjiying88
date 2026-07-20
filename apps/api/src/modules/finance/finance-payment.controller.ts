import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import {
  FinancePaymentService,
  type ListPaymentFilter,
  type ListRefundFilter
} from './finance-payment.service'
import type {
  CreatePaymentInput,
  UpdatePaymentInput,
  CreateRefundInput
} from './finance-payment.entity'

/**
 * Phase-38 T168: /api/finance/payments + /api/finance/refunds 路由
 *
 * 不影响 Phase-6 /api/finance/ledger /api/finance/accounts /api/finance/settlements /api/finance/invoices
 */

interface TenantQuery { tenantId?: string }

@UseGuards(TenantGuard)
@Controller('api/finance')
export class FinancePaymentController {
  constructor(private readonly svc: FinancePaymentService) {}

  // ─── Payment ─────────────────────────────────────────

  @Post('payments')
  @HttpCode(HttpStatus.CREATED)
  createPayment(@Body() body: CreatePaymentInput) {
    return this.svc.create(body)
  }

  @Get('payments')
  listPayments(@Query() q: TenantQuery & Partial<ListPaymentFilter>) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.list(q as ListPaymentFilter)
  }

  @Get('payments/:id')
  getPayment(@Param('id') id: string, @Query() q: TenantQuery) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.getById(id, q.tenantId)
  }

  @Put('payments/:id')
  updatePayment(
    @Param('id') id: string,
    @Query() q: TenantQuery & { version?: string },
    @Body() body: UpdatePaymentInput
  ) {
    if (!q.tenantId) throw new Error('tenantId required')
    const version = parseInt(q.version ?? '0', 10)
    return this.svc.update(id, q.tenantId, version, body)
  }

  @Post('payments/:id/success')
  markPaymentSuccess(@Param('id') id: string, @Query() q: TenantQuery, @Body() body: { transactionId?: string } = {}) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.markSuccess(id, q.tenantId, body.transactionId)
  }

  @Post('payments/:id/fail')
  markPaymentFail(@Param('id') id: string, @Query() q: TenantQuery, @Body() body: { reason?: string } = {}) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.markFailed(id, q.tenantId, body.reason)
  }

  @Get('payments/:id/audit')
  getPaymentAudit(@Param('id') id: string, @Query() q: TenantQuery) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.getPaymentAudit(id, q.tenantId)
  }

  // ─── Refund ──────────────────────────────────────────

  @Post('payments/:id/refunds')
  @HttpCode(HttpStatus.CREATED)
  requestRefund(
    @Param('id') paymentId: string,
    @Body() body: Omit<CreateRefundInput, 'paymentId'>
  ) {
    return this.svc.requestRefund({ ...body, paymentId })
  }

  @Get('payments/:id/refunds')
  listRefundsForPayment(@Param('id') paymentId: string, @Query() q: TenantQuery) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.listRefunds({ tenantId: q.tenantId, paymentId })
  }

  @Get('refunds')
  listRefunds(@Query() q: TenantQuery & Partial<ListRefundFilter>) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.listRefunds(q as ListRefundFilter)
  }

  @Get('refunds/:rid')
  getRefund(@Param('rid') rid: string, @Query() q: TenantQuery) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.getRefundById(rid, q.tenantId)
  }

  @Post('refunds/:rid/approve')
  approveRefund(
    @Param('rid') rid: string,
    @Query() q: TenantQuery,
    @Body() body: { approver: string }
  ) {
    if (!q.tenantId) throw new Error('tenantId required')
    if (!body.approver) throw new Error('approver required')
    return this.svc.approveRefund(rid, q.tenantId, body.approver)
  }

  @Post('refunds/:rid/reject')
  rejectRefund(
    @Param('rid') rid: string,
    @Query() q: TenantQuery,
    @Body() body: { reason: string; rejecter: string }
  ) {
    if (!q.tenantId) throw new Error('tenantId required')
    if (!body.reason) throw new Error('reason required')
    if (!body.rejecter) throw new Error('rejecter required')
    return this.svc.rejectRefund(rid, q.tenantId, body.reason, body.rejecter)
  }

  @Post('refunds/:rid/complete')
  completeRefund(
    @Param('rid') rid: string,
    @Query() q: TenantQuery,
    @Body() body: { refundTransactionId?: string } = {}
  ) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.completeRefund(rid, q.tenantId, body.refundTransactionId)
  }

  @Get('refunds/:rid/audit')
  getRefundAudit(@Param('rid') rid: string, @Query() q: TenantQuery) {
    if (!q.tenantId) throw new Error('tenantId required')
    return this.svc.getRefundAudit(rid, q.tenantId)
  }
}
