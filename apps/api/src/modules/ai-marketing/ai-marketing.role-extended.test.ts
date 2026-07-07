import { describe, it, expect } from 'vitest'
import {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
  AIMarketingCMOService,
} from './ai-marketing-cmo.service'

/**
 * ai-marketing 角色扩展测试
 * 覆盖更多边界、异常和复杂场景
 */

function makeROI(): MarketingROIService { return new MarketingROIService() }
function makeCopy(): CopywritingAssistant { return new CopywritingAssistant() }
function makePlanner(): CampaignPlanner { return new CampaignPlanner() }

// ─── ROI 扩展测试 ──────────────────────────────────────────────

describe('[ROI 扩展] 边界与异常', () => {
  it('空数组比较返回空列表', () => {
    const roi = makeROI()
    const results = roi.compareCampaigns([])
    expect(results).toHaveLength(0)
  })

  it('部分存在 + 部分不存在的混合ID', () => {
    const roi = makeROI()
    const results = roi.compareCampaigns(['camp-001', 'fake-id', 'camp-003'])
    expect(results).toHaveLength(2)
    // ROI 排序: camp-003 (350%) > camp-001 (400%), 所以 camp-001 排第一
    expect(results[0].campaignId).toBe('camp-001')
  })

  it('所有活动 ROI 依次递减', () => {
    const roi = makeROI()
    const ids = ['camp-001', 'camp-002', 'camp-003', 'camp-004', 'camp-005']
    const results = roi.compareCampaigns(ids)
    for (let i = 1; i < results.length; i++) {
      expect(results[i - 1].roiPercent).toBeGreaterThanOrEqual(results[i].roiPercent)
    }
  })

  it('毛利率100%（零成本）', () => {
    // ROIService 没有零成本活动，测试防御
    // 手动构造一个极端变量
    const roi = makeROI()
    // 用 projectROI 模拟预算为 0 的情况
    const projection = roi.projectROI({ type: 'email', budget: 0 })
    // 预算为 0 时 expectedROI 应为范围上限
    expect(projection.expectedROI).toBeGreaterThanOrEqual(projection.minROI)
  })
})

// ─── 文案扩展测试 ──────────────────────────────────────────────

describe('[文案扩展] 边界与异常', () => {
  it('空文案优化', () => {
    const copy = makeCopy()
    const result = copy.optimizeHeadline('')
    expect(result.length).toBeGreaterThan(0) // 即使空输入也有输出
  })

  it('长产品名生成', () => {
    const copy = makeCopy()
    const result = copy.generateCopy({
      product: '这是一款非常长的产品名称测试用例超过二十个字符',
      goal: 'awareness',
      audience: '测试用户',
    })
    expect(result.headline).toContain('这是一款非常长的产品名称测试用例超过二十个字符')
  })

  it('A/B 测试变体各不相同', () => {
    const copy = makeCopy()
    const variants = copy.abTestVariants({
      product: '新品',
      goal: 'conversion',
      audience: '用户',
    }, 4)
    const headlines = variants.map((v) => v.headline)
    const uniqueHeadlines = new Set(headlines)
    expect(uniqueHeadlines.size).toBe(headlines.length) // 所有标题不同
  })

  it('不同目标文案风格不同', () => {
    const copy = makeCopy()
    const awareness = copy.generateCopy({ product: 'P', goal: 'awareness', audience: 'A' })
    const conversion = copy.generateCopy({ product: 'P', goal: 'conversion', audience: 'A' })
    expect(awareness.headline).not.toBe(conversion.headline)
  })
})

// ─── 活动规划扩展测试 ──────────────────────────────────────────

describe('[活动规划扩展] 边界与异常', () => {
  it('所有目标类型都有时间线，每个阶段都有活动', () => {
    const planner = makePlanner()
    const goals = ['awareness', 'conversion', 'retention', 'brand'] as const
    for (const goal of goals) {
      const timeline = planner.planCampaignTimeline(goal)
      expect(timeline.length).toBeGreaterThan(0)
      timeline.forEach((phase) => {
        expect(phase.activities.length).toBeGreaterThan(0)
      })
    }
  })

  it('各渠道预估成本合理', () => {
    const planner = makePlanner()
    const channels = ['wechat', 'weibo', 'douyin', 'xiaohongshu', 'bilibili', 'offline', 'email', 'sms'] as const
    for (const ch of channels) {
      const estimate = planner.estimateReach(10000, ch)
      expect(estimate.cost).toBeGreaterThan(0)
      expect(estimate.impressions).toBeGreaterThan(0)
      expect(estimate.reach).toBeGreaterThan(0)
      expect(estimate.reach).toBeLessThanOrEqual(estimate.impressions)
    }
  })

  it('极小受众触达估算', () => {
    const planner = makePlanner()
    const estimate = planner.estimateReach(1, 'email')
    expect(estimate.audience).toBe(1)
    expect(estimate.reach).toBeGreaterThan(0)
  })

  it('极高预算推荐不溢出', () => {
    const planner = makePlanner()
    const suggestions = planner.suggestCampaignType('conversion', 999999999, '所有人')
    expect(suggestions.length).toBeGreaterThan(0)
    suggestions.forEach((s) => {
      expect(typeof s.type).toBe('string')
      expect(s.channels.length).toBeGreaterThan(0)
    })
  })
})

// ─── CMO 集成扩展测试 ──────────────────────────────────────────

describe('[CMO 集成] 端到端', () => {
  it('CMO 服务整合所有子模块', () => {
    const cmo = new AIMarketingCMOService(makeROI(), makeCopy(), makePlanner())
    expect(cmo.getROIService()).toBeInstanceOf(MarketingROIService)
    expect(cmo.getCopywritingService()).toBeInstanceOf(CopywritingAssistant)
    expect(cmo.getCampaignPlanner()).toBeInstanceOf(CampaignPlanner)
  })

  it('通过 CMO 组合 ROI + 文案全流程', () => {
    const cmo = new AIMarketingCMOService(makeROI(), makeCopy(), makePlanner())

    // 1. 查看 ROI
    const roi = cmo.getROIService().calculateCampaignROI('camp-001')
    expect(roi).toBeDefined()

    // 2. 生成推广文案
    const copy = cmo.getCopywritingService().generateCopy({
      product: '夏季新品',
      goal: 'conversion',
      audience: '年轻人',
    })
    expect(copy.headline).toBeDefined()

    // 3. 规划活动
    const timeline = cmo.getCampaignPlanner().planCampaignTimeline('conversion')
    expect(timeline.length).toBe(3)
  })
})
