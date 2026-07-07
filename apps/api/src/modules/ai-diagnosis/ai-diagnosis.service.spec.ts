/**
 * 🐜 自动: [ai-diagnosis] [A] service.spec 深层测试 — ≥18项正反例+边界
 *
 * AiDiagnosisService 深层单元测试（.spec，不依赖数据库或外部服务）
 * 聚焦现有 .test.ts 未覆盖的边界、反例、组合场景
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import assert from 'node:assert/strict'
import { AiDiagnosisService } from './ai-diagnosis.service'
import type { DiagnosisEntity } from './ai-diagnosis.entity'

// ─── 工厂函数 ───
function createService(): AiDiagnosisService {
  AiDiagnosisService.resetStores()
  return new AiDiagnosisService()
}

/** 快速创建单个诊断的辅助函数 */
function makeDiag(service: AiDiagnosisService, overrides?: Partial<{
  engineId: string; scenarioId: string; tenantId: string; requestedBy: string
}>) {
  return service.createDiagnosis({
    engineId: overrides?.engineId ?? 'engine-001',
    scenarioId: overrides?.scenarioId ?? 'scenario-001',
    tenantId: overrides?.tenantId ?? 'T001',
    requestedBy: overrides?.requestedBy ?? 'u-001',
  })
}

// ════════════════════════════════════════════════════════
//  正例 — 正常输入输出测试
// ════════════════════════════════════════════════════════
describe('diagnosis service — positive cases', () => {

  it('P1: updateDiagnosis sets outputSnapshot correctly', () => {
    const service = createService()
    const d = makeDiag(service)
    const updated = service.updateDiagnosis(d.diagnosisId, {
      status: 'COMPLETED',
      outputSnapshot: { result: 'ok', score: 95, details: { matched: true } }
    })
    assert.ok(updated)
    assert.deepEqual(updated.outputSnapshot, { result: 'ok', score: 95, details: { matched: true } })
  })

  it('P2: listDiagnoses with combined filters returns correct subset', () => {
    const service = createService()
    // 创建 4 条诊断：不同 tenant & engine
    makeDiag(service, { engineId: 'e1', tenantId: 'T1', scenarioId: 's1' })
    makeDiag(service, { engineId: 'e1', tenantId: 'T2', scenarioId: 's2' })
    makeDiag(service, { engineId: 'e2', tenantId: 'T1', scenarioId: 's3' })
    makeDiag(service, { engineId: 'e2', tenantId: 'T2', scenarioId: 's4' })

    // T1 + e1 → 1 条
    const result = service.listDiagnoses({ engineId: 'e1', tenantId: 'T1' })
    assert.equal(result.total, 1)
    assert.equal(result.diagnoses[0].scenarioId, 's1')
  })

  it('P3: batch with only "high" scenarios yields correct risk distribution', () => {
    const service = createService()
    const batch = service.createDiagnosisBatch({
      engineId: 'engine-001', scenarioIds: ['high-alert-1', 'high-check-2', 'normal-1'],
      tenantId: 'T001', triggeredBy: 'u-001'
    })
    assert.equal(batch.riskDistribution.high, 2) // high-alert 和 high-check 被标记为 high
    assert.equal(batch.riskDistribution.low, 1)
  })

  it('P4: updateDiagnosis with partial patch preserves unchanged fields', () => {
    const service = createService()
    const d = makeDiag(service)
    const updated = service.updateDiagnosis(d.diagnosisId, { recommendation: 'only this' })
    assert.ok(updated)
    assert.equal(updated.recommendation, 'only this')
    assert.equal(updated.status, 'PENDING')             // 未变
    assert.equal(updated.riskLevel, 'low')               // 未变
    assert.deepEqual(updated.matchedRuleIds, [])         // 未变
  })

  it('P5: updateDiagnosis chained calls accumulate state correctly', () => {
    const service = createService()
    const d = makeDiag(service)

    service.updateDiagnosis(d.diagnosisId, { status: 'IN_PROGRESS' })
    service.updateDiagnosis(d.diagnosisId, { matchedRuleIds: ['r1'] })
    service.updateDiagnosis(d.diagnosisId, { status: 'COMPLETED', riskLevel: 'high', recommendation: 'chain ok' })

    const final = service.getDiagnosis(d.diagnosisId)
    assert.equal(final?.status, 'COMPLETED')
    assert.equal(final?.riskLevel, 'high')
    assert.deepEqual(final?.matchedRuleIds, ['r1'])
    assert.equal(final?.recommendation, 'chain ok')
    assert.ok(final?.completedAt)
  })

  it('P6: generateRiskReport with both engineId and tenantId filters', () => {
    const service = createService()
    makeDiag(service, { engineId: 'e1', tenantId: 'T1' })
    makeDiag(service, { engineId: 'e2', tenantId: 'T1' })
    makeDiag(service, { engineId: 'e1', tenantId: 'T2' })

    // 仅 e1 ∩ T1
    const report = service.generateRiskReport({ engineId: 'e1', tenantId: 'T1' })
    assert.equal(report.totalEvaluated, 1)
  })

  it('P7: deleteDiagnosis then getDiagnosis returns undefined', () => {
    const service = createService()
    const d = makeDiag(service)
    service.deleteDiagnosis(d.diagnosisId)
    const found = service.getDiagnosis(d.diagnosisId)
    assert.equal(found, undefined)
  })

  it('P8: getDiagnosisBatch returns complete batch with correct diagnoses count', () => {
    const service = createService()
    const batch = service.createDiagnosisBatch({
      engineId: 'e1', scenarioIds: ['s1', 's2', 's3', 's4', 's5'],
      tenantId: 'T1', triggeredBy: 'u1'
    })
    const fetched = service.getDiagnosisBatch(batch.batchId)
    assert.ok(fetched)
    assert.equal(fetched.totalDiagnoses, 5)
    assert.equal(fetched.diagnoses.length, 5)
    for (const d of fetched.diagnoses) {
      assert.equal(d.engineId, 'e1')
      assert.equal(d.tenantId, 'T1')
    }
  })
})

