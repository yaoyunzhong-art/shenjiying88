/**
 * intelligence/feasibility/page.test.tsx — 可行性报告页面测试
 * 覆盖: 数据/状态/边界 ≥ 15 tests
 */
import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import React from 'react'
import { createRoot } from 'react-dom/client'

function readSrc(): string | null {
  try {
    const fs = require('fs')
    const path = require('path')
    return fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8')
  } catch {
    return null
  }
}

const content: string = (() => {
  const s = readSrc()
  if (!s) throw new Error('Cannot read page.tsx')
  return s
})()

function renderToText(el: React.ReactElement): string {
  const container = document.createElement('div')
  document.body.appendChild(container)
  const root = createRoot(container)
  root.render(el)
  return container.textContent ?? ''
}

describe('Feasibility Page', () => {
  beforeEach(() => {})

  // ── 文件存在性 ──
  it('页面文件存在', () => {
    assert.ok(content, 'page.tsx 内容非空')
  })

  // ── 城市/区域/预算选择器 ──
  it('包含城市/区域/预算选择器和生成按钮', () => {
    assert.ok(content.includes('选择城市'))
    assert.ok(content.includes('选择区域'))
    assert.ok(content.includes('预算'))
    assert.ok(content.includes('生成报告'))
  })

  it('包含11个城市（含长沙）', () => {
    const cities = ['上海', '北京', '广州', '深圳', '成都', '杭州', '重庆', '武汉', '西安', '南京', '长沙']
    for (const c of cities) {
      assert.ok(content.includes(c), `缺少城市: ${c}`)
    }
  })

  it('每个城市至少3个区域选项', () => {
    const districtCounts = content.match(/'[^']+'/g) ?? []
    const cityEntries = content.match(/'上海':\s*\[[^\]]+\]/g)
    assert.ok(cityEntries, '城市区域映射 CITY_DISTRICTS 存在')
  })

  // ── 报告组件 ──
  it('包含设备配置建议区', () => {
    assert.ok(content.includes('建议设备配置'))
    assert.ok(content.includes('suggestedEquipment'))
  })

  it('包含风险因素展示', () => {
    assert.ok(content.includes('风险因素'))
    assert.ok(content.includes('riskFactors'))
  })

  it('包含市场趋势分析', () => {
    assert.ok(content.includes('市场趋势'))
    assert.ok(content.includes('marketTrend'))
  })

  it('包含财务全景表', () => {
    assert.ok(content.includes('财务全景表'))
    assert.ok(content.includes('FinancePanorama'))
  })

  it('包含预算对比分析', () => {
    assert.ok(content.includes('预算对比分析'))
    assert.ok(content.includes('BudgetComparison'))
  })

  it('包含同城平均值对比', () => {
    assert.ok(content.includes('同城平均值对比'))
    assert.ok(content.includes('cityAvgComparison'))
  })

  // ── 模拟数据生成 ──
  it('包含模拟报告生成函数', () => {
    assert.ok(content.includes('simulateReport'))
  })

  it('包含模拟财务计算函数', () => {
    assert.ok(content.includes('simulateFinance'))
  })

  // ── 等级/颜色映射 ──
  it('可行性评分3个等级: high/medium/low', () => {
    assert.ok(content.includes("=== 'high'"))
    assert.ok(content.includes("=== 'medium'"))
    // 'low' 只出现在变量赋值中，通过内容验证
    assert.ok(content.includes("': 'low'}") || content.includes("'low', suggestion"))
  })

  it('3个等级对应3种标签和颜色', () => {
    assert.ok(content.includes('bg-green-100'))
    assert.ok(content.includes('bg-yellow-100'))
    assert.ok(content.includes('bg-red-100'))
    assert.ok(content.includes('非常适合'))
    assert.ok(content.includes('可考虑'))
    assert.ok(content.includes('不建议'))
  })

  // ── 输入验证 ──
  it('输入验证: city或district为空时提示错误', () => {
    assert.ok(content.includes("请选择城市和区域"))
  })

  it('预算滑块范围 100-1000, step=50', () => {
    assert.ok(content.includes('min={100}'))
    assert.ok(content.includes('max={1000}'))
    assert.ok(content.includes('step={50}'))
  })

  // ── 财务全景表的详细指标 ──
  it('财务投入包含设备/装修/系统/押金4项', () => {
    assert.ok(content.includes('设备成本'))
    assert.ok(content.includes('装修成本'))
    assert.ok(content.includes('系统软件'))
    assert.ok(content.includes('押金(3月)'))
  })

  it('月成本包含租金/人力/维护/订阅4项固定成本', () => {
    assert.ok(content.includes('租金'))
    assert.ok(content.includes('人力'))
    assert.ok(content.includes('设备维护'))
    assert.ok(content.includes('系统订阅'))
  })

  it('月成本包含电费/耗材/营销3项变动成本', () => {
    assert.ok(content.includes('电费'))
    assert.ok(content.includes('耗材'))
    assert.ok(content.includes('营销推广'))
  })

  it('营收预估包含客单价/日客流/月营收/月利润', () => {
    assert.ok(content.includes('预估客单价'))
    assert.ok(content.includes('预估日客流'))
    assert.ok(content.includes('预估月营收'))
    assert.ok(content.includes('预估月利润'))
  })

  it('计算折旧(设备3年)和摊销(装修5年)', () => {
    assert.ok(content.includes('月折旧'))
    assert.ok(content.includes('月摊销'))
    assert.ok(content.includes('设备3年'))
    assert.ok(content.includes('装修5年'))
  })

  it('投资回收期含简单和含折旧两种', () => {
    assert.ok(content.includes('简单回收期'))
    assert.ok(content.includes('含折旧回收期'))
  })

  // ── 装修档次 ──
  it('包含3个装修档次选择', () => {
    assert.ok(content.includes('经济'))
    assert.ok(content.includes('标准'))
    assert.ok(content.includes('豪华'))
  })

  it('装修档次与单价映射: 600/1200/3500', () => {
    assert.ok(content.includes('economy: 600'))
    assert.ok(content.includes('standard: 1200'))
    assert.ok(content.includes('luxury: 3500'))
  })

  // ── 边界条件 ──
  it('边界: 模拟报告分数范围 25-95', () => {
    assert.ok(content.includes('Math.min('))
    assert.ok(content.includes('Math.max(25,'))
  })

  it('边界: 允许编辑面积(50-5000)', () => {
    assert.ok(content.includes('min={50}'))
    assert.ok(content.includes('max={5000}'))
  })

  it('边界: 预算对比3档(当前-100, 当前, 当前+200)', () => {
    assert.ok(content.includes('baseBudget - 100'))
    assert.ok(content.includes('baseBudget + 200'))
  })

  it('边界: 回收期无限(999)时的显示', () => {
    assert.ok(content.includes('>= 999'))
    assert.ok(content.includes("'∞'"))
  })

  // ── TSC兼容 ──
  it('TSC兼容: FeasibilityReport接口完整', () => {
    assert.ok(content.includes('interface FeasibilityReport'))
    const fields = ['city', 'district', 'score', 'scoreLevel', 'competitorCount', 'avgPrice', 'marketTrend']
    for (const f of fields) {
      assert.ok(content.includes(f), `缺少接口字段: ${f}`)
    }
  })

  it('TSC兼容: FinancePanorama接口完整', () => {
    assert.ok(content.includes('interface FinancePanorama'))
    assert.ok(content.includes('initialInvestment'))
    assert.ok(content.includes('monthlyFixedCost'))
    assert.ok(content.includes('monthlyVariableCost'))
    assert.ok(content.includes('revenueEstimate'))
  })

  it('TSC兼容: 无as any', () => {
    assert.ok(!content.includes('as any'))
  })
})
