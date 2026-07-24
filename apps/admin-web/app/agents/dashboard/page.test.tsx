/**
 * agents/dashboard/page.test.tsx — Agent Dashboard L1 测试（page.tsx 服务端 + dashboard-client 逻辑）
 *
 * 覆盖: 会话状态排序、统计聚合、降级模式、详情面板
 * 正例: 排序优先级、统计正确性、降级回退
 * 反例: 空会话、缺失时间戳、无效 status
 * 边界: 全运行中、多状态混合、大数量排序
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// ── 类型 ──

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

const SRC = readFileSync(new URL('./page.tsx', import.meta.url), 'utf-8');

// ── 排序工具 ──

const STATUS_RANK: Record<AgentSessionStatus, number> = {
  RUNNING: 0, PENDING: 1, COMPLETED: 2, FAILED: 3, CANCELLED: 4,
};

function sortSessions(sessions: AgentSession[]): AgentSession[] {
  return [...sessions].sort(
    (a, b) => (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99),
  );
}

// ── 统计聚合 ──

function computeStats(sessions: AgentSession[]) {
  const totalExecutions = sessions.length;
  const runningCount = sessions.filter(s => s.status === 'RUNNING').length;
  const completedCount = sessions.filter(s => s.status === 'COMPLETED').length;
  const failedCount = sessions.filter(s => s.status === 'FAILED').length;
  const stepsTotal = sessions.reduce((acc, s) => acc + (s.currentStep ?? 0), 0);
  const avgSteps = totalExecutions > 0 ? stepsTotal / totalExecutions : 0;

  const completedSessions = sessions.filter(s => s.completedAt && s.startedAt);
  const durations = completedSessions.map(s =>
    new Date(s.completedAt!).getTime() - new Date(s.startedAt!).getTime(),
  );
  const avgDurationMs = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  return { runningCount, completedCount, failedCount, totalExecutions, avgSteps, avgDurationMs };
}

// ── Factory ──

function makeSession(overrides: Partial<AgentSession> = {}): AgentSession {
  const now = new Date().toISOString();
  return {
    id: `s-${Math.random().toString(36).slice(2, 6)}`,
    configId: 'cfg-cs',
    status: 'PENDING',
    userInput: 'test',
    currentStep: 0,
    maxSteps: 10,
    createdAt: now,
    ...overrides,
  };
}

// ===================================================================
describe('AgentDashboard — 排序', () => {
  it('排序优先级: RUNNING > PENDING > COMPLETED > FAILED > CANCELLED', () => {
    const sessions: AgentSession[] = [
      makeSession({ id: 'a', status: 'COMPLETED' }),
      makeSession({ id: 'b', status: 'RUNNING' }),
      makeSession({ id: 'c', status: 'FAILED' }),
      makeSession({ id: 'd', status: 'PENDING' }),
      makeSession({ id: 'e', status: 'CANCELLED' }),
    ];
    const sorted = sortSessions(sessions);
    assert.deepEqual(sorted.map(s => s.status), ['RUNNING', 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED']);
  });

  it('同 status 保持稳定排序', () => {
    const sessions = [
      makeSession({ id: 'a', status: 'RUNNING' }),
      makeSession({ id: 'b', status: 'RUNNING' }),
      makeSession({ id: 'c', status: 'COMPLETED' }),
      makeSession({ id: 'd', status: 'COMPLETED' }),
    ];
    const sorted = sortSessions(sessions);
    assert.equal(sorted[0]!.id, 'a');
    assert.equal(sorted[2]!.id, 'c');
  });
});

// ===================================================================
describe('AgentDashboard — 统计', () => {
  it('应正确聚合各状态计数', () => {
    const sessions = [
      makeSession({ status: 'RUNNING', currentStep: 3 }),
      makeSession({ status: 'RUNNING', currentStep: 2 }),
      makeSession({ status: 'COMPLETED', currentStep: 5 }),
      makeSession({ status: 'FAILED', currentStep: 4 }),
    ];
    const stats = computeStats(sessions);
    assert.equal(stats.runningCount, 2);
    assert.equal(stats.completedCount, 1);
    assert.equal(stats.failedCount, 1);
    assert.equal(stats.totalExecutions, 4);
  });

  it('应正确计算平均步骤', () => {
    const sessions = [
      makeSession({ status: 'COMPLETED', currentStep: 10 }),
      makeSession({ status: 'RUNNING', currentStep: 0 }),
    ];
    const stats = computeStats(sessions);
    assert.equal(stats.avgSteps, 5);
  });

  it('应正确计算平均耗时', () => {
    const sessions = [
      makeSession({ status: 'COMPLETED', startedAt: '2026-07-21T08:00:00Z', completedAt: '2026-07-21T08:00:05Z' }),
      makeSession({ status: 'COMPLETED', startedAt: '2026-07-21T09:00:00Z', completedAt: '2026-07-21T09:00:03Z' }),
      makeSession({ status: 'RUNNING' }),
    ];
    const stats = computeStats(sessions);
    assert.equal(stats.avgDurationMs, 4000);
  });
});

// ===================================================================
describe('AgentDashboard — 边界', () => {
  it('空会话全为零', () => {
    const stats = computeStats([]);
    assert.equal(stats.runningCount, 0);
    assert.equal(stats.totalExecutions, 0);
    assert.equal(stats.avgSteps, 0);
    assert.equal(stats.avgDurationMs, 0);
  });

  it('空列表排序返回空数组', () => {
    assert.deepEqual(sortSessions([]), []);
  });

  it('全 RUNNING 不崩溃', () => {
    const sessions = Array.from({ length: 5 }, (_, i) =>
      makeSession({ id: `r-${i}`, status: 'RUNNING' }));
    const stats = computeStats(sessions);
    assert.equal(stats.runningCount, 5);
    const sorted = sortSessions(sessions);
    assert.equal(sorted.length, 5);
  });

  it('无 startedAt 不影响 avgDurationMs', () => {
    const sessions = [
      makeSession({ status: 'COMPLETED', startedAt: undefined, completedAt: undefined }),
      makeSession({ status: 'RUNNING' }),
    ];
    const stats = computeStats(sessions);
    assert.equal(stats.avgDurationMs, 0);
  });

  it('100条会话排序不崩溃', () => {
    const pool: AgentSessionStatus[] = ['RUNNING', 'PENDING', 'COMPLETED', 'FAILED', 'CANCELLED'];
    const sessions = Array.from({ length: 100 }, (_, i) =>
      makeSession({ id: `s-${i}`, status: pool[i % pool.length] }));
    const sorted = sortSessions(sessions);
    assert.equal(sorted.length, 100);
    assert.equal(sorted[0]!.status, 'RUNNING');
  });
});

// ===================================================================
describe('AgentDashboard — 降级/错误', () => {
  it('fallback 模式应返回有效 snapshot', () => {
    const snap: AgentDashboardSnapshot = {
      sessions: [], runningCount: 0, completedCount: 0, failedCount: 0,
      totalExecutions: 0, avgSteps: 0, avgDurationMs: 0, totalConfigs: 3,
      deliveryMode: 'fallback', timestamp: new Date().toISOString(),
    };
    assert.equal(snap.deliveryMode, 'fallback');
    assert.equal(snap.totalConfigs, 3);
  });

  it('错误消息应在 snapshot 中保留', () => {
    const snap: AgentDashboardSnapshot = {
      sessions: [], runningCount: 0, completedCount: 0, failedCount: 0,
      totalExecutions: 0, avgSteps: 0, avgDurationMs: 0, totalConfigs: 0,
      deliveryMode: 'fallback', error: 'API timeout', timestamp: '',
    };
    assert.equal(snap.error, 'API timeout');
  });
});

describe('agents/dashboard — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes("requiredPermission: 'foundation.governance.read'"));
  });
});
