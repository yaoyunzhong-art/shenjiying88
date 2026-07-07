// aiops-prediction.service.ts - Phase-19 T124-1
// 用途: AIOps 异常预测服务 — 时序异常检测 + 自愈
import { Injectable, Logger } from '@nestjs/common'

// ─── 类型定义 ───

export interface TimeSeriesPoint {
  timestamp: string
  value: number
}

export interface AnomalyResult {
  metricName: string
  isAnomaly: boolean
  anomalyScore: number
  anomalyType?: 'spike' | 'drop' | 'trend' | 'seasonal'
  detectedAt: string
  details?: string
}

export interface PredictionResult {
  metricName: string
  horizon: number
  predictedValues: number[]
  confidence: number
  predictedAt: string
}

export interface AttackDetectionResult {
  metricName: string
  isUnderAttack: boolean
  confidence: number
  attackType?: 'ddos' | 'brute_force' | 'data_exfil'
  evidence: string[]
  detectedAt: string
}

export interface SystemHealth {
  systemId: string
  status: 'healthy' | 'degraded' | 'critical' | 'unknown'
  lastCheck: string
  metrics: Record<string, number>
  issues: string[]
}

export interface HealingAction {
  id: string
  targetSystem: string
  action: 'restart' | 'rollback' | 'scale' | 'isolate'
  status: 'pending' | 'running' | 'completed' | 'failed'
  triggeredAt: string
  completedAt?: string
  result?: string
}

export interface HealingHistory {
  systemId: string
  actions: HealingAction[]
  lastHealingAt?: string
}

// ─── 时序异常检测器 ───

@Injectable()
export class TimeSeriesAnomalyDetector {
  private readonly logger = new Logger(TimeSeriesAnomalyDetector.name)
  private readonly dataStore: Map<string, TimeSeriesPoint[]> = new Map()
  private readonly ATTACK_WINDOW_MS = 60 * 1000 // 1分钟内

  // ── 数据管理 ──

  /**
   * 记录时序数据点
   */
  recordDataPoint(metricName: string, point: TimeSeriesPoint): void {
    const key = metricName
    if (!this.dataStore.has(key)) {
      this.dataStore.set(key, [])
    }
    this.dataStore.get(key)!.push(point)
    // 保留最近24小时数据
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    const points = this.dataStore.get(key)!
    const filtered = points.filter((p) => new Date(p.timestamp).getTime() > cutoff)
    this.dataStore.set(key, filtered)
  }

  /**
   * 批量记录数据点
   */
  recordBatch(metricName: string, points: TimeSeriesPoint[]): number {
    for (const point of points) {
      this.recordDataPoint(metricName, point)
    }
    return points.length
  }

  /**
   * 获取指定指标的数据
   */
  getData(metricName: string): TimeSeriesPoint[] {
    return this.dataStore.get(metricName) || []
  }

  // ── 异常检测 ──

  /**
   * 检测时序数据中的异常点
   * 使用Z-Score和移动平均结合的方法
   */
  detectAnomaly(metricName: string, dataPoints?: TimeSeriesPoint[]): AnomalyResult {
    const points = dataPoints || this.getData(metricName)
    const now = new Date().toISOString()

    if (points.length < 5) {
      return {
        metricName,
        isAnomaly: false,
        anomalyScore: 0,
        detectedAt: now,
        details: '数据点不足，无法进行异常检测',
      }
    }

    // 计算统计指标
    const values = points.map((p) => p.value)
    const mean = this.calculateMean(values)
    const std = this.calculateStd(values, mean)
    const latestValue = values[values.length - 1]
    const previousValues = values.slice(-5, -1)
    const prevMean = this.calculateMean(previousValues)

    // Z-Score异常检测
    const zScore = std > 0 ? Math.abs((latestValue - mean) / std) : 0
    const threshold = 2.5

    // 检测突增/突降
    const changeRate = prevMean > 0 ? Math.abs((latestValue - prevMean) / prevMean) : 0
    const isSpike = latestValue > mean + threshold * std || (changeRate > 0.8 && latestValue > mean)
    const isDrop = latestValue < mean - threshold * std || (changeRate > 0.8 && latestValue < mean)

    // 检测趋势异常
    const trendAnomaly = this.detectTrendAnomaly(values)

    let anomalyType: AnomalyResult['anomalyType'] | undefined
    if (isSpike) anomalyType = 'spike'
    else if (isDrop) anomalyType = 'drop'
    else if (trendAnomaly) anomalyType = 'trend'

    const isAnomaly = zScore > threshold || changeRate > 0.8 || trendAnomaly
    const anomalyScore = Math.min(1, zScore / (threshold * 2) + changeRate / 2)

    return {
      metricName,
      isAnomaly,
      anomalyScore,
      anomalyType,
      detectedAt: now,
      details: isAnomaly
        ? `检测到${anomalyType || '异常'}，Z-Score=${zScore.toFixed(2)}，变化率=${(changeRate * 100).toFixed(1)}%`
        : '未检测到异常',
    }
  }

