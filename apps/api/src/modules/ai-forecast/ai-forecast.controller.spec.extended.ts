/**
 * ai-forecast.controller.spec.ts — AI 预测 Controller 综合端点测试
 *
 * 覆盖：所有路由元数据 + 集成场景
 */
import { describe, it, expect, beforeEach } from 'vitest'
import 'reflect-metadata'
import { AiForecastController } from './ai-forecast.controller'
import { DemandForecastService, InventoryOptimizer, TransferRecommendationService } from './ai-forecast.service'
import { ForecastQueryDto, ReorderQueryDto } from './ai-forecast.dto'

describe('AiForecastController (spec)', () => {
  let controller: AiForecastController
  let forecastService: DemandForecastService
  let inventoryOptimizer: InventoryOptimizer
  let transferService: TransferRecommendationService

  beforeEach(() => {
    forecastService = new DemandForecastService()
    inventoryOptimizer = new InventoryOptimizer(forecastService)
    transferService = new TransferRecommendationService(inventoryOptimizer)
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
    const query = new ForecastQueryDto()
    query.productId = 'prod-001'
    query.daysAhead = 14
    const result = controller.forecastSales(query)
    expect(result).toBeDefined()
    expect(result.daysAhead).toBe(14)
  })

  it('reorder endpoint should return reorder suggestion', () => {
    const query = new ReorderQueryDto()
    query.productId = 'prod-001'
    const result = controller.suggestReorder(query)
    expect(result).toBeDefined()
    expect(result.suggestedQuantity).toBeGreaterThan(0)
  })
})
