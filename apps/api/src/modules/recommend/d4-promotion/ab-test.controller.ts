/**
 * V18 Day2 D4: A/B 测试控制 (ABTestController)
 *
 * A/B 测试组分配与结果追踪:
 * - 基于 memberId 的确定性哈希分组
 * - 实验结果统计分析 (CTR, 转化率, 客单价)
 * - 自动优胜者判断
 * - 优胜参数导出 (用于自动调优)
 */

import { Injectable } from '@nestjs/common'
import type { PromotionContext, PromotionCandidate } from './promotion.entity'
import type { Candidate } from '../recommend.entity'
import {
  BasePromotionStrategy,
  type IPromotionStrategy,
  type PromotionStrategyFactory,
} from './promotion.strategy'
import type {
  ABTestConfig,
  ABTestSnapshot,
  ABTestStatus,
  ABTestWinner,
  ABTestMetric,
} from './promotion.entity'
import {
  DEFAULT_AB_TEST_TRAFFIC_SPLIT,
  DEFAULT_AB_TEST_CONFIDENCE,
  DEFAULT_AB_TEST_MIN_SAMPLE,
} from './promotion.entity'

// ============================================================
// A/B 测试配置管理
// ============================================================

export interface ABTestManagerConfig {
  experiments: ABTestConfig[]
  maxExposuresPerUser: number     // 每人最多被实验覆盖次数
  resultRetentionDays: number
}

@Injectable()
export class ABTestManager {
  private experiments: Map<string, ABTestConfig> = new Map()
  private snapshots: Map<string, ABTestSnapshot> = new Map()
  private memberAssignments: Map<string, Map<string, 'control' | 'variant'>> = new Map()

  /**
   * 注册实验
   */
  registerExperiment(config: ABTestConfig): void {
    if (config.trafficSplit < 1 || config.trafficSplit > 99) {
      throw new Error(`A/B test traffic split must be 1-99, got ${config.trafficSplit}`)
    }
    if (this.experiments.has(config.experimentId)) {
      throw new Error(`Experiment ${config.experimentId} already registered`)
    }
    this.experiments.set(config.experimentId, { ...config })
  }

  /**
   * 更新实验配置
   */
  updateExperiment(config: Partial<ABTestConfig> & { experimentId: string }): void {
    const existing = this.experiments.get(config.experimentId)
    if (!existing) {
      throw new Error(`Experiment ${config.experimentId} not found`)
    }
    this.experiments.set(config.experimentId, { ...existing, ...config })
  }

  /**
   * 获取实验配置
   */
  getExperiment(experimentId: string): ABTestConfig | undefined {
    return this.experiments.get(experimentId)
  }

  /**
   * 获取所有运行中的实验
   */
  getRunningExperiments(): ABTestConfig[] {
    return Array.from(this.experiments.values())
      .filter(e => e.status === 'running')
  }

  /**
   * 暂停/恢复/完成实验
   */
  setExperimentStatus(experimentId: string, status: ABTestStatus): void {
    const exp = this.experiments.get(experimentId)
    if (!exp) {
      throw new Error(`Experiment ${experimentId} not found`)
    }
    this.experiments.set(experimentId, { ...exp, status })
  }

  /**
   * 获取实验快照
   */
  getSnapshot(experimentId: string): ABTestSnapshot | undefined {
    return this.snapshots.get(experimentId)
  }

  /**
   * 获取所有快照
   */
  getAllSnapshots(): ABTestSnapshot[] {
    return Array.from(this.snapshots.values())
  }

  // ============================================================
  // 用户分组 (确定性哈希)
  // ============================================================

  /**
   * 分配用户到 A/B 组
   * 使用 memberId 的确定性哈希, 确保同一用户始终在同一组
   */
  assignGroup(memberId: string, experimentId: string): 'control' | 'variant' {
    // 检查已有分配
    const memberMap = this.memberAssignments.get(memberId) ?? new Map()
    const existing = memberMap.get(experimentId)
    if (existing) return existing

    const exp = this.experiments.get(experimentId)
    if (!exp) throw new Error(`Experiment ${experimentId} not found`)
    if (exp.status !== 'running') return 'control'

    // 确定性哈希
    const hash = this.deterministicHash(`${memberId}:${experimentId}`)
    const group = (hash % 100) < exp.trafficSplit ? 'variant' : 'control'

    memberMap.set(experimentId, group)
    this.memberAssignments.set(memberId, memberMap)
    return group
  }

  /**
   * 获取用户在所有实验中的分组
   */
  getMemberGroups(memberId: string): Record<string, 'control' | 'variant'> {
    const memberMap = this.memberAssignments.get(memberId)
    if (!memberMap) return {}
    return Object.fromEntries(memberMap.entries())
  }

