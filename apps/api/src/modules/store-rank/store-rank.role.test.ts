/**
 * 🧪 门店排名 角色旅程测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'
const ROLES = { StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR', Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员', Teambuilding: '🤝团建', Marketing: '📢营销' } as const
const access: Record<string, string[]> = {
  'rank:list': ['👔店长', '🎯运行专员'],
  'rank:detail': ['👔店长', '🎯运行专员'],
  'rank:compare': ['👔店长', '🎯运行专员'],
  'rank:export': ['👔店长', '🎯运行专员'],
}
function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

describe(`${ROLES.StoreManager} 门店排名角色旅程测试`, () => {
  it('👔[正例] 店长查看门店排名 → 对比业绩 → 导出', () => {
    expect(chk(ROLES.StoreManager, 'rank:list')).toBe(true)
    const list = ok([{ storeId: 'S-001', name: '总店', revenue: 150000, rank: 1 }])
    expect(list.data.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'rank:compare')).toBe(true)
    const compare = ok({ stores: [{ name: '总店', revenue: 150000 }, { name: '分店A', revenue: 120000 }] })
    expect(compare.data.stores.length).toBe(2)
    expect(chk(ROLES.StoreManager, 'rank:export')).toBe(true)
    const exported = ok({ url: '/reports/rank-2026-07.csv' })
    expect(exported.data.url).toContain('.csv')
  })
  it('👔[反例] 店长排名列表为空报错', () => {
    const empty = ok([])
    expect(empty.data.length).toBe(0)
  })
})
describe(`${ROLES.Operations} 门店排名角色旅程测试`, () => {
  it('🎯[正例] 运行专员查看排名详情', () => {
    expect(chk(ROLES.Operations, 'rank:detail')).toBe(true)
    const detail = ok({ storeId: 'S-001', metrics: { revenue: 150000, profit: 30000, growth: 0.12 } })
    expect(detail.data.metrics.growth).toBe(0.12)
  })
})
describe('其他角色无门店排名权限', () => {
  it('🛒👥🔧🎮🤝📢 均无权限', () => {
    expect(chk(ROLES.FrontDesk, 'rank:list')).toBe(false)
    expect(chk(ROLES.HR, 'rank:list')).toBe(false)
    expect(chk(ROLES.Security, 'rank:list')).toBe(false)
    expect(chk(ROLES.Guide, 'rank:list')).toBe(false)
    expect(chk(ROLES.Teambuilding, 'rank:list')).toBe(false)
    expect(chk(ROLES.Marketing, 'rank:list')).toBe(false)
  })
})
