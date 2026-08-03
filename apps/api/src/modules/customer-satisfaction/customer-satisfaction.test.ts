/**
 * 客户满意度 (customer-satisfaction) 模块测试
 *
 * 原则:
 * - vitest (globals) + node:assert/strict
 * - 正例 + 反例 + 边界（三件套）
 * - beforeEach 重置，test 自包含
 * - 禁止: any / describe.skip / it.only
 * - 无顺序队列 mock, 仅 URL-pattern responseRegistry (本模块无外部 fetch)
 */

import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { CustomerSatisfactionService } from './customer-satisfaction.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import {
  SatisfactionCategory,
  SatisfactionCategoryLabels,
} from './customer-satisfaction.entity'
import type { CreateSatisfactionDto } from './customer-satisfaction.dto'

/* ── Helpers ─────────────────────────────────────────────── */

const defaultTenant: RequestTenantContext = { tenantId: 'default' }
const otherTenant: RequestTenantContext = { tenantId: 'other-tenant' }

/**
 * Build a minimal CreateSatisfactionDto with defaults for convenience.
 */
function makeDto(overrides: Partial<CreateSatisfactionDto> = {}): CreateSatisfactionDto {
  return {
    storeId: 'store-test',
    customerName: '测试用户',
    score: 4,
    category: SatisfactionCategory.Service,
    comment: '测试评价内容',
    visitDate: '2026-07-18',
    ...overrides,
  }
}

/**
 * Service 每次 new 都会 seed 数据到共享的 Map。
 * 为隔离测试，我们通过创建后再测。
 */

/* ── describe: 模块结构 ──────────────────────────────────── */

