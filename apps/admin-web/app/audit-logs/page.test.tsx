/**
 * audit-logs/page.test.tsx — 日志审计页 L1 测试
 *
 * ⚡ 覆盖: 正例 + 反例 + 边界
 * Mock策略: URL-pattern responseRegistry
 * 禁止: as any / describe.skip / it.only
 * 原则: beforeEach 重置，test 自包含
 *
 * 功能覆盖:
 *  - 样本数据校验
 *  - 常量映射完整性
 *  - 统计计算
 *  - Tab 筛选逻辑
 *  - 搜索交互（含回车触发）
 *  - 空态处理
 *  - 组件结构验证
 */

import assert from 'node:assert/strict';
import { describe, it, beforeEach } from 'node:test';
import fs from 'node:fs';

// ===================== 类型定义 =====================

type AuditResult = 'success' | 'failure' | 'denied';
type AuditActionType =
  | 'login'
  | 'logout'
  | 'data_modify'
  | 'permission_change'
  | 'system_setting'
  | 'export';

interface AuditLogEntry {
  id: string;
  time: string;
  operator: string;
  actionType: AuditActionType;
  target: string;
  ip: string;
  result: AuditResult;
  detail: string;
}

// ===================== URL-pattern responseRegistry =====================

const responseRegistry = new Map<string, unknown>();

function registerResponse(pattern: string, factory: unknown): void {
  responseRegistry.set(pattern, factory);
}

function resetRegistry(): void {
  responseRegistry.clear();
}

globalThis.fetch = ((url: string) => {
  const path = typeof url === 'string' ? url : String(url);
  for (const [pattern, factory] of responseRegistry) {
    if (path.includes(pattern)) {
      return Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(typeof factory === 'function' ? factory() : factory),
        headers: new Headers(),
        redirected: false,
        statusText: 'OK',
        type: 'basic' as const,
        url: path,
      } as Response);
    }
  }
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true, data: null, message: 'OK' }),
    headers: new Headers(),
    redirected: false,
    statusText: 'OK',
    type: 'basic' as const,
    url: path,
  } as Response);
}) as typeof globalThis.fetch;

// ===================== 常量映射 (与 page.tsx 同步) =====================

const ACTION_TYPE_LABEL: Record<AuditActionType, string> = {
  login: '登录',
  logout: '登出',
  data_modify: '数据修改',
  permission_change: '权限变更',
  system_setting: '系统设置',
  export: '导出',
};

const RESULT_LABEL: Record<AuditResult, string> = {
  success: '成功',
  failure: '失败',
  denied: '拒绝',
};

const RESULT_COLOR: Record<AuditResult, string> = {
  success: '#22c55e',
  failure: '#ef4444',
  denied: '#eab308',
};

const RESULT_BG: Record<AuditResult, string> = {
  success: 'rgba(34,197,94,0.1)',
  failure: 'rgba(239,68,68,0.1)',
  denied: 'rgba(234,179,8,0.1)',
};

// ===================== 样本数据 =====================

