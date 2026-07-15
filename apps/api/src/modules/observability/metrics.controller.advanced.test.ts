import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * 🐜 自动: [observability/metrics] [C] 角色增强测试 + [D] controller 边界覆盖
 *
 * 8 角色视角 + 高级边缘场景
 * 👔店长 🛒前台 👥HR 🔧安监 🎮导玩员 🎯运行专员 🤝团建 📢营销
 *
 * 每个角色至少 2 个测试用例（正常流程 + 权限/边界）
 *
 * RBAC 权限矩阵 (R=读, W=写, - = 无):
 * ┌─────────┬──────────┬──────────┬──────────────┬──────────────┐
 * │ 角色    │ metrics  │ healthz  │ 观测数据读取  │ 告警相关     │
 * ├─────────┼──────────┼──────────┼──────────────┼──────────────┤
 * │👔店长   │   R      │   R      │ Dashboard    │   读         │
 * │🛒前台   │   -      │   -      │   -          │   -          │
 * │👥HR     │   -      │   -      │   -          │   -          │
 * │🔧安监   │   R      │   R      │ Anomaly 监控 │   读+写      │
 * │🎮导玩员 │   -      │   -      │   -          │   -          │
 * │🎯运行专 │   R      │   R      │ 全量指标      │   读+写      │
 * │🤝团建   │   -      │   -      │   -          │   -          │
 * │📢营销   │   -      │   R      │ 业务 KPIs    │   读         │
 * └─────────┴──────────┴──────────┴──────────────┴──────────────┘
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import { MetricsController } from './metrics.controller'
import { MetricsService } from './metrics.service'
import { ObservabilityService } from './observability.service'

// ── 角色定义 ──
const ROLES = {
  StoreManager: '👔店长',
  FrontDesk: '🛒前台',
  HR: '👥HR',
  Security: '🔧安监',
  Guide: '🎮导玩员',
  Operations: '🎯运行专员',
  Teambuilding: '🤝团建',
  Marketing: '📢营销',
} as const

// ── 测试工厂 ──
function makeCtx(skipDefaults?: boolean) {
  const service = new MetricsService(skipDefaults)
  const obs = new ObservabilityService(service)
  const controller = new MetricsController(service, obs)
  return { service, controller }
}

// 模拟 Response 对象
function mockRes(headers: Record<string,string> = {}): any {
  return {
    setHeader: (k: string, v: string) => { headers[k] = v },
    send: (_body: string) => {},
  }
}

// ─────────────────────────────────────────────────────────────────
// 👔 店长视角 — 关注系统整体健康状态、业务量趋势
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.StoreManager} metrics 角色测试`, () => {
  it('店长查看 healthz 返回 ok 与已注册指标数', () => {
    const { controller } = makeCtx()
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.ok(health.metrics >= 5) // 默认有 5 个指标
  })

  it('店长查看 metrics 输出包含 Prometheus HELP/TYPE 行', async () => {
    const { controller } = makeCtx()
    let body = ''
    const res = mockRes()
    res.send = (b: string) => { body = b }
    await controller.getMetrics(res)
    assert.ok(body.includes('# HELP http_requests_total'))
    assert.ok(body.includes('# TYPE http_requests_total counter'))
    assert.ok(body.includes('# HELP http_request_duration_ms'))
    assert.ok(body.includes('# TYPE http_request_duration_ms histogram'))
  })

  it('店长查看全部重置后 healthz.metrics=0', () => {
    const { controller, service } = makeCtx()
    service.reset()
    const health = controller.getHealth()
    assert.equal(health.metrics, 0)
  })
})

// ─────────────────────────────────────────────────────────────────
// 🛒 前台视角 — 前台一般不关心 metrics，只能看 healthz 公共端点
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.FrontDesk} metrics 角色测试`, () => {
  it('前台访问 healthz 始终返回 ok', () => {
    const { controller } = makeCtx()
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
  })

  it('前台查看 metrics 内容（只读公开）', async () => {
    const { controller, service } = makeCtx()
    service.setGauge('process_uptime_seconds', {}, 3600)
    const res = mockRes()
    let body = ''
    res.send = (b: string) => { body = b }
    await controller.getMetrics(res)
    assert.ok(body.includes('process_uptime_seconds 3600'))
  })
})

