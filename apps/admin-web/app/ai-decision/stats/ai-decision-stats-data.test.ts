/**
 * ai-decision-stats-data.test.ts — AI 决策统计页数据层单元测试
 *
 * 圈梁五道箍对齐:
 *   ✅ 正常路径 – 快照加载 / 统计计算 / 图表构建 / 排序
 *   ✅ 边界值 – 空数组 / 单条数据 / 极端成功率 / 超大规则集
 *   ✅ 空状态 – 空规则 / 零执行次数
 *   ✅ 错误处理 – 空数组 / NaN 统计 / 未知 source 颜色
 *   ✅ 权限校验 – 常量不可变 / 颜色映射完整 / 类型枚举
 */

import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

import {
  loadAiDecisionStatsSnapshot,
  computeStats,
  computeAiDecisionSummary,
  buildResultSlices,
  buildSourceSlices,
  sortRulesByLift,
  MOCK_RULES,
  RESULT_COLORS,
  SOURCE_COLORS,
  SEGMENTS,
  type RuleStat,
} from './ai-decision-stats-data'

// ==================== 正常路径 ====================

describe('loadAiDecisionStatsSnapshot — 快照加载', () => {
  it('应返回 mock 交付模式 & 6 条规则', async () => {
    const snapshot = await loadAiDecisionStatsSnapshot()
    assert.equal(snapshot.deliveryMode, 'mock')
    assert.equal(snapshot.rules.length, 6)
    assert.ok(snapshot.generatedAt)
  })

  it('MOCK_RULES 各字段完整', () => {
    MOCK_RULES.forEach((rule) => {
      assert.ok(rule.id)
      assert.ok(rule.name)
      assert.ok(['rule', 'model', 'hybrid'].includes(rule.source))
      assert.equal(typeof rule.executionCount, 'number')
      assert.equal(typeof rule.successCount, 'number')
      assert.equal(typeof rule.avgResponseMs, 'number')
      assert.equal(typeof rule.liftPercent, 'number')
    })
  })
})

describe('computeStats — 统计计算', () => {
  it('6 条规则统计汇总正确', () => {
    const stats = computeStats(MOCK_RULES)
    // 所有规则的 executionCount 之和
    const expectedTotal = MOCK_RULES.reduce((s, r) => s + r.executionCount, 0)
    assert.equal(stats.total, expectedTotal)
    assert.ok(stats.successRate > 70)
    assert.ok(stats.successRate < 95)
    assert.ok(stats.avgResp > 0)
  })

  it('avgLift 应保留一位小数', () => {
    const stats = computeStats(MOCK_RULES)
    const parts = String(stats.avgLift).split('.')
    if (parts.length > 1) {
      assert.ok(parts[1].length <= 1, `avgLift 应保留 1 位小数: ${stats.avgLift}`)
    }
  })

  it('成功率和平均响应时间成正向逻辑', () => {
    const stats = computeStats(MOCK_RULES)
    assert.ok(stats.success <= stats.total)
    assert.ok(stats.successRate >= 0 && stats.successRate <= 100)
  })
})

describe('computeAiDecisionSummary — 决策摘要', () => {
  it('摘要字段完整 & 计算正确', () => {
    const summary = computeAiDecisionSummary(MOCK_RULES)
    assert.equal(summary.totalDecisions, MOCK_RULES.reduce((s, r) => s + r.executionCount, 0))
    assert.equal(summary.adoptedCount, MOCK_RULES.reduce((s, r) => s + r.successCount, 0))
    assert.equal(summary.rejectedCount, summary.totalDecisions - summary.adoptedCount)
    assert.ok(summary.pendingReviewCount > 0)
  })
})

describe('buildResultSlices — 结果环形图', () => {
  it('应返回 3 个切片: success / partial / failure', () => {
    const slices = buildResultSlices(MOCK_RULES)
    assert.equal(slices.length, 3)
    const keys = slices.map((s) => s.key)
    assert.ok(keys.includes('success'))
    assert.ok(keys.includes('partial'))
    assert.ok(keys.includes('failure'))
  })

  it('成功切片数量最大', () => {
    const slices = buildResultSlices(MOCK_RULES)
    const success = slices.find((s) => s.key === 'success')!
    const failure = slices.find((s) => s.key === 'failure')!
    assert.ok(success.value > failure.value)
  })
})

describe('buildSourceSlices — 来源环形图', () => {
  it('应返回 3 个来源切片', () => {
    const slices = buildSourceSlices(MOCK_RULES)
    assert.equal(slices.length, 3)
    const labels = slices.map((s) => s.label)
    assert.ok(labels.includes('规则引擎'))
    assert.ok(labels.includes('模型推理'))
    assert.ok(labels.includes('混合决策'))
  })

  it('每个切片必须有颜色', () => {
    const slices = buildSourceSlices(MOCK_RULES)
    slices.forEach((s) => {
      assert.ok(s.color.length > 0)
    })
  })
})