describe('CustomerSatisfactionService', () => {
  let service: CustomerSatisfactionService

  beforeEach(() => {
    // 每次 new 一个实例, 但 seedMockData 只执行一次 (satisfactionStore.size > 0 判断)
    service = new CustomerSatisfactionService()
  })

  /* ── 1. list() - 正例 ────────────────────────────────── */

  it('list() returns all records for the default tenant', () => {
    const result = service.list(defaultTenant)
    assert.ok(Array.isArray(result.items))
    assert.equal(typeof result.total, 'number')
    assert.ok(result.total > 0, 'should have seed data')
    // Verify items are sorted by visitDate descending
    for (let i = 1; i < result.items.length; i++) {
      assert.ok(
        result.items[i - 1].visitDate >= result.items[i].visitDate,
        'items should be sorted by visitDate descending',
      )
    }
  })

  it('list() returns empty array for unknown tenant', () => {
    const result = service.list(otherTenant)
    assert.equal(result.total, 0)
    assert.deepEqual(result.items, [])
  })

  /* ── 2. list() - filter by storeId ─────────────────── */

  it('list() filters by storeId', () => {
    const result = service.list(defaultTenant, { storeId: 'store-001' })
    assert.ok(result.total > 0)
    for (const item of result.items) {
      assert.equal(item.storeId, 'store-001')
    }
  })

  it('list() returns empty when storeId matches no records', () => {
    const result = service.list(defaultTenant, { storeId: 'store-999' })
    assert.equal(result.total, 0)
    assert.deepEqual(result.items, [])
  })

  /* ── 3. list() - filter by category ────────────────── */

  it('list() filters by category', () => {
    const result = service.list(defaultTenant, { category: SatisfactionCategory.Service })
    assert.ok(result.total > 0)
    for (const item of result.items) {
      assert.equal(item.category, SatisfactionCategory.Service)
    }
  })

  it('list() returns empty for category with no records', () => {
    // 理论上所有 category 都有数据，但可以构造不存在的枚举值
    // 由于 TypeScript 枚举的运行时值是字符串，这里用不存在的方式不可行
    // 但如果有新 category 无数据，也会返回空
    // 实际测试：用已有 category 但肯定的不存在.
    // 更合理: 换个 tenant 测
    const result = service.list(otherTenant, { category: SatisfactionCategory.Service })
    assert.equal(result.total, 0)
  })

  /* ── 4. list() - filter by date range ──────────────── */

  it('list() filters by startDate', () => {
    const result = service.list(defaultTenant, { startDate: '2026-07-13' })
    for (const item of result.items) {
      assert.ok(item.visitDate >= '2026-07-13', `item.visitDate=${item.visitDate} should be >= 2026-07-13`)
    }
  })

  it('list() filters by endDate', () => {
    const result = service.list(defaultTenant, { endDate: '2026-07-10' })
    for (const item of result.items) {
      assert.ok(item.visitDate <= '2026-07-10', `item.visitDate=${item.visitDate} should be <= 2026-07-10`)
    }
  })

  it('list() filters by both startDate and endDate', () => {
    const result = service.list(defaultTenant, {
      startDate: '2026-07-11',
      endDate: '2026-07-13',
    })
    assert.ok(result.total > 0)
    for (const item of result.items) {
      assert.ok(item.visitDate >= '2026-07-11', `visitDate=${item.visitDate} >= 2026-07-11`)
      assert.ok(item.visitDate <= '2026-07-13', `visitDate=${item.visitDate} <= 2026-07-13`)
    }
  })

  it('list() returns empty for date range with no matches', () => {
    const result = service.list(defaultTenant, {
      startDate: '2099-01-01',
    })
    assert.equal(result.total, 0)
  })

  /* ── 5. list() - filter by minScore ────────────────── */

  it('list() filters by minScore', () => {
    const result = service.list(defaultTenant, { minScore: 4 })
    assert.ok(result.total > 0)
    for (const item of result.items) {
      assert.ok(item.score >= 4, `item.score=${item.score} should be >= 4`)
    }
  })

  it('list() returns empty when minScore is too high', () => {
    const result = service.list(defaultTenant, { minScore: 10 })
    assert.equal(result.total, 0)
  })

  /* ── 6. list() - combined filters ──────────────────── */

  it('list() combines multiple filters correctly', () => {
    const result = service.list(defaultTenant, {
      storeId: 'store-002',
      category: SatisfactionCategory.Service,
      minScore: 2,
    })
    // store-002 的 Service 类别: 赵雪 score=2 (id=sat-006)
    assert.equal(result.total, 1)
    assert.equal(result.items[0].id, 'sat-006')
  })

  /* ── 7. list() - with empty query ──────────────────── */

  it('list() with undefined/empty query returns all tenant records', () => {
    const all = service.list(defaultTenant)
    const also = service.list(defaultTenant, undefined)
    const alsoEmpty = service.list(defaultTenant, {})
    assert.equal(also.total, all.total)
    assert.equal(alsoEmpty.total, all.total)
  })

  /* ── 8. getById() - 正例 ────────────────────────────── */

  it('getById() returns the correct record', () => {
    const record = service.getById('sat-001', defaultTenant)
    assert.equal(record.id, 'sat-001')
    assert.equal(record.customerName, '王小明')
    assert.equal(record.score, 5)
    assert.equal(record.category, SatisfactionCategory.Service)
  })

  /* ── 9. getById() - 反例 ────────────────────────────── */

  it('getById() throws for non-existent id', () => {
    assert.throws(
      () => service.getById('non-existent-id', defaultTenant),
      (err: unknown) => {
        return err instanceof Error && err.message.includes('not found')
      },
    )
  })

  it('getById() throws when record belongs to different tenant', () => {
    // sat-001 belongs to 'default' tenant
    assert.throws(
      () => service.getById('sat-001', otherTenant),
      (err: unknown) => {
        return err instanceof Error && err.message.includes('not found')
      },
    )
  })

  /* ── 10. create() - 正例 ─────────────────────────────── */

  it('create() adds a new record and returns it', () => {
    const dto = makeDto({ customerName: '新客户', score: 5 })
    const record = service.create(defaultTenant, dto)

    assert.equal(record.storeId, dto.storeId)
    assert.equal(record.customerName, dto.customerName)
    assert.equal(record.score, dto.score)
    assert.equal(record.category, dto.category)
    assert.equal(record.comment, dto.comment)
    assert.equal(record.visitDate, dto.visitDate)
    assert.equal(record.tenantId, defaultTenant.tenantId)
    assert.ok(record.id.startsWith('sat-'))
    assert.ok(typeof record.createdAt === 'string')

    // Verify it is now listed
    const listResult = service.list(defaultTenant)
    const found = listResult.items.find((r) => r.id === record.id)
    assert.ok(found, 'newly created record should appear in list()')
  })

  it('create() allows creating record for different store', () => {
    const dto = makeDto({ storeId: 'store-999' })
    const record = service.create(defaultTenant, dto)
    assert.equal(record.storeId, 'store-999')
  })

  it('create() allows minimum score of 1', () => {
    const dto = makeDto({ score: 1 })
    const record = service.create(defaultTenant, dto)
    assert.equal(record.score, 1)
  })

  /* ── 11. delete() - 正例 ─────────────────────────────── */

  it('delete() removes a record', () => {
    const dto = makeDto()
    const record = service.create(defaultTenant, dto)
    const id = record.id

    // Before delete, record exists
    const before = service.getById(id, defaultTenant)
    assert.equal(before.id, id)

    service.delete(id, defaultTenant)

    // After delete, getById throws
    assert.throws(
      () => service.getById(id, defaultTenant),
      (err: unknown) => {
        return err instanceof Error && err.message.includes('not found')
      },
    )

    // list() should not include it
    const listResult = service.list(defaultTenant)
    const found = listResult.items.find((r) => r.id === id)
    assert.equal(found, undefined)
  })

  /* ── 12. delete() - 反例 ─────────────────────────────── */

  it('delete() throws for non-existent id', () => {
    assert.throws(
      () => service.delete('non-existent', defaultTenant),
      (err: unknown) => {
        return err instanceof Error && err.message.includes('not found')
      },
    )
  })

  it('delete() throws when record belongs to different tenant', () => {
    assert.throws(
      () => service.delete('sat-001', otherTenant),
      (err: unknown) => {
        return err instanceof Error && err.message.includes('not found')
      },
    )
  })

  /* ── 13. getSummary() - 正例 ──────────────────────────── */

  it('getSummary() returns correct structure for default tenant', () => {
    const summary = service.getSummary(defaultTenant)
    assert.equal(typeof summary.totalResponses, 'number')
    assert.equal(typeof summary.avgScore, 'number')
    assert.equal(typeof summary.bestCategory, 'string')
    assert.equal(typeof summary.worstCategory, 'string')
    assert.equal(typeof summary.scoreDistribution, 'object')
    assert.equal(typeof summary.responseRate, 'number')

    // totalResponses should match list count
    const listResult = service.list(defaultTenant)
    assert.equal(summary.totalResponses, listResult.total)

    // avgScore should be between 1 and 5
    assert.ok(summary.avgScore >= 1)
    assert.ok(summary.avgScore <= 5)

    // scoreDistribution should have keys for each score value present
    const distKeys = Object.keys(summary.scoreDistribution)
    assert.ok(distKeys.length > 0)
  })

  it('getSummary() scoreDistribution sums to totalResponses', () => {
    const summary = service.getSummary(defaultTenant)
    const totalFromDist = Object.values(summary.scoreDistribution).reduce((s, v) => s + v, 0)
    assert.equal(totalFromDist, summary.totalResponses)
  })

  /* ── 14. getSummary() - 边界: empty tenant ────────────── */

  it('getSummary() returns zeroed values for empty tenant', () => {
    const summary = service.getSummary(otherTenant)
    assert.deepEqual(summary, {
      totalResponses: 0,
      avgScore: 0,
      bestCategory: '',
      worstCategory: '',
      scoreDistribution: {},
      responseRate: 0,
    })
  })

  /* ── 15. create + list data integrity ─────────────────── */

  it('created records survive in the store across multiple list calls', () => {
    const before = service.list(defaultTenant).total

    service.create(defaultTenant, makeDto({ customerName: 'A' }))
    service.create(defaultTenant, makeDto({ customerName: 'B' }))

    const after = service.list(defaultTenant).total
    assert.equal(after, before + 2)
  })

  it('sort order is visitDate descending after create with future date', () => {
    const record = service.create(defaultTenant, makeDto({ visitDate: '2099-01-01' }))
    const items = service.list(defaultTenant).items
    // The first item should be the one we just created
    assert.equal(items[0].id, record.id)
    assert.equal(items[0].visitDate, '2099-01-01')
  })
})

/* ── describe: SatisfactionCategory enum values ────────────── */

describe('SatisfactionCategory enum', () => {
  it('has all expected values as strings', () => {
    const expected = ['service', 'environment', 'price', 'device', 'overall']
    for (const key of Object.keys(SatisfactionCategory)) {
      const val = (SatisfactionCategory as Record<string, string>)[key]
      assert.ok(expected.includes(val), `Unexpected enum value: ${val}`)
    }
  })

  it('SatisfactionCategoryLabels has entries for all categories', () => {
    const labels: Record<string, string> = {
      [SatisfactionCategory.Service]: '服务',
      [SatisfactionCategory.Environment]: '环境',
      [SatisfactionCategory.Price]: '价格',
      [SatisfactionCategory.Device]: '设备',
      [SatisfactionCategory.Overall]: '综合',
    }
    for (const [category, expectedLabel] of Object.entries(labels)) {
      assert.equal(
        SatisfactionCategoryLabels[category as SatisfactionCategory],
        expectedLabel,
        `label for ${category} should be "${expectedLabel}"`,
      )
    }
  })
})
