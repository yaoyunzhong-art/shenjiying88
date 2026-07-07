import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi, beforeAll as _ba, beforeEach as _be, afterEach as _ae, afterAll as _aa } from 'vitest'
/**
 * AI Marketing CMO 服务测试 (T113-1)
 * ROI 分析 + 文案助手 + 活动规划
 */

import 'reflect-metadata'
import assert from 'node:assert/strict'
import {
  MarketingROIService,
  CopywritingAssistant,
  CampaignPlanner,
  AIMarketingCMOService,
  type CopyBrief,
  type CampaignConfig
} from './ai-marketing-cmo.service'

// ─── Test Helpers ────────────────────────────────────────────────────────────

function makeROIService(): MarketingROIService {
  return new MarketingROIService()
}

function makeCopywritingService(): CopywritingAssistant {
  return new CopywritingAssistant()
}

function makeCampaignPlanner(): CampaignPlanner {
  return new CampaignPlanner()
}

function makeCMOService(): AIMarketingCMOService {
  return new AIMarketingCMOService(
    makeROIService(),
    makeCopywritingService(),
    makeCampaignPlanner()
  )
}

// ─── ROI 计算测试 ─────────────────────────────────────────────────────────────

describe('[MarketingROIService] ROI 计算', () => {
  it('calculateCampaignROI 计算正确 ROI (盈利)', () => {
    const svc = makeROIService()
    const result = svc.calculateCampaignROI('camp-001')

    assert.ok(result, '应该返回 ROI 结果')
    assert.equal(result.campaignId, 'camp-001')
    assert.equal(result.revenue, 150000)
    assert.equal(result.cost, 30000)
    // ROI = (150000 - 30000) / 30000 = 4
    assert.equal(result.roi, 4)
    assert.equal(result.roiPercent, 400)
    assert.equal(result.profit, 120000)
    assert.ok(result.isPositive, '盈利活动应返回 isPositive=true')
  })

  it('calculateCampaignROI 计算正确 ROI (亏损)', () => {
    const svc = makeROIService()
    const result = svc.calculateCampaignROI('camp-005')

    assert.ok(result, '应该返回 ROI 结果')
    assert.equal(result.campaignId, 'camp-005')
    assert.equal(result.revenue, 20000)
    assert.equal(result.cost, 40000)
    // ROI = (20000 - 40000) / 40000 = -0.5
    assert.equal(result.roi, -0.5)
    assert.equal(result.roiPercent, -50)
    assert.equal(result.profit, -20000)
    assert.ok(!result.isPositive, '亏损活动应返回 isPositive=false')
  })

  it('calculateCampaignROI 负ROI正确反映亏损', () => {
    const svc = makeROIService()
    const result = svc.calculateCampaignROI('camp-005')
    assert.ok(result, '应该返回 ROI 结果')

    // 验证亏损场景
    assert.ok(result!.profit < 0, '利润应为负数')
    assert.ok(result!.roi < 0, 'ROI 应为负数')
    assert.ok(!result!.isPositive, 'isPositive 应为 false')
  })

  it('calculateCampaignROI 返回 null 当活动不存在', () => {
    const svc = makeROIService()
    const result = svc.calculateCampaignROI('non-existent')

    assert.equal(result, null, '不存在的活动应返回 null')
  })

  it('compareCampaigns 按 ROI 从高到低排序', () => {
    const svc = makeROIService()
    const results = svc.compareCampaigns(['camp-001', 'camp-002', 'camp-003'])

    assert.ok(results.length >= 3, '应返回多个结果')
    // camp-001 ROI=4, camp-002 ROI=0.6, camp-003 ROI=1.5
    assert.ok(results[0].roi >= results[1].roi, '第一个 ROI 应 >= 第二个')
    assert.ok(results[1].roi >= results[2].roi, '第二个 ROI 应 >= 第三个')
  })

  it('compareCampaigns 高ROI排在前面', () => {
    const svc = makeROIService()
    const results = svc.compareCampaigns(['camp-005', 'camp-001'])

    // camp-001 ROI=4 (盈利最高), camp-005 ROI=-0.5 (亏损)
    assert.ok(results[0].isPositive, '高ROI应该是盈利的')
    assert.ok(results[0].roi > results[1].roi, '高ROI应该在前面')
  })

  it('compareCampaigns 忽略不存在的活动', () => {
    const svc = makeROIService()
    const results = svc.compareCampaigns(['camp-001', 'non-existent', 'camp-002'])

    assert.ok(results.length === 2, '应只返回存在的活动')
  })
})

// ─── ROI 预测测试 ─────────────────────────────────────────────────────────────

