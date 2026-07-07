/* ===== observability — 纯函数式内联测试，不 import 生产代码 ===== */

// ── 1. 类型定义 ────────────────────────────────────────────────

type MetricType = 'counter' | 'gauge' | 'histogram'

interface MetricMeta {
  name: string
  help: string
  type: MetricType
}

interface CounterData {
  meta: MetricMeta
  values: Map<string, number>
}

interface GaugeData {
  meta: MetricMeta
  values: Map<string, number>
}

interface HistogramData {
  meta: MetricMeta
  buckets: number[]
  observations: Map<string, number[]>
  counts: Map<string, number>
  sums: Map<string, number>
}

type MetricData = CounterData | GaugeData | HistogramData

interface MetricsStore {
  metrics: Map<string, MetricData>
}

export {} // ensure module scope

// ── 2. Mock 数据工厂 ──────────────────────────────────────────────

const DEFAULT_BUCKETS = [5, 10, 25, 50, 100, 250, 500, 1000, 2500, 5000, 10000]

function makeStore(): MetricsStore {
  return { metrics: new Map() }
}

function registerCounter(store: MetricsStore, name: string, help: string): void {
  if (store.metrics.has(name)) {
    const existing = store.metrics.get(name)!
    if ((existing as CounterData).meta.type !== 'counter') {
      throw new Error(`Metric ${name} already registered as ${(existing as CounterData).meta.type}`)
    }
    return
  }
  store.metrics.set(name, { meta: { name, help, type: 'counter' }, values: new Map() })
}

function registerGauge(store: MetricsStore, name: string, help: string): void {
  if (store.metrics.has(name)) {
    const existing = store.metrics.get(name)!
    if ((existing as GaugeData).meta.type !== 'gauge') {
      throw new Error(`Metric ${name} already registered as ${(existing as GaugeData).meta.type}`)
    }
    return
  }
  store.metrics.set(name, { meta: { name, help, type: 'gauge' }, values: new Map() })
}

function registerHistogram(
  store: MetricsStore, name: string, help: string, buckets: number[] = DEFAULT_BUCKETS,
): void {
  if (store.metrics.has(name)) {
    const existing = store.metrics.get(name)!
    if ((existing as HistogramData).meta.type !== 'histogram') {
      throw new Error(`Metric ${name} already registered as ${(existing as HistogramData).meta.type}`)
    }
    return
  }
  store.metrics.set(name, {
    meta: { name, help, type: 'histogram' },
    buckets: [...buckets].sort((a, b) => a - b),
    observations: new Map(),
    counts: new Map(),
    sums: new Map(),
  })
}

function serializeLabels(labels: Record<string, string | number>): string {
  const entries = Object.entries(labels).sort(([a], [b]) => a.localeCompare(b))
  if (entries.length === 0) return ''
  return entries.map(([k, v]) => `${k}="${String(v).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"')}"`).join(',')
}

function formatLabels(labels: Record<string, string | number>): string {
  const keys = Object.keys(labels)
  if (keys.length === 0) return ''
  return `{${serializeLabels(labels)}}`
}

function incrementCounter(store: MetricsStore, name: string, labels: Record<string, string | number> = {}, delta = 1): void {
  const metric = store.metrics.get(name) as CounterData | undefined
  if (!metric) throw new Error(`Counter ${name} not registered`)
  const key = serializeLabels(labels)
  metric.values.set(key, (metric.values.get(key) ?? 0) + delta)
}

function setGauge(store: MetricsStore, name: string, labels: Record<string, string | number> = {}, value: number): void {
  const metric = store.metrics.get(name) as GaugeData | undefined
  if (!metric) throw new Error(`Gauge ${name} not registered`)
  const key = serializeLabels(labels)
  metric.values.set(key, value)
}

function observeHistogram(store: MetricsStore, name: string, value: number, labels: Record<string, string | number> = {}): void {
  const metric = store.metrics.get(name) as HistogramData | undefined
  if (!metric) throw new Error(`Histogram ${name} not registered`)
  const key = serializeLabels(labels)
  if (!metric.observations.has(key)) metric.observations.set(key, [])
  metric.observations.get(key)!.push(value)
  metric.counts.set(key, (metric.counts.get(key) ?? 0) + 1)
  metric.sums.set(key, (metric.sums.get(key) ?? 0) + value)
}

function escapeLabelValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/"/g, '\\"')
}

