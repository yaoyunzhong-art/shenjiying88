import { randomUUID } from 'node:crypto'
import { Injectable } from '@nestjs/common'
import { movingAverage, standardDeviation, round2 } from './ai-forecast-stats'
import { getOrInitProductHistory } from './ai-forecast-history'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SalesForecast {
  productId: string
  daysAhead: number
  predictedSales: number
  unit: string
  confidence: number
  seasonalityFactor: number
  promotionMultiplier: number
}

export interface CategoryForecast {
  categoryId: string
  daysAhead: number
  totalPredictedSales: number
  productForecasts: SalesForecast[]
}

export interface SeasonalityFactor {
  productId: string
  monthlyFactors: number[] // 12 months, index 0 = Jan
  trend: number // positive = growing, negative = declining
}

export interface Promotion {
  id: string
  type: 'discount' | 'bundled' | 'gift'
  startDate: string
  endDate: string
  boostPercent: number
}

export interface OptimalStock {
  productId: string
  safetyStock: number
  cycleStock: number
  totalOptimalStock: number
  reorderPoint: number
  reorderQuantity: number
}

export interface ReorderSuggestion {
  productId: string
  suggestedQuantity: number
  suggestedDate: string
  urgency: 'low' | 'medium' | 'high'
  reason: string
}

export interface SlowMovingProduct {
  productId: string
  daysSinceLastSale: number
  currentStock: number
  turnoverRate: number
  recommendation: string
}

export interface StoreInventory {
  storeId: string
  productId: string
  currentStock: number
  dailySales: number
  leadTimeDays: number
}

export interface TransferRecommendation {
  fromStore: string
  toStore: string
  productId: string
  quantity: number
  benefit: number
  cost: TransferCost
  netBenefit: number
}

export interface TransferCost {
  freight: number
  loss: number
  labor: number
  total: number
}

export interface GlobalAllocation {
  productId: string
  allocations: { storeId: string; quantity: number }[]
  totalBenefit: number
}

// ─── Mock Data Store ─────────────────────────────────────────────────────────

export const productHistory = new Map<string, { dailySales: number[]; categoryId: string }>()
const storeInventoryData = new Map<string, StoreInventory>()
const promotionStore = new Map<string, Promotion[]>()

export function initMockData(productId: string, categoryId: string) {
  if (!productHistory.has(productId)) {
    const baseSales = 10 + Math.abs(hashCode(productId) % 50)
    const dailySales = Array.from({ length: 30 }, (_, i) =>
      Math.round(baseSales * (0.7 + Math.sin(i / 7 * Math.PI) * 0.3 + (Math.random() - 0.5) * 0.4))
    )
    productHistory.set(productId, { dailySales, categoryId })
  }
}

export function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// ─── DemandForecastService ───────────────────────────────────────────────────

@Injectable()
export class DemandForecastService {
  forecastSales(productId: string, daysAhead: number): SalesForecast {
    const history = getOrInitProductHistory(productId)
    const recentAvg = movingAverage(history.dailySales, 7)
    const seasonality = this.getSeasonality(productId)
    const currentMonth = new Date().getMonth()
    const monthFactor = seasonality.monthlyFactors[currentMonth]

    const baseForecast = recentAvg * daysAhead * monthFactor
    const trendFactor = 1 + (seasonality.trend / 100) * (daysAhead / 30)
    const predictedSales = Math.round(baseForecast * trendFactor)

    return {
      productId,
      daysAhead,
      predictedSales: Math.max(1, predictedSales),
      unit: 'units',
      confidence: 0.75 + Math.random() * 0.2,
      seasonalityFactor: monthFactor,
      promotionMultiplier: 1.0
    }
  }

