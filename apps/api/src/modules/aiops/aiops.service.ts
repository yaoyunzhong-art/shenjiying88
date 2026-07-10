// aiops.service.ts - 自动补全
// 用途: AIOps 主服务 — 业务编排层，组合异常检测、预测、自愈能力
import { Injectable, Logger } from '@nestjs/common'
import {
  AIOpsPredictionService,
  TimeSeriesAnomalyDetector,
  SelfHealingService,
  type AnomalyResult,
  type AttackDetectionResult,
  type HealingAction,
  type PredictionResult,
  type SystemHealth,
} from './aiops-prediction.service'

export interface AnomalyDetectInput {
  metricName: string
  value: number
  history: Array<{ timestamp: string; value: number }>
  timestamp?: string
}

export interface AnomalyDetectOutput {
  metricName: string
  isAnomaly: boolean
  anomalyScore: number
  anomalyType?: 'spike' | 'drop' | 'trend' | 'seasonal'
  severity: 'NORMAL' | 'WARNING' | 'CRITICAL'
  baseline: number
  deviation: number
  detectedAt: string
  details?: string
}

export interface PredictInput {
  metricName: string
  horizon: number
}

export interface PredictOutput {
  metricName: string
  horizon: number
  predictedValues: number[]
  confidence: number
  predictedAt: string
}

export interface AttackDetectInput {
  metricName: string
}

export interface AttackDetectOutput {
  metricName: string
  isUnderAttack: boolean
  confidence: number
  attackType?: 'ddos' | 'brute_force' | 'data_exfil'
  evidence: string[]
  detectedAt: string
}

export interface HealInput {
  targetSystem: string
}

export interface HealOutput {
  id: string
  targetSystem: string
  action: 'restart' | 'rollback' | 'scale' | 'isolate'
  status: 'pending' | 'running' | 'completed' | 'failed'
  triggeredAt: string
  completedAt?: string
  result?: string
}

export interface EngineStatus {
  engineName: string
  anomalyRulesCount: number
  attackRulesCount: number
  healedSystemsCount: number
  status: 'ACTIVE' | 'DEGRADED' | 'STOPPED'
  lastDetectedAt?: string
}

export interface SystemHealthStatus {
  systemId: string
  status: string
}

@Injectable()
export class AIOpsService {
  private readonly logger = new Logger(AIOpsService.name)

  constructor(
    private readonly predictionService: AIOpsPredictionService,
    private readonly anomalyDetector: TimeSeriesAnomalyDetector,
    private readonly selfHealingService: SelfHealingService,
  ) {}

  /**
   * 检测异常 - 注入历史数据并执行异常检测
   */
  async detectAnomaly(input: AnomalyDetectInput): Promise<AnomalyDetectOutput> {
    // 注入历史数据点
    for (const point of input.history) {
      this.anomalyDetector.recordDataPoint(input.metricName, point)
    }
    // 注入当前值
    this.anomalyDetector.recordDataPoint(input.metricName, {
      timestamp: input.timestamp || new Date().toISOString(),
      value: input.value,
    })

    const result = this.anomalyDetector.detectAnomaly(input.metricName)

    return {
      metricName: result.metricName,
      isAnomaly: result.isAnomaly,
      anomalyScore: result.anomalyScore,
      anomalyType: result.anomalyType,
      severity: result.isAnomaly
        ? result.anomalyScore > 0.8
          ? 'CRITICAL'
          : result.anomalyScore > 0.5
            ? 'WARNING'
            : 'NORMAL'
        : 'NORMAL',
      baseline: 0,
      deviation: 0,
      detectedAt: result.detectedAt,
      details: result.details,
    }
  }

  /**
   * 预测未来指标
   */
  predict(input: PredictInput): PredictOutput {
    const result = this.anomalyDetector.predictNext(input.metricName, input.horizon)

    return {
      metricName: result.metricName,
      horizon: result.horizon,
      predictedValues: result.predictedValues,
      confidence: result.confidence,
      predictedAt: result.predictedAt,
    }
  }

  /**
   * 攻击检测
   */
  detectAttack(input: AttackDetectInput): AttackDetectOutput {
    const result = this.anomalyDetector.isUnderAttack(input.metricName)

    return {
      metricName: result.metricName,
      isUnderAttack: result.isUnderAttack,
      confidence: result.confidence,
      attackType: result.attackType,
      evidence: result.evidence,
      detectedAt: result.detectedAt,
    }
  }

  /**
   * 触发自愈流程
   */
  async heal(input: HealInput): Promise<HealOutput> {
    const result = await this.selfHealingService.triggerHealing(input.targetSystem)

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

  /**
   * 一站式检测并自愈
   */
  async detectAndHeal(
    metricName: string,
    value: number,
    history: Array<{ timestamp: string; value: number }>,
    targetSystem: string,
  ): Promise<{
    anomaly: AnomalyDetectOutput
    attack: AttackDetectOutput
    healing?: HealOutput
  }> {
    const anomaly = await this.detectAnomaly({ metricName, value, history })
    const attack = this.detectAttack({ metricName })

    let healing: HealOutput | undefined
    if (attack.isUnderAttack || (anomaly.isAnomaly && anomaly.anomalyScore > 0.7)) {
      this.logger.warn(`检测到需要自愈: metric=${metricName}, system=${targetSystem}`)
      healing = await this.heal({ targetSystem })
    }

    return { anomaly, attack, healing }
  }

  /**
   * 获取引擎状态
   */
  getEngineStatus(): EngineStatus {
    const healthSystems = this.selfHealingService.getAllSystemHealth()
    const healedCount = healthSystems.filter((h) => h.status !== 'critical').length

    return {
      engineName: 'AIOpsPredictionService',
      anomalyRulesCount: 3,
      attackRulesCount: 4,
      healedSystemsCount: healedCount,
      status: 'ACTIVE',
      lastDetectedAt: new Date().toISOString(),
    }
  }

  /**
   * 获取所有系统健康状态
   */
  getAllSystemHealth(): SystemHealthStatus[] {
    return this.selfHealingService.getAllSystemHealth().map((h) => ({
      systemId: h.systemId,
      status: h.status,
    }))
  }

  /**
   * 清除数据（测试用）
   */
  resetForTests(): void {
    this.anomalyDetector.resetForTests()
    this.selfHealingService.resetForTests()
  }
}
