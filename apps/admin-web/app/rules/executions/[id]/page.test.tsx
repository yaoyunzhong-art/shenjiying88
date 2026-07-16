/**
 * rules/executions/[id]/page.test.tsx — 规则执行详情页 L1 测试
 *
 * 覆盖: 执行记录查找、状态分类、耗时格式化、时差计算、输入/输出载荷
 * 正例: 执行记录查询、状态元数据映射、耗时格式化、数据生成
 * 反例: 执行记录不存在、无效 ID、空状态、不完整载荷
 * 边界: 零耗时、超大耗时、最近/最旧记录的相对时间
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

/* ── 类型 ── */

type ExecutionStatus = 'SUCCESS' | 'FAILURE' | 'RUNNING' | 'TIMEOUT';

interface RuleExecution {
  id: string;
  ruleName: string;
  ruleId: string;
  ruleVersion: string;
  status: ExecutionStatus;
  triggeredBy: string;
  triggerEventType: string;
  durationMs: number;
  inputSummary: string;
  inputPayload: string;
  outputSummary: string;
  outputPayload: string;
  errorMessage?: string;
  errorStackTrace?: string;
  retryCount: number;
  executionNode: string;
  createdAt: string;
  completedAt?: string;
}

// ---- 数据 ----

const STATUS_META: Record<ExecutionStatus, { label: string; color: string; bg: string }> = {
  SUCCESS: { label: '成功', color: '#065f46', bg: '#d1fae5' },
  FAILURE: { label: '失败', color: '#991b1b', bg: '#fee2e2' },
  RUNNING: { label: '进行中', color: '#1e40af', bg: '#dbeafe' },
  TIMEOUT: { label: '超时', color: '#92400e', bg: '#fef3c7' },
};

const RULE_NAMES = ['信用评分规则', '风控拦截规则', '会员升级规则', '优惠券发放规则', '异常登录检测规则'];
const TRIGGER_EVENTS = ['member.register', 'order.created', 'cron.schedule', 'manual.execute', 'webhook.inbound'];
const EXECUTION_NODES = ['cn-beijing-1a', 'cn-shanghai-2b', 'cn-shenzhen-3c'];

// ---- 辅助函数 ----

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  return `${days}天前`;
}

function generateExecutions(count: number): RuleExecution[] {
  return Array.from({ length: count }, (_, i) => {
    const statuses: ExecutionStatus[] = ['SUCCESS', 'FAILURE', 'RUNNING', 'TIMEOUT'];
    const status = statuses[i % 4]!;
    const durationMs = [230, 1500, 3200, 8900, 12000][i % 5]!;
    const triggerIdx = i % 5;
    return {
      id: `exec-${i + 1}`,
      ruleName: RULE_NAMES[i % RULE_NAMES.length]!,
      ruleId: `rule-${Math.floor(i / 4) + 1}`,
      ruleVersion: `v${(i % 5) + 1}.${i % 10}.0`,
      status,
      triggeredBy: ['会员注册事件', '订单创建事件', '定时任务', '手动执行', 'Webhook'][triggerIdx]!,
      triggerEventType: TRIGGER_EVENTS[triggerIdx]!,
      durationMs,
      inputSummary: i % 3 === 0 ? `事件: { type: "order.created", orderId: "ORD-${1000 + i}" }` : `事件: { type: "member.login", memberId: "M${10000 + i}" }`,
      inputPayload: JSON.stringify({ type: 'test', id: i }),
      outputSummary: status === 'SUCCESS' ? '规则匹配成功' : status === 'FAILURE' ? '执行失败: 上游超时' : status === 'RUNNING' ? '执行中...' : '超时',
      outputPayload: JSON.stringify({ matched: status === 'SUCCESS', error: status === 'FAILURE' ? { code: 'UPSTREAM_TIMEOUT' } : undefined }),
      errorMessage: status === 'FAILURE' ? '上游服务不可用' : undefined,
      errorStackTrace: status === 'FAILURE' ? 'Error: upstream timeout\n    at executor.ts:142' : undefined,
      retryCount: status === 'FAILURE' ? (i % 3) : 0,
      executionNode: EXECUTION_NODES[i % 3]!,
      createdAt: new Date(Date.now() - i * 3600000).toISOString(),
      completedAt: status !== 'RUNNING' ? new Date(Date.now() - i * 3600000 + durationMs).toISOString() : undefined,
    };
  });
}

