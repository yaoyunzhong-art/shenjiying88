/**
 * 🐜 自动: [empower-card] [C] 角色扩展测试
 *
 * 8 角色视角的知识赋能卡片扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 EmpowerCardService + fallback memory store
 */
import { describe, it, expect } from 'vitest'
import { EmpowerCardService } from './empower-card.service'

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

/** 角色 → 赋能卡片模块权限 */
const roleEmpowerAccess: Record<string, string[]> = {
  'card:create': ['👔店长', '🎯运行专员', '👥HR'],
  'card:read': ['👔店长', '🛒前台', '👥HR', '🎮导玩员', '🎯运行专员', '🤝团建', '📢营销'],
  'card:search': ['👔店长', '🛒前台', '👥HR', '🔧安监', '🎮导玩员', '🎯运行专员', '🤝团建', '📢营销'],
  'card:quote': ['👔店长', '🛒前台', '🎮导玩员', '🎯运行专员', '📢营销'],
  'card:decay': ['🎯运行专员'],
  'card:health': ['👔店长', '🎯运行专员'],
  'card:stats': ['👔店长', '🎯运行专员', '👥HR'],
  'card:import': ['👔店长', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleEmpowerAccess[resource]?.includes(role) ?? false
}

function makeService(): EmpowerCardService {
  return new EmpowerCardService()
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 赋能卡片
// ════════════════════════════════════════════════════════════

describe('[👔店长] empower-card 角色扩展测试', () => {
  it('👔[正例] 店长创建知识卡片 → 读取详情', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'card:create')).toBe(true)
    const svc = makeService()

    const card = await svc.create({
      tag: '竞品',
      summary: '竞品A推出新款VR头显设备，支持无线投屏',
      source: '行业日报',
      moduleMapping: 'device-adapter',
    })
    expect(card.id).toBeTruthy()
    expect(card.tag).toBe('竞品')
    expect(card.freshnessScore).toBe(100)
    expect(card.quoteCount).toBe(0)

    expect(checkRoleAccess(ROLES.StoreManager, 'card:read')).toBe(true)
    const detail = await svc.getById(card.id)
    expect(detail.id).toBe(card.id)
    expect(detail.summary).toContain('VR头显')
  })

  it('👔[正例] 店长查看健康状态', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'card:health')).toBe(true)
    const svc = makeService()
    const health = await svc.healthCheck()

    expect(health.status).toBeDefined()
    expect(health.cardsCount).toBeGreaterThanOrEqual(0)
    expect(health.timestamp).toBeTruthy()
  })

  it('👔[正例] 店长搜索知识卡片', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'card:search')).toBe(true)
    const svc = makeService()

    await svc.create({ tag: '技术', summary: 'AI推荐引擎升级v3.0', source: '技术部', moduleMapping: 'ai-recommend' })
    await svc.create({ tag: '市场', summary: '暑期促销活动数据复盘', source: '市场部', moduleMapping: 'marketing' })

    const result = await svc.search({ tag: '技术' })
    expect(result.total).toBeGreaterThanOrEqual(1)
    result.cards.forEach((c) => expect(c.tag).toBe('技术'))
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 赋能卡片
// ════════════════════════════════════════════════════════════

describe('[🛒前台] empower-card 角色扩展测试', () => {
  it('🛒[正例] 前台搜索知识卡片 → 查看学习资料', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'card:search')).toBe(true)
    const svc = makeService()

    await svc.create({ tag: '会员', summary: '会员卡新规则：充值送积分', source: '运营部', moduleMapping: 'member' })

    const result = await svc.search({ q: '会员' })
    expect(result.total).toBeGreaterThanOrEqual(1)
  })

  it('🛒[正例] 前台引用知识卡片', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'card:quote')).toBe(true)
    const svc = makeService()

    const card = await svc.create({
      tag: '设备',
      summary: '篮球机日常维护指南',
      source: '设备手册',
    })

    await svc.recordQuote(card.id, '日常维护', 'device-adapter', '前台')
    // Re-read to verify quote count increased
    const updated = await svc.getById(card.id)
    expect(updated.quoteCount).toBe(1)
  })

  it('🛒[反例] 前台无权限创建卡片', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'card:create')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'card:import')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 赋能卡片
// ════════════════════════════════════════════════════════════

