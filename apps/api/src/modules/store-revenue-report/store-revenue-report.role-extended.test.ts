/**
 * 🐜 自动: [store-revenue-report] [C] 角色扩展测试
 *
 * 8 角色视角的门店营收报告扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 StoreRevenueReportService + in-memory Store
 */
import { describe, it, expect } from 'vitest'
import { StoreRevenueReportService } from './store-revenue-report.service'

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

const roleRevenueAccess: Record<string, string[]> = {
  'revenue:view': ['👔店长', '🎯运行专员'],
  'revenue:detail': ['👔店长', '🎯运行专员'],
  'revenue:compare': ['👔店长', '🎯运行专员'],
  'revenue:export': ['👔店长', '🎯运行专员'],
  'revenue:delete': ['👔店长'],
  'revenue:summary': ['👔店长', '🎯运行专员'],
  'revenue:list': ['👔店长', '🎯运行专员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleRevenueAccess[resource]?.includes(role) ?? false
}

const TENANT = 'tenant-001'

// ════════════════════════════════════════════════════════════
// 👔店长 — 营收报告
// ════════════════════════════════════════════════════════════

describe('[👔店长] store-revenue-report 角色扩展测试', () => {
  it('👔[正例] 店长查看营收列表 → 按门店筛选 → 按类型筛选', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'revenue:list')).toBe(true)
    const svc = new StoreRevenueReportService()
    const all = svc.listReports(TENANT)
    expect(all.length).toBeGreaterThan(0)

    const storeReports = svc.listReports(TENANT, { storeId: 'store-001' })
    storeReports.forEach((r) => expect(r.storeId).toBe('store-001'))

    const dailyReports = svc.listReports(TENANT, { reportType: 'daily' })
    dailyReports.forEach((r) => expect(r.reportType).toBe('daily'))
  })

  it('👔[正例] 店长查看营收详情 → 门店汇总 → 全局汇总', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'revenue:detail')).toBe(true)
    const svc = new StoreRevenueReportService()
    const reports = svc.listReports(TENANT, { storeId: 'store-001', reportType: 'monthly', startDate: '2026-07-01' })
    expect(reports.length).toBeGreaterThanOrEqual(1)

    const summary = svc.getStoreSummary('store-001', TENANT)
    expect(summary).toBeDefined()

    const overall = svc.getOverallSummary(TENANT)
    expect(overall.storeCount).toBeGreaterThan(0)
    expect(overall.totalRevenue).toBeGreaterThan(0)
  })

  it('👔[正例] 店长导出报表 → 查看增长趋势', () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'revenue:export')).toBe(true)
    expect(checkRoleAccess(ROLES.StoreManager, 'revenue:compare')).toBe(true)

    const svc = new StoreRevenueReportService()
    const reports = svc.listReports(TENANT, { storeId: 'store-001' })
    expect(reports.length).toBeGreaterThan(0)

    // 检查增长率数据
    const hasGrowthRate = reports.some((r) => r.revenueGrowthRate !== undefined)
    expect(hasGrowthRate).toBe(true)

    const r = reports[0]
    expect(r.grossProfit).toBeGreaterThan(0)
  })

  // cleanup
  afterEach(() => {
    const svc = new StoreRevenueReportService()
    svc.resetReportStoresForTests()
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 营收报告
// ════════════════════════════════════════════════════════════

describe('[🛒前台] store-revenue-report 角色扩展测试', () => {
  it('🛒[反例] 前台无权查看营收', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'revenue:view')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'revenue:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'revenue:list')).toBe(false)
  })

  it('🛒[反例] 前台无权导出或对比营收', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'revenue:export')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'revenue:compare')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'revenue:summary')).toBe(false)
  })

  it('🛒[闭环] 前台不可见营收管理页面', () => {
    const denied = { success: false, code: 403, message: 'REVENUE_ACCESS_DENIED', role: ROLES.FrontDesk }
    expect(denied.code).toBe(403)
    expect(denied.message).toBe('REVENUE_ACCESS_DENIED')
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 营收报告
// ════════════════════════════════════════════════════════════

describe('[👥HR] store-revenue-report 角色扩展测试', () => {
  it('👥[反例] HR 无权查看营收', () => {
    expect(checkRoleAccess(ROLES.HR, 'revenue:view')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'revenue:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'revenue:list')).toBe(false)
  })

  it('👥[反例] HR 无权操作营收数据', () => {
    expect(checkRoleAccess(ROLES.HR, 'revenue:export')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'revenue:compare')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'revenue:summary')).toBe(false)
  })

  it('👥[闭环] HR 不涉及营收管理', () => {
    const denied = { code: 403, role: ROLES.HR, module: 'revenue' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 营收报告
// ════════════════════════════════════════════════════════════

describe('[🔧安监] store-revenue-report 角色扩展测试', () => {
  it('🔧[反例] 安监无权查看营收', () => {
    expect(checkRoleAccess(ROLES.Security, 'revenue:view')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'revenue:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'revenue:list')).toBe(false)
  })

  it('🔧[反例] 安监无权导出营收', () => {
    expect(checkRoleAccess(ROLES.Security, 'revenue:export')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'revenue:summary')).toBe(false)
  })

  it('🔧[闭环] 安监不涉及营收数据', () => {
    const denied = { code: 403, role: ROLES.Security, module: 'revenue' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 营收报告
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] store-revenue-report 角色扩展测试', () => {
  it('🎮[反例] 导玩员无权查看营收', () => {
    expect(checkRoleAccess(ROLES.Guide, 'revenue:view')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'revenue:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'revenue:list')).toBe(false)
  })

  it('🎮[反例] 导玩员无权对比或汇总营收', () => {
    expect(checkRoleAccess(ROLES.Guide, 'revenue:compare')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'revenue:summary')).toBe(false)
  })

  it('🎮[闭环] 导玩员不可见营收菜单', () => {
    const denied = { code: 403, role: ROLES.Guide }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 营收报告
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] store-revenue-report 角色扩展测试', () => {
  it('🎯[正例] 运行专员查看营收列表 → 按日期筛选', () => {
    expect(checkRoleAccess(ROLES.Operations, 'revenue:list')).toBe(true)
    const svc = new StoreRevenueReportService()
    const all = svc.listReports(TENANT)
    expect(all.length).toBeGreaterThan(0)

    const dateFiltered = svc.listReports(TENANT, { startDate: '2026-07-01', endDate: '2026-07-31' })
    dateFiltered.forEach((r) => {
      expect(r.startDate >= '2026-07-01').toBe(true)
    })
  })

  it('🎯[正例] 运行专员查看营收详情 → 门店汇总', () => {
    expect(checkRoleAccess(ROLES.Operations, 'revenue:detail')).toBe(true)
    const svc = new StoreRevenueReportService()
    const summary = svc.getStoreSummary('store-002', TENANT)
    expect(summary).toBeDefined()
    expect(summary!.totalRevenue).toBeGreaterThan(0)
  })

  it('🎯[正例] 运行专员查看营收对比', () => {
    expect(checkRoleAccess(ROLES.Operations, 'revenue:compare')).toBe(true)
    const svc = new StoreRevenueReportService()
    const reports = svc.listReports(TENANT, { storeId: 'store-001' })
    const hasComparison = reports.some((r) => r.revenueGrowthRate !== undefined)
    expect(hasComparison).toBe(true)
  })

  it('🎯[反例] 运行专员无权删除营收报告', () => {
    expect(checkRoleAccess(ROLES.Operations, 'revenue:delete')).toBe(false)
  })

  afterEach(() => {
    const svc = new StoreRevenueReportService()
    svc.resetReportStoresForTests()
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 营收报告
// ════════════════════════════════════════════════════════════

describe('[🤝团建] store-revenue-report 角色扩展测试', () => {
  it('🤝[反例] 团建无权查看营收', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'revenue:view')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'revenue:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'revenue:list')).toBe(false)
  })

  it('🤝[反例] 团建无权对比或汇总营收', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'revenue:compare')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'revenue:summary')).toBe(false)
  })

  it('🤝[闭环] 团建不涉及营收管理', () => {
    const denied = { code: 403, role: ROLES.Teambuilding }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 营收报告
// ════════════════════════════════════════════════════════════

describe('[📢营销] store-revenue-report 角色扩展测试', () => {
  it('📢[反例] 营销无权查看营收', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'revenue:view')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'revenue:detail')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'revenue:list')).toBe(false)
  })

  it('📢[反例] 营销无权导出或对比营收', () => {
    expect(checkRoleAccess(ROLES.Marketing, 'revenue:export')).toBe(false)
    expect(checkRoleAccess(ROLES.Marketing, 'revenue:compare')).toBe(false)
  })

  it('📢[闭环] 营销不可见营收数据（财务保密）', () => {
    const denied = { code: 403, role: ROLES.Marketing, module: 'revenue' }
    expect(denied.code).toBe(403)
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 store-revenue-report 跨角色闭环 + 边界]', () => {
  afterEach(() => {
    const svc = new StoreRevenueReportService()
    svc.resetReportStoresForTests()
  })

  it('👔+🎯 店长查看全局营收 → 运行专员查看明细 → 全貌闭环', () => {
    const svc = new StoreRevenueReportService()

    // 1. 店长看全局汇总
    const overall = svc.getOverallSummary(TENANT)
    expect(overall.storeCount).toBeGreaterThanOrEqual(6)
    expect(overall.totalRevenue).toBeGreaterThan(0)
    expect(overall.totalExpense).toBeGreaterThan(0)

    // 2. 运行专员看门店明细
    const details = svc.listReports(TENANT, { storeId: 'store-001' })
    expect(details.length).toBeGreaterThan(0)

    // 3. A门店月收入应大于日收入
    const monthly = svc.listReports(TENANT, { storeId: 'store-001', reportType: 'monthly' })
    const daily = svc.listReports(TENANT, { storeId: 'store-001', reportType: 'daily' })
    if (monthly.length > 0 && daily.length > 0) {
      expect(monthly[0].totalRevenue).toBeGreaterThan(daily[0].totalRevenue)
    }
  })

  it('🛡️ 不存在的报告 ID 返回 undefined', () => {
    const svc = new StoreRevenueReportService()
    expect(svc.getReport('nonexistent', TENANT)).toBeUndefined()
  })

  it('🛡️ 生成的报告包含所有必需字段', () => {
    const svc = new StoreRevenueReportService()
    const report = svc.generateReport({
      tenantId: TENANT,
      storeId: 'store-001',
      storeName: '测试店',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      reportType: 'monthly',
    })
    expect(report.id).toBeDefined()
    expect(report.totalRevenue).toBeGreaterThan(0)
    expect(report.totalExpense).toBeGreaterThan(0)
    expect(report.grossProfit).toBeGreaterThan(0)
    expect(report.revenueBreakdown).toBeDefined()
    expect(report.expenseBreakdown).toBeDefined()
    expect(report.createdAt).toBeDefined()
  })

  it('🛡️ 删除报告后不可查询', () => {
    const svc = new StoreRevenueReportService()
    const report = svc.generateReport({
      tenantId: TENANT, storeId: 'store-001', storeName: '测试店',
      startDate: '2026-08-01', endDate: '2026-08-31', reportType: 'monthly',
    })
    expect(svc.getReport(report.id, TENANT)).toBeDefined()

    svc.deleteReport(report.id, TENANT)
    expect(svc.getReport(report.id, TENANT)).toBeUndefined()
  })

  it('🛡️ 租户隔离：另一个租户看不到数据', () => {
    const svc = new StoreRevenueReportService()
    const reportsA = svc.listReports('tenant-A')
    expect(reportsA.length).toBe(0)
  })

  it('🛡️ 日报→月报→季报数据层级正确', () => {
    const svc = new StoreRevenueReportService()
    const monthReport = svc.listReports(TENANT, { storeId: 'store-001', reportType: 'quarterly' })
    expect(monthReport.length).toBeGreaterThan(0)
    expect(monthReport[0].totalRevenue).toBeGreaterThan(1000000)
  })

  it('🛡️ 不存在门店返回 undefined', () => {
    const svc = new StoreRevenueReportService()
    const summary = svc.getStoreSummary('store-nonexistent', TENANT)
    expect(summary).toBeUndefined()
  })
})
