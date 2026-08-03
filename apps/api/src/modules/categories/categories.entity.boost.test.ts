/**
 * categories.entity.boost.test.ts — 商品分类 Entity 层增强测试
 *
 * 圈梁五道箍
 *
 * 覆盖:
 *   1️⃣ Category 接口构造验证
 *   2️⃣ CategoryErrorCode 枚举覆盖
 *   3️⃣ CategoryError 类验证
 *   4️⃣ SEED_CATEGORIES 数据完整性
 */

import { describe, it, expect } from 'vitest'
import { CategoryErrorCode, CategoryError, SEED_CATEGORIES } from './categories.entity'
import type { Category } from './categories.entity'

// ══════════════════════════════════════════════════════════════════
// 1️⃣ Category 接口构造验证 (4+)
// ══════════════════════════════════════════════════════════════════

describe('[1️⃣ Category 接口构造验证]', () => {
  it('应能构造一个完整的 Category', () => {
    const cat: Category = {
      name: '测试分类',
      description: '测试描述',
      productCount: 0,
    }
    expect(cat.name).toBe('测试分类')
    expect(cat.description).toBe('测试描述')
    expect(cat.productCount).toBe(0)
  })

  it('productCount 可为任意非负整数', () => {
    const cat: Category = {
      name: '热门分类',
      description: '商品很多',
      productCount: 9999,
    }
    expect(cat.productCount).toBe(9999)
  })

  it('description 可为空字符串', () => {
    const cat: Category = {
      name: '分类',
      description: '',
      productCount: 0,
    }
    expect(cat.description).toBe('')
  })

  it('name 和 description 的类型应正确', () => {
    const cat: Category = {
      name: '测试',
      description: '描述',
      productCount: 1,
    }
    expect(typeof cat.name).toBe('string')
    expect(typeof cat.description).toBe('string')
    expect(typeof cat.productCount).toBe('number')
  })
})

// ══════════════════════════════════════════════════════════════════
// 2️⃣ CategoryErrorCode 枚举覆盖 (3+)
// ══════════════════════════════════════════════════════════════════

describe('[2️⃣ CategoryErrorCode 枚举]', () => {
  it('NOT_FOUND 值应为 CATEGORY_NOT_FOUND', () => {
    expect(CategoryErrorCode.NOT_FOUND).toBe('CATEGORY_NOT_FOUND')
  })

  it('DUPLICATE 值应为 CATEGORY_DUPLICATE', () => {
    expect(CategoryErrorCode.DUPLICATE).toBe('CATEGORY_DUPLICATE')
  })

  it('INVALID_NAME 值应为 CATEGORY_INVALID_NAME', () => {
    expect(CategoryErrorCode.INVALID_NAME).toBe('CATEGORY_INVALID_NAME')
  })

  it('枚举数量固定为 3', () => {
    expect(Object.keys(CategoryErrorCode).length).toBe(3)
  })
})

// ══════════════════════════════════════════════════════════════════
// 3️⃣ CategoryError 类验证 (3+)
// ══════════════════════════════════════════════════════════════════

describe('[3️⃣ CategoryError 类]', () => {
  it('应能构造 CategoryError', () => {
    const err = new CategoryError(CategoryErrorCode.NOT_FOUND, '分类不存在')
    expect(err.code).toBe('CATEGORY_NOT_FOUND')
    expect(err.message).toBe('分类不存在')
    expect(err.name).toBe('CategoryError')
    expect(err).toBeInstanceOf(Error)
  })

  it('DUPLICATE 错误', () => {
    const err = new CategoryError(CategoryErrorCode.DUPLICATE, '分类已存在')
    expect(err.code).toBe('CATEGORY_DUPLICATE')
  })

  it('INVALID_NAME 错误', () => {
    const err = new CategoryError(CategoryErrorCode.INVALID_NAME, '名称无效')
    expect(err.code).toBe('CATEGORY_INVALID_NAME')
  })
})

// ══════════════════════════════════════════════════════════════════
// 4️⃣ SEED_CATEGORIES 数据完整性 (6+)
// ══════════════════════════════════════════════════════════════════

describe('[4️⃣ SEED_CATEGORIES 数据完整性]', () => {
  it('应有 10 个种子分类', () => {
    expect(SEED_CATEGORIES).toHaveLength(10)
  })

  it('所有分类的 productCount 初始为 0', () => {
    for (const c of SEED_CATEGORIES) {
      expect(c.productCount).toBe(0)
    }
  })

  it('所有分类都有非空 name', () => {
    for (const c of SEED_CATEGORIES) {
      expect(c.name).toBeTruthy()
      expect(typeof c.name).toBe('string')
    }
  })

  it('所有分类都有 description', () => {
    for (const c of SEED_CATEGORIES) {
      expect(c.description).toBeDefined()
      expect(typeof c.description).toBe('string')
    }
  })

  it('应包括 "餐饮" 分类', () => {
    expect(SEED_CATEGORIES.some(c => c.name === '餐饮')).toBe(true)
  })

  it('应包括 "其他" 分类', () => {
    expect(SEED_CATEGORIES.some(c => c.name === '其他')).toBe(true)
  })

  it('name 不应有重复', () => {
    const names = SEED_CATEGORIES.map(c => c.name)
    const uniqueNames = new Set(names)
    expect(uniqueNames.size).toBe(names.length)
  })

  it('SEED_CATEGORIES 是不可变引用验证（内部对象可修改但应初始化为正确值）', () => {
    // 验证第一个分类的完整结构
    const first = SEED_CATEGORIES[0]
    expect(first.name).toBe('餐饮')
    expect(first.description).toContain('食品')
  })
})
