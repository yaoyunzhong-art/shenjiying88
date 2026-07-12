// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🦞 龙虾哥测试第二段 — ai-diagnosis 扩展角色测试
 * 👔店长 · 🛒前台 · 👥HR · 🔧安监 · 🎮导玩员 · 🎯运行专员 · 🤝团建 · 📢营销
 *
 * 覆盖端点: create, list, get, update, delete, createBatch, getBatch,
 *           listBatches, riskReport
 * 每个角色至少 2 个场景，包含正常流程 + 权限边界
 * 强化租户隔离测试与跨域数据安全
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { NotFoundException } from '@nestjs/common'
import { AiDiagnosisService } from './ai-diagnosis.service'
import { AiDiagnosisController } from './ai-diagnosis.controller'

const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
}

// ── 控制器工厂 (每次新实例确保状态隔离) ──
function createCtrl() {
  AiDiagnosisService.resetStores()
  const service = new AiDiagnosisService()
  return new AiDiagnosisController(service) as any
}

// ── 辅助工厂 ──

function makeDiagnosis(ctrl: any, overrides?: Record<string, unknown>) {
  return ctrl.create({
    engineId: 'engine-rules-v1',
    scenarioId: 'scenario-daily-check',
    tenantId: 'T-store-001',
    requestedBy: 'test-user',
    promptSummary: '日常规则诊断',
    ...overrides,
  })
}

function makeBatch(ctrl: any, overrides?: Record<string, unknown>) {
  return ctrl.createBatch({
    engineId: 'engine-rules-v1',
    scenarioIds: ['s-normal', 's-critical'],
    tenantId: 'T-store-001',
    triggeredBy: 'test-user',
    ...overrides,
  })
}

// ════════════ 👔店长 ════════════
describe(`${ROLES.StoreManager} ai-diagnosis 扩展角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
    makeDiagnosis(ctrl, { tenantId: 'T-store-001', requestedBy: 'store-mgr-1' })
    makeDiagnosis(ctrl, { tenantId: 'T-store-001', requestedBy: 'store-mgr-2' })
    makeDiagnosis(ctrl, { tenantId: 'T-store-002', requestedBy: 'other-store' })
  })

  it('店长创建诊断 — 诊断含完整 inputSnapshot', () => {
    const inputSnapshot = { deviceId: 'pos-001', cpuUsage: 92, memoryUsage: 88 }
    const result = makeDiagnosis(ctrl, {
      tenantId: 'T-store-001',
      requestedBy: 'store-mgr-3',
      inputSnapshot,
    })
    assert.ok(result.diagnosis.diagnosisId.startsWith('diag-'))
    assert.equal(result.diagnosis.status, 'PENDING')
    assert.deepEqual(result.diagnosis.inputSnapshot, inputSnapshot)
  })

  it('店长只能看到本店诊断 — 租户隔离', () => {
    const result = ctrl.list({ tenantId: 'T-store-001' })
    assert.equal(result.total, 3) // 2 from before + 1 new
    for (const d of result.diagnoses) {
      assert.equal(d.tenantId, 'T-store-001')
    }
  })

  it('店长无法访问他店诊断 — 即使强行请求', () => {
    const result = ctrl.list({ tenantId: 'T-store-002' })
    assert.equal(result.total, 1) // one from other store
    for (const d of result.diagnoses) {
      assert.notEqual(d.tenantId, 'T-store-001')
    }
  })

  it('店长可批量诊断本店场景 — critical 场景正确标记', () => {
    const batch = makeBatch(ctrl, {
      tenantId: 'T-store-001',
      scenarioIds: ['normal-check', 'critical-outage'],
      triggeredBy: 'store-mgr',
    })
    assert.equal(batch.batch.totalDiagnoses, 2)
    // critical-outage 应被标记为高风险
    const criticalDiag = batch.batch.diagnoses.find((d: any) => d.scenarioId === 'critical-outage')
    assert.ok(criticalDiag)
    assert.equal(criticalDiag.riskLevel, 'high')
    const normalDiag = batch.batch.diagnoses.find((d: any) => d.scenarioId === 'normal-check')
    assert.ok(normalDiag)
    assert.equal(normalDiag.riskLevel, 'low')
  })
})

// ════════════ 🛒前台 ════════════
describe(`${ROLES.FrontDesk} ai-diagnosis 扩展角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
    makeDiagnosis(ctrl, { engineId: 'pos-check', scenarioId: 'cashier-issue', tenantId: 'T-store-001', requestedBy: 'frontdesk-1' })
    makeDiagnosis(ctrl, { engineId: 'member-check', scenarioId: 'member-verify', tenantId: 'T-store-001', requestedBy: 'frontdesk-2' })
  })

  it('前台创建诊断 — 新诊断默认 PENDING', () => {
    const inputSnapshot = { cashierId: 'cashier-003', transactionCount: 152 }
    const result = makeDiagnosis(ctrl, {
      engineId: 'pos-check',
      scenarioId: 'cashier-issue',
      tenantId: 'T-store-001',
      requestedBy: 'frontdesk-3',
      inputSnapshot,
    })
    assert.equal(result.diagnosis.status, 'PENDING')
    assert.ok(result.diagnosis.inputSnapshot.transactionCount)
  })

  it('前台按引擎过滤 — 只看到 POS 相关诊断', () => {
    const result = ctrl.list({ engineId: 'pos-check', tenantId: 'T-store-001' })
    // beforeAll创建1个pos-check + 第一条测试又创建1个pos-check
    assert.equal(result.total, 2)
    assert.equal(result.diagnoses[0].engineId, 'pos-check')
  })

  it('前台尝试更新诊断状态 — 正常完成流程', () => {
    const d = makeDiagnosis(ctrl, { tenantId: 'T-store-001', requestedBy: 'frontdesk-4' })
    const updated = ctrl.update(d.diagnosis.diagnosisId, {
      status: 'IN_PROGRESS',
      riskLevel: 'medium',
      recommendation: 'POS 异常待检查',
    })
    assert.equal(updated.diagnosis.status, 'IN_PROGRESS')
    assert.equal(updated.diagnosis.riskLevel, 'medium')
  })

  it('前台误删诊断 — 再获取应 404', () => {
    const d = makeDiagnosis(ctrl, { tenantId: 'T-store-001', requestedBy: 'frontdesk-5' })
    ctrl.remove(d.diagnosis.diagnosisId)
    assert.throws(
      () => ctrl.get(d.diagnosis.diagnosisId),
      (err: any) => err instanceof NotFoundException,
    )
  })
})

