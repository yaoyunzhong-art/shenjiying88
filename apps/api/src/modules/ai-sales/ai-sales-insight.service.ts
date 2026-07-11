/**
 * ai-sales-insight.service.ts — AI 销售深度分析引擎
 *
 * 提供销售对话分析、成交预测、产品关联推荐、销售KPI看板
 */
import { Injectable } from '@nestjs/common'

export interface ConversationAnalysis {
  conversationId: string
  customerId: string
  customerSentiment: number
  agentPerformance: number
  topicsDiscussed: string[]
  objectionsRaised: Array<{ type: string; resolved: boolean; responseQuality: number }>
  keyMoments: Array<{ timestamp: string; event: string; impact: string }>
  overallScore: number
  suggestions: string[]
}

export interface DealPrediction {
  customerId: string
  productId: string
  probability: number
  expectedValue: number
  expectedCloseDate: string
  confidenceLevel: 'high' | 'medium' | 'low'
  keyFactors: Array<{ factor: string; weight: number; positive: boolean }>
  recommendedActions: string[]
  riskFactors: string[]
}

export interface ProductAssociation {
  productId: string
  productName: string
  relatedProducts: Array<{
    productId: string
    productName: string
    associationStrength: number
    associationType: 'complementary' | 'upsell' | 'cross_sell' | 'substitute'
    confidence: number
    recommendationScenario: string
  }>
  bundleSuggestions: Array<{
    name: string
    products: string[]
    bundlePrice: number
    savings: number
    expectedConversionRate: number
  }>
}

export interface SalesKPIDashboard {
  period: string
  kpis: {
    totalRevenue: number
    totalDeals: number
    winRate: number
    averageDealSize: number
    salesCycleDays: number
    leadConversionRate: number
    customerAcquisitionCost: number
    customerLifetimeValue: number
    ltvToCacRatio: number
    quotaAttainment: number
  }
  trends: Array<{
    metric: string
    currentPeriod: number
    previousPeriod: number
    change: number
    direction: 'up' | 'down' | 'stable'
  }>
  topPerformers: Array<{
    salesId: string
    name: string
    deals: number
    revenue: number
    winRate: number
  }>
  recommendations: string[]
}

export interface ScriptPerformance {
  scriptId: string
  scriptName: string
  uses: number
  conversions: number
  conversionRate: number
  averageCallDuration: number
  customerSatisfaction: number
  topObjections: string[]
  effectivePhrases: string[]
  improvement: string
}

export interface LeadScoringResult {
  leadId: string
  score: number
  grade: 'A' | 'B' | 'C' | 'D'
  demographicScore: number
  behavioralScore: number
  engagementScore: number
  fitScore: number
  intentScore: number
  breakdown: Record<string, number>
  recommendedAction: string
  followUpPriority: number
}

export interface SalesForecast {
  period: string
  pipelineValue: number
  weightedForecast: number
  commitForecast: number
  bestCase: number
  worstCase: number
  confidence: number
  risks: Array<{ description: string; impact: number; probability: number }>
  opportunities: Array<{ description: string; value: number; probability: number }>
}

export interface Customer360 {
  customerId: string
  basicInfo: { name: string; tier: string; since: string; region: string }
  transactionHistory: Array<{ date: string; product: string; amount: number; category: string }>
  interactionHistory: Array<{ date: string; type: string; channel: string; sentiment: string }>
  productPreferences: string[]
  predictedLTV: number
  churnRisk: number
  nextBestAction: string
  lifetimeMetrics: {
    totalSpent: number
    totalOrders: number
    avgOrderValue: number
    returnRate: number
    daysSinceLastPurchase: number
    customerSatisfactionScore: number
  }
}

export interface CompetitivePositioning {
  productId: string
  productName: string
  marketShare: number
  pricePosition: 'premium' | 'competitive' | 'budget'
  featureComparison: Record<string, { us: boolean; competitor: boolean; importance: string }>
  winRateBySegment: Record<string, number>
  lossReasons: Array<{ reason: string; frequency: number; addressable: boolean }>
  recommendedPricingStrategy: string
  uniqueSellingPoints: string[]
  vulnerabilities: string[]
}

