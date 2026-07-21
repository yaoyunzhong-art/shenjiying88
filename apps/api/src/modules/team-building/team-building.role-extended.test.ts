/**
 * 🐜 自动: [team-building] [C] 角色扩展测试
 *
 * 8 角色视角的团建模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 TeamBuildingService + in-memory Store
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { TeamBuildingService } from './team-building.service'

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

/** 角色 → 团建模块权限 */
const roleTbAccess: Record<string, string[]> = {
  'tb:list': ['👔店长', '🛒前台', '👥HR', '🔧安监', '🎮导玩员', '🎯运行专员', '🤝团建', '📢营销'],
  'tb:detail': ['👔店长', '🛒前台', '👥HR', '🔧安监', '🎮导玩员', '🎯运行专员', '🤝团建', '📢营销'],
  'tb:create': ['👥HR', '🤝团建'],
  'tb:update': ['👥HR', '🤝团建'],
  'tb:delete': ['👥HR', '🤝团建'],
  'tb:approve': ['🔧安监'],
  'tb:stats': ['🎯运行专员', '👔店长', '👥HR'],
  'tb:labels': ['👔店长', '🛒前台', '👥HR', '🔧安监', '🎮导玩员', '🎯运行专员', '🤝团建'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleTbAccess[resource]?.includes(role) ?? false
}

const TENANT = 'tenant-001'

/** 每个 test 返回新的 service */
function makeSvc(): TeamBuildingService {
  return new TeamBuildingService()
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 团建
// ════════════════════════════════════════════════════════════

describe('[👔店长] team-building 角色扩展测试', () => {
  it('👔[正例] 店长查看团建计划列表 → 按类型筛选', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'tb:list')).toBe(true)
    const svc = makeSvc()
    const all = svc.findAll(TENANT)
    expect(all.length).toBeGreaterThan(0)

    const outdoor = svc.findAll(TENANT, { type: 'outdoor' })
    outdoor.forEach((p) => expect(p.type).toBe('outdoor'))
  })

  it('👔[正例] 店长查看团建详情', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'tb:detail')).toBe(true)
    const svc = makeSvc()
    const all = svc.findAll(TENANT)
    const detail = svc.findById(all[0].id, TENANT)
    expect(detail).toBeDefined()
    expect(detail!.location).toBeTruthy()
  })

  it('👔[正例] 店长查看团建统计', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'tb:stats')).toBe(true)
    const svc = makeSvc()
    const stats = svc.getStats(TENANT)
    expect(stats.totalPlans).toBeGreaterThan(0)
    expect(stats.avgBudget).toBeGreaterThan(0)
    expect(stats.maxBudget).toBeGreaterThan(stats.minBudget)
  })

  it('👔[反例] 店长无权创建/删除团建', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'tb:create')).toBe(false)
    expect(checkRoleAccess(ROLES.StoreManager, 'tb:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.StoreManager, 'tb:approve')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 团建
// ════════════════════════════════════════════════════════════

describe('[🛒前台] team-building 角色扩展测试', () => {
  it('🛒[正例] 前台查看团建列表', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'tb:list')).toBe(true)
    const svc = makeSvc()
    const all = svc.findAll(TENANT)
    expect(all.length).toBeGreaterThan(0)
  })

  it('🛒[正例] 前台查看团建详情 → 查看类型标签', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'tb:detail')).toBe(true)
    const svc = makeSvc()
    const all = svc.findAll(TENANT)
    const detail = svc.findById(all[0].id, TENANT)
    expect(detail).toBeDefined()

    expect(checkRoleAccess(ROLES.FrontDesk, 'tb:labels')).toBe(true)
    const labels = svc.getTypeLabels()
    expect(labels.outdoor).toBe('户外拓展')
  })

  it('🛒[反例] 前台无权创建/更新/删除团建', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'tb:create')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'tb:update')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'tb:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'tb:approve')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 团建
// ════════════════════════════════════════════════════════════

