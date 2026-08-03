// gateway-analytics.service.ts — Gateway API 网关分析服务
// 提供请求量统计、延迟分析、端点热度、异常检测

import { Injectable, Logger } from '@nestjs/common'
import type {
  GatewayLogEntry,
  GatewayAnalyticsSummary,
  EndpointAnalytics,
  ClientAnalytics,
  TimeSeriesPoint,
  AnomalyDetectionResult,
  AnalyticsQuery,
} from './gateway.entity'

@Injectable()
export class GatewayAnalyticsService {
  private readonly logger = new Logger(GatewayAnalyticsService.name)

  /** 请求日志存储 (注入方式) */
  private logSource: { getRequestLogs(limit?: number): GatewayLogEntry[] } | null = null

  /**
   * 注入日志源 (由模块初始化时调用)
   */
  setLogSource(source: { getRequestLogs(limit?: number): GatewayLogEntry[] }): void {
    this.logSource = source
    this.logger.debug('GatewayAnalyticsService: log source connected')
  }

  /**
   * 获取网关分析摘要
   */
  async getSummary(query?: AnalyticsQuery): Promise<GatewayAnalyticsSummary> {
    const logs = this.getFilteredLogs(query)
    if (logs.length === 0) {
      const now = Date.now()
      return {
        totalRequests: 0,
        totalErrors: 0,
        errorRate: 0,
        avgLatencyMs: 0,
        p50LatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        uniqueClients: 0,
        uniqueEndpoints: 0,
        periodStart: query?.startTime ?? now,
        periodEnd: query?.endTime ?? now,
      }
    }

    const errors = logs.filter(l => l.statusCode && l.statusCode >= 400)
    const latencies = logs.filter(l => l.responseTime != null).map(l => l.responseTime!)
    const avgLatency = latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0
    const sortedLatencies = [...latencies].sort((a, b) => a - b)

    const clients = new Set(logs.map(l => l.clientId).filter(Boolean))
    const endpoints = new Set(logs.map(l => `${l.method}:${l.path}`))

    return {
      totalRequests: logs.length,
      totalErrors: errors.length,
      errorRate: logs.length > 0 ? errors.length / logs.length : 0,
      avgLatencyMs: Math.round(avgLatency),
      p50LatencyMs: this.percentile(sortedLatencies, 50),
      p95LatencyMs: this.percentile(sortedLatencies, 95),
      p99LatencyMs: this.percentile(sortedLatencies, 99),
      uniqueClients: clients.size,
      uniqueEndpoints: endpoints.size,
      periodStart: query?.startTime ?? (logs.length > 0 ? logs[0].timestamp : Date.now()),
      periodEnd: query?.endTime ?? (logs.length > 0 ? logs[logs.length - 1].timestamp : Date.now()),
    }
  }

  /**
   * 获取端点级分析
   */
  async getEndpointAnalytics(query?: AnalyticsQuery): Promise<EndpointAnalytics[]> {
    const logs = this.getFilteredLogs(query)
    const endpointMap = new Map<string, { count: number; errors: number; latencies: number[]; lastAccess: number }>()

    for (const log of logs) {
      const key = `${log.method}:${log.path}`
      const existing = endpointMap.get(key) ?? { count: 0, errors: 0, latencies: [], lastAccess: 0 }
      existing.count++
      if (log.statusCode && log.statusCode >= 400) existing.errors++
      if (log.responseTime != null) existing.latencies.push(log.responseTime)
      if (log.timestamp > existing.lastAccess) existing.lastAccess = log.timestamp
      endpointMap.set(key, existing)
    }

    const result: EndpointAnalytics[] = []
    for (const [key, data] of endpointMap) {
      const [method, ...pathParts] = key.split(':')
      const path = pathParts.join(':')
      const avgLat = data.latencies.length > 0
        ? Math.round(data.latencies.reduce((a, b) => a + b, 0) / data.latencies.length)
        : 0
      const sortedLat = [...data.latencies].sort((a, b) => a - b)

      result.push({
        path,
        method,
        requestCount: data.count,
        errorCount: data.errors,
        avgLatencyMs: avgLat,
        p95LatencyMs: this.percentile(sortedLat, 95),
        lastAccessedAt: data.lastAccess,
      })
    }

    result.sort((a, b) => b.requestCount - a.requestCount)
    return result
  }

