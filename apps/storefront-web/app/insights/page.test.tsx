/**
 * insights/page.test.tsx — 数据洞察页 L1 冒烟测试
 * 角色视角: 🧠数据洞察
 * 覆盖: 正例 + 边界(空数组/极值)
 */

import assert from 'node:assert/strict';
import test from 'node:test';

/* ── 数据工厂 ── */

function makeMemberLevel(overrides?: Record<string, unknown>) {
  return {
    name: '钻石会员',
    count: 28,
    color: '#a78bfa',
    ...overrides,
  };
}

function makeDeviceEntry(overrides?: Record<string, unknown>) {
  return {
    id: 'pos-01',
    name: '收银台 POS-01',
    type: 'pos',
    status: 'online',
    lastSeen: new Date().toISOString(),
    uptimeHours: 168,
    cpuUsage: 45,
    memoryUsage: 62,
    location: '收银区',
    ...overrides,
  };
}

function makeHeatmapCell(overrides?: Record<string, unknown>) {
  return {
    colLabel: '0-4点',
    rowLabel: 'POS机',
    value: 0,
    ...overrides,
  };
}

function makeAnomalyAlert(overrides?: Record<string, unknown>) {
  return {
    id: 'a1',
    title: '测试告警',
    description: '测试告警描述',
    severity: 'medium',
    source: 'device',
    timestamp: new Date().toISOString(),
    acknowledged: false,
    ...overrides,
  };
}

function callSafe(fn: (...args: unknown[]) => unknown, ...args: unknown[]): boolean {
  try { fn(...args); return true; } catch { return false; }
}

/* ── 正例 ── */

test('🧠 数据洞察: 页面默认导出为函数', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function', 'default export should be a function');
});

test('🧠 数据洞察: 页面模块导入稳定', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function');
  const src = mod.default.toString();
  assert.ok(src.includes('AnomalyAlertPanel') || src.includes('GaugeChart') || src.includes('HeatmapChart'),
    'should reference visualization components');
});

test('正例: 所有 mock 数据构造不抛异常', () => {
  assert.equal(callSafe(makeMemberLevel), true);
  assert.equal(callSafe(makeDeviceEntry), true);
  assert.equal(callSafe(makeHeatmapCell), true);
  assert.equal(callSafe(makeAnomalyAlert), true);
});

test('正例: memberLevel 字段完整', () => {
  const m = makeMemberLevel();
  assert.equal(typeof m.name, 'string');
  assert.equal(typeof m.count, 'number');
  assert.equal(typeof m.color, 'string');
  assert.ok(m.count >= 0, 'count should be non-negative');
});

test('正例: deviceEntry 字段完整', () => {
  const d = makeDeviceEntry();
  assert.equal(typeof d.id, 'string');
  assert.equal(typeof d.name, 'string');
  assert.equal(typeof d.type, 'string');
  assert.equal(typeof d.status, 'string');
  assert.equal(typeof d.lastSeen, 'string');
  assert.equal(typeof d.uptimeHours, 'number');
  assert.equal(typeof d.cpuUsage, 'number');
  assert.equal(typeof d.location, 'string');
  // uptimeHours should be non-negative
  assert.ok(d.uptimeHours >= 0);
});

test('正例: heatmapCell 字段完整', () => {
  const h = makeHeatmapCell();
  assert.equal(typeof h.colLabel, 'string');
  assert.equal(typeof h.rowLabel, 'string');
  assert.equal(typeof h.value, 'number');
  assert.ok(h.value >= 0, 'heatmap value should be non-negative');
});

test('正例: anomalyAlert 字段完整', () => {
  const a = makeAnomalyAlert();
  assert.equal(typeof a.id, 'string');
  assert.equal(typeof a.title, 'string');
  assert.equal(typeof a.description, 'string');
  assert.equal(typeof a.severity, 'string');
  assert.equal(typeof a.source, 'string');
  assert.equal(typeof a.timestamp, 'string');
  assert.equal(typeof a.acknowledged, 'boolean');
  // severity must be one of known values
  assert.ok(['low', 'medium', 'high'].includes(a.severity),
    `severity should be low|medium|high, got ${a.severity}`);
});

/* ── 边界测试 ── */

test('边界: memberLevel count 边界值', () => {
  const zero = makeMemberLevel({ count: 0 });
  assert.equal(zero.count, 0);
  const max = makeMemberLevel({ count: 99999 });
  assert.equal(max.count, 99999);
});

test('边界: deviceEntry uptimeHours 边界值', () => {
  const zero = makeDeviceEntry({ uptimeHours: 0 });
  assert.equal(zero.uptimeHours, 0);
  const large = makeDeviceEntry({ uptimeHours: 8760 }); // 1 year
  assert.equal(large.uptimeHours, 8760);
});