describe('[👥HR] team-building 角色扩展测试', () => {
  it('👥[正例] HR 创建团建方案', async () => {
    expect(checkRoleAccess(ROLES.HR, 'tb:create')).toBe(true)
    const svc = makeSvc()
    const plan = svc.create({
      tenantId: TENANT, name: 'HR创建的团建活动', type: 'escape-room',
      location: '朝阳区密室', budget: 800000, expectedParticipants: 10,
      description: 'HR组织的密室团建',
    })
    expect(plan.name).toBe('HR创建的团建活动')
    expect(plan.type).toBe('escape-room')
  })

  it('👥[正例] HR 更新团建方案', async () => {
    expect(checkRoleAccess(ROLES.HR, 'tb:update')).toBe(true)
    const svc = makeSvc()
    const all = svc.findAll(TENANT)
    const updated = svc.update(all[0].id, TENANT, { name: 'HR更新后的方案', budget: 500000 })
    expect(updated.name).toBe('HR更新后的方案')
    expect(updated.budget).toBe(500000)
  })

  it('👥[正例] HR 查看团建统计', async () => {
    expect(checkRoleAccess(ROLES.HR, 'tb:stats')).toBe(true)
    const svc = makeSvc()
    const stats = svc.getStats(TENANT)
    expect(stats.byType.outdoor).toBeGreaterThanOrEqual(1)
    expect(stats.byType.dinner).toBeGreaterThanOrEqual(1)
  })

  it('👥[正例] HR 删除团建方案', async () => {
    expect(checkRoleAccess(ROLES.HR, 'tb:delete')).toBe(true)
    const svc = makeSvc()
    const plan = svc.create({
      tenantId: TENANT, name: '待删除团建', type: 'other',
      location: '某地', budget: 100000, expectedParticipants: 5,
      description: '即将被删除',
    })
    svc.delete(plan.id, TENANT)
    const found = svc.findById(plan.id, TENANT)
    expect(found).toBeUndefined()
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 团建
// ════════════════════════════════════════════════════════════

describe('[🔧安监] team-building 角色扩展测试', () => {
  it('🔧[正例] 安监查看团建列表', async () => {
    expect(checkRoleAccess(ROLES.Security, 'tb:list')).toBe(true)
    const svc = makeSvc()
    const all = svc.findAll(TENANT)
    expect(all.length).toBeGreaterThan(0)
  })

  it('🔧[正例] 安监可审核团建安全方案（权限验证）', async () => {
    expect(checkRoleAccess(ROLES.Security, 'tb:approve')).toBe(true)
    expect(checkRoleAccess(ROLES.Security, 'tb:detail')).toBe(true)
  })

  it('🔧[反例] 安监无权创建/删除团建', () => {
    expect(checkRoleAccess(ROLES.Security, 'tb:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'tb:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'tb:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 团建
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] team-building 角色扩展测试', () => {
  it('🎮[正例] 导玩员查看团建列表', async () => {
    expect(checkRoleAccess(ROLES.Guide, 'tb:list')).toBe(true)
    const svc = makeSvc()
    const all = svc.findAll(TENANT)
    expect(all.length).toBeGreaterThan(0)
  })

  it('🎮[正例] 导玩员查看团建详情', async () => {
    expect(checkRoleAccess(ROLES.Guide, 'tb:detail')).toBe(true)
    const svc = makeSvc()
    const all = svc.findAll(TENANT)
    const detail = svc.findById(all[0].id, TENANT)
    expect(detail).toBeDefined()
    expect(detail!.description).toBeTruthy()
  })

  it('🎮[反例] 导玩员无权创建/审核', () => {
    expect(checkRoleAccess(ROLES.Guide, 'tb:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'tb:approve')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'tb:stats')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 团建
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] team-building 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看团建列表 → 搜索', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'tb:list')).toBe(true)
    const svc = makeSvc()
    const search = svc.findAll(TENANT, { search: '密室' })
    expect(search.length).toBeGreaterThan(0)
    expect(search.some((p) => p.name.includes('密室'))).toBe(true)
  })

  it('🎯[正例] 运行专员查看团建统计 → 按类型分布', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'tb:stats')).toBe(true)
    const svc = makeSvc()
    const stats = svc.getStats(TENANT)
    const typeSum = Object.values(stats.byType).reduce((a, b) => a + b, 0)
    expect(typeSum).toBe(stats.totalPlans)
  })

  it('🎯[正例] 运行专员查看类型标签', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'tb:labels')).toBe(true)
    const svc = makeSvc()
    const labels = svc.getTypeLabels()
    expect(labels['script-kill']).toBe('剧本杀')
    expect(labels.sports).toBe('运动赛事')
  })

  it('🎯[反例] 运行专员无权创建/删除团建', () => {
    expect(checkRoleAccess(ROLES.Operations, 'tb:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Operations, 'tb:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 团建（主视角）
// ════════════════════════════════════════════════════════════

describe('[🤝团建] team-building 角色扩展测试', () => {
  it('🤝[正例] 团建角色创建团建活动 → 所有字段完整', async () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'tb:create')).toBe(true)
    const svc = makeSvc()
    const plan = svc.create({
      tenantId: TENANT, name: '团建专员策划的活动', type: 'sports',
      location: '体育馆', budget: 500000, expectedParticipants: 20,
      description: '羽毛球比赛团建', recommendedSeason: '春秋', remark: '需要预订场地',
    })
    expect(plan.recommendedSeason).toBe('春秋')
    expect(plan.remark).toBe('需要预订场地')
  })

  it('🤝[正例] 团建角色更新自己的方案', async () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'tb:update')).toBe(true)
    const svc = makeSvc()
    const all = svc.findAll(TENANT)
    const updated = svc.update(all[0].id, TENANT, { expectedParticipants: 35 })
    expect(updated.expectedParticipants).toBe(35)
  })

  it('🤝[正例] 团建角色查看团建列表 → 详情', async () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'tb:list')).toBe(true)
    expect(checkRoleAccess(ROLES.Teambuilding, 'tb:detail')).toBe(true)
    const svc = makeSvc()
    const all = svc.findAll(TENANT, { type: 'ktv' })
    expect(all.length).toBeGreaterThan(0)
    all.forEach((p) => expect(p.type).toBe('ktv'))
  })

  it('🤝[反例] 团建角色无权审核安全方案', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'tb:approve')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 团建
// ════════════════════════════════════════════════════════════

describe('[📢营销] team-building 角色扩展测试', () => {
  it('📢[正例] 营销查看团建列表 → 搜索活动内容', async () => {
    // 营销无直接团建管理权，但可查看团建计划了解员工活动安排
    expect(checkRoleAccess(ROLES.Marketing, 'tb:list')).toBe(true)
    const svc = makeSvc()
    const all = svc.findAll(TENANT, { search: '聚餐' })
    expect(all.length).toBeGreaterThan(0)
  })

  it('📢[正例] 营销查看团建详情 → 活动地点信息', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'tb:detail')).toBe(true)
    const svc = makeSvc()
    const all = svc.findAll(TENANT)
    const detail = svc.findById(all[0].id, TENANT)
    expect(detail).toBeDefined()
    expect(detail!.location).toBeTruthy()
  })

  it('📢[反例] 营销无权创建/删除/审核团建', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'tb:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'tb:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'tb:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'tb:approve')).toBe(false)
  })

  it('📢[闭环] 营销可通过查看团建活动了解员工动态', () => {
    // 营销可参考团建安排来协调市场活动排期
    const svc = makeSvc()
    const stats = svc.getStats(TENANT)
    expect(stats.totalPlans).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 team-building 跨角色闭环 + 边界]', () => {
  it('👥HR创建团建 → 🔧安监审核 → 🤝团建更新 → 👔店长查看全流程', async () => {
    const svc = makeSvc()

    // 1. HR 创建团建
    const plan = svc.create({
      tenantId: TENANT, name: '年度团建-漂流', type: 'outdoor',
      location: '漂流谷', budget: 2000000, expectedParticipants: 30,
      description: '夏季漂流团建活动',
    })
    expect(plan.name).toBe('年度团建-漂流')

    // 2. 安监可审核
    expect(checkRoleAccess(ROLES.Security, 'tb:approve')).toBe(true)

    // 3. 团建角色更新
    const updated = svc.update(plan.id, TENANT, { expectedParticipants: 35 })
    expect(updated.expectedParticipants).toBe(35)

    // 4. 店长查看团建统计
    const stats = svc.getStats(TENANT)
    expect(stats.totalPlans).toBeGreaterThanOrEqual(8)
  })

  it('🛡️ 不存在的团建方案 findById 返回 undefined', () => {
    const svc = makeSvc()
    const plan = svc.findById('tb-nonexistent', TENANT)
    expect(plan).toBeUndefined()
  })

  it('🛡️ 更新不存在的方案抛错', () => {
    const svc = makeSvc()
    expect(() => svc.update('tb-nonexistent', TENANT, { name: 'x' })).toThrow()
  })

  it('🛡️ 多租户隔离 — 其他租户看不到 seed 数据', () => {
    const svc = makeSvc()
    const other = svc.findAll('tenant-other-unknown')
    expect(other).toHaveLength(0)
  })

  it('🛡️ 搜索无匹配返回空数组', () => {
    const svc = makeSvc()
    const result = svc.findAll(TENANT, { search: 'zzzzz不存在zzzzz' })
    expect(result).toHaveLength(0)
  })

  it('🛡️ 空租户统计返回全零', () => {
    const svc = makeSvc()
    const stats = svc.getStats('empty-tenant-xxx')
    expect(stats.totalPlans).toBe(0)
    expect(stats.avgBudget).toBe(0)
    expect(stats.minBudget).toBe(0)
    expect(stats.maxBudget).toBe(0)
  })

  it('🛡️ TypeLabels 返回全部 7 种类型中文标签', () => {
    const svc = makeSvc()
    const labels = svc.getTypeLabels()
    expect(Object.keys(labels).length).toBe(7)
    expect(labels.outdoor).toBe('户外拓展')
    expect(labels.ktv).toBe('KTV')
  })
})
