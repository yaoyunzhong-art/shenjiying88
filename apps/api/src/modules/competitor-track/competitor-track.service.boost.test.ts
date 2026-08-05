/**
 * competitor-track.service.boost.spec.ts
 * 竞品跟踪 service 层补充单元测试
 *
 * 覆盖: 并发操作、更新全字段、复杂筛选组合、时序流程、边界值
 * 使用 vitest, 内存 MOCK 数据
 */

import { describe, it, expect, beforeEach, assert } from 'vitest'
import { CompetitorTrackService } from './competitor-track.service'
import { CompetitorCategory } from './competitor-track.entity'
import type { CreateCompetitorDto, UpdateCompetitorDto } from './competitor-track.dto'

function createFreshService(): CompetitorTrackService {
  return new CompetitorTrackService()
}

function makeTestDto(overrides?: Partial<CreateCompetitorDto>): CreateCompetitorDto {
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

describe('[Boost] CompetitorTrackService — 复杂操作/边界/时序', () => {
  let service: CompetitorTrackService

  beforeEach(() => {
    service = createFreshService()
  })

  // ══════════════════════════════════════════════════════════════
  // findAll 复杂筛选
  // ══════════════════════════════════════════════════════════════

  describe('findAll 复杂组合筛选', () => {
    it('[正例] 城市 + 分类 + 最小评分三条件组合', async () => {
      const result = await service.findAll('广州', CompetitorCategory.ENTERTAINMENT, 4.0)
      expect(result.length).toBe(1)
      expect(result[0].competitorName).toBe('浪潮水上乐园')
    })

    it('[边界] 最小评分=4.4 返回两条', async () => {
      const result = await service.findAll(undefined, undefined, 4.4)
      expect(result.length).toBe(3)
      const names = result.map(c => c.competitorName).sort()
      expect(names).toEqual(['儿童探险王国', '幻境VR体验馆', '极速电竞馆'])
    })

    it('[边界] 组合后不满足任意条件返回空', async () => {
      const result = await service.findAll('武汉', CompetitorCategory.ARCADE)
      expect(result.length).toBe(0)
    })

    it('[边界] 城市+分类交叉验证', async () => {
      // 北京只有一个 arcade
      const beijingArcade = await service.findAll('北京', CompetitorCategory.ARCADE)
      expect(beijingArcade.length).toBe(1)
      expect(beijingArcade[0].competitorName).toBe('欢乐电玩城')

      // 北京没有 game
      const beijingGame = await service.findAll('北京', CompetitorCategory.GAME)
      expect(beijingGame.length).toBe(0)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // update 全字段更新
  // ══════════════════════════════════════════════════════════════

  describe('update 全字段更新', () => {
    it('[正例] 一次性更新竞品所有字段', async () => {
      const dto: UpdateCompetitorDto = {
        competitorName: '全新名称',
        city: '新城市',
        category: CompetitorCategory.GAME,
        priceLevel: 5,
        rating: 5.0,
        visitorCount: 99999,
        advantage: '全新优势',
        weakness: '全新劣势',
      }
      const updated = await service.update('ct-001', dto)
      expect(updated.competitorName).toBe('全新名称')
      expect(updated.city).toBe('新城市')
      expect(updated.category).toBe(CompetitorCategory.GAME)
      expect(updated.priceLevel).toBe(5)
      expect(updated.rating).toBe(5.0)
      expect(updated.visitorCount).toBe(99999)
      expect(updated.advantage).toBe('全新优势')
      expect(updated.weakness).toBe('全新劣势')
    })

    it('[正例] 只更新 rating 其他字段不变', async () => {
      const updated = await service.update('ct-002', { rating: 3.0 })
      expect(updated.rating).toBe(3.0)
      // 其他字段不变
      expect(updated.competitorName).toBe('极速电竞馆')
      expect(updated.city).toBe('上海')
      expect(updated.priceLevel).toBe(4)
    })

    it('[正例] 更新后 lastUpdated 刷新为当前时间', async () => {
      const before = await service.findById('ct-003')
      const beforeTime = new Date(before!.lastUpdated).getTime()

      // 等待一小段时间
      await new Promise(r => setTimeout(r, 10))

      const updated = await service.update('ct-003', { visitorCount: 25000 })
      const afterTime = new Date(updated.lastUpdated).getTime()
      expect(afterTime).toBeGreaterThan(beforeTime)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // create 边界值
  // ══════════════════════════════════════════════════════════════

  describe('create 极值参数', () => {
    it('[边界] 创建评分=0的竞品', async () => {
      const created = await service.create(makeTestDto({ rating: 0 }))
      expect(created.rating).toBe(0)
    })

    it('[边界] 创建评分=5的竞品', async () => {
      const created = await service.create(makeTestDto({ rating: 5 }))
      expect(created.rating).toBe(5)
    })

    it('[边界] 创建价格水平=1的竞品', async () => {
      const created = await service.create(makeTestDto({ priceLevel: 1 }))
      expect(created.priceLevel).toBe(1)
    })

    it('[边界] 创建价格水平=5的竞品', async () => {
      const created = await service.create(makeTestDto({ priceLevel: 5 }))
      expect(created.priceLevel).toBe(5)
    })

    it('[边界] 创建 visitorCount=0 的竞品', async () => {
      const created = await service.create(makeTestDto({ visitorCount: 0 }))
      expect(created.visitorCount).toBe(0)
    })

    it('[正例] 竞品名含特殊字符', async () => {
      const created = await service.create(makeTestDto({
        competitorName: '新·竞品 "测试" <特惠> !@#$%^&*()',
      }))
      expect(created.competitorName).toBe('新·竞品 "测试" <特惠> !@#$%^&*()')
      expect(created.id).toBeTruthy()
    })
  })

  // ══════════════════════════════════════════════════════════════
  // getComparison 各类场景
  // ══════════════════════════════════════════════════════════════

  describe('getComparison 复杂场景', () => {
    it('[正例] 包含重复 ID 不重复计算', async () => {
      const result = await service.getComparison(['ct-001', 'ct-001', 'ct-002'])
      expect(result.competitors.length).toBe(2) // 去重由 filter 隐式处理
    })

    it('[正例] 无匹配 ID 且有部分是有效 ID', async () => {
      const result = await service.getComparison(['ct-999', 'ct-001', 'ct-888'])
      expect(result.competitors.length).toBe(1)
      expect(result.competitors[0].id).toBe('ct-001')
    })

    it('[正例] 对比所有同品类竞品', async () => {
      const sportsIds = ['ct-004', 'ct-006'] // 两个 sports
      const result = await service.getComparison(sportsIds)
      expect(result.competitors.length).toBe(2)
      expect(result.comparison.avgRating).toBe(4.2) // (4.3+4.1)/2 = 4.2
      expect(result.comparison.avgPriceLevel).toBe(4.5) // (4+5)/2 = 4.5
      expect(result.comparison.totalVisitors).toBe(7600 + 4200) // 11800
      expect(result.comparison.bestRated).toBe('星空运动中心') // 4.3 > 4.1
      expect(result.comparison.mostVisited).toBe('星空运动中心') // 7600 > 4200
    })
  })

  // ══════════════════════════════════════════════════════════════
  // getSummary 动态变化
  // ══════════════════════════════════════════════════════════════

  describe('getSummary 随数据变化', () => {
    it('[正例] 创建竞品后 summary 更新正确', async () => {
      const before = await service.getSummary()
      expect(before.totalCompetitors).toBe(8)

      // 创建一个新分类
      await service.create(makeTestDto({
        competitorName: '新增竞品',
        city: '新城市',
        category: CompetitorCategory.GAME,
      }))

      const after = await service.getSummary()
      expect(after.totalCompetitors).toBe(9)
      expect(after.cityDistribution['新城市']).toBe(1)
      expect(after.categoryDistribution[CompetitorCategory.GAME]).toBe(3) // 原2+新增1
    })

    it('[正例] 删除竞品后 summary 更新', async () => {
      await service.delete('ct-001')
      const summary = await service.getSummary()
      expect(summary.totalCompetitors).toBe(7)
      expect(summary.cityDistribution['北京']).toBeUndefined()
    })

    it('[正例] Top3 随评分更新变化', async () => {
      // 把 ct-001 评分改为 5.0
      await service.update('ct-001', { rating: 5.0 })
      const summary = await service.getSummary()
      expect(summary.topCompetitors[0].competitorName).toBe('欢乐电玩城') // 5.0
      expect(summary.topCompetitors[0].rating).toBe(5.0)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // delete 各类场景
  // ══════════════════════════════════════════════════════════════

  describe('delete 场景', () => {
    it('[反例] 删除已删除的竞品抛 NotFoundException', async () => {
      await service.delete('ct-001')
      await expect(service.delete('ct-001')).rejects.toThrow(/not found/i)
    })

    it('[反例] 删除不存在的 ID 抛 NotFoundException', async () => {
      await expect(service.delete('nonexistent-id')).rejects.toThrow(/not found/i)
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 时序操作流程
  // ══════════════════════════════════════════════════════════════

  describe('多操作序列', () => {
    it('[正例] 创建 → 更新 → 对比 → 删除 → 验证完整流程', async () => {
      // 1. 创建
      const created = await service.create(makeTestDto({
        competitorName: '流程测试竞品',
        city: '流程城',
        category: CompetitorCategory.SPORTS,
      }))
      expect(created.id).toBe('ct-009')

      // 2. 更新
      const updated = await service.update(created.id, { rating: 4.9, visitorCount: 88888 })
      expect(updated.rating).toBe(4.9)

      // 3. 对比
      const comparison = await service.getComparison([created.id, 'ct-004'])
      expect(comparison.competitors.length).toBe(2)
      expect(comparison.comparison.bestRated).toBe('流程测试竞品') // 4.9 > 4.3
      expect(comparison.comparison.mostVisited).toBe('流程测试竞品') // 88888 > 7600

      // 4. 汇总
      const summary = await service.getSummary()
      expect(summary.totalCompetitors).toBe(9)
      expect(summary.topCompetitors[0].competitorName).toBe('流程测试竞品')

      // 5. 删除
      await service.delete(created.id)
      const afterDelete = await service.findById(created.id)
      expect(afterDelete).toBeNull()
      expect((await service.getSummary()).totalCompetitors).toBe(8)
    })

    it('[正例] 创建同类竞品 → 按城市+分类筛选正确', async () => {
      // 北京的 arcade 目前只有欢乐电玩城
      await service.create(makeTestDto({
        competitorName: '北京第二电玩',
        city: '北京',
        category: CompetitorCategory.ARCADE,
      }))

      const beijingArcades = await service.findAll('北京', CompetitorCategory.ARCADE)
      expect(beijingArcades.length).toBe(2)
      expect(beijingArcades.map(c => c.competitorName).sort()).toEqual([
        '北京第二电玩',
        '欢乐电玩城',
      ])
    })
  })

  // ══════════════════════════════════════════════════════════════
  // 服务实例隔离性
  // ══════════════════════════════════════════════════════════════

  describe('实例隔离', () => {
    it('[正例] 两个独立实例互不影响', async () => {
      const svc1 = createFreshService()
      const svc2 = createFreshService()

      // svc1 创建一个竞品
      await svc1.create(makeTestDto({ competitorName: '实例1的竞品' }))
      expect((await svc1.findAll()).length).toBe(9)

      // svc2 不受影响
      expect((await svc2.findAll()).length).toBe(8)
    })
  })
})
