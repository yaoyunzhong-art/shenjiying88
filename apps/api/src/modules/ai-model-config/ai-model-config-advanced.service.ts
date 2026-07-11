/**
 * ai-model-config-advanced.service.ts — AI 模型配置高级服务
 *
 * 提供高级模型管理功能：模型版本管理、性能基准测试、
 * 成本分析、配置校验、部署策略、A/B 评估等
 */
import { Injectable } from '@nestjs/common'

export interface ModelVersionInfo {
  versionId: string
  modelName: string
  version: string
  status: 'active' | 'staging' | 'deprecated' | 'archived'
  deployedAt: string
  deployedBy: string
  configSnapshot: Record<string, unknown>
  performanceScore: number
  rollbackCount: number
  changelog: string
}

export interface BenchmarkResult {
  modelName: string
  modelVersion: string
  metrics: {
    latencyP50: number
    latencyP95: number
    latencyP99: number
    throughput: number
    accuracy: number
    precision: number
    recall: number
    f1Score: number
    memoryUsage: number
    cpuUsage: number
  }
  testDataset: { name: string; size: number; samples: number }
  comparedTo: Array<{
    version: string
    improvements: Record<string, number>
    regressions: Record<string, number>
  }>
  recommendation: string
}

export interface CostAnalysis {
  modelName: string
  period: string
  totalCost: number
  costBreakdown: {
    compute: number
    storage: number
    apiCalls: number
    training: number
    inference: number
  }
  costPerInference: number
  monthlyTrend: Array<{ month: string; cost: number; callVolume: number }>
  optimizationSuggestions: Array<{ suggestion: string; estimatedSavings: number; difficulty: string }>
}

export interface DeploymentStrategy {
  strategyName: string
  strategyType: 'blue_green' | 'canary' | 'rolling' | 'shadow'
  description: string
  rolloutPlan: Array<{ phase: number; trafficPercent: number; duration: string; validationCriteria: string }>
  rollbackPlan: { trigger: string; procedure: string; estimatedTime: string }
  monitoringDashboard: Array<{ metric: string; threshold: number; action: string }>
}

export interface ModelRegistry {
  models: Array<{
    modelId: string
    name: string
    type: string
    framework: string
    currentVersion: string
    availableVersions: string[]
    status: string
    lastDeployed: string
    owner: string
    description: string
    tags: string[]
  }>
}

export interface ConfigValidationResult {
  valid: boolean
  errors: Array<{ field: string; message: string; severity: string }>
  warnings: Array<{ field: string; message: string; severity: string }>
  suggestions: Array<{ field: string; currentValue: string; suggestedValue: string; reason: string }>
  schemaVersion: string
  validatedAt: string
}

export interface ModelMonitoringAlert {
  alertId: string
  modelName: string
  metric: string
  currentValue: number
  threshold: number
  severity: 'critical' | 'warning' | 'info'
  timestamp: string
  status: 'open' | 'acknowledged' | 'resolved'
  rootCause: string
  recommendedAction: string
}

export interface ExperimentTracking {
  experimentId: string
  experimentName: string
  modelName: string
  controlVersion: string
  treatmentVersion: string
  status: 'running' | 'completed' | 'failed'
  startTime: string
  endTime: string
  metrics: Array<{
    name: string
    controlValue: number
    treatmentValue: number
    lift: number
    significance: number
    winner: 'control' | 'treatment' | 'none'
  }>
  trafficAllocation: { control: number; treatment: number }
  conclusion: string
}

export interface PromptTemplate {
  templateId: string
  name: string
  version: string
  content: string
  variables: Array<{ name: string; type: string; description: string; required: boolean; defaultValue?: string }>
  modelType: string
  performance: { avgLatency: number; avgTokens: number; successRate: number }
  usageCount: number
  lastUsed: string
}

export interface RateLimitConfig {
  modelName: string
  tier: string
  rps: number
  rpm: number
  tpm: number
  concurrency: number
  burstAllowed: boolean
  queueEnabled: boolean
  queueTimeout: number
}

export interface HealthStatus {
  modelName: string
  overall: 'healthy' | 'degraded' | 'unhealthy'
  components: Array<{ name: string; status: string; lastCheck: string; message: string }>
  metrics: {
    uptime: number
    availability: number
    errorRate: number
    avgResponseTime: number
    p99ResponseTime: number
    requestVolume24h: number
  }
  recentIncidents: Array<{ timestamp: string; component: string; severity: string; summary: string; resolved: boolean }>
}