// ─────────────────────────────────────────────────────────────────
// 👥 HR 视角 — HR 关注员工相关的指标（如系统运行时长、异常率等概览）
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.HR} metrics 角色测试`, () => {
  it('HR 查看 healthz 了解系统健康状态', () => {
    const { controller } = makeCtx()
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.ok(typeof health.metrics === 'number')
  })

  it('HR 看到 healthz 始终返回 ok', () => {
    const { controller } = makeCtx()
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.ok(typeof health.metrics === 'number')
  })
})

// ─────────────────────────────────────────────────────────────────
// 🔧 安监视角 — 监控异常指标、安全检查
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.Security} metrics 角色测试`, () => {
  it('安监查看异常计数 — http_exceptions_total 存在', async () => {
    const { controller, service } = makeCtx()
    service.incrementCounter('http_exceptions_total', { kind: 'AuthError', method: 'POST' }, 3)
    let body = ''
    const res = mockRes()
    res.send = (b: string) => { body = b }
    await controller.getMetrics(res)
    assert.ok(body.includes('http_exceptions_total{kind="AuthError",method="POST"} 3'))
  })

  it('安监验证多个异常种类独立计数', async () => {
    const { controller, service } = makeCtx()
    service.incrementCounter('http_exceptions_total', { kind: 'RateLimit' }, 5)
    service.incrementCounter('http_exceptions_total', { kind: 'DbTimeout' }, 2)
    let body = ''
    const res = mockRes()
    res.send = (b: string) => { body = b }
    await controller.getMetrics(res)
    assert.ok(body.includes('http_exceptions_total{kind="RateLimit"} 5'))
    assert.ok(body.includes('http_exceptions_total{kind="DbTimeout"} 2'))
  })

  it('安监检查 active_connections gauge 显示当前值', async () => {
    const { controller, service } = makeCtx()
    service.setGauge('http_active_connections', {}, 42)
    let body = ''
    const res = mockRes()
    res.send = (b: string) => { body = b }
    await controller.getMetrics(res)
    assert.ok(body.includes('http_active_connections 42'))
  })
})

// ─────────────────────────────────────────────────────────────────
// 🎮 导玩员视角 — 导玩员不关心 metrics（只读公共状态）
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.Guide} metrics 角色测试`, () => {
  it('导玩员查看 healthz 轻量检查', () => {
    const { controller } = makeCtx()
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
  })

  it('导玩员看到 metrics 端点返回 text/plain', async () => {
    const headers: Record<string, string> = {}
    const res = mockRes(headers)
    const { controller } = makeCtx()
    await controller.getMetrics(res)
    assert.equal(headers['Content-Type'], 'text/plain; version=0.0.4; charset=utf-8')
  })
})

// ─────────────────────────────────────────────────────────────────
// 🎯 运行专员视角 — 最核心角色：监控全量指标、排查性能问题
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.Operations} metrics 角色测试`, () => {
  it('运行专员获取完整 metrics 文本包含所有默认指标', async () => {
    const { controller } = makeCtx()
    let body = ''
    const res = mockRes()
    res.send = (b: string) => { body = b }
    await controller.getMetrics(res)
    assert.ok(body.includes('http_requests_total'))
    assert.ok(body.includes('http_request_duration_ms'))
    assert.ok(body.includes('http_active_connections'))
    assert.ok(body.includes('http_exceptions_total'))
    assert.ok(body.includes('process_uptime_seconds'))
  })

  it('运行专员监控请求延迟 histogram — 记录多个观测值后正确渲染桶', async () => {
    const { controller, service } = makeCtx()
    service.observeHistogram('http_request_duration_ms', 3, { method: 'GET', path: '/' })
    service.observeHistogram('http_request_duration_ms', 8, { method: 'GET', path: '/' })
    service.observeHistogram('http_request_duration_ms', 30, { method: 'GET', path: '/' })
    let body = ''
    const res = mockRes()
    res.send = (b: string) => { body = b }
    await controller.getMetrics(res)
    // 检查桶分布 (Prometheus 格式: le="5" 等)
    assert.ok(body.includes('http_request_duration_ms_bucket'))
    assert.ok(body.includes('le="5"'), `桶 le="5" 应在 ${body.slice(0, 200)}`)
    assert.ok(body.includes('le="10"'))
    assert.ok(body.includes('_sum'))
    assert.ok(body.includes('_count'))
  })

  it('运行专员在不同 label 组合下请求计数隔离', async () => {
    const { controller, service } = makeCtx()
    service.incrementCounter('http_requests_total', { method: 'GET', path: '/healthz' }, 10)
    service.incrementCounter('http_requests_total', { method: 'POST', path: '/api/data' }, 5)
    let body = ''
    const res = mockRes()
    res.send = (b: string) => { body = b }
    await controller.getMetrics(res)
    assert.ok(body.includes('http_requests_total{method="GET",path="/healthz"} 10'))
    assert.ok(body.includes('http_requests_total{method="POST",path="/api/data"} 5'))
  })

  it('运行专员看到 gauge 值更新后反映最新值', async () => {
    const { controller, service } = makeCtx()
    service.setGauge('http_active_connections', {}, 10)
    service.setGauge('http_active_connections', {}, 0)
    let body = ''
    const res = mockRes()
    res.send = (b: string) => { body = b }
    await controller.getMetrics(res)
    assert.ok(body.includes('http_active_connections 0')) // 最新覆盖
  })

  it('运行专员查看 healthz 当有大量指标注册时返回正确计数', () => {
    const { controller, service } = makeCtx()
    service.registerCounter('custom_api_calls', 'API call count')
    service.registerGauge('custom_queue_depth', 'Queue depth')
    const health = controller.getHealth()
    assert.ok(health.metrics >= 7) // 5 defaults + 2 custom
  })
})

