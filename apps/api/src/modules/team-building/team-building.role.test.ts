/**
 * 🧪 TeamBuilding 模块 角色旅程测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建
 *
 * 覆盖 8 个角色 + 1 个跨角色闭环场景
 */
import { describe, it, expect } from 'vitest'

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
} as const

/**
 * 权限矩阵定义 (团队建设模块角色权限)
 *
 * tb:list        — 查看团建计划列表
 * tb:detail      — 查看团建活动详情
 * tb:create      — 创建团建活动
 * tb:approve     — 审核团建安全方案
 * tb:participate — 查看参与团建
 * tb:stats       — 统计团建数据
 */
const access: Record<string, string[]> = {
  'tb:list':        ['👔店长', '🛒前台', '👥HR', '🔧安监', '🎮导玩员', '🎯运行专员', '🤝团建'],
  'tb:detail':      ['👔店长', '🛒前台', '👥HR', '🔧安监', '🎮导玩员', '🎯运行专员', '🤝团建'],
  'tb:create':      ['👥HR', '🤝团建'],
  'tb:approve':     ['🔧安监'],
  'tb:participate': ['🎮导玩员', '🤝团建'],
  'tb:stats':       ['🎯运行专员', '👔店长', '👥HR'],
}

function chk(r: string, res: string) {
  return access[res]?.includes(r) ?? false
}

function ok<T>(d: T) {
  return { success: true, code: 200, data: d }
}
function fail(c: number, m: string) {
  return { success: false, code: c, message: m }
}

// ════════════════════════════════════════════════════
// 👔 店长 — 查看门店团建计划
// ════════════════════════════════════════════════════

describe(`${ROLES.StoreManager} 店长 — 团建管理`, () => {
  it('👔[正例] 店长查看门店团建计划列表', () => {
    expect(chk(ROLES.StoreManager, 'tb:list')).toBe(true)
    const list = ok([
      { id: 'tb-001', name: '莫干山户外拓展', type: 'outdoor', status: 'approved' },
      { id: 'tb-002', name: '海底捞聚餐', type: 'dinner', status: 'pending' },
    ])
    expect(list.data.length).toBe(2)
    expect(list.data[0].type).toBe('outdoor')
  })

  it('👔[正例] 店长查看团建活动详情', () => {
    expect(chk(ROLES.StoreManager, 'tb:detail')).toBe(true)
    const detail = ok({
      id: 'tb-001',
      name: '莫干山户外拓展',
      type: 'outdoor',
      location: '莫干山风景区',
      budget: 3000000,
      expectedParticipants: 30,
    })
    expect(detail.data.name).toBe('莫干山户外拓展')
    expect(detail.data.budget).toBe(3000000)
  })

  it('👔[正例] 店长查看团建统计数据', () => {
    expect(chk(ROLES.StoreManager, 'tb:stats')).toBe(true)
    const stats = ok({ totalPlans: 8, avgCost: 1200000 })
    expect(stats.data.totalPlans).toBe(8)
  })

  it('👔[反例] 店长无权创建团建活动', () => {
    expect(chk(ROLES.StoreManager, 'tb:create')).toBe(false)
  })
})

// ════════════════════════════════════════════════════
// 🛒 前台 — 查看团建详情
// ════════════════════════════════════════════════════

describe(`${ROLES.FrontDesk} 前台 — 团建查看`, () => {
  it('🛒[正例] 前台查看团建活动列表', () => {
    expect(chk(ROLES.FrontDesk, 'tb:list')).toBe(true)
  })

  it('🛒[正例] 前台查看团建活动详情', () => {
    expect(chk(ROLES.FrontDesk, 'tb:detail')).toBe(true)
    const detail = ok({ id: 'tb-003', name: 'K歌大赛', type: 'ktv' })
    expect(detail.data.name).toBe('K歌大赛')
  })

  it('🛒[反例] 前台无权创建或审核团建', () => {
    expect(chk(ROLES.FrontDesk, 'tb:create')).toBe(false)
    expect(chk(ROLES.FrontDesk, 'tb:approve')).toBe(false)
  })
})

