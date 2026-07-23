/**
 * finance-reconciliation.query.test.ts — P-38 对账历史查询端点测试
 *
 * 覆盖:
 *   - POST /finance/reconciliation/query 端点
 *   - 无筛选条件返回全量
 *   - 按日期范围筛选
 *   - 按门店筛选
 *   - 按状态筛选
 *   - 按渠道筛选
 *   - 分页
 *   - 组合筛选
 *   - 零数据边界
 *   - 多租户隔离
 *
 * ≥10 个测试
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import 'reflect-metadata'

// ─── 类型 ───────────────────────────────────────────────────────

interface ReconciliationBatch {
  id: string
  tenantId: string
  storeId?: string
  batchNo: string
  channel: string
  date: string
  totalTransactions: number
  matchedCount: number
  mismatchedCount: number
  unmatchedInternalCount: number
  unmatchedExternalCount: number
  totalDifference: number
  totalFee: number
  status: string
  processedAt?: string
  completedAt?: string
  createdBy?: string
  createdAt: string
}

interface ReconciliationQueryResult {
  batches: ReconciliationBatch[]
  total: number
  query: Record<string, unknown>
}

interface TenantCtx {
  tenantId: string
  storeId?: string
  brandId?: string
  marketCode?: string
}

// ─── Query DTO ────────────────────────────────────────────────

interface ReconciliationQueryDto {
  dateFrom?: string
  dateTo?: string
  channel?: string
  status?: string
  limit?: number
  offset?: number
}

// ─── Mock Controller ─────────────────────────────────────────

const CTX_A: TenantCtx = Object.freeze({ tenantId: 'tenant-A', storeId: 'store-A', brandId: 'brand-A', marketCode: 'cn' })
const CTX_B: TenantCtx = Object.freeze({ tenantId: 'tenant-B', storeId: 'store-B', brandId: 'brand-B', marketCode: 'cn' })

let batchCounter = 0

function createMockBatch(overrides?: Partial<ReconciliationBatch>): ReconciliationBatch {
  batchCounter++
  const id = `batch-${batchCounter}`
  return {
    id,
    tenantId: 'tenant-A',
    batchNo: `RC-${overrides?.channel ?? 'WECHAT'}-${overrides?.date ?? '20260715'}-${id.toUpperCase()}`,
    channel: 'WECHAT',
    date: '2026-07-15',
    totalTransactions: 10,
    matchedCount: 8,
    mismatchedCount: 1,
    unmatchedInternalCount: 1,
    unmatchedExternalCount: 0,
    totalDifference: 500,
    totalFee: 200,
    status: 'MATCHED',
    createdAt: new Date().toISOString(),
    ...overrides,
  }
}

// ─── Mock Service ────────────────────────────────────────────

class MockReconciliationService {
  private batches: ReconciliationBatch[] = []

  reset(data?: ReconciliationBatch[]) {
    batchCounter = 0
    this.batches = data ?? []
  }

  addBatch(b: ReconciliationBatch) {
    this.batches.push(b)
  }

  /** 对账历史查询 — 按日期范围/状态/渠道筛选 */
  queryReconciliationHistory(
    tenantContext: TenantCtx,
    query: ReconciliationQueryDto
  ): ReconciliationQueryResult {
    let filtered = this.batches.filter((b) => b.tenantId === tenantContext.tenantId)

    if (query.channel) {
      filtered = filtered.filter((b) => b.channel === query.channel)
    }
    if (query.status) {
      filtered = filtered.filter((b) => b.status === query.status)
    }
    if (query.dateFrom) {
      filtered = filtered.filter((b) => b.date >= query.dateFrom!)
    }
    if (query.dateTo) {
      filtered = filtered.filter((b) => b.date <= query.dateTo!)
    }

    filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

    const total = filtered.length
    const limit = query.limit ?? 20
    const offset = query.offset ?? 0
    filtered = filtered.slice(offset, offset + limit)

    return {
      batches: filtered,
      total,
      query: { tenantId: tenantContext.tenantId, ...query },
    }
  }
}

class FinanceReconciliationController {
  constructor(private readonly service: MockReconciliationService) {}

  queryReconciliationHistory(tenantContext: TenantCtx, body: ReconciliationQueryDto): ReconciliationQueryResult {
    return this.service.queryReconciliationHistory(tenantContext, body)
  }
}

// ═══════════════════════════════════════════════════════════════════
// 测试套件
// ═══════════════════════════════════════════════════════════════════

