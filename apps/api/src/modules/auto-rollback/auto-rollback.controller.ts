// auto-rollback.controller.ts - Phase-19 T27
// 用途: 自动回滚控制器 - POST /auto-rollback/trigger, /confirm, /cancel, /configure, GET /status, /records
import { Controller, Post, Get, Body, Query, Param, UsePipes, ValidationPipe, UseGuards } from '@nestjs/common'
import { AutoRollbackService } from './auto-rollback.service'
import type { RollbackStatus, RollbackSeverity, SnapshotKind } from './auto-rollback.entity'
import {
  TriggerRollbackRequestDto,
  ConfirmRollbackRequestDto,
  CancelRollbackRequestDto,
  ListRecordsQueryDto,
  ConfigureRequestDto,
  toRollbackRecordDto,
  toSnapshotDto,
  toEngineStatusDto,
} from './auto-rollback.dto'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('auto-rollback')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class AutoRollbackController {
  constructor(private readonly autoRollbackService: AutoRollbackService) {}

  @Post('trigger')
  trigger(@Body() body: TriggerRollbackRequestDto): { data: ReturnType<typeof toRollbackRecordDto> } {
    const record = this.autoRollbackService.trigger({
      reason: body.reason,
      severity: body.severity as RollbackSeverity,
      metricKey: body.metricKey,
      anomalyValue: body.anomalyValue,
      baselineValue: body.baselineValue,
      snapshotKind: body.snapshotKind as SnapshotKind | undefined,
      trigger: body.trigger,
    })
    return { data: toRollbackRecordDto(record) }
  }

  @Post('confirm')
  confirm(@Body() body: ConfirmRollbackRequestDto): { data: ReturnType<typeof toRollbackRecordDto> | null } {
    const record = this.autoRollbackService.confirm(body.id)
    if (!record) return { data: null }
    return { data: toRollbackRecordDto(record) }
  }

  @Post('cancel')
  cancel(@Body() body: CancelRollbackRequestDto): { data: ReturnType<typeof toRollbackRecordDto> | null } {
    const record = this.autoRollbackService.cancel(body.id, body.reason)
    if (!record) return { data: null }
    return { data: toRollbackRecordDto(record) }
  }

  @Get('records')
  listRecords(@Query() query: ListRecordsQueryDto): { data: ReturnType<typeof toRollbackRecordDto>[] } {
    const records = this.autoRollbackService.listRecords({
      ...(query.status ? { status: query.status as RollbackStatus } : {}),
      ...(query.metricKey ? { metricKey: query.metricKey } : {}),
    })
    return { data: records.map(toRollbackRecordDto) }
  }

  @Get('records/:id')
  getRecord(@Param('id') id: string): { data: ReturnType<typeof toRollbackRecordDto> | null } {
    const record = this.autoRollbackService.getRecord(id)
    if (!record) return { data: null }
    return { data: toRollbackRecordDto(record) }
  }

  @Get('snapshots/:id')
  getSnapshot(@Param('id') id: string): { data: ReturnType<typeof toSnapshotDto> | null } {
    const snapshot = this.autoRollbackService.getSnapshot(id)
    if (!snapshot) return { data: null }
    return { data: toSnapshotDto(snapshot) }
  }

  @Post('configure')
  configure(@Body() body: ConfigureRequestDto): { status: string; applied: string[] } {
    this.autoRollbackService.configure({
      criticalRequiresConfirm: body.criticalRequiresConfirm,
      confirmationDelayMs: body.confirmationDelayMs,
      autoTimeoutMs: body.autoTimeoutMs,
      maxConcurrent: body.maxConcurrent,
      snapshotRetentionMs: body.snapshotRetentionMs,
    })
    return {
      status: 'ok',
      applied: Object.keys(body).filter(
        (k) => body[k as keyof ConfigureRequestDto] !== undefined,
      ),
    }
  }

  @Get('status')
  getStatus(): { data: { engineName: string; activeRecords: number; config: unknown; status: 'ACTIVE' | 'DEGRADED' | 'STOPPED'; lastEvaluationAt: string } } {
    const records = this.autoRollbackService.listRecords()
    const activeCount = records.filter(
      (r) => !['COMPLETED', 'FAILED', 'CANCELLED'].includes(r.status),
    ).length
    return {
      data: {
        engineName: 'AutoRollback',
        activeRecords: activeCount,
        config: {
          criticalRequiresConfirm: true,
          maxConcurrent: 3,
        },
        status: 'ACTIVE',
        lastEvaluationAt: new Date().toISOString(),
      },
    }
  }
}
