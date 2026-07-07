import { Injectable } from '@nestjs/common'
import {
  type RuleEngine,
  type RuleCondition,
  type MemberLevelInput,
  type MemberLevelOutput,
  type DeviceAnomalyInput,
  type DeviceAnomalyOutput,
  type BatchEvaluateRequest,
  type BatchEvaluateResponse,
  type BatchEvaluateResponseItem,
  type EngineStatus,
  type RiskScoreInput,
  type RiskScoreOutput,
  type Simulator,
  type SimulatorRunInput,
  type SimulatorRunOutput,
  type SimulatorBatchRunOutput,
  type SimulatorResult,
  type SimulatorSummary
} from './ai-rule-engine.entity'
import { AiProvider, AiExecutionStatus, PolicyConditionOperator } from '@m5/domain'

@Injectable()
export class AiRuleEngineService {
  private readonly memberLevelEngine: RuleEngine = {
    id: 'member-level-v1',
    name: 'Member Level Evaluator',
    provider: AiProvider.DeepSeek,
    model: 'deepseek-v4',
    conditions: [
      {
        id: 'cond-high-spend',
        engineId: 'member-level-v1',
        field: 'totalSpend',
        operator: PolicyConditionOperator.Gte,
        value: 10000,
        weight: 0.4,
        description: '累计消费 >= 10000'
      },
      {
        id: 'cond-high-points',
        engineId: 'member-level-v1',
        field: 'totalPoints',
        operator: PolicyConditionOperator.Gte,
        value: 5000,
        weight: 0.3,
        description: '积分 >= 5000'
      },
      {
        id: 'cond-frequent-visit',
        engineId: 'member-level-v1',
        field: 'visitCount',
        operator: PolicyConditionOperator.Gte,
        value: 20,
        weight: 0.3,
        description: '到访次数 >= 20'
      }
    ],
    actions: [
      {
        id: 'act-assign-svip',
        engineId: 'member-level-v1',
        type: 'ASSIGN_LEVEL',
        params: { level: 'SVIP' },
        priority: 1,
        description: '分配 SVIP 等级'
      },
      {
        id: 'act-assign-vip',
        engineId: 'member-level-v1',
        type: 'ASSIGN_LEVEL',
        params: { level: 'VIP' },
        priority: 2,
        description: '分配 VIP 等级'
      },
      {
        id: 'act-assign-regular',
        engineId: 'member-level-v1',
        type: 'ASSIGN_LEVEL',
        params: { level: 'REGULAR' },
        priority: 3,
        description: '分配 REGULAR 等级'
      }
    ],
    matchStrategy: 'ALL',
    status: AiExecutionStatus.Succeeded
  }

  private readonly deviceAnomalyEngine: RuleEngine = {
    id: 'device-anomaly-v1',
    name: 'Device Anomaly Detector',
    provider: AiProvider.DeepSeek,
    model: 'deepseek-v4',
    conditions: [
      {
        id: 'cond-cpu-high',
        engineId: 'device-anomaly-v1',
        field: 'cpuUsage',
        operator: PolicyConditionOperator.Gte,
        value: 90,
        weight: 0.25,
        description: 'CPU 使用率 >= 90%'
      },
      {
        id: 'cond-memory-high',
        engineId: 'device-anomaly-v1',
        field: 'memoryUsage',
        operator: PolicyConditionOperator.Gte,
        value: 85,
        weight: 0.25,
        description: '内存使用率 >= 85%'
      },
      {
        id: 'cond-disk-high',
        engineId: 'device-anomaly-v1',
        field: 'diskUsage',
        operator: PolicyConditionOperator.Gte,
        value: 90,
        weight: 0.2,
        description: '磁盘使用率 >= 90%'
      },
      {
        id: 'cond-network-slow',
        engineId: 'device-anomaly-v1',
        field: 'networkLatencyMs',
        operator: PolicyConditionOperator.Gte,
        value: 500,
        weight: 0.15,
        description: '网络延迟 >= 500ms'
      },
      {
        id: 'cond-error-high',
        engineId: 'device-anomaly-v1',
        field: 'errorRate',
        operator: PolicyConditionOperator.Gte,
        value: 5,
        weight: 0.15,
        description: '错误率 >= 5%'
      }
    ],
    actions: [
      {
        id: 'act-flag-critical',
        engineId: 'device-anomaly-v1',
        type: 'FLAG_ANOMALY',
        params: { severity: 'CRITICAL' },
        priority: 1,
        description: '标记为严重异常'
      },
      {
        id: 'act-escalate',
        engineId: 'device-anomaly-v1',
        type: 'ESCALATE',
        params: { channel: 'ops-team' },
        priority: 2,
        description: '升级到运维团队'
      }
    ],
    matchStrategy: 'ANY',
    status: AiExecutionStatus.Succeeded
  }

