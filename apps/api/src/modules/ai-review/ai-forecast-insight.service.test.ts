import { describe, it, expect } from 'vitest'
import { ForecastInsightService } from './ai-forecast-insight.service'

describe('ForecastInsightService', () => {
  const service = new ForecastInsightService()

  describe('compareForecastModels', () => {
    it('should return model comparison with best model', () => {
      const result = service.compareForecastModels()
      expect(result.models).toHaveLength(3)
      expect(result.bestModel).toBe('LSTM')
      expect(result.recommendation).toBeTruthy()
    })

    it('should have all models with MAPE, RMSE, bias', () => {
      const result = service.compareForecastModels()
      for (const m of result.models) {
        expect(m).toHaveProperty('name')
        expect(m).toHaveProperty('mape')
        expect(m).toHaveProperty('rmse')
        expect(typeof m.bias).toBe('number')
      }
    })

    it('should have LSTM with lowest MAPE', () => {
      const result = service.compareForecastModels()
      const lstm = result.models.find((m) => m.name === 'LSTM')
      expect(lstm).toBeDefined()
      expect(lstm!.mape).toBeLessThan(6)
    })
  })

  describe('simulateScenarios', () => {
    it('should simulate 3 scenarios for given base revenue', () => {
      const result = service.simulateScenarios(100000)
      expect(result.scenarios).toHaveLength(3)
      expect(result.details).toHaveLength(3)
    })

    it('should weight probabilities summing to 1', () => {
      const result = service.simulateScenarios(100000)
      const probSum = result.details.reduce((s, d) => s + d.probability, 0)
      expect(probSum).toBeCloseTo(1.0, 1)
    })

    it('should compute weighted forecast from probability * forecast', () => {
      const result = service.simulateScenarios(100000)
      const weighted = result.details.reduce((s, d) => s + d.probability * d.forecast, 0)
      expect(result.weightedForecast).toBeCloseTo(weighted, -1)
    })

    it('should handle zero base revenue', () => {
      const result = service.simulateScenarios(0)
      expect(result.weightedForecast).toBe(0)
    })
  })

  describe('analyzeSensitivity', () => {
    it('should return most sensitive variables', () => {
      const result = service.analyzeSensitivity()
      expect(result.mostSensitiveVariables.length).toBeGreaterThan(0)
      expect(result.mostSensitiveVariables).toContain('price')
    })

    it('should have variable impacts with direction', () => {
      const result = service.analyzeSensitivity()
      for (const v of result.variableImpact) {
        expect(['positive', 'negative']).toContain(v.direction)
        expect(v.impact).toBeGreaterThan(0)
      }
    })
  })

  describe('assessForecastConfidence', () => {
    it('should return confidence interval', () => {
      const result = service.assessForecastConfidence('fc-001')
      expect(result.overallConfidence).toBeGreaterThan(0)
      expect(result.confidenceInterval.p50).toBeGreaterThan(result.confidenceInterval.p90)
    })

    it('should have decreasing confidence for wider intervals', () => {
      const result = service.assessForecastConfidence('fc-001')
      expect(result.confidenceInterval.p50).toBeGreaterThanOrEqual(result.confidenceInterval.p80)
      expect(result.confidenceInterval.p80).toBeGreaterThanOrEqual(result.confidenceInterval.p90)
    })
  })

  describe('recommendInventory', () => {
    it('should return stock recommendation for SKU', () => {
      const result = service.recommendInventory('SKU-001')
      expect(result.recommendedAction).toBeTruthy()
      expect(result.optimalStockLevel).toBeGreaterThan(0)
      expect(result.safetyStock).toBeGreaterThan(0)
    })

    it('should have valid action type', () => {
      const result = service.recommendInventory('SKU-001')
      expect(['reorder', 'reduce', 'hold', 'expedite']).toContain(result.recommendedAction)
    })

    it('should have safety stock <= reorder point', () => {
      const result = service.recommendInventory('SKU-001')
      expect(result.safetyStock).toBeLessThanOrEqual(result.reorderPoint)
    })
  })

  describe('detectAnomalies', () => {
    it('should detect anomalies with severity levels', () => {
      const result = service.detectAnomalies('revenue')
      expect(result.anomalies.length).toBeGreaterThan(0)
      for (const a of result.anomalies) {
        expect(['minor', 'moderate', 'severe']).toContain(a.severity)
        expect(a).toHaveProperty('probableCause')
      }
    })

    it('should compute anomaly rate', () => {
      const result = service.detectAnomalies('revenue')
      expect(result.anomalyRate).toBeGreaterThan(0)
      expect(result.anomalyRate).toBeLessThan(1)
    })
  })

  describe('decomposeTimeSeries', () => {
    it('should decompose into trend/seasonal/residual', () => {
      const result = service.decomposeTimeSeries(24)
      expect(result.trend).toHaveLength(24)
      expect(result.seasonal).toHaveLength(24)
      expect(result.residual).toHaveLength(24)
    })

    it('should have strength values between 0 and 1', () => {
      const result = service.decomposeTimeSeries(12)
      expect(result.strength.trend).toBeGreaterThan(0)
      expect(result.strength.seasonal).toBeGreaterThan(0)
    })
  })

  describe('whatIfAnalysis', () => {
    it('should return best and worst case', () => {
      const result = service.whatIfAnalysis(100000)
      expect(result.bestCase.forecast).toBeGreaterThan(result.worstCase.forecast)
    })

    it('should describe adjustments with impact', () => {
      const result = service.whatIfAnalysis(100000)
      expect(result.adjustments.length).toBeGreaterThan(0)
      for (const adj of result.adjustments) {
        expect(adj).toHaveProperty('variable')
        expect(adj).toHaveProperty('impact')
      }
    })
  })

  describe('getForecastAccuracyReport', () => {
    it('should return accuracy metrics by horizon', () => {
      const result = service.getForecastAccuracyReport('2026-07')
      expect(result.accuracyByHorizon.length).toBeGreaterThan(0)
      expect(result.improvementSuggestions.length).toBeGreaterThan(0)
    })

    it('should have increasing MAPE for longer horizons', () => {
      const result = service.getForecastAccuracyReport('2026-07')
      for (let i = 1; i < result.accuracyByHorizon.length; i++) {
        expect(result.accuracyByHorizon[i].mape).toBeGreaterThanOrEqual(result.accuracyByHorizon[i - 1].mape)
      }
    })
  })

  describe('analyzeDemandShaping', () => {
    it('should return price elasticity analysis', () => {
      const result = service.analyzeDemandShaping('prod-001')
      expect(result.priceElasticity).toBeLessThan(0)
      expect(result.priceVolumeCurve.length).toBeGreaterThan(0)
      expect(result.optimalPrice).toBeGreaterThan(0)
    })

    it('should have segment elasticities with different values', () => {
      const result = service.analyzeDemandShaping('prod-001')
      expect(result.segmentElasticities.enterprise).toBeGreaterThan(result.segmentElasticities.smb)
    })
  })
})
