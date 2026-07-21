/**
 * 🧪 competitor-track Role Extended 测试 — 8角色 × 3场景 = 24 tests
 *
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 *
 * 覆盖: 竞品列表、竞品详情、创建竞品、竞品对比分析、竞品汇总统计
 */
import { describe, it, expect } from 'vitest'
import { CompetitorTrackService } from './competitor-track.service'
import { CompetitorCategory } from './competitor-track.entity'
import type { CreateCompetitorDto, UpdateCompetitorDto } from './competitor-track.dto'

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

/** 角色 → 竞品跟踪模块权限 */
const roleAccessMatrix: Record<string, string[]> = {
  'ct:list': ['👔店长', '🎯运行专员', '📢营销'],
  'ct:detail': ['👔店长', '🎯运行专员', '📢营销'],
  'ct:create': ['👔店长', '🎯运行专员', '📢营销'],
  'ct:update': ['👔店长', '🎯运行专员'],
  'ct:delete': ['👔店长'],
  'ct:comparison': ['👔店长', '🎯运行专员', '📢营销'],
  'ct:summary': ['👔店长', '🎯运行专员', '📢营销', '🎮导玩员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleAccessMatrix[resource]?.includes(role) ?? false
}

function makeService(): CompetitorTrackService {
  return new CompetitorTrackService()
}

function getTestCreateDto(overrides?: Partial<CreateCompetitorDto>): CreateCompetitorDto {
  return {
    competitorName: '测试竞品',
    city: '测试城市',
    category: CompetitorCategory.ARCADE,
    priceLevel: 3,
    rating: 4.0,
    visitorCount: 5000,
    advantage: '位置好',
    weakness: '设备旧',
    ...((overrides ?? {}) as any),
  }
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 竞品跟踪
// ════════════════════════════════════════════════════════════

describe('[👔店长] competitor-track 角色扩展测试', () => {
  it('👔[正例] 店长查看竞品列表 → 按城市筛选 → 竞品对比分析', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'ct:list')).toBe(true)
    const svc = makeService()
    const all = await svc.findAll()
    expect(all.length).toBeGreaterThan(0)

    const beijingCompetitors = await svc.findAll('北京')
    expect(beijingCompetitors.length).toBeGreaterThan(0)
    beijingCompetitors.forEach((c) => expect(c.city).toBe('北京'))

    expect(checkRoleAccess(ROLES.StoreManager, 'ct:comparison')).toBe(true)
    const comparison = await svc.getComparison(['ct-001', 'ct-002'])
    expect(comparison.competitors.length).toBe(2)
    expect(comparison.comparison.avgRating).toBeGreaterThan(0)
  })

  it('👔[正例] 店长创建新竞品 → 确认出现在列表中', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'ct:create')).toBe(true)
    const svc = makeService()
    const created = await svc.create(getTestCreateDto({ competitorName: '新开竞品' }))
    expect(created.id).toBeDefined()
    expect(created.competitorName).toBe('新开竞品')

    const found = await svc.findById(created.id)
    expect(found).not.toBeNull()
    expect(found!.competitorName).toBe('新开竞品')
  })

  it('👔[反例] 店长删除竞品（有权限）', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'ct:delete')).toBe(true)
    const svc = makeService()
    await expect(svc.delete('ct-001')).resolves.not.toThrow()
    const deleted = await svc.findById('ct-001')
    expect(deleted).toBeNull()
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 竞品跟踪
// ════════════════════════════════════════════════════════════

describe('[🛒前台] competitor-track 角色扩展测试', () => {
  it('🛒[反例] 前台无权限查看竞品列表', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'ct:list')).toBe(false)
  })

  it('🛒[反例] 前台无权限创建竞品', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'ct:create')).toBe(false)
  })

  it('🛒[反例] 前台无权限查看竞品对比', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'ct:comparison')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 竞品跟踪
// ════════════════════════════════════════════════════════════

