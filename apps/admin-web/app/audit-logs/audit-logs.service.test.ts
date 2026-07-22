/**
 * audit-logs.service.test.ts — 审计日志 Service 层测试
 *
 * 覆盖:
 *   - 日志查询与分页
 *   - 条件筛选（操作人、操作类型、结果、时间范围）
 *   - 统计计算
 *   - 导出功能
 *   - 边界条件与错误处理
 */

import assert from 'node:assert/strict';
import test from 'node:test';

import {
  computeStats,
  filterLogs,
  isToday,
  ACTION_TYPE_LABEL,
  RESULT_LABEL,
  DEFAULT_LOGS,
} from './page';

import type {
  AuditLogEntry,
  AuditActionType,
  AuditResult,
} from './page';

// ── 工厂函数 ────────────────────────────────────────────

function makeLog(overrides: Partial<AuditLogEntry> = {}): AuditLogEntry {
  return {
    id: overrides.id ?? 'log-svc-1',
    time: overrides.time ?? '2026-07-18 10:00:00',
    operator: overrides.operator ?? 'svc@demo.com',
    actionType: overrides.actionType ?? 'login',
    target: overrides.target ?? '管理后台',
    ip: overrides.ip ?? '10.0.0.1',
    result: overrides.result ?? 'success',
    detail: overrides.detail ?? '测试操作',
  };
}

// ============================================================
//  1. 日志查询测试
// ============================================================

test.describe('AuditLogs Service — 日志查询', () => {
  const sampleLogs: AuditLogEntry[] = [
    makeLog({ id: 'l1', operator: 'admin@demo.com', actionType: 'login', result: 'success', time: '2026-07-18 10:00:00' }),
    makeLog({ id: 'l2', operator: 'user@demo.com', actionType: 'data_modify', result: 'failure', time: '2026-07-18 11:00:00' }),
    makeLog({ id: 'l3', operator: 'admin@demo.com', actionType: 'export', result: 'success', time: '2026-07-17 09:00:00' }),
    makeLog({ id: 'l4', operator: 'system', actionType: 'logout', result: 'success', time: '2026-07-17 18:00:00' }),
    makeLog({ id: 'l5', operator: 'user@demo.com', actionType: 'permission_change', result: 'denied', time: '2026-07-16 14:00:00' }),
  ];

  test('filterLogs returns all when tab=all and no search query', () => {
    const result = filterLogs(sampleLogs, 'all', '');
    assert.equal(result.length, 5);
    assert.deepEqual(result, sampleLogs);
  });

  test('filterLogs with tab=failure returns only failure results', () => {
    const result = filterLogs(sampleLogs, 'failure', '');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'l2');
    assert.equal(result[0].result, 'failure');
  });

  test('filterLogs with tab=failure excludes denied results', () => {
    const result = filterLogs(sampleLogs, 'failure', '');
    // l5 is denied, not failure
    assert.equal(result.every((l) => l.result === 'failure'), true);
  });

  test('filterLogs searches operator case-insensitively', () => {
    const result = filterLogs(sampleLogs, 'all', 'ADMIN');
    assert.equal(result.length, 2);
    assert.equal(result.every((l) => l.operator.includes('admin')), true);
  });

  test('filterLogs returns empty for unmatched search', () => {
    const result = filterLogs(sampleLogs, 'all', 'nosuchuser');
    assert.equal(result.length, 0);
  });

  test('filterLogs with whitespace in query (note: does not trim internally)', () => {
    // The implementation uses searchQuery.trim() for empty check
    // but passes the raw query to .includes(), so spaces around won't match
    const result = filterLogs(sampleLogs, 'all', '  system  ');
    assert.equal(result.length, 0);
    // Exact match without spaces works
    const exact = filterLogs(sampleLogs, 'all', 'system');
    assert.equal(exact.length, 1);
    assert.equal(exact[0].operator, 'system');
  });

  test('filterLogs returns empty for empty log array', () => {
    const result = filterLogs([], 'all', '');
    assert.equal(result.length, 0);
  });

  test('filterLogs returns empty for empty log array with tab filter', () => {
    const result = filterLogs([], 'failure', '');
    assert.equal(result.length, 0);
  });

  test('filterLogs combines tab and search filter', () => {
    const result = filterLogs(sampleLogs, 'failure', 'user');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'l2');
  });
});