  forecastByCategory(categoryId: string, daysAhead: number): CategoryForecast {
    const productsInCategory = Array.from(productHistory.entries())
      .filter(([, v]) => v.categoryId === categoryId)
      .map(([productId]) => productId)

    if (productsInCategory.length === 0) {
      const dummyProducts = Array.from({ length: 3 }, (_, i) => ({
        productId: `cat-${categoryId}-prod-${i}`,
        categoryId
      }))
      const forecasts = dummyProducts.map(p => this.forecastSales(p.productId, daysAhead))
      const total = forecasts.reduce((sum, f) => sum + f.predictedSales, 0)

      return {
        categoryId,
        daysAhead,
        totalPredictedSales: total,
        productForecasts: forecasts
      }
    }

    const forecasts = productsInCategory.map(pid => this.forecastSales(pid, daysAhead))
    const total = forecasts.reduce((sum, f) => sum + f.predictedSales, 0)

    return {
      categoryId,
      daysAhead,
      totalPredictedSales: total,
      productForecasts: forecasts
    }
  }

  getSeasonality(productId: string): SeasonalityFactor {
    initMockData(productId, 'default-category')

    const hash = hashCode(productId)
    const baseMonth = hash % 12

    const monthlyFactors = Array.from({ length: 12 }, (_, i) => {
      const distFromBase = Math.abs(i - baseMonth)
      const normalizedDist = Math.min(distFromBase, 12 - distFromBase)
      return Math.round((1.0 + (6 - normalizedDist) * 0.15) * 100) / 100
    })

    return {
      productId,
      monthlyFactors,
      trend: (hash % 20) - 10
    }
  }

  adjustForPromotions(forecast: SalesForecast, promotions: Promotion[]): SalesForecast {
    if (!promotions || promotions.length === 0) {
      return { ...forecast, promotionMultiplier: 1.0 }
    }

    const now = new Date()
    const activePromotions = promotions.filter(p => {
      const start = new Date(p.startDate)
      const end = new Date(p.endDate)
      return now >= start && now <= end
    })

    if (activePromotions.length === 0) {
      return { ...forecast, promotionMultiplier: 1.0 }
    }

    const combinedBoost = activePromotions.reduce((acc, promo) => {
      return acc + promo.boostPercent * (1 - acc * 0.1)
    }, 0)

    return {
      ...forecast,
      predictedSales: Math.round(forecast.predictedSales * (1 + combinedBoost)),
      promotionMultiplier: 1 + combinedBoost
    }
  }
}

// ─── InventoryOptimizer ──────────────────────────────────────────────────────

@Injectable()
export class InventoryOptimizer {
  constructor(private readonly demandForecast: DemandForecastService) {}

  calculateOptimalStock(productId: string, forecast: SalesForecast, leadTime: number): OptimalStock {
    const history = getOrInitProductHistory(productId)
    const dailyAvg = movingAverage(history.dailySales, 7)
    const stdDev = standardDeviation(history.dailySales.slice(-14), dailyAvg)

    const Z = 1.65
    const safetyStock = Math.ceil(Z * stdDev * Math.sqrt(leadTime))
    const cycleStock = Math.ceil(dailyAvg * leadTime)
    const reorderPoint = safetyStock + cycleStock
    const reorderQuantity = cycleStock + safetyStock

    return {
      productId,
      safetyStock,
      cycleStock,
      totalOptimalStock: safetyStock + cycleStock,
      reorderPoint,
      reorderQuantity
    }
  }