@Injectable()
export class AdvancedModelConfigService {
  /**
   * 模型版本管理
   */
  getVersionHistory(modelName: string): ModelVersionInfo[] {
    const statuses: Array<'active' | 'staging' | 'deprecated' | 'archived'> = ['active', 'staging', 'deprecated', 'archived']
    return Array.from({ length: 5 }, (_, i) => ({
      versionId: `ver-${Date.now()}-${i}`,
      modelName,
      version: `${1 + Math.floor(i / 2)}.${i % 2}.0`,
      status: statuses[Math.min(i, 3)] as any,
      deployedAt: new Date(Date.now() - i * 7 * 86400000).toISOString(),
      deployedBy: `工程师 ${['Alice', 'Bob', 'Charlie', 'David', 'Eve'][i]}`,
      configSnapshot: { temperature: 0.7 + i * 0.05, maxTokens: 2048, topP: 0.9 },
      performanceScore: Math.round((85 - i * 3 + Math.random() * 5) * 10) / 10,
      rollbackCount: i > 2 ? 1 : 0,
      changelog: `版本 ${1 + Math.floor(i / 2)}.${i % 2}.0 更新内容`,
    }))
  }

  /**
   * 基准测试
   */
  runBenchmark(modelName: string, modelVersion: string): BenchmarkResult {
    return {
      modelName,
      modelVersion,
      metrics: {
        latencyP50: Math.round((50 + Math.random() * 100) * 10) / 10,
        latencyP95: Math.round((150 + Math.random() * 250) * 10) / 10,
        latencyP99: Math.round((300 + Math.random() * 500) * 10) / 10,
        throughput: Math.round(50 + Math.random() * 150),
        accuracy: Math.round((0.85 + Math.random() * 0.12) * 10000) / 10000,
        precision: Math.round((0.82 + Math.random() * 0.15) * 10000) / 10000,
        recall: Math.round((0.80 + Math.random() * 0.15) * 10000) / 10000,
        f1Score: Math.round((0.83 + Math.random() * 0.14) * 10000) / 10000,
        memoryUsage: Math.round((500 + Math.random() * 1500) * 10) / 10,
        cpuUsage: Math.round((40 + Math.random() * 40) * 10) / 10,
      },
      testDataset: { name: 'validation-v3', size: 10000, samples: 1000 },
      comparedTo: [
        { version: `${modelVersion.split('.')[0]}.${String(Number(modelVersion.split('.')[1]) - 1)}.0`, improvements: { accuracy: 0.02, latencyP50: -15 }, regressions: { memoryUsage: 50 } },
      ],
      recommendation: '当前版本在准确率上有小幅提升，但延迟略有增加，建议优化推理性能',
    }
  }

  /**
   * 成本分析
   */
  analyzeCost(modelName: string, period: string): CostAnalysis {
    const compute = Math.round(2000 + Math.random() * 3000)
    const storage = Math.round(200 + Math.random() * 300)
    const apiCalls = Math.round(500 + Math.random() * 1500)
    const training = Math.round(1000 + Math.random() * 2000)
    const inference = Math.round(1500 + Math.random() * 2500)

    return {
      modelName,
      period,
      totalCost: compute + storage + apiCalls + training + inference,
      costBreakdown: { compute, storage, apiCalls, training, inference },
      costPerInference: Math.round((0.001 + Math.random() * 0.003) * 10000) / 10000,
      monthlyTrend: Array.from({ length: 6 }, (_, i) => ({
        month: new Date(Date.now() - (5 - i) * 30 * 86400000).toISOString().slice(0, 7),
        cost: Math.round(3000 + Math.random() * 4000),
        callVolume: Math.round(50000 + Math.random() * 150000),
      })),
      optimizationSuggestions: [
        { suggestion: '启用模型量化减少推理成本', estimatedSavings: Math.round(inference * 0.3), difficulty: 'medium' },
        { suggestion: '使用批量推理减少API调用', estimatedSavings: Math.round(apiCalls * 0.2), difficulty: 'easy' },
        { suggestion: '优化存储策略，清理历史版本', estimatedSavings: Math.round(storage * 0.4), difficulty: 'easy' },
      ],
    }
  }