  /**
   * 检测趋势异常
   */
  private detectTrendAnomaly(values: number[]): boolean {
    if (values.length < 10) return false

    // 计算最近窗口的斜率
    const windowSize = Math.min(10, Math.floor(values.length / 2))
    const recentWindow = values.slice(-windowSize)
    const olderWindow = values.slice(-windowSize * 2, -windowSize)

    if (olderWindow.length === 0) return false

    const recentTrend = this.calculateSlope(recentWindow)
    const olderTrend = this.calculateSlope(olderWindow)

    // 如果趋势变化超过300%，认为是异常
    const trendChange = Math.abs((recentTrend - olderTrend) / (Math.abs(olderTrend) + 0.001))
    return trendChange > 3
  }

  /**
   * 计算线性回归斜率
   */
  private calculateSlope(values: number[]): number {
    const n = values.length
    if (n < 2) return 0

    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
    for (let i = 0; i < n; i++) {
      sumX += i
      sumY += values[i]
      sumXY += i * values[i]
      sumX2 += i * i
    }

    const denominator = n * sumX2 - sumX * sumX
    if (Math.abs(denominator) < 0.001) return 0

    return (n * sumXY - sumX * sumY) / denominator
  }

  // ── 预测 ──

  /**
   * 预测未来N个时间点的值（基于指数平滑）
   */
  predictNext(metricName: string, horizon: number = 5): PredictionResult {
    const points = this.getData(metricName)
    const now = new Date().toISOString()

    if (points.length < 3) {
      return {
        metricName,
        horizon,
        predictedValues: Array(horizon).fill(0),
        confidence: 0,
        predictedAt: now,
      }
    }

    const values = points.map((p) => p.value)
    const alpha = 0.3 // 指数平滑系数

    // 简单指数平滑预测
    let lastSmoothed = values[0]
    for (let i = 1; i < values.length; i++) {
      lastSmoothed = alpha * values[i] + (1 - alpha) * lastSmoothed
    }

    // 计算预测值
    const predictedValues: number[] = []
    for (let i = 0; i < horizon; i++) {
      // 添加一些随机波动模拟真实预测
      const noise = (Math.random() - 0.5) * 0.1 * lastSmoothed
      predictedValues.push(Math.max(0, lastSmoothed + noise))
    }

    // 计算置信度：基于数据量和波动性
    const variance = this.calculateVariance(values)
    const avgValue = this.calculateMean(values)
    const cv = avgValue > 0 ? Math.sqrt(variance) / avgValue : 1
    const confidence = Math.max(0, Math.min(1, 1 - cv)) * Math.min(1, values.length / 50)

    return {
      metricName,
      horizon,
      predictedValues,
      confidence: Math.round(confidence * 100) / 100,
      predictedAt: now,
    }
  }

  // ── 攻击检测 ──

