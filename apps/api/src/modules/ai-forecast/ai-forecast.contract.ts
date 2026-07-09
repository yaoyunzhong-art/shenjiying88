/**
 * 🐜 自动: [ai-forecast] [A] contract 补全
 *
 * AI Forecast：跨模块合约类型
 * 定义 ai-forecast 模块对外暴露的稳定合约接口，
 * 供其它模块（inventory, analytics, recommender 等）消费。
 */
import type {
  SalesForecast,
  CategoryForecast,
  SeasonalityFactor,
  OptimalStock,
  ReorderSuggestion,
  SlowMovingProduct,
  TransferRecommendation,
  GlobalAllocation,
  ForecastType,
  UrgencyLevel,
  PromotionType,
  ProductStatus,
} from './ai-forecast.entity'

// ─── 合约子集 ──────────────────────────────────────────────────────────

/**
 * 销量预测合约（跨模块安全子集）
 */
export interface SalesForecastContract {
  productId: string
  predictedSales: number
  unit: string
  confidence: number
  seasonalityFactor: number
}

/**
 * 品类预测合约（跨模块安全子集）
 */
export interface CategoryForecastContract {
  categoryId: string
  totalPredictedSales: number
  productForecasts: SalesForecastContract[]
  forecastDate: string
}

/**
 * 库存优化建议合约（跨模块安全子集）
 */
export interface OptimalStockContract {
  productId: string
  safetyStock: number
  totalOptimalStock: number
  reorderPoint: number
}

/**
 * 补货建议合约（跨模块安全子集）
 */
export interface ReorderSuggestionContract {
  productId: string
  suggestedQuantity: number
  urgency: UrgencyLevel
  reason: string
}

/**
 * 调拨建议合约（跨模块安全子集）
 */
export interface TransferRecommendationContract {
  fromStore: string
  toStore: string
  productId: string
  quantity: number
  netBenefit: number
}

/**
 * 慢动商品合约（跨模块安全子集）
 */
export interface SlowMovingProductContract {
  productId: string
  daysSinceLastSale: number
  currentStock: number
  turnoverRate: number
  recommendation: string
}

// ─── 枚举合约 ───────────────────────────────────────────────────────────

export type ForecastTypeContract = Extract<ForecastType, 'sales' | 'inventory'>
export type UrgencyLevelContract = UrgencyLevel
export type PromotionTypeContract = PromotionType
export type ProductStatusContract = ProductStatus

// ─── 合约工厂函数 ───────────────────────────────────────────────────────

/**
 * 从完整预测创建合约子集
 */
export function toSalesForecastContract(full: SalesForecast): SalesForecastContract {
  return {
    productId: full.productId,
    predictedSales: full.predictedSales,
    unit: full.unit,
    confidence: full.confidence,
    seasonalityFactor: full.seasonalityFactor,
  }
}

/**
 * 从完整品类预测创建合约子集
 */
export function toCategoryForecastContract(
  full: CategoryForecast,
  forecastDate?: string,
): CategoryForecastContract {
  return {
    categoryId: full.categoryId,
    totalPredictedSales: full.totalPredictedSales,
    productForecasts: full.productForecasts.map(toSalesForecastContract),
    forecastDate: forecastDate ?? new Date().toISOString(),
  }
}

/**
 * 从完整库存优化建议创建合约子集
 */
export function toOptimalStockContract(full: OptimalStock): OptimalStockContract {
  return {
    productId: full.productId,
    safetyStock: full.safetyStock,
    totalOptimalStock: full.totalOptimalStock,
    reorderPoint: full.reorderPoint,
  }
}

/**
 * 从完整补货建议创建合约子集
 */
export function toReorderSuggestionContract(full: ReorderSuggestion): ReorderSuggestionContract {
  return {
    productId: full.productId,
    suggestedQuantity: full.suggestedQuantity,
    urgency: full.urgency,
    reason: full.reason,
  }
}

/**
 * 从完整调拨建议创建合约子集
 */
export function toTransferRecommendationContract(
  full: TransferRecommendation | null,
): TransferRecommendationContract | null {
  if (!full) return null
  return {
    fromStore: full.fromStore,
    toStore: full.toStore,
    productId: full.productId,
    quantity: full.quantity,
    netBenefit: full.netBenefit,
  }
}

/**
 * 从完整慢动商品响应创建合约子集
 */
export function toSlowMovingProductContract(full: SlowMovingProduct): SlowMovingProductContract {
  return {
    productId: full.productId,
    daysSinceLastSale: full.daysSinceLastSale,
    currentStock: full.currentStock,
    turnoverRate: full.turnoverRate,
    recommendation: full.recommendation,
  }
}

// ─── 导出原始类型子集 ───────────────────────────────────────────────────

export type {
  SalesForecast,
  CategoryForecast,
  SeasonalityFactor,
  OptimalStock,
  ReorderSuggestion,
  SlowMovingProduct,
  TransferRecommendation,
  GlobalAllocation,
  ForecastType,
  UrgencyLevel,
}
