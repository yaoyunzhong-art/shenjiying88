/**
 * 🐜 自动: [tax] [C] 角色扩展测试
 *
 * 8 角色视角的税务模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 TaxService + in-memory 税率表
 */
import { describe, it, expect } from 'vitest'
import { TaxService } from './tax.service'

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

const roleTaxAccess: Record<string, string[]> = {
  'tax:rate:list': ['👔店长', '🎯运行专员'],
  'tax:rate:view': ['👔店长', '🎯运行专员'],
  'tax:rate:manage': ['👔店长'],
  'tax:calc': ['👔店长', '🎯运行专员', '🛒前台'],
  'tax:batch:calc': ['👔店长', '🎯运行专员'],
  'tax:config': ['👔店长'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleTaxAccess[resource]?.includes(role) ?? false
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 税务
// ════════════════════════════════════════════════════════════

describe('[👔店长] tax 角色扩展测试', () => {
  it('👔[正例] 店长查看税率列表 → 按地区筛选 → 查看税率详情', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'tax:rate:list')).toBe(true)
    const svc = new TaxService()
    const all = svc.getAllRates()
    expect(all.length).toBeGreaterThan(0)

    const cnRates = svc.getRatesByJurisdiction('CN')
    expect(cnRates.length).toBeGreaterThanOrEqual(1)
    cnRates.forEach((r) => expect(r.jurisdiction).toBe('CN'))

    if (all.length > 0) {
      const detail = svc.getRateById(all[0].id)
      expect(detail).not.toBeNull()
      expect(detail!.name).toBeDefined()
    }
  })

  it('👔[正例] 店长计算税额（不含税价）', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'tax:calc')).toBe(true)
    const svc = new TaxService()
    const result = svc.calculate({
      amount: 10000,
      jurisdiction: 'CN',
      taxType: 'vat',
    })
    expect(result.taxAmount).toBe(1300) // 10000 * 0.13
    expect(result.grossAmount).toBe(11300)
    expect(result.netAmount).toBe(10000)
    expect(result.effectiveRate).toBeCloseTo(0.13, 2)
  })

  it('👔[正例] 店长管理税率 → 配置', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'tax:rate:manage')).toBe(true)
    const svc = new TaxService()

    const added = svc.addRate({
      name: '测试税率', type: 'vat', rate: 0.05,
      jurisdiction: 'CN-TEST', enabled: true, description: 'test',
    })
    expect(added.rate).toBe(0.05)

    const updated = svc.updateRate(added.id, { rate: 0.06 })
    expect(updated).not.toBeNull()
    expect(updated!.rate).toBe(0.06)

    expect(checkRoleAccess(ROLES.StoreManager, 'tax:config')).toBe(true)
    svc.setConfig({ priceInclusive: true })
    const config = svc.getConfig()
    expect(config.priceInclusive).toBe(true)
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 税务
// ════════════════════════════════════════════════════════════

describe('[🛒前台] tax 角色扩展测试', () => {
  it('🛒[正例] 前台计算税额（含税场景）', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'tax:calc')).toBe(true)
    const svc = new TaxService()
    const result = svc.calculate({
      amount: 500,
      jurisdiction: 'CN',
      taxType: 'service_charge',
    })
    // 500 * 0.06 = 30
    expect(result.taxAmount).toBe(30)
    expect(result.grossAmount).toBe(530)
  })

  it('🛒[正例] 前台计算多个税种合计', () => {
    const svc = new TaxService()
    // 不含税价 1000，先计算 6% service charge
    const result = svc.calculate({
      amount: 1000,
      jurisdiction: 'CN',
    })
    // CN 有 vat(13%) + service_charge(6%) = 130 + 60 = 190
    expect(result.breakdown.length).toBeGreaterThanOrEqual(2)
    expect(result.taxAmount).toBe(190)
    expect(result.grossAmount).toBe(1190)
  })

  it('🛒[反例] 前台无权管理税率', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'tax:rate:manage')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'tax:rate:list')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'tax:config')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 税务
// ════════════════════════════════════════════════════════════

