export type MetricSource = 'cpu' | 'memory' | 'requests_per_second' | 'latency' | 'custom'
export type ScalingAction = 'scale_up' | 'scale_down' | 'scale_stabilize'
export type DeploymentStatus = 'healthy' | 'degraded' | 'critical' | 'unknown'

export interface HPAPolicy {
  name: string
  metric: MetricSource
  targetValue: number
  targetPercent: number
  minReplicas: number
  maxReplicas: number
  stabilizationWindowSeconds: number
  cooldownSeconds: number
  enabled: boolean
}

export interface ReplicaMetrics {
  timestamp: Date
  cpuPercent: number
  memoryPercent: number
  requestsPerSecond: number
  latencyMs: number
  currentReplicas: number
}

export interface ScalingDecision {
  action: ScalingAction
  targetReplicas: number
  reason: string
  currentMetrics: ReplicaMetrics
  triggeredBy: MetricSource
  confidence: number
  cooldownRemainingSeconds: number
}

export interface DeploymentHealth {
  name: string
  status: DeploymentStatus
  readyReplicas: number
  availableReplicas: number
  unavailableReplicas: number
  conditions: { type: string; status: string; message?: string }[]
  lastScaleAt?: Date
  uptimePercent: number
}

interface ScaleHistoryEntry {
  timestamp: Date
  from: number
  to: number
  reason: string
}

interface DeploymentState {
  name: string
  replicas: number
  readyReplicas: number
  availableReplicas: number
  unavailableReplicas: number
  conditions: { type: string; status: string; message?: string }[]
  lastScaleAt?: Date
  uptimePercent: number
  metricsHistory: ReplicaMetrics[]
}

export class K8sScaleService {
  private policies: Map<string, HPAPolicy> = new Map()
  private deployments: Map<string, DeploymentState> = new Map()
  private scaleHistory: Map<string, ScaleHistoryEntry[]> = new Map()
  private lastScaleTime: Map<string, number> = new Map()
  private cooldowns: Map<string, number> = new Map()

  // Cost constants
  private readonly CPU_COST_PER_VCPU_HOUR = 0.05
  private readonly MEMORY_COST_PER_GB_HOUR = 0.01
  private readonly DEFAULT_CPU_CORES = 1
  private readonly DEFAULT_MEMORY_GB = 1

  // ── HPA 策略管理 ────────────────────────────────────────────────

  createHPAPolicy(policy: HPAPolicy): HPAPolicy {
    this.policies.set(policy.name, { ...policy })
    return this.getHPAPolicy(policy.name)!
  }

  getHPAPolicy(name: string): HPAPolicy | null {
    const policy = this.policies.get(name)
    return policy ? { ...policy } : null
  }

  listHPAPolicies(): HPAPolicy[] {
    return Array.from(this.policies.values()).map((p) => ({ ...p }))
  }

  updateHPAPolicy(name: string, updates: Partial<HPAPolicy>): HPAPolicy {
    const existing = this.policies.get(name)
    if (!existing) {
      throw new Error(`Policy ${name} not found`)
    }
    const updated = { ...existing, ...updates, name }
    this.policies.set(name, updated)
    return { ...updated }
  }

  deleteHPAPolicy(name: string): void {
    this.policies.delete(name)
  }

  // ── 伸缩执行 ─────────────────────────────────────────────────

  collectMetrics(): ReplicaMetrics {
    return {
      timestamp: new Date(),
      cpuPercent: Math.random() * 100,
      memoryPercent: Math.random() * 100,
      requestsPerSecond: Math.random() * 1000,
      latencyMs: Math.random() * 500,
      currentReplicas: 1
    }
  }

  evaluateScaling(metrics: ReplicaMetrics): ScalingDecision[] {
    const decisions: ScalingDecision[] = []
    const policies = this.listHPAPolicies().filter((p) => p.enabled)

    for (const policy of policies) {
      const current = this.getMetricValue(metrics, policy.metric)
      const target = policy.targetPercent

      if (current > target) {
        const delta = (current - target) / target
        const scaleFactor = 1 + Math.min(delta * 0.5, 2)
        let newReplicas = Math.ceil(metrics.currentReplicas * scaleFactor)
        newReplicas = this.clamp(newReplicas, policy.minReplicas, policy.maxReplicas)

        decisions.push({
          action: 'scale_up',
          targetReplicas: newReplicas,
          reason: '指标超过阈值',
          currentMetrics: metrics,
          triggeredBy: policy.metric,
          confidence: Math.min(delta * 0.5, 1),
          cooldownRemainingSeconds: this.getCooldownRemaining(policy.name)
        })
      } else if (current < target * 0.7) {
        let newReplicas = Math.floor(metrics.currentReplicas * 0.8)
        newReplicas = this.clamp(newReplicas, policy.minReplicas, policy.maxReplicas)

        decisions.push({
          action: 'scale_down',
          targetReplicas: newReplicas,
          reason: '资源利用率过低',
          currentMetrics: metrics,
          triggeredBy: policy.metric,
          confidence: Math.min((target * 0.7 - current) / (target * 0.7), 1),
          cooldownRemainingSeconds: this.getCooldownRemaining(policy.name)
        })
      } else {
        decisions.push({
          action: 'scale_stabilize',
          targetReplicas: metrics.currentReplicas,
          reason: '资源利用率正常',
          currentMetrics: metrics,
          triggeredBy: policy.metric,
          confidence: 1,
          cooldownRemainingSeconds: this.getCooldownRemaining(policy.name)
        })
      }
    }

    return decisions
  }

