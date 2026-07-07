// anomaly-detector.controller.ts - Phase-19 T26
// 用途: 异常检测控制器 - POST /anomaly-detector/detect, /batch, /configure
import { Controller, Post, Get, Body, UsePipes, ValidationPipe } from '@nestjs/common'
import { AnomalyDetectorService } from './anomaly-detector.service'
import {
  AnomalyDetectRequestDto,
  AnomalyDetectBatchRequestDto,
  ConfigureRequestDto,
  AnomalyResultDto,
  EngineStatusDto,
} from './anomaly-detector.dto'
import type {
  AnomalyDetectInput,
  AnomalyDetectBatchInput,
  AnomalyResult,
  AnomalyEngineStatus,
} from './anomaly-detector.entity'

@Controller('anomaly-detector')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class AnomalyDetectorController {
  constructor(private readonly anomalyDetectorService: AnomalyDetectorService) {}

  @Post('detect')
  detect(@Body() body: AnomalyDetectRequestDto): { data: AnomalyResultDto } {
    const input: AnomalyDetectInput = {
      metricKey: body.metricKey,
      value: body.value,
      history: body.history,
      timestamp: body.timestamp,
    }
    const result = this.anomalyDetectorService.detect(input)
    return { data: this.toResultDto(result) }
  }

  @Post('detect/batch')
  detectBatch(@Body() body: AnomalyDetectBatchRequestDto): { data: AnomalyResultDto[] } {
    const input: AnomalyDetectBatchInput = {
      points: body.points,
      timestamp: body.timestamp,
    }
    const results = this.anomalyDetectorService.detectBatch(input)
    return { data: results.map((r) => this.toResultDto(r)) }
  }

  @Post('configure')
  configure(@Body() body: ConfigureRequestDto): { status: string; applied: string[] } {
    this.anomalyDetectorService.configure({
      whitelist: body.whitelist,
      sigmaThreshold: body.sigmaThreshold,
      ewmaAlpha: body.ewmaAlpha,
      criticalThreshold: body.criticalThreshold,
      warningThreshold: body.warningThreshold,
    })
    return { status: 'ok', applied: Object.keys(body).filter((k) => body[k as keyof ConfigureRequestDto] !== undefined) }
  }

  @Get('status')
  getStatus(): { data: AnomalyEngineStatus } {
    return {
      data: {
        engineName: 'AnomalyDetector',
        rulesCount: 3,
        status: 'ACTIVE',
        lastEvaluationAt: new Date().toISOString(),
      },
    }
  }

  private toResultDto(result: AnomalyResult): AnomalyResultDto {
    return {
      metricKey: result.metricKey,
      value: result.value,
      baseline: result.baseline,
      deviation: result.deviation,
      score: result.score,
      severity: result.severity,
      detectors: result.detectors,
      whitelisted: result.whitelisted,
      reason: result.reason,
      detectedAt: result.detectedAt,
    }
  }
}
