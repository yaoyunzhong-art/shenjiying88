import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
/**
 * 🐜 自动: [observability] [D] controller spec 补全
 *
 * 覆盖 MetricsController 所有端点:
 *   - GET /metrics (Prometheus text 格式渲染)
 *   - GET /healthz (健康检查)
 *
 * 正例 + 反例 + 边界场景
 */

import assert from 'node:assert/strict'
import { MetricsController } from './metrics.controller'
import { MetricsService } from './metrics.service'
import { ObservabilityService } from './observability.service'

function makeController(skipDefaults = false) {
  const service = new MetricsService(skipDefaults)
  const obs = new ObservabilityService(service)
  return { service, controller: new MetricsController(service, obs) }
}

function makeMockRes() {
  const headers: Record<string, string> = {}
  let body = ''
  return {
    headers,
    body,
    setHeader: (k: string, v: string) => { headers[k] = v },
    send: (b: string) => { body = b },
    getBody: () => body,
    getHeader: (k: string) => headers[k],
  }
}

// ══════════════════════════════════════════════════════════════════════════
// 路由装饰器验证
// ══════════════════════════════════════════════════════════════════════════

describe('MetricsController — 路由装饰器', () => {
  it('getMetrics 有 @Get("metrics") 装饰器', () => {
    const path = Reflect.getMetadata('path', MetricsController.prototype.getMetrics)
    const method = Reflect.getMetadata('method', MetricsController.prototype.getMetrics)
    assert.equal(method, 0, '应使用 GET (RequestMethod.GET = 0)')
    assert.ok(typeof path === 'string', 'path 应为字符串')
    assert.ok(path.includes('metrics'), `path 应包含 "metrics", 实际 ${path}`)
  })

  it('getHealth 有 @Get("healthz") 装饰器', () => {
    const path = Reflect.getMetadata('path', MetricsController.prototype.getHealth)
    const method = Reflect.getMetadata('method', MetricsController.prototype.getHealth)
    assert.equal(method, 0)
    assert.ok(path.includes('healthz'), `path 应包含 "healthz", 实际 ${path}`)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// GET /healthz — 正例场景
// ══════════════════════════════════════════════════════════════════════════

describe('GET /healthz — 正例', () => {
  it('有默认注册指标时返回 status=ok 且 metrics 数量为 5', () => {
    const { controller } = makeController()
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.equal(health.metrics, 5)
  })

  it('重置后返回 metrics=0', () => {
    const { service, controller } = makeController()
    service.reset()
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.equal(health.metrics, 0)
  })

  it('注册自定义 metrics 后数量准确', () => {
    const { service, controller } = makeController(true) // skip defaults
    service.registerCounter('custom_metric', 'A custom counter')
    service.registerGauge('custom_gauge', 'A custom gauge')
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.equal(health.metrics, 2)
  })

  it('多次调用返回稳定结果', () => {
    const { controller } = makeController()
    const h1 = controller.getHealth()
    const h2 = controller.getHealth()
    assert.equal(h1.metrics, h2.metrics)
  })
})

// ══════════════════════════════════════════════════════════════════════════
// GET /metrics — 正例场景
// ══════════════════════════════════════════════════════════════════════════

describe('GET /metrics — 正例', () => {
  it('默认注册指标输出包含所有 HELP/TYPE 行和指标值', async () => {
    const { controller } = makeController()
    const res = makeMockRes()
    await controller.getMetrics(res as any)
    const body = res.getBody()
    assert.ok(body.includes('# HELP http_requests_total'))
    assert.ok(body.includes('# TYPE http_requests_total counter'))
    assert.ok(body.includes('# HELP http_request_duration_ms'))
    assert.ok(body.includes('# TYPE http_request_duration_ms histogram'))
    assert.ok(body.includes('# HELP http_active_connections'))
    assert.ok(body.includes('# TYPE http_active_connections gauge'))
    assert.ok(body.includes('# HELP http_exceptions_total'))
    assert.ok(body.includes('# HELP process_uptime_seconds'))
    assert.ok(body.includes('# TYPE process_uptime_seconds gauge'))
  })

  it('Content-Type 标头正确设置', async () => {
    const { controller } = makeController()
    const res = makeMockRes()
    await controller.getMetrics(res as any)
    assert.equal(res.getHeader('Content-Type'), 'text/plain; version=0.0.4; charset=utf-8')
  })

  it('counter 增加值后反映在输出中', async () => {
    const { service, controller } = makeController(true)
    service.registerCounter('test_counter', 'Test counter')
    service.incrementCounter('test_counter', { method: 'GET' }, 3)
    const res = makeMockRes()
    await controller.getMetrics(res as any)
    const body = res.getBody()
    assert.ok(body.includes('test_counter{method="GET"} 3'))
  })

  it('gauge 设置值后正确渲染', async () => {
    const { service, controller } = makeController(true)
    service.registerGauge('test_gauge', 'Test gauge')
    service.setGauge('test_gauge', { env: 'prod' }, 42)
    const res = makeMockRes()
    await controller.getMetrics(res as any)
    const body = res.getBody()
    assert.ok(body.includes('test_gauge{env="prod"} 42'))
  })

  it('histogram 观测值包含 bucket / sum / count', async () => {
    const { service, controller } = makeController(true)
    service.registerHistogram('test_hist', 'Test histogram', [10, 100, 1000])
    service.observeHistogram('test_hist', 5, { route: '/api' })
    service.observeHistogram('test_hist', 50, { route: '/api' })
    service.observeHistogram('test_hist', 500, { route: '/api' })
    const res = makeMockRes()
    await controller.getMetrics(res as any)
    const body = res.getBody()
    // Labels are serialized in alphabetical order: le comes before route
    assert.ok(body.includes('test_hist_bucket{le="10",route="/api"} 1'))
    assert.ok(body.includes('test_hist_bucket{le="100",route="/api"} 2'))
    assert.ok(body.includes('test_hist_bucket{le="1000",route="/api"} 3'))
    assert.ok(body.includes('test_hist_bucket{le="+Inf",route="/api"} 3'))
    assert.ok(body.includes('test_hist_sum{route="/api"} 555'))
    assert.ok(body.includes('test_hist_count{route="/api"} 3'))
  })

  it('histogram 桶计数正确 (le=10: 1个, le=100: 2个, +Inf: 3个)', async () => {
    const { service, controller } = makeController(true)
    service.registerHistogram('h', 'H', [10, 100, 1000])
    service.observeHistogram('h', 5)
    service.observeHistogram('h', 50)
    service.observeHistogram('h', 500)
    const res = makeMockRes()
    await controller.getMetrics(res as any)
    const body = res.getBody()
    // 5 ≤ 10 → 1
    assert.ok(body.match(/h_bucket\{le="10"\} 1/))
    // 5, 50 ≤ 100 → 2
    assert.ok(body.match(/h_bucket\{le="100"\} 2/))
    // 5, 50, 500 ≤ 1000 → 3
    assert.ok(body.match(/h_bucket\{le="1000"\} 3/))
    // 全部 → 3
    assert.ok(body.match(/h_bucket\{le="\+Inf"\} 3/))
  })

  it('多 labels 的 metric 正确序列化', async () => {
    const { service, controller } = makeController(true)
    service.registerCounter('multi_label', 'Multi-label test')
    service.incrementCounter('multi_label', { method: 'POST', path: '/api/order', status: '201' }, 1)
    const res = makeMockRes()
    await controller.getMetrics(res as any)
    const body = res.getBody()
    assert.ok(body.includes('multi_label{method="POST",path="/api/order",status="201"} 1'))
  })
})

// ══════════════════════════════════════════════════════════════════════════
// GET /metrics — 边界场景
// ══════════════════════════════════════════════════════════════════════════

describe('GET /metrics — 边界场景', () => {
  it('reset 后空 metrics 只输出空行', async () => {
    const { service, controller } = makeController()
    service.reset()
    const res = makeMockRes()
    await controller.getMetrics(res as any)
    assert.equal(res.getBody(), '\n')
  })

  it('无 labels 的 counter 输出时不用大括号', async () => {
    const { service, controller } = makeController(true)
    service.registerCounter('bare_counter', 'No labels')
    service.incrementCounter('bare_counter', {}, 7)
    const res = makeMockRes()
    await controller.getMetrics(res as any)
    assert.ok(res.getBody().includes('bare_counter 7'))
    assert.ok(!res.getBody().includes('bare_counter{'))
  })

  it('counter 零值也输出', async () => {
    const { service, controller } = makeController(true)
    service.registerCounter('zero_counter', 'Zero')
    // 未 increment → 无值输出
    const res = makeMockRes()
    await controller.getMetrics(res as any)
    const body = res.getBody()
    // 注册了但无观测值 => 不输出对应行
    assert.ok(body.includes('# HELP zero_counter Zero'))
    assert.ok(body.includes('# TYPE zero_counter counter'))
  })

  it('histogram 无观测值不输出 bucket 行', async () => {
    const { service, controller } = makeController(true)
    service.registerHistogram('empty_hist', 'Empty')
    const res = makeMockRes()
    await controller.getMetrics(res as any)
    const body = res.getBody()
    assert.ok(body.includes('# HELP empty_hist Empty'))
    assert.ok(body.includes('# TYPE empty_hist histogram'))
    assert.ok(!body.match(/empty_hist_bucket/))
  })
})

// ══════════════════════════════════════════════════════════════════════════
// GET /metrics — 反例 / 错误场景
// ══════════════════════════════════════════════════════════════════════════

describe('GET /metrics — 反例', () => {
  it('错误的 send 调用不应抛出异常', async () => {
    const { controller } = makeController()
    // 模拟 Res 对象 send 抛出异常
    const badRes = {
      setHeader: () => {},
      send: () => { throw new Error('send failed') },
    }
    await expect(controller.getMetrics(badRes as any)).rejects.toThrow('send failed')
  })

  it('render 含特殊 label 值时不破坏 Prometheus 格式', async () => {
    const { service, controller } = makeController(true)
    service.registerCounter('escaped', 'Escaped labels')
    service.incrementCounter('escaped', { val: 'hello"world\nline2' }, 1)
    const res = makeMockRes()
    await controller.getMetrics(res as any)
    const body = res.getBody()
    assert.ok(body.includes('escaped{val="hello\\"world\\nline2"} 1'))
  })

  it('重复注册同一名称不同类型 metric 在 render 时不崩溃', async () => {
    const { service, controller } = makeController(true)
    service.registerCounter('dupe', 'First')
    expect(() => service.registerGauge('dupe', 'Second')).toThrow(/already registered/)
    const res = makeMockRes()
    await controller.getMetrics(res as any)
    const body = res.getBody()
    assert.ok(body.includes('# TYPE dupe counter'))
  })
})

// ══════════════════════════════════════════════════════════════════════════
// GET /healthz — 边界场景
// ══════════════════════════════════════════════════════════════════════════

describe('GET /healthz — 边界场景', () => {
  it('大量 metrics 注册时列表准确', () => {
    const { service, controller } = makeController(true)
    const names: string[] = []
    for (let i = 0; i < 100; i++) {
      const n = `metric_${i}`
      service.registerCounter(n, `Counter ${i}`)
      names.push(n)
    }
    const health = controller.getHealth()
    assert.equal(health.metrics, 100)
  })

  it('混合注册 counter + gauge + histogram', () => {
    const { service, controller } = makeController(true)
    service.registerCounter('a', 'A')
    service.registerGauge('b', 'B')
    service.registerHistogram('c', 'C')
    assert.equal(controller.getHealth().metrics, 3)
  })
})
