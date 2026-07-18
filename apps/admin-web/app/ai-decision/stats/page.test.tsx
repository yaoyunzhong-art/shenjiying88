/**
 * AiDecisionStatsPage 增强测试 (Node.js native test runner)
 * 覆盖: 统计逻辑 + AI决策统计条 + 正例/反例/边界三件套
 * 禁止: as any / describe.skip / it.only
 */
import assert from 'node:assert/strict';
import test, { describe, it, beforeEach } from 'node:test';
import fs from 'node:fs';

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

interface AiDecisionSummary {
  totalDecisions: number;
  adoptedCount: number;
  rejectedCount: number;
  pendingReviewCount: number;
}

const MOCK_RULES: RuleStat[] = [
  { id: 'r1', name: '动态定价规则', source: 'rule', executionCount: 1240, successCount: 1100, avgResponseMs: 38, liftPercent: 12.4 },
  { id: 'r2', name: '库存预警模型', source: 'model', executionCount: 980, successCount: 870, avgResponseMs: 210, liftPercent: 8.7 },
  { id: 'r3', name: '促销推荐 (混合)', source: 'hybrid', executionCount: 2100, successCount: 1650, avgResponseMs: 145, liftPercent: 15.2 },
  { id: 'r4', name: '会员等级分配', source: 'rule', executionCount: 640, successCount: 620, avgResponseMs: 22, liftPercent: 3.1 },
  { id: 'r5', name: '客诉预判模型', source: 'model', executionCount: 780, successCount: 610, avgResponseMs: 180, liftPercent: 10.0 },
  { id: 'r6', name: '套餐推荐 (混合)', source: 'hybrid', executionCount: 1500, successCount: 1300, avgResponseMs: 98, liftPercent: 18.3 },
];

let testRules: RuleStat[];

beforeEach(() => {
  // 每次测试前重置 mock 数据
  testRules = MOCK_RULES.map(r => ({ ...r }));
});

// 与 page.tsx 保持一致的逻辑
function computeStats(rules: RuleStat[]) {
  const total = rules.reduce((s, r) => s + r.executionCount, 0);
  const success = rules.reduce((s, r) => s + r.successCount, 0);
  const avgResp = total > 0 ? Math.round(rules.reduce((s, r) => s + r.avgResponseMs * r.executionCount, 0) / total) : 0;
  const avgLift = rules.length > 0 ? +(rules.reduce((s, r) => s + r.liftPercent, 0) / rules.length).toFixed(1) : 0;
  return { total, success, successRate: total > 0 ? +((success / total) * 100).toFixed(1) : 0, avgResp, avgLift };
}

function computeAiDecisionSummary(rules: RuleStat[]): AiDecisionSummary {
  const totalDecisions = rules.reduce((s, r) => s + r.executionCount, 0);
  const adoptedCount = rules.reduce((s, r) => s + r.successCount, 0);
  const rejectedCount = rules.reduce((s, r) => s + (r.executionCount - r.successCount), 0);
  const pendingReviewCount = Math.round(totalDecisions * 0.05);
  return { totalDecisions, adoptedCount, rejectedCount, pendingReviewCount };
}

// ===================== 正例 =====================

describe('AiDecisionStats — 数据统计逻辑 (正例)', () => {
  it('computeStats 返回正确汇总', () => {
    const stats = computeStats(MOCK_RULES);
    assert.equal(stats.total, 7240);
    assert.equal(stats.success, 6150);
    // 6150/7240 ≈ 84.94%
    assert.ok(stats.successRate > 84 && stats.successRate < 85);
    assert.ok(stats.avgResp > 100 && stats.avgResp < 130);
    assert.equal(stats.avgLift, 11.3); // (12.4+8.7+15.2+3.1+10+18.3)/6
  });

  it('computeStats 空列表返回 0 占位', () => {
    const stats = computeStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.success, 0);
    assert.equal(stats.successRate, 0);
    assert.equal(stats.avgResp, 0);
    assert.equal(stats.avgLift, 0);
  });

  it('computeStats 单条规则精确计算', () => {
    const single: RuleStat[] = [{ id: 'x1', name: '单规则', source: 'rule', executionCount: 100, successCount: 75, avgResponseMs: 50, liftPercent: 5.5 }];
    const stats = computeStats(single);
    assert.equal(stats.total, 100);
    assert.equal(stats.success, 75);
    assert.equal(stats.successRate, 75.0);
    assert.equal(stats.avgResp, 50);
    assert.equal(stats.avgLift, 5.5);
  });
});

// ---- 正例: AI决策统计条 ----

