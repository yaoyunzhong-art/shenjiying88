import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'

// ══════════════════════════════════════════════════════════════════════════════
// Types & Entities
// ══════════════════════════════════════════════════════════════════════════════

export interface StoreRevenue {
  storeId: string
  period: string
  revenue: number
  transactionCount: number
}

export interface StoreCost {
  storeId: string
  period: string
  purchaseCost: number
  laborCost: number
  rentCost: number
  totalCost: number
}

export interface StoreProfit {
  storeId: string
  period: string
  revenue: number
  cost: number
  profit: number
  margin: number
}

export interface StoreComparisonResult {
  storeId: string
  revenue: number
  cost: number
  profit: number
  margin: number
  rank: number
}

export interface IntercompanyElimination {
  id: string
  fromStoreId: string
  toStoreId: string
  amount: number
  description: string
  period: string
}

export interface BrandPAndLReport {
  brandId: string
  period: string
  totalRevenue: number
  totalCost: number
  grossProfit: number
  intercompanyEliminations: number
  netProfit: number
  storeSummaries: Array<{
    storeId: string
    revenue: number
    cost: number
    profit: number
  }>
}

// ══════════════════════════════════════════════════════════
// P-38 100%: 费用分析 + 现金流追踪 扩展类型
// ══════════════════════════════════════════════════════════

export interface CostCategory {
  category: string
  amountCents: number
  count: number
  percentage: number
}

export interface CostAnalysis {
  period: string
  totalCostCents: number
  categories: CostCategory[]
  /** 环比变化率 (%) */
  monthOverMonthChange: number
  /** 去年同期变化率 (%) */
  yearOverYearChange: number
}

export interface CashFlowEntry {
  date: string
  inflowCents: number
  outflowCents: number
  netCents: number
  balanceCents: number
}

export interface CashFlowReport {
  period: string
  totalInflowCents: number
  totalOutflowCents: number
  netFlowCents: number
  openingBalanceCents: number
  closingBalanceCents: number
  dailyFlows: CashFlowEntry[]
  /** 现金流分类 */// eslint-disable-next-line @typescript-eslint/no-unused-vars
  categoryBreakdown: Array<{
    category: string
    inflowCents: number
    outflowCents: number
  }>
}

export enum TransactionStatus {
  Pending = 'pending',
  Processing = 'processing',
  Completed = 'completed',
  Failed = 'failed'
}

export interface AccountTransactionLog {
  id: string
  transactionId: string
  fromAccountId: string
  toAccountId: string
  amount: number
  status: TransactionStatus
  previousStatus?: TransactionStatus
  errorMessage?: string
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface TransactionFilter {
  transactionId?: string
  fromAccountId?: string
  toAccountId?: string
  status?: TransactionStatus
  fromDate?: string
  toDate?: string
}

// ══════════════════════════════════════════════════════════════════════════════
// In-Memory Stores
// ══════════════════════════════════════════════════════════════════════════════

const storeRevenueStore = new Map<string, StoreRevenue>()
const storeCostStore = new Map<string, StoreCost>()
const intercompanyStore = new Map<string, IntercompanyElimination>()
const transactionLogStore = new Map<string, AccountTransactionLog>()

export function resetFinanceDashboardTestState() {
  storeRevenueStore.clear()
  storeCostStore.clear()
  intercompanyStore.clear()
  transactionLogStore.clear()
}

// ══════════════════════════════════════════════════════════════════════════════
// StorePAndLService: 门店损益看板
// ══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class StorePAndLService {
  // ─── 门店营收（按时间段） ───────────────────────────────

  async getStoreRevenue(storeId: string, period: string): Promise<StoreRevenue> {
    const key = `${storeId}-${period}`
    const cached = storeRevenueStore.get(key)
    if (cached) return cached

    // 模拟：从订单/交易聚合营收数据
    const revenue = this.aggregateRevenue(storeId, period)
    const result: StoreRevenue = {
      storeId,
      period,
      revenue,
      transactionCount: Math.floor(revenue / 100) // 估算
    }
    storeRevenueStore.set(key, result)
    return result
  }

  // ─── 门店成本（进价+人力+租金） ────────────────────────

  async getStoreCost(storeId: string, period: string): Promise<StoreCost> {
    const key = `${storeId}-${period}`
    const cached = storeCostStore.get(key)
    if (cached) return cached

    const purchaseCost = this.aggregatePurchaseCost(storeId, period)
    const laborCost = this.aggregateLaborCost(storeId, period)
    const rentCost = this.aggregateRentCost(storeId, period)

    const result: StoreCost = {
      storeId,
      period,
      purchaseCost,
      laborCost,
      rentCost,
      totalCost: purchaseCost + laborCost + rentCost
    }
    storeCostStore.set(key, result)
    return result
  }

