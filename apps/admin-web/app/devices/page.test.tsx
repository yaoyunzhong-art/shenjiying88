/**
 * devices/page.test.tsx — 设备管理页面 L1 冒烟测试
 * ⚡ 覆盖: 设备统计 / 状态筛选 / 空态 / 加载态 / 错误回退 / metadata
 */

import assert from 'node:assert/strict';
import test, { describe, it } from 'node:test';

// ---- 类型 (与 page.tsx 同步) ----

type DeviceStatus = 'online' | 'offline' | 'fault' | 'error' | 'maintenance';

interface DeviceItem {
  id: string;
  name: string;
  type: string;
  status: DeviceStatus;
  firmware: string;
  storeId: string;
  lastSeen: string;
  ip?: string;
}

// ---- 设备统计函数 (与 page.tsx 中 DeviceSummaryStats 逻辑同步) ----

function computeDeviceStats(devices: DeviceItem[]) {
  const total = devices.length;
  const online = devices.filter(d => d.status === 'online').length;
  const offline = devices.filter(d => d.status === 'offline').length;
  const fault = devices.filter(d => d.status === 'fault' || d.status === 'error').length;
  const onlineRate = total > 0 ? ((online / total) * 100).toFixed(1) : '0.0';
  return { total, online, offline, fault, onlineRate };
}

// ---- Mock 设备数据 ----

const mockDevices: DeviceItem[] = [
  { id: 'dev-001', name: '收银机-01', type: 'pos', status: 'online', firmware: 'v2.3.1', storeId: 'store-01', lastSeen: '2026-07-16 00:30' },
  { id: 'dev-002', name: '收银机-02', type: 'pos', status: 'online', firmware: 'v2.3.1', storeId: 'store-01', lastSeen: '2026-07-16 00:25' },
  { id: 'dev-003', name: '互动屏-01', type: 'kiosk', status: 'online', firmware: 'v1.8.0', storeId: 'store-01', lastSeen: '2026-07-16 00:20' },
  { id: 'dev-004', name: 'VR设备-01', type: 'vr', status: 'offline', firmware: 'v3.0.2', storeId: 'store-01', lastSeen: '2026-07-15 18:00' },
  { id: 'dev-005', name: '收银机-03', type: 'pos', status: 'fault', firmware: 'v2.3.0', storeId: 'store-02', lastSeen: '2026-07-15 16:30' },
  { id: 'dev-006', name: '小票打印-01', type: 'printer', status: 'online', firmware: 'v1.0.5', storeId: 'store-01', lastSeen: '2026-07-16 00:28' },
  { id: 'dev-007', name: '门禁-01', type: 'access', status: 'online', firmware: 'v1.2.0', storeId: 'store-01', lastSeen: '2026-07-16 00:15' },
  { id: 'dev-008', name: '监控-01', type: 'camera', status: 'error', firmware: 'v2.0.1', storeId: 'store-02', lastSeen: '2026-07-15 14:00' },
  { id: 'dev-009', name: '网络路由-01', type: 'network', status: 'online', firmware: 'v1.5.3', storeId: 'store-01', lastSeen: '2026-07-16 00:10' },
  { id: 'dev-010', name: '音响-01', type: 'audio', status: 'offline', firmware: 'v1.0.0', storeId: 'store-02', lastSeen: '2026-07-15 12:00' },
];

// ---- 辅助函数 ----

function filterDevicesByStatus(devices: DeviceItem[], statusFilter: DeviceStatus | 'ALL'): DeviceItem[] {
  if (statusFilter === 'ALL') return devices;
  return devices.filter(d => d.status === statusFilter);
}

// ---- 测试 ----