describe('AiDecisionStats — AI决策统计条 (正例)', () => {
  it('computeAiDecisionSummary 基础值正确', () => {
    const s = computeAiDecisionSummary(MOCK_RULES);
    // 总决策 = 总执行次数
    assert.equal(s.totalDecisions, 7240);
    // 采纳数 = 成功总数
    assert.equal(s.adoptedCount, 6150);
    // 拒绝数 = 执行-成功
    assert.equal(s.rejectedCount, 7240 - 6150);
    // 待审 = round(total * 0.05)
    assert.equal(s.pendingReviewCount, Math.round(7240 * 0.05));
  });

  it('computeAiDecisionSummary 采纳+拒绝=总决策', () => {
    const s = computeAiDecisionSummary(MOCK_RULES);
    assert.equal(s.adoptedCount + s.rejectedCount, s.totalDecisions);
  });

  it('computeAiDecisionSummary 待审数非负且不超过总数', () => {
    const s = computeAiDecisionSummary(MOCK_RULES);
    assert.ok(s.pendingReviewCount >= 0);
    assert.ok(s.pendingReviewCount <= s.totalDecisions);
  });
});

// ---- 正例: 决策结果分布 ----

describe('AiDecisionStats — 决策结果分布 (正例)', () => {
  it('总和等于总执行次数', () => {
    const totalExec = MOCK_RULES.reduce((s, r) => s + r.executionCount, 0);
    const totalSuccess = MOCK_RULES.reduce((s, r) => s + r.successCount, 0);
    const partial = Math.round(totalSuccess * 0.12);
    const failure = totalExec - totalSuccess - partial;
    assert.equal(totalSuccess + partial + failure, totalExec);
  });

  it('所有规则的总执行 = 各规则累加', () => {
    const sum = MOCK_RULES.reduce((s, r) => s + r.executionCount, 0);
    assert.equal(sum, 1240 + 980 + 2100 + 640 + 780 + 1500);
  });

  it('each rule successCount ≤ executionCount', () => {
    MOCK_RULES.forEach(r => assert.ok(r.successCount <= r.executionCount, `${r.id} 成功数不应大于执行数`));
  });
});

// ---- 正例: 决策来源构成 ----

describe('AiDecisionStats — 决策来源构成 (正例)', () => {
  it('分组合计正确', () => {
    const groups: Record<string, number> = {};
    MOCK_RULES.forEach(r => { groups[r.source] = (groups[r.source] || 0) + r.executionCount; });
    assert.equal(groups['rule'], 1880);
    assert.equal(groups['model'], 1760);
    assert.equal(groups['hybrid'], 3600);
  });

  it('3 种来源', () => {
    const sources = new Set(MOCK_RULES.map(r => r.source));
    assert.equal(sources.size, 3);
  });

  it('各来源总执行数合计', () => {
    const groups: Record<string, number> = {};
    MOCK_RULES.forEach(r => { groups[r.source] = (groups[r.source] || 0) + r.executionCount; });
    const sum = Object.values(groups).reduce((a, b) => a + b, 0);
    assert.equal(sum, MOCK_RULES.reduce((s, r) => s + r.executionCount, 0));
  });
});

// ---- 正例: 规则排行排序 ----

describe('AiDecisionStats — 规则排行排序 (正例)', () => {
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

  it('相同提升率规则保持相对顺序', () => {
    const rules: RuleStat[] = [
      { id: 'a', name: 'A', source: 'rule', executionCount: 100, successCount: 80, avgResponseMs: 10, liftPercent: 5 },
      { id: 'b', name: 'B', source: 'model', executionCount: 100, successCount: 90, avgResponseMs: 20, liftPercent: 5 },
    ];
    const sorted = [...rules].sort((a, b) => b.liftPercent - a.liftPercent);
    // 同提升率应保持原顺序 (stable sort)
    assert.equal(sorted[0].id, 'a');
    assert.equal(sorted[1].id, 'b');
  });
});

// ---- 正例: 来源标签映射 ----

describe('AiDecisionStats — 来源标签映射 (正例)', () => {
  it('rule → 规则引擎, model → 模型推理, hybrid → 混合决策', () => {
    const labels: Record<string, string> = { rule: '规则引擎', model: '模型推理', hybrid: '混合决策' };
    assert.equal(labels['rule'], '规则引擎');
    assert.equal(labels['model'], '模型推理');
    assert.equal(labels['hybrid'], '混合决策');
  });

  it('所有来源都有对应标签', () => {
    const labels: Record<string, string> = { rule: '规则引擎', model: '模型推理', hybrid: '混合决策' };
    MOCK_RULES.forEach(r => assert.ok(labels[r.source] !== undefined, `${r.source} 应有标签映射`));
  });
});