describe('[MarketingROIService] ROI 预测', () => {
  it('projectROI 返回预估 ROI 范围', () => {
    const svc = makeROIService()
    const config: CampaignConfig = {
      type: 'performance',
      budget: 50000,
      expectedCPM: 80,
      expectedCTR: 0.02,
      expectedConversionRate: 0.03,
      averageOrderValue: 200
    }

    const result = svc.projectROI(config)

    assert.ok(typeof result.minROI === 'number', '应返回最小ROI')
    assert.ok(typeof result.maxROI === 'number', '应返回最大ROI')
    assert.ok(typeof result.expectedROI === 'number', '应返回预期ROI')
    assert.ok(result.minROI <= result.expectedROI, '最小ROI应<=预期ROI')
    assert.ok(result.expectedROI <= result.maxROI, '预期ROI应<=最大ROI')
  })

  it('projectROI 不同活动类型返回不同范围', () => {
    const svc = makeROIService()

    const emailConfig: CampaignConfig = { type: 'email', budget: 10000 }
    const kolConfig: CampaignConfig = { type: 'kOL', budget: 10000 }

    const emailResult = svc.projectROI(emailConfig)
    const kolResult = svc.projectROI(kolConfig)

    // email ROI 范围应该更高
    assert.ok(emailResult.minROI >= 100, '邮件营销最小ROI应该>=100%')
    assert.ok(kolResult.maxROI <= 80, 'KOL最大ROI应该<=80%')
  })

  it('projectROI 使用默认配置', () => {
    const svc = makeROIService()
    const result = svc.projectROI({ type: 'promotion', budget: 30000 })

    assert.ok(result.minROI !== undefined)
    assert.ok(result.maxROI !== undefined)
    assert.ok(result.expectedROI !== undefined)
  })

  it('getOptimalBudget 返回渠道分配', () => {
    const svc = makeROIService()
    const allocations = svc.getOptimalBudget('performance', 100000)

    assert.ok(allocations.length > 0, '应返回分配方案')
    assert.ok(allocations.every((a) => a.amount > 0), '每个渠道应有分配金额')
    assert.ok(allocations.every((a) => a.percent > 0), '每个渠道应有百分比')

    // 验证总额约为100000
    const total = allocations.reduce((sum, a) => sum + a.amount, 0)
    assert.ok(total > 0, '总分配金额应>0')
  })

  it('getOptimalBudget 按预期ROI排序', () => {
    const svc = makeROIService()
    const allocations = svc.getOptimalBudget('performance', 50000)

    for (let i = 1; i < allocations.length; i++) {
      assert.ok(
        allocations[i - 1].expectedROI >= allocations[i].expectedROI,
        '应按预期ROI从高到低排序'
      )
    }
  })
})

// ─── 文案生成测试 ─────────────────────────────────────────────────────────────

describe('[CopywritingAssistant] 文案生成', () => {
  it('generateCopy 返回完整结构', () => {
    const svc = makeCopywritingService()
    const brief: CopyBrief = {
      product: '智能手表',
      goal: 'conversion',
      audience: '年轻白领',
      tone: 'casual',
      length: 'medium'
    }

    const copy = svc.generateCopy(brief)

    assert.ok(copy.headline.length > 0, '应有标题')
    assert.ok(copy.body.length > 0, '应有正文')
    assert.ok(copy.cta.length > 0, '应有CTA')
    assert.ok(Array.isArray(copy.taglines), 'taglines应是数组')
    assert.ok(copy.taglines.length > 0, '应有taglines')
  })

  it('generateCopy 不同目标生成不同内容', () => {
    const svc = makeCopywritingService()
    const brief = { product: '咖啡机', goal: 'awareness' as const, audience: '上班族' }

    const copy = svc.generateCopy(brief)

    assert.ok(copy.headline.includes('咖啡机') || copy.body.includes('咖啡机'), '应包含产品名')
  })

  it('generateCopy 使用自定义CTA', () => {
    const svc = makeCopywritingService()
    const brief: CopyBrief = {
      product: '面膜',
      goal: 'conversion',
      audience: '女性用户',
      cta: '立即领取'
    }

    const copy = svc.generateCopy(brief)

    assert.equal(copy.cta, '立即领取', '应使用自定义CTA')
  })

  it('optimizeHeadline 返回优化后的标题', () => {
    const svc = makeCopywritingService()
    const original = '新品上市'
    const optimized = svc.optimizeHeadline(original)

    assert.ok(optimized.length > original.length, '优化后标题应更长')
    assert.ok(optimized !== original, '优化后标题应不同于原标题')
  })

  it('localizeCopy 正确转换不同地区', () => {
    const svc = makeCopywritingService()
    const copy = {
      headline: '限时优惠',
      body: '错过等一年',
      cta: '立即购买',
      taglines: ['省钱', '划算']
    }

    const enCopy = svc.localizeCopy(copy, 'en-US')
    assert.equal(enCopy.cta, 'Buy Now', '英文CTA应正确')
    assert.ok(enCopy.headline.startsWith('🇺🇸'), '英文标题应有前缀')

    const jaCopy = svc.localizeCopy(copy, 'ja-JP')
    assert.equal(jaCopy.cta, '今すぐ購入', '日文CTA应正确')
    assert.ok(jaCopy.headline.startsWith('🇯🇵'), '日文标题应有前缀')

    const zhTWCopy = svc.localizeCopy(copy, 'zh-TW')
    assert.equal(zhTWCopy.cta, '立即選購', '繁体CTA应正确')
  })

  it('abTestVariants 生成指定数量变体', () => {
    const svc = makeCopywritingService()
    const brief: CopyBrief = {
      product: '运动鞋',
      goal: 'conversion',
      audience: '运动爱好者'
    }

    const variants = svc.abTestVariants(brief, 3)

    assert.equal(variants.length, 3, '应生成3个变体')
    // 验证变体之间有差异
    assert.notEqual(variants[0].headline, variants[1].headline, '变体应有不同标题')
    assert.notEqual(variants[1].cta, variants[2].cta, '变体应有不同CTA')
  })

  it('abTestVariants 返回完整结构变体', () => {
    const svc = makeCopywritingService()
    const brief: CopyBrief = {
      product: '耳机',
      goal: 'awareness',
      audience: '音乐爱好者'
    }

    const variants = svc.abTestVariants(brief, 2)

    for (const variant of variants) {
      assert.ok(variant.headline.length > 0, '变体应有标题')
      assert.ok(variant.body.length > 0, '变体应有正文')
      assert.ok(variant.cta.length > 0, '变体应有CTA')
      assert.ok(Array.isArray(variant.taglines), '变体应有taglines数组')
    }
  })
})

