// aiops.controller.ts - 自动补全
// 用途: AIOps 控制器 - POST /aiops/detect /predict /attack /heal + GET /status
import { Controller, Post, Get, Body, UsePipes, ValidationPipe } from '@nestjs/common'
import { AIOpsPredictionService, TimeSeriesAnomalyDetector, SelfHealingService } from './aiops-prediction.service'
import {
  AnomalyDetectRequestDto,
  PredictRequestDto,
  AttackDetectRequestDto,
  HealRequestDto,
  AnomalyDetectResultDto,
  PredictResultDto,
  AttackDetectResultDto,
  HealingActionResultDto,
  AIOpsEngineStatusDto,
} from './aiops.dto'
import type {
  AnomalyDetectInput,
  AnomalyDetectResult,
  PredictInput,
  PredictResult,
  AttackDetectInput,
  AttackDetectResult,
  HealInput,
  HealingActionResult,
  AIOpsEngineStatus,
} from './aiops.entity'

@Controller('aiops')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AIOpsController {
  constructor(
    private readonly aiopsService: AIOpsPredictionService,
    private readonly anomalyDetector: TimeSeriesAnomalyDetector,
    private readonly selfHealingService: SelfHealingService,
  ) {}

  @Post('detect')
  async detect(@Body() body: AnomalyDetectRequestDto): Promise<{ data: AnomalyDetectResultDto }> {
    // 先注入数据
    for (const point of body.history) {
      this.anomalyDetector.recordDataPoint(body.metricName, point)
    }
    // 再注入当前值
    this.anomalyDetector.recordDataPoint(body.metricName, {
      timestamp: body.timestamp || new Date().toISOString(),
      value: body.value,
    })

    const result = this.anomalyDetector.detectAnomaly(body.metricName)
    return { data: this.toResultDto(result) }
  }

  @Post('predict')
  predict(@Body() body: PredictRequestDto): { data: PredictResultDto } {
    const result = this.anomalyDetector.predictNext(body.metricName, body.horizon)
    return {
      data: {
        metricName: result.metricName,
        horizon: result.horizon,
        predictedValues: result.predictedValues,
        confidence: result.confidence,
        predictedAt: result.predictedAt,
      },
    }
  }

  @Post('attack')
  detectAttack(@Body() body: AttackDetectRequestDto): { data: AttackDetectResultDto } {
    const result = this.anomalyDetector.isUnderAttack(body.metricName)
    return {
      data: {
        metricName: result.metricName,
        isUnderAttack: result.isUnderAttack,
        confidence: result.confidence,
        attackType: result.attackType,
        evidence: result.evidence,
        detectedAt: result.detectedAt,
      },
    }
  }

  @Post('heal')
  async heal(@Body() body: HealRequestDto): Promise<{ data: HealingActionResultDto }> {
    const result = await this.selfHealingService.triggerHealing(body.targetSystem)
    return { data: this.toHealingDto(result) }
  }

  @Get('status')
  getStatus(): { data: AIOpsEngineStatusDto } {
    const healthSystems = this.selfHealingService.getAllSystemHealth()
    const healedCount = healthSystems.filter((h) => h.status !== 'critical').length

    return {
      data: {
        engineName: 'AIOpsPredictionService',
        anomalyRulesCount: 3,
        attackRulesCount: 4,
        healedSystemsCount: healedCount,
        status: 'ACTIVE',
        lastDetectedAt: new Date().toISOString(),
      },
    }
  }

  @Get('health')
  getHealth(): { data: { systemId: string; status: string }[] } {
    const allHealth = this.selfHealingService.getAllSystemHealth()
    return {
      data: allHealth.map((h) => ({
        systemId: h.systemId,
        status: h.status,
      })),
    }
  }

  private toResultDto(result: {
    metricName: string
    isAnomaly: boolean
    anomalyScore: number
    anomalyType?: 'spike' | 'drop' | 'trend' | 'seasonal'
    detectedAt: string
    details?: string
  }): AnomalyDetectResultDto {
    return {
      metricName: result.metricName,
      isAnomaly: result.isAnomaly,
      anomalyScore: result.anomalyScore,
      anomalyType: result.anomalyType,
      severity: result.isAnomaly
        ? result.anomalyScore > 0.8 ? 'CRITICAL' : result.anomalyScore > 0.5 ? 'WARNING' : 'NORMAL'
        : 'NORMAL',
      baseline: 0,
      deviation: 0,
      detectedAt: result.detectedAt,
      details: result.details,
    }
  }

  private toHealingDto(result: {
    id: string
    targetSystem: string
    action: 'restart' | 'rollback' | 'scale' | 'isolate'
    status: 'pending' | 'running' | 'completed' | 'failed'
    triggeredAt: string
    completedAt?: string
    result?: string
  }): HealingActionResultDto {
    return {
      id: result.id,
      targetSystem: result.targetSystem,
      action: result.action,
      status: result.status,
      triggeredAt: result.triggeredAt,
      completedAt: result.completedAt,
      result: result.result,
    }
  }
}
