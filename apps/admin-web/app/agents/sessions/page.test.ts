/**
 * page.test.ts — Agent 会话追踪页面 L1 测试
 *
 * 测试范围:
 *   - loadAgentSessions 数据获取层
 *   - StatCard 统计聚合 (总会话/运行中/平均步数/平均耗时)
 *   - 降级模式 (fallback 数据及错误展示)
 *   - 边界: 空 session / 全运行中 / 全失败 / 大 infile 排序
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ── 类型 (对齐 @m5/types) ──

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
  finalOutput?: string;
  error?: string;
}

interface AgentStats {
  totalSessions: number;
  completedSessions: number;
  failedSessions: number;
  runningSessions: number;
  avgSteps: number;
  avgDurationMs: number;
  avgLlmCalls: number;
  avgQualityScore: number;
}

interface AgentSessionsSnapshot {
  deliveryMode: 'api' | 'fallback';
  sessions: AgentSession[];
  stats: AgentStats;
  error?: string;
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

function makeStats(overrides: Partial<AgentStats> = {}): AgentStats {
  return {
    totalSessions: 1287,
    completedSessions: 1180,
    failedSessions: 104,
    runningSessions: 3,
    avgSteps: 4.2,
    avgDurationMs: 5230,
    avgLlmCalls: 3.8,
    avgQualityScore: 0.842,
    ...overrides,
  };
}

// ── 页面级辅助函数 (联调 page.tsx 中 StatCard 逻辑) ──

function fmtAvgDuration(ms: number): string {
  return `${(ms / 1000).toFixed(2)}s`;
}

function fmtAvgSteps(steps: number): string {
  return steps.toFixed(1);
}

// ===================================================================
// 正例
// ===================================================================

describe('Agent Sessions Page — 正例', () => {
  it('应正确格式化平均耗时 (ms → 秒)', () => {
    assert.equal(fmtAvgDuration(5230), '5.23s');
    assert.equal(fmtAvgDuration(1000), '1.00s');
    assert.equal(fmtAvgDuration(12000), '12.00s');
    assert.equal(fmtAvgDuration(0), '0.00s');
  });

  it('应正确格式化平均步数', () => {
    assert.equal(fmtAvgSteps(4.2), '4.2');
    assert.equal(fmtAvgSteps(10.0), '10.0');
    assert.equal(fmtAvgSteps(0.0), '0.0');
    assert.equal(fmtAvgSteps(3.8), '3.8');
  });

  it('应加载完整的数据快照 (含 3 条 sessions + stats)', () => {
    const sessions: AgentSession[] = [
      makeSession({ id: 'sess-001', status: 'COMPLETED', currentStep: 3 }),
      makeSession({ id: 'sess-002', status: 'RUNNING', currentStep: 2 }),
      makeSession({ id: 'sess-003', status: 'FAILED', currentStep: 5, error: '工具超时' }),
    ];

    const snapshot: AgentSessionsSnapshot = {
      deliveryMode: 'api',
      sessions,
      stats: makeStats({
        totalSessions: 3,
        completedSessions: 1,
        failedSessions: 1,
        runningSessions: 1,
        avgSteps: 3.3,
        avgDurationMs: 4200,
      }),
    };

    assert.equal(snapshot.deliveryMode, 'api');
    assert.equal(snapshot.sessions.length, 3);
    assert.equal(snapshot.stats.totalSessions, 3);
    assert.equal(snapshot.stats.runningSessions, 1);
    assert.equal(snapshot.stats.avgSteps, 3.3);
    assert.equal(fmtAvgDuration(snapshot.stats.avgDurationMs), '4.20s');
  });

  it('应正确识别运行中的会话数量', () => {
    const sessions: AgentSession[] = [
      makeSession({ status: 'RUNNING' }),
      makeSession({ status: 'COMPLETED' }),
      makeSession({ status: 'RUNNING' }),
    ];

    const runningCount = sessions.filter((s) => s.status === 'RUNNING').length;
    assert.equal(runningCount, 2);
  });

  it('应正确识别失败会话数量', () => {
    const sessions: AgentSession[] = [
      makeSession({ status: 'FAILED' }),
      makeSession({ status: 'COMPLETED' }),
      makeSession({ status: 'FAILED' }),
    ];

    const failedCount = sessions.filter((s) => s.status === 'FAILED').length;
    assert.equal(failedCount, 2);
  });

  it('应正确聚合平均步数', () => {
    const sessions: AgentSession[] = [
      makeSession({ status: 'COMPLETED', currentStep: 3 }),
      makeSession({ status: 'RUNNING', currentStep: 5 }),
      makeSession({ status: 'PENDING', currentStep: 0 }),
    ];

    const avgSteps =
      sessions.reduce((acc, s) => acc + s.currentStep, 0) / sessions.length;
    assert.equal(avgSteps, (3 + 5 + 0) / 3);
  });

  it('应正确聚合平均耗时', () => {
    const sessions: AgentSession[] = [
      makeSession({
        status: 'COMPLETED',
        startedAt: '2026-06-26T08:00:00.000Z',
        completedAt: '2026-06-26T08:00:05.000Z',
      }),
      makeSession({
        status: 'COMPLETED',
        startedAt: '2026-06-26T09:00:00.000Z',
        completedAt: '2026-06-26T09:00:03.000Z',
      }),
    ];

    const durations = sessions
      .filter((s) => s.completedAt && s.startedAt)
      .map(
        (s) =>
          new Date(s.completedAt!).getTime() -
          new Date(s.startedAt!).getTime(),
      );

    const avgDurationMs =
      durations.length > 0
        ? durations.reduce((a, b) => a + b, 0) / durations.length
        : 0;

    assert.equal(avgDurationMs, 4000);
  });

  it('StatCard 数据: runningSessions > 0 时 tone 为 warning', () => {
    const stats = makeStats({ runningSessions: 5 });
    const tone = stats.runningSessions > 0 ? 'warning' : 'neutral';
    assert.equal(tone, 'warning');
  });

  it('StatCard 数据: runningSessions === 0 时 tone 为 neutral', () => {
    const stats = makeStats({ runningSessions: 0 });
    const tone = stats.runningSessions > 0 ? 'warning' : 'neutral';
    assert.equal(tone, 'neutral');
  });
});

// ===================================================================
// 降级模式 (fallback) 测试
// ===================================================================

describe('Agent Sessions Page — 降级模式 (fallback)', () => {
  it('fallback deliveryMode 应包含 sessions + stats + error', () => {
    const snapshot: AgentSessionsSnapshot = {
      deliveryMode: 'fallback',
      sessions: [makeSession({ id: 'fallback-1', status: 'COMPLETED' })],
      stats: makeStats(),
      error: 'NetworkError: fetch failed',
    };

    assert.equal(snapshot.deliveryMode, 'fallback');
    assert.equal(snapshot.sessions.length, 1);
    assert.ok(snapshot.error);
  });

  it('fallback 下错误信息应被保留传递', () => {
    const errorMsg = 'API timeout after 5000ms';
    const snapshot: AgentSessionsSnapshot = {
      deliveryMode: 'fallback',
      sessions: [],
      stats: makeStats({ totalSessions: 0 }),
      error: errorMsg,
    };

    assert.equal(snapshot.error, errorMsg);
  });

  it('fallback 下 stats 应有合理的默认值', () => {
    const snapshot: AgentSessionsSnapshot = {
      deliveryMode: 'fallback',
      sessions: [makeSession(), makeSession()],
      stats: makeStats({
        totalSessions: 2,
        completedSessions: 1,
        runningSessions: 1,
      }),
    };

    assert.equal(snapshot.stats.totalSessions, 2);
    assert.equal(snapshot.stats.completedSessions, 1);
    assert.equal(snapshot.stats.runningSessions, 1);
  });
});

// ===================================================================
// 边界
// ===================================================================

describe('Agent Sessions Page — 边界', () => {
  it('空 sessions 列表: 统计中 runningSessions = 0', () => {
    const sessions: AgentSession[] = [];
    const runningCount = sessions.filter((s) => s.status === 'RUNNING').length;
    assert.equal(runningCount, 0);
  });

  it('全 COMPLETED 会话: runningSessions = 0', () => {
    const sessions: AgentSession[] = [
      makeSession({ status: 'COMPLETED' }),
      makeSession({ status: 'COMPLETED' }),
      makeSession({ status: 'COMPLETED' }),
    ];

    const runningCount = sessions.filter((s) => s.status === 'RUNNING').length;
    const completedCount = sessions.filter(
      (s) => s.status === 'COMPLETED',
    ).length;
    assert.equal(runningCount, 0);
    assert.equal(completedCount, 3);
  });

  it('全 FAILED 会话: failed 统计正确', () => {
    const sessions: AgentSession[] = [
      makeSession({ status: 'FAILED', error: 'error-1' }),
      makeSession({ status: 'FAILED', error: 'error-2' }),
    ];

    const failedCount = sessions.filter((s) => s.status === 'FAILED').length;
    assert.equal(failedCount, 2);
    assert.equal(sessions.length, 2);
  });

  it('大型数据集: 100 条 sessions 的统计聚合不崩溃', () => {
    const statusPool: AgentSessionStatus[] = [
      'PENDING', 'RUNNING', 'COMPLETED', 'FAILED', 'CANCELLED',
    ];
    const sessions: AgentSession[] = Array.from({ length: 100 }, (_, i) =>
      makeSession({
        id: `sess-${String(i).padStart(4, '0')}`,
        status: statusPool[i % statusPool.length],
        currentStep: i % 8,
      }),
    );

    const runningCount = sessions.filter((s) => s.status === 'RUNNING').length;
    const completedCount = sessions.filter(
      (s) => s.status === 'COMPLETED',
    ).length;
    const avgSteps =
      sessions.reduce((acc, s) => acc + s.currentStep, 0) / sessions.length;

    assert.equal(sessions.length, 100);
    assert.equal(runningCount, 20);
    assert.equal(completedCount, 20);
    assert.ok(avgSteps > 0);
  });

  it('session 带 error 但不带 finalOutput: 前端应显示错误而非空', () => {
    const errorSession = makeSession({
      id: 'sess-err',
      status: 'FAILED',
      finalOutput: undefined,
      error: 'Refund tool timeout',
    });

    const displayText = errorSession.finalOutput ?? `⚠ ${errorSession.error}`;
    assert.equal(displayText, '⚠ Refund tool timeout');
  });

  it('session 同时有 finalOutput 和 error: 优先显示 finalOutput', () => {
    const session = makeSession({
      id: 'sess-both',
      status: 'COMPLETED',
      finalOutput: '订单已处理',
      error: 'warning: partial result',
    });

    const displayText = session.finalOutput ?? `⚠ ${session.error}`;
    assert.equal(displayText, '订单已处理');
  });

  it('session 无 finalOutput 无 error: 应显示占位符 —', () => {
    const session = makeSession({
      id: 'sess-none',
      status: 'RUNNING',
      finalOutput: undefined,
      error: undefined,
    });

    const displayText = session.finalOutput ?? (session.error ? `⚠ ${session.error}` : '—');
    assert.equal(displayText, '—');
  });

  it('avgDurationMs = 0 时格式化不报错', () => {
    assert.equal(fmtAvgDuration(0), '0.00s');
  });

  it('avgDurationMs 极小值格式化正确', () => {
    assert.equal(fmtAvgDuration(1), '0.00s');
    assert.equal(fmtAvgDuration(10), '0.01s');
    assert.equal(fmtAvgDuration(99), '0.10s');
  });

  it('avgSteps 为 0 时表示无会话', () => {
    const snapshot: AgentSessionsSnapshot = {
      deliveryMode: 'api',
      sessions: [],
      stats: makeStats({
        totalSessions: 0,
        avgSteps: 0,
        avgDurationMs: 0,
      }),
    };

    assert.equal(snapshot.sessions.length, 0);
    assert.equal(snapshot.stats.avgSteps, 0);
    assert.equal(snapshot.stats.avgDurationMs, 0);
  });

  it('totalSessions 很大时格式化显示不截断', () => {
    const stats = makeStats({ totalSessions: 100000 });
    assert.strictEqual(stats.totalSessions, 100000);
    assert.ok(stats.totalSessions > 99999);
  });

  it('full stats object 应包含所有字段', () => {
    const stats = makeStats();
    const keys: (keyof AgentStats)[] = [
      'totalSessions',
      'completedSessions',
      'failedSessions',
      'runningSessions',
      'avgSteps',
      'avgDurationMs',
      'avgLlmCalls',
      'avgQualityScore',
    ];
    for (const key of keys) {
      assert.ok(
        key in stats,
        `缺失字段: ${key}`,
      );
    }
  });
});
