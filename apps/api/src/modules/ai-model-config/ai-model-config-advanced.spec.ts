/**
 * ai-model-config-advanced.spec.ts — 模型配置高级服务综合测试
 * 覆盖：AdvancedModelConfigService 全部方法
 * 三件套：正例+反例+边界
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { AdvancedModelConfigService } from './ai-model-config-advanced.service'

describe('AdvancedModelConfigService (Complete)', () => {
  let service: AdvancedModelConfigService

  beforeEach(() => { service = new AdvancedModelConfigService() })

  // ===== 版本管理 =====

  it('getVersionHistory 应包含版本状态和部署信息', () => {
    const history = service.getVersionHistory('model-a')
    expect(history.length).toBeGreaterThan(0)
    history.forEach(v => {
      expect(['active', 'staging', 'deprecated', 'archived']).toContain(v.status)
      expect(v.deployedBy).toBeTruthy()
      expect(v.performanceScore).toBeGreaterThan(0)
    })
  })

  it('getVersionHistory 版本号格式应正确', () => {
    const history = service.getVersionHistory('model-a')
    history.forEach(v => {
      expect(v.version).toMatch(/^\d+\.\d+\.\d+$/)
    })
  })

  it('getVersionHistory 新旧版本的时间戳顺序', () => {
    const history = service.getVersionHistory('model-a')
    for (let i = 1; i < history.length; i++) {
      expect(new Date(history[i - 1].deployedAt).getTime())
        .toBeGreaterThanOrEqual(new Date(history[i].deployedAt).getTime())
    }
  })

  // ===== 基准测试 =====

  it('runBenchmark 应包含 P50/P95/P99 延迟', () => {
    const bench = service.runBenchmark('model-a', '1.0')
    expect(bench.metrics.latencyP50).toBeLessThanOrEqual(bench.metrics.latencyP95)
    expect(bench.metrics.latencyP95).toBeLessThanOrEqual(bench.metrics.latencyP99)
    expect(bench.recommendation).toBeTruthy()
  })

  it('runBenchmark 准确率和F1分数应在0-1之间', () => {
    const bench = service.runBenchmark('model-a', '1.0')
    expect(bench.metrics.accuracy).toBeGreaterThan(0)
    expect(bench.metrics.accuracy).toBeLessThanOrEqual(1)
    expect(bench.metrics.f1Score).toBeGreaterThan(0)
    expect(bench.metrics.f1Score).toBeLessThanOrEqual(1)
  })

  it('runBenchmark throughput应为正数', () => {
    const bench = service.runBenchmark('model-a', '1.0')
    expect(bench.metrics.throughput).toBeGreaterThan(0)
  })

  it('runBenchmark testDataset应有samples信息', () => {
    const bench = service.runBenchmark('model-a', '1.0')
    expect(bench.testDataset.samples).toBeGreaterThan(0)
    expect(bench.testDataset.name).toBeTruthy()
  })

  // ===== 成本分析 =====

  it('analyzeCost 成本明细之和应接近总成本', () => {
    const cost = service.analyzeCost('model-a', '2026-Q2')
    const sum = cost.costBreakdown.compute + cost.costBreakdown.storage +
                cost.costBreakdown.apiCalls + cost.costBreakdown.training +
                cost.costBreakdown.inference
    expect(Math.abs(sum - cost.totalCost)).toBeLessThan(50)
  })

  it('analyzeCost monthlyTrend应有6个月数据', () => {
    const cost = service.analyzeCost('model-a', '2026-Q2')
    expect(cost.monthlyTrend).toHaveLength(6)
    cost.monthlyTrend.forEach(m => {
      expect(m.cost).toBeGreaterThan(0)
      expect(m.callVolume).toBeGreaterThan(0)
    })
  })

  it('analyzeCost 优化建议应含预估节省', () => {
    const cost = service.analyzeCost('model-a', '2026-Q2')
    cost.optimizationSuggestions.forEach(s => {
      expect(s.estimatedSavings).toBeGreaterThan(0)
      expect(s.difficulty).toBeTruthy()
    })
  })

  // ===== 模型注册表 =====

  it('getModelRegistry 应包含模型详情', () => {
    const reg = service.getModelRegistry()
    expect(reg.models.length).toBeGreaterThan(0)
    reg.models.forEach(m => {
      expect(m.modelId).toBeTruthy()
      expect(m.availableVersions.length).toBeGreaterThan(0)
      expect(m.tags.length).toBeGreaterThan(0)
    })
  })

  it('getModelRegistry 各模型应有owner和description', () => {
    const reg = service.getModelRegistry()
    reg.models.forEach(m => {
      expect(m.owner).toBeTruthy()
      expect(m.description).toBeTruthy()
    })
  })

  // ===== 配置校验 =====

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

  it('validateConfig 有效配置应通过校验', () => {
    const result = service.validateConfig({ modelName: 'test', temperature: 0.7, maxTokens: 2048 })
    expect(result.valid).toBe(true)
  })

  it('validateConfig maxTokens超限应产生警告', () => {
    const result = service.validateConfig({ modelName: 'test', maxTokens: 9999 })
    expect(result.warnings.some(w => w.field === 'maxTokens')).toBe(true)
  })

  it('validateConfig 应包含有效的suggestions', () => {
    const result = service.validateConfig({ modelName: 'test' })
    expect(result.suggestions.length).toBeGreaterThan(0)
  })

  // ===== 告警 =====

  it('getAlerts 应包含不同严重程度的告警', () => {
    const alerts = service.getAlerts('gpt-4')
    const severities = new Set(alerts.map(a => a.severity))
    expect(severities.size).toBeGreaterThanOrEqual(2)
  })

  it('getAlerts 每条告警应有推荐操作', () => {
    const alerts = service.getAlerts('gpt-4')
    alerts.forEach(a => {
      expect(a.recommendedAction).toBeTruthy()
      expect(a.metric).toBeTruthy()
    })
  })

  // ===== 实验追踪 =====

  it('getExperiments 应返回A/B实验指标', () => {
    const exps = service.getExperiments('gpt-4')
    expect(exps.length).toBeGreaterThan(0)
    exps.forEach(exp => {
      expect(exp.metrics.length).toBeGreaterThan(0)
      expect(exp.conclusion).toBeTruthy()
    })
  })

  it('getExperiments 实验应有胜负判定', () => {
    const exps = service.getExperiments('gpt-4')
    exps.forEach(exp => {
      exp.metrics.forEach(m => {
        expect(['control', 'treatment', 'none']).toContain(m.winner)
      })
    })
  })

  // ===== Prompt模板 =====

  it('getPromptTemplates 应包含模板变量', () => {
    const templates = service.getPromptTemplates()
    expect(templates.length).toBeGreaterThan(0)
    templates.forEach(t => {
      expect(t.variables.length).toBeGreaterThan(0)
      expect(t.performance.avgLatency).toBeGreaterThan(0)
    })
  })

  it('getPromptTemplates usageCount应反映使用情况', () => {
    const templates = service.getPromptTemplates()
    templates.forEach(t => {
      expect(t.usageCount).toBeGreaterThan(0)
      expect(t.lastUsed).toBeTruthy()
    })
  })

  // ===== 限流配置 =====

  it('getRateLimitConfig 高级套餐限额应更高', () => {
    const premium = service.getRateLimitConfig('model-a', 'premium')
    const standard = service.getRateLimitConfig('model-a', 'standard')
    expect(premium.rps).toBeGreaterThan(standard.rps)
    expect(premium.tpm).toBeGreaterThan(standard.tpm)
  })

  it('getRateLimitConfig premium支持burst', () => {
    const premium = service.getRateLimitConfig('model-a', 'premium')
    expect(premium.burstAllowed).toBe(true)
  })

  it('getRateLimitConfig 未知tier应使用最低配置', () => {
    const result = service.getRateLimitConfig('model-a', 'unknown')
    // 默认为default或basic，限额最低
    const basic = service.getRateLimitConfig('model-a', 'standard')
    const unknown = service.getRateLimitConfig('model-a', 'unknown')
    expect(unknown.rps).toBeLessThanOrEqual(basic.rps)
  })

  // ===== 健康状态 =====

  it('getHealthStatus 应包含组件健康信息和近期事件', () => {
    const health = service.getHealthStatus('model-a')
    expect(health.components.length).toBeGreaterThan(0)
    expect(health.metrics.requestVolume24h).toBeGreaterThan(0)
  })

  it('getHealthStatus overall状态应有效', () => {
    const health = service.getHealthStatus('model-a')
    expect(['healthy', 'degraded', 'unhealthy']).toContain(health.overall)
  })

  it('getHealthStatus uptime应在合理范围', () => {
    const health = service.getHealthStatus('model-a')
    expect(health.metrics.uptime).toBeGreaterThanOrEqual(95)
    expect(health.metrics.uptime).toBeLessThanOrEqual(100)
  })

  // ===== 集成场景 =====

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
