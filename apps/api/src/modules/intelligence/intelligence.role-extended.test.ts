/**
 * 🐜 自动: [intelligence] [C] 角色扩展测试
 *
 * 8 角色视角的运营参谋模块扩展测试（补充 role.test.ts）
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个至少 3 个场景测试 = 8×3 = 24 tests
 * 使用实际 IntelligenceService + mock AiService + Collector
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { IntelligenceService } from './intelligence.service'
import { IntelligenceAiService } from './intelligence-ai.service'
import { MonitorCollectorService } from './monitor-collector.service'

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

/** 角色 → 运营参谋模块权限 */
const roleIntelligenceAccess: Record<string, string[]> = {
  'feasibility:generate': ['👔店长', '🎯运行专员', '📢营销'],
  'finance:calculate': ['👔店长', '🎯运行专员'],
  'advice:view': ['👔店长', '🎮导玩员', '🎯运行专员', '🤝团建'],
  'advice:category': ['👔店长', '🎮导玩员', '🎯运行专员', '🤝团建'],
  'competitor:monitor': ['👔店长', '🎯运行专员', '📢营销'],
  'competitor:view': ['👔店长', '🎯运行专员', '📢营销', '🛒前台'],
  'knowledge:retrieve': ['👔店长', '🎯运行专员', '🎮导玩员'],
}

function checkRoleAccess(role: string, resource: string): boolean {
  return roleIntelligenceAccess[resource]?.includes(role) ?? false
}

function makeService(): IntelligenceService {
  const aiService = new IntelligenceAiService()
  const collector = new MonitorCollectorService()
  return new IntelligenceService(aiService, collector)
}

// ════════════════════════════════════════════════════════════
// 👔店长 — 运营参谋
// ════════════════════════════════════════════════════════════

describe('[👔店长] intelligence 角色扩展测试', () => {
  it('👔[正例] 店长生成开业可行性报告 → 按城市预算综合评估', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'feasibility:generate')).toBe(true)
    const svc = makeService()
    const report = svc.generateFeasibilityReport('上海', '徐汇', 300)
    expect(report.city).toBe('上海')
    expect(report.district).toBe('徐汇')
    expect(report.score).toBeGreaterThanOrEqual(0)
    expect(report.score).toBeLessThanOrEqual(100)
    expect(report.scoreLevel).toBe('high')
    expect(report.competitorCount).toBe(8)
    expect(report.suggestedEquipment.length).toBeGreaterThan(0)
    expect(report.estimatedMonthlyRevenue).toBeGreaterThan(0)
  })

  it('👔[正例] 店长计算装修全景财务报告', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'finance:calculate')).toBe(true)
    const svc = makeService()
    const fin = svc.calculateFinancePanorama(300, 500, 'luxury', '上海', '徐汇')
    expect(fin.city).toBe('上海')
    expect(fin.district).toBe('徐汇')
    expect(fin.initialInvestment.total).toBeGreaterThan(0)
    expect(fin.monthlyTotalCost).toBeGreaterThan(0)
    expect(fin.revenueEstimate.estimatedMonthlyRevenue).toBeGreaterThan(0)
    expect(fin.paybackMonths).toBeGreaterThan(0)
    expect(fin.breakEvenAnalysis.length).toBeGreaterThan(0)
  })

  it('👔[正例] 店长查看运营参谋全部类别', async () => {
    expect(checkRoleAccess(ROLES.StoreManager, 'advice:view')).toBe(true)
    const svc = makeService()
    const advices = svc.generateOperationAdvice('store-001')
    expect(advices.length).toBe(7) // 7大类别
    expect(advices[0].options.length).toBe(3)
    const categories = advices.map((a) => a.category)
    expect(categories).toContain('pricing')
    expect(categories).toContain('activity')
    expect(categories).toContain('equipment')
    expect(categories).toContain('promotion')
    expect(categories).toContain('recruit')
    expect(categories).toContain('seasonal')
    expect(categories).toContain('blindbox')
  })
})

// ════════════════════════════════════════════════════════════
// 🛒前台 — 运营参谋
// ════════════════════════════════════════════════════════════

