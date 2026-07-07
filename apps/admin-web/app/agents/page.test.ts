/**
 * agents/page.test.ts — Page-level tests for the Agent modules.
 * Tests fallback data integrity, page-level filter/stat helpers, config operations.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: agent-view-model.ts, sub-module page.tsx
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  FALLBACK_AGENT_CONFIGS,
  FALLBACK_AGENT_SESSIONS,
  FALLBACK_AGENT_STATS,
  FALLBACK_AGENT_TOOLS,
  FALLBACK_AGENT_EVALUATIONS,
  FALLBACK_TENANT_ID,
  FALLBACK_USER_ID,
  createAgentClient,
  type FallbackTool,
} from './agent-view-model';

import type { AgentConfig } from '@m5/types';

// ---- Page-level helper replicas (same logic as page.tsx components) ----

function countByEnabled(configs: AgentConfig[]) {
  return {
    total: configs.length,
    enabled: configs.filter((c) => c.enabled).length,
    disabled: configs.filter((c) => !c.enabled).length,
    reflection: configs.filter((c) => c.enableReflection).length,
  };
}

function computeSessionStats(configs: AgentConfig[]) {
  return {
    totalSessions: FALLBACK_AGENT_STATS.totalSessions,
    runningSessions: FALLBACK_AGENT_STATS.runningSessions,
    avgSteps: FALLBACK_AGENT_STATS.avgSteps,
    avgDurationMs: FALLBACK_AGENT_STATS.avgDurationMs,
  };
}

function computeEvaluationPassRate(evaluations: typeof FALLBACK_AGENT_EVALUATIONS) {
  const passed = evaluations.filter((e) => e.overallScore >= 0.6).length;
  return {
    total: evaluations.length,
    passed,
    passRate: evaluations.length > 0 ? (passed / evaluations.length) * 100 : 0,
    avgOverallScore:
      evaluations.length > 0
        ? evaluations.reduce((s, e) => s + e.overallScore, 0) / evaluations.length
        : 0,
  };
}

const STATUS_RANK: Record<string, number> = {
  RUNNING: 0,
  PENDING: 1,
  COMPLETED: 2,
  FAILED: 3,
  CANCELLED: 4,
};

function sortSessionsByStatus(sessions: typeof FALLBACK_AGENT_SESSIONS) {
  return [...sessions].sort(
    (a, b) => (STATUS_RANK[a.status] ?? 99) - (STATUS_RANK[b.status] ?? 99),
  );
}

function countByRiskLevel(tools: FallbackTool[]) {
  return {
    total: tools.length,
    high: tools.filter((t) => t.riskLevel === 'high').length,
    medium: tools.filter((t) => t.riskLevel === 'medium').length,
    low: tools.filter((t) => t.riskLevel === 'low').length,
  };
}

// ---- 正例 ----

describe('agents-page: 正例 (positive cases)', () => {
  describe('fallback data integrity', () => {
    it('FALLBACK_AGENT_CONFIGS should have 3 configs with expected fields', () => {
      assert.strictEqual(FALLBACK_AGENT_CONFIGS.length, 3);
      for (const c of FALLBACK_AGENT_CONFIGS) {
        assert.ok(c.id.startsWith('agent-cfg-'), `unexpected id: ${c.id}`);
        assert.ok(c.name.length > 0);
        assert.ok(c.systemPrompt.length > 0);
        assert.ok(c.createdAt);
        assert.ok(c.updatedAt);
        assert.strictEqual(c.tenantId, FALLBACK_TENANT_ID);
      }
    });

    it('FALLBACK_AGENT_SESSIONS should have 3 sessions with valid statuses', () => {
      const validStatuses = ['COMPLETED', 'RUNNING', 'FAILED', 'PENDING', 'CANCELLED'];
      assert.strictEqual(FALLBACK_AGENT_SESSIONS.length, 3);
      for (const s of FALLBACK_AGENT_SESSIONS) {
        assert.ok(validStatuses.includes(s.status), `invalid status: ${s.status}`);
        assert.ok(s.createdBy, FALLBACK_USER_ID);
        assert.strictEqual(s.tenantId, FALLBACK_TENANT_ID);
      }
      // One of each status
      const statuses = FALLBACK_AGENT_SESSIONS.map((s) => s.status);
      assert.ok(statuses.includes('COMPLETED'));
      assert.ok(statuses.includes('RUNNING'));
      assert.ok(statuses.includes('FAILED'));
    });

    it('FALLBACK_AGENT_STATS should have valid numeric properties', () => {
      assert.ok(FALLBACK_AGENT_STATS.totalSessions >= 0);
      assert.ok(FALLBACK_AGENT_STATS.completedSessions >= 0);
      assert.ok(FALLBACK_AGENT_STATS.failedSessions >= 0);
      assert.ok(FALLBACK_AGENT_STATS.runningSessions >= 0);
      assert.ok(FALLBACK_AGENT_STATS.avgSteps > 0);
      assert.ok(FALLBACK_AGENT_STATS.avgDurationMs > 0);
      assert.ok(FALLBACK_AGENT_STATS.avgQualityScore >= 0 && FALLBACK_AGENT_STATS.avgQualityScore <= 1);
      assert.ok(FALLBACK_AGENT_STATS.timestamp);
      assert.strictEqual(FALLBACK_AGENT_STATS.tenantId, FALLBACK_TENANT_ID);
    });

    it('FALLBACK_AGENT_TOOLS should have 4 tools with required fields', () => {
      assert.strictEqual(FALLBACK_AGENT_TOOLS.length, 4);
      for (const t of FALLBACK_AGENT_TOOLS) {
        assert.ok(typeof t.name === 'string');
        assert.ok(typeof t.description === 'string');
        assert.ok(['low', 'medium', 'high'].includes(t.riskLevel));
        assert.ok(t.inputSchema);
        assert.strictEqual(t.inputSchema?.type, 'object');
      }
    });

    it('FALLBACK_AGENT_EVALUATIONS should have 2 evaluations with score ranges', () => {
      assert.strictEqual(FALLBACK_AGENT_EVALUATIONS.length, 2);
      for (const e of FALLBACK_AGENT_EVALUATIONS) {
        assert.ok(e.overallScore >= 0 && e.overallScore <= 1);
        assert.ok(e.relevanceScore >= 0 && e.relevanceScore <= 1);
        assert.ok(e.accuracyScore >= 0 && e.accuracyScore <= 1);
        assert.ok(e.safetyScore >= 0 && e.safetyScore <= 1);
        assert.strictEqual(e.tenantId, FALLBACK_TENANT_ID);
      }
    });
  });

  describe('createAgentClient', () => {
    it('should create an ApiClient with fallback tenant', () => {
      const client = createAgentClient();
      assert.ok(client);
      assert.ok(typeof client.listAgentConfigs === 'function');
      assert.ok(typeof client.listAgentSessions === 'function');
      assert.ok(typeof client.getAgentStats === 'function');
      assert.ok(typeof client.listAgentTools === 'function');
    });
  });

  describe('config page stat helpers (countByEnabled)', () => {
    it('should compute enabled/disabled/reflection counts', () => {
      const stats = countByEnabled(FALLBACK_AGENT_CONFIGS);
      assert.strictEqual(stats.total, 3);
      assert.strictEqual(stats.enabled, 2);
      assert.strictEqual(stats.disabled, 1);
      assert.strictEqual(stats.reflection, 2);
    });
  });

  describe('session page stat helpers (computeSessionStats)', () => {
    it('should return stats matching FALLBACK_AGENT_STATS', () => {
      const stats = computeSessionStats(FALLBACK_AGENT_CONFIGS);
      assert.strictEqual(stats.totalSessions, 1287);
      assert.strictEqual(stats.runningSessions, 3);
      assert.strictEqual(stats.avgSteps, 4.2);
      assert.strictEqual(stats.avgDurationMs, 5230);
    });
  });

  describe('evaluation page stat helpers (computeEvaluationPassRate)', () => {
    it('should compute pass rate from evaluations', () => {
      const result = computeEvaluationPassRate(FALLBACK_AGENT_EVALUATIONS);
      assert.strictEqual(result.total, 2);
      // eval-001: 0.93 >= 0.6, eval-002: 0.52 < 0.6 → 1 passed
      assert.strictEqual(result.passed, 1);
      assert.strictEqual(result.passRate, 50);
      assert.strictEqual(result.avgOverallScore, (0.93 + 0.52) / 2);
    });
  });

  describe('dashboard session sorting by status (sortSessionsByStatus)', () => {
    it('should sort sessions: RUNNING > PENDING > COMPLETED > FAILED > CANCELLED', () => {
      const sorted = sortSessionsByStatus(FALLBACK_AGENT_SESSIONS);
      assert.strictEqual(sorted[0]!.status, 'RUNNING');
      assert.strictEqual(sorted[1]!.status, 'COMPLETED');
      assert.strictEqual(sorted[2]!.status, 'FAILED');
    });
  });

  describe('tools page stat helpers (countByRiskLevel)', () => {
    it('should compute risk level distribution', () => {
      const stats = countByRiskLevel(FALLBACK_AGENT_TOOLS);
      assert.strictEqual(stats.total, 4);
      assert.strictEqual(stats.high, 1); // refund_create
      assert.strictEqual(stats.medium, 1); // crm_lookup
      assert.strictEqual(stats.low, 2); // order_query, knowledge_search
    });

    it('should have agent-cfg-ops as disabled (enableReflection: false)', () => {
      const disabled = FALLBACK_AGENT_CONFIGS.filter((c) => !c.enabled);
      assert.strictEqual(disabled.length, 1);
      assert.strictEqual(disabled[0]!.id, 'agent-cfg-ops');
    });
  });
});

// ---- 反例 ----

describe('agents-page: 反例 (negative cases)', () => {
  it('empty configs array should yield zero counts', () => {
    const stats = countByEnabled([]);
    assert.deepStrictEqual(stats, { total: 0, enabled: 0, disabled: 0, reflection: 0 });
  });

  it('empty evaluation array should yield zero pass rate', () => {
    const result = computeEvaluationPassRate([]);
    assert.strictEqual(result.total, 0);
    assert.strictEqual(result.passed, 0);
    assert.strictEqual(result.passRate, 0);
    assert.strictEqual(result.avgOverallScore, 0);
  });

  it('empty tools array should yield zero risk counts', () => {
    const stats = countByRiskLevel([]);
    assert.deepStrictEqual(stats, { total: 0, high: 0, medium: 0, low: 0 });
  });
});

// ---- 边界 ----

describe('agents-page: 边界 (boundary cases)', () => {
  it('FALLBACK_AGENT_CONFIGS timeoutMs should be within [1000, 360000]', () => {
    for (const c of FALLBACK_AGENT_CONFIGS) {
      assert.ok(c.timeoutMs >= 1000, `timeoutMs too low for ${c.id}: ${c.timeoutMs}`);
      assert.ok(c.timeoutMs <= 360000, `timeoutMs too high for ${c.id}: ${c.timeoutMs}`);
    }
  });

  it('FALLBACK_AGENT_CONFIGS maxSteps should be between 1 and 20', () => {
    for (const c of FALLBACK_AGENT_CONFIGS) {
      assert.ok(c.maxSteps >= 1 && c.maxSteps <= 20, `maxSteps out of range for ${c.id}: ${c.maxSteps}`);
    }
  });

  it('FALLBACK_AGENT_SESSIONS FAILED session should have an error field', () => {
    const failed = FALLBACK_AGENT_SESSIONS.find((s) => s.status === 'FAILED');
    assert.ok(failed, 'Expected a FAILED session');
    assert.ok(failed!.error, 'FAILED session should have error message');
  });

  it('FALLBACK_AGENT_SESSIONS RUNNING session should not have completedAt', () => {
    const running = FALLBACK_AGENT_SESSIONS.find((s) => s.status === 'RUNNING');
    assert.ok(running, 'Expected a RUNNING session');
    assert.strictEqual(running!.completedAt, undefined);
  });

  it('config model should contain deepseek-v4 for all configs', () => {
    for (const c of FALLBACK_AGENT_CONFIGS) {
      assert.strictEqual(c.model, 'deepseek-v4');
    }
  });
});
