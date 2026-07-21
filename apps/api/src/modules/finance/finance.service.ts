import { randomUUID } from 'node:crypto'
import { Injectable, Optional } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
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
import {
  LedgerType,
  AccountStatus,
  SettlementStatus,
  InvoiceStatus,
  type Ledger,
  type Account,
  type Settlement,
  type Invoice,
  type RevenueSummary,
  type DailyRevenue
} from './finance.entity'

const ledgerStore = new Map<string, Ledger>()
const accountStore = new Map<string, Account>()
const settlementStore = new Map<string, Settlement>()
const invoiceStore = new Map<string, Invoice>()

export function resetFinanceServiceTestState() {
  ledgerStore.clear()
  accountStore.clear()
  settlementStore.clear()
  invoiceStore.clear()
}

@Injectable()
export class FinanceService {
  constructor(
    @Optional() private readonly prisma?: PrismaService
  ) {}

  private getLedgerModel():
    | {
        findMany?: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>
        findUnique?: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>
        create?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
      }
    | undefined {
    const prisma = this.prisma as unknown as Record<string, unknown> | undefined
    const model = prisma?.financeLedger
    if (!model || typeof model !== 'object') {
      return undefined
    }
    return model as {
      findMany?: (args: Record<string, unknown>) => Promise<Array<Record<string, unknown>>>
      findUnique?: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>
      create?: (args: Record<string, unknown>) => Promise<Record<string, unknown>>
    }
  }

  private normalizeLedgerOptionalString(value: unknown): string | undefined {
    if (typeof value !== 'string') {
      return undefined
    }
    const normalized = value.trim()
    return normalized.length ? normalized : undefined
  }

  private normalizeLedgerDate(value: unknown): string {
    if (value instanceof Date) {
      return value.toISOString()
    }
    if (typeof value === 'string') {
      return value
    }
    return new Date().toISOString()
  }

  private toLedgerEntity(record: Record<string, unknown>): Ledger {
    return {
      id: String(record.id),
      tenantId: String(record.tenantId),
      brandId: this.normalizeLedgerOptionalString(record.brandId),
      storeId: this.normalizeLedgerOptionalString(record.storeId),
      type: String(record.type) as LedgerType,
      amount: Number(record.amount ?? 0),
      balance: Number(record.balance ?? 0),
      orderId: this.normalizeLedgerOptionalString(record.orderId),
      transactionId: this.normalizeLedgerOptionalString(record.transactionId),
      description: this.normalizeLedgerOptionalString(record.description) ?? '',
      category: this.normalizeLedgerOptionalString(record.category),
      recordedAt: this.normalizeLedgerDate(record.recordedAt),
      createdAt: this.normalizeLedgerDate(record.createdAt)
    }
  }

  private calculateLedgerBalance(entries: Ledger[], input: CreateLedgerDto) {
    const currentBalance = entries.reduce((sum, ledger) => {
      if (ledger.type === LedgerType.Revenue || ledger.type === LedgerType.Adjustment) {
        return sum + ledger.amount
      }
      return sum - ledger.amount
    }, 0)

    return input.type === LedgerType.Revenue || input.type === LedgerType.Adjustment
      ? currentBalance + input.amount
      : currentBalance - input.amount
  }

  private filterLedgers(
    ledgers: Ledger[],
    tenantContext: RequestTenantContext,
    query?: LedgerQueryDto
  ): Ledger[] {
    const limit = query?.limit && query.limit > 0 ? query.limit : undefined

    const filtered = ledgers
      .filter((ledger) => ledger.tenantId === tenantContext.tenantId)
      .filter((ledger) => !query?.type || ledger.type === query.type)
      .filter((ledger) => !query?.storeId || ledger.storeId === query.storeId)
      .filter((ledger) => !query?.orderId || ledger.orderId === query.orderId)
      .filter((ledger) => !query?.transactionId || ledger.transactionId === query.transactionId)
      .filter((ledger) => !query?.category || ledger.category === query.category)
      .filter((ledger) => !query?.recordedAfter || ledger.recordedAt >= query.recordedAfter)
      .filter((ledger) => !query?.recordedBefore || ledger.recordedAt <= query.recordedBefore)
      .sort((a, b) => b.recordedAt.localeCompare(a.recordedAt))

    return typeof limit === 'number' ? filtered.slice(0, limit) : filtered
  }

