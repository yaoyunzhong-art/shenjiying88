/**
 * 🐜 自动: [ai-diagnosis] Contract 测试
 *
 * 验证:
 *   - DiagnosisEntity / DiagnosisBatch 实体 shape 与枚举值
 *   - 服务方法创建、获取、更新、删除、列表、批量、风险报告
 *   - 状态机: PENDING → IN_PROGRESS → COMPLETED/FAILED
 *   - 风险等级分布聚合
 *   - 跨租户隔离（按 tenantId 过滤）
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import test, { describe, beforeEach } from 'node:test'
import type { DiagnosisEntity, DiagnosisBatch } from './ai-diagnosis.entity'
import { AiDiagnosisService } from './ai-diagnosis.service'

let svc: AiDiagnosisService

beforeEach(() => {
  AiDiagnosisService.resetStores()
  svc = new AiDiagnosisService()
})

// ═══════════════════════════════════════════════════════
// 实体 Shape 合约
// ═══════════════════════════════════════════════════════

describe('Contract: DiagnosisEntity shape', () => {
  test('创建诊断必填字段齐全', () => {
    const d = svc.createDiagnosis({
      engineId: 'engine-1',
      scenarioId: 'scenario-001',
      tenantId: 'tenant-default',
      requestedBy: 'user-001'
    })

    assert.match(d.diagnosisId, /^diag-/)
    assert.equal(d.engineId, 'engine-1')
    assert.equal(d.scenarioId, 'scenario-001')
    assert.equal(d.tenantId, 'tenant-default')
    assert.equal(d.requestedBy, 'user-001')
    assert.equal(d.status, 'PENDING')
    assert.equal(d.riskLevel, 'low')
    assert.equal(d.evaluationDurationMs, 0)
    assert.equal(d.matchedRuleIds.length, 0)
    assert.equal(d.matchedConditionIds.length, 0)
    assert.equal(d.triggeredActionIds.length, 0)
    assert.equal(typeof d.inputSnapshot, 'object')
    assert.equal(typeof d.outputSnapshot, 'object')
    assert.equal(typeof d.createdAt, 'string')
    assert.ok(new Date(d.createdAt).toString() !== 'Invalid Date')
  })

  test('状态枚举值严格匹配', () => {
    const statuses: DiagnosisEntity['status'][] = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED']
    for (const s of statuses) {
      const d = svc.createDiagnosis({
        engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1'
      })
      svc.updateDiagnosis(d.diagnosisId, { status: s })
      const updated = svc.getDiagnosis(d.diagnosisId)!
      assert.equal(updated.status, s)
    }
  })

  test('风险等级枚举值严格匹配', () => {
    const levels: DiagnosisEntity['riskLevel'][] = ['low', 'medium', 'high', 'critical']
    for (const rl of levels) {
      const d = svc.createDiagnosis({
        engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1'
      })
      svc.updateDiagnosis(d.diagnosisId, { riskLevel: rl })
      const updated = svc.getDiagnosis(d.diagnosisId)!
      assert.equal(updated.riskLevel, rl)
    }
  })

  test('createDiagnosis 带可选字段', () => {
    const d = svc.createDiagnosis({
      engineId: 'engine-2',
      scenarioId: 'scenario-002',
      tenantId: 'tenant-abc',
      requestedBy: 'admin',
      promptSummary: '自定义 prompt 摘要',
      inputSnapshot: { userId: 'u123', action: 'login' }
    })

    assert.equal(d.promptSummary, '自定义 prompt 摘要')
    assert.deepEqual(d.inputSnapshot, { userId: 'u123', action: 'login' })
  })
})

describe('Contract: DiagnosisBatch shape', () => {
  test('批量诊断返回完整 DiagnosisBatch 结构', () => {
    const batch = svc.createDiagnosisBatch({
      engineId: 'engine-batch-1',
      scenarioIds: ['scenario-a', 'scenario-b', 'scenario-high-risk'],
      tenantId: 't-default',
      triggeredBy: 'batch-operator'
    })

    assert.match(batch.batchId, /^batch-/)
    assert.equal(batch.engineId, 'engine-batch-1')
    assert.equal(batch.totalDiagnoses, 3)
    assert.equal(batch.tenantId, 't-default')
    assert.equal(batch.triggeredBy, 'batch-operator')

    // 命中率： 'critical' 或 'high' 场景命中 (scenario-high-risk)
    assert.ok(batch.matchedDiagnoses >= 1)
    assert.ok(typeof batch.matchRate === 'number')

    // 风险分布
    assert.ok('low' in batch.riskDistribution)
    assert.ok('medium' in batch.riskDistribution)
    assert.ok('high' in batch.riskDistribution)
    assert.ok('critical' in batch.riskDistribution)

    // avgEvaluationDurationMs 是数字
    assert.ok(Number.isFinite(batch.avgEvaluationDurationMs))

    // diagnoses 数组
    assert.equal(batch.diagnoses.length, 3)
    for (const diag of batch.diagnoses) {
      assert.match(diag.diagnosisId, /^diag-/)
      assert.equal(diag.status, 'COMPLETED')
    }
  })

  test('getDiagnosisBatch 返回正确的 batch', () => {
    const created = svc.createDiagnosisBatch({
      engineId: 'e1', scenarioIds: ['s1'], tenantId: 't1', triggeredBy: 'u1'
    })
    const fetched = svc.getDiagnosisBatch(created.batchId)
    assert.ok(fetched)
    assert.equal(fetched!.batchId, created.batchId)
    assert.equal(fetched!.diagnoses.length, 1)
  })

  test('getDiagnosisBatch 不存在返回 undefined', () => {
    const fetched = svc.getDiagnosisBatch('batch-not-exist')
    assert.equal(fetched, undefined)
  })

  test('listDiagnosisBatches 按 engineId 过滤', () => {
    svc.createDiagnosisBatch({ engineId: 'e-a', scenarioIds: ['s1'], tenantId: 't1', triggeredBy: 'u1' })
    svc.createDiagnosisBatch({ engineId: 'e-b', scenarioIds: ['s2'], tenantId: 't1', triggeredBy: 'u1' })

    const listA = svc.listDiagnosisBatches({ engineId: 'e-a' })
    assert.equal(listA.length, 1)
    assert.equal(listA[0].engineId, 'e-a')

    const listB = svc.listDiagnosisBatches({ engineId: 'e-b' })
    assert.equal(listB.length, 1)
  })

  test('listDiagnosisBatches 按 tenantId 过滤', () => {
    svc.createDiagnosisBatch({ engineId: 'e1', scenarioIds: ['s1'], tenantId: 't-a', triggeredBy: 'u1' })
    svc.createDiagnosisBatch({ engineId: 'e1', scenarioIds: ['s2'], tenantId: 't-b', triggeredBy: 'u1' })

    const listA = svc.listDiagnosisBatches({ tenantId: 't-a' })
    assert.equal(listA.length, 1)
    assert.equal(listA[0].tenantId, 't-a')
  })

  test('listDiagnosisBatches 无过滤返回全部', () => {
    svc.createDiagnosisBatch({ engineId: 'e1', scenarioIds: ['s1'], tenantId: 't1', triggeredBy: 'u1' })
    svc.createDiagnosisBatch({ engineId: 'e2', scenarioIds: ['s2'], tenantId: 't1', triggeredBy: 'u1' })

    assert.equal(svc.listDiagnosisBatches().length, 2)
  })
})

// ═══════════════════════════════════════════════════════
// 服务方法合约
// ═══════════════════════════════════════════════════════

describe('Contract: 服务方法', () => {
  test('getDiagnosis 存在返回诊断', () => {
    const d = svc.createDiagnosis({
      engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1'
    })
    const fetched = svc.getDiagnosis(d.diagnosisId)
    assert.ok(fetched)
    assert.equal(fetched!.diagnosisId, d.diagnosisId)
  })

  test('getDiagnosis 不存在返回 undefined', () => {
    const fetched = svc.getDiagnosis('diag-nonexistent')
    assert.equal(fetched, undefined)
  })

  test('listDiagnoses 无过滤返回全部', () => {
    svc.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
    svc.createDiagnosis({ engineId: 'e2', scenarioId: 's2', tenantId: 't1', requestedBy: 'u1' })
    svc.createDiagnosis({ engineId: 'e1', scenarioId: 's3', tenantId: 't1', requestedBy: 'u2' })

    const result = svc.listDiagnoses()
    assert.equal(result.total, 3)
    assert.equal(result.diagnoses.length, 3)
  })

  test('listDiagnoses 按 engineId 过滤', () => {
    svc.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
    svc.createDiagnosis({ engineId: 'e2', scenarioId: 's2', tenantId: 't1', requestedBy: 'u1' })

    const result = svc.listDiagnoses({ engineId: 'e1' })
    assert.equal(result.total, 1)
    assert.equal(result.diagnoses[0].engineId, 'e1')
  })

  test('listDiagnoses 按 status 过滤', () => {
    const d1 = svc.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
    svc.createDiagnosis({ engineId: 'e2', scenarioId: 's2', tenantId: 't1', requestedBy: 'u1' })

    svc.updateDiagnosis(d1.diagnosisId, { status: 'IN_PROGRESS' })

    const result = svc.listDiagnoses({ status: 'IN_PROGRESS' })
    assert.equal(result.total, 1)
    assert.equal(result.diagnoses[0].status, 'IN_PROGRESS')
  })

  test('listDiagnoses 按 riskLevel 过滤', () => {
    const d1 = svc.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
    svc.createDiagnosis({ engineId: 'e2', scenarioId: 's2', tenantId: 't1', requestedBy: 'u1' })

    svc.updateDiagnosis(d1.diagnosisId, { riskLevel: 'high' })

    const result = svc.listDiagnoses({ riskLevel: 'high' })
    assert.equal(result.total, 1)
    assert.equal(result.diagnoses[0].riskLevel, 'high')
  })

  test('listDiagnoses 按 tenantId 过滤', () => {
    svc.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't-a', requestedBy: 'u1' })
    svc.createDiagnosis({ engineId: 'e1', scenarioId: 's2', tenantId: 't-b', requestedBy: 'u1' })

    const result = svc.listDiagnoses({ tenantId: 't-a' })
    assert.equal(result.total, 1)
    assert.equal(result.diagnoses[0].tenantId, 't-a')
  })

  test('updateDiagnosis 更新状态并自动记录 completedAt', () => {
    const d = svc.createDiagnosis({
      engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1'
    })

    // PENDING → IN_PROGRESS
    svc.updateDiagnosis(d.diagnosisId, { status: 'IN_PROGRESS' })
    let updated = svc.getDiagnosis(d.diagnosisId)!
    assert.equal(updated.status, 'IN_PROGRESS')
    assert.equal(updated.completedAt, undefined)

    // IN_PROGRESS → COMPLETED
    svc.updateDiagnosis(d.diagnosisId, {
      status: 'COMPLETED',
      riskLevel: 'medium',
      recommendation: '检查配置',
      matchedRuleIds: ['rule-1'],
      matchedConditionIds: ['cond-1'],
      triggeredActionIds: ['act-1'],
      outputSnapshot: { score: 50 },
      evaluationDurationMs: 120
    })
    updated = svc.getDiagnosis(d.diagnosisId)!
    assert.equal(updated.status, 'COMPLETED')
    assert.equal(updated.riskLevel, 'medium')
    assert.equal(updated.recommendation, '检查配置')
    assert.deepEqual(updated.matchedRuleIds, ['rule-1'])
    assert.deepEqual(updated.matchedConditionIds, ['cond-1'])
    assert.deepEqual(updated.triggeredActionIds, ['act-1'])
    assert.deepEqual(updated.outputSnapshot, { score: 50 })
    assert.equal(updated.evaluationDurationMs, 120)
    assert.ok(updated.completedAt)
    assert.ok(new Date(updated.completedAt!).toString() !== 'Invalid Date')
  })

  test('updateDiagnosis 不存在的 ID 返回 undefined', () => {
    const result = svc.updateDiagnosis('diag-nonexistent', { status: 'COMPLETED' })
    assert.equal(result, undefined)
  })

  test('deleteDiagnosis 删除成功返回 true', () => {
    const d = svc.createDiagnosis({
      engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1'
    })
    const deleted = svc.deleteDiagnosis(d.diagnosisId)
    assert.equal(deleted, true)
    assert.equal(svc.getDiagnosis(d.diagnosisId), undefined)
  })

  test('deleteDiagnosis 不存在的 ID 返回 false', () => {
    const deleted = svc.deleteDiagnosis('diag-nonexistent')
    assert.equal(deleted, false)
  })

  test('listDiagnoses 按创建时间降序排列', () => {
    const d1 = svc.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
    // 稍微延迟确保时间差
    const d2 = svc.createDiagnosis({ engineId: 'e1', scenarioId: 's2', tenantId: 't1', requestedBy: 'u1' })

    const result = svc.listDiagnoses()
    // 新创建的在前
    assert.ok(new Date(result.diagnoses[0].createdAt).getTime() >= new Date(result.diagnoses[1].createdAt).getTime())
  })
})

// ═══════════════════════════════════════════════════════
// 风险报告合约
// ═══════════════════════════════════════════════════════

describe('Contract: 风险报告 generateRiskReport', () => {
  test('空数据返回零值报告', () => {
    const report = svc.generateRiskReport({ tenantId: 'no-data' })
    assert.equal(report.totalEvaluated, 0)
    assert.equal(report.averageEvaluationDurationMs, 0)
    assert.deepEqual(report.riskDistribution, { low: 0, medium: 0, high: 0, critical: 0 })
    assert.equal(report.topRecommendations.length, 0)
    assert.ok(report.generatedAt)
  })

  test('按 engineId 和 tenantId 过滤', () => {
    // Engine A — 创建多个诊断并标记风险
    const d1 = svc.createDiagnosis({ engineId: 'engine-a', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
    const d2 = svc.createDiagnosis({ engineId: 'engine-a', scenarioId: 's2', tenantId: 't1', requestedBy: 'u1' })
    svc.updateDiagnosis(d1.diagnosisId, { status: 'COMPLETED', riskLevel: 'high', evaluationDurationMs: 100 })
    svc.updateDiagnosis(d2.diagnosisId, { status: 'COMPLETED', riskLevel: 'low', evaluationDurationMs: 50 })

    // Engine B
    const d3 = svc.createDiagnosis({ engineId: 'engine-b', scenarioId: 's3', tenantId: 't1', requestedBy: 'u1' })
    svc.updateDiagnosis(d3.diagnosisId, { status: 'COMPLETED', riskLevel: 'critical', evaluationDurationMs: 200 })

    // 报告 engine-a 只含 2 条
    const reportA = svc.generateRiskReport({ engineId: 'engine-a', tenantId: 't1' })
    assert.equal(reportA.totalEvaluated, 2)
    assert.equal(reportA.riskDistribution.high, 1)
    assert.equal(reportA.riskDistribution.low, 1)
    assert.ok(reportA.averageEvaluationDurationMs >= 75) // (100 + 50) / 2

    // 报告 engine-b 含 1 条
    const reportB = svc.generateRiskReport({ engineId: 'engine-b' })
    assert.equal(reportB.totalEvaluated, 1)
    assert.equal(reportB.riskDistribution.critical, 1)

    // 无过滤：全部 3 条
    const reportAll = svc.generateRiskReport()
    assert.equal(reportAll.totalEvaluated, 3)
  })

  test('topRecommendations 按风险等级降序排列', () => {
    const ids: string[] = []
    for (let i = 0; i < 15; i++) {
      const d = svc.createDiagnosis({ engineId: 'e1', scenarioId: `s${i}`, tenantId: 't1', requestedBy: 'u1' })
      ids.push(d.diagnosisId)
    }

    // 标记不同风险等级
    svc.updateDiagnosis(ids[0], { status: 'COMPLETED', riskLevel: 'critical', recommendation: 'critical 问题' })
    svc.updateDiagnosis(ids[1], { status: 'COMPLETED', riskLevel: 'high', recommendation: 'high 问题' })
    svc.updateDiagnosis(ids[2], { status: 'COMPLETED', riskLevel: 'medium', recommendation: 'medium 问题' })
    svc.updateDiagnosis(ids[3], { status: 'COMPLETED', riskLevel: 'low', recommendation: 'low 问题' })

    const report = svc.generateRiskReport()
    // topRecommendations 最多 10 条，只含 high + critical
    assert.ok(report.topRecommendations.length >= 1)

    // 第一条应该是 critical 或 high
    const firstRec = report.topRecommendations[0]
    assert.ok(firstRec.riskLevel === 'critical' || firstRec.riskLevel === 'high')
    assert.ok(firstRec.diagnosisId)
    assert.ok(firstRec.recommendation)
  })
})

// ═══════════════════════════════════════════════════════
// 跨租户隔离合约
// ═══════════════════════════════════════════════════════

describe('Contract: 跨租户隔离', () => {
  test('listDiagnoses 按 tenantId 过滤互不干扰', () => {
    svc.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't-a', requestedBy: 'u1' })
    svc.createDiagnosis({ engineId: 'e1', scenarioId: 's2', tenantId: 't-b', requestedBy: 'u2' })

    const resultA = svc.listDiagnoses({ tenantId: 't-a' })
    const resultB = svc.listDiagnoses({ tenantId: 't-b' })

    assert.equal(resultA.total, 1)
    assert.equal(resultA.diagnoses[0].tenantId, 't-a')
    assert.equal(resultB.total, 1)
    assert.equal(resultB.diagnoses[0].tenantId, 't-b')
  })

  test('generateRiskReport 按 tenant 过滤', () => {
    svc.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't-a', requestedBy: 'u1' })
    svc.createDiagnosis({ engineId: 'e1', scenarioId: 's2', tenantId: 't-b', requestedBy: 'u1' })

    const reportA = svc.generateRiskReport({ tenantId: 't-a' })
    assert.equal(reportA.totalEvaluated, 1)

    const reportB = svc.generateRiskReport({ tenantId: 't-b' })
    assert.equal(reportB.totalEvaluated, 1)
  })

  test('listDiagnosisBatches 按 tenantId 过滤', () => {
    svc.createDiagnosisBatch({ engineId: 'e1', scenarioIds: ['s1'], tenantId: 't-a', triggeredBy: 'u1' })
    svc.createDiagnosisBatch({ engineId: 'e1', scenarioIds: ['s2'], tenantId: 't-b', triggeredBy: 'u1' })

    const batchesA = svc.listDiagnosisBatches({ tenantId: 't-a' })
    const batchesB = svc.listDiagnosisBatches({ tenantId: 't-b' })

    assert.equal(batchesA.length, 1)
    assert.equal(batchesB.length, 1)
    assert.equal(batchesA[0].tenantId, 't-a')
    assert.equal(batchesB[0].tenantId, 't-b')
  })
})

// ═══════════════════════════════════════════════════════
// 边界场景
// ═══════════════════════════════════════════════════════

describe('Contract: 边界场景', () => {
  test('空 scenarioIds 创建空 batch', () => {
    const batch = svc.createDiagnosisBatch({
      engineId: 'e1', scenarioIds: [], tenantId: 't1', triggeredBy: 'u1'
    })
    assert.equal(batch.totalDiagnoses, 0)
    assert.equal(batch.diagnoses.length, 0)
    assert.equal(batch.matchRate, 0)
  })

  test('大 promptSummary 不截断', () => {
    const longSummary = 'x'.repeat(10000)
    const d = svc.createDiagnosis({
      engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1',
      promptSummary: longSummary
    })
    assert.equal(d.promptSummary.length, 10000)
  })

  test('更新后 createdAt 不变', () => {
    const d = svc.createDiagnosis({
      engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1'
    })
    const createdAt = d.createdAt
    // 等待一点时间
    svc.updateDiagnosis(d.diagnosisId, { status: 'COMPLETED' })
    const updated = svc.getDiagnosis(d.diagnosisId)!
    assert.equal(updated.createdAt, createdAt)
  })

  test('FAILDED 状态也记录 completedAt', () => {
    const d = svc.createDiagnosis({
      engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1'
    })
    svc.updateDiagnosis(d.diagnosisId, { status: 'FAILED' })
    const updated = svc.getDiagnosis(d.diagnosisId)!
    assert.equal(updated.status, 'FAILED')
    assert.ok(updated.completedAt)
  })

  test('listDiagnoses 空库返回零', () => {
    const result = svc.listDiagnoses()
    assert.equal(result.total, 0)
    assert.equal(result.diagnoses.length, 0)
  })
})