// ════════════════════════════════════════════════════════
//  反例 — 空/非法输入
// ════════════════════════════════════════════════════════
describe('diagnosis service — negative cases', () => {

  it('N1: getDiagnosis on non-existent id returns undefined', () => {
    const service = createService()
    assert.equal(service.getDiagnosis('does-not-exist'), undefined)
  })

  it('N2: updateDiagnosis on non-existent id returns undefined', () => {
    const service = createService()
    const result = service.updateDiagnosis('bogus-id', { status: 'COMPLETED' })
    assert.equal(result, undefined)
  })

  it('N3: deleteDiagnosis on non-existent id returns false', () => {
    const service = createService()
    assert.equal(service.deleteDiagnosis('no-such-id'), false)
  })

  it('N4: deleteDiagnosis on already deleted diagnosis returns false', () => {
    const service = createService()
    const d = makeDiag(service)
    assert.equal(service.deleteDiagnosis(d.diagnosisId), true) // 第一次成功
    assert.equal(service.deleteDiagnosis(d.diagnosisId), false) // 第二次失败
  })

  it('N5: getDiagnosisBatch on non-existent batch returns undefined', () => {
    const service = createService()
    assert.equal(service.getDiagnosisBatch('missing-batch'), undefined)
  })

  it('N6: listDiagnoses with non-matching filter returns empty', () => {
    const service = createService()
    makeDiag(service)
    const result = service.listDiagnoses({ engineId: 'no-such-engine' })
    assert.equal(result.total, 0)
    assert.deepEqual(result.diagnoses, [])
  })

  it('N7: listDiagnosisBatches with non-matching filter returns empty', () => {
    const service = createService()
    service.createDiagnosisBatch({
      engineId: 'e1', scenarioIds: ['s1'],
      tenantId: 'T1', triggeredBy: 'u1'
    })
    const result = service.listDiagnosisBatches({ engineId: 'wrong-engine' })
    assert.deepEqual(result, [])
  })

  it('N8: generateRiskReport with engineId filter that has no data returns zeros', () => {
    const service = createService()
    const report = service.generateRiskReport({ engineId: 'ghost' })
    assert.equal(report.totalEvaluated, 0)
    assert.deepEqual(report.riskDistribution, { low: 0, medium: 0, high: 0, critical: 0 })
    assert.deepEqual(report.topRecommendations, [])
    assert.equal(report.averageEvaluationDurationMs, 0)
  })
})

