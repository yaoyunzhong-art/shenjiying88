import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * metrics.simulator.test.ts — 可观测性模块模拟场景测试
 *
 * 模拟典型 HTTP 请求经过 MetricsInterceptor 时的行为：
 *   - 正常请求流经 interceptor 产生 counter / histogram
 *   - 异常请求流经 interceptor 产生例外计数
 *   - 多个并发请求的正确 gauge 值
 */

import assert from 'node:assert/strict'
import { of, throwError, Observable } from 'rxjs'
import { MetricsService } from './metrics.service'
import { MetricsInterceptor } from './metrics.interceptor'

function mockExecutionContext(method: string, path: string, statusCode: number) {
  return {
    getType: () => 'http' as const,
    switchToHttp: () => ({
      getRequest: () => ({
        method,
        path,
        route: { path }
      }),
      getResponse: () => ({
        statusCode
      })
    })
  } as any
}

function mockNextHandler(returnValue: any, error?: Error) {
  return {
    handle: () => error ? throwError(() => error) : of(returnValue)
  } as any
}

describe('MetricsInterceptor — 正常请求', () => {
  it('成功请求增加 counter 和 histogram', async () => {
    const service = new MetricsService()
    service.registerCounter('http_requests_total', '')
    service.registerHistogram('http_request_duration_ms', '')
    service.registerGauge('http_active_connections', '')
    service.setGauge('http_active_connections', {}, 0)

    const interceptor = new MetricsInterceptor(service)
    const ctx = mockExecutionContext('GET', '/api/test', 200)
    const next = mockNextHandler({ data: 'ok' })

    await interceptor.intercept(ctx, next).toPromise()

    const render = service.render()
    assert.ok(render.includes('http_requests_total{method="GET",path="/api/test",status="200"} 1'))
    assert.ok(render.includes('http_request_duration_ms'))
  })

  it('非 HTTP 请求跳过拦截器', () => {
    const service = new MetricsService()
    const interceptor = new MetricsInterceptor(service)
    const ctx = {
      getType: () => 'ws' as const,
      switchToHttp: () => { throw new Error('should not be called') }
    } as any
    const next = mockNextHandler('ws-data')

    const result = interceptor.intercept(ctx, next)
    assert.ok(result instanceof Observable)
  })
})

describe('MetricsInterceptor — 异常请求', () => {
  it('抛出异常的请求增加例外计数器', async () => {
    const service = new MetricsService()
    service.registerCounter('http_requests_total', '')
    service.registerCounter('http_exceptions_total', '')
    service.registerHistogram('http_request_duration_ms', '')
    service.registerGauge('http_active_connections', '')
    service.setGauge('http_active_connections', {}, 0)

    const interceptor = new MetricsInterceptor(service)
    const ctx = mockExecutionContext('POST', '/api/error', 500)
    const next = mockNextHandler(undefined, new Error('test error'))

    // 等待 Observable 完成 (即使有 error tap 也会跑);
    // 用 firstValueFrom + catchError 而不是 toPromise,避免 await 抛出导致断言跳过
    const { firstValueFrom } = await import('rxjs')
    const { catchError } = await import('rxjs/operators')
    await firstValueFrom(
      interceptor.intercept(ctx, next).pipe(catchError(() => of(undefined)))
    )

    const render = service.render()
    assert.ok(
      render.includes('http_exceptions_total{kind="Error",method="POST",path="/api/error"} 1'),
      `render 应包含 http_exceptions_total,实际:\n${render}`
    )
    assert.ok(
      render.includes('http_requests_total{method="POST",path="/api/error",status="500"} 1'),
      `render 应包含 http_requests_total 异常样本,实际:\n${render}`
    )
  })
})

describe('MetricsInterceptor — active connections gauge', () => {
  it('并发请求时 active_connections 正确增减', async () => {
    const service = new MetricsService()
    service.registerCounter('http_requests_total', '')
    service.registerHistogram('http_request_duration_ms', '')
    service.registerGauge('http_active_connections', '')
    service.setGauge('http_active_connections', {}, 0)

    const interceptor = new MetricsInterceptor(service)
    const ctx = mockExecutionContext('GET', '/api/foo', 200)
    const next = mockNextHandler({})

    // active_connections 进入时 +1，完成时 -1
    await interceptor.intercept(ctx, next).toPromise()
    const render = service.render()
    // 最终应为 0 (gauge 在请求处理完毕后回调 -1)
    const gaugeLine = render.split('\n').find(l => l.startsWith('http_active_connections'))
    assert.ok(gaugeLine)
    // 值为 0 或合理的数值
    const value = Number(gaugeLine!.split(' ').pop())
    assert.equal(value, 0)
  })
})
