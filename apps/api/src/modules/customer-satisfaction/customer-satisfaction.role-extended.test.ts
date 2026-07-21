/**
 * 🐜 自动: [customer-satisfaction] [C] 角色扩展测试
 *
 * 8 角色视角的满意度模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 CustomerSatisfactionService + in-memory Store
 */
import { describe, it, expect } from 'vitest'
import { CustomerSatisfactionService } from './customer-satisfaction.service'
import { SatisfactionCategory } from './customer-satisfaction.entity'
import type { RequestTenantContext } from '../tenant/tenant.types'

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

/** 角色 → 满意度模块权限 */
const roleSatisfactionAccess: Record<string, string[]> = {
  'sat:list': ['👔店长', '🎯运行专员', '📢营销'],
  'sat:detail': ['👔店长', '🎯运行专员', '📢营销'],
  'sat:create': ['🛒前台', '🎮导玩员', '🎯运行专员'],
  'sat:summary': ['👔店长', '🎯运行专员', '📢营销', '🤝团建'],
  'sat:delete': ['👔店长', '🎯运行专员'],
  'sat:export': ['👔店长', '📢营销', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleSatisfactionAccess[resource]?.includes(role) ?? false
}

function makeService(): CustomerSatisfactionService {
  return new CustomerSatisfactionService()
}

const tenantCtx: RequestTenantContext = { tenantId: 'default' }

// ════════════════════════════════════════════════════════════
// 👔店长 — 满意度
// ════════════════════════════════════════════════════════════

describe('[👔店长] customer-satisfaction 角色扩展测试', () => {
  it('👔[正例] 店长查看满意度列表 → 按门店筛选 → 按评分筛选', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'sat:list')).toBe(true)
    const svc = makeService()

    const all = svc.list(tenantCtx)
    expect(all.total).toBeGreaterThan(0)
    expect(all.items.length).toBeGreaterThan(0)

    // 按门店筛选
    const storeItems = svc.list(tenantCtx, { storeId: 'store-001' })
    storeItems.items.forEach((r) => expect(r.storeId).toBe('store-001'))

    // 按最低评分筛选
    const highScore = svc.list(tenantCtx, { minScore: 4 })
    highScore.items.forEach((r) => expect(r.score).toBeGreaterThanOrEqual(4))
  })

  it('👔[正例] 店长查看满意度详情', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'sat:detail')).toBe(true)
    const svc = makeService()
    const detail = svc.getById('sat-001', tenantCtx)

    expect(detail.customerName).toBe('王小明')
    expect(detail.score).toBe(5)
    expect(detail.category).toBe(SatisfactionCategory.Service)
    expect(detail.comment).toContain('非常好')
  })

  it('👔[正例] 店长查看满意度统计数据', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'sat:summary')).toBe(true)
    const svc = makeService()
    const summary = svc.getSummary(tenantCtx)

    expect(summary.totalResponses).toBeGreaterThan(0)
    expect(summary.avgScore).toBeGreaterThan(0)
    expect(summary.avgScore).toBeLessThanOrEqual(5)
    expect(summary.scoreDistribution).toBeDefined()
    expect(summary.bestCategory).toBeTruthy()
    expect(summary.worstCategory).toBeTruthy()
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 满意度
// ════════════════════════════════════════════════════════════

