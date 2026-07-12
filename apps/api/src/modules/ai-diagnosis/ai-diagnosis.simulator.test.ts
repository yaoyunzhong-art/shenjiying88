// @ts-nocheck
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [ai-diagnosis] simulator 诊断模拟测试
 * 
 * 模拟 AI 诊断模块在各种场景下的行为
 * 覆盖：正常诊断流程、批量创建、风险分级、边缘场景
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiDiagnosisService } from './ai-diagnosis.service'
import { AiDiagnosisController } from './ai-diagnosis.controller'

// ── 模拟服务工厂 ──
function createSimulator() {
  AiDiagnosisService.resetStores()
  AiDiagnosisService.resetStores()
  const service = new AiDiagnosisService()
  const controller = new AiDiagnosisController(service)
  return { service, controller }
}

// ── 常用测试数据 ──
const TENANT_A = 'T-sim-001'
const ENGINE_A = 'engine-member-level'
const ENGINE_B = 'engine-device-anomaly'

// ── 场景 1: 单次诊断模拟 ──
describe('[Simulator] 单次诊断模拟', () => {
  it('创建 PENDING 诊断 — 正常流程', () => {
    const { controller: ctrl } = createSimulator()

    const result = ctrl.create({
      engineId: ENGINE_A,
      scenarioId: 'svip-flash-eval',
      tenantId: TENANT_A,
      requestedBy: 'sim-user',
      promptSummary: 'SVIP 快速评估模拟',
      inputSnapshot: { memberId: 'mem-001', totalSpend: 25000 }
    })

    const diag = result.diagnosis
    assert.ok(diag.diagnosisId.startsWith('diag-'))
    assert.equal(diag.engineId, ENGINE_A)
    assert.equal(diag.scenarioId, 'svip-flash-eval')
    assert.equal(diag.status, 'PENDING')
    assert.equal(diag.riskLevel, 'low')
    assert.equal(diag.recommendation, '')
    assert.deepEqual(diag.inputSnapshot, { memberId: 'mem-001', totalSpend: 25000 })
    assert.equal(diag.tenantId, TENANT_A)
    assert.equal(diag.requestedBy, 'sim-user')
    assert.ok(Date.parse(diag.createdAt) > 0)
    assert.ok(diag.evaluationDurationMs === 0)
  })

  it('更新诊断为 COMPLETED — 自动填充完成时间', () => {
    const { controller: ctrl } = createSimulator()
    const created = ctrl.create({
      engineId: ENGINE_A,
      scenarioId: 'eval-001',
      tenantId: TENANT_A,
      requestedBy: 'sim-user'
    })

    const result = ctrl.update(created.diagnosis.diagnosisId, {
      status: 'COMPLETED',
      riskLevel: 'high',
      recommendation: '规则触发，建议升级会员等级'
    })

    assert.equal(result.diagnosis.status, 'COMPLETED')
    assert.equal(result.diagnosis.riskLevel, 'high')
    assert.equal(result.diagnosis.recommendation, '规则触发，建议升级会员等级')
    assert.ok(Date.parse(result.diagnosis.completedAt!) > 0)
    assert.ok(Date.parse(result.diagnosis.completedAt!) >= Date.parse(result.diagnosis.createdAt))
  })

  it('更新诊断为 FAILED — completedAt 也会填充', () => {
    const { controller: ctrl } = createSimulator()
    const created = ctrl.create({
      engineId: ENGINE_A,
      scenarioId: 'eval-fail',
      tenantId: TENANT_A,
      requestedBy: 'sim-user'
    })

    const result = ctrl.update(created.diagnosis.diagnosisId, {
      status: 'FAILED',
      recommendation: '引擎超时，请检查配置'
    })

    assert.equal(result.diagnosis.status, 'FAILED')
    assert.ok(Date.parse(result.diagnosis.completedAt!) > 0)
  })

  it('删除诊断 — 已删除的诊断无法获取', () => {
    const { controller: ctrl } = createSimulator()
    const created = ctrl.create({
      engineId: ENGINE_A,
      scenarioId: 'to-delete',
      tenantId: TENANT_A,
      requestedBy: 'sim-user'
    })

    const diagId = created.diagnosis.diagnosisId
    // 删除前可获取
    const beforeDelete = ctrl.get(diagId)
    assert.equal(beforeDelete.diagnosis.diagnosisId, diagId)

    // 删除
    ctrl.remove(diagId)

    // 删除后应抛出 NotFoundException
    assert.throws(
      () => ctrl.get(diagId),
      (err: any) => err.name === 'NotFoundException' || err.status === 404
    )
  })
})