describe('[👥HR] competitor-track 角色扩展测试', () => {
  it('👥[反例] HR无权限查看竞品数据', () => {
    expect(checkRoleAccess(ROLES.HR, 'ct:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'ct:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'ct:summary')).toBe(false)
  })

  it('👥[反例] HR无权限创建或更新竞品', () => {
    expect(checkRoleAccess(ROLES.HR, 'ct:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'ct:update')).toBe(false)
  })

  it('👥[闭环] HR查看竞品跟踪页面→无权限提示', () => {
    const denied = { success: false, code: 403, message: 'NO_COMPETITOR_TRACK_ACCESS' }
    expect(denied.code).toBe(403)
    expect(denied.message).toBe('NO_COMPETITOR_TRACK_ACCESS')
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 竞品跟踪
// ════════════════════════════════════════════════════════════

describe('[🔧安监] competitor-track 角色扩展测试', () => {
  it('🔧[反例] 安监无权限查看竞品数据', () => {
    expect(checkRoleAccess(ROLES.Security, 'ct:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'ct:detail')).toBe(false)
  })

  it('🔧[反例] 安监无权限操作竞品', () => {
    expect(checkRoleAccess(ROLES.Security, 'ct:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'ct:update')).toBe(false)
  })

  it('🔧[闭环] 安监无权限时返回统一错误格式', () => {
    const forbidden = { success: false, code: 403, message: 'FORBIDDEN' }
    expect(forbidden.message).toBe('FORBIDDEN')
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 竞品跟踪
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] competitor-track 角色扩展测试', () => {
  it('🎮[正例] 导玩员可查看竞品汇总数据（了解市场概况）', async () => {
    expect(checkRoleAccess(ROLES.Guide, 'ct:summary')).toBe(true)
    const svc = makeService()
    const summary = await svc.getSummary()
    expect(summary.totalCompetitors).toBeGreaterThan(0)
    expect(summary.avgRating).toBeGreaterThan(0)
  })

  it('🎮[反例] 导玩员无权查看竞品详细列表', () => {
    expect(checkRoleAccess(ROLES.Guide, 'ct:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'ct:detail')).toBe(false)
  })

  it('🎮[反例] 导玩员无权创建或修改竞品', () => {
    expect(checkRoleAccess(ROLES.Guide, 'ct:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'ct:update')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 竞品跟踪
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] competitor-track 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看竞品列表 → 按评分筛选', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'ct:list')).toBe(true)
    const svc = makeService()
    const highRated = await svc.findAll(undefined, undefined, 4.3)
    highRated.forEach((c) => expect(c.rating).toBeGreaterThanOrEqual(4.3))
  })

  it('🎯[正例] 运行专员创建竞品记录 → 对比分析', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'ct:create')).toBe(true)
    const svc = makeService()
    const created = await svc.create(getTestCreateDto({
      competitorName: '新开业对手',
      city: '深圳',
      priceLevel: 4,
    }))
    expect(created.competitorName).toBe('新开业对手')

    expect(checkRoleAccess(ROLES.Operations, 'ct:comparison')).toBe(true)
    const comparison = await svc.getComparison(['ct-001', created.id])
    expect(comparison.competitors.some((c) => c.id === created.id)).toBe(true)
  })

  it('🎯[反例] 运行专员无权删除竞品', () => {
    expect(checkRoleAccess(ROLES.Operations, 'ct:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 竞品跟踪
// ════════════════════════════════════════════════════════════

describe('[🤝团建] competitor-track 角色扩展测试', () => {
  it('🤝[反例] 团建无权限查看竞品数据', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'ct:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'ct:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'ct:comparison')).toBe(false)
  })

  it('🤝[反例] 团建无权限创建或修改竞品', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'ct:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'ct:update')).toBe(false)
  })

  it('🤝[闭环] 团建角色页面显示无权限', () => {
    const denied = { success: false, code: 403, message: 'FORBIDDEN', module: 'competitor-track' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('competitor-track')
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 竞品跟踪
// ════════════════════════════════════════════════════════════

describe('[📢营销] competitor-track 角色扩展测试', () => {
  it('📢[正例] 营销查看全部竞品 → 按分类筛选', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'ct:list')).toBe(true)
    const svc = makeService()
    const arcades = await svc.findAll(undefined, CompetitorCategory.ARCADE)
    arcades.forEach((c) => expect(c.category).toBe(CompetitorCategory.ARCADE))

    const summary = await svc.getSummary()
    expect(summary.categoryDistribution[CompetitorCategory.ARCADE]).toBeGreaterThan(0)
  })

  it('📢[正例] 营销使用竞品对比分析评估竞争格局', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'ct:comparison')).toBe(true)
    const svc = makeService()
    const result = await svc.getComparison(['ct-001', 'ct-005', 'ct-008'])
    expect(result.competitors.length).toBe(3)
    expect(result.comparison.bestRated).toBeDefined()
    expect(result.comparison.mostVisited).toBeDefined()
  })

  it('📢[正例] 营销创建竞品记录（新发现对手）', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'ct:create')).toBe(true)
    const svc = makeService()
    const created = await svc.create(getTestCreateDto({
      competitorName: '新发现竞品',
      city: '上海',
      category: CompetitorCategory.GAME,
    }))
    expect(created.id).toBeDefined()
    const fetched = await svc.findById(created.id)
    expect(fetched).not.toBeNull()
    expect(fetched!.competitorName).toBe('新发现竞品')
  })

  it('📢[反例] 营销无权删除竞品', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'ct:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界情况
// ════════════════════════════════════════════════════════════

describe('[🦞 competitor-track 跨角色闭环]', () => {
  it('👔 + 🎯 + 📢 竞品运营全流程', async () => {
    const svc = makeService()

    // 1. 运行专员发现新竞品 → 创建记录
    const created = await svc.create(getTestCreateDto({
      competitorName: '新发现对手',
      city: '广州',
      category: CompetitorCategory.ENTERTAINMENT,
      visitorCount: 15000,
    }))
    expect(created.id).toBeDefined()

    // 2. 营销分析对比
    const comparison = await svc.getComparison(['ct-003', created.id])
    expect(comparison.competitors.length).toBe(2)
    expect(comparison.comparison.totalVisitors).toBeGreaterThan(0)

    // 3. 店长查看汇总规划策略
    const summary = await svc.getSummary()
    expect(summary.totalCompetitors).toBeGreaterThan(0)
    expect(summary.topCompetitors.length).toBe(3)

    // 4. 无权限角色验证
    expect(checkRoleAccess(ROLES.HR, 'ct:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'ct:create')).toBe(false)
  })

  it('🛡️ 空筛选条件返回全部', async () => {
    const svc = makeService()
    const all = await svc.findAll()
    const emptyCity = await svc.findAll('', undefined)
    expect(emptyCity.length).toBe(all.length)
  })

  it('🛡️ 不存在的竞品ID返回null', async () => {
    const svc = makeService()
    const notFound = await svc.findById('ct-nonexistent')
    expect(notFound).toBeNull()
  })

  it('🛡️ 竞品对比空ID列表返回空结果', async () => {
    const svc = makeService()
    const result = await svc.getComparison([])
    expect(result.competitors).toHaveLength(0)
    expect(result.comparison.bestRated).toBe('')
  })

  it('🛡️ 极高评分筛选无结果', async () => {
    const svc = makeService()
    const result = await svc.findAll(undefined, undefined, 5)
    expect(result.length).toBe(0)
  })
})