// ============================================================
//  2. 统计计算测试
// ============================================================

test.describe('AuditLogs Service — 统计计算', () => {
  test('computeStats returns zeroes for empty list', () => {
    const stats = computeStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.today, 0);
    assert.equal(stats.todayFailures, 0);
  });

  test('computeStats counts today correctly', () => {
    const logs = [
      makeLog({ time: '2026-07-18 10:00:00' }),
      makeLog({ time: '2026-07-18 11:00:00' }),
      makeLog({ time: '2026-07-17 10:00:00' }),
    ];
    const stats = computeStats(logs);
    assert.equal(stats.total, 3);
    assert.equal(stats.today, 2); // 7-18 is today per mock date
  });

  test('computeStats counts today failures correctly', () => {
    const logs = [
      makeLog({ time: '2026-07-18 10:00:00', result: 'success' }),
      makeLog({ time: '2026-07-18 11:00:00', result: 'failure' }),
      makeLog({ time: '2026-07-18 12:00:00', result: 'failure' }),
      makeLog({ time: '2026-07-17 10:00:00', result: 'failure' }),
    ];
    const stats = computeStats(logs);
    assert.equal(stats.todayFailures, 2);
  });

  test('computeStats on DEFAULT_LOGS returns expected values', () => {
    const stats = computeStats(DEFAULT_LOGS);
    assert.equal(stats.total, 10);
    assert.equal(stats.today, 5); // 5 logs on 2026-07-18
    assert.equal(stats.todayFailures, 2); // log-003 and log-005
  });

  test('isToday matches date prefix', () => {
    assert.equal(isToday('2026-07-18 10:00:00'), true);
    assert.equal(isToday('2026-07-17 23:59:59'), false);
    assert.equal(isToday('2026-07-19 00:00:00'), false);
  });

  test('isToday handles edge cases', () => {
    assert.equal(isToday(''), false);
    assert.equal(isToday('invalid-date'), false);
  });
});

// ============================================================
//  3. 操作类型与结果映射测试
// ============================================================

test.describe('AuditLogs Service — 映射完整性', () => {
  const actionTypes: AuditActionType[] = ['login', 'logout', 'data_modify', 'permission_change', 'system_setting', 'export'];
  const results: AuditResult[] = ['success', 'failure', 'denied'];

  test('every action type has a label', () => {
    for (const t of actionTypes) {
      assert.equal(typeof ACTION_TYPE_LABEL[t], 'string', `Missing label for ${t}`);
      assert.ok(ACTION_TYPE_LABEL[t].length > 0, `Empty label for ${t}`);
    }
  });

  test('every result type has a label', () => {
    for (const r of results) {
      assert.equal(typeof RESULT_LABEL[r], 'string', `Missing label for ${r}`);
      assert.ok(RESULT_LABEL[r].length > 0, `Empty label for ${r}`);
    }
  });
});

// ============================================================
//  4. 时间范围查询测试
// ============================================================

test.describe('AuditLogs Service — 时间范围筛选', () => {
  test('filter single day logs correctly', () => {
    const logs = [
      makeLog({ id: 'd1', time: '2026-07-18 08:00:00' }),
      makeLog({ id: 'd2', time: '2026-07-18 23:59:59' }),
    ];
    const stats = computeStats(logs);
    assert.equal(stats.today, 2);
  });

  test('mixed day results are properly distinguished', () => {
    const logs = [
      makeLog({ id: 'm1', time: '2026-07-18 00:00:00', result: 'failure' }),
      makeLog({ id: 'm2', time: '2026-07-17 00:00:00', result: 'failure' }),
    ];
    const stats = computeStats(logs);
    assert.equal(stats.today, 1);
    assert.equal(stats.todayFailures, 1);
    assert.equal(stats.total, 2);
  });
});