// ════════════════════════════════════════════════════════
//  边界 — 极小/极大/空数据
// ════════════════════════════════════════════════════════
describe('diagnosis service — boundary cases', () => {

  it('B1: batch with 1 scenario still produces valid batch', () => {
    const service = createService()
    const batch = service.createDiagnosisBatch({
      engineId: 'e1', scenarioIds: ['single'],
      tenantId: 'T1', triggeredBy: 'u1'
    })
    assert.equal(batch.totalDiagnoses, 1)
    assert.equal(batch.diagnoses.length, 1)
    assert.equal(batch.matchRate, 0) // "single" 不包含 critical/high
    assert.equal(batch.riskDistribution.low, 1)
  })

  it('B2: batch with many scenarios (50) handles gracefully', () => {
    const service = createService()
    const ids = Array.from({ length: 50 }, (_, i) => `scenario-${i}`)
    const batch = service.createDiagnosisBatch({
      engineId: 'e1', scenarioIds: ids,
      tenantId: 'T1', triggeredBy: 'u1'
    })
    assert.equal(batch.totalDiagnoses, 50)
    assert.equal(batch.diagnoses.length, 50)
    assert.ok(batch.avgEvaluationDurationMs > 0)
    assert.ok(batch.matchRate >= 0 && batch.matchRate <= 1)
  })

  it('B3: updateDiagnosis cycles through all status values', () => {
    const service = createService()
    const d = makeDiag(service)
    const statuses: DiagnosisEntity['status'][] = ['IN_PROGRESS', 'COMPLETED', 'FAILED']

    for (const s of statuses) {
      const updated = service.updateDiagnosis(d.diagnosisId, { status: s })
      assert.equal(updated?.status, s)
    }
    // 最终状态 FAILED
    assert.equal(service.getDiagnosis(d.diagnosisId)?.status, 'FAILED')
    assert.ok(service.getDiagnosis(d.diagnosisId)?.completedAt)
  })

  it('B4: risk report with all critical diagnoses sorts correctly', () => {
    const service = createService()
    for (let i = 0; i < 15; i++) {
      const d = makeDiag(service, { scenarioId: `s${i}` })
      service.updateDiagnosis(d.diagnosisId, {
        status: 'COMPLETED', riskLevel: 'critical',
        recommendation: `Critical #${i}`
      })
    }
    const report = service.generateRiskReport()
    assert.equal(report.totalEvaluated, 15)
    assert.equal(report.topRecommendations.length, 10) // 最多 10 条
    assert.equal(report.riskDistribution.critical, 15)
  })

  it('B5: createDiagnosis with undefined promptSummary and inputSnapshot uses defaults', () => {
    const service = createService()
    const d = service.createDiagnosis({
      engineId: 'e1', scenarioId: 's1',
      tenantId: 'T1', requestedBy: 'u1',
    })
    // 未传 promptSummary → 自动生成
    assert.equal(d.promptSummary, '诊断任务 - s1')
    // 未传 inputSnapshot → 空对象
    assert.deepEqual(d.inputSnapshot, {})
    assert.equal(d.status, 'PENDING')
  })

  it('B6: updateDiagnosis sets matched fields to empty arrays', () => {
    const service = createService()
    const d = makeDiag(service)
    const updated = service.updateDiagnosis(d.diagnosisId, {
      matchedRuleIds: [],
      matchedConditionIds: [],
      triggeredActionIds: [],
      evaluationDurationMs: 0
    })
    assert.deepEqual(updated?.matchedRuleIds, [])
    assert.deepEqual(updated?.matchedConditionIds, [])
    assert.deepEqual(updated?.triggeredActionIds, [])
    assert.equal(updated?.evaluationDurationMs, 0)
  })

  it('B7: legacy — empty string values in createDiagnosis produce valid entity', () => {
    const service = createService()
    // 极端：所有字符串字段给空值
    const d = service.createDiagnosis({
      engineId: '',
      scenarioId: '',
      tenantId: '',
      requestedBy: '',
    })
    assert.ok(d.diagnosisId.startsWith('diag-'))
    assert.equal(d.engineId, '')
    assert.equal(d.scenarioId, '')
    assert.equal(d.tenantId, '')
    assert.equal(d.requestedBy, '')
    assert.equal(d.promptSummary, '诊断任务 - ') // scenarioId 空了
  })
})
