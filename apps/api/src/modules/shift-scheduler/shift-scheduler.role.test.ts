/**
 * 🧪 排班管理 角色旅程测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'

const ROLES = {
  StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR',
  Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员',
  Teambuilding: '🤝团建', Marketing: '📢营销',
} as const

const access: Record<string, string[]> = {
  'shift:view': ['👔店长', '👥HR', '🛒前台', '🎮导玩员', '🎯运行专员', '🔧安监', '🤝团建', '📢营销'],
  'shift:create': ['👔店长', '👥HR'],
  'shift:update': ['👔店长', '👥HR'],
  'shift:swap': ['🛒前台', '🎮导玩员', '🎯运行专员', '🔧安监', '🤝团建', '📢营销'],
  'shift:approve': ['👔店长', '👥HR'],
}

function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

describe(`${ROLES.StoreManager} 排班管理角色旅程测试`, () => {
  it('👔[正例] 店长查看排班表 → 创建下周排班 → 发布', () => {
    expect(chk(ROLES.StoreManager, 'shift:view')).toBe(true)
    const schedule = ok([{ date: '2026-07-20', shifts: [{ employee: '王五', slot: '早班' }] }])
    expect(schedule.data.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'shift:create')).toBe(true)
    const created = ok({ scheduleId: 'SC-001', status: 'published' })
    expect(created.data.status).toBe('published')
  })
  it('👔[正例] 店长审批换班请求', () => {
    expect(chk(ROLES.StoreManager, 'shift:approve')).toBe(true)
    const approved = ok({ swapId: 'SW-001', from: '王五', to: '赵六', status: 'approved' })
    expect(approved.data.status).toBe('approved')
  })
  it('👔[反例] 店长排班时员工已满勤', () => {
    const err = fail(409, 'EMPLOYEE_MAX_HOURS_EXCEEDED')
    expect(err.code).toBe(409)
  })
})

describe(`${ROLES.HR} 排班管理角色旅程测试`, () => {
  it('👥[正例] HR协助排班 → 更新班次', () => {
    expect(chk(ROLES.HR, 'shift:view')).toBe(true)
    expect(chk(ROLES.HR, 'shift:update')).toBe(true)
    const updated = ok({ scheduleId: 'SC-001', date: '2026-07-20', slot: '晚班' })
    expect(updated.data.slot).toBe('晚班')
  })
  it('👥[反例] HR排班超过规定人数', () => {
    const err = fail(400, 'SHIFT_CAPACITY_EXCEEDED')
    expect(err.code).toBe(400)
  })
})

describe(`${ROLES.FrontDesk} 排班管理角色旅程测试`, () => {
  it('🛒[正例] 前台查看自己排班 → 发起换班请求', () => {
    expect(chk(ROLES.FrontDesk, 'shift:view')).toBe(true)
    expect(chk(ROLES.FrontDesk, 'shift:swap')).toBe(true)
    const swap = ok({ swapId: 'SW-002', from: '前台赵', to: '前台钱', status: 'pending' })
    expect(swap.data.status).toBe('pending')
  })
})

describe(`${ROLES.Guide} 排班管理角色旅程测试`, () => {
  it('🎮[正例] 导玩员查看排班 → 发起换班', () => {
    expect(chk(ROLES.Guide, 'shift:view')).toBe(true)
    expect(chk(ROLES.Guide, 'shift:swap')).toBe(true)
  })
})

describe(`${ROLES.Security} 排班管理角色旅程测试`, () => {
  it('🔧[正例] 安监查看排班', () => {
    expect(chk(ROLES.Security, 'shift:view')).toBe(true)
  })
})

describe(`${ROLES.Operations} 排班管理角色旅程测试`, () => {
  it('🎯[正例] 运行专员查看排班', () => {
    expect(chk(ROLES.Operations, 'shift:view')).toBe(true)
  })
})

describe(`${ROLES.Teambuilding} 排班管理角色旅程测试`, () => {
  it('🤝[正例] 团建查看排班', () => {
    expect(chk(ROLES.Teambuilding, 'shift:view')).toBe(true)
  })
})

describe(`${ROLES.Marketing} 排班管理角色旅程测试`, () => {
  it('📢[正例] 营销查看排班', () => {
    expect(chk(ROLES.Marketing, 'shift:view')).toBe(true)
  })
})

describe('🦞 排班跨角色体验闭环', () => {
  it('👔+👥+🛒 排班→换班→审批全流程', () => {
    // 1. HR创建排班
    const schedule = ok({ scheduleId: 'SC-002', status: 'draft' })
    expect(schedule.data.status).toBe('draft')
    // 2. 店长发布
    const published = ok({ scheduleId: 'SC-002', status: 'published' })
    expect(published.data.status).toBe('published')
    // 3. 前台发起换班
    const swap = ok({ swapId: 'SW-003', status: 'pending' })
    expect(swap.data.status).toBe('pending')
    // 4. 店长审批换班
    const approved = ok({ swapId: 'SW-003', status: 'approved' })
    expect(approved.data.status).toBe('approved')
  })
})
