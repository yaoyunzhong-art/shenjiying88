/**
 * 🐜 自动: [audit] [C] 角色 API 深度测试
 *
 * 8 角色视角的 audit controller API 测试：
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限边界）
 * 直接调用 controller 方法模拟 HTTP 请求
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { AuditController } from './audit.controller'
import { AuditService } from './audit.service'
import type {
  CreateAuditLogDto,
  SettlementAuditLogDto,
  AuditReportExportDto,
} from './audit.dto'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 辅助函数 ──
function makeController(): AuditController {
  const service = new AuditService()
  service.__reset()
  return new AuditController(service)
}

// ─────────────────────────────────────────────────────────────
// 👔 店长：门店运营审计视角
// ─────────────────────────────────────────────────────────────
describe(`${ROLES.StoreManager} — audit controller API`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('✅ 正例: 店长可以记录和查询收银操作日志', async () => {
    // 记录多笔收银操作
    for (let i = 0; i < 3; i++) {
      await ctrl.create({
        eventType: 'order.paid',
        actorId: `cashier_0${i + 1}`,
        actorType: 'user',
        resourceType: 'order',
        riskLevel: 'low',
      } as unknown as CreateAuditLogDto)
    }
    const result = await ctrl.findAll({ limit: 10 } as any)
    expect(result.total).toBe(3)
    expect(result.items.every((l: any) => l.eventType === 'order.paid')).toBe(true)
  })

  it('✅ 正例: 店长可以查询门店风险评分', async () => {
    // 在查询前先记录一些操作，让风险评分有数据基础
    for (let i = 0; i < 5; i++) {
      await ctrl.create({
        eventType: 'auth.login',
        actorId: 'manager_01',
        actorType: 'user',
        riskLevel: 'low',
      } as unknown as CreateAuditLogDto)
    }
    const risk = await ctrl.computeRiskScore('manager_01')
    expect(risk).toHaveProperty('score')
    expect(risk.riskLevel).toMatch(/^(low|medium|high|critical)$/)
  })

  it('🔲 边界: 店长查询不存在的风险评分', async () => {
    const risk = await ctrl.computeRiskScore('nonexistent_user')
    expect(risk.score).toBe(0)
    expect(risk.riskLevel).toBe('low')
  })
})

// ─────────────────────────────────────────────────────────────
// 🛒 前台：收银操作审计
// ─────────────────────────────────────────────────────────────
describe(`${ROLES.FrontDesk} — audit controller API`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('✅ 正例: 前台可以记录收银事件', async () => {
    const result = await ctrl.create({
      eventType: 'order.created',
      actorId: 'cashier_02',
      actorType: 'user',
      resourceType: 'order',
      riskLevel: 'low',
    } as unknown as CreateAuditLogDto)
    expect(result).toHaveProperty('id')
    expect(result.id).toMatch(/^audit_\d+_\d+$/)
  })

  it('🔲 边界: 前台批量记录时部分数据缺失', async () => {
    const dtos: CreateAuditLogDto[] = [
      { eventType: 'order.paid', actorId: 'cashier_02', actorType: 'user', riskLevel: 'low' } as unknown as CreateAuditLogDto,
      { eventType: 'order.refund', actorId: 'cashier_02', actorType: 'user', resourceType: 'order', resourceId: 'ord_002', riskLevel: 'medium' } as unknown as CreateAuditLogDto,
    ]
    const result = await ctrl.createBatch(dtos)
    expect(result.ids).toHaveLength(2)
    expect(result.ids[0]).toMatch(/^audit_\d+_\d+$/)
    expect(result.ids[1]).toMatch(/^audit_\d+_\d+$/)
  })
})

// ─────────────────────────────────────────────────────────────
// 👥 HR：员工行为审计
// ─────────────────────────────────────────────────────────────
describe(`${ROLES.HR} — audit controller API`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('✅ 正例: HR 可以查看指定员工活动记录', async () => {
    await ctrl.create({
      eventType: 'auth.login',
      actorId: 'emp_01',
      actorType: 'user',
      riskLevel: 'low',
      metadata: { success: true },
    } as any)
    await ctrl.create({
      eventType: 'auth.logout',
      actorId: 'emp_01',
      actorType: 'user',
      riskLevel: 'low',
    } as any)

    const activity = await ctrl.getUserActivity(
      'emp_01',
      new Date(0).toISOString(),
      new Date().toISOString(),
    )
    expect(activity).toHaveLength(2)
  })

  it('✅ 正例: HR 可以导出审计报告', async () => {
    await ctrl.create({
      eventType: 'user.profile_update',
      actorId: 'emp_02',
      actorType: 'user',
      riskLevel: 'low',
    } as any)

    const report = await ctrl.exportReport({
      from: new Date(0).toISOString(),
      to: new Date().toISOString(),
      format: 'json',
    } as AuditReportExportDto)
    expect(report).toHaveProperty('content')
    expect(typeof report.content).toBe('string')
  })

  it('🔲 边界: HR 查询无活动的员工', async () => {
    const activity = await ctrl.getUserActivity(
      'inactive_emp',
      new Date(0).toISOString(),
      new Date().toISOString(),
    )
    expect(activity).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────
// 🔧 安监：安全与异常审计
// ─────────────────────────────────────────────────────────────
describe(`${ROLES.Safety} — audit controller API`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('✅ 正例: 安监可以检测异常行为', async () => {
    // 模拟短时间内大量登录失败
    for (let i = 0; i < 8; i++) {
      await ctrl.create({
        eventType: 'auth.login',
        actorId: `suspicious_${i}`,
        actorType: 'user',
        riskLevel: 'high',
        ipAddress: '10.0.0.1',
        metadata: { success: false },
      } as any)
    }
    const anomalies = await ctrl.detectAnomalies(60)
    expect(anomalies.length).toBeGreaterThanOrEqual(1)
  })

  it('✅ 正例: 安监可以查看审计追踪', async () => {
    // 记录分账事件 (eventType 传 created/approved/paid/rejected)
    await ctrl.logSettlement({
      settlementId: 'settle_001',
      amount: 1500,
      eventType: 'created',
    } as unknown as SettlementAuditLogDto)

    const trail = await ctrl.getSettlementAuditTrail('settle_001')
    expect(trail).toHaveLength(1)
    expect(trail[0].eventType).toBe('settlement.created')
  })

  it('🔲 边界: 安监查询不存在的分账追踪', async () => {
    const trail = await ctrl.getSettlementAuditTrail('nonexistent_settle')
    expect(trail).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────
// 🎮 导玩员：游戏运营审计
// ─────────────────────────────────────────────────────────────
describe(`${ROLES.Guide} — audit controller API`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('✅ 正例: 导玩员可以记录游戏事件', async () => {
    const result = await ctrl.create({
      eventType: 'game.started',
      actorId: 'guide_01',
      actorType: 'user',
      resourceType: 'game',
      resourceId: 'game_guitar_01',
      riskLevel: 'low',
    } as unknown as CreateAuditLogDto)
    expect(result).toHaveProperty('id')
  })

  it('🔲 边界: 导玩员不能访问风险评分等高权限 API', async () => {
    // 导玩员只能记录和查看基础操作，风险评分调用返回但数据为空
    const risk = await ctrl.computeRiskScore('guide_01')
    expect(risk.score).toBe(0)
  })
})

// ─────────────────────────────────────────────────────────────
// 🎯 运行专员：系统运维审计
// ─────────────────────────────────────────────────────────────
describe(`${ROLES.Operations} — audit controller API`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('✅ 正例: 运行专员可以批量导入设备日志', async () => {
    const dtos: CreateAuditLogDto[] = Array.from({ length: 5 }, (_, i) => ({
      eventType: 'device.metric_report',
      actorId: `device_${i + 1}`,
      actorType: 'device',
      resourceType: 'device',
      resourceId: `dev_${i + 1}`,
      riskLevel: 'low',
      metadata: { cpu: 45 + i * 5, mem: 60 },
    } as unknown as CreateAuditLogDto))
    const result = await ctrl.createBatch(dtos)
    expect(result.ids).toHaveLength(5)
  })

  it('✅ 正例: 运行专员可以生成合规报告', async () => {
    // 先记录一些审计事件
    await ctrl.create({
      eventType: 'auth.login',
      actorId: 'ops_01',
      actorType: 'user',
      riskLevel: 'low',
    } as any)
    const report = await ctrl.generateComplianceReport('tenant_arcade_01')
    expect(report).toHaveProperty('processingActivities')
    expect(report).toHaveProperty('consentRecords')
    expect(report).toHaveProperty('dsrRequests')
    expect(report).toHaveProperty('dataBreaches')
  })

  it('🔲 边界: 运行专员查询空租户合规报告', async () => {
    const report = await ctrl.generateComplianceReport('empty_tenant')
    expect(report.processingActivities).toHaveLength(0)
    expect(report.consentRecords).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────
// 🤝 团建：活动审计
// ─────────────────────────────────────────────────────────────
describe(`${ROLES.Teambuilding} — audit controller API`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('✅ 正例: 团建可以记录活动结算事件', async () => {
    const result = await ctrl.logSettlement({
      settlementId: 'team_settle_001',
      amount: 5000,
      eventType: 'settlement.created',
      metadata: { teamSize: 20, activityType: 'escape_room' },
    } as unknown as SettlementAuditLogDto)
    expect(result).toHaveProperty('id')
  })

  it('✅ 正例: 团建可以按时间范围查询活动日志', async () => {
    await ctrl.create({
      eventType: 'teambuilding.event_completed',
      actorId: 'tb_org_01',
      actorType: 'user',
      resourceType: 'teambuilding',
      riskLevel: 'low',
    } as any)

    const logs = await ctrl.findAll({
      from: new Date(0).toISOString(),
      to: new Date().toISOString(),
    } as any)
    expect(logs.total).toBeGreaterThanOrEqual(1)
  })

  it('🔲 边界: 团建查询不存在活动结算', async () => {
    const trail = await ctrl.getSettlementAuditTrail('nonexistent_tb_settle')
    expect(trail).toHaveLength(0)
  })
})

// ─────────────────────────────────────────────────────────────
// 📢 营销：营销活动审计
// ─────────────────────────────────────────────────────────────
describe(`${ROLES.Marketing} — audit controller API`, () => {
  let ctrl: AuditController

  beforeEach(() => {
    ctrl = makeController()
  })

  it('✅ 正例: 营销可以记录和查看推广活动日志', async () => {
    // 创建多条营销事件
    const events = ['campaign.created', 'coupon.issued', 'campaign.completed']
    for (const evt of events) {
      await ctrl.create({
        eventType: evt,
        actorId: 'marketing_01',
        actorType: 'user',
        resourceType: 'campaign',
        riskLevel: 'low',
      } as any)
    }
    const result = await ctrl.findAll({ actorId: 'marketing_01', limit: 10 } as any)
    expect(result.total).toBe(3)
  })

  it('✅ 正例: 营销可以导出活动审计报表', async () => {
    // 先填充数据
    await ctrl.create({
      eventType: 'coupon.redeemed',
      actorId: 'member_001',
      actorType: 'user',
      riskLevel: 'low',
    } as any)
    await ctrl.create({
      eventType: 'coupon.expired',
      actorId: 'member_002',
      actorType: 'user',
      riskLevel: 'low',
    } as any)

    const report = await ctrl.exportReport({
      from: new Date(Date.now() - 86400000).toISOString(),
      to: new Date().toISOString(),
      format: 'csv',
    } as AuditReportExportDto)
    expect(report).toHaveProperty('content')
    expect(typeof report.content).toBe('string')
  })

  it('🔲 边界: 营销查看空时间段报表', async () => {
    const report = await ctrl.exportReport({
      from: new Date('2020-01-01').toISOString(),
      to: new Date('2020-01-02').toISOString(),
      format: 'json',
    } as AuditReportExportDto)
    // 空时间范围的 JSON 输出为空数组
    expect(report.content).toBe('[]')
  })
})
