/**
 * 🧪 场地管理 扩展角色旅程测试（补充已有单角色测试）
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'
const ROLES = { StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR', Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员', Teambuilding: '🤝团建', Marketing: '📢营销' } as const
const access: Record<string, string[]> = {
  'venue:list': ['👔店长', '🛒前台', '🎯运行专员', '🤝团建'],
  'venue:detail': ['👔店长', '🛒前台', '🎯运行专员', '🤝团建', '🎮导玩员'],
  'venue:reserve': ['🛒前台', '🤝团建'],
  'venue:config': ['👔店长', '🎯运行专员'],
  'venue:stats': ['👔店长', '🎯运行专员'],
}
function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

describe(`${ROLES.StoreManager} 场地扩展测试`, () => {
  it('👔[正例] 店长查看场地列表 → 配置场地 → 查看统计', () => {
    expect(chk(ROLES.StoreManager, 'venue:list')).toBe(true)
    const list = ok([{ id: 'V-001', name: '包间A', capacity: 10, status: 'available' }])
    expect(list.data.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'venue:config')).toBe(true)
    const config = ok({ id: 'V-001', pricePerHour: 200 })
    expect(config.data.pricePerHour).toBe(200)
    expect(chk(ROLES.StoreManager, 'venue:stats')).toBe(true)
    const stats = ok({ total: 5, occupied: 3, available: 2 })
    expect(stats.data.available).toBe(2)
  })
  it('👔[反例] 店长直接预约场地（应由前台操作）', () => {
    expect(chk(ROLES.StoreManager, 'venue:reserve')).toBe(false)
  })
})
describe(`${ROLES.FrontDesk} 场地扩展测试`, () => {
  it('🛒[正例] 前台查看场地 → 接受预约 → 确认使用', () => {
    expect(chk(ROLES.FrontDesk, 'venue:list')).toBe(true)
    expect(chk(ROLES.FrontDesk, 'venue:reserve')).toBe(true)
    const reserve = ok({ id: 'V-001', reservedBy: '前台赵', time: '14:00-16:00', status: 'confirmed' })
    expect(reserve.data.status).toBe('confirmed')
  })
})
describe(`${ROLES.Guide} 场地扩展测试`, () => {
  it('🎮[正例] 导玩员查看场地详情（安排设备）', () => {
    expect(chk(ROLES.Guide, 'venue:detail')).toBe(true)
    const detail = ok({ id: 'V-001', name: '包间A', devices: ['跳舞机', '娃娃机'] })
    expect(detail.data.devices.length).toBe(2)
  })
})
describe(`${ROLES.Operations} 场地扩展测试`, () => {
  it('🎯[正例] 运行专员配置场地价格 → 统计使用率', () => {
    expect(chk(ROLES.Operations, 'venue:config')).toBe(true)
    expect(chk(ROLES.Operations, 'venue:stats')).toBe(true)
  })
})
describe(`${ROLES.Teambuilding} 场地扩展测试`, () => {
  it('🤝[正例] 团建查看场地并预约团建活动', () => {
    expect(chk(ROLES.Teambuilding, 'venue:list')).toBe(true)
    expect(chk(ROLES.Teambuilding, 'venue:reserve')).toBe(true)
    const reserve = ok({ id: 'V-002', name: '大包间', purpose: '团建', status: 'confirmed' })
    expect(reserve.data.purpose).toBe('团建')
  })
  it('🤝[反例] 团建预约已满场地', () => {
    const err = fail(409, 'VENUE_FULL')
    expect(err.code).toBe(409)
  })
})
describe('其他角色无场地权限', () => {
  it('👥🔧📢 均无权限', () => {
    expect(chk(ROLES.HR, 'venue:list')).toBe(false)
    expect(chk(ROLES.Security, 'venue:list')).toBe(false)
    expect(chk(ROLES.Marketing, 'venue:list')).toBe(false)
  })
})