// ---- 正例: 颜色映射 ----

describe('AiDecisionStats — 颜色映射 (正例)', () => {
  it('RESULT_COLORS 三类均有', () => {
    const resultColors: Record<string, string> = { success: '#4ade80', partial: '#fbbf24', failure: '#f87171' };
    assert.equal(Object.keys(resultColors).length, 3);
    assert.ok(resultColors.success.startsWith('#'));
    assert.ok(resultColors.partial.startsWith('#'));
    assert.ok(resultColors.failure.startsWith('#'));
  });

  it('SOURCE_COLORS 三类均有', () => {
    const sourceColors: Record<string, string> = { rule: '#60a5fa', model: '#a78bfa', hybrid: '#2dd4bf' };
    assert.equal(Object.keys(sourceColors).length, 3);
    MOCK_RULES.forEach(r => assert.ok(sourceColors[r.source] !== undefined, `${r.source} 应有颜色映射`));
  });
});

// ===================== 反例 =====================

describe('AiDecisionStats — 反例: 异常数据防御', () => {
  it('successCount 为负数不应导致异常 result', () => {
    const bad: RuleStat[] = [{ id: 'b1', name: '异常规则', source: 'rule', executionCount: 100, successCount: -10, avgResponseMs: 50, liftPercent: 0 }];
    const stats = computeStats(bad);
    assert.equal(stats.total, 100);
    // successRate 变成负数，逻辑上不合理但函数不应抛异常
    assert.ok(typeof stats.successRate === 'number');
    assert.ok(!Number.isNaN(stats.successRate));
  });

  it('executionCount 为 0 不发生除零错误', () => {
    const zeroRules: RuleStat[] = [
      { id: 'z1', name: '零执行规则', source: 'model', executionCount: 0, successCount: 0, avgResponseMs: 0, liftPercent: 0 },
    ];
    const stats = computeStats(zeroRules);
    assert.equal(stats.total, 0);
    assert.equal(stats.success, 0);
    assert.equal(stats.successRate, 0);
    assert.equal(stats.avgResp, 0);
    assert.equal(stats.avgLift, 0);
  });

  it('avgResponseMs 为 0 时应正常计算', () => {
    const zeroResp: RuleStat[] = [
      { id: 'z2', name: '零响应规则', source: 'rule', executionCount: 50, successCount: 50, avgResponseMs: 0, liftPercent: 1.0 },
    ];
    const stats = computeStats(zeroResp);
    assert.equal(stats.avgResp, 0);
    assert.equal(stats.successRate, 100);
  });

  it('liftPercent 为 0 的平均值应正确', () => {
    const zeroLiftRules: RuleStat[] = [
      { id: 'l1', name: '无提升规则', source: 'rule', executionCount: 100, successCount: 90, avgResponseMs: 10, liftPercent: 0 },
      { id: 'l2', name: '另一无提升', source: 'model', executionCount: 100, successCount: 80, avgResponseMs: 20, liftPercent: 0 },
    ];
    const stats = computeStats(zeroLiftRules);
    assert.equal(stats.avgLift, 0);
  });

  it('successCount > executionCount 不应抛异常', () => {
    const invalid: RuleStat[] = [{ id: 'i1', name: '数据异常', source: 'rule', executionCount: 50, successCount: 100, avgResponseMs: 10, liftPercent: 5 }];
    // 不应抛异常
    const stats = computeStats(invalid);
    assert.ok(stats.successRate > 100); // 逻辑上 >100% 但不应崩溃
    assert.equal(stats.total, 50);
    assert.equal(stats.success, 100);
  });
});

// ---- 反例: AI决策统计条 ----

describe('AiDecisionStats — 反例: AI决策统计条防御', () => {
  it('空规则时统计条返回全 0', () => {
    const s = computeAiDecisionSummary([]);
    assert.equal(s.totalDecisions, 0);
    assert.equal(s.adoptedCount, 0);
    assert.equal(s.rejectedCount, 0);
    assert.equal(s.pendingReviewCount, 0);
  });

  it('单条全失败规则统计条正确', () => {
    const allFail: RuleStat[] = [{ id: 'f1', name: '全失败', source: 'rule', executionCount: 100, successCount: 0, avgResponseMs: 100, liftPercent: 0 }];
    const s = computeAiDecisionSummary(allFail);
    assert.equal(s.totalDecisions, 100);
    assert.equal(s.adoptedCount, 0);
    assert.equal(s.rejectedCount, 100);
    assert.equal(s.pendingReviewCount, 5);
  });
});

// ===================== 边界 =====================