// ── 场景 2: 批量诊断模拟 ──
describe('[Simulator] 批量诊断模拟', () => {
  it('创建批量诊断 — 3 个场景自动完成', () => {
    const { controller: ctrl } = createSimulator()

    const result = ctrl.createBatch({
      engineId: ENGINE_A,
      scenarioIds: ['s1-normal', 's2-normal', 's3-normal'],
      tenantId: TENANT_A,
      triggeredBy: 'ops-sim'
    })

    assert.equal(result.batch.totalDiagnoses, 3)
    assert.equal(result.batch.matchedDiagnoses, 0) // 没有包含 critical/high 关键字的场景
    assert.equal(result.batch.matchRate, 0)
    assert.equal(result.batch.engineId, ENGINE_A)
    assert.equal(result.batch.tenantId, TENANT_A)
    assert.equal(result.batch.triggeredBy, 'ops-sim')
    assert.ok(result.batch.batchId.startsWith('batch-'))
    assert.ok(Date.parse(result.batch.createdAt) > 0)

    const { low, medium, high, critical } = result.batch.riskDistribution
    assert.equal(low, 3)
    assert.equal(medium, 0)
    assert.equal(high, 0)
    assert.equal(critical, 0)

    // 所有诊断都已完成
    for (const d of result.batch.diagnoses) {
      assert.equal(d.status, 'COMPLETED')
      assert.equal(d.riskLevel, 'low')
      assert.equal(d.matchedRuleIds.length, 0)
      assert.ok(d.evaluationDurationMs > 0)
    }
  })

  it('批量诊断 — 含 critical 场景触发高风险', () => {
    const { controller: ctrl } = createSimulator()

    const result = ctrl.createBatch({
      engineId: ENGINE_B,
      scenarioIds: ['s1', 'critical-event-1', 'high-risk-alert', 's4'],
      tenantId: TENANT_A,
      triggeredBy: 'ops-sim'
    })

    assert.equal(result.batch.totalDiagnoses, 4)
    assert.equal(result.batch.matchedDiagnoses, 2) // critical-event-1, high-risk-alert
    assert.ok(result.batch.matchRate > 0)

    const { low, high } = result.batch.riskDistribution
    assert.equal(low, 2)
    assert.equal(high, 2)

    const highDiag = result.batch.diagnoses.filter((d: any) => d.riskLevel === 'high')
    assert.equal(highDiag.length, 2)
    for (const d of highDiag) {
      assert.ok(d.matchedRuleIds.includes(ENGINE_B))
      assert.ok(d.matchedConditionIds.includes('cond-risk-high'))
      assert.ok(d.triggeredActionIds.includes('act-alert'))
      assert.deepEqual(d.outputSnapshot, { riskScore: 85 })
    }
  })

  it('批量诊断 — 包含 "critical+" 前缀变体', () => {
    const { controller: ctrl } = createSimulator()

    const result = ctrl.createBatch({
      engineId: ENGINE_B,
      scenarioIds: ['critical-alert-1', 'critical-reboot', 'normal'],
      tenantId: TENANT_A,
      triggeredBy: 'ops-sim'
    })

    assert.equal(result.batch.totalDiagnoses, 3)
    // "critical-alert-1" 和 "critical-reboot" 都包含 "critical"
    assert.equal(result.batch.matchedDiagnoses, 2)
    assert.equal(result.batch.riskDistribution.low, 1)
    assert.equal(result.batch.riskDistribution.high, 2)
  })

  it('批量诊断 — 空场景列表（边界）', () => {
    const { controller: ctrl } = createSimulator()

    const result = ctrl.createBatch({
      engineId: ENGINE_A,
      scenarioIds: [],
      tenantId: TENANT_A,
      triggeredBy: 'ops-sim'
    })

    assert.equal(result.batch.totalDiagnoses, 0)
    assert.equal(result.batch.matchedDiagnoses, 0)
    assert.equal(result.batch.matchRate, 0)
    assert.equal(result.batch.avgEvaluationDurationMs, 0)
    assert.deepEqual(result.batch.riskDistribution, { low: 0, medium: 0, high: 0, critical: 0 })
    assert.equal(result.batch.diagnoses.length, 0)
  })
})