  suggestReorder(productId: string): ReorderSuggestion {
    const history = getOrInitProductHistory(productId)
    const currentStock = storeInventoryData.get(`${productId}-current`)?.currentStock ?? 100
    const dailyAvg = movingAverage(history.dailySales, 7)
    const stdDev = standardDeviation(history.dailySales.slice(-14), dailyAvg)
    const leadTime = 7
    const safetyStock = Math.ceil(1.65 * stdDev * Math.sqrt(leadTime))
    const reorderPoint = safetyStock + Math.ceil(dailyAvg * leadTime)
    const daysOfStock = currentStock / dailyAvg

    if (currentStock <= safetyStock) {
      return {
        productId,
        suggestedQuantity: Math.ceil(dailyAvg * 14),
        suggestedDate: new Date().toISOString(),
        urgency: 'high',
        reason: `库存(${currentStock})低于安全库存(${safetyStock})，需立即补货`
      }
    }

    if (currentStock <= reorderPoint) {
      return {
        productId,
        suggestedQuantity: Math.ceil(dailyAvg * 10),
        suggestedDate: new Date().toISOString(),
        urgency: 'medium',
        reason: `库存接近再订货点(${reorderPoint})，建议补货`
      }
    }

    const daysUntilReorder = Math.floor(daysOfStock - leadTime)
    const suggestedDate = new Date(Date.now() + daysUntilReorder * 24 * 60 * 60 * 1000).toISOString()

    return {
      productId,
      suggestedQuantity: Math.ceil(dailyAvg * 14),
      suggestedDate,
      urgency: 'low',
      reason: `库存充足，预计${Math.floor(daysOfStock)}天后备货`
    }
  }

  detectSlowMoving(productId: string, thresholdDays: number = 30): SlowMovingProduct {
    const history = getOrInitProductHistory(productId)
    const currentStock = storeInventoryData.get(`${productId}-current`)?.currentStock ?? 50

    let lastSaleIndex = history.dailySales.length - 1
    for (let i = history.dailySales.length - 1; i >= 0; i--) {
      if (history.dailySales[i] > 0) {
        lastSaleIndex = i
        break
      }
    }

    const daysSinceLastSale = history.dailySales.length - lastSaleIndex
    const avgDailySales = movingAverage(history.dailySales, 14)
    const turnoverRate = avgDailySales > 0 ? currentStock / avgDailySales : Infinity

    let recommendation: string
    if (daysSinceLastSale > thresholdDays) {
      recommendation = `超过${thresholdDays}天无销售，建议打折清仓或调拨至其他门店`
    } else if (turnoverRate > 60) {
      recommendation = '库存周转过慢，建议减少进货或促销推动'
    } else {
      recommendation = '周转正常，持续监控'
    }

    return {
      productId,
      daysSinceLastSale,
      currentStock,
      turnoverRate: round2(turnoverRate),
      recommendation
    }
  }
}

// ─── TransferRecommendationService ──────────────────────────────────────────

@Injectable()
export class TransferRecommendationService {
  constructor(private readonly inventoryOptimizer: InventoryOptimizer) {}

  suggestTransfer(fromStore: string, toStore: string, productId: string): TransferRecommendation | null {
    initMockData(productId, 'default-category')

    const fromInventory = this.getStoreInventory(fromStore, productId)
    const toInventory = this.getStoreInventory(toStore, productId)

    if (!fromInventory || !toInventory) {
      return null
    }

    const avgDailySales = (fromInventory.dailySales + toInventory.dailySales) / 2
    const targetStock = avgDailySales * 14

    const excessStock = fromInventory.currentStock - targetStock
    if (excessStock <= 0) {
      return null
    }

    const shortage = targetStock - toInventory.currentStock
    if (shortage <= 0) {
      return null
    }

    const transferQty = Math.min(excessStock, shortage)
    const benefit = this.calculateTransferBenefit(fromStore, toStore, productId)
    const netBenefit = benefit.totalSavings - benefit.cost.total

    return {
      fromStore,
      toStore,
      productId,
      quantity: Math.floor(transferQty),
      benefit: netBenefit,
      cost: benefit.cost,
      netBenefit
    }
  }

