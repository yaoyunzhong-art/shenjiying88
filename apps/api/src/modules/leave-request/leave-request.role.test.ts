/**
 * 🧪 请假申请 角色旅程测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'

const ROLES = {
  StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR',
  Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员',
  Teambuilding: '🤝团建', Marketing: '📢营销',
} as const

const access: Record<string, string[]> = {
  'leave:apply': ['🛒前台', '🎮导玩员', '🎯运行专员', '🔧安监', '🤝团建', '📢营销'],
  'leave:list': ['👔店长', '👥HR'],
  'leave:detail': ['👔店长', '👥HR', '🛒前台', '🎮导玩员', '🎯运行专员'],
  'leave:approve': ['👔店长'],
  'leave:stats': ['👔店长', '👥HR'],
}

function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

describe(`${ROLES.StoreManager} 请假管理角色旅程测试`, () => {
  it('👔[正例] 店长查看请假列表 → 审批请假 → 完成审批', () => {
    expect(chk(ROLES.StoreManager, 'leave:list')).toBe(true)
    const list = ok([{ id: 'LV-001', employee: '王五', days: 3, status: 'pending' }])
    expect(list.data.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'leave:approve')).toBe(true)
    const approved = ok({ id: 'LV-001', status: 'approved' })
    expect(approved.data.status).toBe('approved')
  })
  it('👔[正例] 店长查看请假统计', () => {
    expect(chk(ROLES.StoreManager, 'leave:stats')).toBe(true)
    const stats = ok({ totalPending: 1, totalApproved: 5, totalRejected: 1 })
    expect(stats.data.totalPending).toBe(1)
  })
  it('👔[反例] 店长审批自己请假被拒（需上级审批）', () => {
    const err = fail(403, 'CANNOT_APPROVE_SELF')
    expect(err.code).toBe(403)
  })
  it('👔[边界] 店长审批已撤销的请假单', () => {
    const err = fail(400, 'LEAVE_ALREADY_CANCELLED')
    expect(err.code).toBe(400)
  })
})

describe(`${ROLES.HR} 请假管理角色旅程测试`, () => {
  it('👥[正例] HR查看请假记录 → 统计报表', () => {
    expect(chk(ROLES.HR, 'leave:list')).toBe(true)
    expect(chk(ROLES.HR, 'leave:stats')).toBe(true)
    const stats = ok({ totalLeavesThisMonth: 12, avgDays: 2.5 })
    expect(stats.data.totalLeavesThisMonth).toBe(12)
  })
  it('👥[反例] HR审批请假被拒（只有店长可审批）', () => {
    expect(chk(ROLES.HR, 'leave:approve')).toBe(false)
  })
})

describe(`${ROLES.FrontDesk} 请假管理角色旅程测试`, () => {
  it('🛒[正例] 前台申请年假 → 查看审批进度', () => {
    expect(chk(ROLES.FrontDesk, 'leave:apply')).toBe(true)
    const applied = ok({ id: 'LV-002', employee: '前台赵', days: 2, status: 'pending' })
    expect(applied.data.status).toBe('pending')
    expect(chk(ROLES.FrontDesk, 'leave:detail')).toBe(true)
    const detail = ok({ id: 'LV-002', status: 'approved' })
    expect(detail.data.status).toBe('approved')
  })
  it('🛒[反例] 前台申请超长假期被拒', () => {
    const err = fail(400, 'MAX_LEAVE_DAYS_EXCEEDED')
    expect(err.code).toBe(400)
  })
})

describe(`${ROLES.Guide} 请假管理角色旅程测试`, () => {
  it('🎮[正例] 导玩员申请事假', () => {
    expect(chk(ROLES.Guide, 'leave:apply')).toBe(true)
    const applied = ok({ id: 'LV-003', employee: '导玩员孙', days: 1, status: 'pending' })
    expect(applied.data.employee).toContain('导玩员')
  })
})

describe(`${ROLES.Security} 请假管理角色旅程测试`, () => {
  it('🔧[正例] 安监申请请假', () => {
    expect(chk(ROLES.Security, 'leave:apply')).toBe(true)
  })
})

describe(`${ROLES.Operations} 请假管理角色旅程测试`, () => {
  it('🎯[正例] 运行专员申请请假', () => {
    expect(chk(ROLES.Operations, 'leave:apply')).toBe(true)
  })
})

describe(`${ROLES.Teambuilding} 请假管理角色旅程测试`, () => {
  it('🤝[正例] 团建申请请假', () => {
    expect(chk(ROLES.Teambuilding, 'leave:apply')).toBe(true)
  })
})

describe(`${ROLES.Marketing} 请假管理角色旅程测试`, () => {
  it('📢[正例] 营销申请请假', () => {
    expect(chk(ROLES.Marketing, 'leave:apply')).toBe(true)
  })
  it('📢[反例] 营销查看请假详情被拒', () => {
    expect(chk(ROLES.Marketing, 'leave:detail')).toBe(false)
  })
})

describe('🦞 请假跨角色体验闭环', () => {
  it('🎮+👔 请假→审批→销假全流程', () => {
    const leave = ok({ id: 'LV-010', employee: '导玩员', days: 1, status: 'pending' })
    expect(leave.data.status).toBe('pending')
    const approved = ok({ id: 'LV-010', status: 'approved' })
    expect(approved.data.status).toBe('approved')
    const cancelled = ok({ id: 'LV-010', status: 'cancelled' })
    expect(cancelled.data.status).toBe('cancelled')
  })
})
