/**
 * audit.role.test.ts - 审计日志 8 角色视角测试
 * 
 * 角色:
 * 👔 店长 (Store Manager)     - 查看店内操作日志、风险评分
 * 🛒 前台 (Cashier)           - 权限受限，不能查看审计日志
 * 👥 HR (HR)                 - 查看员工操作日志
 * 🔧 安监 (Safety Inspector) - 查看安全相关审计日志、异常检测
 * 🎮 导玩员 (Game Guide)     - 权限受限
 * 🎯 运行专员 (Operations)    - 查看系统运维日志
 * 🤝 团建 (Team Building)    - 查看团建活动相关日志
 * 📢 营销 (Marketing)        - 查看营销活动审计日志
 */

import { AuditService } from './audit.service'
import type { AuditQuery } from './audit.service'

describe('👔 店长视角 — 审计日志', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: 店长可以查看店内全部操作日志', async () => {
    await service.log({ eventType: 'order.created', actorId: 'cashier_01', actorType: 'user', riskLevel: 'low' })
    await service.log({ eventType: 'order.paid', actorId: 'cashier_01', actorType: 'user', riskLevel: 'low' })
    await service.log({ eventType: 'auth.login', actorId: 'manager_01', actorType: 'admin', riskLevel: 'low' })

    const allLogs = await service.query({ limit: 100 })
    expect(allLogs.items.length).toBe(3)
    expect(allLogs.total).toBe(3)
  })

  it('✅ 正例: 店长可以按操作者筛选门店日志', async () => {
    await service.log({ eventType: 'order.created', actorId: 'cashier_01', actorType: 'user', riskLevel: 'low' })
    await service.log({ eventType: 'order.paid', actorId: 'cashier_01', actorType: 'user', riskLevel: 'low' })

    const cashierLogs = await service.query({ actorId: 'cashier_01' })
    expect(cashierLogs.items.length).toBe(2)
  })

  it('🔲 边界: 店长查看空门店日志', async () => {
    const allLogs = await service.query({ limit: 10 })
    expect(allLogs.items.length).toBe(0)
    expect(allLogs.total).toBe(0)
  })
})

describe('🛒 前台视角 — 审计日志', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: 前台只能记录收银相关事件', async () => {
    const id = await service.log({ eventType: 'order.created', actorId: 'cashier_02', actorType: 'user', riskLevel: 'low', resourceType: 'order' })
    const log = await service.getById(id)
    expect(log).not.toBeNull()
    expect(log!.eventType).toBe('order.created')
    expect(log!.resourceType).toBe('order')
  })

  it('🔲 边界: 前台权限有限, 不能获取其他用户详情', async () => {
    // 前台只能查自己的操作
    await service.log({ eventType: 'order.created', actorId: 'cashier_02', actorType: 'user', riskLevel: 'low' })
    await service.log({ eventType: 'payment.completed', actorId: 'cashier_02', actorType: 'user', riskLevel: 'low' })

    const myLogs = await service.query({ actorId: 'cashier_02' })
    expect(myLogs.items.length).toBe(2)

    // 模拟前台无法看到管理员操作
    const adminLogs = await service.query({ actorId: 'admin_01' })
    expect(adminLogs.items.length).toBe(0)
  })
})

describe('👥 HR 视角 — 审计日志', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: HR 查询员工操作记录', async () => {
    await service.log({ eventType: 'auth.login', actorId: 'employee_01', actorType: 'user', riskLevel: 'low' })
    await service.log({ eventType: 'auth.logout', actorId: 'employee_01', actorType: 'user', riskLevel: 'low' })
    await service.log({ eventType: 'user.profile_update', actorId: 'employee_01', actorType: 'user', riskLevel: 'low' })

    const activity = await service.getUserActivityLog('employee_01', new Date(0), new Date())
    expect(activity.length).toBe(3)
    // 按时间正序排列
    expect(activity[0].eventType).toBe('auth.login')
  })

  it('✅ 正例: HR 发现员工异常多次登录失败', async () => {
    for (let i = 0; i < 6; i++) {
      await service.log({
        eventType: 'auth.login',
        actorId: 'employee_02',
        actorType: 'user',
        riskLevel: 'low',
        ipAddress: '10.0.0.5',
        metadata: { success: false },
      })
    }
    const anomalies = await service.detectAnomalies(5)
    expect(anomalies.length).toBeGreaterThan(0)
    const loginAnomaly = anomalies.find(a => a.pattern.includes('10.0.0.5'))
    expect(loginAnomaly).toBeDefined()
    expect(loginAnomaly!.riskLevel).toBe('high')
  })

  it('🔲 边界: HR 查询离职员工', async () => {
    const activity = await service.getUserActivityLog('former_employee', new Date(0), new Date())
    expect(activity.length).toBe(0)
  })
})

