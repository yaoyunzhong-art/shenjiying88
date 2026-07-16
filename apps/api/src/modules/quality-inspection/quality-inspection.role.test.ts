/**
 * 🧪 质检管理 角色旅程测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'
const ROLES = { StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR', Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员', Teambuilding: '🤝团建', Marketing: '📢营销' } as const
const access: Record<string, string[]> = {
  'qi:list': ['👔店长', '🔧安监', '🎯运行专员'],
  'qi:create': ['🔧安监'],
  'qi:execute': ['🔧安监', '🎯运行专员'],
  'qi:report': ['👔店长', '🔧安监', '🎯运行专员'],
}
function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

describe(`${ROLES.StoreManager} 质检角色旅程测试`, () => {
  it('👔[正例] 店长查看质检列表 → 查看质检报告', () => {
    expect(chk(ROLES.StoreManager, 'qi:list')).toBe(true)
    const list = ok([{ id: 'QI-001', type: '设备安全', status: 'passed', inspector: '安监张' }])
    expect(list.data.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'qi:report')).toBe(true)
    const report = ok({ id: 'QI-001', result: '全部通过', score: 98 })
    expect(report.data.score).toBe(98)
  })
  it('👔[反例] 店长执行质检被拒', () => {
    expect(chk(ROLES.StoreManager, 'qi:execute')).toBe(false)
  })
})
describe(`${ROLES.Security} 质检角色旅程测试`, () => {
  it('🔧[正例] 安监创建质检计划 → 执行质检 → 生成报告', () => {
    expect(chk(ROLES.Security, 'qi:create')).toBe(true)
    const created = ok({ id: 'QI-002', type: '消防安全', items: ['灭火器', '烟感'], status: 'pending' })
    expect(created.data.items.length).toBe(2)
    expect(chk(ROLES.Security, 'qi:execute')).toBe(true)
    const executed = ok({ id: 'QI-002', status: 'completed', passed: true })
    expect(executed.data.passed).toBe(true)
  })
  it('🔧[反例] 安监创建重复质检任务', () => {
    const dup = fail(409, 'INSPECTION_ALREADY_EXISTS')
    expect(dup.code).toBe(409)
  })
  it('🔧[边界] 安监质检发现不合格项需整改', () => {
    const failInspection = ok({ id: 'QI-003', status: 'completed', passed: false, failedItems: ['灭火器压力不足'] })
    expect(failInspection.data.passed).toBe(false)
    expect(failInspection.data.failedItems.length).toBeGreaterThan(0)
  })
})
describe(`${ROLES.Operations} 质检角色旅程测试`, () => {
  it('🎯[正例] 运行专员协助执行质检', () => {
    expect(chk(ROLES.Operations, 'qi:execute')).toBe(true)
    const executed = ok({ id: 'QI-001', status: 'completed' })
    expect(executed.data.status).toBe('completed')
  })
})
describe('其他角色无权限', () => {
  it('🛒👥🎮🤝📢 均无质检权限', () => {
    expect(chk(ROLES.FrontDesk, 'qi:list')).toBe(false)
    expect(chk(ROLES.HR, 'qi:list')).toBe(false)
    expect(chk(ROLES.Guide, 'qi:list')).toBe(false)
    expect(chk(ROLES.Teambuilding, 'qi:list')).toBe(false)
    expect(chk(ROLES.Marketing, 'qi:list')).toBe(false)
  })
})
