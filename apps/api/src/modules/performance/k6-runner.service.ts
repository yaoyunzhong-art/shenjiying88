/**
 * k6-runner.service.ts - Phase-23 T127-1
 * K6 风格的内存压测引擎
 */
import { Injectable } from '@nestjs/common'

// ── Types ───────────────────────────────────────────────────────────────────

export type LoadPattern = 'constant' | 'ramp' | 'peak' | 'stress' | 'spike'
export type StatusCode = 'ok' | 'error' | 'timeout' | 'crash'

export interface LoadTestConfig {
  name: string
  vu: number
  duration: number
  pattern: LoadPattern
  targetRPS?: number
  stages?: { duration: number; vu: number }[]
}

export interface RequestMetric {
  url: string
  method: 'GET' | 'POST' | 'PUT' | 'DELETE'
  statusCode: number
  responseTime: number
  timestamp: Date
  success: boolean
  error?: string
}

export interface AggregateMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  timeoutRequests: number
  avgResponseTime: number
  p50ResponseTime: number
  p95ResponseTime: number
  p99ResponseTime: number
  maxResponseTime: number
  minResponseTime: number
  requestsPerSecond: number
  errorRate: number
  throughputBytesPerSec: number
}

export interface LoadTestResult {
  config: LoadTestConfig
  metrics: AggregateMetrics
  duration: number
  startedAt: Date
  completedAt: Date
  statusCode: StatusCode
  bottlenecks: string[]
}

interface TestRun {
  config: LoadTestConfig
  result: LoadTestResult
}

// ── Helper Functions ─────────────────────────────────────────────────────────

function calculatePercentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const idx = Math.floor((p / 100) * sorted.length)
  return sorted[Math.min(idx, sorted.length - 1)]
}

function generateRequestDistribution(
  endpoints: { url: string; method: string; weight: number }[],
): { url: string; method: string } {
  const totalWeight = endpoints.reduce((sum, e) => sum + e.weight, 0)
  let random = Math.random() * totalWeight
  for (const endpoint of endpoints) {
    random -= endpoint.weight
    if (random <= 0) {
      return { url: endpoint.url, method: endpoint.method as 'GET' | 'POST' | 'PUT' | 'DELETE' }
    }
  }
  return { url: endpoints[0].url, method: endpoints[0].method as 'GET' | 'POST' | 'PUT' | 'DELETE' }
}

function simulateResponseTime(vu: number): number {
  const baseLatency = 50 + Math.random() * 150
  const congestionMultiplier = vu > 100 ? 1 + (vu - 100) / 200 : 1
  return baseLatency * congestionMultiplier
}

function simulateSuccess(): boolean {
  return Math.random() >= 0.02
}

// ── K6RunnerService ──────────────────────────────────────────────────────────

@Injectable()
export class K6RunnerService {
  private testResults = new Map<string, TestRun>()
  private testCounter = 0
  private currentMetrics: AggregateMetrics | null = null

  // ── 压测配置 ──────────────────────────────────────────────────────────────

  createConfig(config: Omit<LoadTestConfig, 'name'> & { name: string }): LoadTestConfig {
    return { ...config }
  }

  // ── 压测执行 ──────────────────────────────────────────────────────────────

  async runLoadTest(
    config: LoadTestConfig,
    endpoints: { url: string; method: string; weight: number }[],
  ): Promise<LoadTestResult> {
    const testId = `test-${++this.testCounter}`
    const startedAt = new Date()
    const allMetrics: RequestMetric[] = []

    let vu = config.vu
    let duration = config.duration

    switch (config.pattern) {
      case 'constant':
        break
      case 'peak':
        vu = Math.floor(config.vu * 5)
        break
      case 'stress':
        break
      case 'spike':
        vu = Math.floor(config.vu * 10)
        break
      default:
        break
    }

    const requestsPerVU = Math.ceil((config.targetRPS ?? config.vu * 10) * duration / vu)
    const totalExpectedRequests = vu * requestsPerVU

    const vuPromises: Promise<void>[] = []
    for (let i = 0; i < vu; i++) {
      vuPromises.push(this.runVU(i, requestsPerVU, endpoints, allMetrics))
    }

    await Promise.all(vuPromises)

    const completedAt = new Date()
    const actualDuration = (completedAt.getTime() - startedAt.getTime()) / 1000

    const metrics = this.computeMetrics(allMetrics, actualDuration)
    this.currentMetrics = metrics

    const bottlenecks = this.analyzeBottlenecks({ config, metrics, duration: actualDuration, startedAt, completedAt, statusCode: 'ok', bottlenecks: [] })

    const statusCode = this.determineStatusCode(metrics, bottlenecks)

    const result: LoadTestResult = {
      config,
      metrics,
      duration: actualDuration,
      startedAt,
      completedAt,
      statusCode,
      bottlenecks,
    }

    this.testResults.set(testId, { config, result })
    return result
  }

