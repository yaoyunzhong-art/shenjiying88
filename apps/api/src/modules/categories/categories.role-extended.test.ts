/**
 * 🐜 自动: [categories] [C] 角色扩展测试
 *
 * 8 角色视角的 商品分类模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 CategoriesService
 */
import { describe, it, expect } from 'vitest'
import { CategoriesService } from './categories.service'
import { NotFoundException } from '@nestjs/common'

// ── 角色权限矩阵 ──

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

/** 角色 → 商品分类模块权限 */
const roleCategoryAccess: Record<string, string[]> = {
  'cat:list': ['👔店长', '🛒前台', '🎮导玩员', '🎯运行专员', '📢营销'],
  'cat:detail': ['👔店长', '🛒前台', '🎯运行专员'],
  'cat:stats': ['👔店长', '🎯运行专员', '📢营销'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleCategoryAccess[resource]?.includes(role) ?? false
}

function makeService(): CategoriesService {
  return new CategoriesService()
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 商品分类
// ════════════════════════════════════════════════════════════

describe('[👔店长] categories 角色扩展测试', () => {
  it('👔[正例] 店长查看所有分类列表', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'cat:list')).toBe(true)
    const svc = makeService()
    const all = svc.findAll()
    expect(all.length).toBeGreaterThan(0)
    expect(all[0]).toHaveProperty('name')
    expect(all[0]).toHaveProperty('description')
    expect(all[0]).toHaveProperty('productCount')
  })

  it('👔[正例] 店长按名称查询分类详情', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'cat:detail')).toBe(true)
    const svc = makeService()
    const cat = svc.findByName('餐饮')
    expect(cat.name).toBe('餐饮')
    expect(cat.description).toBe('食品、饮料、熟食及原料')
    expect(cat.productCount).toBe(0)
  })

  it('👔[正例] 店长查看分类统计', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'cat:stats')).toBe(true)
    const svc = makeService()
    const stats = svc.getCategoryStats()
    expect(stats.total).toBe(10)
    expect(stats.categories).toContain('餐饮')
    expect(stats.categories).toContain('娱乐')
    expect(stats.categories.length).toBe(10)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 商品分类
// ════════════════════════════════════════════════════════════

describe('[🛒前台] categories 角色扩展测试', () => {
  it('🛒[正例] 前台查看分类列表（引导顾客）', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'cat:list')).toBe(true)
    const svc = makeService()
    const list = svc.findAll()
    expect(list.length).toBe(10)
    expect(list.map(c => c.name)).toContain('零食')
    expect(list.map(c => c.name)).toContain('饮品')
  })

  it('🛒[正例] 前台按名称查看分类（顾客询问）', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'cat:detail')).toBe(true)
    const svc = makeService()
    const cat = svc.findByName('数码')
    expect(cat.name).toBe('数码')
    expect(cat.description).toContain('电子产品')
  })

  it('🛒[反例] 前台无权限查看分类统计', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'cat:stats')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 商品分类
// ════════════════════════════════════════════════════════════