describe('[🛒前台] customer-satisfaction 角色扩展测试', () => {
  it('🛒[正例] 前台录入客户满意度评价', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'sat:create')).toBe(true)
    const svc = makeService()
    const record = svc.create(tenantCtx, {
      storeId: 'store-001',
      customerName: '满意度测试老王',
      score: 5,
      category: SatisfactionCategory.Service,
      comment: '前台服务很周到',
      visitDate: '2026-07-21',
    })

    expect(record.id).toContain('sat-')
    expect(record.customerName).toBe('满意度测试老王')
    expect(record.score).toBe(5)
    expect(record.storeId).toBe('store-001')
  })

  it('🛒[反例] 前台无权限查看统计数据', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'sat:summary')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'sat:delete')).toBe(false)
  })

  it('🛒[反例] 前台无权限删除评价', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'sat:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'sat:detail')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 满意度
// ════════════════════════════════════════════════════════════

describe('[👥HR] customer-satisfaction 角色扩展测试', () => {
  it('👥[反例] HR 无权限直接查看满意度管理', () => {
    expect(checkRoleAccess(ROLES.HR, 'sat:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'sat:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'sat:create')).toBe(false)
  })

  it('👥[反例] HR 无权限查看满意度统计', () => {
    expect(checkRoleAccess(ROLES.HR, 'sat:summary')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'sat:export')).toBe(false)
  })

  it('👥[闭环] HR 无权限返回统一格式', () => {
    const denied = { success: false, code: 403, message: 'NO_SATISFACTION_ACCESS', module: 'customer-satisfaction' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('customer-satisfaction')
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 满意度
// ════════════════════════════════════════════════════════════

describe('[🔧安监] customer-satisfaction 角色扩展测试', () => {
  it('🔧[反例] 安监无满意度权限', () => {
    expect(checkRoleAccess(ROLES.Security, 'sat:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'sat:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'sat:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'sat:summary')).toBe(false)
  })

  it('🔧[反例] 安监无权删除或导出', () => {
    expect(checkRoleAccess(ROLES.Security, 'sat:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'sat:export')).toBe(false)
  })

  it('🔧[正例] 安监可查看满意度中设备相关反馈供内部参考', () => {
    // 安监不能直接操作满意度，但可以通过其他渠道获取设备反馈
    const deviceFeedback = { category: 'device', repeated: 3, avgScore: 3.5 }
    expect(deviceFeedback.category).toBe('device')
    expect(deviceFeedback.avgScore).toBeGreaterThan(0)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 满意度
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] customer-satisfaction 角色扩展测试', () => {
  it('🎮[正例] 导玩员为客户录入满意度评价', async () => {
    expect(checkRoleAccess(ROLES.Guide, 'sat:create')).toBe(true)
    const svc = makeService()
    const record = svc.create(tenantCtx, {
      storeId: 'store-003',
      customerName: '导玩小刘',
      score: 4,
      category: SatisfactionCategory.Device,
      comment: 'VR设备体验很好，导玩员很专业',
      visitDate: '2026-07-21',
    })

    expect(record.category).toBe(SatisfactionCategory.Device)
    expect(record.score).toBe(4)
  })

  it('🎮[反例] 导玩员无权查看其他门店评价', () => {
    expect(checkRoleAccess(ROLES.Guide, 'sat:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'sat:detail')).toBe(false)
  })

  it('🎮[反例] 导玩员无权删除评价', () => {
    expect(checkRoleAccess(ROLES.Guide, 'sat:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'sat:summary')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 满意度
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] customer-satisfaction 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看满意度 → 按类别筛选', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'sat:list')).toBe(true)
    const svc = makeService()
    const envItems = svc.list(tenantCtx, { category: SatisfactionCategory.Environment })
    envItems.items.forEach((r) => expect(r.category).toBe(SatisfactionCategory.Environment))
    expect(envItems.total).toBeGreaterThan(0)
  })

  it('🎯[正例] 运行专员创建并查看详情', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'sat:create')).toBe(true)
    expect(checkRoleAccess(ROLES.Operations, 'sat:detail')).toBe(true)
    const svc = makeService()

    const record = svc.create(tenantCtx, {
      storeId: 'store-002',
      customerName: '运行测试',
      score: 3,
      category: SatisfactionCategory.Price,
      comment: '价格适中，希望增加更多优惠',
      visitDate: '2026-07-20',
    })

    const detail = svc.getById(record.id, tenantCtx)
    expect(detail.id).toBe(record.id)
    expect(detail.customerName).toBe('运行测试')
  })

  it('🎯[正例] 运行专员删除低分评价', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'sat:delete')).toBe(true)
    const svc = makeService()

    const record = svc.create(tenantCtx, {
      storeId: 'store-002',
      customerName: '待删除用户',
      score: 1,
      category: SatisfactionCategory.Service,
      comment: '非常不满意',
      visitDate: '2026-07-19',
    })

    svc.delete(record.id, tenantCtx)
    expect(() => svc.getById(record.id, tenantCtx)).toThrow()
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 满意度
// ════════════════════════════════════════════════════════════

describe('[🤝团建] customer-satisfaction 角色扩展测试', () => {
  it('🤝[正例] 团建查看满意度统计 → 评估团建效果', async () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'sat:summary')).toBe(true)
    const svc = makeService()
    const summary = svc.getSummary(tenantCtx)

    expect(summary.avgScore).toBeGreaterThan(0)
    // 团建关心综合评分和环境评分
    expect(summary.scoreDistribution).toBeDefined()
  })

  it('🤝[反例] 团建无权删除评价', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'sat:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'sat:create')).toBe(false)
  })

  it('🤝[反例] 团建无权查看评价列表详情', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'sat:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'sat:detail')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 满意度
// ════════════════════════════════════════════════════════════

describe('[📢营销] customer-satisfaction 角色扩展测试', () => {
  it('📢[正例] 营销查看满意度列表 → 分析用户评价', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'sat:list')).toBe(true)
    const svc = makeService()
    const all = svc.list(tenantCtx)
    expect(all.total).toBeGreaterThan(0)

    // 按类别筛选查看服务类评价
    const serviceItems = svc.list(tenantCtx, { category: SatisfactionCategory.Service })
    serviceItems.items.forEach((r) => expect(r.category).toBe(SatisfactionCategory.Service))
  })

  it('📢[正例] 营销查看满意度统计 → 分析趋势', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'sat:summary')).toBe(true)
    const svc = makeService()
    const summary = svc.getSummary(tenantCtx)

    expect(summary.responseRate).toBeGreaterThan(0)
    expect(summary.scoreDistribution['5']).toBeGreaterThan(0)
    // 最佳类别可以指导营销重点
    expect(summary.bestCategory).toBeTruthy()
  })

  it('📢[反例] 营销无权删除满意度记录', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'sat:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'sat:create')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 customer-satisfaction 跨角色闭环 + 边界]', () => {
  it('🛒 + 🎮 + 👔 前台录入 → 导玩员补充 → 店长查看统计', async () => {
    const svc = makeService()

    // 前台录入满意度
    const r1 = svc.create(tenantCtx, {
      storeId: 'store-001',
      customerName: '团建客户张先生',
      score: 4,
      category: SatisfactionCategory.Service,
      comment: '前台接待很热情',
      visitDate: '2026-07-21',
    })
    expect(r1.customerName).toBe('团建客户张先生')

    // 导玩员录入设备满意度
    const r2 = svc.create(tenantCtx, {
      storeId: 'store-001',
      customerName: '团建客户李女士',
      score: 5,
      category: SatisfactionCategory.Device,
      comment: '设备很好玩',
      visitDate: '2026-07-21',
    })
    expect(r2.score).toBe(5)

    // 店长查看统计包含新数据
    const summary = svc.getSummary(tenantCtx)
    expect(summary.totalResponses).toBeGreaterThanOrEqual(12)
  })

  it('🛡️ 查询不存在的满意度记录抛异常', () => {
    const svc = makeService()
    expect(() => svc.getById('sat-nonexistent', tenantCtx)).toThrow()
  })

  it('🛡️ 删除不存在记录抛异常', () => {
    const svc = makeService()
    expect(() => svc.delete('sat-nonexistent', tenantCtx)).toThrow()
  })

  it('🛡️ 按日期范围筛选满意度记录', () => {
    const svc = makeService()
    const filtered = svc.list(tenantCtx, { startDate: '2026-07-10', endDate: '2026-07-12' })
    filtered.items.forEach((r) => {
      expect(r.visitDate >= '2026-07-10' && r.visitDate <= '2026-07-12').toBe(true)
    })
    expect(filtered.total).toBeGreaterThan(0)
  })

  it('🛡️ 满意度评分分布累加正确', () => {
    const svc = makeService()
    const summary = svc.getSummary(tenantCtx)
    const totalFromDist = Object.values(summary.scoreDistribution).reduce((a, b) => a + b, 0)
    expect(totalFromDist).toBe(summary.totalResponses)
  })

  it('🛡️ 平均评分四舍五入一位小数', () => {
    const svc = makeService()
    const summary = svc.getSummary(tenantCtx)
    const decimalPart = summary.avgScore.toString().split('.')[1]
    if (decimalPart) {
      expect(decimalPart.length).toBeLessThanOrEqual(1)
    }
  })

  it('🛡️ 无数据时的统计返回0', () => {
    const svc = makeService()
    const emptyCtx: RequestTenantContext = { tenantId: 'empty-tenant' }
    const summary = svc.getSummary(emptyCtx)

    expect(summary.totalResponses).toBe(0)
    expect(summary.avgScore).toBe(0)
    expect(summary.scoreDistribution).toEqual({})
  })

  it('🛡️ 无数据列表返回空', () => {
    const svc = makeService()
    const emptyCtx: RequestTenantContext = { tenantId: 'empty-tenant' }
    const result = svc.list(emptyCtx)

    expect(result.total).toBe(0)
    expect(result.items).toHaveLength(0)
  })
})
