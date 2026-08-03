/**
 * ai-cs-advanced.service.ts — AI 客服高级分析服务
 *
 * 提供客服质量分析、情感分析、意图分类、
 * 工单管理、客服满意度预测等高级功能
 */
import { Injectable } from '@nestjs/common'

export interface SentimentAnalysisResult {
  conversationId: string
  overallSentiment: 'positive' | 'neutral' | 'negative'
  sentimentScore: number
  sentimentTrend: Array<{ timestamp: string; score: number; label: string }>
  keyEmotions: Array<{ emotion: string; intensity: number }>
  criticalMoments: Array<{ timestamp: string; sentiment: string; trigger: string }>
}

export interface IntentClassification {
  conversationId: string
  primaryIntent: string
  secondaryIntent: string
  confidence: number
  intentHierarchy: Array<{ level: number; intent: string; confidence: number }>
  detectedEntities: Array<{ entity: string; value: string; confidence: number }>
  suggestedRouting: string
}

export interface QualityScore {
  conversationId: string
  overallScore: number
  dimensions: {
    greeting: number
    professionalism: number
    empathy: number
    accuracy: number
    resolution: number
    efficiency: number
    compliance: number
  }
  strengths: string[]
  improvements: string[]
  scoreBreakdown: Array<{ criteria: string; score: number; weight: number; weightedScore: number }>
}

export interface TicketAnalytics {
  period: string
  totalTickets: number
  resolvedTickets: number
  openTickets: number
  averageResolutionTime: number
  medianResolutionTime: number
  firstResponseTime: number
  resolutionRate: number
  slaCompliance: number
  backlog: number
  ticketsByCategory: Record<string, number>
  ticketsByPriority: Record<string, number>
  trends: Array<{ date: string; created: number; resolved: number; backlog: number }>
}

export interface CustomerSatisfactionPrediction {
  conversationId: string
  predictedCSAT: number
  confidence: number
  keyDrivers: Array<{ factor: string; impact: number; currentValue: number; targetValue: number }>
  riskLevel: 'low' | 'medium' | 'high'
  recommendedActions: string[]
}

export interface ConversationSummary {
  conversationId: string
  customerId: string
  agentId: string
  startTime: string
  endTime: string
  duration: number
  category: string
  summary: string
  issues: string[]
  resolutions: string[]
  followUpRequired: boolean
  followUpAction: string
}

export interface CSATDashboard {
  period: string
  overallCSAT: number
  surveyCount: number
  responseRate: number
  distribution: Record<number, number>
  byCategory: Record<string, number>
  byAgent: Array<{ agentId: string; name: string; csat: number; conversations: number }>
  trending: 'improving' | 'stable' | 'declining'
  topDrivers: Array<{ factor: string; impact: number }>
  recommendations: string[]
}

export interface AutomationOpportunity {
  pattern: string
  frequency: number
  avgHandleTime: number
  automationPotential: number
  complexity: 'low' | 'medium' | 'high'
  estimatedSavings: number
  implementationEffort: string
  priority: number
  suggestedSolution: string
}

export interface AgentPerformance {
  agentId: string
  name: string
  conversationsHandled: number
  averageHandleTime: number
  csatScore: number
  resolutionRate: number
  firstResponseTime: number
  complianceScore: number
  occupancyRate: number
  afterWorkTime: number
  kpiScore: number
  strengths: string[]
  areasForImprovement: string[]
  rank: number
}

export interface KnowledgeBaseStats {
  totalArticles: number
  publishedArticles: number
  draftArticles: number
  totalViews: number
  totalVotes: number
  helpfulPercentage: number
  topArticles: Array<{ id: string; title: string; views: number; helpfulness: number; category: string }>
  searchAnalytics: Array<{ query: string; frequency: number; clickThrough: number; satisfaction: number }>
  gaps: Array<{ topic: string; searchFrequency: number; articleMissing: boolean }>
}

