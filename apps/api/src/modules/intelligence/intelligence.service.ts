/**
 * intelligence.service.ts — 运营参谋 (P-50 V2 · AI赋能引擎)
 *
 * 功能:
 *   1. 开业可行性报告 (基于侦察兵竞品数据)
 *   2. 装修全景财务报告 (P-50 V2 · 完整财务模型)
 *   3. 运营参谋 (AI选择题模式 · 7大类)
 *   4. 竞争监控 (异步采集 · 增量/全量/去重/走势)
 *   5. AI决策引擎 (数据推理 · 含数据佐证)
 */
import { Injectable, Logger } from '@nestjs/common'
import { IntelligenceAiService } from './intelligence-ai.service'
import { MonitorCollectorService } from './monitor-collector.service'
import type {
  FeasibilityReport,
  OperationAdviceChoice,
  AdviceOption,
  CompetitorAlert,
  MonitorScanResult,
  ScanMode,
  FinancePanorama,
  RenovationTier,
  RenovationTierZh,
  TrendPoint,
} from './intelligence.entity'

@Injectable()
export class IntelligenceService {
  private readonly logger = new Logger(IntelligenceService.name)

  constructor(
    private readonly aiService: IntelligenceAiService,
    private readonly collector: MonitorCollectorService,
  ) {}

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

  /** 最近一次扫描缓存 */
  private lastScanResult: MonitorScanResult | null = null

  // ─── 1. 开业可行性报告 ──────────────────────────────

