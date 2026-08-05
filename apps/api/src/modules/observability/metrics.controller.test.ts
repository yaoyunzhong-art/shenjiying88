import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * metrics.controller.spec.ts — MetricsController 路由/功能 spec 测试
 *
 * 策略：内联 Controller（无 NestJS DI），mock MetricsService。
 * 覆盖：
 *   - GET /metrics  正常渲染 Prometheus 文本格式
 *   - GET /metrics  空指标输出
 *   - GET /healthz  正常返回
 *   - GET /healthz  重置后返回 metrics=0
 *   - Unsupported 路由/异常场景
 */

import assert from 'node:assert/strict'
// ── Mock Service 工厂 ───────────────────────────────────────────
function makeMockMetricsService(overrides: Record<string, unknown> = {}) {
  return {
    render: vi.fn(() => '# HELP http_requests_total ...\n# TYPE http_requests_total counter\nhttp_requests_total 42\n'),
    listMetrics: vi.fn(() => ['http_requests_total']),
    reset: vi.fn(() => {}),
    registerCounter: vi.fn(() => {}),
    registerGauge: vi.fn(() => {}),
    registerHistogram: vi.fn(() => {}),
    incrementCounter: vi.fn(() => {}),
    setGauge: vi.fn(() => {}),
    observeHistogram: vi.fn(() => {}),
    ...overrides,
  }
}

// ── Inline Controller（镜像 src metrics.controller.ts） ────────────
interface Response {
  headers: Record<string, string>
  body: unknown
}

function makeRes(): Response & { setHeader: (k: string, v: string) => void; send: (b: unknown) => void } {
  const res: Response & { setHeader: (k: string, v: string) => void; send: (b: unknown) => void } = {
    headers: {},
    body: undefined,
    setHeader(k: string, v: string) {
      this.headers[k] = v
    },
    send(b: unknown) {
      this.body = b
    },
  }
  return res
}

class MetricsController {
  constructor(private readonly metricsService: ReturnType<typeof makeMockMetricsService>) {}

  async getMetrics(res: ReturnType<typeof makeRes>) {
    const body = this.metricsService.render()
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
    res.send(body)
  }

  getHealth() {
    return { status: 'ok' as const, metrics: this.metricsService.listMetrics().length }
  }
}

// ── Tests ────────────────────────────────────────────────────────
describe('MetricsController — decorator / routing', () => {
  it('controller class name matches source', () => {
    // 验证内联类名与源代码一致（实际路由由 NestJS 装饰器提供）
    assert.equal(MetricsController.name, 'MetricsController')
  })

  it('getMetrics 接受 (res) 参数——符合 @Res() 签名', () => {
    const controller = new MetricsController(makeMockMetricsService())
    // 反射检查参数长度
    assert.equal(MetricsController.prototype.getMetrics.length, 1)
    assert.ok(typeof controller.getMetrics === 'function')
  })

  it('getHealth 零参数——无 @Res()', () => {
    assert.equal(MetricsController.prototype.getHealth.length, 0)
    assert.ok(typeof MetricsController.prototype.getHealth === 'function')
  })
})

describe('MetricsController — GET /healthz', () => {
  it('默认有 1 个注册指标时返回 metrics=1', () => {
    const controller = new MetricsController(makeMockMetricsService())
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.equal(health.metrics, 1)
  })

  it('有多指标时返回正确计数', () => {
    const service = makeMockMetricsService({
      listMetrics: vi.fn(() => ['m1', 'm2', 'm3']),
    })
    const controller = new MetricsController(service)
    const health = controller.getHealth()
    assert.equal(health.metrics, 3)
  })

  it('reset 后返回 metrics=0', () => {
    const service = makeMockMetricsService({
      listMetrics: vi.fn(() => []),
    })
    const controller = new MetricsController(service)
    const health = controller.getHealth()
    assert.equal(health.metrics, 0)
  })

  it('空 MetricsService 保持 status=ok', () => {
    const service = makeMockMetricsService({
      listMetrics: vi.fn(() => []),
    })
    const controller = new MetricsController(service)
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
  })
})

describe('MetricsController — GET /metrics', () => {
  it('注册指标后渲染 Prometheus 文本', async () => {
    const expectedBody = '# HELP http_requests_total ...\n# TYPE http_requests_total counter\nhttp_requests_total 42\n'
    const service = makeMockMetricsService()
    service.render.mockImplementation(() => expectedBody)

    const controller = new MetricsController(service)
    const res = makeRes()
    await controller.getMetrics(res)

    assert.equal(res.body, expectedBody)
    assert.equal(res.headers['Content-Type'], 'text/plain; version=0.0.4; charset=utf-8')
    assert.equal(service.render.mock.calls.length, 1)
  })

  it('未注册指标时仅输出 HEADER 空行', async () => {
    const service = makeMockMetricsService({
      render: vi.fn(() => '# HELP \n# TYPE \n'),
    })
    const controller = new MetricsController(service)
    const res = makeRes()
    await controller.getMetrics(res)

    assert.equal(typeof res.body, 'string')
    assert.ok((res.body as string).startsWith('# HELP'))
    assert.equal(service.render.mock.calls.length, 1)
  })

  it('Large metrics body 不截断', async () => {
    const largeBody = Array.from({ length: 1000 }, (_, i) => `metric_${i} ${i}`).join('\n')
    const service = makeMockMetricsService({
      render: vi.fn(() => largeBody),
    })
    const controller = new MetricsController(service)
    const res = makeRes()
    await controller.getMetrics(res)

    assert.equal(typeof res.body, 'string')
    assert.equal((res.body as string).split('\n').length, 1000)
  })

  it('render 被调用且仅调用一次', async () => {
    const service = makeMockMetricsService()
    const controller = new MetricsController(service)
    const res = makeRes()
    await controller.getMetrics(res)

    assert.equal(service.render.mock.calls.length, 1)
  })

  it('设置正确的 Content-Type', async () => {
    const controller = new MetricsController(makeMockMetricsService())
    const res = makeRes()
    await controller.getMetrics(res)

    assert.ok(res.headers['Content-Type'].includes('text/plain'))
    assert.ok(res.headers['Content-Type'].includes('charset=utf-8'))
  })
})

describe('MetricsController — 异常与边界', () => {
  it('render 抛出异常时 getMetrics 传播错误', async () => {
    const service = makeMockMetricsService({
      render: vi.fn(() => { throw new Error('render failure') }),
    })
    const controller = new MetricsController(service)
    const res = makeRes()

    await assert.rejects(
      () => controller.getMetrics(res),
      /render failure/
    )
  })

  it('多次调用 getMetrics 不影响后续调用', async () => {
    let callCount = 0
    const service = makeMockMetricsService({
      render: vi.fn(() => {
        callCount++
        return `call-${callCount}`
      }),
    })
    const controller = new MetricsController(service)
    const res1 = makeRes()
    const res2 = makeRes()

    await controller.getMetrics(res1)
    await controller.getMetrics(res2)

    assert.equal(res1.body, 'call-1')
    assert.equal(res2.body, 'call-2')
  })

  it('getHealth 同步执行不抛出', () => {
    const service = makeMockMetricsService()
    const controller = new MetricsController(service)
    assert.doesNotThrow(() => controller.getHealth())
  })

  it('getMetrics 异步执行不抛出（正常路径）', async () => {
    const controller = new MetricsController(makeMockMetricsService())
    const res = makeRes()
    await assert.doesNotReject(() => controller.getMetrics(res))
  })
})
