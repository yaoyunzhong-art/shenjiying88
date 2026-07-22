import { describe, it, expect } from 'vitest'
import { AdvancedReviewService } from './ai-review-advanced.service'

describe('AdvancedReviewService', () => {
  const service = new AdvancedReviewService()

  describe('assessTechnicalDebt', () => {
    it('should return debt ratio and breakdown', () => {
      const result = service.assessTechnicalDebt()
      expect(result.overallDebtRatio).toBeGreaterThan(0)
      expect(result.debtBreakdown.length).toBeGreaterThan(0)
      expect(result.estimatedEffortToFix.hours).toBeGreaterThan(0)
    })

    it('should have hotspots with recommendations', () => {
      const result = service.assessTechnicalDebt()
      expect(result.hotspots.length).toBeGreaterThan(0)
      for (const h of result.hotspots) {
        expect(h).toHaveProperty('file')
        expect(h).toHaveProperty('recommendation')
      }
    })

    it('should have trends over 6 months', () => {
      const result = service.assessTechnicalDebt()
      expect(result.trends).toHaveLength(6)
    })
  })

  describe('scanSecurity', () => {
    it('should detect vulnerabilities', () => {
      const result = service.scanSecurity()
      expect(result.totalVulnerabilities).toBeGreaterThan(0)
      expect(result.criticalCount + result.highCount + result.mediumCount + result.lowCount)
        .toBe(result.totalVulnerabilities)
    })

    it('should have critical severity vulnerabilities', () => {
      const result = service.scanSecurity()
      expect(result.criticalCount).toBeGreaterThan(0)
      expect(result.overallRiskLevel).toBe('critical')
    })

    it('should include remediation for each vuln', () => {
      const result = service.scanSecurity()
      for (const v of result.vulnerabilities) {
        expect(v).toHaveProperty('remediation')
        expect(v).toHaveProperty('cwe')
      }
    })
  })

  describe('analyzePerformance', () => {
    it('should identify hotspots', () => {
      const result = service.analyzePerformance()
      expect(result.hotspots.length).toBeGreaterThan(0)
      for (const h of result.hotspots) {
        expect(['cpu', 'memory', 'io', 'network']).toContain(h.type)
      }
    })

    it('should analyze bundle size', () => {
      const result = service.analyzePerformance()
      expect(result.bundleSizeAnalysis.totalSize).toBeTruthy()
      expect(result.bundleSizeAnalysis.unusedImports.length).toBeGreaterThan(0)
    })
  })

  describe('getQualityTrend', () => {
    it('should return quality metrics for period', () => {
      const result = service.getQualityTrend('2026-07')
      expect(result.period).toBe('2026-07')
      expect(result.metrics.maintainabilityIndex).toBeGreaterThan(0)
      expect(['A', 'B', 'C', 'D', 'F']).toContain(result.rating)
    })

    it('should have 6-month history', () => {
      const result = service.getQualityTrend('2026-07')
      expect(result.history).toHaveLength(6)
    })
  })

  describe('analyzeTeamEfficiency', () => {
    it('should return reviewer workload stats', () => {
      const result = service.analyzeTeamEfficiency('2026-07')
      expect(result.totalReviews).toBeGreaterThan(0)
      expect(result.reviewerWorkload.length).toBeGreaterThan(0)
    })

    it('should identify bottlenecks', () => {
      const result = service.analyzeTeamEfficiency('2026-07')
      expect(result.bottlenecks.length).toBeGreaterThan(0)
      expect(result.recommendations.length).toBeGreaterThan(0)
    })
  })

  describe('detectCodeSmells', () => {
    it('should return code smells with severity', () => {
      const result = service.detectCodeSmells()
      expect(result.totalSmells).toBeGreaterThan(0)
      for (const s of result.smells) {
        expect(s).toHaveProperty('type')
        expect(s).toHaveProperty('severity')
        expect(s).toHaveProperty('refactoringSuggestion')
      }
    })

    it('should group smells by type', () => {
      const result = service.detectCodeSmells()
      const typeSum = Object.values(result.smellsByType).reduce((s, v) => s + v, 0)
      expect(typeSum).toBe(result.totalSmells)
    })
  })

  describe('reviewArchitecture', () => {
    it('should identify layer violations', () => {
      const result = service.reviewArchitecture()
      expect(result.layers.length).toBeGreaterThan(0)
      for (const layer of result.layers) {
        expect(layer.couplingScore).toBeGreaterThan(0)
        expect(layer.cohesionScore).toBeGreaterThan(0)
      }
    })

    it('should detect circular dependencies', () => {
      const result = service.reviewArchitecture()
      expect(result.circularDependencies.length).toBeGreaterThan(0)
    })
  })

  describe('analyzeTestCoverage', () => {
    it('should return coverage stats', () => {
      const result = service.analyzeTestCoverage()
      expect(result.overallCoverage).toBeGreaterThan(0)
      expect(result.lineCoverage).toBeGreaterThan(0)
    })

    it('should identify untested files', () => {
      const result = service.analyzeTestCoverage()
      expect(result.untestedFiles.length).toBeGreaterThan(0)
      expect(result.testedFiles.length).toBeGreaterThan(0)
    })

    it('should provide recommendations', () => {
      const result = service.analyzeTestCoverage()
      expect(result.recommendations.length).toBeGreaterThan(0)
    })
  })
})