  private async runVU(
    vuId: number,
    requests: number,
    endpoints: { url: string; method: string; weight: number }[],
    allMetrics: RequestMetric[],
  ): Promise<void> {
    for (let i = 0; i < requests; i++) {
      const { url, method } = generateRequestDistribution(endpoints)
      const responseTime = simulateResponseTime(this.currentVU || 1)
      const isTimeout = Math.random() < 0.02
      const isSuccess = !isTimeout && simulateSuccess()

      const metric: RequestMetric = {
        url,
        method: method as 'GET' | 'POST' | 'PUT' | 'DELETE',
        statusCode: isTimeout ? 0 : isSuccess ? 200 : 500,
        responseTime,
        timestamp: new Date(),
        success: isSuccess && !isTimeout,
        error: isTimeout ? 'Request timeout' : !isSuccess ? 'Request failed' : undefined,
      }

      allMetrics.push(metric)

      await sleep(1)
    }
  }

  private currentVU = 1

  async runRampTest(
    config: LoadTestConfig,
    stages: { duration: number; vu: number }[],
  ): Promise<LoadTestResult> {
    const testId = `test-${++this.testCounter}`
    const startedAt = new Date()
    const allMetrics: RequestMetric[] = []

    const endpoints = config.targetRPS
      ? [{ url: '/test', method: 'GET' as const, weight: 1 }]
      : [{ url: '/test', method: 'GET' as const, weight: 1 }]

    for (const stage of stages) {
      this.currentVU = stage.vu
      const requestsPerVU = Math.ceil((config.targetRPS ?? stage.vu * 10) * stage.duration / stage.vu)
      const vuPromises: Promise<void>[] = []

      for (let i = 0; i < stage.vu; i++) {
        vuPromises.push(this.runVU(i, requestsPerVU, endpoints, allMetrics))
      }

      await Promise.all(vuPromises)
    }

    const completedAt = new Date()
    const actualDuration = (completedAt.getTime() - startedAt.getTime()) / 1000

    const metrics = this.computeMetrics(allMetrics, actualDuration)
    this.currentMetrics = metrics

    const resultConfig = { ...config, stages }
    const bottlenecks = this.analyzeBottlenecks({ config: resultConfig, metrics, duration: actualDuration, startedAt, completedAt, statusCode: 'ok', bottlenecks: [] })
    const statusCode = this.determineStatusCode(metrics, bottlenecks)

    const result: LoadTestResult = {
      config: resultConfig,
      metrics,
      duration: actualDuration,
      startedAt,
      completedAt,
      statusCode,
      bottlenecks,
    }

    this.testResults.set(testId, { config: resultConfig, result })
    return result
  }

  // ── 指标收集 ──────────────────────────────────────────────────────────────

  getRealtimeMetrics(): AggregateMetrics {
    return (
      this.currentMetrics ?? {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        timeoutRequests: 0,
        avgResponseTime: 0,
        p50ResponseTime: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        maxResponseTime: 0,
        minResponseTime: 0,
        requestsPerSecond: 0,
        errorRate: 0,
        throughputBytesPerSec: 0,
      }
    )
  }

  getResult(testId: string): LoadTestResult | null {
    const run = this.testResults.get(testId)
    return run?.result ?? null
  }

  // ── 瓶颈分析 ──────────────────────────────────────────────────────────────

  analyzeBottlenecks(result: LoadTestResult): string[] {
    const bottlenecks: string[] = []
    const { metrics } = result

    if (metrics.errorRate > 0.05) {
      bottlenecks.push('高错误率：需要检查服务稳定性')
    }

    if (metrics.p99ResponseTime > 1000) {
      bottlenecks.push('P99 延迟过高：需要优化慢查询或增加超时')
    }

    if (metrics.requestsPerSecond < (result.config.targetRPS ?? metrics.requestsPerSecond) * 0.5) {
      bottlenecks.push('吞吐量不足：瓶颈可能在数据库或连接池')
    }

    if (metrics.avgResponseTime > 500) {
      bottlenecks.push('平均响应时间过高：需要性能优化')
    }

    if (metrics.timeoutRequests > metrics.totalRequests * 0.01) {
      bottlenecks.push('超时率偏高：需要检查网络或服务容量')
    }

    return bottlenecks
  }

