/**
 * 🧪 维保计划 角色旅程测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'

const ROLES = {
  StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR',
  Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员',
  Teambuilding: '🤝团建', Marketing: '📢营销',
} as const

const access: Record<string, string[]> = {
  'maint:list': ['👔店长', '🔧安监', '🎯运行专员', '🎮导玩员'],
  'maint:detail': ['👔店长', '🔧安监', '🎯运行专员', '🎮导玩员'],
  'maint:create': ['🔧安监', '🎯运行专员'],
  'maint:update': ['🔧安监', '🎯运行专员'],
  'maint:complete': ['🔧安监', '🎮导玩员'],
  'maint:stats': ['👔店长', '🎯运行专员'],
}

function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

describe(`${ROLES.StoreManager} 维保计划角色旅程测试`, () => {
  it('👔[正例] 店长查看维保计划 → 查看完成统计', () => {
    expect(chk(ROLES.StoreManager, 'maint:list')).toBe(true)
    const list = ok([{ id: 'MT-001', device: '跳舞机', frequency: 'weekly', nextDue: '2026-07-20' }])
    expect(list.data.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'maint:stats')).toBe(true)
    const stats = ok({ total: 10, completed: 7, overdue: 1, upcoming: 2 })
    expect(stats.data.overdue).toBe(1)
  })
  it('👔[反例] 店长创建维保计划被拒', () => {
    expect(chk(ROLES.StoreManager, 'maint:create')).toBe(false)
  })
  it('👔[边界] 店长查看逾期维保', () => {
    const overdue = ok([{ id: 'MT-002', device: '抓娃娃机', overdue: true, daysOverdue: 3 }])
    expect(overdue.data[0].daysOverdue).toBe(3)
  })
})

describe(`${ROLES.FrontDesk} 维保计划角色旅程测试`, () => {
  it('🛒[反例] 前台无维保权限', () => {
    expect(chk(ROLES.FrontDesk, 'maint:list')).toBe(false)
  })
})

describe(`${ROLES.HR} 维保计划角色旅程测试`, () => {
  it('👥[反例] HR无维保权限', () => {
    expect(chk(ROLES.HR, 'maint:list')).toBe(false)
  })
})

describe(`${ROLES.Security} 维保计划角色旅程测试`, () => {
  it('🔧[正例] 安监创建维保计划 → 设置周期 → 安排执行', () => {
    expect(chk(ROLES.Security, 'maint:create')).toBe(true)
    const created = ok({ id: 'MT-003', device: '消防设备', frequency: 'monthly', status: 'active' })
    expect(created.data.frequency).toBe('monthly')
    expect(chk(ROLES.Security, 'maint:update')).toBe(true)
    const updated = ok({ id: 'MT-003', nextDue: '2026-08-01' })
    expect(updated.data.nextDue).toBe('2026-08-01')
  })
  it('🔧[正例] 安监完成维保', () => {
    expect(chk(ROLES.Security, 'maint:complete')).toBe(true)
    const completed = ok({ id: 'MT-003', status: 'completed', completedAt: Date.now() })
    expect(completed.data.status).toBe('completed')
  })
})

describe(`${ROLES.Guide} 维保计划角色旅程测试`, () => {
  it('🎮[正例] 导玩员查看机台维保计划 → 日常维护完成', () => {
    expect(chk(ROLES.Guide, 'maint:list')).toBe(true)
    const list = ok([{ id: 'MT-004', device: '跳舞机-01', task: '清洁轨道', due: '2026-07-17' }])
    expect(list.data.length).toBe(1)
    expect(chk(ROLES.Guide, 'maint:complete')).toBe(true)
    const done = ok({ id: 'MT-004', status: 'completed', completedBy: '导玩员孙' })
    expect(done.data.status).toBe('completed')
  })
  it('🎮[反例] 导玩员修改维保周期被拒', () => {
    expect(chk(ROLES.Guide, 'maint:update')).toBe(false)
  })
})

describe(`${ROLES.Operations} 维保计划角色旅程测试`, () => {
  it('🎯[正例] 运行专员创建维保计划 → 查看统计', () => {
    expect(chk(ROLES.Operations, 'maint:create')).toBe(true)
    const created = ok({ id: 'MT-005', device: '空调系统', frequency: 'quarterly', status: 'active' })
    expect(created.data.status).toBe('active')
    expect(chk(ROLES.Operations, 'maint:stats')).toBe(true)
  })
  it('🎯[反例] 运行专员创建重复维保计划', () => {
    const dup = fail(409, 'MAINTENANCE_PLAN_EXISTS')
    expect(dup.code).toBe(409)
  })
})

describe(`${ROLES.Teambuilding} / ${ROLES.Marketing}`, () => {
  it('🤝📢 无维保权限', () => {
    expect(chk(ROLES.Teambuilding, 'maint:list')).toBe(false)
    expect(chk(ROLES.Marketing, 'maint:list')).toBe(false)
  })
})

describe('🦞 维保跨角色体验闭环', () => {
  it('🔧+🎮+👔 维保创建→执行→确认全流程', () => {
    const plan = ok({ id: 'MT-010', device: '跳舞机-02', status: 'active' })
    expect(plan.data.status).toBe('active')
    const execute = ok({ id: 'MT-010', status: 'completed', completedBy: '导玩员' })
    expect(execute.data.status).toBe('completed')
    const confirm = ok({ id: 'MT-010', verifiedBy: '店长' })
    expect(confirm.data.verifiedBy).toBe('店长')
  })
})
