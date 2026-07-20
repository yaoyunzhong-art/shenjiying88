import {
  Controller,
  Post,
  Get,
  Query,
  Body,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common'
import { DemandForecastService, InventoryOptimizer, TransferRecommendationService } from './ai-forecast.service'
import {
  ForecastQueryDto,
  CategoryForecastQueryDto,
  OptimalStockQueryDto,
  ReorderQueryDto,
  SlowMovingQueryDto,
  TransferQueryDto,
  TransferBenefitQueryDto,
  GlobalAllocationDto,
  PromotionAdjustDto
} from './ai-forecast.dto'
import type {
  SalesForecast,
  CategoryForecast,
  SeasonalityFactor,
  OptimalStock,
  ReorderSuggestion,
  SlowMovingProduct,
  TransferRecommendation,
  GlobalAllocation
} from './ai-forecast.entity'
import { TenantGuard } from '../agent/tenant.guard'

@Controller('ai-forecast')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
@UseGuards(TenantGuard)
export class AiForecastController {
  constructor(
    private readonly demandForecastService: DemandForecastService,
    private readonly inventoryOptimizer: InventoryOptimizer,
    private readonly transferRecommendationService: TransferRecommendationService
  ) {}

  // ===== 销量预测 =====

  /** 单产品销量预测 */
  @Get('forecast/sales')
  forecastSales(@Query() query: ForecastQueryDto): SalesForecast {
    return this.demandForecastService.forecastSales(query.productId, query.daysAhead)
  }

  /** 品类销量预测 */
  @Get('forecast/category')
  forecastCategory(@Query() query: CategoryForecastQueryDto): CategoryForecast {
    return this.demandForecastService.forecastByCategory(query.categoryId, query.daysAhead)
  }

  /** 获取季节性因子 */
  @Get('seasonality')
  getSeasonality(@Query('productId') productId: string): SeasonalityFactor {
    return this.demandForecastService.getSeasonality(productId)
  }

  /** 促销调整后的销量预测 */
  @Post('forecast/adjust-promotions')
  adjustForPromotions(@Body() dto: PromotionAdjustDto): SalesForecast {
    const base = this.demandForecastService.forecastSales(dto.productId, dto.daysAhead)
    return this.demandForecastService.adjustForPromotions(base, dto.promotions)
  }

  // ===== 库存优化 =====

  /** 计算最优库存 */
  @Get('inventory/optimal-stock')
  calculateOptimalStock(@Query() query: OptimalStockQueryDto): OptimalStock {
    const forecast = this.demandForecastService.forecastSales(query.productId, query.daysAhead)
    return this.inventoryOptimizer.calculateOptimalStock(query.productId, forecast, query.leadTime)
  }

  /** 补货建议 */
  @Get('inventory/reorder')
  suggestReorder(@Query() query: ReorderQueryDto): ReorderSuggestion {
    return this.inventoryOptimizer.suggestReorder(query.productId)
  }

  /** 滞销品检测 */
  @Get('inventory/slow-moving')
  detectSlowMoving(@Query() query: SlowMovingQueryDto): SlowMovingProduct {
    return this.inventoryOptimizer.detectSlowMoving(query.productId, query.thresholdDays ?? 30)
  }

  // ===== 调拨管理 =====

  /** 单对门店调拨建议 */
  @Get('transfer/suggest')
  suggestTransfer(@Query() query: TransferQueryDto): TransferRecommendation | null {
    return this.transferRecommendationService.suggestTransfer(query.fromStore, query.toStore, query.productId)
  }

  /** 调拨收益计算 */
  @Get('transfer/benefit')
  calculateTransferBenefit(@Query() query: TransferBenefitQueryDto): { cost: import('./ai-forecast.entity').TransferCost; totalSavings: number } {
    return this.transferRecommendationService.calculateTransferBenefit(query.fromStore, query.toStore, query.productId)
  }

  /** 全局最优分配 */
  @Post('transfer/optimize-global')
  optimizeGlobalAllocation(@Body() dto: GlobalAllocationDto): GlobalAllocation[] {
    return this.transferRecommendationService.optimizeGlobalAllocation(dto.products)
  }
}
