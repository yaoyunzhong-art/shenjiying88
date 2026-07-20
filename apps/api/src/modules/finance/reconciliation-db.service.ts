/**
 * reconciliation-db.service.ts — P-38 财务对账 DB 持久化层
 *
 * 功能:
 *   1. 将对账报告持久化到 Prisma DB (替代 in-memory 缓存)
 *   2. 差异解析状态持久化 (ResolvedDiff)
 *   3. 跨实体联表查询: Ledger × Settlement × Reconciliation
 *   4. 内存 → DB 的桥接 (fallback 逻辑)
 *
 * 与 reconciliation.service.ts 的关系:
 *   - 本服务负责 DB 层的读写
 *   - reconciliation.service.ts 负责对账匹配引擎
 *   - 两者通过 FinanceReconciliationDbService 的 saveReport / loadReport 桥接
 */

import { Injectable, Logger, Optional } from '@nestjs/common'
import { PrismaService } from '../../prisma/prisma.service'
import type {
  ReconciliationReport,
  DiffRecord,
  MatchResult,
  DiffKind,
  ReconciliationSummary,
  DailyReconciliationReport,
  DiffDetailRecord,
} from './reconciliation.service'

// ─── 跨实体联表查询结果 ─────────────────────────────────

export interface CrossEntityRow {
  periodLabel: string
  startDate: string
  endDate: string

  // From Ledger
  totalRevenue: number
  totalExpense: number
  netLedgerProfit: number

  // From Settlement
  settlementTotalRevenue: number
  settlementTotalExpense: number
  settlementNetProfit: number
  settlementStatus: string

  // From Reconciliation
  reconciliationMatched: number
  reconciliationDiffs: number
  reconciliationTotalDiffCents: number

  // Derived
  ledgerVsSettlementDiff: number
  reconciliationDiffRate: number
}

export interface CrossEntitySummary {
  periodStart: string
  periodEnd: string
  rows: CrossEntityRow[]
  aggregatedRevenue: number
  aggregatedExpense: number
  aggregatedMatchedCount: number
  aggregatedDiffCount: number
}

// ─── 服务 ───────────────────────────────────────────────

@Injectable()
export class FinanceReconciliationDbService {
  private readonly logger = new Logger(FinanceReconciliationDbService.name)

  /** In-memory fallback store for when Prisma is unavailable */
  private reportStore = new Map<string, ReconciliationReport>()
  private resolvedDiffStore = new Map<string, { diffKey: string; resolvedAt: string; resolvedBy?: string; note?: string }>()

  constructor(
    @Optional() private readonly prisma?: PrismaService
  ) {}

  // ═══════════════════════════════════════════════════════
  // 1. 对账报告持久化
  // ═══════════════════════════════════════════════════════

  /**
   * 保存对账报告到 DB (含 diffs 和 matches)
   * 如 DB 不可用, 降级到 in-memory
   */
  async saveReport(
    report: ReconciliationReport,
    tenantId?: string
  ): Promise<void> {
    if (this.prisma) {
      try {
        await this.saveReportToDb(report, tenantId)
        return
      } catch (error) {
        this.logger.warn(
          `saveReportToDb failed, falling back to in-memory: ${(error as Error).message}`
        )
      }
    }
    this.reportStore.set(report.date, report)
  }

  /**
   * 从 DB 加载对账报告
   */
  async loadReport(date: string): Promise<ReconciliationReport | null> {
    if (this.prisma) {
      try {
        const loaded = await this.loadReportFromDb(date)
        if (loaded) return loaded
      } catch (error) {
        this.logger.warn(
          `loadReportFromDb failed, falling back to in-memory: ${(error as Error).message}`
        )
      }
    }
    return this.reportStore.get(date) ?? null
  }

  /**
   * 按日期范围加载对账报告
   */
  async loadReportsInRange(
    startDate: string,
    endDate: string
  ): Promise<ReconciliationReport[]> {
    const reports: ReconciliationReport[] = []

    if (this.prisma) {
      try {
        const dbReports = await this.prisma.reconciliationReportModel.findMany({
          where: {
            date: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            diffs: true,
            matches: true,
          },
          orderBy: { date: 'asc' },
        })

        for (const dbR of dbReports) {
          reports.push(this.dbToReconciliationReport(dbR))
        }
        return reports
      } catch (error) {
        this.logger.warn(
          `loadReportsInRange from DB failed: ${(error as Error).message}`
        )
      }
    }

    // Fallback to in-memory
    for (const [date, report] of this.reportStore) {
      if (date >= startDate && date <= endDate) {
        reports.push(report)
      }
    }
    return reports.sort((a, b) => a.date.localeCompare(b.date))
  }