// ── 场景 3: 诊断检索与过滤模拟 ──
describe('[Simulator] 诊断检索与过滤模拟', () => {
  it('按 engineId 过滤 — 只返回指定引擎的诊断', () => {
    const { controller: ctrl } = createSimulator()
    // 创建2个不同引擎的诊断
    ctrl.create({ engineId: ENGINE_A, scenarioId: 's1', tenantId: TENANT_A, requestedBy: 'sim' })
    ctrl.create({ engineId: ENGINE_B, scenarioId: 's2', tenantId: TENANT_A, requestedBy: 'sim' })
    ctrl.create({ engineId: ENGINE_A, scenarioId: 's3', tenantId: TENANT_A, requestedBy: 'sim' })

    const result = ctrl.list({ engineId: ENGINE_A })
    assert.equal(result.total, 2)
    for (const d of result.diagnoses) {
      assert.equal(d.engineId, ENGINE_A)
    }

    const resultB = ctrl.list({ engineId: ENGINE_B })
    assert.equal(resultB.total, 1)
  })

  it('按状态过滤 — 只返回 PENDING 诊断', () => {
    const { controller: ctrl } = createSimulator()
    const d1 = ctrl.create({ engineId: ENGINE_A, scenarioId: 's1', tenantId: TENANT_A, requestedBy: 'sim' })
    const d2 = ctrl.create({ engineId: ENGINE_A, scenarioId: 's2', tenantId: TENANT_A, requestedBy: 'sim' })

    ctrl.update(d1.diagnosis.diagnosisId, { status: 'COMPLETED' })
    // d2 仍为 PENDING

    const result = ctrl.list({ status: 'PENDING' })
    assert.equal(result.total, 1)
    assert.equal(result.diagnoses[0].diagnosisId, d2.diagnosis.diagnosisId)

    const compResult = ctrl.list({ status: 'COMPLETED' })
    assert.equal(compResult.total, 1)
    assert.equal(compResult.diagnoses[0].diagnosisId, d1.diagnosis.diagnosisId)
  })

  it('按风险等级过滤', () => {
    const { controller: ctrl } = createSimulator()
    const d1 = ctrl.create({ engineId: ENGINE_A, scenarioId: 's1', tenantId: TENANT_A, requestedBy: 'sim' })
    const d2 = ctrl.create({ engineId: ENGINE_A, scenarioId: 's2', tenantId: TENANT_A, requestedBy: 'sim' })

    ctrl.update(d1.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'critical' })
    ctrl.update(d2.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'low' })

    const result = ctrl.list({ riskLevel: 'critical' })
    assert.equal(result.total, 1)
    assert.equal(result.diagnoses[0].riskLevel, 'critical')

    const lowResult = ctrl.list({ riskLevel: 'low' })
    assert.equal(lowResult.total, 1)
  })

  it('按 tenantId 过滤 — 租户隔离', () => {
    const { controller: ctrl } = createSimulator()
    ctrl.create({ engineId: ENGINE_A, scenarioId: 's1', tenantId: 'T-a', requestedBy: 'sim' })
    ctrl.create({ engineId: ENGINE_A, scenarioId: 's2', tenantId: 'T-b', requestedBy: 'sim' })
    ctrl.create({ engineId: ENGINE_A, scenarioId: 's3', tenantId: 'T-a', requestedBy: 'sim' })

    const result = ctrl.list({ tenantId: 'T-a' })
    assert.equal(result.total, 2)
    for (const d of result.diagnoses) {
      assert.equal(d.tenantId, 'T-a')
    }

    const resultB = ctrl.list({ tenantId: 'T-b' })
    assert.equal(resultB.total, 1)
  })

  it('无过滤条件 — 返回全部诊断按时间降序', () => {
    const { controller: ctrl } = createSimulator()
    ctrl.create({ engineId: ENGINE_A, scenarioId: 's1', tenantId: TENANT_A, requestedBy: 'sim' })
    ctrl.create({ engineId: ENGINE_A, scenarioId: 's2', tenantId: TENANT_A, requestedBy: 'sim' })

    const result = ctrl.list({})
    assert.equal(result.total, 2)

    // 较新的在前面
    const t1 = Date.parse(result.diagnoses[0].createdAt)
    const t2 = Date.parse(result.diagnoses[1].createdAt)
    assert.ok(t1 >= t2)
  })

  it('获取不存在的诊断抛出 NotFoundException（边界）', () => {
    const { controller: ctrl } = createSimulator()
    assert.throws(
      () => ctrl.get('diag-nonexistent'),
      (err: any) => err.name === 'NotFoundException' || err.status === 404
    )
  })

  it('删除不存在的诊断返回 false（边界）', () => {
    const { controller: ctrl } = createSimulator()
    // deleteDiagnosis 内部调用 diagnoses.delete 返回 boolean
    // controller 层面会抛出 NotFoundException
    assert.throws(
      () => ctrl.remove('diag-nonexistent'),
      (err: any) => err.name === 'NotFoundException' || err.status === 404
    )
  })
})