  /**
   * 判断是否正在遭受攻击（异常模式识别）
   */
  isUnderAttack(metricName: string): AttackDetectionResult {
    const points = this.getData(metricName)
    const now = new Date()
    const nowISO = now.toISOString()

    if (points.length < 10) {
      return {
        metricName,
        isUnderAttack: false,
        confidence: 0,
        evidence: ['数据不足'],
        detectedAt: nowISO,
      }
    }

    const evidence: string[] = []
    let confidence = 0
    let attackType: AttackDetectionResult['attackType'] | undefined

    // 1. 检测请求量突增（可能的DDoS）
    const recentWindow = this.getRecentPoints(points, this.ATTACK_WINDOW_MS)
    const olderWindow = this.getOlderPoints(points, this.ATTACK_WINDOW_MS, 5)

    if (recentWindow.length > 0 && olderWindow.length > 0) {
      const recentAvg = this.calculateMean(recentWindow.map((p) => p.value))
      const olderAvg = this.calculateMean(olderWindow.map((p) => p.value))

      if (olderAvg > 0) {
        const increaseRate = (recentAvg - olderAvg) / olderAvg
        if (increaseRate > 2) {
          evidence.push(`请求量突增${(increaseRate * 100).toFixed(0)}%`)
          confidence = Math.max(confidence, Math.min(1, increaseRate / 5))
          attackType = 'ddos'
        }
      }
    }

    // 2. 检测异常高频率请求
    if (recentWindow.length > 50) {
      evidence.push(`高频请求：${recentWindow.length}次/分钟`)
      confidence = Math.max(confidence, Math.min(1, recentWindow.length / 200))
      attackType = attackType || 'ddos'
    }

    // 3. 检测值域异常（可能的数据泄露）
    const values = points.map((p) => p.value)
    const mean = this.calculateMean(values)
    const std = this.calculateStd(values, mean)

    if (std > 0) {
      const latestZScore = Math.abs((values[values.length - 1] - mean) / std)
      if (latestZScore > 3) {
        evidence.push(`异常值检测，Z-Score=${latestZScore.toFixed(2)}`)
        confidence = Math.max(confidence, 0.7)
        attackType = attackType || 'data_exfil'
      }
    }

    // 4. 检测周期性破坏（暴力破解）
    const pattern = this.detectPeriodicPattern(values)
    if (pattern.isPeriodic && pattern.frequency > 10) {
      evidence.push(`高频率周期性请求：${pattern.frequency}次/周期`)
      confidence = Math.max(confidence, 0.6)
      attackType = attackType || 'brute_force'
    }

    const isUnderAttack = confidence > 0.5

    return {
      metricName,
      isUnderAttack,
      confidence: Math.round(confidence * 100) / 100,
      attackType: isUnderAttack ? attackType : undefined,
      evidence,
      detectedAt: nowISO,
    }
  }

  private getRecentPoints(points: TimeSeriesPoint[], windowMs: number): TimeSeriesPoint[] {
    const cutoff = Date.now() - windowMs
    return points.filter((p) => new Date(p.timestamp).getTime() > cutoff)
  }

  private getOlderPoints(points: TimeSeriesPoint[], windowMs: number, multiplier: number): TimeSeriesPoint[] {
    const now = Date.now()
    const start = now - windowMs * (multiplier + 1)
    const end = now - windowMs
    return points.filter((p) => {
      const t = new Date(p.timestamp).getTime()
      return t >= start && t <= end
    })
  }

  private detectPeriodicPattern(values: number[]): { isPeriodic: boolean; frequency: number } {
    if (values.length < 20) return { isPeriodic: false, frequency: 0 }

    // 简化的周期检测：检查相邻差异的重复性
    const diffs: number[] = []
    for (let i = 1; i < values.length; i++) {
      diffs.push(values[i] - values[i - 1])
    }

    // 计算差异的变化率
    const diffVariance = this.calculateVariance(diffs)
    const diffMean = Math.abs(this.calculateMean(diffs))
    const cv = diffMean > 0 ? diffVariance / (diffMean * diffMean) : 1

    // 如果变化率低，说明有重复模式
    return {
      isPeriodic: cv < 0.1 && diffMean > 0,
      frequency: cv < 0.1 ? Math.round(1 / cv) : 0,
    }
  }

  // ── 统计工具 ──

  private calculateMean(values: number[]): number {
    if (values.length === 0) return 0
    return values.reduce((a, b) => a + b, 0) / values.length
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0
    const mean = this.calculateMean(values)
    return values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
  }

