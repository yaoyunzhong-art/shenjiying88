/**
 * Alert Detail Page — storefront-web
 * Tests: detail page rendering logic, alert look-up, not-found handling
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// ── 数据类型 ──

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
type AlertCategory = 'system' | 'business' | 'security' | 'device' | 'data';
type AlertStatus = 'open' | 'acknowledged' | 'resolved' | 'suppressed';

interface AlertDetail {
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
  affectedSystem?: string;
  assignee?: string;
  resolution?: string;
}

// ── Mock 详情数据 (与 page.tsx 的 foundationAlertDetailDemoPresets.storefront 类似结构) ──

const MOCK_DETAILS: AlertDetail[] = [
  {
    id: 'alt-01',
    title: 'POS 设备离线',
    description: '收银机 POS-003 超过 10 分钟未上报心跳。请尽快联系门店 IT 人员检查网络连接与设备状态。',
    severity: 'critical',
    category: 'device',
    status: 'open',
    source: '心跳监控',
    occurredAt: '2026-06-24T14:23:00Z',
    storeName: 'Demo Store 旗舰店',
    affectedSystem: 'POS-003',
  },
  {
    id: 'alt-02',
    title: '库存同步延迟',
    description: 'ERP 库存同步延迟超过 5 分钟，可能导致线上订单库存数据不准确。',
    severity: 'high',
    category: 'data',
    status: 'acknowledged',
    source: '数据管道',
    occurredAt: '2026-06-24T14:10:00Z',
    acknowledgedAt: '2026-06-24T14:15:00Z',
    storeName: 'Demo Store 旗舰店',
    assignee: '张三',
    affectedSystem: 'ERP 同步服务',
  },
  {
    id: 'alt-03',
    title: '会员充值异常',
    description: '会员充值回调连续失败 3 次，需检查支付网关配置。',
    severity: 'high',
    category: 'business',
    status: 'open',
    source: '交易监控',
    occurredAt: '2026-06-24T13:55:00Z',
    storeName: 'Demo Store 社区店',
    assignee: '李四',
    affectedSystem: '支付网关',
  },
  {
    id: 'alt-06',
    title: 'API 响应时间超标',
    description: '订单接口 P99 响应时间 3200ms，超过 2000ms 阈值。',
    severity: 'low',
    category: 'system',
    status: 'resolved',
    source: 'APM 监控',
    occurredAt: '2026-06-24T10:00:00Z',
    resolvedAt: '2026-06-24T11:30:00Z',
    storeName: 'Demo Store 旗舰店',
    assignee: '王五',
    resolution: '扩容订单服务节点至 5 个副本，缓存热点数据',
  },
  {
    id: 'alt-13',
    title: '内存使用率过高',
    description: '订单服务节点 3 内存使用率 92%，超过 85% 预警线。',
    severity: 'critical',
    category: 'system',
    status: 'acknowledged',
    source: 'APM 监控',
    occurredAt: '2026-06-23T15:30:00Z',
    acknowledgedAt: '2026-06-23T15:45:00Z',
    storeName: 'Demo Store 旗舰店',
    assignee: '赵六',
    affectedSystem: '订单服务节点 3',
  },
];

// ── 纯逻辑函数 ──

function findAlertById(details: AlertDetail[], id: string): AlertDetail | undefined {
  return details.find((d) => d.id === id);
}

function getAlertsBySeverity(details: AlertDetail[], severity: AlertSeverity): AlertDetail[] {
  return details.filter((d) => d.severity === severity);
}

function getAlertsByCategory(details: AlertDetail[], category: AlertCategory): AlertDetail[] {
  return details.filter((d) => d.category === category);
}

function getAlertsByStatus(details: AlertDetail[], status: AlertStatus): AlertDetail[] {
  return details.filter((d) => d.status === status);
}

function formatAlertTime(occurredAt: string): string {
  try {
    const d = new Date(occurredAt);
    if (isNaN(d.getTime())) return 'Invalid date';
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const mins = String(d.getUTCMinutes()).padStart(2, '0');
    return `${month}-${day} ${hours}:${mins}`;
  } catch {
    return 'Invalid date';
  }
}

function getSeverityPriority(severity: AlertSeverity): number {
  const map: Record<string, number> = { critical: 5, high: 4, medium: 3, low: 2, info: 1 };
  return map[severity] ?? 0;
}

function validateAlertDetail(alert: AlertDetail): string[] {
  const errors: string[] = [];
  if (!alert.id) errors.push('id 必填');
  if (!alert.title) errors.push('title 必填');
  if (!alert.description) errors.push('description 必填');
  if (!alert.severity) errors.push('severity 必填');
  if (!alert.status) errors.push('status 必填');
  if (!alert.occurredAt) errors.push('occurredAt 必填');
  if (isNaN(new Date(alert.occurredAt).getTime())) errors.push('occurredAt 无效日期');
  if (alert.acknowledgedAt && isNaN(new Date(alert.acknowledgedAt).getTime())) errors.push('acknowledgedAt 无效日期');
  if (alert.resolvedAt && isNaN(new Date(alert.resolvedAt).getTime())) errors.push('resolvedAt 无效日期');
  const validStatuses = ['open', 'acknowledged', 'resolved', 'suppressed'] as const;
  if (!(validStatuses as readonly string[]).includes(alert.status)) {
    errors.push(`status ${alert.status} 无效`);
  }
  return errors;
}

function getActionButtons(status: AlertStatus, hasAssignee: boolean): string[] {
  const actions: string[] = [];
  if (status === 'open') {
    actions.push('确认告警');
    actions.push('分配处理人');
  }
  if (status === 'acknowledged') {
    if (hasAssignee) {
      actions.push('标记已解决');
    } else {
      actions.push('分配处理人');
    }
  }
  if (status === 'resolved') {
    actions.push('查看解决报告');
  }
  if (status === 'suppressed') {
    actions.push('取消屏蔽');
  }
  return actions;
}

function timeSinceOccurred(occurredAt: string, now: Date = new Date()): number {
  return now.getTime() - new Date(occurredAt).getTime();
}

// ── 测试 ──

test('MOCK_DETAILS 有 5 条详情数据', () => {
  assert.equal(MOCK_DETAILS.length, 5);
});

test('MOCK_DETAILS 所有 ID 唯一', () => {
  const ids = MOCK_DETAILS.map((d) => d.id);
  assert.equal(new Set(ids).size, ids.length);
});

// ── 查找 ──

test('findAlertById: 查找存在的告警', () => {
  const alert = findAlertById(MOCK_DETAILS, 'alt-01');
  assert.ok(alert !== undefined);
  assert.equal(alert!.title, 'POS 设备离线');
});

test('findAlertById: 查找第二个告警', () => {
  const alert = findAlertById(MOCK_DETAILS, 'alt-02');
  assert.ok(alert !== undefined);
  assert.equal(alert!.status, 'acknowledged');
});

test('findAlertById: 不存在的 ID 返回 undefined', () => {
  const alert = findAlertById(MOCK_DETAILS, 'non-existent');
  assert.equal(alert, undefined);
});

// ── 验证 ──

test('验证: 所有 mock 详情通过验证', () => {
  for (const d of MOCK_DETAILS) {
    const errors = validateAlertDetail(d);
    assert.equal(errors.length, 0, `${d.id}: ${errors.join(', ')}`);
  }
});

test('验证: 缺失 title 报错', () => {
  const bad = { ...MOCK_DETAILS[0]!, title: '' };
  const errors = validateAlertDetail(bad);
  assert.ok(errors.some((e) => e.includes('title')));
});

test('验证: 无效日期报错', () => {
  const bad = { ...MOCK_DETAILS[0]!, occurredAt: 'invalid-date' };
  const errors = validateAlertDetail(bad);
  assert.ok(errors.some((e) => e.includes('日期')));
});

test('验证: 无效 status 报错', () => {
  const bad = { ...MOCK_DETAILS[0]!, status: 'unknown' as AlertStatus };
  const errors = validateAlertDetail(bad);
  assert.ok(errors.some((e) => e.includes('status')));
});

// ── 操作按钮 ──

test('操作按钮: open 状态应有 确认告警 和 分配处理人', () => {
  const btns = getActionButtons('open', false);
  assert.ok(btns.includes('确认告警'));
  assert.ok(btns.includes('分配处理人'));
});

test('操作按钮: acknowledged + 有处理人 应有 标记已解决', () => {
  const btns = getActionButtons('acknowledged', true);
  assert.ok(btns.includes('标记已解决'));
  assert.ok(!btns.includes('分配处理人'));
});

test('操作按钮: acknowledged + 无处理人 应有 分配处理人', () => {
  const btns = getActionButtons('acknowledged', false);
  assert.ok(btns.includes('分配处理人'));
  assert.ok(!btns.includes('标记已解决'));
});

test('操作按钮: resolved 应有 查看解决报告', () => {
  const btns = getActionButtons('resolved', false);
  assert.ok(btns.includes('查看解决报告'));
});

test('操作按钮: suppressed 应有 取消屏蔽', () => {
  const btns = getActionButtons('suppressed', false);
  assert.ok(btns.includes('取消屏蔽'));
});

// ── 时间差 ──

test('timeSinceOccurred: 过去的时间应返回正数', () => {
  const now = new Date('2026-06-25T12:00:00Z');
  assert.ok(timeSinceOccurred('2026-06-24T10:00:00Z', now) > 0);
});

test('timeSinceOccurred: 最近的事件返回较小值', () => {
  const now = new Date('2026-06-25T12:00:00Z');
  const older = timeSinceOccurred('2026-06-24T10:00:00Z', now);
  const newer = timeSinceOccurred('2026-06-24T14:23:00Z', now);
  assert.ok(newer < older);
});

// ── 数据完整性 ──

test('数据完整性: 每条详情都有 resolution (resolved 状态)', () => {
  const resolved = MOCK_DETAILS.filter((d) => d.status === 'resolved');
  for (const r of resolved) {
    assert.ok(typeof r.resolution === 'string' && r.resolution.length > 0,
      `${r.id} should have resolution`);
  }
});

test('数据完整性: open 状态没有 resolvedAt', () => {
  const open = MOCK_DETAILS.filter((d) => d.status === 'open');
  for (const o of open) {
    assert.equal(o.resolvedAt, undefined, `${o.id} open status should not have resolvedAt`);
  }
});

test('数据完整性: acknowledged 状态有 assignee 更合理', () => {
  const acknowledged = MOCK_DETAILS.filter((d) => d.status === 'acknowledged');
  for (const a of acknowledged) {
    assert.ok(typeof a.assignee === 'string' && a.assignee.length > 0,
      `${a.id} should have assignee when acknowledged`);
  }
});

test('数据完整性: occurredAt 均为有效 ISO 8601', () => {
  for (const d of MOCK_DETAILS) {
    const date = new Date(d.occurredAt);
    assert.ok(!isNaN(date.getTime()), `${d.id} invalid occurredAt`);
  }
});

// ── 边缘情况 ──

test('边缘: getActionButtons 空数组 (不可能的状态)', () => {
  const btns = getActionButtons('unknown' as AlertStatus, false);
  assert.equal(btns.length, 0);
});

test('边缘: resolve 告警的时间应大于 acknowledge 时间', () => {
  const alert = MOCK_DETAILS.find((d) => d.id === 'alt-06')!;
  assert.ok(alert.resolvedAt !== undefined);
  assert.ok(new Date(alert.resolvedAt) >= new Date(alert.occurredAt));
});

test('边缘: acknowledgedAt 应 >= occurredAt', () => {
  for (const d of MOCK_DETAILS) {
    if (d.acknowledgedAt) {
      assert.ok(new Date(d.acknowledgedAt) >= new Date(d.occurredAt));
    }
  }
});

// ── 新增: 按严重程度过滤 ──

test('getAlertsBySeverity: 查找 critical 级别告警 (2条)', () => {
  const crit = getAlertsBySeverity(MOCK_DETAILS, 'critical');
  assert.equal(crit.length, 2);
  assert.ok(crit.every((a) => a.severity === 'critical'));
});

test('getAlertsBySeverity: 查找 medium 级别告警 (0条)', () => {
  const med = getAlertsBySeverity(MOCK_DETAILS, 'medium');
  assert.equal(med.length, 0);
});

test('getAlertsBySeverity: 查找 low 级别告警 (1条)', () => {
  const low = getAlertsBySeverity(MOCK_DETAILS, 'low');
  assert.equal(low.length, 1);
  assert.equal(low[0]!.id, 'alt-06');
});

test('getAlertsBySeverity: 查找 info 级别告警 (0条)', () => {
  const info = getAlertsBySeverity(MOCK_DETAILS, 'info');
  assert.equal(info.length, 0);
});

// ── 新增: 按分类过滤 ──

test('getAlertsByCategory: 查找 device 分类 (1条)', () => {
  const device = getAlertsByCategory(MOCK_DETAILS, 'device');
  assert.equal(device.length, 1);
  assert.equal(device[0]!.id, 'alt-01');
});

test('getAlertsByCategory: 查找 system 分类 (2条)', () => {
  const sys = getAlertsByCategory(MOCK_DETAILS, 'system');
  assert.equal(sys.length, 2);
});

test('getAlertsByCategory: 查找 security 分类 (0条)', () => {
  const sec = getAlertsByCategory(MOCK_DETAILS, 'security');
  assert.equal(sec.length, 0);
});

// ── 新增: 按状态过滤 ──

test('getAlertsByStatus: open 状态 (2条)', () => {
  const open = getAlertsByStatus(MOCK_DETAILS, 'open');
  assert.equal(open.length, 2);
});

test('getAlertsByStatus: acknowledged 状态 (2条)', () => {
  const ack = getAlertsByStatus(MOCK_DETAILS, 'acknowledged');
  assert.equal(ack.length, 2);
});

test('getAlertsByStatus: resolved 状态 (1条)', () => {
  const res = getAlertsByStatus(MOCK_DETAILS, 'resolved');
  assert.equal(res.length, 1);
});

test('getAlertsByStatus: suppressed 状态 (0条)', () => {
  const sup = getAlertsByStatus(MOCK_DETAILS, 'suppressed');
  assert.equal(sup.length, 0);
});

// ── 新增: formatAlertTime ──

test('formatAlertTime: 格式化时间正确', () => {
  const formatted = formatAlertTime('2026-06-24T14:23:00Z');
  assert.equal(formatted, '06-24 14:23');
});

test('formatAlertTime: 无效输入返回 Invalid date', () => {
  assert.equal(formatAlertTime(''), 'Invalid date');
  assert.equal(formatAlertTime('not-a-date'), 'Invalid date');
});

// ── 新增: getSeverityPriority ──

test('getSeverityPriority: critical 优先级最高 (5)', () => {
  assert.equal(getSeverityPriority('critical'), 5);
});

test('getSeverityPriority: info 优先级最低 (1)', () => {
  assert.equal(getSeverityPriority('info'), 1);
});

test('getSeverityPriority: 未知级别返回 0', () => {
  assert.equal(getSeverityPriority('unknown' as AlertSeverity), 0);
});

test('getSeverityPriority: 高到低排序正确', () => {
  const sorted: AlertSeverity[] = ['critical', 'high', 'medium', 'low', 'info'];
  for (let i = 0; i < sorted.length - 1; i++) {
    assert.ok(
      getSeverityPriority(sorted[i]!) > getSeverityPriority(sorted[i + 1]!),
      `${sorted[i]} should be higher than ${sorted[i + 1]}`
    );
  }
});

// ── 新增: getAlertsBySeverity + getAlertsByStatus 组合测试 ──

test('组合: critical + acknowledged = 1条 (alt-13)', () => {
  const crit = getAlertsBySeverity(MOCK_DETAILS, 'critical');
  const critAck = getAlertsByStatus(crit, 'acknowledged');
  assert.equal(critAck.length, 1);
  assert.equal(critAck[0]!.id, 'alt-13');
});

test('组合: high + open = 1条 (alt-03)', () => {
  const high = getAlertsBySeverity(MOCK_DETAILS, 'high');
  const highOpen = getAlertsByStatus(high, 'open');
  assert.equal(highOpen.length, 1);
  assert.equal(highOpen[0]!.id, 'alt-03');
});
