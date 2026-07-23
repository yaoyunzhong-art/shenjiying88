import { describe, it, expect, beforeEach } from 'vitest'
/**
 * 🐜 自动: [finance-archival.service] 核算归档服务测试
 *
 * 覆盖 FinanceArchivalService:
 *   - archive: 正例归档 / 结算未确认 / 失败标记
 *   - getArchival: 单条查询 / 不存在/跨租户
 *   - listArchivals: 列表查询 / 过滤 / 空数据
 *   - getVersionHistory: 版本历史 / 空
 *   - markFailed: 标记失败状态
 *   - 边界: 空周期 / 大金额 / 并发归档
 *
 * 约定:
 *   - 不依赖真实 Prisma/DB
 *   - 使用 FinanceService 的 in-memory store
 */

import 'reflect-metadata'
import { ConflictException, NotFoundException } from '@nestjs/common'
import { FinanceService, resetFinanceServiceTestState } from './finance.service'
import {
  FinanceArchivalService,
  resetFinanceArchivalTestState,
} from './finance-archival.service'
import {
  LedgerType,
  SettlementStatus,
  AccountStatus,
  ArchivalStatus,
  type FinanceArchival,
} from './finance.entity'

const CTX_A = { tenantId: 'tenant-A', brandId: 'brand-A', storeId: 'store-A', marketCode: 'cn' }
const CTX_B = { tenantId: 'tenant-B', brandId: 'brand-B', storeId: 'store-B', marketCode: 'cn' }

function makeServices() {
  resetFinanceServiceTestState()
  resetFinanceArchivalTestState()
  const financeService = new FinanceService()
  const archivalService = new FinanceArchivalService(financeService as any)
  return { financeService, archivalService }
}

/**
 * 辅助: 创建一条 Revenue ledger 并结算确认
 */
async function seedConfirmedSettlement(
  finance: FinanceService,
  ctx: typeof CTX_A,
  overrides?: { revenueAmount?: number; expenseAmount?: number },
): Promise<{ settlementId: string; periodStart: string; periodEnd: string }> {
  const { revenueAmount = 5000, expenseAmount = 1000 } = overrides ?? {}
  const periodStart = '2026-06-01T00:00:00Z'
  const periodEnd = '2026-06-30T23:59:59Z'

  await finance.recordLedger(ctx, {
    type: LedgerType.Revenue,
    amount: revenueAmount,
    recordedAt: periodStart,
    description: 'period revenue',
  })
  await finance.recordLedger(ctx, {
    type: LedgerType.Expense,
    amount: expenseAmount,
    recordedAt: periodStart,
    description: 'period expense',
  })

  await finance.createAccount(ctx, {
    type: 'ACTIVE' as any,
    name: 'Main Checking',
  })
  const settlement = await finance.createSettlement(ctx, {
    storeId: ctx.storeId,
    startDate: periodStart,
    endDate: periodEnd,
  })
  const confirmed = await finance.confirmSettlementResolved(settlement.id, ctx)
  return { settlementId: confirmed.id, periodStart, periodEnd }
}