  // ─── 门店利润（营收-成本） ─────────────────────────────

  async calculateStoreProfit(storeId: string, period: string): Promise<StoreProfit> {
    const revenue = await this.getStoreRevenue(storeId, period)
    const cost = await this.getStoreCost(storeId, period)
    const profit = revenue.revenue - cost.totalCost
    const margin = revenue.revenue > 0 ? profit / revenue.revenue : 0

    return {
      storeId,
      period,
      revenue: revenue.revenue,
      cost: cost.totalCost,
      profit,
      margin
    }
  }

  // ─── 门店利润率 ───────────────────────────────────────

  async getStoreMargin(storeId: string, period: string): Promise<number> {
    const profit = await this.calculateStoreProfit(storeId, period)
    return profit.margin
  }

  // ─── 多门店对比 ───────────────────────────────────────

  async compareStores(storeIds: string[], period: string): Promise<StoreComparisonResult[]> {
    const results: StoreComparisonResult[] = []

    for (const storeId of storeIds) {
      const profit = await this.calculateStoreProfit(storeId, period)
      results.push({
        storeId,
        revenue: profit.revenue,
        cost: profit.cost,
        profit: profit.profit,
        margin: profit.margin,
        rank: 0
      })
    }

    // 按利润降序排列
    results.sort((a, b) => b.profit - a.profit)

    // 赋值排名
    results.forEach((r, i) => {
      r.rank = i + 1
    })

    return results
  }

  // ─── Helpers ──────────────────────────────────────────

  private aggregateRevenue(storeId: string, period: string): number {
    // 模拟聚合逻辑：实际应查订单表/交易表
    return this.simulateAmount(storeId, period, 'revenue')
  }

  private aggregatePurchaseCost(storeId: string, period: string): number {
    return this.simulateAmount(storeId, period, 'purchase')
  }

  private aggregateLaborCost(storeId: string, period: string): number {
    return this.simulateAmount(storeId, period, 'labor')
  }

  private aggregateRentCost(storeId: string, period: string): number {
    return this.simulateAmount(storeId, period, 'rent')
  }

  private simulateAmount(storeId: string, period: string, type: string): number {
    // 模拟数据：基于 storeId 和 period 生成确定性金额
    const hash = this.hashCode(`${storeId}-${period}-${type}`)
    const base = Math.abs(hash) % 10000
    return base * 10
  }

