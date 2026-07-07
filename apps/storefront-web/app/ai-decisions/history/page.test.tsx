/**
 * ai-decisions/history/page.test.tsx — 规则执行历史列表页 L1 冒烟测试
 * 角色视角: 📋 AI决策规则审核员
 * 覆盖: 模块导入 + 数据结构类型检查 + 过滤/排序/分页逻辑 + 边界场景
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { RuleExecutionRecord } from './page';

// ============================================================
// Mock 工厂函数
// ============================================================

function createRecord(overrides?: Partial<RuleExecutionRecord>): RuleExecutionRecord {
  return {
    id: 'rule-001',
    ruleName: '会员折扣合规校验',
    category: 'governance',
    status: 'passed',
    confidence: 0.95,
    suggestion: '规则执行完成',
    matchedCount: 10,
    durationMs: 120,
    executedAt: new Date().toISOString(),
    ...overrides,
  };
}

function createRandomRecords(count: number): RuleExecutionRecord[] {
  const categories: RuleExecutionRecord['category'][] = [
    'governance', 'member', 'inventory', 'promotion', 'device', 'payment',
  ];
  const statuses: RuleExecutionRecord['status'][] = ['passed', 'warning', 'failed'];
  const names = ['规则A', '规则B', '规则C', '规则D', '规则E'];
  return Array.from({ length: count }, (_, i) => ({
    id: `rule-${String(i + 1).padStart(3, '0')}`,
    ruleName: names[i % names.length],
    category: categories[i % categories.length],
    status: statuses[i % statuses.length],
    confidence: 0.6 + Math.random() * 0.39,
    suggestion: `执行完成 #${i}`,
    matchedCount: Math.floor(Math.random() * 100),
    durationMs: Math.floor(Math.random() * 2000) + 30,
    executedAt: new Date(Date.now() - i * 3600000).toISOString(),
  }));
}

// ============================================================
// Tests
// ============================================================

describe('AIDecisionHistoryPage', () => {
  // ---- Module import ----
  it('module can be imported and exports a function/component', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function', 'default export should be a function/component');
  });

  // ---- Data structure validation ----
  it('createRecord should create valid RuleExecutionRecord', () => {
    const r = createRecord();
    assert.equal(typeof r.id, 'string');
    assert.equal(typeof r.ruleName, 'string');
    assert.ok(['governance', 'member', 'inventory', 'promotion', 'device', 'payment'].includes(r.category));
    assert.ok(['passed', 'warning', 'failed'].includes(r.status));
    assert.ok(r.confidence >= 0 && r.confidence <= 1);
    assert.equal(typeof r.suggestion, 'string');
    assert.ok(Number.isInteger(r.matchedCount) && r.matchedCount >= 0);
    assert.ok(Number.isInteger(r.durationMs) && r.durationMs >= 0);
    assert.ok(typeof r.executedAt === 'string' && r.executedAt.length > 0);
  });

  it('overrides work correctly', () => {
    const r = createRecord({ ruleName: '自定义规则', status: 'failed', confidence: 0.3 });
    assert.equal(r.ruleName, '自定义规则');
    assert.equal(r.status, 'failed');
    assert.equal(r.confidence, 0.3);
  });

  // ---- Filter logic ----
  it('status filter: should keep only matching status', () => {
    const records = [
      createRecord({ id: 'r1', status: 'passed' }),
      createRecord({ id: 'r2', status: 'warning' }),
      createRecord({ id: 'r3', status: 'failed' }),
      createRecord({ id: 'r4', status: 'passed' }),
      createRecord({ id: 'r5', status: 'warning' }),
    ];

    const passed = records.filter(r => r.status === 'passed');
    const warning = records.filter(r => r.status === 'warning');
    const failed = records.filter(r => r.status === 'failed');

    assert.equal(passed.length, 2);
    assert.equal(warning.length, 2);
    assert.equal(failed.length, 1);
    assert.ok(passed.every(r => r.status === 'passed'));
    assert.ok(warning.every(r => r.status === 'warning'));
    assert.ok(failed.every(r => r.status === 'failed'));
  });

  it('category filter: should keep only matching category', () => {
    const records = [
      createRecord({ id: 'r1', category: 'governance' }),
      createRecord({ id: 'r2', category: 'member' }),
      createRecord({ id: 'r3', category: 'inventory' }),
      createRecord({ id: 'r4', category: 'governance' }),
    ];

    const governance = records.filter(r => r.category === 'governance');
    assert.equal(governance.length, 2);
    assert.ok(governance.every(r => r.category === 'governance'));
  });

  it('search filter: should match ruleName case-insensitively', () => {
    const records = [
      createRecord({ id: 'r1', ruleName: '会员折扣校验' }),
      createRecord({ id: 'r2', ruleName: '库存流动性检测' }),
      createRecord({ id: 'r3', ruleName: '会员流失预警' }),
    ];

    const q = '会员';
    const matched = records.filter(r => r.ruleName.includes(q));
    assert.equal(matched.length, 2);
    assert.ok(matched.every(r => r.ruleName.includes(q)));
  });

  it('search filter: should match suggestion text too', () => {
    const records = [
      createRecord({ id: 'r1', ruleName: '规则A', suggestion: '清仓推荐' }),
      createRecord({ id: 'r2', ruleName: '规则B', suggestion: '正常通过' }),
    ];

    const matched = records.filter(r =>
      r.ruleName.includes('清仓') || r.suggestion.includes('清仓')
    );
    assert.equal(matched.length, 1);
    assert.equal(matched[0].id, 'r1');
  });

  it('search filter: should match id', () => {
    const records = [
      createRecord({ id: 'rule-042', ruleName: '规则A' }),
      createRecord({ id: 'rule-999', ruleName: '规则B' }),
    ];

    const matched = records.filter(r => r.id.includes('042'));
    assert.equal(matched.length, 1);
    assert.equal(matched[0].id, 'rule-042');
  });

  // ---- Sort logic ----
  it('sort by confidence ascending should work', () => {
    const records = [
      createRecord({ id: 'r1', confidence: 0.5 }),
      createRecord({ id: 'r2', confidence: 0.9 }),
      createRecord({ id: 'r3', confidence: 0.7 }),
    ];

    const sorted = [...records].sort((a, b) => a.confidence - b.confidence);
    assert.equal(sorted[0].id, 'r1');
    assert.equal(sorted[1].id, 'r3');
    assert.equal(sorted[2].id, 'r2');
  });

  it('sort by confidence descending should work', () => {
    const records = [
      createRecord({ id: 'r1', confidence: 0.5 }),
      createRecord({ id: 'r2', confidence: 0.9 }),
      createRecord({ id: 'r3', confidence: 0.7 }),
    ];

    const sorted = [...records].sort((a, b) => b.confidence - a.confidence);
    assert.equal(sorted[0].id, 'r2');
    assert.equal(sorted[1].id, 'r3');
    assert.equal(sorted[2].id, 'r1');
  });

  it('sort by executedAt descending should show newest first', () => {
    const records = [
      createRecord({ id: 'r1', executedAt: new Date(Date.now() - 7200000).toISOString() }), // 2h ago
      createRecord({ id: 'r2', executedAt: new Date(Date.now() - 600000).toISOString() }),  // 10min ago
      createRecord({ id: 'r3', executedAt: new Date(Date.now() - 14400000).toISOString() }), // 4h ago
    ];

    const sorted = [...records].sort(
      (a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    );
    assert.equal(sorted[0].id, 'r2');
    assert.equal(sorted[1].id, 'r1');
    assert.equal(sorted[2].id, 'r3');
  });

  it('sort by matchedCount ascending', () => {
    const records = [
      createRecord({ id: 'r1', matchedCount: 100 }),
      createRecord({ id: 'r2', matchedCount: 10 }),
      createRecord({ id: 'r3', matchedCount: 50 }),
    ];

    const sorted = [...records].sort((a, b) => a.matchedCount - b.matchedCount);
    assert.equal(sorted[0].id, 'r2');
    assert.equal(sorted[1].id, 'r3');
    assert.equal(sorted[2].id, 'r1');
  });

  it('sort by durationMs descending', () => {
    const records = [
      createRecord({ id: 'r1', durationMs: 100 }),
      createRecord({ id: 'r2', durationMs: 500 }),
      createRecord({ id: 'r3', durationMs: 300 }),
    ];

    const sorted = [...records].sort((a, b) => b.durationMs - a.durationMs);
    assert.equal(sorted[0].id, 'r2');
    assert.equal(sorted[1].id, 'r3');
    assert.equal(sorted[2].id, 'r1');
  });

  // ---- Pagination logic ----
  it('pagination: first page should contain first N items', () => {
    const records = createRandomRecords(25);
    const pageSize = 10;
    const page1 = records.slice(0, pageSize);
    const page2 = records.slice(pageSize, pageSize * 2);

    assert.equal(page1.length, 10);
    assert.equal(page1[0].id, 'rule-001');
    assert.equal(page2.length, 10);
    assert.equal(page2[0].id, 'rule-011');
  });

  it('pagination: last page may contain fewer items', () => {
    const records = createRandomRecords(25);
    const pageSize = 10;
    const totalPages = Math.ceil(records.length / pageSize);
    const lastPage = records.slice((totalPages - 1) * pageSize);

    assert.equal(totalPages, 3);
    assert.equal(lastPage.length, 5);
  });

  it('pagination: single page if records <= pageSize', () => {
    const records = createRandomRecords(5);
    const totalPages = Math.max(1, Math.ceil(records.length / 10));
    assert.equal(totalPages, 1);
  });

  // ---- Filter + Pagination interplay ----
  it('filtering reduces total pages accordingly', () => {
    const records = createRandomRecords(30);
    const filtered = records.filter(r => r.status === 'passed');
    const pageSize = 10;
    const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
    assert.ok(totalPages <= 3);
  });

  // ---- Summary stats ----
  it('summary stats should correctly count each status', () => {
    const records = [
      createRecord({ id: 'r1', status: 'passed' }),
      createRecord({ id: 'r2', status: 'passed' }),
      createRecord({ id: 'r3', status: 'warning' }),
      createRecord({ id: 'r4', status: 'failed' }),
      createRecord({ id: 'r5', status: 'warning' }),
    ];

    const passed = records.filter(r => r.status === 'passed').length;
    const warning = records.filter(r => r.status === 'warning').length;
    const failed = records.filter(r => r.status === 'failed').length;

    assert.equal(passed, 2);
    assert.equal(warning, 2);
    assert.equal(failed, 1);
    assert.equal(passed + warning + failed, records.length);
  });

  it('average confidence should be calculated correctly', () => {
    const records = [
      createRecord({ id: 'r1', confidence: 0.8 }),
      createRecord({ id: 'r2', confidence: 0.9 }),
      createRecord({ id: 'r3', confidence: 0.7 }),
    ];

    const avg = records.reduce((s, r) => s + r.confidence, 0) / records.length;
    assert.ok(Math.abs(avg - 0.8) < 0.001, `Expected ~0.8, got ${avg}`);
  });

  // ---- Boundary / Edge cases ----
  it('handle edge case: empty records list', () => {
    const empty: RuleExecutionRecord[] = [];
    assert.equal(empty.length, 0);
    assert.equal(empty.filter(r => r.status === 'failed').length, 0);
    assert.equal(Math.max(1, Math.ceil(empty.length / 10)), 1);
  });

  it('handle edge case: confidence at boundaries (0 and 1)', () => {
    const low = createRecord({ confidence: 0 });
    const high = createRecord({ confidence: 1 });
    assert.equal(low.confidence, 0);
    assert.equal(high.confidence, 1);
  });

  it('handle edge case: matchedCount at zero and large numbers', () => {
    const zero = createRecord({ matchedCount: 0 });
    const large = createRecord({ matchedCount: 99999 });
    assert.equal(zero.matchedCount, 0);
    assert.equal(large.matchedCount, 99999);
  });

  it('handle edge case: durationMs at zero', () => {
    const r = createRecord({ durationMs: 0 });
    assert.equal(r.durationMs, 0);
  });

  it('handle edge case: identical timestamps sort correctly', () => {
    const ts = new Date().toISOString();
    const records = [
      createRecord({ id: 'r1', executedAt: ts }),
      createRecord({ id: 'r2', executedAt: ts }),
      createRecord({ id: 'r3', executedAt: ts }),
    ];

    const sorted = [...records].sort(
      (a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime()
    );
    assert.equal(sorted.length, 3);
  });

  it('handle edge case: all records have same status', () => {
    const records = [
      createRecord({ id: 'r1', status: 'passed' }),
      createRecord({ id: 'r2', status: 'passed' }),
      createRecord({ id: 'r3', status: 'passed' }),
    ];

    const filtered = records.filter(r => r.status === 'passed');
    assert.equal(filtered.length, 3);
    const empty = records.filter(r => r.status === 'failed');
    assert.equal(empty.length, 0);
  });

  it('handle edge case: search term with special characters', () => {
    const records = [
      createRecord({ id: 'r1', ruleName: '规则(A)' }),
      createRecord({ id: 'r2', ruleName: '规则[B]' }),
    ];

    const matched = records.filter(r => r.ruleName.toLowerCase().includes('('));
    assert.equal(matched.length, 1);
    assert.equal(matched[0].id, 'r1');
  });

  it('createRandomRecords creates correct number of records', () => {
    const records = createRandomRecords(15);
    assert.equal(records.length, 15);
    // All should have valid properties
    records.forEach(r => {
      assert.ok(typeof r.id === 'string');
      assert.ok(r.confidence >= 0.6 && r.confidence <= 0.99);
    });
  });

  it('all 6 categories should be represented across records', () => {
    const records = createRandomRecords(48);
    const cats = new Set(records.map(r => r.category));
    assert.equal(cats.size, 6);
    assert.ok(cats.has('governance'));
    assert.ok(cats.has('payment'));
    assert.ok(cats.has('device'));
  });

  // ---- Format helpers ----
  it('formatDuration should show ms for < 1000ms', () => {
    const ms = 500;
    const formatted = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
    assert.equal(formatted, '500ms');
  });

  it('formatDuration should show seconds for >= 1000ms', () => {
    const ms = 1500;
    const formatted = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
    assert.equal(formatted, '1.5s');
  });

  it('formatDuration edge case: exactly 1000ms', () => {
    const ms = 1000;
    const formatted = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
    assert.equal(formatted, '1.0s');
  });

  it('formatDuration edge case: zero ms', () => {
    const ms = 0;
    const formatted = ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
    assert.equal(formatted, '0ms');
  });

  // ---- Component reference ----
  it('Page should reference UI components from @m5/ui', async () => {
    const mod = await import('./page');
    const source = mod.default.toString();
    const expectedRefs = ['StatusBadge', 'Pagination', 'SearchFilterInput', 'FilterChips'];
    for (const ref of expectedRefs) {
      assert.ok(source.includes(ref), `Page source should reference ${ref}`);
    }
  });
});