// ── 场景 4: 风险报告模拟 ──
describe('[Simulator] 风险报告模拟', () => {
  it('生成风险报告 — 含多风险等级', () => {
    const { controller: ctrl } = createSimulator()
    // 创建不同风险等级的诊断
    ctrl.create({ engineId: ENGINE_A, scenarioId: 's1', tenantId: TENANT_A, requestedBy: 'sim' })
    const d2 = ctrl.create({ engineId: ENGINE_A, scenarioId: 's2', tenantId: TENANT_A, requestedBy: 'sim' })
    const d3 = ctrl.create({ engineId: ENGINE_A, scenarioId: 's3', tenantId: TENANT_A, requestedBy: 'sim' })

    // 更新风险等级
    ctrl.update(d2.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'high', recommendation: '高风险，需立即处理' })
    ctrl.update(d3.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'critical', recommendation: '危急：系统异常' })

    const report = ctrl.riskReport(undefined, TENANT_A)
    assert.equal(report.totalEvaluated, 3)
    assert.equal(report.riskDistribution.low, 1)
    assert.equal(report.riskDistribution.high, 1)
    assert.equal(report.riskDistribution.critical, 1)
    assert.equal(report.riskDistribution.medium, 0)

    // topRecommendations 应包含 critical 和 high 级别的
    assert.ok(report.topRecommendations.length >= 2)
    const topCritical = report.topRecommendations[0]
    assert.equal(topCritical.riskLevel, 'critical')
    assert.equal(topCritical.recommendation, '危急：系统异常')

    assert.ok(report.averageEvaluationDurationMs >= 0)
    assert.ok(Date.parse(report.generatedAt) > 0)
  })

  it('风险报告 — 空存储时返回默认值（边界）', () => {
    const { controller: ctrl } = createSimulator()

    const report = ctrl.riskReport(undefined, TENANT_A)
    assert.equal(report.totalEvaluated, 0)
    assert.deepEqual(report.riskDistribution, { low: 0, medium: 0, high: 0, critical: 0 })
    assert.equal(report.topRecommendations.length, 0)
    assert.equal(report.averageEvaluationDurationMs, 0)
    assert.ok(Date.parse(report.generatedAt) > 0)
  })

  it('风险报告 — 按 engineId 过滤', () => {
    const { controller: ctrl } = createSimulator()
    ctrl.create({ engineId: ENGINE_A, scenarioId: 's1', tenantId: TENANT_A, requestedBy: 'sim' })
    ctrl.create({ engineId: ENGINE_B, scenarioId: 's2', tenantId: TENANT_A, requestedBy: 'sim' })
    ctrl.create({ engineId: ENGINE_B, scenarioId: 's3', tenantId: TENANT_A, requestedBy: 'sim' })

    const report = ctrl.riskReport(ENGINE_A, TENANT_A)
    assert.equal(report.totalEvaluated, 1)

    const reportB = ctrl.riskReport(ENGINE_B, TENANT_A)
    assert.equal(reportB.totalEvaluated, 2)
  })

  it('风险报告 — topRecommendations 按严重程度排序,最多10条', () => {
    const { controller: ctrl } = createSimulator()
    // 创建15条高风险诊断
    for (let i = 0; i < 5; i++) {
      const d = ctrl.create({ engineId: ENGINE_A, scenarioId: `high-${i}`, tenantId: TENANT_A, requestedBy: 'sim' })
      ctrl.update(d.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'high', recommendation: `High risk #${i}` })
    }
    for (let i = 0; i < 8; i++) {
      const d = ctrl.create({ engineId: ENGINE_A, scenarioId: `crit-${i}`, tenantId: TENANT_A, requestedBy: 'sim' })
      ctrl.update(d.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'critical', recommendation: `Critical #${i}` })
    }
    for (let i = 0; i < 3; i++) {
      const d = ctrl.create({ engineId: ENGINE_A, scenarioId: `low-${i}`, tenantId: TENANT_A, requestedBy: 'sim' })
      ctrl.update(d.diagnosis.diagnosisId, { status: 'COMPLETED', riskLevel: 'low', recommendation: `Low #${i}` })
    }

    const report = ctrl.riskReport(undefined, TENANT_A)
    assert.equal(report.totalEvaluated, 16)
    assert.equal(report.riskDistribution.high, 5)
    assert.equal(report.riskDistribution.critical, 8)
    assert.equal(report.riskDistribution.low, 3)

    // 最多返回10条
    assert.ok(report.topRecommendations.length <= 10)
    // critical 排在 high 前面
    for (let i = 1; i < report.topRecommendations.length; i++) {
      const prev = report.topRecommendations[i - 1].riskLevel
      const curr = report.topRecommendations[i].riskLevel
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      assert.ok((order as any)[prev] <= (order as any)[curr])
    }
  })
})