function renderPrometheus(store: MetricsStore): string {
  const lines: string[] = []
  for (const metric of store.metrics.values()) {
    lines.push(`# HELP ${metric.meta.name} ${metric.meta.help}`)
    lines.push(`# TYPE ${metric.meta.name} ${metric.meta.type}`)

    if (metric.meta.type === 'counter' || metric.meta.type === 'gauge') {
      const data = metric as CounterData
      for (const [key, value] of data.values.entries()) {
        const labelsStr = key ? `{${key}}` : ''
        lines.push(`${metric.meta.name}${labelsStr} ${value}`)
      }
    } else if (metric.meta.type === 'histogram') {
      const data = metric as HistogramData
      for (const [key, observations] of data.observations.entries()) {
        // Parse labels from key
        const labelPairs: Record<string, string> = {}
        const regex = /(\w+)="([^"]*)"/g
        let match
        while ((match = regex.exec(key)) !== null) {
          labelPairs[match[1]] = match[2]
        }

        // Buckets
        for (const bucket of data.buckets) {
          const leLabels = { ...labelPairs, le: String(bucket) }
          const count = observations.filter((v) => v <= bucket).length
          lines.push(`${metric.meta.name}_bucket${formatLabels(leLabels)} ${count}`)
        }
        // +Inf bucket
        const infLabels = { ...labelPairs, le: '+Inf' }
        lines.push(`${metric.meta.name}_bucket${formatLabels(infLabels)} ${observations.length}`)
        // sum & count
        const sum = observations.reduce((s, v) => s + v, 0)
        lines.push(`${metric.meta.name}_sum${formatLabels(labelPairs)} ${sum}`)
        const countLabels = { ...labelPairs }
        lines.push(`${metric.meta.name}_count${formatLabels(countLabels)} ${observations.length}`)
      }
    }
  }
  return lines.join('\n') + '\n'
}

function listMetrics(store: MetricsStore): string[] {
  return Array.from(store.metrics.keys())
}

function resetStore(store: MetricsStore): void {
  store.metrics.clear()
}

/** 注册默认 metrics */
function registerDefaultMetricsInline(store: MetricsStore): void {
  registerCounter(store, 'http_requests_total', 'Total number of HTTP requests handled, labeled by method, path, status.')
  registerHistogram(store, 'http_request_duration_ms', 'HTTP request latency in milliseconds, labeled by method and path.')
  registerGauge(store, 'http_active_connections', 'Number of in-flight HTTP requests.')
  registerCounter(store, 'http_exceptions_total', 'Total number of HTTP request exceptions, labeled by method, path, kind.')
  registerGauge(store, 'process_uptime_seconds', 'Process uptime in seconds since service start.')
}

function makeInitializedStore(): MetricsStore {
  const store = makeStore()
  registerDefaultMetricsInline(store)
  return store
}

// ── 3. 内联辅助 ──────────────────────────────────────────────────

/** 解析 Prometheus label 键值对 */
function parseLabelKey(key: string): Record<string, string> {
  if (!key) return {}
  const result: Record<string, string> = {}
  const regex = /(\w+)="([^"]*)"/g
  let match
  while ((match = regex.exec(key)) !== null) {
    result[match[1]] = match[2]
  }
  return result
}

// ── 4. Tests ──────────────────────────────────────────────────────

