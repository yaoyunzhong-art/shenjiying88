/**
 * ai-model-config-advanced.deep.test.ts — 模型配置高级服务深层测试
 */
import { describe, it, expect } from 'vitest'
import { AdvancedModelConfigService } from './ai-model-config-advanced.service'

describe('AdvancedModelConfigService (Deep)', () => {
  const service = new AdvancedModelConfigService()

  it('getVersionHistory 应包含版本数字', () => {
    const h = service.getVersionHistory('gpt-4')
    expect(h[0].version).toMatch(/^\d+\.\d+\.\d+$/)
  })

  it('runBenchmark 延迟应满足 P50 ≤ P95 ≤ P99', () => {
    const b = service.runBenchmark('model-a', '1.0')
    expect(b.metrics.latencyP50).toBeLessThanOrEqual(b.metrics.latencyP95)
    expect(b.metrics.latencyP95).toBeLessThanOrEqual(b.metrics.latencyP99)
  })

  it('analyzeCost 明细之和应接近总成本', () => {
    const c = service.analyzeCost('model-a', 'Q2')
    const sum = Object.values(c.costBreakdown).reduce((s, v) => s + v, 0)
    expect(Math.abs(sum - c.totalCost)).toBeLessThan(10)
  })

  it('getModelRegistry 应包含模型详情', () => {
    const r = service.getModelRegistry()
    expect(r.models.length).toBe(4)
    r.models.forEach(m => {
      expect(m.availableVersions.length).toBeGreaterThan(0)
      expect(m.tags.length).toBeGreaterThan(0)
    })
  })

  it('validateConfig 应校验必填字段', () => {
    expect(service.validateConfig({}).valid).toBe(false)
    expect(service.validateConfig({ modelName: 'test', temperature: 0.7 }).valid).toBe(true)
  })

  it('getExperiments 应返回对照指标', () => {
    const exps = service.getExperiments('gpt-4')
    expect(exps.length).toBe(1)
    expect(exps[0].metrics.length).toBe(3)
  })

  it('getPromptTemplates 应包含变量定义', () => {
    const t = service.getPromptTemplates()
    expect(t.every(p => p.variables.length > 0)).toBe(true)
  })

  it('getRateLimitConfig 不同等级限额不同', () => {
    const p = service.getRateLimitConfig('m', 'premium')
    const s = service.getRateLimitConfig('m', 'standard')
    const b = service.getRateLimitConfig('m', 'basic')
    expect(p.rps).toBeGreaterThan(s.rps)
    expect(s.rps).toBeGreaterThan(b.rps)
  })

  it('getHealthStatus 应包含 3 个组件', () => {
    const h = service.getHealthStatus('model-a')
    expect(h.components.length).toBe(3)
  })
})
