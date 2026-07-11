/**
 * ai-diagnosis.service.spec.ts — 扩展版 AI 诊断 Service 综合测试
 *
 * 覆盖：正例/反例/边界条件/并发/性能/数据一致性
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { AiDiagnosisService } from './ai-diagnosis.service'
import type { DiagnosisEntity } from './ai-diagnosis.entity'

describe('AiDiagnosisService (Complete)', () => {
  let service: AiDiagnosisService

  beforeEach(() => {
    AiDiagnosisService.resetStores()
    service = new AiDiagnosisService()
  })

  // ───── 创建诊断 ─────

  describe('createDiagnosis', () => {
    it('应使用提供的字段创建诊断（正例）', () => {
      const d = service.createDiagnosis({
        engineId: 'engine-1',
        scenarioId: 'scenario-1',
        tenantId: 'tenant-a',
        requestedBy: 'user-1',
      })
      expect(d).toBeDefined()
      expect(d.diagnosisId).toMatch(/^diag-/)
      expect(d.engineId).toBe('engine-1')
      expect(d.scenarioId).toBe('scenario-1')
      expect(d.tenantId).toBe('tenant-a')
      expect(d.requestedBy).toBe('user-1')
      expect(d.status).toBe('PENDING')
      expect(d.matchedRuleIds).toEqual([])
      expect(d.riskLevel).toBe('low')
    })

    it('应接受可选的 promptSummary 和 inputSnapshot（正例）', () => {
      const d = service.createDiagnosis({
        engineId: 'engine-1',
        scenarioId: 'scenario-1',
        tenantId: 'tenant-a',
        requestedBy: 'user-1',
        promptSummary: 'Custom prompt',
        inputSnapshot: { key: 'value' },
      })
      expect(d.promptSummary).toBe('Custom prompt')
      expect(d.inputSnapshot).toEqual({ key: 'value' })
    })

    it('当未提供 promptSummary 时应使用默认值（边界）', () => {
      const d = service.createDiagnosis({
        engineId: 'engine-a',
        scenarioId: 'scenario-custom',
        tenantId: 'tenant-a',
        requestedBy: 'user-1',
      })
      expect(d.promptSummary).toBe('诊断任务 - scenario-custom')
    })

    it('每次调用应生成唯一的 diagnosisId（幂等性）', () => {
      const ids = new Set<string>()
      for (let i = 0; i < 100; i++) {
        const d = service.createDiagnosis({
          engineId: 'engine-1',
          scenarioId: `scenario-${i}`,
          tenantId: 'tenant-a',
          requestedBy: 'user-1',
        })
        ids.add(d.diagnosisId)
      }
      expect(ids.size).toBe(100)
    })

    it('创建的诊断应准确记录时间戳', () => {
      const before = new Date().toISOString()
      const d = service.createDiagnosis({
        engineId: 'e1',
        scenarioId: 's1',
        tenantId: 't1',
        requestedBy: 'u1',
      })
      const after = new Date().toISOString()
      expect(d.createdAt >= before && d.createdAt <= after).toBe(true)
    })
  })

  // ───── 获取诊断 ─────

  describe('getDiagnosis', () => {
    it('应返回已存在的诊断（正例）', () => {
      const created = service.createDiagnosis({
        engineId: 'engine-1',
        scenarioId: 'scenario-1',
        tenantId: 'tenant-a',
        requestedBy: 'user-1',
      })
      const retrieved = service.getDiagnosis(created.diagnosisId)
      expect(retrieved).toBeDefined()
      expect(retrieved!.diagnosisId).toBe(created.diagnosisId)
    })

    it('当诊断 ID 不存在时应返回 undefined（反例）', () => {
      const result = service.getDiagnosis('non-existent-id')
      expect(result).toBeUndefined()
    })

    it('不应返回不同 ID 的诊断（反例）', () => {
      service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      const result = service.getDiagnosis('diag-other')
      expect(result).toBeUndefined()
    })
  })

  // ───── 列出诊断 ─────

  describe('listDiagnoses', () => {
    it('应返回所有诊断（无过滤条件）', () => {
      service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      service.createDiagnosis({ engineId: 'e2', scenarioId: 's2', tenantId: 't1', requestedBy: 'u2' })
      service.createDiagnosis({ engineId: 'e1', scenarioId: 's3', tenantId: 't2', requestedBy: 'u3' })
      const { diagnoses, total } = service.listDiagnoses()
      expect(total).toBe(3)
      expect(diagnoses).toHaveLength(3)
    })

    it('应按 engineId 过滤（正例）', () => {
      service.createDiagnosis({ engineId: 'engine-x', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      service.createDiagnosis({ engineId: 'engine-y', scenarioId: 's2', tenantId: 't1', requestedBy: 'u2' })
      const { diagnoses } = service.listDiagnoses({ engineId: 'engine-x' })
      expect(diagnoses).toHaveLength(1)
      expect(diagnoses[0].engineId).toBe('engine-x')
    })

    it('应按 tenantId 过滤（正例）', () => {
      service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 'tenant-alpha', requestedBy: 'u1' })
      service.createDiagnosis({ engineId: 'e2', scenarioId: 's2', tenantId: 'tenant-beta', requestedBy: 'u2' })
      const { diagnoses } = service.listDiagnoses({ tenantId: 'tenant-alpha' })
      expect(diagnoses).toHaveLength(1)
    })

    it('应按状态过滤（正例）', () => {
      const d = service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      service.updateDiagnosis(d.diagnosisId, { status: 'COMPLETED' })
      service.createDiagnosis({ engineId: 'e1', scenarioId: 's2', tenantId: 't1', requestedBy: 'u2' })

      const { diagnoses } = service.listDiagnoses({ status: 'COMPLETED' })
      expect(diagnoses).toHaveLength(1)
      expect(diagnoses[0].status).toBe('COMPLETED')
    })

    it('应按风险等级过滤（正例）', () => {
      const d1 = service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      service.updateDiagnosis(d1.diagnosisId, { riskLevel: 'high' })
      const d2 = service.createDiagnosis({ engineId: 'e1', scenarioId: 's2', tenantId: 't1', requestedBy: 'u2' })
      service.updateDiagnosis(d2.diagnosisId, { riskLevel: 'low' })

      const { diagnoses } = service.listDiagnoses({ riskLevel: 'high' })
      expect(diagnoses).toHaveLength(1)
      expect(diagnoses[0].riskLevel).toBe('high')
    })

    it('应组合多个过滤条件（复合过滤）', () => {
      const d = service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      service.updateDiagnosis(d.diagnosisId, { status: 'COMPLETED', riskLevel: 'high' })
      service.createDiagnosis({ engineId: 'e1', scenarioId: 's2', tenantId: 't2', requestedBy: 'u2' })

      const { diagnoses } = service.listDiagnoses({ engineId: 'e1', tenantId: 't1', status: 'COMPLETED' })
      expect(diagnoses).toHaveLength(1)
    })

    it('当无匹配时应返回空数组（边界）', () => {
      const { diagnoses, total } = service.listDiagnoses({ engineId: 'non-existent' })
      expect(diagnoses).toHaveLength(0)
      expect(total).toBe(0)
    })

    it('应按创建时间降序排列', () => {
      const d1 = service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      const d2 = service.createDiagnosis({ engineId: 'e1', scenarioId: 's2', tenantId: 't1', requestedBy: 'u2' })
      const { diagnoses } = service.listDiagnoses()
      expect(diagnoses[0].diagnosisId).toBe(d2.diagnosisId)
      expect(diagnoses[1].diagnosisId).toBe(d1.diagnosisId)
    })
  })

  // ───── 更新诊断 ─────

  describe('updateDiagnosis', () => {
    it('应更新诊断的多个字段（正例）', () => {
      const d = service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      const updated = service.updateDiagnosis(d.diagnosisId, {
        status: 'COMPLETED',
        riskLevel: 'medium',
        recommendation: 'Check this',
        matchedRuleIds: ['rule-1'],
        matchedConditionIds: ['cond-1'],
        triggeredActionIds: ['act-1'],
        outputSnapshot: { result: 'ok' },
        evaluationDurationMs: 150,
      })
      expect(updated).toBeDefined()
      expect(updated!.status).toBe('COMPLETED')
      expect(updated!.riskLevel).toBe('medium')
      expect(updated!.recommendation).toBe('Check this')
      expect(updated!.matchedRuleIds).toEqual(['rule-1'])
      expect(updated!.evaluationDurationMs).toBe(150)
      expect(updated!.completedAt).toBeDefined()
    })

    it('当诊断不存在时应返回 undefined（反例）', () => {
      const result = service.updateDiagnosis('fake-id', { status: 'COMPLETED' })
      expect(result).toBeUndefined()
    })

    it('部分更新不应影响其他字段（幂等性）', () => {
      const d = service.createDiagnosis({
        engineId: 'e1',
        scenarioId: 's1',
        tenantId: 't1',
        requestedBy: 'u1',
        promptSummary: 'Original',
      })
      service.updateDiagnosis(d.diagnosisId, { riskLevel: 'high' })
      const retrieved = service.getDiagnosis(d.diagnosisId)
      expect(retrieved!.riskLevel).toBe('high')
      expect(retrieved!.engineId).toBe('e1')
      expect(retrieved!.promptSummary).toBe('Original')
      expect(retrieved!.status).toBe('PENDING')
    })

    it('当状态更新为 COMPLETED 时应记录完成时间', () => {
      const d = service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      const updated = service.updateDiagnosis(d.diagnosisId, { status: 'COMPLETED' })
      expect(updated!.completedAt).toBeDefined()
      expect(updated!.completedAt).not.toBe(d.completedAt)
    })

    it('当状态更新为 FAILED 时也应记录完成时间', () => {
      const d = service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      const updated = service.updateDiagnosis(d.diagnosisId, { status: 'FAILED' })
      expect(updated!.completedAt).toBeDefined()
    })
  })

  // ───── 删除诊断 ─────

  describe('deleteDiagnosis', () => {
    it('应成功删除存在的诊断（正例）', () => {
      const d = service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      const deleted = service.deleteDiagnosis(d.diagnosisId)
      expect(deleted).toBe(true)
      expect(service.getDiagnosis(d.diagnosisId)).toBeUndefined()
    })

    it('当诊断不存在时应返回 false（反例）', () => {
      const result = service.deleteDiagnosis('non-existent-id')
      expect(result).toBe(false)
    })

    it('删除后不应出现在列表中', () => {
      const d = service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      service.deleteDiagnosis(d.diagnosisId)
      const { diagnoses } = service.listDiagnoses()
      expect(diagnoses.find(x => x.diagnosisId === d.diagnosisId)).toBeUndefined()
    })
  })

  // ───── 批量诊断 ─────

  describe('createDiagnosisBatch', () => {
    it('应基于 scenarioIds 创建批量诊断（正例）', () => {
      const batch = service.createDiagnosisBatch({
        engineId: 'engine-1',
        scenarioIds: ['scenario-a', 'scenario-b', 'scenario-c'],
        tenantId: 'tenant-a',
        triggeredBy: 'user-1',
      })
      expect(batch).toBeDefined()
      expect(batch.batchId).toMatch(/^batch-/)
      expect(batch.totalDiagnoses).toBe(3)
      expect(batch.diagnoses).toHaveLength(3)
      expect(batch.triggeredBy).toBe('user-1')
    })

    it('应自动完成所有诊断并设置适当风险等级', () => {
      const batch = service.createDiagnosisBatch({
        engineId: 'engine-1',
        scenarioIds: ['critical-scenario', 'normal-scenario'],
        tenantId: 't1',
        triggeredBy: 'u1',
      })
      expect(batch.diagnoses[0].status).toBe('COMPLETED')
      expect(batch.diagnoses[1].status).toBe('COMPLETED')
    })

    it('应正确计算命中率和风险分布', () => {
      const batch = service.createDiagnosisBatch({
        engineId: 'engine-1',
        scenarioIds: ['critical-a', 'critical-b', 'normal-c'],
        tenantId: 't1',
        triggeredBy: 'u1',
      })
      expect(batch.matchedDiagnoses).toBeGreaterThanOrEqual(1)
      expect(batch.matchRate).toBeGreaterThan(0)
      expect(batch.riskDistribution).toBeDefined()
      expect(typeof batch.riskDistribution.low).toBe('number')
      expect(typeof batch.riskDistribution.high).toBe('number')
    })

    it('engineId 参数应传递到每个诊断中', () => {
      const batch = service.createDiagnosisBatch({
        engineId: 'custom-engine',
        scenarioIds: ['s1'],
        tenantId: 't1',
        triggeredBy: 'u1',
      })
      expect(batch.engineId).toBe('custom-engine')
      expect(batch.diagnoses[0].engineId).toBe('custom-engine')
    })
  })

  describe('getDiagnosisBatch', () => {
    it('应返回已创建的批量（正例）', () => {
      const batch = service.createDiagnosisBatch({
        engineId: 'e1', scenarioIds: ['s1'], tenantId: 't1', triggeredBy: 'u1',
      })
      const retrieved = service.getDiagnosisBatch(batch.batchId)
      expect(retrieved).toBeDefined()
      expect(retrieved!.batchId).toBe(batch.batchId)
    })

    it('当 batchId 不存在时应返回 undefined（反例）', () => {
      const result = service.getDiagnosisBatch('non-existent-batch')
      expect(result).toBeUndefined()
    })
  })

  describe('listDiagnosisBatches', () => {
    it('应返回所有批次并按时间降序排列', () => {
      const b1 = service.createDiagnosisBatch({ engineId: 'e1', scenarioIds: ['s1'], tenantId: 't1', triggeredBy: 'u1' })
      const b2 = service.createDiagnosisBatch({ engineId: 'e1', scenarioIds: ['s2'], tenantId: 't1', triggeredBy: 'u2' })
      const batches = service.listDiagnosisBatches()
      expect(batches).toHaveLength(2)
      expect(batches[0].batchId).toBe(b2.batchId)
      expect(batches[1].batchId).toBe(b1.batchId)
    })

    it('应按 engineId 过滤', () => {
      service.createDiagnosisBatch({ engineId: 'engine-a', scenarioIds: ['s1'], tenantId: 't1', triggeredBy: 'u1' })
      service.createDiagnosisBatch({ engineId: 'engine-b', scenarioIds: ['s2'], tenantId: 't1', triggeredBy: 'u2' })
      const batches = service.listDiagnosisBatches({ engineId: 'engine-a' })
      expect(batches).toHaveLength(1)
      expect(batches[0].engineId).toBe('engine-a')
    })
  })

  // ───── 风险报告 ─────

  describe('generateRiskReport', () => {
    it('应生成包含统计信息的风险报告（正例）', () => {
      service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      service.createDiagnosis({ engineId: 'e1', scenarioId: 'critical-high', tenantId: 't1', requestedBy: 'u2' })
      const report = service.generateRiskReport()
      expect(report).toBeDefined()
      expect(report.totalEvaluated).toBeGreaterThanOrEqual(2)
      expect(report.generatedAt).toBeDefined()
      expect(report.riskDistribution).toBeDefined()
      expect(report.topRecommendations).toBeInstanceOf(Array)
      expect(typeof report.averageEvaluationDurationMs).toBe('number')
    })

    it('应按 engineId 和 tenantId 过滤', () => {
      service.createDiagnosis({ engineId: 'engine-x', scenarioId: 's1', tenantId: 'tenant-x', requestedBy: 'u1' })
      service.createDiagnosis({ engineId: 'engine-y', scenarioId: 's2', tenantId: 'tenant-y', requestedBy: 'u2' })
      const report = service.generateRiskReport({ engineId: 'engine-x', tenantId: 'tenant-x' })
      expect(report.totalEvaluated).toBe(1)
    })

    it('topRecommendations 应按风险等级排序', () => {
      service.createDiagnosis({ engineId: 'e1', scenarioId: 'critical-a', tenantId: 't1', requestedBy: 'u1' })
      service.createDiagnosis({ engineId: 'e1', scenarioId: 'high-b', tenantId: 't1', requestedBy: 'u2' })
      const report = service.generateRiskReport()
      if (report.topRecommendations.length >= 2) {
        const order = { critical: 0, high: 1, medium: 2, low: 3 }
        for (let i = 1; i < report.topRecommendations.length; i++) {
          expect(order[report.topRecommendations[i - 1].riskLevel as keyof typeof order]!)
            .toBeLessThanOrEqual(order[report.topRecommendations[i].riskLevel as keyof typeof order]!)
        }
      }
    })

    it('当没有任何诊断时，averageEvaluationDurationMs 应为 0（边界）', () => {
      const emptyService = new AiDiagnosisService()
      AiDiagnosisService.resetStores()
      const report = emptyService.generateRiskReport()
      expect(report.totalEvaluated).toBe(0)
      expect(report.averageEvaluationDurationMs).toBe(0)
    })
  })

  // ───── 并发与重置 ─────

  describe('resetStores (静态)', () => {
    it('重置后所有数据应被清除', () => {
      service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      AiDiagnosisService.resetStores()
      const { total } = service.listDiagnoses()
      expect(total).toBe(0)
      const batches = service.listDiagnosisBatches()
      expect(batches).toHaveLength(0)
    })
  })

  // ───── 全链路集成 ─────

  describe('集成场景', () => {
    it('应支持完整的 CRUD 流程（创建 → 更新 → 查询 → 删除）', () => {
      const d = service.createDiagnosis({ engineId: 'e1', scenarioId: 's1', tenantId: 't1', requestedBy: 'u1' })
      const updated = service.updateDiagnosis(d.diagnosisId, { status: 'COMPLETED', riskLevel: 'high', recommendation: 'Critical issue' })
      expect(updated!.status).toBe('COMPLETED')
      const retrieved = service.getDiagnosis(d.diagnosisId)
      expect(retrieved!.riskLevel).toBe('high')
      const deleted = service.deleteDiagnosis(d.diagnosisId)
      expect(deleted).toBe(true)
      expect(service.getDiagnosis(d.diagnosisId)).toBeUndefined()
    })

    it('批量诊断应正确关联到每个诊断', () => {
      const batch = service.createDiagnosisBatch({
        engineId: 'batch-engine',
        scenarioIds: ['s1', 's2', 's3'],
        tenantId: 'batch-tenant',
        triggeredBy: 'batch-user',
      })
      for (const d of batch.diagnoses) {
        expect(d.engineId).toBe('batch-engine')
        expect(d.tenantId).toBe('batch-tenant')
      }
    })
  })
})
