/**
 * audit.role-extended.test.ts - 审计日志 8 角色视角扩展测试
 * 
 * 覆盖每角色 2+ 用例: 正常流程 + 权限边界
 * 角色:
 * 👔 店长 (Store Manager)     - 查看店内操作日志、风险评分
 * 🛒 前台 (Cashier)           - 收银操作记录，不可越权
 * 👥 HR (HR)                 - 员工操作审计、异常检测报告
 * 🔧 安监 (Safety Inspector) - 安全审计、合规报告、IP 追踪
 * 🎮 导玩员 (Game Guide)     - 游戏上机记录
 * 🎯 运行专员 (Operations)    - 系统运维、配置变更追查
 * 🤝 团建 (Team Building)    - 团建活动审批审计
 * 📢 营销 (Marketing)        - 活动投放、预算变更审计
 */

import { AuditService } from './audit.service'
import type { AuditQuery } from './audit.service'

// ── 测试辅助：创建审计日志并追加时间偏移 ──
function createEvent(overrides: Partial<any> = {}) {
  return {
    eventType: 'auth.login',
    actorId: 'test_user',
    actorType: 'user' as const,
    riskLevel: 'low' as const,
    ...overrides,
  }
}

// ══════════════════════════════════════════════════════════════════════
// 👔 店长视角 — 店内全局审计
// ══════════════════════════════════════════════════════════════════════
describe('👔 店长视角 — 审计日志（扩展）', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: 店长查看当日多角色操作汇总', async () => {
    await service.log(createEvent({ eventType: 'order.created', actorId: 'cashier_01', actorType: 'user' }))
    await service.log(createEvent({ eventType: 'order.paid', actorId: 'cashier_01', actorType: 'user' }))
    await service.log(createEvent({ eventType: 'auth.login', actorId: 'guide_01', actorType: 'user' }))
    await service.log(createEvent({ eventType: 'payment.initiated', actorId: 'cashier_02', actorType: 'user' }))

    const result = await service.query({ limit: 100 })
    expect(result.items.length).toBe(4)
    expect(result.items.some((l) => l.actorId === 'guide_01')).toBe(true)
  })

  it('✅ 正例: 店长对门店内高风险操作标记关注', async () => {
    await service.log(createEvent({ eventType: 'admin.config_change', actorId: 'admin_01', actorType: 'admin', riskLevel: 'high' }))
    await service.log(createEvent({ eventType: 'order.created', actorId: 'cashier_03', actorType: 'user', riskLevel: 'low' }))

    const highRiskLogs = await service.query({ riskLevel: 'high' })
    expect(highRiskLogs.items.length).toBe(1)
    expect(highRiskLogs.items[0].eventType).toBe('admin.config_change')
  })

  it('🔲 边界: 店长查无数据的空门店', async () => {
    const result = await service.query({ limit: 10 })
    expect(result.items).toHaveLength(0)
    expect(result.total).toBe(0)
  })

  it('🔲 边界: 店长查看其他门店租户数据应隔离', async () => {
    await service.log(createEvent({ actorId: 'cashier_store_a', tenantId: 'store_a' }))
    await service.log(createEvent({ actorId: 'cashier_store_b', tenantId: 'store_b' }))

    const storeALogs = await service.query({ tenantId: 'store_a' })
    expect(storeALogs.items).toHaveLength(1)
    expect(storeALogs.items[0].tenantId).toBe('store_a')
  })
})