// ─── 活动规划测试 ─────────────────────────────────────────────────────────────

describe('[CampaignPlanner] 活动规划', () => {
  it('suggestCampaignType 返回推荐列表', () => {
    const planner = makeCampaignPlanner()
    const suggestions = planner.suggestCampaignType('conversion', 50000, '年轻用户')

    assert.ok(suggestions.length > 0, '应返回推荐')
    assert.ok(suggestions.every((s) => s.type), '每个推荐应有类型')
    assert.ok(suggestions.every((s) => s.channels), '每个推荐应有渠道')
    assert.ok(suggestions.every((s) => s.reason), '每个推荐应有理由')
  })

  it('suggestCampaignType 品牌目标推荐KOL', () => {
    const planner = makeCampaignPlanner()
    const suggestions = planner.suggestCampaignType('brand', 100000, '年轻女性')

    const hasKOL = suggestions.some((s) => s.type === 'kOL')
    assert.ok(hasKOL, '品牌目标应推荐KOL')
  })

  it('planCampaignTimeline 返回里程碑', () => {
    const planner = makeCampaignPlanner()
    const timeline = planner.planCampaignTimeline('conversion')

    assert.ok(timeline.length > 0, '应返回时间线')
    assert.ok(timeline.every((m) => m.phase), '每个阶段应有名称')
    assert.ok(timeline.every((m) => m.startDay <= m.endDay), '开始日应<=结束日')
    assert.ok(timeline.every((m) => m.activities.length > 0), '每个阶段应有活动')
  })

  it('planCampaignTimeline 各阶段连续', () => {
    const planner = makeCampaignPlanner()
    const timeline = planner.planCampaignTimeline('awareness')

    for (let i = 1; i < timeline.length; i++) {
      assert.equal(
        timeline[i - 1].endDay + 1,
        timeline[i].startDay,
        '阶段应连续'
      )
    }
  })

  it('estimateReach 返回触达估算', () => {
    const planner = makeCampaignPlanner()
    const estimate = planner.estimateReach(50000, 'douyin')

    assert.equal(estimate.channel, 'douyin', '渠道应匹配')
    assert.equal(estimate.audience, 50000, '受众应匹配')
    assert.ok(estimate.impressions > 0, '应有曝光量')
    assert.ok(estimate.reach > 0, '应有触达人数')
    assert.ok(estimate.cost > 0, '应有成本')
    assert.ok(estimate.cpm > 0, '应有CPM')
  })

  it('estimateReach 不同渠道不同系数', () => {
    const planner = makeCampaignPlanner()

    const wechatEstimate = planner.estimateReach(10000, 'wechat')
    const emailEstimate = planner.estimateReach(10000, 'email')

    // 邮件成本更低
    assert.ok(emailEstimate.cpm < wechatEstimate.cpm, '邮件CPM应更低')
    // 邮件触达率更高
    assert.ok(emailEstimate.cost < wechatEstimate.cost, '邮件成本应更低')
  })
})

// ─── 集成测试 ────────────────────────────────────────────────────────────────

describe('[AIMarketingCMOService] 集成', () => {
  it('主服务可获取子服务', () => {
    const svc = makeCMOService()

    assert.ok(svc.getROIService() instanceof MarketingROIService)
    assert.ok(svc.getCopywritingService() instanceof CopywritingAssistant)
    assert.ok(svc.getCampaignPlanner() instanceof CampaignPlanner)
  })

  it('子服务协同工作', () => {
    const svc = makeCMOService()
    const roiSvc = svc.getROIService()
    const copySvc = svc.getCopywritingService()
    const plannerSvc = svc.getCampaignPlanner()

    // ROI分析
    const roiResult = roiSvc.calculateCampaignROI('camp-001')
    assert.ok(roiResult)

    // 文案生成
    const copy = copySvc.generateCopy({
      product: '测试产品',
      goal: 'conversion',
      audience: '测试用户'
    })
    assert.ok(copy.headline)

    // 活动规划
    const suggestions = plannerSvc.suggestCampaignType('conversion', 50000, '用户')
    assert.ok(suggestions.length > 0)
  })
})
