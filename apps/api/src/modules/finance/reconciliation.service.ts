/**
 * reconciliation.service.ts — P-38 财务对账核心逻辑
 *
 * 交易匹配引擎:
 *   1. 根据 订单号+金额+日期 匹配银行/渠道流水
 *   2. 差异检测: 金额不一致 / 缺少交易 / 重复交易
 *   3. 报表生成: return 差异汇总
 *   4. 缓存层: getSummary / getDetails 聚合查询
 *
 * 与 ReconciliationService (reconciliation/reconciliation.service.ts) 的区别:
 *   - reconciliation/reconciliation.service.ts: 内部 Payment vs 通道账单 (adapter 模式)
 *   - 本服务: 通用的对账匹配引擎, 接收任意 input, 输出匹配+差异结果
 *     (适应 admin-web 的批量对账场景)
 */

import { Injectable, Logger } from '@nestjs/common'

// ─── 类型定义 ─────────────────────────────────────────────

export type MatchKeyType = 'orderNo' | 'channelTxnNo' | 'combined'

/** 对账交易记录 (input 格式) */
export interface TransactionInput {
  /** 本地交易唯一 ID */
  id: string
  /** 商户订单号 */
  orderNo: string
  /** 渠道交易号 (e.g. 微信 transaction_id) */
  channelTxnNo?: string
  /** 交易金额 (分) */
  amountCents: number
  /** 交易日期 (YYYY-MM-DD) */
  date: string
  /** 交易时间 (ISO 8601) */
  time?: string
  /** 附加标签, 用于分组 */
  channel?: string
  /** 交易状态 */
  status?: string
}

/** 外部流水记录 (银行/渠道) */
export interface BankStatementInput {
  /** 外部流水唯一 ID */
  id: string
  /** 商户订单号 */
  orderNo?: string
  /** 渠道交易号 */
  channelTxnNo?: string
  /** 交易金额 (分) */
  amountCents: number
  /** 交易日期 (YYYY-MM-DD) */
  date: string
  /** 交易时间 (ISO 8601) */
  time?: string
  /** 来源渠道 */
  channel?: string
  /** 交易状态 */
  status?: string
}

/** 差异类型 */
export type DiffKind = 'amount-mismatch' | 'missing-internal' | 'missing-external' | 'duplicate'

/** 单条差异记录 */
export interface DiffRecord {
  kind: DiffKind
  /** 订单号 (如果可关联) */
  orderNo?: string
  /** 本地交易 ID */
  internalId?: string
  /** 外部流水 ID */
  externalId?: string
  /** 内部金额 (分) */
  internalAmountCents?: number
  /** 外部金额 (分) */
  externalAmountCents?: number
  /** 金额差 (内部 - 外部, 分) */
  diffCents: number
  /** 重复交易 IDs */
  duplicateIds?: string[]
  /** 说明 */
  note?: string
}

/** 对账匹配结果 */
export interface MatchResult {
  internalId: string
  externalId: string
  orderNo: string
  internalAmountCents: number
  externalAmountCents: number
  matched: boolean
}

/** 对账报告 */
export interface ReconciliationReport {
  /** 对账日期 */
  date: string
  /** 内部交易总数 */
  internalTotal: number
  /** 外部流水总数 */
  externalTotal: number
  /** 成功匹配数 */
  matchedCount: number
  /** 金额精确匹配数 (金额完全一致) */
  exactMatchCount: number
  /** 内部总金额 (分) */
  internalTotalCents: number
  /** 外部总金额 (分) */
  externalTotalCents: number
  /** 总金额差异 (分, 内部 - 外部) */
  totalDiffCents: number
  /** 差异列表 */
  diffs: DiffRecord[]
  /** 匹配详情 */
  matches: MatchResult[]
  /** 匹配键 */
  matchKeyType: MatchKeyType
  /** 报告生成时间 */
  generatedAt: string
  /** 耗时 ms */
  durationMs: number
  /** 使用的容差 (分) */
  toleranceCents: number
}

