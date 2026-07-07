/**
 * AI 需求预测 - 实体定义
 *
 * 预测类型：sales（销量预测）、inventory（库存优化）、transfer（调拨建议）
 * 策略类型：seasonal（季节性）、promotional（促销调优）、reorder（补货建议）
 */

/** 预测类型 */
export type ForecastType = 'sales' | 'inventory' | 'transfer'

/** 补货紧急程度 */
export type UrgencyLevel = 'low' | 'medium' | 'high'

/** 促销类型 */
export type PromotionType = 'discount' | 'bundled' | 'gift'

/** 商品状态 */
export type ProductStatus = 'active' | 'slow-moving' | 'discontinued'

/**
 * 销量预测结果
 */
export interface SalesForecast {
  /** 产品 ID */
  productId: string
  /** 预测天数 */
  daysAhead: number
  /** 预测销量 */
  predictedSales: number
  /** 单位 */
  unit: string
  /** 置信度 0-1 */
  confidence: number
  /** 季节性因子 */
  seasonalityFactor: number
  /** 促销乘数 */
  promotionMultiplier: number
}

/**
 * 品类预测结果
 */
export interface CategoryForecast {
  /** 品类 ID */
  categoryId: string
  /** 预测天数 */
  daysAhead: number
  /** 品类总预测销量 */
  totalPredictedSales: number
  /** 各产品预测明细 */
  productForecasts: SalesForecast[]
}

/**
 * 季节性因子
 */
export interface SeasonalityFactor {
  /** 产品 ID */
  productId: string
  /** 12 个月的月度因子（0=一月） */
  monthlyFactors: number[]
  /** 趋势（正=增长，负=衰退） */
  trend: number
}

/**
 * 促销活动信息
 */
export interface Promotion {
  /** 促销 ID */
  id: string
  /** 促销类型 */
  type: PromotionType
  /** 开始日期 */
  startDate: string
  /** 结束日期 */
  endDate: string
  /** 提升百分比 */
  boostPercent: number
}

/**
 * 最优库存配置
 */
export interface OptimalStock {
  /** 产品 ID */
  productId: string
  /** 安全库存 */
  safetyStock: number
  /** 周期库存 */
  cycleStock: number
  /** 总最优库存 */
  totalOptimalStock: number
  /** 再订货点 */
  reorderPoint: number
  /** 再订货数量 */
  reorderQuantity: number
}

/**
 * 补货建议
 */
export interface ReorderSuggestion {
  /** 产品 ID */
  productId: string
  /** 建议补货数量 */
  suggestedQuantity: number
  /** 建议补货日期 */
  suggestedDate: string
  /** 紧急程度 */
  urgency: UrgencyLevel
  /** 原因说明 */
  reason: string
}

/**
 * 滞销品分析结果
 */
export interface SlowMovingProduct {
  /** 产品 ID */
  productId: string
  /** 距上次销售天数 */
  daysSinceLastSale: number
  /** 当前库存量 */
  currentStock: number
  /** 周转率 */
  turnoverRate: number
  /** 处理建议 */
  recommendation: string
}

/**
 * 门店库存信息
 */
export interface StoreInventory {
  /** 门店 ID */
  storeId: string
  /** 产品 ID */
  productId: string
  /** 当前库存量 */
  currentStock: number
  /** 日均销量 */
  dailySales: number
  /** 提前期（天） */
  leadTimeDays: number
}

/**
 * 调拨建议
 */
export interface TransferRecommendation {
  /** 调出门店 */
  fromStore: string
  /** 调入门店 */
  toStore: string
  /** 产品 ID */
  productId: string
  /** 调拨数量 */
  quantity: number
  /** 净收益 */
  benefit: number
  /** 调拨成本明细 */
  cost: TransferCost
  /** 净收益（收益-成本） */
  netBenefit: number
}

/**
 * 调拨成本
 */
export interface TransferCost {
  /** 运费 */
  freight: number
  /** 损耗 */
  loss: number
  /** 人力 */
  labor: number
  /** 总成本 */
  total: number
}

/**
 * 全局分配方案
 */
export interface GlobalAllocation {
  /** 产品 ID */
  productId: string
  /** 各门店分配方案（+调入，-调出） */
  allocations: { storeId: string; quantity: number }[]
  /** 总收益 */
  totalBenefit: number
}

/**
 * 预测请求参数
 */
export interface ForecastInput {
  /** 产品 ID */
  productId: string
  /** 预测天数 */
  daysAhead: number
  /** 可选：品类 ID（品类预测） */
  categoryId?: string
}

/**
 * 预测结果
 */
export interface ForecastOutput {
  /** 预测结果列表 */
  forecasts: SalesForecast[]
  /** 品类预测（如果有） */
  categoryForecast?: CategoryForecast
  /** 总耗时 ms */
  executionTimeMs: number
  /** 生成时间 */
  timestamp: string
}

/**
 * 库存优化输入
 */
export interface InventoryOptimizationInput {
  /** 产品 ID */
  productId: string
  /** 提前期（天） */
  leadTime: number
}

/**
 * 补货建议输入
 */
export interface ReorderInput {
  /** 产品 ID */
  productId: string
}

/**
 * 调拨输入
 */
export interface TransferInput {
  /** 调出门店 */
  fromStore: string
  /** 调入门店 */
  toStore: string
  /** 产品 ID */
  productId: string
}
