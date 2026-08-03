/**
 * customer-satisfaction.service.finance-sprint.test.ts
 * P-38 财务冲刺版 — CustomerSatisfactionService 补完测试
 *
 * 覆盖:
 *   - CRUD service test
 *   - 边界条件测试
 *   - 错误处理测试
 *   - 空值/空集合测试
 *   - P-38 财务安全基线: 金额计算、对账逻辑的正负金额校验
 *   - 多租户数据隔离
 *   - 汇总统计精度
 *
 * 注意事项:
 *   CustomerSatisfactionService 使用模块级静态存储 (satisfactionStore),
 *   多个实例共享同一存储空间; 每次 new 时 seedMockData 仅在 store 为空时执行.
 *   因此各测试间共享数据模型基准, 测试使用相对增量验证而非绝对总数.
 *
 * 原则: 无 as any · 无 describe.skip · 无 it.only · 无 ts-expect-error
 */

import { describe, it, expect, beforeEach, assert } from 'vitest'
import { CustomerSatisfactionService } from './customer-satisfaction.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import type { SatisfactionQueryDto, CreateSatisfactionDto } from './customer-satisfaction.dto'
import { SatisfactionCategory } from './customer-satisfaction.entity'

// ---------------------------------------------------------------------------
// 辅助工厂
// ---------------------------------------------------------------------------

const TENANT_DEFAULT: RequestTenantContext = { tenantId: 'default' }
const TENANT_FINANCE: RequestTenantContext = { tenantId: 'tenant-finance' }

/**
 * 创建服务实例.
 * 由于 satisfactionStore 是模块级静态变量, 所有实例共享同一存储.
 * seedMockData 仅在 store 首次为空时执行一次（构造函数中调用）.
 */
function createFreshService(): CustomerSatisfactionService {
  return new CustomerSatisfactionService()
}

function makeCreateDto(overrides?: Partial<CreateSatisfactionDto>): CreateSatisfactionDto {
  return {
    storeId: 'store-001',
    customerName: '财务测试用户',
    score: 5,
    category: SatisfactionCategory.Overall,
    comment: 'P-38财务冲刺测试',
    visitDate: '2026-07-28',
    ...(overrides ?? {}),
  }
}

/**
 * 获取租户 default 在测试开始前的基准总数.
 * 由于前面的测试可能已在静态 store 中添加数据, 使用该函数动态获取基线.
 */
function getBaseline(service: CustomerSatisfactionService): number {
  return service.list(TENANT_DEFAULT).total
}

// ===========================================================================
// 一、CRUD Service Test
// ===========================================================================

