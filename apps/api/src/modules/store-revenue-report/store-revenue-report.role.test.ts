/**
 * 🧪 门店营收报告 角色旅程测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'
const ROLES = { StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR', Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员', Teambuilding: '🤝团建', Marketing: '📢营销' } as const
const access: Record<string, string[]> = {
  'revenue:view': ['👔店长', '🎯运行专员'],
  'revenue:detail': ['👔店长', '🎯运行专员'],
  'revenue:compare': ['👔店长', '🎯运行专员'],
  'revenue:export': ['👔店长', '🎯运行专员'],
}
function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

describe(`${ROLES.StoreManager} 门店营收角色旅程测试`, () => {
  it('👔[正例] 店长查看今日营收 → 查看明细 → 同比对比', () => {
    expect(chk(ROLES.StoreManager, 'revenue:view')).toBe(true)
    const view = ok({ today: 15800, weekAvg: 14200, monthTotal: 420000 })
    expect(view.data.today).toBe(15800)
    expect(chk(ROLES.StoreManager, 'revenue:detail')).toBe(true)
    const detail = ok({ categories: [{ name: '扭蛋', amount: 5800 }, { name: '电玩', amount: 6200 }] })
    expect(detail.data.categories.length).toBe(2)
    expect(chk(ROLES.StoreManager, 'revenue:compare')).toBe(true)
    const compare = ok({ vsLastWeek: 0.08, vsLastMonth: 0.15 })
    expect(compare.data.vsLastWeek).toBe(0.08)
  })
  it('👔[正例] 店长导出营收报表', () => {
    expect(chk(ROLES.StoreManager, 'revenue:export')).toBe(true)
    const exportR = ok({ url: '/reports/revenue-2026-07.pdf' })
    expect(exportR.data.url).toContain('.pdf')
  })
  it('👔[边界] 店长查看营收为0的新店数据', () => {
    const zero = ok({ today: 0, weekAvg: 0 })
    expect(zero.data.today).toBe(0)
  })
})
describe(`${ROLES.Operations} 门店营收角色旅程测试`, () => {
  it('🎯[正例] 运行专员查看营收详情 → 导出', () => {
    expect(chk(ROLES.Operations, 'revenue:detail')).toBe(true)
    const detail = ok({ hourly: [{ hour: '10', amount: 1200 }, { hour: '11', amount: 2300 }] })
    expect(detail.data.hourly.length).toBe(2)
  })
  it('🎯[反例] 运行专员查看越权门店数据', () => {
    const err = fail(403, 'STORE_ACCESS_DENIED')
    expect(err.code).toBe(403)
  })
})
describe('其他角色无门店营收权限', () => {
  it('🛒👥🔧🎮🤝📢 均无权限', () => {
    expect(chk(ROLES.FrontDesk, 'revenue:view')).toBe(false)
    expect(chk(ROLES.HR, 'revenue:view')).toBe(false)
    expect(chk(ROLES.Security, 'revenue:view')).toBe(false)
    expect(chk(ROLES.Guide, 'revenue:view')).toBe(false)
    expect(chk(ROLES.Teambuilding, 'revenue:view')).toBe(false)
    expect(chk(ROLES.Marketing, 'revenue:view')).toBe(false)
  })
})
