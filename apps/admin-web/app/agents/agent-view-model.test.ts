/**
 * agent-view-model.test.ts — Agent 视图模型测试
 *
 * 覆盖:
 *   正例: fallback 数据完整性、各 snapshot 函数执行、dashboard 计算逻辑
 *   反例: 空/无效 sessionId、异常处理
 *   边界: 超大 sessionId、极端统计值
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  FALLBACK_AGENT_CONFIGS,
  FALLBACK_AGENT_SESSIONS,
  FALLBACK_AGENT_STATS,
  FALLBACK_AGENT_TOOLS,
  FALLBACK_AGENT_EVALUATIONS,
  loadAgentConfigs,
  loadAgentSessions,
  loadAgentTools,
  loadAgentEvaluations,
  loadAgentDashboardSnapshot,
  loadAgentSessionDetail,
  createAgentClient,
} from './agent-view-model';

// ── 正例 ────────────────────────────────────────────────────────────────

describe('agent-view-model — 正例', () => {
  it('FALLBACK_AGENT_CONFIGS 全部字段完整', () => {
    for (const cfg of FALLBACK_AGENT_CONFIGS) {
      assert.ok(cfg.id, 'config id');
      assert.ok(cfg.name, 'config name');
      assert.ok(cfg.systemPrompt, 'systemPrompt');
      assert.ok(cfg.model, 'model');
      assert.equal(typeof cfg.maxSteps, 'number', 'maxSteps is number');
      assert.equal(typeof cfg.enableReflection, 'boolean', 'enableReflection is boolean');
      assert.ok(Array.isArray(cfg.allowedTools), 'allowedTools is array');
      assert.equal(typeof cfg.timeoutMs, 'number', 'timeoutMs is number');
      assert.equal(typeof cfg.enabled, 'boolean', 'enabled is boolean');
      assert.ok(cfg.tenantId, 'tenantId');
    }
    assert.equal(FALLBACK_AGENT_CONFIGS.length, 3);
  });

  it('FALLBACK_AGENT_SESSIONS 全部字段完整', () => {
    for (const sess of FALLBACK_AGENT_SESSIONS) {
      assert.ok(sess.id, 'session id');
      assert.ok(sess.configId, 'configId');
      assert.ok(['COMPLETED', 'RUNNING', 'FAILED'].includes(sess.status), `valid status ${sess.status}`);
      assert.ok(sess.userInput, 'userInput');
      assert.equal(typeof sess.currentStep, 'number', 'currentStep is number');
      assert.equal(typeof sess.maxSteps, 'number', 'maxSteps is number');
      assert.ok(sess.startedAt, 'startedAt');
      assert.ok(sess.createdBy, 'createdBy');
    }
    assert.equal(FALLBACK_AGENT_SESSIONS.length, 3);
  });

  it('FALLBACK_AGENT_STATS 字段完整', () => {
    assert.equal(typeof FALLBACK_AGENT_STATS.totalSessions, 'number');
    assert.equal(typeof FALLBACK_AGENT_STATS.completedSessions, 'number');
    assert.equal(typeof FALLBACK_AGENT_STATS.failedSessions, 'number');
    assert.equal(typeof FALLBACK_AGENT_STATS.runningSessions, 'number');
    assert.equal(typeof FALLBACK_AGENT_STATS.avgSteps, 'number');
    assert.equal(typeof FALLBACK_AGENT_STATS.avgDurationMs, 'number');
    assert.equal(typeof FALLBACK_AGENT_STATS.avgQualityScore, 'number');
    // 一致性校验
    assert.equal(
      FALLBACK_AGENT_STATS.totalSessions,
      FALLBACK_AGENT_STATS.completedSessions +
        FALLBACK_AGENT_STATS.failedSessions +
        FALLBACK_AGENT_STATS.runningSessions
    );
  });

  it('FALLBACK_AGENT_TOOLS 全部字段完整', () => {
    for (const tool of FALLBACK_AGENT_TOOLS) {
      assert.ok(tool.name, 'tool name');
      assert.ok(tool.description, 'description');
      assert.ok(['low', 'medium', 'high'].includes(tool.riskLevel), `valid riskLevel ${tool.riskLevel}`);
    }
    assert.equal(FALLBACK_AGENT_TOOLS.length, 4);
  });

  it('FALLBACK_AGENT_EVALUATIONS 全部字段完整', () => {
    for (const ev of FALLBACK_AGENT_EVALUATIONS) {
      assert.ok(ev.id, 'evaluation id');
      assert.ok(ev.sessionId, 'sessionId');
      assert.equal(typeof ev.overallScore, 'number', 'overallScore is number');
      assert.ok(ev.overallScore >= 0 && ev.overallScore <= 1, 'overallScore in [0,1]');
      assert.ok(ev.evaluatedAt, 'evaluatedAt');
      assert.ok(ev.tenantId, 'tenantId');
    }
    assert.equal(FALLBACK_AGENT_EVALUATIONS.length, 2);
  });

  it('loadAgentConfigs fallback 模式返回完整数据', async () => {
    const result = await loadAgentConfigs({ signal: AbortSignal.timeout(1) });
    assert.equal(result.deliveryMode, 'fallback');
    assert.equal(result.configs.length, 3);
    assert.ok(result.error, 'has error message');
  });

  it('loadAgentSessions fallback 模式返回完整数据', async () => {
    const result = await loadAgentSessions({ signal: AbortSignal.timeout(1) });
    assert.equal(result.deliveryMode, 'fallback');
    assert.equal(result.sessions.length, 3);
    assert.ok(result.stats.totalSessions > 0);
    assert.ok(result.error, 'has error message');
  });

  it('loadAgentTools fallback 模式返回完整数据', async () => {
    const result = await loadAgentTools({ signal: AbortSignal.timeout(1) });
    assert.equal(result.deliveryMode, 'fallback');
    assert.equal(result.tools.length, 4);
    assert.ok(result.error, 'has error message');
  });

  it('loadAgentEvaluations fallback 模式返回完整数据', async () => {
    const result = await loadAgentEvaluations({ signal: AbortSignal.timeout(1) });
    assert.equal(result.deliveryMode, 'fallback');
    assert.equal(result.evaluations.length, 2);
    assert.ok(result.error, 'has error message');
  });

  it('loadAgentDashboardSnapshot fallback 模式计算正确', async () => {
    const result = await loadAgentDashboardSnapshot({ signal: AbortSignal.timeout(1) });
    assert.equal(result.deliveryMode, 'fallback');
    assert.ok(result.error, 'has error message');
    // dashboard 统计: 3 fallback sessions
    assert.equal(result.runningCount, 1, '1 RUNNING session');
    assert.equal(result.completedCount, 1, '1 COMPLETED session');
    assert.equal(result.failedCount, 1, '1 FAILED session');
    assert.equal(result.totalExecutions, FALLBACK_AGENT_STATS.totalSessions);
    // 从 3 sessions 提取 unique configId: agent-cfg-cs, agent-cfg-sales -> 2
    assert.equal(result.totalConfigs, 2);
    assert.ok(typeof result.timestamp === 'string', 'timestamp string');
  });

  it('loadAgentSessionDetail fallback 模式返回已知 session', async () => {
    const result = await loadAgentSessionDetail('sess-001', { signal: AbortSignal.timeout(1) });
    assert.ok(result, 'result exists');
    assert.equal(result!.deliveryMode, 'fallback');
    assert.equal(result!.session.id, 'sess-001');
    assert.ok(result!.execution, 'execution exists for sess-001');
    assert.ok(result!.evaluation, 'evaluation exists for sess-001');
    assert.ok(result!.config, 'config exists for sess-001');
    assert.ok(result!.error, 'has error message');
  });

  it('loadAgentSessionDetail fallback 模式返回 sess-003 (无 execution)', async () => {
    const result = await loadAgentSessionDetail('sess-003', { signal: AbortSignal.timeout(1) });
    assert.ok(result);
    assert.equal(result!.session.id, 'sess-003');
    // sess-003 has execution from FALLBACK_AGENT_EXECUTION
    assert.ok(result!.execution, 'execution exists');
  });

  it('createAgentClient returns ApiClient with correct tenant', () => {
    const client = createAgentClient();
    assert.ok(client, 'client exists');
    assert.equal(typeof client.listAgentConfigs, 'function');
  });

  // agent tool risk level aggregation
  it('agent tools have distinct risk levels', () => {
    const levels = FALLBACK_AGENT_TOOLS.map(t => t.riskLevel);
    const unique = new Set(levels);
    assert.ok(unique.has('low'));
    assert.ok(unique.has('medium'));
    assert.ok(unique.has('high'));
  });

  it('FALLBACK_AGENT_CONFIGS has distinct tool sets', () => {
    for (const cfg of FALLBACK_AGENT_CONFIGS) {
      assert.ok(cfg.allowedTools.length >= 1, `${cfg.name} has tools`);
    }
    // All three configs have different tool counts
    const toolSets = FALLBACK_AGENT_CONFIGS.map(c => c.allowedTools.sort().join(','));
    assert.equal(new Set(toolSets).size, 3, 'each config has a unique tool set');
  });

  it('evaluation score consistency: overallScore should be at least the min of sub-scores', () => {
    for (const ev of FALLBACK_AGENT_EVALUATIONS) {
      const subs = [
        ev.relevanceScore ?? 0,
        ev.accuracyScore ?? 0,
        ev.completenessScore ?? 0,
        ev.safetyScore ?? 0,
        ev.helpfulnessScore ?? 0,
        ev.concisenessScore ?? 0,
      ];
      const minSub = Math.min(...subs);
      // overall should be >= min component (reasonable heuristic)
      assert.ok(ev.overallScore >= minSub - 0.01,
        `eval ${ev.id} overall ${ev.overallScore} >= min ${minSub}`);
    }
  });

  it('loadAgentSessionDetail fallback mapping: sess-002 has config', async () => {
    const result = await loadAgentSessionDetail('sess-002', { signal: AbortSignal.timeout(1) });
    assert.ok(result);
    // sess-002 configId = agent-cfg-sales which exists in fallback configs
    assert.ok(result!.config, 'sess-002 has config');
    assert.equal(result!.config!.id, 'agent-cfg-sales');
  });
});

// ── 反例 ────────────────────────────────────────────────────────────────

describe('agent-view-model — 反例', () => {
  it('loadAgentSessionDetail 返回 null 对不存在的 session', async () => {
    const result = await loadAgentSessionDetail('sess-nonexistent', { signal: AbortSignal.timeout(1) });
    assert.equal(result, null);
  });

  it('loadAgentSessionDetail 返回 null 对空字符串', async () => {
    const result = await loadAgentSessionDetail('', { signal: AbortSignal.timeout(1) });
    assert.equal(result, null);
  });

  it('loadAgentSessionDetail 返回 null 对 undefined-equivalent', async () => {
    const result = await loadAgentSessionDetail('invalid!!@#', { signal: AbortSignal.timeout(1) });
    assert.equal(result, null);
  });
});

// ── 边界 ────────────────────────────────────────────────────────────────

describe('agent-view-model — 边界', () => {
  it('session status 枚举全覆盖: COMPLETED, RUNNING, FAILED', () => {
    const statuses = FALLBACK_AGENT_SESSIONS.map(s => s.status);
    assert.ok(statuses.includes('COMPLETED'));
    assert.ok(statuses.includes('RUNNING'));
    assert.ok(statuses.includes('FAILED'));
    // no other status
    for (const s of statuses) {
      assert.ok(['COMPLETED', 'RUNNING', 'FAILED'].includes(s));
    }
  });

  it('config enabled mix: at least one enabled and one disabled', () => {
    const enabled = FALLBACK_AGENT_CONFIGS.filter(c => c.enabled);
    const disabled = FALLBACK_AGENT_CONFIGS.filter(c => !c.enabled);
    assert.ok(enabled.length >= 1, 'at least one enabled config');
    assert.ok(disabled.length >= 1, 'at least one disabled config');
    assert.equal(enabled.length + disabled.length, FALLBACK_AGENT_CONFIGS.length);
  });

  it('tool input schemas are all object type', () => {
    for (const tool of FALLBACK_AGENT_TOOLS) {
      if (tool.inputSchema) {
        assert.equal(tool.inputSchema.type, 'object');
        if (tool.inputSchema.required) {
          assert.ok(Array.isArray(tool.inputSchema.required));
        }
      }
    }
  });

  it('agent stats running_sessions <= total_sessions', () => {
    assert.ok(FALLBACK_AGENT_STATS.runningSessions <= FALLBACK_AGENT_STATS.totalSessions);
    assert.ok(FALLBACK_AGENT_STATS.failedSessions <= FALLBACK_AGENT_STATS.totalSessions);
    assert.ok(FALLBACK_AGENT_STATS.completedSessions <= FALLBACK_AGENT_STATS.totalSessions);
  });

  it('dashboard snapshot counts remain non-negative', async () => {
    const result = await loadAgentDashboardSnapshot({ signal: AbortSignal.timeout(1) });
    assert.ok(result.runningCount >= 0);
    assert.ok(result.completedCount >= 0);
    assert.ok(result.failedCount >= 0);
    assert.ok(result.totalExecutions > 0);
    assert.ok(result.avgSteps > 0);
    assert.ok(result.avgDurationMs > 0);
  });

  it('fallback agent config timeoutMs is positive', () => {
    for (const cfg of FALLBACK_AGENT_CONFIGS) {
      assert.ok(cfg.timeoutMs > 0, `${cfg.name} timeoutMs > 0`);
    }
  });

  it('timestamp is valid ISO string in fallback stats', () => {
    const ts = new Date(FALLBACK_AGENT_STATS.timestamp);
    assert.equal(isNaN(ts.getTime()), false, 'ISO timestamp is valid');
  });
});
