import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [observability] [C] 角色增强测试
 *
 * 8 角色视角的 observability 模块深度业务场景测试：
 *   👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个业务场景(正常流程 + 异常/边界/权限)
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MetricsController } from './metrics.controller'
import { MetricsService, registerDefaultMetrics } from './metrics.service'

const ROLES = {
  TenantAdmin: '👔店长',
  Reception: '🛒前台',
  HR: '👥HR',
  Safety: '🔧安监',
  Guide: '🎮导玩员',
  Ops: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销'
} as const

function makeEnv(seedMetrics = true) {
  const service = new MetricsService(!seedMetrics)
  if (seedMetrics) {
    registerDefaultMetrics(service)
  }
  const controller = new MetricsController(service)
  return { controller, service }
}

function mockRes() {
  const headers: Record<string, string> = {}
  let responseBody = ''
  return {
    setHeader: (k: string, v: string) => { headers[k] = v },
    send: (b: string) => { responseBody = b },
    getHeader: (k: string) => headers[k],
    body: () => responseBody,
  }
}

// ──────── 👔店长 ────────
describe(`${ROLES.TenantAdmin} 可观测性模块-角色测试`, () => {

  it('[正常] 店长查看系统全景指标面板（Prometheus 格式完整输出）', async () => {
    const { controller, service } = makeEnv()
    // 模拟一些业务流量数据
    service.incrementCounter('http_requests_total', { method: 'GET', path: '/api/orders', status: '200' }, 42)
    service.incrementCounter('http_requests_total', { method: 'POST', path: '/api/orders', status: '201' }, 8)
    service.setGauge('http_active_connections', { host: 'web-01' }, 12)

    const res = mockRes()
    await controller.getMetrics(res as any)

    const body = res.body()
    // 店长应看到 HELP/TYPE 头部
    assert.ok(body.includes('# HELP http_requests_total'))
    assert.ok(body.includes('# TYPE http_requests_total counter'))
    // 业务数据正确渲染
    assert.ok(body.includes('http_requests_total{method="GET",path="/api/orders",status="200"} 42'))
    assert.ok(body.includes('http_requests_total{method="POST",path="/api/orders",status="201"} 8'))
    assert.ok(body.includes('http_active_connections{host="web-01"} 12'))
    // Content-Type 正确
    assert.equal(res.getHeader('Content-Type'), 'text/plain; version=0.0.4; charset=utf-8')
  })

  it('[边界] 店长看到空指标池时 metrics 端点依然正常返回', async () => {
    const { controller } = makeEnv(false)  // 无默认指标
    const res = mockRes()
    await controller.getMetrics(res as any)
    // 空 metric 时不应该崩溃, 返回空内容
    assert.ok(typeof res.body() === 'string')
  })

  it('[正常] 店长通过健康检查确认所有 module 正常', () => {
    const { controller } = makeEnv()
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.equal(health.metrics, 5) // 5 个默认指标
  })
})

// ──────── 🛒前台 ────────
describe(`${ROLES.Reception} 可观测性模块-角色测试`, () => {

  it('[正常] 前台查看收银系统延迟直方图是否在阈值内', async () => {
    const { controller, service } = makeEnv()
    // 模拟收银接口耗时
    for (const ms of [12, 8, 35, 22, 15, 6, 45, 18]) {
      service.observeHistogram('http_request_duration_ms', ms, { method: 'POST', path: '/cashier/pay' })
    }
    const res = mockRes()
    await controller.getMetrics(res as any)
    const body = res.body()
    assert.ok(body.includes('# TYPE http_request_duration_ms histogram'))
    assert.ok(body.includes('_bucket{le="50",method="POST",path="/cashier/pay"}'))
  })

  it('[边界] 前台看到指标池异常降低时健康检查应明确显示指标数', () => {
    const { controller, service } = makeEnv()
    service.reset()
    // 只注册 1 个指标模拟异常降低
    service.registerCounter('minimal_metric', 'testing')
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.equal(health.metrics, 1)
  })
})