@Injectable()
export class SalesInsightService {
  /**
   * 对话分析
   */
  analyzeConversation(conversationId: string, customerId: string): ConversationAnalysis {
    const topics = ['产品功能', '价格讨论', '竞品对比', '售后服务', '交付周期', '方案定制']
    const objections = [
      { type: '价格', resolved: Math.random() > 0.3, responseQuality: Math.round((5 + Math.random() * 5) * 10) / 10 },
      { type: '竞品', resolved: Math.random() > 0.4, responseQuality: Math.round((4 + Math.random() * 5) * 10) / 10 },
      { type: '需求', resolved: Math.random() > 0.2, responseQuality: Math.round((6 + Math.random() * 4) * 10) / 10 },
    ]

    const keyMoments = [
      { timestamp: new Date(Date.now() - 3600000).toISOString(), event: '开场白', impact: '建立初步关系' },
      { timestamp: new Date(Date.now() - 1800000).toISOString(), event: '需求挖掘', impact: '识别客户痛点' },
      { timestamp: new Date(Date.now() - 600000).toISOString(), event: '方案介绍', impact: '展示核心价值' },
    ]

    return {
      conversationId,
      customerId,
      customerSentiment: Math.round((6 + Math.random() * 4) * 10) / 10,
      agentPerformance: Math.round((5 + Math.random() * 5) * 10) / 10,
      topicsDiscussed: topics.slice(0, 2 + Math.round(Math.random() * 4)),
      objectionsRaised: objections,
      keyMoments,
      overallScore: Math.round((50 + Math.random() * 50) * 10) / 10,
      suggestions: [
        '建议在价格讨论时强调ROI和长期价值',
        '客户对竞品有顾虑，建议准备对比案例',
        '建议跟进时提供定制化方案文档',
      ],
    }
  }

  /**
   * 成交预测
   */
  predictDeal(customerId: string, productId: string): DealPrediction {
    const probability = Math.round((10 + Math.random() * 80) * 10) / 10
    const expectedValue = Math.round((5000 + Math.random() * 95000) * 100) / 100
    const closeDate = new Date(Date.now() + Math.round(15 + Math.random() * 45) * 86400000).toISOString()

    const confidenceLevel: 'high' | 'medium' | 'low' =
      probability > 70 ? 'high' : probability > 35 ? 'medium' : 'low'

    return {
      customerId,
      productId,
      probability,
      expectedValue,
      expectedCloseDate: closeDate,
      confidenceLevel,
      keyFactors: [
        { factor: '客户预算匹配度', weight: 0.85, positive: probability > 50 },
        { factor: '决策链完整度', weight: 0.7, positive: probability > 40 },
        { factor: '时间紧迫度', weight: 0.6, positive: probability > 30 },
        { factor: '竞品介入程度', weight: 0.75, positive: probability > 60 },
      ],
      recommendedActions: [
        probability > 70 ? '提供加速成交的优惠方案' : '安排产品演示加深印象',
        '准备定制化解决方案文档',
        '协调高层对接推动决策',
      ],
      riskFactors: probability < 50 ? ['预算审批流程长', '竞品深度接触', '决策者意见不统一'] : [],
    }
  }

  /**
   * 产品关联推荐
   */
  getProductAssociations(productId: string): ProductAssociation {
    const relatedProducts = [
      { productId: 'prod-002', productName: '会员管理系统', associationStrength: 0.95, associationType: 'complementary' as const, confidence: 0.9, recommendationScenario: '购买智能营销系统的客户通常也需要会员管理系统' },
      { productId: 'prod-003', productName: '数据分析平台', associationStrength: 0.85, associationType: 'upsell' as const, confidence: 0.85, recommendationScenario: '升级到数据分析平台获得更深入的洞察' },
      { productId: 'prod-004', productName: '自动化营销模块', associationStrength: 0.75, associationType: 'cross_sell' as const, confidence: 0.78, recommendationScenario: '增加自动化营销模块提升运营效率' },
      { productId: 'prod-005', productName: '客户服务系统', associationStrength: 0.6, associationType: 'complementary' as const, confidence: 0.65, recommendationScenario: '配合客服系统打造全链路服务体验' },
    ]

    return {
      productId,
      productName: `产品 ${productId}`,
      relatedProducts: relatedProducts.sort((a, b) => b.associationStrength - a.associationStrength),
      bundleSuggestions: [
        { name: '智能营销全家桶', products: [productId, 'prod-002', 'prod-003'], bundlePrice: 199999, savings: 50000, expectedConversionRate: 35 },
        { name: '增长加速包', products: [productId, 'prod-004'], bundlePrice: 129999, savings: 20000, expectedConversionRate: 45 },
      ],
    }
  }

