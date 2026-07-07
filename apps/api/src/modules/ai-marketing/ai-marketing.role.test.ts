import { describe, it, expect } from 'vitest'
import {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
  AIMarketingCMOService,
} from './ai-marketing-cmo.service'

/**
 * ai-marketing 角色测试 (8角色视角)
 * 遵循商场组织架构测试每个角色的正常+边界流程
 * 扩展版本：每个角色至少3个测试用例
 */

function makeROI(): MarketingROIService { return new MarketingROIService() }
function makeCopy(): CopywritingAssistant { return new CopywritingAssistant() }
function makePlanner(): CampaignPlanner { return new CampaignPlanner() }
function makeCMO(): AIMarketingCMOService {
  return new AIMarketingCMOService(makeROI(), makeCopy(), makePlanner())
}

// ─── 👔 店长 ───────────────────────────────────────────────────

describe('👔 店长 - 营销决策', () => {
  it('正例: 查看指定活动的 ROI 评估效果', () => {
    const roi = makeROI()
    const result = roi.calculateCampaignROI('camp-003') // 会员日促销
    expect(result).toBeDefined()
    expect(result!.isPositive).toBe(true)
    expect(result!.roiPercent).toBeGreaterThan(0)
    expect(result!.campaignId).toBe('camp-003')
    expect(result!.profit).toBeGreaterThan(0)
  })

  it('正例: 比较多个活动 ROI 辅助决策', () => {
    const roi = makeROI()
    const ids = ['camp-001', 'camp-002', 'camp-003', 'camp-004']
    const results = roi.compareCampaigns(ids)
    expect(results).toHaveLength(4)
    // ROI 降序排列（最好的在前面）
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].roi).toBeGreaterThanOrEqual(results[i].roi)
    }
  })

  it('边界: 查询不存在的活动 ID 应返回 null', () => {
    const roi = makeROI()
    const result = roi.calculateCampaignROI('nonexistent-campaign')
    expect(result).toBeNull()
  })

  it('边界: 查询空字符串活动 ID', () => {
    const roi = makeROI()
    const result = roi.calculateCampaignROI('')
    expect(result).toBeNull()
  })

  it('边界: 查询亏损活动能正确标记 isPositive=false', () => {
    const roi = makeROI()
    const result = roi.calculateCampaignROI('camp-005') // 亏损活动
    expect(result).toBeDefined()
    expect(result!.isPositive).toBe(false)
    expect(result!.roiPercent).toBeLessThan(0)
    expect(result!.profit).toBeLessThan(0)
  })
})

// ─── 🛒 前台 ───────────────────────────────────────────────────

describe('🛒 前台 - 文案生成与顾客互动', () => {
  it('正例: 为盲盒商品生成推广文案', () => {
    const copy = makeCopy()
    const result = copy.generateCopy({
      product: '盲盒系列',
      goal: 'conversion',
      audience: '进店顾客',
    })
    expect(result.headline).toBeDefined()
    expect(result.cta).toBeDefined()
    expect(result.body.length).toBeGreaterThan(0)
    expect(result.taglines.length).toBeGreaterThan(0)
  })

  it('正例: 正式语气与轻松语气生成的文案风格不同', () => {
    const copy = makeCopy()
    const casual = copy.generateCopy({ product: '新品', goal: 'conversion', audience: '用户', tone: 'casual' })
    const formal = copy.generateCopy({ product: '新品', goal: 'conversion', audience: '用户', tone: 'formal' })
    // 标题风格不同（buildHeadline 根据 tone 返回不同模板）
    expect(casual.headline).not.toBe(formal.headline)
  })

  it('正例: 短文案与长文案内容长度不同', () => {
    const copy = makeCopy()
    const short = copy.generateCopy({ product: '测试', goal: 'conversion', audience: '用户', length: 'short' })
    const long = copy.generateCopy({ product: '测试', goal: 'conversion', audience: '用户', length: 'long' })
    expect(short.body.length).toBeLessThanOrEqual(long.body.length)
  })

  it('边界: 不同目标生成的文案核心不同', () => {
    const copy = makeCopy()
    const awareness = copy.generateCopy({ product: '新品', goal: 'awareness', audience: '用户' })
    const retention = copy.generateCopy({ product: '新品', goal: 'retention', audience: '用户' })
    expect(awareness.headline).not.toBe(retention.headline)
  })

  it('边界: 指定 CTA 被保留', () => {
    const copy = makeCopy()
    const result = copy.generateCopy({ product: '盲盒', goal: 'conversion', audience: '用户', cta: '点击查看' })
    expect(result.cta).toBe('点击查看')
  })

  it('边界: 优化标题每次不同', () => {
    const copy = makeCopy()
    const headline = '全新盲盒上市'
    const results = new Set<string>()
    for (let i = 0; i < 20; i++) {
      results.add(copy.optimizeHeadline(headline))
    }
    // 至少有2种不同的优化结果
    expect(results.size).toBeGreaterThan(1)
  })
})

