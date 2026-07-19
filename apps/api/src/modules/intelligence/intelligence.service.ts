/**
 * intelligence.service.ts — 运营参谋 (P-50)
 *
 * 功能:
 *   1. 开业可行性报告 (基于侦察兵竞品数据)
 *   2. 运营参谋 (AI选择题模式)
 *   3. 竞争监控 (价格/活动/优惠异动)
 */
import { Injectable, Logger } from '@nestjs/common'
import type { FeasibilityReport, OperationAdviceChoice, CompetitorAlert } from './intelligence.entity'

@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger(IntelligenceService.name)

  /** 模拟侦察兵数据库的竞品密度数据 */
  private readonly COMPETITOR_DENSITY: Record<string, { count: number; avgPrice: number }> = {
    '上海-徐汇': { count: 8, avgPrice: 128 },
    '上海-浦东': { count: 6, avgPrice: 145 },
    '上海-静安': { count: 5, avgPrice: 168 },
    '北京-朝阳': { count: 7, avgPrice: 135 },
    '北京-海淀': { count: 4, avgPrice: 118 },
    '深圳-南山': { count: 6, avgPrice: 98 },
    '深圳-福田': { count: 5, avgPrice: 112 },
    '成都-锦江': { count: 4, avgPrice: 78 },
    '成都-武侯': { count: 3, avgPrice: 72 },
    '广州-天河': { count: 5, avgPrice: 88 },
    '杭州-西湖': { count: 3, avgPrice: 92 },
    '南京-鼓楼': { count: 2, avgPrice: 75 },
    default: { count: 1, avgPrice: 60 },
  }

  // ─── 1. 开业可行性报告 ──────────────────────────────

  generateFeasibilityReport(city: string, district: string, budget: number): FeasibilityReport {
    const key = `${city}-${district}`
    const density = this.COMPETITOR_DENSITY[key] || this.COMPETITOR_DENSITY.default!

    const competitorDensity = Math.min(density.count / 10, 1)
    const score = Math.round((1 - competitorDensity * 0.4) * 60 + Math.min(budget / 500, 0.3) * 100 + 10)
    const finalScore = Math.min(Math.max(score, 0), 100)

    const scoreLevel = finalScore >= 75 ? 'high' : finalScore >= 50 ? 'medium' : 'low'

    // 设备建议
    const suggestedEquipment = [
      { name: '街机射击区', count: 8, cost: 320000, reason: `${city}同城竞品平均配置6-10台，覆盖率高` },
      { name: 'VR体验区', count: 4, cost: 280000, reason: `年轻客群偏好${city}区域VR需求年增30%` },
      { name: '跳舞机/音游区', count: 3, cost: 120000, reason: '社交属性强，周末翻台率高' },
      { name: '夹娃娃机', count: 12, cost: 96000, reason: `高利润率项目，${city}平均回收期6个月` },
      { name: '篮球机', count: 4, cost: 48000, reason: '亲子客群必配，引流效果好' },
      { name: '赛车模拟器', count: 3, cost: 156000, reason: `${district}周边竞品差异化配置` },
    ]

    const riskFactors = [
      { factor: '同城竞品密度', level: competitorDensity > 0.5 ? 'high' as const : 'medium' as const,
        suggestion: density.count >= 5 ? '建议差异化定位，避开头部竞品主力项目' : '正常竞争环境，做好本地化运营即可' },
      { factor: '预算匹配度', level: budget < 200 ? 'high' as const : 'low' as const,
        suggestion: budget < 200 ? '建议提高预算至300万+，确保设备和装修品质' : '预算充裕，可配置高端设备' },
      { factor: '商圈成熟度', level: 'medium' as const,
        suggestion: '建议实地考察人流量和周边配套，优先选择商场一层或负一层' },
    ]

    const avgMonthlyRevenue = Math.round((density.avgPrice * 1500 + budget * 8) / 10)

    return {
      city, district, budget,
      score: finalScore,
      scoreLevel,
      summary: `${city}${district}地区${finalScore >= 75 ? '非常适合' : finalScore >= 50 ? '可以考虑' : '不建议'}投资开设新店。当前该区域有${density.count}家竞品，人均消费约¥${density.avgPrice}。`,
      competitorDensity: Math.round(competitorDensity * 100),
      competitorCount: density.count,
      avgPrice: density.avgPrice,
      suggestedEquipment: suggestedEquipment.map(e => ({ ...e, reason: `${e.reason}·` })),
      suggestedPriceRange: { min: density.avgPrice - 20, max: density.avgPrice + 30, avg: density.avgPrice },
      riskFactors,
      marketTrend: `${city}娱乐市场年增长率约15-20%，${district}商圈流量稳定，周末高峰期明显`,
      estimatedMonthlyRevenue: avgMonthlyRevenue,
      estimatedPaybackMonths: Math.round(budget * 10000 / avgMonthlyRevenue),
    }
  }

  // ─── 2. 运营参谋 (AI选择题) ──────────────────────────

  generateOperationAdvice(storeId: string, category?: string): OperationAdviceChoice[] {
    const choices: OperationAdviceChoice[] = [
      {
        id: 'pricing-1', category: 'pricing',
        question: '周末高峰时段如何定价？',
        aiSuggestion: '建议采用分时段定价策略，周末18:00-21:00为黄金时段，溢价20%',
        options: [
          { id: 'p-a', label: '统一价格', description: '全天统一价¥88/人', pros: ['简单易执行', '客户体验好'], cons: ['高峰期收入少', '平时段闲置'], estimatedEffect: '预计月收入+8%' },
          { id: 'p-b', label: '分时段定价', description: '高峰¥108/人·平峰¥68', pros: ['收入最大化', '引导错峰'], cons: ['定价复杂', '需系统支持'], estimatedEffect: '预计月收入+22%' },
          { id: 'p-c', label: '动态定价', description: 'AI根据实时客流量调整', pros: ['最优定价', '智能化'], cons: ['技术门槛高', '客户接受度低'], estimatedEffect: '预计月收入+30%' },
        ],
      },
      {
        id: 'activity-1', category: 'activity',
        question: '本月主推什么活动？',
        aiSuggestion: '参考同城竞品活动日历，建议推出抖音团购套餐+周末主题比赛',
        options: [
          { id: 'a-a', label: '抖音团购', description: '¥69双人畅玩2小时', pros: ['曝光量大', '引流快'], cons: ['利润薄', '到店转化需配套'], estimatedEffect: '预计新增客流+40%' },
          { id: 'a-b', label: '周末主题赛', description: '投篮/跳舞机PK赛', pros: ['话题性强', '复购率高'], cons: ['筹备周期长', '奖品成本'], estimatedEffect: '预计新增客流+25%' },
          { id: 'a-c', label: '会员日半价', description: '每月15号会员专享半价', pros: ['会员粘性', '口碑传播'], cons: ['短期损失', '需足够会员基础'], estimatedEffect: '预计新增客流+15%' },
        ],
      },
      {
        id: 'equipment-1', category: 'equipment',
        question: '下季度哪些设备需要更新？',
        aiSuggestion: '根据竞品设备数据分析，建议优先更新VR设备和新增运动竞技类设备',
        options: [
          { id: 'e-a', label: '升级VR区', description: '更换4台最新VR设备', pros: ['技术优势', '体验感强'], cons: ['投入大', '需专业人员'], estimatedEffect: '预计新增收入+15%' },
          { id: 'e-b', label: '新增保龄球/射箭', description: '运动竞技类2-4道', pros: ['差异化', '适合团建'], cons: ['占地大', '运维复杂'], estimatedEffect: '预计新增收入+25%' },
          { id: 'e-c', label: '翻新夹娃娃机', description: '更换10台新款+增加奖品', pros: ['低成本', '效果立竿见影'], cons: ['同质化', '短期效果'], estimatedEffect: '预计新增收入+10%' },
        ],
      },
      {
        id: 'promotion-1', category: 'promotion',
        question: '如何应对竞品新出的¥49团购？',
        aiSuggestion: '不建议打价格战，建议用差异化套餐回应',
        options: [
          { id: 'r-a', label: '跟进降价', description: '同步推出¥49套餐', pros: ['维持客流量'], cons: ['利润下降', '品牌掉价'], estimatedEffect: '短期保客流·利润-20%' },
          { id: 'r-b', label: '增值不加价', description: '保持原价¥69但增加礼品', pros: ['价值感知', '不伤品牌'], cons: ['增加成本'], estimatedEffect: '保持客流·成本+10%' },
          { id: 'r-c', label: '场景升级', description: '推出¥99"畅玩+饮品"套餐', pros: ['客单价提升', '差异化'], cons: ['需配套'], estimatedEffect: '预计月收入+18%' },
        ],
      },
    ]

    if (category) return choices.filter(c => c.category === category)
    return choices
  }

  // ─── 3. 竞争监控 ──────────────────────────────────────

  monitorCompetitor(storeId: string, city?: string): CompetitorAlert[] {
    const mockAlerts: CompetitorAlert[] = [
      {
        storeName: '同城竞品A', city: city || '上海',
        type: 'price_change', severity: 'high',
        description: '竞品A将周末价格从¥88调整至¥68，降幅22.7%',
        detectedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
        recommendedAction: '建议：保持差异化定位，不跟进降价，改为增值服务应对',
      },
      {
        storeName: '竞品B', city: city || '上海',
        type: 'new_activity', severity: 'medium',
        description: '竞品B推出"暑期亲子卡"活动，月卡¥299含10次',
        detectedAt: new Date(Date.now() - 6 * 3600000).toISOString(),
        recommendedAction: '建议：评估推出类似亲子套餐，价格对标¥269/10次',
      },
      {
        storeName: '竞品C', city: city || '上海',
        type: 'new_promotion', severity: 'low',
        description: '竞品C抖音推出¥39团购券(原价¥88)，限时3天',
        detectedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
        recommendedAction: '建议：不跟风低价团购，加强会员体系粘性',
      },
      {
        storeName: '竞品A', city: city || '上海',
        type: 'rating_change', severity: 'medium',
        description: '竞品A大众点评评分从4.2降至3.8，近期差评增多',
        detectedAt: new Date(Date.now() - 3 * 3600000).toISOString(),
        recommendedAction: '建议：抓住机会加强自家评价管理，引导好评',
      },
    ]
    return mockAlerts
  }
}