/** 对账运行参数 */
export interface ReconciliationRunOptions {
  /** 对账日期 (YYYY-MM-DD) */
  date: string
  /** 内部交易列表 */
  internalTransactions: TransactionInput[]
  /** 外部流水列表 */
  externalTransactions: BankStatementInput[]
  /** 匹配键 */
  matchKey: MatchKeyType
  /** 渠道过滤 (可选) */
  channel?: string
  /** 允许的金额容差 (分, 默认 0) */
  toleranceCents?: number
}

/** 已处理的差异记录 */
export interface ResolvedDiff {
  diffKey: string
  resolvedAt: string
  resolvedBy?: string
  note?: string
}

/** 对账汇总 */
export interface ReconciliationSummary {
  /** 对账日期 */
  date: string
  /** 内部交易总数 */
  internalTotal: number
  /** 外部流水总数 */
  externalTotal: number
  /** 成功匹配数 */
  matchedCount: number
  /** 精确匹配数 */
  exactMatchCount: number
  /** 匹配率 (%) */
  matchRate: number
  /** 内部总金额 (分) */
  internalTotalCents: number
  /** 外部总金额 (分) */
  externalTotalCents: number
  /** 总金额差异 (分) */
  totalDiffCents: number
  /** 差异率 (%) */
  diffRate: number
  /** 差异分类统计 */
  diffKindBreakdown: Array<{ kind: DiffKind; count: number; totalDiffCents: number }>
  /** 已解决差异数 */
  resolvedCount: number
  /** 未解决差异数 */
  unresolvedCount: number
  /** 耗时 ms */
  durationMs: number
  /** 运行次数 */
  totalRuns: number
}

/** 差异明细查询参数 */
export interface DiffDetailQuery {
  kind?: DiffKind
  resolved?: boolean
  orderNo?: string
  offset?: number
  limit?: number
}

/** 差异明细记录 (含解析状态) */
export interface DiffDetailRecord extends DiffRecord {
  diffKey: string
  resolved: boolean
  resolvedAt?: string
  resolvedBy?: string
  resolveNote?: string
}

/** 每日对账报告的完整视图 */
export interface DailyReconciliationReport {
  date: string
  summary: ReconciliationSummary
  details: DiffDetailRecord[]
  status: {
    inProgress: boolean
    lastRunAt: string | null
    lastRunDate: string | null
    totalRuns: number
  }
}

/** 综合对账统计 (趋势) */
export interface OverallReconciliationStats {
  /** 总运行次数 */
  totalRuns: number
  /** 有数据的日期数 */
  reportDates: string[]
  /** 最近 7 天匹配率 */
  matchRateTrend: Array<{ date: string; matchRate: number; totalDiffCents: number }>
  /** 周汇总 */
  weeklySummary: Array<{
    weekLabel: string
    startDate: string
    endDate: string
    internalTotal: number
    externalTotal: number
    matchedCount: number
    exactMatchCount: number
    totalDiffCents: number
    totalDiffs: number
  }>
  /** 月汇总 */
  monthlySummary: Array<{
    monthLabel: string
    internalTotal: number
    externalTotal: number
    matchedCount: number
    totalDiffCents: number
  }>
  /** 不同差异类型的趋势 */
  diffKindTrends: Record<DiffKind, number>
  /** 对账总体状态 */
  dailyStatus: Array<{ date: string; matched: boolean; diffCount: number }>
}

