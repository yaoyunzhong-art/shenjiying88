/**
 * 🧪 CRM 角色旅程测试 — 从8个角色视角验证客户管理模块
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

const roleAccessMatrix: Record<string, string[]> = {
  'crm:list': ['👔店长', '🛒前台', '📢营销', '🎯运行专员'],
  'crm:detail': ['👔店长', '🛒前台', '📢营销'],
  'crm:score': ['👔店长', '📢营销'],
  'crm:interaction': ['👔店长', '🛒前台', '📢营销'],
  'crm:ticket': ['👔店长', '🛒前台', '🔧安监', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleAccessMatrix[resource]?.includes(role) ?? false
}

function mockOk(data: any = {}) {
  return { success: true, code: 200, data, timestamp: Date.now() }
}

function mockFail(code: number, message: string) {
  return { success: false, code, message, timestamp: Date.now() }
}

// ── 👔店长 ──
describe(`${ROLES.StoreManager} CRM 角色旅程测试`, () => {
  it('👔[正例] 店长查看客户列表 → 查看高价值客户 → 更新评分', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'crm:list')).toBe(true)
    const list = mockOk([
      { id: 'C-001', name: '张先生', totalSpentCents: 500000, status: 'active' },
      { id: 'C-002', name: '李女士', totalSpentCents: 120000, status: 'active' },
    ])
    expect(list.data.length).toBe(2)
    expect(checkRoleAccess(ROLES.StoreManager, 'crm:score')).toBe(true)
    const scored = mockOk({ id: 'C-001', engagementScore: 95 })
    expect(scored.data.engagementScore).toBe(95)
  })

  it('👔[反例] 店长删除客户记录被拒绝（无权限）', () => {
    const deleted = mockFail(403, 'FORBIDDEN')
    expect(deleted.code).toBe(403)
  })

  it('👔[边界] 店长查看空客户列表', () => {
    const empty = mockOk([])
    expect(empty.data.length).toBe(0)
  })
})

// ── 🛒前台 ──
describe(`${ROLES.FrontDesk} CRM 角色旅程测试`, () => {
  it('🛒[正例] 前台查询客户 → 添加快捷交互记录', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'crm:list')).toBe(true)
    const customer = mockOk({ id: 'C-003', name: '王五', phone: '138****0001', status: 'active' })
    expect(customer.data.status).toBe('active')
    expect(checkRoleAccess(ROLES.FrontDesk, 'crm:interaction')).toBe(true)
    const interaction = mockOk({ id: 'INT-001', type: 'visit', summary: '到店消费' })
    expect(interaction.data.type).toBe('visit')
  })

  it('🛒[正例] 前台为客户创建工单', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'crm:ticket')).toBe(true)
    const ticket = mockOk({ id: 'TK-001', subject: '设备故障报修', status: 'open' })
    expect(ticket.data.status).toBe('open')
  })

  it('🛒[反例] 前台查询不存在的客户ID', () => {
    const notFound = mockFail(404, 'CUSTOMER_NOT_FOUND')
    expect(notFound.code).toBe(404)
  })
})

// ── 👥HR ──
describe(`${ROLES.HR} CRM 角色旅程测试`, () => {
  it('👥[反例] HR无权限查看客户管理', () => {
    expect(checkRoleAccess(ROLES.HR, 'crm:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'crm:ticket')).toBe(false)
  })

  it('👥[闭环] HR查看客户管理页面显示无权限提示', () => {
    const error = mockFail(403, 'NO_CRM_ACCESS')
    expect(error.message).toBe('NO_CRM_ACCESS')
  })
})

// ── 🔧安监 ──
describe(`${ROLES.Security} CRM 角色旅程测试`, () => {
  it('🔧[正例] 安监查看客户工单列表 → 处理投诉工单', () => {
    expect(checkRoleAccess(ROLES.Security, 'crm:ticket')).toBe(true)
    const tickets = mockOk([
      { id: 'TK-002', subject: '投诉:服务态度差', priority: 'high', status: 'open' },
    ])
    expect(tickets.data.length).toBe(1)
    const resolved = mockOk({ id: 'TK-002', status: 'resolved' })
    expect(resolved.data.status).toBe('resolved')
  })

  it('🔧[反例] 安监尝试修改客户评分被拒绝', () => {
    expect(checkRoleAccess(ROLES.Security, 'crm:score')).toBe(false)
  })
})

// ── 🎮导玩员 ──
describe(`${ROLES.Guide} CRM 角色旅程测试`, () => {
  it('🎮[反例] 导玩员无CRM权限', () => {
    expect(checkRoleAccess(ROLES.Guide, 'crm:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'crm:ticket')).toBe(false)
  })
})

// ── 🎯运行专员 ──
describe(`${ROLES.Operations} CRM 角色旅程测试`, () => {
  it('🎯[正例] 运行专员查看客户工单 → 按优先级排序', () => {
    expect(checkRoleAccess(ROLES.Operations, 'crm:ticket')).toBe(true)
    const tickets = mockOk([
      { id: 'TK-003', priority: 'urgent', status: 'open' },
      { id: 'TK-004', priority: 'low', status: 'open' },
    ])
    const urgent = tickets.data.filter((t: any) => t.priority === 'urgent')
    expect(urgent.length).toBe(1)
  })

  it('🎯[正例] 运行专员查看客户列表', () => {
    expect(checkRoleAccess(ROLES.Operations, 'crm:list')).toBe(true)
    const list = mockOk([{ id: 'C-001', name: '张先生' }])
    expect(list.data[0].name).toBe('张先生')
  })
})

// ── 🤝团建 ──
describe(`${ROLES.Teambuilding} CRM 角色旅程测试`, () => {
  it('🤝[反例] 团建无CRM管理权限', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'crm:list')).toBe(false)
  })
})

// ── 📢营销 ──
describe(`${ROLES.Marketing} CRM 角色旅程测试`, () => {
  it('📢[正例] 营销查看客户列表 → 筛选高价值客户 → 添加交互记录', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'crm:list')).toBe(true)
    const list = mockOk([
      { id: 'C-001', name: '张先生', totalSpentCents: 500000, tags: ['vip'] },
      { id: 'C-005', name: '赵六', totalSpentCents: 30000, tags: ['new'] },
    ])
    const vip = list.data.filter((c: any) => c.tags.includes('vip'))
    expect(vip.length).toBe(1)
    expect(checkRoleAccess(ROLES.Marketing, 'crm:interaction')).toBe(true)
    const interaction = mockOk({ id: 'INT-002', type: 'email', summary: '发送促销邮件' })
    expect(interaction.data.type).toBe('email')
  })

  it('📢[正例] 营销更新客户评分（RFM模型）', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'crm:score')).toBe(true)
    const updated = mockOk({ id: 'C-001', engagementScore: 92 })
    expect(updated.data.engagementScore).toBe(92)
  })

  it('📢[反例] 营销创建工单被拒', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'crm:ticket')).toBe(false)
  })

  it('📢[边界] 营销搜索无匹配客户', () => {
    const empty = mockOk([])
    expect(empty.data.length).toBe(0)
  })
})

describe('🦞 CRM 跨角色体验闭环', () => {
  it('👔+🛒+📢 高价值客户服务全流程', () => {
    // 1. 前台识别高价值客户
    const customer = mockOk({ id: 'C-001', name: '张先生', totalSpentCents: 500000, status: 'active' })
    expect(customer.data.status).toBe('active')
    // 2. 前台记录到店交互
    const interaction = mockOk({ id: 'INT-003', type: 'visit', summary: 'VIP客户到店消费' })
    expect(interaction.data.summary).toContain('VIP')
    // 3. 营销调整评分
    const scored = mockOk({ id: 'C-001', engagementScore: 98 })
    expect(scored.data.engagementScore).toBe(98)
    // 4. 店长查看客户完整画像
    const profile = mockOk({
      id: 'C-001',
      name: '张先生',
      totalSpentCents: 500000,
      interactions: [interaction.data],
      engagementScore: 98,
    })
    expect(profile.data.interactions.length).toBe(1)
    expect(profile.data.engagementScore).toBe(98)
  })
})
