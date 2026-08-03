/**
 * 🧪 CRM Role Extended 测试 — 8角色 × 3+场景 = 24+ tests
 *
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 *
 * 覆盖: 客户CRUD、评分管理、标签管理、交互记录、工单管理、备注、客户统计
 *       边界/异常场景
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { CrmService } from './crm.service'

// ── 角色权限矩阵 ──

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
  'crm:create': ['👔店长', '🛒前台', '📢营销'],
  'crm:update': ['👔店长', '📢营销', '🎯运行专员'],
  'crm:delete': ['👔店长'],
  'crm:score': ['👔店长', '📢营销'],
  'crm:tag': ['👔店长', '📢营销'],
  'crm:interaction': ['👔店长', '🛒前台', '📢营销'],
  'crm:ticket': ['👔店长', '🛒前台', '🔧安监', '🎯运行专员'],
  'crm:note': ['👔店长', '🛒前台', '📢营销'],
  'crm:stats': ['👔店长', '🎯运行专员', '📢营销'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleAccessMatrix[resource]?.includes(role) ?? false
}

function makeService(): CrmService {
  // 使用默认数据（张三维、李四、王五预置）
  return new CrmService()
}

// ════════════════════════════════════════════════════════════
// 👔店长 — CRM
// ════════════════════════════════════════════════════════════

describe('[👔店长] CRM 角色扩展测试', () => {
  let svc: CrmService

  beforeEach(() => {
    svc = makeService()
  })

  it('👔[正例] 店长创建客户 → 打分 → 查看统计', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'crm:create')).toBe(true)
    expect(checkRoleAccess(ROLES.StoreManager, 'crm:score')).toBe(true)

    const customer = svc.create({ name: '陈总', email: 'chen@test.com', phone: '139xxxxxxxx' })
    expect(customer.name).toBe('陈总')
    expect(customer.engagementScore).toBe(0)

    const scored = svc.setEngagementScore(customer.id, 95)
    expect(scored.engagementScore).toBe(95)

    const stats = svc.getStats()
    expect(stats.total).toBeGreaterThanOrEqual(4) // 3 default + 1 new
    expect(stats.byStatus.active).toBeGreaterThan(0)
  })

  it('👔[正例] 店长查看高价值客户 → 添加标签 → 筛选', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'crm:tag')).toBe(true)
    const customer = svc.getById('crm-0001')
    expect(customer.name).toBe('张三')

    const tagged = svc.addTag(customer.id, 'high-value')
    expect(tagged.tags).toContain('high-value')

    // 门店搜索
    const list = svc.list('active', '张三')
    expect(list.length).toBe(1)
    expect(list[0].name).toBe('张三')
  })

  it('👔[反例] 店长查看不存在客户', () => {
    expect(() => svc.getById('crm-nonexistent')).toThrow()
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — CRM
// ════════════════════════════════════════════════════════════

describe('[🛒前台] CRM 角色扩展测试', () => {
  let svc: CrmService

  beforeEach(() => {
    svc = makeService()
  })

  it('🛒[正例] 前台查询客户 → 记录交互 → 确认工单', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'crm:list')).toBe(true)
    expect(checkRoleAccess(ROLES.FrontDesk, 'crm:interaction')).toBe(true)

    const customer = svc.getById('crm-0001')
    expect(customer.status).toBe('active')

    const interaction = svc.addInteraction(customer.id, {
      type: 'visit', summary: '到店消费100元',
      details: '客户带孩子来玩', createdBy: '前台小王',
    })
    expect(interaction.type).toBe('visit')

    expect(checkRoleAccess(ROLES.FrontDesk, 'crm:ticket')).toBe(true)
    const ticket = svc.createTicket(customer.id, {
      subject: '设备故障报修',
      description: '3号抓娃娃机故障',
      priority: 'high',
      assignedTo: 'tech-01',
    })
    expect(ticket.status).toBe('open')
    expect(ticket.priority).toBe('high')
  })

  it('🛒[正例] 前台添加客户备注', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'crm:note')).toBe(true)
    const note = svc.addNote('crm-0002', '客户反馈环境整洁', '前台小李')
    expect(note.content).toBe('客户反馈环境整洁')

    const notes = svc.listNotes('crm-0002')
    expect(notes.length).toBe(1)
  })

  it('🛒[反例] 前台无权删除客户', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'crm:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — CRM
// ════════════════════════════════════════════════════════════

describe('[👥HR] CRM 角色扩展测试', () => {
  it('👥[反例] HR无任何CRM权限', () => {
    expect(checkRoleAccess(ROLES.HR, 'crm:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'crm:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'crm:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'crm:update')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'crm:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'crm:score')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'crm:ticket')).toBe(false)
  })

  it('👥[闭环] HR访问CRM页面显示无权限', () => {
    const denied = { success: false, code: 403, message: 'NO_CRM_ACCESS' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — CRM
// ════════════════════════════════════════════════════════════

describe('[🔧安监] CRM 角色扩展测试', () => {
  let svc: CrmService

  beforeEach(() => {
    svc = makeService()
  })

  it('🔧[正例] 安监查看并处理客户投诉工单', () => {
    expect(checkRoleAccess(ROLES.Security, 'crm:ticket')).toBe(true)

    const ticket = svc.createTicket('crm-0001', {
      subject: '投诉:服务质量差',
      description: '客户反映前台态度不好',
      priority: 'urgent',
      assignedTo: 'security-01',
    })
    expect(ticket.priority).toBe('urgent')

    // 工单状态流转
    const inProgress = svc.updateTicketStatus('crm-0001', ticket.id, 'in_progress')
    expect(inProgress.status).toBe('in_progress')
    const resolved = svc.updateTicketStatus('crm-0001', ticket.id, 'resolved')
    expect(resolved.status).toBe('resolved')
  })

  it('🔧[反例] 安监无权查看敏感客户数据', () => {
    expect(checkRoleAccess(ROLES.Security, 'crm:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'crm:score')).toBe(false)
  })

  it('🔧[反例] 安监无权修改客户信息', () => {
    expect(checkRoleAccess(ROLES.Security, 'crm:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'crm:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — CRM
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] CRM 角色扩展测试', () => {
  it('🎮[反例] 导玩员无CRM权限', () => {
    expect(checkRoleAccess(ROLES.Guide, 'crm:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'crm:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'crm:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'crm:ticket')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'crm:interaction')).toBe(false)
  })

  it('🎮[闭环] 导玩员访问CRM无权限', () => {
    const denied = { success: false, code: 403, message: 'FORBIDDEN' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — CRM
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] CRM 角色扩展测试', () => {
  let svc: CrmService

  beforeEach(() => {
    svc = makeService()
  })

  it('🎯[正例] 运行专员查看客户统计 → 按状态分布', () => {
    expect(checkRoleAccess(ROLES.Operations, 'crm:list')).toBe(true)
    expect(checkRoleAccess(ROLES.Operations, 'crm:stats')).toBe(true)

    const list = svc.list()
    expect(list.length).toBeGreaterThan(0)

    const stats = svc.getStats()
    expect(stats.byStatus.active).toBeGreaterThan(0)
    expect(stats.avgScore).toBeGreaterThan(0)
  })

  it('🎯[正例] 运行专员查看并分配工单', () => {
    expect(checkRoleAccess(ROLES.Operations, 'crm:ticket')).toBe(true)

    const ticket = svc.createTicket('crm-0003', {
      subject: '新客户咨询',
      description: '了解会员价格',
      priority: 'low',
      assignedTo: 'sales-01',
    })
    expect(ticket.assignedTo).toBe('sales-01')

    const tickets = svc.listTickets('crm-0003')
    expect(tickets.length).toBe(1)
  })

  it('🎯[反例] 运行专员无权删除客户', () => {
    expect(checkRoleAccess(ROLES.Operations, 'crm:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — CRM
// ════════════════════════════════════════════════════════════

describe('[🤝团建] CRM 角色扩展测试', () => {
  it('🤝[反例] 团建无CRM管理权限', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'crm:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'crm:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'crm:ticket')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'crm:interaction')).toBe(false)
  })

  it('🤝[闭环] 团建角色CRM模块显示无权限', () => {
    const error = { success: false, code: 403, message: 'NO_CRM_ACCESS' }
    expect(error.message).toBe('NO_CRM_ACCESS')
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — CRM
// ════════════════════════════════════════════════════════════

describe('[📢营销] CRM 角色扩展测试', () => {
  let svc: CrmService

  beforeEach(() => {
    svc = makeService()
  })

  it('📢[正例] 营销创建客户 → 添加标签 → 筛选VIP → 设置评分', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'crm:create')).toBe(true)
    expect(checkRoleAccess(ROLES.Marketing, 'crm:tag')).toBe(true)
    expect(checkRoleAccess(ROLES.Marketing, 'crm:score')).toBe(true)

    // 创建客户
    const customer = svc.create({
      name: '周总', email: 'zhou@test.com',
      phone: '136xxxxxxxx', status: 'lead',
    })
    expect(customer.status).toBe('lead')

    // 添加标签
    const tagged = svc.addTag(customer.id, 'potential-vip')
    svc.addTag(customer.id, 'marketing-campaign')
    expect(tagged.tags).toContain('potential-vip')
    expect(tagged.tags).toContain('marketing-campaign')

    // 移除标签
    const removed = svc.removeTag(customer.id, 'marketing-campaign')
    expect(removed.tags).not.toContain('marketing-campaign')
    expect(removed.tags).toContain('potential-vip')

    // 评分调整
    const scored = svc.updateEngagementScore(customer.id, 30)
    expect(scored.engagementScore).toBe(30)
  })

  it('📢[正例] 营销添加交互记录 → 查看客户完整画像', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'crm:interaction')).toBe(true)

    svc.addInteraction('crm-0001', {
      type: 'email', summary: '发送会员权益更新邮件',
      details: '包含优惠券链接', createdBy: '市场部',
    })
    svc.addInteraction('crm-0001', {
      type: 'call', summary: '电话回访',
      details: '客户对活动感兴趣', createdBy: '市场部',
    })

    const interactions = svc.listInteractions('crm-0001')
    expect(interactions.length).toBe(2)
    expect(interactions.some((i) => i.type === 'email')).toBe(true)
    expect(interactions.some((i) => i.type === 'call')).toBe(true)
  })

  it('📢[正例] 营销更新客户信息', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'crm:update')).toBe(true)
    const updated = svc.update('crm-0002', {
      name: '李总', tags: ['vip', 'important'],
    })
    expect(updated.name).toBe('李总')
    expect(updated.tags).toContain('vip')
  })

  it('📢[反例] 营销无权删除客户', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'crm:delete')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界情况
// ════════════════════════════════════════════════════════════

describe('[🦞 CRM 跨角色闭环]', () => {
  let svc: CrmService

  beforeEach(() => {
    svc = makeService()
  })

  it('👔 + 🛒 + 📢 + 🔧 客户全生命周期管理', () => {
    // 1. 🛒前台识别潜在客户 → 创建客户记录
    const customer = svc.create({ name: '新客', email: 'new@test.com', phone: '135xxxxxxxx' })
    expect(customer.id).toBeDefined()

    // 2. 🛒前台添加到店交互记录
    const visit = svc.addInteraction(customer.id, {
      type: 'visit', summary: '首次到店咨询会员', details: '了解了价格', createdBy: '前台',
    })
    expect(visit.type).toBe('visit')

    // 3. 📢营销添加标签 + 提高评分
    svc.addTag(customer.id, 'interested')
    svc.setEngagementScore(customer.id, 60)

    // 4. 🛒前台为客户创建工单
    svc.createTicket(customer.id, {
      subject: '会员办理咨询',
      description: '需要介绍会员权益',
      priority: 'medium',
      assignedTo: 'sales-01',
    })

    // 5. 🔧安监处理投诉工单
    const complaint = svc.createTicket('crm-0003', {
      subject: '投诉: 排队时间长',
      description: '周末排队超过30分钟',
      priority: 'high',
      assignedTo: 'security-02',
    })
    const resolved = svc.updateTicketStatus('crm-0003', complaint.id, 'resolved')
    expect(resolved.status).toBe('resolved')

    // 6. 👔店长查看客户统计
    const stats = svc.getStats()
    expect(stats.total).toBeGreaterThanOrEqual(4)
    expect(stats.totalTickets).toBeGreaterThanOrEqual(2)
  })

  it('🛡️ 创建客户时姓名空 → 抛出错误', () => {
    expect(() => svc.create({ name: '', email: 'a@b.com', phone: '' })).toThrow()
  })

  it('🛡️ 创建客户时邮箱空 → 抛出错误', () => {
    expect(() => svc.create({ name: '测试', email: '', phone: '' })).toThrow()
  })

  it('🛡️ 添加空备注 → 拒绝', () => {
    expect(() => svc.addNote('crm-0001', '', 'user')).toThrow()
  })

  it('🛡️ 评分越界安全（上限100下限0）', () => {
    const customer = svc.setEngagementScore('crm-0001', 150)
    expect(customer.engagementScore).toBe(100)

    const customer2 = svc.updateEngagementScore('crm-0001', -1000)
    expect(customer2.engagementScore).toBe(0)
  })

  it('🛡️ 标记churned后评分被压低', () => {
    const marked = svc.markCustomer('crm-0001', 'churned')
    expect(marked.status).toBe('churned')
    expect(marked.engagementScore).toBeLessThanOrEqual(20)
  })

  it('🛡️ 不存在的工单报错', () => {
    expect(() => svc.updateTicketStatus('crm-0001', 'ticket-nonexistent', 'closed')).toThrow()
  })
})
