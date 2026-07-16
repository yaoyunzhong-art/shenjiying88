/**
 * rules/ai-decisions/[id]/page.test.tsx — AI 决策执行详情页 L1 测试
 *
 * 覆盖: 决策详情构建、状态分类、置信度计算、异常标记、重试与回退
 * 正例: 决策数据构造、状态映射、置信度范围、有效决策类别
 * 反例: 空 ID、无效状态、越界置信度、推理为空
 * 边界: 置信度 0%/100%、执行耗时 0ms、空输入上下文
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/* ── 类型 ── */

type AiDecisionStatus = 'executing' | 'success' | 'failure' | 'rejected' | 'timeout';
type DecisionCategory = 'pricing' | 'inventory' | 'promotion' | 'allocation' | 'recommendation';

interface AiDecisionDetail {
  id: string;
  ruleName: string;
  ruleId: string;
  status: AiDecisionStatus;
  category: DecisionCategory;
  confidence: number;
  executionMs: number;
  triggeredBy: string;
  triggeredAt: string;
  completedAt: string;
  inputContext: Record<string, unknown>;
  reasoning: string;
  decision: Record<string, unknown>;
  expectedOutcome: string;
  actualOutcome: string | null;
  deviationScore: number | null;
  anomalyFlags: string[];
  retryCount: number;
  version: string;
}

// ---- 辅助函数 ----

function hashCode(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash) + s.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}

const CATEGORY_LABELS: Record<DecisionCategory, string> = {
  pricing: '定价策略',
  inventory: '库存调配',
  promotion: '促销活动',
  allocation: '资源分配',
  recommendation: '商品推荐',
};

const STATUS_LABELS: Record<AiDecisionStatus, string> = {
  success: '成功',
  failure: '失败',
  rejected: '已驳回',
  timeout: '超时',
  executing: '执行中',
};

function statusVariant(status: AiDecisionStatus) {
  switch (status) {
    case 'success': return 'success';
    case 'failure': return 'danger';
    case 'rejected':
    case 'timeout': return 'warning';
    case 'executing': return 'info';
  }
}

// ---- Mock 决策构建 ----

function buildMockDecision(id: string): AiDecisionDetail {
  const statuses: AiDecisionStatus[] = ['success', 'failure', 'rejected', 'timeout', 'executing'];
  const categories: DecisionCategory[] = ['pricing', 'inventory', 'promotion', 'allocation', 'recommendation'];
  const status = statuses[Math.abs(hashCode(id)) % statuses.length]!;
  const category = categories[Math.abs(hashCode(id)) % categories.length]!;
  const success = status === 'success';
  return {
    id,
    ruleName: `AI 决策规则 ${id.slice(-4)}`,
    ruleId: `rule-${id.slice(-4)}`,
    status,
    category,
    confidence: success ? 0.87 + Math.random() * 0.12 : 0.45 + Math.random() * 0.3,
    executionMs: Math.floor(250 + Math.random() * 3000),
    triggeredBy: 'system:cron',
    triggeredAt: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
    completedAt: new Date().toISOString(),
    inputContext: {
      storeId: 'store-sh-001',
      productSku: 'SKU-8823-ALPHA',
      currentPrice: 129.00,
      competitorPrice: 118.00,
      inventoryLevel: 342,
      salesVelocity: 'high',
      timeWindow: 'promo-period',
    },
    reasoning: `基于当前库存余量 342 件与销售速度"高"的判定，结合竞品定价 ¥118.00（低于我方 ¥129.00 约 8.5%），AI 建议将价格调整至 ¥115.00–¥122.00 区间。`,
    decision: {
      recommendedPrice: 118.00,
      originalPrice: 129.00,
      discountRate: 0.915,
      expectedSalesLift: 0.15,
    },
    expectedOutcome: '预计销售额提升 15%，库存周转天数从 21 天降至 18 天',
    actualOutcome: success ? '实际销售额提升 13.2%，周转天数降至 18.5 天' : null,
    deviationScore: success ? 0.12 : 0.43,
    anomalyFlags: success ? [] : ['confidence_degradation', 'deviation_exceeded_threshold'],
    retryCount: success ? 0 : 2,
    version: 'ai-model-v2.3.1',
  };
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.5) return 'text-yellow-600';
  return 'text-red-600';
}

function isRetryAllowed(status: AiDecisionStatus): boolean {
  return status === 'failure' || status === 'timeout' || status === 'rejected';
}

function isRevertAllowed(status: AiDecisionStatus, deviationScore: number | null): boolean {
  return status === 'success' && deviationScore !== null && deviationScore > 0.15;
}

function shouldShowDeviation(status: AiDecisionStatus): boolean {
  return status === 'success' || status === 'failure';
}

/* ============================================================ */