  calculateTransferBenefit(
    fromStore: string,
    toStore: string,
    productId: string
  ): { cost: TransferCost; totalSavings: number } {
    const fromInventory = this.getStoreInventory(fromStore, productId)
    const toInventory = this.getStoreInventory(toStore, productId)

    const defaultInventory = storeInventoryData.get(`${productId}-current`) ?? {
      currentStock: 100,
      dailySales: 10,
      leadTimeDays: 7
    }

    const from = fromInventory ?? { ...defaultInventory, storeId: fromStore }
    const to = toInventory ?? { ...defaultInventory, storeId: toStore }

    const transferQty = 50

    const freightCost = this.calculateFreight(fromStore, toStore, transferQty)
    const lossRate = 0.02
    const productUnitCost = 100
    const lossCost = transferQty * productUnitCost * lossRate
    const laborCost = this.calculateLaborCost(transferQty)
    const totalCost = freightCost + lossCost + laborCost

    const avgDailySales = (from.dailySales + to.dailySales) / 2
    const stockoutRisk = to.currentStock < avgDailySales * to.leadTimeDays ? 0.1 : 0
    const savingsFromStockoutAvoid = transferQty * productUnitCost * stockoutRisk
    const holdingCostSaving = from.currentStock > 0 ? from.currentStock * productUnitCost * 0.001 : 0
    const totalSavings = savingsFromStockoutAvoid + holdingCostSaving

    return {
      cost: {
        freight: freightCost,
        loss: lossCost,
        labor: laborCost,
        total: Math.round(totalCost * 100) / 100
      },
      totalSavings: Math.round(totalSavings * 100) / 100
    }
  }

  optimizeGlobalAllocation(products: { storeId: string; productId: string }[]): GlobalAllocation[] {
    const allocations: GlobalAllocation[] = []
    const storeIds = [...new Set(products.map(p => p.storeId))]
    const productIds = [...new Set(products.map(p => p.productId))]

    for (const productId of productIds) {
      const productAllocations: { storeId: string; quantity: number }[] = []
      let totalBenefit = 0

      const storeStocks = storeIds.map(storeId => {
        const inv = this.getStoreInventory(storeId, productId)
        return {
          storeId,
          stock: inv?.currentStock ?? 50,
          dailySales: inv?.dailySales ?? 5
        }
      })

      storeStocks.sort((a, b) => b.stock - a.stock)

      for (let i = 0; i < storeStocks.length - 1; i++) {
        const from = storeStocks[i]
        const to = storeStocks[storeStocks.length - 1 - i]

        if (from.stock > to.stock + 20) {
          const transferQty = Math.floor((from.stock - to.stock) / 2)
          if (transferQty > 0) {
            productAllocations.push({ storeId: from.storeId, quantity: -transferQty })
            productAllocations.push({ storeId: to.storeId, quantity: transferQty })

            const benefit = this.calculateTransferBenefit(from.storeId, to.storeId, productId)
            totalBenefit += benefit.totalSavings - benefit.cost.total
          }
        }
      }

      if (productAllocations.length > 0) {
        allocations.push({
          productId,
          allocations: productAllocations,
          totalBenefit: Math.round(totalBenefit * 100) / 100
        })
      }
    }

    return allocations
  }

  private getStoreInventory(storeId: string, productId: string): StoreInventory | undefined {
    const key = `${storeId}-${productId}`
    if (!storeInventoryData.has(key)) {
      const baseStock = 50 + hashCode(storeId + productId) % 100
      const dailySales = 5 + (hashCode(productId) % 15)
      storeInventoryData.set(key, {
        storeId,
        productId,
        currentStock: baseStock,
        dailySales,
        leadTimeDays: 7
      })
    }
    return storeInventoryData.get(key)
  }

  private calculateFreight(fromStore: string, toStore: string, quantity: number): number {
    const distanceFactor = Math.abs(hashCode(fromStore) - hashCode(toStore)) % 100 + 10
    const weightFee = quantity * 0.5
    const distanceFee = distanceFactor * 0.1
    return Math.round((weightFee + distanceFee) * 100) / 100
  }

  private calculateLaborCost(quantity: number): number {
    const baseLabor = 50
    const perUnitLabor = quantity * 0.2
    return Math.round((baseLabor + perUnitLabor) * 100) / 100
  }
}