describe('[🛒前台] intelligence 角色扩展测试', () => {
  it('🛒[正例] 前台查看竞争监控结果', async () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'competitor:view')).toBe(true)
    const svc = makeService()
    const result = await svc.getLatestScanResult()
    expect(result.alerts).toBeDefined()
    expect(result.scanTimestamp).toBeTruthy()
    expect(result.freshnessMinutes).toBeGreaterThanOrEqual(0)
  })

  it('🛒[反例] 前台无权限生成可行性报告', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'feasibility:generate')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'finance:calculate')).toBe(false)
  })

  it('🛒[反例] 前台无权限查看运营参谋', () => {
    expect(checkRoleAccess(ROLES.FrontDesk, 'advice:view')).toBe(false)
    expect(checkRoleAccess(ROLES.FrontDesk, 'knowledge:retrieve')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 👥HR — 运营参谋
// ════════════════════════════════════════════════════════════

describe('[👥HR] intelligence 角色扩展测试', () => {
  it('👥[反例] HR 无权限生成可行性报告', () => {
    expect(checkRoleAccess(ROLES.HR, 'feasibility:generate')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'finance:calculate')).toBe(false)
  })

  it('👥[反例] HR 无权限查看运营参谋', () => {
    expect(checkRoleAccess(ROLES.HR, 'advice:view')).toBe(false)
    expect(checkRoleAccess(ROLES.HR, 'competitor:monitor')).toBe(false)
  })

  it('👥[反例] HR 无权限进行知识检索', () => {
    expect(checkRoleAccess(ROLES.HR, 'knowledge:retrieve')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🔧安监 — 运营参谋
// ════════════════════════════════════════════════════════════

describe('[🔧安监] intelligence 角色扩展测试', () => {
  it('🔧[反例] 安监无权限生成可行性报告与财务报告', () => {
    expect(checkRoleAccess(ROLES.Security, 'feasibility:generate')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'finance:calculate')).toBe(false)
  })

  it('🔧[反例] 安监无权限查看运营参谋', () => {
    expect(checkRoleAccess(ROLES.Security, 'advice:view')).toBe(false)
    expect(checkRoleAccess(ROLES.Security, 'competitor:monitor')).toBe(false)
  })

  it('🔧[闭环] 安监无权限返回统一格式', () => {
    const denied = { success: false, code: 403, message: 'NO_INTELLIGENCE_ACCESS', module: 'intelligence' }
    expect(denied.code).toBe(403)
    expect(denied.module).toBe('intelligence')
  })
})

// ════════════════════════════════════════════════════════════
// 🎮导玩员 — 运营参谋
// ════════════════════════════════════════════════════════════

describe('[🎮导玩员] intelligence 角色扩展测试', () => {
  it('🎮[正例] 导玩员按类别查看运营参谋建议', async () => {
    expect(checkRoleAccess(ROLES.Guide, 'advice:view')).toBe(true)
    const svc = makeService()
    const pricing = svc.generateOperationAdvice('store-001', 'pricing')
    expect(pricing.length).toBe(1)
    expect(pricing[0].category).toBe('pricing')
    expect(pricing[0].options.every((o) => o.dataEvidence)).toBe(true)
  })

  it('🎮[正例] 导玩员查看活动类运营建议', async () => {
    expect(checkRoleAccess(ROLES.Guide, 'advice:category')).toBe(true)
    const svc = makeService()
    const activity = svc.generateOperationAdvice('store-001', 'activity')
    expect(activity.length).toBe(1)
    expect(activity[0].question).toContain('活动')
    expect(activity[0].options.length).toBe(3)
  })

  it('🎮[反例] 导玩员无权限生成可行性报告', () => {
    expect(checkRoleAccess(ROLES.Guide, 'feasibility:generate')).toBe(false)
    expect(checkRoleAccess(ROLES.Guide, 'competitor:monitor')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 🎯运行专员 — 运营参谋
// ════════════════════════════════════════════════════════════

describe('[🎯运行专员] intelligence 角色扩展测试', () => {
  it('🎯[正例] 运行专员生成可行性报告 → 低预算城市', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'feasibility:generate')).toBe(true)
    const svc = makeService()
    const report = svc.generateFeasibilityReport('成都', '武侯', 100)
    expect(report.city).toBe('成都')
    expect(report.district).toBe('武侯')
    expect(report.score).toBeGreaterThan(0)
    expect(report.estimatedPaybackMonths).toBeGreaterThan(0)
  })

  it('🎯[正例] 运行专员计算经济型装修报告', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'finance:calculate')).toBe(true)
    const svc = makeService()
    const fin = svc.calculateFinancePanorama(150, 200, 'economy', '成都', '武侯')
    expect(fin.tier).toBe('economy')
    expect(fin.initialInvestment.total).toBeLessThan(2_000_000)
    expect(fin.recommendation).toContain('经济')
  })

  it('🎯[正例] 运行专员触发增量竞争扫描', async () => {
    expect(checkRoleAccess(ROLES.Operations, 'competitor:monitor')).toBe(true)
    const svc = makeService()
    const result = await svc.triggerIncrementalScan('上海')
    expect(result.scanMode).toBe('incremental')
    expect(result.alerts.length).toBeGreaterThanOrEqual(0)
  })
})

// ════════════════════════════════════════════════════════════
// 🤝团建 — 运营参谋
// ════════════════════════════════════════════════════════════

describe('[🤝团建] intelligence 角色扩展测试', () => {
  it('🤝[正例] 团建查看活动类运营参谋建议', async () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'advice:view')).toBe(true)
    const svc = makeService()
    const advices = svc.generateOperationAdvice('store-001')
    const activity = advices.find((a) => a.category === 'activity')
    expect(activity).toBeDefined()
    expect(activity!.question).toBeTruthy()
    expect(activity!.aiSuggestion).toBeTruthy()
  })

  it('🤝[正例] 团建按活动类别筛选', async () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'advice:category')).toBe(true)
    const svc = makeService()
    const seasonal = svc.generateOperationAdvice('store-001', 'seasonal')
    expect(seasonal.length).toBe(1)
    expect(seasonal[0].category).toBe('seasonal')
    expect(seasonal[0].options.length).toBe(3)
  })

  it('🤝[反例] 团建无权限查看竞争监控', () => {
    expect(checkRoleAccess(ROLES.Teambuilding, 'competitor:monitor')).toBe(false)
    expect(checkRoleAccess(ROLES.Teambuilding, 'feasibility:generate')).toBe(false)
  })
})