  async listLedgersResolved(
    tenantContext: RequestTenantContext,
    query?: LedgerQueryDto
  ): Promise<Ledger[]> {
    const ledgerModel = this.getLedgerModel()
    if (!ledgerModel?.findMany) {
      return this.listLedgers(tenantContext, query)
    }

    const where: Record<string, unknown> = {
      tenantId: tenantContext.tenantId
    }
    if (query?.type) {
      where.type = query.type
    }
    if (query?.storeId) {
      where.storeId = query.storeId
    }
    if (query?.orderId) {
      where.orderId = query.orderId
    }
    if (query?.transactionId) {
      where.transactionId = query.transactionId
    }
    if (query?.category) {
      where.category = query.category
    }
    if (query?.recordedAfter || query?.recordedBefore) {
      where.recordedAt = {
        ...(query?.recordedAfter ? { gte: new Date(query.recordedAfter) } : {}),
        ...(query?.recordedBefore ? { lte: new Date(query.recordedBefore) } : {})
      }
    }

    const records = await ledgerModel.findMany({
      where,
      orderBy: [{ recordedAt: 'desc' }],
      ...(query?.limit && query.limit > 0 ? { take: query.limit } : {})
    })
    const ledgers = records.map((record) => this.toLedgerEntity(record))
    for (const ledger of ledgers) {
      ledgerStore.set(ledger.id, ledger)
    }
    return ledgers
  }

  async getLedgerResolved(
    ledgerId: string,
    tenantContext: RequestTenantContext
  ): Promise<Ledger> {
    const ledgerModel = this.getLedgerModel()
    if (!ledgerModel?.findUnique) {
      return this.getLedger(ledgerId, tenantContext)
    }

    const record = await ledgerModel.findUnique({
      where: { id: ledgerId }
    })
    if (!record) {
      throw new Error(`Ledger ${ledgerId} not found`)
    }

    const ledger = this.toLedgerEntity(record)
    if (ledger.tenantId !== tenantContext.tenantId) {
      throw new Error(`Ledger ${ledgerId} not found`)
    }

    ledgerStore.set(ledger.id, ledger)
    return ledger
  }

  async getSettlementDetailResolved(
    settlementId: string,
    tenantContext: RequestTenantContext
  ): Promise<{ settlement: Settlement; ledgers: Ledger[] }> {
    const settlement = this.getSettlement(settlementId, tenantContext)
    const ledgers = await this.listLedgersResolved(tenantContext, {
      storeId: settlement.storeId,
      recordedAfter: settlement.startDate,
      recordedBefore: settlement.endDate
    })
    return { settlement, ledgers }
  }

  async getRevenueSummaryResolved(
    tenantContext: RequestTenantContext,
    query?: RevenueSummaryQueryDto
  ): Promise<RevenueSummary> {
    const storeId = query?.storeId ?? tenantContext.storeId
    const startDate = query?.startDate ?? this.getDefaultStartDate()
    const endDate = query?.endDate ?? new Date().toISOString()

    const ledgers = await this.listLedgersResolved(tenantContext, {
      storeId,
      recordedAfter: startDate,
      recordedBefore: endDate
    })

    const totalRevenue = ledgers
      .filter((ledger) => ledger.type === LedgerType.Revenue)
      .reduce((sum, ledger) => sum + ledger.amount, 0)

    const totalExpense = ledgers
      .filter((ledger) => ledger.type === LedgerType.Expense)
      .reduce((sum, ledger) => sum + ledger.amount, 0)

    const totalRefund = ledgers
      .filter((ledger) => ledger.type === LedgerType.Refund)
      .reduce((sum, ledger) => sum + ledger.amount, 0)

    return {
      storeId,
      totalRevenue,
      totalExpense,
      totalRefund,
      netRevenue: totalRevenue - totalExpense - totalRefund,
      transactionCount: ledgers.length,
      periodStart: startDate,
      periodEnd: endDate
    }
  }