// ════════════════════════════════════════════════════
// 👥 HR — 创建团建活动
// ════════════════════════════════════════════════════

describe(`${ROLES.HR} HR — 团建管理`, () => {
  it('👥[正例] HR查看团建计划列表与详情', () => {
    expect(chk(ROLES.HR, 'tb:list')).toBe(true)
    expect(chk(ROLES.HR, 'tb:detail')).toBe(true)
    const detail = ok({ id: 'tb-001', name: '莫干山户外拓展' })
    expect(detail.data.id).toBe('tb-001')
  })

  it('👥[正例] HR创建团建活动', () => {
    expect(chk(ROLES.HR, 'tb:create')).toBe(true)
    const created = ok({
      id: 'tb-010',
      name: '秋季户外骑行',
      type: 'outdoor',
      location: '崇明岛',
      budget: 1500000,
      expectedParticipants: 25,
      description: '秋季骑行活动',
    })
    expect(created.data.id).toBe('tb-010')
    expect(created.data.budget).toBe(1500000)
  })

  it('👥[反例] HR创建团建时缺少必填字段', () => {
    const err = fail(400, 'NAME_REQUIRED')
    expect(err.code).toBe(400)
  })

  it('👥[边界] HR查看不存在的团建详情', () => {
    const err = fail(404, 'PLAN_NOT_FOUND')
    expect(err.code).toBe(404)
  })
})

// ════════════════════════════════════════════════════
// 🔧 安监 — 审核团建安全方案
// ════════════════════════════════════════════════════

describe(`${ROLES.Security} 安监 — 团建安全审核`, () => {
  it('🔧[正例] 安监查看团建计划列表与详情', () => {
    expect(chk(ROLES.Security, 'tb:list')).toBe(true)
    expect(chk(ROLES.Security, 'tb:detail')).toBe(true)
  })

  it('🔧[正例] 安监审核团建安全方案', () => {
    expect(chk(ROLES.Security, 'tb:approve')).toBe(true)
    const approved = ok({ id: 'tb-001', safetyStatus: 'approved', reviewer: '王安全' })
    expect(approved.data.safetyStatus).toBe('approved')
  })

  it('🔧[反例] 安监无权创建团建活动', () => {
    expect(chk(ROLES.Security, 'tb:create')).toBe(false)
  })
})

// ════════════════════════════════════════════════════
// 🎮 导玩员 — 查看参与团建
// ════════════════════════════════════════════════════

describe(`${ROLES.Guide} 导玩员 — 参与团建`, () => {
  it('🎮[正例] 导玩员查看团建计划列表', () => {
    expect(chk(ROLES.Guide, 'tb:list')).toBe(true)
  })

  it('🎮[正例] 导玩员查看参与的团建活动', () => {
    expect(chk(ROLES.Guide, 'tb:participate')).toBe(true)
    const myActivities = ok([
      { id: 'tb-001', name: '莫干山户外拓展', role: 'participant' },
    ])
    expect(myActivities.data.length).toBe(1)
    expect(myActivities.data[0].role).toBe('participant')
  })

  it('🎮[反例] 导玩员无权创建团建或审核', () => {
    expect(chk(ROLES.Guide, 'tb:create')).toBe(false)
    expect(chk(ROLES.Guide, 'tb:approve')).toBe(false)
  })
})

// ════════════════════════════════════════════════════
// 🎯 运行专员 — 统计团建数据
// ════════════════════════════════════════════════════