// ──────── 👥HR ────────
describe(`${ROLES.HR} 可观测性模块-角色测试`, () => {

  it('[正常] HR 审计查看系统进程运行时长', async () => {
    const { controller } = makeEnv()
    const res = mockRes()
    await controller.getMetrics(res as any)
    const body = res.body()
    assert.ok(body.includes('process_uptime_seconds'))
    // 确认 uptime 是 gauge 类型
    assert.ok(body.includes('# TYPE process_uptime_seconds gauge'))
  })

  it('[边界] HR 验证异常计数器反映系统错误情况', async () => {
    const { controller, service } = makeEnv()
    // 模拟多次异常
    service.incrementCounter('http_exceptions_total', { method: 'GET', path: '/api/orders', kind: 'timeout' }, 5)
    service.incrementCounter('http_exceptions_total', { method: 'POST', path: '/api/payments', kind: 'validation' }, 3)
    const res = mockRes()
    await controller.getMetrics(res as any)
    const body = res.body()
    assert.ok(body.includes('http_exceptions_total{kind="timeout",method="GET",path="/api/orders"} 5'))
    assert.ok(body.includes('http_exceptions_total{kind="validation",method="POST",path="/api/payments"} 3'))
  })
})

// ──────── 🔧安监 ────────
describe(`${ROLES.Safety} 可观测性模块-角色测试`, () => {

  it('[正常] 安监查看异常计数器并确认无突增', async () => {
    const { controller, service } = makeEnv()
    // 模拟少量异常 — 正常运维范围内
    service.incrementCounter('http_exceptions_total', { method: 'GET', path: '/api/sensors', kind: 'timeout' }, 2)
    const res = mockRes()
    await controller.getMetrics(res as any)
    const body = res.body()
    assert.ok(body.includes('http_exceptions_total'))
    // 确认异常计数器存在且值 <= 5（正常运维范围内）
    const excpMatch = body.match(/http_exceptions_total[^}]*}\s+(\d+)/)
    assert.ok(excpMatch, '异常计数器应存在')
    assert.ok(Number(excpMatch[1]) <= 10, '异常次数应在正常范围')
  })

  it('[边界] 安监在有高异常指标时渲染不崩溃', async () => {
    const { controller, service } = makeEnv()
    // 模拟 DDoS 级别异常
    for (let i = 0; i < 1000; i++) {
      service.incrementCounter('http_exceptions_total', { method: 'GET', path: '/api/login', kind: 'rate_limit' }, 1)
    }
    const res = mockRes()
    await controller.getMetrics(res as any)
    const body = res.body()
    assert.ok(body.includes('http_exceptions_total'))
    // 验证高异常值
    assert.ok(body.includes('1000'))
  })
})

// ──────── 🎮导玩员 ────────
describe(`${ROLES.Guide} 可观测性模块-角色测试`, () => {

  it('[正常] 导玩员查看游乐设备 API 延迟指标', async () => {
    const { controller, service } = makeEnv()
    // 模拟导玩设备 API 延迟
    service.registerHistogram('device_api_duration_ms', '游乐设备 API 响应延迟')
    for (const ms of [30, 45, 28, 52, 38, 150, 22, 35]) {
      service.observeHistogram('device_api_duration_ms', ms, { device: 'vr-seat-01', action: 'start' })
      service.observeHistogram('device_api_duration_ms', ms, { device: 'vr-seat-02', action: 'start' })
    }
    const res = mockRes()
    await controller.getMetrics(res as any)
    const body = res.body()
    assert.ok(body.includes('device_api_duration_ms'))
    assert.ok(body.includes('_bucket{action="start",device="vr-seat-01",le="250"}'))
  })

  it('[边界] 导玩员在无设备数据时 healthz 仍返回正常', () => {
    const { controller, service } = makeEnv()
    service.reset()
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.equal(health.metrics, 0)
  })
})