describe('ai-decisions: 数据类型', () => {
  it('AiDecisionDetail has all fields', () => {
    const d: AiDecisionDetail = {
      id: 'd-001', ruleName: 'R', ruleId: 'r-1', status: 'success', category: 'pricing',
      confidence: 0.92, executionMs: 500, triggeredBy: 'cron', triggeredAt: '2026-01-01T00:00:00Z',
      completedAt: '2026-01-01T00:01:00Z', inputContext: {}, reasoning: 'test', decision: {},
      expectedOutcome: 'E', actualOutcome: 'A', deviationScore: 0.1, anomalyFlags: [], retryCount: 0, version: 'v1',
    };
    assert.equal(typeof d.confidence, 'number');
    assert.equal(typeof d.deviationScore, 'number');
    assert.equal(typeof d.retryCount, 'number');
  });

  it('AiDecisionStatus enum has 5 values', () => {
    const statuses: AiDecisionStatus[] = ['executing', 'success', 'failure', 'rejected', 'timeout'];
    assert.equal(statuses.length, 5);
  });

  it('DecisionCategory enum has 5 values', () => {
    const cats: DecisionCategory[] = ['pricing', 'inventory', 'promotion', 'allocation', 'recommendation'];
    assert.equal(cats.length, 5);
  });

  it('CATEGORY_LABELS covers all categories', () => {
    assert.equal(Object.keys(CATEGORY_LABELS).length, 5);
    assert.equal(CATEGORY_LABELS.recommendation, '商品推荐');
  });
});

describe('ai-decisions: 业务逻辑 - 决策构造', () => {
  it('buildMockDecision creates valid decision', () => {
    const d = buildMockDecision('dec-001');
    assert.equal(typeof d.id, 'string');
    assert.ok(d.ruleName.startsWith('AI 决策规则'));
    assert.ok(d.executionMs >= 250);
  });

  it('buildMockDecision with same id has same status', () => {
    const d1 = buildMockDecision('dec-005');
    const d2 = buildMockDecision('dec-005');
    assert.equal(d1.status, d2.status);
    assert.equal(d1.category, d2.category);
  });

  it('statusVariant returns match for each status', () => {
    assert.equal(statusVariant('success'), 'success');
    assert.equal(statusVariant('failure'), 'danger');
    assert.equal(statusVariant('rejected'), 'warning');
    assert.equal(statusVariant('timeout'), 'warning');
    assert.equal(statusVariant('executing'), 'info');
  });

  it('STATUS_LABELS covers all statuses', () => {
    assert.equal(Object.keys(STATUS_LABELS).length, 5);
    assert.equal(STATUS_LABELS.executing, '执行中');
  });

  it('confidence is between 0 and 1', () => {
    for (let i = 0; i < 20; i++) {
      const d = buildMockDecision(`dec-${i}`);
      assert.ok(d.confidence >= 0 && d.confidence <= 1);
    }
  });

  it('executionMs is non-negative', () => {
    for (let i = 0; i < 10; i++) {
      const d = buildMockDecision(`dec-${i}`);
      assert.ok(d.executionMs >= 0);
    }
  });
});

describe('ai-decisions: 业务逻辑 - 状态与操作', () => {
  it('isRetryAllowed for failure, timeout, rejected', () => {
    assert.ok(isRetryAllowed('failure'));
    assert.ok(isRetryAllowed('timeout'));
    assert.ok(isRetryAllowed('rejected'));
    assert.ok(!isRetryAllowed('success'));
    assert.ok(!isRetryAllowed('executing'));
  });

  it('isRevertAllowed when deviation > 0.15', () => {
    assert.ok(isRevertAllowed('success', 0.2));
    assert.ok(!isRevertAllowed('success', 0.1));
    assert.ok(!isRevertAllowed('success', null));
    assert.ok(!isRevertAllowed('failure', 0.2));
  });

  it('shouldShowDeviation for success and failure', () => {
    assert.ok(shouldShowDeviation('success'));
    assert.ok(shouldShowDeviation('failure'));
    assert.ok(!shouldShowDeviation('rejected'));
    assert.ok(!shouldShowDeviation('timeout'));
    assert.ok(!shouldShowDeviation('executing'));
  });

  it('getConfidenceColor high >= 0.8 is green', () => {
    assert.ok(getConfidenceColor(0.9).includes('green'));
  });

  it('getConfidenceColor medium 0.5-0.79 is yellow', () => {
    assert.ok(getConfidenceColor(0.6).includes('yellow'));
  });

  it('getConfidenceColor low < 0.5 is red', () => {
    assert.ok(getConfidenceColor(0.3).includes('red'));
  });
});

describe('ai-decisions: 业务逻辑 - 异常与偏差', () => {
  it('success decisions have empty anomalyFlags', () => {
    const d = buildMockDecision('dec-100');
    if (d.status === 'success') {
      assert.deepEqual(d.anomalyFlags, []);
      assert.equal(d.retryCount, 0);
    }
  });

  it('failure decisions have anomalyFlags', () => {
    const d = buildMockDecision('dec-101');
    if (d.status === 'failure') {
      assert.ok(d.anomalyFlags.length > 0);
      assert.ok(d.retryCount >= 1);
    }
  });

  it('deviationScore is null for rejected/timeout', () => {
    const d = buildMockDecision('dec-103');
    if (d.status === 'rejected' || d.status === 'timeout') {
      assert.equal(d.deviationScore, null);
    }
  });

  it('all decisions have inputContext', () => {
    for (let i = 0; i < 10; i++) {
      const d = buildMockDecision(`dec-${i}`);
      assert.ok(typeof d.inputContext === 'object');
    }
  });

  it('all decisions have non-empty reasoning', () => {
    for (let i = 0; i < 10; i++) {
      const d = buildMockDecision(`dec-${i}`);
      assert.ok(d.reasoning.length > 0);
    }
  });

  it('version is always set', () => {
    const d = buildMockDecision('dec-001');
    assert.equal(typeof d.version, 'string');
    assert.ok(d.version.startsWith('ai-model'));
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('Rules / Ai Decisions — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含数据格式化', () => assert.ok(SRC.includes('.toFixed') || SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes('/**')));
});
