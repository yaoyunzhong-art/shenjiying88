/**
 * V18 Day2 D4: D4PromotionService (推广引擎主服务)
 *
 * 整合三大推广组件:
 *  - A/B 测试自动调优 (ABTestManager + ABTestOptimizedStrategy)
 *  - 时段/节假日增强 (TimeBasedBoosterStrategy)
 *  - 跨店协同 (CrossStoreSynergyStrategy)
 *
 * 使用 PromotionStrategyFactory 注册策略
 * 使用 PromotionExecutor 执行全链路增强
 */

import { Injectable } from '@nestjs/common'
import type { Candidate, StrategyType } from '../recommend.entity'
import type {
  PromotionContext,
  PromotionResult,
  PromotionStrategyType,
  TimeWindow,
  HolidayDefinition,
  CrossStoreConfig,
  CrossStoreProduct,
} from './promotion.entity'
import {
  DEFAULT_TIME_WINDOWS,
  DEFAULT_HOLIDAYS,
} from './promotion.entity'
import {
  PromotionStrategyFactory,
  PromotionExecutor,
} from './promotion.strategy'
import {
  ABTestManager,
  ABTestOptimizedStrategy,
} from './ab-test.controller'
import {
  TimeAnalyzer,
  TimeBasedBoosterStrategy,
} from './time-based.booster'
import {
  CrossStoreRegistry,
  CrossStoreCatalog,
  CrossStoreAnalyzer,
  CrossStoreSynergyStrategy,
} from './cross-store.synergy'

@Injectable()
export class D4PromotionService {
  private initialized = false

  constructor(
    private readonly factory: PromotionStrategyFactory,
    private readonly executor: PromotionExecutor,
    private readonly abTestManager: ABTestManager,
    private readonly abTestStrategy: ABTestOptimizedStrategy,
    private readonly timeAnalyzer: TimeAnalyzer,
    private readonly timeStrategy: TimeBasedBoosterStrategy,
    private readonly crossStoreRegistry: CrossStoreRegistry,
    private readonly crossStoreCatalog: CrossStoreCatalog,
    private readonly crossStoreAnalyzer: CrossStoreAnalyzer,
    private readonly crossStoreStrategy: CrossStoreSynergyStrategy,
  ) {
    this.initializeStrategies()
  }

  // ============================================================
  // 初始化
  // ============================================================

  private initializeStrategies(): void {
    if (this.initialized) return

    this.factory.registerAll([
      this.abTestStrategy,
      this.timeStrategy,
      this.crossStoreStrategy,
    ])

    this.initialized = true
  }

  /**
   * 重置 (测试用)
   */
  reset(): void {
    this.factory.clear()
    this.abTestManager.reset()
    this.crossStoreRegistry.reset()
    this.crossStoreCatalog.reset()
    this.initialized = false
  }

  // ============================================================
  // 主推广入口
  // ============================================================

  /**
   * 执行全链路推广增强
   */
  promote(
    candidates: Candidate[],
    context: PromotionContext,
  ): PromotionResult {
    return this.executor.execute(candidates, context)
  }

  /**
   * 推广增强 + 分析摘要
   */
  promoteWithAnalysis(
    candidates: Candidate[],
    context: PromotionContext,
  ): {
    result: PromotionResult
    analysis: {
      applicableStrategies: PromotionStrategyType[]
      timeBoostDetail: string | null
      crossStoreDetail: string | null
      abTestExperiments: number
      recommendations: string[]
    }
  } {
    const result = this.executor.execute(candidates, context)
    const applicableStrategies = this.factory
      .getApplicable(context)
      .map(s => s.type)

    const timeDetail = result.timeWindowApplied
      ? '时段增强已应用'
      : null

    const crossDetail = result.crossStoreApplied
      ? '跨店协同已应用'
      : null

    const recommendations: string[] = []
    if (result.promotedCandidates.length > 0) {
      recommendations.push(...result.promotedCandidates
        .filter(c => c.boostedScore > 0)
        .slice(0, 3)
        .map(c => `${c.itemId}: ${c.reasoning}`))
    }

    return {
      result,
      analysis: {
        applicableStrategies,
        timeBoostDetail: timeDetail,
        crossStoreDetail: crossDetail,
        abTestExperiments: this.abTestManager.getRunningExperiments().length,
        recommendations,
      },
    }
  }

  // ============================================================
  // A/B 测试代理
  // ============================================================

  getABTestManager(): ABTestManager {
    return this.abTestManager
  }

  // ============================================================
  // 时段增强代理
  // ============================================================

  getTimeWindows(): TimeWindow[] {
    return this.timeStrategy.getTimeWindowInfo()
  }

  getHolidays(): HolidayDefinition[] {
    return this.timeStrategy.getHolidayInfo()
  }

  analyzeCurrentTime(context: PromotionContext) {
    return this.timeStrategy.analyzeCurrentTime(context)
  }

  addCustomTimeWindow(window: TimeWindow): void {
    this.timeStrategy.addTimeWindow(window)
  }

  addCustomHoliday(holiday: HolidayDefinition): void {
    this.timeStrategy.addHoliday(holiday)
  }

  // ============================================================
  // 跨店协同代理
  // ============================================================

  getCrossStoreRegistry(): CrossStoreRegistry {
    return this.crossStoreRegistry
  }

  getCrossStoreCatalog(): CrossStoreCatalog {
    return this.crossStoreCatalog
  }

  getCrossStoreAnalyzer(): CrossStoreAnalyzer {
    return this.crossStoreAnalyzer
  }

  registerStore(config: CrossStoreConfig): void {
    this.crossStoreRegistry.registerStore(config)
  }

  registerStoreProducts(storeId: string, products: CrossStoreProduct[]): void {
    this.crossStoreCatalog.seedProducts(storeId, products.map(p => ({
      itemId: p.itemId,
      itemName: p.itemName,
      storeId: storeId,
      priceCents: p.priceCents,
      available: p.available,
      category: p.category,
      soldCount: 0,
    })))
  }

  // ============================================================
  // 统计
  // ============================================================

  getStatus(): {
    strategiesRegistered: number
    experimentsRunning: number
    storesRegistered: number
    crossProductsAvailable: number
    holidays: number
  } {
    return {
      strategiesRegistered: this.factory.getAll().length,
      experimentsRunning: this.abTestManager.getRunningExperiments().length,
      storesRegistered: this.crossStoreRegistry.getAllStores().length,
      crossProductsAvailable: this.crossStoreCatalog.totalProductCount(),
      holidays: this.timeStrategy.getHolidayInfo().length,
    }
  }
}
