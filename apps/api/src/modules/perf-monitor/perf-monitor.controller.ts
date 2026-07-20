// perf-monitor.controller.ts - Phase-19 T27 auto
// 用途: 性能监控控制器 - GET/POST /perf-monitor
import { Controller, Get, Post, Body, Query, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common'
import { PerfMonitorService } from './perf-monitor.service'
import {
  RecordSampleDto,
  RegisterSlaDto,
  RouteStatsQueryDto,
  SlowQueriesQueryDto,
  ResetDto,
  PerfStatsDto,
  PerfSummaryDto,
  SlaViolationDto,
} from './perf-monitor.dto'
import type { PerfSample, SlaConfig, PerfStats, PerfSummary, SlaViolation } from './perf-monitor.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('perf-monitor')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class PerfMonitorController {
  constructor(private readonly perfMonitorService: PerfMonitorService) {}

  @Post('record')
  record(@Body() body: RecordSampleDto): { data: { accepted: boolean; total: number } } {
    const sample: PerfSample = {
      route: body.route,
      durationMs: body.durationMs,
      statusCode: body.statusCode,
      timestamp: body.timestamp ?? new Date().toISOString(),
      tenantId: body.tenantId,
    }
    this.perfMonitorService.record(sample)
    const summary = this.perfMonitorService.summary()
    return { data: { accepted: true, total: summary.totalSamples } }
  }

  @Post('sla')
  registerSla(@Body() body: RegisterSlaDto): { data: { route: string; registered: boolean } } {
    const config: SlaConfig = {
      route: body.route,
      targetP95Ms: body.targetP95Ms,
      warnThresholdP95Ms: body.warnThresholdP95Ms,
    }
    this.perfMonitorService.registerSla(config)
    return { data: { route: body.route, registered: true } }
  }

  @Get('stats')
  getStats(@Query() query: RouteStatsQueryDto): { data: PerfStatsDto } {
    const stats = this.perfMonitorService.getStatsForRoute(query.route)
    return { data: this.toStatsDto(stats) }
  }

  @Get('stats/all')
  getAllStats(): { data: PerfStatsDto[] } {
    const stats = this.perfMonitorService.getAllStats()
    return { data: stats.map(s => this.toStatsDto(s)) }
  }

  @Get('summary')
  getSummary(): { data: PerfSummaryDto } {
    const stats = this.perfMonitorService.getAllStats()
    const summary: PerfSummary = {
      totalSamples: stats.reduce((s, r) => s + r.count, 0),
      routes: stats.length,
      slowQueries: this.perfMonitorService.getSlowQueries(100).length,
      slaViolations: this.perfMonitorService.getSlaViolations().reduce((s, v) => s + v.violations, 0),
    }
    return { data: summary }
  }

  @Get('violations')
  getViolations(): { data: SlaViolationDto[] } {
    const violations = this.perfMonitorService.getSlaViolations()
    return { data: violations.map(v => ({ route: v.route, violations: v.violations, stats: this.toStatsDto(v.stats) })) }
  }

  @Get('slow-queries')
  getSlowQueries(@Query() query: SlowQueriesQueryDto): { data: { route: string; durationMs: number; timestamp: string }[] } {
    const limit = query.limit ?? 20
    const slow = this.perfMonitorService.getSlowQueries(limit)
    return { data: slow.map(s => ({ route: s.route, durationMs: s.durationMs, timestamp: s.timestamp })) }
  }

  @Post('reset')
  reset(@Body() _body: ResetDto): { data: { reset: boolean } } {
    this.perfMonitorService.reset()
    return { data: { reset: true } }
  }

  private toStatsDto(stats: PerfStats): PerfStatsDto {
    return { route: stats.route, p50: stats.p50, p95: stats.p95, p99: stats.p99, max: stats.max, count: stats.count, errorRate: stats.errorRate }
  }
}