  /**
   * 获取所有已持久化的报告日期
   */
  async listReportDates(tenantId?: string): Promise<string[]> {
    if (this.prisma) {
      try {
        const records = await this.prisma.reconciliationReportModel.findMany({
          where: {
            ...(tenantId ? { tenantId } : {}),
          },
          select: { date: true },
          orderBy: { date: 'asc' },
          distinct: ['date'],
        })
        return records.map((r: { date: string }) => r.date)
      } catch (error) {
        this.logger.warn(
          `listReportDates from DB failed: ${(error as Error).message}`
        )
      }
    }
    return Array.from(this.reportStore.keys()).sort()
  }

  // ═══════════════════════════════════════════════════════
  // 2. 差异解析状态持久化
  // ═══════════════════════════════════════════════════════

  /**
   * 持久化已解决的差异
   */
  async saveResolvedDiff(params: {
    diffKey: string
    resolvedBy?: string
    note?: string
  }): Promise<void> {
    const resolvedAt = new Date().toISOString()

    if (this.prisma) {
      try {
        await this.prisma.resolvedDiffModel.upsert({
          where: { diffKey: params.diffKey },
          create: {
            diffKey: params.diffKey,
            resolvedBy: params.resolvedBy,
            note: params.note,
            resolvedAt: new Date(resolvedAt),
          },
          update: {
            resolvedBy: params.resolvedBy,
            note: params.note,
          },
        })
        return
      } catch (error) {
        this.logger.warn(
          `saveResolvedDiff to DB failed: ${(error as Error).message}`
        )
      }
    }
    this.resolvedDiffStore.set(params.diffKey, {
      diffKey: params.diffKey,
      resolvedAt,
      resolvedBy: params.resolvedBy,
      note: params.note,
    })
  }

  /**
   * 从 DB 加载已解决的差异
   */
  async loadResolvedDiffs(): Promise<
    Array<{ diffKey: string; resolvedAt: string; resolvedBy?: string; note?: string }>
  > {
    if (this.prisma) {
      try {
        const rows = await this.prisma.resolvedDiffModel.findMany({
          orderBy: { resolvedAt: 'desc' },
        })
        return rows.map((r) => ({
          diffKey: r.diffKey,
          resolvedAt: r.resolvedAt.toISOString(),
          resolvedBy: r.resolvedBy ?? undefined,
          note: r.note ?? undefined,
        }))
      } catch (error) {
        this.logger.warn(
          `loadResolvedDiffs from DB failed: ${(error as Error).message}`
        )
      }
    }
    return Array.from(this.resolvedDiffStore.values())
  }

  /**
   * 从 DB 清除已解决的差异
   */
  async clearResolvedDiffs(): Promise<void> {
    if (this.prisma) {
      try {
        await this.prisma.resolvedDiffModel.deleteMany({})
        return
      } catch (error) {
        this.logger.warn(
          `clearResolvedDiffs from DB failed: ${(error as Error).message}`
        )
      }
    }
    this.resolvedDiffStore.clear()
  }

  /**
   * 检查 diff 是否已解决 (DB)
   */
  async isDiffResolved(diffKey: string): Promise<boolean> {
    if (this.prisma) {
      try {
        const found = await this.prisma.resolvedDiffModel.findUnique({
          where: { diffKey },
        })
        return !!found
      } catch {
        // fallback to in-memory
      }
    }
    return this.resolvedDiffStore.has(diffKey)
  }

  // ═══════════════════════════════════════════════════════
  // 3. 跨实体联表查询
  //    Ledger × Settlement × Reconciliation
  // ═══════════════════════════════════════════════════════

