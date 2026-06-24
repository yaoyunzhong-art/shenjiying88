import { Controller, Get, Inject, Injectable, Res } from '@nestjs/common'
import type { Response } from 'express'
import { MetricsService } from './metrics.service'

@Injectable()
@Controller()
export class MetricsController {
  constructor(@Inject(MetricsService) private readonly metricsService: MetricsService) {}

  /**
   * Prometheus 抓取端点 (text/plain; version=0.0.4)
   * 暴露所有已注册的 Counter / Gauge / Histogram
   */
  @Get('metrics')
  async getMetrics(@Res() res: Response) {
    const body = this.metricsService.render()
    res.setHeader('Content-Type', 'text/plain; version=0.0.4; charset=utf-8')
    res.send(body)
  }

  /**
   * 健康检查端点 (轻量,不影响 metrics 收集)
   */
  @Get('healthz')
  getHealth() {
    return { status: 'ok', metrics: this.metricsService.listMetrics().length }
  }
}