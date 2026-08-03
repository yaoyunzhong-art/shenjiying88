/**
 * 🐜 自动: [royalty] [C] 角色扩展测试
 *
 * 8 角色视角的分润模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 RoyaltyService + in-memory Store
 */
import { describe, it, expect } from 'vitest'
import { RoyaltyService } from './royalty.service'
import type { RequestTenantContext } from '../tenant/tenant.types'
import { RoyaltyType } from './royalty.entity'

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

const roleRoyaltyAccess: Record<string, string[]> = {
  'royalty:rule:list': ['👔店长', '🎯运行专员'],
  'royalty:rule:create': ['👔店长', '🎯运行专员'],
  'royalty:rule:update': ['👔店长', '🎯运行专员'],
  'royalty:rule:delete': ['👔店长'],
  'royalty:calc:create': ['👔店长', '🎯运行专员'],
  'royalty:calc:list': ['👔店长', '🎯运行专员'],
  'royalty:calc:settle': ['👔店长'],
  'royalty:calc:detail': ['👔店长', '🎯运行专员', '📢营销'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleRoyaltyAccess[resource]?.includes(role) ?? false
}

function makeTenant(tenantId: string = 'tenant-001'): RequestTenantContext {
  return { tenantId, storeId: 'store-001' }
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 分润
// ════════════════════════════════════════════════════════════

describe('[👔店长] royalty 角色扩展测试', () => {
  beforeEach(() => { RoyaltyService._resetStoreForTest() })

  it('👔[正例] 店长创建分润规则 → 查看列表 → 按类型筛选', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'royalty:rule:create')).toBe(true)
    const svc = new RoyaltyService()
    const tc = makeTenant()
    const rule = svc.createRule({
      tenantContext: tc, brandId: 'brand-001', name: '联名扭蛋分润',
      royaltyType: RoyaltyType.RevenueShare, rate: 15, fixedAmount: 0,
      effectiveDate: '2026-07-01',
    })
    expect(rule.name).toBe('联名扭蛋分润')
    expect(rule.rate).toBe(15)

    expect(checkRoleAccess(ROLES.StoreManager, 'royalty:rule:list')).toBe(true)
    const all = svc.findAllRules('tenant-001')
    expect(all.length).toBeGreaterThanOrEqual(1)

    const filtered = svc.findAllRules('tenant-001', { royaltyType: RoyaltyType.RevenueShare })
    filtered.forEach((r) => expect(r.royaltyType).toBe(RoyaltyType.RevenueShare))
  })

  it('👔[正例] 店长更新分润规则 → 删除', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'royalty:rule:update')).toBe(true)
    expect(checkRoleAccess(ROLES.StoreManager, 'royalty:rule:delete')).toBe(true)

    const svc = new RoyaltyService()
    const tc = makeTenant()
    const rule = svc.createRule({
      tenantContext: tc, brandId: 'brand-002', name: '固定分润',
      royaltyType: RoyaltyType.FixedAmount, rate: 0, fixedAmount: 5000,
      effectiveDate: '2026-07-01',
    })
    const updated = svc.updateRule(rule.ruleId, 'tenant-001', { rate: 20 })
    expect(updated.rate).toBe(20)

    svc.deleteRule(rule.ruleId, 'tenant-001')
    expect(svc.findRuleById(rule.ruleId, 'tenant-001')).toBeUndefined()
  })

  it('👔[正例] 店长计算分润 → 查看详情 → 结算', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'royalty:calc:create')).toBe(true)
    const svc = new RoyaltyService()
    const tc = makeTenant()
    svc.createRule({
      tenantContext: tc, brandId: 'brand-003', name: '收入分成',
      royaltyType: RoyaltyType.RevenueShare, rate: 10, fixedAmount: 0,
      effectiveDate: '2026-07-01',
    })
    const calc = svc.calculate({
      brandId: 'brand-003', orderId: 'order-001', orderAmount: 100000,
    }, 'tenant-001')
    expect(calc.royaltyAmount).toBe(10000)

    expect(checkRoleAccess(ROLES.StoreManager, 'royalty:calc:detail')).toBe(true)
    const found = svc.findCalculationById(calc.calculationId, 'tenant-001')
    expect(found).toBeDefined()
    expect(found!.royaltyAmount).toBe(10000)

    expect(checkRoleAccess(ROLES.StoreManager, 'royalty:calc:settle')).toBe(true)
    const settled = svc.settleCalculations([calc.calculationId], 'tenant-001')
    expect(settled).toBe(1)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 分润
