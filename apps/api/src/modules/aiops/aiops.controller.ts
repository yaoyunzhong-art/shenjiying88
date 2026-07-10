// aiops.controller.ts - 自动补全
// 用途: AIOps 控制器 - POST /aiops/detect /predict /attack /heal + GET /status, /health
import { Controller, Post, Get, Body, UsePipes, ValidationPipe } from '@nestjs/common'
import { AIOpsService } from './aiops.service'
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

@Controller('aiops')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AIOpsController {
  constructor(
    private readonly aiopsService: AIOpsService,
    private readonly aiopsPredictionService: AIOpsPredictionService,
    private readonly anomalyDetector: TimeSeriesAnomalyDetector,
    private readonly selfHealingService: SelfHealingService,
  ) {}

  @Post('detect')
  async detect(@Body() body: AnomalyDetectRequestDto): Promise<{ data: AnomalyDetectResultDto }> {
    const result = await this.aiopsService.detectAnomaly({
      metricName: body.metricName,
      value: body.value,
      history: body.history.map((h) => ({ timestamp: h.timestamp, value: h.value })),
      timestamp: body.timestamp,
    })

    return {
      data: {
        metricName: result.metricName,
        isAnomaly: result.isAnomaly,
        anomalyScore: result.anomalyScore,
        anomalyType: result.anomalyType,
        severity: result.severity,
        baseline: result.baseline,
        deviation: result.deviation,
        detectedAt: result.detectedAt,
        details: result.details,
      },
    }
  }

  @Post('predict')
  predict(@Body() body: PredictRequestDto): { data: PredictResultDto } {
    const result = this.aiopsService.predict({ metricName: body.metricName, horizon: body.horizon })

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
    const result = this.aiopsService.detectAttack({ metricName: body.metricName })

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
    const result = await this.aiopsService.heal({ targetSystem: body.targetSystem })

    return {
      data: {
        id: result.id,
        targetSystem: result.targetSystem,
        action: result.action,
        status: result.status,
        triggeredAt: result.triggeredAt,
        completedAt: result.completedAt,
        result: result.result,
      },
    }
  }

  @Get('status')
  getStatus(): { data: AIOpsEngineStatusDto } {
    const status = this.aiopsService.getEngineStatus()

    return {
      data: {
        engineName: status.engineName,
        anomalyRulesCount: status.anomalyRulesCount,
        attackRulesCount: status.attackRulesCount,
        healedSystemsCount: status.healedSystemsCount,
        status: status.status,
        lastDetectedAt: status.lastDetectedAt,
      },
    }
  }

  @Get('health')
  getHealth(): { data: { systemId: string; status: string }[] } {
    const allHealth = this.aiopsService.getAllSystemHealth()

    return {
      data: allHealth.map((h) => ({
        systemId: h.systemId,
        status: h.status,
      })),
    }
  }
}