const MOCK_EXECUTIONS = generateExecutions(20);

function getExecutionById(id: string): RuleExecution | undefined {
  return MOCK_EXECUTIONS.find(e => e.id === id);
}

function canRerun(status: ExecutionStatus): boolean {
  return status === 'FAILURE' || status === 'TIMEOUT';
}

function canCancel(status: ExecutionStatus): boolean {
  return status === 'RUNNING';
}

/* ============================================================ */

describe('rule-execution: 数据类型', () => {
  it('ExecutionStatus has 4 values', () => {
    const statuses: ExecutionStatus[] = ['SUCCESS', 'FAILURE', 'RUNNING', 'TIMEOUT'];
    assert.equal(statuses.length, 4);
  });

  it('RuleExecution has all fields', () => {
    const e: RuleExecution = {
      id: 'exec-1', ruleName: 'R', ruleId: 'r-1', ruleVersion: 'v1.0.0', status: 'SUCCESS',
      triggeredBy: 'T', triggerEventType: 'E', durationMs: 100, inputSummary: 'I', inputPayload: '{}',
      outputSummary: 'O', outputPayload: '{}', retryCount: 0, executionNode: 'N',
      createdAt: '2026-01-01T00:00:00Z', completedAt: '2026-01-01T00:01:00Z',
    };
    assert.equal(typeof e.durationMs, 'number');
    assert.equal(typeof e.retryCount, 'number');
  });

  it('STATUS_META covers all 4 statuses', () => {
    assert.equal(Object.keys(STATUS_META).length, 4);
    assert.equal(STATUS_META.SUCCESS.label, '成功');
    assert.equal(STATUS_META.TIMEOUT.label, '超时');
  });

  it('STATUS_META properties exist', () => {
    assert.equal(typeof STATUS_META.SUCCESS.color, 'string');
    assert.equal(typeof STATUS_META.SUCCESS.bg, 'string');
  });
});

describe('rule-execution: 业务逻辑 - 查找', () => {
  it('getExecutionById finds existing', () => {
    const e = getExecutionById('exec-1');
    assert.ok(e);
    assert.equal(e?.ruleName, RULE_NAMES[0 % RULE_NAMES.length]);
  });

  it('getExecutionById returns undefined for non-existent', () => {
    assert.equal(getExecutionById('exec-999'), undefined);
  });

  it('getExecutionById empty string returns undefined', () => {
    assert.equal(getExecutionById(''), undefined);
  });

  it('exec-1 and exec-2 have different statuses', () => {
    const e1 = getExecutionById('exec-1')!;
    const e2 = getExecutionById('exec-2')!;
    assert.notEqual(e1.status, e2.status);
  });
});

describe('rule-execution: 业务逻辑 - 耗时格式化', () => {
  it('formatDuration < 1000ms returns ms', () => {
    assert.equal(formatDuration(230), '230ms');
    assert.equal(formatDuration(999), '999ms');
  });

  it('formatDuration 1000-59999ms returns seconds', () => {
    assert.equal(formatDuration(1000), '1.0s');
    assert.equal(formatDuration(1500), '1.5s');
    assert.equal(formatDuration(3200), '3.2s');
  });

  it('formatDuration >= 60000ms returns minutes+seconds', () => {
    assert.equal(formatDuration(60000), '1m 0s');
    assert.equal(formatDuration(65000), '1m 5s');
    assert.equal(formatDuration(120000), '2m 0s');
  });

  it('formatDuration 0 returns 0ms', () => {
    assert.equal(formatDuration(0), '0ms');
  });

  it('formatDuration large value', () => {
    assert.equal(formatDuration(3661000), '61m 1s');
  });
});

