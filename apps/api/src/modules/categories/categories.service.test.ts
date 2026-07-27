/**
 * 🧪 Categories Service 单元测试 (增强版 25+)
 * 圈梁五道箍
 *
 * 覆盖: CRUD (findAll / findByName / create / update / delete / reset / findByKeyword)
 * 三件套：正例 + 反例 + 边界
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { CategoriesService } from './categories.service'
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'

describe('CategoriesService', () => {
  let service: CategoriesService

  beforeEach(() => {
    service = new CategoriesService()
  })

  // ════════════════════════════════════════════════════
  // findAll
  // ════════════════════════════════════════════════════

  describe('findAll', () => {
    it('[正例] findAll 返回所有 10 个种子分类', () => {
      const result = service.findAll()
      expect(result.length).toBe(10)
    })

    it('[正例] findAll 返回的数组是独立副本（不影响内部状态）', () => {
      const result1 = service.findAll()
      const result2 = service.findAll()
      expect(result1).toEqual(result2)
      expect(result1).not.toBe(result2)
    })

    it('[正例] 每个分类都有 name/description/productCount 属性', () => {
      const result = service.findAll()
      for (const c of result) {
        expect(c).toHaveProperty('name')
        expect(c).toHaveProperty('description')
        expect(c).toHaveProperty('productCount')
      }
    })

    it('[正例] 第一个分类是 餐饮', () => {
      const result = service.findAll()
      expect(result[0].name).toBe('餐饮')
    })
  })

  // ════════════════════════════════════════════════════
  // findByName
  // ════════════════════════════════════════════════════

  describe('findByName', () => {
    it('[正例] 按名称返回正确分类', () => {
      const category = service.findByName('数码')
      expect(category.name).toBe('数码')
      expect(category.description).toContain('电子产品')
    })

    it('[正例] findByName 支持 URL 编码名称', () => {
      const category = service.findByName(encodeURIComponent('数码'))
      expect(category.name).toBe('数码')
    })

    it('[正例] 查到的分类是副本（修改不影响源）', () => {
      const category = service.findByName('数码')
      category.productCount = 999
      const categoryAgain = service.findByName('数码')
      expect(categoryAgain.productCount).not.toBe(999)
    })

    it('[反例] 不存在的分类抛 NotFoundException', () => {
      expect(() => service.findByName('不存在的分类')).toThrow(NotFoundException)
    })

    it('[反例] 空字符串抛 NotFoundException', () => {
      expect(() => service.findByName('')).toThrow(NotFoundException)
    })
  })

  // ════════════════════════════════════════════════════
  // getCategoryStats
  // ════════════════════════════════════════════════════

  describe('getCategoryStats', () => {
    it('[正例] 返回总数和分类名称列表', () => {
      const stats = service.getCategoryStats()
      expect(stats.total).toBe(10)
      expect(stats.categories).toHaveLength(10)
    })

    it('[正例] categories 包含全部预期名称', () => {
      const stats = service.getCategoryStats()
      const expected = ['餐饮', '服装', '数码', '日用品', '娱乐', '饮品', '零食', '文具', '医疗', '其他']
      expect(stats.categories).toEqual(expected)
    })

    it('[正例] 新增分类后 stats 也会更新', () => {
      service.create('新分类', '测试')
      const stats = service.getCategoryStats()
      expect(stats.total).toBe(11)
      expect(stats.categories).toContain('新分类')
    })

    it('[正例] 删除分类后 stats 也会更新', () => {
      service.delete('数码')
      const stats = service.getCategoryStats()
      expect(stats.total).toBe(9)
      expect(stats.categories).not.toContain('数码')
    })
  })

  // ════════════════════════════════════════════════════
  // create
  // ════════════════════════════════════════════════════

  describe('create', () => {
    it('[正例] 创建新分类', () => {
      const cat = service.create('生鲜', '生鲜食品')
      expect(cat.name).toBe('生鲜')
      expect(cat.description).toBe('生鲜食品')
      expect(cat.productCount).toBe(0)
    })

    it('[正例] 创建后可查到', () => {
      service.create('生鲜', '生鲜食品')
      const found = service.findByName('生鲜')
      expect(found.description).toBe('生鲜食品')
    })

    it('[反例] 重复名称抛 ConflictException', () => {
      expect(() => service.create('数码', '重复')).toThrow(ConflictException)
    })

    it('[反例] 重复名称不区分大小写', () => {
      expect(() => service.create('数码', '重复')).toThrow(ConflictException)
      expect(() => service.create('数 码', '带空格')).toThrow(ConflictException)
    })

    it('[反例] 空名称抛 BadRequestException', () => {
      expect(() => service.create('', '空')).toThrow(BadRequestException)
    })

    it('[反例] 纯空格名称抛 BadRequestException', () => {
      expect(() => service.create('   ', '纯空格')).toThrow(BadRequestException)
    })
  })

  // ════════════════════════════════════════════════════
  // update
  // ════════════════════════════════════════════════════

  describe('update', () => {
    it('[正例] 更新分类描述', () => {
      const updated = service.update('数码', { description: '更新描述' })
      expect(updated.description).toBe('更新描述')
    })

    it('[正例] 更新 productCount', () => {
      const updated = service.update('数码', { productCount: 100 })
      expect(updated.productCount).toBe(100)
    })

    it('[正例] 同时更新多个字段', () => {
      const updated = service.update('数码', { description: '新描述', productCount: 50 })
      expect(updated.description).toBe('新描述')
      expect(updated.productCount).toBe(50)
    })

    it('[正例] 更新后内部状态已改变', () => {
      service.update('数码', { productCount: 200 })
      const found = service.findByName('数码')
      expect(found.productCount).toBe(200)
    })

    it('[反例] 不存在的分类抛 NotFoundException', () => {
      expect(() => service.update('不存在', { description: 'test' })).toThrow(NotFoundException)
    })
  })

  // ════════════════════════════════════════════════════
  // delete
  // ════════════════════════════════════════════════════

  describe('delete', () => {
    it('[正例] 删除后 findAll 数量减少', () => {
      service.delete('数码')
      expect(service.findAll()).toHaveLength(9)
    })

    it('[正例] 删除后 findByName 抛 NotFoundException', () => {
      service.delete('数码')
      expect(() => service.findByName('数码')).toThrow(NotFoundException)
    })

    it('[反例] 删除不存在的分类抛 NotFoundException', () => {
      expect(() => service.delete('不存在')).toThrow(NotFoundException)
    })
  })

  // ════════════════════════════════════════════════════
  // findByKeyword
  // ════════════════════════════════════════════════════

  describe('findByKeyword', () => {
    it('[正例] 按名称关键词查找', () => {
      const results = service.findByKeyword('数码')
      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results[0].name).toContain('数码')
    })

    it('[正例] 按描述关键词查找', () => {
      const results = service.findByKeyword('电子产品')
      expect(results.length).toBeGreaterThanOrEqual(1)
      expect(results.some(c => c.name === '数码')).toBe(true)
    })

    it('[正例] 空关键词返回空数组', () => {
      expect(service.findByKeyword('')).toHaveLength(0)
    })

    it('[正例] 空格关键词返回空数组', () => {
      expect(service.findByKeyword('   ')).toHaveLength(0)
    })
  })

  // ════════════════════════════════════════════════════
  // reset
  // ════════════════════════════════════════════════════

  describe('reset', () => {
    it('[正例] reset 后恢复为 10 个种子分类', () => {
      service.create('临时', '临时')
      service.delete('数码')
      expect(service.findAll()).toHaveLength(10) // 10-1+1=10
      service.reset()
      expect(service.findAll()).toHaveLength(10)
      expect(service.findByName('数码').name).toBe('数码')
      expect(() => service.findByName('临时')).toThrow(NotFoundException)
    })

    it('[正例] reset 后分类名称列表恢复默认', () => {
      service.create('测试', '测试')
      service.reset()
      const names = service.getCategoryStats().categories
      expect(names).toEqual(['餐饮', '服装', '数码', '日用品', '娱乐', '饮品', '零食', '文具', '医疗', '其他'])
    })
  })
})