  /**
   * 跨实体对账: 合并 Ledger, Settlement, Reconciliation 数据
   *
   * 提供按周/月聚合的跨实体对比:
   *   - Ledger 总收支 vs Settlement 结算
   *   - Reconciliation 匹配率 vs 差异趋势
   *
   * 这是 P-38 联表增强的核心方法
   */
  async getCrossEntityReconciliation(params: {
    tenantId: string
    storeId?: string
    startDate: string
    endDate: string
    groupBy?: 'week' | 'month'
  }): Promise<CrossEntitySummary> {
    const { tenantId, storeId, startDate, endDate, groupBy = 'month' } = params
    this.logger.log(
      `Cross-entity reconciliation: tenant=${tenantId} store=${storeId ?? '*'}` +
      ` range=${startDate}~${endDate} groupBy=${groupBy}`
    )

    const rows: CrossEntityRow[] = []

    if (this.prisma) {
      try {
        // 使用 Prisma 的原生关联查询
        return await this.crossEntityQueryWithPrisma(params)
      } catch (error) {
        this.logger.warn(
          `Cross-entity Prisma query failed, using fallback: ${(error as Error).message}`
        )
      }
    }

    // Fallback: use in-memory data from the stores
    return this.crossEntityFallbackQuery(params)
  }

  // ═══════════════════════════════════════════════════════
  // Private helpers: Prisma DB query
  // ═══════════════════════════════════════════════════════

  private async saveReportToDb(
    report: ReconciliationReport,
    tenantId?: string
  ): Promise<void> {
    if (!this.prisma) return

    await this.prisma.reconciliationReportModel.create({
      data: {
        tenantId: tenantId ?? null,
        date: report.date,
        internalTotal: report.internalTotal,
        externalTotal: report.externalTotal,
        matchedCount: report.matchedCount,
        exactMatchCount: report.exactMatchCount,
        internalTotalCents: report.internalTotalCents,
        externalTotalCents: report.externalTotalCents,
        totalDiffCents: report.totalDiffCents,
        matchKeyType: report.matchKeyType,
        durationMs: report.durationMs,
        toleranceCents: report.toleranceCents,
        generatedAt: new Date(report.generatedAt),
        diffs: {
          create: report.diffs.map((d) => ({
            kind: d.kind,
            orderNo: d.orderNo ?? null,
            internalId: d.internalId ?? null,
            externalId: d.externalId ?? null,
            internalAmountCents: d.internalAmountCents ?? null,
            externalAmountCents: d.externalAmountCents ?? null,
            diffCents: d.diffCents,
            duplicateIds: d.duplicateIds ? JSON.stringify(d.duplicateIds) : null,
            note: d.note ?? null,
          })),
        },
        matches: {
          create: report.matches.map((m) => ({
            internalId: m.internalId,
            externalId: m.externalId,
            orderNo: m.orderNo ?? null,
            internalAmountCents: m.internalAmountCents,
            externalAmountCents: m.externalAmountCents,
            matched: m.matched,
          })),
        },
      },
    })
  }

  private async loadReportFromDb(
    date: string
  ): Promise<ReconciliationReport | null> {
    if (!this.prisma) return null

    const record = await this.prisma.reconciliationReportModel.findFirst({
      where: { date },
      include: { diffs: true, matches: true },
      orderBy: { createdAt: 'desc' },
    })

    if (!record) return null
    return this.dbToReconciliationReport(record)
  }