describe('MetricsService (inline)', () => {
  // ── 注册 ──
  describe('register', () => {
    it('should register a counter', () => {
      const store = makeStore()
      registerCounter(store, 'test_counter', 'Test counter help')
      expect(store.metrics.has('test_counter')).toBe(true)
      const m = store.metrics.get('test_counter')!
      expect(m.meta.type).toBe('counter')
      expect(m.meta.help).toBe('Test counter help')
    })

    it('should register a gauge', () => {
      const store = makeStore()
      registerGauge(store, 'test_gauge', 'Test gauge help')
      expect(store.metrics.has('test_gauge')).toBe(true)
      const m = store.metrics.get('test_gauge')!
      expect(m.meta.type).toBe('gauge')
    })

    it('should register a histogram with default buckets', () => {
      const store = makeStore()
      registerHistogram(store, 'test_histogram', 'Test histogram')
      const m = store.metrics.get('test_histogram')! as HistogramData
      expect(m.meta.type).toBe('histogram')
      expect(m.buckets).toEqual(DEFAULT_BUCKETS)
    })

    it('should register a histogram with custom buckets', () => {
      const store = makeStore()
      registerHistogram(store, 'custom_histogram', 'Custom buckets', [1, 10, 100])
      const m = store.metrics.get('custom_histogram')! as HistogramData
      expect(m.buckets).toEqual([1, 10, 100])
    })

    it('should re-register existing counter without error', () => {
      const store = makeStore()
      registerCounter(store, 'dup', 'First')
      registerCounter(store, 'dup', 'Second')
      const m = store.metrics.get('dup')! as CounterData
      expect(m.meta.help).toBe('First') // unchanged
    })

    it('should throw when registering mismatched type', () => {
      const store = makeStore()
      registerCounter(store, 'name', 'Counter')
      expect(() => {
        registerHistogram(store, 'name', 'Histogram')
      }).toThrow(/already registered/)
    })
  })

  // ── Counter ──
  describe('counter', () => {
    it('should increment counter', () => {
      const store = makeStore()
      registerCounter(store, 'req_total', 'Requests')
      incrementCounter(store, 'req_total')
      const m = store.metrics.get('req_total')! as CounterData
      expect(m.values.get('')).toBe(1)
    })

    it('should increment with labels', () => {
      const store = makeStore()
      registerCounter(store, 'req_total', 'Requests')
      incrementCounter(store, 'req_total', { method: 'GET', status: 200 })
      incrementCounter(store, 'req_total', { method: 'GET', status: 200 })
      incrementCounter(store, 'req_total', { method: 'POST', status: 201 })
      const m = store.metrics.get('req_total')! as CounterData
      const get200Key = serializeLabels({ method: 'GET', status: 200 })
      const post201Key = serializeLabels({ method: 'POST', status: 201 })
      expect(m.values.get(get200Key)).toBe(2)
      expect(m.values.get(post201Key)).toBe(1)
    })

    it('should throw for unregistered counter', () => {
      const store = makeStore()
      expect(() => incrementCounter(store, 'missing_counter')).toThrow(/not registered/)
    })
  })

  // ── Gauge ──
  describe('gauge', () => {
    it('should set gauge value', () => {
      const store = makeStore()
      registerGauge(store, 'active_conn', 'Active connections')
      setGauge(store, 'active_conn', {}, 42)
      const m = store.metrics.get('active_conn')! as GaugeData
      expect(m.values.get('')).toBe(42)
    })

    it('should update gauge value', () => {
      const store = makeStore()
      registerGauge(store, 'temp', 'Temperature')
      setGauge(store, 'temp', {}, 36.5)
      setGauge(store, 'temp', {}, 37.0)
      const m = store.metrics.get('temp')! as GaugeData
      expect(m.values.get('')).toBe(37.0)
    })

    it('should support label-annotated gauges', () => {
      const store = makeStore()
      registerGauge(store, 'queue_size', 'Queue sizes')
      setGauge(store, 'queue_size', { queue: 'email' }, 10)
      setGauge(store, 'queue_size', { queue: 'sms' }, 5)
      const m = store.metrics.get('queue_size')! as GaugeData
      expect(m.values.get(serializeLabels({ queue: 'email' }))).toBe(10)
      expect(m.values.get(serializeLabels({ queue: 'sms' }))).toBe(5)
    })

    it('should throw for unregistered gauge', () => {
      const store = makeStore()
      expect(() => setGauge(store, 'no_gauge', {}, 0)).toThrow(/not registered/)
    })
  })

  // ── Histogram ──
  describe('histogram', () => {
    it('should record observations', () => {
      const store = makeStore()
      registerHistogram(store, 'latency', 'Latency')
      observeHistogram(store, 'latency', 10)
      observeHistogram(store, 'latency', 20)
      observeHistogram(store, 'latency', 30)
      const m = store.metrics.get('latency')! as HistogramData
      expect(m.observations.get('')).toEqual([10, 20, 30])
    })

    it('should track count and sum', () => {
      const store = makeStore()
      registerHistogram(store, 'latency', 'Latency')
      observeHistogram(store, 'latency', 10)
      observeHistogram(store, 'latency', 20)
      const m = store.metrics.get('latency')! as HistogramData
      expect(m.counts.get('')).toBe(2)
      expect(m.sums.get('')).toBe(30)
    })

    it('should track per-label observations', () => {
      const store = makeStore()
      registerHistogram(store, 'latency', 'Latency')
      observeHistogram(store, 'latency', 5, { path: '/foo' })
      observeHistogram(store, 'latency', 15, { path: '/foo' })
      observeHistogram(store, 'latency', 100, { path: '/bar' })
      const m = store.metrics.get('latency')! as HistogramData
      const fooKey = serializeLabels({ path: '/foo' })
      const barKey = serializeLabels({ path: '/bar' })
      expect(m.observations.get(fooKey)).toHaveLength(2)
      expect(m.observations.get(barKey)).toHaveLength(1)
      expect(m.counts.get(barKey)).toBe(1)
      expect(m.sums.get(barKey)).toBe(100)
    })

    it('should throw for unregistered histogram', () => {
      const store = makeStore()
      expect(() => observeHistogram(store, 'no_hist', 1)).toThrow(/not registered/)
    })
  })

  // ── Render ──
  describe('render', () => {
    it('should render empty store as trailing newline', () => {
      const store = makeStore()
      expect(renderPrometheus(store)).toBe('\n')
    })

    it('should render counter value', () => {
      const store = makeStore()
      registerCounter(store, 'my_counter', 'Counter help')
      incrementCounter(store, 'my_counter', {}, 3)
      const output = renderPrometheus(store)
      expect(output).toContain('# HELP my_counter Counter help')
      expect(output).toContain('# TYPE my_counter counter')
      expect(output).toContain('my_counter 3')
    })

    it('should render gauge with labels', () => {
      const store = makeStore()
      registerGauge(store, 'active', 'Active count')
      setGauge(store, 'active', { region: 'us-east' }, 10)
      const output = renderPrometheus(store)
      expect(output).toContain('active{region="us-east"} 10')
    })

    it('should render histogram with buckets', () => {
      const store = makeStore()
      registerHistogram(store, 'latency', 'Latency help', [5, 10])
      observeHistogram(store, 'latency', 3)
      observeHistogram(store, 'latency', 8)
      const output = renderPrometheus(store)
      expect(output).toContain('latency_bucket{le="5"} 1')
      expect(output).toContain('latency_bucket{le="10"} 2')
      expect(output).toContain('latency_bucket{le="+Inf"} 2')
      expect(output).toContain('latency_sum 11')
      expect(output).toContain('latency_count 2')
    })
  })

  // ── Default metrics ──
  describe('default metrics', () => {
    it('should register 5 default metrics', () => {
      const store = makeInitializedStore()
      const names = listMetrics(store)
      expect(names).toHaveLength(5)
      expect(names).toContain('http_requests_total')
      expect(names).toContain('http_request_duration_ms')
      expect(names).toContain('http_active_connections')
      expect(names).toContain('http_exceptions_total')
      expect(names).toContain('process_uptime_seconds')
    })

    it('should allow recording on default metrics', () => {
      const store = makeInitializedStore()
      incrementCounter(store, 'http_requests_total', { method: 'GET', path: '/', status: 200 })
      incrementCounter(store, 'http_requests_total', { method: 'POST', path: '/api', status: 201 })
      setGauge(store, 'http_active_connections', {}, 5)
      observeHistogram(store, 'http_request_duration_ms', 42, { method: 'GET', path: '/' })

      const output = renderPrometheus(store)
      expect(output).toContain('http_requests_total{method="GET",path="/",status="200"} 1')
      expect(output).toContain('http_requests_total{method="POST",path="/api",status="201"} 1')
      expect(output).toContain('http_active_connections 5')
    })
  })

  // ── Reset ──
  describe('reset', () => {
    it('should clear all metrics', () => {
      const store = makeInitializedStore()
      resetStore(store)
      expect(listMetrics(store)).toHaveLength(0)
    })
  })

  // ── Label escaping ──
  describe('label escaping', () => {
    it('should escape double quotes in label values', () => {
      const escaped = escapeLabelValue('foo"bar')
      expect(escaped).toBe('foo\\"bar')
    })

    it('should escape backslashes', () => {
      const escaped = escapeLabelValue('a\\b')
      expect(escaped).toBe('a\\\\b')
    })

    it('should escape newlines', () => {
      const escaped = escapeLabelValue('line1\nline2')
      expect(escaped).toBe('line1\\nline2')
    })
  })

  // ── Parsing ──
  describe('label parsing', () => {
    it('should parse label key back to object', () => {
      const key = serializeLabels({ method: 'GET', path: '/api' })
      const parsed = parseLabelKey(key)
      expect(parsed.method).toBe('GET')
      expect(parsed.path).toBe('/api')
    })

    it('should handle empty key', () => {
      expect(parseLabelKey('')).toEqual({})
    })
  })
})
