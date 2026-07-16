/**
 * V18 Day2 D4: D4PromotionService 集成测试
 *
 * 覆盖: 全链路集成 / 策略注册 / 各代理方法 / 状态查询
 */
import { describe, it, expect, beforeEach } from 'vitest'
import type { Candidate } from '../recommend.entity'
import type { PromotionContext, ABTestConfig, TimeWindow, HolidayDefinition, CrossStoreConfig } from './promotion.entity'
import {
  PromotionStrategyFactory,
  PromotionExecutor,
  NoOpPromotionStrategy,
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
import { D4PromotionService } from './d4-promotion.service'

describe('D4PromotionService', () => {
  let service: D4PromotionService
  let factory: PromotionStrategyFactory
  let executor: PromotionExecutor
  let abTestManager: ABTestManager
  let abTestStrategy: ABTestOptimizedStrategy
  let timeAnalyzer: TimeAnalyzer
  let timeStrategy: TimeBasedBoosterStrategy
  let crossStoreRegistry: CrossStoreRegistry
  let crossStoreCatalog: CrossStoreCatalog
  let crossStoreAnalyzer: CrossStoreAnalyzer
  let crossStoreStrategy: CrossStoreSynergyStrategy

  beforeEach(() => {
    factory = new PromotionStrategyFactory()
    executor = new PromotionExecutor(factory)
    abTestManager = new ABTestManager()
    abTestStrategy = new ABTestOptimizedStrategy(abTestManager)
    timeAnalyzer = new TimeAnalyzer()
    timeStrategy = new TimeBasedBoosterStrategy(timeAnalyzer)
    crossStoreRegistry = new CrossStoreRegistry()
    crossStoreCatalog = new CrossStoreCatalog()
    crossStoreAnalyzer = new CrossStoreAnalyzer(crossStoreRegistry, crossStoreCatalog)
    crossStoreStrategy = new CrossStoreSynergyStrategy(crossStoreAnalyzer)

    service = new D4PromotionService(
      factory,
      executor,
      abTestManager,
      abTestStrategy,
      timeAnalyzer,
      timeStrategy,
      crossStoreRegistry,
      crossStoreCatalog,
      crossStoreAnalyzer,
      crossStoreStrategy,
    )
  })

  const candidate = (id: string, score: number): Candidate => ({
    itemId: id,
    score,
    reasoning: 'test',
    strategy: 'popular',
  })

  // ============================================================
  // 初始化
  // ============================================================
  describe('initialization', () => {
    it('should register all three strategies', () => {
      const allTypes = factory.getRegisteredTypes()
      expect(allTypes).toContain('ab-test-optimized')
      expect(allTypes).toContain('time-boosted')
      expect(allTypes).toContain('cross-store-synergy')
    })

    it('should not re-initialize', () => {
      // 第二次构造不会重复注册
      const original = factory.getAll().length
      const s2 = new D4PromotionService(
        factory, executor, abTestManager, abTestStrategy,
        timeAnalyzer, timeStrategy, crossStoreRegistry, crossStoreCatalog,
        crossStoreAnalyzer, crossStoreStrategy,
      )
      expect(factory.getAll()).toHaveLength(original)
    })

    it('should reset cleanly', () => {
      service.reset()
      expect(factory.getAll()).toHaveLength(0)
    })
  })

  // ============================================================
  // promote 主方法
  // ============================================================
  describe('promote', () => {
    it('should promote with time window boost', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-20T08:00:00'), // Mon 早高峰
      }
      const candidates = [candidate('p1', 0.5)]
      const result = service.promote(candidates, context)
      expect(result.strategiesUsed).toContain('time-boosted')
      expect(result.timeWindowApplied).toBe(true)
      expect(result.promotedCandidates[0].score).toBeGreaterThan(0.5)
    })

    it('should apply cross-store synergy', () => {
      crossStoreRegistry.registerStore({
        storeId: 's1',
        storeName: '上海店',
        storeRegion: '华东',
        storeType: 'chain',
        parentStoreId: 'hq',
        inventorySharingEnabled: true,
        synergyWeight: 0.6,
      })
      crossStoreRegistry.registerStore({
        storeId: 'hq',
        storeName: '总部',
        storeRegion: '华东',
        storeType: 'headquarters',
        inventorySharingEnabled: true,
        synergyWeight: 0.8,
      })
      crossStoreCatalog.seedProducts('hq', [
        { itemId: 'hq-p1', itemName: 'HQ商品', storeId: 'hq', priceCents: 1000, available: true, category: '食品', soldCount: 100 },
      ])

      const context: PromotionContext = {
        tenantId: 't1',
        storeId: 's1',
        currentDateTime: new Date(),
      }
      const candidates = [candidate('p1', 0.5)]
      const result = service.promote(candidates, context)
      expect(result.crossStoreApplied).toBe(true)
      expect(result.promotedCandidates.length).toBeGreaterThan(1)
    })

    it('should not apply any promotion without context', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-20T03:00:00'), // no window
      }
      const candidates = [candidate('p1', 0.5)]
      const result = service.promote(candidates, context)
      expect(result.strategiesUsed).toHaveLength(0)
      expect(result.boostCount).toBe(0)
    })

    it('should handle empty candidates', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-20T08:00:00'),
      }
      const result = service.promote([], context)
      expect(result.promotedCandidates).toHaveLength(0)
      expect(result.boostCount).toBe(0)
    })

    it('should handle many candidates', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-20T08:00:00'),
      }
      const candidates = Array.from({ length: 50 }, (_, i) =>
        candidate(`p${i}`, Math.random())
      )
      const result = service.promote(candidates, context)
      expect(result.promotedCandidates).toHaveLength(50)
    })
  })

  // ============================================================
  // promoteWithAnalysis
  // ============================================================
  describe('promoteWithAnalysis', () => {
    it('should return analysis details', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-20T08:00:00'),
      }
      const candidates = [candidate('p1', 0.5)]
      const { result, analysis } = service.promoteWithAnalysis(candidates, context)
      expect(analysis.applicableStrategies).toContain('time-boosted')
      expect(analysis.timeBoostDetail).toBeTruthy()
      expect(result.promotedCandidates).toHaveLength(1)
    })

    it('should list ab test experiments count', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-20T03:00:00'),
      }
      const candidates = [candidate('p1', 0.5)]
      const { analysis } = service.promoteWithAnalysis(candidates, context)
      expect(typeof analysis.abTestExperiments).toBe('number')
    })
  })

  // ============================================================
  // 代理方法
  // ============================================================
  describe('proxy methods', () => {
    it('should get ABTestManager', () => {
      expect(service.getABTestManager()).toBe(abTestManager)
    })

    it('should get time windows', () => {
      const windows = service.getTimeWindows()
      expect(windows.length).toBeGreaterThan(0)
    })

    it('should get holidays', () => {
      const holidays = service.getHolidays()
      expect(holidays.length).toBeGreaterThan(0)
    })

    it('should analyze current time', () => {
      const context: PromotionContext = {
        tenantId: 't1',
        currentDateTime: new Date('2026-07-20T08:00:00'),
      }
      const analysis = service.analyzeCurrentTime(context)
      expect(analysis.windows.length).toBeGreaterThan(0)
    })

    it('should add custom time window', () => {
      service.addCustomTimeWindow({
        name: '测试窗口',
        type: 'special-event',
        priority: 5,
        boostFactor: 2.0,
        daysOfWeek: [1],
        startHour: 0,
        endHour: 24,
      })
      const windows = service.getTimeWindows()
      expect(windows.some(w => w.name === '测试窗口')).toBe(true)
    })

    it('should add custom holiday', () => {
      service.addCustomHoliday({
        name: '店庆日',
        date: '07-16',
        boostFactor: 3.0,
        priority: 10,
        description: '店庆大促',
      })
      const holidays = service.getHolidays()
      expect(holidays.some(h => h.name === '店庆日')).toBe(true)
    })

    it('should get cross store registry', () => {
      expect(service.getCrossStoreRegistry()).toBe(crossStoreRegistry)
    })

    it('should get cross store catalog', () => {
      expect(service.getCrossStoreCatalog()).toBe(crossStoreCatalog)
    })

    it('should get cross store analyzer', () => {
      expect(service.getCrossStoreAnalyzer()).toBe(crossStoreAnalyzer)
    })

    it('should register a store', () => {
      service.registerStore({
        storeId: 'test-store',
        storeName: '测试店',
        storeRegion: '华东',
        storeType: 'chain',
        inventorySharingEnabled: false,
        synergyWeight: 0.5,
      })
      expect(service.getCrossStoreRegistry().getStore('test-store')).toBeDefined()
    })

    it('should register store products', () => {
      service.getCrossStoreCatalog().seedProducts('s1', [
        { itemId: 'p1', itemName: 'Product 1', storeId: 's1', priceCents: 1000, available: true, category: '食品', soldCount: 0 },
      ])
      expect(service.getCrossStoreCatalog().totalProductCount()).toBeGreaterThan(0)
    })
  })

  // ============================================================
  // getStatus
  // ============================================================
  describe('getStatus', () => {
    it('should return status summary', () => {
      const status = service.getStatus()
      expect(status.strategiesRegistered).toBe(3)
      expect(status.experimentsRunning).toBe(0)
      expect(status.storesRegistered).toBe(0)
      expect(status.crossProductsAvailable).toBe(0)
      expect(status.holidays).toBeGreaterThan(0)
    })

    it('should reflect registered stores', () => {
      service.registerStore({
        storeId: 's1',
        storeName: 'Store 1',
        storeRegion: '华东',
        storeType: 'chain',
        inventorySharingEnabled: false,
        synergyWeight: 0.5,
      })
      const status = service.getStatus()
      expect(status.storesRegistered).toBe(1)
    })
  })
})