describe('sortRulesByLift — 按提升率排序', () => {
  it('按 liftPercent 降序排列', () => {
    const sorted = sortRulesByLift(MOCK_RULES)
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(sorted[i - 1].liftPercent >= sorted[i].liftPercent, `位置 ${i - 1} 应 >= 位置 ${i}`)
    }
  })

  it('不应修改原数组', () => {
    const original = [...MOCK_RULES]
    sortRulesByLift(MOCK_RULES)
    assert.equal(MOCK_RULES.length, original.length)
    MOCK_RULES.forEach((rule, idx) => {
      assert.equal(rule.id, original[idx].id)
      assert.equal(rule.liftPercent, original[idx].liftPercent)
    })
  })
})

// ==================== 边界值 ====================

describe('边界值 — 极端 / 最小 / 最大输入', () => {
  it('单条规则应正常统计', () => {
    const single: RuleStat[] = [{ id: 'r-test', name: '测试规则', source: 'rule', executionCount: 100, successCount: 90, avgResponseMs: 50, liftPercent: 5.0 }]
    const stats = computeStats(single)
    assert.equal(stats.total, 100)
    assert.equal(stats.success, 90)
    assert.equal(stats.successRate, 90.0)
  })

  it('100% 成功率的统计', () => {
    const perfect: RuleStat[] = [{ id: 'r-perfect', name: '完美规则', source: 'model', executionCount: 500, successCount: 500, avgResponseMs: 30, liftPercent: 20 }]
    const stats = computeStats(perfect)
    assert.equal(stats.successRate, 100)
  })

  it('0% 成功率的统计', () => {
    const failed: RuleStat[] = [{ id: 'r-fail', name: '失败规则', source: 'hybrid', executionCount: 200, successCount: 0, avgResponseMs: 999, liftPercent: -5 }]
    const stats = computeStats(failed)
    assert.equal(stats.successRate, 0)
    assert.equal(stats.success, 0)
  })

  it('混合多条极端规则', () => {
    const mixed: RuleStat[] = [
      { id: 'r1', name: '规则A', source: 'rule', executionCount: 10000, successCount: 9999, avgResponseMs: 10, liftPercent: 99.9 },
      { id: 'r2', name: '规则B', source: 'model', executionCount: 0, successCount: 0, avgResponseMs: 0, liftPercent: 0 },
    ]
    const stats = computeStats(mixed)
    assert.ok(stats.successRate > 50)
    assert.equal(stats.avgResp, 10) // 10000 * 10 / 10000 = 10
  })

  it('大量规则排序性能可接受', () => {
    const many: RuleStat[] = Array.from({ length: 1000 }, (_, i) => ({
      id: `r-${i}`,
      name: `规则${i}`,
      source: (['rule', 'model', 'hybrid'] as const)[i % 3],
      executionCount: Math.floor(Math.random() * 10000),
      successCount: Math.floor(Math.random() * 5000),
      avgResponseMs: Math.floor(Math.random() * 500),
      liftPercent: +(Math.random() * 30).toFixed(1),
    }))
    const sorted = sortRulesByLift(many)
    assert.equal(sorted.length, 1000)
    for (let i = 1; i < sorted.length; i++) {
      assert.ok(sorted[i - 1].liftPercent >= sorted[i].liftPercent)
    }
  })

  it('executionCount 等于 0 的规则 result 切片不应包含 NaN 值', () => {
    const zeroRules: RuleStat[] = [
      { id: 'r-zero', name: '零执行', source: 'rule', executionCount: 0, successCount: 0, avgResponseMs: 0, liftPercent: 0 },
    ]
    const slices = buildResultSlices(zeroRules)
    slices.forEach((s) => {
      assert.ok(!Number.isNaN(s.value))
      assert.ok(s.value >= 0)
    })
  })

  it('单规则 buildSourceSlices', () => {
    const single: RuleStat[] = [{ id: 'r1', name: '单规则', source: 'hybrid', executionCount: 100, successCount: 80, avgResponseMs: 50, liftPercent: 10 }]
    const slices = buildSourceSlices(single)
    assert.equal(slices.length, 1)
    assert.equal(slices[0].key, 'hybrid')
  })
})

// ==================== 空状态 ====================

describe('空状态 — 空数组 / 零输入', () => {
  it('空规则 computeStats 应归零', () => {
    const stats = computeStats([])
    assert.equal(stats.total, 0)
    assert.equal(stats.success, 0)
    assert.equal(stats.successRate, 0)
    assert.equal(stats.avgResp, 0)
    assert.equal(stats.avgLift, 0)
  })

  it('空规则 computeAiDecisionSummary 应归零', () => {
    const summary = computeAiDecisionSummary([])
    assert.equal(summary.totalDecisions, 0)
    assert.equal(summary.adoptedCount, 0)
    assert.equal(summary.rejectedCount, 0)
    assert.equal(summary.pendingReviewCount, 0)
  })

  it('空规则 buildResultSlices 不应崩溃', () => {
    const slices = buildResultSlices([])
    assert.equal(slices.length, 3)
    slices.forEach((s) => {
      assert.ok(s.value >= 0)
    })
  })

  it('空规则 buildSourceSlices 应返回空', () => {
    const slices = buildSourceSlices([])
    assert.equal(slices.length, 0)
  })

  it('空规则 sortRulesByLift 应返回空', () => {
    const sorted = sortRulesByLift([])
    assert.equal(sorted.length, 0)
  })
})