  /**
   * 获取客户端分析
   */
  async getClientAnalytics(query?: AnalyticsQuery): Promise<ClientAnalytics[]> {
    const logs = this.getFilteredLogs(query)
    const clientMap = new Map<string, { count: number; endpoints: Set<string>; rateLimitHits: number; lastActive: number }>()

    for (const log of logs) {
      const clientId = log.clientId ?? 'anonymous'
      const existing = clientMap.get(clientId) ?? { count: 0, endpoints: new Set(), rateLimitHits: 0, lastActive: 0 }
      existing.count++
      existing.endpoints.add(`${log.method}:${log.path}`)
      if (log.statusCode === 429) existing.rateLimitHits++
      if (log.timestamp > existing.lastActive) existing.lastActive = log.timestamp
      clientMap.set(clientId, existing)
    }

    const result: ClientAnalytics[] = []
    for (const [clientId, data] of clientMap) {
      result.push({
        clientId,
        ownerId: clientId,
        requestCount: data.count,
        distinctEndpoints: data.endpoints.size,
        rateLimitHits: data.rateLimitHits,
        quotaUtilization: data.rateLimitHits > 0
          ? Math.min(1, data.rateLimitHits / data.count)
          : 0,
        lastActiveAt: data.lastActive,
      })
    }

    result.sort((a, b) => b.requestCount - a.requestCount)
    return result
  }

  /**
   * 获取请求时间序列 (按分钟聚合)
   */
  async getTimeSeries(query?: AnalyticsQuery): Promise<{ requests: TimeSeriesPoint[]; errors: TimeSeriesPoint[]; latencies: TimeSeriesPoint[] }> {
    const logs = this.getFilteredLogs(query)
    const { resolution = '1m', startTime = logs.length > 0 ? logs[0].timestamp : Date.now() - 3600000 } = query ?? {}

    const intervalMs = resolution === '1m' ? 60000 : resolution === '5m' ? 300000 : resolution === '1h' ? 3600000 : 86400000
    const endTime = query?.endTime ?? (logs.length > 0 ? logs[logs.length - 1].timestamp : Date.now())

    const bucketCount = Math.max(1, Math.ceil((endTime - startTime) / intervalMs))
    const requestBuckets = new Array(bucketCount).fill(0)
    const errorBuckets = new Array(bucketCount).fill(0)
    const latencyBuckets: number[][] = Array.from({ length: bucketCount }, () => [])

    for (const log of logs) {
      const idx = Math.min(bucketCount - 1, Math.floor((log.timestamp - startTime) / intervalMs))
      if (idx >= 0 && idx < bucketCount) {
        requestBuckets[idx]++
        if (log.statusCode && log.statusCode >= 400) errorBuckets[idx]++
        if (log.responseTime != null) latencyBuckets[idx].push(log.responseTime)
      }
    }

    const requests: TimeSeriesPoint[] = []
    const errors: TimeSeriesPoint[] = []
    const latencies: TimeSeriesPoint[] = []

    for (let i = 0; i < bucketCount; i++) {
      const ts = startTime + i * intervalMs
      requests.push({ timestamp: ts, value: requestBuckets[i] })
      errors.push({ timestamp: ts, value: errorBuckets[i] })
      const avgLat = latencyBuckets[i].length > 0
        ? Math.round(latencyBuckets[i].reduce((a, b) => a + b, 0) / latencyBuckets[i].length)
        : 0
      latencies.push({ timestamp: ts, value: avgLat })
    }

    return { requests, errors, latencies }
  }

