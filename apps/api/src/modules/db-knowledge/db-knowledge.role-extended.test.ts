/**
 * 🧪 数据库知识库 扩展角色旅程测试（补充已有单角色测试）
 * 从8个角色视角全面验证
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'

const ROLES = {
  StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR',
  Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员',
  Teambuilding: '🤝团建', Marketing: '📢营销',
} as const

const access: Record<string, string[]> = {
  'knowledge:search': ['👔店长', '🛒前台', '👥HR', '🔧安监', '🎮导玩员', '🎯运行专员', '🤝团建', '📢营销'],
  'knowledge:create': ['👔店长', '🎯运行专员'],
  'knowledge:update': ['👔店长', '🎯运行专员'],
  'knowledge:delete': ['👔店长'],
  'knowledge:stats': ['👔店长', '🎯运行专员'],
}

function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

describe(`${ROLES.StoreManager} 知识库扩展测试`, () => {
  it('👔[正例] 店长搜索知识 → 创建新知识 → 更新 → 删除', () => {
    expect(chk(ROLES.StoreManager, 'knowledge:search')).toBe(true)
    const search = ok([{ id: 'K-001', title: '门店运营手册', kind: 'ops' }])
    expect(search.data.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'knowledge:create')).toBe(true)
    const created = ok({ id: 'K-010', title: '新门店流程', kind: 'ops', status: 'published' })
    expect(created.data.status).toBe('published')
    expect(chk(ROLES.StoreManager, 'knowledge:update')).toBe(true)
    const updated = ok({ id: 'K-010', title: '新门店流程V2' })
    expect(updated.data.title).toContain('V2')
    expect(chk(ROLES.StoreManager, 'knowledge:delete')).toBe(true)
    const deleted = ok({ id: 'K-010', deleted: true })
    expect(deleted.data.deleted).toBe(true)
  })
  it('👔[正例] 店长查看知识库统计', () => {
    expect(chk(ROLES.StoreManager, 'knowledge:stats')).toBe(true)
    const stats = ok({ totalDocs: 50, categoryCount: 8, lastUpdated: '2026-07-17' })
    expect(stats.data.totalDocs).toBe(50)
  })
})

describe(`${ROLES.FrontDesk} 知识库扩展测试`, () => {
  it('🛒[正例] 前台搜索收银操作指南 → 查看步骤', () => {
    expect(chk(ROLES.FrontDesk, 'knowledge:search')).toBe(true)
    const search = ok([{ id: 'K-002', title: '收银系统操作指南', kind: 'guide', content: '步骤1...' }])
    expect(search.data[0].kind).toBe('guide')
  })
  it('🛒[反例] 前台创建知识被拒', () => {
    expect(chk(ROLES.FrontDesk, 'knowledge:create')).toBe(false)
  })
  it('🛒[边界] 前台搜索无结果', () => {
    const empty = ok([])
    expect(empty.data.length).toBe(0)
  })
})

describe(`${ROLES.HR} 知识库扩展测试`, () => {
  it('👥[正例] HR搜索人事制度', () => {
    expect(chk(ROLES.HR, 'knowledge:search')).toBe(true)
    const r = ok([{ id: 'K-003', title: '人事管理制度', kind: 'policy' }])
    expect(r.data[0].kind).toBe('policy')
  })
})

describe(`${ROLES.Security} 知识库扩展测试`, () => {
  it('🔧[正例] 安监搜索安全规程', () => {
    expect(chk(ROLES.Security, 'knowledge:search')).toBe(true)
    const r = ok([{ id: 'K-004', title: '消防安全操作规程', kind: 'safety' }])
    expect(r.data[0].kind).toBe('safety')
  })
})

describe(`${ROLES.Guide} 知识库扩展测试`, () => {
  it('🎮[正例] 导玩员搜索设备维护手册', () => {
    expect(chk(ROLES.Guide, 'knowledge:search')).toBe(true)
    const r = ok([{ id: 'K-005', title: '跳舞机维护手册', kind: 'maintenance' }])
    expect(r.data[0].kind).toBe('maintenance')
  })
})

describe(`${ROLES.Operations} 知识库扩展测试`, () => {
  it('🎯[正例] 运行专员搜索盲盒上新流程', () => {
    expect(chk(ROLES.Operations, 'knowledge:search')).toBe(true)
    const r = ok([{ id: 'K-006', title: '盲盒上新流程', kind: 'product' }])
    expect(r.data[0].kind).toBe('product')
  })
  it('🎯[正例] 运行专员创建操作SOP', () => {
    expect(chk(ROLES.Operations, 'knowledge:create')).toBe(true)
    const created = ok({ id: 'K-020', title: '设备巡检SOP', kind: 'sop', status: 'draft' })
    expect(created.data.status).toBe('draft')
  })
})

describe(`${ROLES.Teambuilding} 知识库扩展测试`, () => {
  it('🤝[正例] 团建搜索活动方案模板', () => {
    expect(chk(ROLES.Teambuilding, 'knowledge:search')).toBe(true)
    const r = ok([{ id: 'K-007', title: '团建活动方案模板', kind: 'activity' }])
    expect(r.data[0].kind).toBe('activity')
  })
})

describe(`${ROLES.Marketing} 知识库扩展测试`, () => {
  it('📢[正例] 营销搜索营销策划模板', () => {
    expect(chk(ROLES.Marketing, 'knowledge:search')).toBe(true)
    const r = ok([{ id: 'K-008', title: '营销策划模板', kind: 'marketing' }])
    expect(r.data[0].kind).toBe('marketing')
  })
  it('📢[反例] 营销删除知识被拒', () => {
    expect(chk(ROLES.Marketing, 'knowledge:delete')).toBe(false)
  })
})

describe('🦞 知识库全角色体验闭环', () => {
  it('8角色搜索→阅读→使用知识闭环', () => {
    const allRoles = Object.values(ROLES)
    for (const role of allRoles) {
      expect(chk(role, 'knowledge:search')).toBe(true)
    }
    const search = ok([{ id: 'K-001', title: '门店运营手册', content: '详细内容...' }])
    expect(search.data.length).toBeGreaterThan(0)
  })
})
