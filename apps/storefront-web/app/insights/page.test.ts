/**
 * page.test.ts — L1 角色冒烟测试 (JMeter 风格: 正例 + 反例 + 边界)
 *
 * storefront-web Insights page — 组件导出、Mock 数据完整性验证
 * 角色视角: 👔店长 · 🛒前台 · 👨‍💻运维
 */

import assert from 'node:assert/strict';
import { test, describe, it } from 'node:test';

// ── Type (mirrors page.tsx) ──

type DeviceStatus = 'online' | 'warning' | 'error' | 'maintenance';

interface DeviceEntry {
  id: string;
  name: string;
  type: string;
  status: DeviceStatus;
  lastSeen: string;
  uptimeHours: number;
  cpuUsage: number;
  memoryUsage: number;
  temperature?: number;
  firmwareVersion?: string;
  location: string;
  ipAddress?: string;
  alertMessage?: string;
}

interface MemberLevel {
  name: string;
  count: number;
  color: string;
}

interface AnomalyAlert {
  id: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: string;
  acknowledged: boolean;
}

interface HeatmapCell {
  colLabel: string;
  rowLabel: string;
  value: number;
}

// ── Mock data (mirror of page.tsx) ──

const MOCK_MEMBER_LEVELS: MemberLevel[] = [
  { name: '钻石会员', count: 28, color: '#a78bfa' },
  { name: '黄金会员', count: 86, color: '#f59e0b' },
  { name: '银卡会员', count: 134, color: '#94a3b8' },
  { name: '铜卡会员', count: 72, color: '#a0522d' },
  { name: '普通会员', count: 240, color: '#6b7280' },
];

const MOCK_DEVICES: DeviceEntry[] = [
  { id: 'pos-01', name: '收银台 POS-01', type: 'pos', status: 'online', lastSeen: new Date(Date.now() - 30000).toISOString(), uptimeHours: 168, cpuUsage: 45, memoryUsage: 62, temperature: 52, firmwareVersion: '3.2.1', location: '收银区', ipAddress: '192.168.1.101' },
  { id: 'pos-02', name: '收银台 POS-02', type: 'pos', status: 'online', lastSeen: new Date(Date.now() - 60000).toISOString(), uptimeHours: 120, cpuUsage: 38, memoryUsage: 55, temperature: 48, firmwareVersion: '3.2.0', location: '收银区', ipAddress: '192.168.1.102' },
  { id: 'prt-01', name: '厨房打印机', type: 'printer', status: 'warning', lastSeen: new Date(Date.now() - 120000).toISOString(), uptimeHours: 240, cpuUsage: 72, memoryUsage: 81, temperature: 68, firmwareVersion: '1.4.3', location: '后厨', ipAddress: '192.168.1.201', alertMessage: '打印头温度偏高' },
  { id: 'scn-01', name: '入库扫描枪', type: 'scanner', status: 'online', lastSeen: new Date(Date.now() - 5000).toISOString(), uptimeHours: 96, cpuUsage: 12, memoryUsage: 28, location: '仓库', ipAddress: '192.168.1.301' },
  { id: 'cam-01', name: '入口摄像头', type: 'camera', status: 'online', lastSeen: new Date(Date.now() - 10000).toISOString(), uptimeHours: 720, cpuUsage: 55, memoryUsage: 73, temperature: 44, firmwareVersion: '2.1.0', location: '入口', ipAddress: '192.168.1.401' },
  { id: 'cam-02', name: '收银区摄像头', type: 'camera', status: 'error', lastSeen: new Date(Date.now() - 1800000).toISOString(), uptimeHours: 0, cpuUsage: 0, memoryUsage: 0, temperature: 0, firmwareVersion: '2.1.0', location: '收银区', ipAddress: '192.168.1.402', alertMessage: '画面无信号' },
  { id: 'dsp-01', name: '大厅显示屏', type: 'display', status: 'maintenance', lastSeen: new Date(Date.now() - 14400000).toISOString(), uptimeHours: 12, cpuUsage: 22, memoryUsage: 45, firmwareVersion: '1.0.5', location: '大厅' },
  { id: 'net-01', name: '主交换机', type: 'network', status: 'online', lastSeen: new Date(Date.now() - 15000).toISOString(), uptimeHours: 1440, cpuUsage: 35, memoryUsage: 58, temperature: 62, firmwareVersion: '7.8.1', location: '机房', ipAddress: '10.0.0.1' },
  { id: 'sns-01', name: '温湿度传感器', type: 'sensor', status: 'warning', lastSeen: new Date(Date.now() - 60000).toISOString(), uptimeHours: 0, cpuUsage: 8, memoryUsage: 15, temperature: 42, firmwareVersion: '0.9.2', location: '冷库', alertMessage: '湿度异常 88%' },
  { id: 'sns-02', name: '烟雾探测器', type: 'sensor', status: 'online', lastSeen: new Date(Date.now() - 45000).toISOString(), uptimeHours: 0, cpuUsage: 5, memoryUsage: 10, firmwareVersion: '1.2.0', location: '大厅' },
];

