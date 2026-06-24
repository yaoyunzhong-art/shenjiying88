/**
 * Alerts List Page — storefront-web
 * Tests: alert list logic, severity/status filter, search, pagination, stats
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据类型 ──

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type AlertCategory = 'system' | 'business' | 'security' | 'device' | 'data';
type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'suppressed';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  category: AlertCategory;
  status: AlertStatus;
  source: string;
  occurredAt: string;
  acknowledgedAt?: string;
  resolvedAt?: string;
  storeName: string;
}

const SEVERITY_ORDER: Record<AlertSeverity, number> = {
  critical: 1,
  high: 2,
  medium: 3,
  low: 4,
  info: 5,
};

const SEVERITY_LABELS: Record<AlertSeverity, string> = {
  critical: '严重',
  high: '高危',
  medium: '中等',
  low: '低危',
  info: '提示',
};

const STATUS_LABELS: Record<AlertStatus, string> = {
  open: '未处理',
  acknowledged: '已确认',
  resolved: '已解决',
  suppressed: '已屏蔽',
};

// ── Mock 数据 ──

const MOCK_ALERTS: Alert[] = [
  { id: 'alt-01', title: 'POS 设备离线', description: '收银机 POS-003 超过 10 分钟未上报心跳', severity: 'critical', category: 'device', status: 'open', source: '心跳监控', occurredAt: '2026-06-24T14:23:00Z', storeName: 'Demo Store 旗舰店' },
  { id: 'alt-02', title: '库存同步延迟', description: 'ERP 库存同步延迟超过 5 分钟', severity: 'high', category: 'data', status: 'acknowledged', source: '数据管道', occurredAt: '2026-06-24T14:10:00Z', acknowledgedAt: '2026-06-24T14:15:00Z', storeName: 'Demo Store 旗舰店' },
  { id: 'alt-03', title: '会员充值异常', description: '会员充值回调连续失败 3 次', severity: 'high', category: 'business', status: 'open', source: '交易监控', occurredAt: '2026-06-24T13:55:00Z', storeName: 'Demo Store 社区店' },
  { id: 'alt-04', title: '折扣规则生效失败', description: '满减规则 #1024 未对订单生效', severity: 'medium', category: 'business', status: 'open', source: '规则引擎', occurredAt: '2026-06-24T13:30:00Z', storeName: 'Demo Store 旗舰店' },
  { id: 'alt-05', title: '数据库连接池告警', description: '主库连接池使用率 85%', severity: 'medium', category: 'system', status: 'acknowledged', source: 'APM 监控', occurredAt: '2026-06-24T12:00:00Z', acknowledgedAt: '2026-06-24T12:10:00Z', storeName: 'Demo Store 旗舰店' },
  { id: 'alt-06', title: 'API 响应时间超标', description: '订单接口 P99 响应时间 3200ms', severity: 'low', category: 'system', status: 'resolved', source: 'APM 监控', occurredAt: '2026-06-24T10:00:00Z', resolvedAt: '2026-06-24T11:30:00Z', storeName: 'Demo Store 旗舰店' },
  { id: 'alt-07', title: '新订单推送延迟', description: 'Webhook 推送订单确认 > 30s', severity: 'low', category: 'business', status: 'resolved', source: '消息队列', occurredAt: '2026-06-24T09:45:00Z', resolvedAt: '2026-06-24T10:20:00Z', storeName: 'Demo Store 社区店' },
  { id: 'alt-08', title: '登录尝试异常', description: '30分钟内 5 次登录失败', severity: 'medium', category: 'security', status: 'open', source: '安全审计', occurredAt: '2026-06-24T08:30:00Z', storeName: 'Demo Store 旗舰店' },
  { id: 'alt-09', title: '库存盘点偏差', description: '商品 SKU-8821 账面与实盘差异 >5%', severity: 'info', category: 'data', status: 'suppressed', source: '库存系统', occurredAt: '2026-06-23T22:00:00Z', storeName: 'Demo Store 社区店' },
  { id: 'alt-10', title: '打印机断联', description: '前台小票打印机 P-002 离线', severity: 'high', category: 'device', status: 'open', source: '设备监控', occurredAt: '2026-06-23T20:15:00Z', storeName: 'Demo Store 社区店' },
  { id: 'alt-11', title: '配送延迟预警', description: '当日配送订单积压 > 50 单', severity: 'medium', category: 'business', status: 'acknowledged', source: '配送调度', occurredAt: '2026-06-23T18:00:00Z', acknowledgedAt: '2026-06-23T18:30:00Z', storeName: 'Demo Store 旗舰店' },
  { id: 'alt-12', title: 'SSL 证书即将过期', description: '域名 api.demostore.cn 证书 7 天后过期', severity: 'low', category: 'security', status: 'open', source: '证书监控', occurredAt: '2026-06-23T16:00:00Z', storeName: 'Demo Store 旗舰店' },
  { id: 'alt-13', title: '内存使用率过高', description: '订单服务节点 3 内存 > 90%', severity: 'critical', category: 'system', status: 'acknowledged', source: 'APM 监控', occurredAt: '2026-06-23T15:30:00Z', acknowledgedAt: '2026-06-23T15:45:00Z', storeName: 'Demo Store 旗舰店' },
  { id: 'alt-14', title: 'WIFI 网络波动', description: '旗舰店办公区丢包率 3.2%', severity: 'info', category: 'system', status: 'resolved', source: '网络监控', occurredAt: '2026-06-23T14:00:00Z', resolvedAt: '2026-06-23T15:00:00Z', storeName: 'Demo Store 旗舰店' },
  { id: 'alt-15', title: '员工权限变更未审批', description: '3 个账号申请高权限角色 48 小时未处理', severity: 'medium', category: 'security', status: 'open', source: 'IAM 系统', occurredAt: '2026-06-23T10:00:00Z', storeName: 'Demo Store 旗舰店' },
];

// ── 纯逻辑函数 ──

function searchFilter(items: Alert[], term: string, fields: (keyof Alert)[]): Alert[] {
  const q = term.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) =>
    fields.some((field) => {
      const val = item[field];
      return typeof val === 'string' && val.toLowerCase().includes(q);
    }),
  );
}

function severityFilter(items: Alert[], severity: AlertSeverity | 'ALL'): Alert[] {
  if (severity === 'ALL') return items;
  return items.filter((item) => item.severity === severity);
}

function statusFilter(items: Alert[], status: AlertStatus | 'ALL'): Alert[] {
  if (status === 'ALL') return items;
  return items.filter((item) => item.status === status);
}

function paginate(items: Alert[], page: number, pageSize: number): Alert[] {
  const start = (page - 1) * pageSize;
  return items.slice(start, start + pageSize);
}

function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

function sortBySeverity(items: Alert[]): Alert[] {
  return [...items].sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);
}

function computeStats(items: Alert[]) {
  const open = items.filter((a) => a.status === 'open').length;
  const acknowledged = items.filter((a) => a.status === 'acknowledged').length;
  const resolved = items.filter((a) => a.status === 'resolved').length;
  const suppressed = items.filter((a) => a.status === 'suppressed').length;
  const critical = items.filter((a) => a.severity === 'critical').length;
  const high = items.filter((a) => a.severity === 'high').length;
  const stores = [...new Set(items.map((a) => a.storeName))].length;
  return { total: items.length, open, acknowledged, resolved, suppressed, critical, high, stores };
}

function unacknowledgedTime(alert: Alert): number | null {
  if (!alert.acknowledgedAt || !alert.occurredAt) return null;
  return new Date(alert.acknowledgedAt).getTime() - new Date(alert.occurredAt).getTime();
}

function resolutionTime(alert: Alert): number | null {
  if (!alert.resolvedAt || !alert.occurredAt) return null;
  return new Date(alert.resolvedAt).getTime() - new Date(alert.occurredAt).getTime();
}

// ── 测试 ──

test('MOCK_ALERTS 有 15 条数据', () => {
  assert.equal(MOCK_ALERTS.length, 15);
});

test('MOCK_ALERTS 所有 ID 唯一', () => {
  const ids = MOCK_ALERTS.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('MOCK_ALERTS 涵盖 5 个严重级别', () => {
  const levels = new Set(MOCK_ALERTS.map((a) => a.severity));
  assert.equal(levels.size, 5);
  for (const l of ['critical', 'high', 'medium', 'low', 'info'] as const) {
    assert.ok(levels.has(l));
  }
});

test('MOCK_ALERTS 涵盖 5 个类别', () => {
  const cats = new Set(MOCK_ALERTS.map((a) => a.category));
  assert.equal(cats.size, 5);
});

test('MOCK_ALERTS 涵盖 4 个状态', () => {
  const statuses = new Set(MOCK_ALERTS.map((a) => a.status));
  assert.equal(statuses.size, 4);
  for (const s of ['open', 'acknowledged', 'resolved', 'suppressed'] as const) {
    assert.ok(statuses.has(s));
  }
});

// ── 搜索 ──

test('搜索: 空字符串返回全部', () => {
  const r = searchFilter(MOCK_ALERTS, '', ['title']);
  assert.equal(r.length, 15);
});

test('搜索: "离线" 匹配标题含 "离线" 的告警', () => {
  const r = searchFilter(MOCK_ALERTS, '离线', ['title']);
  assert.equal(r.length, 1);
  assert.ok(r.every((a) => a.title.includes('离线')));
});

test('搜索: "内存" 匹配标题含 "内存" 的告警', () => {
  const r = searchFilter(MOCK_ALERTS, '内存', ['title']);
  assert.equal(r.length, 1);
  assert.equal(r[0]!.id, 'alt-13');
});

test('搜索: 按 storeName 搜索', () => {
  const r = searchFilter(MOCK_ALERTS, '社区店', ['storeName']);
  assert.equal(r.length, 4);
  assert.ok(r.every((a) => a.storeName.includes('社区店')));
});

test('搜索: 按 source 搜索', () => {
  const r = searchFilter(MOCK_ALERTS, 'APM', ['source']);
  assert.equal(r.length, 3);
  assert.ok(r.every((a) => a.source.includes('APM')));
});

test('搜索: 无匹配返回空', () => {
  const r = searchFilter(MOCK_ALERTS, '不存在的告警', ['title']);
  assert.equal(r.length, 0);
});

test('搜索: 大小写不敏感', () => {
  const r = searchFilter(MOCK_ALERTS, 'apm', ['source']);
  assert.ok(r.length >= 3);
});

// ── 严重级别过滤 ──

test('严重级别过滤: ALL 返回全部', () => {
  const r = severityFilter(MOCK_ALERTS, 'ALL');
  assert.equal(r.length, 15);
});

test('严重级别过滤: critical 返回严重告警', () => {
  const r = severityFilter(MOCK_ALERTS, 'critical');
  assert.equal(r.length, 2);
  assert.ok(r.every((a) => a.severity === 'critical'));
});

test('严重级别过滤: high 返回高危告警', () => {
  const r = severityFilter(MOCK_ALERTS, 'high');
  assert.equal(r.length, 3);
  assert.ok(r.every((a) => a.severity === 'high'));
});

test('严重级别过滤: info 返回提示告警', () => {
  const r = severityFilter(MOCK_ALERTS, 'info');
  assert.equal(r.length, 2);
  assert.ok(r.every((a) => a.severity === 'info'));
});

// ── 状态过滤 ──

test('状态过滤: open 返回未处理告警', () => {
  const r = statusFilter(MOCK_ALERTS, 'open');
  assert.equal(r.length, 7);
  assert.ok(r.every((a) => a.status === 'open'));
});

test('状态过滤: resolved 返回已解决告警', () => {
  const r = statusFilter(MOCK_ALERTS, 'resolved');
  assert.equal(r.length, 3);
  assert.ok(r.every((a) => a.status === 'resolved'));
});

test('状态过滤: suppressed 返回已屏蔽告警', () => {
  const r = statusFilter(MOCK_ALERTS, 'suppressed');
  assert.equal(r.length, 1);
  assert.equal(r[0]!.id, 'alt-09');
});

// ── 组合过滤 (搜索 + 严重级别 + 状态) ──

test('组合: 严重级别 high + 状态 open', () => {
  const bySeverity = severityFilter(MOCK_ALERTS, 'high');
  const byStatus = statusFilter(bySeverity, 'open');
  assert.equal(byStatus.length, 2);
  assert.ok(byStatus.every((a) => a.severity === 'high' && a.status === 'open'));
});

test('组合: 搜索 "旗舰店" + 状态 open', () => {
  const searched = searchFilter(MOCK_ALERTS, '旗舰店', ['storeName']);
  const filtered = statusFilter(searched, 'open');
  assert.ok(filtered.length >= 4);
  assert.ok(filtered.every((a) => a.storeName.includes('旗舰店')));
  assert.ok(filtered.every((a) => a.status === 'open'));
});

test('组合: 搜索 + 严重级别 + 状态 三重过滤', () => {
  const searched = searchFilter(MOCK_ALERTS, '旗舰店', ['storeName']);
  const bySeverity = severityFilter(searched, 'medium');
  const byStatus = statusFilter(bySeverity, 'open');
  assert.ok(byStatus.every((a) => a.storeName.includes('旗舰店')));
  assert.ok(byStatus.every((a) => a.severity === 'medium'));
  assert.ok(byStatus.every((a) => a.status === 'open'));
});

// ── 分页 ──

test('分页: pageSize=10, 2 页', () => {
  assert.equal(totalPages(15, 10), 2);
});

test('分页: pageSize=5, 3 页', () => {
  assert.equal(totalPages(15, 5), 3);
});

test('分页: 空数组 → 1 页 (最小)', () => {
  assert.equal(totalPages(0, 10), 1);
});

test('分页: 第 1 页返回前 10 条', () => {
  const r = paginate(MOCK_ALERTS, 1, 10);
  assert.equal(r.length, 10);
  assert.equal(r[0]!.id, 'alt-01');
});

test('分页: 第 2 页返回后 5 条', () => {
  const r = paginate(MOCK_ALERTS, 2, 10);
  assert.equal(r.length, 5);
  assert.equal(r[0]!.id, 'alt-11');
});

test('分页: 超出范围返回空', () => {
  const r = paginate(MOCK_ALERTS, 99, 10);
  assert.equal(r.length, 0);
});

// ── 严重级别排序 ──

test('排序: sortBySeverity 按严重级别降序排列', () => {
  const sorted = sortBySeverity(MOCK_ALERTS);
  for (let i = 1; i < sorted.length; i++) {
    assert.ok(
      SEVERITY_ORDER[sorted[i - 1]!.severity] <= SEVERITY_ORDER[sorted[i]!.severity],
      `排序错误: ${sorted[i - 1]!.id} (${sorted[i - 1]!.severity}) > ${sorted[i]!.id} (${sorted[i]!.severity})`,
    );
  }
});

// ── 统计 ──

test('统计: total = 15', () => {
  const stats = computeStats(MOCK_ALERTS);
  assert.equal(stats.total, 15);
});

test('统计: open = 7', () => {
  const stats = computeStats(MOCK_ALERTS);
  assert.equal(stats.open, 7);
});

test('统计: critical = 2', () => {
  const stats = computeStats(MOCK_ALERTS);
  assert.equal(stats.critical, 2);
});

test('统计: high = 3', () => {
  const stats = computeStats(MOCK_ALERTS);
  assert.equal(stats.high, 3);
});

test('统计: stores >= 2', () => {
  const stats = computeStats(MOCK_ALERTS);
  assert.ok(stats.stores >= 2);
});

test('统计: 空数组返回 0', () => {
  const stats = computeStats([]);
  assert.equal(stats.total, 0);
  assert.equal(stats.open, 0);
  assert.equal(stats.critical, 0);
  assert.equal(stats.stores, 0);
});

// ── 响应时间计算 ──

test('unacknowledgedTime: 计算确认耗时', () => {
  const alert = MOCK_ALERTS.find((a) => a.id === 'alt-02')!;
  const ms = unacknowledgedTime(alert);
  assert.ok(ms !== null);
  assert.equal(ms, 5 * 60 * 1000); // 5 minutes
});

test('unacknowledgedTime: 未确认返回 null', () => {
  const alert = MOCK_ALERTS.find((a) => a.id === 'alt-01')!;
  assert.equal(unacknowledgedTime(alert), null);
});

test('resolutionTime: 计算解决耗时', () => {
  const alert = MOCK_ALERTS.find((a) => a.id === 'alt-06')!;
  const ms = resolutionTime(alert);
  assert.ok(ms !== null);
  assert.equal(ms, 90 * 60 * 1000); // 90 minutes
});

test('resolutionTime: 未解决返回 null', () => {
  const alert = MOCK_ALERTS.find((a) => a.id === 'alt-01')!;
  assert.equal(resolutionTime(alert), null);
});

// ── 映射常量 ──

test('SEVERITY_LABELS: 5 个级别都有中文标签', () => {
  assert.equal(Object.keys(SEVERITY_LABELS).length, 5);
  for (const l of ['critical', 'high', 'medium', 'low', 'info'] as const) {
    assert.ok(typeof SEVERITY_LABELS[l] === 'string' && SEVERITY_LABELS[l].length > 0);
  }
});

test('STATUS_LABELS: 4 个状态都有中文标签', () => {
  assert.equal(Object.keys(STATUS_LABELS).length, 4);
});

// ── 数据完整性 ──

test('数据完整性: 每条告警都有必要字段', () => {
  for (const a of MOCK_ALERTS) {
    assert.ok(typeof a.id === 'string' && a.id.length > 0, `id required for ${a.title}`);
    assert.ok(typeof a.title === 'string' && a.title.length > 0, `title required for ${a.id}`);
    assert.ok(typeof a.description === 'string' && a.description.length > 0, `description required for ${a.id}`);
    assert.ok(typeof a.severity === 'string', `severity required for ${a.id}`);
    assert.ok(typeof a.category === 'string', `category required for ${a.id}`);
    assert.ok(typeof a.status === 'string', `status required for ${a.id}`);
    assert.ok(typeof a.occurredAt === 'string' && a.occurredAt.length > 0, `occurredAt required for ${a.id}`);
  }
});

test('数据完整性: occurredAt 格式为 ISO 8601', () => {
  for (const a of MOCK_ALERTS) {
    assert.ok(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/.test(a.occurredAt),
      `${a.id} invalid occurredAt: ${a.occurredAt}`);
  }
});

test('数据完整性: acknowledgedAt >= occurredAt (如果存在)', () => {
  for (const a of MOCK_ALERTS) {
    if (a.acknowledgedAt) {
      assert.ok(new Date(a.acknowledgedAt) >= new Date(a.occurredAt),
        `${a.id} acknowledgedAt < occurredAt`);
    }
  }
});

test('数据完整性: resolvedAt >= occurredAt (如果存在)', () => {
  for (const a of MOCK_ALERTS) {
    if (a.resolvedAt) {
      assert.ok(new Date(a.resolvedAt) >= new Date(a.occurredAt),
        `${a.id} resolvedAt < occurredAt`);
    }
  }
});



// ── 边缘情况 ──

test('边缘: 跨字段搜索数字 "003"', () => {
  const r = searchFilter(MOCK_ALERTS, '003', ['title', 'description']);
  assert.equal(r.length, 1);
  assert.equal(r[0]!.id, 'alt-01');
});

test('边缘: 英文关键词搜索', () => {
  const r = searchFilter(MOCK_ALERTS, 'ssl', ['title', 'description']);
  assert.equal(r.length, 1);
  assert.equal(r[0]!.id, 'alt-12');
});

test('边缘: 搜索 "88" 无匹配', () => {
  const r = searchFilter(MOCK_ALERTS, '88', ['title']);
  assert.equal(r.length, 0);
});

test('边缘: 严重级别 critical + resolved 组合', () => {
  const bySeverity = severityFilter(MOCK_ALERTS, 'critical');
  const byStatus = statusFilter(bySeverity, 'resolved');
  assert.equal(byStatus.length, 0); // 没有已解决的 critical 告警
});

test('边缘: 含 timezone 的 ISO 格式均有效', () => {
  for (const a of MOCK_ALERTS) {
    const d = new Date(a.occurredAt);
    assert.ok(!isNaN(d.getTime()), `${a.id} invalid date: ${a.occurredAt}`);
  }
});