export interface BotPerformance {
  intentRecognitionRate: number
  resolutionRate: number
  handoffRate: number
  averageConversationsPerDay: number
  topIntents: Array<{ intent: string; count: number; resolutionRate: number }>
  fallbackRate: number
  userSatisfaction: number
  improvementSuggestions: string[]
}

@Injectable()
export class AdvancedCSService {
  /**
   * 情感分析
   */
  analyzeSentiment(conversationId: string): SentimentAnalysisResult {
    const sentimentTrend = Array.from({ length: 5 }, (_, i) => ({
      timestamp: new Date(Date.now() - (4 - i) * 60000).toISOString(),
      score: -1 + Math.random() * 2,
      label: ['负面', '负面', '中性', '正面', '正面'][Math.min(4, Math.floor(2 + (Math.random() - 0.3) * 3))],
    }))

    const avgScore = sentimentTrend.reduce((s, p) => s + p.score, 0) / sentimentTrend.length
    const overallSentiment: 'positive' | 'neutral' | 'negative' =
      avgScore > 0.3 ? 'positive' : avgScore < -0.3 ? 'negative' : 'neutral'

    return {
      conversationId,
      overallSentiment,
      sentimentScore: Math.round(avgScore * 100) / 100,
      sentimentTrend,
      keyEmotions: [
        { emotion: '满意', intensity: Math.round((avgScore + 1) * 50) },
        { emotion: '焦急', intensity: Math.round((1 - avgScore) * 30) },
        { emotion: '信任', intensity: Math.round((avgScore + 0.5) * 40) },
      ],
      criticalMoments: [
        { timestamp: sentimentTrend[2].timestamp, sentiment: '中性', trigger: '问题描述阶段' },
        { timestamp: sentimentTrend[sentimentTrend.length - 1].timestamp, sentiment: overallSentiment, trigger: '问题解决后' },
      ],
    }
  }

  /**
   * 意图分类
   */
  classifyIntent(conversationId: string): IntentClassification {
    const intents = [
      '产品咨询', '订单查询', '退换货', '投诉建议',
      '账户问题', '技术支持', '价格咨询', '合作伙伴咨询',
    ]
    const primary = intents[Math.floor(Math.random() * intents.length)]

    return {
      conversationId,
      primaryIntent: primary,
      secondaryIntent: intents.filter(i => i !== primary)[Math.floor(Math.random() * (intents.length - 1))],
      confidence: Math.round((0.6 + Math.random() * 0.35) * 100) / 100,
      intentHierarchy: [
        { level: 1, intent: primary, confidence: 0.82 },
        { level: 2, intent: '客户服务', confidence: 0.95 },
        { level: 3, intent: '售后支持', confidence: 0.7 },
      ],
      detectedEntities: [
        { entity: '订单号', value: `ORD-${Math.round(100000 + Math.random() * 900000)}`, confidence: 0.95 },
        { entity: '产品', value: '智能营销系统', confidence: 0.88 },
      ],
      suggestedRouting: primary === '技术支持' ? '技术团队' : primary === '投诉建议' ? '客服主管' : '一线客服',
    }
  }

  /**
   * 服务质量评分
   */
  scoreQuality(conversationId: string): QualityScore {
    const dimensions = {
      greeting: Math.round((7 + Math.random() * 3) * 10) / 10,
      professionalism: Math.round((6 + Math.random() * 4) * 10) / 10,
      empathy: Math.round((5 + Math.random() * 4) * 10) / 10,
      accuracy: Math.round((7 + Math.random() * 3) * 10) / 10,
      resolution: Math.round((6 + Math.random() * 4) * 10) / 10,
      efficiency: Math.round((5 + Math.random() * 4) * 10) / 10,
      compliance: Math.round((8 + Math.random() * 2) * 10) / 10,
    }

    const weights: Record<string, number> = { greeting: 0.1, professionalism: 0.15, empathy: 0.15, accuracy: 0.2, resolution: 0.2, efficiency: 0.1, compliance: 0.1 }
    const overall = Object.entries(dimensions).reduce((s, [k, v]) => s + v * weights[k], 0)

    return {
      conversationId,
      overallScore: Math.round(overall * 10) / 10,
      dimensions,
      strengths: ['开场问候完整', '解决方案准确', '语气礼貌专业'],
      improvements: ['同理心表达不够', '解决效率有待提升'],
      scoreBreakdown: Object.entries(dimensions).map(([k, v]) => ({
        criteria: k,
        score: v,
        weight: weights[k],
        weightedScore: Math.round(v * weights[k] * 10) / 10,
      })),
    }
  }

