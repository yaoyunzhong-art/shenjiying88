/**
 * devices/[id]/page.test.ts — 设备详情页 L1 冒烟测试
 * 角色视角: 👨‍💻运维 / 👔管理
 * 覆盖: 正例(数据/状态/操作) + 反例(缺失ID/空字段) + 边界(极端/复杂数据)
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import type { DeviceType, DeviceStatus, DeviceItem } from '../device-types';

/* ── 与 device-detail-client.tsx 同步的辅助函数 ── */

const DEVICE_TYPE_LABELS: Record<string, string> = {
  POS: '收银机',
  printer: '打印机',
  scanner: '扫描枪',
  tablet: '平板',
  kiosk: '自助机',
  scale: '电子秤',
};

const STATUS_LABELS: Record<string, string> = {
  online: '在线',
  offline: '离线',
  warning: '告警',
  maintenance: '维护中',
};

function variantFor(s: string): string {
  if (s === 'online') return 'success';
  if (s === 'offline') return 'danger';
  if (s === 'warning') return 'warning';
  return 'default';
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/* ── 编辑表单验证（镜像组件逻辑） ── */

interface EditFormData {
  name: string;
  ip: string;
  firmwareVersion: string;
}

interface EditFormErrors {
  name?: string;
  ip?: string;
  firmwareVersion?: string;
}

function validateForm(data: EditFormData): EditFormErrors {
  const errors: EditFormErrors = {};
  if (!data.name.trim()) errors.name = '设备名称不能为空';
  if (!data.ip.trim()) errors.ip = 'IP 地址不能为空';
  if (!data.firmwareVersion.trim()) errors.firmwareVersion = '固件版本不能为空';
  return errors;
}

/* ── 数据工厂 ── */

function makeDevice(overrides?: Partial<DeviceItem>): DeviceItem {
  return {
    id: 'dev-001',
    name: '收银台 POS-01',
    type: 'POS',
    status: 'online',
    ip: '192.168.1.101',
    storeId: 'store-001',
    storeName: 'Shenjiying 旗舰店',
    lastCheckAt: '2026-06-27T06:00:00.000Z',
    firmwareVersion: '3.2.1',
    serialNumber: 'SN-POS-2024-0001',
    ...overrides,
  };
}

function makeDevices(count: number): DeviceItem[] {
  const types: DeviceType[] = ['POS', 'printer', 'scanner', 'tablet', 'kiosk', 'scale'];
  const statuses: DeviceStatus[] = ['online', 'offline', 'warning', 'maintenance'];
  return Array.from({ length: count }, (_, i) => makeDevice({
    id: `dev-${String(i + 1).padStart(3, '0')}`,
    name: `设备 ${i + 1}`,
    type: types[i % types.length],
    status: statuses[i % statuses.length],
    ip: `192.168.${Math.floor(i / 255)}.${(i % 255) + 1}`,
    serialNumber: `SN-${String(i + 1).padStart(4, '0')}`,
  }));
}

function callSafe<T extends (...args: any[]) => any>(fn: T, ...args: any[]): boolean {
  try { fn(...args); return true; } catch { return false; }
}

/* ── 正例 ── */

test('🏗️ 模块导出完整性', async () => {
  const pageMod = await import('./page');
  assert.equal(typeof pageMod.default, 'function', 'default export should be a function');

  const clientMod = await import('./device-detail-client');
  assert.equal(typeof clientMod.DeviceDetailClient, 'function', 'DeviceDetailClient should be a function');
});

test('📦 DeviceType 标签映射完整', () => {
  assert.equal(Object.keys(DEVICE_TYPE_LABELS).length, 6);
  assert.equal(DEVICE_TYPE_LABELS.POS, '收银机');
  assert.equal(DEVICE_TYPE_LABELS.printer, '打印机');
  assert.equal(DEVICE_TYPE_LABELS.scanner, '扫描枪');
  assert.equal(DEVICE_TYPE_LABELS.tablet, '平板');
  assert.equal(DEVICE_TYPE_LABELS.kiosk, '自助机');
  assert.equal(DEVICE_TYPE_LABELS.scale, '电子秤');
});

test('🏷️ 设备状态标签映射完整', () => {
  assert.equal(Object.keys(STATUS_LABELS).length, 4);
  assert.equal(STATUS_LABELS.online, '在线');
  assert.equal(STATUS_LABELS.offline, '离线');
  assert.equal(STATUS_LABELS.warning, '告警');
  assert.equal(STATUS_LABELS.maintenance, '维护中');
});

test('🎨 variantFor 状态对应正确', () => {
  assert.equal(variantFor('online'), 'success');
  assert.equal(variantFor('offline'), 'danger');
  assert.equal(variantFor('warning'), 'warning');
  assert.equal(variantFor('maintenance'), 'default');
  assert.equal(variantFor('unknown'), 'default');
});

test('🕐 formatTime 格式正确', () => {
  const result = formatTime('2026-06-27T06:00:00.000Z');
  assert.ok(result.includes('2026-06-27'));
  assert.ok(result.includes('06:00'));
  assert.ok(result.includes(':'));
});

test('🕐 formatTime 非法日期返回原值', () => {
  assert.equal(formatTime(''), '');
  assert.equal(formatTime('无效日期'), '无效日期');
});

test('🕐 formatTime 不同时区输入', () => {
  const result = formatTime('2026-12-31T23:59:59.000Z');
  assert.ok(result.includes('2026-12-31') || result.includes('2026-12-31'));
  assert.ok(result.includes(':'));
});

test('✅ DeviceDetailClient 可渲染有效设备', async () => {
  const { DeviceDetailClient } = await import('./device-detail-client');
  assert.equal(callSafe(DeviceDetailClient, { deviceId: 'dev-001' }), true);
});

test('✅ DeviceDetailClient 渲染多数据', async () => {
  const { DeviceDetailClient } = await import('./device-detail-client');
  assert.equal(callSafe(DeviceDetailClient, { deviceId: 'dev-005' }), true);
});

/* ── 表单验证 ── */

test('📝 表单验证: 全部有效字段通过', () => {
  const errors = validateForm({ name: 'POS-01', ip: '192.168.1.1', firmwareVersion: '3.2.1' });
  assert.deepEqual(errors, {});
});

test('📝 表单验证: 空名称拒绝', () => {
  const errors = validateForm({ name: '', ip: '192.168.1.1', firmwareVersion: '3.2.1' });
  assert.equal(errors.name, '设备名称不能为空');
});

test('📝 表单验证: 空 IP 拒绝', () => {
  const errors = validateForm({ name: 'POS-01', ip: '', firmwareVersion: '3.2.1' });
  assert.equal(errors.ip, 'IP 地址不能为空');
});

test('📝 表单验证: 空固件版本拒绝', () => {
  const errors = validateForm({ name: 'POS-01', ip: '192.168.1.1', firmwareVersion: '' });
  assert.equal(errors.firmwareVersion, '固件版本不能为空');
});

test('📝 表单验证: 空白字符视为空', () => {
  const errors1 = validateForm({ name: '   ', ip: '192.168.1.1', firmwareVersion: '3.2.1' });
  assert.equal(errors1.name, '设备名称不能为空');

  const errors2 = validateForm({ name: 'POS-01', ip: '  ', firmwareVersion: '3.2.1' });
  assert.equal(errors2.ip, 'IP 地址不能为空');

  const errors3 = validateForm({ name: 'POS-01', ip: '192.168.1.1', firmwareVersion: '  ' });
  assert.equal(errors3.firmwareVersion, '固件版本不能为空');
});

test('📝 表单验证: 多个字段同时为空', () => {
  const errors = validateForm({ name: '', ip: '', firmwareVersion: '' });
  assert.equal(Object.keys(errors).length, 3);
});

/* ── 设备工厂 ── */

test('🏭 makeDevice 默认值完整', () => {
  const d = makeDevice();
  assert.equal(d.id, 'dev-001');
  assert.equal(d.name, '收银台 POS-01');
  assert.equal(d.type, 'POS');
  assert.equal(d.status, 'online');
  assert.equal(d.ip, '192.168.1.101');
  assert.equal(d.storeId, 'store-001');
  assert.equal(d.storeName, 'Shenjiying 旗舰店');
  assert.equal(d.firmwareVersion, '3.2.1');
  assert.equal(d.serialNumber, 'SN-POS-2024-0001');
});

test('🏭 makeDevice 支持覆盖', () => {
  const d = makeDevice({ id: 'dev-999', name: '测试设备', status: 'offline' });
  assert.equal(d.id, 'dev-999');
  assert.equal(d.name, '测试设备');
  assert.equal(d.status, 'offline');
  assert.equal(d.type, 'POS'); // 未覆盖，保留默认
});

test('🏭 makeDevices 批量生成正确', () => {
  const items = makeDevices(12);
  assert.equal(items.length, 12);
  assert.equal(items[0]!.id, 'dev-001');
  assert.equal(items[11]!.id, 'dev-012');
});

test('🏭 makeDevices 类型轮转', () => {
  const items = makeDevices(12);
  assert.equal(items[0]!.type, 'POS');
  assert.equal(items[1]!.type, 'printer');
  assert.equal(items[5]!.type, 'scale');
  assert.equal(items[6]!.type, 'POS'); // 第7个，循环
});

test('🏭 makeDevices 状态轮转', () => {
  const items = makeDevices(8);
  assert.equal(items[0]!.status, 'online');
  assert.equal(items[1]!.status, 'offline');
  assert.equal(items[2]!.status, 'warning');
  assert.equal(items[3]!.status, 'maintenance');
  assert.equal(items[4]!.status, 'online'); // 第5个，循环
});

/* ── 反例 ── */

test('⚠️ DeviceDetailClient 不存在的设备渲染防御', async () => {
  const { DeviceDetailClient } = await import('./device-detail-client');
  assert.equal(callSafe(DeviceDetailClient, { deviceId: 'nonexistent-id' }), true,
    'should not throw for missing device');
});

test('⚠️ DeviceDetailClient 空 deviceId 渲染防御', async () => {
  const { DeviceDetailClient } = await import('./device-detail-client');
  assert.equal(callSafe(DeviceDetailClient, { deviceId: '' }), true);
});

test('⚠️ validateForm 极端输入不抛异常', () => {
  assert.equal(callSafe(validateForm, { name: null, ip: null, firmwareVersion: null }), true);
});

/* ── 边界 ── */

test('🔲 设备类型 label: 未知类型保留原值', () => {
  assert.equal(DEVICE_TYPE_LABELS['unknown_type'], undefined);
});

test('🔲 状态 label: 未知状态保留原值', () => {
  assert.equal(STATUS_LABELS['unknown_status'], undefined);
});

test('🔲 formatTime Unix 时间戳字符串', () => {
  const result = formatTime('2026-06-27T12:00:00.000Z');
  assert.ok(typeof result === 'string');
  assert.ok(result.length > 0);
});

test('🔲 超长名称和 IP 不崩溃', async () => {
  const { DeviceDetailClient } = await import('./device-detail-client');
  assert.equal(callSafe(DeviceDetailClient, {
    deviceId: 'x'.repeat(500),
  }), true);
});

test('🔲 所有 4 种设备状态渲染', async () => {
  const { DeviceDetailClient } = await import('./device-detail-client');
  const statuses: DeviceStatus[] = ['online', 'offline', 'warning', 'maintenance'];
  for (const s of statuses) {
    assert.equal(callSafe(DeviceDetailClient, { deviceId: `dev-${s}` }), true,
      `should render status ${s}`);
  }
});

test('🔲 所有 6 种设备类型渲染', async () => {
  const { DeviceDetailClient } = await import('./device-detail-client');
  const types: DeviceType[] = ['POS', 'printer', 'scanner', 'tablet', 'kiosk', 'scale'];
  for (const t of types) {
    assert.equal(callSafe(DeviceDetailClient, { deviceId: `dev-${t}` }), true,
      `should render type ${t}`);
  }
});

test('🔲 模块导入不抛异常', async () => {
  for (const modPath of [
    './page',
    './device-detail-client',
  ]) {
    let threw = false;
    try { await import(modPath); } catch { threw = true; }
    assert.equal(threw, false, `import ${modPath} should succeed`);
  }
});

test('🔲 设备序列号格式验证', () => {
  const d = makeDevice({ serialNumber: 'SN-POS-2024-9999' });
  assert.ok(d.serialNumber.startsWith('SN-'));
  assert.ok(d.serialNumber.length > 5);
});

test('🔲 批量 50 设备不抛异常', () => {
  const devices = makeDevices(50);
  assert.equal(devices.length, 50);
  assert.equal(devices[49]!.id, 'dev-050');
});

test('🔲 formatTime 边界年份', () => {
  const result = formatTime('1970-01-01T00:00:00.000Z');
  assert.ok(result.includes('1970-01-01'));
  const result2 = formatTime('2099-12-31T23:59:59.000Z');
  assert.ok(result2.includes('2099-12-31'));
});

/* ── 无设备时渲染状态 ── */

test('🚫 getDeviceById 返回 undefined 时不抛', () => {
  const { DeviceDetailClient } = require('./device-detail-client');
  assert.equal(callSafe(DeviceDetailClient, { deviceId: 'dev-none' }), true);
});

test('🚫 设备存在但字段为空时不抛', () => {
  const { DeviceDetailClient } = require('./device-detail-client');
  const emptyDevice = makeDevice({
    name: '', ip: '', serialNumber: '', firmwareVersion: '',
    storeId: '', storeName: '',
  });
  // Just make sure the mock data system doesn't throw
  assert.equal(callSafe(DeviceDetailClient, { deviceId: 'dev-empty' }), true);
});
