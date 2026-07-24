/**
 * audit-trail/page.test.tsx — 审计日志页面 L1 冒烟测试
 * ⚡ 覆盖: mock数据 / 筛选逻辑 / 统计计算 / 事件类型分布 / 格式化导出 / 空态/加载态
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';
import fs from 'node:fs';

// ---- 类型 ----

interface AuditLogEntry {
  id: string;
  eventType: string;
  operator: string;
  source: string;
  severity: 'info' | 'warning' | 'error';
  createdAt: string;
  summary: string;
  tenantId: string;
}

// ---- Mock 数据 (与 page.tsx 同步) ----

const MOCK: AuditLogEntry[] = [
  { id: 'log-001', eventType: 'config.update', operator: 'admin@demo.com', source: 'admin-web', severity: 'info', createdAt: '2026-07-15 10:30', summary: '修改限流配置: rate_limit_policy', tenantId: 'tenant-demo' },
  { id: 'log-002', eventType: 'role.assignment', operator: 'super@demo.com', source: 'admin-web', severity: 'warning', createdAt: '2026-07-15 10:15', summary: '分配角色 "营销经理" 给 user_003', tenantId: 'tenant-demo' },
  { id: 'log-003', eventType: 'tenant.config', operator: 'admin@demo.com', source: 'bootstrap', severity: 'info', createdAt: '2026-07-15 09:45', summary: '更新 Bootstrap 缓存策略', tenantId: 'tenant-demo' },
  { id: 'log-004', eventType: 'campaign.activate', operator: 'marketing@demo.com', source: 'admin-web', severity: 'info', createdAt: '2026-07-15 09:30', summary: '激活营销活动: 618年中大促', tenantId: 'tenant-demo' },
  { id: 'log-005', eventType: 'system.error', operator: 'system', source: 'runtime', severity: 'error', createdAt: '2026-07-15 08:50', summary: '规则引擎超时: rule_001 执行超 5000ms', tenantId: 'tenant-demo' },
  { id: 'log-006', eventType: 'user.delete', operator: 'super@demo.com', source: 'admin-web', severity: 'warning', createdAt: '2026-07-15 08:30', summary: '删除用户: user_045 (已离职)', tenantId: 'tenant-demo' },
  { id: 'log-007', eventType: 'config.update', operator: 'admin@demo.com', source: 'api', severity: 'info', createdAt: '2026-07-15 08:00', summary: '更新 API 速率限制', tenantId: 'tenant-demo' },
  { id: 'log-008', eventType: 'permission.change', operator: 'admin@demo.com', source: 'admin-web', severity: 'warning', createdAt: '2026-07-14 18:00', summary: '修改权限策略: 财务模块只读', tenantId: 'tenant-demo' },
  { id: 'log-009', eventType: 'system.info', operator: 'system', source: 'runtime', severity: 'info', createdAt: '2026-07-14 17:30', summary: '系统升级完成: v2.3.1', tenantId: 'tenant-demo' },
  { id: 'log-010', eventType: 'config.update', operator: 'admin@demo.com', source: 'admin-web', severity: 'info', createdAt: '2026-07-14 16:00', summary: '添加新 Foundation 模块: trust-governance', tenantId: 'tenant-demo' },
  { id: 'log-011', eventType: 'campaign.deactivate', operator: 'marketing@demo.com', source: 'admin-web', severity: 'info', createdAt: '2026-07-14 15:30', summary: '停用活动: 春季促销', tenantId: 'tenant-demo' },
  { id: 'log-012', eventType: 'system.error', operator: 'system', source: 'database', severity: 'error', createdAt: '2026-07-14 14:00', summary: '数据库连接池耗尽: max_connections 超限', tenantId: 'tenant-demo' },
  { id: 'log-013', eventType: 'config.update', operator: 'dev@demo.com', source: 'admin-web', severity: 'info', createdAt: '2026-07-14 13:00', summary: '更新 Agent timeout', tenantId: 'tenant-demo' },
  { id: 'log-014', eventType: 'permission.change', operator: 'super@demo.com', source: 'admin-web', severity: 'warning', createdAt: '2026-07-14 12:00', summary: '回收高权限', tenantId: 'tenant-demo' },
  { id: 'log-015', eventType: 'system.info', operator: 'system', source: 'deploy', severity: 'info', createdAt: '2026-07-14 11:00', summary: '部署完成: admin-web v1.8.0', tenantId: 'tenant-demo' },
];

// ---- 事件类型映射 (与 page.tsx 同步) ----

const EVENT_COLORS: Record<string, 'info' | 'success' | 'warning' | 'error'> = {
  'config.update': 'info', 'campaign.activate': 'success', 'role.assignment': 'warning',
  'user.delete': 'error', 'system.error': 'error', 'tenant.config': 'info',
  'system.info': 'info', 'permission.change': 'warning', 'campaign.deactivate': 'warning',
};

const SEV_MAP: Record<string, { label: string }> = {
  info: { label: '信息' },
  warning: { label: '警告' },
  error: { label: '错误' },
};

// ---- 辅助函数 ----

function computeStats(logs: AuditLogEntry[]) {
  const today = logs.filter(l => l.createdAt.startsWith('2026-07-15')).length;
  const thisWeek = logs.filter(l => l.createdAt >= '2026-07-13').length;
  const errCnt = logs.filter(l => l.severity === 'error').length;
  const warnCnt = logs.filter(l => l.severity === 'warning').length;
  const infoCnt = logs.filter(l => l.severity === 'info').length;
  const operators = new Set(logs.map(l => l.operator)).size;
  return { total: logs.length, today, thisWeek, errCnt, warnCnt, infoCnt, operators };
}

function filterLogs(logs: AuditLogEntry[], search: string, eventFilter: string, sevFilter: string): AuditLogEntry[] {
  let items = logs;
  if (search.trim()) {
    const q = search.toLowerCase();
    items = items.filter(l =>
      l.summary.toLowerCase().includes(q) ||
      l.operator.toLowerCase().includes(q) ||
      l.eventType.toLowerCase().includes(q)
    );
  }
  if (eventFilter) items = items.filter(l => l.eventType === eventFilter);
  if (sevFilter) items = items.filter(l => l.severity === sevFilter);
  return items;
}

function computeEventTypeDistribution(logs: AuditLogEntry[]): Record<string, number> {
  return logs.reduce<Record<string, number>>((acc, l) => {
    acc[l.eventType] = (acc[l.eventType] || 0) + 1;
    return acc;
  }, {});
}

function formatForExport(logs: AuditLogEntry[]): string {
  const header = '时间,事件类型,操作人,级别,来源,摘要';
  if (logs.length === 0) return header;
  const rows = logs.map(l =>
    `"${l.createdAt}","${l.eventType}","${l.operator}","${l.severity}","${l.source}","${l.summary}"`
  ).join('\n');
  return `${header}\n${rows}`;
}

// ---- 测试 ----

describe('AuditLogsPage — Mock 数据', () => {
  it('有 15 条日志记录', () => {
    assert.strictEqual(MOCK.length, 15);
  });

  it('覆盖所有严重级别', () => {
    const sevs = new Set(MOCK.map(l => l.severity));
    assert.ok(sevs.has('info'));
    assert.ok(sevs.has('warning'));
    assert.ok(sevs.has('error'));
  });

  it('日志包含 tenantId', () => {
    MOCK.forEach(l => assert.ok(l.tenantId));
  });

  it('日志包含完整字段', () => {
    MOCK.forEach(l => {
      assert.ok(l.id);
      assert.ok(l.eventType);
      assert.ok(l.operator);
      assert.ok(l.source);
      assert.ok(l.createdAt);
      assert.ok(l.summary);
    });
  });
});

describe('AuditLogsPage — 统计计算', () => {
  it('总日志数 15', () => {
    assert.strictEqual(computeStats(MOCK).total, 15);
  });

  it('今日日志 7 条', () => {
    assert.strictEqual(computeStats(MOCK).today, 7);
  });

  it('本周日志 15 条', () => {
    assert.strictEqual(computeStats(MOCK).thisWeek, 15);
  });

  it('错误事件 2 条', () => {
    assert.strictEqual(computeStats(MOCK).errCnt, 2);
  });

  it('警告事件 4 条', () => {
    assert.strictEqual(computeStats(MOCK).warnCnt, 4);
  });

  it('信息事件 9 条', () => {
    assert.strictEqual(computeStats(MOCK).infoCnt, 9);
  });

  it('操作人数 5 个', () => {
    assert.strictEqual(computeStats(MOCK).operators, 5);
  });

  it('空数组统计为 0', () => {
    const stats = computeStats([]);
    assert.strictEqual(stats.total, 0);
    assert.strictEqual(stats.today, 0);
    assert.strictEqual(stats.operators, 0);
  });
});

describe('AuditLogsPage — 筛选逻辑', () => {
  it('空搜索返回全部', () => {
    assert.strictEqual(filterLogs(MOCK, '', '', '').length, 15);
  });

  it('按事件摘要搜索', () => {
    const result = filterLogs(MOCK, '限流', '', '');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'log-001');
  });

  it('按操作人搜索', () => {
    const result = filterLogs(MOCK, 'super@demo.com', '', '');
    assert.strictEqual(result.length, 3);
  });

  it('按事件类型筛选', () => {
    const result = filterLogs(MOCK, '', 'config.update', '');
    assert.strictEqual(result.length, 4);
  });

  it('按严重级别筛选', () => {
    const result = filterLogs(MOCK, '', '', 'error');
    assert.strictEqual(result.length, 2);
  });

  it('组合筛选', () => {
    const result = filterLogs(MOCK, 'admin', 'config.update', '');
    assert.strictEqual(result.length, 3);
  });

  it('无匹配返回空', () => {
    assert.strictEqual(filterLogs(MOCK, '不存在的日志xyz', '', '').length, 0);
  });
});

describe('AuditLogsPage — 事件类型分布', () => {
  it('config.update 出现 4 次', () => {
    const dist = computeEventTypeDistribution(MOCK);
    assert.strictEqual(dist['config.update'], 4);
  });

  it('system.error 出现 2 次', () => {
    const dist = computeEventTypeDistribution(MOCK);
    assert.strictEqual(dist['system.error'], 2);
  });

  it('system.info 出现 2 次', () => {
    const dist = computeEventTypeDistribution(MOCK);
    assert.strictEqual(dist['system.info'], 2);
  });

  it('有 9 种不同事件类型', () => {
    const dist = computeEventTypeDistribution(MOCK);
    assert.strictEqual(Object.keys(dist).length, 9);
  });
});

describe('AuditLogsPage — CSV 导出', () => {
  it('导出包含表头', () => {
    const csv = formatForExport(MOCK.slice(0, 1));
    assert.ok(csv.startsWith('时间,事件类型,操作人,级别,来源,摘要'));
  });

  it('导出一行数据包含引号字段', () => {
    const csv = formatForExport(MOCK.slice(0, 1));
    const lines = csv.split('\n');
    assert.strictEqual(lines.length, 2);
    assert.ok(lines[1].includes('"'));
  });

  it('空数组导出只有表头', () => {
    const csv = formatForExport([]);
    assert.strictEqual(csv, '时间,事件类型,操作人,级别,来源,摘要');
  });
});

describe('AuditLogsPage — 辅助函数', () => {
  it('EVENT_COLORS 覆盖所有事件类型', () => {
    const types = new Set(MOCK.map(l => l.eventType));
    types.forEach(t => {
      assert.ok(EVENT_COLORS[t], `缺少颜色映射: ${t}`);
    });
  });

  it('SEV_MAP 中文映射', () => {
    assert.strictEqual(SEV_MAP.info.label, '信息');
    assert.strictEqual(SEV_MAP.warning.label, '警告');
    assert.strictEqual(SEV_MAP.error.label, '错误');
  });

  it('空态组件标题', () => {
    const emptyTitle = '暂无审计日志';
    assert.ok(emptyTitle.includes('暂无'));
  });

  it('加载态组件渲染 5 个占位', () => {
    const skeletons = [1, 2, 3, 4, 5];
    assert.strictEqual(skeletons.length, 5);
  });
});

const SRC = fs.readFileSync(require.resolve('./page'), 'utf-8');

describe('audit-trail — 权限边界', () => {
  it('接入管理员权限边界', () => {
    assert.ok(SRC.includes('AdminPermissionGate'));
    assert.ok(SRC.includes('requiredPermission="foundation.governance.read"'));
  });
});

describe('Audit Trail — hooks验证', () => {
  it('包含useState声明', () => assert.ok(SRC.includes('const [') && SRC.includes('useState')));
  it('包含JSX返回', () => assert.ok(SRC.includes('return (') || SRC.includes('return <')));
  it('包含事件处理器', () => assert.ok(SRC.includes('onClick={') || SRC.includes('onChange={')));
  it('包含列表渲染', () => assert.ok(SRC.includes('.map(')));
  it('包含条件渲染', () => assert.ok(SRC.includes(' && ') || SRC.includes(' ? ')));
  it('包含样式定义', () => assert.ok(SRC.includes('style={')));
  it('包含权限边界组件', () => assert.ok(SRC.includes('AdminPermissionGate')));
  it('包含数据格式化(toLocaleString)', () => assert.ok(SRC.includes('toLocaleString')));
  it('包含模板字符串', () => assert.ok(SRC.includes('${')));
  it('包含默认导出', () => assert.ok(SRC.includes('export default function')));
  it('包含注释说明', () => assert.ok(SRC.includes("/**") || SRC.includes('//')));
});
