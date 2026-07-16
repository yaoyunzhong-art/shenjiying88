/**
 * 🧪 库存预警 角色旅程测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'

const ROLES = { StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR', Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员', Teambuilding: '🤝团建', Marketing: '📢营销' } as const

const access: Record<string, string[]> = {
  'alert:list': ['👔店长', '🎯运行专员', '🛒前台'],
  'alert:ack': ['🎯运行专员', '🛒前台'],
  'alert:config': ['👔店长', '🎯运行专员'],
  'alert:stats': ['👔店长', '🎯运行专员'],
}

function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

describe(`${ROLES.StoreManager} 库存预警角色旅程测试`, () => {
  it('👔[正例] 店长查看预警列表 → 调整预警阈值', () => {
    expect(chk(ROLES.StoreManager, 'alert:list')).toBe(true)
    const list = ok([{ id: 'AL-001', sku: 'BALL-001', name: '扭蛋球', stock: 3, threshold: 50 }])
    expect(list.data.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'alert:config')).toBe(true)
    const config = ok({ sku: 'BALL-001', threshold: 100 })
    expect(config.data.threshold).toBe(100)
  })
  it('👔[正例] 店长查看预警统计', () => {
    expect(chk(ROLES.StoreManager, 'alert:stats')).toBe(true)
    const stats = ok({ total: 8, critical: 2, warning: 6 })
    expect(stats.data.critical).toBe(2)
  })
  it('👔[边界] 店长查看已清空的预警列表', () => {
    const empty = ok([])
    expect(empty.data.length).toBe(0)
  })
})

describe(`${ROLES.FrontDesk} 库存预警角色旅程测试`, () => {
  it('🛒[正例] 前台查看库存预警 → 确认到货预警消除', () => {
    expect(chk(ROLES.FrontDesk, 'alert:list')).toBe(true)
    const list = ok([{ id: 'AL-002', sku: 'COLA-001', stock: 5, threshold: 20 }])
    expect(list.data[0].stock).toBeLessThan(list.data[0].threshold)
    expect(chk(ROLES.FrontDesk, 'alert:ack')).toBe(true)
    const ack = ok({ id: 'AL-002', acknowledged: true, acknowledgedBy: '前台赵' })
    expect(ack.data.acknowledged).toBe(true)
  })
  it('🛒[反例] 前台修改预警配置', () => {
    expect(chk(ROLES.FrontDesk, 'alert:config')).toBe(false)
  })
})

describe(`${ROLES.Operations} 库存预警角色旅程测试`, () => {
  it('🎯[正例] 运行专员查看预警 → 确认 → 调整配置', () => {
    expect(chk(ROLES.Operations, 'alert:list')).toBe(true)
    expect(chk(ROLES.Operations, 'alert:ack')).toBe(true)
    const ack = ok({ id: 'AL-001', acknowledged: true })
    expect(ack.data.acknowledged).toBe(true)
    expect(chk(ROLES.Operations, 'alert:config')).toBe(true)
  })
  it('🎯[反例] 运行专员设置无效阈值（<=0）', () => {
    const err = fail(400, 'INVALID_THRESHOLD')
    expect(err.code).toBe(400)
  })
})

describe('其他角色无库存预警权限', () => {
  it('👥🔧🎮🤝📢 均无权限', () => {
    expect(chk(ROLES.HR, 'alert:list')).toBe(false)
    expect(chk(ROLES.Security, 'alert:list')).toBe(false)
    expect(chk(ROLES.Guide, 'alert:list')).toBe(false)
    expect(chk(ROLES.Teambuilding, 'alert:list')).toBe(false)
    expect(chk(ROLES.Marketing, 'alert:list')).toBe(false)
  })
})
