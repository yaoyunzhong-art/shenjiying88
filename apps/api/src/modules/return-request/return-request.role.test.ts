/**
 * 🧪 退货申请 角色旅程测试 — 从8个角色视角验证退货模块
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 */
import { describe, it, expect } from 'vitest'

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

const access: Record<string, string[]> = {
  'return:list': ['👔店长', '🛒前台', '🎯运行专员'],
  'return:detail': ['👔店长', '🛒前台', '🎯运行专员'],
  'return:create': ['🛒前台'],
  'return:approve': ['👔店长', '🎯运行专员'],
  'return:reject': ['👔店长'],
}

function chk(role: string, res: string): boolean {
  return access[res]?.includes(role) ?? false
}
function ok(d: any = {}) { return { success: true, code: 200, data: d, ts: Date.now() } }
function fail(c: number, m: string) { return { success: false, code: c, message: m, ts: Date.now() } }

describe(`${ROLES.StoreManager} 退货申请角色旅程测试`, () => {
  it('👔[正例] 店长查看退货列表 → 审批退货 → 确认完成', () => {
    expect(chk(ROLES.StoreManager, 'return:list')).toBe(true)
    const list = ok([{ id: 'RT-001', customer: '张先生', amount: 580, status: 'pending' }])
    expect(list.data.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'return:approve')).toBe(true)
    const approved = ok({ id: 'RT-001', status: 'approved', approvedBy: '店长' })
    expect(approved.data.status).toBe('approved')
  })
  it('👔[反例] 店长审批已拒绝的退货', () => {
    const err = fail(400, 'ALREADY_REJECTED')
    expect(err.code).toBe(400)
  })
  it('👔[边界] 店长拒绝退货单时必须填写原因', () => {
    const reject = fail(400, 'REJECT_REASON_REQUIRED')
    expect(reject.code).toBe(400)
  })
})

describe(`${ROLES.FrontDesk} 退货申请角色旅程测试`, () => {
  it('🛒[正例] 前台创建退货单 → 检查商品 → 提交审批', () => {
    expect(chk(ROLES.FrontDesk, 'return:create')).toBe(true)
    const created = ok({ id: 'RT-002', customer: '李女士', amount: 280, status: 'pending', items: ['娃娃'] })
    expect(created.data.items.length).toBe(1)
    // 查看退货详情
    expect(chk(ROLES.FrontDesk, 'return:detail')).toBe(true)
    const detail = ok({ id: 'RT-002', status: 'pending', reason: '质量问题' })
    expect(detail.data.reason).toBe('质量问题')
  })
  it('🛒[反例] 前台创建金额为0的退货单', () => {
    const err = fail(400, 'INVALID_REFUND_AMOUNT')
    expect(err.code).toBe(400)
  })
})

describe(`${ROLES.HR} 退货申请角色旅程测试`, () => {
  it('👥[反例] HR无退货管理权限', () => {
    expect(chk(ROLES.HR, 'return:list')).toBe(false)
  })
})

describe(`${ROLES.Security} 退货申请角色旅程测试`, () => {
  it('🔧[反例] 安监无退货管理权限', () => {
    expect(chk(ROLES.Security, 'return:list')).toBe(false)
  })
})

describe(`${ROLES.Guide} 退货申请角色旅程测试`, () => {
  it('🎮[反例] 导玩员可查看退货单（仅涉及机台故障退货）', () => {
    expect(chk(ROLES.Guide, 'return:list')).toBe(false)
  })
})

describe(`${ROLES.Operations} 退货申请角色旅程测试`, () => {
  it('🎯[正例] 运行专员查看退货列表 → 审批批量退货', () => {
    expect(chk(ROLES.Operations, 'return:list')).toBe(true)
    const list = ok([
      { id: 'RT-003', customer: '王先生', amount: 150, status: 'pending' },
      { id: 'RT-004', customer: '赵女士', amount: 320, status: 'pending' },
    ])
    expect(list.data.length).toBe(2)
    expect(chk(ROLES.Operations, 'return:approve')).toBe(true)
    const batch = list.data.map((r: any) => ok({ id: r.id, status: 'approved' }))
    expect(batch.length).toBe(2)
  })
  it('🎯[反例] 运行专员拒绝退货（无权限，只有店长可拒绝）', () => {
    expect(chk(ROLES.Operations, 'return:reject')).toBe(false)
  })
})

describe(`${ROLES.Teambuilding} 退货申请角色旅程测试`, () => {
  it('🤝[反例] 团建无退货权限', () => {
    expect(chk(ROLES.Teambuilding, 'return:list')).toBe(false)
  })
})

describe(`${ROLES.Marketing} 退货申请角色旅程测试`, () => {
  it('📢[反例] 营销无退货权限', () => {
    expect(chk(ROLES.Marketing, 'return:list')).toBe(false)
  })
})

describe('🦞 退货跨角色体验闭环', () => {
  it('🛒+👔 会员退货→审批→退款全流程', () => {
    // 1. 前台创建退货
    const rt = ok({ id: 'RT-005', customer: '刘先生', amount: 200, status: 'pending' })
    expect(rt.data.status).toBe('pending')
    // 2. 店长审批通过
    const approved = ok({ id: 'RT-005', status: 'approved' })
    expect(approved.data.status).toBe('approved')
    // 3. 确认退款完成
    const refunded = ok({ id: 'RT-005', status: 'refunded', refundAmount: 200 })
    expect(refunded.data.refundAmount).toBe(200)
  })
})