// ══════════════════════════════════════════════════════════════════════════════
// archive
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-archival] archive — 正例', () => {
  it('归档已确认结算的周期返回完整快照', async () => {
    const { financeService, archivalService } = makeServices()
    const { settlementId, periodStart, periodEnd } =
      await seedConfirmedSettlement(financeService, CTX_A)

    const result = await archivalService.archive(CTX_A, {
      settlementId,
      periodStart,
      periodEnd,
      storeId: 'store-A',
    })

    expect(result.id).toBeDefined()
    expect(result.tenantId).toBe('tenant-A')
    expect(result.version).toBe(1)
    expect(result.status).toBe(ArchivalStatus.Archived)
    expect(result.settlementId).toBe(settlementId)
    expect(result.snapshot.totalRevenue).toBe(5000)
    expect(result.snapshot.totalExpense).toBe(1000)
    expect(result.snapshot.netRevenue).toBe(4000)
    expect(result.snapshot.ledgerCount).toBe(2)
  })

  it('归档包含正确的时间范围和类型', async () => {
    const { financeService, archivalService } = makeServices()
    const { settlementId, periodStart, periodEnd } =
      await seedConfirmedSettlement(financeService, CTX_A)

    const result = await archivalService.archive(CTX_A, {
      settlementId,
      periodStart,
      periodEnd,
      type: 'MONTHLY',
    })

    expect(result.periodStart).toBe(periodStart)
    expect(result.periodEnd).toBe(periodEnd)
    expect(result.type).toBe('MONTHLY')
    expect(result.archivedAt).toBeDefined()
  })

  it('同一 settlement 再次归档 version 递增', async () => {
    const { financeService, archivalService } = makeServices()
    const { settlementId, periodStart, periodEnd } =
      await seedConfirmedSettlement(financeService, CTX_A)

    const v1 = await archivalService.archive(CTX_A, {
      settlementId,
      periodStart,
      periodEnd,
    })
    expect(v1.version).toBe(1)

    // 再产生一些收入，重新归档
    await financeService.recordLedger(CTX_A, {
      type: LedgerType.Revenue,
      amount: 2000,
      recordedAt: periodStart,
      description: 'additional revenue',
    })

    const v2 = await archivalService.archive(CTX_A, {
      settlementId,
      periodStart,
      periodEnd,
    })
    expect(v2.version).toBe(2)
    expect(v2.snapshot.totalRevenue).toBeGreaterThan(v1.snapshot.totalRevenue)
  })

  it('跨租户归档隔离', async () => {
    const { financeService, archivalService } = makeServices()
    const sA = await seedConfirmedSettlement(financeService, CTX_A)
    await seedConfirmedSettlement(financeService, CTX_B)

    const resultA = await archivalService.archive(CTX_A, {
      settlementId: sA.settlementId,
      periodStart: sA.periodStart,
      periodEnd: sA.periodEnd,
    })
    // CTX_B needs its own settled data
    const sB = await seedConfirmedSettlement(financeService, CTX_B)
    const resultB = await archivalService.archive(CTX_B, {
      settlementId: sB.settlementId,
      periodStart: sB.periodStart,
      periodEnd: sB.periodEnd,
    })

    expect(resultA.tenantId).toBe('tenant-A')
    expect(resultB.tenantId).toBe('tenant-B')

    const listA = archivalService.listArchivals(CTX_A)
    const listB = archivalService.listArchivals(CTX_B)
    expect(listA.length).toBe(1)
    expect(listB.length).toBe(1)
  })

  it('空周期(无 ledger)仍可归档快照', async () => {
    const { financeService, archivalService } = makeServices()
    const { settlementId } = await seedConfirmedSettlement(financeService, CTX_A)

    // 使用没有 ledger 的周期
    const result = await archivalService.archive(CTX_A, {
      settlementId,
      periodStart: '2026-07-01',
      periodEnd: '2026-07-31',
    })

    expect(result.snapshot.totalRevenue).toBe(0)
    expect(result.snapshot.ledgerCount).toBe(0)
  })
})