  /**
   * 销售 KPI 看板
   */
  getSalesKPIDashboard(period: string): SalesKPIDashboard {
    const revenue = Math.round(500000 + Math.random() * 500000)
    const deals = Math.round(20 + Math.random() * 60)
    const winRate = Math.round((30 + Math.random() * 40) * 10) / 10
    const avgDealSize = Math.round(revenue / Math.max(1, deals))
    const cac = Math.round((2000 + Math.random() * 8000) * 100) / 100
    const ltv = Math.round(cac * (2 + Math.random() * 4))

    return {
      period,
      kpis: {
        totalRevenue: revenue,
        totalDeals: deals,
        winRate,
        averageDealSize: avgDealSize,
        salesCycleDays: Math.round(15 + Math.random() * 45),
        leadConversionRate: Math.round((5 + Math.random() * 20) * 10) / 10,
        customerAcquisitionCost: cac,
        customerLifetimeValue: ltv,
        ltvToCacRatio: Math.round((ltv / cac) * 10) / 10,
        quotaAttainment: Math.round((60 + Math.random() * 40) * 10) / 10,
      },
      trends: ['总营收', '成交率', '平均客单价', '销售周期'].map(m => ({
        metric: m,
        currentPeriod: Math.round((50 + Math.random() * 100) * 10) / 10,
        previousPeriod: Math.round((30 + Math.random() * 100) * 10) / 10,
        change: Math.round((Math.random() * 40 - 10) * 10) / 10,
        direction: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'stable',
      })),
      topPerformers: Array.from({ length: 3 }, (_, i) => ({
        salesId: `sales-${100 + i}`,
        name: `销售代表 ${String.fromCharCode(65 + i)}`,
        deals: Math.round(5 + Math.random() * 15),
        revenue: Math.round(100000 + Math.random() * 400000),
        winRate: Math.round((30 + Math.random() * 50) * 10) / 10,
      })).sort((a, b) => b.revenue - a.revenue),
      recommendations: [
        '高价值客户成单率偏低，建议安排专属客户经理跟进',
        winRate < 40 ? '成交率偏低，建议优化销售话术和跟进流程' : '成交率良好，建议维持现有策略',
        '建议增加产品 demo 和小型 POC 的比例',
      ],
    }
  }

  /**
   * 话术表现分析
   */
  analyzeScriptPerformance(scriptId: string): ScriptPerformance {
    const totalUses = Math.round(100 + Math.random() * 900)
    const conversions = Math.round(totalUses * (0.1 + Math.random() * 0.3))

    return {
      scriptId,
      scriptName: `话术模版 ${scriptId}`,
      uses: totalUses,
      conversions,
      conversionRate: Math.round((conversions / totalUses) * 10000) / 100,
      averageCallDuration: Math.round((120 + Math.random() * 360) * 10) / 10,
      customerSatisfaction: Math.round((3 + Math.random() * 2) * 10) / 10,
      topObjections: ['价格太高', '需要时间考虑', '已有供应商'],
      effectivePhrases: ['我们的解决方案可以帮您...', '相比传统方案...', '客户案例显示...'],
      improvement: '建议在开场白部分加强价值主张的陈述',
    }
  }

  /**
   * 潜在客户评分
   */
  scoreLead(leadId: string): LeadScoringResult {
    const dScore = Math.round((20 + Math.random() * 80) * 10) / 10
    const bScore = Math.round((20 + Math.random() * 80) * 10) / 10
    const eScore = Math.round((15 + Math.random() * 85) * 10) / 10
    const fScore = Math.round((25 + Math.random() * 75) * 10) / 10
    const iScore = Math.round((10 + Math.random() * 90) * 10) / 10
    const total = Math.round((dScore * 0.15 + bScore * 0.3 + eScore * 0.2 + fScore * 0.2 + iScore * 0.15) * 10) / 10
    const grade: 'A' | 'B' | 'C' | 'D' = total > 80 ? 'A' : total > 60 ? 'B' : total > 40 ? 'C' : 'D'

    return {
      leadId,
      score: total,
      grade,
      demographicScore: dScore,
      behavioralScore: bScore,
      engagementScore: eScore,
      fitScore: fScore,
      intentScore: iScore,
      breakdown: { '公司规模': Math.round(Math.random() * 100), '行业匹配': Math.round(Math.random() * 100), '决策权': Math.round(Math.random() * 100), '预算': Math.round(Math.random() * 100), '时间线': Math.round(Math.random() * 100) },
      recommendedAction: grade === 'A' ? '立即联系' : grade === 'B' ? '尽快跟进' : grade === 'C' ? '培育中' : '暂缓跟进',
      followUpPriority: grade === 'A' ? 1 : grade === 'B' ? 2 : grade === 'C' ? 3 : 4,
    }
  }

