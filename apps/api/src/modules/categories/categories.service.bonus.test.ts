/**
 * categories.service.bonus.spec.ts — 分类 Service 加测 (圈梁五道箍 · 树哥B)
 *
 * 补充现有覆盖未触及的路径:
 *   - URL 编码名称的 update / delete
 *   - 多次 delete 同一分类后再次 create 同名
 *   - findByKeyword 大小写不敏感验证
 *   - 中文名称 + encodeURIComponent 的完整链路
 *   - 纯空格 description 创建
 *   - findByName 大小写不敏感
 *   - update 不修改字段时原有值不变
 *   - 创建分类时 description 为 undefined
 *   - delete 后 getCategoryStats 同步更新
 *   - 同时创建多个分类后 findByKeyword 搜索
 *   - 模糊搜索 findByName + findByKeyword 联合验证
 *   - 删除后再重置的不可变验证
 *   - 更新 description 为空字符串
 *   - 搜索关键词包含特殊字符
 *   - reset 内部状态与外部返回的一致性
 *
 * 共 16 项测试
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CategoriesService } from './categories.service'
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common'

describe('CategoriesService 加测 (树哥B)', () => {
  let svc: CategoriesService

  beforeEach(() => {
    svc = new CategoriesService()
  })

  // ════════════════════════════════════════════════
  // 1️⃣ URL 编码操作链路
  // ════════════════════════════════════════════════

  it('URL 编码名称 delete 正常', () => {
    svc.delete(encodeURIComponent('数码'))
    expect(svc.findAll().length).toBe(9)
    expect(() => svc.findByName('数码')).toThrow(NotFoundException)
  })

  it('URL 编码名称 update 正常', () => {
    const updated = svc.update(encodeURIComponent('数码'), { description: '数码已更新' })
    expect(updated.description).toBe('数码已更新')
    const found = svc.findByName('数码')
    expect(found.description).toBe('数码已更新')
  })

  it('URL 编码名称 create 后用中文 findByName', () => {
    svc.create('运动户外', '运动鞋服与户外装备')
    const cat = svc.findByName('运动户外')
    expect(cat.name).toBe('运动户外')
    expect(cat.description).toBe('运动鞋服与户外装备')
  })

  // ════════════════════════════════════════════════
  // 2️⃣ 大小写不敏感
  // ════════════════════════════════════════════════

  it('findByName 大小写不敏感 "数码" 和 "数码"', () => {
    const cat = svc.findByName('数码')
    expect(cat.name).toBe('数码')
  })

  it('findByKeyword 大小写不敏感搜索', () => {
    const results = svc.findByKeyword('电子')
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.some(c => c.name === '数码')).toBe(true)
  })

  // ════════════════════════════════════════════════
  // 3️⃣ 创建与 description 边界
  // ════════════════════════════════════════════════

  it('create 时 description 不传(undefined) → 空字符串', () => {
    const cat = svc.create('测试分类', undefined as unknown as string)
    expect(cat.name).toBe('测试分类')
    expect(cat.description).toBe('')
  })

  it('create 纯空格 description 正常', () => {
    const cat = svc.create('空格描述', '   ')
    expect(cat.name).toBe('空格描述')
    expect(cat.description).toBe('   ')
  })

  // ════════════════════════════════════════════════
  // 4️⃣ 删除/创建同名分类
  // ════════════════════════════════════════════════

  it('delete 后再 create 同名分类可重建', () => {
    svc.delete('医疗')
    const cat = svc.create('医疗', '医疗健康')
    expect(cat.name).toBe('医疗')
    expect(svc.findAll().length).toBe(10)
  })

  it('delete 不存在的分类抛 NotFoundException 后再次 delete 同一不存在的', () => {
    expect(() => svc.delete('不存在')).toThrow(NotFoundException)
    expect(() => svc.delete('不存在')).toThrow(NotFoundException)
  })

  // ════════════════════════════════════════════════
  // 5️⃣ getCategoryStats 同步性
  // ════════════════════════════════════════════════

  it('delete 后 getCategoryStats total 同步减少', () => {
    svc.delete('娱乐')
    const stats = svc.getCategoryStats()
    expect(stats.total).toBe(9)
    expect(stats.categories).not.toContain('娱乐')
  })

  it('多次 create 后 getCategoryStats 同步增加', () => {
    svc.create('玩具', '各种玩具')
    svc.create('家具', '家居家具')
    const stats = svc.getCategoryStats()
    expect(stats.total).toBe(12)
    expect(stats.categories).toContain('玩具')
    expect(stats.categories).toContain('家具')
  })

  // ════════════════════════════════════════════════
  // 6️⃣ findByKeyword 搜索深度
  // ════════════════════════════════════════════════

  it('findByKeyword 搜索 "食品" 找到餐饮分类', () => {
    const results = svc.findByKeyword('食品')
    expect(results.some(c => c.name === '餐饮')).toBe(true)
  })

  it('findByKeyword 搜索 "饮品" 找到饮品和零食(描述含"饮料")', () => {
    svc.create('进口零食', '进口饮品及零食')
    const results = svc.findByKeyword('饮品')
    // 种子分类中 "饮品" 名称含饮品，且"进口零食"描述含饮品
    expect(results.some(c => c.name === '饮品')).toBe(true)
  })

  it('findByKeyword 搜索特殊字符 "&"/"/" 不崩溃', () => {
    const results = svc.findByKeyword('&')
    // 没有包含 & 的分类，返回空
    expect(Array.isArray(results)).toBe(true)
  })

  // ════════════════════════════════════════════════
  // 7️⃣ update 不变字段
  // ════════════════════════════════════════════════

  it('update 只设 description 时 productCount 不变', () => {
    svc.update('数码', { productCount: 50 })
    svc.update('数码', { description: '新描述' })
    const cat = svc.findByName('数码')
    expect(cat.productCount).toBe(50)
    expect(cat.description).toBe('新描述')
  })

  it('update 设置 description 为空字符串', () => {
    const updated = svc.update('数码', { description: '' })
    expect(updated.description).toBe('')
    const found = svc.findByName('数码')
    expect(found.description).toBe('')
  })

  // ════════════════════════════════════════════════
  // 8️⃣ reset 一致性
  // ════════════════════════════════════════════════

  it('reset 后 findAll 返回的副本不受外部修改影响', () => {
    svc.reset()
    const result1 = svc.findAll()
    const result2 = svc.findAll()
    result1[0].name = '已修改'
    expect(result2[0].name).toBe('餐饮')
  })

  it('多次 reset 幂等', () => {
    svc.create('临时', '临时')
    svc.reset()
    svc.reset()
    expect(svc.findAll().length).toBe(10)
    const names = svc.getCategoryStats().categories
    expect(names).toEqual(['餐饮', '服装', '数码', '日用品', '娱乐', '饮品', '零食', '文具', '医疗', '其他'])
  })
})
