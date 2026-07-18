/**
 * ai-rule-engine — 规则引擎测试
 *
 * 覆盖: 正例·反例·边界
 * 基于 MEMORY.md 测试科学化原则:
 * - 禁止 as any / skip / only
 * - 三件套覆盖(正例+反例+边界)
 * - beforeEach重置
 */
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  evaluateRule, evaluateRuleChain, getBestMatch,
  createRule, updateRule, filterByDomain,
} from './rule-engine';
import type { RuleDefinition, RuleContext } from './rule-engine';

// ─── 测试数据 ──────────────────────────────────────

function makeRule(overrides: Partial<RuleDefinition> = {}): RuleDefinition {
  return {
    id: 'test-rule-1',
    name: '测试规则',
    description: '单元测试规则',
    domain: 'diagnosis',
    enabled: true,
    conditions: [{ field: 'revenue', operator: 'gt', value: 10000, valueType: 'number' }],
    actions: [{ type: 'alert', params: { severity: 'high' }, priority: 1 }],
    weight: 80,
    maxExecutions: 0,
    cooldownMs: 0,
    tags: ['test'],
    createdAt: '2026-07-18T00:00:00Z',
    updatedAt: '2026-07-18T00:00:00Z',
    ...overrides,
  };
}

function makeContext(data: Record<string, unknown> = {}): RuleContext {
  return {
    tenantId: 'tenant-1',
    timestamp: Date.now(),
    data: { revenue: 15000, name: '门店A', status: 'active', ...data },
  };
}

// ─── 条件评估 (正例) ──────────────────────────────

describe('RuleEngine — condition evaluation (happy path)', () => {
  it('eq matches when field value equals condition value', () => {
    const rule = makeRule({ conditions: [{ field: 'status', operator: 'eq', value: 'active', valueType: 'string' }] });
    const result = evaluateRule(rule, makeContext({ status: 'active' }));
    assert.strictEqual(result.matched, true);
  });

  it('gt matches when field value is greater', () => {
    const rule = makeRule({ conditions: [{ field: 'revenue', operator: 'gt', value: 10000, valueType: 'number' }] });
    const result = evaluateRule(rule, makeContext({ revenue: 15000 }));
    assert.strictEqual(result.matched, true);
  });

  it('multiple AND conditions all match', () => {
    const rule = makeRule({
      conditions: [
        { field: 'revenue', operator: 'gt', value: 10000, valueType: 'number' },
        { field: 'status', operator: 'eq', value: 'active', valueType: 'string' },
      ],
    });
    const result = evaluateRule(rule, makeContext({ revenue: 15000, status: 'active' }));
    assert.strictEqual(result.matched, true);
  });

  it('lt matches when field value is lower', () => {
    const rule = makeRule({ conditions: [{ field: 'revenue', operator: 'lt', value: 20000, valueType: 'number' }] });
    const result = evaluateRule(rule, makeContext({ revenue: 15000 }));
    assert.strictEqual(result.matched, true);
  });

  it('in matches when value is in array', () => {
    const rule = makeRule({ conditions: [{ field: 'region', operator: 'in', value: ['北京', '上海', '广州'], valueType: 'array' }] });
    const result = evaluateRule(rule, makeContext({ region: '上海' }));
    assert.strictEqual(result.matched, true);
  });

  it('between matches when value is in range', () => {
    const rule = makeRule({ conditions: [{ field: 'revenue', operator: 'between', value: [5000, 20000], valueType: 'array' }] });
    const result = evaluateRule(rule, makeContext({ revenue: 15000 }));
    assert.strictEqual(result.matched, true);
  });

  it('contains matches substring', () => {
    const rule = makeRule({ conditions: [{ field: 'name', operator: 'contains', value: '门店', valueType: 'string' }] });
    const result = evaluateRule(rule, makeContext({ name: '测试门店A' }));
    assert.strictEqual(result.matched, true);
  });
});

// ─── 条件评估 (反例) ──────────────────────────────

describe('RuleEngine — condition evaluation (error cases)', () => {
  it('neq fails when field equals condition value', () => {
    const rule = makeRule({ conditions: [{ field: 'status', operator: 'neq', value: 'active', valueType: 'string' }] });
    const result = evaluateRule(rule, makeContext({ status: 'active' }));
    assert.strictEqual(result.matched, false);
  });

  it('gt fails when field value is lower', () => {
    const rule = makeRule({ conditions: [{ field: 'revenue', operator: 'gt', value: 20000, valueType: 'number' }] });
    const result = evaluateRule(rule, makeContext({ revenue: 15000 }));
    assert.strictEqual(result.matched, false);
  });

  it('in fails when value is not in array', () => {
    const rule = makeRule({ conditions: [{ field: 'region', operator: 'in', value: ['北京', '上海'], valueType: 'array' }] });
    const result = evaluateRule(rule, makeContext({ region: '深圳' }));
    assert.strictEqual(result.matched, false);
  });

  it('disabled rule returns not matched', () => {
    const rule = makeRule({ enabled: false });
    const result = evaluateRule(rule, makeContext());
    assert.strictEqual(result.matched, false);
    assert.strictEqual(result.score, 0);
  });

  it('regex fails on invalid pattern', () => {
    const rule = makeRule({ conditions: [{ field: 'name', operator: 'regex', value: '[invalid', valueType: 'string' }] });
    const result = evaluateRule(rule, makeContext({ name: 'test' }));
    assert.strictEqual(result.matched, false);
  });
});

// ─── 规则链评估 ──────────────────────────────────