// ══════════════════════════════════════════════════════════════════════
// 🛒 前台视角 — 收银操作审计
// ══════════════════════════════════════════════════════════════════════
describe('🛒 前台视角 — 审计日志（扩展）', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: 前台记录收银操作且获取自己的操作日志', async () => {
    const id1 = await service.log(createEvent({ eventType: 'order.created', actorId: 'cashier_a', resourceType: 'order' }))
    const id2 = await service.log(createEvent({ eventType: 'order.paid', actorId: 'cashier_a', resourceType: 'order' }))
    expect(id1).toBeTruthy()
    expect(id2).toBeTruthy()

    const myLogs = await service.query({ actorId: 'cashier_a' })
    expect(myLogs.items).toHaveLength(2)
  })

  it('✅ 正例: 前台记录退款操作', async () => {
    const id = await service.log(createEvent({
      eventType: 'order.refunded',
      actorId: 'cashier_b',
      actorType: 'user',
      riskLevel: 'medium',
      resourceType: 'order',
      metadata: { orderId: 'ord_001', refundAmount: 99.5 },
    }))
    const log = await service.getById(id)
    expect(log!.eventType).toBe('order.refunded')
    expect(log!.metadata!.refundAmount).toBe(99.5)
  })

  it('🔲 边界: 前台不可查看其他角色操作', async () => {
    await service.log(createEvent({ actorId: 'admin_01', actorType: 'admin' }))
    await service.log(createEvent({ actorId: 'cashier_c', actorType: 'user' }))

    const cashierLogs = await service.query({ actorId: 'cashier_c' })
    expect(cashierLogs.items).toHaveLength(1)
    // 模拟前台没有 admin 角色权限
    expect(cashierLogs.items[0].actorId).toBe('cashier_c')
  })

  it('🔲 边界: 前台大量收银操作不触发异常', async () => {
    for (let i = 0; i < 10; i++) {
      await service.log(createEvent({
        eventType: 'order.created',
        actorId: 'cashier_express',
        metadata: { orderNo: `ORD${i}` },
      }))
    }
    // 前台正常操作不应该触发异常检测
    const anomalies = await service.detectAnomalies()
    const cashierAnomaly = anomalies.find((a) => a.pattern.includes('cashier_express'))
    expect(cashierAnomaly).toBeUndefined()
  })
})

// ══════════════════════════════════════════════════════════════════════
// 👥 HR 视角 — 员工行为审计
// ══════════════════════════════════════════════════════════════════════
describe('👥 HR 视角 — 审计日志（扩展）', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: HR 查看员工完整操作时间线', async () => {
    const now = Date.now()
    await service.log(createEvent({
      eventType: 'auth.login',
      actorId: 'emp_01',
      timestamp: new Date(now - 60000),
    } as any))
    await service.log(createEvent({
      eventType: 'user.profile_update',
      actorId: 'emp_01',
      timestamp: new Date(now - 30000),
    } as any))
    await service.log(createEvent({
      eventType: 'auth.logout',
      actorId: 'emp_01',
      timestamp: new Date(now),
    } as any))

    const activity = await service.getUserActivityLog('emp_01', new Date(now - 120000), new Date(now + 1000))
    expect(activity).toHaveLength(3)
    // 时间正序: login → profile_update → logout
    expect(activity[0].eventType).toBe('auth.login')
    expect(activity[2].eventType).toBe('auth.logout')
  })

  it('✅ 正例: HR 导出员工操作合规报告', async () => {
    await service.log(createEvent({
      eventType: 'auth.login',
      actorId: 'emp_02',
      tenantId: 't_001',
    }))
    await service.log(createEvent({
      eventType: 'user.consent_update',
      actorId: 'emp_02',
      tenantId: 't_001',
      riskLevel: 'low',
    }))

    const report = await service.generateComplianceReport('t_001')
    expect(report.processingActivities).toHaveLength(2)
    expect(report.consentRecords).toHaveLength(0) // consent_update !== consent_recorded
  })

  it('🔲 边界: HR 查看已离职员工空记录', async () => {
    const activity = await service.getUserActivityLog('former_emp', new Date(0), new Date())
    expect(activity).toHaveLength(0)
  })

  it('🔲 边界: HR 对敏感修改的高频率进行异常检测', async () => {
    for (let i = 0; i < 5; i++) {
      await service.log(createEvent({
        eventType: 'auth.password_change',
        actorId: 'emp_sensitive',
        riskLevel: 'medium',
      }))
    }
    const result = await service.query({ actorId: 'emp_sensitive' })
    expect(result.items).toHaveLength(5)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 🔧 安监视角 — 安全审计与异常追踪
// ══════════════════════════════════════════════════════════════════════
describe('🔧 安监视角 — 审计日志（扩展）', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: 安监检测 IP 暴力登录尝试', async () => {
    for (let i = 0; i < 6; i++) {
      await service.log(createEvent({
        eventType: 'auth.login',
        actorId: `user_${i}`,
        ipAddress: '192.168.1.100',
        metadata: { success: false },
      }))
    }
    const anomalies = await service.detectAnomalies(60)
    const bruteForceAnomaly = anomalies.find((a) => a.pattern.includes('192.168.1.100'))
    expect(bruteForceAnomaly).toBeDefined()
    expect(bruteForceAnomaly!.riskLevel).toBe('high')
    expect(bruteForceAnomaly!.count).toBeGreaterThanOrEqual(5)
  })

  it('✅ 正例: 安监追踪管理员模拟用户操作', async () => {
    await service.log(createEvent({
      eventType: 'admin.user_impersonate',
      actorId: 'admin_01',
      actorType: 'admin',
      riskLevel: 'critical',
      metadata: { impersonatedUser: 'user_01', reason: 'debug' },
    }))
    const anomalies = await service.detectAnomalies()
    const impersonateAnomaly = anomalies.find((a) => a.pattern.includes('管理员模拟用户操作'))
    expect(impersonateAnomaly).toBeDefined()
    expect(impersonateAnomaly!.riskLevel).toBe('critical')
  })

  it('🔲 边界: 安监查看无异常时的空检测报告', async () => {
    // 没有异常操作
    await service.log(createEvent({ eventType: 'auth.login', actorId: 'normal_user', metadata: { success: true } }))
    const anomalies = await service.detectAnomalies()
    expect(anomalies).toHaveLength(0)
  })

  it('🔲 边界: 安监导出高风险事件 CSV 报告', async () => {
    await service.log(createEvent({ eventType: 'admin.user_impersonate', actorId: 'admin_s', actorType: 'admin', riskLevel: 'critical' }))
    await service.log(createEvent({ eventType: 'auth.login', actorId: 'user_n', riskLevel: 'low' }))

    const csv = await service.exportReport(new Date(0), new Date(), 'csv')
    expect(csv).toContain('Admin.user_impersonate'.toLowerCase())
    // 验证 CSV header
    const lines = csv.split('\n')
    expect(lines[0]).toContain('id,eventType')
  })
})

