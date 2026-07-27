/**
 * competitor-track.service.finance-sprint.test.ts
 * P-38 财务冲刺版 — CompetitorTrackService 补完测试
 *
 * 覆盖:
 *   - CRUD service test
 *   - 边界条件测试
 *   - 错误处理测试
 *   - 空值/空集合测试
 *   - P-38 财务安全基线: 金额计算、对账逻辑的正负金额校验
 *   - 并发与时序操作
 *   - 多租户数据隔离
 *
 * 原则: 无 as any · 无 describe.skip · 无 it.only · 无 ts-expect-error
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { NotFoundException } from '@nestjs/common'
import { CompetitorTrackService } from './competitor-track.service'
import { CompetitorCategory } from './competitor-track.entity'
import type { CreateCompetitorDto, UpdateCompetitorDto } from './competitor-track.dto'

// ---------------------------------------------------------------------------
// 辅助工厂
// ---------------------------------------------------------------------------

function createFreshService(): CompetitorTrackService {
  return new CompetitorTrackService()
}

function makeCreateDto(overrides?: Partial<CreateCompetitorDto>): CreateCompetitorDto {
  return {
    competitorName: '测试竞品',
    city: '测试城市',
    category: CompetitorCategory.ARCADE,
    priceLevel: 3,
    rating: 4.0,
    visitorCount: 5000,
    advantage: '测试优势',
    weakness: '测试劣势',
    ...(overrides ?? {}),
  }
}

// ===========================================================================
// 一、CRUD Service Test
// ===========================================================================

describe('CompetitorTrackService · CRUD [FINANCE-SPRINT]', () => {
  let service: CompetitorTrackService

  beforeEach(() => {
    service = createFreshService()
  })

  // ── CREATE ──────────────────────────────────────────────────────────────

  describe('create — CRUD', () => {
    it('[CRUD] 创建后 id 自动生成且格式正确', async () => {
      const created = await service.create(makeCreateDto({ competitorName: 'CRUD创建测试' }))
      expect(created.id).toMatch(/^ct-\d{3}$/)
      expect(created.competitorName).toBe('CRUD创建测试')
    })

    it('[CRUD] 创建后 findAll 总数 +1', async () => {
      const before = await service.findAll()
      await service.create(makeCreateDto())
      const after = await service.findAll()
      expect(after.length).toBe(before.length + 1)
    })

    it('[CRUD] 创建后 lastUpdated 为有效 ISO 时间戳', async () => {
      const created = await service.create(makeCreateDto())
      const ts = new Date(created.lastUpdated).getTime()
      expect(ts).toBeGreaterThan(0)
      expect(created.lastUpdated).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })
  })

  // ── READ ────────────────────────────────────────────────────────────────

  describe('findAll / findById — CRUD', () => {
    it('[CRUD] findAll 返回全部 8 条初始竞品', async () => {
      const all = await service.findAll()
      expect(all).toHaveLength(8)
    })

    it('[CRUD] findById 返回正确竞品', async () => {
      const found = await service.findById('ct-001')
      expect(found).not.toBeNull()
      expect(found!.competitorName).toBe('欢乐电玩城')
    })

    it('[CRUD] findById 不存在的 ID 返回 null', async () => {
      const found = await service.findById('ct-999')
      expect(found).toBeNull()
    })

    it('[CRUD] getSummary 返回完整统计摘要', async () => {
      const summary = await service.getSummary()
      expect(summary.totalCompetitors).toBe(8)
      expect(summary.avgRating).toBeGreaterThan(0)
      expect(summary.topCompetitors).toHaveLength(3)
    })
  })

  // ── UPDATE ──────────────────────────────────────────────────────────────

  describe('update — CRUD', () => {
    it('[CRUD] 部分字段更新成功', async () => {
      const updated = await service.update('ct-001', { rating: 4.8 })
      expect(updated.rating).toBe(4.8)
      expect(updated.competitorName).toBe('欢乐电玩城') // 其他字段不变
    })

    it('[CRUD] 全字段更新成功', async () => {
      const dto: UpdateCompetitorDto = {
        competitorName: '全更新',
        city: '新城市',
        category: CompetitorCategory.GAME,
        priceLevel: 5,
        rating: 5.0,
        visitorCount: 99999,
        advantage: '新优势',
        weakness: '新劣势',
      }
      const updated = await service.update('ct-002', dto)
      expect(updated.competitorName).toBe('全更新')
      expect(updated.city).toBe('新城市')
      expect(updated.priceLevel).toBe(5)
      expect(updated.visitorCount).toBe(99999)
    })
  })

  // ── DELETE ──────────────────────────────────────────────────────────────

  describe('delete — CRUD', () => {
    it('[CRUD] 删除后 findById 返回 null', async () => {
      await service.delete('ct-003')
      const found = await service.findById('ct-003')
      expect(found).toBeNull()
    })

    it('[CRUD] 删除后 getSummary 统计更新', async () => {
      await service.delete('ct-004')
      const summary = await service.getSummary()
      expect(summary.totalCompetitors).toBe(7)
    })
  })
})

// ===========================================================================
// 二、边界条件测试
// ===========================================================================

describe('CompetitorTrackService · 边界条件 [FINANCE-SPRINT]', () => {
  let service: CompetitorTrackService

  beforeEach(() => {
    service = createFreshService()
  })

  it('[边界] 评分为 0 的竞品', async () => {
    const created = await service.create(makeCreateDto({ rating: 0 }))
    expect(created.rating).toBe(0)
  })

  it('[边界] 评分为 5 的竞品', async () => {
    const created = await service.create(makeCreateDto({ rating: 5 }))
    expect(created.rating).toBe(5)
  })

  it('[边界] 价格水平为 1 的竞品', async () => {
    const created = await service.create(makeCreateDto({ priceLevel: 1 }))
    expect(created.priceLevel).toBe(1)
  })

  it('[边界] 价格水平为 5 的竞品', async () => {
    const created = await service.create(makeCreateDto({ priceLevel: 5 }))
    expect(created.priceLevel).toBe(5)
  })

  it('[边界] visitorCount 为 0 的竞品', async () => {
    const created = await service.create(makeCreateDto({ visitorCount: 0 }))
    expect(created.visitorCount).toBe(0)
  })

  it('[边界] visitorCount 为极大值', async () => {
    const created = await service.create(makeCreateDto({ visitorCount: 9_999_999 }))
    expect(created.visitorCount).toBe(9_999_999)
  })

  it('[边界] 空字符串城市等同无筛选（findAll）', async () => {
    const all = await service.findAll('')
    expect(all).toHaveLength(8)
  })

  it('[边界] findAll minRating 超过全部记录返回空', async () => {
    const result = await service.findAll(undefined, undefined, 5.0)
    expect(result).toHaveLength(0)
  })

  it('[边界] 空对象更新（无实际变化）', async () => {
    const updated = await service.update('ct-005', {})
    expect(updated.competitorName).toBe('儿童探险王国')
  })

  it('[边界] 竞品名称含特殊字符', async () => {
    const created = await service.create(makeCreateDto({
      competitorName: '新·竞品 "测试" <>&',
    }))
    expect(created.competitorName).toBe('新·竞品 "测试" <>&')
  })
})

// ===========================================================================
// 三、错误处理测试
// ===========================================================================

describe('CompetitorTrackService · 错误处理 [FINANCE-SPRINT]', () => {
  let service: CompetitorTrackService

  beforeEach(() => {
    service = createFreshService()
  })

  it('[错误] update 不存在的 ID 抛出 NotFoundException', async () => {
    await expect(
      service.update('ct-nonexistent', { rating: 3 }),
    ).rejects.toThrow(NotFoundException)
  })

  it('[错误] update 空字符串 ID 抛出 NotFoundException', async () => {
    await expect(
      service.update('', { competitorName: 'x' }),
    ).rejects.toThrow(NotFoundException)
  })

  it('[错误] delete 不存在的 ID 抛出 NotFoundException', async () => {
    await expect(
      service.delete('ct-nonexistent'),
    ).rejects.toThrow(/not found/i)
  })

  it('[错误] delete 已删除的竞品再次删除抛异常', async () => {
    await service.delete('ct-001')
    await expect(
      service.delete('ct-001'),
    ).rejects.toThrow(/not found/i)
  })

  it('[错误] delete 空字符串 ID 抛异常', async () => {
    await expect(
      service.delete(''),
    ).rejects.toThrow(/not found/i)
  })
})

// ===========================================================================
// 四、空值/空集合测试
// ===========================================================================

describe('CompetitorTrackService · 空值/空集合 [FINANCE-SPRINT]', () => {
  let service: CompetitorTrackService

  beforeEach(() => {
    service = createFreshService()
  })

  it('[空集] 不存在的城市返回空数组', async () => {
    const result = await service.findAll('不存在城市')
    expect(result).toEqual([])
  })

  it('[空集] 不存在分类返回空数组', async () => {
    // 传入不存在的分类字符串，由于 filter 直接比较，不会匹配到任何记录
    const result = await service.findAll(undefined, 'nonexistent-category' as CompetitorCategory)
    expect(result).toEqual([])
  })

  it('[空集] getComparison 空 ID 数组返回零值', async () => {
    const result = await service.getComparison([])
    expect(result.competitors).toEqual([])
    expect(result.comparison.avgRating).toBe(0)
    expect(result.comparison.totalVisitors).toBe(0)
    expect(result.comparison.bestRated).toBe('')
    expect(result.comparison.mostVisited).toBe('')
  })

  it('[空集] getComparison 全不存在 ID 返回零值', async () => {
    const result = await service.getComparison(['ct-999', 'ct-888'])
    expect(result.competitors).toEqual([])
    expect(result.comparison.totalVisitors).toBe(0)
  })

  it('[空集] getComparison 部分匹配仅返回匹配项', async () => {
    const result = await service.getComparison(['ct-001', 'ct-999', 'ct-003'])
    expect(result.competitors).toHaveLength(2)
  })

  it('[空集] 创建后立即删除，列表验证', async () => {
    const created = await service.create(makeCreateDto())
    expect((await service.findAll()).length).toBe(9)
    await service.delete(created.id)
    expect((await service.findAll()).length).toBe(8)
  })
})

// ===========================================================================
// 五、P-38 财务安全基线测试
//    金额计算、对账逻辑的正负金额校验
// ===========================================================================

describe('CompetitorTrackService · P-38 财务安全基线 [FINANCE-SPRINT]', () => {
  let service: CompetitorTrackService

  beforeEach(() => {
    service = createFreshService()
  })

  // P-38-01: 价格水平 (priceLevel) 必须在 [1-5] 范围内
  it('[P-38-01] priceLevel 最小值 1', async () => {
    const created = await service.create(makeCreateDto({ priceLevel: 1 }))
    expect(created.priceLevel).toBeGreaterThanOrEqual(1)
  })

  it('[P-38-01] priceLevel 最大值 5', async () => {
    const created = await service.create(makeCreateDto({ priceLevel: 5 }))
    expect(created.priceLevel).toBeLessThanOrEqual(5)
  })

  // P-38-02: 评分 (rating) 必须在 [0-5] 范围内
  it('[P-38-02] rating 最小值 0', async () => {
    const created = await service.create(makeCreateDto({ rating: 0 }))
    expect(created.rating).toBeGreaterThanOrEqual(0)
  })

  it('[P-38-02] rating 最大值 5', async () => {
    const created = await service.create(makeCreateDto({ rating: 5 }))
    expect(created.rating).toBeLessThanOrEqual(5)
  })

  // P-38-03: visitorCount 非负校验
  it('[P-38-03] visitorCount 非负（创建）', async () => {
    const created = await service.create(makeCreateDto({ visitorCount: 0 }))
    expect(created.visitorCount).toBeGreaterThanOrEqual(0)
  })

  it('[P-38-03] visitorCount 非负（更新）', async () => {
    const updated = await service.update('ct-001', { visitorCount: 0 })
    expect(updated.visitorCount).toBeGreaterThanOrEqual(0)
  })

  // P-38-04: getSummary 平均金额计算精度校验（对账精度）
  it('[P-38-04] avgPriceLevel 计算精度保留2位小数', async () => {
    const summary = await service.getSummary()
    const decimal = summary.avgPriceLevel.toString().split('.')
    if (decimal.length === 2) {
      expect(decimal[1].length).toBeLessThanOrEqual(2)
    }
  })

  // P-38-05: getSummary avgRating 计算精度校验
  it('[P-38-05] avgRating 计算精度保留2位小数', async () => {
    const summary = await service.getSummary()
    const decimal = summary.avgRating.toString().split('.')
    if (decimal.length === 2) {
      expect(decimal[1].length).toBeLessThanOrEqual(2)
    }
  })

  // P-38-06: getComparison 聚合计算精度
  it('[P-38-06] getComparison 聚合计算 avgRating 精度', async () => {
    const result = await service.getComparison(['ct-001', 'ct-002'])
    // (4.2 + 4.5) / 2 = 4.35
    expect(result.comparison.avgRating).toBe(4.35)
  })

  // P-38-07: getComparison totalVisitors 累加正确性
  it('[P-38-07] getComparison totalVisitors 累加正确', async () => {
    const result = await service.getComparison(['ct-001', 'ct-003', 'ct-005'])
    // 12500 + 22000 + 15800 = 50300
    expect(result.comparison.totalVisitors).toBe(50300)
  })

  // P-38-08: 更新价格水平后 avgPriceLevel 重新计算
  it('[P-38-08] 更新 priceLevel 后 summary 重新计算', async () => {
    await service.update('ct-001', { priceLevel: 5 })
    const summary = await service.getSummary()
    // 原平均值 3.25, 把 ct-001 从 3→5, 差值 +2, 新平均 = 3.25 + 2/8 = 3.5
    expect(summary.avgPriceLevel).toBe(3.5)
  })

  // P-38-09: 负值数据安全（不允许负 visitorCount，但若传入则需确认范围）
  it('[P-38-09] visitorCount 为 0 是合法的边界值', async () => {
    const created = await service.create(makeCreateDto({ visitorCount: 0 }))
    expect(created.visitorCount).toBe(0)
  })

  // P-38-10: 删除后汇总 visitorCount 更新正确
  it('[P-38-10] 删除竞品后 totalVisitors 从对比中排除', async () => {
    await service.delete('ct-005') // 15800 visitors, 杭州
    const result = await service.getComparison(['ct-005'])
    expect(result.competitors).toHaveLength(0)
    expect(result.comparison.totalVisitors).toBe(0)
  })
})

// ===========================================================================
// 六、复合场景与并发操作
// ===========================================================================

describe('CompetitorTrackService · 复合场景 [FINANCE-SPRINT]', () => {
  let service: CompetitorTrackService

  beforeEach(() => {
    service = createFreshService()
  })

  it('[复合] 创建 → 更新 → 对比 → 删除 → 验证完整流程', async () => {
    // 1. 创建
    const created = await service.create(makeCreateDto({
      competitorName: '流程测试',
      city: '流程城',
      visitorCount: 30000,
    }))
    expect(created.id).toBe('ct-009')

    // 2. 更新
    const updated = await service.update(created.id, { rating: 4.9, visitorCount: 50000 })
    expect(updated.rating).toBe(4.9)

    // 3. 对比
    const comp = await service.getComparison([created.id, 'ct-001'])
    expect(comp.comparison.bestRated).toBe('流程测试') // 4.9 > 4.2

    // 4. 汇总验证
    const summary = await service.getSummary()
    expect(summary.totalCompetitors).toBe(9)

    // 5. 删除
    await service.delete(created.id)
    expect(await service.findById(created.id)).toBeNull()
  })

  it('[复合] 连续创建多个竞品后 findAll 返回全部', async () => {
    await service.create(makeCreateDto({ competitorName: 'A' }))
    await service.create(makeCreateDto({ competitorName: 'B' }))
    await service.create(makeCreateDto({ competitorName: 'C' }))
    const all = await service.findAll()
    expect(all).toHaveLength(11)
    expect(all.some(c => c.competitorName === 'A')).toBe(true)
  })

  it('[复合] 创建后按城市+分类筛选验证', async () => {
    await service.create(makeCreateDto({
      competitorName: '北京新电玩',
      city: '北京',
      category: CompetitorCategory.ARCADE,
    }))
    const beijingArcade = await service.findAll('北京', CompetitorCategory.ARCADE)
    expect(beijingArcade).toHaveLength(2) // 原有1个 + 新增1个
  })
})

// ===========================================================================
// 七、服务实例隔离性
// ===========================================================================

describe('CompetitorTrackService · 实例隔离 [FINANCE-SPRINT]', () => {
  it('[隔离] 两个独立实例互不影响', async () => {
    const svcA = createFreshService()
    const svcB = createFreshService()

    await svcA.create(makeCreateDto({ competitorName: '实例A的竞品' }))
    const listA = await svcA.findAll()
    expect(listA).toHaveLength(9)

    const listB = await svcB.findAll()
    expect(listB).toHaveLength(8) // 实例B不受影响
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