  suggestOptimizations(
    bottlenecks: string[],
  ): { priority: 'high' | 'medium' | 'low'; suggestion: string; expectedGain: string }[] {
    const suggestions: { priority: 'high' | 'medium' | 'low'; suggestion: string; expectedGain: string }[] = []

    for (const bottleneck of bottlenecks) {
      if (bottleneck.includes('高错误率')) {
        suggestions.push({
          priority: 'high',
          suggestion: '增加重试机制 + 检查服务健康状态',
          expectedGain: '错误率降低 80%',
        })
      } else if (bottleneck.includes('P99 延迟过高')) {
        suggestions.push({
          priority: 'high',
          suggestion: '优化数据库索引 + 添加缓存层',
          expectedGain: 'P99 降低 60%',
        })
      } else if (bottleneck.includes('吞吐量不足')) {
        suggestions.push({
          priority: 'medium',
          suggestion: '增加连接池大小 + 启用读写分离',
          expectedGain: '吞吐量提升 3x',
        })
      } else if (bottleneck.includes('平均响应时间过高')) {
        suggestions.push({
          priority: 'medium',
          suggestion: '启用压缩 + 优化查询语句',
          expectedGain: '响应时间降低 40%',
        })
      } else if (bottleneck.includes('超时率偏高')) {
        suggestions.push({
          priority: 'medium',
          suggestion: '增加超时时间 + 优化网络路由',
          expectedGain: '超时率降低 70%',
        })
      }
    }

    return suggestions
  }

  // ── 报告生成 ──────────────────────────────────────────────────────────────

  generateReport(result: LoadTestResult): string {
    const { config, metrics, duration, statusCode, bottlenecks } = result

    let report = `=== Load Test Report: ${config.name} ===\n`
    report += `Pattern: ${config.pattern} | VU: ${config.vu} | Duration: ${duration.toFixed(2)}s\n`
    report += `Status: ${statusCode}\n\n`

    report += `--- Metrics ---\n`
    report += `Total Requests: ${metrics.totalRequests}\n`
    report += `Successful: ${metrics.successfulRequests} | Failed: ${metrics.failedRequests} | Timeout: ${metrics.timeoutRequests}\n`
    report += `Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%\n`
    report += `RPS: ${metrics.requestsPerSecond.toFixed(2)}\n`
    report += `Avg Response Time: ${metrics.avgResponseTime.toFixed(2)}ms\n`
    report += `P50: ${metrics.p50ResponseTime.toFixed(2)}ms | P95: ${metrics.p95ResponseTime.toFixed(2)}ms | P99: ${metrics.p99ResponseTime.toFixed(2)}ms\n`
    report += `Min/Max: ${metrics.minResponseTime.toFixed(2)}ms / ${metrics.maxResponseTime.toFixed(2)}ms\n`
    report += `Throughput: ${metrics.throughputBytesPerSec.toFixed(2)} bytes/s\n\n`

    if (bottlenecks.length > 0) {
      report += `--- Bottlenecks ---\n`
      for (const b of bottlenecks) {
        report += `- ${b}\n`
      }
      report += `\n--- Suggestions ---\n`
      const suggestions = this.suggestOptimizations(bottlenecks)
      for (const s of suggestions) {
        report += `[${s.priority.toUpperCase()}] ${s.suggestion} (Expected: ${s.expectedGain})\n`
      }
    }

    return report
  }

  exportJSON(result: LoadTestResult): string {
    return JSON.stringify(result, null, 2)
  }

  // ── Private Helpers ───────────────────────────────────────────────────────

  private computeMetrics(metrics: RequestMetric[], duration: number): AggregateMetrics {
    const responseTimes = metrics.map((m) => m.responseTime)
    const totalRequests = metrics.length
    const successfulRequests = metrics.filter((m) => m.success && m.statusCode !== 0).length
    const failedRequests = metrics.filter((m) => !m.success && m.statusCode !== 0).length
    const timeoutRequests = metrics.filter((m) => m.statusCode === 0).length

    const avgResponseTime = responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      timeoutRequests,
      avgResponseTime,
      p50ResponseTime: calculatePercentile(responseTimes, 50),
      p95ResponseTime: calculatePercentile(responseTimes, 95),
      p99ResponseTime: calculatePercentile(responseTimes, 99),
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      requestsPerSecond: duration > 0 ? totalRequests / duration : 0,
      errorRate: totalRequests > 0 ? failedRequests / totalRequests : 0,
      throughputBytesPerSec: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / duration : 0,
    }
  }

  private determineStatusCode(metrics: AggregateMetrics, bottlenecks: string[]): StatusCode {
    if (bottlenecks.some((b) => b.includes('崩溃'))) return 'crash'
    if (metrics.timeoutRequests > metrics.totalRequests * 0.1) return 'timeout'
    if (metrics.errorRate > 0.2) return 'error'
    return 'ok'
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