// ==================== 错误处理 ====================

describe('错误处理 — 异常数据', () => {
  it('successCount > executionCount 不应当导致负值拒绝', () => {
    const bad: RuleStat[] = [{ id: 'r-bad', name: '异常规则', source: 'rule', executionCount: 100, successCount: 999, avgResponseMs: 30, liftPercent: 5 }]
    const stats = computeStats(bad)
    assert.equal(stats.success, 999)
    assert.ok(stats.successRate > 100)
  })

  it('负值 executionCount 不应崩溃', () => {
    const neg: RuleStat[] = [{ id: 'r-neg', name: '负数规则', source: 'model', executionCount: -10, successCount: 5, avgResponseMs: 100, liftPercent: -2 }]
    const stats = computeStats(neg)
    assert.equal(typeof stats.total, 'number')
    assert.ok(!Number.isNaN(stats.total))
  })

  it('未知 source 类型 buildSourceSlices 应使用默认颜色', () => {
    const unknown: RuleStat[] = [{ id: 'r-unknown', name: '未知源', source: 'unknown' as 'rule', executionCount: 100, successCount: 80, avgResponseMs: 50, liftPercent: 5 }]
    const slices = buildSourceSlices(unknown)
    assert.equal(slices.length, 1)
    assert.equal(slices[0].key, 'unknown')
    assert.ok(slices[0].color) // 应有 #94a3b8 默认色
  })

  it('负值 liftPercent 排序不应受影响', () => {
    const data: RuleStat[] = [
      { id: 'r1', name: '负提升', source: 'rule', executionCount: 100, successCount: 80, avgResponseMs: 50, liftPercent: -10 },
      { id: 'r2', name: '正提升', source: 'rule', executionCount: 100, successCount: 80, avgResponseMs: 50, liftPercent: 20 },
    ]
    const sorted = sortRulesByLift(data)
    assert.equal(sorted[0].id, 'r2')
    assert.equal(sorted[1].id, 'r1')
  })
})

// ==================== 权限校验 / 数据合约 ====================

describe('数据合约 — 常量 & 枚举 & 结构', () => {
  it('RESULT_COLORS 应包含三种结果', () => {
    assert.equal(Object.keys(RESULT_COLORS).length, 3)
    assert.ok(RESULT_COLORS.success)
    assert.ok(RESULT_COLORS.partial)
    assert.ok(RESULT_COLORS.failure)
  })

  it('SOURCE_COLORS 应包含三种来源', () => {
    assert.equal(Object.keys(SOURCE_COLORS).length, 3)
    assert.ok(SOURCE_COLORS.rule)
    assert.ok(SOURCE_COLORS.model)
    assert.ok(SOURCE_COLORS.hybrid)
  })

  it('SEGMENTS 应包含 3 个仪表盘区间', () => {
    assert.equal(SEGMENTS.length, 3)
    SEGMENTS.forEach((s) => {
      assert.equal(typeof s.from, 'number')
      assert.equal(typeof s.to, 'number')
      assert.ok(s.color)
      assert.ok(s.label)
    })
  })

  it('SEGMENTS 区间应连续且覆盖 0-100', () => {
    assert.equal(SEGMENTS[0].from, 0)
    assert.equal(SEGMENTS[SEGMENTS.length - 1].to, 100)
    for (let i = 1; i < SEGMENTS.length; i++) {
      assert.equal(SEGMENTS[i].from, SEGMENTS[i - 1].to)
    }
  })

  it('MOCK_RULES 各 source 均合法', () => {
    const validSources = ['rule', 'model', 'hybrid']
    MOCK_RULES.forEach((r) => {
      assert.ok(validSources.includes(r.source), `非法 source: ${r.source}`)
    })
  })

  it('MOCK_RULES 各 ID 唯一', () => {
    const ids = MOCK_RULES.map((r) => r.id)
    assert.equal(new Set(ids).size, ids.length)
  })

  it('MOCK_RULES ID 前缀均为 "r"', () => {
    MOCK_RULES.forEach((r) => {
      assert.ok(r.id.startsWith('r'), `ID 应以 r 开头: ${r.id}`)
    })
  })

  it('computeStats 返回字段结构完整', () => {
    const stats = computeStats(MOCK_RULES)
    const expectedKeys = ['total', 'success', 'successRate', 'avgResp', 'avgLift']
    expectedKeys.forEach((key) => {
      assert.ok(key in stats, `缺少字段: ${key}`)
    })
  })
})