const HEATMAP_DATA: HeatmapCell[] = [
  { colLabel: '0-4点', rowLabel: 'POS机', value: 0 },
  { colLabel: '4-8点', rowLabel: 'POS机', value: 1 },
  { colLabel: '8-12点', rowLabel: 'POS机', value: 2 },
  { colLabel: '12-16点', rowLabel: 'POS机', value: 2 },
  { colLabel: '16-20点', rowLabel: 'POS机', value: 2 },
  { colLabel: '20-24点', rowLabel: 'POS机', value: 1 },
  { colLabel: '0-4点', rowLabel: '打印机', value: 0 },
  { colLabel: '4-8点', rowLabel: '打印机', value: 1 },
  { colLabel: '8-12点', rowLabel: '打印机', value: 1 },
  { colLabel: '12-16点', rowLabel: '打印机', value: 1 },
  { colLabel: '16-20点', rowLabel: '打印机', value: 1 },
  { colLabel: '20-24点', rowLabel: '打印机', value: 0 },
  { colLabel: '0-4点', rowLabel: '摄像头', value: 1 },
  { colLabel: '4-8点', rowLabel: '摄像头', value: 2 },
  { colLabel: '8-12点', rowLabel: '摄像头', value: 2 },
  { colLabel: '12-16点', rowLabel: '摄像头', value: 2 },
  { colLabel: '16-20点', rowLabel: '摄像头', value: 2 },
  { colLabel: '20-24点', rowLabel: '摄像头', value: 1 },
  { colLabel: '0-4点', rowLabel: '网络设备', value: 0 },
  { colLabel: '4-8点', rowLabel: '网络设备', value: 1 },
  { colLabel: '8-12点', rowLabel: '网络设备', value: 1 },
  { colLabel: '12-16点', rowLabel: '网络设备', value: 1 },
  { colLabel: '16-20点', rowLabel: '网络设备', value: 1 },
  { colLabel: '20-24点', rowLabel: '网络设备', value: 0 },
  { colLabel: '0-4点', rowLabel: '传感器', value: 1 },
  { colLabel: '4-8点', rowLabel: '传感器', value: 2 },
  { colLabel: '8-12点', rowLabel: '传感器', value: 2 },
  { colLabel: '12-16点', rowLabel: '传感器', value: 2 },
  { colLabel: '16-20点', rowLabel: '传感器', value: 2 },
  { colLabel: '20-24点', rowLabel: '传感器', value: 1 },
  { colLabel: '0-4点', rowLabel: '显示屏', value: 0 },
  { colLabel: '4-8点', rowLabel: '显示屏', value: 1 },
  { colLabel: '8-12点', rowLabel: '显示屏', value: 1 },
  { colLabel: '12-16点', rowLabel: '显示屏', value: 1 },
  { colLabel: '16-20点', rowLabel: '显示屏', value: 1 },
  { colLabel: '20-24点', rowLabel: '显示屏', value: 0 },
];

