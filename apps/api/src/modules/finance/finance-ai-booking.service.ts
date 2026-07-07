import { Injectable } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

// ══════════════════════════════════════════════════════════════════════════════
// Types & Interfaces
// ══════════════════════════════════════════════════════════════════════════════

export enum TransactionType {
  Income = 'INCOME',
  Expense = 'EXPENSE',
  Refund = 'REFUND'
}

export enum TransactionCategory {
  Food = 'FOOD',
  Beverage = 'BEVERAGE',
  Merchandise = 'MERCHANDISE',
  Service = 'SERVICE',
  Other = 'OTHER'
}

export enum ReconciliationStatus {
  Pending = 'PENDING',
  Matched = 'MATCHED',
  Discrepancy = 'DISCREPANCY',
  Suspicious = 'SUSPICIOUS'
}

export enum SplitStatus {
  Active = 'ACTIVE',
  PartialReturn = 'PARTIAL_RETURN',
  FullyReturned = 'FULLY_RETURNED'
}

export interface ScannedReceipt {
  merchantName: string
  amount: number
  date: string
  items: string[]
  transactionType: TransactionType
  rawText: string
}

export interface RawTransaction {
  id: string
  amount: number
  date: string
  description: string
  type: TransactionType
  category?: TransactionCategory
  merchantName?: string
}

export interface BookingEntry {
  id: string
  transactionId: string
  amount: number
  type: TransactionType
  category: TransactionCategory
  accountId: string
  description: string
  bookedAt: string
  confidence: number
}

export interface Account {
  id: string
  name: string
  type: string
  balance: number
}

export interface BankStatementItem {
  id: string
  amount: number
  date: string
  description: string
  reference?: string
}

export interface SystemRecord {
  id: string
  amount: number
  date: string
  description: string
  orderId?: string
  transactionId?: string
}

export interface MatchedPair {
  bankTx: BankStatementItem
  systemTx: SystemRecord
  matchScore: number
  matchedAt: string
}

export interface Discrepancy {
  bankTx?: BankStatementItem
  systemTx?: SystemRecord
  type: 'missing_in_bank' | 'missing_in_system' | 'amount_mismatch' | 'date_mismatch'
  details: string
}

export interface ReconciliationReport {
  id: string
  reconciliationId: string
  periodStart: string
  periodEnd: string
  totalBankTxns: number
  totalSystemTxns: number
  matchedCount: number
  discrepancyCount: number
  suspiciousCount: number
  totalDiscrepancyAmount: number
  generatedAt: string
}

export interface SplitBill {
  id: string
  originalTransactionId: string
  totalAmount: number
  splits: SplitItem[]
  status: SplitStatus
  createdAt: string
  returnedAmount: number
}

export interface SplitItem {
  partyId: string
  partyName: string
  ratio: number
  fixedAmount?: number
  amount: number
  returnedAmount: number
}