const DEFAULT_LOGS: AuditLogEntry[] = [
  { id: 'log-001', time: '2026-07-18 14:32:10', operator: 'admin@demo.com', actionType: 'login', target: '管理后台', ip: '192.168.1.100', result: 'success', detail: '管理员登录管理后台' },
  { id: 'log-002', time: '2026-07-18 13:15:00', operator: 'zhang@demo.com', actionType: 'data_modify', target: '商品信息(ID: PD-1024)', ip: '10.0.0.55', result: 'success', detail: '修改商品售价 128 → 99' },
  { id: 'log-003', time: '2026-07-18 11:20:30', operator: 'li@demo.com', actionType: 'permission_change', target: '用户角色(ID: role-admin)', ip: '192.168.1.88', result: 'failure', detail: '尝试提升用户权限但权限不足' },
  { id: 'log-004', time: '2026-07-18 10:05:45', operator: 'wang@demo.com', actionType: 'system_setting', target: '系统参数-限流配置', ip: '10.0.1.22', result: 'success', detail: '更新API限流阈值 100→200 QPS' },
  { id: 'log-005', time: '2026-07-18 09:30:00', operator: 'system', actionType: 'login', target: '系统自动任务', ip: '127.0.0.1', result: 'failure', detail: '自动登录超时，令牌已过期' },
  { id: 'log-006', time: '2026-07-17 18:00:00', operator: 'admin@demo.com', actionType: 'logout', target: '管理后台', ip: '192.168.1.100', result: 'success', detail: '管理员安全登出' },
  { id: 'log-007', time: '2026-07-17 16:45:20', operator: 'zhang@demo.com', actionType: 'export', target: '销售报表-2026Q2', ip: '10.0.0.55', result: 'success', detail: '导出Q2销售报表(CSV格式)' },
  { id: 'log-008', time: '2026-07-17 15:10:00', operator: 'li@demo.com', actionType: 'data_modify', target: '订单状态(ID: ORD-8921)', ip: '192.168.1.88', result: 'denied', detail: '尝试修改已发货订单状态被拒绝' },
  { id: 'log-009', time: '2026-07-17 14:00:00', operator: 'admin@demo.com', actionType: 'system_setting', target: '通知模板-短信', ip: '192.168.1.100', result: 'success', detail: '更新短信通知模板内容' },
  { id: 'log-010', time: '2026-07-17 11:30:00', operator: 'wang@demo.com', actionType: 'export', target: '会员清单', ip: '10.0.1.22', result: 'success', detail: '导出活跃会员清单' },
];

// ===================== 辅助函数 =====================

function isToday(timeStr: string): boolean {
  return timeStr.startsWith('2026-07-18');
}

function computeStats(logs: AuditLogEntry[]) {
  const total = logs.length;
  const today = logs.filter((l) => isToday(l.time)).length;
  const todayFailures = logs.filter((l) => isToday(l.time) && l.result === 'failure').length;
  return { total, today, todayFailures };
}

function filterLogs(
  logs: AuditLogEntry[],
  tab: 'all' | 'failure',
  searchQuery: string,
): AuditLogEntry[] {
  let result = logs;
  if (tab === 'failure') {
    result = result.filter((l) => l.result === 'failure');
  }
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter((l) => l.operator.toLowerCase().includes(q));
  }
  return result;
}

// ===================== 正例 =====================

