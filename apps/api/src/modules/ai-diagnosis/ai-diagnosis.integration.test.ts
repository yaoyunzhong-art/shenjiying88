/**
 * ai-diagnosis-integration.test.ts — AI 诊断服务集成测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AiDiagnosisService } from './ai-diagnosis.service'
import { AdvancedDiagnosisService } from './ai-diagnosis-advanced.service'
import type { DiagnosisEntity, DiagnosisBatch } from './ai-diagnosis.entity'

describe('AiDiagnosis Full Integration', () => {
  let diagnosisService: AiDiagnosisService
  let advancedService: AdvancedDiagnosisService

  beforeEach(() => {
    AiDiagnosisService.resetStores()
    diagnosisService = new AiDiagnosisService()
    advancedService = new AdvancedDiagnosisService()
  })

  it('创建 → 更新 → 分析根因 → 生成建议完整链路', () => {
    const d = diagnosisService.createDiagnosis({
      engineId: 'engine-x',
      scenarioId: 'critical-scenario',
      tenantId: 'tenant-1',
      requestedBy: 'user-1',
    })

    // Update to COMPLETED with high risk
    diagnosisService.updateDiagnosis(d.diagnosisId, {
      status: 'COMPLETED',
      riskLevel: 'high',
      recommendation: '需要关注高风险配置',
      matchedRuleIds: ['rule-critical-1', 'rule-critical-2'],
      matchedConditionIds: ['cond-high-1', 'cond-high-2'],
      triggeredActionIds: ['act-alert'],
      outputSnapshot: { riskScore: 85 },
      evaluationDurationMs: 350,
    })

    const completed = diagnosisService.getDiagnosis(d.diagnosisId)!

    // Root cause analysis
    const rca = advancedService.analyzeRootCause(completed)
    expect(rca.rootCause).toBeTruthy()
    expect(rca.recommendedActions.length).toBeGreaterThan(0)

    // Causal graph
    const graph = advancedService.buildCausalGraph(completed)
    expect(graph.nodes.length).toBeGreaterThan(0)

    // Suggestions
    const suggestions = advancedService.generateSuggestions(completed)
    expect(suggestions.length).toBeGreaterThan(0)
  })

  it('批量诊断 → 批量摘要 → 异常聚类', () => {
    const batch = diagnosisService.createDiagnosisBatch({
      engineId: 'engine-y',
      scenarioIds: ['normal-a', 'critical-b', 'high-c', 'normal-d'],
      tenantId: 'tenant-2',
      triggeredBy: 'user-2',
    })

    // Batch summary
    const summary = advancedService.summarizeBatchAnalysis(batch)
    expect(summary.totalAnalyses).toBe(4)
    expect(summary.performanceScore).toBeGreaterThan(0)

    // Anomaly clustering
    const diagnoses = batch.diagnoses
    const clusters = advancedService.clusterAnomalies(diagnoses)
    expect(clusters.length).toBeGreaterThan(0)

    // Risk report
    const report = diagnosisService.generateRiskReport({ engineId: 'engine-y' })
    expect(report.totalEvaluated).toBe(4)
  })

  it('多引擎对比 → 趋势分析 → 健康检查', () => {
    const engines = ['engine-a', 'engine-b', 'engine-c']

    // Create some diagnoses for each engine
    for (const engine of engines) {
      for (let i = 0; i < 3; i++) {
        diagnosisService.createDiagnosis({
          engineId: engine,
          scenarioId: `scenario-${i}`,
          tenantId: 'tenant-3',
          requestedBy: 'user-3',
        })
      }
    }

    // Model comparison
    const comparison = advancedService.compareModels(engines)
    expect(comparison.models).toHaveLength(3)
    expect(comparison.bestModel).toBeTruthy()

    // Health check
    for (const engine of engines) {
      const health = advancedService.checkEngineHealth(engine)
      expect(health.engineId).toBe(engine)
      expect(health.ruleCount).toBeGreaterThan(0)
    }
  })

  it('规则冲突检测', () => {
    // Create diagnoses with varying rules
    const diagnoses: DiagnosisEntity[] = []
    for (let i = 0; i < 10; i++) {
      const d = diagnosisService.createDiagnosis({
        engineId: 'engine-z',
        scenarioId: `scenario-${i}`,
        tenantId: 'tenant-4',
        requestedBy: 'user-4',
      })
      diagnosisService.updateDiagnosis(d.diagnosisId, {
        status: 'COMPLETED',
        matchedRuleIds: [`rule-${Math.floor(i / 2)}`, `rule-${Math.floor(i / 3)}`],
        matchedConditionIds: [`cond-${i}`],
      })
      const completed = diagnosisService.getDiagnosis(d.diagnosisId)!
      diagnoses.push(completed)
    }

    const report = advancedService.detectRuleConflicts(diagnoses)
    expect(report.totalRulesAnalyzed).toBeGreaterThan(0)
    expect(report.generatedAt).toBeTruthy()
  })
})