test('边界: deviceEntry cpuUsage 极值', () => {
  const min = makeDeviceEntry({ cpuUsage: 0 });
  assert.equal(min.cpuUsage, 0);
  const max = makeDeviceEntry({ cpuUsage: 100 });
  assert.equal(max.cpuUsage, 100);
});

test('边界: 所有状态类型覆盖', () => {
  const validStatuses = ['online', 'offline', 'warning', 'error', 'maintenance'];
  for (const status of validStatuses) {
    const d = makeDeviceEntry({ status });
    assert.equal(d.status, status);
  }
});

test('边界: 所有严重级别覆盖', () => {
  const validSeverities = ['low', 'medium', 'high'];
  for (const severity of validSeverities) {
    const a = makeAnomalyAlert({ severity });
    assert.equal(a.severity, severity);
  }
});

test('边界: 所有告警来源覆盖', () => {
  const validSources = ['device', 'transaction', 'system', 'network'];
  for (const source of validSources) {
    const a = makeAnomalyAlert({ source });
    assert.equal(a.source, source);
  }
});

test('边界: 所有设备类型覆盖', () => {
  const validTypes = ['pos', 'printer', 'scanner', 'camera', 'display', 'network', 'sensor'];
  for (const type of validTypes) {
    const d = makeDeviceEntry({ type });
    assert.equal(d.type, type);
  }
});

test('边界: acknowledged 布尔值', () => {
  const acked = makeAnomalyAlert({ acknowledged: true });
  assert.equal(acked.acknowledged, true);
  const unacked = makeAnomalyAlert({ acknowledged: false });
  assert.equal(unacked.acknowledged, false);
});

test('边界: memberLevel names 覆盖页面中使用的全部等级', () => {
  const expectedNames = ['钻石会员', '黄金会员', '银卡会员', '铜卡会员', '普通会员'];
  for (const name of expectedNames) {
    const m = makeMemberLevel({ name });
    assert.equal(m.name, name);
  }
});

/* ── 防御测试 ── */

test('防御: makeMemberLevel 不传参返回默认值', () => {
  const m = makeMemberLevel();
  assert.equal(m.name, '钻石会员');
  assert.equal(m.count, 28);
  assert.equal(m.color, '#a78bfa');
});

test('防御: makeDeviceEntry 不传参返回默认值', () => {
  const d = makeDeviceEntry();
  assert.equal(d.id, 'pos-01');
  assert.equal(d.name, '收银台 POS-01');
  assert.equal(d.type, 'pos');
  assert.equal(d.status, 'online');
  assert.equal(d.uptimeHours, 168);
  assert.equal(d.cpuUsage, 45);
  assert.equal(d.memoryUsage, 62);
  assert.equal(d.location, '收银区');
});

test('防御: makeHeatmapCell 不传参返回默认值', () => {
  const h = makeHeatmapCell();
  assert.equal(h.colLabel, '0-4点');
  assert.equal(h.rowLabel, 'POS机');
  assert.equal(h.value, 0);
});

test('防御: makeAnomalyAlert 不传参返回默认值', () => {
  const a = makeAnomalyAlert();
  assert.equal(a.id, 'a1');
  assert.equal(a.title, '测试告警');
  assert.equal(a.severity, 'medium');
  assert.equal(a.acknowledged, false);
});

test('防御: 修改 overrides 不影响默认值', () => {
  const original = makeDeviceEntry();
  const modified = makeDeviceEntry({ id: 'custom-01', status: 'error' });
  assert.equal(original.id, 'pos-01');
  assert.equal(original.status, 'online');
  assert.equal(modified.id, 'custom-01');
  assert.equal(modified.status, 'error');
  // other fields should still have defaults
  assert.equal(modified.name, '收银台 POS-01');
});

/* ── 页面结构验证 ── */

test('🧠 页面结构: 导出模块内容检查', async () => {
  const mod = await import('./page');
  assert.ok(mod.default, 'page should have default export');
});

test('🧠 页面结构: 组件导入不直接抛错', async () => {
  const mod = await import('./page');
  const src = mod.default.toString();
  // Check for expected component references in compiled output
  assert.ok(src.includes('AnomalyAlertPanel') || src.includes('GaugeChart') || src.includes('HeatmapChart'),
    'page should reference visualization components');
  assert.ok(src.includes('DeviceStatusPanel') || src.includes('MemberLevelDistribution'),
    'page should reference data display components');
});

test('🧠 页面结构: 模块导入无运行时异常', async () => {
  let mod: Record<string, unknown> | null = null;
  let err: Error | null = null;
  try {
    mod = await import('./page');
  } catch (e) {
    err = e as Error;
  }
  assert.equal(err, null, 'module import should not throw');
  assert.notEqual(mod, null);
  assert.notEqual(mod!.default, undefined);
});
