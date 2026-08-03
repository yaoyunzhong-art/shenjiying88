// time-series.controller.ts - Phase-19 T27 auto
// 用途: 时序指标控制器 - POST /time-series/record, /query, /batch, /seasonality, GET /keys, /status
// 新增: 告警规则管理, 时序摘要, 跨窗口对比
import { Controller, Post, Get, Delete, Body, Param, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common'
import { TimeSeriesCollectorService } from './time-series-collector.service'
import { TimeSeriesService } from './time-series.service'
import {
  RecordMetricDto,
  QueryMetricDto,
  RecordBatchDto,
  SeasonalityQueryDto,
  TimeSeriesMetricDto,
  SeasonalityPatternDto,
  CollectorStatusDto,
  ListMetricKeysResponseDto,
  RegisterAlertRuleDto,
  CompareWindowsDto,
} from './time-series.dto'
import type {
  TimeSeriesMetricEntity,
  TimeSeriesCollectorStatus,
} from './time-series.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('time-series')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class TimeSeriesController {
  private readonly startedAt = Date.now()

  constructor(
    private readonly collector: TimeSeriesCollectorService,
    private readonly timeSeriesService: TimeSeriesService,
  ) {}

  @Post('record')
  record(@Body() body: RecordMetricDto): { status: string; metricName: string } {
    this.collector.recordMetric({
      metricName: body.metricName,
      tenantId: body.tenantId,
      value: body.value,
      timestamp: body.timestamp,
    })
    return { status: 'ok', metricName: body.metricName }
  }

  @Post('query')
  query(@Body() body: QueryMetricDto): { data: TimeSeriesMetricDto } {
    const result = this.collector.query({
      metricName: body.metricName,
      tenantId: body.tenantId,
      window: body.window,
    })
    return { data: this.toMetricDto(result) }
  }

  @Post('batch')
  recordBatch(@Body() body: RecordBatchDto): { status: string; count: number } {
    const samples = body.samples.map((s) => ({
      route: s.route,
      tenantId: s.tenantId,
      durationMs: s.durationMs,
      timestamp: s.timestamp ?? new Date().toISOString(),
      statusCode: s.statusCode ?? 200,
    }))
    const count = this.collector.recordBatch(samples)
    return { status: 'ok', count }
  }

  @Post('seasonality')
  seasonality(@Body() body: SeasonalityQueryDto): { data: SeasonalityPatternDto } {
    const pattern = this.collector.detectSeasonality({
      metricName: body.metricName,
      tenantId: body.tenantId,
    })
    return {
      data: {
        weekly: pattern.weekly,
        monthly: pattern.monthly,
        daily: pattern.daily,
      },
    }
  }

  @Get('keys')
  listKeys(): { data: ListMetricKeysResponseDto } {
    const keys = this.collector.listMetricKeys()
    return { data: { keys } }
  }

  @Get('status')
  getStatus(): { data: CollectorStatusDto } {
    const keys = this.collector.listMetricKeys()
    let totalPoints = 0
    // 从内部缓冲区估算总点数
    const status: TimeSeriesCollectorStatus = {
      collectorName: 'TimeSeriesCollector',
      buffersCount: keys.length,
      totalPoints,
      status: 'ACTIVE',
      uptimeMs: Date.now() - this.startedAt,
    }
    return { data: this.toStatusDto(status) }
  }

  // ── 告警规则管理 (TimeSeriesService) ──

  @Get('alert-rules')
  getAlertRules(): { data: import('./time-series.service').AlertRule[] } {
    return { data: this.timeSeriesService.listAlertRules() }
  }

  @Post('alert-rules')
  registerAlertRule(@Body() body: RegisterAlertRuleDto): { id: number; rule: import('./time-series.service').AlertRule } {
    return this.timeSeriesService.registerAlertRule({
      metricName: body.metricName,
      tenantId: body.tenantId,
      operator: body.operator,
      threshold: body.threshold,
      window: body.window,
      description: body.description,
    })
  }

  @Delete('alert-rules/:id')
  removeAlertRule(@Param('id') id: string): { removed: boolean } {
    const removed = this.timeSeriesService.removeAlertRule(Number(id))
    return { removed }
  }

  @Post('alerts/evaluate')
  evaluateAlerts(): { data: import('./time-series.service').AlertEvent[] } {
    const triggered = this.timeSeriesService.evaluateAllRules()
    return { data: triggered }
  }

  @Get('summary')
  getSummary(): { data: import('./time-series.service').TimeSeriesSummary } {
    return { data: this.timeSeriesService.getSummary() }
  }

  @Post('compare')
  compareWindows(@Body() body: CompareWindowsDto): { data: Array<{ window: string; avg: number; count: number; p95: number }> } {
    const results = this.timeSeriesService.compareWindows(body.metricName, body.tenantId)
    return { data: results }
  }

  // ── DTO mappers ──

  private toMetricDto(entity: TimeSeriesMetricEntity): TimeSeriesMetricDto {
    return {
      metricKey: entity.metricKey,
      tenantId: entity.tenantId,
      window: entity.window,
      points: entity.points.map((p) => ({ timestamp: p.timestamp, value: p.value })),
      aggregate: {
        min: entity.aggregate.min,
        max: entity.aggregate.max,
        avg: entity.aggregate.avg,
        p50: entity.aggregate.p50,
        p95: entity.aggregate.p95,
        p99: entity.aggregate.p99,
        count: entity.aggregate.count,
      },
      seasonality: entity.seasonality,
    }
  }

  private toStatusDto(entity: TimeSeriesCollectorStatus): CollectorStatusDto {
    return {
      collectorName: entity.collectorName,
      buffersCount: entity.buffersCount,
      totalPoints: entity.totalPoints,
      status: entity.status,
      uptimeMs: entity.uptimeMs,
    }
  }
}
