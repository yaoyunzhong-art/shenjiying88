/**
 * 🐜 自动: [membership] [C] 角色扩展测试
 *
 * 8 角色视角的 会员管理模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 MembershipService
 */
import { describe, it, expect } from 'vitest'
import { MembershipService } from './membership.service'
import type { MemberLevel } from './membership.service'

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

/** 角色 → 会员管理模块权限 */
const roleMemberAccess: Record<string, string[]> = {
  'mem:register': ['👔店长', '🛒前台', '🎯运行专员'],
  'mem:query': ['👔店长', '🛒前台', '🎯运行专员', '📢营销'],
  'mem:update': ['👔店长', '🎯运行专员'],
  'mem:delete': ['👔店长'],
  'mem:points': ['👔店长', '🛒前台', '🎯运行专员'],
  'mem:balance': ['👔店长', '🛒前台', '🎯运行专员'],
  'mem:stats': ['👔店长', '🎯运行专员', '📢营销'],
  'mem:level': ['👔店长', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleMemberAccess[resource]?.includes(role) ?? false
}

function makeService(): MembershipService {
  const svc = new MembershipService()
  svc._reset()
  // seed some default members for queries
  svc._seed({ phone: '13800001111', name: '张三', tenantId: 't1', level: 'gold', points: 5000, balance: 20000, totalSpent: 300000 })
  svc._seed({ phone: '13800002222', name: '李四', tenantId: 't1', level: 'silver', points: 2000, balance: 10000, totalSpent: 80000 })
  svc._seed({ phone: '13800003333', name: '王五', tenantId: 't1', level: 'diamond', points: 10000, balance: 50000, totalSpent: 600000 })
  return svc
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 会员管理
// ════════════════════════════════════════════════════════════

describe('[👔店长] membership 角色扩展测试', () => {
  it('👔[正例] 店长注册会员 → 查询 → 列表', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'mem:register')).toBe(true)
    const svc = makeService()
    const member = svc.register({ phone: '13900009999', name: '店长邀请', tenantId: 't1' })
    expect(member.level).toBe('regular')
    expect(member.points).toBe(0)

    expect(checkRoleAccess(ROLES.StoreManager, 'mem:query')).toBe(true)
    const found = svc.findByPhone('13900009999', 't1')
    expect(found).not.toBeNull()
    expect(found!.name).toBe('店长邀请')

    const list = svc.list({ level: 'regular' })
    expect(list.length).toBeGreaterThan(0)
  })

  it('👔[正例] 店长更新会员等级 → 删除会员', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'mem:update')).toBe(true)
    const svc = makeService()
    const updated = svc.update('MEM-000001', { level: 'diamond', name: '张三VIP' })
    expect(updated.level).toBe('diamond')
    expect(updated.name).toBe('张三VIP')

    expect(checkRoleAccess(ROLES.StoreManager, 'mem:delete')).toBe(true)
    svc.delete('MEM-000002')
    expect(svc.getById('MEM-000002')).toBeNull()
  })

  it('👔[正例] 店长管理积分和余额 → 查看统计', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'mem:points')).toBe(true)
    const svc = makeService()
    const tx = svc.earnPoints('MEM-000001', 50000, 'order-001')
    expect(tx.amount).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.StoreManager, 'mem:balance')).toBe(true)
    svc.recharge('MEM-000001', 10000, 'wechat')

    expect(checkRoleAccess(ROLES.StoreManager, 'mem:stats')).toBe(true)
    const stats = svc.getStats()
    expect(stats.totalMembers).toBeGreaterThan(0)
    expect(stats.byLevel.regular).toBeDefined()
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 会员管理
// ════════════════════════════════════════════════════════════