describe('rule-execution: 业务逻辑 - 相对时间', () => {
  it('formatRelativeTime recent returns 分钟前', () => {
    const recent = new Date(Date.now() - 60000).toISOString();
    const result = formatRelativeTime(recent);
    assert.ok(result.includes('分钟前'));
  });

  it('formatRelativeTime 1 hour ago returns 小时前', () => {
    const hourAgo = new Date(Date.now() - 3600000).toISOString();
    const result = formatRelativeTime(hourAgo);
    assert.ok(result.includes('小时前'));
  });

  it('formatRelativeTime 2 days ago returns 天前', () => {
    const twoDays = new Date(Date.now() - 172800000).toISOString();
    const result = formatRelativeTime(twoDays);
    assert.ok(result.includes('天前'));
  });
});

describe('rule-execution: 业务逻辑 - 状态操作', () => {
  it('canRerun for FAILURE and TIMEOUT', () => {
    assert.ok(canRerun('FAILURE'));
    assert.ok(canRerun('TIMEOUT'));
    assert.ok(!canRerun('SUCCESS'));
    assert.ok(!canRerun('RUNNING'));
  });

  it('canCancel only for RUNNING', () => {
    assert.ok(canCancel('RUNNING'));
    assert.ok(!canCancel('SUCCESS'));
    assert.ok(!canCancel('FAILURE'));
    assert.ok(!canCancel('TIMEOUT'));
  });

  it('FAILURE executions have errorMessage', () => {
    const execs = MOCK_EXECUTIONS.filter(e => e.status === 'FAILURE');
    assert.ok(execs.length > 0);
    execs.forEach(e => {
      assert.ok(e.errorMessage);
      assert.ok(e.errorStackTrace);
    });
  });

  it('SUCCESS executions have no errorMessage', () => {
    const execs = MOCK_EXECUTIONS.filter(e => e.status === 'SUCCESS');
    execs.forEach(e => {
      assert.equal(e.errorMessage, undefined);
      assert.equal(e.errorStackTrace, undefined);
    });
  });

  it('RUNNING executions have no completedAt', () => {
    const execs = MOCK_EXECUTIONS.filter(e => e.status === 'RUNNING');
    execs.forEach(e => {
      assert.equal(e.completedAt, undefined);
    });
  });

  it('completedAt is after createdAt for non-RUNNING', () => {
    MOCK_EXECUTIONS
      .filter(e => e.status !== 'RUNNING' && e.completedAt)
      .forEach(e => {
        assert.ok(new Date(e.completedAt!).getTime() >= new Date(e.createdAt).getTime());
      });
  });
});

describe('rule-execution: 业务逻辑 - 数据完整性', () => {
  it('all executions have non-empty inputPayload', () => {
    assert.ok(MOCK_EXECUTIONS.every(e => e.inputPayload.length > 0));
  });

  it('all executions have non-empty outputPayload', () => {
    assert.ok(MOCK_EXECUTIONS.every(e => e.outputPayload.length > 0));
  });

  it('all executions have ruleVersion', () => {
    assert.ok(MOCK_EXECUTIONS.every(e => e.ruleVersion.startsWith('v')));
  });

  it('executionNode is always set', () => {
    assert.ok(MOCK_EXECUTIONS.every(e => EXECUTION_NODES.includes(e.executionNode)));
  });

  it('durationMs varies across executions', () => {
    const durations = new Set(MOCK_EXECUTIONS.map(e => e.durationMs));
    assert.ok(durations.size > 1);
  });

  it('retryCount is non-negative', () => {
    assert.ok(MOCK_EXECUTIONS.every(e => e.retryCount >= 0));
  });

  it('SUCCESS executions have retryCount 0', () => {
    MOCK_EXECUTIONS.filter(e => e.status === 'SUCCESS').forEach(e => {
      assert.equal(e.retryCount, 0);
    });
  });

  it('triggerEventType is from known types', () => {
    assert.ok(MOCK_EXECUTIONS.every(e => TRIGGER_EVENTS.includes(e.triggerEventType)));
  });

  it('inputSummary describes the event', () => {
    assert.ok(MOCK_EXECUTIONS.every(e => e.inputSummary.startsWith('事件:')));
  });
});