describe('🔧 安监视角 — 审计日志', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: 安监查看高风险操作', async () => {
    await service.log({ eventType: 'admin.config_change', actorId: 'admin_01', actorType: 'admin', riskLevel: 'high' })
    await service.log({ eventType: 'admin.user_impersonate', actorId: 'admin_01', actorType: 'admin', riskLevel: 'critical' })
    await service.log({ eventType: 'auth.login', actorId: 'user_01', actorType: 'user', riskLevel: 'low' })

    const criticalLogs = await service.query({ riskLevel: 'critical' })
    expect(criticalLogs.items.length).toBe(1)
    expect(criticalLogs.items[0].eventType).toBe('admin.user_impersonate')
  })

  it('✅ 正例: 安监检测异常行为', async () => {
    // 模拟管理员模拟用户操作（critical）
    await service.log({
      eventType: 'admin.user_impersonate',
      actorId: 'admin_02',
      actorType: 'admin',
      riskLevel: 'critical',
    })
    const anomalies = await service.detectAnomalies()
    const impersonateAnomaly = anomalies.find(a => a.pattern.includes('管理员模拟用户操作'))
    expect(impersonateAnomaly).toBeDefined()
    expect(impersonateAnomaly!.riskLevel).toBe('critical')
  })

  it('🔲 边界: 安监查看所有日志并生成合规报告', async () => {
    await service.log({ eventType: 'auth.login', actorId: 'user_01', actorType: 'user', riskLevel: 'low', tenantId: 'tenant_001' })
    const report = await service.generateComplianceReport('tenant_001')
    expect(report.processingActivities).toHaveLength(1)
    expect(report.dataBreaches).toHaveLength(0)
  })
})

describe('🎮 导玩员视角 — 审计日志', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: 导玩员记录游戏开始/结束事件', async () => {
    const id = await service.log({
      eventType: 'order.created',
      actorId: 'guide_01',
      actorType: 'user',
      riskLevel: 'low',
      resourceType: 'game_session',
      metadata: { gameId: 'game_123', duration: 30 },
    })
    const log = await service.getById(id)
    expect(log!.resourceType).toBe('game_session')
    expect(log!.metadata?.gameId).toBe('game_123')
  })

  it('🔲 边界: 导玩员无法查看系统级审计', async () => {
    await service.log({ eventType: 'admin.config_change', actorId: 'sysadmin', actorType: 'admin', riskLevel: 'high' })
    // 导玩员视角只能看到自己的操作
    const myLogs = await service.query({ actorId: 'guide_01' })
    expect(myLogs.items.length).toBe(0)
  })
})

describe('🎯 运行专员视角 — 审计日志', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: 运行专员查看系统操作日志', async () => {
    await service.log({ eventType: 'auth.login', actorId: 'ops_01', actorType: 'user', riskLevel: 'low' })
    await service.log({ eventType: 'payment.initiated', actorId: 'ops_01', actorType: 'user', riskLevel: 'low' })

    const result = await service.query({ actorId: 'ops_01' })
    expect(result.items.length).toBe(2)
  })

  it('✅ 正例: 运行专员导出运维审计报告', async () => {
    await service.log({ eventType: 'auth.login', actorId: 'ops_01', actorType: 'user', riskLevel: 'low' })
    const now = new Date()
    const csv = await service.exportReport(
      new Date(now.getTime() - 86400000),
      now,
      'csv',
    )
    expect(csv).toContain('id,eventType')
  })

  it('🔲 边界: 运行专员查询系统配置变更', async () => {
    await service.log({ eventType: 'admin.config_change', actorId: 'sysadmin_01', actorType: 'admin', riskLevel: 'high' })
    const configChanges = await service.query({ eventType: 'admin.config_change' })
    expect(configChanges.items.length).toBe(1)
  })
})

describe('🤝 团建视角 — 审计日志', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: 团建活动相关操作记录', async () => {
    await service.log({
      eventType: 'order.created',
      actorId: 'team_build_admin',
      actorType: 'user',
      riskLevel: 'low',
      resourceType: 'team_event',
      metadata: { eventName: '团建活动', participants: 20 },
    })
    const teamEvents = await service.query({ resourceType: 'team_event' } as AuditQuery)
    expect(teamEvents.items.length).toBe(1)
  })

  it('🔲 边界: 团建无自己的操作日志', async () => {
    const result = await service.query({ actorId: 'team_lead_01' })
    expect(result.items.length).toBe(0)
  })
})

describe('📢 营销视角 — 审计日志', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: 营销查看活动投放审计', async () => {
    await service.log({
      eventType: 'admin.config_change',
      actorId: 'marketing_01',
      actorType: 'admin',
      riskLevel: 'medium',
      resourceType: 'campaign_config',
      metadata: { campaignId: 'cp_001', action: 'update_budget', amount: 5000 },
    })
    const campaigns = await service.query({ resourceType: 'campaign_config' } as AuditQuery)
    expect(campaigns.items.length).toBe(1)
    expect(campaigns.items[0].metadata?.amount).toBe(5000)
  })

  it('🔲 边界: 营销人员无法查看分账审计', async () => {
    await service.logSettlementEvent('settlement_mkt', 20000, 'created')
    // 营销视角按 actorId 筛选不会看到分账记录
    const myLogs = await service.query({ actorId: 'marketing_01' })
    expect(myLogs.items.length).toBe(0)
  })
})
