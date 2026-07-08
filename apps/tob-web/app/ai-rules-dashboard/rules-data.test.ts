/**
 * rules-data.test.ts — AI 决策规则数据层测试
 *
 * 测试策略 (L1):
 * - 正例: 数据层 helper 函数、常量定义、mock 数据完整性
 * - 反例: 无效值处理
 * - 边界: 边界值、空值、大数值
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  MOCK_AI_RULES,
  formatExecutionCount,
  formatLatency,
  getSuccessRateVariant,
  computeSummary,
  RULE_CATEGORY_LABEL,
  RULE_STATUS_LABEL,
  RULE_PRIORITY_LABEL,
  RULE_CATEGORIES,
  RULE_STATUSES,
  RULE_PRIORITIES,
  type AiRuleItem,
  type RuleCategory,
  type RuleStatus,
} from './rules-data';

// ─── 1. 正例 — 常量完整性 ──────────────────────────────────────────

describe('rules-data — 常量定义', () => {
  it('RULE_CATEGORIES 包含所有分类', () => {
    assert.deepEqual(RULE_CATEGORIES, ['pricing', 'inventory', 'member', 'promotion', 'anomaly']);
  });

  it('RULE_STATUSES 包含所有状态', () => {
    assert.deepEqual(RULE_STATUSES, ['active', 'paused', 'draft', 'archived']);
  });

  it('RULE_PRIORITIES 包含所有优先级', () => {
    assert.deepEqual(RULE_PRIORITIES, [1, 2, 3, 4, 5]);
  });

  it('每个 category 都有中文 label', () => {
    for (const cat of RULE_CATEGORIES) {
      assert.ok(RULE_CATEGORY_LABEL[cat], `Missing label for ${cat}`);
    }
  });

  it('每个 status 都有中文 label', () => {
    for (const st of RULE_STATUSES) {
      assert.ok(RULE_STATUS_LABEL[st], `Missing label for ${st}`);
    }
  });

  it('每个 priority 都有中文 label', () => {
    for (const p of RULE_PRIORITIES) {
      assert.ok(RULE_PRIORITY_LABEL[p], `Missing label for priority ${p}`);
    }
  });
});

// ─── 2. 正例 — formatExecutionCount ──────────────────────────────────

describe('rules-data — formatExecutionCount', () => {
  it('formats 0', () => {
    assert.equal(formatExecutionCount(0), '0');
  });

  it('formats values under 1000', () => {
    assert.equal(formatExecutionCount(999), '999');
  });

  it('formats 1000 as 1.0K', () => {
    assert.equal(formatExecutionCount(1000), '1.0K');
  });

  it('formats 128430 as 128.4K', () => {
    assert.equal(formatExecutionCount(128_430), '128.4K');
  });

  it('formats 1_000_000 as 1.0M', () => {
    assert.equal(formatExecutionCount(1_000_000), '1.0M');
  });

  it('formats 8_945_123 as 8.9M', () => {
    assert.equal(formatExecutionCount(8_945_123), '8.9M');
  });
});

// ─── 3. 正例 — formatLatency ──────────────────────────────────────────

describe('rules-data — formatLatency', () => {
  it('formats 0ms', () => {
    assert.equal(formatLatency(0), '0ms');
  });

  it('formats small values as ms', () => {
    assert.equal(formatLatency(45), '45ms');
  });

  it('formats 999ms', () => {
    assert.equal(formatLatency(999), '999ms');
  });

  it('formats 1000ms as 1.0s', () => {
    assert.equal(formatLatency(1000), '1.0s');
  });

  it('formats 1200ms as 1.2s', () => {
    assert.equal(formatLatency(1200), '1.2s');
  });

  it('formats 15300ms as 15.3s', () => {
    assert.equal(formatLatency(15300), '15.3s');
  });
});

// ─── 4. 正例 — getSuccessRateVariant ──────────────────────────────────

describe('rules-data — getSuccessRateVariant', () => {
  it('rate >= 95 returns success', () => {
    assert.equal(getSuccessRateVariant(95), 'success');
    assert.equal(getSuccessRateVariant(100), 'success');
  });

  it('80 <= rate < 95 returns warning', () => {
    assert.equal(getSuccessRateVariant(80), 'warning');
    assert.equal(getSuccessRateVariant(94.9), 'warning');
  });

  it('rate < 80 returns error', () => {
    assert.equal(getSuccessRateVariant(0), 'error');
    assert.equal(getSuccessRateVariant(79), 'error');
  });
});

// ─── 5. 正例 — computeSummary ──────────────────────────────────────────

describe('rules-data — computeSummary', () => {
  it('computes summary from active MOCK_AI_RULES', () => {
    const summary = computeSummary(MOCK_AI_RULES);
    // 10 rules
    assert.equal(summary.totalRules, 10);
    // active: rule-001,002,003,005,007,009 = 6
    assert.equal(summary.activeCount, 6);
    // paused: rule-004,008 = 2
    assert.equal(summary.pausedCount, 2);
    // draft: rule-006 = 1
    assert.equal(summary.draftCount, 1);
    // archived: rule-010 = 1
    assert.equal(summary.archivedCount, 1);
    // avgSuccessRate = 96.1 avg... let's compute
    const totalRate = MOCK_AI_RULES.reduce((s, r) => s + r.successRate, 0);
    assert.equal(summary.avgSuccessRate, Math.round(totalRate / 10));
    // totalExecutions
    const totalExec = MOCK_AI_RULES.reduce((s, r) => s + r.executionCount, 0);
    assert.equal(summary.totalExecutions, totalExec);
    // avgLatencyMs
    const totalLat = MOCK_AI_RULES.reduce((s, r) => s + r.avgLatencyMs, 0);
    assert.equal(summary.avgLatencyMs, Math.round(totalLat / 10));
  });

  it('returns empty summary for empty array', () => {
    const summary = computeSummary([]);
    assert.equal(summary.totalRules, 0);
    assert.equal(summary.activeCount, 0);
    assert.equal(summary.avgSuccessRate, 0);
    assert.equal(summary.totalExecutions, 0);
    assert.equal(summary.avgLatencyMs, 0);
  });
});

// ─── 6. 正例 — MOCK_AI_RULES 数据完整性 ──────────────────────────────

describe('rules-data — MOCK_AI_RULES 数据完整性', () => {
  it('所有 mock 规则都有完整字段', () => {
    for (const rule of MOCK_AI_RULES) {
      assert.ok(rule.id, 'Missing id');
      assert.ok(rule.name, 'Missing name');
      assert.ok(rule.category, 'Missing category');
      assert.ok(RULE_CATEGORY_LABEL[rule.category], `Invalid category: ${rule.category}`);
      assert.ok(RULE_STATUS_LABEL[rule.status], `Invalid status: ${rule.status}`);
      assert.ok(RULE_PRIORITY_LABEL[rule.priority], `Invalid priority: ${rule.priority}`);
      assert.equal(typeof rule.executionCount, 'number');
      assert.equal(typeof rule.successRate, 'number');
      assert.ok(rule.successRate >= 0 && rule.successRate <= 100);
      assert.equal(typeof rule.avgLatencyMs, 'number');
      assert.ok(rule.avgLatencyMs >= 0);
    }
  });

  it('至少有一条 active 规则', () => {
    assert.ok(MOCK_AI_RULES.some((r) => r.status === 'active'));
  });

  it('至少有一条 anomaly 类规则', () => {
    assert.ok(MOCK_AI_RULES.some((r) => r.category === 'anomaly'));
  });
});

// ─── 7. 反例 — 边界输入 ──────────────────────────────────────────────

describe('rules-data — 边界/反例', () => {
  it('formatExecutionCount handles negative? (zero clamp at caller)', () => {
    // 函数本身不做校验，但不应抛异常
    assert.doesNotThrow(() => formatExecutionCount(-1));
    assert.equal(formatExecutionCount(-1), '-1'); // passes through as-is
  });

  it('formatLatency handles negative?', () => {
    assert.doesNotThrow(() => formatLatency(-100));
  });

  it('getSuccessRateVariant handles negative rate', () => {
    assert.equal(getSuccessRateVariant(-1), 'error');
  });

  it('getSuccessRateVariant handles >100 rate', () => {
    // 超过 100 仍按 >=95 处理
    assert.equal(getSuccessRateVariant(150), 'success');
  });
});

// ─── 8. 反例 — 空值/缺失字段 ──────────────────────────────────────────

describe('rules-data — 空值/缺失字段', () => {
  it('computeSummary skips rules with missing status count properly', () => {
    const partial: AiRuleItem[] = [
      {
        id: 'x',
        name: 'test',
        description: '',
        category: 'pricing' as RuleCategory,
        priority: 3,
        status: 'active' as RuleStatus,
        executionCount: 100,
        successRate: 90,
        avgLatencyMs: 50,
        lastExecutedAt: '2026-07-08T00:00:00Z',
        createdBy: 'tester',
        tags: [],
      },
    ];
    const s = computeSummary(partial);
    assert.equal(s.totalRules, 1);
    assert.equal(s.activeCount, 1);
    assert.equal(s.avgSuccessRate, 90);
  });

  it('MOCK_AI_RULES 中 rule-006 lastExecutedAt 为 null（草稿）', () => {
    const draft = MOCK_AI_RULES.find((r) => r.id === 'rule-006');
    assert.ok(draft);
    assert.equal(draft.lastExecutedAt, null);
    assert.equal(draft.executionCount, 0);
  });
});