// ============================================================
//  5. 导出功能测试
// ============================================================

test.describe('AuditLogs Service — 导出功能', () => {
  test('filtered logs can be used as export data source', () => {
    // 模拟导出前筛选: 仅失败日志
    const failures = filterLogs(DEFAULT_LOGS, 'failure', '');
    assert.ok(failures.length >= 2);
    // 模拟导出: 转化为CSV行
    const csvHeader = '时间,操作人,操作类型,目标,IP,结果,详情';
    const csvRows = failures.map((l) =>
      `${l.time},${l.operator},${ACTION_TYPE_LABEL[l.actionType]},${l.target},${l.ip},${RESULT_LABEL[l.result]},${l.detail}`
    );
    assert.equal(csvRows.length, failures.length);
    assert.ok(csvRows[0].includes(RESULT_LABEL['failure']));
    assert.ok(csvHeader.length > 0);
  });

  test('export with empty filtered set returns empty result', () => {
    const empty = filterLogs(DEFAULT_LOGS, 'failure', 'NOSUCHOPERATOR');
    assert.equal(empty.length, 0);
    const rows = empty.map((l) => `${l.time},${l.operator}`);
    assert.equal(rows.length, 0);
  });

  test('DEFAULT_LOGS contains expected unique operators', () => {
    const operators = new Set(DEFAULT_LOGS.map((l) => l.operator));
    assert.ok(operators.has('admin@demo.com'));
    assert.ok(operators.has('li@demo.com'));
    assert.ok(operators.has('system'));
    assert.equal(operators.size, 5);
  });

  test('DEFAULT_LOGS covers all 6 action types across records', () => {
    const types = new Set(DEFAULT_LOGS.map((l) => l.actionType));
    const allExpected: AuditActionType[] = ['login', 'logout', 'data_modify', 'permission_change', 'system_setting', 'export'];
    for (const t of allExpected) {
      assert.ok(types.has(t), `Missing action type: ${t}`);
    }
  });

  test('DEFAULT_LOGS covers all 3 result types', () => {
    const results = new Set(DEFAULT_LOGS.map((l) => l.result));
    assert.ok(results.has('success'));
    assert.ok(results.has('failure'));
    assert.ok(results.has('denied'));
  });

  test('export data preserves original record count', () => {
    const filtered = filterLogs(DEFAULT_LOGS, 'all', '');
    assert.equal(filtered.length, DEFAULT_LOGS.length);
  });
});

// ============================================================
//  6. 边界条件测试
// ============================================================

test.describe('AuditLogs Service — 边界条件', () => {
  test('filterLogs handles special characters in operator name', () => {
    const logs = [
      makeLog({ operator: 'test+user@company.com' }),
    ];
    const result = filterLogs(logs, 'all', '+user');
    assert.equal(result.length, 1);
  });

  test('filterLogs handles very long operator names', () => {
    const longName = 'a'.repeat(200) + '@test.com';
    const logs = [makeLog({ operator: longName })];
    const result = filterLogs(logs, 'all', 'a'.repeat(200));
    assert.equal(result.length, 1);
  });

  test('computeStats handles single log entry', () => {
    const stats = computeStats([makeLog({ time: '2026-07-18 10:00:00', result: 'failure' })]);
    assert.equal(stats.total, 1);
    assert.equal(stats.today, 1);
    assert.equal(stats.todayFailures, 1);
  });

  test('computeStats handles many log entries without overflow', () => {
    const manyLogs = Array.from({ length: 1000 }, (_, i) =>
      makeLog({ id: `bulk-${i}`, time: i % 2 === 0 ? '2026-07-18 10:00:00' : '2026-07-17 10:00:00' })
    );
    const stats = computeStats(manyLogs);
    assert.equal(stats.total, 1000);
    assert.equal(stats.today, 500);
  });
});
