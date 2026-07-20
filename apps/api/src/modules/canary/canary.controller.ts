import { Controller, Get, Post, Body, Param, BadRequestException, UseGuards } from '@nestjs/common'
import { CanaryService } from './canary.service'
import type { CanaryExperiment, CanaryEvaluationResponse } from './canary.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('canary')
@UseGuards(TenantGuard)
export class CanaryController {
  constructor(private readonly service: CanaryService) {}

  @Get('list')
  list(): { items: CanaryExperiment[]; total: number } {
    const items = this.service.listExperiments()
    return { items, total: items.length }
  }

  @Get(':id')
  get(@Param('id') id: string): CanaryExperiment {
    const e = this.service.getExperiment(id)
    if (!e) throw new BadRequestException(`Experiment ${id} not found`)
    return e
  }

  @Post('create')
  create(@Body() body: Omit<CanaryExperiment, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'currentPercentage'>): CanaryExperiment {
    return this.service.createExperiment(body)
  }

  @Post(':id/activate')
  activate(@Param('id') id: string, @Body() body: { operator: string }): CanaryExperiment {
    const e = this.service.activate(id, body.operator)
    if (!e) throw new BadRequestException(`Experiment ${id} not found`)
    return e
  }

  @Post(':id/pause')
  pause(@Param('id') id: string, @Body() body: { operator: string; reason?: string }): CanaryExperiment {
    const e = this.service.pause(id, body.operator, body.reason)
    if (!e) throw new BadRequestException(`Experiment ${id} not found`)
    return e
  }

  @Post(':id/promote')
  promote(@Param('id') id: string, @Body() body: { percentage: number; operator: string }): CanaryExperiment {
    const e = this.service.promote(id, body.percentage, body.operator)
    if (!e) throw new BadRequestException(`Experiment ${id} not found`)
    return e
  }

  @Post(':id/rollback')
  rollback(@Param('id') id: string, @Body() body: { operator: string; reason: string }): CanaryExperiment {
    const e = this.service.rollback(id, body.operator, body.reason)
    if (!e) throw new BadRequestException(`Experiment ${id} not found`)
    return e
  }

  @Post('evaluate')
  evaluate(@Body() body: { flagKey: string; tenantId: string; storeId?: string; tags?: string[] }): CanaryEvaluationResponse {
    return this.service.evaluate(body)
  }

  @Post(':id/health')
  recordHealth(@Param('id') id: string, @Body() body: { errorRate: number; latencyP95: number; latencyAvg: number; totalRequests: number }) {
    const snap = this.service.recordHealth({ experimentId: id, ...body })
    return snap
  }

  @Get(':id/health')
  getHealth(@Param('id') id: string): { latest: any; history: any[] } {
    return {
      latest: this.service.getLatestHealth(id),
      history: this.service.listHealth(id),
    }
  }

  @Get(':id/check-promote')
  checkPromote(@Param('id') id: string) {
    return this.service.checkAutoPromote(id)
  }

  @Get(':id/audit')
  auditLogs(@Param('id') id: string) {
    return { items: this.service.listAuditLogs(id), total: this.service.listAuditLogs(id).length }
  }
}