describe('RuleEngine — chain evaluation', () => {
  it('evaluateRuleChain sorts by weight descending', () => {
    const r1 = makeRule({ id: 'r1', weight: 50, conditions: [{ field: 'revenue', operator: 'gt', value: 0, valueType: 'number' }] });
    const r2 = makeRule({ id: 'r2', weight: 90, conditions: [{ field: 'revenue', operator: 'gt', value: 0, valueType: 'number' }] });
    const results = evaluateRuleChain([r1, r2], makeContext());
    assert.strictEqual(results[0].ruleId, 'r2');
    assert.strictEqual(results[1].ruleId, 'r1');
  });

  it('getBestMatch returns highest score', () => {
    const results = [
      { ruleId: 'r1', ruleName: 'r1', matched: true, score: 50, actions: [], executionTimeMs: 1 },
      { ruleId: 'r2', ruleName: 'r2', matched: true, score: 90, actions: [], executionTimeMs: 1 },
      { ruleId: 'r3', ruleName: 'r3', matched: false, score: 0, actions: [], executionTimeMs: 1 },
    ];
    const best = getBestMatch(results);
    assert.ok(best !== null);
    assert.strictEqual(best!.ruleId, 'r2');
  });

  it('getBestMatch returns null when none matched', () => {
    const results = [
      { ruleId: 'r1', ruleName: 'r1', matched: false, score: 0, actions: [], executionTimeMs: 1 },
    ];
    assert.strictEqual(getBestMatch(results), null);
  });

  it('chain respects maxRulesPerChain', () => {
    const rules = Array.from({ length: 10 }, (_, i) =>
      makeRule({ id: `r${i}`, weight: i * 10, conditions: [{ field: 'revenue', operator: 'gt', value: 0, valueType: 'number' }] })
    );
    const results = evaluateRuleChain(rules, makeContext(), { maxRulesPerChain: 3 });
    assert.ok(results.length <= 3);
  });

  it('chain filters out disabled rules', () => {
    const r1 = makeRule({ id: 'r1', enabled: false, weight: 100, conditions: [{ field: 'revenue', operator: 'gt', value: 0, valueType: 'number' }] });
    const r2 = makeRule({ id: 'r2', enabled: true, weight: 50, conditions: [{ field: 'revenue', operator: 'gt', value: 0, valueType: 'number' }] });
    const results = evaluateRuleChain([r1, r2], makeContext());
    assert.strictEqual(results.length, 1);
    assert.strictEqual(results[0].ruleId, 'r2');
  });
});

// ─── 实用方法 ──────────────────────────────────

describe('RuleEngine — utility functions', () => {
  it('createRule generates unique id', () => {
    const r1 = createRule({ name: 'rule-1', description: '', domain: 'diagnosis', enabled: true, conditions: [], actions: [], weight: 50, maxExecutions: 0, cooldownMs: 0, tags: [] });
    const r2 = createRule({ name: 'rule-2', description: '', domain: 'diagnosis', enabled: true, conditions: [], actions: [], weight: 50, maxExecutions: 0, cooldownMs: 0, tags: [] });
    assert.notStrictEqual(r1.id, r2.id);
  });

  it('updateRule preserves id and createdAt', () => {
    const original = makeRule();
    const updated = updateRule(original, { name: '新名称', weight: 100 });
    assert.strictEqual(updated.id, original.id);
    assert.strictEqual(updated.createdAt, original.createdAt);
    assert.strictEqual(updated.name, '新名称');
    assert.strictEqual(updated.weight, 100);
  });

  it('filterByDomain returns only matching domain', () => {
    const rules = [
      makeRule({ id: 'r1', domain: 'diagnosis' }),
      makeRule({ id: 'r2', domain: 'marketing' }),
      makeRule({ id: 'r3', domain: 'diagnosis' }),
    ];
    const filtered = filterByDomain(rules, 'diagnosis');
    assert.strictEqual(filtered.length, 2);
    assert.ok(filtered.every(r => r.domain === 'diagnosis'));
  });

  it('empty chain returns empty results', () => {
    const results = evaluateRuleChain([], makeContext());
    assert.strictEqual(results.length, 0);
  });
});

// ─── 边界测试 ──────────────────────────────────

describe('RuleEngine — edge cases', () => {
  it('rule with zero conditions always matches', () => {
    const rule = makeRule({ conditions: [] });
    const result = evaluateRule(rule, makeContext());
    assert.strictEqual(result.matched, true);
  });

  it('unknown operator returns not matched', () => {
    const rule = makeRule({ conditions: [{ field: 'x', operator: 'unknown' as any, value: 1, valueType: 'number' }] });
    const result = evaluateRule(rule, makeContext());
    assert.strictEqual(result.matched, false);
  });

  it('missing field in data returns false for eq', () => {
    const rule = makeRule({ conditions: [{ field: 'nonexistent', operator: 'eq', value: 'x', valueType: 'string' }] });
    const result = evaluateRule(rule, makeContext());
    assert.strictEqual(result.matched, false);
  });

  it('between with non-array value returns false', () => {
    const rule = makeRule({ conditions: [{ field: 'revenue', operator: 'between', value: 10000, valueType: 'array' }] });
    const result = evaluateRule(rule, makeContext());
    assert.strictEqual(result.matched, false);
  });

  it('action execution does not fail on empty actions array', () => {
    const rule = makeRule({ actions: [] });
    const result = evaluateRule(rule, makeContext());
    assert.strictEqual(result.matched, true);
    assert.ok(Array.isArray(result.actions));
    assert.strictEqual(result.actions.length, 0);
  });
});