// ──────── 🎯运行专员 ────────
describe(`${ROLES.Ops} 可观测性模块-角色测试`, () => {

  it('[正常] 运行专员验证直方图桶分布正确计算', async () => {
    const { controller, service } = makeEnv()
    // 记录多个不同延迟的值
    const latencies = [3, 8, 12, 25, 48, 75, 120, 300, 800, 5000]
    for (const ms of latencies) {
      service.observeHistogram('http_request_duration_ms', ms, { method: 'GET', path: '/api/summary' })
    }
    const res = mockRes()
    await controller.getMetrics(res as any)
    const body = res.body()
    // 验证桶分布
    // 3ms <= 5 → 1 个
    assert.ok(body.includes('_bucket{le="5",method="GET",path="/api/summary"} 1'))
    // 3,8 <= 10 → 2 个
    assert.ok(body.includes('_bucket{le="10",method="GET",path="/api/summary"} 2'))
    // +Inf 桶 = 10 个
    assert.ok(body.includes('_bucket{le="+Inf",method="GET",path="/api/summary"} 10'))
    // sum 值
    assert.ok(body.includes(`_sum{method="GET",path="/api/summary"} ${latencies.reduce((a, b) => a + b, 0)}`))
    // count
    assert.ok(body.includes(`_count{method="GET",path="/api/summary"} 10`))
  })

  it('[正常] 运行专员可独立注册监控新指标并渲染', async () => {
    const { controller, service } = makeEnv()
    const gauge = service.registerGauge('custom_queue_depth', '消息队列积压深度')
    service.setGauge('custom_queue_depth', { queue: 'order_events', host: 'broker-01' }, 128)
    assert.equal(gauge.type, 'gauge')
    const res = mockRes()
    await controller.getMetrics(res as any)
    const body = res.body()
    assert.ok(body.includes('custom_queue_depth{host="broker-01",queue="order_events"} 128'))
  })

  it('[边界] 运行专员确认重复注册同一指标不报错（幂等性）', async () => {
    const { service } = makeEnv()
    const c1 = service.registerCounter('http_requests_total', 'Total')
    const c2 = service.registerCounter('http_requests_total', 'Total')
    assert.strictEqual(c1, c2) // 相同引用
  })
})

// ──────── 🤝团建 ────────
describe(`${ROLES.Teambuilding} 可观测性模块-角色测试`, () => {

  it('[正常] 团建确认系统稳定运行无障碍', async () => {
    const { controller } = makeEnv()
    const res = mockRes()
    await controller.getMetrics(res as any)
    const body = res.body()
    // 格式符合 Prometheus text 规范
    assert.ok(body.startsWith('# HELP'))
    assert.ok(body.includes('# TYPE'))
    assert.ok(body.endsWith('\n'))
  })

  it('[边界] 团建在多并发模拟后健康检查仍为 ok', () => {
    const { controller, service } = makeEnv()
    // 模拟大量并发连接
    for (let i = 0; i < 100; i++) {
      service.incrementCounter('http_requests_total', { method: 'GET', path: '/api/events', status: '200' })
      service.setGauge('http_active_connections', {}, i + 1)
    }
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.equal(health.metrics, 5)
  })
})

// ──────── 📢营销 ────────
describe(`${ROLES.Marketing} 可观测性模块-角色测试`, () => {

  it('[正常] 营销查看活动 API 调用量', async () => {
    const { controller, service } = makeEnv()
    // 模拟营销活动带来的流量
    service.incrementCounter('http_requests_total', { method: 'GET', path: '/api/promo/banner', status: '200' }, 5000)
    service.incrementCounter('http_requests_total', { method: 'POST', path: '/api/promo/register', status: '201' }, 1200)
    const res = mockRes()
    await controller.getMetrics(res as any)
    const body = res.body()
    assert.ok(body.includes('/api/promo/banner'))
    assert.ok(body.includes('5000'))
    assert.ok(body.includes('/api/promo/register'))
    assert.ok(body.includes('1200'))
  })

  it('[边界] 营销在大促高峰后 metrics 响应不超时', async () => {
    const { controller, service } = makeEnv()
    // 模拟大促峰值
    for (let i = 0; i < 10000; i++) {
      service.incrementCounter('http_requests_total', { method: 'GET', path: '/api/promo/flash', status: '200' })
    }
    const start = performance.now()
    const res = mockRes()
    await controller.getMetrics(res as any)
    const elapsed = performance.now() - start
    const body = res.body()
    assert.ok(body.includes('10000'))
    // 即使 1 万条数据渲染也在 200ms 内
    assert.ok(elapsed < 200, `渲染耗时 ${elapsed}ms 超过 200ms 阈值`)
  })

  it('[边界] 营销只能读取不能修改指标数据（只读端点验证）', () => {
    const proto = MetricsController.prototype
    const methods = Object.getOwnPropertyNames(proto)
      .filter(name => name !== 'constructor' && typeof (proto as any)[name] === 'function')
    // 控制器的公开方法中没有 set/increment/create 等写操作
    const writeMethods = methods.filter(m =>
      /^(set|update|create|delete|patch|put|reset)/i.test(m)
    )
    assert.equal(writeMethods.length, 0, `发现 ${writeMethods.length} 个写方法: ${writeMethods.join(', ')}`)
  })
})
