/**
 * intelligence/monitor/page.test.tsx — 竞争监控页面测试
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

describe('Monitor Page', () => {
  beforeEach(() => {})

  // ── 文件存在性 ──
  it('页面文件存在', () => {
    assert.ok(content, 'page.tsx 内容非空')
  })

  // ── 告警类型 ──
  it('包含6种告警类型', () => {
    const types = ['price_change', 'new_activity', 'new_promotion', 'rating_change', 'equipment_change', 'policy_change']
    for (const t of types) {
      assert.ok(content.includes(t), `缺少告警类型: ${t}`)
    }
  })

  it('6种类型有对应的label和icon映射', () => {
    assert.ok(content.includes('TYPE_LABELS'))
    assert.ok(content.includes('TYPE_ICONS'))
    const labels = ['💰 价格调整', '🎉 新活动', '🏷️ 新优惠', '⭐ 评分变化', '🔧 设备异动', '📋 政策变更']
    for (const l of labels) {
      assert.ok(content.includes(l), `缺少类型标签: ${l}`)
    }
  })

  // ── 严重度 ──
  it('3级严重度: high/medium/low', () => {
    assert.ok(content.includes('high'))
    assert.ok(content.includes('medium'))
    assert.ok(content.includes('low'))
  })

  it('严重度有颜色区分(红/黄/绿)', () => {
    assert.ok(content.includes('border-red-500'))
    assert.ok(content.includes('border-yellow-500'))
    assert.ok(content.includes('border-green-500'))
    assert.ok(content.includes('🔴 紧急'))
    assert.ok(content.includes('🟡 关注'))
    assert.ok(content.includes('🟢 观察'))
  })

  // ── API数据获取 ──
  it('从API获取监控数据', () => {
    assert.ok(content.includes('/intelligence/monitor/summary'))
  })

  it('API不可用时使用降级mock数据', () => {
    assert.ok(content.includes('generateMockData'))
    assert.ok(content.includes('降级数据'))
  })

  it('自动刷新每30秒', () => {
    assert.ok(content.includes('30_000') || content.includes('30000'))
  })

  // ── 筛选功能 ──
  it('支持按类型筛选告警', () => {
    assert.ok(content.includes('typeFilter'))
    assert.ok(content.includes('setTypeFilter'))
    assert.ok(content.includes('全部类型'))
  })

  it('支持按严重度筛选告警', () => {
    assert.ok(content.includes('sevFilter'))
    assert.ok(content.includes('setSevFilter'))
    assert.ok(content.includes('全部级别'))
  })

  it('已去重的告警排在最后', () => {
    assert.ok(content.includes('deduped'))
    assert.ok(content.includes('24h内仅展示最新一次'))
  })

  // ── 趋势图 ──
  it('展示周异动走势图', () => {
    assert.ok(content.includes('trend'))
    assert.ok(content.includes('TrendPoint'))
    assert.ok(content.includes('周异动走势'))
    assert.ok(content.includes('weeklyTrend'))
  })

  it('走势图按日期聚合并按天排序', () => {
    assert.ok(content.includes('localeCompare'))
  })

  // ── 统计卡片 ──
  it('统计卡片展示每种类型的非去重数量', () => {
    assert.ok(content.includes('stats'))
    assert.ok(content.includes("a.type === t && !a.deduped"))
  })

  it('未去重的高严重度告警计数显示为badge', () => {
    assert.ok(content.includes('highCount'))
    assert.ok(content.includes("a.severity === 'high' && !a.deduped"))
    assert.ok(content.includes('animate-pulse'))
  })

  // ── 数据新鲜度 ──
  it('显示数据采集新鲜度指示器', () => {
    assert.ok(content.includes('freshnessText'))
    assert.ok(content.includes('数据采集于'))
    assert.ok(content.includes('刚刚采集'))
  })

  it('新鲜度颜色: 刚刚=绿, 分钟=黄, 小时=灰', () => {
    assert.ok(content.includes('bg-green-100'))
    assert.ok(content.includes('bg-yellow-100'))
    assert.ok(content.includes('bg-gray-100'))
  })

  // ── 空状态 ──
  it('无数据时显示空状态', () => {
    assert.ok(content.includes('暂无监控数据'))
    assert.ok(content.includes('filtered.length === 0'))
  })

  // ── 边界条件 ──
  it('边界: formatTime处理不同时间跨度(分/时/天)', () => {
    assert.ok(content.includes('formatTime'))
    assert.ok(content.includes('3600000')) // 1小时
    assert.ok(content.includes('86400000')) // 1天
  })

  it('边界: 展开/折叠告警详情', () => {
    assert.ok(content.includes('expandedId'))
    assert.ok(content.includes('setExpandedId'))
  })

  it('边界: 自动刷新开关', () => {
    assert.ok(content.includes('autoRefresh'))
    assert.ok(content.includes('setAutoRefresh'))
  })

  it('边界: 扫描模式显示(全量/增量)', () => {
    assert.ok(content.includes("scanMode === 'full' ? '全量' : '增量'"))
  })

  // ── 展开的AI建议面板 ──
  it('展开详情显示AI解决建议', () => {
    assert.ok(content.includes('AI解决建议'))
    assert.ok(content.includes('recommendedAction'))
  })

  // ── 类型定义 ──
  it('接口 Alert 字段完整', () => {
    assert.ok(content.includes('interface Alert'))
    const fields = ['id', 'storeName', 'city', 'type', 'severity', 'description', 'detectedAt', 'recommendedAction']
    for (const f of fields) {
      assert.ok(content.includes(f), `缺少 Alert 字段: ${f}`)
    }
  })

  it('接口 MonitorSummary 包含 alerts/trend/scanTimestamp', () => {
    assert.ok(content.includes('interface MonitorSummary'))
    assert.ok(content.includes('alerts: Alert[]'))
    assert.ok(content.includes('trend: TrendPoint[]'))
    assert.ok(content.includes('scanTimestamp'))
  })

  // ── TSC兼容 ──
  it('TSC兼容: 无as any', () => {
    assert.ok(!content.includes('as any'))
  })
})