// ── 场景 5: 批量诊断查询模拟 ──
describe('[Simulator] 批量诊断查询模拟', () => {
  it('获取批量诊断 — 按 batchId 查询', () => {
    const { controller: ctrl } = createSimulator()
    const created = ctrl.createBatch({
      engineId: ENGINE_A,
      scenarioIds: ['s1', 's2'],
      tenantId: TENANT_A,
      triggeredBy: 'sim'
    })

    const result = ctrl.getBatch(created.batch.batchId)
    assert.equal(result.batch.batchId, created.batch.batchId)
    assert.equal(result.batch.totalDiagnoses, 2)
  })

  it('获取不存在的批量诊断 — NotFoundException（边界）', () => {
    const { controller: ctrl } = createSimulator()
    assert.throws(
      () => ctrl.getBatch('batch-nonexistent'),
      (err: any) => err.name === 'NotFoundException' || err.status === 404
    )
  })

  it('列出批量诊断 — 按 engineId 和 tenantId 过滤', () => {
    const { controller: ctrl } = createSimulator()
    ctrl.createBatch({ engineId: ENGINE_A, scenarioIds: ['s1'], tenantId: 'T-a', triggeredBy: 'sim' })
    ctrl.createBatch({ engineId: ENGINE_B, scenarioIds: ['s2'], tenantId: 'T-a', triggeredBy: 'sim' })
    ctrl.createBatch({ engineId: ENGINE_A, scenarioIds: ['s3'], tenantId: 'T-b', triggeredBy: 'sim' })

    const all = ctrl.listBatches(undefined, undefined)
    assert.equal(all.length, 3)

    const engineAResults = ctrl.listBatches(ENGINE_A, undefined)
    assert.equal(engineAResults.length, 2)
    for (const b of engineAResults) {
      assert.equal(b.engineId, ENGINE_A)
    }

    const tenantAResults = ctrl.listBatches(undefined, 'T-a')
    assert.equal(tenantAResults.length, 2)
    for (const b of tenantAResults) {
      assert.equal(b.tenantId, 'T-a')
    }

    const filtered = ctrl.listBatches(ENGINE_A, 'T-a')
    assert.equal(filtered.length, 1)
  })

  it('列出批量诊断 — 按创建时间降序', () => {
    const { controller: ctrl } = createSimulator()
    ctrl.createBatch({ engineId: ENGINE_A, scenarioIds: ['s1'], tenantId: TENANT_A, triggeredBy: 'sim' })
    ctrl.createBatch({ engineId: ENGINE_A, scenarioIds: ['s2'], tenantId: TENANT_A, triggeredBy: 'sim' })
    ctrl.createBatch({ engineId: ENGINE_A, scenarioIds: ['s3'], tenantId: TENANT_A, triggeredBy: 'sim' })

    const batches = ctrl.listBatches(undefined, TENANT_A)
    assert.equal(batches.length, 3)

    // 最新的在前面
    const times = batches.map((b: any) => Date.parse(b.createdAt))
    for (let i = 1; i < times.length; i++) {
      assert.ok(times[i - 1] >= times[i])
    }
  })
})