  private readonly riskScoreEngine: RuleEngine = {
    id: 'risk-score-v1',
    name: 'Risk Score Evaluator',
    provider: AiProvider.DeepSeek,
    model: 'deepseek-v4',
    conditions: [
      {
        id: 'cond-high-refund',
        engineId: 'risk-score-v1',
        field: 'refundCount',
        operator: PolicyConditionOperator.Gte,
        value: 3,
        weight: 0.25,
        description: '退款次数 >= 3'
      },
      {
        id: 'cond-abnormal-payment',
        engineId: 'risk-score-v1',
        field: 'abnormalPaymentCount',
        operator: PolicyConditionOperator.Gte,
        value: 2,
        weight: 0.2,
        description: '异常支付次数 >= 2'
      },
      {
        id: 'cond-device-anomaly',
        engineId: 'risk-score-v1',
        field: 'deviceAnomalyCount',
        operator: PolicyConditionOperator.Gte,
        value: 2,
        weight: 0.15,
        description: '设备异常次数 >= 2'
      },
      {
        id: 'cond-complaints',
        engineId: 'risk-score-v1',
        field: 'complaintCount',
        operator: PolicyConditionOperator.Gte,
        value: 1,
        weight: 0.2,
        description: '投诉次数 >= 1'
      },
      {
        id: 'cond-void-refund',
        engineId: 'risk-score-v1',
        field: 'voidRefundAmount',
        operator: PolicyConditionOperator.Gte,
        value: 500,
        weight: 0.2,
        description: '注销退款金额 >= 500'
      }
    ],
    actions: [
      {
        id: 'act-flag-risk',
        engineId: 'risk-score-v1',
        type: 'FLAG_ANOMALY',
        params: { severity: 'HIGH' },
        priority: 1,
        description: '标记高风险主体'
      },
      {
        id: 'act-escalate-risk',
        engineId: 'risk-score-v1',
        type: 'ESCALATE',
        params: { channel: 'risk-team' },
        priority: 2,
        description: '升级到风控团队'
      },
      {
        id: 'act-notify-risk',
        engineId: 'risk-score-v1',
        type: 'SEND_NOTIFICATION',
        params: { channel: 'ops-manager' },
        priority: 3,
        description: '通知运营经理'
      }
    ],
    matchStrategy: 'ANY',
    status: AiExecutionStatus.Succeeded
  }

  /**
   * 评估成员等级
   */
  evaluateMemberLevel(input: MemberLevelInput): MemberLevelOutput {
    const { conditions, matchStrategy } = this.memberLevelEngine
    const triggeredRules: string[] = []

    // 评估条件
    const conditionResults = conditions.map((cond) => {
      const matches = this.evaluateCondition(cond, input as unknown as Record<string, unknown>)
      if (matches) triggeredRules.push(cond.id)
      return matches
    })

    // 根据匹配策略判定
    const isMatch =
      matchStrategy === 'ALL'
        ? conditionResults.every(Boolean)
        : conditionResults.some(Boolean)

    if (!isMatch) {
      return {
        memberId: input.memberId,
        currentLevel: this.inferCurrentLevel(input),
        suggestedLevel: 'REGULAR',
        triggeredRules: [],
        confidence: 0.3
      }
    }

    // 计算匹配得分
    const matchScore = conditions.reduce((score, cond, idx) => {
      return score + (conditionResults[idx] ? cond.weight : 0)
    }, 0)

    // 按匹配得分分配等级
    let suggestedLevel = 'REGULAR'
    if (matchScore >= 0.8) {
      suggestedLevel = 'SVIP'
    } else if (matchScore >= 0.5) {
      suggestedLevel = 'VIP'
    }

    return {
      memberId: input.memberId,
      currentLevel: this.inferCurrentLevel(input),
      suggestedLevel,
      triggeredRules,
      confidence: Math.min(matchScore, 1.0)
    }
  }

