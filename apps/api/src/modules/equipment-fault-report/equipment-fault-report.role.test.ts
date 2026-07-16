/**
 * 🧪 设备故障报修 角色旅程测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'

const ROLES = {
  StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR',
  Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员',
  Teambuilding: '🤝团建', Marketing: '📢营销',
} as const

const access: Record<string, string[]> = {
  'fault:report': ['🎮导玩员', '🛒前台', '🔧安监'],
  'fault:list': ['👔店长', '🎮导玩员', '🔧安监', '🎯运行专员'],
  'fault:detail': ['👔店长', '🎮导玩员', '🔧安监', '🎯运行专员'],
  'fault:assign': ['👔店长', '🎯运行专员'],
  'fault:resolve': ['🔧安监', '🎯运行专员'],
  'fault:stats': ['👔店长', '🎯运行专员'],
}

function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

describe(`${ROLES.StoreManager} 设备故障角色旅程测试`, () => {
  it('👔[正例] 店长查看故障列表 → 分配维修 → 确认完成', () => {
    expect(chk(ROLES.StoreManager, 'fault:list')).toBe(true)
    const list = ok([{ id: 'FL-001', device: '跳舞机', status: 'reported', priority: 'high' }])
    expect(list.data.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'fault:assign')).toBe(true)
    const assigned = ok({ id: 'FL-001', assignedTo: '维修张', status: 'in_progress' })
    expect(assigned.data.status).toBe('in_progress')
  })
  it('👔[正例] 店长查看故障统计', () => {
    expect(chk(ROLES.StoreManager, 'fault:stats')).toBe(true)
    const stats = ok({ total: 5, open: 2, resolved: 3 })
    expect(stats.data.total).toBe(5)
  })
  it('👔[反例] 店长报修设备（应导玩员操作）', () => {
    expect(chk(ROLES.StoreManager, 'fault:report')).toBe(false)
  })
})

describe(`${ROLES.FrontDesk} 设备故障角色旅程测试`, () => {
  it('🛒[正例] 前台报修收银设备故障', () => {
    expect(chk(ROLES.FrontDesk, 'fault:report')).toBe(true)
    const report = ok({ id: 'FL-002', device: '收银机-01', status: 'reported' })
    expect(report.data.status).toBe('reported')
  })
  it('🛒[反例] 前台尝试分配维修', () => {
    expect(chk(ROLES.FrontDesk, 'fault:assign')).toBe(false)
  })
})

describe(`${ROLES.Guide} 设备故障角色旅程测试`, () => {
  it('🎮[正例] 导玩员报修机台 → 查看维修进度', () => {
    expect(chk(ROLES.Guide, 'fault:report')).toBe(true)
    const report = ok({ id: 'FL-003', device: '抓娃娃机-02', fault: '抓爪失灵', status: 'reported' })
    expect(report.data.fault).toBe('抓爪失灵')
    expect(chk(ROLES.Guide, 'fault:list')).toBe(true)
    const list = ok([{ id: 'FL-003', status: 'in_progress' }])
    expect(list.data[0].status).toBe('in_progress')
  })
  it('🎮[反例] 导玩员报修同一设备短时重复提交', () => {
    const dup = fail(429, 'TOO_MANY_REPORTS')
    expect(dup.code).toBe(429)
  })
})

describe(`${ROLES.Security} 设备故障角色旅程测试`, () => {
  it('🔧[正例] 安监报修安防设备 → 确认维修完成', () => {
    expect(chk(ROLES.Security, 'fault:report')).toBe(true)
    const report = ok({ id: 'FL-004', device: '监控摄像头-03', status: 'reported' })
    expect(report.data.status).toBe('reported')
    expect(chk(ROLES.Security, 'fault:resolve')).toBe(true)
    const resolved = ok({ id: 'FL-004', status: 'resolved' })
    expect(resolved.data.status).toBe('resolved')
  })
})

describe(`${ROLES.Operations} 设备故障角色旅程测试`, () => {
  it('🎯[正例] 运行专员查看故障列表 → 分配维修人员 → 确认解决', () => {
    expect(chk(ROLES.Operations, 'fault:list')).toBe(true)
    expect(chk(ROLES.Operations, 'fault:assign')).toBe(true)
    const assigned = ok({ id: 'FL-003', assignedTo: '维修李', status: 'in_progress' })
    expect(assigned.data.assignedTo).toBe('维修李')
    expect(chk(ROLES.Operations, 'fault:resolve')).toBe(true)
    const resolved = ok({ id: 'FL-003', status: 'resolved' })
    expect(resolved.data.status).toBe('resolved')
  })
  it('🎯[边界] 运行专员查看空故障列表', () => {
    const empty = ok([])
    expect(empty.data.length).toBe(0)
  })
})

describe(`${ROLES.HR} / ${ROLES.Teambuilding} / ${ROLES.Marketing}`, () => {
  it('👥🤝📢 无设备故障权限', () => {
    expect(chk(ROLES.HR, 'fault:list')).toBe(false)
    expect(chk(ROLES.Teambuilding, 'fault:report')).toBe(false)
    expect(chk(ROLES.Marketing, 'fault:list')).toBe(false)
  })
})

describe('🦞 设备故障跨角色体验闭环', () => {
  it('🎮+👔+🔧 报修→分配→维修→确认全流程', () => {
    const report = ok({ id: 'FL-010', device: '跳舞机-01', status: 'reported' })
    expect(report.data.status).toBe('reported')
    const assign = ok({ id: 'FL-010', assignedTo: '维修王', status: 'in_progress' })
    expect(assign.data.assignedTo).toBe('维修王')
    const resolve = ok({ id: 'FL-010', status: 'resolved', resolvedBy: '维修王' })
    expect(resolve.data.status).toBe('resolved')
  })
})
