/**
 * competitor-track.service.spec.ts — 竞品跟踪服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - findAll (无筛选/按城市/按分类/最低评分)
 *   - findById (存在/不存在)
 *   - getSummary
 *   - create
 *   - getComparison (正常/无匹配)
 *   - update (存在/不存在)
 *   - delete (存在/不存在)
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CompetitorTrackService } from './competitor-track.service'

describe('CompetitorTrackService', () => {
  let service: CompetitorTrackService

  beforeEach(() => {
    service = new CompetitorTrackService()
  })

  // ── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('正例: 无筛选应返回所有竞品', async () => {
      const list = await service.findAll()
      expect(list.length).toBe(8)
    })

    it('正例: 按城市筛选', async () => {
      const list = await service.findAll('北京')
      expect(list.length).toBeGreaterThan(0)
      list.forEach(c => expect(c.city).toBe('北京'))
    })

    it('正例: 按分类筛选', async () => {
      const list = await service.findAll(undefined, 'ARCADE')
      list.forEach(c => expect(c.category).toBe('ARCADE'))
    })

    it('正例: 按最低评分筛选', async () => {
      const list = await service.findAll(undefined, undefined, 4.5)
      list.forEach(c => expect(c.rating).toBeGreaterThanOrEqual(4.5))
    })

    it('边缘: 组合筛选无结果应返回空数组', async () => {
      const list = await service.findAll('不存在的城市')
      expect(list).toEqual([])
    })
  })

  // ── findById ─────────────────────────────────────────────────────────────

  describe('findById', () => {
    it('正例: 按 ID 查找应返回竞品', async () => {
      const comp = await service.findById('ct-001')
      expect(comp).toBeTruthy()
      expect(comp!.competitorName).toBe('欢乐电玩城')
    })

    it('异常: 不存在的 ID 应返回 null', async () => {
      const comp = await service.findById('nonexistent')
      expect(comp).toBeNull()
    })
  })

  // ── getSummary ───────────────────────────────────────────────────────────

  describe('getSummary', () => {
    it('正例: 应返回汇总统计', async () => {
      const summary = await service.getSummary()
      expect(summary.totalCompetitors).toBe(8)
      expect(summary.avgRating).toBeGreaterThan(0)
      expect(summary.avgPriceLevel).toBeGreaterThan(0)
      expect(summary.topCompetitors).toHaveLength(3)
      expect(Object.keys(summary.categoryDistribution).length).toBeGreaterThan(0)
      expect(Object.keys(summary.cityDistribution).length).toBeGreaterThan(0)
    })
  })

  // ── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('正例: 创建新竞品', async () => {
      const comp = await service.create({
        competitorName: '新竞品', city: '上海', category: 'ARCADE',
        priceLevel: 3, rating: 4.0, visitorCount: 5000,
        advantage: '新开业的优势', weakness: '品牌知名度不足',
      })
      expect(comp.id).toBeTruthy()
      expect(comp.competitorName).toBe('新竞品')
    })
  })

  // ── getComparison ────────────────────────────────────────────────────────

  describe('getComparison', () => {
    it('正例: 应返回竞品对比分析', async () => {
      const result = await service.getComparison(['ct-001', 'ct-002'])
      expect(result.competitors).toHaveLength(2)
      expect(result.comparison.avgRating).toBeGreaterThan(0)
      expect(result.comparison.bestRated).toBeTruthy()
      expect(result.comparison.mostVisited).toBeTruthy()
    })

    it('边缘: 空 ID 列表应返回空结果', async () => {
      const result = await service.getComparison([])
      expect(result.competitors).toEqual([])
      expect(result.comparison.avgRating).toBe(0)
    })
  })

  // ── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('正例: 更新竞品信息', async () => {
      const updated = await service.update('ct-001', { rating: 4.5, priceLevel: 4 })
      expect(updated.rating).toBe(4.5)
      expect(updated.priceLevel).toBe(4)
    })

    it('异常: 更新不存在的竞品应抛 NotFoundException', async () => {
      await expect(service.update('nonexistent', { rating: 5 })).rejects.toThrow()
    })
  })

  // ── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('正例: 删除竞品后不应再查到', async () => {
      await service.delete('ct-001')
      const comp = await service.findById('ct-001')
      expect(comp).toBeNull()
    })

    it('异常: 删除不存在的竞品应抛 NotFoundException', async () => {
      await expect(service.delete('nonexistent')).rejects.toThrow()
    })
  })
})