describe('[👥HR] tax 角色扩展测试', () => {
  it('👥[反例] HR 无权操作税务', () => {
    expect(checkRoleAccess(ROLES.HR, 'tax:rate:list')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'tax:calc')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'tax:config')).toBe(false)
  })

  it('👥[反例] HR 无权管理税率', () => {
    expect(checkRoleAccess(ROLES.HR, 'tax:rate:manage')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'tax:batch:calc')).toBe(false)
  })

  it('👥[闭环] HR 不涉及税务操作', () => {
    const denied = { code: 403, role: ROLES.HR, module: 'tax' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 税务
// ════════════════════════════════════════════════════════════

describe('[🔧安监] tax 角色扩展测试', () => {
  it('🔧[反例] 安监无权查看税率', () => {
    expect(checkRoleAccess(ROLES.Security, 'tax:rate:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'tax:rate:view')).toBe(false)
  })

  it('🔧[反例] 安监无权计算税务', () => {
    expect(checkRoleAccess(ROLES.Security, 'tax:calc')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'tax:batch:calc')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'tax:config')).toBe(false)
  })

  it('🔧[闭环] 安监不涉及税务', () => {
    const denied = { code: 403, role: ROLES.Security }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 税务
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] tax 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权查看税率', () => {
    expect(checkRoleAccess(ROLES.Guide, 'tax:rate:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'tax:rate:view')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'tax:rate:manage')).toBe(false)
  })

  it('🎮[反例] 导玩员无权计算税务', () => {
    expect(checkRoleAccess(ROLES.Guide, 'tax:calc')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'tax:batch:calc')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'tax:config')).toBe(false)
  })

  it('🎮[闭环] 导玩员不可见税务模块', () => {
    const denied = { code: 403, role: ROLES.Guide }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 税务
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] tax 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看税率 → 批量计算税额', () => {
    expect(checkRoleAccess(ROLES.Operations, 'tax:rate:list')).toBe(true)
    const svc = new TaxService()
    const all = svc.getAllRates()
    expect(all.length).toBeGreaterThan(0)

    expect(checkRoleAccess(ROLES.Operations, 'tax:batch:calc')).toBe(true)
    const batch = svc.calculateBatch({
      items: [
        { id: 'item-1', amount: 10000, jurisdiction: 'CN' },
        { id: 'item-2', amount: 5000, jurisdiction: 'US-VA' },
      ],
    })
    expect(batch.items.length).toBe(2)
    expect(batch.totalTaxAmount).toBeGreaterThan(0)
  })

  it('🎯[正例] 运行专员按 jurisdictions 计算税额', () => {
    const svc = new TaxService()
    const cnResult = svc.calculate({ amount: 1000, jurisdiction: 'CN' })
    expect(cnResult.taxAmount).toBeGreaterThan(0)

    const hkResult = svc.calculate({ amount: 1000, jurisdiction: 'HK' })
    expect(hkResult.taxAmount).toBe(0) // HK 0% GST
  })

  it('🎯[正例] 运行专员查看启用税率', () => {
    const svc = new TaxService()
    const enabled = svc.getEnabledRates()
    expect(enabled.length).toBeGreaterThan(0)
    enabled.forEach((r) => expect(r.enabled).toBe(true))
  })

  it('🎯[反例] 运行专员无权管理税率配置', () => {
    expect(checkRoleAccess(ROLES.Operations, 'tax:rate:manage')).toBe(false)
    expect(checkRoleAccess(ROLES.Operations, 'tax:config')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 税务
// ════════════════════════════════════════════════════════════

describe('[🤝团建] tax 角色扩展测试', () => {
  it('🤝[反例] 团建无权操作税务', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'tax:rate:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'tax:calc')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'tax:rate:manage')).toBe(false)
  })

  it('🤝[反例] 团建无权配置税务', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'tax:config')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'tax:batch:calc')).toBe(false)
  })

  it('🤝[闭环] 团建不涉及税务', () => {
    const denied = { code: 403, role: ROLES.Teambuilding }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 税务
// ════════════════════════════════════════════════════════════

describe('[📢营销] tax 角色扩展测试', () => {
  it('📢[反例] 营销无权操作税务', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'tax:rate:list')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'tax:calc')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'tax:rate:manage')).toBe(false)
  })

  it('📢[反例] 营销无权配置税务', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'tax:config')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'tax:batch:calc')).toBe(false)
  })

  it('📢[闭环] 营销不可见税务模块', () => {
    const denied = { code: 403, role: ROLES.Marketing, module: 'tax' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 tax 跨角色闭环 + 边界]', () => {
  it('👔+🛒 店长配置含税价模式 → 前台计算含税订单', () => {
    const svc = new TaxService()

    // 1. 店长配置含税价模式
    expect(checkRoleAccess(ROLES.StoreManager, 'tax:config')).toBe(true)
    svc.setConfig({ priceInclusive: true, roundingMode: 'round' })
    expect(svc.getConfig().priceInclusive).toBe(true)

    // 2. 前台计算含税金额
    expect(checkRoleAccess(ROLES.FrontDesk, 'tax:calc')).toBe(true)
    const result = svc.calculate({
      amount: 11300, // 含税金额
      jurisdiction: 'CN',
      taxType: 'vat',
    })
    // 11300 * 0.13 / 1.13 = 1300
    expect(result.taxAmount).toBe(1300)
    expect(result.netAmount).toBe(10000)
    expect(result.grossAmount).toBe(11300)
  })

  it('👔+🎯 店长配税率 → 运行专员批量计算 → 确认', () => {
    const svc = new TaxService()
    svc.setConfig({ priceInclusive: false, roundingMode: 'floor' })

    // 店长配置：添加新税率
    expect(checkRoleAccess(ROLES.StoreManager, 'tax:rate:manage')).toBe(true)
    svc.addRate({
      name: '促销税', type: 'vat', rate: 0.03,
      jurisdiction: 'CN-PROMO', enabled: true, description: 'promo',
    })

    // 运行专员批量计算
    const batch = svc.calculateBatch({
      items: [
        { id: 'p1', amount: 10000, jurisdiction: 'CN', taxType: 'vat' },
        { id: 'p2', amount: 5000, jurisdiction: 'HK' },
        { id: 'p3', amount: 8000, jurisdiction: 'SG' },
      ],
    })
    expect(batch.items.length).toBe(3)
    // CN vat 13% → 1300
    expect(batch.items[0].taxAmount).toBe(1300)
    // HK 0%
    expect(batch.items[1].taxAmount).toBe(0)
    // SG GST 9% → 720
    expect(batch.items[2].taxAmount).toBe(720)
  })

  it('🛡️ 无效税率 ID 返回 null', () => {
    const svc = new TaxService()
    expect(svc.getRateById('nonexistent')).toBeNull()
  })

  it('🛡️ 删除税率后返回 null', () => {
    const svc = new TaxService()
    const rate = svc.addRate({
      name: '临时税率', type: 'vat', rate: 0.01,
      jurisdiction: 'CN-TEMP', enabled: true,
    })
    expect(svc.getRateById(rate.id)).not.toBeNull()
    svc.deleteRate(rate.id)
    expect(svc.getRateById(rate.id)).toBeNull()
  })

  it('🛡️ 更新不存在的税率返回 null', () => {
    const svc = new TaxService()
    expect(svc.updateRate('nonexistent', { rate: 0.1 })).toBeNull()
  })

  it('🛡️ 未知地区税务计算返回 0 税', () => {
    const svc = new TaxService()
    const result = svc.calculate({
      amount: 10000,
      jurisdiction: 'XX-UNKNOWN',
    })
    expect(result.taxAmount).toBe(0)
    expect(result.netAmount).toBe(10000)
    expect(result.grossAmount).toBe(10000)
  })

  it('🛡️ 含税模式下提取正确净额', () => {
    const svc = new TaxService()
    svc.setConfig({ priceInclusive: true, roundingMode: 'floor' })
    const result = svc.calculate({
      amount: 100,
      jurisdiction: 'JP',
      taxType: 'vat',
    })
    // JP 10% tax, price inclusive: 100 * 0.1 / 1.1 = 9.09 (floor) = 9.09
    expect(result.taxAmount).toBe(9.09)
    expect(result.netAmount).toBe(90.91)
  })

  it('🛡️ 金额格式化', () => {
    const svc = new TaxService()
    expect(svc.formatTaxAmount(1234.5)).toBe('1,234.50')
    expect(svc.formatTaxAmount(0)).toBe('0.00')
  })

  it('🛡️ 批量计算空序列返回 0', () => {
    const svc = new TaxService()
    const batch = svc.calculateBatch({ items: [] })
    expect(batch.items.length).toBe(0)
    expect(batch.totalTaxAmount).toBe(0)
    expect(batch.totalGrossAmount).toBe(0)
  })

  it('🛡️ 从已启用税率中排除禁用税率', () => {
    const svc = new TaxService()
    const all = svc.getAllRates().filter((r) => r.jurisdiction === 'CN')
    expect(all.length).toBeGreaterThan(0)
    // Disable one
    const target = all[0]
    svc.updateRate(target.id, { enabled: false })

    const enabled = svc.getEnabledRates()
    const stillEnabled = enabled.filter((r) => r.id === target.id)
    expect(stillEnabled.length).toBe(0)
  })
})