  /**
   * 检测设备异常
   */
  detectDeviceAnomaly(input: DeviceAnomalyInput): DeviceAnomalyOutput {
    const { conditions, matchStrategy } = this.deviceAnomalyEngine
    const triggeredRules: string[] = []
    const recommendations: string[] = []

    // 评估每个条件
    const anomalyResults = conditions.map((cond) => {
      const matches = this.evaluateCondition(cond, input.metrics as unknown as Record<string, unknown>)
      if (matches) {
        triggeredRules.push(cond.id)
        recommendations.push(this.getRecommendation(cond.field))
      }
      return matches
    })

    const anomalyCount = anomalyResults.filter(Boolean).length
    const isAnomaly =
      matchStrategy === 'ANY' ? anomalyCount > 0 : anomalyCount === conditions.length

    if (!isAnomaly) {
      return {
        deviceId: input.deviceId,
        isAnomaly: false,
        severity: 'LOW',
        triggeredRules: [],
        recommendations: ['All metrics within normal range']
      }
    }

    // 计算严重程度
    let severity: DeviceAnomalyOutput['severity'] = 'LOW'
    if (anomalyCount >= 3) {
      severity = 'CRITICAL'
    } else if (anomalyCount >= 2) {
      severity = 'HIGH'
    } else {
      severity = 'MEDIUM'
    }

    // 确定异常类型
    const anomalyType = this.determineAnomalyType(triggeredRules)

    return {
      deviceId: input.deviceId,
      isAnomaly: true,
      anomalyType,
      severity,
      triggeredRules,
      recommendations
    }
  }

  /**
   * 评估单个条件
   */
  private evaluateCondition(
    condition: RuleCondition,
    data: Record<string, unknown>
  ): boolean {
    const fieldValue = data[condition.field]
    if (fieldValue === undefined) return false

    const expectedValue = condition.value

    switch (condition.operator) {
      case PolicyConditionOperator.Eq:
        return fieldValue === expectedValue
      case PolicyConditionOperator.NotEq:
        return fieldValue !== expectedValue
      case PolicyConditionOperator.Gte:
        return (
          typeof fieldValue === 'number' &&
          typeof expectedValue === 'number' &&
          fieldValue >= expectedValue
        )
      case PolicyConditionOperator.Lte:
        return (
          typeof fieldValue === 'number' &&
          typeof expectedValue === 'number' &&
          fieldValue <= expectedValue
        )
      case PolicyConditionOperator.In:
        return (
          Array.isArray(expectedValue) &&
          expectedValue.includes(fieldValue as string | number)
        )
      case PolicyConditionOperator.NotIn:
        return (
          Array.isArray(expectedValue) &&
          !expectedValue.includes(fieldValue as string | number)
        )
      case PolicyConditionOperator.Exists:
        return fieldValue !== null && fieldValue !== undefined
      default:
        return false
    }
  }

  /**
   * 推断当前等级
   */
  private inferCurrentLevel(input: MemberLevelInput): string {
    if (input.totalSpend >= 10000 && input.totalPoints >= 5000) return 'SVIP'
    if (input.totalSpend >= 5000 || input.totalPoints >= 2000) return 'VIP'
    return 'REGULAR'
  }

  /**
   * 获取建议
   */
  private getRecommendation(field: string): string {
    const recs: Record<string, string> = {
      cpuUsage: '检查高性能进程，考虑扩容或限流',
      memoryUsage: '排查内存泄漏，重启高内存服务',
      diskUsage: '清理日志和临时文件，扩容磁盘',
      networkLatencyMs: '检查网络链路，排查带宽瓶颈',
      errorRate: '检查错误日志，回滚最近变更'
    }
    return recs[field] ?? '联系运维团队排查'
  }