  /**
   * 销售预测
   */
  generateSalesForecast(period: string): SalesForecast {
    const pipeline = Math.round(2000000 + Math.random() * 3000000)
    const weighted = Math.round(pipeline * (0.3 + Math.random() * 0.3))

    return {
      period,
      pipelineValue: pipeline,
      weightedForecast: weighted,
      commitForecast: Math.round(weighted * (0.5 + Math.random() * 0.2)),
      bestCase: Math.round(pipeline * (0.6 + Math.random() * 0.3)),
      worstCase: Math.round(pipeline * (0.2 + Math.random() * 0.1)),
      confidence: Math.round((50 + Math.random() * 40) * 10) / 10,
      risks: [
        { description: '主要客户预算推迟', impact: -200000, probability: 0.3 },
        { description: '竞品低价竞争', impact: -150000, probability: 0.4 },
      ],
      opportunities: [
        { description: 'Up-sell 现有客户', value: 300000, probability: 0.6 },
        { description: '新行业拓展', value: 250000, probability: 0.4 },
      ],
    }
  }

  /**
   * 客户 360 视图
   */
  getCustomer360(customerId: string): Customer360 {
    const now = new Date()
    return {
      customerId,
      basicInfo: { name: `客户 ${customerId}`, tier: Math.random() > 0.6 ? 'VIP' : Math.random() > 0.5 ? '标准' : '基础', since: '2025-01-15', region: '华东' },
      transactionHistory: Array.from({ length: 5 }, (_, i) => ({
        date: new Date(now.getTime() - i * 30 * 86400000).toISOString().slice(0, 10),
        product: ['智能营销系统', '会员管理系统', '数据分析平台'][Math.floor(Math.random() * 3)],
        amount: Math.round(10000 + Math.random() * 90000),
        category: ['软件', '服务', '咨询'][Math.floor(Math.random() * 3)],
      })),
      interactionHistory: [
        { date: new Date(now.getTime() - 3 * 86400000).toISOString(), type: '电话', channel: '电话', sentiment: '正面' },
        { date: new Date(now.getTime() - 10 * 86400000).toISOString(), type: '邮件', channel: '邮件', sentiment: '中性' },
        { date: new Date(now.getTime() - 20 * 86400000).toISOString(), type: '会议', channel: '线上', sentiment: '正面' },
      ],
      productPreferences: ['智能营销系统', '数据分析平台'],
      predictedLTV: Math.round(150000 + Math.random() * 350000),
      churnRisk: Math.round(Math.random() * 100),
      nextBestAction: '推荐升级到企业版，增加数据分析模块',
      lifetimeMetrics: {
        totalSpent: Math.round(200000 + Math.random() * 300000),
        totalOrders: Math.round(3 + Math.random() * 7),
        avgOrderValue: Math.round((30000 + Math.random() * 70000) * 100) / 100,
        returnRate: Math.round(Math.random() * 5 * 100) / 100,
        daysSinceLastPurchase: Math.round(10 + Math.random() * 60),
        customerSatisfactionScore: Math.round((7 + Math.random() * 3) * 10) / 10,
      },
    }
  }

  /**
   * 竞争定位分析
   */
  analyzeCompetitivePositioning(productId: string): CompetitivePositioning {
    return {
      productId,
      productName: `产品 ${productId}`,
      marketShare: Math.round((5 + Math.random() * 20) * 10) / 10,
      pricePosition: 'competitive',
      featureComparison: {
        'AI功能': { us: true, competitor: true, importance: '高' },
        '实时分析': { us: true, competitor: false, importance: '高' },
        '多租户支持': { us: true, competitor: true, importance: '中' },
        '私有化部署': { us: true, competitor: false, importance: '中' },
        'API集成': { us: true, competitor: true, importance: '高' },
      },
      winRateBySegment: { '中小企业': 65, '中型企业': 55, '大型企业': 42, '特定行业': 70 },
      lossReasons: [
        { reason: '客户预算不足', frequency: 35, addressable: false },
        { reason: '竞品价格优势', frequency: 25, addressable: true },
        { reason: '客户选择一体化方案', frequency: 20, addressable: false },
      ],
      recommendedPricingStrategy: '采用分层定价策略，基础版低价获客，企业版按需定价',
      uniqueSellingPoints: ['AI驱动的智能推荐', '全渠道统一管理', '实时数据看板'],
      vulnerabilities: ['品牌知名度不如大厂', '生态集成不够丰富'],
    }
  }
}