// ── 场景 6: 并发与高负载模拟 ──
describe('[Simulator] 并发诊断模拟', () => {
  it('连续创建 20 个诊断 — 全部独立 ID', () => {
    const { controller: ctrl } = createSimulator()
    const ids = new Set<string>()

    for (let i = 0; i < 20; i++) {
      const result = ctrl.create({
        engineId: ENGINE_A,
        scenarioId: `concurrent-${i}`,
        tenantId: TENANT_A,
        requestedBy: 'sim'
      })
      ids.add(result.diagnosis.diagnosisId)
    }

    assert.equal(ids.size, 20) // 所有 ID 不重复

    const all = ctrl.list({})
    assert.equal(all.total, 20)
  })

  it('连续创建 5 个批量诊断 — 批次不重叠', () => {
    const { controller: ctrl } = createSimulator()
    const batchIds = new Set<string>()

    for (let i = 0; i < 5; i++) {
      const result = ctrl.createBatch({
        engineId: ENGINE_A,
        scenarioIds: [`s${i}`],
        tenantId: TENANT_A,
        triggeredBy: 'sim'
      })
      batchIds.add(result.batch.batchId)
    }

    assert.equal(batchIds.size, 5)
    const batches = ctrl.listBatches(undefined, TENANT_A)
    assert.equal(batches.length, 5)
  })

  it('反复创建和删除 — 状态一致性', () => {
    const { controller: ctrl } = createSimulator()

    for (let round = 0; round < 10; round++) {
      const d = ctrl.create({
        engineId: ENGINE_A,
        scenarioId: `round-${round}`,
        tenantId: TENANT_A,
        requestedBy: 'sim'
      })
      const diagId = d.diagnosis.diagnosisId

      // 更新
      ctrl.update(diagId, { status: 'COMPLETED', riskLevel: round % 2 === 0 ? 'high' : 'low' })
      const afterUpdate = ctrl.get(diagId)
      assert.equal(afterUpdate.diagnosis.status, 'COMPLETED')

      // 删除
      ctrl.remove(diagId)
      assert.throws(
        () => ctrl.get(diagId),
        (err: any) => err.name === 'NotFoundException' || err.status === 404
      )
    }

    // 全部删完
    const all = ctrl.list({})
    assert.equal(all.total, 0)
  })
})

