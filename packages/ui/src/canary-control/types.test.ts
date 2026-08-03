/**
 * types.test.ts — 灰度控制模块 类型 & 状态机 & 工具函数测试
 *
 * 覆盖:
 * - 所有枚举常量的完整性
 * - STATUS_LABELS/STATUS_COLORS/STRATEGY_LABELS 映射完整性
 * - CanaryExperiment 类型构造
 * - 状态机转换逻辑
 * - 灰度推进策略计算
 * - 自定义 AutoPromoteRule 计算
 * - 边界条件
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  STATUS_LABELS,
  STATUS_COLORS,
  STRATEGY_LABELS,
} from './types';
import type {
  CanaryExperiment,
  CanaryStatus,
  CanaryStrategy,
  AutoPromoteRule,
  CanaryHealthSnapshot,
} from './types';

// =====================================================================
// 1. 枚举常量完整性
// =====================================================================

describe('STATUS_LABELS — 状态标签映射完整', () => {
  it('包含全部 5 种状态', () => {
    const labels = STATUS_LABELS;
    assert.equal(Object.keys(labels).length, 5);
    assert.ok('draft' in labels);
    assert.ok('active' in labels);
    assert.ok('paused' in labels);
    assert.ok('completed' in labels);
    assert.ok('rolled_back' in labels);
  });

  it('中文映射正确', () => {
    assert.equal(STATUS_LABELS.draft, '草稿');
    assert.equal(STATUS_LABELS.active, '进行中');
    assert.equal(STATUS_LABELS.paused, '已暂停');
    assert.equal(STATUS_LABELS.completed, '已完成');
    assert.equal(STATUS_LABELS.rolled_back, '已回滚');
  });
});

describe('STATUS_COLORS — 状态颜色映射完整', () => {
  it('包含全部 5 种状态', () => {
    assert.ok('draft' in STATUS_COLORS);
    assert.ok('active' in STATUS_COLORS);
    assert.ok('paused' in STATUS_COLORS);
    assert.ok('completed' in STATUS_COLORS);
    assert.ok('rolled_back' in STATUS_COLORS);
  });

  it('颜色值格式正确', () => {
    for (const color of Object.values(STATUS_COLORS)) {
      assert.match(color, /^#[0-9a-f]{6}$/i);
    }
  });
});

describe('STRATEGY_LABELS — 策略标签映射完整', () => {
  it('包含全部 4 种策略', () => {
    const labels = STRATEGY_LABELS;
    assert.equal(Object.keys(labels).length, 4);
    assert.ok('percentage' in labels);
    assert.ok('tenant' in labels);
    assert.ok('store' in labels);
    assert.ok('tag' in labels);
  });

  it('中文映射正确', () => {
    assert.equal(STRATEGY_LABELS.percentage, '百分比');
    assert.equal(STRATEGY_LABELS.tenant, '租户');
    assert.equal(STRATEGY_LABELS.store, '门店');
    assert.equal(STRATEGY_LABELS.tag, '标签');
  });
});

// =====================================================================
// 2. 类型构造验证
// =====================================================================

describe('CanaryExperiment — 类型构造', () => {
  it('percentage 策略实验完整构建', () => {
    const exp: CanaryExperiment = {
      id: 'exp-001',
      name: '实验 A',
      description: '测试实验',
      flagKey: 'feature_a',
      strategy: 'percentage',
      strategyConfig: { type: 'percentage', includeAll: true },
      status: 'active',
      initialPercentage: 5,
      targetPercentage: 100,
      currentPercentage: 25,
      startedAt: '2026-07-01T00:00:00Z',
      createdBy: 'admin',
      createdAt: '2026-07-01',
      updatedAt: '2026-07-10',
    };
    assert.equal(exp.id, 'exp-001');
    assert.equal(exp.initialPercentage, 5);
    assert.equal(exp.currentPercentage, 25);
    assert.equal(exp.status, 'active');
  });

  it('store 策略实验构建', () => {
    const exp: CanaryExperiment = {
      id: 'exp-store-001',
      name: '门店灰度',
      description: '指定门店',
      flagKey: 'store_feature_x',
      strategy: 'store',
      strategyConfig: { type: 'store', storeIds: ['S001', 'S002'] },
      status: 'draft',
      initialPercentage: 100,
      targetPercentage: 100,
      currentPercentage: 0,
      createdBy: 'ops',
      createdAt: '2026-07-05',
      updatedAt: '2026-07-05',
    };
    assert.equal(exp.strategy, 'store');
    assert.equal(exp.status, 'draft');
    assert.equal(exp.currentPercentage, 0);
  });

  it('draft 实验无 startedAt/endedAt', () => {
    const exp: CanaryExperiment = {
      id: 'exp-draft',
      name: '草稿实验',
      description: '尚未启动',
      flagKey: 'feature_draft',
      strategy: 'percentage',
      strategyConfig: { type: 'percentage' },
      status: 'draft',
      initialPercentage: 0,
      targetPercentage: 50,
      currentPercentage: 0,
      createdBy: 'admin',
      createdAt: '2026-07-20',
      updatedAt: '2026-07-20',
    };
    assert.equal(exp.startedAt, undefined);
    assert.equal(exp.endedAt, undefined);
  });

  it('可携带 autoPromote 配置', () => {
    const exp: CanaryExperiment = {
      id: 'exp-auto',
      name: '自动晋级',
      description: '自动推进实验',
      flagKey: 'auto_feature',
      strategy: 'percentage',
      strategyConfig: { type: 'percentage' },
      status: 'active',
      initialPercentage: 10,
      targetPercentage: 100,
      currentPercentage: 10,
      startedAt: '2026-07-15',
      autoPromote: {
        checkIntervalMin: 5,
        healthMetrics: ['error_rate', 'latency_p95'],
        promoteSteps: [10, 25, 50, 75, 100],
        healthThreshold: 0.95,
        maxPromotions: 5,
      },
      createdBy: 'system',
      createdAt: '2026-07-15',
      updatedAt: '2026-07-15',
    };
    assert.ok(exp.autoPromote != null);
    assert.equal(exp.autoPromote.checkIntervalMin, 5);
    assert.equal(exp.autoPromote.maxPromotions, 5);
    assert.deepEqual(exp.autoPromote.promoteSteps, [10, 25, 50, 75, 100]);
  });
});

describe('CanaryHealthSnapshot — 健康快照构造', () => {
  it('健康快照完整构建', () => {
    const snapshot: CanaryHealthSnapshot = {
      experimentId: 'exp-001',
      timestamp: '2026-07-20T10:00:00Z',
      errorRate: 0.02,
      latencyP95: 350,
      latencyAvg: 120,
      totalRequests: 15000,
      isHealthy: true,
    };
    assert.equal(snapshot.experimentId, 'exp-001');
    assert.equal(snapshot.errorRate, 0.02);
    assert.equal(snapshot.isHealthy, true);
    assert.equal(snapshot.totalRequests, 15000);
  });

  it('不健康快照 can be constructed', () => {
    const snapshot: CanaryHealthSnapshot = {
      experimentId: 'exp-001',
      timestamp: '2026-07-20T10:05:00Z',
      errorRate: 0.15,
      latencyP95: 2500,
      latencyAvg: 890,
      totalRequests: 15000,
      isHealthy: false,
    };
    assert.equal(snapshot.isHealthy, false);
    assert.equal(snapshot.errorRate, 0.15);
  });
});

// =====================================================================
// 3. 状态机转换逻辑 (纯函数)
// =====================================================================

function canTransition(current: CanaryStatus, target: CanaryStatus): boolean {
  const transitions: Record<CanaryStatus, CanaryStatus[]> = {
    draft: ['active'],
    active: ['paused', 'completed', 'rolled_back'],
    paused: ['active', 'rolled_back'],
    completed: [],
    rolled_back: [],
  };
  return transitions[current]?.includes(target) ?? false;
}

describe('状态机转换 (State Machine)', () => {
  it('draft → active 合法', () => {
    assert.equal(canTransition('draft', 'active'), true);
  });

  it('draft → paused 非法', () => {
    assert.equal(canTransition('draft', 'paused'), false);
  });

  it('active → paused 合法', () => {
    assert.equal(canTransition('active', 'paused'), true);
  });

  it('active → completed 合法', () => {
    assert.equal(canTransition('active', 'completed'), true);
  });

  it('active → rolled_back 合法', () => {
    assert.equal(canTransition('active', 'rolled_back'), true);
  });

  it('paused → active 合法', () => {
    assert.equal(canTransition('paused', 'active'), true);
  });

  it('paused → rolled_back 合法', () => {
    assert.equal(canTransition('paused', 'rolled_back'), true);
  });

  it('completed → 任何状态非法', () => {
    assert.equal(canTransition('completed', 'active'), false);
    assert.equal(canTransition('completed', 'paused'), false);
    assert.equal(canTransition('completed', 'draft'), false);
  });

  it('rolled_back → 任何状态非法', () => {
    assert.equal(canTransition('rolled_back', 'active'), false);
    assert.equal(canTransition('rolled_back', 'paused'), false);
  });

  it('draft → draft 非法 (同一状态)', () => {
    assert.equal(canTransition('draft', 'draft'), false);
  });
});

// =====================================================================
// 4. 灰度推进计算
// =====================================================================

function calculateNextPercentage(current: number, target: number, stepSize: number): number {
  if (current >= target) return target;
  const next = current + stepSize;
  return next > target ? target : next;
}

function calculateAutoPromoteStep(
  current: number,
  steps: number[],
): number | null {
  const remaining = steps.filter((s) => s > current).sort((a, b) => a - b);
  return remaining.length > 0 ? remaining[0]! : null;
}

describe('灰度推进计算', () => {
  it('当前百分比 < 目标时向前推进', () => {
    assert.equal(calculateNextPercentage(25, 100, 25), 50);
    assert.equal(calculateNextPercentage(50, 100, 25), 75);
    assert.equal(calculateNextPercentage(75, 100, 25), 100);
  });

  it('当前百分比 >= 目标时返回目标值', () => {
    assert.equal(calculateNextPercentage(100, 100, 25), 100);
    assert.equal(calculateNextPercentage(110, 100, 25), 100);
  });

  it('最后一步不超过目标值', () => {
    assert.equal(calculateNextPercentage(90, 100, 25), 100);
  });

  it('步进为 0 时死循环不推进', () => {
    assert.equal(calculateNextPercentage(10, 100, 0), 10);
  });

  it('目标值为 0 时返回 0', () => {
    assert.equal(calculateNextPercentage(10, 0, 25), 0);
  });
});

describe('自动晋级步进计算', () => {
  const steps = [10, 25, 50, 75, 100];

  it('从 10% 开始下一步为 25%', () => {
    assert.equal(calculateAutoPromoteStep(10, steps), 25);
  });

  it('从 0% 开始下一步为 10%', () => {
    assert.equal(calculateAutoPromoteStep(0, steps), 10);
  });

  it('从 75% 开始下一步为 100%', () => {
    assert.equal(calculateAutoPromoteStep(75, steps), 100);
  });

  it('已达 100% 无下一步', () => {
    assert.equal(calculateAutoPromoteStep(100, steps), null);
  });

  it('无剩余步进时返回 null', () => {
    assert.equal(calculateAutoPromoteStep(100, []), null);
    assert.equal(calculateAutoPromoteStep(200, steps), null);
  });
});
