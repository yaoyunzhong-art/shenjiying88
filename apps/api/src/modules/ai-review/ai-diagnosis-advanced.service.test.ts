import { describe, it, expect } from 'vitest'
import { AdvancedDiagnosisService } from './ai-diagnosis-advanced.service'
import type { DiagnosisRecord } from './ai-diagnosis-advanced.service'

const sampleDiagnosis: DiagnosisRecord = {
  diagnosisId: 'd-001',
  engineId: 'engine-main',
  scenarioId: 'scenario-001',
  status: 'COMPLETED',
  matchedRuleIds: ['rule-1', 'rule-2'],
  matchedConditionIds: ['cond-1'],
  triggeredActionIds: ['act-1'],
  riskLevel: 'high',
  recommendation: 'Add index on orders.created_at',
  promptSummary: 'Slow query detection',
  evaluationDurationMs: 1200,
  inputSnapshot: { query: 'SELECT * FROM orders WHERE created_at > NOW() - 7d' },
  outputSnapshot: { suggestions: ['add_index'] },
  createdAt: '2026-07-20T10:00:00Z',
  completedAt: '2026-07-20T10:00:02Z',
  tenantId: 'tenant-001',
  requestedBy: 'user-001',
}

describe('AdvancedDiagnosisService', () => {
  const service = new AdvancedDiagnosisService()

  describe('analyzeRootCause', () => {
    it('should return root cause with evidence chain', () => {
      const result = service.analyzeRootCause(sampleDiagnosis)
      expect(result.rootCause).toBeTruthy()
      expect(result.confidence).toBeGreaterThan(0)
      expect(result.evidenceChain.length).toBeGreaterThan(0)
    })

    it('should include recommended actions', () => {
      const result = service.analyzeRootCause(sampleDiagnosis)
      expect(result.recommendedActions.length).toBeGreaterThan(0)
      for (const action of result.recommendedActions) {
        expect(typeof action).toBe('string')
      }
    })

    it('should identify impacted components', () => {
      const result = service.analyzeRootCause(sampleDiagnosis)
      expect(result.impactedComponents).toContain('postgresql-primary')
    })

    it('should have evidence with confidence values', () => {
      const result = service.analyzeRootCause(sampleDiagnosis)
      for (const evidence of result.evidenceChain) {
        expect(evidence.confidence).toBeGreaterThan(0)
        expect(evidence.confidence).toBeLessThanOrEqual(1)
      }
    })
  })

  describe('buildCausalGraph', () => {
    it('should return nodes and edges', () => {
      const result = service.buildCausalGraph(sampleDiagnosis)
      expect(result.nodes.length).toBeGreaterThan(0)
      expect(result.edges.length).toBeGreaterThan(0)
    })

    it('should have node types cause, effect, or intermediate', () => {
      const result = service.buildCausalGraph(sampleDiagnosis)
      for (const node of result.nodes) {
        expect(['cause', 'effect', 'intermediate']).toContain(node.type)
      }
    })
  })

  describe('detectRuleConflicts', () => {
    it('should analyze conflicts from diagnoses', () => {
      const result = service.detectRuleConflicts([sampleDiagnosis])
      expect(result.totalRulesAnalyzed).toBeGreaterThan(0)
      expect(result.consistencyRate).toBeGreaterThan(0)
    })

    it('should return consistency rate <= 1', () => {
      const result = service.detectRuleConflicts([sampleDiagnosis])
      expect(result.consistencyRate).toBeLessThanOrEqual(1)
    })

    it('should handle empty diagnoses array', () => {
      const result = service.detectRuleConflicts([])
      expect(result.totalRulesAnalyzed).toBe(0)
      expect(result.consistencyRate).toBeGreaterThan(0)
    })
  })

  describe('generateSuggestions', () => {
    it('should return ordered suggestions by priority', () => {
      const result = service.generateSuggestions(sampleDiagnosis)
      expect(result.length).toBeGreaterThan(0)
      for (const s of result) {
        expect(s).toHaveProperty('category')
        expect(s).toHaveProperty('priority')
        expect(s).toHaveProperty('estimatedEffort')
      }
    })

    it('should include perf and reliability categories', () => {
      const result = service.generateSuggestions(sampleDiagnosis)
      const categories = result.map((s) => s.category)
      expect(categories).toContain('perf')
      expect(categories).toContain('reliability')
    })
  })

  describe('compareModels', () => {
    it('should compare multiple engine IDs', () => {
      const result = service.compareModels(['engine-a', 'engine-b'])
      expect(result.models).toHaveLength(2)
      expect(result.bestModel).toBe('engine-a')
    })

    it('should return model metrics', () => {
      const result = service.compareModels(['engine-x'])
      const model = result.models[0]
      expect(model.accuracy).toBeGreaterThan(0)
      expect(model.latencyP50).toBeGreaterThan(0)
      expect(model.costPerRun).toBeGreaterThan(0)
    })

    it('should handle single engine', () => {
      const result = service.compareModels(['solo-engine'])
      expect(result.models).toHaveLength(1)
      expect(result.bestModel).toBe('solo-engine')
    })
  })

  describe('clusterAnomalies', () => {
    it('should cluster high-risk diagnoses', () => {
      const result = service.clusterAnomalies([sampleDiagnosis])
      expect(result.length).toBeGreaterThan(0)
      for (const cluster of result) {
        expect(cluster).toHaveProperty('clusterId')
        expect(cluster).toHaveProperty('recommendation')
      }
    })
  })

  describe('checkEngineHealth', () => {
    it('should return healthy status with uptime', () => {
      const result = service.checkEngineHealth('engine-main')
      expect(result.overallHealth).toBe('healthy')
      expect(result.uptimePct).toBeGreaterThan(99)
    })

    it('should report recent errors', () => {
      const result = service.checkEngineHealth('engine-main')
      expect(result.errorCount24h).toBeGreaterThanOrEqual(0)
    })
  })

  describe('analyzeTrend', () => {
    it('should return trend data for given metric', () => {
      const result = service.analyzeTrend([sampleDiagnosis], 'cpu', '7d')
      expect(result.metric).toBe('cpu')
      expect(result.periodData.length).toBeGreaterThan(0)
    })

    it('should return trend direction', () => {
      const result = service.analyzeTrend([sampleDiagnosis], 'latency', '30d')
      expect(['increasing', 'decreasing', 'stable', 'volatile']).toContain(result.trend)
    })
  })

  describe('summarizeBatchAnalysis', () => {
    it('should summarize batch with success/fail counts', () => {
      const batch = {
        batchId: 'batch-001',
        engineId: 'engine-main',
        totalDiagnoses: 10,
        matchedDiagnoses: 8,
        matchRate: 0.8,
        riskDistribution: { low: 5, high: 3 },
        avgEvaluationDurationMs: 500,
        diagnoses: [sampleDiagnosis],
        createdAt: '2026-07-20T10:00:00Z',
        triggeredBy: 'cron',
        tenantId: 'tenant-001',
      }
      const result = service.summarizeBatchAnalysis(batch)
      expect(result.totalAnalyses).toBe(10)
      expect(result.successCount).toBe(1)
      expect(result.performanceScore).toBeGreaterThan(0)
    })

    it('should handle empty diagnoses list safely', () => {
      const batch = {
        batchId: 'batch-002',
        engineId: 'engine-main',
        totalDiagnoses: 0,
        matchedDiagnoses: 0,
        matchRate: 0,
        riskDistribution: {},
        avgEvaluationDurationMs: 0,
        diagnoses: [],
        createdAt: '2026-07-20T10:00:00Z',
        triggeredBy: 'user',
        tenantId: 'tenant-001',
      }
      const result = service.summarizeBatchAnalysis(batch)
      expect(result.totalAnalyses).toBe(0)
      expect(result.successCount).toBe(0)
      expect(result.performanceScore).toBeGreaterThanOrEqual(0)
    })
  })
})
