import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common'
import {
  ChaosExperimentService,
  FaultInjectionService,
  ChaosAutoRollbackService,
} from './chaos-engineering.service'
import {
  CreateExperimentDto,
  UpdateExperimentDto,
  InjectFaultDto,
  HealthMetricDto,
} from './chaos-engineering.dto'
import type {
  ChaosExperiment,
  FaultInjection,
  RollbackHistoryEntry,
  HealthStatus,
  SystemMetrics,
} from './chaos-engineering.entity'

@Controller('chaos')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class ChaosEngineeringController {
  constructor(
    private readonly experimentService: ChaosExperimentService,
    private readonly faultService: FaultInjectionService,
    private readonly rollbackService: ChaosAutoRollbackService,
  ) {}

  // ─── 实验管理 ─────────────────────────────────────────────────

  /** POST /chaos/experiments — 创建混沌实验 */
  @Post('experiments')
  createExperiment(@Body() dto: CreateExperimentDto): ChaosExperiment {
    return this.experimentService.createExperiment(
      dto.name,
      dto.target,
      { type: dto.faultType, target: dto.faultTarget, params: dto.faultParams },
    )
  }

  /** GET /chaos/experiments — 获取所有实验 */
  @Get('experiments')
  listExperiments(): ChaosExperiment[] {
    return this.experimentService.listExperiments()
  }

  /** GET /chaos/experiments/:id — 获取实验详情 */
  @Get('experiments/:id')
  getExperiment(@Param('id') id: string): ChaosExperiment {
    const experiment = this.experimentService.getExperiment(id)
    if (!experiment) throw new NotFoundException(`Experiment ${id} not found`)
    return experiment
  }

  // ─── 实验控制 ─────────────────────────────────────────────────

  /** POST /chaos/experiments/:id/run — 运行实验 */
  @Post('experiments/:id/run')
  async runExperiment(@Param('id') id: string): Promise<ChaosExperiment> {
    const result = await this.experimentService.runExperiment(id)
    if (!result) throw new NotFoundException(`Experiment ${id} not found`)
    return result
  }

  /** POST /chaos/experiments/:id/pause — 暂停实验 */
  @Post('experiments/:id/pause')
  async pauseExperiment(@Param('id') id: string): Promise<ChaosExperiment> {
    const result = await this.experimentService.pauseExperiment(id)
    if (!result) throw new NotFoundException(`Experiment ${id} not found`)
    return result
  }

  /** GET /chaos/experiments/:id/result — 获取实验结果 */
  @Get('experiments/:id/result')
  getExperimentResult(@Param('id') id: string): { result: unknown } {
    const result = this.experimentService.getExperimentResult(id)
    if (!result) throw new NotFoundException(`Experiment ${id} has no results`)
    return { result }
  }

  // ─── 故障注入 ─────────────────────────────────────────────────

  /** POST /chaos/faults/latency — 注入延迟故障 */
  @Post('faults/latency')
  injectLatency(@Body() dto: InjectFaultDto): FaultInjection {
    return this.faultService.injectLatency(dto.target, dto.paramValue)
  }

  /** POST /chaos/faults/error — 注入错误故障 */
  @Post('faults/error')
  injectError(@Body() dto: InjectFaultDto): FaultInjection {
    return this.faultService.injectError(dto.target, dto.paramValue)
  }

  /** POST /chaos/faults/timeout — 注入超时故障 */
  @Post('faults/timeout')
  injectTimeout(@Body() dto: InjectFaultDto): FaultInjection {
    return this.faultService.injectTimeout(dto.target, dto.paramValue)
  }

  /** POST /chaos/faults/cpu-burn — 注入 CPU 燃烧故障 */
  @Post('faults/cpu-burn')
  injectCPUBurn(@Body() dto: InjectFaultDto): FaultInjection {
    return this.faultService.injectCPUBurn(dto.target, dto.paramValue)
  }

  /** DELETE /chaos/faults/:target — 停止故障注入 */
  @Post('faults/:target/stop')
  stopFault(@Param('target') target: string): { stopped: boolean } {
    const stopped = this.faultService.stopInjection(target)
    if (!stopped) throw new NotFoundException(`No active fault for target ${target}`)
    return { stopped }
  }

  /** GET /chaos/faults — 获取所有活跃故障 */
  @Get('faults')
  getActiveFaults(): FaultInjection[] {
    return this.faultService.getAllActiveFaults()
  }

  // ─── 健康监控 ─────────────────────────────────────────────────

  /** POST /chaos/health/monitor — 监控实验健康状态 */
  @Post('health/monitor')
  monitorHealth(
    @Query('experimentId') experimentId: string,
    @Body() dto: HealthMetricDto,
  ): HealthStatus {
    const metrics: SystemMetrics = {
      cpuUsage: dto.cpuUsage,
      memoryUsage: dto.memoryUsage,
      errorRate: dto.errorRate,
      latencyAvg: dto.latencyAvg,
      healthy: dto.healthy ?? (dto.cpuUsage < 90 && dto.memoryUsage < 90 && dto.errorRate < 0.1),
    }
    const result = this.rollbackService.monitorExperiment(experimentId, metrics)
    return {
      experimentId,
      ...result,
      cpuUsage: dto.cpuUsage,
      memoryUsage: dto.memoryUsage,
      errorRate: dto.errorRate,
      latencyAvg: dto.latencyAvg,
    }
  }

  /** POST /chaos/health/rollback — 触发自动回滚 */
  @Post('health/rollback')
  async triggerRollback(
    @Query('experimentId') experimentId: string,
    @Body('reason') reason: string,
  ): Promise<{ rollback?: RollbackHistoryEntry; triggered: boolean }> {
    const rollback = await this.rollbackService.triggerRollbackIfNeeded(experimentId, reason ?? 'Manual rollback')
    if (!rollback) {
      return { triggered: false }
    }
    return { rollback, triggered: true }
  }

  // ─── 回滚历史 ─────────────────────────────────────────────────

  /** GET /chaos/rollbacks — 获取回滚历史 */
  @Get('rollbacks')
  getRollbackHistory(): RollbackHistoryEntry[] {
    return this.rollbackService.getRollbackHistory()
  }

  /** GET /chaos/rollbacks/:experimentId — 获取指定实验回滚历史 */
  @Get('rollbacks/:experimentId')
  getExperimentRollbackHistory(@Param('experimentId') experimentId: string): RollbackHistoryEntry[] {
    return this.rollbackService.getRollbackHistoryForExperiment(experimentId)
  }
}