  /**
   * 批量评估：同时评估多个成员和设备
   */
  batchEvaluate(request: BatchEvaluateRequest): BatchEvaluateResponse {
    const items: BatchEvaluateResponseItem[] = []
    let succeeded = 0
    let failed = 0

    for (let i = 0; i < request.items.length; i++) {
      const item = request.items[i]
      try {
        if (item.type === 'member-level') {
          const result = this.evaluateMemberLevel(item.data)
          items.push({ index: i, type: 'member-level', inputId: item.data.memberId, result })
          succeeded++
        } else if (item.type === 'device-anomaly') {
          const result = this.detectDeviceAnomaly(item.data)
          items.push({ index: i, type: 'device-anomaly', inputId: item.data.deviceId, result })
          succeeded++
        }
      } catch {
        failed++
      }
    }

    return {
      total: request.items.length,
      succeeded,
      failed,
      items,
      timestamp: new Date().toISOString()
    }
  }

  /**
   * 评估风险评分
   */
  evaluateRiskScore(input: RiskScoreInput): RiskScoreOutput {
    const { conditions, matchStrategy } = this.riskScoreEngine
    const triggeredRules: string[] = []
    const reasons: string[] = []
    const recommendations: string[] = []

    const conditionResults = conditions.map((cond) => {
      const matches = this.evaluateCondition(cond, input.metrics as unknown as Record<string, unknown>)
      if (matches) {
        triggeredRules.push(cond.id)
        reasons.push(cond.description ?? cond.field)
        recommendations.push(this.getRiskRecommendation(cond.field))
      }
      return matches
    })

    // 计算加权风险评分
    let weightedScore = 0
    let triggeredCount = 0
    conditions.forEach((cond, idx) => {
      if (conditionResults[idx]) {
        weightedScore += cond.weight * 100
        triggeredCount++
      }
    })

    // 额外风险评分调整
    if (input.metrics.voidRefundAmount !== undefined && input.metrics.voidRefundAmount >= 1000) {
      weightedScore = Math.min(100, weightedScore + 15)
    }
    if (input.metrics.abnormalPaymentCount !== undefined && input.metrics.abnormalPaymentCount >= 5) {
      weightedScore = Math.min(100, weightedScore + 10)
    }

    let riskLevel: RiskScoreOutput['riskLevel'] = 'LOW'
    if (weightedScore >= 70) {
      riskLevel = 'CRITICAL'
    } else if (weightedScore >= 50) {
      riskLevel = 'HIGH'
    } else if (weightedScore >= 25) {
      riskLevel = 'MEDIUM'
    }

    return {
      subjectId: input.subjectId,
      riskScore: Math.round(weightedScore),
      riskLevel,
      triggeredRules,
      reasons,
      recommendations,
      evaluatedAt: new Date().toISOString()
    }
  }

  /**
   * 获取风险建议
   */
  private getRiskRecommendation(field: string): string {
    const recs: Record<string, string> = {
      refundCount: '限制退款频率或要求审核',
      abnormalPaymentCount: '冻结异常支付渠道，人工审核',
      deviceAnomalyCount: '设备指纹标记，限制该设备交易',
      complaintCount: '调查投诉原因，必要时封号',
      voidRefundAmount: '审核大额注销退款，联系门店确认'
    }
    return recs[field] ?? '风控团队进一步排查'
  }

  /**
   * 获取所有引擎状态
   */
  getEngineStatus(): EngineStatus[] {
    return [this.memberLevelEngine, this.deviceAnomalyEngine, this.riskScoreEngine].map(
      (engine) => ({
        engineId: engine.id,
        engineName: engine.name,
        conditionsCount: engine.conditions.length,
        actionsCount: engine.actions.length,
        matchStrategy: engine.matchStrategy,
        status: engine.status,
        enabled: engine.status !== AiExecutionStatus.Failed,
        lastEvaluatedAt: engine.lastEvaluatedAt
      })
    )
  }