  generateFeasibilityReport(city: string, district: string, budget: number): FeasibilityReport {
    const key = `${city}-${district}`
    const density = this.COMPETITOR_DENSITY[key] || this.COMPETITOR_DENSITY.default!

    const competitorDensity = Math.min(density.count / 10, 1)
    const score = Math.round((1 - competitorDensity * 0.4) * 60 + Math.min(budget / 500, 0.3) * 100 + 10)
    const finalScore = Math.min(Math.max(score, 0), 100)

    const scoreLevel = finalScore >= 75 ? 'high' as const : finalScore >= 50 ? 'medium' as const : 'low' as const

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

  // ─── 1b. 装修全景财务报告 (P-50 V2) ──────────────────

  calculateFinancePanorama(
    budgetParam: number,
    area: number,
    tier: RenovationTier,
    city: string,
    district: string,
  ): FinancePanorama {
    // 参数清理
    const safeBudget = budgetParam <= 0 ? 300 : budgetParam
    const safeArea = area <= 0 ? 300 : Math.min(area, 5000)

    // 装修档次单价（中文映射）
    const RENOVATION_ZH: Record<RenovationTier, RenovationTierZh> = {
      luxury: '豪华',
      standard: '标准',
      economy: '经济',
    }
    const RENOVATION_PRICE_MAP: Record<RenovationTierZh, number> = {
      '豪华': 3500,
      '精装': 2000,
      '标准': 1200,
      '经济': 600,
    }
    const tierZh = RENOVATION_ZH[tier] ?? '标准'
    const renovationPerSqm = RENOVATION_PRICE_MAP[tierZh]
    const renovationCost = Math.round(renovationPerSqm * safeArea)

    // 城市数据
    const CITY_RENT_MAP: Record<string, { rent: number; salary: number }> = {
      '上海': { rent: 280, salary: 12000 },
      '北京': { rent: 250, salary: 12000 },
      '深圳': { rent: 220, salary: 11000 },
      '广州': { rent: 200, salary: 10000 },
      '杭州': { rent: 180, salary: 9500 },
      '成都': { rent: 150, salary: 8000 },
      '南京': { rent: 160, salary: 8500 },
      '重庆': { rent: 130, salary: 7500 },
      '武汉': { rent: 140, salary: 7500 },
      '西安': { rent: 120, salary: 7000 },
      '长沙': { rent: 130, salary: 7000 },
      default: { rent: 100, salary: 6000 },
    }
    const cityData = CITY_RENT_MAP[city] ?? CITY_RENT_MAP.default!

    // ── 首期投入 ──
    const equipmentCost = Math.round(safeBudget * 10000 * 0.45)
    const softwareSystemCost = Math.round(Math.min(Math.max(80000 + safeArea * 60, 80000), 200000))
    const monthlyRent = Math.round(cityData.rent * safeArea)
    const deposit = monthlyRent * 3

    const initialInvestment = {
      equipmentCost,
      renovationCost,
      softwareSystemCost,
      deposit,
      total: equipmentCost + renovationCost + softwareSystemCost + deposit,
    }

    // ── 月固定成本 ──
    const staffCount = safeArea <= 200 ? 6 : safeArea <= 500 ? 8 : safeArea <= 800 ? 10 : 12
    const labor = staffCount * cityData.salary
    const equipmentMaintenance = Math.round(equipmentCost * 0.1 / 12)
    const systemSubscription = Math.round(Math.min(Math.max(3000 + safeArea * 3, 3000), 8000))

    const monthlyFixedCost = {
      rent: monthlyRent,
      labor,
      equipmentMaintenance,
      systemSubscription,
      total: monthlyRent + labor + equipmentMaintenance + systemSubscription,
    }

    // ── 营收预估（基于竞品数据） ──
    const densityKey = `${city}-${district}`
    const density = this.COMPETITOR_DENSITY[densityKey] ?? this.COMPETITOR_DENSITY.default!
    const avgTicketPrice = density.avgPrice
    const peoplePerSqm = 2.5
    const estimatedDailyTraffic = Math.round(safeArea / peoplePerSqm * 1.2)
    const estimatedMonthlyRevenue = Math.round(avgTicketPrice * estimatedDailyTraffic * 30)

    // ── 月变动成本 ──
    const electricity = Math.round(safeArea * 20)
    const consumables = Math.round(estimatedMonthlyRevenue * 0.025)
    const marketing = Math.round(estimatedMonthlyRevenue * 0.05)

    const monthlyVariableCost = {
      electricity,
      consumables,
      marketing,
      total: electricity + consumables + marketing,
    }

    // ── 月总成本 ──
    const monthlyTotalCost = monthlyFixedCost.total + monthlyVariableCost.total

    // ── 折旧与摊销 ──
    const monthlyDepreciation = Math.round(equipmentCost / 36)
    const monthlyAmortization = Math.round(renovationCost / 60)

    // ── 利润与回收期 ──
    const estimatedMonthlyProfit = estimatedMonthlyRevenue - monthlyTotalCost

    const paybackMonths = estimatedMonthlyProfit > 0
      ? Math.ceil(initialInvestment.total / estimatedMonthlyProfit)
      : 999

    const monthlyDeduct = estimatedMonthlyProfit - monthlyDepreciation - monthlyAmortization
    const paybackWithDepreciation = monthlyDeduct > 0
      ? Math.ceil(initialInvestment.total / monthlyDeduct)
      : 999

    // ── 同城对比 ──
    const cityAvgComparison = {
      initialInvestment: Math.round(initialInvestment.total * 0.9),
      monthlyFixedCost: Math.round(monthlyFixedCost.total * 0.95),
      monthlyRevenue: Math.round(estimatedMonthlyRevenue * 1.1),
      paybackMonths: Math.max(1, Math.round(paybackMonths * 1.15)),
    }

    // ── 兼容旧字段 ──
    const totalCost = initialInvestment.total
    const monthlyOpEx = monthlyTotalCost
    const projectedMonthlyRevenue = estimatedMonthlyRevenue
    const projectedMonthlyProfit = estimatedMonthlyProfit
    const annualRevenueProjection = projectedMonthlyRevenue * 12

    const breakEvenAnalysis = paybackMonths <= 12
      ? '一年内可回本，投资回报率较高'
      : paybackMonths <= 24
        ? '1-2年可回本，属于行业平均水平'
        : '回本周期较长，建议优化成本结构'

    const recommendation = tier === 'luxury'
      ? '高端路线适合核心商圈，建议关注服务体验差异化'
      : tier === 'economy'
        ? '经济型方案适合社区店，控制成本的同时保证基本体验'
        : '标准方案性价比最优，适多数商圈投资'

    return {
      // 输入参数
      budget: safeBudget, area: safeArea, tier, city, district,

      // 新版财务全景
      initialInvestment,
      monthlyFixedCost,
      monthlyVariableCost,
      monthlyTotalCost,
      revenueEstimate: {
        avgTicketPrice,
        estimatedDailyTraffic,
        estimatedMonthlyRevenue,
        estimatedMonthlyProfit,
      },
      monthlyDepreciation,
      monthlyAmortization,
      paybackMonths,
      paybackWithDepreciation,
      cityAvgComparison,

      // 兼容旧字段
      renovationCostBreakdown: [
        { category: '硬装(地面/墙面/吊顶)', amount: Math.round(renovationCost * 0.5), percent: 50 },
        { category: '软装(灯光/标识/休息区)', amount: Math.round(renovationCost * 0.3), percent: 30 },
        { category: '消防/安防/通风', amount: Math.round(renovationCost * 0.2), percent: 20 },
      ],
      equipmentCostBreakdown: [
        { name: '街机/射击区', count: 8, unitCost: 40000, total: 320000 },
        { name: 'VR体验区', count: 4, unitCost: 70000, total: 280000 },
        { name: '跳舞机/音游', count: 3, unitCost: 40000, total: 120000 },
        { name: '夹娃娃机', count: 12, unitCost: 8000, total: 96000 },
      ],
      totalCost,
      monthlyOpEx,
      projectedMonthlyRevenue,
      projectedMonthlyProfit,
      annualRevenueProjection,
      breakEvenAnalysis,
      recommendation,
    }
  }

  // ─── 2. 运营参谋 (AI选择题 · 7大类) ──────────────────

  generateOperationAdvice(storeId: string, category?: string): OperationAdviceChoice[] {
    const choices: OperationAdviceChoice[] = [
      // ── Pricing ──
      {
        id: 'pricing-1', category: 'pricing',
        question: '周末高峰时段如何定价？',
        aiSuggestion: '建议采用分时段定价策略，周末18:00-21:00为黄金时段，溢价20%',
        options: this.buildOptions('pricing', [
          { id: 'p-a', label: '统一价格', description: '全天统一价¥88/人', pros: ['简单易执行', '客户体验好'], cons: ['高峰期收入少', '平时段闲置'], estimatedEffect: '预计月收入+8%' },
          { id: 'p-b', label: '分时段定价', description: '高峰¥108/人·平峰¥68', pros: ['收入最大化', '引导错峰'], cons: ['定价复杂', '需系统支持'], estimatedEffect: '预计月收入+22%' },
          { id: 'p-c', label: '动态定价', description: 'AI根据实时客流量调整', pros: ['最优定价', '智能化'], cons: ['技术门槛高', '客户接受度低'], estimatedEffect: '预计月收入+30%' },
        ]),
      },
      // ── Activity ──
      {
        id: 'activity-1', category: 'activity',
        question: '本月主推什么活动？',
        aiSuggestion: '参考同城竞品活动日历，建议推出抖音团购套餐+周末主题比赛',
        options: this.buildOptions('activity', [
          { id: 'a-a', label: '抖音团购', description: '¥69双人畅玩2小时', pros: ['曝光量大', '引流快'], cons: ['利润薄', '到店转化需配套'], estimatedEffect: '预计新增客流+40%' },
          { id: 'a-b', label: '周末主题赛', description: '投篮/跳舞机PK赛', pros: ['话题性强', '复购率高'], cons: ['筹备周期长', '奖品成本'], estimatedEffect: '预计新增客流+25%' },
          { id: 'a-c', label: '会员日半价', description: '每月15号会员专享半价', pros: ['会员粘性', '口碑传播'], cons: ['短期损失', '需足够会员基础'], estimatedEffect: '预计新增客流+15%' },
        ]),
      },
      // ── Equipment ──
      {
        id: 'equipment-1', category: 'equipment',
        question: '下季度哪些设备需要更新？',
        aiSuggestion: '根据竞品设备数据分析，建议优先更新VR设备和新增运动竞技类设备',
        options: this.buildOptions('equipment', [
          { id: 'e-a', label: '升级VR区', description: '更换4台最新VR设备', pros: ['技术优势', '体验感强'], cons: ['投入大', '需专业人员'], estimatedEffect: '预计新增收入+15%' },
          { id: 'e-b', label: '新增保龄球/射箭', description: '运动竞技类2-4道', pros: ['差异化', '适合团建'], cons: ['占地大', '运维复杂'], estimatedEffect: '预计新增收入+25%' },
          { id: 'e-c', label: '翻新夹娃娃机', description: '更换10台新款+增加奖品', pros: ['低成本', '效果立竿见影'], cons: ['同质化', '短期效果'], estimatedEffect: '预计新增收入+10%' },
        ]),
      },
      // ── Promotion ──
      {
        id: 'promotion-1', category: 'promotion',
        question: '如何应对竞品新出的¥49团购？',
        aiSuggestion: '不建议打价格战，建议用差异化套餐回应',
        options: this.buildOptions('promotion', [
          { id: 'r-a', label: '跟进降价', description: '同步推出¥49套餐', pros: ['维持客流量'], cons: ['利润下降', '品牌掉价'], estimatedEffect: '短期保客流·利润-20%' },
          { id: 'r-b', label: '增值不加价', description: '保持原价¥69但增加礼品', pros: ['价值感知', '不伤品牌'], cons: ['增加成本'], estimatedEffect: '保持客流·成本+10%' },
          { id: 'r-c', label: '场景升级', description: '推出¥99"畅玩+饮品"套餐', pros: ['客单价提升', '差异化'], cons: ['需配套'], estimatedEffect: '预计月收入+18%' },
        ]),
      },
      // ── Recruit — 联名活动/IP跨界 (新增) ──
      {
        id: 'recruit-1', category: 'recruit',
        question: '如何策划联名活动提升品牌影响力？',
        aiSuggestion: '建议优先考虑与本地热门IP合作，联名活动可带来30%+客流增长。同城竞品联名活动平均获客增长35%',
        options: this.buildOptions('recruit', [
          { id: 'rec-a', label: 'IP联名主题', description: '与热门动漫/游戏IP合作主题活动', pros: ['话题性强', '客单价高'], cons: ['授权成本', '周期长'], estimatedEffect: '预计月收入+35%' },
          { id: 'rec-b', label: '跨界品牌联名', description: '与热门茶饮/餐饮品牌联名套餐', pros: ['成本可控', '精准互导'], cons: ['排他性', '协调复杂'], estimatedEffect: '预计月收入+22%' },
          { id: 'rec-c', label: 'KOL探店推广', description: '邀请本地KOL探店+联名限定活动', pros: ['传播快', 'ROI高'], cons: ['效果波动', '筛选成本'], estimatedEffect: '预计月收入+18%' },
        ]),
      },
      // ── Seasonal — 暑假/寒假限定活动 (新增) ──
      {
        id: 'seasonal-1', category: 'seasonal',
        question: '假期季推什么类型活动最有效？',
        aiSuggestion: '假期档营收占全年30%+，建议提前1个月筹备。畅玩卡方案在同城竞品中平均获客增长38%',
        options: this.buildOptions('seasonal', [
          { id: 'sea-a', label: '假期畅玩卡', description: '假期不限次畅玩卡+赠品', pros: ['锁客强', '现金流好'], cons: ['需预售', '限时效应'], estimatedEffect: '预计月收入+35%' },
          { id: 'sea-b', label: '季节性主题布置', description: '限时主题装饰+互动游戏', pros: ['新鲜感', '社交传播'], cons: ['布置成本', '时效短'], estimatedEffect: '预计月收入+25%' },
          { id: 'sea-c', label: '假期托管营', description: '假期日间托管+游乐+餐饮', pros: ['差异化', '客单价高'], cons: ['人力成本高', '资质要求'], estimatedEffect: '预计月收入+28%' },
        ]),
      },
      // ── Blindbox — 盲盒/抽奖促销(合规版) (新增) ──
      {
        id: 'blindbox-1', category: 'blindbox',
        question: '如何设计合规的盲盒/抽奖促销？',
        aiSuggestion: '合规盲盒方案客单价可提升50%，但必须明示概率和保底机制。集章抽奖是低风险替代方案',
        options: this.buildOptions('blindbox', [
          { id: 'bl-a', label: '潮玩盲盒机', description: '合规版盲盒机(明示概率·保底机制)', pros: ['客单价高', '复购强'], cons: ['合规要求', '投入成本'], estimatedEffect: '预计月收入+25%' },
          { id: 'bl-b', label: '集章抽奖活动', description: '消费集章兑换抽奖机会', pros: ['无合规风险', '粘性强'], cons: ['效果慢', '奖品成本'], estimatedEffect: '预计月收入+18%' },
          { id: 'bl-c', label: '幸运转盘', description: '消费满额转盘抽奖', pros: ['参与率高', '成本可控'], cons: ['效果递减', '需创新'], estimatedEffect: '预计月收入+15%' },
        ]),
      },
    ]

    if (category) return choices.filter(c => c.category === category)
    return choices
  }

  // ─── 3. 竞争监控 (异步采集) ─────────────────────────

  async monitorCompetitor(city?: string, mode?: ScanMode): Promise<MonitorScanResult> {
    const scanMode: ScanMode = mode ?? 'incremental'
    const scanTimestamp = new Date().toISOString()

    let rawAlerts: CompetitorAlert[]
    if (scanMode === 'full') {
      rawAlerts = await this.collector.fullScan(city)
    } else {
      rawAlerts = await this.collector.incrementalScan(city)
    }

    // 去重
    const dedupedAlerts = this.collector.deduplicate(rawAlerts)
    const trend = await this.collector.generateTrend()

    // 缓存
    this.lastScanResult = {
      alerts: dedupedAlerts,
      scanTimestamp,
      freshnessMinutes: 0,
      scanMode,
      trend,
    }

    return this.lastScanResult
  }

  async getLatestScanResult(): Promise<MonitorScanResult> {
    if (this.lastScanResult) {
      const elapsed = Date.now() - new Date(this.lastScanResult.scanTimestamp).getTime()
      return {
        ...this.lastScanResult,
        freshnessMinutes: Math.round(elapsed / 60000),
      }
    }

    // 无缓存时执行一次采集
    return this.monitorCompetitor()
  }

  async triggerIncrementalScan(city?: string): Promise<MonitorScanResult> {
    return this.monitorCompetitor(city, 'incremental')
  }

  async triggerFullScan(city?: string): Promise<MonitorScanResult> {
    return this.monitorCompetitor(city, 'full')
  }

  // ─── 私有方法: 为选项注入数据佐证 ─────────────────────

  private buildOptions(category: string, baseOptions: AdviceOption[]): AdviceOption[] {
    const evidences = this.aiService.getDataEvidence(category, baseOptions.length)
    return baseOptions.map((opt, idx) => ({
      ...opt,
      dataEvidence: evidences[idx] ?? '基于同城竞品数据分析的推荐方案',
    }))
  }
}
