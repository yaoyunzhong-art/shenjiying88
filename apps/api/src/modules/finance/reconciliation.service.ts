/**
 * reconciliation.service.ts — P-38 财务对账核心逻辑
 *
 * 交易匹配引擎:
 *   1. 根据 订单号+金额+日期 匹配银行/渠道流水
 *   2. 差异检测: 金额不一致 / 缺少交易 / 重复交易
 *   3. 报表生成: return 差异汇总
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

// ─── Service ──────────────────────────────────────────────

@Injectable()
export class ReconciliationService {
  private readonly logger = new Logger(ReconciliationService.name)

  /** 已解决的差异 (in-memory) */
  private resolvedDiffs = new Map<string, ResolvedDiff>()
  /** 最近的对账报告 */
  private lastReport: ReconciliationReport | null = null
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
            totalDiffCents: this.lastReport.totalDiffCents,
            diffCount: this.lastReport.diffs.length
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
      const exists = this.lastReport.diffs.some((d) => `${d.kind}::${d.orderNo}` === diffKey)
      if (!exists) return false
    } else {
      // 还没有跑过对账 → 没有差异可标记
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
   */
  async run(options: ReconciliationRunOptions): Promise<ReconciliationReport> {
    const startedAt = Date.now()
    const { date, internalTransactions, externalTransactions, matchKey, channel, toleranceCents = 0 } = options

    this.reconciliationStatus.inProgress = true

    try {
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
          // 外部流水无可用的匹配键 → 标记为 missing-internal
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
          // 外部流水在内部找不到对应 → missing-internal
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
          // 这条外部匹配了一条已被前一条外部关联的内部记录 → 外部重复
          diffs.push({
            kind: 'duplicate',
            orderNo: key,
            externalId: ext.id,
            internalId: primary.id,
            diffCents: 0,
            note: `订单 ${key} 在外部有多条流水且内部已被匹配`
          })
          // 仍记录 match 但标记为 false
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

        // 检查重复匹配: 同一个 key 命中多个内部交易
        if (internalMatches.length > 1) {
          const duplicateInternalIds = internalMatches.slice(1).map((t) => t.id)
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

      // 4. 未匹配的内部交易 → missing-external
      for (const internal of internalTransactions) {
        // 渠道过滤
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

      // 5. 检查外部重复: 同一个 key 被多个外部流水匹配
      // (已在上面 detectDuplicateInternalMatches 处理, 额外的 external-only 检查)
      const externalKeyCounts = new Map<string, number>()
      for (const ext of externalTransactions) {
        const key = this.extractKey(ext, matchKey)
        if (key) {
          externalKeyCounts.set(key, (externalKeyCounts.get(key) ?? 0) + 1)
        }
      }
      for (const [key, count] of externalKeyCounts) {
        if (count > 1) {
          // 外部有重复, 检查是否已记录
          const alreadyReported = diffs.some(
            (d) => d.kind === 'duplicate' && d.orderNo === key
          )
          if (!alreadyReported) {
            diffs.push({
              kind: 'duplicate',
              orderNo: key,
              diffCents: 0,
              note: `订单 ${key} 在外部存在 ${count} 条重复流水`
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
        durationMs: Date.now() - startedAt
      }

      this.lastReport = report
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
        // combined = orderNo + amountCents + date
        const parts = [input.orderNo, String(input.amountCents), input.date]
        if (parts.some((p) => !p)) return null
        return parts.join('::')
      }
      default:
        return null
    }
  }
}