describe('[finance-archival] archive — 反例与边界', () => {
  it('结算未确认时拒绝归档', async () => {
    const { financeService, archivalService } = makeServices()
    await financeService.recordLedger(CTX_A, {
      type: LedgerType.Revenue,
      amount: 1000,
      description: 'test',
    })
    const acct = await financeService.createAccount(CTX_A, {
      type: 'ACTIVE' as any,
      name: 'Main',
    })
    const settlement = await financeService.createSettlement(CTX_A, {
      storeId: CTX_A.storeId,
      startDate: '2026-06-01',
      endDate: '2026-06-30',
    })

    await expect(
      archivalService.archive(CTX_A, {
        settlementId: settlement.id,
        periodStart: '2026-06-01',
        periodEnd: '2026-06-30',
      }),
    ).rejects.toThrow(ConflictException)
  })

  it('不存在的 settlementId 拒绝归档', async () => {
    const { archivalService } = makeServices()
    await expect(
      archivalService.archive(CTX_A, {
        settlementId: 'nonexistent-settlement',
        periodStart: '2026-06-01',
        periodEnd: '2026-06-30',
      }),
    ).rejects.toThrow()
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// getArchival
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-archival] getArchival', () => {
  it('通过 ID 获取归档快照', async () => {
    const { financeService, archivalService } = makeServices()
    const s = await seedConfirmedSettlement(financeService, CTX_A)
    const created = await archivalService.archive(CTX_A, {
      settlementId: s.settlementId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
    })

    const fetched = archivalService.getArchival(created.id, CTX_A)
    expect(fetched.id).toBe(created.id)
    expect(fetched.tenantId).toBe('tenant-A')
  })

  it('不存在的 ID 抛出 NotFoundException', () => {
    const { archivalService } = makeServices()
    expect(() => archivalService.getArchival('not-exists', CTX_A)).toThrow(NotFoundException)
  })

  it('跨租户无法获取', async () => {
    const { financeService, archivalService } = makeServices()
    const s = await seedConfirmedSettlement(financeService, CTX_A)
    const created = await archivalService.archive(CTX_A, {
      settlementId: s.settlementId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
    })

    expect(() => archivalService.getArchival(created.id, CTX_B)).toThrow(NotFoundException)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// listArchivals
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-archival] listArchivals', () => {
  it('按租户列出归档', async () => {
    const { financeService, archivalService } = makeServices()
    const s = await seedConfirmedSettlement(financeService, CTX_A)
    await archivalService.archive(CTX_A, {
      settlementId: s.settlementId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
    })
    await archivalService.archive(CTX_A, {
      settlementId: s.settlementId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
    })

    const list = archivalService.listArchivals(CTX_A)
    expect(list.length).toBeGreaterThanOrEqual(2)
    list.forEach((a) => expect(a.tenantId).toBe('tenant-A'))
  })

  it('按状态可筛选', async () => {
    const { financeService, archivalService } = makeServices()
    const s = await seedConfirmedSettlement(financeService, CTX_A)
    await archivalService.archive(CTX_A, {
      settlementId: s.settlementId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
    })

    const archived = archivalService.listArchivals(CTX_A, { status: ArchivalStatus.Archived })
    const failed = archivalService.listArchivals(CTX_A, { status: ArchivalStatus.Failed })
    expect(archived.length).toBeGreaterThanOrEqual(1)
    expect(failed.length).toBe(0)
  })

  it('按 settlementId 筛选', async () => {
    const { financeService, archivalService } = makeServices()
    const s = await seedConfirmedSettlement(financeService, CTX_A)
    await archivalService.archive(CTX_A, {
      settlementId: s.settlementId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
    })
    await archivalService.archive(CTX_A, {
      settlementId: s.settlementId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
    })

    const bySettlement = archivalService.listArchivals(CTX_A, {
      settlementId: s.settlementId,
    })
    expect(bySettlement.length).toBeGreaterThanOrEqual(2)
  })

  it('空租户返回空数组', () => {
    const { archivalService } = makeServices()
    const result = archivalService.listArchivals(CTX_B)
    expect(result).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// getVersionHistory
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-archival] getVersionHistory', () => {
  it('返回同一 settlement 的所有版本', async () => {
    const { financeService, archivalService } = makeServices()
    const s = await seedConfirmedSettlement(financeService, CTX_A)

    await archivalService.archive(CTX_A, {
      settlementId: s.settlementId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
    })
    await archivalService.archive(CTX_A, {
      settlementId: s.settlementId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
    })

    const versions = archivalService.getVersionHistory(s.settlementId, CTX_A)
    expect(versions.length).toBe(2)
    expect(versions[0].version).toBeGreaterThan(versions[1].version)
  })

  it('不存在的 settlement 返回空数组', () => {
    const { archivalService } = makeServices()
    const versions = archivalService.getVersionHistory('not-exists', CTX_A)
    expect(versions).toEqual([])
  })

  it('跨租户不返回', async () => {
    const { financeService, archivalService } = makeServices()
    const s = await seedConfirmedSettlement(financeService, CTX_A)
    await archivalService.archive(CTX_A, {
      settlementId: s.settlementId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
    })

    const versions = archivalService.getVersionHistory(s.settlementId, CTX_B)
    expect(versions).toEqual([])
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// markFailed
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-archival] markFailed', () => {
  it('标记归档失败后状态和错误信息正确', async () => {
    const { financeService, archivalService } = makeServices()
    const s = await seedConfirmedSettlement(financeService, CTX_A)
    const created = await archivalService.archive(CTX_A, {
      settlementId: s.settlementId,
      periodStart: s.periodStart,
      periodEnd: s.periodEnd,
    })

    const failed = archivalService.markFailed(
      created.id,
      CTX_A,
      'External API timeout',
    )
    expect(failed.status).toBe(ArchivalStatus.Failed)
    expect(failed.errorMessage).toBe('External API timeout')
  })

  it('标记不存在的归档抛出 NotFoundException', () => {
    const { archivalService } = makeServices()
    expect(() =>
      archivalService.markFailed('not-exists', CTX_A, 'error'),
    ).toThrow(NotFoundException)
  })
})

// ══════════════════════════════════════════════════════════════════════════════
// 边界
// ══════════════════════════════════════════════════════════════════════════════

describe('[finance-archival] 边界场景', () => {
  it('大额交易的归档快照金额正确', async () => {
    const { financeService, archivalService } = makeServices()
    const { settlementId, periodStart, periodEnd } =
      await seedConfirmedSettlement(financeService, CTX_A, {
        revenueAmount: 99999999,
        expenseAmount: 1,
      })

    const result = await archivalService.archive(CTX_A, {
      settlementId,
      periodStart,
      periodEnd,
    })
    expect(result.snapshot.totalRevenue).toBe(99999999)
    expect(result.snapshot.netRevenue).toBe(99999998)
  })

  it('归档快照收支分类统计正确', async () => {
    const { financeService, archivalService } = makeServices()
    await financeService.recordLedger(CTX_A, {
      type: LedgerType.Revenue,
      amount: 100,
      description: 'a',
    })
    await financeService.recordLedger(CTX_A, {
      type: LedgerType.Revenue,
      amount: 200,
      description: 'b',
    })
    await financeService.recordLedger(CTX_A, {
      type: LedgerType.Expense,
      amount: 50,
      description: 'c',
    })
    await financeService.recordLedger(CTX_A, {
      type: LedgerType.Refund,
      amount: 20,
      description: 'd',
    })
    await financeService.recordLedger(CTX_A, {
      type: LedgerType.Adjustment,
      amount: 10,
      description: 'e',
    })

    const acct = await financeService.createAccount(CTX_A, {
      type: 'ACTIVE' as any,
      name: 'Main',
    })
    const settlement = await financeService.createSettlement(CTX_A, {
      storeId: CTX_A.storeId,
      startDate: '2026-01-01',
      endDate: '2026-12-31',
    })
    const confirmed = await financeService.confirmSettlementResolved(settlement.id, CTX_A)

    const result = await archivalService.archive(CTX_A, {
      settlementId: confirmed.id,
      periodStart: '2026-01-01T00:00:00Z',
      periodEnd: '2026-12-31T23:59:59Z',
    })

    // revenue(100+200) = 300, expense=50, refund=20, adjustment=10
    // net: 300 + 10 - 50 - 20 = 240
    expect(result.snapshot.totalRevenue).toBe(300)
    expect(result.snapshot.totalExpense).toBe(50)
    expect(result.snapshot.totalRefund).toBe(20)
    expect(result.snapshot.netRevenue).toBe(240)
    expect(result.snapshot.revenueLedgerCount).toBe(2)
    expect(result.snapshot.expenseLedgerCount).toBe(1)
  })

  it('listArchivals 按 limit 限制结果数', async () => {
    const { financeService, archivalService } = makeServices()
    const s = await seedConfirmedSettlement(financeService, CTX_A)

    for (let i = 0; i < 5; i++) {
      await archivalService.archive(CTX_A, {
        settlementId: s.settlementId,
        periodStart: s.periodStart,
        periodEnd: s.periodEnd,
      })
    }

    const limited = archivalService.listArchivals(CTX_A, { limit: 3 })
    expect(limited.length).toBe(3)
  })
})