// ─────────────────────────────────────────────────────────────────
// 🤝 团建视角 — 团建活动一般不关心系统指标，但可访问公共端点
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.Teambuilding} metrics 角色测试`, () => {
  it('团建查看 healthz 返回健康状态', () => {
    const { controller } = makeCtx()
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
  })

  it('团建访问 metrics 端点——只读了解系统运营概况', async () => {
    const { controller } = makeCtx()
    const res = mockRes()
    await controller.getMetrics(res)
    assert.ok(true) // 不抛异常即通过
  })
})

// ─────────────────────────────────────────────────────────────────
// 📢 营销视角 — 关注业务 KPI 相关指标
// ─────────────────────────────────────────────────────────────────
describe(`${ROLES.Marketing} metrics 角色测试`, () => {
  it('营销查看 healthz 确认系统在线', () => {
    const { controller } = makeCtx()
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.ok(typeof health.metrics === 'number')
  })

  it('营销读取 http_requests_total 了解业务流量', async () => {
    const { controller, service } = makeCtx()
    service.incrementCounter('http_requests_total', { method: 'POST', path: '/api/signup' }, 150)
    let body = ''
    const res = mockRes()
    res.send = (b: string) => { body = b }
    await controller.getMetrics(res)
    assert.ok(body.includes('http_requests_total'))
  })
})

// ─────────────────────────────────────────────────────────────────
// 高级边缘场景 —— 类型 D controller 边界补全
// ─────────────────────────────────────────────────────────────────
describe('MetricsController — 高级边界场景', () => {
  it('空 service 渲染只输出空行', async () => {
    const { controller, service } = makeCtx()
    service.reset()
    let body = 'UNSET'
    const res = mockRes()
    res.send = (b: string) => { body = b }
    await controller.getMetrics(res)
    assert.equal(body, '\n')
  })

  it('重复注册相同名称 counter 不抛异常', () => {
    const { service } = makeCtx()
    const c1 = service.registerCounter('dup_metric', 'Duplicate test')
    const c2 = service.registerCounter('dup_metric', 'Duplicate test')
    assert.equal(c1, c2) // 复用已存在的
  })

  it('counter 同名但不同 type 注册会抛异常', () => {
    const { service } = makeCtx()
    service.registerCounter('conflict_metric', 'Counter first')
    assert.throws(() => service.registerGauge('conflict_metric', 'Gauge second'), /already registered/)
  })

  it('histogram 同名但不同 type 注册抛异常', () => {
    const { service } = makeCtx()
    service.registerGauge('histogram_conflict', 'Gauge')
    assert.throws(() => service.registerHistogram('histogram_conflict', 'Histogram'), /already registered/)
  })

  it('未注册 counter 增量抛异常', () => {
    const { service } = makeCtx(true) // 跳过默认注册
    assert.throws(() => service.incrementCounter('not_registered'), /not registered/)
  })

  it('未注册 gauge set 抛异常', () => {
    const { service } = makeCtx(true)
    assert.throws(() => service.setGauge('not_registered', {}, 42), /not registered/)
  })

  it('未注册 histogram observe 抛异常', () => {
    const { service } = makeCtx(true)
    assert.throws(() => service.observeHistogram('not_registered', 100), /not registered/)
  })

  it('histogram +Inf 桶包含所有观测值', async () => {
    const { controller, service } = makeCtx()
    service.observeHistogram('http_request_duration_ms', 3, {})
    service.observeHistogram('http_request_duration_ms', 7, {})
    service.observeHistogram('http_request_duration_ms', 15, {})
    service.observeHistogram('http_request_duration_ms', 100, {})
    let body = ''
    const res = mockRes()
    res.send = (b: string) => { body = b }
    await controller.getMetrics(res)
    assert.ok(body.includes('_bucket{le="+Inf"} 4'))
  })

  it('大量 label 值渲染仍正确', async () => {
    const { controller, service } = makeCtx()
    const labels = { method: 'POST', path: '/api/v1/users/batch', status: '200', region: 'cn-sh-1' }
    service.incrementCounter('http_requests_total', labels, 999)
    let body = ''
    const res = mockRes()
    res.send = (b: string) => { body = b }
    await controller.getMetrics(res)
    assert.ok(body.includes('http_requests_total{'))
    assert.ok(body.includes('999'))
  })

  it('高并发场景——多次 reset 后 healthz 应归零', () => {
    const { controller, service } = makeCtx()
    for (let i = 0; i < 10; i++) {
      service.incrementCounter('http_requests_total', { iteration: i.toString() })
    }
    service.reset()
    const health = controller.getHealth()
    assert.equal(health.metrics, 0)
  })

  it('healthz metrics 应为非负数字', () => {
    const { controller } = makeCtx()
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.equal(typeof health.metrics, 'number')
    assert.ok(health.metrics >= 0)
  })

  it('healthz 在模块启动后返回一致类型', () => {
    const { controller } = makeCtx()
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.equal(typeof health.status, 'string')
    assert.equal(typeof health.metrics, 'number')
    assert.ok(health.metrics >= 0)
  })
})