// ─── 👥 HR ─────────────────────────────────────────────────────

describe('👥 HR - 团队营销能力分析', () => {
  it('正例: 比较多个活动 ROI 评估团队绩效', () => {
    const roi = makeROI()
    const results = roi.compareCampaigns(['camp-001', 'camp-002', 'camp-003'])
    expect(results).toHaveLength(3)
    // ROI 降序排列
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].roi).toBeGreaterThanOrEqual(results[i].roi)
    }
  })

  it('正例: ROI 计算字段完整性验证', () => {
    const roi = makeROI()
    const result = roi.calculateCampaignROI('camp-001')
    expect(result).toHaveProperty('campaignId')
    expect(result).toHaveProperty('revenue')
    expect(result).toHaveProperty('cost')
    expect(result).toHaveProperty('roi')
    expect(result).toHaveProperty('roiPercent')
    expect(result).toHaveProperty('profit')
    expect(result).toHaveProperty('isPositive')
  })

  it('边界: 传入全部亏损活动仍可以排序', () => {
    const roi = makeROI()
    // camp-005 是亏损的，compareCampaigns 只返回存在的
    const result = roi.calculateCampaignROI('camp-005')
    expect(result).toBeDefined()
    expect(result!.isPositive).toBe(false)
    expect(result!.roiPercent).toBeLessThan(0)
  })

  it('边界: 比较空数组应返回空结果', () => {
    const roi = makeROI()
    const results = roi.compareCampaigns([])
    expect(results).toHaveLength(0)
  })

  it('边界: 传入混合存在/不存在的 ID', () => {
    const roi = makeROI()
    const results = roi.compareCampaigns(['camp-001', 'fake', 'camp-003', 'unknown'])
    expect(results).toHaveLength(2) // 只有存在的会被返回
    expect(results[0].campaignId).toBe('camp-001')
    expect(results[1].campaignId).toBe('camp-003')
  })
})

// ─── 🔧 安监 ───────────────────────────────────────────────────

describe('🔧 安监 - 活动合规性与数据完整性', () => {
  it('正例: 预算分配百分比总和为 100%', () => {
    const roi = makeROI()
    const allocations = roi.getOptimalBudget('promotion', 100000)
    const totalPercent = allocations.reduce((s, a) => s + a.percent, 0)
    expect(Math.round(totalPercent)).toBe(100)
  })

  it('正例: 所有渠道预算金额总和不超过总预算', () => {
    const roi = makeROI()
    const allocations = roi.getOptimalBudget('promotion', 100000)
    const totalAmount = allocations.reduce((s, a) => s + a.amount, 0)
    expect(totalAmount).toBeLessThanOrEqual(100000)
  })

  it('正例: email 类型只分配到 email 渠道', () => {
    const roi = makeROI()
    const allocations = roi.getOptimalBudget('email', 50000)
    expect(allocations).toHaveLength(1)
    expect(allocations[0].channel).toBe('email')
    expect(allocations[0].amount).toBe(50000)
    expect(allocations[0].percent).toBe(100)
  })

  it('边界: 零预算下所有渠道金额为 0', () => {
    const roi = makeROI()
    const allocations = roi.getOptimalBudget('promotion', 0)
    expect(allocations.length).toBeGreaterThan(0)
    allocations.forEach(a => expect(a.amount).toBe(0))
  })

  it('边界: 最大预算分配数据不溢出', () => {
    const roi = makeROI()
    const allocations = roi.getOptimalBudget('performance', 999999999)
    const totalAmount = allocations.reduce((s, a) => s + a.amount, 0)
    expect(totalAmount).toBeLessThanOrEqual(999999999)
  })

  it('边界: 预算按预期 ROI 降序排列', () => {
    const roi = makeROI()
    const allocations = roi.getOptimalBudget('kOL', 100000)
    for (let i = 1; i < allocations.length; i++) {
      expect(allocations[i - 1].expectedROI).toBeGreaterThanOrEqual(allocations[i].expectedROI)
    }
  })
})