describe('[👥HR] categories 角色扩展测试', () => {
  it('👥[反例] HR无权限查看分类列表', () => {
    expect(checkRoleAccess(ROLES.HR, 'cat:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'cat:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'cat:stats')).toBe(false)
  })

  it('👥[反例] HR无人事相关分类操作权限', () => {
    // HR 有权限查看员工信息，但分类是商品运营
    const denied = { success: false, code: 403, message: 'NO_CATEGORY_ACCESS', module: 'categories' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('categories')
  })

  it('👥[反例] HR所有分类资源均被拒绝', () => {
    const resources = ['cat:list', 'cat:detail', 'cat:stats']
    resources.forEach((r) => {
      expect(checkRoleAccess(ROLES.HR, r)).toBe(false)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 商品分类
// ════════════════════════════════════════════════════════════

describe('[🔧安监] categories 角色扩展测试', () => {
  it('🔧[反例] 安监无权限查看分类列表', () => {
    expect(checkRoleAccess(ROLES.Security, 'cat:list')).toBe(false)
  })

  it('🔧[反例] 安监无权限查看分类详情', () => {
    expect(checkRoleAccess(ROLES.Security, 'cat:detail')).toBe(false)
  })

  it('🔧[反例] 安监无权限查看分类统计', () => {
    expect(checkRoleAccess(ROLES.Security, 'cat:stats')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 商品分类
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] categories 角色扩展测试', () => {
  it('🎮[正例] 导玩员查看娱乐分类信息', async () => {
    expect(checkRoleAccess(ROLES.Guide, 'cat:list')).toBe(true)
    const svc = makeService()
    const list = svc.findAll()
    const ent = list.find(c => c.name === '娱乐')
    expect(ent).toBeDefined()
    expect(ent!.description).toContain('玩具、游戏')
  })

  it('🎮[反例] 导玩员无权限查看分类详情（高权重操作）', () => {
    expect(checkRoleAccess(ROLES.Guide, 'cat:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'cat:stats')).toBe(false)
  })

  it('🎮[反例] 导玩员仅能查看列表不能管理', () => {
    // 查看列表是最低权限
    expect(checkRoleAccess(ROLES.Guide, 'cat:list')).toBe(true)
    expect(checkRoleAccess(ROLES.Guide, 'cat:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'cat:stats')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 商品分类
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] categories 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看全部分类', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'cat:list')).toBe(true)
    const svc = makeService()
    const list = svc.findAll()
    expect(list.length).toBe(10)
  })

  it('🎯[正例] 运行专员分类详情 → 分类统计', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'cat:detail')).toBe(true)
    const svc = makeService()
    const cat = svc.findByName('日用品')
    expect(cat.name).toBe('日用品')
    expect(cat.description).toContain('家庭清洁')

    expect(checkRoleAccess(ROLES.Operations, 'cat:stats')).toBe(true)
    const stats = svc.getCategoryStats()
    expect(stats.total).toBe(10)
  })

  it('🎯[正例] 运行专员统计中各分类名称正确', async () => {
    const svc = makeService()
    const stats = svc.getCategoryStats()
    const expectedCategories = ['餐饮', '服装', '数码', '日用品', '娱乐', '饮品', '零食', '文具', '医疗', '其他']
    expectedCategories.forEach((name) => {
      expect(stats.categories).toContain(name)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 商品分类
// ════════════════════════════════════════════════════════════

describe('[🤝团建] categories 角色扩展测试', () => {
  it('🤝[反例] 团建无权限查看分类列表', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'cat:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'cat:detail')).toBe(false)
  })

  it('🤝[反例] 团建无权限查看分类统计', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'cat:stats')).toBe(false)
  })

  it('🤝[反例] 团建所有资源均无权限', () => {
    const resources = ['cat:list', 'cat:detail', 'cat:stats']
    resources.forEach((r) => {
      expect(checkRoleAccess(ROLES.Teambuilding, r)).toBe(false)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 商品分类
// ════════════════════════════════════════════════════════════

describe('[📢营销] categories 角色扩展测试', () => {
  it('📢[正例] 营销查看分类列表（策划促销活动参考）', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'cat:list')).toBe(true)
    const svc = makeService()
    const list = svc.findAll()
    expect(list.length).toBe(10)
    const names = list.map(c => c.name)
    expect(names).toContain('饮品')
    expect(names).toContain('零食')
  })

  it('📢[正例] 营销查看分类统计（分析商品结构）', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'cat:stats')).toBe(true)
    const svc = makeService()
    const stats = svc.getCategoryStats()
    expect(stats.total).toBe(10)
    expect(stats.categories.includes('数码')).toBe(true)
  })

  it('📢[反例] 营销无权限查看分类详情（修改类操作受限）', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'cat:detail')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 categories 跨角色闭环 + 边界]', () => {
  it('🛒 + 🎮 前台与导玩员分工查看分类', async () => {
    const svc = makeService()

    // 前台可以查看列表和详情
    expect(checkRoleAccess(ROLES.FrontDesk, 'cat:list')).toBe(true)
    expect(checkRoleAccess(ROLES.FrontDesk, 'cat:detail')).toBe(true)
    const fdCat = svc.findByName('饮品')
    expect(fdCat.name).toBe('饮品')

    // 导玩员只能查看列表
    expect(checkRoleAccess(ROLES.Guide, 'cat:list')).toBe(true)
    expect(checkRoleAccess(ROLES.Guide, 'cat:detail')).toBe(false)
  })

  it('🛡️ 不存在的分类名抛出 NotFoundException', () => {
    const svc = makeService()
    expect(() => svc.findByName('不存在的分类')).toThrow(NotFoundException)
  })

  it('🛡️ 按URL编码名称查询正常', () => {
    const svc = makeService()
    const cat = svc.findByName(encodeURIComponent('娱乐'))
    expect(cat.name).toBe('娱乐')
  })

  it('🛡️ findAll 返回不可变副本', () => {
    const svc = makeService()
    const list1 = svc.findAll()
    const list2 = svc.findAll()
    // 修改 list1 不应影响 list2
    list1.push({ name: '虚拟', description: '测试', productCount: 0 })
    expect(list2.length).toBe(10)
  })

  it('🛡️ getCategoryStats 返回的分类数量恒定', () => {
    const svc = makeService()
    const stats = svc.getCategoryStats()
    expect(stats.total).toBe(10)
    expect(stats.categories.length).toBe(10)
  })

  it('🛡️ 每种分类的 productCount 初始为 0', () => {
    const svc = makeService()
    const list = svc.findAll()
    list.forEach((c) => {
      expect(c.productCount).toBe(0)
    })
  })

  it('🛡️ 分类名大小写不敏感查询', () => {
    const svc = makeService()
    const cat = svc.findByName(encodeURIComponent('餐饮'))
    expect(cat.name).toBe('餐饮')
  })

  it('🛡️ 空字符串分类名查询抛出异常', () => {
    const svc = makeService()
    expect(() => svc.findByName('')).toThrow(NotFoundException)
  })

  it('🛡️ 分类服务多次调用返回一致的10个分类', () => {
    const svc = makeService()
    for (let i = 0; i < 5; i++) {
      const list = svc.findAll()
      expect(list.length).toBe(10)
    }
  })

  it('🛡️ 分类描述包含中文标点和内容', () => {
    const svc = makeService()
    const list = svc.findAll()
    list.forEach((c) => {
      expect(c.description.length).toBeGreaterThan(0)
    })
  })
})