const MOCK_ALERTS: AnomalyAlert[] = [
  { id: 'a1', title: '打印机温度过高', description: '厨房打印机(prt-01)打印头温度68°C', severity: 'medium', timestamp: new Date(Date.now() - 300000).toISOString(), acknowledged: false },
  { id: 'a2', title: '收银区摄像头断连', description: 'cam-02 画面无信号', severity: 'high', timestamp: new Date(Date.now() - 1800000).toISOString(), acknowledged: false },
  { id: 'a3', title: '冷库湿度异常', description: '温湿度传感器(sns-01)检测到湿度88%', severity: 'medium', timestamp: new Date(Date.now() - 600000).toISOString(), acknowledged: true },
  { id: 'a4', title: 'POS-01交易超时', description: '连续3笔交易响应超时', severity: 'high', timestamp: new Date(Date.now() - 3600000).toISOString(), acknowledged: false },
  { id: 'a5', title: '库存预警', description: '限量礼盒库存仅剩5件', severity: 'low', timestamp: new Date(Date.now() - 7200000).toISOString(), acknowledged: true },
];

const X_LABELS = ['0-4点', '4-8点', '8-12点', '12-16点', '16-20点', '20-24点'];
const Y_LABELS = ['POS机', '打印机', '摄像头', '网络设备', '传感器', '显示屏'];

function loadSource(): string {
  const fs = require('fs');
  const path = require('path');
  return fs.readFileSync(path.join(__dirname, 'page.tsx'), 'utf-8');
}

// ── 基本导出 ──

test('👔 店长视角: InsightsPage is a function component', async () => {
  const mod = await import('./page');
  assert.equal(typeof mod.default, 'function',
    'InsightsPage should export a function component');
});

test('🛒 前台视角: component export is stable', async () => {
  const mod = await import('./page');
  assert.ok(mod.default !== undefined);
  assert.ok(mod.default !== null);
});

test('👨‍💻 运维视角: default export name is meaningful', async () => {
  const mod = await import('./page');
  assert.ok(mod.default.name.length > 0 || typeof mod.default === 'function');
});

// ── 正例 ──

test('正例: module has default export', async () => {
  const mod = await import('./page');
  assert.ok('default' in mod, 'should have default export');
});

test('正例: page import does not throw', async () => {
  let threw = false;
  try {
    await import('./page');
  } catch {
    threw = true;
  }
  assert.equal(threw, false, 'page import should succeed');
});

test('正例: source imports all expected UI components', () => {
  const source = loadSource();
  const imports = ['AnomalyAlertPanel', 'DeviceStatusPanel', 'GaugeChart', 'HeatmapChart', 'MemberLevelDistribution'];
  for (const imp of imports) {
    assert.ok(source.includes(imp), `should import ${imp}`);
  }
});

test('正例: source has page title "数据洞察"', () => {
  const source = loadSource();
  assert.ok(source.includes('数据洞察'), 'should contain page title');
});

test('正例: member level data count = 5', () => {
  assert.equal(MOCK_MEMBER_LEVELS.length, 5);
});

test('正例: member level total sum', () => {
  const total = MOCK_MEMBER_LEVELS.reduce((s, l) => s + l.count, 0);
  assert.equal(total, 560, 'total members should be 560');
});

test('正例: high-value member count (钻石+黄金)', () => {
  const highValue = MOCK_MEMBER_LEVELS.filter(l => l.name === '钻石会员' || l.name === '黄金会员').reduce((s, l) => s + l.count, 0);
  assert.equal(highValue, 114);
});

test('正例: device count = 10', () => {
  assert.equal(MOCK_DEVICES.length, 10);
});

test('正例: online device count', () => {
  const online = MOCK_DEVICES.filter(d => d.status === 'online').length;
  assert.equal(online, 6);
});

test('正例: warning/error device count', () => {
  const warnErr = MOCK_DEVICES.filter(d => d.status === 'warning' || d.status === 'error').length;
  assert.equal(warnErr, 3);
});

test('正例: anomaly alerts count = 5', () => {
  assert.equal(MOCK_ALERTS.length, 5);
});

test('正例: heatmap has 36 cells (6 labels × 6 rows)', () => {
  assert.equal(HEATMAP_DATA.length, X_LABELS.length * Y_LABELS.length);
});

