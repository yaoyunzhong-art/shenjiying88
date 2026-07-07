import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * metrics.controller.test.ts — MetricsController 单元测试
 *
 * 覆盖:
 *   - GET /metrics 路由装饰器存在
 *   - GET /healthz 路由装饰器存在
 *   - getMetrics 返回 Prometheus 文本格式
 *   - getHealth 返回 { status, metrics }
 */

import assert from 'node:assert/strict'
import { MetricsController } from './metrics.controller'
import { MetricsService } from './metrics.service'

function makeController() {
  const service = new MetricsService()
  return new MetricsController(service)
}

describe('MetricsController — 路由装饰器', () => {
  it('getMetrics 有 @Get("metrics") 装饰器', () => {
    const path = Reflect.getMetadata('path', MetricsController.prototype.getMetrics)
    const method = Reflect.getMetadata('method', MetricsController.prototype.getMetrics)
    assert.equal(method, 0, '应使用 GET (RequestMethod.GET = 0)')
    assert.ok(typeof path === 'string', 'path 应为字符串')
    assert.ok(path.includes('metrics'), `path 应包含 "metrics",实际 ${path}`)
  })

  it('getHealth 有 @Get("healthz") 装饰器', () => {
    const path = Reflect.getMetadata('path', MetricsController.prototype.getHealth)
    const method = Reflect.getMetadata('method', MetricsController.prototype.getHealth)
    assert.equal(method, 0)
    assert.ok(path.includes('healthz'), `path 应包含 "healthz",实际 ${path}`)
  })
})

describe('MetricsController — GET /healthz', () => {
  it('有注册指标时返回 5', () => {
    const controller = makeController()
    const health = controller.getHealth()
    assert.equal(health.status, 'ok')
    assert.equal(health.metrics, 5)
  })

  it('reset 后返回 0', () => {
    const service = new MetricsService()
    const controller = new MetricsController(service)
    service.reset()
    const health = controller.getHealth()
    assert.equal(health.metrics, 0)
  })
})

describe('MetricsController — GET /metrics', () => {
  it('未注册指标时输出仅含 HEADER 空行', async () => {
    const service = new MetricsService()
    service.reset()
    const controller = new MetricsController(service)

    let body = ''
    const headers: Record<string, string> = {}
    const res = {
      setHeader: (k: string, v: string) => { headers[k] = v },
      send: (b: string) => { body = b }
    }
    await controller.getMetrics(res as any)
    assert.equal(headers['Content-Type'], 'text/plain; version=0.0.4; charset=utf-8')
    // render() on empty service returns "\n" only
    assert.equal(body, '\n')
  })

  it('注册指标后渲染 Prometheus 文本', async () => {
    const controller = makeController()
    let body = ''
    const res = {
      setHeader: () => {},
      send: (b: string) => { body = b }
    }
    await controller.getMetrics(res as any)
    assert.ok(body.includes('# HELP http_requests_total'))
    assert.ok(body.includes('# TYPE http_requests_total counter'))
    assert.ok(body.includes('# HELP http_request_duration_ms'))
    assert.ok(body.includes('process_uptime_seconds'))
  })
})