  async getDailyRevenueResolved(
    tenantContext: RequestTenantContext,
    query: DailyRevenueQueryDto
  ): Promise<DailyRevenue> {
    const storeId = query.storeId ?? tenantContext.storeId
    const date = query.date
    const dayStart = `${date}T00:00:00.000Z`
    const dayEnd = `${date}T23:59:59.999Z`

    const ledgers = await this.listLedgersResolved(tenantContext, {
      storeId,
      recordedAfter: dayStart,
      recordedBefore: dayEnd
    })

    const revenue = ledgers
      .filter((ledger) => ledger.type === LedgerType.Revenue)
      .reduce((sum, ledger) => sum + ledger.amount, 0)

    const expense = ledgers
      .filter((ledger) => ledger.type === LedgerType.Expense)
      .reduce((sum, ledger) => sum + ledger.amount, 0)

    const refund = ledgers
      .filter((ledger) => ledger.type === LedgerType.Refund)
      .reduce((sum, ledger) => sum + ledger.amount, 0)

    return {
      date,
      storeId,
      revenue,
      expense,
      refund,
      netRevenue: revenue - expense - refund,
      transactionCount: ledgers.length
    }
  }

  // ═══════════════════════════════════════════════════
  // 记账 (Ledger)
  // ═══════════════════════════════════════════════════

  async recordLedger(
    tenantContext: RequestTenantContext,
    input: CreateLedgerDto
  ): Promise<Ledger> {
    const now = new Date().toISOString()
    const tenantEntries = await this.listLedgersResolved(tenantContext)
    const balance = this.calculateLedgerBalance(tenantEntries, input)

    const ledger: Ledger = {
      id: `ledger-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      brandId: tenantContext.brandId,
      storeId: tenantContext.storeId,
      type: input.type,
      amount: input.amount,
      balance,
      orderId: input.orderId,
      transactionId: input.transactionId,
      description: input.description,
      category: input.category,
      recordedAt: input.recordedAt ?? now,
      createdAt: now
    }

    const ledgerModel = this.getLedgerModel()
    if (ledgerModel?.create) {
      const record = await ledgerModel.create({
        data: {
          id: ledger.id,
          tenantId: ledger.tenantId,
          brandId: ledger.brandId ?? null,
          storeId: ledger.storeId ?? null,
          type: ledger.type,
          amount: ledger.amount,
          balance: ledger.balance,
          orderId: ledger.orderId ?? null,
          transactionId: ledger.transactionId ?? null,
          description: ledger.description,
          category: ledger.category ?? null,
          recordedAt: new Date(ledger.recordedAt),
          createdAt: new Date(ledger.createdAt)
        }
      })
      const persistedLedger = this.toLedgerEntity(record)
      ledgerStore.set(persistedLedger.id, persistedLedger)
      return persistedLedger
    }

    ledgerStore.set(ledger.id, ledger)
    return ledger
  }

  listLedgers(
    tenantContext: RequestTenantContext,
    query?: LedgerQueryDto
  ): Ledger[] {
    return this.filterLedgers(Array.from(ledgerStore.values()), tenantContext, query)
  }

  getLedger(
    ledgerId: string,
    tenantContext: RequestTenantContext
  ): Ledger {
    const ledger = ledgerStore.get(ledgerId)
    if (!ledger || ledger.tenantId !== tenantContext.tenantId) {
      throw new Error(`Ledger ${ledgerId} not found`)
    }
    return ledger
  }

  deleteLedger(
    ledgerId: string,
    tenantContext: RequestTenantContext
  ): { success: boolean } {
    this.getLedger(ledgerId, tenantContext)
    ledgerStore.delete(ledgerId)
    return { success: true }
  }

  // ═══════════════════════════════════════════════════
  // 账户管理 (Account)
  // ═══════════════════════════════════════════════════

  async createAccount(
    tenantContext: RequestTenantContext,
    input: CreateAccountDto
  ): Promise<Account> {
    const now = new Date().toISOString()
    const account: Account = {
      id: `acct-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      storeId: input.storeId ?? tenantContext.storeId,
      name: input.name,
      type: input.type,
      balance: input.initialBalance ?? 0,
      status: AccountStatus.Active,
      createdAt: now,
      updatedAt: now
    }

    accountStore.set(account.id, account)
    return account
  }