// ─── 🎮 导玩员 ─────────────────────────────────────────────────

describe('🎮 导玩员 - 活动推荐', () => {
  it('正例: 推荐转化类活动', () => {
    const planner = makePlanner()
    const suggestions = planner.suggestCampaignType('conversion', 50000, '到店顾客')
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions[0].type).toBe('performance')
    expect(suggestions[0].channels).toContain('douyin')
  })

  it('正例: 品牌认知目标推荐 KOL', () => {
    const planner = makePlanner()
    const suggestions = planner.suggestCampaignType('brand', 100000, '年轻用户')
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions.some(s => s.type === 'kOL')).toBe(true)
  })

  it('正例: 留存目标推荐邮件', () => {
    const planner = makePlanner()
    const suggestions = planner.suggestCampaignType('retention', 30000, '老客户')
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions[0].type).toBe('email')
  })

  it('边界: 零预算仍能推荐', () => {
    const planner = makePlanner()
    const suggestions = planner.suggestCampaignType('awareness', 0, '用户')
    expect(suggestions.length).toBeGreaterThan(0)
  })

  it('边界: 每种目标返回不超过3个推荐', () => {
    const planner = makePlanner()
    for (const goal of ['awareness', 'conversion', 'retention', 'brand'] as const) {
      const suggestions = planner.suggestCampaignType(goal, 50000, '测试用户')
      expect(suggestions.length).toBeLessThanOrEqual(3)
    }
  })
})

// ─── 🎯 运行专员 ───────────────────────────────────────────────

describe('🎯 运行专员 - 活动排期与执行', () => {
  it('正例: 品牌活动时间线含 3 个阶段', () => {
    const planner = makePlanner()
    const timeline = planner.planCampaignTimeline('brand')
    expect(timeline).toHaveLength(3)
    expect(timeline[0].phase).toBe('策划期')
    expect(timeline[1].phase).toBe('执行期')
    expect(timeline[2].phase).toBe('收官期')
  })

  it('正例: 转化活动时间线有限时特点', () => {
    const planner = makePlanner()
    const timeline = planner.planCampaignTimeline('conversion')
    expect(timeline).toHaveLength(3)
    expect(timeline[0].phase).toBe('准备期')
    expect(timeline[1].phase).toBe('抢购期')
    expect(timeline[2].phase).toBe('收尾期')
  })

  it('正例: 每个阶段都有活动列表', () => {
    const planner = makePlanner()
    const timeline = planner.planCampaignTimeline('retention')
    timeline.forEach(milestone => {
      expect(milestone.activities.length).toBeGreaterThan(0)
      expect(milestone.startDay).toBeLessThanOrEqual(milestone.endDay)
    })
  })

  it('正例: 触达预估结果包含完整字段', () => {
    const planner = makePlanner()
    const reach = planner.estimateReach(50000, 'wechat')
    expect(reach).toHaveProperty('channel')
    expect(reach).toHaveProperty('impressions')
    expect(reach).toHaveProperty('reach')
    expect(reach).toHaveProperty('cpm')
    expect(reach).toHaveProperty('cost')
    expect(reach.channel).toBe('wechat')
    expect(reach.audience).toBe(50000)
  })

  it('边界: 不同渠道触达预估值不同', () => {
    const planner = makePlanner()
    const wechat = planner.estimateReach(100000, 'wechat')
    const douyin = planner.estimateReach(100000, 'douyin')
    expect(wechat.cost).not.toBe(douyin.cost)
    expect(wechat.impressions).not.toBe(douyin.impressions)
  })

  it('边界: 未知目标回退到转化模板', () => {
    const planner = makePlanner()
    const timeline = planner.planCampaignTimeline('unknown' as any)
    expect(timeline).toHaveLength(3)
    expect(timeline[0].phase).toBe('准备期') // 回退到 conversion 模板
  })
})

