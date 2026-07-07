import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * metrics.service.test.ts — MetricsService 单元测试
 *
 * 覆盖:
 *   - Counter / Gauge / Histogram 注册与操作
 *   - 重复注册保护 (冲突类型抛错)
 *   - Prometheus 文本渲染格式
 *   - reset / listMetrics
 */

import assert from 'node:assert/strict'
import { MetricsService, registerDefaultMetrics } from './metrics.service'

function freshService() {
  // 构造时已自动注册 5 个默认 metric;
  // 调用 reset() 清空,得到一个干净的 service 用于本测试
  const svc = new MetricsService()
  svc.reset()
  return svc
}

describe('MetricsService — 注册', () => {
  it('registerCounter 注册并返回 counter', () => {
    const svc = freshService()
    const counter = svc.registerCounter('test_counter', 'Test counter help')
    assert.ok(counter)
    assert.equal(counter.type, 'counter')
    assert.equal(counter.name, 'test_counter')
  })

  it('registerGauge 注册并返回 gauge', () => {
    const svc = freshService()
    const gauge = svc.registerGauge('test_gauge', 'Test gauge help')
    assert.ok(gauge)
    assert.equal(gauge.type, 'gauge')
  })

  it('registerHistogram 注册并返回 histogram', () => {
    const svc = freshService()
    const hist = svc.registerHistogram('test_hist', 'Test histogram help')
    assert.ok(hist)
    assert.equal(hist.type, 'histogram')
    assert.ok(hist.buckets.length >= 5)
  })

  it('registerHistogram 支持自定义桶', () => {
    const svc = freshService()
    const hist = svc.registerHistogram('custom_hist', 'Custom buckets', [1, 10, 100])
    assert.deepEqual(hist.buckets, [1, 10, 100])
  })

  it('重复注册同名的相同类型返回现有实例', () => {
    const svc = freshService()
    const c1 = svc.registerCounter('dup', 'help')
    const c2 = svc.registerCounter('dup', 'help')
    assert.equal(c1, c2)
  })

  it('重复注册同名的不同类型抛出错误', () => {
    const svc = freshService()
    svc.registerCounter('conflict', 'first')
    assert.throws(() => svc.registerGauge('conflict', 'second'), /already registered as/)
  })

  it('registerDefaultMetrics 注册 5 个默认指标', () => {
    const svc = freshService()
    registerDefaultMetrics(svc)
    const names = svc.listMetrics()
    assert.equal(names.length, 5)
    assert.ok(names.includes('http_requests_total'))
    assert.ok(names.includes('http_request_duration_ms'))
    assert.ok(names.includes('http_active_connections'))
    assert.ok(names.includes('http_exceptions_total'))
    assert.ok(names.includes('process_uptime_seconds'))
  })
})

describe('MetricsService — Counter 操作', () => {
  it('incrementCounter 默认步长为 1', () => {
    const svc = freshService()
    svc.registerCounter('req', 'requests')
    svc.incrementCounter('req', { method: 'GET' })
    const render = svc.render()
    assert.ok(render.includes('req{method="GET"} 1'))
  })

  it('incrementCounter 支持自定义步长', () => {
    const svc = freshService()
    svc.registerCounter('req', 'requests')
    svc.incrementCounter('req', { method: 'POST' }, 5)
    svc.incrementCounter('req', { method: 'POST' }, 3)
    const render = svc.render()
    assert.ok(render.includes('req{method="POST"} 8'))
  })

  it('未注册 counter 抛错', () => {
    const svc = freshService()
    assert.throws(() => svc.incrementCounter('nope'), /not registered/)
  })
})

describe('MetricsService — Gauge 操作', () => {
  it('setGauge 设置值', () => {
    const svc = freshService()
    svc.registerGauge('conn', 'connections')
    svc.setGauge('conn', {}, 42)
    const render = svc.render()
    assert.ok(render.includes('conn 42'))
  })

  it('setGauge 覆盖值', () => {
    const svc = freshService()
    svc.registerGauge('conn', 'connections')
    svc.setGauge('conn', { pool: 'main' }, 10)
    svc.setGauge('conn', { pool: 'main' }, 20)
    const render = svc.render()
    assert.ok(render.includes('conn{pool="main"} 20'))
  })

  it('未注册 gauge 抛错', () => {
    const svc = freshService()
    assert.throws(() => svc.setGauge('nope', {}, 0), /not registered/)
  })
})