// ══════════════════════════════════════════════════════════════════════════════
// AIBookingService: AI 自动记账
// ══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class AIBookingService {
  // In-memory store for booking entries (simulating DB)
  private readonly bookingStore = new Map<string, BookingEntry>()

  /**
   * scanReceipt - 扫描小票/发票提取信息（模拟OCR）
   * 实际场景会调用 OCR API，这里做模拟实现
   */
  async scanReceipt(imageUrl: string): Promise<ScannedReceipt> {
    // Simulate OCR processing delay
    await new Promise((resolve) => setTimeout(resolve, 10))

    // Mock OCR result based on imageUrl pattern
    const mockReceipts: Record<string, ScannedReceipt> = {
      default: {
        merchantName: '星巴克',
        amount: 45.5,
        date: new Date().toISOString(),
        items: ['拿铁咖啡', '蛋糕'],
        transactionType: TransactionType.Expense,
        rawText: 'STARBUCKS|45.50|2024-01-15'
      }
    }

    // Generate consistent mock data based on URL hash
    const urlHash = imageUrl.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
    const isIncome = urlHash % 3 === 0

    if (isIncome) {
      return {
        merchantName: '客户退款',
        amount: 20.0,
        date: new Date().toISOString(),
        items: ['退货退款'],
        transactionType: TransactionType.Refund,
        rawText: `REFUND|20.00|${new Date().toISOString()}`
      }
    }

    return {
      merchantName: urlHash % 2 === 0 ? '便利店' : '超市',
      amount: Math.round((urlHash % 100) * 100) / 100 + 10,
      date: new Date().toISOString(),
      items: ['商品'],
      transactionType: TransactionType.Expense,
      rawText: `RECEIPT|${urlHash}|${new Date().toISOString()}`
    }
  }

  /**
   * classifyTransaction - 分类交易（收入/支出/退款）
   */
  classifyTransaction(raw: RawTransaction): TransactionType {
    const incomeKeywords = ['收入', '销售', '收入', 'revenue', 'sale']
    const refundKeywords = ['退款', 'refund', '退货', 'return']

    const descLower = raw.description.toLowerCase()

    if (refundKeywords.some((kw) => descLower.includes(kw))) {
      return TransactionType.Refund
    }

    if (incomeKeywords.some((kw) => descLower.includes(kw))) {
      return TransactionType.Income
    }

    // Default classification based on amount sign
    return raw.amount >= 0 ? TransactionType.Income : TransactionType.Expense
  }

  /**
   * autoMatchToAccount - 自动匹配到账户
   */
  autoMatchToAccount(
    transaction: RawTransaction,
    accounts: Account[]
  ): Account | null {
    if (accounts.length === 0) return null

    // Match by transaction type
    const typeAccountMap: Record<TransactionType, string[]> = {
      [TransactionType.Income]: ['bank', 'wechat', 'alipay'],
      [TransactionType.Expense]: ['cash', 'wechat', 'alipay'],
      [TransactionType.Refund]: ['bank', 'wechat', 'alipay']
    }

    const preferredTypes = typeAccountMap[transaction.type] || []

    // Find account matching preferred types
    for (const prefType of preferredTypes) {
      const matched = accounts.find(
        (a) => a.type.toLowerCase().includes(prefType) && a.balance > -transaction.amount
      )
      if (matched) return matched
    }

    // Fallback to first account with sufficient balance
    return (
      accounts.find((a) => a.balance > Math.abs(transaction.amount)) ?? accounts[0] ?? null
    )
  }

  /**
   * createBookingEntry - 创建记账凭证
   */
  async createBookingEntry(transaction: RawTransaction): Promise<BookingEntry> {
    const entry: BookingEntry = {
      id: `booking-${randomUUID()}`,
      transactionId: transaction.id,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category ?? TransactionCategory.Other,
      accountId: `acct-default-${transaction.type.toLowerCase()}`,
      description: transaction.description,
      bookedAt: new Date().toISOString(),
      confidence: 0.85
    }

    this.bookingStore.set(entry.id, entry)
    return entry
  }

  /**
   * suggestCategories - 建议交易类别
   */
  suggestCategories(transaction: RawTransaction): TransactionCategory[] {
    const descLower = transaction.description.toLowerCase()
    const suggestions: TransactionCategory[] = []

    // Food keywords
    if (/餐|食|吃|饭|餐厅|饭店|快餐|小吃/.test(descLower)) {
      suggestions.push(TransactionCategory.Food)
    }

    // Beverage keywords
    if (/饮|咖啡|茶|奶茶|饮料|水/.test(descLower)) {
      suggestions.push(TransactionCategory.Beverage)
    }

    // Merchandise keywords
    if (/商品|货|买|购|shop/.test(descLower)) {
      suggestions.push(TransactionCategory.Merchandise)
    }

    // Service keywords
    if (/服务|费|租|维修|修理/.test(descLower)) {
      suggestions.push(TransactionCategory.Service)
    }

    // Default to Other if no match
    if (suggestions.length === 0) {
      suggestions.push(TransactionCategory.Other)
    }

    return suggestions
  }

  getBookingEntry(id: string): BookingEntry | undefined {
    return this.bookingStore.get(id)
  }

  listBookingEntries(): BookingEntry[] {
    return Array.from(this.bookingStore.values())
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// AutoReconciliationService: 自动对账
// ══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class AutoReconciliationService {
  private readonly matchedStore = new Map<string, MatchedPair>()
  private readonly discrepancyStore = new Map<string, Discrepancy>()
  private readonly reportStore = new Map<string, ReconciliationReport>()

  /**
   * reconcileStatement - 银行对账单 vs 系统记录对账
   */
  async reconcileStatement(
    bankStatement: BankStatementItem[],
    records: SystemRecord[]
  ): Promise<{
    matched: MatchedPair[]
    discrepancies: Discrepancy[]
  }> {
    const matched: MatchedPair[] = []
    const discrepancies: Discrepancy[] = []
    const usedBankTxns = new Set<string>()
    const usedSystemRecords = new Set<string>()

    // Try to match each bank transaction with system records
    for (const bankTx of bankStatement) {
      const matchResult = this.autoMatchPair(bankTx, records, usedSystemRecords)

      if (matchResult) {
        matched.push(matchResult)
        usedBankTxns.add(bankTx.id)
        usedSystemRecords.add(matchResult.systemTx.id)
        this.matchedStore.set(matchResult.bankTx.id, matchResult)
      } else {
        // No match found - mark as discrepancy
        const disc: Discrepancy = {
          bankTx,
          type: 'missing_in_system',
          details: `Bank transaction ${bankTx.id} (${bankTx.amount}) has no matching system record`
        }
        discrepancies.push(disc)
        this.discrepancyStore.set(bankTx.id, disc)
      }
    }

    // Find system records missing in bank statement
    for (const sysTx of records) {
      if (!usedSystemRecords.has(sysTx.id)) {
        const disc: Discrepancy = {
          systemTx: sysTx,
          type: 'missing_in_bank',
          details: `System record ${sysTx.id} (${sysTx.amount}) has no matching bank transaction`
        }
        discrepancies.push(disc)
        this.discrepancyStore.set(`sys-${sysTx.id}`, disc)
      }
    }

    return { matched, discrepancies }
  }

  /**
   * findDiscrepancies - 找出差异项
   */
  findDiscrepancies(
    statement: BankStatementItem[],
    records: SystemRecord[]
  ): Discrepancy[] {
    const discrepancies: Discrepancy[] = []
    const usedBankTxns = new Set<string>()
    const usedSystemRecords = new Set<string>()

    // First pass: find exact matches and remove them
    for (const bankTx of statement) {
      for (const sysTx of records) {
        if (usedSystemRecords.has(sysTx.id)) continue

        if (this.isAmountMatch(bankTx.amount, sysTx.amount) && this.isDateMatch(bankTx.date, sysTx.date)) {
          usedBankTxns.add(bankTx.id)
          usedSystemRecords.add(sysTx.id)
          break
        }
      }
    }

    // Second pass: identify actual discrepancies
    for (const bankTx of statement) {
      if (!usedBankTxns.has(bankTx.id)) {
        // Check if there's a system record with similar amount but different date
        const similarRecord = records.find(
          (r) =>
            !usedSystemRecords.has(r.id) &&
            this.isAmountMatch(bankTx.amount, r.amount) &&
            !this.isDateMatch(bankTx.date, r.date)
        )

        if (similarRecord) {
          discrepancies.push({
            bankTx,
            systemTx: similarRecord,
            type: 'date_mismatch',
            details: `Amount matches but dates differ: bank=${bankTx.date} vs system=${similarRecord.date}`
          })
          usedBankTxns.add(bankTx.id)
          usedSystemRecords.add(similarRecord.id)
        } else {
          discrepancies.push({
            bankTx,
            type: 'missing_in_system',
            details: `Bank transaction ${bankTx.id} (${bankTx.amount}) not found in system`
          })
        }
      }
    }

    // Remaining unmatched system records
    for (const sysTx of records) {
      if (!usedSystemRecords.has(sysTx.id)) {
        discrepancies.push({
          systemTx: sysTx,
          type: 'missing_in_bank',
          details: `System record ${sysTx.id} (${sysTx.amount}) not found in bank statement`
        })
      }
    }

    return discrepancies
  }

  /**
   * autoMatchPair - 自动配对（金额+日期匹配）
   */
  autoMatchPair(
    bankTx: BankStatementItem,
    systemRecords: SystemRecord[],
    usedRecords: Set<string>
  ): MatchedPair | null {
    // Try exact match first
    for (const sysTx of systemRecords) {
      if (usedRecords.has(sysTx.id)) continue

      if (this.isExactMatch(bankTx, sysTx)) {
        return {
          bankTx,
          systemTx: sysTx,
          matchScore: 1.0,
          matchedAt: new Date().toISOString()
        }
      }
    }

    // Try fuzzy match (amount + date tolerance)
    let bestMatch: MatchedPair | null = null
    let bestScore = 0

    for (const sysTx of systemRecords) {
      if (usedRecords.has(sysTx.id)) continue

      const score = this.calculateMatchScore(bankTx, sysTx)
      if (score > 0.7 && score > bestScore) {
        bestScore = score
        bestMatch = {
          bankTx,
          systemTx: sysTx,
          matchScore: score,
          matchedAt: new Date().toISOString()
        }
      }
    }

    return bestMatch
  }

  /**
   * flagSuspicious - 标记可疑交易（金额异常/时间异常）
   */
  flagSuspicious(matched: MatchedPair[]): MatchedPair[] {
    const suspicious: MatchedPair[] = []

    for (const pair of matched) {
      const isSuspicious = this.isSuspiciousTransaction(pair)

      if (isSuspicious) {
        // Re-mark as suspicious in store
        this.matchedStore.set(`suspicious-${pair.bankTx.id}`, pair)
        suspicious.push(pair)
      }
    }

    return suspicious
  }

  /**
   * generateReconciliationReport - 生成对账报告
   */
  async generateReconciliationReport(reconciliationId: string): Promise<ReconciliationReport> {
    const allMatched = Array.from(this.matchedStore.values())
    const allDiscrepancies = Array.from(this.discrepancyStore.values())

    const matched = allMatched.filter((m) => !m.bankTx.id.startsWith('suspicious-'))
    const suspicious = allMatched.filter((m) => m.bankTx.id.startsWith('suspicious-'))

    const totalDiscrepancyAmount = allDiscrepancies.reduce((sum, d) => {
      if (d.bankTx) return sum + Math.abs(d.bankTx.amount)
      if (d.systemTx) return sum + Math.abs(d.systemTx.amount)
      return sum
    }, 0)

    const report: ReconciliationReport = {
      id: `report-${randomUUID()}`,
      reconciliationId,
      periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      periodEnd: new Date().toISOString(),
      totalBankTxns: matched.length + allDiscrepancies.filter((d) => d.bankTx).length,
      totalSystemTxns: matched.length + allDiscrepancies.filter((d) => d.systemTx).length,
      matchedCount: matched.length,
      discrepancyCount: allDiscrepancies.length,
      suspiciousCount: suspicious.length,
      totalDiscrepancyAmount,
      generatedAt: new Date().toISOString()
    }

    this.reportStore.set(report.id, report)
    return report
  }

  getMatchedPair(id: string): MatchedPair | undefined {
    return this.matchedStore.get(id)
  }

  getReport(id: string): ReconciliationReport | undefined {
    return this.reportStore.get(id)
  }

  // ─── Private Helpers ────────────────────────────────────

  private isAmountMatch(amount1: number, amount2: number): boolean {
    const tolerance = 0.01 // 1 cent tolerance
    return Math.abs(amount1 - amount2) <= tolerance
  }

  private isDateMatch(date1: string, date2: string): boolean {
    const d1 = new Date(date1).toDateString()
    const d2 = new Date(date2).toDateString()
    return d1 === d2
  }

  private isExactMatch(bankTx: BankStatementItem, sysTx: SystemRecord): boolean {
    return this.isAmountMatch(bankTx.amount, sysTx.amount) && this.isDateMatch(bankTx.date, sysTx.date)
  }

  private calculateMatchScore(bankTx: BankStatementItem, sysTx: SystemRecord): number {
    let score = 0

    // Amount match weight: 60%
    if (this.isAmountMatch(bankTx.amount, sysTx.amount)) {
      score += 0.6
    } else {
      const amountDiff = Math.abs(bankTx.amount - sysTx.amount) / Math.max(bankTx.amount, sysTx.amount)
      score += 0.6 * (1 - Math.min(amountDiff, 1))
    }

    // Date match weight: 40%
    if (this.isDateMatch(bankTx.date, sysTx.date)) {
      score += 0.4
    } else {
      const daysDiff = Math.abs(
        (new Date(bankTx.date).getTime() - new Date(sysTx.date).getTime()) / (1000 * 60 * 60 * 24)
      )
      score += 0.4 * Math.max(0, 1 - daysDiff / 7) // Within 7 days
    }

    return score
  }

  private isSuspiciousTransaction(pair: MatchedPair): boolean {
    // Flag if amount is round number >= 10000 (potential fake transaction)
    if (Math.abs(pair.bankTx.amount) >= 10000 && pair.bankTx.amount % 1000 === 0) {
      return true
    }

    // Flag if transaction time is unusual (between 1am and 5am)
    const txHour = new Date(pair.bankTx.date).getHours()
    if (txHour >= 1 && txHour <= 5) {
      return true
    }

    // Flag if amount matches suspiciously round
    if (pair.matchScore >= 0.95 && Math.abs(pair.bankTx.amount) >= 5000) {
      return true
    }

    return false
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// SplitBillService: 分账（P0-7 联名分账退货扣减）
// ══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class SplitBillService {
  private readonly splitStore = new Map<string, SplitBill>()

  /**
   * splitByRatio - 按比例分账
   * @param total 总金额
   * @param ratios 分配比例数组 [0.4, 0.3, 0.3] 表示 40%, 30%, 30%
   * @param parties 各方信息 [{ id, name }]
   */
  splitByRatio(
    total: number,
    ratios: number[],
    parties: Array<{ id: string; name: string }>
  ): SplitBill {
    if (ratios.length !== parties.length) {
      throw new Error('Ratios and parties must have the same length')
    }

    const ratioSum = ratios.reduce((sum, r) => sum + r, 0)
    if (Math.abs(ratioSum - 1) > 0.001) {
      throw new Error('Ratios must sum to 1')
    }

    const splits: SplitItem[] = parties.map((party, i) => ({
      partyId: party.id,
      partyName: party.name,
      ratio: ratios[i],
      amount: Math.round(total * ratios[i] * 100) / 100,
      returnedAmount: 0
    }))

    // Handle rounding: assign remainder to first party
    const totalSplit = splits.reduce((sum, s) => sum + s.amount, 0)
    const remainder = Math.round((total - totalSplit) * 100) / 100
    if (remainder !== 0) {
      splits[0].amount += remainder
    }

    const splitBill: SplitBill = {
      id: `split-${randomUUID()}`,
      originalTransactionId: `tx-${randomUUID()}`,
      totalAmount: total,
      splits,
      status: SplitStatus.Active,
      createdAt: new Date().toISOString(),
      returnedAmount: 0
    }

    this.splitStore.set(splitBill.id, splitBill)
    return splitBill
  }

  /**
   * splitByFixedAmount - 按固定金额分账
   */
  splitByFixedAmount(
    total: number,
    amounts: number[],
    parties: Array<{ id: string; name: string }>
  ): SplitBill {
    if (amounts.length !== parties.length) {
      throw new Error('Amounts and parties must have the same length')
    }

    const totalAmounts = amounts.reduce((sum, a) => sum + a, 0)
    if (totalAmounts !== total) {
      throw new Error(`Split amounts (${totalAmounts}) must equal total (${total})`)
    }

    const splits: SplitItem[] = parties.map((party, i) => ({
      partyId: party.id,
      partyName: party.name,
      ratio: Math.round((amounts[i] / total) * 10000) / 10000,
      fixedAmount: amounts[i],
      amount: amounts[i],
      returnedAmount: 0
    }))

    const splitBill: SplitBill = {
      id: `split-${randomUUID()}`,
      originalTransactionId: `tx-${randomUUID()}`,
      totalAmount: total,
      splits,
      status: SplitStatus.Active,
      createdAt: new Date().toISOString(),
      returnedAmount: 0
    }

    this.splitStore.set(splitBill.id, splitBill)
    return splitBill
  }

  /**
   * handleReturnRefund - 退货时扣减分账
   * P0-7: 联名分账退货扣减
   */
  handleReturnRefund(originalSplitId: string, returnAmount: number): SplitBill {
    const original = this.splitStore.get(originalSplitId)
    if (!original) {
      throw new Error(`Split bill ${originalSplitId} not found`)
    }

    if (original.status === SplitStatus.FullyReturned) {
      throw new Error('Split bill has already been fully returned')
    }

    if (returnAmount <= 0 || returnAmount > original.totalAmount - original.returnedAmount) {
      throw new Error('Invalid return amount')
    }

    // Calculate return deduction per party based on original ratios
    const remainingAmount = original.totalAmount - original.returnedAmount
    const splits = original.splits.map((split) => {
      // Proportional deduction based on original split ratio
      const originalRatio = split.amount / original.totalAmount
      const returnDeduction = Math.round(returnAmount * originalRatio * 100) / 100

      return {
        ...split,
        returnedAmount: split.returnedAmount + returnDeduction
      }
    })

    // Handle rounding in returnedAmount
    const totalReturned = splits.reduce((sum, s) => sum + s.returnedAmount, 0)
    const roundingAdjustment = Math.round((returnAmount + original.returnedAmount - totalReturned) * 100) / 100
    if (roundingAdjustment !== 0) {
      splits[0].returnedAmount += roundingAdjustment
    }

    const newTotalReturnedAmount = original.returnedAmount + returnAmount
    const isFullyReturned = newTotalReturnedAmount >= original.totalAmount - 0.01

    const updatedSplitBill: SplitBill = {
      ...original,
      splits,
      status: isFullyReturned ? SplitStatus.FullyReturned : SplitStatus.PartialReturn,
      returnedAmount: newTotalReturnedAmount
    }

    this.splitStore.set(originalSplitId, updatedSplitBill)
    return updatedSplitBill
  }

  getSplitBill(id: string): SplitBill | undefined {
    return this.splitStore.get(id)
  }

  listSplitBills(): SplitBill[] {
    return Array.from(this.splitStore.values())
  }

  resetTestState(): void {
    this.splitStore.clear()
  }
}
