import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'

import { TenantGuard } from '../agent/tenant.guard'

import { TenantContext } from '../tenant/tenant.decorator'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  CreateLedgerDto,
  LedgerQueryDto,
  CreateAccountDto,
  CreateSettlementDto,
  SettlementQueryDto,
  CreateInvoiceDto,
  InvoiceQueryDto,
  RevenueSummaryQueryDto,
  DailyRevenueQueryDto
} from './finance.dto'
import { FinanceService } from './finance.service'

@UseGuards(TenantGuard)
@Controller('finance')
export class FinanceController {
  constructor(private readonly financeService: FinanceService) {}

  // ── Ledger ──

  @Post('ledgers')
  recordLedger(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateLedgerDto
  ) {
    return this.financeService.recordLedger(tenantContext, body)
  }

  @Get('ledgers')
  listLedgers(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: LedgerQueryDto = {} as LedgerQueryDto
  ) {
    return this.financeService.listLedgers(tenantContext, query)
  }

  @Get('ledgers/:ledgerId')
  getLedger(
    @Param('ledgerId') ledgerId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.financeService.getLedger(ledgerId, tenantContext)
  }

  // ── Account ──

  @Post('accounts')
  createAccount(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateAccountDto
  ) {
    return this.financeService.createAccount(tenantContext, body)
  }

  @Get('accounts')
  listAccounts(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query('storeId') storeId?: string
  ) {
    return this.financeService.listAccounts(tenantContext, storeId)
  }

  @Get('accounts/:accountId')
  getAccount(
    @Param('accountId') accountId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.financeService.getAccount(accountId, tenantContext)
  }

  @Get('accounts/:accountId/balance')
  getAccountBalance(
    @Param('accountId') accountId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.financeService.getAccountBalance(accountId, tenantContext)
  }

  @Post('accounts/:accountId/freeze')
  freezeAccount(
    @Param('accountId') accountId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.financeService.freezeAccount(accountId, tenantContext)
  }

  @Post('accounts/:accountId/close')
  closeAccount(
    @Param('accountId') accountId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.financeService.closeAccount(accountId, tenantContext)
  }

  // ── Settlement ──

  @Post('settlements')
  createSettlement(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateSettlementDto
  ) {
    return this.financeService.createSettlement(tenantContext, body)
  }

  @Get('settlements')
  listSettlements(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: SettlementQueryDto = {} as SettlementQueryDto
  ) {
    return this.financeService.listSettlements(tenantContext, query)
  }

  @Get('settlements/:settlementId')
  getSettlement(
    @Param('settlementId') settlementId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.financeService.getSettlement(settlementId, tenantContext)
  }

  @Get('settlements/:settlementId/detail')
  getSettlementDetail(
    @Param('settlementId') settlementId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.financeService.getSettlementDetail(settlementId, tenantContext)
  }

  @Post('settlements/:settlementId/confirm')
  confirmSettlement(
    @Param('settlementId') settlementId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.financeService.confirmSettlement(settlementId, tenantContext)
  }

  @Post('settlements/:settlementId/dispute')
  disputeSettlement(
    @Param('settlementId') settlementId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.financeService.disputeSettlement(settlementId, tenantContext)
  }

  // ── Invoice ──

  @Post('invoices')
  createInvoice(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateInvoiceDto
  ) {
    return this.financeService.createInvoice(tenantContext, body)
  }

  @Get('invoices')
  listInvoices(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: InvoiceQueryDto = {} as InvoiceQueryDto
  ) {
    return this.financeService.listInvoices(tenantContext, query)
  }

  @Get('invoices/:invoiceId')
  getInvoice(
    @Param('invoiceId') invoiceId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.financeService.getInvoice(invoiceId, tenantContext)
  }

  @Post('invoices/:invoiceId/issue')
  issueInvoice(
    @Param('invoiceId') invoiceId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.financeService.issueInvoice(invoiceId, tenantContext)
  }

  @Post('invoices/:invoiceId/cancel')
  cancelInvoice(
    @Param('invoiceId') invoiceId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.financeService.cancelInvoice(invoiceId, tenantContext)
  }

  // ── Revenue Summary ──

  @Get('revenue/summary')
  getRevenueSummary(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: RevenueSummaryQueryDto = {} as RevenueSummaryQueryDto
  ) {
    return this.financeService.getRevenueSummary(tenantContext, query)
  }

  @Get('revenue/daily')
  getDailyRevenue(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: DailyRevenueQueryDto = {} as DailyRevenueQueryDto
  ) {
    return this.financeService.getDailyRevenue(tenantContext, query)
  }

  // ── Transaction Integration ──

  @Post('transactions/revenue')
  recordTransactionRevenue(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: { orderId: string; transactionId: string; amount: number; description: string; category?: string }
  ) {
    return this.financeService.recordTransactionRevenue(tenantContext, body)
  }

  @Post('transactions/refund')
  recordTransactionRefund(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: { orderId: string; transactionId: string; amount: number; description: string }
  ) {
    return this.financeService.recordTransactionRefund(tenantContext, body)
  }
}
