/**
 * ai-model-config-advanced.spec.ts — 模型配置高级服务综合测试
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AdvancedModelConfigService } from './ai-model-config-advanced.service'

describe('AdvancedModelConfigService (Complete)', () => {
  let service: AdvancedModelConfigService

  beforeEach(() => { service = new AdvancedModelConfigService() })

  it('getVersionHistory 应包含版本状态和部署信息', () => {
    const history = service.getVersionHistory('model-a')
    expect(history.length).toBeGreaterThan(0)
    history.forEach(v => {
      expect(['active', 'staging', 'deprecated', 'archived']).toContain(v.status)
      expect(v.deployedBy).toBeTruthy()
      expect(v.performanceScore).toBeGreaterThan(0)
    })
  })

  it('runBenchmark 应包含 P50/P95/P99 延迟', () => {
    const bench = service.runBenchmark('model-a', '1.0')
    expect(bench.metrics.latencyP50).toBeLessThanOrEqual(bench.metrics.latencyP95)
    expect(bench.metrics.latencyP95).toBeLessThanOrEqual(bench.metrics.latencyP99)
    expect(bench.recommendation).toBeTruthy()
  })

  it('analyzeCost 成本明细之和应接近总成本', () => {
    const cost = service.analyzeCost('model-a', '2026-Q2')
    const sum = cost.costBreakdown.compute + cost.costBreakdown.storage +
                cost.costBreakdown.apiCalls + cost.costBreakdown.training +
                cost.costBreakdown.inference
    expect(Math.abs(sum - cost.totalCost)).toBeLessThan(50)
  })

  it('getModelRegistry 应包含模型详情', () => {
    const reg = service.getModelRegistry()
    expect(reg.models.length).toBeGreaterThan(0)
    reg.models.forEach(m => {
      expect(m.modelId).toBeTruthy()
      expect(m.availableVersions.length).toBeGreaterThan(0)
      expect(m.tags.length).toBeGreaterThan(0)
    })
  })

  it('validateConfig 温度超出范围应报错', () => {
    const result = service.validateConfig({ modelName: 'test', temperature: 2.5 })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.field === 'temperature')).toBe(true)
  })

  it('validateConfig 缺少 modelName 应报错', () => {
    const result = service.validateConfig({ temperature: 0.7 })
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.field === 'modelName')).toBe(true)
  })

  it('getAlerts 应包含不同严重程度的告警', () => {
    const alerts = service.getAlerts('gpt-4')
    const severities = new Set(alerts.map(a => a.severity))
    expect(severities.size).toBeGreaterThanOrEqual(2)
  })

  it('getExperiments 应返回 A/B 实验指标', () => {
    const exps = service.getExperiments('gpt-4')
    expect(exps.length).toBeGreaterThan(0)
    exps.forEach(exp => {
      expect(exp.metrics.length).toBeGreaterThan(0)
      expect(exp.conclusion).toBeTruthy()
    })
  })

  it('getPromptTemplates 应包含模板变量', () => {
    const templates = service.getPromptTemplates()
    expect(templates.length).toBeGreaterThan(0)
    templates.forEach(t => {
      expect(t.variables.length).toBeGreaterThan(0)
      expect(t.performance.avgLatency).toBeGreaterThan(0)
    })
  })

  it('getRateLimitConfig 高级套餐限额应更高', () => {
    const premium = service.getRateLimitConfig('model-a', 'premium')
    const standard = service.getRateLimitConfig('model-a', 'standard')
    expect(premium.rps).toBeGreaterThan(standard.rps)
    expect(premium.tpm).toBeGreaterThan(standard.tpm)
  })

  it('getHealthStatus 应包含组件健康信息和近期事件', () => {
    const health = service.getHealthStatus('model-a')
    expect(health.components.length).toBeGreaterThan(0)
    expect(health.metrics.requestVolume24h).toBeGreaterThan(0)
  })

  describe('集成场景', () => {
    it('版本管理 → 基准测试 → 成本分析闭环', () => {
      const history = service.getVersionHistory('model-a')
      const latest = history[0]
      const bench = service.runBenchmark('model-a', latest.version)
      expect(bench.metrics.accuracy).toBeGreaterThan(0)
      const cost = service.analyzeCost('model-a', '2026-Q2')
      expect(cost.optimizationSuggestions.length).toBeGreaterThan(0)
    })
  })
})
