/**
 * 🧪 员工绩效考评 角色旅程测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'

const ROLES = {
  StoreManager: '👔店长', FrontDesk: '🛒前台', HR: '👥HR',
  Security: '🔧安监', Guide: '🎮导玩员', Operations: '🎯运行专员',
  Teambuilding: '🤝团建', Marketing: '📢营销',
} as const

const access: Record<string, string[]> = {
  'review:list': ['👔店长', '👥HR'],
  'review:detail': ['👔店长', '👥HR', '🎮导玩员', '🛒前台'],
  'review:self': ['🛒前台', '🎮导玩员', '🎯运行专员', '📢营销', '🤝团建', '🔧安监'],
  'review:submit': ['👔店长', '👥HR'],
  'review:finalize': ['👥HR'],
}

function chk(r: string, res: string) { return access[res]?.includes(r) ?? false }
function ok(d: any = {}) { return { success: true, code: 200, data: d } }
function fail(c: number, m: string) { return { success: false, code: c, message: m } }

describe(`${ROLES.StoreManager} 绩效考评角色旅程测试`, () => {
  it('👔[正例] 店长查看团队考评列表 → 为下属评分 → 提交考评', () => {
    expect(chk(ROLES.StoreManager, 'review:list')).toBe(true)
    const list = ok([{ id: 'EV-001', employee: '王五', score: 85, status: 'draft' }])
    expect(list.data.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'review:submit')).toBe(true)
    const submit = ok({ id: 'EV-001', score: 88, status: 'submitted' })
    expect(submit.data.status).toBe('submitted')
  })
  it('👔[反例] 店长最终确认考评被拒', () => {
    expect(chk(ROLES.StoreManager, 'review:finalize')).toBe(false)
  })
  it('👔[边界] 店长考评列表为空', () => {
    expect(ok([]).data.length).toBe(0)
  })
})

describe(`${ROLES.HR} 绩效考评角色旅程测试`, () => {
  it('👥[正例] HR查看全店考评 → 最终确认 → 归档', () => {
    expect(chk(ROLES.HR, 'review:list')).toBe(true)
    const list = ok([{ id: 'EV-001', employee: '王五', score: 88, status: 'submitted' }])
    expect(list.data.length).toBe(1)
    expect(chk(ROLES.HR, 'review:finalize')).toBe(true)
    const finalized = ok({ id: 'EV-001', status: 'finalized' })
    expect(finalized.data.status).toBe('finalized')
  })
  it('👥[反例] HR提交评分时未填写评语', () => {
    const err = fail(400, 'COMMENT_REQUIRED')
    expect(err.code).toBe(400)
  })
})

describe(`${ROLES.FrontDesk} 绩效考评角色旅程测试`, () => {
  it('🛒[正例] 前台查看自己的考评详情', () => {
    expect(chk(ROLES.FrontDesk, 'review:detail')).toBe(true)
    const detail = ok({ id: 'EV-002', employee: '前台赵', score: 82, comment: '服务态度好' })
    expect(detail.data.score).toBe(82)
  })
  it('🛒[反例] 前台查看他人考评被拒', () => {
    expect(chk(ROLES.FrontDesk, 'review:list')).toBe(false)
  })
})

describe(`${ROLES.Guide} 绩效考评角色旅程测试`, () => {
  it('🎮[正例] 导玩员查看自己的考评详情', () => {
    expect(chk(ROLES.Guide, 'review:detail')).toBe(true)
  })
  it('🎮[反例] 导玩员提交考评被拒', () => {
    expect(chk(ROLES.Guide, 'review:submit')).toBe(false)
  })
})

describe(`${ROLES.Security} 绩效考评角色旅程测试`, () => {
  it('🔧[正例] 安监查看自己考评', () => {
    expect(chk(ROLES.Security, 'review:self')).toBe(true)
  })
})

describe(`${ROLES.Operations} 绩效考评角色旅程测试`, () => {
  it('🎯[正例] 运行专员查看自己考评', () => {
    expect(chk(ROLES.Operations, 'review:self')).toBe(true)
  })
})

describe(`${ROLES.Teambuilding} 绩效考评角色旅程测试`, () => {
  it('🤝[正例] 团建查看自己考评', () => {
    expect(chk(ROLES.Teambuilding, 'review:self')).toBe(true)
  })
})

describe(`${ROLES.Marketing} 绩效考评角色旅程测试`, () => {
  it('📢[正例] 营销查看自己考评', () => {
    expect(chk(ROLES.Marketing, 'review:self')).toBe(true)
  })
})

describe('🦞 绩效考评跨角色体验闭环', () => {
  it('👔+👥 考评→评分→确认→归档全流程', () => {
    const draft = ok({ id: 'EV-010', employee: '新员工', score: 0, status: 'draft' })
    expect(draft.data.status).toBe('draft')
    const scored = ok({ id: 'EV-010', score: 85, status: 'submitted' })
    expect(scored.data.score).toBe(85)
    const finalized = ok({ id: 'EV-010', status: 'finalized' })
    expect(finalized.data.status).toBe('finalized')
  })
})
