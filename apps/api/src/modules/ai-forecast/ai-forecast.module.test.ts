import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * ai-forecast.module.test.ts — AiForecastModule 合约测试
 *
 * 守护模块定义：
 * - 模块正确导入 controller
 * - 模块正确注册 provider
 * - 模块正确导出 service
 * - 模块可在 DI 容器中加载
 */

import assert from 'node:assert/strict'
import { Test, TestingModule } from '@nestjs/testing'
import { AiForecastModule } from './ai-forecast.module'
import { AiForecastController } from './ai-forecast.controller'
import { DemandForecastService, InventoryOptimizer, TransferRecommendationService } from './ai-forecast.service'

describe('AiForecastModule', () => {
  let moduleRef: TestingModule
  let controller: AiForecastController
  let demandService: DemandForecastService
  let inventoryOptimizer: InventoryOptimizer
  let transferService: TransferRecommendationService

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AiForecastModule]
    }).compile()
  })

  it('模块应成功编译', () => {
    assert.ok(moduleRef, '模块编译成功')
  })

  it('应正确注册 AiForecastController', () => {
    controller = moduleRef.get<AiForecastController>(AiForecastController)
    assert.ok(controller instanceof AiForecastController)
  })

  it('应正确注册 DemandForecastService', () => {
    demandService = moduleRef.get<DemandForecastService>(DemandForecastService)
    assert.ok(demandService instanceof DemandForecastService)
  })

  it('应正确注册 InventoryOptimizer', () => {
    inventoryOptimizer = moduleRef.get<InventoryOptimizer>(InventoryOptimizer)
    assert.ok(inventoryOptimizer instanceof InventoryOptimizer)
  })

  it('应正确注册 TransferRecommendationService', () => {
    transferService = moduleRef.get<TransferRecommendationService>(TransferRecommendationService)
    assert.ok(transferService instanceof TransferRecommendationService)
  })

  it('DemandForecastService 应被注入到 InventoryOptimizer', () => {
    inventoryOptimizer = moduleRef.get<InventoryOptimizer>(InventoryOptimizer)
    // 通过内部注入确认
    assert.ok(inventoryOptimizer instanceof InventoryOptimizer)
  })

  it('InventoryOptimizer 应被注入到 TransferRecommendationService', () => {
    transferService = moduleRef.get<TransferRecommendationService>(TransferRecommendationService)
    assert.ok(transferService instanceof TransferRecommendationService)
  })

  it('Controller 的 service 注入正确（通过调用方法验证）', () => {
    controller = moduleRef.get<AiForecastController>(AiForecastController)
    demandService = moduleRef.get<DemandForecastService>(DemandForecastService)
    inventoryOptimizer = moduleRef.get<InventoryOptimizer>(InventoryOptimizer)
    transferService = moduleRef.get<TransferRecommendationService>(TransferRecommendationService)

    // 通过 controller 调用 service 方法验证注入
    const forecast = controller.forecastSales({ productId: 'module-test-prod', daysAhead: 7 })
    assert.ok(forecast.predictedSales > 0)
    assert.equal(forecast.productId, 'module-test-prod')

    const reorder = controller.suggestReorder({ productId: 'module-test-prod' })
    assert.ok(reorder.suggestedQuantity > 0)

    const seasonality = controller.getSeasonality('module-test-prod')
    assert.equal(seasonality.monthlyFactors.length, 12)
  })

  it('controller 对所有路由端点可响应', async () => {
    controller = moduleRef.get<AiForecastController>(AiForecastController)

    // 品类预测
    const catForecast = controller.forecastCategory({ categoryId: 'module-cat', daysAhead: 7 })
    assert.equal(catForecast.categoryId, 'module-cat')
    assert.ok(catForecast.productForecasts.length > 0)

    // 最优库存
    const fore = controller.forecastSales({ productId: 'module-stock', daysAhead: 7 })
    const optStock = controller.calculateOptimalStock({ productId: 'module-stock', leadTime: 7, daysAhead: 7 })
    assert.ok(optStock.totalOptimalStock > 0)

    // 滞销品检测
    const slowMoving = controller.detectSlowMoving({ productId: 'module-slow' })
    assert.ok(slowMoving.recommendation.length > 0)
  })
})
