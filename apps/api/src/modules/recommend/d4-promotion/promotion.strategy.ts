/**
 * V18 Day2 D4: Promotion Strategy 基类与工厂
 *
 * 策略模式: 不同推广策略继承 BasePromotionStrategy
 * - ab-test-optimized: 基于 A/B 测试规则的自动调优
 * - time-boosted: 时段/节假日增强
 * - cross-store-synergy: 跨店协同
 * - holiday-special: 节假日特别推广
 * - event-flash: 闪购事件推广
 */

import { Injectable } from '@nestjs/common'
import type { Candidate } from '../recommend.entity'
import type {
  PromotionStrategyType,
  PromotionContext,
  PromotionCandidate,
  PromotionResult,
} from './promotion.entity'

// ============================================================
// 推广策略基类
// ============================================================

export interface IPromotionStrategy {
  readonly type: PromotionStrategyType
  readonly name: string
  readonly priority: number       // 0-100, 高者先执行

  /**
   * 检测当前上下文是否适用本策略
   */
  isApplicable(context: PromotionContext): boolean

  /**
   * 执行推广增强
   * @param candidates 原始推荐候选
   * @param context 推广上下文
   * @returns 推广增强后的候选
   */
  apply(
    candidates: Candidate[],
    context: PromotionContext,
  ): PromotionCandidate[]
}

export abstract class BasePromotionStrategy implements IPromotionStrategy {
  abstract readonly type: PromotionStrategyType
  abstract readonly name: string
  abstract readonly priority: number

  abstract isApplicable(context: PromotionContext): boolean

  abstract apply(
    candidates: Candidate[],
    context: PromotionContext,
  ): PromotionCandidate[]

  /**
   * 将 Candidate 转为 PromotionCandidate (保留基础分值)
   */
  protected toPromotionCandidate(
    candidate: Candidate,
    strategy: PromotionStrategyType,
    reasoning: string,
    boostFactor: number,
    extraMetadata?: Record<string, unknown>,
  ): PromotionCandidate {
    const baseScore = candidate.score
    const boostedScore = candidate.score * boostFactor
    return {
      itemId: candidate.itemId,
      score: Math.min(1, boostedScore),  // cap at 1.0
      baseScore,
      boostedScore,
      strategy,
      reasoning: `${reasoning} (增强 ${Math.round((boostFactor - 1) * 100)}%)`,
      metadata: {
        ...(candidate.metadata ?? {}),
        ...extraMetadata,
        boostFactor,
        originalReasoning: candidate.reasoning,
      },
    }
  }

  /**
   * 安全裁剪分数至 [0, 1]
   */
  protected capScore(score: number): number {
    return Math.max(0, Math.min(1, score))
  }
}

// ============================================================
// 空策略 (什么都不做)
// ============================================================

export class NoOpPromotionStrategy extends BasePromotionStrategy {
  readonly type: PromotionStrategyType = 'ab-test-optimized'
  readonly name = 'noop'
  readonly priority = 0

  isApplicable(_context: PromotionContext): boolean {
    return false
  }

  apply(
    candidates: Candidate[],
    _context: PromotionContext,
  ): PromotionCandidate[] {
    return candidates.map(c => ({
      itemId: c.itemId,
      score: c.score,
      baseScore: c.score,
      boostedScore: 0,
      strategy: 'ab-test-optimized',
      reasoning: c.reasoning,
      metadata: c.metadata,
    }))
  }
}

// ============================================================
// 策略工厂
// ============================================================

@Injectable()
export class PromotionStrategyFactory {
  private strategies: Map<PromotionStrategyType, IPromotionStrategy> = new Map()

  constructor() {
    // 策略由外部注册
  }

  /**
   * 注册策略
   */
  register(strategy: IPromotionStrategy): void {
    this.strategies.set(strategy.type, strategy)
  }