  /**
   * 异常检测 (基于最近日志的指标偏离)
   */
  async detectAnomalies(query?: AnalyticsQuery): Promise<AnomalyDetectionResult[]> {
    const logs = this.getFilteredLogs(query)
    if (logs.length < 10) {
      return [{ detected: false, metric: 'insufficient_data', currentValue: 0, baselineMean: 0, baselineStdDev: 0, deviationFactor: 0, severity: 'low', recommendation: '需要更多数据才能进行异常检测' }]
    }

    const anomalies: AnomalyDetectionResult[] = []
    const mid = Math.floor(logs.length / 2)
    const recentLogs = logs.slice(mid)
    const baselineLogs = logs.slice(0, mid)

    // 延迟异常
    const baselineLatencies = baselineLogs.filter(l => l.responseTime != null).map(l => l.responseTime!)
    const recentLatencies = recentLogs.filter(l => l.responseTime != null).map(l => l.responseTime!)
    if (baselineLatencies.length >= 5 && recentLatencies.length >= 3) {
      const baselineMean = baselineLatencies.reduce((a, b) => a + b, 0) / baselineLatencies.length
      const baselineStdDev = Math.sqrt(baselineLatencies.reduce((a, b) => a + (b - baselineMean) ** 2, 0) / baselineLatencies.length)
      const recentMean = recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length
      const deviation = baselineStdDev > 0 ? (recentMean - baselineMean) / baselineStdDev : 0

      if (deviation > 2) {
        anomalies.push({
          detected: true,
          metric: 'avg_latency',
          currentValue: Math.round(recentMean),
          baselineMean: Math.round(baselineMean),
          baselineStdDev: Math.round(baselineStdDev),
          deviationFactor: Math.round(deviation * 10) / 10,
          severity: deviation > 4 ? 'critical' : deviation > 3 ? 'high' : 'medium',
          recommendation: '延迟显著上升，建议检查后端服务健康状态',
        })
      }
    }

    // 错误率异常
    const baselineErrors = baselineLogs.filter(l => l.statusCode && l.statusCode >= 400).length
    const recentErrors = recentLogs.filter(l => l.statusCode && l.statusCode >= 400).length
    const baselineErrorRate = baselineLogs.length > 0 ? baselineErrors / baselineLogs.length : 0
    const recentErrorRate = recentLogs.length > 0 ? recentErrors / recentLogs.length : 0

    if (recentErrorRate > baselineErrorRate * 2 && recentErrorRate > 0.05) {
      anomalies.push({
        detected: true,
        metric: 'error_rate',
        currentValue: Math.round(recentErrorRate * 10000) / 100,
        baselineMean: Math.round(baselineErrorRate * 10000) / 100,
        baselineStdDev: 0,
        deviationFactor: baselineErrorRate > 0 ? Math.round((recentErrorRate / baselineErrorRate) * 10) / 10 : 0,
        severity: recentErrorRate > 0.2 ? 'critical' : recentErrorRate > 0.1 ? 'high' : 'medium',
        recommendation: '错误率异常升高，建议检查服务端错误日志',
      })
    }

    if (anomalies.length === 0) {
      anomalies.push({
        detected: false,
        metric: 'all_metrics',
        currentValue: 0,
        baselineMean: 0,
        baselineStdDev: 0,
        deviationFactor: 0,
        severity: 'low',
        recommendation: '未检测到明显异常',
      })
    }

    return anomalies
  }

  // ─── 内部辅助方法 ──────────────────────────────────────────────────────

  private getFilteredLogs(query?: AnalyticsQuery): GatewayLogEntry[] {
    if (!this.logSource) return []

    const logs = this.logSource.getRequestLogs(10000)
    if (!query) return logs

    const { startTime, endTime, endpoint, clientId } = query
    return logs.filter(l => {
      if (startTime && l.timestamp < startTime) return false
      if (endTime && l.timestamp > endTime) return false
      if (endpoint && !l.path.includes(endpoint)) return false
      if (clientId && l.clientId !== clientId) return false
      return true
    })
  }

  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    const idx = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, Math.min(idx, sorted.length - 1))]
  }
}
