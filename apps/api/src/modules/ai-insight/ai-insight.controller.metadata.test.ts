import 'reflect-metadata'
import { describe, it } from 'vitest'
import assert from 'node:assert/strict'
import { AiInsightController } from './ai-insight.controller'

describe('AiInsightController metadata', () => {
  it('controller should keep ai-insight path', () => {
    assert.equal(Reflect.getMetadata('path', AiInsightController), 'ai-insight')
  })

  it('routes should keep REST metadata', () => {
    const cases = [
      [AiInsightController.prototype.getKPIs, 0, 'kpis'],
      [AiInsightController.prototype.getKPIDetail, 0, 'kpis/:kpiId'],
      [AiInsightController.prototype.generateReport, 1, 'reports'],
      [AiInsightController.prototype.getReports, 0, 'reports'],
      [AiInsightController.prototype.detectAnomalies, 1, 'anomalies/detect'],
      [AiInsightController.prototype.getAnomalies, 0, 'anomalies'],
      [AiInsightController.prototype.acknowledgeAnomaly, 2, 'anomalies/:anomalyId/acknowledge'],
      [AiInsightController.prototype.resolveAnomaly, 2, 'anomalies/:anomalyId/resolve'],
      [AiInsightController.prototype.generateForecast, 1, 'forecasts'],
      [AiInsightController.prototype.getForecast, 0, 'forecasts/:trendId'],
      [AiInsightController.prototype.getDashboardSummary, 0, 'dashboard'],
    ] as const

    for (const [handler, method, path] of cases) {
      assert.equal(Reflect.getMetadata('method', handler), method)
      assert.equal(Reflect.getMetadata('path', handler), path)
    }
  })
})