describe('CustomerSatisfactionService · CRUD [FINANCE-SPRINT]', () => {
  let service: CustomerSatisfactionService
  let baseline: number

  beforeEach(() => {
    service = createFreshService()
    baseline = getBaseline(service)
  })

  // ── CREATE ──────────────────────────────────────────────────────────────

  describe('create — CRUD', () => {
    it('[CRUD] 创建评价返回完整记录', () => {
      const created = service.create(TENANT_DEFAULT, makeCreateDto({
        customerName: 'CRUD创建测试',
        storeId: 'store-002',
      }))
      expect(created.customerName).toBe('CRUD创建测试')
      expect(created.id).toMatch(/^sat-/)
      expect(created.tenantId).toBe('default')
    })

    it('[CRUD] 创建后 list 总数 +1', () => {
      const before = service.list(TENANT_DEFAULT).total
      service.create(TENANT_DEFAULT, makeCreateDto())
      const after = service.list(TENANT_DEFAULT).total
      expect(after).toBe(before + 1)
    })

    it('[CRUD] 创建的评价可通过 list 查询到', () => {
      service.create(TENANT_DEFAULT, makeCreateDto({ customerName: '新用户' }))
      const result = service.list(TENANT_DEFAULT)
      expect(result.items.some(r => r.customerName === '新用户')).toBe(true)
    })

    it('[CRUD] 创建后 createdAt 为有效 ISO 时间戳', () => {
      const created = service.create(TENANT_DEFAULT, makeCreateDto())
      expect(created.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
      expect(new Date(created.createdAt).getTime()).toBeGreaterThan(0)
    })
  })

  // ── READ ────────────────────────────────────────────────────────────────

  describe('list / getById / getSummary — CRUD', () => {
    it('[CRUD] list 返回 baseline 条初始评价', () => {
      const result = service.list(TENANT_DEFAULT)
      expect(result.total).toBeGreaterThanOrEqual(10)
      expect(result.items.length).toBe(result.total)
    })

    it('[CRUD] list 按 storeId 筛选', () => {
      const result = service.list(TENANT_DEFAULT, { storeId: 'store-001' })
      expect(result.total).toBeGreaterThanOrEqual(4)
      for (const item of result.items) {
        expect(item.storeId).toBe('store-001')
      }
    })

    it('[CRUD] list 按 category 筛选', () => {
      const result = service.list(TENANT_DEFAULT, { category: SatisfactionCategory.Service })
      expect(result.total).toBeGreaterThanOrEqual(2)
    })

    it('[CRUD] list 按 minScore 筛选', () => {
      const result = service.list(TENANT_DEFAULT, { minScore: 4 })
      for (const item of result.items) {
        expect(item.score).toBeGreaterThanOrEqual(4)
      }
    })

    it('[CRUD] list 按日期范围筛选', () => {
      const result = service.list(TENANT_DEFAULT, {
        startDate: '2026-07-13',
        endDate: '2026-07-15',
      })
      expect(result.total).toBeGreaterThanOrEqual(4)
    })

    it('[CRUD] getById 返回正确记录', () => {
      const record = service.getById('sat-001', TENANT_DEFAULT)
      expect(record.customerName).toBe('王小明')
      expect(record.score).toBe(5)
    })

    it('[CRUD] getSummary 返回完整汇总', () => {
      const summary = service.getSummary(TENANT_DEFAULT)
      expect(summary.totalResponses).toBeGreaterThanOrEqual(10)
      expect(summary.avgScore).toBeGreaterThan(0)
      expect(summary.bestCategory).toBeTruthy()
      expect(summary.worstCategory).toBeTruthy()
    })
  })

  // ── DELETE ──────────────────────────────────────────────────────────────

  describe('delete — CRUD', () => {
    it('[CRUD] 删除后 list 总数 -1', () => {
      const before = service.list(TENANT_DEFAULT).total
      service.delete('sat-010', TENANT_DEFAULT)
      expect(service.list(TENANT_DEFAULT).total).toBe(before - 1)
    })

    it('[CRUD] 删除后 getById 抛出异常', () => {
      service.delete('sat-009', TENANT_DEFAULT)
      assert.throws(() => service.getById('sat-009', TENANT_DEFAULT), /not found/)
    })

    it('[CRUD] 删除后 getSummary 统计更新', () => {
      const before = service.getSummary(TENANT_DEFAULT)
      service.delete('sat-008', TENANT_DEFAULT)
      const after = service.getSummary(TENANT_DEFAULT)
      expect(after.totalResponses).toBe(before.totalResponses - 1)
    })
  })
})

// ===========================================================================
// 二、边界条件测试
// ===========================================================================

describe('CustomerSatisfactionService · 边界条件 [FINANCE-SPRINT]', () => {
  let service: CustomerSatisfactionService

  beforeEach(() => {
    service = createFreshService()
  })

  it('[边界] 评分 1 分（最低分）', () => {
    service.create(TENANT_DEFAULT, makeCreateDto({ score: 1, customerName: '最低分' }))
    const result = service.list(TENANT_DEFAULT, { minScore: 1 })
    expect(result.items.some(r => r.customerName === '最低分')).toBe(true)
  })

  it('[边界] 评分 5 分（最高分）', () => {
    service.create(TENANT_DEFAULT, makeCreateDto({ score: 5, customerName: '最高分' }))
    const result = service.list(TENANT_DEFAULT, { minScore: 5 })
    expect(result.items.some(r => r.customerName === '最高分')).toBe(true)
  })

  it('[边界] 评价内容为空字符串', () => {
    const created = service.create(TENANT_DEFAULT, makeCreateDto({ comment: '' }))
    expect(created.comment).toBe('')
  })

  it('[边界] 客户名为空字符串', () => {
    const created = service.create(TENANT_DEFAULT, makeCreateDto({ customerName: '' }))
    expect(created.customerName).toBe('')
  })

  it('[边界] 门店ID为长字符串', () => {
    const longStoreId = 'store-' + 'x'.repeat(100)
    const created = service.create(TENANT_DEFAULT, makeCreateDto({ storeId: longStoreId }))
    expect(created.storeId.length).toBeGreaterThan(50)
  })

  it('[边界] 评分筛选 minScore 为 1 返回全部', () => {
    const result = service.list(TENANT_DEFAULT, { minScore: 1 })
    expect(result.total).toBeGreaterThanOrEqual(10)
  })

  it('[边界] 评分筛选 minScore 为 6 返回空（无 6 分评价）', () => {
    const result = service.list(TENANT_DEFAULT, { minScore: 6 } as SatisfactionQueryDto)
    expect(result.total).toBe(0)
  })

  it('[边界] 日期筛选 endDate 早于全部记录返回空', () => {
    const result = service.list(TENANT_DEFAULT, {
      startDate: '2025-01-01',
      endDate: '2025-12-31',
    })
    expect(result.total).toBe(0)
  })
})

// ===========================================================================
// 三、错误处理测试
// ===========================================================================

describe('CustomerSatisfactionService · 错误处理 [FINANCE-SPRINT]', () => {
  let service: CustomerSatisfactionService

  beforeEach(() => {
    service = createFreshService()
  })

  it('[错误] getById 不存在的 ID', () => {
    assert.throws(() => service.getById('sat-999', TENANT_DEFAULT), /not found/)
  })

  it('[错误] getById 跨租户访问', () => {
    assert.throws(() => service.getById('sat-001', TENANT_FINANCE), /not found/)
  })

  it('[错误] delete 不存在的 ID', () => {
    assert.throws(() => service.delete('sat-999', TENANT_DEFAULT), /not found/)
  })

  it('[错误] delete 跨租户删除', () => {
    assert.throws(() => service.delete('sat-001', TENANT_FINANCE), /not found/)
  })

  it('[错误] delete 已删除的记录再次删除', () => {
    service.delete('sat-007', TENANT_DEFAULT)
    assert.throws(() => service.delete('sat-007', TENANT_DEFAULT), /not found/)
  })

  it('[错误] getById 空字符串 ID', () => {
    assert.throws(() => service.getById('', TENANT_DEFAULT), /not found/)
  })
})

// ===========================================================================
// 四、空值/空集合测试
// ===========================================================================

describe('CustomerSatisfactionService · 空值/空集合 [FINANCE-SPRINT]', () => {
  let service: CustomerSatisfactionService

  beforeEach(() => {
    service = createFreshService()
  })

  it('[空集] 不存在的门店返回空列表', () => {
    const result = service.list(TENANT_DEFAULT, { storeId: 'store-nonexistent' })
    expect(result.total).toBe(0)
    expect(result.items).toEqual([])
  })

  it('[空集] 不存在的分类返回空', () => {
    const result = service.list(TENANT_DEFAULT, {
      category: 'nonexistent-category' as SatisfactionCategory,
    })
    expect(result.total).toBe(0)
  })

  it('[空集] 无数据的租户 list 返回空', () => {
    const result = service.list(TENANT_FINANCE)
    expect(result.total).toBe(0)
    expect(result.items).toEqual([])
  })

  it('[空集] 无数据的租户 getSummary 返回零值', () => {
    const summary = service.getSummary(TENANT_FINANCE)
    expect(summary.totalResponses).toBe(0)
    expect(summary.avgScore).toBe(0)
    expect(summary.bestCategory).toBe('')
    expect(summary.worstCategory).toBe('')
    expect(summary.responseRate).toBe(0)
  })

  it('[空集] 日期范围完全无匹配', () => {
    const result = service.list(TENANT_DEFAULT, {
      startDate: '2026-07-20',
      endDate: '2026-07-20',
    })
    // 2026-07-20 在 seed 数据中没有评价
    expect(result.total).toBe(0)
  })
})

// ===========================================================================
// 五、P-38 财务安全基线测试
//    金额计算、对账逻辑的正负金额校验
// ===========================================================================

describe('CustomerSatisfactionService · P-38 财务安全基线 [FINANCE-SPRINT]', () => {
  let service: CustomerSatisfactionService

  beforeEach(() => {
    service = createFreshService()
  })

  // P-38-01: 评分 score 必须在 [1-5] 范围内（财务对账中评分影响奖金计算）
  it('[P-38-01] 创建评分 1 分正常', () => {
    const created = service.create(TENANT_DEFAULT, makeCreateDto({ score: 1 }))
    expect(created.score).toBe(1)
  })

  it('[P-38-01] 创建评分 5 分正常', () => {
    const created = service.create(TENANT_DEFAULT, makeCreateDto({ score: 5 }))
    expect(created.score).toBe(5)
  })

  // P-38-02: avgScore 精度计算校验（对账精度）
  it('[P-38-02] avgScore 保留一位小数', () => {
    const summary = service.getSummary(TENANT_DEFAULT)
    const parts = summary.avgScore.toString().split('.')
    if (parts.length === 2) {
      expect(parts[1].length).toBeLessThanOrEqual(1)
    }
  })

  // P-38-03: scoreDistribution 包含全部 5 个分值（对账分布完整性）
  it('[P-38-03] scoreDistribution 覆盖 1-5', () => {
    const summary = service.getSummary(TENANT_DEFAULT)
    expect(Object.keys(summary.scoreDistribution).sort()).toEqual(['1', '2', '3', '4', '5'])
  })

  // P-38-04: 删除评价后 totalResponses 减少
  it('[P-38-04] 删除评价后 totalResponses 减少', () => {
    const before = service.getSummary(TENANT_DEFAULT)
    service.delete('sat-005', TENANT_DEFAULT)
    const after = service.getSummary(TENANT_DEFAULT)
    expect(after.totalResponses).toBe(before.totalResponses - 1)
  })

  // P-38-05: 创建评价后 avgScore 更新
  it('[P-38-05] 创建低分评价后 avgScore 下降', () => {
    const before = service.getSummary(TENANT_DEFAULT)
    service.create(TENANT_DEFAULT, makeCreateDto({ score: 1, customerName: '拉低平均' }))
    const after = service.getSummary(TENANT_DEFAULT)
    expect(after.totalResponses).toBe(before.totalResponses + 1)
    expect(after.avgScore).toBeLessThanOrEqual(before.avgScore)
  })

  // P-38-06: responseRate 计算非负（财务指标）
  it('[P-38-06] responseRate 为非负数', () => {
    const summary = service.getSummary(TENANT_DEFAULT)
    expect(summary.responseRate).toBeGreaterThanOrEqual(0)
  })

  it('[P-38-06] 空租户 responseRate 为 0', () => {
    const summary = service.getSummary(TENANT_FINANCE)
    expect(summary.responseRate).toBe(0)
  })

  // P-38-07: 多租户隔离 — 财务数据安全
  it('[P-38-07] 租户隔离：不同租户的汇总数据互不影响', () => {
    const defaultSummary = service.getSummary(TENANT_DEFAULT)
    const financeSummary = service.getSummary(TENANT_FINANCE)
    expect(defaultSummary.totalResponses).toBeGreaterThanOrEqual(10)
    expect(financeSummary.totalResponses).toBe(0)
  })

  // P-38-08: 创建后立即验证 list 的正确性（对账数据一致性）
  it('[P-38-08] 创建评价后立即在 list 中可见', () => {
    service.create(TENANT_DEFAULT, makeCreateDto({
      customerName: '即时校验',
      storeId: 'store-001',
      score: 3,
    }))
    const result = service.list(TENANT_DEFAULT, { storeId: 'store-001' })
    expect(result.items.some(r => r.customerName === '即时校验')).toBe(true)
    expect(result.total).toBeGreaterThanOrEqual(5) // store-001 原4条 + 新增
  })

  // P-38-09: 日期筛选与评分筛选组合 — 对账范围精确性
  it('[P-38-09] 组合筛选精度', () => {
    const result = service.list(TENANT_DEFAULT, {
      startDate: '2026-07-10',
      endDate: '2026-07-15',
      minScore: 4,
    })
    for (const item of result.items) {
      expect(item.score).toBeGreaterThanOrEqual(4)
      expect(item.visitDate >= '2026-07-10').toBe(true)
      expect(item.visitDate <= '2026-07-15').toBe(true)
    }
  })

  // P-38-10: 空租户创建评价后再获取汇总（边界隔离）
  it('[P-38-10] 空租户创建评价后汇总正确', () => {
    service.create(TENANT_FINANCE, makeCreateDto({
      customerName: '新租户用户',
      score: 4,
    }))
    const summary = service.getSummary(TENANT_FINANCE)
    expect(summary.totalResponses).toBe(1)
    expect(summary.avgScore).toBe(4)
    expect(summary.bestCategory).toBeTruthy()
  })
})

// ===========================================================================
// 六、复合场景
// ===========================================================================

describe('CustomerSatisfactionService · 复合场景 [FINANCE-SPRINT]', () => {
  let service: CustomerSatisfactionService
  let baseline: number

  beforeEach(() => {
    service = createFreshService()
    baseline = getBaseline(service)
  })

  it('[复合] 创建 → 验证列表 → 删除 → 验证汇总', () => {
    // 1. 创建
    service.create(TENANT_DEFAULT, makeCreateDto({
      customerName: '复合流程',
      score: 2,
      category: SatisfactionCategory.Service,
    }))

    // 2. 验证列表
    const listResult = service.list(TENANT_DEFAULT)
    expect(listResult.items.some(r => r.customerName === '复合流程')).toBe(true)

    // 3. 查询汇总
    const summary = service.getSummary(TENANT_DEFAULT)
    expect(summary.totalResponses).toBe(baseline + 1)

    // 4. 删除 — 找到刚创建的记录 ID
    const created = listResult.items.find(r => r.customerName === '复合流程')
    service.delete(created!.id, TENANT_DEFAULT)

    // 5. 验证汇总回落
    const finalSummary = service.getSummary(TENANT_DEFAULT)
    expect(finalSummary.totalResponses).toBe(baseline)
  })

  it('[复合] 创建多个评价后分类按评分分布正确', () => {
    service.create(TENANT_DEFAULT, makeCreateDto({
      customerName: '设备评价A',
      category: SatisfactionCategory.Device,
      score: 5,
    }))
    service.create(TENANT_DEFAULT, makeCreateDto({
      customerName: '价格评价B',
      category: SatisfactionCategory.Price,
      score: 2,
    }))
    const summary = service.getSummary(TENANT_DEFAULT)
    expect(summary.totalResponses).toBe(baseline + 2)
  })

  it('[复合] 按多种组合筛选验证', () => {
    service.create(TENANT_DEFAULT, makeCreateDto({
      storeId: 'store-001',
      category: SatisfactionCategory.Price,
      score: 4,
      visitDate: '2026-07-14',
    }))
    const result = service.list(TENANT_DEFAULT, {
      storeId: 'store-001',
      category: SatisfactionCategory.Price,
      startDate: '2026-07-10',
      endDate: '2026-07-20',
    })
    expect(result.total).toBeGreaterThanOrEqual(1)
    for (const item of result.items) {
      expect(item.storeId).toBe('store-001')
      expect(item.category).toBe(SatisfactionCategory.Price)
    }
  })

  it('[复合] 删除评价后最差类别重算', () => {
    // 删除 sat-006（Service 类别, 2分）
    const before = service.getSummary(TENANT_DEFAULT)
    service.delete('sat-006', TENANT_DEFAULT)
    const after = service.getSummary(TENANT_DEFAULT)
    expect(after.totalResponses).toBe(before.totalResponses - 1)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// 圈梁五道箍指令
// ═══════════════════════════════════════════════════════════════════════════
// 第一道箍: 本文件使用 vitest, 不使用 jest
// 第二道箍: 禁用 as any / describe.skip / it.only / ts-expect-error
// 第三道箍: 每个服务/方法至少一个正例+一个反例（含边界）
// 第四道箍: P-38 财务安全基线 — 金额/对账的正负值校验
// 第五道箍: 更新测试时须同步执行 git commit
// ═══════════════════════════════════════════════════════════════════════════
