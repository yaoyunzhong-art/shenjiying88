/**
 * cost-tracker.service.ts · LLM 成本追踪服务 (Phase-19)
 *
 * 设计依据:
 *   - debt.md TD-001 (LLM API 成本控制)
 *   - knowledge/decision-records/DR-005-rag-architecture.md
 *
 * 核心职责:
 *   1. 月度预算追踪 (硬上限 / 软上限 / 预警阈值)
 *   2. Token 计数 + 成本累加
 *   3. Prompt 缓存 (Redis, 命中率 ≥60% 目标)
 *   4. 使用量报表 (按 provider / model / intent)
 *
 * 落地策略:
 *   - 内存版 (Phase-19, 单元测试)
 *   - Redis 版 (Phase-21, 持久化)
 *   - PostgreSQL 版 (Phase-22, 历史报表)
 */

import { Inject, Injectable, Logger, Optional } from '@nestjs/common'
import { ConfigType } from '@nestjs/config'
import { llmConfig } from './llm.config'
import {
  BudgetExceededError,
  type LlmProvider,
  type UsageMetrics,
  type LLMRequest,
  type LLMResponse,
  type MonthlyBudget,
} from './types'

// ─── 内存版 Storage ────────────────────────────────────────────────────

export interface CostStorage {
  /** 获取月度累计成本 */
  getMonthlyCost(monthKey: string): number
  /** 增加月度累计成本 */
  incrementMonthlyCost(monthKey: string, deltaUsd: number): number
  /** 获取 prompt 缓存命中次数 */
  getCacheHit(cacheKey: string): { hit: boolean; response?: LLMResponse }
  /** 设置 prompt 缓存 */
  setCache(cacheKey: string, response: LLMResponse, ttlSeconds: number): void
  /** 重置 (测试用) */
  reset(): void
}

/**
 * 内存版存储 (单进程,适合 Phase-19 skeleton)
 */
export class InMemoryCostStorage implements CostStorage {
  private monthlyCosts = new Map<string, number>()
  private cache = new Map<string, { response: LLMResponse; expiresAt: number }>()

  getMonthlyCost(monthKey: string): number {
    return this.monthlyCosts.get(monthKey) ?? 0
  }

  incrementMonthlyCost(monthKey: string, deltaUsd: number): number {
    const current = this.getMonthlyCost(monthKey)
    const next = current + deltaUsd
    this.monthlyCosts.set(monthKey, next)
    return next
  }

  getCacheHit(cacheKey: string): { hit: boolean; response?: LLMResponse } {
    const entry = this.cache.get(cacheKey)
    if (!entry) return { hit: false }
    if (entry.expiresAt < Date.now()) {
      this.cache.delete(cacheKey)
      return { hit: false }
    }
    return { hit: true, response: entry.response }
  }