  /**
   * 批量注册
   */
  registerAll(strategies: IPromotionStrategy[]): void {
    for (const s of strategies) {
      this.register(s)
    }
  }

  /**
   * 获取指定类型策略
   */
  get(type: PromotionStrategyType): IPromotionStrategy | undefined {
    return this.strategies.get(type)
  }

  /**
   * 获取所有已注册策略
   */
  getAll(): IPromotionStrategy[] {
    return Array.from(this.strategies.values())
  }

  /**
   * 获取适用于当前上下文的所有策略 (按优先级排序)
   */
  getApplicable(context: PromotionContext): IPromotionStrategy[] {
    return this.getAll()
      .filter(s => s.isApplicable(context))
      .sort((a, b) => b.priority - a.priority)
  }

  /**
   * 获取策略类型集合
   */
  getRegisteredTypes(): PromotionStrategyType[] {
    return Array.from(this.strategies.keys())
  }

  /**
   * 清除所有策略
   */
  clear(): void {
    this.strategies.clear()
  }
}

// ============================================================
// 推广执行器
// ============================================================

@Injectable()
export class PromotionExecutor {
  constructor(
    private readonly factory: PromotionStrategyFactory,
  ) {}

  /**
   * 执行全链路推广增强
   */
  execute(
    candidates: Candidate[],
    context: PromotionContext,
  ): PromotionResult {
    const startTime = Date.now()
    const strategies = this.factory.getApplicable(context)

    if (strategies.length === 0) {
      return {
        promotedCandidates: candidates.map(c => ({
          itemId: c.itemId,
          score: c.score,
          baseScore: c.score,
          boostedScore: 0,
          strategy: 'ab-test-optimized',
          reasoning: c.reasoning,
          metadata: c.metadata,
        })),
        totalBaseScore: candidates.reduce((s, c) => s + c.score, 0),
        totalBoostedScore: candidates.reduce((s, c) => s + c.score, 0),
        boostCount: 0,
        strategiesUsed: [],
        abTestApplied: false,
        timeWindowApplied: false,
        crossStoreApplied: false,
        executionMs: Date.now() - startTime,
        generatedAt: new Date().toISOString(),
      }
    }

    // 按优先级依次应用策略 (后执行的可能会覆盖先执行的项)
    let promotedCandidates: PromotionCandidate[] = candidates.map(c => ({
      itemId: c.itemId,
      score: c.score,
      baseScore: c.score,
      boostedScore: 0,
      strategy: 'ab-test-optimized',
      reasoning: c.reasoning,
      metadata: c.metadata,
    }))

    const strategiesUsed: PromotionStrategyType[] = []

    for (const strategy of strategies) {
      const result = strategy.apply(candidates, context)
      // 合并策略结果: 新结果覆盖旧结果
      const mergedMap = new Map<string, PromotionCandidate>()
      for (const pc of promotedCandidates) {
        mergedMap.set(pc.itemId, pc)
      }
      for (const pc of result) {
        mergedMap.set(pc.itemId, pc)
      }
      promotedCandidates = Array.from(mergedMap.values())
        .sort((a, b) => b.score - a.score)
      strategiesUsed.push(strategy.type)
    }

    const totalBaseScore = promotedCandidates.reduce((s, c) => s + c.baseScore, 0)
    const totalBoostedScore = promotedCandidates.reduce((s, c) => s + c.score, 0)
    const boostCount = promotedCandidates.filter(c => c.boostedScore > 0).length

    return {
      promotedCandidates,
      totalBaseScore,
      totalBoostedScore,
      boostCount,
      strategiesUsed,
      abTestApplied: strategiesUsed.includes('ab-test-optimized'),
      timeWindowApplied: strategiesUsed.includes('time-boosted'),
      crossStoreApplied: strategiesUsed.includes('cross-store-synergy'),
      executionMs: Date.now() - startTime,
      generatedAt: new Date().toISOString(),
    }
  }
}