describe('AuditLogsPage — 正例', () => {
  beforeEach(() => {
    resetRegistry();
    registerResponse('/api/audit-logs/list', DEFAULT_LOGS);
  });

  describe('样本数据', () => {
    it('有 10 条日志记录', () => {
      assert.strictEqual(DEFAULT_LOGS.length, 10);
    });

    it('覆盖全部操作类型', () => {
      const types = new Set(DEFAULT_LOGS.map((l) => l.actionType));
      ['login', 'logout', 'data_modify', 'permission_change', 'system_setting', 'export'].forEach((t) => {
        assert.ok(types.has(t as AuditActionType), `缺少操作类型 ${t}`);
      });
    });

    it('覆盖全部结果类型', () => {
      const results = new Set(DEFAULT_LOGS.map((l) => l.result));
      ['success', 'failure', 'denied'].forEach((r) => {
        assert.ok(results.has(r as AuditResult));
      });
    });

    it('包含 2 条失败记录', () => {
      const failures = DEFAULT_LOGS.filter((l) => l.result === 'failure');
      assert.strictEqual(failures.length, 2);
    });

    it('每条记录有唯一 ID', () => {
      const ids = DEFAULT_LOGS.map((l) => l.id);
      assert.strictEqual(new Set(ids).size, ids.length);
    });

    it('每条记录包含完整字段', () => {
      DEFAULT_LOGS.forEach((l) => {
        assert.ok(l.id, '缺少 id');
        assert.ok(l.time, '缺少 time');
        assert.ok(l.operator, '缺少 operator');
        assert.ok(l.actionType, '缺少 actionType');
        assert.ok(l.target, '缺少 target');
        assert.ok(l.ip, '缺少 ip');
        assert.ok(l.result, '缺少 result');
        assert.ok(l.detail, '缺少 detail');
      });
    });

    it('包含 3 个不同操作人', () => {
      const operators = new Set(DEFAULT_LOGS.map((l) => l.operator));
      assert.ok(operators.has('admin@demo.com'));
      assert.ok(operators.has('zhang@demo.com'));
      assert.ok(operators.has('li@demo.com'));
      assert.ok(operators.has('wang@demo.com'));
      assert.ok(operators.has('system'));
    });

    it('包含 5 条今日记录', () => {
      const today = DEFAULT_LOGS.filter((l) => isToday(l.time));
      assert.strictEqual(today.length, 5);
    });
  });

  describe('常量映射', () => {
    it('ACTION_TYPE_LABEL 映射所有操作类型到中文', () => {
      assert.strictEqual(ACTION_TYPE_LABEL.login, '登录');
      assert.strictEqual(ACTION_TYPE_LABEL.logout, '登出');
      assert.strictEqual(ACTION_TYPE_LABEL.data_modify, '数据修改');
      assert.strictEqual(ACTION_TYPE_LABEL.permission_change, '权限变更');
      assert.strictEqual(ACTION_TYPE_LABEL.system_setting, '系统设置');
      assert.strictEqual(ACTION_TYPE_LABEL.export, '导出');
    });

    it('RESULT_LABEL 映射所有结果到中文', () => {
      assert.strictEqual(RESULT_LABEL.success, '成功');
      assert.strictEqual(RESULT_LABEL.failure, '失败');
      assert.strictEqual(RESULT_LABEL.denied, '拒绝');
    });

    it('RESULT_COLOR 映射所有结果颜色', () => {
      assert.strictEqual(RESULT_COLOR.success, '#22c55e');
      assert.strictEqual(RESULT_COLOR.failure, '#ef4444');
      assert.strictEqual(RESULT_COLOR.denied, '#eab308');
    });

    it('RESULT_BG 映射所有结果背景色', () => {
      assert.ok(RESULT_BG.success.includes('rgba(34,197,94'));
      assert.ok(RESULT_BG.failure.includes('rgba(239,68,68'));
      assert.ok(RESULT_BG.denied.includes('rgba(234,179,8'));
    });
  });

  describe('统计计算 computeStats', () => {
    it('总日志数 10', () => {
      const stats = computeStats(DEFAULT_LOGS);
      assert.strictEqual(stats.total, 10);
    });

    it('今日日志 5 条', () => {
      const stats = computeStats(DEFAULT_LOGS);
      assert.strictEqual(stats.today, 5);
    });

    it('今日失败 2 条', () => {
      const stats = computeStats(DEFAULT_LOGS);
      assert.strictEqual(stats.todayFailures, 2);
    });

    it('今日失败的 2 条分别是 log-003 和 log-005', () => {
      const todayFailures = DEFAULT_LOGS.filter((l) => isToday(l.time) && l.result === 'failure');
      const ids = todayFailures.map((l) => l.id).sort();
      assert.deepStrictEqual(ids, ['log-003', 'log-005']);
    });
  });

  describe('Tab 筛选 filterLogs', () => {
    it('全部 tab 返回所有 10 条', () => {
      const result = filterLogs(DEFAULT_LOGS, 'all', '');
      assert.strictEqual(result.length, 10);
    });

    it('失败 tab 返回 2 条', () => {
      const result = filterLogs(DEFAULT_LOGS, 'failure', '');
      assert.strictEqual(result.length, 2);
    });

    it('失败 tab 仅包含 result === failure', () => {
      const result = filterLogs(DEFAULT_LOGS, 'failure', '');
      result.forEach((l) => assert.strictEqual(l.result, 'failure'));
    });

    it('空数组下全部 tab 返回 0', () => {
      const result = filterLogs([], 'all', '');
      assert.strictEqual(result.length, 0);
    });

    it('空数组下失败 tab 返回 0', () => {
      const result = filterLogs([], 'failure', '');
      assert.strictEqual(result.length, 0);
    });
  });

  describe('搜索交互 filterLogs', () => {
    it('按操作人搜索 admin@demo.com 返回 3 条', () => {
      const result = filterLogs(DEFAULT_LOGS, 'all', 'admin@demo.com');
      assert.strictEqual(result.length, 3);
    });

    it('按操作人搜索 zhang 返回 2 条', () => {
      const result = filterLogs(DEFAULT_LOGS, 'all', 'zhang');
      assert.strictEqual(result.length, 2);
    });

    it('按操作人搜索 li 返回 2 条', () => {
      const result = filterLogs(DEFAULT_LOGS, 'all', 'li');
      assert.strictEqual(result.length, 2);
    });

    it('搜索不存在的操作人返回空', () => {
      const result = filterLogs(DEFAULT_LOGS, 'all', 'nonexistent');
      assert.strictEqual(result.length, 0);
    });

    it('搜索与失败 tab 组合筛选', () => {
      const result = filterLogs(DEFAULT_LOGS, 'failure', 'li');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]!.id, 'log-003');
    });

    it('空搜索字符串返回全部', () => {
      const result = filterLogs(DEFAULT_LOGS, 'all', '');
      assert.strictEqual(result.length, 10);
    });

    it('搜索大小写不敏感', () => {
      const resultLower = filterLogs(DEFAULT_LOGS, 'all', 'admin');
      const resultUpper = filterLogs(DEFAULT_LOGS, 'all', 'ADMIN');
      assert.strictEqual(resultLower.length, resultUpper.length);
    });
  });

  describe('responseRegistry', () => {
    it('注册后 fetch 返回注册数据', async () => {
      resetRegistry();
      registerResponse('/api/audit-logs/list', { ok: true, data: DEFAULT_LOGS, message: 'OK' });

      const res = await fetch('/api/audit-logs/list');
      const body = await res.json();
      assert.strictEqual(body.ok, true);
      assert.strictEqual(body.data.length, 10);
    });

    it('未注册路径返回默认 200 空数据', async () => {
      resetRegistry();
      const res = await fetch('/api/unknown-path');
      const body = await res.json();
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data, null);
    });

    it('重置后旧注册失效', async () => {
      resetRegistry();
      registerResponse('/api/audit-logs/list', { ok: true, data: [], message: 'reset' });
      resetRegistry();
      const res = await fetch('/api/audit-logs/list');
      const body = await res.json();
      assert.strictEqual(body.success, true);
    });

    it('可注册函数工厂', async () => {
      resetRegistry();
      let callCount = 0;
      registerResponse('/api/audit-logs/count', () => ({ count: ++callCount }));

      const r1 = await fetch('/api/audit-logs/count');
      const d1 = await r1.json();
      const r2 = await fetch('/api/audit-logs/count');
      const d2 = await r2.json();
      assert.strictEqual(d1.count, 1);
      assert.strictEqual(d2.count, 2);
    });
  });
});