  setCache(cacheKey: string, response: LLMResponse, ttlSeconds: number): void {
    this.cache.set(cacheKey, {
      response,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  reset(): void {
    this.monthlyCosts.clear()
    this.cache.clear()
  }

  /** 调试用: 当前缓存条目数 */
  get cacheSize(): number {
    return this.cache.size
  }

  /** 调试用: 当前所有月份键 */
  get monthKeys(): string[] {
    return [...this.monthlyCosts.keys()]
  }
}

// ─── CostTracker 主类 ──────────────────────────────────────────────────

@Injectable()
export class CostTrackerService {
  private readonly logger = new Logger(CostTrackerService.name)
  private readonly storage: CostStorage

  /** 月度预算配置 */
  private readonly budget: MonthlyBudget

  constructor(
    @Inject(llmConfig.KEY) private readonly cfg: ConfigType<typeof llmConfig>,
    @Optional() storage?: CostStorage
  ) {
    this.storage = storage ?? new InMemoryCostStorage()
    this.budget = {
      hardLimitUsd: cfg.monthlyHardLimitUsd,
      softLimitUsd: cfg.monthlySoftLimitUsd,
      alertThreshold: cfg.alertThreshold,
      enablePromptCache: cfg.enablePromptCache,
      fallbackProvider: 'openai',
    }
    this.logger.debug(
      `CostTracker initialized: hard=$${this.budget.hardLimitUsd} soft=$${this.budget.softLimitUsd} cache=${this.budget.enablePromptCache}`
    )
  }

  // ─── 月度预算 ──────────────────────────────────────────────────────

  /**
   * 当前月份 key (YYYY-MM)
   */
  currentMonthKey(): string {
    const now = new Date()
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
  }

  /**
   * 当前月份累计成本 (USD)
   */
  currentMonthCost(): number {
    return this.storage.getMonthlyCost(this.currentMonthKey())
  }

  /**
   * 检查是否可继续调用 (预算闸门)
   *
   * @throws BudgetExceededError 超过硬上限
   * @returns true 可继续 / false 已达软上限 (调用方应切换 fallback)
   */
  checkBudget(provider: LlmProvider): { allowed: boolean; reason?: string; fallback?: LlmProvider } {
    const cost = this.currentMonthCost()
    const hard = this.budget.hardLimitUsd
    const soft = this.budget.softLimitUsd
    const threshold = this.budget.alertThreshold * hard

    if (cost >= hard) {
      throw new BudgetExceededError(cost, hard)
    }

    if (cost >= soft) {
      // 已达软上限 → 强制 fallback
      this.logger.warn(
        `[CostTracker] soft limit hit: $${cost.toFixed(2)}/$${soft}, falling back from ${provider} to ${this.budget.fallbackProvider}`
      )
      return { allowed: false, reason: 'soft-limit-hit', fallback: this.budget.fallbackProvider }
    }

    if (cost >= threshold) {
      // 预警阈值
      this.logger.warn(
        `[CostTracker] alert threshold hit: $${cost.toFixed(2)}/$${threshold.toFixed(2)} (${(this.budget.alertThreshold * 100).toFixed(0)}%)`
      )
    }

    return { allowed: true }
  }

  // ─── Token 计量 ────────────────────────────────────────────────────

  /**
   * 记录一次 LLM 调用的成本
   *
   * 注意: 仅记录实际产生的成本 (cache hit 不计)
   */
  recordUsage(usage: UsageMetrics): { monthlyCost: number } {
    const monthKey = this.currentMonthKey()
    const monthlyCost = this.storage.incrementMonthlyCost(monthKey, usage.costUsd)
    this.logger.log(
      `[CostTracker] usage: ${usage.provider}/${usage.model} ` +
        `in=${usage.inputTokens} out=${usage.outputTokens} cost=$${usage.costUsd.toFixed(4)} ` +
        `monthly=$${monthlyCost.toFixed(2)}/$${this.budget.hardLimitUsd}`
    )
    return { monthlyCost }
  }

  // ─── Prompt 缓存 ──────────────────────────────────────────────────

  /**
   * 检查缓存命中
   */
  checkCache(request: LLMRequest): { hit: boolean; response?: LLMResponse } {
    if (!this.budget.enablePromptCache || !request.cacheKey) {
      return { hit: false }
    }
    return this.storage.getCacheHit(request.cacheKey)
  }

  /**
   * 写入缓存
   */
  setCache(request: LLMRequest, response: LLMResponse): void {
    if (!this.budget.enablePromptCache || !request.cacheKey) {
      return
    }
    // 仅缓存成功响应
    if (response.finishReason === 'error') return
    this.storage.setCache(request.cacheKey, response, this.cfg.cacheTtlSeconds)
  }

  /**
   * 计算缓存命中率 (供监控)
   */
  cacheHitRate(): number {
    // 当前内存版未统计 hit/miss 总数,Phase-21 接入 Redis 后实现
    return 0
  }

  // ─── 报表 ──────────────────────────────────────────────────────────

  /**
   * 月度使用量快照 (供监控 + 报表)
   */
  snapshot(): {
    monthKey: string
    costUsd: number
    hardLimitUsd: number
    softLimitUsd: number
    utilizationPct: number
    overSoftLimit: boolean
    overHardLimit: boolean
    cacheSize: number
  } {
    const cost = this.currentMonthCost()
    const inMem = this.storage as InMemoryCostStorage
    return {
      monthKey: this.currentMonthKey(),
      costUsd: cost,
      hardLimitUsd: this.budget.hardLimitUsd,
      softLimitUsd: this.budget.softLimitUsd,
      utilizationPct: (cost / this.budget.hardLimitUsd) * 100,
      overSoftLimit: cost >= this.budget.softLimitUsd,
      overHardLimit: cost >= this.budget.hardLimitUsd,
      cacheSize: inMem.cacheSize ?? 0,
    }
  }
}