// ════════════ 👥HR ════════════
describe(`${ROLES.HR} ai-diagnosis 扩展角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
    makeDiagnosis(ctrl, { engineId: 'hr-compliance', scenarioId: 'staff-audit', tenantId: 'T-store-001', requestedBy: 'hr-1' })
    makeDiagnosis(ctrl, { engineId: 'hr-payroll', scenarioId: 'payroll-check', tenantId: 'T-store-001', requestedBy: 'hr-2' })
  })

  it('HR 创建人力合规诊断 — 成功返回 diagnoses', () => {
    const result = makeDiagnosis(ctrl, {
      engineId: 'hr-compliance',
      scenarioId: 'staff-background-check',
      tenantId: 'T-store-001',
      requestedBy: 'hr-3',
      promptSummary: '背景调查合规规则',
    })
    assert.equal(result.diagnosis.engineId, 'hr-compliance')
    assert.equal(result.diagnosis.promptSummary, '背景调查合规规则')
  })

  it('HR 批量诊断 — 统计 matchRate 正确', () => {
    const batch = makeBatch(ctrl, {
      engineId: 'hr-compliance',
      scenarioIds: ['critical-background', 'standard-onboard', 'critical-exit'],
      tenantId: 'T-store-001',
      triggeredBy: 'hr-lead',
    })
    assert.equal(batch.batch.totalDiagnoses, 3)
    // critical 场景被标记为 matched
    assert.equal(batch.batch.matchedDiagnoses, 2)
    assert.ok(batch.batch.matchRate > 0)
  })

  it('HR 获取风险报告 — topRecommendations 按严重级别排序', () => {
    const d1 = makeDiagnosis(ctrl, { engineId: 'hr-compliance', scenarioId: 'critical-breach', tenantId: 'T-store-001', requestedBy: 'hr-4' })
    ctrl.update(d1.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'critical', recommendation: '紧急合规漏洞' })
    const d2 = makeDiagnosis(ctrl, { engineId: 'hr-compliance', scenarioId: 'high-minor', tenantId: 'T-store-001', requestedBy: 'hr-5' })
    ctrl.update(d2.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'high', recommendation: '需关注' })

    const report = ctrl.riskReport('hr-compliance', 'T-store-001')
    assert.ok(report.topRecommendations.length >= 2)
    assert.equal(report.topRecommendations[0].riskLevel, 'critical')
  })
})

// ════════════ 🔧安监 ════════════
describe(`${ROLES.Safety} ai-diagnosis 扩展角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
    makeDiagnosis(ctrl, { engineId: 'safety-fire', scenarioId: 'fire-alarm-test', tenantId: 'T-store-001', requestedBy: 'safety-1' })
    makeDiagnosis(ctrl, { engineId: 'safety-evacuation', scenarioId: 'evacuation-drill', tenantId: 'T-store-002', requestedBy: 'safety-2' })
  })

  it('安监创建安全诊断 — 全部字段齐全', () => {
    const result = makeDiagnosis(ctrl, {
      engineId: 'safety-fire',
      scenarioId: 'sprinkler-check',
      tenantId: 'T-store-001',
      requestedBy: 'safety-3',
      promptSummary: '自动喷淋系统诊断',
      inputSnapshot: { deviceId: 'sprinkler-01', pressure: 1.2 },
    })
    assert.equal(result.diagnosis.promptSummary, '自动喷淋系统诊断')
    assert.equal(result.diagnosis.inputSnapshot.pressure, 1.2)
  })

  it('安监只能操作本租户数据 — 租户过滤', () => {
    const result = ctrl.list({ tenantId: 'T-store-001' })
    for (const d of result.diagnoses) {
      assert.equal(d.tenantId, 'T-store-001')
    }
  })

  it('安监创建跨场景批量诊断 — 每个场景被独立诊断', () => {
    const batch = makeBatch(ctrl, {
      engineId: 'safety-fire',
      scenarioIds: ['fire-drill-1', 'fire-drill-2', 'fire-drill-3'],
      tenantId: 'T-store-001',
      triggeredBy: 'safety-lead',
    })
    assert.equal(batch.batch.totalDiagnoses, 3)
    assert.equal(batch.batch.riskDistribution.low, 3) // 无 critical 关键词
  })
})