  scale(name: string, targetReplicas: number): DeploymentHealth {
    let deployment = this.deployments.get(name)

    if (!deployment) {
      deployment = this.createDefaultDeployment(name)
    }

    const fromReplicas = deployment.replicas
    deployment.replicas = targetReplicas
    deployment.readyReplicas = targetReplicas
    deployment.availableReplicas = targetReplicas
    deployment.unavailableReplicas = 0
    deployment.lastScaleAt = new Date()

    this.deployments.set(name, deployment)

    // Record scale history
    const history = this.scaleHistory.get(name) || []
    history.push({
      timestamp: new Date(),
      from: fromReplicas,
      to: targetReplicas,
      reason: `手动伸缩: ${fromReplicas} -> ${targetReplicas}`
    })
    this.scaleHistory.set(name, history)

    // Set cooldown
    this.lastScaleTime.set(name, Date.now())

    return this.checkHealth(name)
  }

  autoScale(name: string): ScalingDecision {
    const metrics = this.collectMetrics()
    const deployment = this.deployments.get(name)

    if (deployment) {
      metrics.currentReplicas = deployment.replicas
    }

    const decisions = this.evaluateScaling(metrics)

    // Pick the most aggressive decision
    const decision = this.prioritizeDecision(decisions)

    if (decision && decision.action !== 'scale_stabilize') {
      const cooldownRemaining = this.getCooldownRemaining(name)
      if (cooldownRemaining <= 0) {
        this.scale(name, decision.targetReplicas)
        this.cooldowns.set(name, Date.now())
      }
    }

    return decision || {
      action: 'scale_stabilize',
      targetReplicas: metrics.currentReplicas,
      reason: '无有效决策',
      currentMetrics: metrics,
      triggeredBy: 'custom',
      confidence: 0,
      cooldownRemainingSeconds: 0
    }
  }

  // ── 部署健康检查 ──────────────────────────────────────────────

  checkHealth(name: string): DeploymentHealth {
    const deployment = this.deployments.get(name)

    if (!deployment) {
      return {
        name,
        status: 'unknown',
        readyReplicas: 0,
        availableReplicas: 0,
        unavailableReplicas: 0,
        conditions: [],
        uptimePercent: 0
      }
    }

    let status: DeploymentStatus = 'healthy'
    if (deployment.unavailableReplicas > 0) {
      status = deployment.unavailableReplicas >= deployment.replicas ? 'critical' : 'degraded'
    }

    const criticalCondition = deployment.conditions.find(
      (c) => c.type === 'Ready' && c.status === 'False'
    )
    if (criticalCondition) {
      status = 'critical'
    }

    return {
      name: deployment.name,
      status,
      readyReplicas: deployment.readyReplicas,
      availableReplicas: deployment.availableReplicas,
      unavailableReplicas: deployment.unavailableReplicas,
      conditions: [...deployment.conditions],
      lastScaleAt: deployment.lastScaleAt,
      uptimePercent: deployment.uptimePercent
    }
  }

  listDeployments(): { name: string; status: DeploymentStatus }[] {
    return Array.from(this.deployments.values()).map((d) => {
      const health = this.checkHealth(d.name)
      return { name: d.name, status: health.status }
    })
  }

  restartPod(deploymentName: string): void {
    const deployment = this.deployments.get(deploymentName)
    if (deployment) {
      deployment.conditions.push({
        type: 'PodScheduled',
        status: 'True',
        message: 'Pod restarted'
      })
      deployment.uptimePercent = Math.random() * 100
    }
  }

  // ── 指标分析 ─────────────────────────────────────────────────

