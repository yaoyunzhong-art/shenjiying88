/**
 * FinanceArchivalService · 核算归档服务 (WP-04A)
 *
 * 职责:
 *   1. 结算完成后，将 Period 内完整财务数据归档为不可变更的快照
 *   2. 归档快照包含: ledger 总数/分类统计 + settlement 状态 + 时间范围
 *   3. 提供归档查询/版本对比/回退防篡改能力
 *   4. 连续归档不覆盖 (version +1), 支持审计追溯
 *
 * 与 cashier → transactions → finance 链路的衔接:
 *   Cashier 交易 -> Transactions 模块 -> FinanceService.recordTransactionRevenue() [Ledger]
 *   -> FinanceSettlementService.createSettlement() [Settlement]
 *   -> FinanceArchivalService.archive() [Archival 快照]
 *
 * 闭环: 交易 → Ledger → 结算(Settlement) → 核算归档(Archival) → 可审计
 */

import { randomUUID } from 'node:crypto'
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { FinanceService } from './finance.service'
import { ArchivalStatus, type FinanceArchival } from './finance.entity'
import type { CreateArchivalDto, ArchivalQueryDto } from './finance.dto'

/** 模块级 in-memory 存储 */
const archivalStore = new Map<string, FinanceArchival>()

export function resetFinanceArchivalTestState() {
  archivalStore.clear()
}

@Injectable()
export class FinanceArchivalService {
  constructor(private readonly financeService: FinanceService) {}

  /**
   * 核算归档 — 将一个结算周期的财务数据固化为快照
   *
   * 前置条件:
   *   - settlement 必须存在且状态为 CONFIRMED
   *   - 同一 period + settlementId 不重复归档 (version +1)
   */
  async archive(
    tenantContext: RequestTenantContext,
    input: CreateArchivalDto
  ): Promise<FinanceArchival> {
    // 1. 校验结算存在且已确认
    const settlement = await this.financeService.getSettlementResolved(
      input.settlementId,
      tenantContext
    )
    if (settlement.settlementStatus !== 'CONFIRMED') {
      throw new ConflictException(
        `Settlement ${input.settlementId} must be CONFIRMED before archival, current: ${settlement.settlementStatus}`
      )
    }

    // 2. 收集周期内 ledger 数据
    const ledgers = await this.financeService.listLedgersResolved(tenantContext, {
      storeId: input.storeId ?? tenantContext.storeId,
      recordedAfter: input.periodStart,
      recordedBefore: input.periodEnd
    })

    // 3. 计算归档快照
    const now = new Date().toISOString()
    const revenueLedgers = ledgers.filter((l) => l.type === 'REVENUE')
    const expenseLedgers = ledgers.filter((l) => l.type === 'EXPENSE')
    const refundLedgers = ledgers.filter((l) => l.type === 'REFUND')

    const snapshot: FinanceArchival['snapshot'] = {
      totalRevenue: revenueLedgers.reduce((s, l) => s + l.amount, 0),
      totalExpense: expenseLedgers.reduce((s, l) => s + l.amount, 0),
      totalRefund: refundLedgers.reduce((s, l) => s + l.amount, 0),
      netRevenue: ledgers.reduce((s, l) => {
        if (l.type === 'REVENUE' || l.type === 'ADJUSTMENT') return s + l.amount
        return s - l.amount
      }, 0),
      ledgerCount: ledgers.length,
      revenueLedgerCount: revenueLedgers.length,
      expenseLedgerCount: expenseLedgers.length,
      refundLedgerCount: refundLedgers.length,
      settlement: {
        totalRevenue: settlement.totalRevenue,
        totalExpense: settlement.totalExpense,
        netProfit: settlement.netProfit,
        settlementStatus: settlement.settlementStatus
      }
    }

    // 4. 版本号: 同一 period + settlementId 的已有归档 version+1
    const existingKey = `${tenantContext.tenantId}:${input.settlementId}`
    const existingEntries = Array.from(archivalStore.values())
      .filter(
        (a) =>
          a.tenantId === tenantContext.tenantId &&
          a.settlementId === input.settlementId
      )
    const version = existingEntries.length > 0
      ? Math.max(...existingEntries.map((a) => a.version)) + 1
      : 1

    // 5. 创建归档记录
    const archival: FinanceArchival = {
      id: `archival-${randomUUID()}`,
      tenantId: tenantContext.tenantId,
      brandId: input.brandId ?? tenantContext.brandId,
      storeId: input.storeId ?? tenantContext.storeId,
      periodStart: input.periodStart,
      periodEnd: input.periodEnd,
      settlementId: input.settlementId,
      type: input.type ?? 'MANUAL',
      status: ArchivalStatus.Archived,
      snapshot,
      version,
      archivedBy: input.archivedBy,
      archivedAt: now,
      createdAt: now,
      updatedAt: now
    }

    archivalStore.set(archival.id, archival)
    return archival
  }

  /**
   * 获取归档详情
   */
  getArchival(
    archivalId: string,
    tenantContext: RequestTenantContext
  ): FinanceArchival {
    const archival = archivalStore.get(archivalId)
    if (!archival || archival.tenantId !== tenantContext.tenantId) {
      throw new NotFoundException(`Archival ${archivalId} not found`)
    }
    return archival
  }

  /**
   * 查询归档列表
   */
  listArchivals(
    tenantContext: RequestTenantContext,
    query?: ArchivalQueryDto
  ): FinanceArchival[] {
    const limit = query?.limit && query.limit > 0 ? query.limit : undefined

    const archivals = Array.from(archivalStore.values())
      .filter((a) => a.tenantId === tenantContext.tenantId)
      .filter((a) => !query?.storeId || a.storeId === query.storeId)
      .filter((a) => !query?.settlementId || a.settlementId === query.settlementId)
      .filter((a) => !query?.status || a.status === query.status)
      .filter((a) => !query?.type || a.type === query.type)
      .filter(
        (a) =>
          !query?.archivedAfter ||
          (a.archivedAt && a.archivedAt >= query.archivedAfter)
      )
      .filter(
        (a) =>
          !query?.archivedBefore ||
          (a.archivedAt && a.archivedAt <= query.archivedBefore)
      )
      .sort((a, b) => {
        const aTime = a.archivedAt ?? a.createdAt
        const bTime = b.archivedAt ?? b.createdAt
        return bTime.localeCompare(aTime)
      })

    return typeof limit === 'number' ? archivals.slice(0, limit) : archivals
  }

  /**
   * 版本对比 — 查看同一个 settlement 的不同归档版本
   */
  getVersionHistory(
    settlementId: string,
    tenantContext: RequestTenantContext
  ): FinanceArchival[] {
    return Array.from(archivalStore.values())
      .filter(
        (a) =>
          a.tenantId === tenantContext.tenantId &&
          a.settlementId === settlementId
      )
      .sort((a, b) => b.version - a.version)
  }

  /**
   * 标记归档失败
   */
  markFailed(
    archivalId: string,
    tenantContext: RequestTenantContext,
    errorMessage: string
  ): FinanceArchival {
    const archival = this.getArchival(archivalId, tenantContext)
    archival.status = ArchivalStatus.Failed
    archival.errorMessage = errorMessage
    archival.updatedAt = new Date().toISOString()
    return archival
  }

  /** 测试辅助: 清理所有数据 */
  resetForTests(): void {
    archivalStore.clear()
  }
}