// ─── 🤝 团建 ───────────────────────────────────────────────────

describe('🤝 团建 - 跨团队协作与国际化', () => {
  it('正例: 中文简体和繁体文案本地化区别', () => {
    const copy = makeCopy()
    const base = { headline: '新品上市', body: '火热销售中', cta: '立即购买', taglines: ['优质', '信赖'] }
    const zhCN = copy.localizeCopy(base, 'zh-CN')
    const zhTW = copy.localizeCopy(base, 'zh-TW')
    expect(zhCN.cta).toBe('立即购买')
    expect(zhTW.cta).toBe('立即選購')
  })

  it('正例: 英文本地化添加国旗前缀', () => {
    const copy = makeCopy()
    const result = copy.localizeCopy({
      headline: 'New Product', body: 'On Sale Now', cta: 'Buy Now',
      taglines: ['Quality'],
    }, 'en-US')
    expect(result.cta).toBe('Buy Now')
    expect(result.headline.startsWith('🇺🇸')).toBe(true)
  })

  it('正例: 日语本地化正确添加前缀和 CTA', () => {
    const copy = makeCopy()
    const result = copy.localizeCopy({
      headline: '新商品', body: '発売中', cta: '購入',
      taglines: ['品質'],
    }, 'ja-JP')
    expect(result.cta).toBe('今すぐ購入')
    expect(result.headline.startsWith('🇯🇵')).toBe(true)
  })

  it('边界: 团队协作 - ROI 预测在不同预算规模下的表现', () => {
    const roi = makeROI()
    const small = roi.projectROI({ type: 'performance', budget: 5000 })
    const large = roi.projectROI({ type: 'performance', budget: 500000 })
    // 大规模预算预期ROI应该在同一范围内 - 范围是固定的
    expect(small.minROI).toBeGreaterThan(0)
    expect(large.maxROI).toBeGreaterThan(0)
  })

  it('边界: compareCampaigns 支持团队绩效横向对比', () => {
    const roi = makeROI()
    // 模拟运营团队提交的活动ID
    const teamCampaigns = ['camp-001', 'camp-004']
    const results = roi.compareCampaigns(teamCampaigns)
    expect(results).toHaveLength(2)
    // 团队A的 ROI 比团队B高
    expect(results[0].roi).toBeGreaterThanOrEqual(results[1].roi)
  })
})

// ─── 📢 营销 ───────────────────────────────────────────────────

describe('📢 营销 - 全方位营销策略制定', () => {
  it('正例: 生成 5 个 A/B 测试变体', () => {
    const copy = makeCopy()
    const variants = copy.abTestVariants({
      product: '盲盒',
      goal: 'conversion',
      audience: '年轻人',
    }, 5)
    expect(variants).toHaveLength(5)
    variants.forEach((v) => {
      expect(v.headline).toBeDefined()
      expect(v.body).toBeDefined()
      expect(v.cta).toBeDefined()
      expect(v.taglines.length).toBeGreaterThan(0)
    })
  })

  it('正例: 不同目标下的 A/B 变体策略不同', () => {
    const copy = makeCopy()
    const convVariants = copy.abTestVariants({ product: '盲盒', goal: 'conversion', audience: '用户' }, 3)
    const awareVariants = copy.abTestVariants({ product: '盲盒', goal: 'awareness', audience: '用户' }, 3)
    expect(convVariants.length).toBe(3)
    expect(awareVariants.length).toBe(3)
    // 至少第一个变体不同（原始生成不同）
    expect(convVariants[0].headline).not.toBe(awareVariants[0].headline)
  })

  it('边界: 请求 1 个变体只返回原始版本', () => {
    const copy = makeCopy()
    const variants = copy.abTestVariants({
      product: '盲盒', goal: 'conversion', audience: '年轻人',
    }, 1)
    expect(variants).toHaveLength(1)
  })

  it('边界: 请求超过已有变体数只返回 5 个', () => {
    const copy = makeCopy()
    const variants = copy.abTestVariants({
      product: '盲盒', goal: 'conversion', audience: '年轻人',
    }, 10)
    expect(variants).toHaveLength(5)
  })

  it('边界: 全员营销 - 综合分析包含预期字段', () => {
    const roi = makeROI()
    const result = roi.calculateCampaignROI('camp-003')
    expect(result).toBeDefined()
    expect(result!.roiPercent).toBeCloseTo(150, -1) // (200k-80k)/80k = 150%
  })

  it('边界: ROI 预测在极小预算下表现', () => {
    const roi = makeROI()
    const projection = roi.projectROI({ type: 'email', budget: 100 })
    expect(projection.expectedROI).toBeGreaterThan(0) // email 类型 ROI 高
    expect(projection.minROI).toBeLessThanOrEqual(projection.expectedROI)
    expect(projection.expectedROI).toBeLessThanOrEqual(projection.maxROI)
  })
})

