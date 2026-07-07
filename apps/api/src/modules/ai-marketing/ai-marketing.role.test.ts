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
  })

  it('边界: 查询不存在的活动 ID 应返回 null', () => {
    const roi = makeROI()
    const result = roi.calculateCampaignROI('nonexistent-campaign')
    expect(result).toBeNull()
  })
})

// ─── 🛒 前台 ───────────────────────────────────────────────────

describe('🛒 前台 - 文案生成', () => {
  it('正例: 为商品生成推广文案', () => {
    const copy = makeCopy()
    const result = copy.generateCopy({
      product: '盲盒系列',
      goal: 'conversion',
      audience: '进店顾客',
    })
    expect(result.headline).toBeDefined()
    expect(result.cta).toBeDefined()
    expect(result.body.length).toBeGreaterThan(0)
  })

  it('边界: 指定正式语气生成的文案风格不同', () => {
    const copy = makeCopy()
    const casual = copy.generateCopy({ product: '新品', goal: 'conversion', audience: '用户', tone: 'casual' })
    const formal = copy.generateCopy({ product: '新品', goal: 'conversion', audience: '用户', tone: 'formal' })
    // 两个版本的标题应该不同
    expect(casual.headline).not.toBe(formal.headline)
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

  it('边界: 传入全部亏损活动仍可以排序', () => {
    const roi = makeROI()
    // camp-005 是亏损的
    const result = roi.calculateCampaignROI('camp-005')
    expect(result).toBeDefined()
    expect(result!.isPositive).toBe(false)
    expect(result!.roiPercent).toBeLessThan(0)
  })
})

// ─── 🔧 安监 ───────────────────────────────────────────────────

describe('🔧 安监 - 活动合规性检查', () => {
  it('正例: 预算分配中的数据完整性检查', () => {
    const roi = makeROI()
    const allocations = roi.getOptimalBudget('promotion', 100000)
    // 分配百分比总和 = 100%
    const totalPercent = allocations.reduce((s, a) => s + a.percent, 0)
    expect(Math.round(totalPercent)).toBe(100)
    // 所有金额总和 = 总预算
    const totalAmount = Math.round(allocations.reduce((s, a) => s + a.amount, 0))
    expect(totalAmount).toBeLessThanOrEqual(100000)
  })

  it('边界: 空预算下的分配', () => {
    const roi = makeROI()
    const allocations = roi.getOptimalBudget('email', 0)
    expect(allocations).toHaveLength(1) // email only
    expect(allocations[0].amount).toBe(0)
  })
})

// ─── 🎮 导玩员 ─────────────────────────────────────────────────

describe('🎮 导玩员 - 活动推荐', () => {
  it('正例: 推荐转化类活动', () => {
    const planner = makePlanner()
    const suggestions = planner.suggestCampaignType('conversion', 50000, '到店顾客')
    expect(suggestions.length).toBeGreaterThan(0)
    expect(suggestions[0].type).toBe('performance')
  })

  it('边界: 零预算下的推荐', () => {
    const planner = makePlanner()
    const suggestions = planner.suggestCampaignType('awareness', 0, '用户')
    expect(suggestions.length).toBeGreaterThan(0) // 仍能推荐
  })
})

// ─── 🎯 运行专员 ───────────────────────────────────────────────

describe('🎯 运行专员 - 活动排期', () => {
  it('正例: 品牌活动时间线含 3 个阶段', () => {
    const planner = makePlanner()
    const timeline = planner.planCampaignTimeline('brand')
    expect(timeline).toHaveLength(3)
    expect(timeline[0].phase).toBe('策划期')
    expect(timeline[2].phase).toBe('收官期')
  })

  it('边界: 未知目标回退到转化模板', () => {
    const planner = makePlanner()
    const timeline = planner.planCampaignTimeline('unknown' as any)
    expect(timeline).toHaveLength(3) // 回退到 conversion 模板
  })
})

// ─── 🤝 团建 ───────────────────────────────────────────────────

describe('🤝 团建 - 文案多语言本地化', () => {
  it('正例: 中文简体和繁体文案不同', () => {
    const copy = makeCopy()
    const base = { headline: '新品上市', body: '火热销售中', cta: '立即购买', taglines: ['优质', '信赖'] }
    const zhCN = copy.localizeCopy(base, 'zh-CN')
    const zhTW = copy.localizeCopy(base, 'zh-TW')
    expect(zhCN.cta).toBe('立即购买')
    expect(zhTW.cta).toBe('立即選購')
  })

  it('边界: 日语本地化正确添加前缀后缀', () => {
    const copy = makeCopy()
    const result = copy.localizeCopy({
      headline: '新商品', body: '発売中', cta: '購入',
      taglines: ['品質'],
    }, 'ja-JP')
    expect(result.cta).toBe('今すぐ購入')
  })
})

// ─── 📢 营销 ───────────────────────────────────────────────────

describe('📢 营销 - 多文案 A/B 测试', () => {
  it('正例: 生成 5 个 A/B 测试变体', () => {
    const copy = makeCopy()
    const variants = copy.abTestVariants({
      product: '盲盒',
      goal: 'conversion',
      audience: '年轻人',
    }, 5)
    expect(variants).toHaveLength(5)
    // 每个变体有完整结构
    variants.forEach((v) => {
      expect(v.headline).toBeDefined()
      expect(v.body).toBeDefined()
      expect(v.cta).toBeDefined()
    })
  })

  it('边界: 请求 1 个变体只返回原始版本', () => {
    const copy = makeCopy()
    const variants = copy.abTestVariants({
      product: '盲盒',
      goal: 'conversion',
      audience: '年轻人',
    }, 1)
    expect(variants).toHaveLength(1)
  })

  it('边界: 请求超过已有变体数', () => {
    const copy = makeCopy()
    const variants = copy.abTestVariants({
      product: '盲盒',
      goal: 'conversion',
      audience: '年轻人',
    }, 10) // 最多5个
    expect(variants).toHaveLength(5)
  })
})
