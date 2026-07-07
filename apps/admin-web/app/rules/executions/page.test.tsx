/**
 * rules/executions/page.test.tsx — 规则执行结果列表页 L1 测试
 *
 * 覆盖:
 *   正例 — formatDuration / formatDate / 状态筛选 / 时间范围筛选 / 搜索 / 分页 / mock 数据完整性
 *   反例 — 空搜索无匹配 / 非法状态 / 空列表分页
 *   边界 — 零耗时 / 毫秒与秒转换 / 超长时间 / 时间边界
 */
import { describe, it, before } from 'node:test';
import assert from 'node:assert';

// ── 工具函数 (mirror page.tsx) ──

type ExecutionStatus = 'SUCCESS' | 'FAILURE' | 'RUNNING' | 'TIMEOUT';
type TimeRange = '24h' | '7d' | '30d' | 'all';

interface RuleExecution {
  id: string;
  ruleName: string;
  ruleId: string;
  status: ExecutionStatus;
  triggeredBy: string;
  durationMs: number;
  inputSummary: string;
  outputSummary: string;
  errorMessage?: string;
  createdAt: string;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

const STATUS_COLORS: Record<ExecutionStatus, string> = {
  SUCCESS: '#065f46',
  FAILURE: '#991b1b',
  RUNNING: '#1e40af',
  TIMEOUT: '#92400e',
};

const STATUS_BG: Record<ExecutionStatus, string> = {
  SUCCESS: '#d1fae5',
  FAILURE: '#fee2e2',
  RUNNING: '#dbeafe',
  TIMEOUT: '#fef3c7',
};

function searchExecutions(items: RuleExecution[], query: string): RuleExecution[] {
  if (!query.trim()) return items;
  const q = query.toLowerCase();
  return items.filter(
    (e) =>
      e.ruleName.toLowerCase().includes(q) ||
      e.id.toLowerCase().includes(q) ||
      e.ruleId.toLowerCase().includes(q)
  );
}

function filterByStatus(items: RuleExecution[], status: ExecutionStatus | ''): RuleExecution[] {
  if (!status) return items;
  return items.filter((e) => e.status === status);
}

function filterByTimeRange(items: RuleExecution[], range: TimeRange): RuleExecution[] {
  if (range === 'all') return items;
  const cutoff =
    range === '24h' ? 86_400_000 :
    range === '7d'  ? 604_800_000 :
                      2_592_000_000;
  const now = mockNow;
  return items.filter((e) => new Date(e.createdAt).getTime() >= now - cutoff);
}

function sortByCreatedAtDesc(items: RuleExecution[]): RuleExecution[] {
  return [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

function paginate<T>(items: T[], page: number, pageSize: number): T[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

// 链式过滤（模拟页面 useMemo）
function fullFilterChain(
  items: RuleExecution[],
  search: string,
  status: ExecutionStatus | '',
  timeRange: TimeRange,
): RuleExecution[] {
  let result = searchExecutions(items, search);
  result = filterByStatus(result, status);
  result = filterByTimeRange(result, timeRange);
  return sortByCreatedAtDesc(result);
}

const PAGE_SIZE = 10;

// ── MOCK 数据 ──

let mockNow: number;
let mockExecutions: RuleExecution[];
let mockAllStatuses: ExecutionStatus[];

// 固定时间戳，方便边界测试
const BASE_TIME = new Date('2026-06-30T12:00:00Z').getTime();

before(() => {
  mockNow = BASE_TIME;

  mockAllStatuses = ['SUCCESS', 'FAILURE', 'RUNNING', 'TIMEOUT'];
  const ruleNames = ['信用评分规则', '风控拦截规则', '会员升级规则', '优惠券发放规则', '异常登录检测规则', '批量通知规则', '库存预警规则'];
  const triggers = ['会员注册事件', '订单创建事件', '定时任务', '手动执行', 'Webhook'];
  const durations = [230, 1500, 3200, 8900, 12_000];

  mockExecutions = Array.from({ length: 47 }, (_, i) => {
    const status = mockAllStatuses[i % 4];
    const durationMs = durations[i % 5];
    return {
      id: `exec-${i + 1}`,
      ruleName: ruleNames[i % 7],
      ruleId: `rule-${Math.floor(i / 4) + 1}`,
      status,
      triggeredBy: triggers[i % 5],
      durationMs: durationMs,
      inputSummary: i % 3 === 0
        ? `事件: { type: "order.created", orderId: "ORD-${1000 + i}" }`
        : `事件: { type: "member.login", memberId: "M${10000 + i}" }`,
      outputSummary: status === 'SUCCESS'
        ? '规则匹配 → 动作已分发'
        : status === 'FAILURE'
          ? '执行失败: 上游接口超时 (HTTP 504)'
          : status === 'RUNNING'
            ? '规则逻辑执行中...'
            : '超时: 超过最大执行时长 10s',
      errorMessage: status === 'FAILURE'
        ? ['unavailable', 'rate-limited', 'internal-error'][i % 3]
        : undefined,
      createdAt: new Date(BASE_TIME - i * 3_600_000 - Math.random() * 86_400_000).toISOString(),
    };
  });
});

// ════════════════════════════════════════
// 正例 (Positive Cases)
// ════════════════════════════════════════

describe('rules-executions-page: 正例', () => {
  describe('formatDuration', () => {
    it('should format milliseconds (< 1s)', () => {
      assert.strictEqual(formatDuration(0), '0ms');
      assert.strictEqual(formatDuration(230), '230ms');
      assert.strictEqual(formatDuration(999), '999ms');
    });

    it('should format seconds (1s ~ 60s)', () => {
      assert.strictEqual(formatDuration(1000), '1.0s');
      assert.strictEqual(formatDuration(1500), '1.5s');
      assert.strictEqual(formatDuration(59000), '59.0s');
    });

    it('should format minutes (>= 60s)', () => {
      assert.strictEqual(formatDuration(60000), '1m 0s');
      assert.strictEqual(formatDuration(120000), '2m 0s');
      assert.strictEqual(formatDuration(125000), '2m 5s');
    });

    it('should handle large durations', () => {
      assert.strictEqual(formatDuration(3600000), '60m 0s');
      assert.strictEqual(formatDuration(3661000), '61m 1s');
    });
  });

  describe('formatDate', () => {
    it('should return zh-CN formatted date string', () => {
      const result = formatDate(new Date('2026-06-30T12:00:00Z').toISOString());
      assert.ok(result.includes('06'));
      assert.ok(result.includes('30'));
    });
  });

  describe('searchExecutions', () => {
    it('should find by ruleName', () => {
      const result = searchExecutions(mockExecutions, '信用评分');
      assert.ok(result.length >= 1);
      for (const e of result) {
        assert.ok(e.ruleName.includes('信用评分'));
      }
    });

    it('should find by id', () => {
      const result = searchExecutions(mockExecutions, 'exec-1');
      assert.ok(result.length >= 1);
      assert.strictEqual(result[0]!.id, 'exec-1');
    });

    it('should find by ruleId', () => {
      const result = searchExecutions(mockExecutions, 'rule-1');
      assert.ok(result.length >= 1);
      for (const e of result) {
        assert.ok(e.ruleId.includes('rule-1'), `${e.id} ruleId=${e.ruleId} should include rule-1`);
      }
    });

    it('empty query should return all items', () => {
      const result = searchExecutions(mockExecutions, '');
      assert.strictEqual(result.length, mockExecutions.length);
    });
  });

  describe('filterByStatus', () => {
    it('empty status should return all items', () => {
      const result = filterByStatus(mockExecutions, '');
      assert.strictEqual(result.length, mockExecutions.length);
    });

    it('SUCCESS should return only SUCCESS', () => {
      const result = filterByStatus(mockExecutions, 'SUCCESS');
      assert.ok(result.length >= 10);
      for (const e of result) assert.strictEqual(e.status, 'SUCCESS');
    });

    it('FAILURE should return only FAILURE', () => {
      const result = filterByStatus(mockExecutions, 'FAILURE');
      assert.ok(result.length >= 10);
      for (const e of result) assert.strictEqual(e.status, 'FAILURE');
    });

    it('RUNNING should return only RUNNING', () => {
      const result = filterByStatus(mockExecutions, 'RUNNING');
      assert.ok(result.length >= 10);
      for (const e of result) assert.strictEqual(e.status, 'RUNNING');
    });

    it('TIMEOUT should return only TIMEOUT', () => {
      const result = filterByStatus(mockExecutions, 'TIMEOUT');
      assert.ok(result.length >= 10);
      for (const e of result) assert.strictEqual(e.status, 'TIMEOUT');
    });
  });

  describe('filterByTimeRange', () => {
    it('all should return all items', () => {
      const result = filterByTimeRange(mockExecutions, 'all');
      assert.strictEqual(result.length, mockExecutions.length);
    });

    it('24h should filter to recent 24 hours', () => {
      const result = filterByTimeRange(mockExecutions, '24h');
      for (const e of result) {
        const age = BASE_TIME - new Date(e.createdAt).getTime();
        assert.ok(age <= 86_400_000 + 1000, `age ${age}ms exceeds 24h`);
      }
    });

    it('7d should filter to recent 7 days', () => {
      const result = filterByTimeRange(mockExecutions, '7d');
      for (const e of result) {
        const age = BASE_TIME - new Date(e.createdAt).getTime();
        assert.ok(age <= 604_800_000 + 1000, `age ${age}ms exceeds 7d`);
      }
    });
  });

  describe('pagination', () => {
    it('page 1 with pageSize 10 should return 10 items', () => {
      const result = paginate(mockExecutions, 1, 10);
      assert.strictEqual(result.length, 10);
    });

    it('page 5 with pageSize 10 should return remaining', () => {
      const result = paginate(mockExecutions, 5, 10);
      assert.strictEqual(result.length, 7);
    });

    it('page should not exceed total', () => {
      const pageCount = Math.ceil(mockExecutions.length / PAGE_SIZE);
      assert.strictEqual(pageCount, 5);
    });
  });

  describe('fullFilterChain', () => {
    it('should combine search + status + time filter', () => {
      const result = fullFilterChain(mockExecutions, 'exec-1', 'SUCCESS', 'all');
      assert.ok(result.length >= 1);
      for (const e of result) {
        assert.strictEqual(e.status, 'SUCCESS');
      }
    });

    it('should return descending by createdAt', () => {
      const result = fullFilterChain(mockExecutions, '', '', 'all');
      for (let i = 1; i < result.length; i++) {
        const prev = new Date(result[i - 1]!.createdAt).getTime();
        const curr = new Date(result[i]!.createdAt).getTime();
        assert.ok(prev >= curr, 'should be descending by createdAt');
      }
    });
  });

  describe('mock data integrity', () => {
    it('all 4 execution statuses should be represented', () => {
      const statuses = new Set(mockExecutions.map((e) => e.status));
      assert.strictEqual(statuses.size, 4);
      for (const s of mockAllStatuses) assert.ok(statuses.has(s));
    });

    it('each status should have COLOR and BG mapping', () => {
      for (const s of mockAllStatuses) {
        assert.ok(STATUS_COLORS[s], `missing color for ${s}`);
        assert.ok(STATUS_BG[s], `missing bg for ${s}`);
      }
    });

    it('failure executions should have errorMessage', () => {
      const failures = mockExecutions.filter((e) => e.status === 'FAILURE');
      for (const e of failures) {
        assert.ok(e.errorMessage, `FAILURE ${e.id} should have errorMessage`);
      }
    });

    it('running executions should not have errorMessage', () => {
      const running = mockExecutions.filter((e) => e.status === 'RUNNING');
      for (const e of running) {
        assert.strictEqual(e.errorMessage, undefined);
      }
    });
  });
});

// ════════════════════════════════════════
// 反例 (Negative Cases)
// ════════════════════════════════════════

describe('rules-executions-page: 反例', () => {
  it('nonexistent search should return empty', () => {
    const result = searchExecutions(mockExecutions, 'ZZZZZ_NOT_EXIST');
    assert.strictEqual(result.length, 0);
  });

  it('empty execution list should handle all filters', () => {
    const empty: RuleExecution[] = [];
    assert.strictEqual(searchExecutions(empty, 'test').length, 0);
    assert.strictEqual(filterByStatus(empty, 'SUCCESS').length, 0);
    assert.strictEqual(filterByTimeRange(empty, '24h').length, 0);
    assert.strictEqual(paginate(empty, 1, 10).length, 0);
  });

  it('unknown status filter should return empty', () => {
    // @ts-expect-error — testing invalid runtime value
    const result = filterByStatus(mockExecutions, 'UNKNOWN');
    assert.strictEqual(result.length, 0);
  });

  it('page beyond total should return empty', () => {
    const result = paginate(mockExecutions, 999, 10);
    assert.strictEqual(result.length, 0);
  });

  it('page 0 should return empty', () => {
    const result = paginate(mockExecutions, 0, 10);
    assert.strictEqual(result.length, 0);
  });

  it('non-success executions should not have effect description', () => {
    const nonSuccess = mockExecutions.filter((e) => e.status !== 'SUCCESS');
    for (const e of nonSuccess) {
      assert.notStrictEqual(e.outputSummary, '规则匹配 → 动作已分发');
    }
  });
});

// ════════════════════════════════════════
// 边界 (Boundary Cases)
// ════════════════════════════════════════

describe('rules-executions-page: 边界', () => {
  it('duration 0ms should format as 0ms', () => {
    assert.strictEqual(formatDuration(0), '0ms');
  });

  it('duration 1ms should format as 1ms', () => {
    assert.strictEqual(formatDuration(1), '1ms');
  });

  it('duration 999ms should stay ms', () => {
    assert.strictEqual(formatDuration(999), '999ms');
  });

  it('duration exactly 1000ms should become 1.0s', () => {
    assert.strictEqual(formatDuration(1000), '1.0s');
  });

  it('duration exactly 60000ms should become 1m 0s', () => {
    assert.strictEqual(formatDuration(60000), '1m 0s');
  });

  it('duration 60001ms should become 1m 0s (round down)', () => {
    assert.strictEqual(formatDuration(60001), '1m 0s');
  });

  it('duration 60999ms should become 1m 1s', () => {
    assert.strictEqual(formatDuration(60999), '1m 1s');
  });

  it('case-insensitive search should find matches', () => {
    const upper = searchExecutions(mockExecutions, 'EXEC-1');
    const lower = searchExecutions(mockExecutions, 'exec-1');
    assert.strictEqual(upper.length, lower.length);
  });

  it('single character search should find matches', () => {
    const result = searchExecutions(mockExecutions, '信');
    assert.ok(result.length >= 1);
  });

  it('all execution IDs should be unique', () => {
    const ids = new Set(mockExecutions.map((e) => e.id));
    assert.strictEqual(ids.size, mockExecutions.length);
  });

  it('every ruleName should be non-empty', () => {
    for (const e of mockExecutions) {
      assert.ok(e.ruleName.trim().length > 0);
    }
  });

  it('createdAt dates should all be valid ISO strings', () => {
    for (const e of mockExecutions) {
      const d = new Date(e.createdAt);
      assert.ok(!Number.isNaN(d.getTime()), `invalid date for ${e.id}`);
    }
  });
});