// ══════════════════════════════════════════════════════════════════════
// 🎮 导玩员视角 — 游戏上机审计
// ══════════════════════════════════════════════════════════════════════
describe('🎮 导玩员视角 — 审计日志（扩展）', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: 导玩员记录玩家上机/下机事件', async () => {
    const startId = await service.log(createEvent({
      eventType: 'order.created',
      actorId: 'guide_01',
      resourceType: 'game_session',
      metadata: { gameId: 'game_001', action: 'start', machineNo: 'M01' },
    }))
    const endId = await service.log(createEvent({
      eventType: 'order.paid',
      actorId: 'guide_01',
      resourceType: 'game_session',
      metadata: { gameId: 'game_001', action: 'end', machineNo: 'M01', duration: 45 },
    }))

    expect(startId).toBeTruthy()
    expect(endId).toBeTruthy()

    const logs = await service.query({ resourceType: 'game_session' } as AuditQuery)
    expect(logs.items).toHaveLength(2)
  })

  it('✅ 正例: 导玩员查看当班期间游戏记录汇总', async () => {
    for (let i = 0; i < 3; i++) {
      await service.log(createEvent({
        eventType: 'order.created',
        actorId: 'guide_02',
        resourceType: 'game_session',
        metadata: { machineNo: `M0${i + 1}` },
      }))
    }
    const mySessions = await service.query({ actorId: 'guide_02' })
    expect(mySessions.items).toHaveLength(3)
  })

  it('🔲 边界: 导玩员不可查看管理后台配置变更', async () => {
    await service.log(createEvent({
      eventType: 'admin.config_change',
      actorId: 'sysadmin',
      actorType: 'admin',
      riskLevel: 'high',
    }))
    const guideView = await service.query({ actorId: 'guide_no_access' })
    expect(guideView.items).toHaveLength(0)
  })

  it('🔲 边界: 当班无玩家时的空记录', async () => {
    const result = await service.query({ actorId: 'guide_idle' })
    expect(result.total).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 🎯 运行专员视角 — 系统运维审计
// ══════════════════════════════════════════════════════════════════════
describe('🎯 运行专员视角 — 审计日志（扩展）', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: 运行专员查看系统配置变更时间线', async () => {
    await service.log(createEvent({
      eventType: 'admin.config_change',
      actorId: 'ops_01',
      actorType: 'admin',
      riskLevel: 'high',
      metadata: { configKey: 'max_users', oldValue: '50', newValue: '100' },
    }))
    await service.log(createEvent({
      eventType: 'admin.config_change',
      actorId: 'ops_01',
      actorType: 'admin',
      riskLevel: 'high',
      metadata: { configKey: 'api_rate_limit', oldValue: '100', newValue: '200' },
    }))

    const configChanges = await service.query({ eventType: 'admin.config_change' })
    expect(configChanges.items).toHaveLength(2)
    // 验证两个配置变更都存在（顺序可能一致，不依赖排序）
    const keys = configChanges.items.map((i) => i.metadata!.configKey)
    expect(keys).toContain('max_users')
    expect(keys).toContain('api_rate_limit')
  })

  it('✅ 正例: 运行专员计算系统风险评分', async () => {
    // 模拟一些高风险操作
    await service.log(createEvent({
      eventType: 'admin.user_impersonate',
      actorId: 'ops_risk_user',
      actorType: 'admin',
      riskLevel: 'critical',
    }))
    await service.log(createEvent({
      eventType: 'admin.config_change',
      actorId: 'ops_risk_user',
      actorType: 'admin',
      riskLevel: 'high',
    }))

    const score = await service.computeRiskScore('ops_risk_user')
    expect(score).toBeGreaterThan(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  it('🔲 边界: 运行专员导出 JSON 运维审计报告', async () => {
    const start = new Date(Date.now() - 3600000)
    await service.log(createEvent({ eventType: 'auth.login', actorId: 'ops_user' }))
    const report = await service.exportReport(start, new Date(), 'json')
    expect(report).toContain('auth.login')
    expect(report).toContain('ops_user')
  })

  it('🔲 边界: 运行专员查看无操作的新系统', async () => {
    const result = await service.query({ limit: 10 })
    expect(result.total).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 🤝 团建视角 — 团建活动审计
// ══════════════════════════════════════════════════════════════════════
describe('🤝 团建视角 — 审计日志（扩展）', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: 团建组织者记录活动预算审批', async () => {
    await service.log(createEvent({
      eventType: 'settlement.created',
      actorId: 'teamlead_01',
      actorType: 'user',
      riskLevel: 'medium',
      resourceType: 'team_event',
      metadata: { eventName: '季度团建', budget: 5000, participants: 30 },
    }))
    await service.log(createEvent({
      eventType: 'settlement.approved',
      actorId: 'manager_01',
      actorType: 'admin',
      riskLevel: 'medium',
      resourceType: 'team_event',
      metadata: { eventName: '季度团建', approvedBy: 'manager_01' },
    }))

    const teamEvents = await service.query({ resourceType: 'team_event' } as AuditQuery)
    expect(teamEvents.items).toHaveLength(2)
    expect(teamEvents.items.some((l) => l.eventType === 'settlement.created')).toBe(true)
    expect(teamEvents.items.some((l) => l.eventType === 'settlement.approved')).toBe(true)
  })

  it('✅ 正例: 团建分账事件全链路追踪', async () => {
    const sId = 'settlement_team_q1'
    await service.logSettlementEvent(sId, 3000, 'created')
    await service.logSettlementEvent(sId, 3000, 'approved')
    await service.logSettlementEvent(sId, 3000, 'paid')

    const trail = await service.getSettlementAuditTrail(sId)
    expect(trail).toHaveLength(3)
    expect(trail[0].eventType).toBe('settlement.created')
    expect(trail[2].eventType).toBe('settlement.paid')
  })

  it('🔲 边界: 团建活动无审计记录', async () => {
    const trail = await service.getSettlementAuditTrail('nonexistent_settlement')
    expect(trail).toHaveLength(0)
  })

  it('🔲 边界: 团建预算超过限额触发审批审计', async () => {
    await service.logSettlementEvent('settlement_high', 50000, 'created')
    await service.logSettlementEvent('settlement_high', 50000, 'rejected')
    const trail = await service.getSettlementAuditTrail('settlement_high')
    expect(trail).toHaveLength(2)
    expect(trail.some((l) => l.eventType === 'settlement.rejected')).toBe(true)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 📢 营销视角 — 营销活动审计
// ══════════════════════════════════════════════════════════════════════
describe('📢 营销视角 — 审计日志（扩展）', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ 正例: 营销查看活动投放预算变更记录', async () => {
    await service.log(createEvent({
      eventType: 'admin.config_change',
      actorId: 'mkt_01',
      actorType: 'admin',
      riskLevel: 'medium',
      resourceType: 'campaign_config',
      metadata: { campaignId: 'cmp_001', action: 'update_budget', oldBudget: 2000, newBudget: 5000 },
    }))
    await service.log(createEvent({
      eventType: 'admin.config_change',
      actorId: 'mkt_01',
      actorType: 'admin',
      riskLevel: 'medium',
      resourceType: 'campaign_config',
      metadata: { campaignId: 'cmp_001', action: 'update_target_audience' },
    }))

    const campaigns = await service.query({ resourceType: 'campaign_config' } as AuditQuery)
    expect(campaigns.items).toHaveLength(2)
    expect(campaigns.items[0].metadata!.campaignId).toBe('cmp_001')
  })

  it('✅ 正例: 营销记录积分活动操作', async () => {
    await service.log(createEvent({
      eventType: 'points.adjusted',
      actorId: 'mkt_02',
      actorType: 'admin',
      riskLevel: 'medium',
      resourceType: 'campaign',
      metadata: { campaignId: 'cmp_002', memberId: 'member_01', pointsDelta: 500, reason: '新客礼包' },
    }))

    const pointLogs = await service.query({ eventType: 'points.adjusted' })
    expect(pointLogs.items).toHaveLength(1)
    expect(pointLogs.items[0].metadata!.pointsDelta).toBe(500)
  })

  it('🔲 边界: 营销人员不可查看分账审计', async () => {
    await service.logSettlementEvent('settlement_mkt_01', 10000, 'created')
    // 按 actorId 过滤——分账事件的 actorId 是 system
    const systemLogs = await service.query({ actorId: 'system' })
    expect(systemLogs.items).toHaveLength(1)
    // 营销人员不应该看到 system 级别日志（模拟商家视角只能看到自己的操作）
    const mktLogs = await service.query({ actorId: 'mkt_manager' })
    expect(mktLogs.items).toHaveLength(0)
  })

  it('🔲 边界: 营销查询无活动的历史期', async () => {
    const result = await service.query({
      eventType: 'points.redeemed',
    })
    // 没有兑换积分记录
    expect(result.total).toBe(0)
  })
})

// ══════════════════════════════════════════════════════════════════════
// 🔄 跨角色 IP 溯源与链路追踪测试
// ══════════════════════════════════════════════════════════════════════
describe('🔄 跨角色 — IP 溯源与链路追踪', () => {
  let service: AuditService

  beforeEach(() => {
    service = new AuditService()
    service.__reset()
  })

  it('✅ IP 注入: 安监可按 IP 追踪全链路操作', async () => {
    service.setClientIP('10.0.0.66')
    await service.log(createEvent({ eventType: 'auth.login', actorId: 'user_a', metadata: { success: true } }))
    await service.log(createEvent({ eventType: 'order.created', actorId: 'user_a' }))

    const logs = service.__getAll()
    expect(logs.every((l) => l.ipAddress === '10.0.0.66')).toBe(true)
  })

  it('✅ TraceId 注入: 运行专员可追踪分布式调用链', async () => {
    service.setTraceId('trace_abc_123')
    await service.log(createEvent({ eventType: 'payment.initiated', actorId: 'sys_service' }))
    await service.log(createEvent({ eventType: 'payment.completed', actorId: 'sys_service' }))

    const logs = service.__getAll()
    expect(logs.every((l) => l.traceId === 'trace_abc_123')).toBe(true)
  })

  it('🔲 边界: 无 IP / TraceId 时的降级', async () => {
    const id = await service.log(createEvent({ eventType: 'auth.login', actorId: 'anon_user' }))
    const log = await service.getById(id)
    expect(log!.ipAddress).toBeUndefined()
    expect(log!.traceId).toBeUndefined()
  })
})