  private calculateStd(values: number[], mean: number): number {
    return Math.sqrt(this.calculateVariance(values))
  }

  /**
   * 清除所有数据（测试用）
   */
  resetForTests(): void {
    this.dataStore.clear()
  }
}

// ─── 自愈服务 ───

@Injectable()
export class SelfHealingService {
  private readonly logger = new Logger(SelfHealingService.name)
  private readonly healthRecords: Map<string, SystemHealth> = new Map()
  private readonly healingHistory: Map<string, HealingHistory> = new Map()
  private readonly MAX_HISTORY = 100

  constructor(private readonly anomalyDetector: TimeSeriesAnomalyDetector) {}

  // ── 健康检查 ──

  /**
   * 检查系统健康状态
   */
  checkHealth(targetSystem: string): SystemHealth {
    const existing = this.healthRecords.get(targetSystem)
    const now = new Date().toISOString()

    // 如果有最近的健康记录且在1分钟内，直接返回
    if (existing && existing.lastCheck) {
      const lastCheckTime = new Date(existing.lastCheck).getTime()
      if (Date.now() - lastCheckTime < 60 * 1000) {
        return existing
      }
    }

    // 模拟健康检查
    const health = this.performHealthCheck(targetSystem)
    this.healthRecords.set(targetSystem, health)

    return health
  }

  private performHealthCheck(targetSystem: string): SystemHealth {
    const issues: string[] = []
    const metrics: Record<string, number> = {}

    // 模拟CPU检查
    const cpuUsage = Math.random() * 100
    metrics['cpu_usage'] = Math.round(cpuUsage * 100) / 100
    if (cpuUsage > 90) issues.push('CPU使用率过高')

    // 模拟内存检查
    const memUsage = Math.random() * 100
    metrics['memory_usage'] = Math.round(memUsage * 100) / 100
    if (memUsage > 85) issues.push('内存使用率过高')

    // 模拟响应时间
    const responseTime = Math.random() * 1000
    metrics['response_time_ms'] = Math.round(responseTime)
    if (responseTime > 500) issues.push('响应时间过长')

    // 模拟错误率
    const errorRate = Math.random() * 10
    metrics['error_rate'] = Math.round(errorRate * 100) / 100
    if (errorRate > 5) issues.push('错误率过高')

    let status: SystemHealth['status'] = 'healthy'
    if (issues.length >= 3 || cpuUsage > 95 || errorRate > 8) {
      status = 'critical'
    } else if (issues.length >= 1 || cpuUsage > 80 || errorRate > 3) {
      status = 'degraded'
    }

    return {
      systemId: targetSystem,
      status,
      lastCheck: new Date().toISOString(),
      metrics,
      issues,
    }
  }

  // ── 自愈触发 ──