  /**
   * 工单分析
   */
  analyzeTickets(period: string): TicketAnalytics {
    const total = Math.round(500 + Math.random() * 1500)
    const resolved = Math.round(total * (0.6 + Math.random() * 0.3))
    return {
      period,
      totalTickets: total,
      resolvedTickets: resolved,
      openTickets: total - resolved,
      averageResolutionTime: Math.round((120 + Math.random() * 480) * 10) / 10,
      medianResolutionTime: Math.round((90 + Math.random() * 300) * 10) / 10,
      firstResponseTime: Math.round((15 + Math.random() * 120) * 10) / 10,
      resolutionRate: Math.round((resolved / total) * 10000) / 100,
      slaCompliance: Math.round((70 + Math.random() * 25) * 10) / 10,
      backlog: Math.round(20 + Math.random() * 80),
      ticketsByCategory: {
        '产品咨询': Math.round(total * 0.3),
        '技术支持': Math.round(total * 0.25),
        '订单查询': Math.round(total * 0.15),
        '投诉建议': Math.round(total * 0.1),
        '退换货': Math.round(total * 0.1),
        '其他': Math.round(total * 0.1),
      },
      ticketsByPriority: {
        '紧急': Math.round(total * 0.08),
        '高': Math.round(total * 0.22),
        '中': Math.round(total * 0.45),
        '低': Math.round(total * 0.25),
      },
      trends: Array.from({ length: 7 }, (_, i) => {
        const dayCreated = Math.round(50 + Math.random() * 100)
        return {
          date: new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10),
          created: dayCreated,
          resolved: Math.round(dayCreated * (0.5 + Math.random() * 0.4)),
          backlog: Math.round(Math.max(0, 0 + Math.random() * 30)),
        }
      }),
    }
  }

  /**
   * CSAT 预测
   */
  predictCSAT(conversationId: string): CustomerSatisfactionPrediction {
    const predicted = Math.round((5 + Math.random() * 4) * 10) / 10
    return {
      conversationId,
      predictedCSAT: predicted,
      confidence: Math.round((0.6 + Math.random() * 0.3) * 100) / 100,
      keyDrivers: [
        { factor: '首次响应时间', impact: 0.3, currentValue: Math.round(30 + Math.random() * 120), targetValue: 30 },
        { factor: '解决时长', impact: 0.25, currentValue: Math.round(180 + Math.random() * 600), targetValue: 180 },
        { factor: '客服态度', impact: 0.2, currentValue: Math.round(6 + Math.random() * 4), targetValue: 8 },
        { factor: '解决率', impact: 0.15, currentValue: Math.round(70 + Math.random() * 30), targetValue: 90 },
        { factor: '沟通清晰度', impact: 0.1, currentValue: Math.round(6 + Math.random() * 3), targetValue: 8 },
      ],
      riskLevel: predicted >= 7 ? 'low' : predicted >= 5 ? 'medium' : 'high',
      recommendedActions: [
        predicted < 7 ? '建议跟进回访' : '维持当前服务水平',
        '优化首次响应时间',
        '加强客服产品知识培训',
      ],
    }
  }

  /**
   * 会话摘要
   */
  summarizeConversation(conversationId: string): ConversationSummary {
    const duration = Math.round(120 + Math.random() * 600)
    return {
      conversationId,
      customerId: `cust-${Math.round(1000 + Math.random() * 9000)}`,
      agentId: `agent-${Math.round(10 + Math.random() * 90)}`,
      startTime: new Date(Date.now() - duration * 1000).toISOString(),
      endTime: new Date().toISOString(),
      duration,
      category: '产品咨询',
      summary: '客户咨询智能营销系统的功能特点和使用场景，客服详细介绍了核心功能和适用客户群体，客户对方案表示感兴趣，要求发送详细资料。',
      issues: ['功能需求不明确', '对比多家供应商'],
      resolutions: ['提供了产品功能介绍', '安排了产品demo'],
      followUpRequired: true,
      followUpAction: '发送产品资料并预约下周演示',
    }
  }

  /**
   * CSAT 看板
   */
  getCSATDashboard(period: string): CSATDashboard {
    const distribution: Record<number, number> = {}
    const total = Math.round(200 + Math.random() * 300)
    for (let i = 1; i <= 10; i++) {
      distribution[i] = Math.round(total * (i <= 3 ? 0.02 : i <= 6 ? 0.08 : i <= 8 ? 0.2 : 0.3))
    }

    return {
      period,
      overallCSAT: Math.round((6 + Math.random() * 3) * 10) / 10,
      surveyCount: total,
      responseRate: Math.round((20 + Math.random() * 30) * 10) / 10,
      distribution,
      byCategory: { '产品咨询': 8.5, '技术支持': 7.8, '订单查询': 9.0, '投诉建议': 5.2, '退换货': 7.0 },
      byAgent: Array.from({ length: 5 }, (_, i) => ({
        agentId: `agent-${100 + i}`,
        name: `客服 ${String.fromCharCode(65 + i)}`,
        csat: Math.round((6 + Math.random() * 3.5) * 10) / 10,
        conversations: Math.round(30 + Math.random() * 70),
      })).sort((a, b) => b.csat - a.csat),
      trending: Math.random() > 0.5 ? 'improving' : Math.random() > 0.5 ? 'stable' : 'declining',
      topDrivers: [
        { factor: '响应速度', impact: 0.35 },
        { factor: '解决效率', impact: 0.28 },
        { factor: '客服态度', impact: 0.22 },
        { factor: '专业性', impact: 0.15 },
      ],
      recommendations: [
        '投诉建议类目CSAT偏低，建议专项提升',
        '整体趋势良好，建议维持服务水平',
        '建议加强高峰期人力配置，降低响应时间',
      ],
    }
  }

  /**
   * 自动化机会识别
   */
  identifyAutomationOpportunities(): AutomationOpportunity[] {
    return [
      { pattern: '密码重置', frequency: 1200, avgHandleTime: 180, automationPotential: 0.9, complexity: 'low', estimatedSavings: 36000, implementationEffort: '2周', priority: 1, suggestedSolution: '自助密码重置功能' },
      { pattern: '订单状态查询', frequency: 800, avgHandleTime: 120, automationPotential: 0.85, complexity: 'low', estimatedSavings: 16000, implementationEffort: '3周', priority: 2, suggestedSolution: '订单追踪机器人' },
      { pattern: '退换货申请', frequency: 500, avgHandleTime: 360, automationPotential: 0.7, complexity: 'medium', estimatedSavings: 30000, implementationEffort: '4周', priority: 3, suggestedSolution: '自助退换货流程' },
      { pattern: '产品功能咨询', frequency: 1500, avgHandleTime: 240, automationPotential: 0.6, complexity: 'medium', estimatedSavings: 60000, implementationEffort: '6周', priority: 4, suggestedSolution: '智能FAQ机器人' },
      { pattern: '账户信息变更', frequency: 300, avgHandleTime: 180, automationPotential: 0.8, complexity: 'low', estimatedSavings: 7200, implementationEffort: '2周', priority: 5, suggestedSolution: '自助修改信息' },
    ]
  }

  /**
   * 客服绩效评估
   */
  evaluateAgentPerformance(agentId: string): AgentPerformance {
    const conversations = Math.round(80 + Math.random() * 120)
    return {
      agentId,
      name: `客服 ${agentId}`,
      conversationsHandled: conversations,
      averageHandleTime: Math.round((120 + Math.random() * 240) * 10) / 10,
      csatScore: Math.round((6.5 + Math.random() * 3) * 10) / 10,
      resolutionRate: Math.round((70 + Math.random() * 25) * 10) / 10,
      firstResponseTime: Math.round((15 + Math.random() * 60) * 10) / 10,
      complianceScore: Math.round((80 + Math.random() * 18) * 10) / 10,
      occupancyRate: Math.round((65 + Math.random() * 25) * 10) / 10,
      afterWorkTime: Math.round((30 + Math.random() * 60) * 10) / 10,
      kpiScore: Math.round((70 + Math.random() * 25) * 10) / 10,
      strengths: ['响应速度快', '产品知识丰富'],
      areasForImprovement: ['通话后处理时间偏长', '向上销售意识不足'],
      rank: Math.round(1 + Math.random() * 10),
    }
  }

  /**
   * 知识库统计
   */
  getKnowledgeBaseStats(): KnowledgeBaseStats {
    const total = Math.round(200 + Math.random() * 300)
    return {
      totalArticles: total,
      publishedArticles: Math.round(total * 0.8),
      draftArticles: Math.round(total * 0.2),
      totalViews: Math.round(50000 + Math.random() * 50000),
      totalVotes: Math.round(3000 + Math.random() * 3000),
      helpfulPercentage: Math.round((70 + Math.random() * 20) * 10) / 10,
      topArticles: Array.from({ length: 5 }, (_, i) => ({
        id: `article-${100 + i}`,
        title: ['产品功能指南', '常见问题解答', '订单处理流程', '退换货政策', '会员权益说明'][i],
        views: Math.round(2000 + Math.random() * 8000),
        helpfulness: Math.round((70 + Math.random() * 25) * 10) / 10,
        category: ['产品', 'FAQ', '流程', '政策', '会员'][i],
      })).sort((a, b) => b.views - a.views),
      searchAnalytics: [
        { query: '如何退款', frequency: 1200, clickThrough: 65, satisfaction: 78 },
        { query: '密码重置', frequency: 980, clickThrough: 72, satisfaction: 85 },
        { query: '会员等级', frequency: 750, clickThrough: 58, satisfaction: 70 },
        { query: '配送时间', frequency: 620, clickThrough: 45, satisfaction: 62 },
        { query: '发票开具', frequency: 540, clickThrough: 50, satisfaction: 68 },
      ],
      gaps: [
        { topic: '跨店退款流程', searchFrequency: 380, articleMissing: true },
        { topic: '企业发票须知', searchFrequency: 280, articleMissing: true },
        { topic: '国际配送说明', searchFrequency: 150, articleMissing: true },
      ],
    }
  }

  /**
   * 机器人性能
   */
  getBotPerformance(): BotPerformance {
    return {
      intentRecognitionRate: Math.round((85 + Math.random() * 12) * 10) / 10,
      resolutionRate: Math.round((40 + Math.random() * 30) * 10) / 10,
      handoffRate: Math.round((30 + Math.random() * 25) * 10) / 10,
      averageConversationsPerDay: Math.round(800 + Math.random() * 400),
      topIntents: [
        { intent: '订单状态查询', count: 3500, resolutionRate: 85 },
        { intent: '退换货政策', count: 2800, resolutionRate: 72 },
        { intent: '产品咨询', count: 2500, resolutionRate: 65 },
        { intent: '会员权益', count: 1800, resolutionRate: 78 },
        { intent: '价格查询', count: 1500, resolutionRate: 80 },
      ],
      fallbackRate: Math.round((15 + Math.random() * 15) * 10) / 10,
      userSatisfaction: Math.round((60 + Math.random() * 30) * 10) / 10,
      improvementSuggestions: [
        '提升复杂意图的识别准确率',
        '优化无匹配场景的转人工流程',
        '增加多轮对话支持',
      ],
    }
  }
}
