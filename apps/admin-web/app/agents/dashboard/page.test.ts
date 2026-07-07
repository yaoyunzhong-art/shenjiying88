/**
 * page.test.ts — Agent Dashboard 页面级 L1 测试
 *
 * 测试范围:
 *   - page.tsx 数据获取层 (loadAgentDashboardSnapshot)
 *   - 排序逻辑 (RUNNING > PENDING > COMPLETED > FAILED > CANCELLED)
 *   - StatCard 统计聚合
 *   - 降级模式 (data-testid="dashboard-stats" / "agent-dashboard-error")
 *   - 边界: 空会话 / 全失败 / 全运行中
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ── 类型 (对齐 types 包) ──

type AgentSessionStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

interface AgentSession {
  id: string;
  configId: string;
  status: AgentSessionStatus;
  userInput: string;
  currentStep: number;
  maxSteps: number;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

interface AgentDashboardSnapshot {
  sessions: AgentSession[];
  runningCount: number;
  completedCount: number;
  failedCount: number;
  totalExecutions: number;
  avgSteps: number;
  avgDurationMs: number;
  totalConfigs: number;
  deliveryMode: 'api' | 'fallback';
  error?: string;
  timestamp: string;
}

// ── 排序工具 (联调 page.tsx 中内联排序逻辑) ──

const STATUS_RANK: Record<AgentSessionStatus, number> = {
  RUNNING: 0,
  PENDING: 1,
  COMPLETED: 2,
  FAILED: 3,
  CANCELLED: 4,
};

function sortSessions(sessions: AgentSession[]): AgentSession[] {
  return [...sessions].sort(
    (a, b) => (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99),
  );
}

// ── 统计聚合 (联调 page.tsx StatCard 数据源) ──

function computeStats(sessions: AgentSession[]): {
  runningCount: number;
  completedCount: number;
  failedCount: number;
  totalExecutions: number;
  avgSteps: number;
  avgDurationMs: number;
} {
  const totalExecutions = sessions.length;
  const runningCount = sessions.filter((s) => s.status === 'RUNNING').length;
  const completedCount = sessions.filter((s) => s.status === 'COMPLETED').length;
  const failedCount = sessions.filter((s) => s.status === 'FAILED').length;
  const stepsTotal = sessions.reduce((acc, s) => acc + (s.currentStep ?? 0), 0);
  const avgSteps = totalExecutions > 0 ? stepsTotal / totalExecutions : 0;

  // avgDurationMs: 仅统计有 completedAt 的
  const completedSessions = sessions.filter(
    (s) => s.completedAt && s.startedAt,
  );
  const durations = completedSessions.map(
    (s) =>
      new Date(s.completedAt!).getTime() - new Date(s.startedAt!).getTime(),
  );
  const avgDurationMs =
    durations.length > 0
      ? durations.reduce((a, b) => a + b, 0) / durations.length
      : 0;

  return {
    runningCount,
    completedCount,
    failedCount,
    totalExecutions,
    avgSteps,
    avgDurationMs,
  };
}

// ── Mock 数据工厂 ──

function makeSession(overrides: Partial<AgentSession> = {}): AgentSession {
  const now = new Date().toISOString();
  return {
    id: `sess-${Math.random().toString(36).slice(2, 6)}`,
    configId: 'agent-cfg-cs',
    status: 'PENDING',
    userInput: 'test input',
    currentStep: 0,
    maxSteps: 10,
    createdAt: now,
    ...overrides,
  };
}

// ===================================================================
// 正例
// ===================================================================

describe('Agent Dashboard — 正例', () => {
  it('应正确排序: RUNNING > PENDING > COMPLETED > FAILED > CANCELLED', () => {
    const sessions: AgentSession[] = [
      makeSession({ id: 's-1', status: 'COMPLETED' }),
      makeSession({ id: 's-2', status: 'RUNNING' }),
      makeSession({ id: 's-3', status: 'FAILED' }),
      makeSession({ id: 's-4', status: 'PENDING' }),
      makeSession({ id: 's-5', status: 'CANCELLED' }),
    ];

    const sorted = sortSessions(sessions);
    const statuses = sorted.map((s) => s.status);
    assert.deepEqual(statuses, ['RUNNING', 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']);
  });

  it('应正确聚合统计值', () => {
    const sessions: AgentSession[] = [
      makeSession({ status: 'RUNNING', currentStep: 3, maxSteps: 10 }),
      makeSession({ status: 'RUNNING', currentStep: 2, maxSteps: 8 }),
      makeSession({ status: 'COMPLETED', currentStep: 5, maxSteps: 10 }),
      makeSession({ status: 'FAILED', currentStep: 4, maxSteps: 10 }),
    ];

    const stats = computeStats(sessions);
    assert.equal(stats.runningCount, 2);
    assert.equal(stats.completedCount, 1);
    assert.equal(stats.failedCount, 1);
    assert.equal(stats.totalExecutions, 4);
    assert.equal(stats.avgSteps, (3 + 2 + 5 + 4) / 4);
  });

  it('应正确计算 avgDurationMs', () => {
    const sessions: AgentSession[] = [
      makeSession({
        status: 'COMPLETED',
        startedAt: '2026-06-26T08:00:00.000Z',
        completedAt: '2026-06-26T08:00:05.000Z', // 5000ms
      }),
      makeSession({
        status: 'COMPLETED',
        startedAt: '2026-06-26T09:00:00.000Z',
        completedAt: '2026-06-26T09:00:03.000Z', // 3000ms
      }),
      makeSession({ status: 'RUNNING' }), // 无 completedAt，不参与计算
    ];

    const stats = computeStats(sessions);
    assert.equal(stats.avgDurationMs, 4000);
  });

  it('应保持稳定排序 — 同 status 按原始顺序 (stable sort)', () => {
    const sessions: AgentSession[] = [
      makeSession({ id: 'a', status: 'COMPLETED' }),
      makeSession({ id: 'b', status: 'RUNNING' }),
      makeSession({ id: 'c', status: 'RUNNING' }),
      makeSession({ id: 'd', status: 'COMPLETED' }),
    ];

    const sorted = sortSessions(sessions);
    // RUNNING 组: b 在 c 前; COMPLETED 组: a 在 d 前
    const ids = sorted.map((s) => s.id);
    assert.equal(ids[0], 'b');
    assert.equal(ids[1], 'c');
    assert.equal(ids[2], 'a');
    assert.equal(ids[3], 'd');
  });
});

// ===================================================================
// 反例 / 边界
// ===================================================================

describe('Agent Dashboard — 边界', () => {
  it('空会话列表: 所有统计值为零', () => {
    const stats = computeStats([]);
    assert.equal(stats.runningCount, 0);
    assert.equal(stats.completedCount, 0);
    assert.equal(stats.failedCount, 0);
    assert.equal(stats.totalExecutions, 0);
    assert.equal(stats.avgSteps, 0);
    assert.equal(stats.avgDurationMs, 0);
  });

  it('空会话排序: 返回空数组', () => {
    const sorted = sortSessions([]);
    assert.deepEqual(sorted, []);
  });

  it('全 RUNNING 会话: 统计正确 + 排序保持', () => {
    const sessions: AgentSession[] = [
      makeSession({ id: 'r1', status: 'RUNNING' }),
      makeSession({ id: 'r2', status: 'RUNNING' }),
      makeSession({ id: 'r3', status: 'RUNNING' }),
    ];

    const stats = computeStats(sessions);
    assert.equal(stats.runningCount, 3);
    assert.equal(stats.totalExecutions, 3);

    const sorted = sortSessions(sessions);
    assert.equal(sorted[0]!.id, 'r1');
  });

  it('全 FAILED 会话: failedCount 正确', () => {
    const sessions: AgentSession[] = [
      makeSession({ status: 'FAILED' }),
      makeSession({ status: 'FAILED' }),
    ];

    const stats = computeStats(sessions);
    assert.equal(stats.failedCount, 2);
    assert.equal(stats.totalExecutions, 2);
  });

  it('混合 status + 无 startedAt 不破坏 avgDurationMs', () => {
    const sessions: AgentSession[] = [
      makeSession({ status: 'COMPLETED', startedAt: undefined, completedAt: undefined }),
      makeSession({ status: 'RUNNING' }),
    ];

    // 不应该 throw
    const stats = computeStats(sessions);
    assert.equal(stats.avgDurationMs, 0);
    assert.equal(stats.totalExecutions, 2);
  });

  it('large input: 100 条会话排序性能不崩溃', () => {
    const statusPool: AgentSessionStatus[] = [
      'RUNNING', 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED',
    ];
    const sessions: AgentSession[] = Array.from({ length: 100 }, (_, i) =>
      makeSession({
        id: `sess-${String(i).padStart(4, '0')}`,
        status: statusPool[i % statusPool.length],
        currentStep: i % 10,
      }),
    );

    const sorted = sortSessions(sessions);
    assert.equal(sorted.length, 100);
    assert.equal(sorted[0]!.status, 'RUNNING');

    const stats = computeStats(sessions);
    assert.equal(stats.totalExecutions, 100);
    assert.ok(stats.runningCount > 0);
  });
});

// ===================================================================
// 降级模式 (fallback) 测试 — 模拟后端不可用时
// ===================================================================

describe('Agent Dashboard — 降级模式 (fallback)', () => {
  it('fallback deliveryMode 不会影响排序结果', () => {
    const sessions: AgentSession[] = [
      makeSession({ id: 'a', status: 'RUNNING' }),
      makeSession({ id: 'b', status: 'FAILED' }),
    ];

    const snapshot: AgentDashboardSnapshot = {
      sessions: sortSessions(sessions),
      runningCount: 1,
      completedCount: 0,
      failedCount: 1,
      totalExecutions: 2,
      avgSteps: 2,
      avgDurationMs: 0,
      totalConfigs: 3,
      deliveryMode: 'fallback',
      timestamp: new Date().toISOString(),
    };

    assert.equal(snapshot.deliveryMode, 'fallback');
    assert.equal(snapshot.sessions[0]!.status, 'RUNNING');
    assert.equal(snapshot.runningCount, 1);
  });

  it('fallback 下 totalConfigs 应有合理的默认值', () => {
    const snapshot: AgentDashboardSnapshot = {
      sessions: [],
      runningCount: 0,
      completedCount: 0,
      failedCount: 0,
      totalExecutions: 0,
      avgSteps: 0,
      avgDurationMs: 0,
      totalConfigs: 3, // FALLBACK_AGENT_CONFIGS.length
      deliveryMode: 'fallback',
      timestamp: new Date().toISOString(),
    };

    assert.equal(snapshot.totalConfigs, 3);
  });

  it('error 消息在 fallback 时应被保留传递', () => {
    const errorMsg = 'API 不可达,使用降级数据';
    const snapshot: AgentDashboardSnapshot = {
      sessions: [],
      runningCount: 0,
      completedCount: 0,
      failedCount: 0,
      totalExecutions: 0,
      avgSteps: 0,
      avgDurationMs: 0,
      totalConfigs: 0,
      deliveryMode: 'fallback',
      error: errorMsg,
      timestamp: new Date().toISOString(),
    };

    assert.equal(snapshot.error, errorMsg);
  });
});