  recommendReplicas(name: string, windowMinutes: number = 30): number {
    const deployment = this.deployments.get(name)
    if (!deployment || deployment.metricsHistory.length === 0) {
      return 1
    }

    const now = Date.now()
    const windowMs = windowMinutes * 60 * 1000
    const recentMetrics = deployment.metricsHistory.filter(
      (m) => now - m.timestamp.getTime() <= windowMs
    )

    if (recentMetrics.length === 0) {
      return 1
    }

    const avgCpu = recentMetrics.reduce((sum, m) => sum + m.cpuPercent, 0) / recentMetrics.length
    const avgMemory = recentMetrics.reduce((sum, m) => sum + m.memoryPercent, 0) / recentMetrics.length
    const avgRps = recentMetrics.reduce((sum, m) => sum + m.requestsPerSecond, 0) / recentMetrics.length

    // Simple recommendation: target 70% utilization
    const targetUtilization = 70
    let recommendedReplicas = deployment.replicas

    if (avgCpu > targetUtilization) {
      recommendedReplicas = Math.ceil(deployment.replicas * (avgCpu / targetUtilization))
    } else if (avgMemory > targetUtilization) {
      recommendedReplicas = Math.ceil(deployment.replicas * (avgMemory / targetUtilization))
    }

    // Scale based on RPS if it's very high
    if (avgRps > 500) {
      recommendedReplicas = Math.max(recommendedReplicas, Math.ceil(avgRps / 100))
    }

    return Math.max(1, Math.min(recommendedReplicas, 10))
  }

  analyzeBottleneck(metrics: ReplicaMetrics): string[] {
    const bottlenecks: string[] = []

    if (metrics.cpuPercent > 90) {
      bottlenecks.push('CPU 使用率过高 (>90%)，建议扩容或优化计算密集型任务')
    }

    if (metrics.memoryPercent > 90) {
      bottlenecks.push('内存使用率过高 (>90%)，建议增加内存或优化内存占用')
    }

    if (metrics.latencyMs > 300) {
      bottlenecks.push('延迟过高 (>300ms)，可能是资源争用或下游服务响应慢')
    }

    if (metrics.requestsPerSecond > 800) {
      bottlenecks.push('请求量过高 (>800 RPS)，建议扩容以应对高并发')
    }

    if (metrics.cpuPercent < 20 && metrics.memoryPercent < 20) {
      bottlenecks.push('资源利用率过低，可能存在资源浪费，建议缩容')
    }

    return bottlenecks
  }

  // ── 扩缩历史 ─────────────────────────────────────────────────

  getScaleHistory(name: string, limit: number = 10): { timestamp: Date; from: number; to: number; reason: string }[] {
    const history = this.scaleHistory.get(name) || []
    return history.slice(-limit).reverse()
  }

  // ── 成本估算 ─────────────────────────────────────────────────

  estimateCost(name: string): {
    cpuCostPerHour: number
    memoryCostPerHour: number
    totalPerHour: number
    totalPerMonth: number
  } {
    const deployment = this.deployments.get(name)
    const replicas = deployment?.replicas || 1

    const cpuCostPerHour = replicas * this.DEFAULT_CPU_CORES * this.CPU_COST_PER_VCPU_HOUR
    const memoryCostPerHour = replicas * this.DEFAULT_MEMORY_GB * this.MEMORY_COST_PER_GB_HOUR
    const totalPerHour = cpuCostPerHour + memoryCostPerHour
    const totalPerMonth = totalPerHour * 24 * 30

    return {
      cpuCostPerHour,
      memoryCostPerHour,
      totalPerHour,
      totalPerMonth
    }
  }

  // ── 内部辅助方法 ──────────────────────────────────────────────

  private getMetricValue(metrics: ReplicaMetrics, metric: MetricSource): number {
    switch (metric) {
      case 'cpu':
        return metrics.cpuPercent
      case 'memory':
        return metrics.memoryPercent
      case 'requests_per_second':
        return metrics.requestsPerSecond
      case 'latency':
        return metrics.latencyMs
      default:
        return 0
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  private getCooldownRemaining(name: string): number {
    const lastScale = this.lastScaleTime.get(name)
    if (!lastScale) return 0

    const cooldown = 300000 // 5 minutes default cooldown
    const elapsed = Date.now() - lastScale
    return Math.max(0, cooldown - elapsed) / 1000
  }

  private createDefaultDeployment(name: string): DeploymentState {
    const deployment: DeploymentState = {
      name,
      replicas: 1,
      readyReplicas: 1,
      availableReplicas: 1,
      unavailableReplicas: 0,
      conditions: [{ type: 'Ready', status: 'True' }],
      uptimePercent: 99.9,
      metricsHistory: []
    }
    this.deployments.set(name, deployment)
    return deployment
  }

  private prioritizeDecision(decisions: ScalingDecision[]): ScalingDecision | null {
    if (decisions.length === 0) return null

    // Prioritize scale_up > scale_down > scale_stabilize
    const scaleUp = decisions.find((d) => d.action === 'scale_up')
    if (scaleUp) return scaleUp

    const scaleDown = decisions.find((d) => d.action === 'scale_down')
    if (scaleDown) return scaleDown

    return decisions[0]
  }
}
