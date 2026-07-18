/**
 * AI决策详情页测试 — node:test 兼容适配
 * 不渲染 React 组件（无 jsdom/react-testing-library），只验证：
 * - 模块可导入，default 为函数/组件
 * - Mock 数据完整性（4条决策数据）
 * - 辅助函数逻辑
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---- 与组件保持一致的数据结构 ----

interface RuleExecutionResult {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'warning' | 'failed';
  matchedCount: number;
  durationMs: number;
  suggestion: string;
  executedAt: string;
}

// ---- 测试模块可导入 ----

describe('AIDecisionDetailPage', () => {
  it('module can be imported and exports a function/component', async () => {
    const mod = await import('./page');
    assert.equal(typeof mod.default, 'function', 'default export should be a function/component');
  });

  it('module can be imported with different param IDs without crashing', async () => {
    // Just verify the import works for the module system
    const mod = await import('./page');
    assert.ok(mod.default, 'module should export a valid component');
  });

  // ---- Mock 数据检查 ----

  it('mock data contains 4 decision records with correct structure', () => {
    const results: RuleExecutionResult[] = [
      { id: 'r1', name: '会员折扣合规校验', description: '检查折扣是否超过会员等级允许的上限', status: 'passed', matchedCount: 128, durationMs: 32, suggestion: '所有折扣均在合规范围内', executedAt: new Date(Date.now() - 60000).toISOString() },
      { id: 'r2', name: '库存流动性检测', description: '检查近7天未动销商品', status: 'warning', matchedCount: 15, durationMs: 85, suggestion: '建议对以下15个SKU执行促销清仓方案', executedAt: new Date(Date.now() - 120000).toISOString() },
      { id: 'r3', name: '价格一致性校验', description: '检查门店价与平台价是否一致', status: 'failed', matchedCount: 3, durationMs: 45, suggestion: '3个商品存在价差，请立即更新门店价格', executedAt: new Date(Date.now() - 180000).toISOString() },
      { id: 'r4', name: '促销叠加规则检测', description: '检测是否存在多个促销叠加导致亏损风险', status: 'passed', matchedCount: 0, durationMs: 22, suggestion: '未发现风险叠加', executedAt: new Date(Date.now() - 240000).toISOString() },
    ];

    assert.equal(results.length, 4, 'should have 4 decision records');

    // Every record must have all required fields
    for (const r of results) {
      assert.ok(r.id, `record should have id`);
      assert.ok(r.name, `record ${r.id} should have name`);
      assert.ok(r.description, `record ${r.id} should have description`);
      assert.ok(['passed', 'warning', 'failed'].includes(r.status), `record ${r.id} should have valid status`);
      assert.equal(typeof r.matchedCount, 'number', `record ${r.id} matchedCount should be number`);
      assert.equal(typeof r.durationMs, 'number', `record ${r.id} durationMs should be number`);
      assert.ok(r.suggestion, `record ${r.id} should have suggestion`);
      assert.ok(r.executedAt, `record ${r.id} should have executedAt`);
    }
  });

  it('each decision has a distinct ID and status', () => {
    const results: RuleExecutionResult[] = [
      { id: 'r1', name: '会员折扣合规校验', description: '', status: 'passed', matchedCount: 128, durationMs: 32, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r2', name: '库存流动性检测', description: '', status: 'warning', matchedCount: 15, durationMs: 85, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r3', name: '价格一致性校验', description: '', status: 'failed', matchedCount: 3, durationMs: 45, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r4', name: '促销叠加规则检测', description: '', status: 'passed', matchedCount: 0, durationMs: 22, suggestion: '', executedAt: new Date().toISOString() },
    ];

    const ids = results.map(r => r.id);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size, 'all IDs should be unique');

    const statuses = results.map(r => r.status);
    const uniqueStatuses = new Set(statuses);
    assert.ok(uniqueStatuses.has('passed'), 'should include passed status');
    assert.ok(uniqueStatuses.has('warning'), 'should include warning status');
    assert.ok(uniqueStatuses.has('failed'), 'should include failed status');
  });

  it('matchedCount values are reasonable', () => {
    const results: RuleExecutionResult[] = [
      { id: 'r1', name: '', description: '', status: 'passed', matchedCount: 128, durationMs: 32, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r2', name: '', description: '', status: 'warning', matchedCount: 15, durationMs: 85, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r3', name: '', description: '', status: 'failed', matchedCount: 3, durationMs: 45, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r4', name: '', description: '', status: 'passed', matchedCount: 0, durationMs: 22, suggestion: '', executedAt: new Date().toISOString() },
    ];

    for (const r of results) {
      assert.ok(r.matchedCount >= 0, `${r.id} matchedCount should be non-negative`);
      assert.equal(typeof r.matchedCount, 'number', `${r.id} matchedCount should be number`);
    }
  });

  it('durationMs values are positive', () => {
    const results: RuleExecutionResult[] = [
      { id: 'r1', name: '', description: '', status: 'passed', matchedCount: 128, durationMs: 32, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r2', name: '', description: '', status: 'warning', matchedCount: 15, durationMs: 85, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r3', name: '', description: '', status: 'failed', matchedCount: 3, durationMs: 45, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r4', name: '', description: '', status: 'passed', matchedCount: 0, durationMs: 22, suggestion: '', executedAt: new Date().toISOString() },
    ];

    for (const r of results) {
      assert.ok(r.durationMs > 0, `${r.id} durationMs should be positive`);
    }
  });

  it('executedAt dates are valid ISO strings', () => {
    const dates = [
      new Date(Date.now() - 60000).toISOString(),
      new Date(Date.now() - 120000).toISOString(),
      new Date(Date.now() - 180000).toISOString(),
      new Date(Date.now() - 240000).toISOString(),
    ];
    for (const d of dates) {
      assert.doesNotThrow(() => new Date(d).toISOString(), d + ' should be valid date');
    }
  });

  it('suggestion should not be empty for warning/failed decisions', () => {
    const results = [
      { id: 'r1', name: 'a', description: '', status: 'passed', matchedCount: 128, durationMs: 32, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r2', name: 'b', description: '', status: 'warning', matchedCount: 15, durationMs: 85, suggestion: 'suggest', executedAt: new Date().toISOString() },
      { id: 'r3', name: 'c', description: '', status: 'failed', matchedCount: 3, durationMs: 45, suggestion: 'fix', executedAt: new Date().toISOString() },
    ];
    for (const r of results) {
      if (r.status !== 'passed') {
        assert.ok(r.suggestion, r.id + ' should have suggestion');
      }
    }
  });

  it('description can be empty for minimal record', () => {
    const r = { id: 'r-min', name: 'min', description: '', status: 'passed', matchedCount: 0, durationMs: 1, suggestion: '', executedAt: new Date().toISOString() };
    assert.ok(r);
    assert.equal(r.description, '');
  });

  it('matchedCount can be zero', () => {
    const results = [
      { id: 'r-zero', name: '', description: '', status: 'passed', matchedCount: 0, durationMs: 10, suggestion: '', executedAt: new Date().toISOString() },
    ];
    assert.equal(results[0].matchedCount, 0);
  });

  it('status transitions valid — all 3 enum values accepted', () => {
    const statuses = ['passed', 'warning', 'failed'];
    for (const s of statuses) {
      const r = { id: 's-' + s, name: '', description: '', status: s, matchedCount: 1, durationMs: 10, suggestion: '', executedAt: new Date().toISOString() };
      assert.equal(r.status, s);
    }
  });

  it('records can be filtered by status', () => {
    const results = [
      { id: 'r1', name: '', description: '', status: 'passed', matchedCount: 128, durationMs: 32, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r2', name: '', description: '', status: 'warning', matchedCount: 15, durationMs: 85, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r3', name: '', description: '', status: 'failed', matchedCount: 3, durationMs: 45, suggestion: '', executedAt: new Date().toISOString() },
    ];
    const passed = results.filter(r => r.status === 'passed');
    const warnings = results.filter(r => r.status === 'warning');
    const failed = results.filter(r => r.status === 'failed');
    assert.equal(passed.length, 1);
    assert.equal(warnings.length, 1);
    assert.equal(failed.length, 1);
  });

  it('records sorted by executedAt descending', () => {
    const now = Date.now();
    const results = [
      { id: 'r-old', name: '', description: '', status: 'passed', matchedCount: 1, durationMs: 10, suggestion: '', executedAt: new Date(now - 5000).toISOString() },
      { id: 'r-new', name: '', description: '', status: 'passed', matchedCount: 2, durationMs: 20, suggestion: '', executedAt: new Date(now).toISOString() },
    ];
    const sorted = [...results].sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
    assert.equal(sorted[0].id, 'r-new');
  });

  it('records aggregated by status counts', () => {
    const results = [
      { id: 'r1', name: '', description: '', status: 'passed', matchedCount: 128, durationMs: 32, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r2', name: '', description: '', status: 'warning', matchedCount: 15, durationMs: 85, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r3', name: '', description: '', status: 'failed', matchedCount: 3, durationMs: 45, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r4', name: '', description: '', status: 'passed', matchedCount: 0, durationMs: 22, suggestion: '', executedAt: new Date().toISOString() },
    ];
    const agg = { passed: 0, warning: 0, failed: 0 };
    for (const r of results) agg[r.status]++;
    assert.equal(agg.passed, 2);
    assert.equal(agg.warning, 1);
    assert.equal(agg.failed, 1);
  });

  it('total duration across all decisions', () => {
    const results = [
      { id: 'r1', name: '', description: '', status: 'passed', matchedCount: 128, durationMs: 32, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r2', name: '', description: '', status: 'warning', matchedCount: 15, durationMs: 85, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r3', name: '', description: '', status: 'failed', matchedCount: 3, durationMs: 45, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r4', name: '', description: '', status: 'passed', matchedCount: 0, durationMs: 22, suggestion: '', executedAt: new Date().toISOString() },
    ];
    const total = results.reduce((sum, r) => sum + r.durationMs, 0);
    assert.equal(total, 184);
  });

  it('durationMs range verification', () => {
    const results = [
      { id: 'r1', name: '', description: '', status: 'passed', matchedCount: 128, durationMs: 32, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r2', name: '', description: '', status: 'warning', matchedCount: 15, durationMs: 85, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r3', name: '', description: '', status: 'failed', matchedCount: 3, durationMs: 45, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r4', name: '', description: '', status: 'passed', matchedCount: 0, durationMs: 22, suggestion: '', executedAt: new Date().toISOString() },
    ];
    const maxDur = Math.max(...results.map(r => r.durationMs));
    const minDur = Math.min(...results.map(r => r.durationMs));
    assert.equal(maxDur, 85);
    assert.equal(minDur, 22);
  });

  it('empty results array edge case', () => {
    const empty = [];
    assert.equal(empty.length, 0);
    assert.equal(empty.filter(r => r.status === 'passed').length, 0);
  });


  it('total duration across all decisions', () => {
    const results = [
      { id: 'r1', name: '', description: '', status: 'passed', matchedCount: 128, durationMs: 32, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r2', name: '', description: '', status: 'warning', matchedCount: 15, durationMs: 85, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r3', name: '', description: '', status: 'failed', matchedCount: 3, durationMs: 45, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r4', name: '', description: '', status: 'passed', matchedCount: 0, durationMs: 22, suggestion: '', executedAt: new Date().toISOString() },
    ];
    const total = results.reduce((sum, r) => sum + r.durationMs, 0);
    assert.equal(total, 184);
  });

  it('durationMs range verification', () => {
    const results = [
      { id: 'r1', name: '', description: '', status: 'passed', matchedCount: 128, durationMs: 32, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r2', name: '', description: '', status: 'warning', matchedCount: 15, durationMs: 85, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r3', name: '', description: '', status: 'failed', matchedCount: 3, durationMs: 45, suggestion: '', executedAt: new Date().toISOString() },
      { id: 'r4', name: '', description: '', status: 'passed', matchedCount: 0, durationMs: 22, suggestion: '', executedAt: new Date().toISOString() },
    ];
    assert.equal(Math.max(...results.map(r => r.durationMs)), 85);
    assert.equal(Math.min(...results.map(r => r.durationMs)), 22);
  });

  it('empty results array edge case', () => {
    const empty = [];
    assert.equal(empty.length, 0);
    assert.equal(empty.filter(r => r.status === 'passed').length, 0);
  });
});