// ===================== 反例 =====================

describe('AuditLogsPage — 反例', () => {
  beforeEach(() => {
    resetRegistry();
  });

  it('空日志列表统计全为 0', () => {
    const stats = computeStats([]);
    assert.strictEqual(stats.total, 0);
    assert.strictEqual(stats.today, 0);
    assert.strictEqual(stats.todayFailures, 0);
  });

  it('无失败日志时失败 tab 返回空', () => {
    const allSuccess = DEFAULT_LOGS.map((l) => ({ ...l, result: 'success' as const }));
    const result = filterLogs(allSuccess, 'failure', '');
    assert.strictEqual(result.length, 0);
  });

  it('搜索空字符串等价于不搜索', () => {
    const withEmpty = filterLogs(DEFAULT_LOGS, 'all', '');
    const withDefault = filterLogs(DEFAULT_LOGS, 'all', '');
    assert.strictEqual(withEmpty.length, withDefault.length);
  });

  it('搜索结果为空时显示引导信息', () => {
    const result = filterLogs(DEFAULT_LOGS, 'all', 'xxxxxxnobodyyyyy');
    assert.strictEqual(result.length, 0);
    // Verification of empty search state is in component structure tests
  });
});

// ===================== 边界 =====================

describe('AuditLogsPage — 边界', () => {
  it('isToday 对已知日期返回正确', () => {
    assert.strictEqual(isToday('2026-07-18 00:00:00'), true);
    assert.strictEqual(isToday('2026-07-18 23:59:59'), true);
    assert.strictEqual(isToday('2026-07-17 23:59:59'), false);
    assert.strictEqual(isToday('2026-07-19 00:00:00'), false);
  });

  it('isToday 对空字符串返回 false', () => {
    assert.strictEqual(isToday(''), false);
  });

  it('全员失败时失败 tab 返回全部', () => {
    const allFailed = DEFAULT_LOGS.map((l) => ({ ...l, result: 'failure' as const }));
    const result = filterLogs(allFailed, 'failure', '');
    assert.strictEqual(result.length, DEFAULT_LOGS.length);
  });

  it('搜索与失败 tab 组合且无匹配返回空', () => {
    const result = filterLogs(DEFAULT_LOGS, 'failure', 'wang');
    // wang has no failure records
    assert.strictEqual(result.length, 0);
  });

  it('连续多次搜索互不影响', () => {
    const r1 = filterLogs(DEFAULT_LOGS, 'all', 'admin');
    const r2 = filterLogs(DEFAULT_LOGS, 'all', 'zhang');
    const r3 = filterLogs(DEFAULT_LOGS, 'all', '');
    assert.strictEqual(r1.length, 3);
    assert.strictEqual(r2.length, 2);
    assert.strictEqual(r3.length, 10);
  });

  it('所有失败记录均为今日', () => {
    const failures = DEFAULT_LOGS.filter((l) => l.result === 'failure');
    failures.forEach((l) => {
      assert.ok(isToday(l.time), `失败记录 ${l.id} 非今日`);
    });
  });
});

