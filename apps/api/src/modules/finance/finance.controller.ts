import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'

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
  DailyRevenueQueryDto,
  CreateArchivalDto,
  ArchivalQueryDto
} from './finance.dto'
import { FinanceService } from './finance.service'
import { FinanceArchivalService } from './finance-archival.service'

@UseGuards(TenantGuard)
@Controller('finance')
export class FinanceController {
  constructor(
    @Inject(FinanceService) private readonly financeService: FinanceService,
    @Inject(FinanceArchivalService) private readonly archivalService: FinanceArchivalService
  ) {}

  private get resolvedFinanceService() {
    return this.financeService as FinanceService & {
      listLedgersResolved?: (
        tenantContext: RequestTenantContext,
        query?: LedgerQueryDto
      ) => Promise<ReturnType<FinanceService['listLedgers']>>
      getLedgerResolved?: (
        ledgerId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceService['getLedger']>>
      deleteLedgerResolved?: (
        ledgerId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceService['deleteLedger']>>
      listAccountsResolved?: (
        tenantContext: RequestTenantContext,
        storeId?: string
      ) => Promise<ReturnType<FinanceService['listAccounts']>>
      getAccountResolved?: (
        accountId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceService['getAccount']>>
      getAccountBalanceResolved?: (
        accountId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceService['getAccountBalance']>>
      freezeAccountResolved?: (
        accountId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceService['freezeAccount']>>
      closeAccountResolved?: (
        accountId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceService['closeAccount']>>
      listSettlementsResolved?: (
        tenantContext: RequestTenantContext,
        query?: SettlementQueryDto
      ) => Promise<ReturnType<FinanceService['listSettlements']>>
      getSettlementResolved?: (
        settlementId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceService['getSettlement']>>
      getSettlementDetailResolved?: (
        settlementId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceService['getSettlementDetail']>>
      confirmSettlementResolved?: (
        settlementId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceService['confirmSettlement']>>
      disputeSettlementResolved?: (
        settlementId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceService['disputeSettlement']>>
      createInvoiceResolved?: (
        tenantContext: RequestTenantContext,
        body: CreateInvoiceDto
      ) => Promise<Awaited<ReturnType<FinanceService['createInvoice']>>>
      listInvoicesResolved?: (
        tenantContext: RequestTenantContext,
        query?: InvoiceQueryDto
      ) => Promise<ReturnType<FinanceService['listInvoices']>>
      getInvoiceResolved?: (
        invoiceId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceService['getInvoice']>>
      issueInvoiceResolved?: (
        invoiceId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceService['issueInvoice']>>
      cancelInvoiceResolved?: (
        invoiceId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceService['cancelInvoice']>>
      getRevenueSummaryResolved?: (
        tenantContext: RequestTenantContext,
        query?: RevenueSummaryQueryDto
      ) => Promise<ReturnType<FinanceService['getRevenueSummary']>>
      getDailyRevenueResolved?: (
        tenantContext: RequestTenantContext,
        query: DailyRevenueQueryDto
      ) => Promise<ReturnType<FinanceService['getDailyRevenue']>>
      finalizeSettlementResolved?: (
        settlementId: string,
        tenantContext: RequestTenantContext
      ) => Promise<ReturnType<FinanceService['confirmSettlement']>>
    }
  }

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
    if (this.resolvedFinanceService.listLedgersResolved) {
      return this.resolvedFinanceService.listLedgersResolved(tenantContext, query)
    }
    return this.financeService.listLedgers(tenantContext, query)
  }

  @Get('ledgers/:ledgerId')
  getLedger(
    @Param('ledgerId') ledgerId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedFinanceService.getLedgerResolved) {
      return this.resolvedFinanceService.getLedgerResolved(ledgerId, tenantContext)
    }
    return this.financeService.getLedger(ledgerId, tenantContext)
  }

  @Delete('ledgers/:ledgerId')
  deleteLedger(
    @Param('ledgerId') ledgerId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedFinanceService.deleteLedgerResolved) {
      return this.resolvedFinanceService.deleteLedgerResolved(ledgerId, tenantContext)
    }
    return this.financeService.deleteLedger(ledgerId, tenantContext)
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
    if (this.resolvedFinanceService.listAccountsResolved) {
      return this.resolvedFinanceService.listAccountsResolved(tenantContext, storeId)
    }
    return this.financeService.listAccounts(tenantContext, storeId)
  }

  @Get('accounts/:accountId')
  getAccount(
    @Param('accountId') accountId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedFinanceService.getAccountResolved) {
      return this.resolvedFinanceService.getAccountResolved(accountId, tenantContext)
    }
    return this.financeService.getAccount(accountId, tenantContext)
  }

  @Get('accounts/:accountId/balance')
  getAccountBalance(
    @Param('accountId') accountId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedFinanceService.getAccountBalanceResolved) {
      return this.resolvedFinanceService.getAccountBalanceResolved(accountId, tenantContext)
    }
    return this.financeService.getAccountBalance(accountId, tenantContext)
  }

  @Post('accounts/:accountId/freeze')
  freezeAccount(
    @Param('accountId') accountId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedFinanceService.freezeAccountResolved) {
      return this.resolvedFinanceService.freezeAccountResolved(accountId, tenantContext)
    }
    return this.financeService.freezeAccount(accountId, tenantContext)
  }

  @Post('accounts/:accountId/close')
  closeAccount(
    @Param('accountId') accountId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedFinanceService.closeAccountResolved) {
      return this.resolvedFinanceService.closeAccountResolved(accountId, tenantContext)
    }
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
    if (this.resolvedFinanceService.listSettlementsResolved) {
      return this.resolvedFinanceService.listSettlementsResolved(tenantContext, query)
    }
    return this.financeService.listSettlements(tenantContext, query)
  }

  @Get('settlements/:settlementId')
  getSettlement(
    @Param('settlementId') settlementId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedFinanceService.getSettlementResolved) {
      return this.resolvedFinanceService.getSettlementResolved(settlementId, tenantContext)
    }
    return this.financeService.getSettlement(settlementId, tenantContext)
  }

  @Get('settlements/:settlementId/detail')
  getSettlementDetail(
    @Param('settlementId') settlementId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedFinanceService.getSettlementDetailResolved) {
      return this.resolvedFinanceService.getSettlementDetailResolved(settlementId, tenantContext)
    }
    return this.financeService.getSettlementDetail(settlementId, tenantContext)
  }

  @Post('settlements/:settlementId/confirm')
  confirmSettlement(
    @Param('settlementId') settlementId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedFinanceService.confirmSettlementResolved) {
      return this.resolvedFinanceService.confirmSettlementResolved(settlementId, tenantContext)
    }
    return this.financeService.confirmSettlement(settlementId, tenantContext)
  }

  @Post('settlements/:settlementId/dispute')
  disputeSettlement(
    @Param('settlementId') settlementId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedFinanceService.disputeSettlementResolved) {
      return this.resolvedFinanceService.disputeSettlementResolved(settlementId, tenantContext)
    }
    return this.financeService.disputeSettlement(settlementId, tenantContext)
  }

  @Post('settlements/:settlementId/finalize')
  finalizeSettlement(
    @Param('settlementId') settlementId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedFinanceService.finalizeSettlementResolved) {
      return this.resolvedFinanceService.finalizeSettlementResolved(settlementId, tenantContext)
    }
    return this.financeService.confirmSettlement(settlementId, tenantContext)
  }

  // ── Invoice ──

  @Post('invoices')
  createInvoice(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateInvoiceDto
  ) {
    if (this.resolvedFinanceService.createInvoiceResolved) {
      return this.resolvedFinanceService.createInvoiceResolved(tenantContext, body)
    }
    return this.financeService.createInvoice(tenantContext, body)
  }

  @Get('invoices')
  listInvoices(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: InvoiceQueryDto = {} as InvoiceQueryDto
  ) {
    if (this.resolvedFinanceService.listInvoicesResolved) {
      return this.resolvedFinanceService.listInvoicesResolved(tenantContext, query)
    }
    return this.financeService.listInvoices(tenantContext, query)
  }

  @Get('invoices/:invoiceId')
  getInvoice(
    @Param('invoiceId') invoiceId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedFinanceService.getInvoiceResolved) {
      return this.resolvedFinanceService.getInvoiceResolved(invoiceId, tenantContext)
    }
    return this.financeService.getInvoice(invoiceId, tenantContext)
  }