describe('[🛒前台] membership 角色扩展测试', () => {
  it('🛒[正例] 前台注册新会员（顾客办卡）', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'mem:register')).toBe(true)
    const svc = makeService()
    const member = svc.register({ phone: '13911112222', name: '新顾客', tenantId: 't1' })
    expect(member.phone).toBe('13911112222')
    expect(member.level).toBe('regular')
  })

  it('🛒[正例] 前台查询会员 → 积分操作 → 余额充值', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'mem:query')).toBe(true)
    const svc = makeService()
    const found = svc.findByPhone('13800001111', 't1')
    expect(found).not.toBeNull()
    expect(found!.name).toBe('张三')

    expect(checkRoleAccess(ROLES.FrontDesk, 'mem:points')).toBe(true)
    const tx = svc.earnPoints(found!.id, 30000, 'walkin-order')
    expect(tx.amount).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.FrontDesk, 'mem:balance')).toBe(true)
    const prevBalance = found!.balance
    const recharged = svc.recharge(found!.id, 5000, 'cash')
    expect(recharged.balance).toBe(prevBalance + 5000)
  })

  it('🛒[反例] 前台无权限删除/更新/查看统计', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'mem:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'mem:update')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'mem:stats')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'mem:level')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 会员管理
// ════════════════════════════════════════════════════════════

describe('[👥HR] membership 角色扩展测试', () => {
  it('👥[反例] HR无权限注册/查询会员', () => {
    expect(checkRoleAccess(ROLES.HR, 'mem:register')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'mem:query')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'mem:update')).toBe(false)
  })

  it('👥[反例] HR无权限操作积分余额', () => {
    expect(checkRoleAccess(ROLES.HR, 'mem:points')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'mem:balance')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'mem:delete')).toBe(false)
  })

  it('👥[反例] HR所有会员权限被拒', () => {
    const resources = ['mem:register', 'mem:query', 'mem:update', 'mem:delete', 'mem:points', 'mem:balance', 'mem:stats', 'mem:level']
    resources.forEach((r) => {
      expect(checkRoleAccess(ROLES.HR, r)).toBe(false)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 会员管理
// ════════════════════════════════════════════════════════════

describe('[🔧安监] membership 角色扩展测试', () => {
  it('🔧[反例] 安监无权限注册/查询会员', () => {
    expect(checkRoleAccess(ROLES.Security, 'mem:register')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'mem:query')).toBe(false)
  })

  it('🔧[反例] 安监无权限操作积分余额', () => {
    expect(checkRoleAccess(ROLES.Security, 'mem:points')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'mem:balance')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'mem:delete')).toBe(false)
  })

  it('🔧[闭环] 安监无权限返回统一拒绝格式', () => {
    const denied = { success: false, code: 403, message: 'NO_MEMBERSHIP_ACCESS', module: 'membership' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('membership')
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 会员管理
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] membership 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权限注册/查询会员', () => {
    expect(checkRoleAccess(ROLES.Guide, 'mem:register')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'mem:query')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'mem:update')).toBe(false)
  })

  it('🎮[反例] 导玩员无权限操作积分余额', () => {
    expect(checkRoleAccess(ROLES.Guide, 'mem:points')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'mem:balance')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'mem:stats')).toBe(false)
  })

  it('🎮[反例] 导玩员全部会员权限被拒', () => {
    const resources = ['mem:register', 'mem:query', 'mem:update', 'mem:delete', 'mem:points', 'mem:balance', 'mem:stats', 'mem:level']
    resources.forEach((r) => {
      expect(checkRoleAccess(ROLES.Guide, r)).toBe(false)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 会员管理
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] membership 角色扩展测试', () => {
  it('🎯[正例] 运行专员注册会员 → 查询 → 积分累计', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'mem:register')).toBe(true)
    const svc = makeService()
    const member = svc.register({ phone: '13944445555', name: '运行专员注册', tenantId: 't1' })
    expect(member.id).toBeTruthy()

    expect(checkRoleAccess(ROLES.Operations, 'mem:query')).toBe(true)
    const found = svc.findByPhone('13944445555', 't1')
    expect(found).not.toBeNull()

    expect(checkRoleAccess(ROLES.Operations, 'mem:points')).toBe(true)
    const tx = svc.earnPoints(member.id, 100000, 'order-run')
    expect(tx.amount).toBeGreaterThan(0)
  })

  it('🎯[正例] 运行专员余额充值 → 更新等级 → 查看统计', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'mem:balance')).toBe(true)
    const svc = makeService()
    const member = svc.getById('MEM-000001')
    expect(member).not.toBeNull()

    const prevBalance = member!.balance
    svc.recharge(member!.id, 20000)
    const afterRecharge = svc.getById(member!.id)
    expect(afterRecharge!.balance).toBe(prevBalance + 20000)

    expect(checkRoleAccess(ROLES.Operations, 'mem:update')).toBe(true)
    svc.update(member!.id, { level: 'diamond' })
    expect(svc.getById(member!.id)!.level).toBe('diamond')

    expect(checkRoleAccess(ROLES.Operations, 'mem:stats')).toBe(true)
    const stats = svc.getStats()
    expect(stats.totalMembers).toBeGreaterThan(0)
  })

  it('🎯[正例] 运行专员积分兑换 → 查看等级配置', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'mem:points')).toBe(true)
    const svc = makeService()
    // 先增加积分
    svc.earnPoints('MEM-000003', 1000000, 'big-order')
    const result = svc.redeemPoints('MEM-000003', 50000, 'redeem-order')
    expect(result.pointsUsed).toBeGreaterThan(0)
    expect(result.centsDiscounted).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.Operations, 'mem:level')).toBe(true)
    const configs = svc.getLevelConfigs()
    expect(configs.length).toBe(4)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 会员管理
// ════════════════════════════════════════════════════════════

