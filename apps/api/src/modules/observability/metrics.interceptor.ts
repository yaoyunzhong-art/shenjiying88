import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { Observable, tap } from 'rxjs'
import type { Request, Response } from 'express'
import { MetricsService } from './metrics.service'

/**
 * HTTP 请求 metrics 拦截器:
 *   - http_requests_total{method, path, status}
 *   - http_request_duration_ms{method, path}
 *   - http_active_connections (gauge)
 *   - http_exceptions_total{method, path, kind} (出异常时)
 *   - process_uptime_seconds (启动时记录基线)
 *
 * 通过 NestJS 全局注册生效 (useGlobalInterceptors)。
 */
@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  private readonly startTime = Date.now()

  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') return next.handle()

    const http = context.switchToHttp()
    const req = http.getRequest<Request>()
    const res = http.getResponse<Response>()
    const start = process.hrtime.bigint()
    const method = req.method
    // Express 路由路径 (e.g. /metrics) — 避免被 query string 污染
    const path = req.route?.path ?? req.path ?? 'unknown'

    // 增加 active connections (gauge)
    this.incActive(1)
    // 设置 uptime
    this.metricsService.setGauge('process_uptime_seconds', {}, Math.floor((Date.now() - this.startTime) / 1000))

    return next.handle().pipe(
      tap({
        next: () => {
          const durationMs = Number(process.hrtime.bigint() - start) / 1e6
          const status = res.statusCode
          this.metricsService.incrementCounter('http_requests_total', { method, path, status })
          this.metricsService.observeHistogram('http_request_duration_ms', durationMs, { method, path })
          this.incActive(-1)
        },
        error: (err: any) => {
          const durationMs = Number(process.hrtime.bigint() - start) / 1e6
          const status = err?.status ?? 500
          const kind = err?.name ?? 'Error'
          this.metricsService.incrementCounter('http_requests_total', { method, path, status })
          this.metricsService.observeHistogram('http_request_duration_ms', durationMs, { method, path })
          this.metricsService.incrementCounter('http_exceptions_total', { method, path, kind })
          this.incActive(-1)
        }
      })
    )
  }

  private incActive(delta: number) {
    const current = this.getGauge('http_active_connections')
    this.metricsService.setGauge('http_active_connections', {}, current + delta)
  }

  private getGauge(name: string): number {
    // 内部读取 (避免抛错)
    const render = this.metricsService.render()
    const line = render.split('\n').find((l) => l.startsWith(`${name} `) || l.startsWith(`${name}{`))
    if (!line) return 0
    const lastSpace = line.lastIndexOf(' ')
    return Number(line.slice(lastSpace + 1).trim()) || 0
  }
}