/** 对账缓存条目 */
export interface ReconciliationCacheEntry {
  report: ReconciliationReport
  cachedAt: string
  hits: number
}

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name)

  /** 已解决的差异 (in-memory) */
  private resolvedDiffs = new Map<string, ResolvedDiff>()
  /** 最近的对账报告 */
  private lastReport: ReconciliationReport | null = null
  /** 对账历史报告缓存 */
  private reportCache = new Map<string, ReconciliationCacheEntry>()
  /** 对账状态 */
  private reconciliationStatus: {
    inProgress: boolean
    lastRunAt: string | null
    lastRunDate: string | null
    totalRuns: number
    lastError: string | null
  } = {
    inProgress: false,
    lastRunAt: null,
    lastRunDate: null,
    totalRuns: 0,
    lastError: null
  }

  /**
   * 获取对账状态
   */
  getStatus() {
    return {
      ...this.reconciliationStatus,
      lastReportSummary: this.lastReport
        ? {
            date: this.lastReport.date,
            internalTotal: this.lastReport.internalTotal,
            externalTotal: this.lastReport.externalTotal,
            matchedCount: this.lastReport.matchedCount,
            exactMatchCount: this.lastReport.exactMatchCount,
            totalDiffCents: this.lastReport.totalDiffCents,
            diffCount: this.lastReport.diffs.length,
            toleranceCents: this.lastReport.toleranceCents
          }
        : null
    }
  }

  /**
   * 获取最近一次的差异列表
   */
  getDiffs(): DiffRecord[] {
    return this.lastReport?.diffs ?? []
  }

  /**
   * 获取每日对账报告的完整视图
   * 包含摘要、差异明细、运行状态
   */
  getDailyReport(date?: string): DailyReconciliationReport | null {
    const targetDate = date ?? this.reconciliationStatus.lastRunDate
    if (!targetDate) return null

    const summary = this.getSummary(targetDate)
    if (!summary) return null

    const details = this.getDetails({ limit: 200 })

    return {
      date: targetDate,
      summary,
      details,
      status: {
        inProgress: this.reconciliationStatus.inProgress,
        lastRunAt: this.reconciliationStatus.lastRunAt,
        lastRunDate: this.reconciliationStatus.lastRunDate,
        totalRuns: this.reconciliationStatus.totalRuns
      }
    }
  }

  /**
   * 自动执行每日对账的批处理入口
   * 如果已有缓存则直接返回，否则执行空对账并返回报告视图
   * 实际场景中会从 DB 拉取数据执行
   */
  async autoReconcile(date?: string): Promise<DailyReconciliationReport | null> {
    const targetDate = date ?? new Date().toISOString().slice(0, 10)
    this.logger.log(`autoReconcile started for date=${targetDate}`)

    // 如果已有缓存且状态正常，直接返回
    const cached = this.getCachedReport(targetDate)
    if (cached && cached.diffs.length === 0) {
      this.logger.log(`autoReconcile: using cached report for ${targetDate}`)
      return this.getDailyReport(targetDate)
    }

    // 执行对账（真实场景从 DB 加载数据）
    const report = await this.run({
      date: targetDate,
      internalTransactions: [],
      externalTransactions: [],
      matchKey: 'orderNo'
    })

    this.logger.log(`autoReconcile completed for date=${targetDate} diffs=${report.diffs.length}`)
    return this.getDailyReport(targetDate)
  }

  /**
   * 综合对账统计（匹配率趋势、周/月汇总）
   */
  getOverallStats(): OverallReconciliationStats {
    const reportDates: string[] = []
    const cacheStats = this.getCacheStats()
    for (const entry of this.reportCache.values()) {
      if (!reportDates.includes(entry.report.date)) {
        reportDates.push(entry.report.date)
      }
    }
    reportDates.sort()

    // 最近 7 天匹配率趋势
    const last7 = reportDates.slice(-7)
    const matchRateTrend = last7.map((d) => {
      const s = this.getSummary(d)
      return {
        date: d,
        matchRate: s?.matchRate ?? 0,
        totalDiffCents: s?.totalDiffCents ?? 0
      }
    })

    // 周汇总（按 ISO 周分组）
    const weeklyMap = new Map<string, {
      reports: ReconciliationReport[]
      startDate: string
      endDate: string
    }>()
    for (const [date, entry] of this.reportCache) {
      const d = new Date(date)
      const dayOfWeek = d.getDay()
      const monday = new Date(d)
      monday.setDate(d.getDate() - ((dayOfWeek + 6) % 7))
      const sunday = new Date(monday)
      sunday.setDate(monday.getDate() + 6)
      const weekLabel = `${monday.toISOString().slice(0, 10)}~${sunday.toISOString().slice(0, 10)}`
      const existing = weeklyMap.get(weekLabel)
      if (existing) {
        existing.reports.push(entry.report)
      } else {
        weeklyMap.set(weekLabel, {
          reports: [entry.report],
          startDate: monday.toISOString().slice(0, 10),
          endDate: sunday.toISOString().slice(0, 10)
        })
      }
    }
    const weeklySummary = Array.from(weeklyMap.entries()).map(([weekLabel, w]) => ({
      weekLabel,
      startDate: w.startDate,
      endDate: w.endDate,
      internalTotal: w.reports.reduce((s, r) => s + r.internalTotal, 0),
      externalTotal: w.reports.reduce((s, r) => s + r.externalTotal, 0),
      matchedCount: w.reports.reduce((s, r) => s + r.matchedCount, 0),
      exactMatchCount: w.reports.reduce((s, r) => s + r.exactMatchCount, 0),
      totalDiffCents: w.reports.reduce((s, r) => s + r.totalDiffCents, 0),
      totalDiffs: w.reports.reduce((s, r) => s + r.diffs.length, 0)
    })).sort((a, b) => a.startDate.localeCompare(b.startDate))

    // 月汇总
    const monthlyMap = new Map<string, { reports: ReconciliationReport[] }>()
    for (const [date, entry] of this.reportCache) {
      const monthLabel = date.slice(0, 7)
      const existing = monthlyMap.get(monthLabel)
      if (existing) {
        existing.reports.push(entry.report)
      } else {
        monthlyMap.set(monthLabel, { reports: [entry.report] })
      }
    }
    const monthlySummary = Array.from(monthlyMap.entries()).map(([monthLabel, m]) => ({
      monthLabel,
      internalTotal: m.reports.reduce((s, r) => s + r.internalTotal, 0),
      externalTotal: m.reports.reduce((s, r) => s + r.externalTotal, 0),
      matchedCount: m.reports.reduce((s, r) => s + r.matchedCount, 0),
      totalDiffCents: m.reports.reduce((s, r) => s + r.totalDiffCents, 0)
    })).sort((a, b) => a.monthLabel.localeCompare(b.monthLabel))

    // 差异类型趋势
    const diffKindTrends: Record<DiffKind, number> = {
      'amount-mismatch': 0,
      'missing-internal': 0,
      'missing-external': 0,
      'duplicate': 0
    }
    for (const entry of this.reportCache.values()) {
      for (const d of entry.report.diffs) {
        diffKindTrends[d.kind] = (diffKindTrends[d.kind] ?? 0) + 1
      }
    }

    // 每日状态
    const dailyStatus = reportDates.map((d) => {
      const s = this.getSummary(d)
      return {
        date: d,
        matched: (s?.exactMatchCount ?? 0) > 0 && (s?.unresolvedCount ?? 0) === 0,
        diffCount: (s?.unresolvedCount ?? 0) + (s?.resolvedCount ?? 0)
      }
    })

    return {
      totalRuns: this.reconciliationStatus.totalRuns,
      reportDates,
      matchRateTrend,
      weeklySummary,
      monthlySummary,
      diffKindTrends,
      dailyStatus
    }
  }

  /**
   * 获取对账汇总
   *
   * 返回最近一次对账的聚合统计，含差异分类明细和已解决/未解决计数。
   * date 参数用于查询历史缓存; 不传则返回最近一次。
   */
  getSummary(date?: string): ReconciliationSummary | null {
    let report = this.lastReport

    if (date) {
      const cached = this.reportCache.get(date)
      if (cached) {
        report = cached.report
      } else {
        return null
      }
    }

    if (!report) return null

    const diffKindBreakdown = this.buildDiffKindBreakdown(report.diffs)
    const totalDiffCents = diffKindBreakdown.reduce((sum, b) => sum + b.totalDiffCents, 0)
    const diffRate = report.internalTotalCents > 0
      ? Math.round((Math.abs(report.totalDiffCents) / report.internalTotalCents) * 10000) / 100
      : 0
    const matchRate = report.internalTotal > 0
      ? Math.round((report.exactMatchCount / report.internalTotal) * 10000) / 100
      : 100
    const resolvedCount = Array.from(this.resolvedDiffs.values()).length
    const unresolvedCount = report.diffs.length - resolvedCount

    return {
      date: report.date,
      internalTotal: report.internalTotal,
      externalTotal: report.externalTotal,
      matchedCount: report.matchedCount,
      exactMatchCount: report.exactMatchCount,
      matchRate,
      internalTotalCents: report.internalTotalCents,
      externalTotalCents: report.externalTotalCents,
      totalDiffCents: report.totalDiffCents,
      diffRate,
      diffKindBreakdown,
      resolvedCount: Math.max(0, resolvedCount),
      unresolvedCount: Math.max(0, unresolvedCount),
      durationMs: report.durationMs,
      totalRuns: this.reconciliationStatus.totalRuns
    }
  }

  /**
   * 获取差异明细（含解析状态），支持过滤
   */
  getDetails(query?: DiffDetailQuery): DiffDetailRecord[] {
    const report = this.lastReport
    if (!report) return []

    let details: DiffDetailRecord[] = report.diffs.map((d) => {
      const diffKey = `${d.kind}::${d.orderNo ?? ''}::${d.internalId ?? ''}::${d.externalId ?? ''}`
      const resolved = this.resolvedDiffs.get(diffKey)
      return {
        ...d,
        diffKey,
        resolved: !!resolved,
        resolvedAt: resolved?.resolvedAt,
        resolvedBy: resolved?.resolvedBy,
        resolveNote: resolved?.note
      }
    })

    if (query) {
      if (query.kind) {
        details = details.filter((d) => d.kind === query.kind)
      }
      if (query.resolved !== undefined) {
        details = details.filter((d) => d.resolved === query.resolved)
      }
      if (query.orderNo) {
        details = details.filter((d) => d.orderNo === query.orderNo)
      }
      if (query.offset !== undefined) {
        details = details.slice(query.offset)
      }
      if (query.limit !== undefined) {
        details = details.slice(0, query.limit)
      }
    }

    return details
  }

  /**
   * 标记某条差异已处理
   * 返回 false 如果 key 为空、不存在于最近报告差异中、或已标记过
   */
  markDiffResolved(diffKey: string, options?: { resolvedBy?: string; note?: string }): boolean {
    if (!diffKey) return false
    if (this.resolvedDiffs.has(diffKey)) {
      return false // 重复标记
    }
    // 校验 key 是否对应一个真实的差异记录
    if (this.lastReport) {
      const exists = this.lastReport.diffs.some(
        (d) => `${d.kind}::${d.orderNo ?? ''}::${d.internalId ?? ''}::${d.externalId ?? ''}` === diffKey
      )
      if (!exists) return false
    } else {
      return false
    }
    this.resolvedDiffs.set(diffKey, {
      diffKey,
      resolvedAt: new Date().toISOString(),
      resolvedBy: options?.resolvedBy,
      note: options?.note
    })
    return true
  }

  /**
   * 检查 diff 是否已被标记为已处理
   */
  isDiffResolved(diffKey: string): boolean {
    return this.resolvedDiffs.has(diffKey)
  }

  /**
   * 获取已处理的差异列表
   */
  getResolvedDiffs(): ResolvedDiff[] {
    return Array.from(this.resolvedDiffs.values())
  }

  /**
   * 清除已处理的差异标记
   */
  clearResolvedDiffs(): void {
    this.resolvedDiffs.clear()
  }

  /**
   * 获取缓存报告
   */
  getCachedReport(date: string): ReconciliationReport | null {
    const cached = this.reportCache.get(date)
    if (cached) {
      cached.hits++
      return cached.report
    }
    return null
  }

  /**
   * 清除所有缓存
   */
  clearCache(): void {
    this.reportCache.clear()
  }

  /**
   * 获取缓存统计
   */
  getCacheStats(): { entryCount: number; dates: string[]; totalHits: number } {
    const dates: string[] = []
    let totalHits = 0
    for (const [date, entry] of this.reportCache) {
      dates.push(date)
      totalHits += entry.hits
    }
    return { entryCount: this.reportCache.size, dates: dates.sort(), totalHits }
  }

  // ═══════════════════════════════════════════════════════
  // 核心: 执行对账
  // ═══════════════════════════════════════════════════════

  /**
   * 执行对账
   *
   * 流程:
   *   1. 构建内部索引 (orderNo / channelTxnNo / combined)
   *   2. 遍历外部流水, 按匹配键查找内部交易
   *   3. 对匹配到的交易做金额校验 → matched / amount-mismatch
   *   4. 处理未匹配的内部交易 → missing-external
   *   5. 处理重复交易 → duplicate
   *   6. 生成差异汇总
   *   7. 缓存报告
   */
  async run(options: ReconciliationRunOptions): Promise<ReconciliationReport> {
    const startedAt = Date.now()
    const { date, internalTransactions, externalTransactions, matchKey, channel, toleranceCents = 0 } = options

    this.reconciliationStatus.inProgress = true

    try {
      // 验证输入
      this.validateInput(internalTransactions, externalTransactions)

      // 1. 构建内部索引
      const internalIndex = this.buildIndex(internalTransactions, matchKey)

      // 2. 执行匹配
      const matches: MatchResult[] = []
      const diffs: DiffRecord[] = []
      const matchedExternalIds = new Set<string>()
      const matchedInternalIds = new Set<string>()

      for (const ext of externalTransactions) {
        // 渠道过滤
        if (channel && ext.channel !== channel) continue

        const key = this.extractKey(ext, matchKey)
        if (!key) {
          diffs.push({
            kind: 'missing-internal',
            externalId: ext.id,
            externalAmountCents: ext.amountCents,
            diffCents: -ext.amountCents,
            note: `外部流水 ${ext.id} 无可用的匹配键 (${matchKey})`
          })
          continue
        }

        const internalMatches = internalIndex.get(key)
        if (!internalMatches || internalMatches.length === 0) {
          diffs.push({
            kind: 'missing-internal',
            orderNo: ext.orderNo,
            externalId: ext.id,
            externalAmountCents: ext.amountCents,
            diffCents: -ext.amountCents,
            note: `外部流水 ${ext.id} (${ext.orderNo ?? '无订单号'}) 在内部无匹配`
          })
          continue
        }

        // 找到内部匹配 → 取第一条尚未被匹配的作为主匹配
        const primary = internalMatches.find((t) => !matchedInternalIds.has(t.id)) ?? internalMatches[0]
        const alreadyMatchedInt = matchedInternalIds.has(primary.id)

        matchedInternalIds.add(primary.id)
        matchedExternalIds.add(ext.id)

        if (alreadyMatchedInt) {
          diffs.push({
            kind: 'duplicate',
            orderNo: key,
            externalId: ext.id,
            internalId: primary.id,
            diffCents: 0,
            note: `订单 ${key} 在外部有多条流水且内部已被匹配`
          })
          matches.push({
            internalId: primary.id,
            externalId: ext.id,
            orderNo: key,
            internalAmountCents: primary.amountCents,
            externalAmountCents: ext.amountCents,
            matched: false
          })
          continue
        }

        // 金额校验
        const amountDiff = primary.amountCents - ext.amountCents
        const isExactMatch = Math.abs(amountDiff) <= toleranceCents

        matches.push({
          internalId: primary.id,
          externalId: ext.id,
          orderNo: key,
          internalAmountCents: primary.amountCents,
          externalAmountCents: ext.amountCents,
          matched: isExactMatch
        })

        if (!isExactMatch) {
          diffs.push({
            kind: 'amount-mismatch',
            orderNo: key,
            internalId: primary.id,
            externalId: ext.id,
            internalAmountCents: primary.amountCents,
            externalAmountCents: ext.amountCents,
            diffCents: amountDiff,
            note: `金额不一致: 内部 ${primary.amountCents}分, 外部 ${ext.amountCents}分`
          })
        }

        // 检查内部重复匹配: 同一个 key 命中多个未匹配的内部交易
        if (internalMatches.length > 1) {
          const duplicateInternalIds = internalMatches.slice(1).map((t) => t.id)
          const dupExists = diffs.some(
            (d) =>
              d.kind === 'duplicate' &&
              d.orderNo === key &&
              d.internalId === primary.id
          )
          if (!dupExists) {
            diffs.push({
              kind: 'duplicate',
              orderNo: key,
              externalId: ext.id,
              duplicateIds: duplicateInternalIds,
              diffCents: 0,
              note: `订单 ${key} 在内部存在 ${internalMatches.length} 条匹配记录`
            })
          }
        }
      }

      // 4. 未匹配的内部交易 → missing-external
      for (const internal of internalTransactions) {
        if (channel && internal.channel !== channel) continue

        if (!matchedInternalIds.has(internal.id)) {
          diffs.push({
            kind: 'missing-external',
            orderNo: internal.orderNo,
            internalId: internal.id,
            internalAmountCents: internal.amountCents,
            diffCents: internal.amountCents,
            note: `内部交易 ${internal.id} (${internal.orderNo}) 在外部无匹配`
          })
        }
      }

      // 5. 外部重复检测: 同一个 key 被多个外部流水引用
      //    只报告那些尚未在匹配循环中标记的
      const externalKeyCounts = new Map<string, { count: number; ids: string[] }>()
      for (const ext of externalTransactions) {
        if (channel && ext.channel !== channel) continue
        const key = this.extractKey(ext, matchKey)
        if (key) {
          const entry = externalKeyCounts.get(key) ?? { count: 0, ids: [] }
          entry.count++
          entry.ids.push(ext.id)
          externalKeyCounts.set(key, entry)
        }
      }
      for (const [key, entry] of externalKeyCounts) {
        if (entry.count > 1) {
          const alreadyReported = diffs.some(
            (d) =>
              d.kind === 'duplicate' &&
              d.orderNo === key &&
              d.externalId !== undefined &&
              entry.ids.includes(d.externalId)
          )
          if (!alreadyReported) {
            diffs.push({
              kind: 'duplicate',
              orderNo: key,
              diffCents: 0,
              duplicateIds: entry.ids,
              note: `订单 ${key} 在外部存在 ${entry.count} 条重复流水`
            })
          }
        }
      }

      // 6. 汇总
      const exactMatchCount = matches.filter((m) => m.matched).length
      const internalTotalCents = internalTransactions
        .filter((t) => !channel || t.channel === channel)
        .reduce((sum, t) => sum + t.amountCents, 0)
      const externalTotalCents = externalTransactions
        .filter((t) => !channel || t.channel === channel)
        .reduce((sum, t) => sum + t.amountCents, 0)

      const report: ReconciliationReport = {
        date,
        internalTotal: internalTransactions.filter((t) => !channel || t.channel === channel).length,
        externalTotal: externalTransactions.filter((t) => !channel || t.channel === channel).length,
        matchedCount: matches.length,
        exactMatchCount,
        internalTotalCents,
        externalTotalCents,
        totalDiffCents: internalTotalCents - externalTotalCents,
        diffs,
        matches,
        matchKeyType: matchKey,
        generatedAt: new Date().toISOString(),
        durationMs: Date.now() - startedAt,
        toleranceCents
      }

      this.lastReport = report
      this.cacheReport(date, report)
      this.reconciliationStatus.lastRunAt = report.generatedAt
      this.reconciliationStatus.lastRunDate = date
      this.reconciliationStatus.totalRuns++
      this.reconciliationStatus.lastError = null

      this.logger.log(
        `Reconciliation done: date=${date} internal=${report.internalTotal} external=${report.externalTotal} ` +
        `matched=${report.matchedCount} exact=${report.exactMatchCount} diffs=${report.diffs.length} ` +
        `totalDiff=${report.totalDiffCents} cents (${report.durationMs}ms)`
      )

      return report
    } catch (error) {
      const errMsg = (error as Error).message
      this.reconciliationStatus.lastError = errMsg
      this.logger.error(`Reconciliation failed: ${errMsg}`, (error as Error).stack)
      throw error
    } finally {
      this.reconciliationStatus.inProgress = false
    }
  }

  // ═══════════════════════════════════════════════════════
  // 辅助方法
  // ═══════════════════════════════════════════════════════

  /**
   * 校验输入数据合法性
   */
  private validateInput(
    internalTransactions: TransactionInput[],
    externalTransactions: BankStatementInput[]
  ): void {
    for (const txn of internalTransactions) {
      if (!txn.id) throw new Error('内部交易缺少 id')
      if (typeof txn.amountCents !== 'number' || !Number.isFinite(txn.amountCents)) throw new Error(`内部交易 ${txn.id} 金额无效`)
    }
    for (const stmt of externalTransactions) {
      if (!stmt.id) throw new Error('外部流水缺少 id')
      if (typeof stmt.amountCents !== 'number' || !Number.isFinite(stmt.amountCents)) throw new Error(`外部流水 ${stmt.id} 金额无效`)
    }
  }

  /**
   * 构建内部索引: matchKey → TransactionInput[]
   */
  private buildIndex(
    transactions: TransactionInput[],
    matchKey: MatchKeyType
  ): Map<string, TransactionInput[]> {
    const index = new Map<string, TransactionInput[]>()

    for (const txn of transactions) {
      const key = this.extractKey(txn, matchKey)
      if (!key) continue

      const existing = index.get(key)
      if (existing) {
        existing.push(txn)
      } else {
        index.set(key, [txn])
      }
    }

    return index
  }

  /**
   * 根据匹配键类型从交易记录中提取 key
   */
  private extractKey(
    input: TransactionInput | BankStatementInput,
    matchKey: MatchKeyType
  ): string | null {
    switch (matchKey) {
      case 'orderNo':
        return input.orderNo ?? null
      case 'channelTxnNo':
        return input.channelTxnNo ?? null
      case 'combined': {
        const parts = [input.orderNo, String(input.amountCents), input.date]
        if (parts.some((p) => !p)) return null
        return parts.join('::')
      }
      default:
        return null
    }
  }

  /**
   * 构建差异分类统计
   */
  private buildDiffKindBreakdown(diffs: DiffRecord[]): Array<{ kind: DiffKind; count: number; totalDiffCents: number }> {
    const map = new Map<DiffKind, { count: number; totalDiffCents: number }>()

    for (const d of diffs) {
      const entry = map.get(d.kind) ?? { count: 0, totalDiffCents: 0 }
      entry.count++
      entry.totalDiffCents += d.diffCents
      map.set(d.kind, entry)
    }

    return Array.from(map.entries()).map(([kind, stats]) => ({
      kind,
      count: stats.count,
      totalDiffCents: stats.totalDiffCents
    }))
  }

  /**
   * 缓存对账报告
   */
  private cacheReport(date: string, report: ReconciliationReport): void {
    this.reportCache.set(date, {
      report,
      cachedAt: new Date().toISOString(),
      hits: 0
    })
    // 最多缓存 30 天
    if (this.reportCache.size > 30) {
      const oldestKey = this.reportCache.keys().next().value
      if (oldestKey) {
        this.reportCache.delete(oldestKey)
      }
    }
  }
}