describe('[👥HR] empower-card 角色扩展测试', () => {
  it('👥[正例] HR 创建培训知识卡片', async () => {
    expect(checkRoleAccess(ROLES.HR, 'card:create')).toBe(true)
    const svc = makeService()

    const card = await svc.create({
      tag: '用户',
      summary: '新员工入职培训流程V2',
      source: 'HR部门',
      moduleMapping: 'training',
    })
    expect(card.tag).toBe('用户')
  })

  it('👥[正例] HR 搜索培训相关卡片', async () => {
    expect(checkRoleAccess(ROLES.HR, 'card:search')).toBe(true)
    const svc = makeService()

    const result = await svc.search({ q: '培训' })
    expect(result.cards).toBeDefined()
    expect(typeof result.total).toBe('number')
  })

  it('👥[反例] HR 无权限操作退化曲线', () => {
    expect(checkRoleAccess(ROLES.HR, 'card:decay')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'card:health')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 赋能卡片
// ════════════════════════════════════════════════════════════

describe('[🔧安监] empower-card 角色扩展测试', () => {
  it('🔧[正例] 安监搜索安全检查相关卡片', async () => {
    expect(checkRoleAccess(ROLES.Security, 'card:search')).toBe(true)
    const svc = makeService()

    const result = await svc.search({ q: '安全' })
    expect(result.cards).toBeDefined()
  })

  it('🔧[反例] 安监无权限创建卡片', () => {
    expect(checkRoleAccess(ROLES.Security, 'card:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'card:import')).toBe(false)
  })

  it('🔧[反例] 安监无权操作退化曲线或统计', () => {
    expect(checkRoleAccess(ROLES.Security, 'card:decay')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'card:stats')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'card:health')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 赋能卡片
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] empower-card 角色扩展测试', () => {
  it('🎮[正例] 导玩员搜索设备相关卡片', async () => {
    expect(checkRoleAccess(ROLES.Guide, 'card:search')).toBe(true)
    const svc = makeService()

    await svc.create({
      tag: '设备',
      summary: '跳舞机故障排查三步法',
      source: '设备部',
      moduleMapping: 'device-adapter',
    })

    const result = await svc.search({ module: 'device-adapter' })
    expect(result.total).toBeGreaterThanOrEqual(1)
    result.cards.forEach((c) => expect(c.freshnessScore).toBeGreaterThanOrEqual(50))
  })

  it('🎮[正例] 导玩员引用设备知识卡片', async () => {
    expect(checkRoleAccess(ROLES.Guide, 'card:quote')).toBe(true)
    const svc = makeService()

    const card = await svc.create({
      tag: '设备',
      summary: 'VR设备开机自检流程',
      source: '培训文档',
    })

    await svc.recordQuote(card.id, 'VR设备开机', 'device-adapter', '导玩员')
    const updated = await svc.getById(card.id)
    expect(updated.quoteCount).toBe(1)
  })

  it('🎮[反例] 导玩员无权限创建卡片', () => {
    expect(checkRoleAccess(ROLES.Guide, 'card:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'card:import')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 赋能卡片
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] empower-card 角色扩展测试', () => {
  it('🎯[正例] 运行专员批量导入卡片', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'card:import')).toBe(true)
    const svc = makeService()

    const count = await svc.batchImport([
      { tag: '运营', summary: '门店周末活动方案模板', source: '运营手册', moduleMapping: 'ops-manual' },
      { tag: '运营', summary: '设备巡检流程V3', source: '运营手册', moduleMapping: 'ops-manual' },
      { tag: '运营', summary: '库存盘点操作指南', source: '运营手册', moduleMapping: 'inventory' },
    ])
    expect(count).toBe(3)
  })

  it('🎯[正例] 运行专员查看健康状态 + 今日赋能分数', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'card:health')).toBe(true)
    const svc = makeService()

    const health = await svc.healthCheck()
    expect(health.status).toBeDefined()

    const score = await svc.getTodayEmpowerScore()
    expect(typeof score.score).toBe('number')
    expect(typeof score.quotes).toBe('number')
    expect(typeof score.newCards).toBe('number')
  })

  it('🎯[正例] 运行专员执行卡片退化', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'card:decay')).toBe(true)
    const svc = makeService()

    const result = await svc.applyDecay()
    expect(typeof result.decayed).toBe('number')
    expect(typeof result.archived).toBe('number')
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 赋能卡片
// ════════════════════════════════════════════════════════════

describe('[🤝团建] empower-card 角色扩展测试', () => {
  it('🤝[正例] 团建搜索团建活动相关卡片', async () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'card:search')).toBe(true)
    const svc = makeService()

    const result = await svc.search({ q: '团建' })
    expect(result.cards).toBeDefined()
  })

  it('🤝[反例] 团建无权限创建卡片', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'card:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'card:import')).toBe(false)
  })

  it('🤝[反例] 团建无权执行卡片管理操作', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'card:decay')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'card:stats')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'card:health')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 赋能卡片