// ── 场景 7: 完整诊断生命周期模拟 ──
describe('[Simulator] 完整诊断生命周期模拟', () => {
  it('PENDING → IN_PROGRESS → COMPLETED 完整流程', () => {
    const { controller: ctrl } = createSimulator()

    // 1. 创建 PENDING
    const created = ctrl.create({
      engineId: ENGINE_B,
      scenarioId: 'lifecycle-test',
      tenantId: TENANT_A,
      requestedBy: 'sim-user',
      inputSnapshot: { deviceId: 'dev-001', cpuUsage: 95 }
    })
    assert.equal(created.diagnosis.status, 'PENDING')

    // 2. 更新为 IN_PROGRESS
    const inProgress = ctrl.update(created.diagnosis.diagnosisId, {
      status: 'IN_PROGRESS',
      recommendation: '开始诊断...'
    })
    assert.equal(inProgress.diagnosis.status, 'IN_PROGRESS')

    // 3. 完成诊断
    const completed = ctrl.update(created.diagnosis.diagnosisId, {
      status: 'COMPLETED',
      riskLevel: 'critical',
      recommendation: 'CPU 使用率 95%，超过阈值 90%，建议限流或扩容',
      matchedRuleIds: ['rule-cpu-high'],
      matchedConditionIds: ['cond-cpu-high'],
      triggeredActionIds: ['act-alert'],
      outputSnapshot: { riskScore: 95, anomalyType: 'CPU_SPIKE' },
      evaluationDurationMs: 150
    })

    assert.equal(completed.diagnosis.status, 'COMPLETED')
    assert.equal(completed.diagnosis.riskLevel, 'critical')
    assert.ok(completed.diagnosis.recommendation.includes('CPU'))
    assert.deepEqual(completed.diagnosis.matchedRuleIds, ['rule-cpu-high'])
    assert.deepEqual(completed.diagnosis.matchedConditionIds, ['cond-cpu-high'])
    assert.deepEqual(completed.diagnosis.triggeredActionIds, ['act-alert'])
    assert.deepEqual(completed.diagnosis.outputSnapshot, { riskScore: 95, anomalyType: 'CPU_SPIKE' })
    assert.equal(completed.diagnosis.evaluationDurationMs, 150)
    assert.ok(Date.parse(completed.diagnosis.completedAt!) > 0)
  })

  it('PENDING → FAILED 异常流程', () => {
    const { controller: ctrl } = createSimulator()

    const created = ctrl.create({
      engineId: ENGINE_A,
      scenarioId: 'eval-timeout',
      tenantId: TENANT_A,
      requestedBy: 'sim-user'
    })

    const failed = ctrl.update(created.diagnosis.diagnosisId, {
      status: 'FAILED',
      recommendation: '引擎执行超时，触发降级策略',
      evaluationDurationMs: 5000
    })

    assert.equal(failed.diagnosis.status, 'FAILED')
    assert.equal(failed.diagnosis.recommendation, '引擎执行超时，触发降级策略')
    assert.equal(failed.diagnosis.evaluationDurationMs, 5000)
    assert.ok(Date.parse(failed.diagnosis.completedAt!) > 0)
  })

  it('批量创建后读取风险报告 — 自动完成诊断包含风险数据', () => {
    const { controller: ctrl } = createSimulator()

    // 批量创建包含高低风险场景
    ctrl.createBatch({
      engineId: ENGINE_B,
      scenarioIds: ['normal-check', 'critical-alert-1', 'regular-scan'],
      tenantId: TENANT_A,
      triggeredBy: 'ops-sim'
    })

    // 检查风险报告
    const report = ctrl.riskReport(undefined, TENANT_A)
    assert.equal(report.totalEvaluated, 3)
    assert.equal(report.riskDistribution.low, 2)   // normal-check, regular-scan
    assert.equal(report.riskDistribution.high, 1)  // critical-alert-1

    // 批量诊断中也反映了风险分布
    const batches = ctrl.listBatches(ENGINE_B, TENANT_A)
    assert.equal(batches.length, 1)
    assert.equal(batches[0].totalDiagnoses, 3)
    assert.equal(batches[0].matchedDiagnoses, 1)
    assert.equal(batches[0].riskDistribution.high, 1)
    assert.equal(batches[0].riskDistribution.low, 2)
  })
})
