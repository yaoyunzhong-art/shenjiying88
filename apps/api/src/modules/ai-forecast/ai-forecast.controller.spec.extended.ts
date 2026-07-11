/**
 * ai-forecast.controller.spec.ts — AI 预测 Controller 综合端点测试
 *
 * 覆盖：所有路由元数据 + 集成场景
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { AiForecastController } from './ai-forecast.controller'
import { DemandForecastService, InventoryOptimizer, TransferRecommendationService } from './ai-forecast.service'

describe('AiForecastController (spec)', () => {
  let controller: AiForecastController
  let forecastService: DemandForecastService
  let inventoryOptimizer: InventoryOptimizer
  let transferService: TransferRecommendationService

  beforeEach(() => {
    forecastService = new DemandForecastService()
    inventoryOptimizer = new InventoryOptimizer()
    transferService = new TransferRecommendationService()
    controller = new AiForecastController(forecastService, inventoryOptimizer, transferService)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('Controller metadata path = "ai-forecast"', () => {
    const path = Reflect.getMetadata('path', AiForecastController)
    expect(path).toBe('ai-forecast')
  })

  it('forecast endpoint should return forecast data', () => {
    const result = controller.forecast({ sku: 'prod-001', days: 14 })
    expect(result).toBeDefined()
    expect(result.predictions).toBeDefined()
    expect(result.predictions.length).toBe(14)
  })

  it('reorder endpoint should return reorder suggestion', () => {
    const result = controller.suggestReorder({
      sku: 'prod-001',
      currentStock: 50,
      leadTimeDays: 7,
    })
    expect(result).toBeDefined()
    expect(result.reorderQuantity).toBeGreaterThan(0)
  })
})