// ════════════════════════════════════════════════════════════

describe('[📢营销] empower-card 角色扩展测试', () => {
  it('📢[正例] 营销搜索市场相关卡片', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'card:search')).toBe(true)
    const svc = makeService()

    await svc.create({
      tag: '市场',
      summary: '暑期档电玩城营销方案',
      source: '市场部',
      moduleMapping: 'marketing',
    })

    const result = await svc.search({ tag: '市场' })
    expect(result.total).toBeGreaterThanOrEqual(1)
  })

  it('📢[正例] 营销引用市场洞察卡片赋能派单', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'card:quote')).toBe(true)
    const svc = makeService()

    const card = await svc.create({
      tag: '竞品',
      summary: '竞品B暑假特惠活动：办卡送礼品',
      source: '市场调研',
    })

    await svc.recordQuote(card.id, '竞品分析', 'marketing', '营销')
    const updated = await svc.getById(card.id)
    expect(updated.quoteCount).toBe(1)
  })

  it('📢[反例] 营销无权限创建卡片', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'card:create')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 empower-card 跨角色闭环 + 边界]', () => {
  it('👔 + 🎯 店长创建卡片 → 运行专员维护 → 前台引用', async () => {
    const svc = makeService()

    // 店长创建卡片
    const card = await svc.create({
      tag: '运营',
      summary: '暑期引流活动：学生特价时段',
      source: '店长会议',
      moduleMapping: 'marketing',
    })
    expect(card.freshnessScore).toBe(100)

    // 运行专员批量导入补充
    await svc.batchImport([
      { tag: '设备', summary: '暑期设备增配计划', source: '技术部', moduleMapping: 'device-adapter' },
    ])

    // 前台引用卡片
    await svc.recordQuote(card.id, '暑期活动推广', 'marketing', '前台')

    // 验证引用计数
    const updated = await svc.getById(card.id)
    expect(updated.quoteCount).toBe(1)

    // 自动匹配
    const matched = await svc.autoMatchForDispatch('marketing', ['暑期', '活动'])
    expect(matched.length).toBeGreaterThanOrEqual(1)
  })

  it('🛡️ 不存在的卡片查询抛 NotFoundException', async () => {
    const svc = makeService()
    await expect(svc.getById('00000000-0000-0000-0000-000000000000')).rejects.toThrow()
  })

  it('🛡️ 空搜索返回0结果', async () => {
    const svc = makeService()
    const result = await svc.search({ q: 'ZZZZNONEXISTENT12345', minFreshness: 100 })
    expect(result.total).toBe(0)
    expect(result.cards).toHaveLength(0)
  })

  it('🛡️ 标签精确搜索', async () => {
    const svc = makeService()

    await svc.create({ tag: '合规', summary: '数据安全管理办法', source: '法务部', moduleMapping: 'compliance' })

    const result = await svc.search({ tag: '合规' })
    expect(result.total).toBeGreaterThanOrEqual(1)
    result.cards.forEach((c) => expect(c.tag).toBe('合规'))
  })

  it('🛡️ 搜索按新鲜度降序排列', async () => {
    const svc = makeService()
    await svc.create({ tag: '技术', summary: '旧知识012345', source: '旧记录' })
    await svc.create({ tag: '技术', summary: '新知识012345', source: '新记录' })

    const result = await svc.search({ tag: '技术', limit: 10 })
    for (let i = 1; i < result.cards.length; i++) {
      expect(result.cards[i - 1].freshnessScore).toBeGreaterThanOrEqual(result.cards[i].freshnessScore)
    }
  })

  it('🛡️ 今日赋能分数为数值', async () => {
    const svc = makeService()
    const score = await svc.getTodayEmpowerScore()
    expect(score.score).toBeGreaterThanOrEqual(0)
    expect(score.quotes).toBeGreaterThanOrEqual(0)
    expect(score.newCards).toBeGreaterThanOrEqual(0)
  })

  it('🛡️ 健康检查各字段类型正确', async () => {
    const svc = makeService()
    const health = await svc.healthCheck()

    expect(typeof health.status).toBe('string')
    expect(typeof health.timestamp).toBe('string')
    expect(typeof health.cardsCount).toBe('number')
  })

  it('🛡️ 引用计数为0的用户卡片', async () => {
    const svc = makeService()
    const card = await svc.create({ tag: '会员', summary: '未引用测试卡片001', source: '测试' })

    expect(card.quoteCount).toBe(0)
    expect(card.lastQuotedAt).toBeNull()
  })
})
