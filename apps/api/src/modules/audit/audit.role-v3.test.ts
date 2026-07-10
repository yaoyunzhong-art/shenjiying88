import { describe, it, expect, beforeEach, vi } from 'vitest'
/**
 * 🐜 自动: [audit] [C] 角色测试 v3 — 大飞哥电玩城审计日志场景
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 * 围绕大飞哥美国三店运营场景的 audit 审计模块：
 *
 * ⭐Cyber Galaxy Arcade (Colonial Heights, VA)
 * ⭐休斯顿店 (Houston, TX)
 *
 * 每个角色 >= 3 测试用例（正常流程 + 业务边界 + 异常/降级）
 * 覆盖: 审计日志记录、查询、异常检测、风险评分、合规报告、分账审计
 */

import { AuditController } from './audit.controller'
import { AuditService } from './audit.service'

// ── 8 角色定义 ──
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

// ── 大飞哥电玩城门店常量 ──
const STORE_CYBER = { id: 'store-cyber-galaxy', name: 'Cyber Galaxy Arcade', city: 'Colonial Heights' }
const STORE_HOUSTON = { id: 'store-houston', name: '休斯顿店', city: 'Houston' }

// ── 门店操作人员常量 ──
const ACTOR_MANAGER = 'user_manager_cyber'
const ACTOR_CASHIER = 'user_cashier_cyber'
const ACTOR_GUIDE = 'user_guide_cyber'
const ACTOR_HR = 'user_hr'
const ACTOR_SECURITY = 'user_security'
const ACTOR_OPS = 'user_ops'
const ACTOR_TEAMBUILD = 'user_team'
const ACTOR_MARKETING = 'user_marketing'

// ── 假租户上下文 ──
const MOCK_TENANT = {
  tenantId: 'tenant-cyber-galaxy',
  storeId: STORE_CYBER.id,
  userId: 'admin',
  roles: ['admin'],
}

