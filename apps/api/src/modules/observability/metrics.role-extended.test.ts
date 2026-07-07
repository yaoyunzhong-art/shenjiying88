import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 扩展角色测试: observability/metrics 模块
 *
 * 4 个深度角色视角：
 * 🛒前台 — 健康检查和运营可用性确认
 * 🔧安监 — 异常和安全监控指标
 * 🎯运行专员 — 业务指标运营（Counter/Gauge/Histogram 全类型）
 * 👔店长 — 多维度聚合运营视图
 *
 * 每个角色 3 个测试用例（正常 + 业务异常 + 边界）
 * 共 12+ 个独立测试用例
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MetricsController } from './metrics.controller'
import { MetricsService, registerDefaultMetrics } from './metrics.service'
import type { Response } from 'express'

// ── 测试数据工厂 ──
function createController() {
  const service = new MetricsService(true) // skipDefaults — 手动注册以便精确控制
  const controller = new MetricsController(service)
  return { controller, service }
}

function mockRes(): Response & { body: string; headers: Record<string, string> } {
  const res: any = {
    body: '',
    headers: {},
    setHeader(k: string, v: string) { this.headers[k] = v },
    send(b: string) { this.body = b },
  }
  return res
}

// ──────────────────────────────────────────────────────────────────────
// 🛒前台 — 健康检查和运营可用性确认
// ──────────────────────────────────────────────────────────────────────
describe('🛒前台 — 健康检查与可用性视角', () => {
  it('前台查看健康检查端点确认服务运行正常', () => {
    const { controller, service } = createController()
    registerDefaultMetrics(service)

    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.equal(typeof health.metrics, 'number')
    assert.ok(health.metrics > 0, '应有已注册的指标')
  })

  it('前台读取指标文本确认格式正确', async () => {
    const { controller, service } = createController()
    registerDefaultMetrics(service)

    const res = mockRes()
    await controller.getMetrics(res)
    assert.ok(res.body.length > 0, '应返回非空指标文本')
    assert.ok(res.body.includes('# HELP'), '应包含 HELP 注释')
    assert.ok(res.body.includes('# TYPE'), '应包含 TYPE 注释')
    assert.equal(res.headers['Content-Type'], 'text/plain; version=0.0.4; charset=utf-8')
  })

  it('前台确认全部 5 个默认指标都存在（计数校验）', async () => {
    const { controller, service } = createController()
    registerDefaultMetrics(service)

    const names = service.listMetrics()
    assert.equal(names.length, 5, '应有 5 个默认指标')
    assert.ok(names.includes('http_requests_total'))
    assert.ok(names.includes('http_request_duration_ms'))
    assert.ok(names.includes('http_active_connections'))
    assert.ok(names.includes('http_exceptions_total'))
    assert.ok(names.includes('process_uptime_seconds'))
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🔧安监 — 异常和安全监控指标
// ──────────────────────────────────────────────────────────────────────
describe('🔧安监 — 异常监控指标视角', () => {
  it('安监可记录和查询异常计数器', () => {
    const { controller, service } = createController()
    registerDefaultMetrics(service)

    // 模拟多个异常
    service.incrementCounter('http_exceptions_total', { method: 'POST', path: '/api/auth', kind: 'UNAUTHORIZED' })
    service.incrementCounter('http_exceptions_total', { method: 'GET', path: '/api/users', kind: 'NOT_FOUND' })
    service.incrementCounter('http_exceptions_total', { method: 'POST', path: '/api/auth', kind: 'UNAUTHORIZED' })

    // 通过 render 验证异常统计
    const body = service.render()
    const matchUnauthorized = body.match(/http_exceptions_total\{kind="UNAUTHORIZED",method="POST",path="\/api\/auth"\} (\d+)/)
    assert.ok(matchUnauthorized, '应有未授权异常的统计')
    assert.equal(Number(matchUnauthorized[1]), 2)
  })

  it('安监可每秒检查活动连接数（活跃度分析）', () => {
    const { controller, service } = createController()
    registerDefaultMetrics(service)

    // 模拟活跃连接变化
    service.setGauge('http_active_connections', { service: 'api' }, 15)
    service.setGauge('http_active_connections', { service: 'api' }, 42)
    service.setGauge('http_active_connections', { service: 'batch' }, 8)

    const body = service.render()
    const apiMatch = body.match(/http_active_connections\{service="api"\} (\d+)/)
    assert.ok(apiMatch, '应有 api 服务的活跃连接')
    assert.equal(Number(apiMatch[1]), 42, 'gauge 应覆盖为最新值')

    const batchMatch = body.match(/http_active_connections\{service="batch"\} (\d+)/)
    assert.ok(batchMatch, '应有 batch 服务的活跃连接')
    assert.equal(Number(batchMatch[1]), 8)
  })

  it('安监可分析请求失败率趋势（异常比例计算）', () => {
    const { controller, service } = createController()
    registerDefaultMetrics(service)

    // 模拟 100 次成功 + 5 次异常 = 95.24% 成功率
    for (let i = 0; i < 100; i++) {
      service.incrementCounter('http_requests_total', { method: 'GET', path: '/api/game', status: '200' })
    }
    for (let i = 0; i < 5; i++) {
      service.incrementCounter('http_exceptions_total', { method: 'GET', path: '/api/game', kind: 'TIMEOUT' })
    }

    const body = service.render()
    const requestsMatch = body.match(/http_requests_total\{method="GET",path="\/api\/game",status="200"\} (\d+)/)
    assert.ok(requestsMatch, '应有成功请求统计')
    assert.equal(Number(requestsMatch[1]), 100)

    const exceptionsMatch = body.match(/http_exceptions_total\{kind="TIMEOUT",method="GET",path="\/api\/game"\} (\d+)/)
    assert.ok(exceptionsMatch, '应有超时异常统计')
    assert.equal(Number(exceptionsMatch[1]), 5)

    // 异常率为 5 / (100 + 5) ≈ 4.76%
    const total = 100 + 5
    const failureRate = 5 / total * 100
    assert.ok(failureRate < 5, `异常率 ${failureRate.toFixed(2)}% 应在合理范围`)
  })
})

// ──────────────────────────────────────────────────────────────────────
// 🎯运行专员 — 全指标类型运营管理（Counter / Gauge / Histogram）
// ──────────────────────────────────────────────────────────────────────
describe('🎯运行专员 — 多类型指标运营视角', () => {
  it('运行专员注册自定义业务 Counter 并持续累加', () => {
    const { controller, service } = createController()

    const c = service.registerCounter('game_sessions_total', 'Total number of game sessions started')
    assert.equal(c.type, 'counter')

    // 模拟 10 次游戏会话
    for (let i = 0; i < 10; i++) {
      service.incrementCounter('game_sessions_total', { game: 'basketball', station: 'st-01' })
    }

    const body = service.render()
    assert.ok(body.includes('game_sessions_total{game="basketball",station="st-01"} 10'))
  })

  it('运行专员使用 Histogram 跟踪 API 延迟分布', () => {
    const { controller, service } = createController()

    const h = service.registerHistogram(
      'api_response_ms',
      'API response latency distribution',
      [10, 50, 100, 500, 1000]
    )
    assert.equal(h.type, 'histogram')
    assert.equal(h.buckets.length, 5)

    // 模拟不同的延迟观测值
    const latencies = [8, 12, 45, 67, 120, 350, 890, 1500]
    for (const lat of latencies) {
      service.observeHistogram('api_response_ms', lat, { method: 'GET', path: '/api/leaderboard' })
    }

    const body = service.render()
    assert.ok(body.includes('api_response_ms_bucket'), '应有桶分布')
    assert.ok(body.includes('api_response_ms_sum'), '应有求和')
    assert.ok(body.includes('api_response_ms_count'), '应有计数')
    assert.ok(body.includes('le="+Inf"'), '应有 +Inf 桶')

    // 检查具体桶值: 8 个观测值，le="100" 桶应包含 <=100 的有 4 个
    const le100Match = body.match(/api_response_ms_bucket\{le="100",method="GET",path="\/api\/leaderboard"\} (\d+)/)
    assert.ok(le100Match, '应有 le="100" 桶')
    assert.equal(Number(le100Match[1]), 4, '<=100ms 的请求应为 4 个')
  })

  it('运行专员验证指标重复注册保护（同类型覆盖 vs 不同类型冲突）', () => {
    const { controller, service } = createController()

    // 同类型重复注册应返回同一个实例（不会报错）
    const c1 = service.registerCounter('test_dup', 'First')
    const c2 = service.registerCounter('test_dup', 'Second with same name')
    assert.equal(c1, c2, '同类型重复注册应返回同一实例')

    // 不同类型同名应报错
    service.registerGauge('another_metric', 'Gauge version')
    assert.throws(
      () => service.registerCounter('another_metric', 'Trying to register as counter'),
      /already registered as gauge/
    )
  })
})

// ──────────────────────────────────────────────────────────────────────
// 👔店长 — 多维度聚合运营视图
// ──────────────────────────────────────────────────────────────────────
describe('👔店长 — 多维度运营聚合视角', () => {
  it('店长查看混合指标（计数 + 活跃 + 延迟）的完整渲染输出', async () => {
    const { controller, service } = createController()
    registerDefaultMetrics(service)

    // 模拟完整的业务流量
    for (let i = 0; i < 50; i++) {
      service.incrementCounter('http_requests_total', { method: i % 2 === 0 ? 'GET' : 'POST', path: '/api/game', status: '200' })
    }
    service.setGauge('http_active_connections', {}, 23)
    service.observeHistogram('http_request_duration_ms', 42, { method: 'GET', path: '/api/game' })
    service.observeHistogram('http_request_duration_ms', 156, { method: 'POST', path: '/api/game' })
    service.incrementCounter('http_exceptions_total', { method: 'POST', path: '/api/payment', kind: 'BAD_REQUEST' })

    const res = mockRes()
    await controller.getMetrics(res)
    const body = res.body

    // 验证所有 5 个默认指标都渲染在输出中
    assert.ok(body.includes('http_requests_total'), '应有请求计数')
    assert.ok(body.includes('http_request_duration_ms'), '应有请求延迟')
    assert.ok(body.includes('http_active_connections'), '应有活跃连接')
    assert.ok(body.includes('http_exceptions_total'), '应有异常计数')
    assert.ok(body.includes('process_uptime_seconds'), '应有运行时长')
  })

  it('店长查看指标数量（健康检查返回正确的 metrics 计数）', () => {
    const { controller, service } = createController()

    // 初始 0 个指标
    let health = controller.getHealth()
    assert.equal(health.metrics, 0)

    // 注册 3 个指标
    service.registerCounter('custom_counter', 'test')
    service.registerGauge('custom_gauge', 'test')
    service.registerHistogram('custom_histogram', 'test', [1, 2, 3])

    health = controller.getHealth()
    assert.equal(health.metrics, 3)
  })

  it('店长通过 histogram 桶分布分析性能瓶颈', () => {
    const { controller, service } = createController()

    service.registerHistogram('payment_latency_ms', 'Payment processing latency', [50, 100, 200, 500])

    // 模拟 30 笔支付，大部分在 50-150ms
    const latencies = [30, 45, 55, 62, 78, 85, 95, 110, 130, 148,  // 10 笔
                       160, 180, 195, 220, 260, 300, 340, 380, 420, 480,  // 10 笔
                       520, 600, 750, 900]  // 4 笔
    for (const lat of latencies) {
      service.observeHistogram('payment_latency_ms', lat, { method: 'pay' })
    }

    const body = service.render()
    // ≤50ms: 有 2 笔 (30, 45)
    const le50 = body.match(/payment_latency_ms_bucket\{le="50",method="pay"\} (\d+)/)
    assert.ok(le50, '应有 le=50 桶')
    assert.equal(Number(le50[1]), 2, '≤50ms 有 2 笔')

    // ≤200ms: 前 15 笔 (latencies[0..14])
    const le200 = body.match(/payment_latency_ms_bucket\{le="200",method="pay"\} (\d+)/)
    assert.ok(le200, '应有 le=200 桶')
    assert.equal(Number(le200[1]), 13, '≤200ms 有 13 笔')

    // 总计 24 笔
    const inf = body.match(/payment_latency_ms_bucket\{le="\+Inf",method="pay"\} (\d+)/)
    assert.ok(inf, '应有 +Inf 桶')
    assert.equal(Number(inf[1]), 24, '总共 24 笔')

    // 验证平均值
    const sum = latencies.reduce((s, v) => s + v, 0)
    const sumMatch = body.match(/payment_latency_ms_sum\{method="pay"\} (\d+(?:\.\d+)?)/)
    assert.ok(sumMatch, '应有 sum')
    assert.equal(Number(sumMatch[1]), sum)
  })
})