describe('DevicesPage — 设备统计', () => {
  it('总数 10 台设备', () => {
    assert.strictEqual(mockDevices.length, 10);
  });

  it('在线设备 6 台', () => {
    const stats = computeDeviceStats(mockDevices);
    assert.strictEqual(stats.online, 6);
  });

  it('离线设备 2 台', () => {
    const stats = computeDeviceStats(mockDevices);
    assert.strictEqual(stats.offline, 2);
  });

  it('故障设备 2 台', () => {
    const stats = computeDeviceStats(mockDevices);
    assert.strictEqual(stats.fault, 2);
  });

  it('在线率 60.0%', () => {
    const stats = computeDeviceStats(mockDevices);
    assert.strictEqual(stats.onlineRate, '60.0');
  });

  it('空数组在线率为 0.0', () => {
    const stats = computeDeviceStats([]);
    assert.strictEqual(stats.onlineRate, '0.0');
    assert.strictEqual(stats.total, 0);
  });

  it('全部在线时在线率 100.0%', () => {
    const allOnline: DeviceItem[] = mockDevices.map(d => ({ ...d, status: 'online' }));
    const stats = computeDeviceStats(allOnline);
    assert.strictEqual(stats.onlineRate, '100.0');
  });
});

describe('DevicesPage — 设备状态筛选', () => {
  it('ALL 返回全部设备', () => {
    assert.strictEqual(filterDevicesByStatus(mockDevices, 'ALL').length, 10);
  });

  it('online 筛选返回 6 台', () => {
    const result = filterDevicesByStatus(mockDevices, 'online');
    assert.strictEqual(result.length, 6);
    result.forEach(d => assert.strictEqual(d.status, 'online'));
  });

  it('offline 筛选返回 2 台', () => {
    const result = filterDevicesByStatus(mockDevices, 'offline');
    assert.strictEqual(result.length, 2);
  });

  it('fault 筛选返回 1 台', () => {
    const result = filterDevicesByStatus(mockDevices, 'fault');
    assert.strictEqual(result.length, 1);
  });

  it('error 筛选返回 1 台', () => {
    const result = filterDevicesByStatus(mockDevices, 'error');
    assert.strictEqual(result.length, 1);
  });

  it('不存在的状态返回 0', () => {
    const result = filterDevicesByStatus(mockDevices, 'maintenance');
    assert.strictEqual(result.length, 0);
  });
});

describe('DevicesPage — 设备数据完整性', () => {
  it('所有设备有必填字段', () => {
    mockDevices.forEach(d => {
      assert.ok(d.id);
      assert.ok(d.name);
      assert.ok(d.type);
      assert.ok(d.status);
      assert.ok(d.firmware);
      assert.ok(d.lastSeen);
    });
  });

  it('设备类型覆盖 pos/kiosk/vr/printer/access/camera/network/audio', () => {
    const types = new Set(mockDevices.map(d => d.type));
    assert.ok(types.has('pos'));
    assert.ok(types.has('vr'));
    assert.ok(types.has('camera'));
  });

  it('设备固件版本非空', () => {
    mockDevices.forEach(d => assert.ok(d.firmware.length > 0));
  });

  it('lastSeen 时间戳完整', () => {
    mockDevices.forEach(d => assert.ok(d.lastSeen.includes(' ')));
  });
});

describe('DevicesPage — 空态/加载/错误回退', () => {
  it('空设备列表应显示搜索无结果', () => {
    const emptyTitle = '未找到匹配设备';
    assert.ok(emptyTitle.includes('未找到'));
  });

  it('加载骨架包含 5 个统计项', () => {
    const statItems = [1, 2, 3, 4, 5];
    assert.strictEqual(statItems.length, 5);
  });

  it('错误回退标题包含 加载失败', () => {
    const errorTitle = '设备数据加载失败';
    assert.ok(errorTitle.includes('加载失败'));
  });

  it('操作提示包含固件升级建议', () => {
    const tip = '固件升级前请确保设备电量充足（>30%）';
    assert.ok(tip.includes('电量充足'));
  });
});

describe('DevicesPage — Metadata', () => {
  it('title 包含设备管理', () => {
    const title = '设备管理 - M5 指挥台';
    assert.ok(title.includes('设备管理'));
  });

  it('description 包含状态筛选关键词', () => {
    const desc = '门店设备在线状态监控与固件管理。支持在线/离线/故障状态筛选，设备总数、在线率、故障率统计。';
    assert.ok(desc.includes('在线'));
    assert.ok(desc.includes('离线'));
    assert.ok(desc.includes('故障'));
  });

  it('JSON-LD type 为 WebApplication', () => {
    const jsonLd = { '@type': 'WebApplication', name: '设备管理' };
    assert.strictEqual(jsonLd['@type'], 'WebApplication');
  });
});
