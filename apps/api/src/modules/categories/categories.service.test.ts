/**
 * categories.service.spec.ts — 商品分类服务 V23 全覆盖测试
 *
 * 覆盖:
 *   - findAll / findByName / getCategoryStats
 *   - create / delete / update / findByKeyword
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CategoriesService } from './categories.service'

describe('CategoriesService', () => {
  let service: CategoriesService

  beforeEach(() => {
    service = new CategoriesService()
    service.reset()
  })

  // ── findAll ──────────────────────────────────────────────────────────────

  describe('findAll', () => {
    it('正例: 应返回种子分类列表', () => {
      const list = service.findAll()
      expect(list.length).toBeGreaterThan(0)
      expect(list[0].name).toBeTruthy()
    })
  })

  // ── findByName ───────────────────────────────────────────────────────────

  describe('findByName', () => {
    it('正例: 按名称查找应返回匹配分类', () => {
      const cat = service.findByName('饮品')
      expect(cat.name).toBe('饮品')
    })

    it('异常: 不存在的名称应抛 NotFoundException', () => {
      expect(() => service.findByName('不存在的分类')).toThrow()
    })
  })

  // ── getCategoryStats ─────────────────────────────────────────────────────

  describe('getCategoryStats', () => {
    it('正例: 应返回统计信息', () => {
      const stats = service.getCategoryStats()
      expect(stats.total).toBeGreaterThan(0)
      expect(stats.categories.length).toBe(stats.total)
    })

    it('正例: 创建新分类后统计应更新', () => {
      const before = service.getCategoryStats().total
      service.create('新品区', '新品测试分类')
      expect(service.getCategoryStats().total).toBe(before + 1)
    })
  })

  // ── create ───────────────────────────────────────────────────────────────

  describe('create', () => {
    it('正例: 创建新分类应成功', () => {
      const cat = service.create('测试分类', '这是一个测试分类')
      expect(cat.name).toBe('测试分类')
      expect(cat.description).toBe('这是一个测试分类')
      expect(cat.productCount).toBe(0)
    })

    it('异常: 空名称应抛 BadRequestException', () => {
      expect(() => service.create('', '空名称')).toThrow()
    })

    it('异常: 重复名称应抛 ConflictException', () => {
      service.create('重复名称', 'desc')
      expect(() => service.create('重复名称', 'desc')).toThrow()
    })
  })

  // ── delete ───────────────────────────────────────────────────────────────

  describe('delete', () => {
    it('正例: 删除已存在的分类', () => {
      service.create('待删除', 'desc')
      service.delete('待删除')
      expect(() => service.findByName('待删除')).toThrow()
    })

    it('异常: 删除不存在的分类应抛 NotFoundException', () => {
      expect(() => service.delete('不存在的分类')).toThrow()
    })
  })

  // ── update ───────────────────────────────────────────────────────────────

  describe('update', () => {
    it('正例: 更新分类信息', () => {
      service.create('旧名', '旧描述')
      const updated = service.update('旧名', { description: '新描述', productCount: 10 })
      expect(updated.description).toBe('新描述')
      expect(updated.productCount).toBe(10)
    })

    it('异常: 更新不存在的分类应抛 NotFoundException', () => {
      expect(() => service.update('不存在的', { description: 'test' })).toThrow()
    })
  })

  // ── findByKeyword ────────────────────────────────────────────────────────

  describe('findByKeyword', () => {
    it('正例: 关键词搜索应返回匹配分类', () => {
      const results = service.findByKeyword('饮品')
      expect(results.length).toBeGreaterThan(0)
    })

    it('边缘: 空关键词应返回空数组', () => {
      expect(service.findByKeyword('')).toEqual([])
    })

    it('边缘: 无匹配关键词应返回空数组', () => {
      expect(service.findByKeyword('zzznotfound')).toEqual([])
    })
  })
})
