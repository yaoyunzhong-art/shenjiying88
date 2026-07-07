/**
 * AiDecisionPanel 组件测试 (SSR 模式)
 *
 * 覆盖:
 * 1. 基础渲染 - 标题、统计信息、事件卡片
 * 2. 类型过滤按钮渲染
 * 3. 不同 variant
 * 4. 类型导出一致性
 * 5. 常量定义正确性
 * 6. Mock 数据正确性
 * 7. 组件工厂函数
 */

import React from 'react'

const assert = require('node:assert/strict')
const { describe, test } = require('node:test')

const PROJECT_ROOT = '/Users/yaoyunzhong/Desktop/shenjiying/shenjiying88'
const { renderToStaticMarkup } = require(
  PROJECT_ROOT + '/node_modules/.pnpm/react-dom@18.3.1_react@18.3.1/node_modules/react-dom/server.node.js'
)
const { AiDecisionPanel } = require('./AiDecisionPanel')

describe('AiDecisionPanel', () => {
  test('renders panel title', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, {}))
    assert.match(html, /🤖 AI决策中心/)
  })

  test('renders stats with event count', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, {}))
    assert.match(html, /条决策事件/)
  })

  test('renders data-testid on root', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, {}))
    assert.ok(html.includes('data-testid="ai-decision-panel"'))
  })

  test('renders variant attribute', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, { variant: 'h5' }))
    assert.ok(html.includes('data-variant="h5"'))
  })

  test('renders all variants without crash', () => {
    const variants = ['pc', 'h5', 'app', 'pad', 'miniprogram'] as const
    for (const v of variants) {
      const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, { variant: v }))
      assert.ok(html.includes(`data-variant="${v}"`))
    }
  })

  test('renders filter buttons for all event types', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, {}))
    assert.ok(html.includes('data-testid="filter-type-member_level"'))
    assert.ok(html.includes('data-testid="filter-type-device_risk"'))
    assert.ok(html.includes('data-testid="filter-type-points_risk"'))
    assert.ok(html.includes('data-testid="filter-type-behavior_alarm"'))
    assert.ok(html.includes('data-testid="filter-type-abnormal_transaction"'))
    assert.ok(html.includes('data-testid="filter-type-ai_recommendation"'))
  })

  test('renders event type labels in filter bar', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, {}))
    assert.match(html, /会员等级/)
    assert.match(html, /设备风险/)
    assert.match(html, /积分风控/)
    assert.match(html, /行为告警/)
    assert.match(html, /异常交易/)
    assert.match(html, /AI推荐/)
  })

  test('renders event type icons in filter bar', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, {}))
    assert.ok(html.includes('👤'))
    assert.ok(html.includes('📱'))
    assert.ok(html.includes('🪙'))
    assert.ok(html.includes('🔔'))
    assert.ok(html.includes('⚠️'))
    assert.ok(html.includes('🤖'))
  })

  test('renders data-severity on event cards', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, {}))
    assert.ok(html.includes('data-severity='))
    assert.ok(html.includes('"warning"'))
    assert.ok(html.includes('"critical"'))
    assert.ok(html.includes('"info"'))
  })

  test('renders data-handled on event cards', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, {}))
    assert.ok(html.includes('data-handled="true"'))
    assert.ok(html.includes('data-handled="false"'))
  })

  test('renders event severity badges', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, {}))
    assert.match(html, /严重/)
    assert.match(html, /警告/)
    assert.match(html, /信息/)
  })

  test('renders handled/unhandled status on events', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, {}))
    assert.ok(html.includes('已处理'))
    assert.ok(html.includes('待处理'))
  })

  test('renders rule hit count in event cards', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, {}))
    assert.match(html, /规则 \d+\/\d+ 条命中/)
  })

  test('renders decision-event- data-testid', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, {}))
    assert.ok(html.includes('data-testid="decision-event-'))
  })

  test('renders conclusion text', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, {}))
    assert.match(html, /通胀率/)
    assert.match(html, /升级/)
  })

  test('renders target ID in event card', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, {}))
    assert.ok(html.includes('mem_10086'))
  })

  test('renders timestamp in event card', () => {
    const html = renderToStaticMarkup(React.createElement(AiDecisionPanel, {}))
    assert.match(html, /\d+月\d+日/)
  })

  test('AiDecisionPanel is a function', () => {
    assert.equal(typeof AiDecisionPanel, 'function')
  })
})