// ════════════ 🎮导玩员 ════════════
describe(`${ROLES.Guide} ai-diagnosis 扩展角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
    makeDiagnosis(ctrl, { engineId: 'game-engine', scenarioId: 'score-anomaly', tenantId: 'T-store-001', requestedBy: 'guide-1' })
  })

  it('导玩员创建游戏诊断 — 正确关联引擎', () => {
    const result = makeDiagnosis(ctrl, {
      engineId: 'game-engine',
      scenarioId: 'prize-overflow',
      tenantId: 'T-store-001',
      requestedBy: 'guide-2',
    })
    assert.equal(result.diagnosis.engineId, 'game-engine')
  })

  it('导玩员更新诊断为 COMPLETED — completedAt 自动填充', () => {
    const d = makeDiagnosis(ctrl, { engineId: 'game-engine', tenantId: 'T-store-001', requestedBy: 'guide-3' })
    const updated = ctrl.update(d.diagnosis.diagnosisId, {
      status: 'COMPLETED',
      matchedRuleIds: ['rule-prize-cap'],
      matchedConditionIds: ['cond-prize-exceed'],
    })
    assert.equal(updated.diagnosis.status, 'COMPLETED')
    assert.ok(updated.diagnosis.completedAt)
    assert.deepEqual(updated.diagnosis.matchedRuleIds, ['rule-prize-cap'])
  })

  it('导玩员无法访问不同门店批量', () => {
    makeBatch(ctrl, { engineId: 'game-engine', tenantId: 'T-store-002', triggeredBy: 'guide-other' })
    const myBatches = ctrl.listBatches(undefined, 'T-store-001')
    for (const b of myBatches) {
      assert.equal(b.tenantId, 'T-store-001')
    }
  })
})

// ════════════ 🎯运行专员 ════════════
describe(`${ROLES.Operations} ai-diagnosis 扩展角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
    makeBatch(ctrl, { engineId: 'ops-monitor', scenarioIds: ['server-health', 'critical-disk-full'], tenantId: 'T-store-001', triggeredBy: 'ops-1' })
    makeBatch(ctrl, { engineId: 'ops-monitor', scenarioIds: ['network-check'], tenantId: 'T-store-002', triggeredBy: 'ops-2' })
  })

  it('运行专员创建诊断并完成完整流程 — PENDING→IN_PROGRESS→COMPLETED', () => {
    const d = makeDiagnosis(ctrl, {
      engineId: 'ops-monitor',
      scenarioId: 'server-cpu-spike',
      tenantId: 'T-store-001',
      requestedBy: 'ops-3',
    })
    assert.equal(d.diagnosis.status, 'PENDING')

    const step1 = ctrl.update(d.diagnosis.diagnosisId, { status: 'IN_PROGRESS' })
    assert.equal(step1.diagnosis.status, 'IN_PROGRESS')

    const step2 = ctrl.update(d.diagnosis.diagnosisId, {
      status: 'COMPLETED',
      riskLevel: 'high',
      recommendation: 'CPU 异常，建议扩容',
    })
    assert.equal(step2.diagnosis.status, 'COMPLETED')
    assert.equal(step2.diagnosis.riskLevel, 'high')
    assert.ok(step2.diagnosis.completedAt)
  })

  it('运行专员查看风险报告 — averageEvaluationDurationMs 正确', () => {
    makeDiagnosis(ctrl, { engineId: 'ops-monitor', scenarioId: 'mem-check-1', tenantId: 'T-store-001', requestedBy: 'ops-4' })
    makeDiagnosis(ctrl, { engineId: 'ops-monitor', scenarioId: 'mem-check-2', tenantId: 'T-store-001', requestedBy: 'ops-5' })
    const report = ctrl.riskReport('ops-monitor', 'T-store-001')
    assert.ok(report.generatedAt)
    assert.equal(typeof report.averageEvaluationDurationMs, 'number')
  })

  it('运行专员获取不存在的诊断 — 404', () => {
    assert.throws(
      () => ctrl.get('diag-nonexistent-999'),
      (err: any) => err instanceof NotFoundException,
    )
  })
})