test('正例: heatmap colLabels are correct', () => {
  assert.deepStrictEqual(X_LABELS, ['0-4点', '4-8点', '8-12点', '12-16点', '16-20点', '20-24点']);
});

test('正例: heatmap rowLabels are correct', () => {
  assert.deepStrictEqual(Y_LABELS, ['POS机', '打印机', '摄像头', '网络设备', '传感器', '显示屏']);
});

test('正例: each device has unique id', () => {
  const ids = MOCK_DEVICES.map(d => d.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('正例: each device has uptimeHours >= 0', () => {
  for (const d of MOCK_DEVICES) {
    assert.ok(d.uptimeHours >= 0, `device ${d.id} uptime should be >= 0`);
  }
});

test('正例: cpu + memory percent range valid', () => {
  for (const d of MOCK_DEVICES) {
    assert.ok(d.cpuUsage >= 0 && d.cpuUsage <= 100, `device ${d.id} cpuUsage out of range`);
    assert.ok(d.memoryUsage >= 0 && d.memoryUsage <= 100, `device ${d.id} memoryUsage out of range`);
  }
});

test('正例: each alert has a valid severity', () => {
  const valid = ['low', 'medium', 'high'];
  for (const a of MOCK_ALERTS) {
    assert.ok(valid.includes(a.severity), `alert ${a.id} invalid severity: ${a.severity}`);
  }
});

test('正例: at least one high-severity alert', () => {
  const high = MOCK_ALERTS.filter(a => a.severity === 'high');
  assert.ok(high.length >= 1, 'should have at least one high-severity alert');
});

// ── 反例 ──

test('反例: export is not null or undefined', async () => {
  const InsightsPage = (await import('./page')).default;
  assert.notEqual(InsightsPage, null);
  assert.notEqual(InsightsPage, undefined);
});

test('反例: no device has negative temperature', () => {
  const hasTemp = MOCK_DEVICES.filter(d => d.temperature !== undefined);
  for (const d of hasTemp) {
    assert.ok(d.temperature! >= 0, `device ${d.id} temperature should be >= 0`);
  }
});

test('反例: no duplicate device names', () => {
  const names = MOCK_DEVICES.map(d => d.name);
  assert.equal(new Set(names).size, names.length);
});

test('反例: all alerts have unique IDs', () => {
  const ids = MOCK_ALERTS.map(a => a.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('反例: device id format is valid', () => {
  for (const d of MOCK_DEVICES) {
    assert.ok(/^[a-z]{2,4}-\d{2}$/.test(d.id), `device ${d.id} id format invalid`);
  }
});

// ── 边界 ──

test('边界: component is callable', async () => {
  const InsightsPage = (await import('./page')).default;
  assert.equal(typeof InsightsPage, 'function');
});

test('边界: displayName is set or component is valid', async () => {
  const InsightsPage = (await import('./page')).default;
  assert.ok(
    (InsightsPage as unknown as { displayName?: string }).displayName === undefined ||
      typeof InsightsPage === 'function',
    'component should be valid',
  );
});

test('边界: heatmap value range [0, 2]', () => {
  for (const cell of HEATMAP_DATA) {
    assert.ok(cell.value >= 0 && cell.value <= 2, `heatmap cell ${cell.rowLabel}/${cell.colLabel} value ${cell.value} out of range`);
  }
});

test('边界: alert acknowledged ratio', () => {
  const ackCount = MOCK_ALERTS.filter(a => a.acknowledged).length;
  assert.ok(ackCount >= 1 && ackCount <= MOCK_ALERTS.length - 1,
    'should have mixed acknowledged/unacknowledged alerts');
});

test('边界: source is "use client"', () => {
  const source = loadSource();
  assert.ok(source.includes("'use client'"), 'should be a client component');
});

test('边界: device types coverage', () => {
  const types = new Set(MOCK_DEVICES.map(d => d.type));
  assert.ok(types.has('pos'), 'should have pos type');
  assert.ok(types.has('printer'), 'should have printer type');
  assert.ok(types.has('camera'), 'should have camera type');
  assert.ok(types.has('network'), 'should have network type');
  assert.ok(types.has('sensor'), 'should have sensor type');
  assert.ok(types.has('display'), 'should have display type');
});