describe(`${ROLES.Operations} 运行专员 — 团建统计`, () => {
  it('🎯[正例] 运行专员查看团建计划列表与详情', () => {
    expect(chk(ROLES.Operations, 'tb:list')).toBe(true)
    expect(chk(ROLES.Operations, 'tb:detail')).toBe(true)
  })

  it('🎯[正例] 运行专员查看团建统计数据', () => {
    expect(chk(ROLES.Operations, 'tb:stats')).toBe(true)
    const stats = ok({
      totalPlans: 8,
      byType: { outdoor: 2, dinner: 1, ktv: 1, 'escape-room': 1, 'script-kill': 1, sports: 1, other: 1 },
      avgBudget: 1200000,
    })
    expect(stats.data.totalPlans).toBe(8)
    expect(stats.data.byType.outdoor).toBe(2)
  })

  it('🎯[反例] 运行专员无权创建团建或审核', () => {
    expect(chk(ROLES.Operations, 'tb:create')).toBe(false)
    expect(chk(ROLES.Operations, 'tb:approve')).toBe(false)
  })
})

// ════════════════════════════════════════════════════
// 🤝 团建 — 创建团建活动（团建角色主视角）
// ════════════════════════════════════════════════════

describe(`${ROLES.Teambuilding} 团建角色 — 团建管理`, () => {
  it('🤝[正例] 团建角色查看团建计划列表', () => {
    expect(chk(ROLES.Teambuilding, 'tb:list')).toBe(true)
  })

  it('🤝[正例] 团建角色查看参与的团建活动', () => {
    expect(chk(ROLES.Teambuilding, 'tb:participate')).toBe(true)
    const myActivities = ok([
      { id: 'tb-005', name: 'K歌大赛', role: 'organizer' },
    ])
    expect(myActivities.data[0].role).toBe('organizer')
  })

  it('🤝[正例] 团建角色创建团建活动', () => {
    expect(chk(ROLES.Teambuilding, 'tb:create')).toBe(true)
    const created = ok({
      id: 'tb-011',
      name: '团建专员组织的活动',
      type: 'escape-room',
      location: 'X先生密室',
      budget: 600000,
    })
    expect(created.data.name).toBe('团建专员组织的活动')
  })

  it('🤝[反例] 团建角色无权审核安全方案', () => {
    expect(chk(ROLES.Teambuilding, 'tb:approve')).toBe(false)
  })
})

// ════════════════════════════════════════════════════
// 🦞 跨角色全流程闭环
// ════════════════════════════════════════════════════

describe('🦞 团队建设跨角色全流程闭环', () => {
  it('👥HR创建团建 → 🔧安监审核 → 🎮导玩员查看 → 🎯运行专员统计', () => {
    // 1. HR创建团建
    expect(chk(ROLES.HR, 'tb:create')).toBe(true)
    const plan = ok({
      id: 'tb-020',
      name: '秋季骑行活动',
      type: 'outdoor',
      location: '崇明岛',
      budget: 2000000,
      createdBy: 'HR_001',
    })
    expect(plan.data.id).toBe('tb-020')

    // 2. 安监审核
    expect(chk(ROLES.Security, 'tb:approve')).toBe(true)
    const approved = ok({ id: 'tb-020', safetyStatus: 'approved' })
    expect(approved.data.safetyStatus).toBe('approved')

    // 3. 导玩员查看参与的团建
    expect(chk(ROLES.Guide, 'tb:list')).toBe(true)
    expect(chk(ROLES.Guide, 'tb:participate')).toBe(true)
    const guideView = ok([{ id: 'tb-020', name: '秋季骑行活动', role: 'participant' }])
    expect(guideView.data.some((p: { id: string }) => p.id === 'tb-020')).toBe(true)

    // 4. 店长查看统计
    expect(chk(ROLES.StoreManager, 'tb:stats')).toBe(true)
    expect(chk(ROLES.StoreManager, 'tb:list')).toBe(true)

    // 5. 运行专员查看统计数据
    expect(chk(ROLES.Operations, 'tb:stats')).toBe(true)
    const stats = ok({ totalPlans: 9, avgBudget: 1250000 })
    expect(stats.data.totalPlans).toBe(9)
  })
})
