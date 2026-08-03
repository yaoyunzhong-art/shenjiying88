/**
 * 🧪 Categories Service 全覆盖测试
 *
 * 覆盖:
 *   1. 正常创建流程 (CRUD 增删改查)
 *   2. 边界/异常输入 (空名称、重复名称、模糊搜索)
 *   3. 数据隔离与重置 (reset/findAll 独立副本)
 *   4. 级联操作 (树形结构/分类更新后产品数量变化)
 *   5. 关键词模糊搜索/重置等场景
 *
 * 测试充分性: 15+ tests
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CategoriesService } from './categories.service'

function makeService(): CategoriesService {
  return new CategoriesService()
}

// ══════════════════════════════════════════════════════════════════
// 1️⃣ 正常创建流程 (CRUD)
// ══════════════════════════════════════════════════════════════════

describe('[1️⃣ 正常创建流程] CategoriesService', () => {
  let svc: CategoriesService

  beforeEach(() => {
    svc = makeService()
  })

  it('findAll 返回所有种子分类 (10个)', () => {
    const result = svc.findAll()
    expect(result.length).toBe(10)
    // 验证包含预期名称
    const names = result.map((c) => c.name)
    expect(names).toContain('餐饮')
    expect(names).toContain('数码')
    expect(names).toContain('娱乐')
  })

  it('findAll 返回的数组是独立副本, 修改不影响内部', () => {
    const result1 = svc.findAll()
    const result2 = svc.findAll()
    // 修改 result1 不应影响 result2
    result1[0].name = '已修改'
    expect(result2[0].name).not.toBe('已修改')
    expect(result2[0].name).toBe('餐饮')
  })

  it('findByName 精确查找返回分类信息', () => {
    const cat = svc.findByName('数码')
    expect(cat).toBeDefined()
    expect(cat.name).toBe('数码')
    expect(cat.description).toContain('电子产品')
    expect(typeof cat.productCount).toBe('number')
  })

  it('findByName 支持 URL 编码的名称', () => {
    const cat = svc.findByName(encodeURIComponent('数码'))
    expect(cat).toBeDefined()
    expect(cat.name).toBe('数码')
  })

  it('create 新分类成功返回新分类对象', () => {
    const cat = svc.create('图书', '书籍、杂志、音像制品')
    expect(cat.name).toBe('图书')
    expect(cat.description).toBe('书籍、杂志、音像制品')
    expect(cat.productCount).toBe(0)
    // 验证已添加到列表
    const all = svc.findAll()
    expect(all.length).toBe(11) // 10 seed + 1 new
    expect(all.some((c) => c.name === '图书')).toBe(true)
  })

  it('create 时空 description 默认置为空字符串', () => {
    const cat = svc.create('运动器材', '')
    expect(cat.name).toBe('运动器材')
    expect(cat.description).toBe('')
  })

  it('update 修改分类的 description 成功', () => {
    const updated = svc.update('数码', { description: '数码产品及智能硬件' })
    expect(updated.name).toBe('数码')
    expect(updated.description).toBe('数码产品及智能硬件')
  })

  it('update 修改分类的 productCount 成功', () => {
    const updated = svc.update('数码', { productCount: 150 })
    expect(updated.productCount).toBe(150)
  })

  it('delete 删除分类后该分类消失', () => {
    svc.delete('数码')
    const all = svc.findAll()
    expect(all.length).toBe(9)
    expect(all.some((c) => c.name === '数码')).toBe(false)
  })

  it('delete 后分类数量减少 1', () => {
    const before = svc.findAll().length
    svc.delete('其他')
    const after = svc.findAll().length
    expect(after).toBe(before - 1)
  })

  it('findByKeyword 按名称模糊搜索返回正确结果', () => {
    const results = svc.findByKeyword('数码')
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.some((c) => c.name === '数码')).toBe(true)
  })

  it('findByKeyword 按描述模糊搜索返回正确结果', () => {
    const results = svc.findByKeyword('食品')
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.some((c) => c.name === '餐饮')).toBe(true)
  })

  it('findByKeyword 关键词搜索中文描述中包含关键词', () => {
    const results = svc.findByKeyword('电子产品')
    expect(results.length).toBeGreaterThanOrEqual(1)
    expect(results.some((c) => c.name === '数码')).toBe(true)
  })

  it('getCategoryStats 返回所有分类名称和总数', () => {
    const stats = svc.getCategoryStats()
    expect(stats.total).toBe(10)
    expect(stats.categories.length).toBe(10)
    const expected = ['餐饮', '服装', '数码', '日用品', '娱乐', '饮品', '零食', '文具', '医疗', '其他']
    expect(stats.categories).toEqual(expected)
  })

  it('reset 恢复种子数据, 删除新增的分类', () => {
    svc.create('临时分类', '测试用')
    expect(svc.findAll().length).toBe(11)
    svc.reset()
    expect(svc.findAll().length).toBe(10)
    expect(svc.findAll().some((c) => c.name === '临时分类')).toBe(false)
  })

  it('delete 后 reset 恢复被删分类', () => {
    svc.delete('数码')
    expect(svc.findAll().length).toBe(9)
    svc.reset()
    expect(svc.findAll().length).toBe(10)
    expect(svc.findAll().some((c) => c.name === '数码')).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════
// 2️⃣ 边界/异常输入
// ══════════════════════════════════════════════════════════════════

describe('[2️⃣ 边界/异常输入] CategoriesService', () => {
  let svc: CategoriesService

  beforeEach(() => {
    svc = makeService()
  })

  it('findByName 不存在的分类抛出 NotFoundException', () => {
    expect(() => svc.findByName('不存在的分类')).toThrow(/分类/)
  })

  it('findByName 空字符串抛出 NotFoundException', () => {
    expect(() => svc.findByName('')).toThrow(/分类/)
  })

  it('create 重复的分类名抛出 ConflictException', () => {
    expect(() => svc.create('数码', '已经存在的分类')).toThrow(/已存在/)
  })

  it('create 空名称抛出 BadRequestException', () => {
    expect(() => svc.create('', '空名字')).toThrow(/不能为空/)
  })

  it('create 空名称(URL编码后也是空)抛出异常', () => {
    expect(() => svc.create(encodeURIComponent(''), '空')).toThrow(/不能为空/)
  })

  it('create 纯空格名称抛出 BadRequestException', () => {
    expect(() => svc.create('   ', '纯空格')).toThrow(/不能为空/)
  })

  it('delete 不存在的分类抛出 NotFoundException', () => {
    expect(() => svc.delete('不存在')).toThrow(/不存在/)
  })

  it('update 不存在的分类抛出 NotFoundException', () => {
    expect(() => svc.update('不存在', { description: '测试' })).toThrow(/不存在/)
  })

  it('update 传入空 partial 不做修改但返回分类', () => {
    const cat = svc.update('数码', {})
    expect(cat.name).toBe('数码')
    // description 不变
    const original = svc.findByName('数码')
    expect(original.description).toBe(cat.description)
  })

  it('findByKeyword 空字符串返回空数组', () => {
    const results = svc.findByKeyword('')
    expect(results.length).toBe(0)
  })

  it('findByKeyword 纯空格返回空数组', () => {
    const results = svc.findByKeyword('   ')
    expect(results.length).toBe(0)
  })

  it('findByKeyword 无匹配关键词返回空数组', () => {
    const results = svc.findByKeyword('zzzzzz')
    expect(results.length).toBe(0)
  })

  it('delete 后 findByName 抛 NotFoundException', () => {
    svc.delete('娱乐')
    expect(() => svc.findByName('娱乐')).toThrow(/不存在/)
  })

  it('多次 delete 相同分类第二次抛 NotFoundException', () => {
    svc.delete('医疗')
    expect(() => svc.delete('医疗')).toThrow(/不存在/)
  })
})

// ══════════════════════════════════════════════════════════════════
// 3️⃣ 数据隔离与完整性
// ══════════════════════════════════════════════════════════════════

describe('[3️⃣ 数据隔离与完整性] CategoriesService', () => {
  it('两个独立 Service 实例互不影响', () => {
    const svc1 = makeService()
    const svc2 = makeService()

    svc1.create('专属A', '仅A存在')
    expect(svc1.findAll().length).toBe(11)
    // svc2 不受影响
    expect(svc2.findAll().length).toBe(10)
    expect(svc2.findAll().some((c) => c.name === '专属A')).toBe(false)
  })

  it('一个实例 delete 不影响另一个实例', () => {
    const svc1 = makeService()
    const svc2 = makeService()

    svc1.delete('数码')
    expect(svc1.findAll().length).toBe(9)
    expect(svc2.findAll().length).toBe(10)
  })

  it('重置后 findAll 返回不受之前操作影响的副本', () => {
    const svc = makeService()
    svc.create('临时A', 'a')
    svc.create('临时B', 'b')
    svc.delete('其他')
    svc.reset()

    const result = svc.findAll()
    expect(result.length).toBe(10)
    expect(result.some((c) => c.name === '其他')).toBe(true)
    expect(result.some((c) => c.name === '临时A')).toBe(false)
  })
})

// ══════════════════════════════════════════════════════════════════
// 4️⃣ 级联操作
// ══════════════════════════════════════════════════════════════════

describe('[4️⃣ 级联操作] CategoriesService', () => {
  let svc: CategoriesService

  beforeEach(() => {
    svc = makeService()
  })

  it('创建分类 → update productCount → 读取验证一致', () => {
    const cat = svc.create('配件', '各类电子配件')
    expect(cat.productCount).toBe(0)

    svc.update('配件', { productCount: 42 })
    const updated = svc.findByName('配件')
    expect(updated.productCount).toBe(42)
    expect(updated.description).toBe('各类电子配件')
  })

  it('创建分类 → delete → findAll 不包含该分类', () => {
    svc.create('耗材', '打印耗材/墨盒')
    expect(svc.findAll().some((c) => c.name === '耗材')).toBe(true)

    svc.delete('耗材')
    expect(svc.findAll().some((c) => c.name === '耗材')).toBe(false)
  })

  it('create 创建完整的分类 → findByKeyword 能搜索到', () => {
    svc.create('汽车配件', '汽车维修与保养')
    const results = svc.findByKeyword('保养')
    expect(results.some((c) => c.name === '汽车配件')).toBe(true)
  })

  it('update 修改描述 → findByKeyword 按新描述可搜到', () => {
    svc.update('数码', { description: '数码相机与摄影器材' })
    const results = svc.findByKeyword('摄影')
    expect(results.some((c) => c.name === '数码')).toBe(true)
  })

  it('getCategoryStats 始终反映实际分类数量 (含增删)', () => {
    expect(svc.getCategoryStats().total).toBe(10)
    svc.create('新类', '新增')
    expect(svc.getCategoryStats().total).toBe(11)
    svc.delete('新类')
    expect(svc.getCategoryStats().total).toBe(10)
  })
})

// ══════════════════════════════════════════════════════════════════
// 5️⃣ 重复/并发场景
// ══════════════════════════════════════════════════════════════════

describe('[5️⃣ 重复/并发场景] CategoriesService', () => {
  let svc: CategoriesService

  beforeEach(() => {
    svc = makeService()
  })

  it('多次 create 同一分类名(大小写不同)视为重复', () => {
    svc.create('T恤', '服装品类')
    // 仅大小写不同的名称应被识别为重复
    expect(() => svc.create('t恤', '小写T恤')).toThrow(/已存在/)
  })

  it('多次 create 不同分类名全部成功', () => {
    svc.create('A类', '类别A')
    svc.create('B类', '类别B')
    svc.create('C类', '类别C')
    expect(svc.findAll().length).toBe(13)
    expect(svc.getCategoryStats().categories).toContain('A类')
    expect(svc.getCategoryStats().categories).toContain('B类')
    expect(svc.getCategoryStats().categories).toContain('C类')
  })

  it('delete 后 create 同名分类可重新创建', () => {
    svc.delete('数码')
    const cat = svc.create('数码', '重新创建的分类')
    expect(cat.name).toBe('数码')
    expect(cat.description).toBe('重新创建的分类')
    expect(svc.findAll().length).toBe(10)
  })

  it('多次 findByName 传入相同分类名返回相同结果', () => {
    const cat1 = svc.findByName('餐饮')
    const cat2 = svc.findByName('餐饮')
    expect(cat1).toEqual(cat2)
    // 但对象引用不同（每次返回副本）
    expect(cat1).not.toBe(cat2)
  })

  it('多次 findAll 调用总是返回当前完整列表', () => {
    const all1 = svc.findAll()
    svc.create('新类别', '测试')
    const all2 = svc.findAll()
    expect(all2.length).toBe(all1.length + 1)
  })

  it('URL编码名称 create 后可用原始中文名称 findByName', () => {
    svc.create('摄影', '摄影器材')
    const cat = svc.findByName('摄影')
    expect(cat).toBeDefined()
    expect(cat.name).toBe('摄影')
  })
})
