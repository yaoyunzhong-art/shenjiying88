import { Controller, Get, Post, Body, Param, BadRequestException, Query } from '@nestjs/common'
import { MonitoringService } from './monitoring.service'
import type { MetricPoint, AlertRule, Alert, AlertSeverity } from './monitoring.entity'

@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly service: MonitoringService) {}

  @Get('metrics')
  listMetrics() {
    return { items: this.service.listMetricDefinitions(), total: this.service.listMetricDefinitions().length }
  }

  @Post('metrics/record')
  record(@Body() body: Omit<MetricPoint, 'timestamp'>) {
    return this.service.recordMetric(body)
  }

  @Post('metrics/record-batch')
  recordBatch(@Body() body: { points: Omit<MetricPoint, 'timestamp'>[] }) {
    return this.service.recordMetricsBatch(body.points)
  }

  @Get('metrics/:name')
  getMetric(@Param('name') name: string, @Query('limit') limit?: string) {
    return {
      name,
      definition: this.service.getMetricDefinition(name),
      points: this.service.queryMetric(name, limit ? parseInt(limit, 10) : 100),
      avg: this.service.getMetricAverage(name),
    }
  }

  @Get('rules')
  listRules() {
    return { items: this.service.listAlertRules(), total: this.service.listAlertRules().length }
  }

  @Post('rules/create')
  createRule(@Body() body: Omit<AlertRule, 'id' | 'createdAt' | 'updatedAt'>) {
    return this.service.createAlertRule(body)
  }

  @Post('rules/:id/update')
  updateRule(@Param('id') id: string, @Body() body: Partial<AlertRule>) {
    const r = this.service.updateAlertRule(id, body)
    if (!r) throw new BadRequestException(`Rule ${id} not found`)
    return r
  }

  @Get('alerts')
  listAlerts(@Query('status') status?: Alert['status']) {
    const items = this.service.listAlerts(status)
    return { items, total: items.length, severityCount: this.service.countBySeverity() }
  }

  @Post('alerts/:id/silence')
  silence(@Param('id') id: string, @Body() body: { durationSec: number; operator: string; reason?: string }) {
    const a = this.service.silenceAlert(id, body.durationSec, body.operator, body.reason)
    if (!a) throw new BadRequestException(`Alert ${id} not found`)
    return a
  }

  @Get('alerts/:id/audit')
  auditLogs(@Param('id') id: string) {
    return { items: this.service.listAudits(id), total: this.service.listAudits(id).length }
  }
}
