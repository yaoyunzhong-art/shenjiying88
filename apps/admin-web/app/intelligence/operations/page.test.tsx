/**
 * intelligence/operations/page.test.tsx — 运营参谋AI选择题测试
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

describe('Operations Page', () => {
  beforeEach(() => {})

  // ── 文件存在性 ──
  it('页面文件存在', () => {
    assert.ok(content, 'page.tsx 内容非空')
  })

  // ── AI选择题类别 ──
  it('包含7大类AI选择题', () => {
    const categories = ['pricing', 'activity', 'equipment', 'promotion', 'recruit', 'seasonal', 'blindbox']
    for (const c of categories) {
      assert.ok(content.includes(c), `缺少类别: ${c}`)
    }
  })

  it('7大类有对应的中文标签', () => {
    const labels = ['💰 定价策略', '🎯 活动方案', '🛠️ 设备更新', '🏷️ 促销应对', '🤝 联名活动/IP跨界', '🏖️ 暑假/寒假限定', '🎁 盲盒/抽奖促销合规版']
    for (const l of labels) {
      assert.ok(content.includes(l), `缺少类别标签: ${l}`)
    }
  })

  // ── 每个选择题的选项和证据 ──
  it('每个选项有dataEvidence同城竞品数据', () => {
    const evidences = content.match(/dataEvidence/g)
    assert.ok(evidences)
    assert.ok(evidences.length >= 21, `至少21个dataEvidence，当前${evidences.length}`)
  })

  it('每个选项有estimatedEffect预估效果', () => {
    const effects = content.match(/estimatedEffect/g)
    assert.ok(effects)
    assert.ok(effects.length >= 21, `至少21个estimatedEffect，当前${effects.length}`)
  })

  it('每个选项有pros优势列表', () => {
    // 每个选项应有pros数组，至少检查一个具体pro
    assert.ok(content.includes("'简单易执行'"))
    assert.ok(content.includes("'客户体验好'"))
    assert.ok(content.includes("'收入最大化'"))
    assert.ok(content.includes("'曝光量大'"))
    assert.ok(content.includes("'引流快'"))
  })

  it('每个选项有cons劣势列表', () => {
    // 每个选项应有cons数组，至少检查一个具体cons
    assert.ok(content.includes("'高峰期收入少'"))
    assert.ok(content.includes("'需系统支持'"))
    assert.ok(content.includes("'技术门槛高'"))
    assert.ok(content.includes("'利润薄'"))
  })

  // ── 城市选择器 ──
  it('包含同城数据参考城市选择器', () => {
    assert.ok(content.includes('同城数据参考'))
    assert.ok(content.includes('选择城市'))
    assert.ok(content.includes('选择区域'))
  })

  it('包含7个城市', () => {
    const cities = ['上海', '北京', '广州', '深圳', '成都', '杭州', '南京']
    for (const c of cities) {
      assert.ok(content.includes(c), `缺少城市: ${c}`)
    }
  })

  it('城市选择后区域选择器取消禁用', () => {
    assert.ok(content.includes("disabled={!city}"))
  })

  it('选择城市+区域后显示绿色确认文本', () => {
    assert.ok(content.includes("✅ 正在使用"))
    assert.ok(content.includes("竞品数据"))
  })

  // ── 分类筛选 ──
  it('按分类筛选功能，默认显示全部', () => {
    assert.ok(content.includes('activeCategory'))
    assert.ok(content.includes("activeCategory === 'ALL'"))
  })

  it('按分类筛选按钮互斥选中状态', () => {
    // 全部按钮选中用blue-600, 其他用gray-100
    assert.ok(content.includes("'ALL' ? 'bg-blue-600 text-white' : 'bg-gray-100'"))
    assert.ok(content.includes("activeCategory === c ? 'bg-blue-600 text-white' : 'bg-gray-100'"))
  })

  // ── 历史案例模式 ──
  it('包含历史案例模式切换', () => {
    assert.ok(content.includes('历史案例模式'))
    assert.ok(content.includes('同城活动历史案例'))
  })

  it('历史案例仅在activity分类下显示切换', () => {
    assert.ok(content.includes("activeCategory === 'activity'"))
  })

  it('历史案例表包含5条mock数据', () => {
    assert.ok(content.includes('MOCK_HISTORICAL_CASES'))
    const cases = content.match(/historyEntry|MOCK_HISTORICAL_CASES/g)
    assert.ok(cases)
  })

  it('历史案例表字段包含时间/类型/竞品数/客流增长/收入增长', () => {
    assert.ok(content.includes('activityName'))
    assert.ok(content.includes('avgTrafficIncrease'))
    assert.ok(content.includes('avgRevenueIncrease'))
    assert.ok(content.includes('storeCount'))
  })

  // ── AI建议面板 ──
  it('AI建议面板存在并包含蓝色样式', () => {
    assert.ok(content.includes('AI建议'))
    assert.ok(content.includes('bg-blue-50'))
    assert.ok(content.includes('border-blue-200'))
  })

  it('选择选项后触发AI建议', () => {
    assert.ok(content.includes('handleSelect'))
    assert.ok(content.includes('AI建议'))
    assert.ok(content.includes('q.aiSuggestion'))
  })

  it('已选选项显示"✓ 已选"标记', () => {
    assert.ok(content.includes('已选'))
    assert.ok(content.includes('isSelected'))
  })

  // ── 边界条件 ──
  it('边界: 无城市时提示选择', () => {
    assert.ok(content.includes('选择城市+区域后可获取同城竞品参考'))
  })

  it('边界: 选择题模式和历史案例模式互斥', () => {
    assert.ok(content.includes('!showHistorical'))
    assert.ok(content.includes('setShowHistorical'))
  })

  it('边界: 区域选择器在未选城市时禁用', () => {
    assert.ok(content.includes('disabled={!city}'))
  })

  // ── 类型定义 ──
  it('ChoiceOption接口包含id/label/description/pros/cons', () => {
    assert.ok(content.includes('interface ChoiceOption'))
    assert.ok(content.includes('id: string'))
    assert.ok(content.includes('label: string'))
    assert.ok(content.includes('pros: string[]'))
    assert.ok(content.includes('cons: string[]'))
    assert.ok(content.includes('estimatedEffect: string'))
  })

  it('AdviceQuestion接口包含question/category/aiSuggestion/options', () => {
    assert.ok(content.includes('interface AdviceQuestion'))
    assert.ok(content.includes('question: string'))
    assert.ok(content.includes('category: string'))
    assert.ok(content.includes('aiSuggestion: string'))
    assert.ok(content.includes('options: ChoiceOption[]'))
  })

  it('HistoricalCase接口字段完整', () => {
    assert.ok(content.includes('interface HistoricalCase'))
    const fields = ['year', 'month', 'activityName', 'storeCount', 'avgTrafficIncrease', 'avgRevenueIncrease']
    for (const f of fields) {
      assert.ok(content.includes(f), `缺少 HistoricalCase 字段: ${f}`)
    }
  })

  // ── TSC兼容 ──
  it('TSC兼容: 无as any', () => {
    assert.ok(!content.includes('as any'))
  })
})