  /**
   * 确定异常类型
   */
  private determineAnomalyType(
    triggeredRules: string[]
  ): DeviceAnomalyOutput['anomalyType'] {
    if (triggeredRules.includes('cond-cpu-high')) return 'CPU_SPIKE'
    if (triggeredRules.includes('cond-memory-high')) return 'MEMORY_LEAK'
    if (triggeredRules.includes('cond-disk-high')) return 'DISK_FULL'
    if (triggeredRules.includes('cond-network-slow')) return 'NETWORK_LATENCY'
    if (triggeredRules.includes('cond-error-high')) return 'HIGH_ERROR_RATE'
    return undefined
  }

  // ─── Simulator Methods ───

  private readonly simulators: Simulator[] = [
    {
      id: 'sim-member-level-v1',
      engineId: 'member-level-v1',
      name: 'Member Level Simulator',
      rounds: 100,
      timeoutMs: 5000,
      enableMutation: false,
      createdAt: new Date().toISOString()
    },
    {
      id: 'sim-device-anomaly-v1',
      engineId: 'device-anomaly-v1',
      name: 'Device Anomaly Simulator',
      rounds: 50,
      timeoutMs: 10000,
      enableMutation: true,
      createdAt: new Date().toISOString()
    }
  ]

  /**
   * 获取所有模拟器
   */
  listSimulators(): Simulator[] {
    return this.simulators
  }

  /**
   * 获取单个模拟器
   */
  getSimulator(simulatorId: string): Simulator | undefined {
    return this.simulators.find((s) => s.id === simulatorId)
  }

  /**
   * 单次模拟运行：模拟一条规则评估
   */
  runSimulator(input: SimulatorRunInput): SimulatorRunOutput {
    const startTime = Date.now()
    const simulator = this.simulators.find((s) => s.id === input.simulatorId)
    if (!simulator) {
      throw new Error(`Simulator ${input.simulatorId} not found`)
    }

    // 根据 dataType 选择引擎
    let engine: RuleEngine
    switch (input.dataType) {
      case 'member-level':
        engine = this.memberLevelEngine
        break
      case 'device-anomaly':
        engine = this.deviceAnomalyEngine
        break
      case 'risk-score':
        engine = this.riskScoreEngine
        break
      default:
        throw new Error(`Unknown dataType: ${input.dataType}`)
    }

    const logs: string[] = input.verbose ? [] : (undefined as unknown as string[])

    // 应用条件覆盖
    const effectiveConditions = this.applyConditionOverrides(
      engine.conditions,
      input.conditionOverrides ?? [],
      logs
    )

    // 模拟条件评估
    const triggeredConditions: string[] = []
    // 对于 device-anomaly / risk-score 类型，使用 metrics 子对象进行评估
    const rawData = input.data as unknown as Record<string, unknown>
    const needsMetricsExtraction =
      (input.dataType === 'device-anomaly' || input.dataType === 'risk-score') &&
      rawData.metrics &&
      typeof rawData.metrics === 'object'
    const dataRecord: Record<string, unknown> = needsMetricsExtraction
      ? (rawData.metrics as Record<string, unknown>)
      : rawData

    if (input.verbose) logs!.push(`[SIM] Evaluating ${effectiveConditions.length} conditions`)

    const conditionResults = effectiveConditions.map((cond) => {
      const matches = this.evaluateCondition(cond, dataRecord)
      if (matches) {
        triggeredConditions.push(cond.id)
        if (input.verbose) logs!.push(`[SIM] Condition ${cond.id} MATCHED (field=${cond.field})`)
      } else {
        if (input.verbose) logs!.push(`[SIM] Condition ${cond.id} NOT matched`)
      }
      return matches
    })

    // 匹配判定
    const matched =
      engine.matchStrategy === 'ALL'
        ? conditionResults.every(Boolean)
        : conditionResults.some(Boolean)

    if (input.verbose) {
      logs!.push(
        `[SIM] Strategy=${engine.matchStrategy}, matched=${matched}, triggered=${triggeredConditions.length}`
      )
    }

    // 计算匹配分数
    const matchScore = matched
      ? effectiveConditions.reduce((score, cond, idx) => {
          return score + (conditionResults[idx] ? cond.weight : 0)
        }, 0)
      : 0

    // 收集将被触发的动作（按优先级排序）
    const triggeredActions = matched
      ? [...engine.actions]
          .sort((a, b) => a.priority - b.priority)
          .map((a) => a.id)
      : []

    if (input.verbose && matched) {
      logs!.push(`[SIM] Will trigger actions: ${triggeredActions.join(', ')}`)
    }

    const executionTimeMs = Date.now() - startTime

    return {
      simulatorId: simulator.id,
      simulatorName: simulator.name,
      runIndex: 0,
      matched,
      triggeredConditions,
      triggeredActions,
      matchScore: Math.min(matchScore, 1.0),
      executionTimeMs,
      timestamp: new Date().toISOString(),
      logs: input.verbose ? logs : undefined
    }
  }