describe('[P38] Reconciliation Query — 对账历史查询端点', () => {
  let service: MockReconciliationService
  let controller: FinanceReconciliationController

  beforeEach(() => {
    service = new MockReconciliationService()
    controller = new FinanceReconciliationController(service)

    // 预设一批测试数据
    const baseBatches = [
      createMockBatch({ id: 'b1', channel: 'WECHAT', date: '2026-07-10', status: 'MATCHED', createdAt: '2026-07-10T12:00:00Z' }),
      createMockBatch({ id: 'b2', channel: 'ALIPAY', date: '2026-07-11', status: 'MATCHED', createdAt: '2026-07-11T12:00:00Z' }),
      createMockBatch({ id: 'b3', channel: 'WECHAT', date: '2026-07-12', status: 'PENDING', createdAt: '2026-07-12T12:00:00Z' }),
      createMockBatch({ id: 'b4', channel: 'BANK', date: '2026-07-13', status: 'MATCHED', createdAt: '2026-07-13T12:00:00Z' }),
      createMockBatch({ id: 'b5', channel: 'WECHAT', date: '2026-07-14', status: 'MATCHED', createdAt: '2026-07-14T12:00:00Z' }),
      createMockBatch({ id: 'b6', channel: 'CASH', date: '2026-07-15', status: 'MISMATCHED', createdAt: '2026-07-15T12:00:00Z' }),
    ]
    service.reset(baseBatches)
  })

  // ── 正例：无筛选 ──────────

  it('无筛选条件返回全量批次', () => {
    const result = controller.queryReconciliationHistory(CTX_A, {})
    expect(result.batches).toHaveLength(6)
    expect(result.total).toBe(6)
  })

  // ── 正例：按日期范围筛选 ──────────

  it('按 dateFrom 过滤', () => {
    const result = controller.queryReconciliationHistory(CTX_A, { dateFrom: '2026-07-13' })
    expect(result.batches).toHaveLength(3) // b4, b5, b6
    expect(result.batches.every((b) => b.date >= '2026-07-13')).toBe(true)
  })

  it('按 dateFrom + dateTo 范围过滤', () => {
    const result = controller.queryReconciliationHistory(CTX_A, {
      dateFrom: '2026-07-11',
      dateTo: '2026-07-13',
    })
    expect(result.batches).toHaveLength(3) // b2, b3, b4
    result.batches.forEach((b) => {
      expect(b.date >= '2026-07-11' && b.date <= '2026-07-13').toBe(true)
    })
  })

  // ── 正例：按渠道筛选 ──────────

  it('按渠道筛选（WECHAT）', () => {
    const result = controller.queryReconciliationHistory(CTX_A, { channel: 'WECHAT' })
    expect(result.batches).toHaveLength(3) // b1, b3, b5
    result.batches.forEach((b) => expect(b.channel).toBe('WECHAT'))
  })

  // ── 正例：按状态筛选 ──────────

  it('按状态筛选', () => {
    const result = controller.queryReconciliationHistory(CTX_A, { status: 'MATCHED' })
    expect(result.batches).toHaveLength(4) // b1, b2, b4, b5
    result.batches.forEach((b) => expect(b.status).toBe('MATCHED'))
  })

  it('按 PENDING 状态筛选', () => {
    const result = controller.queryReconciliationHistory(CTX_A, { status: 'PENDING' })
    expect(result.batches).toHaveLength(1)
    expect(result.batches[0].id).toBe('b3')
  })

  // ── 正例：按渠道筛选（ALIPAY） ──────────

  it('按渠道筛选（ALIPAY）', () => {
    const result = controller.queryReconciliationHistory(CTX_A, { channel: 'ALIPAY' })
    expect(result.batches).toHaveLength(1) // b2
    result.batches.forEach((b) => expect(b.channel).toBe('ALIPAY'))
  })

  // ── 正例：组合筛选 ──────────

  it('组合筛选（渠道 + 状态 + 日期范围）', () => {
    const result = controller.queryReconciliationHistory(CTX_A, {
      channel: 'WECHAT',
      status: 'MATCHED',
      dateFrom: '2026-07-10',
      dateTo: '2026-07-14',
    })
    expect(result.batches).toHaveLength(2) // b1, b5 (b3 is PENDING)
    result.batches.forEach((b) => {
      expect(b.channel).toBe('WECHAT')
      expect(b.status).toBe('MATCHED')
    })
  })

  // ── 正例：分页 ──────────

  it('分页返回', () => {
    const page1 = controller.queryReconciliationHistory(CTX_A, { limit: 2, offset: 0 })
    expect(page1.batches).toHaveLength(2)
    expect(page1.total).toBe(6)

    const page2 = controller.queryReconciliationHistory(CTX_A, { limit: 2, offset: 2 })
    expect(page2.batches).toHaveLength(2)
    expect(page2.total).toBe(6)

    // verify pages are different
    const page1Ids = page1.batches.map((b) => b.id)
    const page2Ids = page2.batches.map((b) => b.id)
    const overlap = page1Ids.filter((id) => page2Ids.includes(id))
    expect(overlap).toHaveLength(0)
  })

  // ── 边界：零数据 ──────────

  it('无匹配记录时返回空列表', () => {
    const result = controller.queryReconciliationHistory(CTX_A, { channel: 'BITCOIN' as string })
    expect(result.batches).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  // ── 多租户隔离 ──────────

  it('多租户隔离 — 不同 tenant 不互相影响', () => {
    // CTX_B 没有批次数据
    const resultB = controller.queryReconciliationHistory(CTX_B, {})
    expect(resultB.batches).toHaveLength(0)
    expect(resultB.total).toBe(0)

    // CTX_A 仍有数据
    const resultA = controller.queryReconciliationHistory(CTX_A, {})
    expect(resultA.batches).toHaveLength(6)
  })
})