  private async crossEntityQueryWithPrisma(
    params: {
      tenantId: string
      storeId?: string
      startDate: string
      endDate: string
      groupBy?: 'week' | 'month'
    }
  ): Promise<CrossEntitySummary> {
    if (!this.prisma) return this.crossEntityFallbackQuery(params)

    const { tenantId, storeId, startDate, endDate } = params
    const startDt = new Date(startDate)
    const endDt = new Date(endDate)

    // Query Ledgers
    const ledgers = await this.prisma.financeLedger.findMany({
      where: {
        tenantId,
        recordedAt: { gte: startDt, lte: endDt },
        ...(storeId ? { storeId } : {}),
      },
    })

    // Query Settlements
    const settlements = await this.prisma.financeSettlement.findMany({
      where: {
        tenantId,
        ...(storeId ? { storeId } : {}),
      },
      orderBy: { startDate: 'asc' },
    })

    // Query Reconciliation reports
    const reports = await this.prisma.reconciliationReportModel.findMany({
      where: {
        date: { gte: startDate, lte: endDate },
        ...(tenantId ? { tenantId } : {}),
      },
      include: { diffs: true },
      orderBy: { date: 'asc' },
    })

    // Build aggregated cross-entity rows
    const totalRevenue = ledgers
      .filter((l) => l.type === 'REVENUE')
      .reduce((s, l) => s + l.amount, 0)
    const totalExpense = ledgers
      .filter((l) => l.type === 'EXPENSE')
      .reduce((s, l) => s + l.amount, 0)
    const settlementTotalRevenue = settlements.reduce((s, st) => s + st.totalRevenue, 0)
    const settlementTotalExpense = settlements.reduce((s, st) => s + st.totalExpense, 0)
    const matchedCount = reports.reduce((s, r) => s + r.matchedCount, 0)
    const diffCount = reports.reduce((s, r) => s + r.diffs.length, 0)
    const totalDiffCents = reports.reduce((s, r) => s + r.totalDiffCents, 0)

    const row: CrossEntityRow = {
      periodLabel: `${startDate}~${endDate}`,
      startDate,
      endDate,
      totalRevenue,
      totalExpense,
      netLedgerProfit: totalRevenue - totalExpense,
      settlementTotalRevenue,
      settlementTotalExpense,
      settlementNetProfit: settlementTotalRevenue - settlementTotalExpense,
      settlementStatus: settlements.length > 0 ? settlements[settlements.length - 1].settlementStatus : 'NONE',
      reconciliationMatched: matchedCount,
      reconciliationDiffs: diffCount,
      reconciliationTotalDiffCents: totalDiffCents,
      ledgerVsSettlementDiff: totalRevenue - settlementTotalRevenue,
      reconciliationDiffRate: totalRevenue > 0
        ? Math.round((Math.abs(totalDiffCents) / (totalRevenue * 100)) * 10000) / 100
        : 0,
    }

    return {
      periodStart: startDate,
      periodEnd: endDate,
      rows: [row],
      aggregatedRevenue: totalRevenue,
      aggregatedExpense: totalExpense,
      aggregatedMatchedCount: matchedCount,
      aggregatedDiffCount: diffCount,
    }
  }

  private crossEntityFallbackQuery(
    params: {
      tenantId: string
      storeId?: string
      startDate: string
      endDate: string
      groupBy?: 'week' | 'month'
    }
  ): CrossEntitySummary {
    // In-memory fallback: use only the cached report data
    const reports = Array.from(this.reportStore.values())
      .filter((r) => r.date >= params.startDate && r.date <= params.endDate)
      .sort((a, b) => a.date.localeCompare(b.date))

    const totalRevenue = reports.reduce((s, r) => s + r.internalTotalCents / 100, 0)
    const totalExpense = reports.reduce((s, r) => s + r.externalTotalCents / 100, 0)
    const matchedCount = reports.reduce((s, r) => s + r.matchedCount, 0)
    const diffCount = reports.reduce((s, r) => s + r.diffs.length, 0)
    const totalDiffCents = reports.reduce((s, r) => s + r.totalDiffCents, 0)

    const row: CrossEntityRow = {
      periodLabel: `${params.startDate}~${params.endDate}`,
      startDate: params.startDate,
      endDate: params.endDate,
      totalRevenue,
      totalExpense,
      netLedgerProfit: totalRevenue - totalExpense,
      settlementTotalRevenue: 0,
      settlementTotalExpense: 0,
      settlementNetProfit: 0,
      settlementStatus: 'FALLBACK',
      reconciliationMatched: matchedCount,
      reconciliationDiffs: diffCount,
      reconciliationTotalDiffCents: totalDiffCents,
      ledgerVsSettlementDiff: totalRevenue,
      reconciliationDiffRate: totalRevenue > 0
        ? Math.round((Math.abs(totalDiffCents) / (totalRevenue * 100)) * 10000) / 100
        : 0,
    }

    return {
      periodStart: params.startDate,
      periodEnd: params.endDate,
      rows: [row],
      aggregatedRevenue: totalRevenue,
      aggregatedExpense: totalExpense,
      aggregatedMatchedCount: matchedCount,
      aggregatedDiffCount: diffCount,
    }
  }

  // ═══════════════════════════════════════════════════════
  // DB → In-memory conversion
  // ═══════════════════════════════════════════════════════