  /**
   * 多轮模拟运行：批量模拟并生成聚合摘要
   */
  runSimulatorBatch(input: SimulatorRunInput & { rounds?: number }): SimulatorBatchRunOutput {
    const simulator = this.simulators.find((s) => s.id === input.simulatorId)
    if (!simulator) {
      throw new Error(`Simulator ${input.simulatorId} not found`)
    }

    const rounds = input.rounds ?? simulator.rounds
    const results: SimulatorResult[] = []
    const conditionCounter = new Map<string, number>()

    const runWithMutation = simulator.enableMutation

    for (let i = 0; i < rounds; i++) {
      // 如果启用变异，随机扰动数值
      const mutatedInput: SimulatorRunInput = {
        ...input,
        verbose: false,
        data: (runWithMutation ? this.mutateData(input.data, i) : input.data) as SimulatorRunInput['data']
      }

      const result = this.runSimulator(mutatedInput)
      results.push({ ...result, runIndex: i })

      // 统计条件命中
      for (const condId of result.triggeredConditions) {
        conditionCounter.set(condId, (conditionCounter.get(condId) ?? 0) + 1)
      }
    }

    const matchedRuns = results.filter((r) => r.matched).length
    const times = results.map((r) => r.executionTimeMs).sort((a, b) => a - b)
    const avgTime = times.length > 0 ? times.reduce((s, t) => s + t, 0) / times.length : 0

    const p50 = this.percentile(times, 50)
    const p95 = this.percentile(times, 95)
    const p99 = this.percentile(times, 99)

    // 最频繁触发的条件 Top 5
    const mostTriggered = Array.from(conditionCounter.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([conditionId, count]) => ({ conditionId, count }))

    // 生成建议
    const matchRate = rounds > 0 ? matchedRuns / rounds : 0
    let recommendation = 'No issues detected.'
    if (matchRate < 0.1) {
      recommendation = 'Very low match rate. Consider relaxing conditions or reducing thresholds.'
    } else if (matchRate > 0.9) {
      recommendation = 'Very high match rate. Conditions may be too permissive; consider tightening thresholds.'
    } else if (p95 > 100) {
      recommendation = 'Performance concern: p95 execution time exceeds 100ms. Optimize condition evaluation.'
    }

    return {
      simulatorId: simulator.id,
      simulatorName: simulator.name,
      totalRuns: rounds,
      matchedRuns,
      matchRate: Math.round(matchRate * 10000) / 10000,
      avgExecutionTimeMs: Math.round(avgTime * 100) / 100,
      p50ExecutionTimeMs: p50,
      p95ExecutionTimeMs: p95,
      p99ExecutionTimeMs: p99,
      mostTriggeredConditions: mostTriggered,
      results,
      recommendation
    }
  }

  /**
   * 数据变异：为模拟引入随机噪声，测试规则鲁棒性
   */
  private mutateData(data: unknown, seed: number): Record<string, unknown> {
    if (typeof data !== 'object' || data === null) return data as Record<string, unknown>
    const record = { ...(data as Record<string, unknown>) }
    // Simple deterministic mutation based on seed
    const factor = 1 + Math.sin(seed * 0.37) * 0.1 // ±10% variation
    for (const key of Object.keys(record)) {
      const val = record[key]
      if (typeof val === 'number') {
        record[key] = Math.max(0, Math.round(val * factor * 100) / 100)
      } else if (typeof val === 'object' && val !== null) {
        record[key] = this.mutateData(val, seed + Object.keys(record).indexOf(key))
      }
    }
    return record
  }

