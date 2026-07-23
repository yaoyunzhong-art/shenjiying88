import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [reconciliation-db.service] 对账持久化层测试 (P-38)
 *
 * 覆盖 FinanceReconciliationDbService:
 *   - saveReport / loadReport: 内存模式持久化与回读
 *   - loadReportsInRange: 日期范围查询
 *   - listReportDates: 报告日期列表
 *   - saveResolvedDiff / loadResolvedDiffs / isDiffResolved / clearResolvedDiffs
 *   - getCrossEntityReconciliation: 跨实体联表查询 (fallback 模式)
 *   - syncFromReconciliationService / migrateAll
 *   - 边界: 空数据 / 重复保存 / 跨租户
 *
 * 约定:
 *   - 不依赖真实 Prisma (不传参使用 in-memory fallback)
 *   - 使用 reconciliation.service.ts 导出的类型构造数据
 */

import 'reflect-metadata'
import { FinanceReconciliationDbService } from './reconciliation-db.service'
import type {
  ReconciliationReport,
  DiffRecord,
  MatchResult,
  ReconciliationSummary,
  DiffDetailRecord,
} from './reconciliation.service'

// ══════════════════════════════════════════════════════════════════════════════
// Fixtures
// ══════════════════════════════════════════════════════════════════════════════