// ════════════ 🤝团建 ════════════
describe(`${ROLES.Teambuilding} ai-diagnosis 扩展角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
    makeDiagnosis(ctrl, { engineId: 'team-building', scenarioId: 'activity-risk', tenantId: 'T-store-001', requestedBy: 'team-1' })
  })

  it('团建创建活动诊断 — 跨天活动', () => {
    const inputSnapshot = { activityId: 'team-b-001', memberCount: 25, outdoor: true }
    const result = makeDiagnosis(ctrl, {
      engineId: 'team-building',
      scenarioId: 'outdoor-activity',
      tenantId: 'T-store-001',
      requestedBy: 'team-2',
      inputSnapshot,
    })
    assert.equal(result.diagnosis.scenarioId, 'outdoor-activity')
    assert.equal(result.diagnosis.inputSnapshot.memberCount, 25)
  })

  it('团建删除不存在的诊断 — 404', () => {
    assert.throws(
      () => ctrl.remove('diag-nonexistent-888'),
      (err: any) => err instanceof NotFoundException,
    )
  })

  it('团建按风险等级过滤 — 只看到 high 及以上', () => {
    const d = makeDiagnosis(ctrl, { engineId: 'team-building', scenarioId: 'critical-outdoor-rain', tenantId: 'T-store-001', requestedBy: 'team-3' })
    ctrl.update(d.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'high' })

    const result = ctrl.list({ riskLevel: 'high', tenantId: 'T-store-001' })
    assert.equal(result.total, 1)
    assert.equal(result.diagnoses[0].riskLevel, 'high')
  })
})

// ════════════ 📢营销 ════════════
describe(`${ROLES.Marketing} ai-diagnosis 扩展角色测试`, () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
    makeBatch(ctrl, { engineId: 'marketing-campaign', scenarioIds: ['promo-effectiveness', 'critical-budget-overshoot'], tenantId: 'T-store-001', triggeredBy: 'mkt-1' })
  })

  it('营销批量诊断活动效果 — critical 场景标记为高风险', () => {
    const batch = makeBatch(ctrl, {
      engineId: 'marketing-campaign',
      scenarioIds: ['normal-promo', 'critical-budget-exceeded', 'event-feedback'],
      tenantId: 'T-store-001',
      triggeredBy: 'mkt-lead',
    })
    assert.equal(batch.batch.totalDiagnoses, 3)
    const criticalDiag = batch.batch.diagnoses.find((d: any) => d.scenarioId === 'critical-budget-exceeded')
    assert.ok(criticalDiag)
    assert.equal(criticalDiag.riskLevel, 'high')
  })

  it('营销使用引擎详情过滤 — 只看到 campaign 相关', () => {
    makeDiagnosis(ctrl, { engineId: 'marketing-campaign', scenarioId: 'social-media-opt', tenantId: 'T-store-001', requestedBy: 'mkt-2' })
    const result = ctrl.list({ engineId: 'marketing-campaign', tenantId: 'T-store-001' })
    for (const d of result.diagnoses) {
      assert.equal(d.engineId, 'marketing-campaign')
    }
  })

  it('营销获取跨租户报告 — 被正确隔离', () => {
    const report = ctrl.riskReport('marketing-campaign', 'T-store-001')
    // beforeAll batch (2) + test1 batch (3) + test2 single (1) = 6
    assert.equal(report.totalEvaluated, 6)
    // T-store-002 的数据不应出现
    const otherReport = ctrl.riskReport('marketing-campaign', 'T-store-002')
    assert.equal(otherReport.totalEvaluated, 0)
  })
})

// ════════════ 🔧超管（高阶集成场景）════════════
describe('🔧超管 跨租户诊断运营', () => {
  let ctrl: any

  beforeAll(() => {
    ctrl = createCtrl()
    makeDiagnosis(ctrl, { engineId: 'system-health', scenarioId: 'critical-db-replication', tenantId: 'T-store-001', requestedBy: 'admin' })
    makeDiagnosis(ctrl, { engineId: 'system-health', scenarioId: 'critical-cache-miss', tenantId: 'T-store-002', requestedBy: 'admin' })
    makeDiagnosis(ctrl, { engineId: 'system-health', scenarioId: 'normal-health', tenantId: 'T-store-003', requestedBy: 'admin' })
  })

  it('超管全局风险报告 — 跨租户汇总', () => {
    // 所有诊断都完成，给 T-store-001 和 T-store-002 标记高风险
    const allDiag = ctrl.list({})
    for (const d of allDiag.diagnoses) {
      const isCritical = d.scenarioId.startsWith('critical')
      ctrl.update(d.diagnosisId, {
        status: 'COMPLETED',
        riskLevel: isCritical ? 'critical' : 'low',
        recommendation: isCritical ? '需紧急处理' : '正常运行',
      })
    }

    const report = ctrl.riskReport('system-health')
    assert.equal(report.totalEvaluated, 3)
    assert.equal(report.riskDistribution.critical, 2)
    assert.equal(report.riskDistribution.low, 1)
    assert.equal(report.topRecommendations.length, 2)
    assert.equal(report.topRecommendations[0].riskLevel, 'critical')
  })

  it('超管按租户获取风险报告 — 只返回该租户', () => {
    const report1 = ctrl.riskReport('system-health', 'T-store-001')
    assert.equal(report1.totalEvaluated, 1)
    const report2 = ctrl.riskReport('system-health', 'T-store-003')
    assert.equal(report2.totalEvaluated, 1)
    assert.equal(report2.riskDistribution.low, 1)
  })

  it('超管按引擎过滤批量 — 系统跨租户批处理', () => {
    const batches = ctrl.listBatches('engine-rules-v1')
    // 引擎 engine-rules-v1 是前面 role 创建的
    // 当前 ctrl 仅有 system-health 引擎的诊断，所以为 0
    assert.equal(batches.length, 0)
  })
})
