/**
 * reconciliation.service.test.ts — P-38 对账核心逻辑 单元测试
 *
 * 正例 8: 完全匹配 / 单项差异 / 多差异 / 空对账 / 日期过滤 / 金额精确匹配 / 已处理标记 / 报表汇总
 * 反例 5: 无效 ID / 重复对账 / 余额不足 / 负金额 / 不匹配返回空
 * 边界 2: 超大金额 / 0 条交易对账
 * 总计 ≥ 15
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  ReconciliationService,
  type TransactionInput,
  type BankStatementInput,
  type ReconciliationRunOptions
} from './reconciliation.service'

// ─── 数据工厂 ─────────────────────────────────────────────

function txn(overrides: Partial<TransactionInput> & { id: string; orderNo: string; amountCents: number; date: string }): TransactionInput {
  return {
    channelTxnNo: `txn-${overrides.id}`,
    time: `${overrides.date}T10:00:00.000Z`,
    ...overrides
  }
}

function stmt(overrides: Partial<BankStatementInput> & { id: string; amountCents: number; date: string }): BankStatementInput {
  return {
    orderNo: `ord-${overrides.id}`,
    channelTxnNo: `ext-${overrides.id}`,
    time: `${overrides.date}T10:00:00.000Z`,
    ...overrides
  }
}

function buildOpts(overrides: Partial<ReconciliationRunOptions> & { date: string; internalTransactions: TransactionInput[]; externalTransactions: BankStatementInput[] }): ReconciliationRunOptions {
  return {
    matchKey: 'orderNo',
    toleranceCents: 0,
    ...overrides
  }
}

// ─── 测试套件 ────────────────────────────────────────────

describe('ReconciliationService · 对账核心逻辑', () => {
  let service: ReconciliationService

  beforeEach(() => {
    service = new ReconciliationService()
  })

  // ═════════════════════════════════════════════════════
  // 正例 8
  // ═════════════════════════════════════════════════════

  describe('正例', () => {
    it('1. 完全匹配: 内部+外部完全对齐 → matchedCount=N, diffs=0, totalDiff=0', async () => {
      const internal: TransactionInput[] = [
        txn({ id: 't1', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' }),
        txn({ id: 't2', orderNo: 'ORD002', amountCents: 19950, date: '2026-07-11' })
      ]
      const external: BankStatementInput[] = [
        stmt({ id: 's1', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' }),
        stmt({ id: 's2', orderNo: 'ORD002', amountCents: 19950, date: '2026-07-11' })
      ]

      const report = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: internal,
        externalTransactions: external
      }))

      expect(report.matchedCount).toBe(2)
      expect(report.exactMatchCount).toBe(2)
      expect(report.diffs).toHaveLength(0)
      expect(report.totalDiffCents).toBe(0)
      expect(report.internalTotal).toBe(2)
      expect(report.externalTotal).toBe(2)
    })

    it('2. 单项金额差异: 外部金额不同 → 产生 amount-mismatch', async () => {
      const internal: TransactionInput[] = [
        txn({ id: 't1', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' })
      ]
      const external: BankStatementInput[] = [
        stmt({ id: 's1', orderNo: 'ORD001', amountCents: 9999, date: '2026-07-11' })
      ]

      const report = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: internal,
        externalTransactions: external
      }))

      expect(report.matchedCount).toBe(1)
      expect(report.exactMatchCount).toBe(0)
      expect(report.diffs).toHaveLength(1)
      expect(report.diffs[0]!.kind).toBe('amount-mismatch')
      expect(report.diffs[0]!.internalAmountCents).toBe(9900)
      expect(report.diffs[0]!.externalAmountCents).toBe(9999)
      expect(report.diffs[0]!.diffCents).toBe(-99)
    })

    it('3. 多种差异并存: missing-internal + missing-external + amount-mismatch', async () => {
      const internal: TransactionInput[] = [
        txn({ id: 't1', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' }),
        txn({ id: 't2', orderNo: 'ORD002', amountCents: 5000, date: '2026-07-11' }) // missing-external
      ]
      const external: BankStatementInput[] = [
        stmt({ id: 's1', orderNo: 'ORD001', amountCents: 9800, date: '2026-07-11' }), // amount-mismatch
        stmt({ id: 's2', orderNo: 'ORD003', amountCents: 3000, date: '2026-07-11' })  // missing-internal
      ]

      const report = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: internal,
        externalTransactions: external
      }))

      expect(report.matchedCount).toBe(1)
      // amount-mismatch (ORD001) + missing-external (ORD002) + missing-internal (ORD003)
      expect(report.diffs.length).toBeGreaterThanOrEqual(3)

      const kinds = report.diffs.map((d) => d.kind).sort()
      expect(kinds).toContain('amount-mismatch')
      expect(kinds).toContain('missing-external')
      expect(kinds).toContain('missing-internal')
    })

    it('4. 空对账: 双方均为空 → 0 matched, 0 diffs', async () => {
      const report = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: [],
        externalTransactions: []
      }))

      expect(report.internalTotal).toBe(0)
      expect(report.externalTotal).toBe(0)
      expect(report.matchedCount).toBe(0)
      expect(report.diffs).toHaveLength(0)
      expect(report.totalDiffCents).toBe(0)
    })

    it('5. combined 匹配键: 按 orderNo + amountCents + date 精确配对', async () => {
      const internal: TransactionInput[] = [
        txn({ id: 't1', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' }),
        txn({ id: 't2', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-12' }) // 不同日期
      ]
      const external: BankStatementInput[] = [
        stmt({ id: 's1', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' })
      ]

      const report = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: internal,
        externalTransactions: external,
        matchKey: 'combined'
      }))

      // combined = ORD001::9900::2026-07-11 → 只匹配到 t1
      expect(report.matchedCount).toBe(1)
      expect(report.exactMatchCount).toBe(1)
      // t2 是 missing-external (不同的 combined key)
      expect(report.diffs.some((d) => d.kind === 'missing-external')).toBe(true)
    })

    it('6. 容差匹配: toleranceCents=1 时, 1分差异视为精确匹配', async () => {
      const internal: TransactionInput[] = [
        txn({ id: 't1', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' })
      ]
      const external: BankStatementInput[] = [
        stmt({ id: 's1', orderNo: 'ORD001', amountCents: 9901, date: '2026-07-11' })
      ]

      const report = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: internal,
        externalTransactions: external,
        toleranceCents: 1
      }))

      // 1分差在容差内 → 不产生 amount-mismatch
      expect(report.matchedCount).toBe(1)
      expect(report.diffs).toHaveLength(0)
    })

    it('7. 标记已处理: markDiffResolved 后 isDiffResolved 返回 true', async () => {
      // 先跑对账产生差异
      const internal: TransactionInput[] = [
        txn({ id: 't1', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' })
      ]
      const external: BankStatementInput[] = [
        stmt({ id: 's1', orderNo: 'ORD001', amountCents: 9999, date: '2026-07-11' })
      ]

      await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: internal,
        externalTransactions: external
      }))

      const diff = service.getDiffs()[0]!
      // diff 没有唯一 key 字段, 用 "kind::orderNo" 构造
      const diffKey = `${diff.kind}::${diff.orderNo}`

      expect(service.isDiffResolved(diffKey)).toBe(false)

      const resolved = service.markDiffResolved(diffKey, {
        resolvedBy: 'admin',
        note: '已核实, 银行侧退款'
      })

      expect(resolved).toBe(true)
      expect(service.isDiffResolved(diffKey)).toBe(true)

      // 重复标记返回 false
      expect(service.markDiffResolved(diffKey)).toBe(false)

      // 检查已处理列表
      const resolvedList = service.getResolvedDiffs()
      expect(resolvedList).toHaveLength(1)
      expect(resolvedList[0]!.resolvedBy).toBe('admin')
      expect(resolvedList[0]!.note).toBe('已核实, 银行侧退款')
    })

    it('8. 报表汇总: 多笔交易后 report 字段正确', async () => {
      const internal: TransactionInput[] = [
        txn({ id: 't1', orderNo: 'ORD001', amountCents: 10000, date: '2026-07-11' }),
        txn({ id: 't2', orderNo: 'ORD002', amountCents: 20000, date: '2026-07-11' }),
        txn({ id: 't3', orderNo: 'ORD003', amountCents: 30000, date: '2026-07-11' })
      ]
      const external: BankStatementInput[] = [
        stmt({ id: 's1', orderNo: 'ORD001', amountCents: 10000, date: '2026-07-11' }),
        // ORD002 金额差
        stmt({ id: 's2', orderNo: 'ORD002', amountCents: 19500, date: '2026-07-11' }),
        // ORD003 缺失
      ]

      const report = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: internal,
        externalTransactions: external
      }))

      expect(report.date).toBe('2026-07-11')
      expect(report.internalTotal).toBe(3)
      expect(report.externalTotal).toBe(2)
      expect(report.matchedCount).toBe(2) // ORD001 + ORD002 matched
      expect(report.exactMatchCount).toBe(1) // ORD001 完全匹配
      // diffs: ORD002 amount-mismatch + ORD003 missing-external
      expect(report.diffs.length).toBeGreaterThanOrEqual(2)
      // totalDiffCents = (10000+20000+30000) - (10000+19500) = 60000 - 29500 = 30500
      expect(report.totalDiffCents).toBe(30500)
      expect(report.generatedAt).toBeTruthy()
      expect(report.durationMs).toBeGreaterThanOrEqual(0)
    })
  })

  // ═════════════════════════════════════════════════════
  // 反例 5
  // ═════════════════════════════════════════════════════

  describe('反例', () => {
    it('9. 无效 ID 标记: 不存在的 diff key → 返回 false', () => {
      expect(service.markDiffResolved('nonexistent-key')).toBe(false)
    })

    it('10. 重复对账: 第二次跑不同数据 → status 更新, 不抛错', async () => {
      const internal: TransactionInput[] = [
        txn({ id: 't1', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' })
      ]
      const external: BankStatementInput[] = [
        stmt({ id: 's1', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' })
      ]

      const r1 = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: internal,
        externalTransactions: external
      }))
      expect(r1.matchedCount).toBe(1)

      // 第二次对账: 不同日期
      const r2 = await service.run(buildOpts({
        date: '2026-07-12',
        internalTransactions: internal,
        externalTransactions: external
      }))
      expect(r2.matchedCount).toBe(1)

      const status = service.getStatus()
      expect(status.totalRuns).toBe(2)
      expect(status.lastRunDate).toBe('2026-07-12')
    })

    it('11. combined 键缺失字段: 内部交易缺 orderNo → 该条无法匹配', async () => {
      const internal: TransactionInput[] = [
        { id: 't1', orderNo: '', amountCents: 9900, date: '2026-07-11' } as TransactionInput
      ]
      const external: BankStatementInput[] = [
        stmt({ id: 's1', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' })
      ]

      const report = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: internal,
        externalTransactions: external,
        matchKey: 'combined'
      }))

      // 内部缺 orderNo → combined key = null → 不被索引
      // 所以外部 ORD001 找不到内部 → missing-internal
      // 内部 t1 也找不到外部 → missing-external
      expect(report.matchedCount).toBe(0)
      expect(report.diffs.length).toBeGreaterThanOrEqual(2)
    })

    it('12. 负金额交易: 负值差额在汇总中正确体现', async () => {
      const internal: TransactionInput[] = [
        txn({ id: 't1', orderNo: 'ORD001', amountCents: -5000, date: '2026-07-11' }) // 退款
      ]
      const external: BankStatementInput[] = [
        stmt({ id: 's1', orderNo: 'ORD001', amountCents: -5000, date: '2026-07-11' })
      ]

      const report = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: internal,
        externalTransactions: external
      }))

      // 完全匹配 (负金额匹配)
      expect(report.matchedCount).toBe(1)
      expect(report.exactMatchCount).toBe(1)
      expect(report.totalDiffCents).toBe(0)
    })

    it('13. 完全不匹配: 内部/外部无交集 → matched=0, diffs 包含全部', async () => {
      const internal: TransactionInput[] = [
        txn({ id: 't1', orderNo: 'ORD001', amountCents: 1000, date: '2026-07-11' }),
        txn({ id: 't2', orderNo: 'ORD002', amountCents: 2000, date: '2026-07-11' })
      ]
      const external: BankStatementInput[] = [
        stmt({ id: 's1', orderNo: 'ORD003', amountCents: 3000, date: '2026-07-11' }),
        stmt({ id: 's2', orderNo: 'ORD004', amountCents: 4000, date: '2026-07-11' })
      ]

      const report = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: internal,
        externalTransactions: external
      }))

      expect(report.matchedCount).toBe(0)
      expect(report.diffs.length).toBe(4) // 2 missing-external + 2 missing-internal
      expect(report.exactMatchCount).toBe(0)
    })
  })

  // ═════════════════════════════════════════════════════
  // 边界 2
  // ═════════════════════════════════════════════════════

  describe('边界', () => {
    it('14. 超大金额: 10 亿分 (1000 万) 对账正常', async () => {
      const bigAmount = 1_000_000_000 // 10 亿分 = 1000 万元
      const internal: TransactionInput[] = [
        txn({ id: 't1', orderNo: 'ORD001', amountCents: bigAmount, date: '2026-07-11' })
      ]
      const external: BankStatementInput[] = [
        stmt({ id: 's1', orderNo: 'ORD001', amountCents: bigAmount, date: '2026-07-11' })
      ]

      const report = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: internal,
        externalTransactions: external
      }))

      expect(report.matchedCount).toBe(1)
      expect(report.exactMatchCount).toBe(1)
      expect(report.totalDiffCents).toBe(0)
      expect(report.internalTotalCents).toBe(bigAmount)
      expect(report.externalTotalCents).toBe(bigAmount)
    })

    it('15. 0 笔交易对账: 双方 0 条 → 空报告, 不抛错', async () => {
      const report = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: [],
        externalTransactions: []
      }))

      expect(report.internalTotal).toBe(0)
      expect(report.externalTotal).toBe(0)
      expect(report.matchedCount).toBe(0)
      expect(report.exactMatchCount).toBe(0)
      expect(report.diffs).toHaveLength(0)
      expect(report.totalDiffCents).toBe(0)
      expect(report.date).toBe('2026-07-11')
    })
  })

  // ═════════════════════════════════════════════════════
  // 补充: 重复交易检测
  // ═════════════════════════════════════════════════════

  describe('重复检测', () => {
    it('16. 内部重复订单: 相同 orderNo 多条内部记录 → duplicate 差异', async () => {
      const internal: TransactionInput[] = [
        txn({ id: 't1', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' }),
        txn({ id: 't2', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' }) // 重复
      ]
      const external: BankStatementInput[] = [
        stmt({ id: 's1', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' })
      ]

      const report = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: internal,
        externalTransactions: external
      }))

      // 匹配 1 条 (第一条), 但产生 duplicate
      expect(report.matchedCount).toBe(1)
      expect(report.diffs.some((d) => d.kind === 'duplicate')).toBe(true)
      const dup = report.diffs.find((d) => d.kind === 'duplicate')
      expect(dup?.orderNo).toBe('ORD001')
      expect(dup?.duplicateIds).toContain('t2')
    })

    it('17. 外部重复流水: 相同 orderNo 多条外部 → duplicate 差异', async () => {
      const internal: TransactionInput[] = [
        txn({ id: 't1', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' })
      ]
      const external: BankStatementInput[] = [
        stmt({ id: 's1', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' }),
        stmt({ id: 's2', orderNo: 'ORD001', amountCents: 9900, date: '2026-07-11' }) // 重复
      ]

      const report = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: internal,
        externalTransactions: external
      }))

      // 第一条匹配成功; 第二条也是相同 orderNo → matchedCount=2 (一条真匹配,一条重复)
      // 但应该产生 duplicate 差异
      const dup = report.diffs.find((d) => d.kind === 'duplicate')
      expect(dup).toBeDefined()
      expect(dup?.orderNo).toBe('ORD001')
    })
  })

  // ═════════════════════════════════════════════════════
  // 补充: 渠道过滤
  // ═════════════════════════════════════════════════════

  describe('渠道过滤', () => {
    it('18. 指定 channel 只匹配该渠道的交易', async () => {
      const internal: TransactionInput[] = [
        txn({ id: 't1', orderNo: 'ORD001', amountCents: 1000, date: '2026-07-11', channel: 'WECHAT' }),
        txn({ id: 't2', orderNo: 'ORD002', amountCents: 2000, date: '2026-07-11', channel: 'ALIPAY' })
      ]
      const external: BankStatementInput[] = [
        stmt({ id: 's1', orderNo: 'ORD001', amountCents: 1000, date: '2026-07-11', channel: 'WECHAT' }),
        stmt({ id: 's2', orderNo: 'ORD002', amountCents: 2000, date: '2026-07-11', channel: 'ALIPAY' })
      ]

      const report = await service.run(buildOpts({
        date: '2026-07-11',
        internalTransactions: internal,
        externalTransactions: external,
        channel: 'WECHAT'
      }))

      expect(report.internalTotal).toBe(1) // 只统计 WECHAT
      expect(report.externalTotal).toBe(1)
      expect(report.matchedCount).toBe(1)
      expect(report.totalDiffCents).toBe(0)
    })
  })
})
