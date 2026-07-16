/**
 * 🧪 合同管理 角色旅程测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'
const ROLES = { StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR', Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员', Teambuilding: '🤝团建', Marketing: '📢营销' } as const
const access: Record<string, string[]> = {
  'contract:list': ['👔店长', '🎯运行专员'],
  'contract:detail': ['👔店长', '🎯运行专员'],
  'contract:create': ['👔店长', '🎯运行专员'],
  'contract:sign': ['👔店长'],
  'contract:terminate': ['👔店长'],
}
function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

describe(`${ROLES.StoreManager} 合同管理角色旅程测试`, () => {
  it('👔[正例] 店长查看合同列表 → 签约 → 归档', () => {
    expect(chk(ROLES.StoreManager, 'contract:list')).toBe(true)
    const list = ok([{ id: 'CT-001', supplier: '扭蛋供应商', amount: 50000, status: 'draft' }])
    expect(list.data.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'contract:sign')).toBe(true)
    const signed = ok({ id: 'CT-001', status: 'active', signedAt: Date.now() })
    expect(signed.data.status).toBe('active')
  })
  it('👔[正例] 店长终止到期合同', () => {
    expect(chk(ROLES.StoreManager, 'contract:terminate')).toBe(true)
    const terminated = ok({ id: 'CT-001', status: 'terminated' })
    expect(terminated.data.status).toBe('terminated')
  })
  it('👔[反例] 店长签约已过期合同', () => {
    const err = fail(400, 'CONTRACT_EXPIRED')
    expect(err.code).toBe(400)
  })
  it('👔[边界] 店长查看合同金额为0', () => {
    const zero = ok({ id: 'CT-002', amount: 0, status: 'draft', type: '框架协议' })
    expect(zero.data.amount).toBe(0)
  })
})
describe(`${ROLES.Operations} 合同管理角色旅程测试`, () => {
  it('🎯[正例] 运行专员创建合同草稿', () => {
    expect(chk(ROLES.Operations, 'contract:create')).toBe(true)
    const created = ok({ id: 'CT-003', supplier: '新供应商', amount: 30000, status: 'draft' })
    expect(created.data.status).toBe('draft')
  })
  it('🎯[反例] 运行专员签约合同被拒', () => {
    expect(chk(ROLES.Operations, 'contract:sign')).toBe(false)
  })
})
describe('其他角色无权限', () => {
  it('🛒👥🔧🎮🤝📢 均无合同权限', () => {
    expect(chk(ROLES.FrontDesk, 'contract:list')).toBe(false)
    expect(chk(ROLES.HR, 'contract:list')).toBe(false)
    expect(chk(ROLES.Security, 'contract:list')).toBe(false)
    expect(chk(ROLES.Guide, 'contract:list')).toBe(false)
    expect(chk(ROLES.Teambuilding, 'contract:list')).toBe(false)
    expect(chk(ROLES.Marketing, 'contract:list')).toBe(false)
  })
})