  /**
   * 简易确定性哈希 (FNV-1a 风格简化)
   */
  private deterministicHash(input: string): number {
    let hash = 2166136261
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i)
      hash = Math.imul(hash, 16777619) & 0x7fffffff
    }
    return Math.abs(hash)
  }

  // ============================================================
  // 实验结果收集与统计
  // ============================================================

  /**
   * 记录曝光事件
   */
  recordExposure(
    experimentId: string,
    memberId: string,
    group: 'control' | 'variant',
    itemsShown: number,
  ): void {
    const exp = this.experiments.get(experimentId)
    if (!exp || exp.status !== 'running') return

    let snapshot = this.snapshots.get(experimentId)
    if (!snapshot) {
      snapshot = this.createInitialSnapshot(exp)
    }

    if (group === 'control') {
      snapshot = { ...snapshot, controlExposures: snapshot.controlExposures + itemsShown }
    } else {
      snapshot = { ...snapshot, variantExposures: snapshot.variantExposures + itemsShown }
    }

    this.snapshots.set(experimentId, { ...snapshot, updatedAt: new Date().toISOString() })
  }

  /**
   * 记录转化事件
   */
  recordConversion(
    experimentId: string,
    memberId: string,
    group: 'control' | 'variant',
    revenue: number = 0,
  ): void {
    const exp = this.experiments.get(experimentId)
    if (!exp || exp.status !== 'running') return

    let snapshot = this.snapshots.get(experimentId)
    if (!snapshot) {
      snapshot = this.createInitialSnapshot(exp)
    }

    if (group === 'control') {
      snapshot = {
        ...snapshot,
        controlConversions: snapshot.controlConversions + 1,
        controlRevenue: snapshot.controlRevenue + revenue,
      }
    } else {
      snapshot = {
        ...snapshot,
        variantConversions: snapshot.variantConversions + 1,
        variantRevenue: snapshot.variantRevenue + revenue,
      }
    }

    this.snapshots.set(experimentId, { ...snapshot, updatedAt: new Date().toISOString() })
  }

  /**
   * 分析实验结果
   */
  analyzeResults(experimentId: string): ABTestSnapshot | undefined {
    const exp = this.experiments.get(experimentId)
    if (!exp) return undefined

    let snapshot = this.snapshots.get(experimentId)
    if (!snapshot) {
      snapshot = this.createInitialSnapshot(exp)
    }

    // 计算指标
    const metrics = this.computeMetrics(exp, snapshot)
    const winner = this.determineWinner(exp, snapshot, metrics)

    snapshot = {
      ...snapshot,
      metrics,
      winner,
      updatedAt: new Date().toISOString(),
    }

    this.snapshots.set(experimentId, snapshot)
    return snapshot
  }

  private createInitialSnapshot(exp: ABTestConfig): ABTestSnapshot {
    return {
      experimentId: exp.experimentId,
      controlExposures: 0,
      variantExposures: 0,
      controlConversions: 0,
      variantConversions: 0,
      controlRevenue: 0,
      variantRevenue: 0,
      metrics: exp.metrics.map(m => ({
        name: m.name,
        weight: m.weight,
        higherIsBetter: m.higherIsBetter,
      })),
      winner: 'insufficient-data',
      startedAt: exp.startDate,
      updatedAt: new Date().toISOString(),
      recommendedParams: exp.control.params,
    }
  }

  // ============================================================
  // 统计计算
  // ============================================================

  private computeMetrics(
    exp: ABTestConfig,
    snapshot: ABTestSnapshot,
  ): ABTestMetric[] {
    return exp.metrics.map(metric => {
      let controlValue = 0
      let variantValue = 0

      switch (metric.name) {
        case 'ctr': {
          controlValue = snapshot.controlExposures > 0
            ? snapshot.controlConversions / snapshot.controlExposures
            : 0
          variantValue = snapshot.variantExposures > 0
            ? snapshot.variantConversions / snapshot.variantExposures
            : 0
          break
        }
        case 'conversion-rate': {
          controlValue = snapshot.controlExposures > 0
            ? snapshot.controlConversions / snapshot.controlExposures
            : 0
          variantValue = snapshot.variantExposures > 0
            ? snapshot.variantConversions / snapshot.variantExposures
            : 0
          break
        }
        case 'avg-revenue': {
          controlValue = snapshot.controlConversions > 0
            ? snapshot.controlRevenue / snapshot.controlConversions
            : 0
          variantValue = snapshot.variantConversions > 0
            ? snapshot.variantRevenue / snapshot.variantConversions
            : 0
          break
        }
        case 'total-revenue': {
          controlValue = snapshot.controlRevenue
          variantValue = snapshot.variantRevenue
          break
        }
        default: {
          // 尝试从配置的 params 中读取
          controlValue = (exp.control.params[metric.name] as number) ?? 0
          variantValue = (exp.variant.params[metric.name] as number) ?? 0
        }
      }

      const improvement = controlValue > 0
        ? ((variantValue - controlValue) / controlValue) * 100
        : variantValue > 0 ? 100 : 0

      const totalExposures = snapshot.controlExposures + snapshot.variantExposures
      const significant = totalExposures >= (exp.minSampleSize ?? DEFAULT_AB_TEST_MIN_SAMPLE)

      return {
        ...metric,
        controlValue,
        variantValue,
        improvement,
        significant,
      }
    })
  }

  private determineWinner(
    exp: ABTestConfig,
    snapshot: ABTestSnapshot,
    metrics: ABTestMetric[],
  ): ABTestWinner {
    const totalExposures = snapshot.controlExposures + snapshot.variantExposures
    if (totalExposures < (exp.minSampleSize ?? DEFAULT_AB_TEST_MIN_SAMPLE)) {
      return 'insufficient-data'
    }

    // 计算加权综合评分
    let controlScore = 0
    let variantScore = 0

    for (const m of metrics) {
      if (m.controlValue == null || m.variantValue == null) continue
      const diff = m.variantValue - m.controlValue
      if (m.higherIsBetter) {
        controlScore += m.controlValue * m.weight
        variantScore += m.variantValue * m.weight
      } else {
        controlScore += (1 - m.controlValue) * m.weight
        variantScore += (1 - m.variantValue) * m.weight
      }
    }

    // 判断显著性差异 (至少 5%)
    const improvement = controlScore > 0
      ? (variantScore - controlScore) / controlScore
      : variantScore > 0 ? 1 : 0

    if (Math.abs(improvement) < 0.01) return 'tie'

    // 更新推荐参数
    if (variantScore > controlScore) {
      this.updateExperiment({
        ...exp,
        experimentId: exp.experimentId,
        control: { label: exp.variant.label, params: exp.variant.params },
      } as unknown as ABTestConfig)
      return 'variant'
    }

    return 'control'
  }

  /**
   * 获取优胜参数 (用于自动调优)
   */
  getRecommendedParams(experimentId: string): Record<string, unknown> | undefined {
    const snapshot = this.snapshots.get(experimentId)
    if (snapshot && snapshot.winner !== 'insufficient-data') {
      return snapshot.recommendedParams
    }
    const exp = this.experiments.get(experimentId)
    return exp?.control.params
  }

  /**
   * 导出全量实验结果
   */
  exportAllResults(): ABTestSnapshot[] {
    return Array.from(this.experiments.keys())
      .map(id => this.analyzeResults(id))
      .filter((s): s is ABTestSnapshot => s != null)
  }

  /**
   * 重置实验数据
   */
  resetExperiment(experimentId: string): void {
    this.snapshots.delete(experimentId)
    for (const [, memberMap] of this.memberAssignments) {
      memberMap.delete(experimentId)
    }
  }

  /**
   * 完全重置
   */
  reset(): void {
    this.experiments.clear()
    this.snapshots.clear()
    this.memberAssignments.clear()
  }
}