// 类型导出测试
describe('AiDecisionPanel types and constants', () => {
  test('EVENT_TYPE_LABELS exports correctly', () => {
    const { EVENT_TYPE_LABELS } = require('./types')
    assert.equal(EVENT_TYPE_LABELS.points_risk, '积分风控')
    assert.equal(EVENT_TYPE_LABELS.member_level, '会员等级')
    assert.equal(EVENT_TYPE_LABELS.ai_recommendation, 'AI推荐')
  })

  test('EVENT_TYPE_ICONS exports correctly', () => {
    const { EVENT_TYPE_ICONS } = require('./types')
    assert.equal(EVENT_TYPE_ICONS.points_risk, '🪙')
    assert.equal(EVENT_TYPE_ICONS.member_level, '👤')
  })

  test('SEVERITY_COLORS exports correct values', () => {
    const { SEVERITY_COLORS } = require('./types')
    assert.equal(SEVERITY_COLORS.info, '#1677ff')
    assert.equal(SEVERITY_COLORS.warning, '#faad14')
    assert.equal(SEVERITY_COLORS.critical, '#f5222d')
  })

  test('SEVERITY_LABELS exports correct values', () => {
    const { SEVERITY_LABELS } = require('./types')
    assert.equal(SEVERITY_LABELS.info, '信息')
    assert.equal(SEVERITY_LABELS.warning, '警告')
    assert.equal(SEVERITY_LABELS.critical, '严重')
  })
})

// Mock 数据层测试
describe('AiDecisionPanel mock data', () => {
  test('useDecisionEvents returns events', () => {
    const { useDecisionEvents } = require('./useDecisionPanel.mock')
    const { events } = useDecisionEvents()
    assert.ok(events.length > 0)
  })

  test('every event has required fields', () => {
    const { useDecisionEvents } = require('./useDecisionPanel.mock')
    const { events } = useDecisionEvents()
    for (const event of events) {
      assert.ok(event.id)
      assert.ok(event.type)
      assert.ok(event.targetId)
      assert.ok(event.ruleResults.length > 0)
      assert.ok(typeof event.handled === 'boolean')
    }
  })

  test('every rule result has valid fields', () => {
    // 重新加载 mock 模块以避免之前调用的交叉影响
    delete require.cache[require.resolve('./useDecisionPanel.mock')]
    const { useDecisionEvents } = require('./useDecisionPanel.mock')
    const { events } = useDecisionEvents()
    for (const event of events) {
      for (const rule of event.ruleResults) {
        assert.ok(rule.ruleId, `ruleId missing for ${rule.ruleName}`)
        assert.ok(rule.ruleName, 'ruleName missing')
        assert.equal(typeof rule.triggered, 'boolean')
        assert.ok(rule.confidence >= 0 && rule.confidence <= 1, `confidence out of range: ${rule.confidence}`)
        assert.notEqual(rule.detail, undefined, `detail undefined for ${rule.ruleName}`)
      }
    }
  })

  test('filter by severity works', () => {
    delete require.cache[require.resolve('./useDecisionPanel.mock')]
    const { useDecisionEvents } = require('./useDecisionPanel.mock')
    const { events: filtered } = useDecisionEvents({ severityFilter: ['critical'] })
    for (const e of filtered) {
      assert.equal(e.severity, 'critical')
    }
  })

  test('filter by type works', () => {
    delete require.cache[require.resolve('./useDecisionPanel.mock')]
    const { useDecisionEvents } = require('./useDecisionPanel.mock')
    const { events: filtered } = useDecisionEvents({ typeFilter: ['points_risk'] })
    for (const e of filtered) {
      assert.equal(e.type, 'points_risk')
    }
  })

  test('maxEvents limits count', () => {
    delete require.cache[require.resolve('./useDecisionPanel.mock')]
    const { useDecisionEvents } = require('./useDecisionPanel.mock')
    const { events } = useDecisionEvents({ maxEvents: 2 })
    assert.ok(events.length <= 2)
  })

  test('events sorted by createdAt descending', () => {
    delete require.cache[require.resolve('./useDecisionPanel.mock')]
    const { useDecisionEvents } = require('./useDecisionPanel.mock')
    const { events } = useDecisionEvents()
    for (let i = 1; i < events.length; i++) {
      assert.ok(
        new Date(events[i - 1].createdAt).getTime() >= new Date(events[i].createdAt).getTime()
      )
    }
  })

  test('useHandleEvent has mutate function', () => {
    const { useHandleEvent } = require('./useDecisionPanel.mock')
    const result = useHandleEvent()
    assert.equal(typeof result.mutate, 'function')
    assert.equal(result.isLoading, false)
  })
})