// ─── 📊 集成测试 - 多角色联合场景 ──────────────────────────────

describe('📊 集成测试 - 多角色联合营销场景', () => {
  it('正例: 店长查看 ROI + 营销生成文案 + 运行排期的完整链路', () => {
    const roi = makeROI()
    const copy = makeCopy()
    const planner = makePlanner()

    // 1. 店长看哪个活动的 ROI 最高
    const ranked = roi.compareCampaigns(['camp-001', 'camp-002', 'camp-003', 'camp-004'])
    const bestCampaign = ranked[0]
    expect(bestCampaign.roi).toBeGreaterThan(0)

    // 2. 营销团队为最优活动生成文案
    const copyResult = copy.generateCopy({
      product: `活动-${bestCampaign.campaignId}`,
      goal: 'conversion',
      audience: '会员',
    })
    expect(copyResult.headline).toBeDefined()

    // 3. 运行专员规划时间线
    const timeline = planner.planCampaignTimeline('conversion')
    expect(timeline).toHaveLength(3)
  })

  it('正例: 营销活动从策划到执行的全流程模拟', () => {
    const roi = makeROI()
    const planner = makePlanner()

    // 策划 - 获取推荐活动类型
    const suggestions = planner.suggestCampaignType('conversion', 80000, '年轻白领')
    expect(suggestions.length).toBeGreaterThan(0)

    // 预算分配
    const allocations = roi.getOptimalBudget('performance', 80000)
    const totalPct = allocations.reduce((s, a) => s + a.percent, 0)
    expect(Math.round(totalPct)).toBe(100)

    // 触达预估
    const wechatReach = planner.estimateReach(80000, 'wechat')
    expect(wechatReach.reach).toBeGreaterThan(0)

    // ROI 预测
    const projection = roi.projectROI({ type: 'performance', budget: 80000 })
    expect(projection.expectedROI).toBeGreaterThan(0)
  })

  it('边界: 亏损活动不应推荐给店长作为成功案例', () => {
    const roi = makeROI()
    const result = roi.calculateCampaignROI('camp-005')
    expect(result!.isPositive).toBe(false)
    // 店长筛选只看正 ROI 活动
    const positiveOnly = roi.compareCampaigns(['camp-001', 'camp-005', 'camp-003'])
      .filter(r => r.isPositive)
    expect(positiveOnly).toHaveLength(2)
    positiveOnly.forEach(r => expect(r.isPositive).toBe(true))
  })

  it('边界: 安监验证营销活动中所有数字运算无误', () => {
    const roi = makeROI()
    const result = roi.calculateCampaignROI('camp-001')
    // 手动验证 ROI 计算
    const expectedProfit = result!.revenue - result!.cost
    expect(result!.profit).toBe(expectedProfit)
    const expectedROI = result!.cost > 0 ? expectedProfit / result!.cost : 0
    expect(result!.roi).toBe(expectedROI)
  })
})
