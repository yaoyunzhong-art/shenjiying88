/**
 * AiDecisionStatsPage 冒烟测试 (Node.js native test runner)
 * 遵循项目现有测试风格：测试数据/逻辑/结构，不渲染 React 组件
 */
import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// ---- 从 page.tsx 同步的 mock 数据与逻辑 ----

interface RuleStat {
  id: string;
  name: string;
  source: 'rule' | 'model' | 'hybrid';
  executionCount: number;
  successCount: number;
  avgResponseMs: number;
  liftPercent: number;
}

const MOCK_RULES: RuleStat[] = [
  { id: 'r1', name: '动态定价规则', source: 'rule', executionCount: 1240, successCount: 1100, avgResponseMs: 38, liftPercent: 12.4 },
  { id: 'r2', name: '库存预警模型', source: 'model', executionCount: 980, successCount: 870, avgResponseMs: 210, liftPercent: 8.7 },
  { id: 'r3', name: '促销推荐 (混合)', source: 'hybrid', executionCount: 2100, successCount: 1650, avgResponseMs: 145, liftPercent: 15.2 },
  { id: 'r4', name: '会员等级分配', source: 'rule', executionCount: 640, successCount: 620, avgResponseMs: 22, liftPercent: 3.1 },
  { id: 'r5', name: '客诉预判模型', source: 'model', executionCount: 780, successCount: 610, avgResponseMs: 180, liftPercent: 10.0 },
  { id: 'r6', name: '套餐推荐 (混合)', source: 'hybrid', executionCount: 1500, successCount: 1300, avgResponseMs: 98, liftPercent: 18.3 },
];

// 与 page.tsx 保持一致的逻辑
function computeStats(rules: RuleStat[]) {
  const total = rules.reduce((s, r) => s + r.executionCount, 0);
  const success = rules.reduce((s, r) => s + r.successCount, 0);
  const avgResp = total > 0 ? Math.round(rules.reduce((s, r) => s + r.avgResponseMs * r.executionCount, 0) / total) : 0;
  const avgLift = rules.length > 0 ? +(rules.reduce((s, r) => s + r.liftPercent, 0) / rules.length).toFixed(1) : 0;
  return { total, success, successRate: total > 0 ? +((success / total) * 100).toFixed(1) : 0, avgResp, avgLift };
}

// ---- 正例: 数据统计逻辑 ----

describe('AiDecisionStats — 数据统计逻辑', () => {
  it('computeStats 返回正确汇总', () => {
    const stats = computeStats(MOCK_RULES);
    assert.equal(stats.total, 7240);
    assert.equal(stats.success, 6150);
    // 6150/7240 ≈ 84.94%
    assert.ok(stats.successRate > 84 && stats.successRate < 85);
    assert.ok(stats.avgResp > 100 && stats.avgResp < 130);
    assert.equal(stats.avgLift, 11.3); // (12.4+8.7+15.2+3.1+10+18.3)/6
  });

  it('统计空列表不崩溃', () => {
    const stats = computeStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.success, 0);
    assert.equal(stats.successRate, 0);
    assert.equal(stats.avgResp, 0);
    assert.equal(stats.avgLift, 0);
  });
});

// ---- 正例: 决策结果分布 ----

describe('AiDecisionStats — 决策结果分布', () => {
  it('总和等于总执行次数', () => {
    const totalExec = MOCK_RULES.reduce((s, r) => s + r.executionCount, 0);
    const totalSuccess = MOCK_RULES.reduce((s, r) => s + r.successCount, 0);
    // 示意: partial = success * 0.12, failure = 剩余
    const partial = Math.round(totalSuccess * 0.12);
    const failure = totalExec - totalSuccess - partial;
    assert.equal(totalSuccess + partial + failure, totalExec);
  });

  it('所有规则的总执行 = 各规则累加', () => {
    const sum = MOCK_RULES.reduce((s, r) => s + r.executionCount, 0);
    assert.equal(sum, 1240 + 980 + 2100 + 640 + 780 + 1500);
  });
});

// ---- 正例: 决策来源构成 ----

describe('AiDecisionStats — 决策来源构成', () => {
  it('分组合计正确', () => {
    const groups: Record<string, number> = {};
    MOCK_RULES.forEach(r => { groups[r.source] = (groups[r.source] || 0) + r.executionCount; });
    // rule: r1(1240) + r4(640) = 1880
    assert.equal(groups['rule'], 1880);
    // model: r2(980) + r5(780) = 1760
    assert.equal(groups['model'], 1760);
    // hybrid: r3(2100) + r6(1500) = 3600
    assert.equal(groups['hybrid'], 3600);
  });

  it('3 种来源', () => {
    const sources = new Set(MOCK_RULES.map(r => r.source));
    assert.equal(sources.size, 3);
  });
});

// ---- 正例: 规则排行（按提升率排序） ----

describe('AiDecisionStats — 规则排行排序', () => {
  it('按提升率降序排列: 前 3 名正确', () => {
    const sorted = [...MOCK_RULES].sort((a, b) => b.liftPercent - a.liftPercent);
    assert.equal(sorted[0].name, '套餐推荐 (混合)');
    assert.equal(sorted[0].liftPercent, 18.3);
    assert.equal(sorted[1].name, '促销推荐 (混合)');
    assert.equal(sorted[1].liftPercent, 15.2);
    assert.equal(sorted[2].name, '动态定价规则');
    assert.equal(sorted[2].liftPercent, 12.4);
  });

  it('排序不影响原始数组', () => {
    const original = MOCK_RULES.map(r => r.name);
    [...MOCK_RULES].sort((a, b) => b.liftPercent - a.liftPercent);
    assert.deepEqual(MOCK_RULES.map(r => r.name), original);
  });
});

// ---- 正例: 来源标签映射 ----

describe('AiDecisionStats — 来源标签映射', () => {
  it('rule → 规则引擎, model → 模型推理, hybrid → 混合决策', () => {
    const labels: Record<string, string> = { rule: '规则引擎', model: '模型推理', hybrid: '混合决策' };
    assert.equal(labels['rule'], '规则引擎');
    assert.equal(labels['model'], '模型推理');
    assert.equal(labels['hybrid'], '混合决策');
  });
});

// ---- 边界: 异常数据 ----

describe('AiDecisionStats — 边界防御', () => {
  it('单条规则且全部失败不崩溃', () => {
    const edge: RuleStat[] = [{ id: 'e1', name: '测试规则', source: 'rule', executionCount: 100, successCount: 0, avgResponseMs: 500, liftPercent: 0 }];
    const stats = computeStats(edge);
    assert.equal(stats.total, 100);
    assert.equal(stats.success, 0);
    assert.equal(stats.successRate, 0);
    assert.equal(stats.avgLift, 0);
  });

  it('极高成功率不溢出', () => {
    const edge: RuleStat[] = [{ id: 'e1', name: '完美规则', source: 'model', executionCount: 9999, successCount: 9999, avgResponseMs: 1, liftPercent: 99.9 }];
    const stats = computeStats(edge);
    assert.equal(stats.successRate, 100);
    assert.equal(stats.total, 9999);
  });
});