  /**
   * 触发自愈流程
   */
  async triggerHealing(targetSystem: string): Promise<HealingAction> {
    const action: HealingAction = {
      id: `heal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      targetSystem,
      action: 'restart',
      status: 'pending',
      triggeredAt: new Date().toISOString(),
    }

    this.logger.log(`触发自愈流程: ${targetSystem}, 动作ID: ${action.id}`)

    // 更新状态为运行中
    action.status = 'running'

    try {
      // 模拟自愈操作
      const healthBefore = this.checkHealth(targetSystem)

      // 根据问题类型选择自愈动作
      if (healthBefore.metrics['cpu_usage'] > 90) {
        action.action = 'scale'
        await this.simulateScaling(targetSystem)
      } else if (healthBefore.issues.some((i) => i.includes('错误率'))) {
        action.action = 'rollback'
        await this.simulateRollback(targetSystem)
      } else {
        action.action = 'restart'
        await this.simulateRestart(targetSystem)
      }

      // 等待自愈完成
      await this.delay(500)

      // 检查自愈结果
      const healthAfter = this.checkHealth(targetSystem)
      if (healthAfter.status === 'healthy' || healthAfter.status === 'degraded') {
        action.status = 'completed'
        action.result = `自愈成功，系统状态: ${healthAfter.status}`
        this.logger.log(`自愈成功: ${targetSystem}`)
      } else {
        action.status = 'failed'
        action.result = `自愈失败，系统仍处于: ${healthAfter.status}`
        this.logger.warn(`自愈失败: ${targetSystem}, ${action.result}`)
      }
    } catch (error) {
      action.status = 'failed'
      action.result = `自愈异常: ${error}`
      this.logger.error(`自愈异常: ${targetSystem}`, error)
    }

    action.completedAt = new Date().toISOString()
    this.recordHealingAction(targetSystem, action)

    return action
  }

  private async simulateScaling(targetSystem: string): Promise<void> {
    this.logger.log(`执行扩容: ${targetSystem}`)
    await this.delay(200)
  }

  private async simulateRollback(targetSystem: string): Promise<void> {
    this.logger.log(`执行回滚: ${targetSystem}`)
    await this.delay(300)
  }

  private async simulateRestart(targetSystem: string): Promise<void> {
    this.logger.log(`执行重启: ${targetSystem}`)
    await this.delay(250)
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  // ── 回滚 ──

  /**
   * 回滚到上一个健康版本
   */
  async rollback(targetSystem: string): Promise<{ success: boolean; version?: string; message: string }> {
    this.logger.log(`开始回滚: ${targetSystem}`)

    // 模拟回滚操作
    await this.delay(300)

    const version = `v${Date.now() - 86400000}`
    return {
      success: true,
      version,
      message: `成功回滚到版本 ${version}`,
    }
  }

  // ── 历史记录 ──

  /**
   * 记录自愈动作
   */
  private recordHealingAction(targetSystem: string, action: HealingAction): void {
    if (!this.healingHistory.has(targetSystem)) {
      this.healingHistory.set(targetSystem, {
        systemId: targetSystem,
        actions: [],
      })
    }

    const history = this.healingHistory.get(targetSystem)!
    history.actions.push(action)

    // 保持历史记录在限制内
    if (history.actions.length > this.MAX_HISTORY) {
      history.actions = history.actions.slice(-this.MAX_HISTORY)
    }

    history.lastHealingAt = action.completedAt || action.triggeredAt
  }

  /**
   * 获取自愈历史
   */
  getHealingHistory(targetSystem: string): HealingHistory {
    return (
      this.healingHistory.get(targetSystem) || {
        systemId: targetSystem,
        actions: [],
      }
    )
  }

  /**
   * 获取所有系统的最新自愈状态
   */
  getAllSystemHealth(): SystemHealth[] {
    return Array.from(this.healthRecords.values())
  }

  /**
   * 清除所有记录（测试用）
   */
  resetForTests(): void {
    this.healthRecords.clear()
    this.healingHistory.clear()
  }
}

// ─── AIOps预测服务（组合） ───

@Injectable()
export class AIOpsPredictionService {
  private readonly logger = new Logger(AIOpsPredictionService.name)

  constructor(
    private readonly anomalyDetector: TimeSeriesAnomalyDetector,
    private readonly selfHealingService: SelfHealingService,
  ) {}

  /**
   * 获取异常检测器实例
   */
  getAnomalyDetector(): TimeSeriesAnomalyDetector {
    return this.anomalyDetector
  }

  /**
   * 获取自愈服务实例
   */
  getSelfHealingService(): SelfHealingService {
    return this.selfHealingService
  }

  /**
   * 一站式异常检测与自愈
   */
  async detectAndHeal(metricName: string, targetSystem: string): Promise<{
    anomaly: AnomalyResult
    attack: AttackDetectionResult
    healing?: HealingAction
  }> {
    const anomaly = this.anomalyDetector.detectAnomaly(metricName)
    const attack = this.anomalyDetector.isUnderAttack(metricName)

    let healing: HealingAction | undefined

    // 如果检测到攻击或异常，自动触发自愈
    if (attack.isUnderAttack || (anomaly.isAnomaly && anomaly.anomalyScore > 0.7)) {
      this.logger.warn(`检测到需要自愈的情况: ${targetSystem}`)
      healing = await this.selfHealingService.triggerHealing(targetSystem)
    }

    return { anomaly, attack, healing }
  }
}
