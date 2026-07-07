/**
 * ai-experiments/page.test.tsx — AI实验优化中心 冒烟测试
 * 覆盖: 统计卡片计算 / 实验数据过滤 / 状态筛选 / 空状态 / 边界条件
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ==================== 类型定义（与组件对齐） ====================

type ExperimentStatus = 'running' | 'completed' | 'draft' | 'paused' | 'failed';

interface ExperimentVariant {
  id: string;
  name: string;
  trafficPercent: number;
  conversionRate: number;
  sampleSize: number;
  isWinner: boolean;
  liftPercent: number;
}

interface ExperimentEntry {
  id: string;
  name: string;
  status: ExperimentStatus;
  targetMetric: string;
  startDate: string;
  endDate?: string;
  variants: ExperimentVariant[];
  confidenceLevel: number;
  aiRecommendation?: string;
}

interface OptimizationSuggestion {
  id: string;
  title: string;
  expectedLift: number;
  category: 'pricing' | 'promotion' | 'content' | 'placement' | 'other';
  relatedExperimentId?: string;
  description: string;
}

// ==================== Mock 数据 ====================

const MOCK_EXPERIMENTS: ExperimentEntry[] = [
  {
    id: 'exp-001', name: '首页Banner布局优化', status: 'running', targetMetric: '首页点击转化率',
    startDate: new Date(Date.now() - 7 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 7 * 86400000).toISOString(),
    variants: [ { id: 'v-control', name: '对照组', trafficPercent: 50, conversionRate: 3.2, sampleSize: 12500, isWinner: false, liftPercent: 0 }, { id: 'v-new', name: '实验组', trafficPercent: 50, conversionRate: 4.1, sampleSize: 12480, isWinner: true, liftPercent: 28.1 } ],
    confidenceLevel: 95, aiRecommendation: '建议推广新版',
  },
  {
    id: 'exp-002', name: '推荐算法版本对比', status: 'completed', targetMetric: '推荐位点击率',
    startDate: new Date(Date.now() - 30 * 86400000).toISOString(),
    endDate: new Date(Date.now() - 2 * 86400000).toISOString(),
    variants: [ { id: 'v-cf', name: '协同过滤', trafficPercent: 50, conversionRate: 5.8, sampleSize: 22000, isWinner: false, liftPercent: 0 }, { id: 'v-dl', name: '深度学习', trafficPercent: 50, conversionRate: 7.2, sampleSize: 21980, isWinner: true, liftPercent: 24.1 } ],
    confidenceLevel: 99, aiRecommendation: '深度学习显著优于协同过滤',
  },
  {
    id: 'exp-003', name: '会员日促销弹窗时机', status: 'paused', targetMetric: '弹窗转化率',
    startDate: new Date(Date.now() - 14 * 86400000).toISOString(),
    variants: [ { id: 'v-5s', name: '5秒弹出', trafficPercent: 50, conversionRate: 6.1, sampleSize: 8500, isWinner: false, liftPercent: 0 }, { id: 'v-10s', name: '10秒弹出', trafficPercent: 50, conversionRate: 6.8, sampleSize: 8430, isWinner: true, liftPercent: 11.5 } ],
    confidenceLevel: 90,
  },
  {
    id: 'exp-004', name: 'AI客服对话开场白测试', status: 'draft', targetMetric: '用户回复率',
    startDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    variants: [ { id: 'v-greeting', name: '友好问候式', trafficPercent: 33, conversionRate: 0, sampleSize: 0, isWinner: false, liftPercent: 0 }, { id: 'v-question', name: '引导提问式', trafficPercent: 33, conversionRate: 0, sampleSize: 0, isWinner: false, liftPercent: 0 }, { id: 'v-direct', name: '直接解决式', trafficPercent: 34, conversionRate: 0, sampleSize: 0, isWinner: false, liftPercent: 0 } ],
    confidenceLevel: 95, aiRecommendation: '引导提问式预期效果最佳',
  },
  {
    id: 'exp-005', name: '个性化推荐商品数量', status: 'running', targetMetric: '推荐区点击转化率',
    startDate: new Date(Date.now() - 3 * 86400000).toISOString(),
    endDate: new Date(Date.now() + 11 * 86400000).toISOString(),
    variants: [ { id: 'v-5', name: '推荐5件', trafficPercent: 33, conversionRate: 4.5, sampleSize: 5200, isWinner: false, liftPercent: 0 }, { id: 'v-8', name: '推荐8件', trafficPercent: 33, conversionRate: 5.2, sampleSize: 5180, isWinner: true, liftPercent: 15.6 }, { id: 'v-12', name: '推荐12件', trafficPercent: 34, conversionRate: 4.8, sampleSize: 5210, isWinner: false, liftPercent: 6.7 } ],
    confidenceLevel: 95, aiRecommendation: '推荐8件取得最佳平衡',
  },
];

const MOCK_SUGGESTIONS: OptimizationSuggestion[] = [
  { id: 'sug-001', title: '首页Banner推广全量', expectedLift: 28.1, category: 'placement', relatedExperimentId: 'exp-001', description: '新版Banner已验证有效' },
  { id: 'sug-002', title: '切换深度学习模型', expectedLift: 24.1, category: 'other', relatedExperimentId: 'exp-002', description: '深度学习显著优于协同过滤' },
  { id: 'sug-003', title: '弹窗设置10秒延迟', expectedLift: 11.5, category: 'promotion', relatedExperimentId: 'exp-003', description: '10秒弹出转化率更高' },
];

// ==================== 工具函数 ====================

function filterExperimentsByStatus(
  experiments: ExperimentEntry[],
  status: string,
): ExperimentEntry[] {
  if (status === 'all') return experiments;
  return experiments.filter((exp) => exp.status === status);
}

function computeExperimentStats(experiments: ExperimentEntry[]) {
  const total = experiments.length;
  const running = experiments.filter((e) => e.status === 'running').length;
  const completed = experiments.filter((e) => e.status === 'completed').length;
  const draft = experiments.filter((e) => e.status === 'draft').length;
  const winners = experiments.filter((e) =>
    e.variants.some((v) => v.isWinner),
  ).length;
  return { total, running, completed, draft, winners };
}

function computeSuggestionLift(suggestions: OptimizationSuggestion[]): number {
  return suggestions.reduce((s, sug) => s + sug.expectedLift, 0);
}

// ==================== 测试用例 ====================

test('【统计计算】全部实验的计数器应正确', () => {
  const stats = computeExperimentStats(MOCK_EXPERIMENTS);
  assert.equal(stats.total, 5);
  assert.equal(stats.running, 2); // exp-001, exp-005
  assert.equal(stats.completed, 1); // exp-002
  assert.equal(stats.draft, 1); // exp-004
  assert.equal(stats.winners, 4); // 草稿 exp-004 无优胜方案
});

test('【统计计算】空数组不会导致崩溃', () => {
  const stats = computeExperimentStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.running, 0);
  assert.equal(stats.completed, 0);
  assert.equal(stats.draft, 0);
  assert.equal(stats.winners, 0);
});

test('【统计计算】建议的预期提升合计', () => {
  const lift = computeSuggestionLift(MOCK_SUGGESTIONS);
  assert.equal(lift, 28.1 + 24.1 + 11.5);
});

test('【过滤逻辑】"全部" 应返回完整列表', () => {
  const result = filterExperimentsByStatus(MOCK_EXPERIMENTS, 'all');
  assert.equal(result.length, 5);
});

test('【过滤逻辑】筛选 "running" 只返回运行中的实验', () => {
  const result = filterExperimentsByStatus(MOCK_EXPERIMENTS, 'running');
  assert.equal(result.length, 2);
  result.forEach((exp) => assert.equal(exp.status, 'running'));
});

test('【过滤逻辑】筛选 "completed" 只返回已完成的实验', () => {
  const result = filterExperimentsByStatus(MOCK_EXPERIMENTS, 'completed');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'exp-002');
  assert.equal(result[0].name, '推荐算法版本对比');
});

test('【过滤逻辑】筛选 "draft" 只返回草稿状态的实验', () => {
  const result = filterExperimentsByStatus(MOCK_EXPERIMENTS, 'draft');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'exp-004');
  assert.equal(result[0].name, 'AI客服对话开场白测试');
});

test('【过滤逻辑】筛选 "paused" 只返回已暂停的实验', () => {
  const result = filterExperimentsByStatus(MOCK_EXPERIMENTS, 'paused');
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'exp-003');
});

test('【过滤逻辑】筛选 "failed" 应返回空数组（无失败实验）', () => {
  const result = filterExperimentsByStatus(MOCK_EXPERIMENTS, 'failed');
  assert.equal(result.length, 0);
});

test('【过滤逻辑】不存在的状态应返回空数组', () => {
  const result = filterExperimentsByStatus(MOCK_EXPERIMENTS, 'unknown');
  assert.equal(result.length, 0);
});

test('【实验数据验证】每个实验必须包含有效字段', () => {
  for (const exp of MOCK_EXPERIMENTS) {
    assert.ok(exp.id, `实验 ${exp.name} 缺少 id`);
    assert.ok(exp.name);
    assert.ok(['running', 'completed', 'draft', 'paused', 'failed'].includes(exp.status), `${exp.name} 状态无效: ${exp.status}`);
    assert.ok(Array.isArray(exp.variants), `${exp.name} variants 必须是数组`);
    assert.ok(exp.variants.length >= 2, `${exp.name} 必须有至少两个方案`);
    assert.ok(exp.confidenceLevel >= 0 && exp.confidenceLevel <= 100, `${exp.name} 置信度超出范围`);
  }
});

test('【实验数据验证】variant 字段必须完整', () => {
  for (const exp of MOCK_EXPERIMENTS) {
    for (const v of exp.variants) {
      assert.ok(v.id);
      assert.ok(v.name);
      assert.equal(typeof v.trafficPercent, 'number');
      assert.equal(typeof v.conversionRate, 'number');
      assert.ok(v.sampleSize >= 0);
      assert.equal(typeof v.isWinner, 'boolean');
    }
  }
});

test('【实验数据验证】运行中/完成的实验变体流量分配之和应接近100%', () => {
  for (const exp of MOCK_EXPERIMENTS) {
    if (exp.status === 'draft' || exp.status === 'paused') continue; // 非活跃可跳过
    const totalTraffic = exp.variants.reduce((s, v) => s + v.trafficPercent, 0);
    assert.ok(Math.abs(totalTraffic - 100) <= 1, `${exp.name} 流量分配和 ${totalTraffic} 不等于 100`);
  }
});

test('【边界条件】只有单个变体的极端数据', () => {
  const single: ExperimentEntry[] = [{
    id: 'exp-single', name: '单变体实验', status: 'running', targetMetric: 'test',
    startDate: new Date().toISOString(),
    variants: [{ id: 'v-only', name: '唯一方案', trafficPercent: 100, conversionRate: 3.5, sampleSize: 100, isWinner: true, liftPercent: 0 }],
    confidenceLevel: 90,
  }];
  assert.equal(single[0].variants.length, 1);
  assert.equal(single[0].variants[0].trafficPercent, 100);
});

test('【边界条件】零样本量的草稿实验', () => {
  const draftExp = MOCK_EXPERIMENTS.find((e) =>
    e.variants.some((v) => v.sampleSize === 0),
  );
  assert.ok(draftExp);
  assert.equal(draftExp!.status, 'draft');
});

test('【边界条件】时间范围验证：已完成的实验 endDate 应在过去', () => {
  const completedExp = MOCK_EXPERIMENTS.find((e) => e.status === 'completed');
  assert.ok(completedExp);
  assert.ok(completedExp!.endDate, '已完成实验应有 endDate');
  assert.ok(new Date(completedExp!.endDate!).getTime() < Date.now());
});

test('【边界条件】运行中的实验 endDate 应在将来', () => {
  const runningExps = MOCK_EXPERIMENTS.filter((e) => e.status === 'running');
  runningExps.forEach((exp) => {
    assert.ok(exp.endDate, `运行中 ${exp.name} 应有 endDate`);
    assert.ok(new Date(exp.endDate!).getTime() > Date.now(), `${exp.name} endDate 应在将来`);
  });
});

test('【优胜方案】非草稿实验应至少有一个优胜方案', () => {
  for (const exp of MOCK_EXPERIMENTS) {
    if (exp.status === 'draft') continue;
    const winnerCount = exp.variants.filter((v) => v.isWinner).length;
    assert.ok(winnerCount >= 1, `${exp.name}（${exp.status}）应至少有一个优胜方案`);
  }
});

test('【优胜方案】草稿实验允许无优胜方案', () => {
  const draftExp = MOCK_EXPERIMENTS.find((e) => e.status === 'draft');
  assert.ok(draftExp);
  assert.equal(draftExp!.variants.filter((v) => v.isWinner).length, 0);
});

test('【优胜方案】优胜方案的 liftPercent 应 >= 0', () => {
  for (const exp of MOCK_EXPERIMENTS) {
    for (const v of exp.variants) {
      if (v.isWinner) assert.ok(v.liftPercent >= 0, `${exp.name}/${v.name} liftPercent 应 >= 0`);
    }
  }
});

test('【建议数据】所有建议 category 必须合法', () => {
  const validCategories: OptimizationSuggestion['category'][] = ['pricing', 'promotion', 'content', 'placement', 'other'];
  for (const sug of MOCK_SUGGESTIONS) {
    assert.ok(validCategories.includes(sug.category), `${sug.title} 类别无效: ${sug.category}`);
    assert.ok(sug.expectedLift > 0, `${sug.title} 预期提升必须大于0`);
    assert.ok(sug.description, `${sug.title} 缺少描述`);
  }
});
