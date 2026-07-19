/**
 * intelligence.entity.ts — 运营参谋数据类型
 */

export interface FeasibilityReport {
  city: string
  district: string
  budget: number
  score: number
  scoreLevel: 'high' | 'medium' | 'low'
  summary: string
  competitorDensity: number
  competitorCount: number
  avgPrice: number
  suggestedEquipment: { name: string; count: number; cost: number; reason: string }[]
  suggestedPriceRange: { min: number; max: number; avg: number }
  riskFactors: { factor: string; level: 'high' | 'medium' | 'low'; suggestion: string }[]
  marketTrend: string
  estimatedMonthlyRevenue: number
  estimatedPaybackMonths: number
}

export interface OperationAdviceChoice {
  id: string
  question: string
  category: 'pricing' | 'activity' | 'equipment' | 'member' | 'promotion'
  options: { id: string; label: string; description: string; pros: string[]; cons: string[]; estimatedEffect: string }[]
  aiSuggestion: string
}

export interface CompetitorAlert {
  storeName: string
  city: string
  type: 'price_change' | 'new_activity' | 'new_promotion' | 'rating_change'
  description: string
  severity: 'high' | 'medium' | 'low'
  detectedAt: string
  recommendedAction: string
}