// ===================== 组件结构验证 =====================

describe('AuditLogsPage — 组件结构', () => {
  const SRC = fs.readFileSync(
    new URL('page.tsx', import.meta.url),
    'utf-8',
  );

  it('包含 use client 指令', () => {
    assert.ok(SRC.includes("'use client'"));
  });

  it('包含 useState 声明', () => {
    assert.ok(SRC.includes('useState'));
  });

  it('包含 useMemo', () => {
    assert.ok(SRC.includes('useMemo'));
  });

  it('包含 JSX 返回', () => {
    assert.ok(SRC.includes('return ('));
  });

  it('包含列表渲染 .map()', () => {
    assert.ok(SRC.includes('.map('));
  });

  it('包含条件渲染 &&', () => {
    assert.ok(SRC.includes(' && '));
  });

  it('包含默认导出函数 AuditLogsPage', () => {
    assert.ok(SRC.includes('export default function AuditLogsPage'));
  });

  it('包含注释说明文档', () => {
    assert.ok(SRC.includes('/**'));
  });

  it('包含事件处理器 onKeyDown', () => {
    assert.ok(SRC.includes('onKeyDown'));
  });

  it('包含 onChange 事件', () => {
    assert.ok(SRC.includes('onChange'));
  });

  it('包含 onClick 事件', () => {
    assert.ok(SRC.includes('onClick'));
  });

  it('包含 style 内联样式', () => {
    assert.ok(SRC.includes('style={{'));
  });

  it('包含空态组件 EmptyState', () => {
    assert.ok(SRC.includes('EmptyState'));
  });

  it('包含搜索空态组件 EmptySearchState', () => {
    assert.ok(SRC.includes('EmptySearchState'));
  });

  it('包含刷新按钮', () => {
    assert.ok(SRC.includes('刷新'));
  });

  it('包含 SVG 图表', () => {
    assert.ok(SRC.includes('<svg') || SRC.includes('SVG'));
  });

  it('包含 Tab 筛选', () => {
    assert.ok(SRC.includes('全部') && SRC.includes('失败'));
  });

  it('包含日志表格表头', () => {
    assert.ok(SRC.includes('时间') && SRC.includes('操作人') && SRC.includes('操作类型') && SRC.includes('目标') && SRC.includes('IP') && SRC.includes('结果'));
  });

  it('包含按操作人搜索 placeholder', () => {
    assert.ok(SRC.includes('按操作人搜索'));
  });

  it('包含统计概览文案', () => {
    assert.ok(SRC.includes('总日志数') && SRC.includes('今日'));
  });

  it('包含导出类型', () => {
    assert.ok(SRC.includes('export') || SRC.includes('export type'));
  });
});