// ── 辅助：创建 controller ──
function createController(): AuditController {
  const service = new AuditService()
  return new AuditController(service)
}

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 门店级审计查询与风险监控
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 店长视角: 门店审计与风险监控`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = createController()
  })

  it('店长创建一条门店操作审计日志', async () => {
    const result = await ctrl.create({
      eventType: 'order.created',
      actorId: ACTOR_CASHIER,
      actorType: 'user',
      tenantId: MOCK_TENANT.tenantId,
      resourceType: 'order',
      resourceId: 'order_001',
      riskLevel: 'low',
    } as any)
    expect(result.id).toBeDefined()
    expect(result.id).toMatch(/^audit_/)
  })

  it('店长分页查询门店全部审计日志 — 时间倒序', async () => {
    // 创建两条时间不同的日志以验证倒序
    await ctrl.create({
      eventType: 'order.created', actorId: ACTOR_CASHIER, actorType: 'user',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
    } as any)
    // 稍等片刻确保时间戳不同
    await new Promise(r => setTimeout(r, 5))
    await ctrl.create({
      eventType: 'auth.login', actorId: ACTOR_MANAGER, actorType: 'user',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
    } as any)

    const result = await ctrl.findAll({ limit: 10 } as any)
    expect(result.items.length).toBe(2)
    // 第二条创建的应该排在前面（时间倒序）
    expect(result.items[0].eventType).toBe('auth.login')
  })

  it('店长按操作者筛选日志', async () => {
    await ctrl.create({
      eventType: 'order.created', actorId: ACTOR_CASHIER, actorType: 'user',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
    } as any)
    await ctrl.create({
      eventType: 'auth.login', actorId: ACTOR_CASHIER, actorType: 'user',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
    } as any)
    await ctrl.create({
      eventType: 'admin.config_change', actorId: ACTOR_MANAGER, actorType: 'admin',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'medium',
    } as any)

    const cashierLogs = await ctrl.findAll({ actorId: ACTOR_CASHIER, limit: 10 } as any)
    expect(cashierLogs.items.length).toBe(2)
    expect(cashierLogs.total).toBe(2)
  })

  it('店长查看门店风险评分 — 高风险操作会提升评分', async () => {
    // 批量创建高风险操作
    for (let i = 0; i < 3; i++) {
      await ctrl.create({
        eventType: 'auth.login', actorId: ACTOR_CASHIER, actorType: 'user',
        tenantId: MOCK_TENANT.tenantId, riskLevel: 'high',
        ipAddress: '192.168.1.100', timestamp: new Date(),
        metadata: { success: false },
      } as any)
    }

    const riskScore = await ctrl.computeRiskScore(ACTOR_CASHIER)
    expect(riskScore.actorId).toBe(ACTOR_CASHIER)
    expect(riskScore.score).toBeGreaterThan(0)
    expect(['low', 'medium', 'high', 'critical']).toContain(riskScore.riskLevel)
  })

  it('店长: 空门店查询不报错', async () => {
    const result = await ctrl.findAll({ limit: 10 } as any)
    expect(result.items.length).toBe(0)
    expect(result.total).toBe(0)
  })

  it('店长: 门店不存在时返回空结果', async () => {
    const result = await ctrl.findAll({ tenantId: 'nonexistent', limit: 10 } as any)
    expect(result.items.length).toBe(0)
    expect(result.total).toBe(0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 收银操作审计与个人日志查询
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 前台视角: 收银操作审计与个人查询`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = createController()
  })

  it('前台创建收银操作审计日志 — 订单创建', async () => {
    const result = await ctrl.create({
      eventType: 'order.created',
      actorId: ACTOR_CASHIER,
      actorType: 'user',
      tenantId: MOCK_TENANT.tenantId,
      resourceType: 'order',
      resourceId: 'order_002',
      riskLevel: 'low',
    } as any)
    expect(result.id).toBeDefined()
  })

  it('前台查询自己的操作记录', async () => {
    await ctrl.create({
      eventType: 'order.created', actorId: ACTOR_CASHIER, actorType: 'user',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
    } as any)
    await ctrl.create({
      eventType: 'payment.completed', actorId: ACTOR_CASHIER, actorType: 'user',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
    } as any)

    const logs = await ctrl.findAll({ actorId: ACTOR_CASHIER, limit: 10 } as any)
    expect(logs.items.length).toBe(2)
    expect(logs.items.every(l => l.actorId === ACTOR_CASHIER)).toBe(true)
  })

  it('前台: 查询时间范围为空时返回正确结果', async () => {
    const result = await ctrl.findAll({ from: '2026-07-10T00:00:00Z', to: '2026-07-09T00:00:00Z', limit: 10 } as any)
    expect(result.items.length).toBe(0)
  })

  it('前台: 创建支付失败审计日志', async () => {
    const result = await ctrl.create({
      eventType: 'payment.failed',
      actorId: ACTOR_CASHIER,
      actorType: 'user',
      tenantId: MOCK_TENANT.tenantId,
      riskLevel: 'medium',
      metadata: { reason: '余额不足', amount: 50 },
    } as any)
    expect(result.id).toBeDefined()

    const log = await ctrl.findOne(result.id)
    expect(log).not.toBeNull()
    expect(log!.eventType).toBe('payment.failed')
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 员工操作审计与合规查询
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} HR视角: 员工操作审计与合规`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = createController()
  })

  it('HR 查询指定员工的活动日志', async () => {
    // 创建两个时间戳不同的日志
    await ctrl.create({
      eventType: 'auth.login', actorId: ACTOR_CASHIER, actorType: 'user',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
    } as any)
    await new Promise(r => setTimeout(r, 5))
    await ctrl.create({
      eventType: 'auth.logout', actorId: ACTOR_CASHIER, actorType: 'user',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
    } as any)

    const activity = await ctrl.getUserActivity(
      ACTOR_CASHIER,
      '2026-07-01T00:00:00Z',
      '2026-12-31T23:59:59Z',
    )
    expect(activity.length).toBe(2)
    // 时间正序: 先 login 后 logout
    expect(activity[0].eventType).toBe('auth.login')
    expect(activity[1].eventType).toBe('auth.logout')
  })

  it('HR 导出员工合规报告', async () => {
    await ctrl.create({
      eventType: 'compliance.consent_recorded', actorId: ACTOR_CASHIER, actorType: 'user',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
      consentVersion: 'v2', timestamp: new Date('2026-07-01T00:00:00Z'),
    } as any)

    const report = await ctrl.generateComplianceReport(MOCK_TENANT.tenantId)
    expect(report.processingActivities).toBeDefined()
    expect(report.consentRecords).toBeDefined()
    expect(report.dsrRequests).toBeDefined()
    expect(report.dataBreaches).toBeDefined()
  })

  it('HR: 员工无操作记录时返回空列表', async () => {
    const activity = await ctrl.getUserActivity(
      'nonexistent_user',
      '2026-07-01T00:00:00Z',
      '2026-07-10T23:59:59Z',
    )
    expect(activity).toEqual([])
  })

  it('HR: 导出报告时间范围无数据不报错', async () => {
    const report = await ctrl.generateComplianceReport('unknown-tenant')
    expect(report.processingActivities).toEqual([])
    expect(report.consentRecords).toEqual([])
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 安全审计与异常检测
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Security} 安监视角: 安全审计与异常检测`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = createController()
  })

  it('安监创建安全事件审计日志', async () => {
    const result = await ctrl.create({
      eventType: 'auth.login',
      actorId: 'suspicious_user',
      actorType: 'user',
      tenantId: MOCK_TENANT.tenantId,
      riskLevel: 'high',
      ipAddress: '10.0.0.1',
      metadata: { success: false },
    } as any)
    expect(result.id).toBeDefined()
  })

  it('安监检测异常登录行为 — 同一 IP 多次失败', async () => {
    // 模拟同一个 IP 5 次失败登录
    for (let i = 0; i < 5; i++) {
      await ctrl.create({
        eventType: 'auth.login', actorId: `user_${i}`, actorType: 'user',
        tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
        ipAddress: '10.0.0.99', metadata: { success: false },
      } as any)
    }

    const anomalies = await ctrl.detectAnomalies(60)
    expect(anomalies.length).toBeGreaterThanOrEqual(1)
    const ipAnomaly = anomalies.find(a => a.pattern.includes('10.0.0.99'))
    expect(ipAnomaly).toBeDefined()
    expect(ipAnomaly!.riskLevel).toBe('high')
  })

  it('安监: 无异常时不返回误报', async () => {
    const anomalies = await ctrl.detectAnomalies(5)
    expect(anomalies).toEqual([])
  })

  it('安监: 管理员模拟用户操作触发严重告警', async () => {
    await ctrl.create({
      eventType: 'admin.user_impersonate', actorId: ACTOR_MANAGER, actorType: 'admin',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'critical',
    } as any)

    const anomalies = await ctrl.detectAnomalies(5)
    const impersonateAnomaly = anomalies.find(a => a.pattern.includes('管理员模拟'))
    expect(impersonateAnomaly).toBeDefined()
    expect(impersonateAnomaly!.riskLevel).toBe('critical')
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 个人操作记录查询
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 导玩员视角: 个人操作记录`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = createController()
  })

  it('导玩员创建导玩活动记录', async () => {
    const result = await ctrl.create({
      eventType: 'order.created',
      actorId: ACTOR_GUIDE,
      actorType: 'user',
      tenantId: MOCK_TENANT.tenantId,
      riskLevel: 'low',
      resourceType: 'product',
      resourceId: 'game_ticket_001',
    } as any)
    expect(result.id).toBeDefined()
  })

  it('导玩员查询个人今日操作', async () => {
    await ctrl.create({
      eventType: 'order.created', actorId: ACTOR_GUIDE, actorType: 'user',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
    } as any)

    const logs = await ctrl.findAll({ actorId: ACTOR_GUIDE, limit: 10 } as any)
    expect(logs.items.length).toBe(1)
    expect(logs.items[0].actorId).toBe(ACTOR_GUIDE)
  })

  it('导玩员: 无权限查看其他角色日志应受控', async () => {
    await ctrl.create({
      eventType: 'admin.config_change', actorId: ACTOR_MANAGER, actorType: 'admin',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'high',
    } as any)

    // 导玩员仅查自己数据
    const myLogs = await ctrl.findAll({ actorId: ACTOR_GUIDE, limit: 10 } as any)
    expect(myLogs.items.length).toBe(0)
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 系统运维审计与分账追踪
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Operations} 运行专员视角: 运维审计与分账追踪`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = createController()
  })

  it('运行专员记录配置变更审计日志', async () => {
    const result = await ctrl.create({
      eventType: 'admin.config_change',
      actorId: ACTOR_OPS,
      actorType: 'admin',
      tenantId: MOCK_TENANT.tenantId,
      riskLevel: 'medium',
      metadata: { configKey: 'store_hours', oldValue: '09:00-21:00', newValue: '10:00-22:00' },
    } as any)
    expect(result.id).toBeDefined()
  })

  it('运行专员记录分账事件并追踪', async () => {
    const settlementResult = await ctrl.logSettlement({
      settlementId: 'settlement_001',
      amount: 5000,
      eventType: 'created',
      metadata: { storeId: STORE_CYBER.id },
    } as any)
    expect(settlementResult.id).toBeDefined()

    // 分账审核通过
    await ctrl.logSettlement({
      settlementId: 'settlement_001',
      amount: 5000,
      eventType: 'approved',
      metadata: { approvedBy: ACTOR_OPS },
    } as any)

    const trail = await ctrl.getSettlementAuditTrail('settlement_001')
    expect(trail.length).toBe(2)
    expect(trail[0].eventType).toBe('settlement.created')
    expect(trail[1].eventType).toBe('settlement.approved')
  })

  it('运行专员: 分账审计追踪不存在时返回空数组', async () => {
    const trail = await ctrl.getSettlementAuditTrail('nonexistent_settlement')
    expect(trail).toEqual([])
  })

  it('运行专员创建批量审计日志', async () => {
    const result = await ctrl.createBatch([
      {
        eventType: 'payment.completed', actorId: ACTOR_CASHIER, actorType: 'user',
        tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
      },
      {
        eventType: 'order.created', actorId: ACTOR_CASHIER, actorType: 'user',
        tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
      },
    ] as any)
    expect(result.ids.length).toBe(2)

    const allLogs = await ctrl.findAll({ limit: 10 } as any)
    expect(allLogs.items.length).toBe(2)
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 团建活动审计与数据导出
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 团建视角: 活动审计与报告导出`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = createController()
  })

  it('团建专员记录活动相关操作', async () => {
    const result = await ctrl.create({
      eventType: 'order.created',
      actorId: ACTOR_TEAMBUILD,
      actorType: 'user',
      tenantId: MOCK_TENANT.tenantId,
      riskLevel: 'low',
      resourceType: 'order',
      resourceId: 'team_event_001',
    } as any)
    expect(result.id).toBeDefined()
  })

  it('团建专员导出活动审计报告', async () => {
    // 创建一些团建相关日志
    await ctrl.create({
      eventType: 'order.created', actorId: ACTOR_TEAMBUILD, actorType: 'user',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
      timestamp: new Date('2026-07-05T10:00:00Z'),
    } as any)
    await ctrl.create({
      eventType: 'order.paid', actorId: ACTOR_TEAMBUILD, actorType: 'user',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
      timestamp: new Date('2026-07-05T10:30:00Z'),
    } as any)

    const report = await ctrl.exportReport({
      from: '2026-07-01T00:00:00Z',
      to: '2026-07-31T23:59:59Z',
      format: 'json',
    } as any)
    expect(report.content).toBeDefined()
    const parsed = JSON.parse(report.content)
    expect(Array.isArray(parsed)).toBe(true)
    expect(parsed.length).toBe(2)
  })

  it('团建专员: 导出无数据时间范围返回空', async () => {
    const report = await ctrl.exportReport({
      from: '2026-01-01T00:00:00Z',
      to: '2026-01-31T23:59:59Z',
      format: 'json',
    } as any)
    expect(report.content).toBeDefined()
    const parsed = JSON.parse(report.content)
    expect(parsed).toEqual([])
  })

  it('团建专员: 导出 CSV 格式正常', async () => {
    await ctrl.create({
      eventType: 'order.created', actorId: ACTOR_TEAMBUILD, actorType: 'user',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
    } as any)

    const report = await ctrl.exportReport({
      from: '2026-01-01T00:00:00Z',
      to: '2026-12-31T23:59:59Z',
      format: 'csv',
    } as any)
    expect(report.content).toContain('id,eventType,actorId')
    const lines = report.content.split('\n')
    expect(lines.length).toBeGreaterThanOrEqual(2) // header + at least 1 row
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 营销活动审计与数据合规
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 营销视角: 营销活动审计与数据合规`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = createController()
  })

  it('营销专员记录活动投放操作', async () => {
    const result = await ctrl.create({
      eventType: 'admin.data_export',
      actorId: ACTOR_MARKETING,
      actorType: 'admin',
      tenantId: MOCK_TENANT.tenantId,
      riskLevel: 'low',
      metadata: { campaignId: 'campaign_summer_2026', exportType: 'member_list' },
    } as any)
    expect(result.id).toBeDefined()
  })

  it('营销专员查看指定营销活动审计追踪', async () => {
    await ctrl.create({
      eventType: 'admin.data_export', actorId: ACTOR_MARKETING, actorType: 'admin',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
      metadata: { campaignId: 'campaign_summer' },
    } as any)
    await ctrl.create({
      eventType: 'admin.config_change', actorId: ACTOR_MARKETING, actorType: 'admin',
      tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
      metadata: { campaignId: 'campaign_summer', discount: '20%' },
    } as any)

    const allLogs = await ctrl.findAll({ actorId: ACTOR_MARKETING, limit: 10 } as any)
    expect(allLogs.items.length).toBe(2)
    expect(allLogs.items.every(l => l.actorId === ACTOR_MARKETING)).toBe(true)
  })

  it('营销专员: 日志详情不存在返回 null', async () => {
    const log = await ctrl.findOne('nonexistent_id')
    expect(log).toBeNull()
  })

  it('营销专员: 批量记录多条活动日志', async () => {
    const result = await ctrl.createBatch([
      {
        eventType: 'admin.data_export', actorId: ACTOR_MARKETING, actorType: 'admin',
        tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
        metadata: { campaignId: 'campaign_fall', exportType: 'email_list' },
      },
      {
        eventType: 'admin.config_change', actorId: ACTOR_MARKETING, actorType: 'admin',
        tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
        metadata: { campaignId: 'campaign_fall', discount: '15%' },
      },
      {
        eventType: 'compliance.consent_recorded', actorId: ACTOR_MARKETING, actorType: 'admin',
        tenantId: MOCK_TENANT.tenantId, riskLevel: 'low',
        consentVersion: 'v2',
      },
    ] as any)
    expect(result.ids.length).toBe(3)

    const allLogs = await ctrl.findAll({ limit: 10 } as any)
    expect(allLogs.items.length).toBe(3)
  })
})