  getAccount(
    accountId: string,
    tenantContext: RequestTenantContext
  ): Account {
    const account = accountStore.get(accountId)
    if (!account || account.tenantId !== tenantContext.tenantId) {
      throw new Error(`Account ${accountId} not found`)
    }
    return account
  }

  getAccountBalance(
    accountId: string,
    tenantContext: RequestTenantContext
  ): Pick<Account, 'id' | 'name' | 'balance' | 'status'> {
    const account = this.getAccount(accountId, tenantContext)
    return {
      id: account.id,
      name: account.name,
      balance: account.balance,
      status: account.status
    }
  }

  listAccounts(
    tenantContext: RequestTenantContext,
    storeId?: string
  ): Account[] {
    return Array.from(accountStore.values())
      .filter((a) => a.tenantId === tenantContext.tenantId)
      .filter((a) => !storeId || a.storeId === storeId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  freezeAccount(
    accountId: string,
    tenantContext: RequestTenantContext
  ): Account {
    const account = this.getAccount(accountId, tenantContext)
    if (account.status !== AccountStatus.Active) {
      throw new Error(`Account ${accountId} is not active`)
    }

    account.status = AccountStatus.Frozen
    account.updatedAt = new Date().toISOString()
    return account
  }

  closeAccount(
    accountId: string,
    tenantContext: RequestTenantContext
  ): Account {
    const account = this.getAccount(accountId, tenantContext)
    if (account.status === AccountStatus.Closed) {
      throw new Error(`Account ${accountId} is already closed`)
    }

    account.status = AccountStatus.Closed
    account.updatedAt = new Date().toISOString()
    return account
  }

  // ═══════════════════════════════════════════════════
  // 结算 (Settlement)
  // ═══════════════════════════════════════════════════

  async createSettlement(
    tenantContext: RequestTenantContext,
    input: CreateSettlementDto
  ): Promise<Settlement> {
    if (input.startDate > input.endDate) {
      throw new Error('Settlement start date must be before or equal to end date')
    }
    const now = new Date().toISOString()
    const storeId = input.storeId ?? tenantContext.storeId

    // Auto-calculate from ledgers if not provided
    const ledgers = Array.from(ledgerStore.values())
      .filter((l) => l.tenantId === tenantContext.tenantId)
      .filter((l) => !storeId || l.storeId === storeId)
      .filter((l) => l.recordedAt >= input.startDate && l.recordedAt <= input.endDate)

    const totalRevenue = input.totalRevenue ?? ledgers
      .filter((l) => l.type === LedgerType.Revenue)
      .reduce((sum, l) => sum + l.amount, 0)

    const totalExpense = input.totalExpense ?? ledgers
      .filter((l) => l.type === LedgerType.Expense)
      .reduce((sum, l) => sum + l.amount, 0)

    const netProfit = totalRevenue - totalExpense

    const settlement: Settlement = {
      id: `stl-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      storeId,
      startDate: input.startDate,
      endDate: input.endDate,
      totalRevenue,
      totalExpense,
      netProfit,
      settlementStatus: SettlementStatus.Pending,
      createdAt: now
    }

    settlementStore.set(settlement.id, settlement)
    return settlement
  }

  confirmSettlement(
    settlementId: string,
    tenantContext: RequestTenantContext
  ): Settlement {
    const settlement = this.getSettlement(settlementId, tenantContext)
    if (settlement.settlementStatus !== SettlementStatus.Pending) {
      throw new Error(`Settlement ${settlementId} is not pending confirmation`)
    }

    settlement.settlementStatus = SettlementStatus.Confirmed
    settlement.settledAt = new Date().toISOString()
    return settlement
  }

  disputeSettlement(
    settlementId: string,
    tenantContext: RequestTenantContext
  ): Settlement {
    const settlement = this.getSettlement(settlementId, tenantContext)
    if (settlement.settlementStatus !== SettlementStatus.Pending) {
      throw new Error(`Settlement ${settlementId} is not pending`)
    }

    settlement.settlementStatus = SettlementStatus.Disputed
    return settlement
  }

  getSettlement(
    settlementId: string,
    tenantContext: RequestTenantContext
  ): Settlement {
    const settlement = settlementStore.get(settlementId)
    if (!settlement || settlement.tenantId !== tenantContext.tenantId) {
      throw new Error(`Settlement ${settlementId} not found`)
    }
    return settlement
  }

  getSettlementDetail(
    settlementId: string,
    tenantContext: RequestTenantContext
  ): { settlement: Settlement; ledgers: Ledger[] } {
    const settlement = this.getSettlement(settlementId, tenantContext)
    const ledgers = this.listLedgers(tenantContext, {
      storeId: settlement.storeId,
      recordedAfter: settlement.startDate,
      recordedBefore: settlement.endDate
    })
    return { settlement, ledgers }
  }

  listSettlements(
    tenantContext: RequestTenantContext,
    query?: SettlementQueryDto
  ): Settlement[] {
    const limit = query?.limit && query.limit > 0 ? query.limit : undefined

    const settlements = Array.from(settlementStore.values())
      .filter((s) => s.tenantId === tenantContext.tenantId)
      .filter((s) => !query?.storeId || s.storeId === query.storeId)
      .filter((s) => !query?.settlementStatus || s.settlementStatus === query.settlementStatus)
      .filter((s) => !query?.startAfter || s.startDate >= query.startAfter)
      .filter((s) => !query?.endBefore || s.endDate <= query.endBefore)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    return typeof limit === 'number' ? settlements.slice(0, limit) : settlements
  }

  // ═══════════════════════════════════════════════════
  // 发票 (Invoice)
  // ═══════════════════════════════════════════════════

  async createInvoice(
    tenantContext: RequestTenantContext,
    input: CreateInvoiceDto
  ): Promise<Invoice> {
    const now = new Date().toISOString()
    const taxAmount = input.taxAmount ?? 0
    const invoiceNo = `INV-${Date.now()}-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`

    const invoice: Invoice = {
      id: `inv-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      storeId: tenantContext.storeId,
      orderId: input.orderId,
      invoiceNo,
      amount: input.amount,
      taxAmount,
      totalAmount: input.amount + taxAmount,
      type: input.type,
      status: InvoiceStatus.Draft,
      buyerInfo: input.buyerInfo,
      createdAt: now
    }

    invoiceStore.set(invoice.id, invoice)
    return invoice
  }

  issueInvoice(
    invoiceId: string,
    tenantContext: RequestTenantContext
  ): Invoice {
    const invoice = this.getInvoice(invoiceId, tenantContext)
    if (invoice.status !== InvoiceStatus.Draft) {
      throw new Error(`Invoice ${invoiceId} is not in draft status`)
    }

    invoice.status = InvoiceStatus.Issued
    invoice.issuedAt = new Date().toISOString()
    return invoice
  }

  cancelInvoice(
    invoiceId: string,
    tenantContext: RequestTenantContext
  ): Invoice {
    const invoice = this.getInvoice(invoiceId, tenantContext)
    if (invoice.status === InvoiceStatus.Cancelled) {
      throw new Error(`Invoice ${invoiceId} is already cancelled`)
    }

    invoice.status = InvoiceStatus.Cancelled
    return invoice
  }

  getInvoice(
    invoiceId: string,
    tenantContext: RequestTenantContext
  ): Invoice {
    const invoice = invoiceStore.get(invoiceId)
    if (!invoice || invoice.tenantId !== tenantContext.tenantId) {
      throw new Error(`Invoice ${invoiceId} not found`)
    }
    return invoice
  }

  listInvoices(
    tenantContext: RequestTenantContext,
    query?: InvoiceQueryDto
  ): Invoice[] {
    const limit = query?.limit && query.limit > 0 ? query.limit : undefined

    const invoices = Array.from(invoiceStore.values())
      .filter((i) => i.tenantId === tenantContext.tenantId)
      .filter((i) => !query?.storeId || i.storeId === query.storeId)
      .filter((i) => !query?.orderId || i.orderId === query.orderId)
      .filter((i) => !query?.type || i.type === query.type)
      .filter((i) => !query?.status || i.status === query.status)
      .filter((i) => !query?.issuedAfter || (i.issuedAt && i.issuedAt >= query.issuedAfter))
      .filter((i) => !query?.issuedBefore || (i.issuedAt && i.issuedAt <= query.issuedBefore))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    return typeof limit === 'number' ? invoices.slice(0, limit) : invoices
  }

  // ═══════════════════════════════════════════════════
  // 财务汇总 (Revenue Summary)
  // ═══════════════════════════════════════════════════

  getRevenueSummary(
    tenantContext: RequestTenantContext,
    query?: RevenueSummaryQueryDto
  ): RevenueSummary {
    const storeId = query?.storeId ?? tenantContext.storeId
    const startDate = query?.startDate ?? this.getDefaultStartDate()
    const endDate = query?.endDate ?? new Date().toISOString()

    const ledgers = Array.from(ledgerStore.values())
      .filter((l) => l.tenantId === tenantContext.tenantId)
      .filter((l) => !storeId || l.storeId === storeId)
      .filter((l) => l.recordedAt >= startDate && l.recordedAt <= endDate)

    const totalRevenue = ledgers
      .filter((l) => l.type === LedgerType.Revenue)
      .reduce((sum, l) => sum + l.amount, 0)

    const totalExpense = ledgers
      .filter((l) => l.type === LedgerType.Expense)
      .reduce((sum, l) => sum + l.amount, 0)

    const totalRefund = ledgers
      .filter((l) => l.type === LedgerType.Refund)
      .reduce((sum, l) => sum + l.amount, 0)

    return {
      storeId,
      totalRevenue,
      totalExpense,
      totalRefund,
      netRevenue: totalRevenue - totalExpense - totalRefund,
      transactionCount: ledgers.length,
      periodStart: startDate,
      periodEnd: endDate
    }
  }

  getDailyRevenue(
    tenantContext: RequestTenantContext,
    query: DailyRevenueQueryDto
  ): DailyRevenue {
    const storeId = query.storeId ?? tenantContext.storeId
    const date = query.date
    const dayStart = `${date}T00:00:00.000Z`
    const dayEnd = `${date}T23:59:59.999Z`

    const ledgers = Array.from(ledgerStore.values())
      .filter((l) => l.tenantId === tenantContext.tenantId)
      .filter((l) => !storeId || l.storeId === storeId)
      .filter((l) => l.recordedAt >= dayStart && l.recordedAt <= dayEnd)

    const revenue = ledgers
      .filter((l) => l.type === LedgerType.Revenue)
      .reduce((sum, l) => sum + l.amount, 0)

    const expense = ledgers
      .filter((l) => l.type === LedgerType.Expense)
      .reduce((sum, l) => sum + l.amount, 0)

    const refund = ledgers
      .filter((l) => l.type === LedgerType.Refund)
      .reduce((sum, l) => sum + l.amount, 0)

    return {
      date,
      storeId,
      revenue,
      expense,
      refund,
      netRevenue: revenue - expense - refund,
      transactionCount: ledgers.length
    }
  }

  // ═══════════════════════════════════════════════════
  // 交易联动：每笔交易自动记录应收流水
  // ═══════════════════════════════════════════════════

  async recordTransactionRevenue(
    tenantContext: RequestTenantContext,
    params: {
      orderId: string
      transactionId: string
      amount: number
      description: string
      category?: string
    }
  ): Promise<Ledger> {
    return this.recordLedger(tenantContext, {
      type: LedgerType.Revenue,
      amount: params.amount,
      description: params.description,
      orderId: params.orderId,
      transactionId: params.transactionId,
      category: params.category ?? 'transaction'
    })
  }

  async recordTransactionRefund(
    tenantContext: RequestTenantContext,
    params: {
      orderId: string
      transactionId: string
      amount: number
      description: string
    }
  ): Promise<Ledger> {
    return this.recordLedger(tenantContext, {
      type: LedgerType.Refund,
      amount: params.amount,
      description: params.description,
      orderId: params.orderId,
      transactionId: params.transactionId,
      category: 'refund'
    })
  }

  // ═══════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════

  private getDefaultStartDate(): string {
    const d = new Date()
    d.setDate(1)
    d.setHours(0, 0, 0, 0)
    return d.toISOString()
  }
}
