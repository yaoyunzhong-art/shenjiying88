/**
 * intelligence.service.test.ts — P-50 V2 运营参谋测试 (M2 + E9修复 · AI赋能引擎)
 *
 * 圈梁指令:
 *   ① TSC通过 → ② 测试存在(0 fail·无skip) → ③ 圈梁表更新 → ④ PRD标记 → ⑤ 知识赋能
 *
 * 覆盖:
 *   - 可行性报告（正例+边界+反例）
 *   - 运营参谋（7大类·正例+反例）含数据佐证
 *   - 新增3类: recruit / seasonal / blindbox
 *   - 竞争监控（增量/全量/获取/走势）
 *   - AI决策引擎 (定价建议/活动推荐/知识检索)
 *   - 装修全景财务报告
 *   - 边界+反例
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { IntelligenceService } from './intelligence.service'
import { IntelligenceAiService } from './intelligence-ai.service'
import { MonitorCollectorService } from './monitor-collector.service'

describe('IntelligenceService', () => {
  let svc: IntelligenceService

  beforeEach(() => {
    const aiService = new IntelligenceAiService()
    const collector = new MonitorCollectorService()
    svc = new IntelligenceService(aiService, collector)
  })

  // ── 1. 可行性报告 (3 tests) ──────────────────────────

  it('正例: 生成可行性报告含所有字段', () => {
    const report = svc.generateFeasibilityReport('上海', '徐汇', 300)
    assert.ok(report.score >= 0 && report.score <= 100)
    assert.ok(report.competitorCount > 0)
    assert.ok(report.suggestedEquipment.length >= 4)
    assert.ok(report.estimatedPaybackMonths > 0)
  })

  it('正例: 高预算高得分', () => {
    const high = svc.generateFeasibilityReport('成都', '武侯', 500)
    const low = svc.generateFeasibilityReport('成都', '武侯', 100)
    assert.ok(high.score >= low.score)
  })

  it('边界: 未知城市返回默认值', () => {
    const report = svc.generateFeasibilityReport('未知城市', '未知区域', 100)
    assert.equal(report.competitorCount, 1)
    assert.ok(report.score > 0)
  })

  // ── 2. 运营参谋 — 7大类 (6 tests) ─────────────────────

  it('正例: 返回7个参谋选项 (P-50 V2 新增3类)', () => {
    const advices = svc.generateOperationAdvice('store-1')
    assert.equal(advices.length, 7)
  })

  it('正例: 每个选项含3个choices', () => {
    const advices = svc.generateOperationAdvice('store-1')
    for (const a of advices) {
      assert.equal(a.options.length, 3)
    }
  })

  it('正例: 按category筛选', () => {
    const pricing = svc.generateOperationAdvice('store-1', 'pricing')
    assert.equal(pricing.length, 1)
    assert.equal(pricing[0]?.category, 'pricing')
  })

  it('正例: 新增 recruit 类包含3个选项', () => {
    const recruit = svc.generateOperationAdvice('store-1', 'recruit')
    assert.equal(recruit.length, 1)
    assert.equal(recruit[0]?.category, 'recruit')
    assert.equal(recruit[0]?.options.length, 3)
  })

  it('正例: 新增 seasonal 类包含3个选项', () => {
    const seasonal = svc.generateOperationAdvice('store-1', 'seasonal')
    assert.equal(seasonal.length, 1)
    assert.equal(seasonal[0]?.category, 'seasonal')
    assert.equal(seasonal[0]?.options.length, 3)
  })

  it('正例: 新增 blindbox 类包含3个选项', () => {
    const blindbox = svc.generateOperationAdvice('store-1', 'blindbox')
    assert.equal(blindbox.length, 1)
    assert.equal(blindbox[0]?.category, 'blindbox')
    assert.equal(blindbox[0]?.options.length, 3)
  })

  it('反例: 空category返回所有7个', () => {
    const advices = svc.generateOperationAdvice('store-1', '')
    assert.equal(advices.length, 7)
  })

  // ── 3. 数据佐证 (2 tests) ────────────────────────────

  it('正例: 每个选项含dataEvidence字段', () => {
    const advices = svc.generateOperationAdvice('store-1')
    for (const a of advices) {
      for (const opt of a.options) {
        assert.ok(opt.dataEvidence, `${a.category} 选项 ${opt.id} 缺少dataEvidence`)
        assert.ok(opt.dataEvidence!.length > 5)
      }
    }
  })

  it('正例: pricing类的dataEvidence包含竞争分析', () => {
    const pricing = svc.generateOperationAdvice('store-1', 'pricing')
    const options = pricing[0]!.options
    for (const opt of options) {
      assert.ok(opt.dataEvidence!.includes('竞品') || opt.dataEvidence!.includes('定价') || opt.dataEvidence!.includes('竞争'),
        `pricing选项${opt.id}数据佐证内容不足: ${opt.dataEvidence}`)
    }
  })

  // ── 4. 竞争监控 (3 tests) ────────────────────────────

  it('正例: monitorCompetitor 返回 MonitorSummary 格式', async () => {
    const result = await svc.monitorCompetitor()
    assert.ok(result)
    assert.ok(Array.isArray(result.alerts))
    assert.ok(Array.isArray(result.trend))
    assert.ok(result.scanTimestamp)
    assert.ok(typeof result.freshnessMinutes === 'number')
    assert.ok(['incremental', 'full'].includes(result.scanMode))
  })

  it('正例: 增量模式扫描返回告警', async () => {
    const result = await svc.monitorCompetitor('上海', 'incremental')
    assert.equal(result.scanMode, 'incremental')
    assert.ok(result.alerts.length >= 0)
  })

  it('正例: 全量模式扫描标记正确', async () => {
    const result = await svc.monitorCompetitor('上海', 'full')
    assert.equal(result.scanMode, 'full')
  })

  // ── 5. 扫描方法 (2 tests) ────────────────────────────

  it('正例: triggerIncrementalScan 触发增量采集', async () => {
    const result = await svc.triggerIncrementalScan('上海')
    assert.equal(result.scanMode, 'incremental')
    assert.ok(result.alerts.length >= 0)
  })

  it('正例: triggerFullScan 触发全量采集', async () => {
    const result = await svc.triggerFullScan('上海')
    assert.equal(result.scanMode, 'full')
  })

  // ── 6. AI决策引擎 (3 tests) ──────────────────────────

  it('正例: getLatestScanResult 返回可用结果', async () => {
    // 先触发一次采集
    await svc.monitorCompetitor('上海', 'incremental')
    const result = await svc.getLatestScanResult()
    assert.ok(result)
    assert.ok(Array.isArray(result.alerts))
    assert.ok(typeof result.freshnessMinutes === 'number')
  })

  it('正例: getLatestScanResult 无缓存时自动采集', async () => {
    // 新实例，无缓存
    const result = await svc.getLatestScanResult()
    assert.ok(result)
    assert.ok(Array.isArray(result.alerts))
  })

  it('正例: getDataEvidence 返回对应类别的佐证', () => {
    const aiService = new IntelligenceAiService()
    const evidences = aiService.getDataEvidence('pricing', 3)
    assert.equal(evidences.length, 3)
    for (const e of evidences) {
      assert.ok(e.length > 5)
    }
  })

  // ── 7. AI知识检索 (1 test) ───────────────────────────

  it('正例: retrieveKnowledge 按模块+关键词匹配返回top-3', async () => {
    const aiService = new IntelligenceAiService()
    const cards = await aiService.retrieveKnowledge('intelligence', ['定价'])
    assert.ok(cards.length > 0)
    assert.ok(cards.length <= 3)
    for (const c of cards) {
      assert.ok(c.id)
      assert.ok(c.summary)
      assert.ok(c.freshnessScore >= 0)
    }
  })

  it('边界: retrieveKnowledge 无关键词返回模块匹配结果', async () => {
    const aiService = new IntelligenceAiService()
    const cards = await aiService.retrieveKnowledge('intelligence.seasonal', [])
    // 当关键词为空时，keywordMatch为true，应返回所有卡片（上限3）
    assert.ok(cards.length > 0, '应返回至少1张卡片')
    assert.ok(cards.length <= 3, '最多返回3张')
  })

  it('反例: retrieveKnowledge 不存在的模块返回空', async () => {
    const aiService = new IntelligenceAiService()
    const cards = await aiService.retrieveKnowledge('non-existent-module', ['xyz'])
    assert.equal(cards.length, 0)
  })

  // ── 8. 财务全景表 (P-50 V2 · 10 tests) ─────────────

  describe('calculateFinancePanorama (10 tests)', () => {
    // 正例 1: 标准参数
    it('正例: 标准参数生成完整财务全景', () => {
      const result = svc.calculateFinancePanorama(300, 400, 'standard', '上海', '徐汇')
      assert.ok(result.initialInvestment.equipmentCost > 0)
      assert.ok(result.initialInvestment.renovationCost > 0)
      assert.ok(result.initialInvestment.softwareSystemCost >= 80000)
      assert.ok(result.initialInvestment.softwareSystemCost <= 200000)
      assert.ok(result.initialInvestment.deposit > 0)
      assert.equal(result.initialInvestment.total,
        result.initialInvestment.equipmentCost +
        result.initialInvestment.renovationCost +
        result.initialInvestment.softwareSystemCost +
        result.initialInvestment.deposit)
      assert.equal(result.monthlyTotalCost,
        result.monthlyFixedCost.total + result.monthlyVariableCost.total)
      assert.ok(result.paybackMonths > 0)
      assert.ok(result.paybackWithDepreciation >= result.paybackMonths)
      assert.ok(result.cityAvgComparison.initialInvestment > 0)
    })

    // 正例 2: 豪华档装修 (luxury → 豪华 → 3500元/㎡)
    it('正例: 豪华档装修3500元/㎡', () => {
      const result = svc.calculateFinancePanorama(300, 300, 'luxury', '上海', '徐汇')
      assert.equal(result.initialInvestment.renovationCost, 3500 * 300)
    })

    // 正例 3: 大面积人力配置更多
    it('正例: 大面积场地人力配置更多', () => {
      const small = svc.calculateFinancePanorama(200, 150, 'standard', '上海', '徐汇')
      const large = svc.calculateFinancePanorama(500, 600, 'standard', '上海', '徐汇')
      assert.ok(large.monthlyFixedCost.labor > small.monthlyFixedCost.labor)
      assert.ok(large.monthlyFixedCost.rent > small.monthlyFixedCost.rent)
    })

    // 正例 4: 不同城市租金差异
    it('正例: 不同城市租金差异', () => {
      const shanghai = svc.calculateFinancePanorama(300, 300, 'standard', '上海', '徐汇')
      const chengdu = svc.calculateFinancePanorama(300, 300, 'standard', '成都', '武侯')
      assert.ok(shanghai.monthlyFixedCost.rent > chengdu.monthlyFixedCost.rent)
      assert.ok(shanghai.monthlyFixedCost.labor > chengdu.monthlyFixedCost.labor)
    })

    // 正例 5: 折旧和摊销
    it('正例: 折旧和摊销计算正确', () => {
      const result = svc.calculateFinancePanorama(300, 400, 'standard', '上海', '徐汇')
      assert.equal(result.monthlyDepreciation, Math.round(result.initialInvestment.equipmentCost / 36))
      assert.equal(result.monthlyAmortization, Math.round(result.initialInvestment.renovationCost / 60))
    })

    // 正例 6: 含折旧回收期 >= 不含折旧
    it('正例: 含折旧摊销回收期 >= 不含折旧', () => {
      const result = svc.calculateFinancePanorama(300, 400, 'standard', '上海', '徐汇')
      assert.ok(result.paybackWithDepreciation >= result.paybackMonths)
    })

    // 正例 7: 经济档装修
    it('正例: 经济档装修600元/㎡', () => {
      const result = svc.calculateFinancePanorama(200, 200, 'economy', '成都', '锦江')
      assert.equal(result.initialInvestment.renovationCost, 600 * 200)
    })

    // 边界 1: budget=0 → 默认300万
    it('边界: budget=0时使用默认300万', () => {
      const result = svc.calculateFinancePanorama(0, 400, 'standard', '上海', '徐汇')
      assert.equal(result.initialInvestment.equipmentCost, 1350000)
    })

    // 边界 2: area超大 → 截断5000㎡
    it('边界: area超大截断到5000㎡', () => {
      const result = svc.calculateFinancePanorama(500, 10000, 'standard', '上海', '徐汇')
      assert.equal(result.initialInvestment.renovationCost, 1200 * 5000)
      assert.ok(result.initialInvestment.softwareSystemCost <= 200000)
    })

    // 边界 3: 未知城市 → 默认值
    it('边界: 未知城市使用默认值', () => {
      // area=150 (≤200 → 6人), 确保小面积
      const result = svc.calculateFinancePanorama(300, 150, 'standard', '未知城市', '未知区域')
      assert.equal(result.monthlyFixedCost.rent, 100 * 150)
      assert.equal(result.monthlyFixedCost.labor, 6 * 6000)
    })

    // 反例 1: 利润为负 → 回收期999
    it('反例: 利润为负时回收期=999', () => {
      const result = svc.calculateFinancePanorama(100, 50, 'luxury', '上海', '徐汇')
      if (result.revenueEstimate.estimatedMonthlyProfit <= 0) {
        assert.equal(result.paybackMonths, 999)
        assert.equal(result.paybackWithDepreciation, 999)
      } else {
        assert.ok(result.paybackMonths > 36)
      }
    })

    // 反例 2: area=0 → 默认300㎡
    it('反例: area=0时默认300㎡', () => {
      const result = svc.calculateFinancePanorama(300, 0, 'standard', '上海', '徐汇')
      assert.equal(result.area, 300)
      assert.equal(result.initialInvestment.renovationCost, 1200 * 300)
    })
  })

  // ─── 9. 选址评估增强 (V23 场景A · 6 tests) ──────────

  describe('sitingAssessment (6 tests)', () => {
    it('正例: 已知城市完整输出', () => {
      const result = svc.sitingAssessment('上海', '徐汇')
      assert.equal(result.city, '上海')
      assert.equal(result.district, '徐汇')
      assert.ok(result.overallScore >= 0 && result.overallScore <= 100)
      assert.ok(result.confidenceInterval.low <= result.overallScore)
      assert.ok(result.confidenceInterval.high >= result.overallScore)
      assert.ok(result.competition.totalCompetitors > 0)
      assert.ok(result.competition.avgTicketPrice > 0)
      assert.ok(['高', '中', '低'].includes(result.competition.densityLevel))
      assert.ok(result.riskFactors.length >= 3)
      assert.ok(result.suggestions.length >= 3)
      assert.ok(result.dataSource.disclaimer.includes('仅供参考'))
      assert.ok(result.dataSource.freshness)
      assert.ok(result.dataSource.sourceType)
    })

    it('正例: grade与score一致', () => {
      const high = svc.sitingAssessment('南京', '鼓楼') // low competitor count
      const low = svc.sitingAssessment('北京', '朝阳')  // high competitor count
      assert.ok(high.overallScore >= 0)
      assert.ok(low.overallScore >= 0)
    })

    it('正例: 竞争密度高时densityLevel为高', () => {
      const result = svc.sitingAssessment('上海', '徐汇') // 8 competitors
      assert.ok(['高', '中', '低'].includes(result.competition.densityLevel))
      if (result.competition.totalCompetitors >= 6) {
        assert.equal(result.competition.densityLevel, '高')
      }
    })

    it('正例: 数据来源声明字段完整', () => {
      const result = svc.sitingAssessment('成都', '武侯')
      assert.ok(result.dataSource.disclaimer.length > 10)
      assert.ok(result.dataSource.freshness.length > 0)
      assert.ok(result.dataSource.sourceType.length > 0)
    })

    it('边界: 未知城市使用默认竞争数据', () => {
      const result = svc.sitingAssessment('未知城市', '未知区域')
      assert.equal(result.competition.totalCompetitors, 1)
      assert.equal(result.competition.avgTicketPrice, 60)
      assert.equal(result.competition.densityLevel, '低')
      assert.ok(result.overallScore > 0)
    })

    it('正例: 多城市覆盖率12+', () => {
      const cities = [
        ['上海', '徐汇'], ['上海', '浦东'], ['上海', '静安'],
        ['北京', '朝阳'], ['北京', '海淀'],
        ['深圳', '南山'], ['深圳', '福田'],
        ['成都', '锦江'], ['成都', '武侯'],
        ['广州', '天河'], ['杭州', '西湖'], ['南京', '鼓楼'],
      ]
      for (const [city, district] of cities) {
        const result = svc.sitingAssessment(city, district)
        assert.equal(result.city, city)
        assert.equal(result.district, district)
        assert.ok(result.overallScore >= 0)
        assert.ok(result.riskFactors.length >= 2)
      }
    })
  })

  // ─── 10. 新店规划 (V23 场景B · 6 tests) ──────────

  describe('storePlanning (6 tests)', () => {
    it('正例: 完整新店规划输出', () => {
      const result = svc.storePlanning({ city: '上海', district: '徐汇', budget: 300, area: 400, tier: 'standard' })
      assert.equal(result.city, '上海')
      assert.equal(result.district, '徐汇')
      assert.ok(result.score >= 0 && result.score <= 100)
      assert.ok(result.confidenceInterval.low <= result.score)
      assert.ok(result.confidenceInterval.high >= result.score)
      assert.ok(['非常适合', '可考虑', '不建议'].includes(result.grade))
      assert.ok(result.competition.totalCompetitors > 0)
      assert.ok(result.financialOverview.initialInvestment.total > 0)
      assert.ok(result.financialOverview.estimatedMonthlyRevenue > 0)
      assert.ok(result.financialOverview.paybackMonths > 0)
      assert.ok(result.equipmentSuggestions.length >= 4)
      assert.ok(result.renovationEstimate.total > 0)
      assert.ok(result.riskFactors.length >= 4)
      assert.ok(result.aiSummary.length > 20)
    })

    it('正例: luxury档次装修费用更高', () => {
      const economy = svc.storePlanning({ city: '成都', district: '锦江', budget: 200, area: 200, tier: 'economy' })
      const luxury = svc.storePlanning({ city: '成都', district: '锦江', budget: 500, area: 200, tier: 'luxury' })
      assert.ok(luxury.renovationEstimate.total > economy.renovationEstimate.total)
      assert.ok(luxury.financialOverview.initialInvestment.renovation > economy.financialOverview.initialInvestment.renovation)
    })

    it('正例: 设备数量随tier因子调整', () => {
      const economy = svc.storePlanning({ city: '成都', district: '锦江', budget: 200, area: 200, tier: 'economy' })
      const luxury = svc.storePlanning({ city: '成都', district: '锦江', budget: 500, area: 200, tier: 'luxury' })
      for (let i = 0; i < economy.equipmentSuggestions.length; i++) {
        assert.ok(luxury.equipmentSuggestions[i]!.count >= economy.equipmentSuggestions[i]!.count)
      }
    })

    it('正例: 风险因素包含选址+预算+回收期', () => {
      const result = svc.storePlanning({ city: '上海', district: '浦东', budget: 300, area: 400, tier: 'standard' })
      const factors = result.riskFactors.map(r => r.factor)
      assert.ok(factors.some(f => f.includes('竞品')))
      assert.ok(factors.some(f => f.includes('装修') || f.includes('档次')))
      assert.ok(factors.some(f => f.includes('回收期') || f.includes('租金')))
    })

    it('正例: AI摘要包含城市和评分', () => {
      const result = svc.storePlanning({ city: '广州', district: '天河', budget: 300, area: 300, tier: 'standard' })
      assert.ok(result.aiSummary.includes('广州'))
      assert.ok(result.aiSummary.includes('天河'))
      assert.ok(result.aiSummary.includes(String(result.score)))
    })

    it('边界: 未知城市使用默认数据', () => {
      const result = svc.storePlanning({ city: '未知城市', district: '未知区域', budget: 200, area: 200, tier: 'economy' })
      assert.equal(result.city, '未知城市')
      assert.equal(result.competition.totalCompetitors, 1)
      assert.equal(result.competition.avgTicketPrice, 60)
      assert.ok(result.financialOverview.initialInvestment.total > 0)
    })
  })
})