function makeReport(date: string, overrides?: Partial<ReconciliationReport>): ReconciliationReport {
  return {
    date,
    internalTotal: 10,
    externalTotal: 10,
    matchedCount: 8,
    exactMatchCount: 7,
    internalTotalCents: 500000,
    externalTotalCents: 500050,
    totalDiffCents: 50,
    diffs: [
      {
        kind: 'amount-mismatch',
        orderNo: 'O-001',
        internalId: 'int-001',
        externalId: 'ext-001',
        internalAmountCents: 10000,
        externalAmountCents: 10050,
        diffCents: 50,
        note: '金额差50分',
      },
    ],
    matches: [
      {
        internalId: 'int-001',
        externalId: 'ext-001',
        orderNo: 'O-001',
        internalAmountCents: 10000,
        externalAmountCents: 10000,
        matched: true,
      },
    ],
    matchKeyType: 'orderNo',
    generatedAt: '2026-07-01T00:00:00Z',
    durationMs: 123,
    toleranceCents: 0,
    ...overrides,
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// helpers
// ══════════════════════════════════════════════════════════════════════════════

function makeDbService(): FinanceReconciliationDbService {
  // Avoid passing Prisma; fallback to in-memory
  return new (FinanceReconciliationDbService as any)()
}

// ══════════════════════════════════════════════════════════════════════════════
// saveReport / loadReport
// ══════════════════════════════════════════════════════════════════════════════

describe('[reconciliation-db] saveReport / loadReport', () => {
  it('保存并加载对账报告', async () => {
    const db = makeDbService()
    const report = makeReport('2026-07-01')

    await db.saveReport(report)
    const loaded = await db.loadReport('2026-07-01')

    expect(loaded).not.toBeNull()
    expect(loaded!.date).toBe('2026-07-01')
    expect(loaded!.internalTotal).toBe(10)
    expect(loaded!.matchedCount).toBe(8)
    expect(loaded!.diffs.length).toBe(1)
    expect(loaded!.matches.length).toBe(1)
  })

  it('不存在的日期返回 null', async () => {
    const db = makeDbService()
    const loaded = await db.loadReport('2099-01-01')
    expect(loaded).toBeNull()
  })

  it('多次保存同一日期会覆盖', async () => {
    const db = makeDbService()
    await db.saveReport(makeReport('2026-07-01', { internalTotal: 5 }))
    await db.saveReport(makeReport('2026-07-01', { internalTotal: 20 }))

    const loaded = await db.loadReport('2026-07-01')
    expect(loaded!.internalTotal).toBe(20)
  })

  it('保存空的 diffs 和 matches 不报错', async () => {
    const db = makeDbService()
    await db.saveReport(makeReport('2026-07-02', { diffs: [], matches: [] }))
    const loaded = await db.loadReport('2026-07-02')
    expect(loaded).not.toBeNull()
    expect(loaded!.diffs).toEqual([])
    expect(loaded!.matches).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// loadReportsInRange
// ══════════════════════════════════════════════════════════════════════════════

describe('[reconciliation-db] loadReportsInRange', () => {
  it('按日期范围加载报告并按日期排序', async () => {
    const db = makeDbService()
    await db.saveReport(makeReport('2026-07-01'))
    await db.saveReport(makeReport('2026-07-05'))
    await db.saveReport(makeReport('2026-07-10'))

    const reports = await db.loadReportsInRange('2026-07-01', '2026-07-10')
    expect(reports.length).toBe(3)
    expect(reports[0].date).toBe('2026-07-01')
    expect(reports[2].date).toBe('2026-07-10')
  })

  it('范围外日期不被返回', async () => {
    const db = makeDbService()
    await db.saveReport(makeReport('2026-06-30'))
    await db.saveReport(makeReport('2026-07-15'))

    const reports = await db.loadReportsInRange('2026-07-01', '2026-07-10')
    expect(reports.length).toBe(0)
  })

  it('空范围返回空数组', async () => {
    const db = makeDbService()
    const reports = await db.loadReportsInRange('2026-01-01', '2026-01-31')
    expect(reports).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// listReportDates
// ══════════════════════════════════════════════════════════════════════════════

describe('[reconciliation-db] listReportDates', () => {
  it('列出所有已持久化的日期', async () => {
    const db = makeDbService()
    await db.saveReport(makeReport('2026-07-01'))
    await db.saveReport(makeReport('2026-07-05'))
    await db.saveReport(makeReport('2026-07-10'))

    const dates = await db.listReportDates()
    expect(dates).toEqual(['2026-07-01', '2026-07-05', '2026-07-10'])
  })

  it('无数据返回空数组', async () => {
    const db = makeDbService()
    const dates = await db.listReportDates()
    expect(dates).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// Diff resolution persistence
// ══════════════════════════════════════════════════════════════════════════════

describe('[reconciliation-db] 差异解析持久化', () => {
  it('saveResolvedDiff / loadResolvedDiffs 存取', async () => {
    const db = makeDbService()
    await db.saveResolvedDiff({ diffKey: 'O-001:amount-mismatch', resolvedBy: 'admin' })

    const diffs = await db.loadResolvedDiffs()
    expect(diffs.length).toBe(1)
    expect(diffs[0].diffKey).toBe('O-001:amount-mismatch')
    expect(diffs[0].resolvedBy).toBe('admin')
  })

  it('isDiffResolved 正确判断', async () => {
    const db = makeDbService()
    expect(await db.isDiffResolved('not-resolved')).toBe(false)

    await db.saveResolvedDiff({ diffKey: 'resolved-key' })
    expect(await db.isDiffResolved('resolved-key')).toBe(true)
  })

  it('clearResolvedDiffs 清除所有已解决差异', async () => {
    const db = makeDbService()
    await db.saveResolvedDiff({ diffKey: 'key-1' })
    await db.saveResolvedDiff({ diffKey: 'key-2' })
    expect((await db.loadResolvedDiffs()).length).toBe(2)

    await db.clearResolvedDiffs()
    expect((await db.loadResolvedDiffs()).length).toBe(0)
  })

  it('重复解决同一 diff 不报错', async () => {
    const db = makeDbService()
    await db.saveResolvedDiff({ diffKey: 'dup-key' })
    await db.saveResolvedDiff({ diffKey: 'dup-key', note: 'updated' })

    const diffs = await db.loadResolvedDiffs()
    const found = diffs.filter(d => d.diffKey === 'dup-key')
    // 应只有一条记录 (in-memory 下 set 覆盖)
    expect(found.length).toBe(1)
  })

  it('带备注的解决记录', async () => {
    const db = makeDbService()
    await db.saveResolvedDiff({ diffKey: 'key-1', resolvedBy: 'ops-team', note: '金额已人工核对' })

    const diffs = await db.loadResolvedDiffs()
    const found = diffs.find(d => d.diffKey === 'key-1')
    expect(found).toBeDefined()
    expect(found!.resolvedBy).toBe('ops-team')
    expect(found!.note).toBe('金额已人工核对')
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// getCrossEntityReconciliation (fallback)
// ══════════════════════════════════════════════════════════════════════════════

describe('[reconciliation-db] getCrossEntityReconciliation', () => {
  it('跨实体联表查询返回正确结构', async () => {
    const db = makeDbService()
    await db.saveReport(makeReport('2026-07-01', {
      internalTotalCents: 100000,
      externalTotalCents: 100000,
      totalDiffCents: 0,
    }))
    await db.saveReport(makeReport('2026-07-02', {
      internalTotalCents: 200000,
      externalTotalCents: 200050,
      totalDiffCents: 50,
    }))

    const result = await db.getCrossEntityReconciliation({
      tenantId: 'tenant-001',
      startDate: '2026-07-01',
      endDate: '2026-07-31',
    })

    expect(result.periodStart).toBe('2026-07-01')
    expect(result.periodEnd).toBe('2026-07-31')
    expect(result.rows.length).toBeGreaterThanOrEqual(1)
    expect(result.aggregatedRevenue).toBeGreaterThan(0)
  })

  it('无数据时返回空汇总', async () => {
    const db = makeDbService()
    const result = await db.getCrossEntityReconciliation({
      tenantId: 'tenant-001',
      startDate: '2099-01-01',
      endDate: '2099-12-31',
    })

    expect(result.aggregatedRevenue).toBe(0)
    expect(result.aggregatedExpense).toBe(0)
    expect(result.aggregatedMatchedCount).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// syncFromReconciliationService
// ══════════════════════════════════════════════════════════════════════════════

describe('[reconciliation-db] syncFromReconciliationService', () => {
  it('无 Prisma 时返回 0', async () => {
    const db = makeDbService()
    const result = await db.syncFromReconciliationService(
      () => null,
      () => [],
      () => [],
      () => ({ dates: [] }),
    )
    expect(result.syncedReports).toBe(0)
    expect(result.syncedDiffs).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// migrateAll
// ══════════════════════════════════════════════════════════════════════════════

describe('[reconciliation-db] migrateAll', () => {
  it('无 Prisma 时返回 0', async () => {
    const db = makeDbService()
    const result = await db.migrateAll(
      new Map<string, ReconciliationReport>(),
      new Map(),
    )
    expect(result.syncedReports).toBe(0)
    expect(result.syncedDiffs).toBe(0)
  })

  it('有数据时尝试迁移 (无 Prisma 返回 0)', async () => {
    const db = makeDbService()
    const reportMap = new Map<string, ReconciliationReport>()
    reportMap.set('2026-07-01', makeReport('2026-07-01'))

    const diffMap = new Map<string, { diffKey: string; resolvedAt: string }>()
    diffMap.set('diff-key-1', { diffKey: 'diff-key-1', resolvedAt: '2026-07-01T00:00:00Z' })

    const result = await db.migrateAll(reportMap, diffMap)
    expect(result.syncedReports).toBe(0)
    expect(result.syncedDiffs).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// Edge cases
// ══════════════════════════════════════════════════════════════════════════════

describe('[reconciliation-db] 边界情况', () => {
  it('大金额报告能正常存取', async () => {
    const db = makeDbService()
    const report = makeReport('2026-12-31', {
      internalTotalCents: 999999999,
      externalTotalCents: 999999999,
      totalDiffCents: 0,
    })
    await db.saveReport(report)
    const loaded = await db.loadReport('2026-12-31')
    expect(loaded!.internalTotalCents).toBe(999999999)
  })

  it('大量 diffs 不损坏报告结构', async () => {
    const db = makeDbService()
    const manyDiffs: DiffRecord[] = Array.from({ length: 100 }, (_, i) => ({
      kind: i % 2 === 0 ? 'amount-mismatch' as const : 'missing-external' as const,
      orderNo: `O-${String(i).padStart(3, '0')}`,
      internalId: `int-${i}`,
      diffCents: i * 10,
    }))
    const report = makeReport('2026-08-01', { diffs: manyDiffs })

    await db.saveReport(report)
    const loaded = await db.loadReport('2026-08-01')
    expect(loaded!.diffs.length).toBe(100)
  })

  it('重复调用 listReportDates 返回一致结果', async () => {
    const db = makeDbService()
    await db.saveReport(makeReport('2026-07-01'))
    const first = await db.listReportDates()
    const second = await db.listReportDates()
    expect(first).toEqual(second)
  })
})