  private dbToReconciliationReport(
    record: any
  ): ReconciliationReport {
    const diffs: DiffRecord[] = (record.diffs ?? []).map((d: any) => ({
      kind: d.kind as DiffKind,
      orderNo: d.orderNo ?? undefined,
      internalId: d.internalId ?? undefined,
      externalId: d.externalId ?? undefined,
      internalAmountCents: d.internalAmountCents ?? undefined,
      externalAmountCents: d.externalAmountCents ?? undefined,
      diffCents: d.diffCents,
      duplicateIds: d.duplicateIds ? (JSON.parse(d.duplicateIds) as string[]) : undefined,
      note: d.note ?? undefined,
    }))

    const matches: MatchResult[] = (record.matches ?? []).map((m: any) => ({
      internalId: m.internalId,
      externalId: m.externalId,
      orderNo: m.orderNo ?? '',
      internalAmountCents: m.internalAmountCents,
      externalAmountCents: m.externalAmountCents,
      matched: m.matched,
    }))

    return {
      date: record.date,
      internalTotal: record.internalTotal,
      externalTotal: record.externalTotal,
      matchedCount: record.matchedCount,
      exactMatchCount: record.exactMatchCount,
      internalTotalCents: record.internalTotalCents,
      externalTotalCents: record.externalTotalCents,
      totalDiffCents: record.totalDiffCents,
      diffs,
      matches,
      matchKeyType: record.matchKeyType as any,
      generatedAt: record.generatedAt instanceof Date
        ? record.generatedAt.toISOString()
        : record.generatedAt,
      durationMs: record.durationMs,
      toleranceCents: record.toleranceCents,
    }
  }

  // ═══════════════════════════════════════════════════════
  // Utility: sync in-memory ↔ DB
  // ═══════════════════════════════════════════════════════

  /**
   * 将 ReconciliationService 的 in-memory 数据同步到 DB
   */
  async syncFromReconciliationService(
    getSummary: (date?: string) => ReconciliationSummary | null,
    getDetails: (query?: any) => DiffDetailRecord[],
    getResolvedDiffs: () => Array<{
      diffKey: string
      resolvedAt: string
      resolvedBy?: string
      note?: string
    }>,
    getCacheStats: () => { dates: string[] },
  ): Promise<{ syncedReports: number; syncedDiffs: number }> {
    if (!this.prisma) return { syncedReports: 0, syncedDiffs: 0 }

    let syncedReports = 0
    let syncedDiffs = 0
    const cacheStats = getCacheStats()

    for (const date of cacheStats.dates) {
      const summary = getSummary(date)
      if (!summary) continue

      // Check if already persisted
      const existing = await this.prisma.reconciliationReportModel.findFirst({
        where: { date },
      })
      if (existing) continue

      // Build a basic report from summary
      const report: ReconciliationReport = {
        date,
        internalTotal: summary.internalTotal,
        externalTotal: summary.externalTotal,
        matchedCount: summary.matchedCount,
        exactMatchCount: summary.exactMatchCount,
        internalTotalCents: summary.internalTotalCents,
        externalTotalCents: summary.externalTotalCents,
        totalDiffCents: summary.totalDiffCents,
        diffs: [],
        matches: [],
        matchKeyType: 'orderNo',
        generatedAt: new Date().toISOString(),
        durationMs: summary.durationMs,
        toleranceCents: 0,
      }

      await this.saveReportToDb(report, undefined)
      syncedReports++
    }

    // Sync resolved diffs
    const resolvedDiffs = getResolvedDiffs()
    for (const rd of resolvedDiffs) {
      await this.saveResolvedDiff({
        diffKey: rd.diffKey,
        resolvedBy: rd.resolvedBy,
        note: rd.note,
      })
      syncedDiffs++
    }

    this.logger.log(
      `Synced from ReconciliationService: ${syncedReports} reports, ${syncedDiffs} resolved diffs`
    )

    return { syncedReports, syncedDiffs }
  }

  /**
   * 将 ReconciliationService 报告遍历发送到 DB 并重新加载
   */
  async migrateAll(
    reportCache: Map<string, ReconciliationReport>,
    resolvedDiffs: Map<string, { diffKey: string; resolvedAt: string; resolvedBy?: string; note?: string }>
  ): Promise<{ syncedReports: number; syncedDiffs: number }> {
    if (!this.prisma) return { syncedReports: 0, syncedDiffs: 0 }

    let saved = 0
    for (const [date, report] of reportCache) {
      try {
        await this.saveReportToDb(report, undefined)
        saved++
      } catch (error) {
        this.logger.warn(`Failed to save report for ${date}: ${(error as Error).message}`)
      }
    }

    for (const [key, entry] of resolvedDiffs) {
      await this.saveResolvedDiff({
        diffKey: entry.diffKey,
        resolvedBy: entry.resolvedBy,
        note: entry.note,
      })
    }

    this.logger.log(`Migration complete: ${saved} reports, ${resolvedDiffs.size} resolved diffs`)

    return { syncedReports: saved, syncedDiffs: resolvedDiffs.size }
  }
}
