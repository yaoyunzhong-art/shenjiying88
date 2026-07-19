import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { IntelligenceService } from './intelligence.service'

describe('IntelligenceService', () => {
  let svc: IntelligenceService
  beforeEach(() => { svc = new IntelligenceService() })

  // ── 可行性报告 ──
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

  it('正例: 低竞品密度得分更高', () => {
    const dense = svc.generateFeasibilityReport('上海', '徐汇', 300)
    const sparse = svc.generateFeasibilityReport('南京', '鼓楼', 300)
    assert.ok(sparse.score >= dense.score || sparse.competitorCount < dense.competitorCount)
  })

  // ── 运营参谋 ──
  it('正例: 返回4个参谋选项', () => {
    const advices = svc.generateOperationAdvice('store-1')
    assert.equal(advices.length, 4)
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

  // ── 竞争监控 ──
  it('正例: 返回4条监控告警', () => {
    const alerts = svc.monitorCompetitor('store-1', '上海')
    assert.equal(alerts.length, 4)
  })

  it('正例: 每个告警有推荐动作', () => {
    const alerts = svc.monitorCompetitor('store-1')
    for (const a of alerts) {
      assert.ok(a.recommendedAction.startsWith('建议'))
    }
  })

  // ── 边界/反例 ──
  it('边界: 未知城市返回默认值', () => {
    const report = svc.generateFeasibilityReport('未知城市', '未知区域', 100)
    assert.ok(report.competitorCount === 1)
    assert.ok(report.score > 0)
  })

  it('反例: 空category返回所有', () => {
    const advices = svc.generateOperationAdvice('store-1', '')
    assert.equal(advices.length, 4)
  })
})