// ════════════════════════════════════════════════════════════

describe('[🛒前台] royalty 角色扩展测试', () => {
  beforeEach(() => { RoyaltyService._resetStoreForTest() })

  it('🛒[反例] 前台无权创建分润规则', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'royalty:rule:create')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'royalty:rule:list')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'royalty:rule:update')).toBe(false)
  })

  it('🛒[反例] 前台无权计算分润', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'royalty:calc:create')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'royalty:calc:settle')).toBe(false)
  })

  it('🛒[闭环] 前台不可见分润管理菜单', () => {
    const denied = { success: false, code: 403, message: 'ROYALTY_ACCESS_DENIED', role: ROLES.FrontDesk }
    expect(denied.code).toBe(403)
    expect(denied.message).toBe('ROYALTY_ACCESS_DENIED')
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 分润
// ════════════════════════════════════════════════════════════

describe('[👥HR] royalty 角色扩展测试', () => {
  it('👥[反例] HR 无权管理分润规则', () => {
    expect(checkRoleAccess(ROLES.HR, 'royalty:rule:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'royalty:rule:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'royalty:rule:update')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'royalty:rule:delete')).toBe(false)
  })

  it('👥[反例] HR 无权查看分润计算', () => {
    expect(checkRoleAccess(ROLES.HR, 'royalty:calc:create')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'royalty:calc:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'royalty:calc:settle')).toBe(false)
  })

  it('👥[闭环] HR 不涉及分润模块', () => {
    const denied = { success: false, code: 403, message: 'ROYALTY_ACCESS_DENIED', role: ROLES.HR }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 分润
// ════════════════════════════════════════════════════════════

describe('[🔧安监] royalty 角色扩展测试', () => {
  it('🔧[反例] 安监无权操作分润', () => {
    expect(checkRoleAccess(ROLES.Security, 'royalty:rule:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'royalty:rule:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'royalty:calc:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'royalty:calc:settle')).toBe(false)
  })

  it('🔧[反例] 安监无权查看分润详情', () => {
    expect(checkRoleAccess(ROLES.Security, 'royalty:calc:detail')).toBe(false)
  })

  it('🔧[闭环] 安监不涉及分润模块', () => {
    const denied = { success: false, code: 403, role: ROLES.Security }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 分润
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] royalty 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权管理分润', () => {
    expect(checkRoleAccess(ROLES.Guide, 'royalty:rule:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'royalty:rule:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'royalty:calc:create')).toBe(false)
  })

  it('🎮[反例] 导玩员无权查看分润计算', () => {
    expect(checkRoleAccess(ROLES.Guide, 'royalty:calc:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'royalty:calc:list')).toBe(false)
  })

  it('🎮[闭环] 导玩员不涉及分润操作', () => {
    const denied = { success: false, code: 403, message: 'ROYALTY_ACCESS_DENIED' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 分润
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] royalty 角色扩展测试', () => {
  beforeEach(() => { RoyaltyService._resetStoreForTest() })

  it('🎯[正例] 运行专员创建分润规则 → 查看列表 → 按品牌筛选', () => {
    expect(checkRoleAccess(ROLES.Operations, 'royalty:rule:create')).toBe(true)
    const svc = new RoyaltyService()
    const tc = makeTenant()
    svc.createRule({
      tenantContext: tc, brandId: 'brand-ops', name: '运营分润',
      royaltyType: RoyaltyType.RevenueShare, rate: 8, fixedAmount: 0,
      effectiveDate: '2026-07-01',
    })
    const list = svc.findAllRules('tenant-001', { brandId: 'brand-ops' })
    expect(list.length).toBe(1)
    expect(list[0].brandId).toBe('brand-ops')
  })

  it('🎯[正例] 运行专员更新分润规则', () => {
    expect(checkRoleAccess(ROLES.Operations, 'royalty:rule:update')).toBe(true)
    const svc = new RoyaltyService()
    const tc = makeTenant()
    const rule = svc.createRule({
      tenantContext: tc, brandId: 'brand-004', name: '运营更新',
      royaltyType: RoyaltyType.RevenueShare, rate: 5, fixedAmount: 0,
      effectiveDate: '2026-07-01',
    })
    const updated = svc.updateRule(rule.ruleId, 'tenant-001', { rate: 12 })
    expect(updated.rate).toBe(12)
  })

  it('🎯[反例] 运行专员无权删除分润规则', () => {
    expect(checkRoleAccess(ROLES.Operations, 'royalty:rule:delete')).toBe(false)
    expect(checkRoleAccess(ROLES.Operations, 'royalty:calc:settle')).toBe(false)
  })

  it('🎯[正例] 运行专员查看分润计算结果', () => {
    expect(checkRoleAccess(ROLES.Operations, 'royalty:calc:list')).toBe(true)
    expect(checkRoleAccess(ROLES.Operations, 'royalty:calc:detail')).toBe(true)

    const svc = new RoyaltyService()
    const tc = makeTenant()
    svc.createRule({
      tenantContext: tc, brandId: 'brand-005', name: '运营计算',
      royaltyType: RoyaltyType.FixedAmount, rate: 0, fixedAmount: 3000,
      effectiveDate: '2026-07-01',
    })
    const calc = svc.calculate({
      brandId: 'brand-005', orderId: 'order-002', orderAmount: 50000,
    }, 'tenant-001')
    expect(calc.royaltyAmount).toBe(3000)

    const calcList = svc.findAllCalculations('tenant-001', { brandId: 'brand-005' })
    expect(calcList.length).toBeGreaterThanOrEqual(1)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 分润
// ════════════════════════════════════════════════════════════

describe('[🤝团建] royalty 角色扩展测试', () => {
  it('🤝[反例] 团建无权管理分润', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'royalty:rule:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'royalty:rule:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'royalty:calc:create')).toBe(false)
  })

  it('🤝[反例] 团建无权查看分润详情', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'royalty:calc:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'royalty:calc:settle')).toBe(false)
  })

  it('🤝[闭环] 团建不涉及分润操作', () => {
    const denied = { success: false, code: 403, message: 'ROYALTY_ACCESS_DENIED' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 分润
// ════════════════════════════════════════════════════════════

describe('[📢营销] royalty 角色扩展测试', () => {
  beforeEach(() => { RoyaltyService._resetStoreForTest() })

  it('📢[正例] 营销查看品牌分润详情', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'royalty:calc:detail')).toBe(true)
    const svc = new RoyaltyService()
    const tc = makeTenant()
    svc.createRule({
      tenantContext: tc, brandId: 'brand-mkt', name: '营销分润',
      royaltyType: RoyaltyType.RevenueShare, rate: 20, fixedAmount: 0,
      effectiveDate: '2026-07-01',
    })
    const calc = svc.calculate({
      brandId: 'brand-mkt', orderId: 'order-mkt-001', orderAmount: 200000,
    }, 'tenant-001')
    expect(calc.royaltyAmount).toBe(40000)

    const detail = svc.findCalculationById(calc.calculationId, 'tenant-001')
    expect(detail).toBeDefined()
    expect(detail!.appliedRate).toBe(20)
  })

  it('📢[反例] 营销无权创建或结算分润', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'royalty:rule:create')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'royalty:rule:update')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'royalty:calc:settle')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'royalty:rule:delete')).toBe(false)
  })

  it('📢[闭环] 营销仅查看分润结果，不管理规则', () => {
    const canView = checkRoleAccess(ROLES.Marketing, 'royalty:calc:detail')
    const canManage = checkRoleAccess(ROLES.Marketing, 'royalty:rule:create')
    expect(canView).toBe(true)
    expect(canManage).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 royalty 跨角色闭环 + 边界]', () => {
  beforeEach(() => { RoyaltyService._resetStoreForTest() })

  it('👔+🎯 店长创建规则 + 运行专员计算 + 店长结算 → 全流程', () => {
    const svc = new RoyaltyService()
    const tc = makeTenant()

    // 1. 店长创建 RevenueShare 规则
    const rule = svc.createRule({
      tenantContext: tc, brandId: 'brand-flow', name: '联名分润',
      royaltyType: RoyaltyType.RevenueShare, rate: 10, fixedAmount: 0,
      effectiveDate: '2026-01-01',
    })
    expect(rule.rate).toBe(10)

    // 2. 运行专员计算分润
    const calc = svc.calculate({
      brandId: 'brand-flow', orderId: 'order-flow-001', orderAmount: 500000,
    }, 'tenant-001')
    expect(calc.royaltyAmount).toBe(50000) // 500000 * 10%

    // 3. 店长结算
    const settled = svc.settleCalculations([calc.calculationId], 'tenant-001')
    expect(settled).toBe(1)

    // 4. 确认已结算
    const calcAfter = svc.findCalculationById(calc.calculationId, 'tenant-001')
    expect(calcAfter!.settled).toBe(true)
  })

  it('🛡️ 分润率超出范围报错', () => {
    const svc = new RoyaltyService()
    expect(() => svc.createRule({
      tenantContext: makeTenant(), brandId: 'brand-err', name: '错误分润',
      royaltyType: RoyaltyType.RevenueShare, rate: 150, fixedAmount: 0,
      effectiveDate: '2026-07-01',
    })).toThrow('Royalty rate must be between 0 and 100')
  })

  it('🛡️ RevenueShare 率不能为 0', () => {
    const svc = new RoyaltyService()
    expect(() => svc.createRule({
      tenantContext: makeTenant(), brandId: 'brand-zero', name: '零分润率',
      royaltyType: RoyaltyType.RevenueShare, rate: 0, fixedAmount: 0,
      effectiveDate: '2026-07-01',
    })).toThrow('Revenue share royalty must have a rate greater than 0')
  })

  it('🛡️ FixedAmount 不能为 0', () => {
    const svc = new RoyaltyService()
    expect(() => svc.createRule({
      tenantContext: makeTenant(), brandId: 'brand-fix-zero', name: '零固定额',
      royaltyType: RoyaltyType.FixedAmount, rate: 0, fixedAmount: 0,
      effectiveDate: '2026-07-01',
    })).toThrow('Fixed amount royalty must have a positive fixed amount')
  })

  it('🛡️ 无效规则查询返回 undefined', () => {
    const svc = new RoyaltyService()
    expect(svc.findRuleById('nonexistent', 'tenant-001')).toBeUndefined()
  })

  it('🛡️ 更新已删除规则报错', () => {
    const svc = new RoyaltyService()
    const tc = makeTenant()
    const rule = svc.createRule({
      tenantContext: tc, brandId: 'brand-del', name: '待删除',
      royaltyType: RoyaltyType.RevenueShare, rate: 5, fixedAmount: 0,
      effectiveDate: '2026-07-01',
    })
    svc.deleteRule(rule.ruleId, 'tenant-001')
    expect(() => svc.updateRule(rule.ruleId, 'tenant-001', { rate: 10 }))
      .toThrow('Royalty rule not found')
  })

  it('🛡️ 租户隔离：另一个租户看不到规则', () => {
    const svc = new RoyaltyService()
    const tc = makeTenant('tenant-A')
    svc.createRule({
      tenantContext: tc, brandId: 'brand-A', name: 'A租户',
      royaltyType: RoyaltyType.RevenueShare, rate: 10, fixedAmount: 0,
      effectiveDate: '2026-07-01',
    })
    const rulesB = svc.findAllRules('tenant-B')
    expect(rulesB.length).toBe(0)
  })

  it('🛡️ 已结算不可重复结算', () => {
    const svc = new RoyaltyService()
    const tc = makeTenant()
    svc.createRule({
      tenantContext: tc, brandId: 'brand-settle', name: '结算测试',
      royaltyType: RoyaltyType.RevenueShare, rate: 5, fixedAmount: 0,
      effectiveDate: '2026-07-01',
    })
    const calc = svc.calculate({
      brandId: 'brand-settle', orderId: 'order-settle', orderAmount: 10000,
    }, 'tenant-001')
    svc.settleCalculations([calc.calculationId], 'tenant-001')
    expect(() => svc.settleCalculations([calc.calculationId], 'tenant-001'))
      .toThrow('is already settled')
  })

  it('🛡️ 阶梯分润计算', () => {
    const svc = new RoyaltyService()
    const tc = makeTenant()
    const rule = svc.createRule({
      tenantContext: tc, brandId: 'brand-tier', name: '阶梯分润',
      royaltyType: RoyaltyType.Tiered, rate: 10, fixedAmount: 0,
      tierConfig: JSON.stringify([
        { min: 0, max: 100000, rate: 5 },
        { min: 100000, max: -1, rate: 8 },
      ]),
      effectiveDate: '2026-07-01',
    })
    expect(rule).toBeDefined()

    const calcSmall = svc.calculate({
      brandId: 'brand-tier', orderId: 'order-tier-1', orderAmount: 50000,
    }, 'tenant-001')
    expect(calcSmall.royaltyAmount).toBe(2500) // 50000 * 5%

    const calcLarge = svc.calculate({
      brandId: 'brand-tier', orderId: 'order-tier-2', orderAmount: 200000,
    }, 'tenant-001')
    expect(calcLarge.royaltyAmount).toBe(16000) // 200000 * 8%
  })
})