// ============================================================
// A/B 测试推广策略 (实现 IPromotionStrategy)
// ============================================================

export function toPromotionContext(context: PromotionContext): PromotionContext {
  return context
}

@Injectable()
export class ABTestOptimizedStrategy extends BasePromotionStrategy {
  readonly type = 'ab-test-optimized' as const
  readonly name = 'A/B测试自动调优'
  readonly priority = 50

  constructor(
    private readonly manager: ABTestManager,
  ) {
    super()
  }

  isApplicable(context: PromotionContext): boolean {
    // 需要用户已登录且关联的实验正在运行
    if (!context.memberId) return false
    const running = this.manager.getRunningExperiments()
    return running.length > 0
  }

  apply(
    candidates: Candidate[],
    context: PromotionContext,
  ): PromotionCandidate[] {
    const experiments = this.manager.getRunningExperiments()
    if (experiments.length === 0 || !context.memberId) {
      return candidates.map(c => ({
        itemId: c.itemId,
        score: c.score,
        baseScore: c.score,
        boostedScore: 0,
        strategy: this.type,
        reasoning: c.reasoning,
        metadata: c.metadata,
      }))
    }

    const results: PromotionCandidate[] = []

    for (const candidate of candidates) {
      let adjustedScore = candidate.score

      for (const exp of experiments) {
        const group = this.manager.assignGroup(context.memberId, exp.experimentId)
        // 记录曝光
        this.manager.recordExposure(exp.experimentId, context.memberId, group, 1)

        const params = group === 'variant' ? exp.variant.params : exp.control.params

        // 应用参数调整
        if (typeof params.scoreBoost === 'number') {
          adjustedScore *= params.scoreBoost
        }
        if (typeof params.categoryBoostFactor === 'number' && context.itemCategory) {
          adjustedScore *= params.categoryBoostFactor
        }
      }

      const boostFactor = adjustedScore / (candidate.score || 1)
      const pc = this.toPromotionCandidate(
        candidate,
        this.type,
        'A/B 测试调优推荐',
        Math.min(2, boostFactor),
        { abExperimentsApplied: experiments.length },
      )

      if (adjustedScore !== candidate.score) {
        pc.score = Math.min(1, adjustedScore)
        pc.boostedScore = adjustedScore - candidate.score
      }

      results.push(pc)
    }

    return results.sort((a, b) => b.score - a.score)
  }
}
