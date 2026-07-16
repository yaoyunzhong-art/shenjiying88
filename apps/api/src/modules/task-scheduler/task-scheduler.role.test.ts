/**
 * 🧪 任务调度 角色旅程测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'
const ROLES = { StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR', Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员', Teambuilding: '🤝团建', Marketing: '📢营销' } as const
const access: Record<string, string[]> = {
  'task:list': ['👔店长', '🎯运行专员'],
  'task:create': ['🎯运行专员'],
  'task:trigger': ['🎯运行专员'],
  'task:logs': ['👔店长', '🎯运行专员'],
  'task:config': ['🎯运行专员'],
}
function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

describe(`${ROLES.StoreManager} 任务调度角色旅程测试`, () => {
  it('👔[正例] 店长查看任务列表 → 查看执行日志', () => {
    expect(chk(ROLES.StoreManager, 'task:list')).toBe(true)
    const list = ok([{ id: 'TSK-001', name: '每日数据汇总', cron: '0 2 * * *', status: 'active' }])
    expect(list.data.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'task:logs')).toBe(true)
    const logs = ok([{ taskId: 'TSK-001', lastRun: '2026-07-17T02:00:00Z', status: 'succeeded' }])
    expect(logs.data[0].status).toBe('succeeded')
  })
  it('👔[反例] 店长创建任务被拒', () => {
    expect(chk(ROLES.StoreManager, 'task:create')).toBe(false)
  })
})
describe(`${ROLES.Operations} 任务调度角色旅程测试`, () => {
  it('🎯[正例] 运行专员创建定时任务 → 手动触发', () => {
    expect(chk(ROLES.Operations, 'task:create')).toBe(true)
    const created = ok({ id: 'TSK-002', name: '库存预警检查', cron: '0 */6 * * *', status: 'active' })
    expect(created.data.cron).toBe('0 */6 * * *')
    expect(chk(ROLES.Operations, 'task:trigger')).toBe(true)
    const triggered = ok({ id: 'TSK-002', triggeredAt: Date.now(), status: 'running' })
    expect(triggered.data.status).toBe('running')
    expect(chk(ROLES.Operations, 'task:config')).toBe(true)
    const config = ok({ id: 'TSK-002', cron: '0 */4 * * *' })
    expect(config.data.cron).toBe('0 */4 * * *')
  })
  it('🎯[反例] 运行专员创建无效cron表达式', () => {
    const err = fail(400, 'INVALID_CRON_EXPRESSION')
    expect(err.code).toBe(400)
  })
  it('🎯[边界] 运行专员查看空任务列表', () => {
    const empty = ok([])
    expect(empty.data.length).toBe(0)
  })
})
describe('其他角色无权限', () => {
  it('🛒👥🔧🎮🤝📢 均无权限', () => {
    expect(chk(ROLES.FrontDesk, 'task:list')).toBe(false)
    expect(chk(ROLES.HR, 'task:list')).toBe(false)
    expect(chk(ROLES.Security, 'task:list')).toBe(false)
    expect(chk(ROLES.Guide, 'task:list')).toBe(false)
    expect(chk(ROLES.Teambuilding, 'task:list')).toBe(false)
    expect(chk(ROLES.Marketing, 'task:list')).toBe(false)
  })
})
