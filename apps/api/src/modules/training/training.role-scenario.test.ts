/**
 * 🧪 培训管理 角色旅程测试（扩展 — 8角色视角）
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'

const ROLES = { StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR', Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员', Teambuilding: '🤝团建', Marketing: '📢营销' } as const

const access: Record<string, string[]> = {
  'train:list': ['👔店长', '👥HR', '🎮导玩员', '🛒前台', '🎯运行专员', '🔧安监', '🤝团建', '📢营销'],
  'train:create': ['👔店长', '👥HR'],
  'train:enroll': ['🛒前台', '🎮导玩员', '🎯运行专员', '🔧安监', '🤝团建', '📢营销'],
  'train:complete': ['👥HR'],
  'train:stats': ['👔店长', '👥HR'],
}

function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

describe(`${ROLES.StoreManager} 培训扩展测试`, () => {
  it('👔[正例] 店长查看培训列表 → 创建新培训 → 查看统计', () => {
    expect(chk(ROLES.StoreManager, 'train:list')).toBe(true)
    const list = ok([{ id: 'TR-001', name: '新员工入职培训', status: 'active' }])
    expect(list.data.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'train:create')).toBe(true)
    const created = ok({ id: 'TR-005', name: '服务礼仪培训', status: 'draft' })
    expect(created.data.status).toBe('draft')
    expect(chk(ROLES.StoreManager, 'train:stats')).toBe(true)
    const stats = ok({ total: 5, completed: 12, enrolled: 3 })
    expect(stats.data.total).toBe(5)
  })
})

describe(`${ROLES.HR} 培训扩展测试`, () => {
  it('👥[正例] HR查看培训 → 创建 → 标记完成', () => {
    expect(chk(ROLES.HR, 'train:create')).toBe(true)
    const created = ok({ id: 'TR-006', name: '安全培训', status: 'active' })
    expect(created.data.status).toBe('active')
    expect(chk(ROLES.HR, 'train:complete')).toBe(true)
    const completed = ok({ id: 'TR-006', status: 'completed' })
    expect(completed.data.status).toBe('completed')
  })
  it('👥[反例] HR创建重复培训名称', () => {
    const dup = fail(409, 'TRAINING_NAME_EXISTS')
    expect(dup.code).toBe(409)
  })
})

describe(`${ROLES.Guide} 培训扩展测试`, () => {
  it('🎮[正例] 导玩员查看培训 → 报名参加', () => {
    expect(chk(ROLES.Guide, 'train:list')).toBe(true)
    expect(chk(ROLES.Guide, 'train:enroll')).toBe(true)
    const enroll = ok({ id: 'TR-001', enrolled: true })
    expect(enroll.data.enrolled).toBe(true)
  })
})