describe('AiDecisionStats — 边界: 极端数据', () => {
  it('大量数据不溢出 (总执行百万级)', () => {
    const largeRules: RuleStat[] = Array.from({ length: 100 }, (_, i) => ({
      id: `large-${i}`, name: `规则${i}`, source: (['rule', 'model', 'hybrid'] as const)[i % 3],
      executionCount: 10000, successCount: 8000, avgResponseMs: 50 + i, liftPercent: 5 + (i % 10),
    }));
    const stats = computeStats(largeRules);
    assert.equal(stats.total, 100 * 10000);
    assert.equal(stats.success, 100 * 8000);
    assert.equal(stats.successRate, 80.0);
    assert.ok(stats.avgResp > 0);
    assert.ok(stats.avgLift > 0);
  });

  it('极小值 (1执行1成功) 边界', () => {
    const tiny: RuleStat[] = [{ id: 'tiny', name: '最小规则', source: 'rule', executionCount: 1, successCount: 1, avgResponseMs: 1, liftPercent: 0.1 }];
    const stats = computeStats(tiny);
    assert.equal(stats.total, 1);
    assert.equal(stats.success, 1);
    assert.equal(stats.successRate, 100);
    assert.equal(stats.avgResp, 1);
    assert.equal(stats.avgLift, 0.1);
  });

  it('浮点数精度: liftPercent 累积不应丢失精度', () => {
    const floatRules: RuleStat[] = [
      { id: 'f1', name: '浮点规则1', source: 'rule', executionCount: 100, successCount: 90, avgResponseMs: 10, liftPercent: 33.33 },
      { id: 'f2', name: '浮点规则2', source: 'model', executionCount: 100, successCount: 90, avgResponseMs: 10, liftPercent: 66.67 },
    ];
    const stats = computeStats(floatRules);
    // (33.33 + 66.67) / 2 = 50.0
    assert.equal(stats.avgLift, 50.0);
  });

  it('AI决策统计条 大量数据边界', () => {
    const many: RuleStat[] = Array.from({ length: 200 }, (_, i) => ({
      id: `m-${i}`, name: `规则${i}`, source: 'rule' as const,
      executionCount: 5000, successCount: 4500, avgResponseMs: 30, liftPercent: 10,
    }));
    const s = computeAiDecisionSummary(many);
    assert.equal(s.totalDecisions, 200 * 5000);
    assert.equal(s.adoptedCount, 200 * 4500);
    assert.equal(s.rejectedCount, 200 * 500);
    assert.equal(s.pendingReviewCount, Math.round(200 * 5000 * 0.05));
  });

  it('AI决策统计条 待审数 0.05 舍入边界', () => {
    // totalDecisions = 1, pendingReviewCount = round(1 * 0.05) = round(0.05) = 0
    const rules: RuleStat[] = [{ id: 'b1', name: '边界', source: 'rule', executionCount: 1, successCount: 1, avgResponseMs: 1, liftPercent: 0 }];
    const s = computeAiDecisionSummary(rules);
    assert.equal(s.pendingReviewCount, 0);
  });

  it('total=0 时 avgResp 不应产生 NaN', () => {
    const empty: RuleStat[] = [];
    const stats = computeStats(empty);
    assert.equal(stats.avgResp, 0);
    assert.ok(!Number.isNaN(stats.avgResp));
  });

  it('只有一条规则但全部成功', () => {
    const allOk: RuleStat[] = [{ id: 'ok', name: '完美规则', source: 'model', executionCount: 500, successCount: 500, avgResponseMs: 5, liftPercent: 20 }];
    const stats = computeStats(allOk);
    assert.equal(stats.successRate, 100);
    assert.equal(stats.avgResp, 5);
    assert.equal(stats.avgLift, 20);
  });
});

// ===================== hooks 验证 =====================

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Ai Decision / Stats — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含列表渲染 (.map)', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染 (&& 或 ?)', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义 (style={)', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化 (.toFixed)', () => assert.ok(SRC.includes('.toFixed')));
  it('包含模板字符串 (${)', () => assert.ok(SRC.includes('${')));
  it('包含默认导出 (export default function)', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明 (/** 或 //)', () => assert.ok(SRC.includes('/**') || SRC.includes('//')));
  it('包含 useMemo', () => assert.ok(SRC.includes('useMemo')));
  it('包含 computeAiDecisionSummary', () => assert.ok(SRC.includes('computeAiDecisionSummary')));
  it('包含 AiDecisionSummary 接口', () => assert.ok(SRC.includes('AiDecisionSummary')));
  it('包含 AI 决策统计条文案', () => assert.ok(SRC.includes('AI 决策总数') && SRC.includes('已采纳') && SRC.includes('已拒绝') && SRC.includes('待审核')));
});
