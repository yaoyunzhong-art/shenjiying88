/**
 * 轻量级 Prometheus 兼容 metrics 服务
 *
 * 设计目标:
 *   - 零外部依赖 (不使用 prom-client)
 *   - 支持 Counter / Gauge / Histogram 三种基本类型
 *   - 输出 Prometheus 文本格式 (text/plain; version=0.0.4)
 *   - 全局单例,通过 MetricsModule 注入
 *
 * 使用:
 *   metricsService.incrementCounter('http_requests_total', { method: 'GET', path: '/foo', status: '200' })
 *   metricsService.observeHistogram('http_request_duration_ms', 12.3, { path: '/foo' })
 *   metricsService.setGauge('active_connections', 42)
 */

import { Injectable, Optional } from '@nestjs/common'

interface Counter {
  type: 'counter'
  name: string
  help: string
  values: Map<string, number>
}

interface Gauge {
  type: 'gauge'
  name: string
  help: string
  values: Map<string, number>
}

interface Histogram {
  type: 'histogram'
  name: string
  help: string
  labelNames: string[]
  buckets: number[]
  observations: Map<string, number[]>
  counts: Map<string, number>
  sums: Map<string, number>
}

type Metric = Counter | Gauge | Histogram

@Injectable()
export class MetricsService {
  private readonly metrics = new Map<string, Metric>()
  private readonly DEFAULT_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]

  constructor(skipDefaults?: boolean) {
    // 构造时自动注册默认 metrics（测试中可传入 false 跳过）
    if (!skipDefaults) {
      registerDefaultMetrics(this)
    }
  }

  /**
   * 注册或获取已存在的 Counter
   */
  registerCounter(name: string, help: string): Counter {
    const existing = this.metrics.get(name)
    if (existing) {
      if (existing.type !== 'counter') throw new Error(`Metric ${name} already registered as ${existing.type}`)
      return existing as Counter
    }
    const counter: Counter = { type: 'counter', name, help, values: new Map() }
    this.metrics.set(name, counter)
    return counter
  }

  /**
   * 注册或获取已存在的 Gauge
   */
  registerGauge(name: string, help: string): Gauge {
    const existing = this.metrics.get(name)
    if (existing) {
      if (existing.type !== 'gauge') throw new Error(`Metric ${name} already registered as ${existing.type}`)
      return existing as Gauge
    }
    const gauge: Gauge = { type: 'gauge', name, help, values: new Map() }
    this.metrics.set(name, gauge)
    return gauge
  }

  /**
   * 注册或获取已存在的 Histogram (默认桶: 5/10/25/50/100/250/500/1000/2500/5000/10000 ms)
   */
  registerHistogram(name: string, help: string, buckets: number[] = this.DEFAULT_BUCKETS): Histogram {
    const existing = this.metrics.get(name)
    if (existing) {
      if (existing.type !== 'histogram') throw new Error(`Metric ${name} already registered as ${existing.type}`)
      return existing as Histogram
    }
    const histogram: Histogram = {
      type: 'histogram',
      name,
      help,
      labelNames: [],
      buckets: [...buckets].sort((a, b) => a - b),
      observations: new Map(),
      counts: new Map(),
      sums: new Map()
    }
    this.metrics.set(name, histogram)
    return histogram
  }

  /**
   * 增加 counter
   */
  incrementCounter(name: string, labels: Record<string, string | number> = {}, delta = 1) {
    const counter = this.metrics.get(name) as Counter | undefined
    if (!counter) throw new Error(`Counter ${name} not registered`)
    const key = this.serializeLabels(labels)
    counter.values.set(key, (counter.values.get(key) ?? 0) + delta)
  }

  /**
   * 设置 gauge 值
   */
  setGauge(name: string, labels: Record<string, string | number> = {}, value: number) {
    const gauge = this.metrics.get(name) as Gauge | undefined
    if (!gauge) throw new Error(`Gauge ${name} not registered`)
    const key = this.serializeLabels(labels)
    gauge.values.set(key, value)
  }

  /**
   * 记录 histogram 观测值
   */
  observeHistogram(name: string, value: number, labels: Record<string, string | number> = {}) {
    const histogram = this.metrics.get(name) as Histogram | undefined
    if (!histogram) throw new Error(`Histogram ${name} not registered`)
    const key = this.serializeLabels(labels)
    if (!histogram.observations.has(key)) histogram.observations.set(key, [])
    histogram.observations.get(key)!.push(value)
    histogram.counts.set(key, (histogram.counts.get(key) ?? 0) + 1)
    histogram.sums.set(key, (histogram.sums.get(key) ?? 0) + value)
  }

  /**
   * 以 Prometheus text 格式 (v0.0.4) 输出所有 metrics
   */
  render(): string {
    const lines: string[] = []
    for (const metric of this.metrics.values()) {
      lines.push(`# HELP ${metric.name} ${metric.help}`)
      lines.push(`# TYPE ${metric.name} ${metric.type}`)
      if (metric.type === 'counter' || metric.type === 'gauge') {
        for (const [key, value] of metric.values.entries()) {
          const labels = key ? `{${key}}` : ''
          lines.push(`${metric.name}${labels} ${value}`)
        }
      } else if (metric.type === 'histogram') {
        for (const [key, observations] of metric.observations.entries()) {
          const labelsObj = this.deserializeLabels(key)
          // 每个桶
          for (const bucket of metric.buckets) {
            const leLabels = { ...labelsObj, le: String(bucket) }
            const count = observations.filter((v) => v <= bucket).length
            lines.push(`${metric.name}_bucket${this.formatLabels(leLabels)} ${count}`)
          }
          // +Inf 桶 (所有观测值都满足)
          const infLabels = { ...labelsObj, le: '+Inf' }
          lines.push(`${metric.name}_bucket${this.formatLabels(infLabels)} ${observations.length}`)
          // sum / count
          const sum = observations.reduce((s, v) => s + v, 0)
          const countLabels = { ...labelsObj }
          lines.push(`${metric.name}_sum${this.formatLabels(countLabels)} ${sum}`)
          lines.push(`${metric.name}_count${this.formatLabels(countLabels)} ${observations.length}`)
        }
      }
    }
    return lines.join('\n') + '\n'
  }

  /**
   * 清空所有 metrics (测试用)
   */
  reset() {
    this.metrics.clear()
  }

  /**
   * 列出所有已注册的 metric 名称
   */
  listMetrics(): string[] {
    return Array.from(this.metrics.keys())
  }

  private serializeLabels(labels: Record<string, string | number>): string {
    const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b))
    if (entries.length === 0) return ''
    return entries.map(([k, v]) => `${k}="${this.escapeLabelValue(String(v))}"`).join(',')
  }

  private formatLabels(labels: Record<string, string | number>): string {
    const keys = Object.keys(labels)
    if (keys.length === 0) return ''
    return `{${this.serializeLabels(labels)}}`
  }

  private deserializeLabels(serialized: string): Record<string, string> {
    if (!serialized) return {}
    const result: Record<string, string> = {}
    const regex = /(\w+)="([^"]*)"/g
    let match
    while ((match = regex.exec(serialized)) !== null) {
      result[match[1]] = match[2]
    }
    return result
  }

  private escapeLabelValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"')
  }
}

/**
 * 模块级默认 metrics 注册 — 通常在 MetricsService 启动时调用一次
 */
export function registerDefaultMetrics(service: MetricsService) {
  service.registerCounter(
    'http_requests_total',
    'Total number of HTTP requests handled, labeled by method, path, status.'
  )
  service.registerHistogram(
    'http_request_duration_ms',
    'HTTP request latency in milliseconds, labeled by method and path.'
  )
  service.registerGauge('http_active_connections', 'Number of in-flight HTTP requests.')
  service.registerCounter(
    'http_exceptions_total',
    'Total number of HTTP request exceptions, labeled by method, path, kind.'
  )
  service.registerGauge(
    'process_uptime_seconds',
    'Process uptime in seconds since service start.'
  )
}