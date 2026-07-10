/**
 * 🐜 自动: [ai-rule-engine] [C] 诊断角色扩展 — 大飞哥电玩城 8 角色诊断场景
 *
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色 ≥ 2 诊断场景（诊断生命周期、诊断统计、边界、异常）
 * 覆盖: DiagnosisEntity, DiagnosisBatch 类型合约 + 诊断业务场景
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiExecutionStatus } from '@m5/domain'
import type {
  DiagnosisEntity,
  DiagnosisBatch,
  Diagnosis,
} from './ai-rule-engine.entity'

// ── 8 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ════════════════════════════════════════════════════════════════
// 👔 店长 — 诊断全局监控
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.StoreManager} 诊断视角`, () => {
  it('店长查看全局诊断统计：批量诊断风险分布与 match rate 正确', () => {
    const batch: DiagnosisBatch = {
      batchId: 'batch-store-daily-0711',
      engineId: 'engine-fraud-v1',
      totalDiagnoses: 100,
      matchedDiagnoses: 68,
      matchRate: 0.68,
      riskDistribution: { low: 32, medium: 35, high: 25, critical: 8 },
      avgEvaluationDurationMs: 15,
      diagnoses: [],
      createdAt: '2026-07-11T05:00:00.000Z',
      triggeredBy: 'store-mgr-001',
      tenantId: 't-cyber-001',
    }
    assert.equal(batch.matchRate, 0.68)
    const sum = Object.values(batch.riskDistribution).reduce((a, b) => a + b, 0)
    assert.equal(sum, batch.totalDiagnoses)
  })

  it('店长查看单店诊断详情：成功诊断含完整快照', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-store-cyber-001',
      engineId: 'engine-fraud-v1',
      scenarioId: 'scenario-daily-store-audit',
      status: AiExecutionStatus.Succeeded,
      matchedRuleIds: ['rule-spike-amount', 'rule-high-freq'],
      matchedConditionIds: ['cond-amount-gt-50k', 'cond-freq-gt-10'],
      triggeredActionIds: ['action-flag-anomaly'],
      riskLevel: 'high',
      recommendation: '建议加强大额交易人工审核',
      promptSummary: 'amount=60000, freq=12/min, device=dev-galaxy-ms01',
      inputSnapshot: { amount: 60000, frequency: 12, deviceId: 'dev-galaxy-ms01' },
      outputSnapshot: { matched: true, risk: 'high', triggeredRules: 2 },
      evaluationDurationMs: 18,
      createdAt: '2026-07-11T04:30:00.000Z',
      completedAt: '2026-07-11T04:30:00.018Z',
      tenantId: 't-cyber-001',
      requestedBy: 'audit-bot',
    }
    assert.equal(entity.status, AiExecutionStatus.Succeeded)
    assert.equal(entity.matchedRuleIds.length, 2)
    assert.equal(entity.riskLevel, 'high')
    assert.ok(entity.completedAt)
    assert.ok(entity.inputSnapshot!.amount !== undefined)
  })

  it('店长查看零异常门店的诊断统计：全部 LOW', () => {
    const batch: DiagnosisBatch = {
      batchId: 'batch-clean-store',
      engineId: 'engine-fraud-v1',
      totalDiagnoses: 50,
      matchedDiagnoses: 0,
      matchRate: 0,
      riskDistribution: { low: 50, medium: 0, high: 0, critical: 0 },
      avgEvaluationDurationMs: 5,
      diagnoses: [],
      createdAt: '2026-07-11T04:00:00.000Z',
      triggeredBy: 'system',
      tenantId: 't-hou-002',
    }
    assert.equal(batch.matchedDiagnoses, 0)
    assert.equal(batch.matchRate, 0)
    assert.equal(batch.riskDistribution.low, batch.totalDiagnoses)
  })
})

// ════════════════════════════════════════════════════════════════
// 🛒 前台 — 收银诊断
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.FrontDesk} 诊断视角`, () => {
  it('前台收银异常的诊断记录：大量退款触发的诊断项', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-cashier-refund-spree',
      engineId: 'engine-fraud-v1',
      scenarioId: 'scenario-cashier-anomaly',
      status: AiExecutionStatus.Succeeded,
      matchedRuleIds: ['rule-excessive-refund'],
      matchedConditionIds: ['cond-refund-gt-5k'],
      triggeredActionIds: ['action-hold-transaction'],
      riskLevel: 'critical',
      recommendation: '立即冻结该收银会话，通知安监审查',
      promptSummary: 'refundAmount=12000, count=15 in 30min',
      inputSnapshot: { refundAmount: 12000, refundCount: 15, windowMinutes: 30 },
      outputSnapshot: { hold: true, risk: 'critical' },
      evaluationDurationMs: 22,
      createdAt: '2026-07-11T05:00:00.000Z',
      completedAt: '2026-07-11T05:00:00.022Z',
      tenantId: 't-cyber-001',
      requestedBy: 'cashier-system',
    }
    assert.equal(entity.riskLevel, 'critical')
    assert.equal(entity.scenarioId, 'scenario-cashier-anomaly')
    assert.equal(entity.inputSnapshot!.refundAmount, 12000)
    assert.equal(entity.matchedRuleIds.length, 1)
  })

  it('前台新收银会话无异常诊断为空结果', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-cashier-clean',
      engineId: 'engine-fraud-v1',
      scenarioId: 'scenario-cashier-anomaly',
      status: AiExecutionStatus.Succeeded,
      matchedRuleIds: [],
      matchedConditionIds: [],
      triggeredActionIds: [],
      riskLevel: 'low',
      recommendation: '',
      promptSummary: 'refundAmount=0, count=0',
      inputSnapshot: { refundAmount: 0, refundCount: 0, windowMinutes: 30 },
      outputSnapshot: { hold: false, risk: 'low' },
      evaluationDurationMs: 3,
      createdAt: '2026-07-11T05:05:00.000Z',
      completedAt: '2026-07-11T05:05:00.003Z',
      tenantId: 't-hou-002',
      requestedBy: 'cashier-system',
    }
    assert.equal(entity.matchedRuleIds.length, 0)
    assert.equal(entity.riskLevel, 'low')
    assert.equal(entity.evaluationDurationMs, 3)
  })

  it('前台挂起的诊断项无 completedAt', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-pending-cashier',
      engineId: 'engine-fraud-v1',
      scenarioId: 'scenario-cashier-anomaly',
      status: AiExecutionStatus.Pending,
      matchedRuleIds: [],
      matchedConditionIds: [],
      triggeredActionIds: [],
      riskLevel: 'low',
      recommendation: '',
      promptSummary: '',
      inputSnapshot: {},
      outputSnapshot: {},
      evaluationDurationMs: 0,
      createdAt: '2026-07-11T05:06:00.000Z',
      tenantId: 't-cyber-001',
      requestedBy: 'system',
    }
    assert.equal(entity.status, AiExecutionStatus.Pending)
    assert.equal(entity.completedAt, undefined)
    assert.equal(entity.matchedRuleIds.length, 0)
  })
})

// ════════════════════════════════════════════════════════════════
// 👥 HR — 员工诊断
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.HR} 诊断视角`, () => {
  it('HR 诊断员工权限异常：多次异常登入触发诊断', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-employee-auth-anomaly',
      engineId: 'engine-fraud-v1',
      scenarioId: 'scenario-employee-behavior',
      status: AiExecutionStatus.Succeeded,
      matchedRuleIds: ['rule-auth-anomaly'],
      matchedConditionIds: ['cond-failed-login-gt-10'],
      triggeredActionIds: ['action-suspend-account'],
      riskLevel: 'high',
      recommendation: '建议该员工账户暂时挂起并人工审核',
      promptSummary: 'failedLogins=25 in 1h, lastLoginIP=192.168.1.200',
      inputSnapshot: { failedLogins: 25, windowHours: 1, lastIP: '192.168.1.200' },
      outputSnapshot: { suspended: true, risk: 'high' },
      evaluationDurationMs: 12,
      createdAt: '2026-07-11T03:00:00.000Z',
      completedAt: '2026-07-11T03:00:00.012Z',
      tenantId: 't-cyber-001',
      requestedBy: 'iam-system',
    }
    assert.equal(entity.riskLevel, 'high')
    assert.equal(entity.matchedRuleIds[0], 'rule-auth-anomaly')
    assert.equal(entity.triggeredActionIds[0], 'action-suspend-account')
    assert.ok(entity.completedAt)
  })

  it('HR 批量诊断员工行为趋势：风险分布均匀', () => {
    const batch: DiagnosisBatch = {
      batchId: 'batch-employee-weekly',
      engineId: 'engine-fraud-v1',
      totalDiagnoses: 40,
      matchedDiagnoses: 20,
      matchRate: 0.5,
      riskDistribution: { low: 20, medium: 10, high: 8, critical: 2 },
      avgEvaluationDurationMs: 10,
      diagnoses: [],
      createdAt: '2026-07-11T06:00:00.000Z',
      triggeredBy: 'hr-analytics-bot',
      tenantId: 't-hou-002',
    }
    assert.equal(batch.avgEvaluationDurationMs, 10)
    assert.equal(batch.matchRate, 0.5)
    assert.equal(batch.totalDiagnoses, 40)
    assert.equal(batch.matchedDiagnoses, 20)
  })
})

// ════════════════════════════════════════════════════════════════
// 🔧 安监 — 设备异常诊断
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Safety} 诊断视角`, () => {
  it('安监诊断设备全指标异常：CPU + 内存 + 磁盘全部破坏阈值', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-device-full-breach',
      engineId: 'engine-device-anomaly',
      scenarioId: 'scenario-device-metrics',
      status: AiExecutionStatus.Succeeded,
      matchedRuleIds: ['rule-cpu-spike', 'rule-memory-leak', 'rule-disk-full'],
      matchedConditionIds: ['cond-cpu-gt-90', 'cond-mem-gt-85', 'cond-disk-gt-90'],
      triggeredActionIds: ['action-alert-critical', 'action-escalate'],
      riskLevel: 'critical',
      recommendation: '立即隔离该设备并进行维护',
      promptSummary: 'cpu=98 mem=92 disk=95',
      inputSnapshot: { cpu: 98, memory: 92, disk: 95 },
      outputSnapshot: { isolate: true, severity: 'critical' },
      evaluationDurationMs: 8,
      createdAt: '2026-07-11T04:15:00.000Z',
      completedAt: '2026-07-11T04:15:00.008Z',
      tenantId: 't-cyber-001',
      requestedBy: 'device-monitor',
    }
    assert.equal(entity.riskLevel, 'critical')
    assert.equal(entity.matchedRuleIds.length, 3)
    assert.equal(entity.triggeredActionIds.length, 2)
    assert.ok(entity.recommendation!.includes('隔离'))
  })

  it('安监批量诊断全店设备：异常率超过 50%', () => {
    const batch: DiagnosisBatch = {
      batchId: 'batch-device-store-audit',
      engineId: 'engine-device-anomaly',
      totalDiagnoses: 20,
      matchedDiagnoses: 12,
      matchRate: 0.6,
      riskDistribution: { low: 8, medium: 6, high: 4, critical: 2 },
      avgEvaluationDurationMs: 7,
      diagnoses: [],
      createdAt: '2026-07-11T04:00:00.000Z',
      triggeredBy: 'sec-admin-001',
      tenantId: 't-cyber-001',
    }
    assert.equal(batch.matchedDiagnoses, 12)
    assert.equal(batch.matchRate, 0.6)
    assert.ok(batch.avgEvaluationDurationMs < 10)
    assert.equal(batch.riskDistribution.critical, 2)
  })

  it('安监诊断网络延迟异常：网络→高严重度', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-network-latency',
      engineId: 'engine-device-anomaly',
      scenarioId: 'scenario-device-metrics',
      status: AiExecutionStatus.Succeeded,
      matchedRuleIds: ['rule-network-latency'],
      matchedConditionIds: ['cond-latency-gt-500'],
      triggeredActionIds: ['action-alert-high'],
      riskLevel: 'high',
      recommendation: '检查网络设备并排查带宽占用',
      promptSummary: 'latency=800ms, packetLoss=5%',
      inputSnapshot: { latency: 800, packetLoss: 5 },
      outputSnapshot: { networkIssue: true, severity: 'high' },
      evaluationDurationMs: 5,
      createdAt: '2026-07-11T04:20:00.000Z',
      completedAt: '2026-07-11T04:20:00.005Z',
      tenantId: 't-hou-002',
      requestedBy: 'device-monitor',
    }
    assert.equal(entity.riskLevel, 'high')
    assert.equal(entity.matchedConditionIds[0], 'cond-latency-gt-500')
    assert.equal(entity.triggeredActionIds[0], 'action-alert-high')
  })
})

// ════════════════════════════════════════════════════════════════
// 🎮 导玩员 — 游戏终端诊断
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Guide} 诊断视角`, () => {
  it('导玩员诊断 VR 机台异常：错误率指标触发', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-vr-headset-error',
      engineId: 'engine-device-anomaly',
      scenarioId: 'scenario-gaming-device',
      status: AiExecutionStatus.Succeeded,
      matchedRuleIds: ['rule-high-error-rate'],
      matchedConditionIds: ['cond-error-rate-gt-5'],
      triggeredActionIds: ['action-suggest-maintenance'],
      riskLevel: 'medium',
      recommendation: '建议下机维护 VR 头显设备',
      promptSummary: 'errorRate=8.5, deviceType=VR-Headset',
      inputSnapshot: { errorRate: 8.5, deviceType: 'VR-Headset', uptimeHours: 200 },
      outputSnapshot: { maintenance: true, severity: 'medium' },
      evaluationDurationMs: 6,
      createdAt: '2026-07-11T04:45:00.000Z',
      completedAt: '2026-07-11T04:45:00.006Z',
      tenantId: 't-cyber-001',
      requestedBy: 'guide-001',
    }
    assert.equal(entity.riskLevel, 'medium')
    assert.equal(entity.matchedRuleIds[0], 'rule-high-error-rate')
    assert.equal(entity.triggeredActionIds[0], 'action-suggest-maintenance')
  })

  it('导玩员诊断街机正常运行：无匹配规则', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-arcade-normal',
      engineId: 'engine-device-anomaly',
      scenarioId: 'scenario-gaming-device',
      status: AiExecutionStatus.Succeeded,
      matchedRuleIds: [],
      matchedConditionIds: [],
      triggeredActionIds: [],
      riskLevel: 'low',
      recommendation: '',
      promptSummary: 'cpu=30 mem=40 errorRate=0.1',
      inputSnapshot: { cpu: 30, memory: 40, errorRate: 0.1 },
      outputSnapshot: { healthy: true },
      evaluationDurationMs: 2,
      createdAt: '2026-07-11T04:50:00.000Z',
      completedAt: '2026-07-11T04:50:00.002Z',
      tenantId: 't-cyber-001',
      requestedBy: 'guide-001',
    }
    assert.equal(entity.matchedRuleIds.length, 0)
    assert.equal(entity.riskLevel, 'low')
    assert.equal(entity.evaluationDurationMs, 2)
  })
})

// ════════════════════════════════════════════════════════════════
// 🎯 运行专员 — 诊断生命周期运维
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Ops} 诊断视角`, () => {
  it('运行专员查看诊断批量统计：高性能门店设备平均诊断耗时 ≤ 10ms', () => {
    const batch: DiagnosisBatch = {
      batchId: 'batch-perf-ops',
      engineId: 'engine-device-anomaly',
      totalDiagnoses: 200,
      matchedDiagnoses: 45,
      matchRate: 0.225,
      riskDistribution: { low: 155, medium: 25, high: 12, critical: 8 },
      avgEvaluationDurationMs: 8,
      diagnoses: [],
      createdAt: '2026-07-11T05:30:00.000Z',
      triggeredBy: 'ops-bot',
      tenantId: 't-cyber-001',
    }
    assert.equal(batch.avgEvaluationDurationMs, 8)
    assert.ok(batch.avgEvaluationDurationMs <= 10)
    assert.equal(batch.totalDiagnoses, 200)
    assert.equal(batch.matchedDiagnoses, 45)
    const sumDist = Object.values(batch.riskDistribution).reduce((a, b) => a + b, 0)
    assert.equal(sumDist, batch.totalDiagnoses)
  })

  it('运行专员处理失败诊断的状态回填：Pending → Failed', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-timed-out',
      engineId: 'engine-fraud-v1',
      scenarioId: 'scenario-high-throughput',
      status: AiExecutionStatus.Failed,
      matchedRuleIds: [],
      matchedConditionIds: [],
      triggeredActionIds: [],
      riskLevel: 'low',
      recommendation: '诊断超时，建议重试',
      promptSummary: 'timeout=30s',
      inputSnapshot: { amount: 500000, frequency: 100 },
      outputSnapshot: {},
      evaluationDurationMs: 30000,
      createdAt: '2026-07-11T04:00:00.000Z',
      completedAt: '2026-07-11T04:00:30.000Z',
      tenantId: 't-cyber-001',
      requestedBy: 'ops-bot',
    }
    assert.equal(entity.status, AiExecutionStatus.Failed)
    assert.equal(entity.matchedRuleIds.length, 0)
    assert.equal(entity.evaluationDurationMs, 30000)
    assert.equal(entity.recommendation, '诊断超时，建议重试')
  })

  it('运行专员验证诊断风险分布求和一致性：多次批量全匹配', () => {
    const batches: DiagnosisBatch[] = [
      {
        batchId: 'b1', engineId: 'e1', totalDiagnoses: 100, matchedDiagnoses: 100,
        matchRate: 1, riskDistribution: { low: 0, medium: 0, high: 50, critical: 50 },
        avgEvaluationDurationMs: 12, diagnoses: [], createdAt: '2026-07-11T00:00:00.000Z',
        triggeredBy: 'sys', tenantId: 't-001',
      },
      {
        batchId: 'b2', engineId: 'e1', totalDiagnoses: 50, matchedDiagnoses: 0,
        matchRate: 0, riskDistribution: { low: 50, medium: 0, high: 0, critical: 0 },
        avgEvaluationDurationMs: 3, diagnoses: [], createdAt: '2026-07-11T01:00:00.000Z',
        triggeredBy: 'sys', tenantId: 't-001',
      },
    ]
    for (const batch of batches) {
      const sum = Object.values(batch.riskDistribution).reduce((a, b) => a + b, 0)
      assert.equal(sum, batch.totalDiagnoses)
    }
  })
})

// ════════════════════════════════════════════════════════════════
// 🤝 团建 — 活动团队诊断
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Teambuilding} 诊断视角`, () => {
  it('团建专员诊断活动场地设备：H 店音响系统 CPU 偏高', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-teambuilding-sound',
      engineId: 'engine-device-anomaly',
      scenarioId: 'scenario-event-equipment',
      status: AiExecutionStatus.Succeeded,
      matchedRuleIds: ['rule-cpu-spike'],
      matchedConditionIds: ['cond-cpu-gt-90'],
      triggeredActionIds: ['action-less-urgent-notice'],
      riskLevel: 'medium',
      recommendation: '活动前重启音响控制系统，释放 CPU 负载',
      promptSummary: 'cpu=93 device=sound-system',
      inputSnapshot: { cpu: 93, deviceType: 'sound-system', eventTime: '2026-07-11T14:00' },
      outputSnapshot: { restartRecommended: true, severity: 'medium' },
      evaluationDurationMs: 7,
      createdAt: '2026-07-11T06:00:00.000Z',
      completedAt: '2026-07-11T06:00:00.007Z',
      tenantId: 't-hou-002',
      requestedBy: 'teambuilding-ops',
    }
    assert.equal(entity.riskLevel, 'medium')
    assert.equal(entity.recommendation!.includes('重启'), true)
    assert.equal(entity.inputSnapshot!.cpu, 93)
  })

  it('团建专员评估团队支付风险诊断：无异常', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-teambuilding-payment',
      engineId: 'engine-fraud-v1',
      scenarioId: 'scenario-group-payment',
      status: AiExecutionStatus.Succeeded,
      matchedRuleIds: [],
      matchedConditionIds: [],
      triggeredActionIds: [],
      riskLevel: 'low',
      recommendation: '',
      promptSummary: 'totalMembers=25, totalAmount=3000',
      inputSnapshot: { members: 25, totalAmount: 3000, avgPerPerson: 120 },
      outputSnapshot: { safe: true },
      evaluationDurationMs: 4,
      createdAt: '2026-07-11T06:10:00.000Z',
      completedAt: '2026-07-11T06:10:00.004Z',
      tenantId: 't-cyber-001',
      requestedBy: 'teambooking-system',
    }
    assert.equal(entity.matchedRuleIds.length, 0)
    assert.equal(entity.riskLevel, 'low')
    assert.equal(entity.inputSnapshot!.avgPerPerson, 120)
  })
})

// ════════════════════════════════════════════════════════════════
// 📢 营销 — 营销活动诊断
// ════════════════════════════════════════════════════════════════
describe(`${ROLES.Marketing} 诊断视角`, () => {
  it('营销专员诊断大额优惠券异常发放', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-coupon-abnormal',
      engineId: 'engine-fraud-v1',
      scenarioId: 'scenario-campaign-risk',
      status: AiExecutionStatus.Succeeded,
      matchedRuleIds: ['rule-coupon-abuse'],
      matchedConditionIds: ['cond-single-user-multi-coupon'],
      triggeredActionIds: ['action-flag-for-review'],
      riskLevel: 'medium',
      recommendation: '该用户在 1h 内领取 10 张优惠券，建议核查',
      promptSummary: 'userId=mem-001, couponCount=10 in 1h',
      inputSnapshot: { userId: 'mem-001', couponCount: 10, windowHours: 1 },
      outputSnapshot: { flagged: true, reason: 'multi-coupon-abuse' },
      evaluationDurationMs: 9,
      createdAt: '2026-07-11T05:30:00.000Z',
      completedAt: '2026-07-11T05:30:00.009Z',
      tenantId: 't-cyber-001',
      requestedBy: 'campaign-system',
    }
    assert.equal(entity.riskLevel, 'medium')
    assert.equal(entity.inputSnapshot!.couponCount, 10)
    assert.equal(entity.recommendation!.includes('核查'), true)
    assert.equal(entity.matchedRuleIds[0], 'rule-coupon-abuse')
  })

  it('营销专员诊断正常活动：无风险', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-campaign-clean',
      engineId: 'engine-fraud-v1',
      scenarioId: 'scenario-campaign-risk',
      status: AiExecutionStatus.Succeeded,
      matchedRuleIds: [],
      matchedConditionIds: [],
      triggeredActionIds: [],
      riskLevel: 'low',
      recommendation: '',
      promptSummary: 'campaign=spring-sale, couponsIssued=50, refundRate=0.02',
      inputSnapshot: { campaign: 'spring-sale', couponsIssued: 50, refundRate: 0.02 },
      outputSnapshot: { safe: true, score: 2 },
      evaluationDurationMs: 3,
      createdAt: '2026-07-11T05:45:00.000Z',
      completedAt: '2026-07-11T05:45:00.003Z',
      tenantId: 't-hou-002',
      requestedBy: 'campaign-system',
    }
    assert.equal(entity.matchedRuleIds.length, 0)
    assert.equal(entity.riskLevel, 'low')
    assert.equal(entity.outputSnapshot!.score, 2)
  })

  it('营销专员诊断活动门店设备批量风险：多店汇总', () => {
    const batch: DiagnosisBatch = {
      batchId: 'batch-campaign-store-check',
      engineId: 'engine-device-anomaly',
      totalDiagnoses: 30,
      matchedDiagnoses: 8,
      matchRate: 0.267,
      riskDistribution: { low: 22, medium: 5, high: 2, critical: 1 },
      avgEvaluationDurationMs: 6,
      diagnoses: [],
      createdAt: '2026-07-11T05:00:00.000Z',
      triggeredBy: 'campaign-bot',
      tenantId: 't-cyber-001',
    }
    assert.equal(batch.matchRate, 0.267)
    assert.equal(batch.riskDistribution.critical, 1)
    assert.equal(batch.avgEvaluationDurationMs, 6)
    const sumDist = Object.values(batch.riskDistribution).reduce((a, b) => a + b, 0)
    assert.equal(sumDist, batch.totalDiagnoses)
  })
})

// ════════════════════════════════════════════════════════════════
// 诊断生命周期边界测试
// ════════════════════════════════════════════════════════════════
describe('诊断生命周期边界场景', () => {
  it('Pending 诊断无 completedAt、无 matchedRuleIds', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-pending-edge',
      engineId: 'engine-fraud-v1',
      scenarioId: 'scenario-edge-case',
      status: AiExecutionStatus.Pending,
      matchedRuleIds: [],
      matchedConditionIds: [],
      triggeredActionIds: [],
      riskLevel: 'low',
      recommendation: '',
      promptSummary: '',
      inputSnapshot: {},
      outputSnapshot: {},
      evaluationDurationMs: 0,
      createdAt: '2026-07-11T05:00:00.000Z',
      tenantId: 't-001',
      requestedBy: 'system',
    }
    assert.equal(entity.status, AiExecutionStatus.Pending)
    assert.equal(entity.completedAt, undefined)
    assert.equal(entity.evaluationDurationMs, 0)
  })

  it('Diagnosis 短接口 (无快照) 满足基本字段', () => {
    const diag: Diagnosis = {
      diagnosisId: 'diag-minimal',
      engineId: 'engine-fraud-v1',
      scenarioId: 'scenario-quick',
      status: AiExecutionStatus.Succeeded,
      riskLevel: 'low',
      matchedRuleIds: [],
      matchedConditionIds: [],
      triggeredActionIds: [],
      evaluationDurationMs: 1,
      createdAt: '2026-07-11T06:00:00.000Z',
      completedAt: '2026-07-11T06:00:00.001Z',
      tenantId: 't-001',
      requestedBy: 'system',
    }
    assert.equal(diag.diagnosisId, 'diag-minimal')
    assert.equal(diag.riskLevel, 'low')
    assert.ok(diag.completedAt)
    // Diagnosis 没有 promptSummary/inputSnapshot/outputSnapshot
    assert.equal((diag as any).promptSummary, undefined)
  })

  it('Batch 全匹配分布和 total 一致', () => {
    const batch: DiagnosisBatch = {
      batchId: 'batch-all-matched',
      engineId: 'engine-fraud-v1',
      totalDiagnoses: 100,
      matchedDiagnoses: 100,
      matchRate: 1,
      riskDistribution: { low: 0, medium: 20, high: 50, critical: 30 },
      avgEvaluationDurationMs: 15,
      diagnoses: [],
      createdAt: '2026-07-11T06:00:00.000Z',
      triggeredBy: 'audit',
      tenantId: 't-001',
    }
    const sum = Object.values(batch.riskDistribution).reduce((a, b) => a + b, 0)
    assert.equal(sum, batch.totalDiagnoses)
    assert.equal(batch.matchRate, 1)
  })

  it('Batch 全不匹配时 matchRate 为 0', () => {
    const batch: DiagnosisBatch = {
      batchId: 'batch-none-matched',
      engineId: 'engine-fraud-v1',
      totalDiagnoses: 60,
      matchedDiagnoses: 0,
      matchRate: 0,
      riskDistribution: { low: 60, medium: 0, high: 0, critical: 0 },
      avgEvaluationDurationMs: 2,
      diagnoses: [],
      createdAt: '2026-07-11T06:05:00.000Z',
      triggeredBy: 'audit',
      tenantId: 't-001',
    }
    assert.equal(batch.matchRate, 0)
    assert.equal(batch.matchedDiagnoses, 0)
    const sum = Object.values(batch.riskDistribution).reduce((a, b) => a + b, 0)
    assert.equal(sum, batch.totalDiagnoses)
  })

  it('诊断推荐为空的边界', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-no-recommendation',
      engineId: 'engine-fraud-v1',
      scenarioId: 'scenario-no-op',
      status: AiExecutionStatus.Succeeded,
      matchedRuleIds: [],
      matchedConditionIds: [],
      triggeredActionIds: [],
      riskLevel: 'low',
      recommendation: '',
      promptSummary: '',
      inputSnapshot: {},
      outputSnapshot: {},
      evaluationDurationMs: 0,
      createdAt: '2026-07-11T06:10:00.000Z',
      completedAt: '2026-07-11T06:10:00.000Z',
      tenantId: 't-001',
      requestedBy: 'system',
    }
    assert.equal(entity.recommendation, '')
    assert.equal(entity.matchedRuleIds.length, 0)
  })

  it('诊断 createdBy 与 requestedBy 为 system 的自动化场景', () => {
    const entity: DiagnosisEntity = {
      diagnosisId: 'diag-auto-system',
      engineId: 'engine-device-anomaly',
      scenarioId: 'scenario-auto-scan',
      status: AiExecutionStatus.Succeeded,
      matchedRuleIds: ['rule-disk-full'],
      matchedConditionIds: ['cond-disk-gt-90'],
      triggeredActionIds: ['action-auto-cleanup'],
      riskLevel: 'medium',
      recommendation: '自动执行日志清理，释放磁盘空间',
      promptSummary: 'disk=94 threshold=90',
      inputSnapshot: { disk: 94 },
      outputSnapshot: { cleanupTriggered: true },
      evaluationDurationMs: 5,
      createdAt: '2026-07-11T05:55:00.000Z',
      completedAt: '2026-07-11T05:55:00.005Z',
      tenantId: 't-hou-002',
      requestedBy: 'system',
    }
    assert.equal(entity.requestedBy, 'system')
    assert.equal(entity.triggeredActionIds[0], 'action-auto-cleanup')
    assert.equal(entity.outputSnapshot!.cleanupTriggered, true)
  })
})