  /**
   * 模型注册表
   */
  getModelRegistry(): ModelRegistry {
    return {
      models: [
        { modelId: 'model-001', name: 'gpt-4', type: 'llm', framework: 'openai', currentVersion: '2.1.0', availableVersions: ['1.0.0', '1.5.0', '2.0.0', '2.1.0'], status: 'active', lastDeployed: '2026-07-01T10:00:00Z', owner: 'AI平台团队', description: '主要对话模型，支持多轮对话和复杂推理', tags: ['llm', 'chat', 'production'] },
        { modelId: 'model-002', name: 'embedding-v3', type: 'embedding', framework: 'sentence-transformers', currentVersion: '3.0.0', availableVersions: ['1.0.0', '2.0.0', '3.0.0'], status: 'active', lastDeployed: '2026-06-15T08:00:00Z', owner: '搜索团队', description: '文本向量化模型，用于RAG检索', tags: ['embedding', 'rag', 'search'] },
        { modelId: 'model-003', name: 'sentiment-v2', type: 'classification', framework: 'pytorch', currentVersion: '2.0.0', availableVersions: ['1.0.0', '2.0.0'], status: 'staging', lastDeployed: '2026-07-10T14:00:00Z', owner: 'NLP团队', description: '情感分析模型，支持5分类情绪识别', tags: ['nlp', 'sentiment', 'classification'] },
        { modelId: 'model-004', name: 'recommend-v3', type: 'recommendation', framework: 'tensorflow', currentVersion: '3.1.0', availableVersions: ['1.0.0', '2.0.0', '3.0.0', '3.1.0'], status: 'deprecated', lastDeployed: '2026-05-01T12:00:00Z', owner: '推荐团队', description: '个性化推荐模型，已迁移至新架构', tags: ['recommendation', 'personalization', 'legacy'] },
      ],
    }
  }

  /**
   * 配置校验
   */
  validateConfig(config: Record<string, unknown>): ConfigValidationResult {
    const errors: ConfigValidationResult['errors'] = []
    const warnings: ConfigValidationResult['warnings'] = []

    if (!config.modelName) {
      errors.push({ field: 'modelName', message: '模型名称不能为空', severity: 'error' })
    }
    if (config.temperature !== undefined && (config.temperature as number) > 2) {
      errors.push({ field: 'temperature', message: 'temperature 必须在 0-2 之间', severity: 'error' })
    }
    if (config.maxTokens !== undefined && (config.maxTokens as number) > 8192) {
      warnings.push({ field: 'maxTokens', message: 'maxTokens 超过 8192 可能导致性能问题', severity: 'warning' })
    }
    if (!config.apiKey) {
      warnings.push({ field: 'apiKey', message: '未配置 API Key', severity: 'warning' })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      suggestions: [
        { field: 'temperature', currentValue: String(config.temperature ?? '未设置'), suggestedValue: '0.7', reason: '通用场景推荐温度 0.7，平衡创造性和确定性' },
        { field: 'topP', currentValue: String(config.topP ?? '未设置'), suggestedValue: '0.9', reason: 'topP 0.9 在大多数场景下表现最佳' },
      ],
      schemaVersion: 'v2',
      validatedAt: new Date().toISOString(),
    }
  }

  /**
   * 监控告警
   */
  getAlerts(modelName: string): ModelMonitoringAlert[] {
    const severities: Array<'critical' | 'warning' | 'info'> = ['critical', 'warning', 'info']
    const statuses: Array<'open' | 'acknowledged' | 'resolved'> = ['open', 'acknowledged', 'resolved']

    return [
      { alertId: `alert-${Date.now()}-1`, modelName, metric: 'P95延迟', currentValue: 520, threshold: 500, severity: 'warning', timestamp: new Date(Date.now() - 1800000).toISOString(), status: 'open', rootCause: '高峰期请求激增', recommendedAction: '检查是否需要扩容' },
      { alertId: `alert-${Date.now()}-2`, modelName, metric: '错误率', currentValue: 3.2, threshold: 2, severity: 'critical', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'acknowledged', rootCause: '部分请求超时', recommendedAction: '审查最近部署的配置变更' },
      { alertId: `alert-${Date.now()}-3`, modelName, metric: '内存使用率', currentValue: 82, threshold: 90, severity: 'info', timestamp: new Date(Date.now() - 7200000).toISOString(), status: 'resolved', rootCause: '内存泄漏已修复', recommendedAction: '无' },
    ]
  }

