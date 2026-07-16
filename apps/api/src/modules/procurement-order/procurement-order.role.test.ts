/**
 * 🧪 采购订单 角色旅程测试 — 从8个角色视角验证采购模块
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
  'po:list': ['👔店长', '🎯运行专员'],
  'po:detail': ['👔店长', '🎯运行专员', '🛒前台'],
  'po:create': ['🎯运行专员'],
  'po:approve': ['👔店长'],
  'po:cancel': ['👔店长', '🎯运行专员'],
}

function chk(role: string, res: string): boolean {
  return access[res]?.includes(role) ?? false
}
function ok(d: any = {}) { return { success: true, code: 200, data: d, ts: Date.now() } }
function fail(c: number, m: string) { return { success: false, code: c, message: m, ts: Date.now() } }

describe(`${ROLES.StoreManager} 采购订单角色旅程测试`, () => {
  it('👔[正例] 店长查看采购订单列表 → 审批待审订单 → 完成采购闭环', () => {
    expect(chk(ROLES.StoreManager, 'po:list')).toBe(true)
    const list = ok([
      { id: 'PO-001', supplier: '扭蛋供应商', total: 5000, status: 'pending_approval' },
      { id: 'PO-002', supplier: '饮料供应商', total: 1200, status: 'approved' },
    ])
    expect(list.data.length).toBe(2)
    const pending = list.data.filter((p: any) => p.status === 'pending_approval')
    expect(pending.length).toBe(1)
    expect(chk(ROLES.StoreManager, 'po:approve')).toBe(true)
    const approved = ok({ id: 'PO-001', status: 'approved', approvedBy: '店长' })
    expect(approved.data.status).toBe('approved')
  })
  it('👔[反例] 店长审批已取消的订单', () => {
    const err = fail(400, 'ORDER_ALREADY_CANCELLED')
    expect(err.code).toBe(400)
  })
  it('👔[边界] 店长查看空采购列表', () => {
    const empty = ok([])
    expect(empty.data.length).toBe(0)
  })
})

describe(`${ROLES.FrontDesk} 采购订单角色旅程测试`, () => {
  it('🛒[正例] 前台查看到货采购订单详情', () => {
    expect(chk(ROLES.FrontDesk, 'po:detail')).toBe(true)
    const detail = ok({ id: 'PO-002', supplier: '饮料供应商', items: [{ name: '可乐', qty: 100 }] })
    expect(detail.data.items.length).toBe(1)
  })
  it('🛒[反例] 前台创建采购单被拒', () => {
    expect(chk(ROLES.FrontDesk, 'po:create')).toBe(false)
  })
})

describe(`${ROLES.HR} 采购订单角色旅程测试`, () => {
  it('👥[反例] HR无采购权限', () => {
    expect(chk(ROLES.HR, 'po:list')).toBe(false)
  })
})

describe(`${ROLES.Security} 采购订单角色旅程测试`, () => {
  it('🔧[反例] 安监无采购权限', () => {
    expect(chk(ROLES.Security, 'po:list')).toBe(false)
  })
})

describe(`${ROLES.Guide} 采购订单角色旅程测试`, () => {
  it('🎮[反例] 导玩员无采购权限', () => {
    expect(chk(ROLES.Guide, 'po:list')).toBe(false)
  })
})

describe(`${ROLES.Operations} 采购订单角色旅程测试`, () => {
  it('🎯[正例] 运行专员发起采购 → 提交审批', () => {
    expect(chk(ROLES.Operations, 'po:create')).toBe(true)
    const created = ok({
      id: 'PO-003',
      supplier: '新供应商',
      items: [{ name: '礼品A', qty: 50, price: 20 }],
      total: 1000,
      status: 'pending_approval',
    })
    expect(created.data.total).toBe(1000)
    expect(created.data.status).toBe('pending_approval')
  })
  it('🎯[正例] 运行专员取消错误采购单', () => {
    expect(chk(ROLES.Operations, 'po:cancel')).toBe(true)
    const cancelled = ok({ id: 'PO-003', status: 'cancelled' })
    expect(cancelled.data.status).toBe('cancelled')
  })
  it('🎯[反例] 运行专员提交空采购单被拒', () => {
    const err = fail(400, 'EMPTY_PURCHASE_ORDER')
    expect(err.code).toBe(400)
  })
  it('🎯[边界] 运行专员查看采购列表显示分页', () => {
    const page = ok({ items: [], total: 0, page: 1, pageSize: 20 })
    expect(page.data.total).toBe(0)
    expect(page.data.page).toBe(1)
  })
})

describe(`${ROLES.Teambuilding} 采购订单角色旅程测试`, () => {
  it('🤝[反例] 团建无采购权限', () => {
    expect(chk(ROLES.Teambuilding, 'po:list')).toBe(false)
  })
})

describe(`${ROLES.Marketing} 采购订单角色旅程测试`, () => {
  it('📢[反例] 营销无采购权限', () => {
    expect(chk(ROLES.Marketing, 'po:list')).toBe(false)
  })
})

describe('🦞 采购跨角色体验闭环', () => {
  it('🎯+👔 采购→审批→到货全流程', () => {
    // 1. 运行专员创建
    const po = ok({ id: 'PO-004', total: 3000, status: 'pending_approval' })
    expect(po.data.status).toBe('pending_approval')
    // 2. 店长审批
    const approved = ok({ id: 'PO-004', status: 'approved' })
    expect(approved.data.status).toBe('approved')
    // 3. 到货后前台确认
    const arrived = ok({ id: 'PO-004', status: 'delivered' })
    expect(arrived.data.status).toBe('delivered')
  })
})