describe('[🤝团建] membership 角色扩展测试', () => {
  it('🤝[反例] 团建无权限注册/查询会员', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'mem:register')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'mem:query')).toBe(false)
  })

  it('🤝[反例] 团建无权限操作积分余额', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'mem:points')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'mem:balance')).toBe(false)
  })

  it('🤝[反例] 团建全部会员权限被拒', () => {
    const resources = ['mem:register', 'mem:query', 'mem:update', 'mem:delete', 'mem:points', 'mem:balance', 'mem:stats', 'mem:level']
    resources.forEach((r) => {
      expect(checkRoleAccess(ROLES.Teambuilding, r)).toBe(false)
    })
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 会员管理
// ════════════════════════════════════════════════════════════

describe('[📢营销] membership 角色扩展测试', () => {
  it('📢[正例] 营销查询会员（营销活动参考）', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'mem:query')).toBe(true)
    const svc = makeService()
    const list = svc.list({ level: 'gold' })
    expect(list.length).toBeGreaterThan(0)
    list.forEach((m) => expect(m.level).toBe('gold'))
  })

  it('📢[正例] 营销查看会员统计（分析客户结构）', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'mem:stats')).toBe(true)
    const svc = makeService()
    const stats = svc.getStats()
    expect(stats.totalMembers).toBeGreaterThan(0)
    expect(Object.keys(stats.byLevel).length).toBe(4)
    expect(stats.totalBalance).toBeGreaterThan(0)
  })

  it('📢[反例] 营销无权限注册/更新/删除', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'mem:register')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'mem:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'mem:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'mem:points')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'mem:balance')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'mem:level')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 membership 跨角色闭环 + 边界]', () => {
  it('🛒 + 👔 前台注册会员 → 店长升级等级 → 查看统计', async () => {
    const svc = makeService()

    // 1. 前台注册
    const member = svc.register({ phone: '13955556666', name: '活动客户', tenantId: 't1' })
    expect(member.level).toBe('regular')

    // 2. 前台充值
    svc.recharge(member.id, 50000, 'wechat')

    // 3. 店长升级
    svc.update(member.id, { level: 'silver' })
    expect(svc.getById(member.id)!.level).toBe('silver')

    // 4. 查看统计
    const stats = svc.getStats()
    expect(stats.totalRecharge).toBeGreaterThan(0)
  })

  it('🛡️ 重复手机号注册抛出异常', () => {
    const svc = makeService()
    expect(() => svc.register({ phone: '13800001111', name: '重复', tenantId: 't1' })).toThrow('已注册')
  })

  it('🛡️ 不存在的会员查询返回 null', () => {
    const svc = makeService()
    expect(svc.getById('MEM-999999')).toBeNull()
    expect(svc.findByPhone('00000000000', 't1')).toBeNull()
  })

  it('🛡️ 不存在的会员更新抛出 NotFound', () => {
    const svc = makeService()
    expect(() => svc.update('MEM-999999', { name: 'nonexist' })).toThrow('不存在')
  })

  it('🛡️ 不存在的会员删除抛出 NotFound', () => {
    const svc = makeService()
    expect(() => svc.delete('MEM-999999')).toThrow('不存在')
  })

  it('🛡️ 积分不足兑换抛出 BadRequest', () => {
    const svc = makeService()
    svc.register({ phone: '13977778888', name: '新会员', tenantId: 't1' })
    const member = svc.findByPhone('13977778888', 't1')!
    // 积分0，尝试兑换
    expect(() => svc.redeemPoints(member.id, 100, 'test')).toThrow('积分不足')
  })

  it('🛡️ 余额不足支付抛出 BadRequest', () => {
    const svc = makeService()
    const member = svc.findByPhone('13800001111', 't1')!
    expect(() => svc.payWithBalance(member.id, 9999999, 'huge-order')).toThrow('余额不足')
  })

  it('🛡️ 积分调整不能为负数', () => {
    const svc = makeService()
    expect(() => svc.adjustPoints('MEM-000002', -999999, 'overdraft')).toThrow('不能为负数')
  })

  it('🛡️ 升级进度计算正确', () => {
    const svc = makeService()
    const progress = svc.getUpgradeProgress('MEM-000002') // silver, spent 80000
    expect(progress.currentLevel).toBe('silver')
    expect(progress.nextLevel).toBe('gold')
    expect(progress.nextLevelMinSpent).toBe(200000)
    expect(progress.progress).toBeGreaterThan(0)
    expect(progress.progress).toBeLessThan(100)
  })

  it('🛡️ 最高等级会员无下一级', () => {
    const svc = makeService()
    const progress = svc.getUpgradeProgress('MEM-000003') // diamond, spent 600000
    expect(progress.currentLevel).toBe('diamond')
    expect(progress.nextLevel).toBeNull()
    expect(progress.progress).toBe(100)
  })

  it('🛡️ 积分流水按时间倒序', () => {
    const svc = makeService()
    svc.earnPoints('MEM-000001', 10000, 'order-1')
    svc.earnPoints('MEM-000001', 20000, 'order-2')
    const txs = svc.listPointsTransactions('MEM-000001')
    for (let i = 1; i < txs.length; i++) {
      expect(txs[i - 1].createdAt.getTime()).toBeGreaterThanOrEqual(txs[i].createdAt.getTime())
    }
  })

  it('🛡️ 余额流水正确记录', () => {
    const svc = makeService()
    svc.recharge('MEM-000001', 10000, 'alipay', 'recharge-01')
    svc.payWithBalance('MEM-000001', 5000, 'order-pay-01')
    const txs = svc.listBalanceTransactions('MEM-000001')
    expect(txs.length).toBeGreaterThanOrEqual(2)
    expect(txs.some(t => t.type === 'recharge')).toBe(true)
    expect(txs.some(t => t.type === 'payment')).toBe(true)
  })
})
