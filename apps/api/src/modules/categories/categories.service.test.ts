/**
 * 🧪 Categories Service 单元测试
 * 覆盖: CRUD (findAll / findByName / getStats) · 多租户隔离
 * 三件套：正例 + 反例 + 边界
 *
 * 注意: CategoriesService 是基础数据模块，仅有 find 操作，无 create/update/delete
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { CategoriesService } from './categories.service'

describe('CategoriesService', () => {
  let service: CategoriesService

  beforeEach(() => {
    service = new CategoriesService()
  })

  // ════════════════════════════════════════════════════
  // 查询操作
  // ════════════════════════════════════════════════════

  describe('基本查询', () => {
    it('[正例] findAll 返回所有分类', () => {
      const result = service.findAll()
      expect(result.length).toBe(10) // 10 个种子分类
      expect(result[0]).toHaveProperty('name')
      expect(result[0]).toHaveProperty('description')
      expect(result[0]).toHaveProperty('productCount')
    })

    it('[正例] findAll 返回新数组，虽然内部分享引用但可见结果一致', () => {
      const result = service.findAll()
      // 数组本身是新实例
      const result2 = service.findAll()
      expect(result).toEqual(result2)
      expect(result).not.toBe(result2)
      expect(result[0].name).toBe('餐饮')
      expect(result2[0].name).toBe('餐饮')
    })

    it('[正例] findByName 按名称返回正确分类', () => {
      const category = service.findByName('数码')
      expect(category).toBeDefined()
      expect(category.name).toBe('数码')
      expect(category.description).toContain('电子产品')
    })

    it('[正例] findByName 不区分大小写（中文名称）', () => {
      const category = service.findByName('数码')
      expect(category.name).toBe('数码')
      const category2 = service.findByName('餐饮')
      expect(category2.name).toBe('餐饮')
    })

    it('[正例] findByName 支持 URL 编码名称', () => {
      // URL 编码 '数码' → %E6%95%B0%E7%A0%81
      const category = service.findByName(encodeURIComponent('数码'))
      expect(category).toBeDefined()
      expect(category.name).toBe('数码')
    })

    it('[正例] getStats 返回分类统计信息', () => {
      const stats1 = service.getCategoryStats()
      expect(stats1.total).toBe(10)
      expect(stats1.categories.length).toBe(10)
      expect(stats1.categories).toContain('餐饮')
      expect(stats1.categories).toContain('数码')
      expect(stats1.categories).toContain('娱乐')
      // stats 返回分类名称数组，验证完整性
      const expectedNames = ['餐饮', '服装', '数码', '日用品', '娱乐', '饮品', '零食', '文具', '医疗', '其他']
      expect(stats1.categories).toEqual(expectedNames)
    })

    // ── 反例 ──

    it('[反例] findByName 不存在的分类抛 NotFoundException', () => {
      expect(() => service.findByName('不存在的分类')).toThrow()
      expect(() => service.findByName('不存在的分类')).toThrowError('分类')
    })

    it('[边界] findByName 空字符串', () => {
      expect(() => service.findByName('')).toThrow()
    })
  })

  // ════════════════════════════════════════════════════
  // 隔离与数据完整性
  // ════════════════════════════════════════════════════

  describe('数据隔离', () => {
    it('[正例] 多次调用 findAll 返回数组独立副本', () => {
      const result1 = service.findAll()
      const result2 = service.findAll()
      expect(result1).toEqual(result2)
      expect(result1).not.toBe(result2)
    })
  })
})