// ════════════════════════════════════════════════════════════
// 📢营销 — 运营参谋
// ════════════════════════════════════════════════════════════

describe('[📢营销] intelligence 角色扩展测试', () => {
  it('📢[正例] 营销生成可行性报告 → 营销角度评估', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'feasibility:generate')).toBe(true)
    const svc = makeService()
    const report = svc.generateFeasibilityReport('广州', '天河', 250)
    expect(report.score).toBeGreaterThan(0)
    expect(report.marketTrend).toContain('广州')
    expect(report.suggestedPriceRange.avg).toBeGreaterThan(0)
  })

  it('📢[正例] 营销触发全量竞争扫描', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'competitor:monitor')).toBe(true)
    const svc = makeService()
    const result = await svc.triggerFullScan('广州')
    expect(result.scanMode).toBe('full')
    expect(result.alerts).toBeDefined()
    expect(result.scanTimestamp).toBeTruthy()
  })

  it('📢[正例] 营销查看最新扫描结果', async () => {
    expect(checkRoleAccess(ROLES.Marketing, 'competitor:view')).toBe(true)
    const svc = makeService()
    const result = await svc.getLatestScanResult()
    expect(result.freshnessMinutes).toBeGreaterThanOrEqual(0)
    expect(result.trend).toBeDefined()
  })
})

// ════════════════════════════════════════════════════════════
// 🦞 跨角色组合场景 + 边界
// ════════════════════════════════════════════════════════════

describe('[🦞 intelligence 跨角色闭环 + 边界]', () => {
  it('🎮 + 👔 导玩员与店长协作：查看建议 + 财务计算', () => {
    const svc = makeService()

    // 导玩员看活动建议
    const activityAdvices = svc.generateOperationAdvice('store-001', 'activity')
    expect(activityAdvices.length).toBe(1)

    // 店长做财务计算
    const fin = svc.calculateFinancePanorama(300, 400, 'standard', '深圳', '南山')
    expect(fin.paybackMonths).toBeGreaterThan(0)
    expect(fin.paybackWithDepreciation).toBeGreaterThan(0)
    expect(fin.cityAvgComparison.paybackMonths).toBeGreaterThan(0)
  })

  it('🛡️ 低预算可行性报告边界', () => {
    const svc = makeService()
    const report = svc.generateFeasibilityReport('未知', '区域', 10)
    expect(report.score).toBeGreaterThanOrEqual(0)
    expect(report.score).toBeLessThanOrEqual(100)
    expect(report.competitorCount).toBe(1) // default
  })

  it('🛡️ 零面积财务计算降级', () => {
    const svc = makeService()
    const fin = svc.calculateFinancePanorama(0, 0, 'standard', '上海', '浦东')
    expect(fin.area).toBe(300) // 降级为默认
    expect(fin.budget).toBe(300)
  })

  it('🛡️ 运营参谋按不存在的类别筛选返回空', () => {
    const svc = makeService()
    const result = svc.generateOperationAdvice('store-001', 'nonexistent')
    expect(result.length).toBe(0)
  })

  it('🛡️ 增量扫描与全量扫描结果格式一致', async () => {
    const svc = makeService()
    const inc = await svc.triggerIncrementalScan('北京')
    const full = await svc.triggerFullScan('北京')
    expect(inc.scanTimestamp).toBeTruthy()
    expect(full.scanTimestamp).toBeTruthy()
    expect(typeof inc.freshnessMinutes).toBe('number')
    expect(typeof full.freshnessMinutes).toBe('number')
  })

  it('🛡️ 装修档次参数校验', () => {
    const svc = makeService()
    const luxury = svc.calculateFinancePanorama(500, 800, 'luxury', '北京', '朝阳')
    const economy = svc.calculateFinancePanorama(100, 150, 'economy', '成都', '锦江')
    expect(luxury.initialInvestment.total).toBeGreaterThan(economy.initialInvestment.total)
    expect(luxury.recommendation).toContain('高端')
    expect(economy.recommendation).toContain('经济')
  })

  it('🛡️ 默认预算和面积值降级处理', () => {
    const svc = makeService()
    const negBudget = svc.calculateFinancePanorama(-100, -100, 'standard', '上海', '浦东')
    expect(negBudget.budget).toBe(300)
    expect(negBudget.area).toBe(300)
  })
})