describe('MetricsService — Histogram 操作', () => {
  it('observeHistogram 记录值', () => {
    const svc = freshService()
    svc.registerHistogram('latency', 'latency help')
    svc.observeHistogram('latency', 12, { path: '/foo' })
    const render = svc.render()
    // 注意: labels 中 path 后于 le（桶标签）, 因为 serialize 排序是字母序
    assert.ok(render.includes('latency_count{path="/foo"} 1'), `render:\n${render}`)
    assert.ok(render.includes('latency_sum{path="/foo"} 12'), `render:\n${render}`)
  })

  it('observeHistogram 多值汇总', () => {
    const svc = freshService()
    svc.registerHistogram('latency', 'latency help')
    svc.observeHistogram('latency', 5, { method: 'GET', path: '/bar' })
    svc.observeHistogram('latency', 15, { method: 'GET', path: '/bar' })
    const render = svc.render()
    assert.ok(render.includes('latency_count{method="GET",path="/bar"} 2'), `render:\n${render}`)
    assert.ok(render.includes('latency_sum{method="GET",path="/bar"} 20'), `render:\n${render}`)
  })

  it('buckets 分桶正确', () => {
    const svc = freshService()
    svc.registerHistogram('latency', 'latency', [5, 10, 25])
    svc.observeHistogram('latency', 3, {})
    svc.observeHistogram('latency', 12, {})
    const render = svc.render()
    const lines = render.split('\n')
    // le 排序在 path 前，但这里没传 labels
    const bucket5 = lines.find(l => l.startsWith('latency_bucket{le="5"}'))
    assert.ok(bucket5, `expected bucket5 line, got:\n${render}`)
    assert.match(bucket5!, / 1$/)
    const bucketInf = lines.find(l => l.startsWith('latency_bucket{le="+Inf"}'))
    assert.ok(bucketInf)
    assert.match(bucketInf!, / 2$/)
  })

  it('未注册 histogram 抛错', () => {
    const svc = freshService()
    assert.throws(() => svc.observeHistogram('nope', 1), /not registered/)
  })
})

describe('MetricsService — render 输出格式', () => {
  it('HELP 和 TYPE 行正确', () => {
    const svc = freshService()
    svc.registerCounter('c', 'counter help')
    const render = svc.render()
    assert.ok(render.includes('# HELP c counter help'))
    assert.ok(render.includes('# TYPE c counter'))
  })

  it('空 metrics 渲染仅为换行', () => {
    const svc = freshService()
    const render = svc.render()
    assert.equal(render, '\n')
  })

  it('换行符结尾', () => {
    const svc = freshService()
    svc.registerCounter('c', 'help')
    const render = svc.render()
    assert.ok(render.endsWith('\n'))
  })
})

describe('MetricsService — 管理方法', () => {
  it('listMetrics 返回已注册指标名称', () => {
    const svc = freshService()
    svc.registerCounter('a', 'help a')
    svc.registerGauge('b', 'help b')
    const names = svc.listMetrics()
    assert.ok(names.includes('a'))
    assert.ok(names.includes('b'))
    assert.equal(names.length, 2)
  })

  it('reset 清空所有指标', () => {
    const svc = freshService()
    svc.registerCounter('a', 'help')
    svc.reset()
    assert.equal(svc.listMetrics().length, 0)
  })
})

describe('MetricsService — 标签编码', () => {
  it('标签值中特殊字符正确转义', () => {
    const svc = freshService()
    svc.registerCounter('test', 'test help')
    svc.incrementCounter('test', { path: '/a"b\nc\\d' })
    const render = svc.render()
    assert.ok(render.includes('path="/a\\"b\\nc\\\\d"'))
  })

  it('空 labels 渲染时不带花括号', () => {
    const svc = freshService()
    svc.registerGauge('g', 'help')
    svc.setGauge('g', {}, 1)
    const render = svc.render()
    assert.ok(render.includes('g 1'))
    assert.ok(!render.includes('g{}'))
  })
})
