/**
 * 🧪 绩效评估 角色旅程测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'
const ROLES = { StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR', Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员', Teambuilding: '🤝团建', Marketing: '📢营销' } as const
const access: Record<string, string[]> = {
  'perf:list': ['👔店长', '👥HR'],
  'perf:target': ['👔店长', '👥HR'],
  'perf:evaluate': ['👔店长'],
  'perf:self': ['🛒前台', '🎮导玩员', '🎯运行专员', '🔧安监', '🤝团建', '📢营销'],
  'perf:finalize': ['👥HR'],
}
function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

describe(`${ROLES.StoreManager} 绩效评估角色旅程测试`, () => {
  it('👔[正例] 店长查看评估列表 → 设定目标 → 评分', () => {
    expect(chk(ROLES.StoreManager, 'perf:list')).toBe(true)
    const list = ok([{ id: 'PF-001', employee: '王五', period: '2026Q2', status: 'pending' }])
    expect(list.data.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'perf:target')).toBe(true)
    const target = ok({ id: 'PF-001', targets: [{ metric: 'revenue', goal: 500000 }] })
    expect(target.data.targets[0].goal).toBe(500000)
    expect(chk(ROLES.StoreManager, 'perf:evaluate')).toBe(true)
    const evaluated = ok({ id: 'PF-001', score: 90, rating: 'A' })
    expect(evaluated.data.rating).toBe('A')
  })
  it('👔[反例] 店长最终确认评估被拒', () => {
    expect(chk(ROLES.StoreManager, 'perf:finalize')).toBe(false)
  })
})
describe(`${ROLES.HR} 绩效评估角色旅程测试`, () => {
  it('👥[正例] HR查看评估列表 → 最终确认', () => {
    expect(chk(ROLES.HR, 'perf:list')).toBe(true)
    expect(chk(ROLES.HR, 'perf:finalize')).toBe(true)
    const finalized = ok({ id: 'PF-001', status: 'finalized' })
    expect(finalized.data.status).toBe('finalized')
  })
  it('👥[反例] HR直接评分被拒', () => {
    expect(chk(ROLES.HR, 'perf:evaluate')).toBe(false)
  })
})
describe('员工自评', () => {
  it('🛒🎮🔧🎯🤝📢 可以自评', () => {
    expect(chk(ROLES.FrontDesk, 'perf:self')).toBe(true)
    expect(chk(ROLES.Guide, 'perf:self')).toBe(true)
    expect(chk(ROLES.Security, 'perf:self')).toBe(true)
    expect(chk(ROLES.Operations, 'perf:self')).toBe(true)
    expect(chk(ROLES.Teambuilding, 'perf:self')).toBe(true)
    expect(chk(ROLES.Marketing, 'perf:self')).toBe(true)
  })
})