  private hashCode(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return hash
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// BrandPAndLService: 品牌级损益表
// ══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class BrandPAndLService {
  constructor(private readonly storePAndL: StorePAndLService) {}

  // ─── 品牌总营收 ───────────────────────────────────────

  async getBrandRevenue(brandId: string, period: string): Promise<number> {
    const storeIds = this.getBrandStoreIds(brandId)
    let total = 0
    for (const storeId of storeIds) {
      const rev = await this.storePAndL.getStoreRevenue(storeId, period)
      total += rev.revenue
    }
    return total
  }

  // ─── 品牌总成本 ───────────────────────────────────────

  async getBrandCost(brandId: string, period: string): Promise<number> {
    const storeIds = this.getBrandStoreIds(brandId)
    let total = 0
    for (const storeId of storeIds) {
      const cost = await this.storePAndL.getStoreCost(storeId, period)
      total += cost.totalCost
    }
    return total
  }

  // ─── 品牌利润 ─────────────────────────────────────────

  async calculateBrandProfit(brandId: string, period: string): Promise<{ revenue: number; cost: number; profit: number }> {
    const revenue = await this.getBrandRevenue(brandId, period)
    const cost = await this.getBrandCost(brandId, period)
    return {
      revenue,
      cost,
      profit: revenue - cost
    }
  }

  // ─── 内部往来抵销 ─────────────────────────────────────

  async getIntercompanyEliminations(brandId: string, period: string): Promise<IntercompanyElimination[]> {
    const eliminations: IntercompanyElimination[] = []

    for (const [id, elim] of intercompanyStore.entries()) {
      if (elim.period === period) {
        const fromBrand = this.getStoreBrandId(elim.fromStoreId)
        const toBrand = this.getStoreBrandId(elim.toStoreId)
        if (fromBrand === brandId || toBrand === brandId) {
          eliminations.push(elim)
        }
      }
    }

    return eliminations
  }

  async addIntercompanyElimination(elim: Omit<IntercompanyElimination, 'id'>): Promise<IntercompanyElimination> {
    const result: IntercompanyElimination = {
      id: `elim-${randomUUID()}`,
      ...elim
    }
    intercompanyStore.set(result.id, result)
    return result
  }

  // ─── 生成品牌级损益表 ─────────────────────────────────

  async generateBrandPAndLReport(brandId: string, period: string): Promise<BrandPAndLReport> {
    const storeIds = this.getBrandStoreIds(brandId)
    const storeSummaries: BrandPAndLReport['storeSummaries'] = []

    let totalRevenue = 0
    let totalCost = 0

    for (const storeId of storeIds) {
      const profit = await this.storePAndL.calculateStoreProfit(storeId, period)
      storeSummaries.push({
        storeId,
        revenue: profit.revenue,
        cost: profit.cost,
        profit: profit.profit
      })
      totalRevenue += profit.revenue
      totalCost += profit.cost
    }

    const eliminations = await this.getIntercompanyEliminations(brandId, period)
    const eliminationAmount = eliminations.reduce((sum, e) => sum + e.amount, 0)
    const grossProfit = totalRevenue - totalCost
    const netProfit = grossProfit - eliminationAmount

    return {
      brandId,
      period,
      totalRevenue,
      totalCost,
      grossProfit,
      intercompanyEliminations: eliminationAmount,
      netProfit,
      storeSummaries
    }
  }

  // ─── Helpers ──────────────────────────────────────────

  private getBrandStoreIds(brandId: string): string[] {
    // 模拟：brand-A -> store-A1, store-A2
    //       brand-B -> store-B1, store-B2
    if (brandId === 'brand-A') {
      return ['store-A1', 'store-A2']
    }
    if (brandId === 'brand-B') {
      return ['store-B1', 'store-B2']
    }
    return []
  }

  private getStoreBrandId(storeId: string): string {
    if (storeId.startsWith('store-A')) return 'brand-A'
    if (storeId.startsWith('store-B')) return 'brand-B'
    return 'unknown'
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// AccountTransactionLogService: 分账状态流转日志（P2-11）
// ══════════════════════════════════════════════════════════════════════════════

@Injectable()
export class AccountTransactionLogService {
  // ─── 记录分账交易 ────────────────────────────────────

  async logTransaction(tx: {
    transactionId: string
    fromAccountId: string
    toAccountId: string
    amount: number
    metadata?: Record<string, unknown>
  }): Promise<AccountTransactionLog> {
    const now = new Date().toISOString()
    const log: AccountTransactionLog = {
      id: `txlog-${randomUUID()}`,
      transactionId: tx.transactionId,
      fromAccountId: tx.fromAccountId,
      toAccountId: tx.toAccountId,
      amount: tx.amount,
      status: TransactionStatus.Pending,
      metadata: tx.metadata,
      createdAt: now,
      updatedAt: now
    }
    transactionLogStore.set(log.id, log)
    return log
  }

  // ─── 查询交易日志 ─────────────────────────────────────

  queryTransactionLogs(filter: TransactionFilter): AccountTransactionLog[] {
    const results: AccountTransactionLog[] = []

    for (const log of transactionLogStore.values()) {
      if (filter.transactionId && log.transactionId !== filter.transactionId) continue
      if (filter.fromAccountId && log.fromAccountId !== filter.fromAccountId) continue
      if (filter.toAccountId && log.toAccountId !== filter.toAccountId) continue
      if (filter.status && log.status !== filter.status) continue
      if (filter.fromDate && log.createdAt < filter.fromDate) continue
      if (filter.toDate && log.createdAt > filter.toDate) continue
      results.push(log)
    }

    return results.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  // ─── 获取交易状态 ─────────────────────────────────────

  getTransactionStatus(txId: string): AccountTransactionLog | null {
    return transactionLogStore.get(txId) ?? null
  }

  // ─── 更新交易状态 ─────────────────────────────────────

  async updateTransactionStatus(
    txId: string,
    newStatus: TransactionStatus,
    errorMessage?: string
  ): Promise<AccountTransactionLog> {
    const log = transactionLogStore.get(txId)
    if (!log) {
      throw new Error(`Transaction ${txId} not found`)
    }

    // 校验状态流转合法性
    this.validateStatusTransition(log.status, newStatus)

    const now = new Date().toISOString()
    log.previousStatus = log.status
    log.status = newStatus
    log.updatedAt = now

    if (errorMessage) {
      log.errorMessage = errorMessage
    }

    return log
  }

  // ─── 状态流转校验 ─────────────────────────────────────

  private validateStatusTransition(current: TransactionStatus, next: TransactionStatus): void {
    const validTransitions: Record<TransactionStatus, TransactionStatus[]> = {
      [TransactionStatus.Pending]: [TransactionStatus.Processing, TransactionStatus.Failed],
      [TransactionStatus.Processing]: [TransactionStatus.Completed, TransactionStatus.Failed],
      [TransactionStatus.Completed]: [],
      [TransactionStatus.Failed]: []
    }

    const allowed = validTransitions[current]
    if (!allowed.includes(next)) {
      throw new Error(
        `Invalid status transition: ${current} -> ${next}. Allowed: ${allowed.join(', ') || 'none'}`
      )
    }
  }
}