  @Post('invoices/:invoiceId/issue')
  issueInvoice(
    @Param('invoiceId') invoiceId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedFinanceService.issueInvoiceResolved) {
      return this.resolvedFinanceService.issueInvoiceResolved(invoiceId, tenantContext)
    }
    return this.financeService.issueInvoice(invoiceId, tenantContext)
  }

  @Post('invoices/:invoiceId/cancel')
  cancelInvoice(
    @Param('invoiceId') invoiceId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    if (this.resolvedFinanceService.cancelInvoiceResolved) {
      return this.resolvedFinanceService.cancelInvoiceResolved(invoiceId, tenantContext)
    }
    return this.financeService.cancelInvoice(invoiceId, tenantContext)
  }

  // ── Revenue Summary ──

  @Get('revenue/summary')
  getRevenueSummary(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: RevenueSummaryQueryDto = {} as RevenueSummaryQueryDto
  ) {
    if (this.resolvedFinanceService.getRevenueSummaryResolved) {
      return this.resolvedFinanceService.getRevenueSummaryResolved(tenantContext, query)
    }
    return this.financeService.getRevenueSummary(tenantContext, query)
  }

  @Get('revenue-summary')
  getRevenueSummaryAlias(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: RevenueSummaryQueryDto = {} as RevenueSummaryQueryDto
  ) {
    return this.getRevenueSummary(tenantContext, query)
  }

  @Get('revenue/daily')
  getDailyRevenue(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: DailyRevenueQueryDto = {} as DailyRevenueQueryDto
  ) {
    if (this.resolvedFinanceService.getDailyRevenueResolved) {
      return this.resolvedFinanceService.getDailyRevenueResolved(tenantContext, query)
    }
    return this.financeService.getDailyRevenue(tenantContext, query)
  }

  @Get('daily-revenue')
  getDailyRevenueAlias(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: DailyRevenueQueryDto = {} as DailyRevenueQueryDto
  ) {
    return this.getDailyRevenue(tenantContext, query)
  }

  // ── Archival ──

  @Post('archivals')
  createArchival(
    @TenantContext() tenantContext: RequestTenantContext,
    @Body() body: CreateArchivalDto
  ) {
    return this.archivalService.archive(tenantContext, body)
  }

  @Get('archivals')
  listArchivals(
    @TenantContext() tenantContext: RequestTenantContext,
    @Query() query: ArchivalQueryDto = {} as ArchivalQueryDto
  ) {
    return this.archivalService.listArchivals(tenantContext, query)
  }

  @Get('archivals/:archivalId')
  getArchival(
    @Param('archivalId') archivalId: string,
    @TenantContext() tenantContext: RequestTenantContext
  ) {
    return this.archivalService.getArchival(archivalId, tenantContext)
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
