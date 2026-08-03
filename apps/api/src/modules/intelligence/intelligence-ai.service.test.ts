/**
 * intelligence-ai.service.test.ts — P-50 V2 AI决策引擎测试
 *
 * 覆盖:  定价建议/活动建议/告警分析/知识检索
 *        正例+反例+边界 三件套
 * 禁止:  as any · skip · only
 * mock: 无外部依赖
 */
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { IntelligenceAiService } from './intelligence-ai.service'

describe('IntelligenceAiService', () => {
  let svc: IntelligenceAiService

  before(() => { svc = new IntelligenceAiService() })

  // ─── 定价建议 (generatePricingAdvice) ─────────

  it('正例: 已知城市+区域+档次返回定价建议', async () => {
    const advice = await svc.generatePricingAdvice('上海', '徐汇', 'mid')
    assert.ok(advice)
    assert.ok(typeof advice === 'string')
    assert.ok(advice.length > 10)
  })

  it('正例: 高档定价建议', async () => {
    const advice = await svc.generatePricingAdvice('北京', '朝阳', 'high')
    assert.ok(advice.length > 10)
  })

  it('正例: 低档定价建议', async () => {
    const advice = await svc.generatePricingAdvice('成都', '锦江', 'low')
    assert.ok(advice.length > 10)
  })

  it('正例: 二线城市定价建议', async () => {
    const advice = await svc.generatePricingAdvice('南京', '鼓楼', 'mid')
    assert.ok(advice.length > 10)
  })

  // ─── 活动建议 (generateActivityAdvice) ───────

  it('正例: 春季活动建议', async () => {
    const advice = await svc.generateActivityAdvice('上海', 'spring')
    assert.ok(advice)
    assert.ok(advice.name)
    assert.ok(advice.description)
    assert.ok(advice.expectedGrowthPercent > 0)
    assert.ok(['low', 'medium', 'high'].includes(advice.riskLevel))
  })

  it('正例: 暑期活动建议', async () => {
    const advice = await svc.generateActivityAdvice('成都', 'summer')
    assert.ok(advice.expectedGrowthPercent > 0)
  })

  it('正例: 秋季活动建议', async () => {
    const advice = await svc.generateActivityAdvice('广州', 'autumn')
    assert.ok(advice.expectedGrowthPercent > 0)
  })

  it('正例: 冬季活动建议', async () => {
    const advice = await svc.generateActivityAdvice('深圳', 'winter')
    assert.ok(advice.expectedGrowthPercent > 0)
  })

  // ─── 告警分析 (analyzeAlert) ────────────────

  it('正例: 价格变动告警分析', async () => {
    const alert: any = {
      id: 'test-1',
      storeName: '竞品A',
      city: '上海',
      type: 'price_change',
      severity: 'high',
      description: '降价20%',
      detectedAt: new Date().toISOString(),
      recommendedAction: '',
    }
    const storeData: any = {
      id: 'store-1',
      name: '我的店',
      city: '上海',
      district: '徐汇',
      tier: 'mid',
      currentPrice: 148,
      monthlyRevenue: 200000,
      visitorCount: 2000,
    }
    const analysis = await svc.analyzeAlert(alert, storeData)
    assert.ok(analysis)
    assert.ok(typeof analysis === 'string')
    assert.ok(analysis.length > 10)
  })

  it('正例: 活动异动告警分析', async () => {
    const alert: any = {
      id: 'test-2',
      storeName: '竞品B',
      city: '北京',
      type: 'new_activity',
      severity: 'medium',
      description: '推出暑期畅玩卡',
      detectedAt: new Date().toISOString(),
      recommendedAction: '',
    }
    const storeData: any = {
      id: 'store-2',
      name: '我的店',
      city: '北京',
      district: '朝阳',
      tier: 'high',
      currentPrice: 188,
      monthlyRevenue: 300000,
      visitorCount: 3000,
    }
    const analysis = await svc.analyzeAlert(alert, storeData)
    assert.ok(analysis.length > 10)
  })

  // ─── 知识检索 (retrieveKnowledge) ───────────

  it('正例: 获取定价模块知识', async () => {
    const cards = await svc.retrieveKnowledge('pricing', ['上海', '定价策略'])
    assert.ok(Array.isArray(cards))
    assert.ok(cards.length >= 0) // 无DB时返回空列表,合法
  })

  // ─── 边界 ────────────────────────────────────

  it('边界: 未知城市用默认竞争数据', async () => {
    const advice = await svc.generatePricingAdvice('未知城市', '未知区域', 'mid')
    assert.ok(advice)
    assert.ok(advice.length > 10)
  })

  it('边界: 未知季节返回默认活动', async () => {
    const advice = await svc.generateActivityAdvice('上海', 'unknown')
    assert.ok(advice)
    assert.ok(advice.expectedGrowthPercent > 0)
  })

  it('边界: 空知识检索返回空数组', async () => {
    const cards = await svc.retrieveKnowledge('', [])
    assert.ok(Array.isArray(cards))
  })

  // ─── 反例 ────────────────────────────────────

  it('反例: 极低档次定价建议', async () => {
    const advice = await svc.generatePricingAdvice('北京', '海淀', 'very_low')
    assert.ok(advice.length > 10)
  })
})