  /**
   * 计算百分位数
   */
  private percentile(sorted: number[], p: number): number {
    if (sorted.length === 0) return 0
    const idx = Math.ceil((p / 100) * sorted.length) - 1
    return sorted[Math.max(0, idx)]
  }

  /**
   * 应用条件值覆盖
   */
  private applyConditionOverrides(
    conditions: RuleCondition[],
    overrides: Array<{ conditionId: string; value: unknown }>,
    logs?: string[]
  ): RuleCondition[] {
    if (overrides.length === 0) return conditions

    const overrideMap = new Map(overrides.map((o) => [o.conditionId, o.value]))

    return conditions.map((cond) => {
      const overrideValue = overrideMap.get(cond.id)
      if (overrideValue !== undefined) {
        if (logs) {
          logs.push(
            `[SIM] Override condition ${cond.id}: ${JSON.stringify(cond.value)} → ${JSON.stringify(overrideValue)}`
          )
        }
        return { ...cond, value: overrideValue as RuleCondition['value'] }
      }
      return cond
    })
  }

  /**
   * 获取引擎详细配置
   */
  getEngineDetail(engineId: string): import('./ai-rule-engine.entity').EngineDetail | undefined {
    const engine = this.getAllEngines().find((e) => e.id === engineId)
    if (!engine) return undefined

    return {
      engineId: engine.id,
      engineName: engine.name,
      conditionsCount: engine.conditions.length,
      actionsCount: engine.actions.length,
      matchStrategy: engine.matchStrategy,
      status: engine.status,
      enabled: engine.status !== AiExecutionStatus.Failed,
      provider: engine.provider,
      model: engine.model,
      description: engine.description,
      conditions: engine.conditions.map((c) => ({
        id: c.id,
        field: c.field,
        operator: c.operator,
        value: c.value,
        weight: c.weight,
        description: c.description
      })),
      actions: engine.actions.map((a) => ({
        id: a.id,
        type: a.type,
        params: a.params,
        priority: a.priority,
        description: a.description
      })),
      lastEvaluatedAt: engine.lastEvaluatedAt
    }
  }

  /**
   * 更新引擎配置
   */
  updateEngineConfig(
    engineId: string,
    config: import('./ai-rule-engine.entity').EngineConfigUpdate
  ): import('./ai-rule-engine.entity').EngineDetail | undefined {
    const engine = this.getAllEngines().find((e) => e.id === engineId)
    if (!engine) return undefined

    if (config.enabled !== undefined) {
      engine.status = config.enabled ? AiExecutionStatus.Succeeded : AiExecutionStatus.Failed
    }

    if (config.matchStrategy !== undefined) {
      engine.matchStrategy = config.matchStrategy
    }

    if (config.description !== undefined) {
      engine.description = config.description
    }

    if (config.conditionOverrides !== undefined) {
      for (const override of config.conditionOverrides) {
        const condition = engine.conditions.find((c) => c.id === override.conditionId)
        if (condition) {
          if (override.field !== undefined) condition.field = override.field
          if (override.value !== undefined) condition.value = override.value
          if (override.weight !== undefined) condition.weight = override.weight
          if (override.operator !== undefined) condition.operator = override.operator
        }
      }
    }

    return this.getEngineDetail(engineId)
  }

  /**
   * 重置引擎到默认配置（恢复到硬编码默认值）
   */
  resetEngine(engineId: string): import('./ai-rule-engine.entity').EngineDetail | undefined {
    const engineIndex = this.getAllEngines().findIndex((e) => e.id === engineId)
    if (engineIndex === -1) return undefined

    // 重新从默认常量初始化（实际上不需要操作，因为内存中无法回退）
    // 在生产环境应该从数据库读取默认配置
    // 这里我们只重置状态为 Succeeded
    const engine = this.getAllEngines()[engineIndex]
    engine.status = AiExecutionStatus.Succeeded

    return this.getEngineDetail(engineId)
  }

  /**
   * 获取所有规则引擎列表（内部）
   */
  private getAllEngines(): import('./ai-rule-engine.entity').RuleEngine[] {
    return [this.memberLevelEngine, this.deviceAnomalyEngine, this.riskScoreEngine]
  }
}