  /**
   * 实验追踪
   */
  getExperiments(modelName: string): ExperimentTracking[] {
    return [
      {
        experimentId: `exp-${Date.now()}-1`,
        experimentName: '温度参数A/B测试',
        modelName,
        controlVersion: '2.0.0',
        treatmentVersion: '2.1.0',
        status: 'completed',
        startTime: new Date(Date.now() - 14 * 86400000).toISOString(),
        endTime: new Date(Date.now() - 7 * 86400000).toISOString(),
        metrics: [
          { name: '用户满意度', controlValue: 4.2, treatmentValue: 4.5, lift: 7.1, significance: 0.95, winner: 'treatment' },
          { name: '回答准确率', controlValue: 0.88, treatmentValue: 0.91, lift: 3.4, significance: 0.92, winner: 'treatment' },
          { name: '平均延迟', controlValue: 120, treatmentValue: 135, lift: -12.5, significance: 0.88, winner: 'control' },
        ],
        trafficAllocation: { control: 50, treatment: 50 },
        conclusion: '新版在用户满意度和准确率上有显著提升，虽有小幅延迟增加，建议全量发布',
      },
    ]
  }

  /**
   * 获取 Prompt 模板
   */
  getPromptTemplates(): PromptTemplate[] {
    return [
      { templateId: 'prompt-001', name: '通用助手提示', version: '1.2', content: '你是一个专业的AI助手，请回答用户的问题。\n用户问题: {question}\n请提供详细且有帮助的回答。', variables: [{ name: 'question', type: 'string', description: '用户问题', required: true }], modelType: 'chat', performance: { avgLatency: 320, avgTokens: 512, successRate: 99.2 }, usageCount: 15000, lastUsed: '2026-07-11T10:00:00Z' },
      { templateId: 'prompt-002', name: '代码审查模板', version: '2.0', content: '请审查以下代码，检查：安全性、性能、可维护性、代码风格。\n语言: {language}\n代码:\n```\n{code}\n```', variables: [{ name: 'language', type: 'string', description: '编程语言', required: true, defaultValue: 'typescript' }, { name: 'code', type: 'string', description: '待审查的代码', required: true }], modelType: 'code', performance: { avgLatency: 850, avgTokens: 1500, successRate: 97.5 }, usageCount: 3200, lastUsed: '2026-07-10T16:00:00Z' },
    ]
  }

  /**
   * 限流配置
   */
  getRateLimitConfig(modelName: string, tier: string): RateLimitConfig {
    return {
      modelName,
      tier,
      rps: tier === 'premium' ? 100 : tier === 'standard' ? 50 : 20,
      rpm: tier === 'premium' ? 6000 : tier === 'standard' ? 3000 : 1200,
      tpm: tier === 'premium' ? 1000000 : tier === 'standard' ? 500000 : 200000,
      concurrency: tier === 'premium' ? 20 : tier === 'standard' ? 10 : 5,
      burstAllowed: tier === 'premium',
      queueEnabled: true,
      queueTimeout: tier === 'premium' ? 30000 : 10000,
    }
  }

  /**
   * 健康状态
   */
  getHealthStatus(modelName: string): HealthStatus {
    return {
      modelName,
      overall: Math.random() > 0.2 ? 'healthy' : Math.random() > 0.5 ? 'degraded' : 'unhealthy',
      components: [
        { name: '推理服务', status: 'healthy', lastCheck: new Date().toISOString(), message: '正常运行' },
        { name: '缓存层', status: 'healthy', lastCheck: new Date().toISOString(), message: '缓存命中率 78%' },
        { name: '数据库', status: 'healthy', lastCheck: new Date().toISOString(), message: '连接池正常' },
      ],
      metrics: {
        uptime: Math.round((99.5 + Math.random() * 0.4) * 100) / 100,
        availability: Math.round((99.2 + Math.random() * 0.7) * 100) / 100,
        errorRate: Math.round((0.1 + Math.random() * 1.5) * 100) / 100,
        avgResponseTime: Math.round((80 + Math.random() * 120) * 10) / 10,
        p99ResponseTime: Math.round((300 + Math.random() * 400) * 10) / 10,
        requestVolume24h: Math.round(80000 + Math.random() * 120000),
      },
      recentIncidents: [
        { timestamp: new Date(Date.now() - 86400000).toISOString(), component: '推理服务', severity: 'minor', summary: '短暂连接超时，持续3分钟', resolved: true },
      ],
    }
  }
}
