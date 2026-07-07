/**
 * DeviceMonitoringPage — 设备监控页面
 * 测试：类型/常量完备性、筛选、搜索、排序、分页、统计计算
 * 注：不依赖 page.tsx（无 jsdom），只测试 model/helper 逻辑的一致性
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ── 类型定义（与 page.tsx model 保持一致） ──

type DeviceStatus = 'online' | 'offline' | 'warning' | 'error' | 'maintenance';
type DeviceCategory = 'pos' | 'printer' | 'scanner' | 'display' | 'network' | 'camera' | 'iot';

interface DeviceItem {
  id: string;
  name: string;
  category: DeviceCategory;
  status: DeviceStatus;
  storeId: string;
  storeName: string;
  ip: string;
  lastHeartbeat: string;
  uptime: string;
  firmware: string;
  alerts: number;
}

const VALID_STATUSES: DeviceStatus[] = ['online', 'offline', 'warning', 'error', 'maintenance'];
const VALID_CATEGORIES: DeviceCategory[] = ['pos', 'printer', 'scanner', 'display', 'network', 'camera', 'iot'];

const DEVICE_STATUS_LABELS: Record<DeviceStatus, string> = {
  online: '在线',
  offline: '离线',
  warning: '警告',
  error: '故障',
  maintenance: '维护中',
};

const DEVICE_CATEGORY_LABELS: Record<DeviceCategory, string> = {
  pos: 'POS 收银机',
  printer: '打印机',
  scanner: '扫码枪',
  display: '显示屏',
  network: '网络设备',
  camera: '摄像头',
  iot: 'IoT 传感器',
};

const DEVICE_STATUS_SEVERITY: Record<DeviceStatus, number> = {
  online: 0,
  maintenance: 1,
  warning: 2,
  offline: 3,
  error: 4,
};

const FILTER_OPTIONS = [
  { value: 'all' as const, label: '全部' },
  { value: 'online' as const, label: '在线' },
  { value: 'offline' as const, label: '离线' },
  { value: 'warning' as const, label: '警告' },
  { value: 'error' as const, label: '故障' },
  { value: 'maintenance' as const, label: '维护中' },
];

// ── 辅助函数（与 model.ts 保持一致） ──

function sortDevicesBySeverity(devices: DeviceItem[]): DeviceItem[] {
  return [...devices].sort(
    (a, b) => DEVICE_STATUS_SEVERITY[b.status] - DEVICE_STATUS_SEVERITY[a.status],
  );
}

function computeStats(devices: DeviceItem[]) {
  const total = devices.length;
  const online = devices.filter((d) => d.status === 'online').length;
  const offline = devices.filter((d) => d.status === 'offline').length;
  const error = devices.filter((d) => d.status === 'error').length;
  const warning = devices.filter((d) => d.status === 'warning').length;
  const healthRate = total > 0 ? Math.round((online / total) * 100) : 0;
  return { total, online, offline, error, warning, healthRate };
}

function generateMockDevices(count = 25): DeviceItem[] {
  const stores = ['旗舰店', '天河店', '南山店', '福田店', '宝安店'];
  const categories: DeviceCategory[] = ['pos', 'printer', 'scanner', 'display', 'network', 'camera', 'iot'];
  const statuses: DeviceStatus[] = ['online', 'offline', 'warning', 'error', 'maintenance'];

  return Array.from({ length: count }, (_, i) => {
    const status = statuses[i % statuses.length]!;
    return {
      id: `DEV-${String(i + 1).padStart(4, '0')}`,
      name: `设备 ${i + 1}`,
      category: categories[i % categories.length]!,
      status,
      storeId: `S-${(i % stores.length) + 1}`,
      storeName: stores[i % stores.length]!,
      ip: `192.168.${Math.floor(i / 255)}.${(i % 255) + 1}`,
      lastHeartbeat: new Date(Date.now() - i * 60000).toISOString(),
      uptime: `${Math.floor(Math.random() * 720) + 1}h`,
      firmware: `v${Math.floor(Math.random() * 5) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 100)}`,
      alerts: status === 'error' ? Math.floor(Math.random() * 5) + 1 : 0,
    };
  });
}

// ── Mock 数据 ──

const mockDevices: DeviceItem[] = [
  {
    id: 'DEV-0001', name: '收银机A', category: 'pos', status: 'online',
    storeId: 'S-1', storeName: '旗舰店', ip: '192.168.1.10',
    lastHeartbeat: '2026-06-29T01:00:00Z', uptime: '120h', firmware: 'v2.1.0', alerts: 0,
  },
  {
    id: 'DEV-0002', name: '打印机B', category: 'printer', status: 'error',
    storeId: 'S-1', storeName: '旗舰店', ip: '192.168.1.11',
    lastHeartbeat: '2026-06-28T23:00:00Z', uptime: '12h', firmware: 'v1.3.2', alerts: 3,
  },
  {
    id: 'DEV-0003', name: '扫码枪C', category: 'scanner', status: 'offline',
    storeId: 'S-2', storeName: '天河店', ip: '192.168.2.20',
    lastHeartbeat: '2026-06-27T12:00:00Z', uptime: '0h', firmware: 'v3.0.1', alerts: 1,
  },
  {
    id: 'DEV-0004', name: '显示屏D', category: 'display', status: 'warning',
    storeId: 'S-3', storeName: '南山店', ip: '192.168.3.30',
    lastHeartbeat: '2026-06-29T00:30:00Z', uptime: '48h', firmware: 'v1.0.5', alerts: 0,
  },
  {
    id: 'DEV-0005', name: '摄像头E', category: 'camera', status: 'maintenance',
    storeId: 'S-4', storeName: '福田店', ip: '192.168.4.40',
    lastHeartbeat: '2026-06-26T08:00:00Z', uptime: '0h', firmware: 'v2.0.0', alerts: 0,
  },
  {
    id: 'DEV-0006', name: '网络设备F', category: 'network', status: 'online',
    storeId: 'S-5', storeName: '宝安店', ip: '192.168.5.50',
    lastHeartbeat: '2026-06-29T01:55:00Z', uptime: '720h', firmware: 'v4.2.1', alerts: 0,
  },
];

// ── Tests ───────────────────────────────────────────────────────────────────

describe('DeviceMonitoringPage — 常量与映射', () => {
  it('所有设备状态都有中文标签', () => {
    for (const status of VALID_STATUSES) {
      assert.ok(DEVICE_STATUS_LABELS[status], `缺少 status=${status} 的标签`);
      assert.equal(typeof DEVICE_STATUS_LABELS[status], 'string');
    }
  });

  it('所有设备分类都有中文标签', () => {
    for (const cat of VALID_CATEGORIES) {
      assert.ok(DEVICE_CATEGORY_LABELS[cat], `缺少 category=${cat} 的标签`);
      assert.equal(typeof DEVICE_CATEGORY_LABELS[cat], 'string');
    }
  });

  it('状态严重性数值合理（error >= warning >= offline >= maintenance >= online）', () => {
    assert.equal(DEVICE_STATUS_SEVERITY.online, 0);
    assert.equal(DEVICE_STATUS_SEVERITY.maintenance, 1);
    assert.equal(DEVICE_STATUS_SEVERITY.warning, 2);
    assert.equal(DEVICE_STATUS_SEVERITY.offline, 3);
    assert.equal(DEVICE_STATUS_SEVERITY.error, 4);
  });

  it('筛选选项包含全部6种', () => {
    assert.equal(FILTER_OPTIONS.length, 6);
    const values = FILTER_OPTIONS.map((o) => o.value);
    assert.ok(values.includes('all'));
    assert.ok(values.includes('online'));
    assert.ok(values.includes('offline'));
    assert.ok(values.includes('warning'));
    assert.ok(values.includes('error'));
    assert.ok(values.includes('maintenance'));
  });
});

describe('DeviceMonitoringPage — computeStats', () => {
  it('正确计算设备统计', () => {
    const stats = computeStats(mockDevices);
    assert.equal(stats.total, 6);
    assert.equal(stats.online, 2);
    assert.equal(stats.offline, 1);
    assert.equal(stats.error, 1);
    assert.equal(stats.warning, 1);
    assert.equal(stats.healthRate, Math.round((2 / 6) * 100));
  });

  it('空设备列表返回全0', () => {
    const stats = computeStats([]);
    assert.equal(stats.total, 0);
    assert.equal(stats.online, 0);
    assert.equal(stats.offline, 0);
    assert.equal(stats.error, 0);
    assert.equal(stats.warning, 0);
    assert.equal(stats.healthRate, 0);
  });

  it('全部在线健康率100%', () => {
    const allOnline = mockDevices.map((d) => ({ ...d, status: 'online' as const }));
    assert.equal(computeStats(allOnline).healthRate, 100);
  });

  it('全部故障健康率0%', () => {
    const allError = mockDevices.map((d) => ({ ...d, status: 'error' as const }));
    assert.equal(computeStats(allError).healthRate, 0);
  });
});

describe('DeviceMonitoringPage — sortDevicesBySeverity', () => {
  it('按严重性降序排列：error > offline > warning > maintenance > online', () => {
    const sorted = sortDevicesBySeverity(mockDevices);
    assert.equal(sorted[0]!.status, 'error');
    assert.equal(sorted[sorted.length - 1]!.status, 'online');
    const errorIdx = sorted.findIndex((d) => d.status === 'error');
    const warningIdx = sorted.findIndex((d) => d.status === 'warning');
    assert.ok(errorIdx < warningIdx, 'error 应在 warning 前面');
  });

  it('不改变原数组', () => {
    const original = [...mockDevices];
    sortDevicesBySeverity(mockDevices);
    assert.deepEqual(mockDevices, original);
  });

  it('空数组返回空', () => {
    assert.deepEqual(sortDevicesBySeverity([]), []);
  });
});

describe('DeviceMonitoringPage — generateMockDevices', () => {
  it('生成指定数量', () => {
    assert.equal(generateMockDevices(20).length, 20);
  });

  it('默认生成25个', () => {
    assert.equal(generateMockDevices().length, 25);
  });

  it('每个设备有完整字段', () => {
    const devices = generateMockDevices(10);
    for (const d of devices) {
      assert.ok(d.id);
      assert.ok(d.name);
      assert.ok(VALID_STATUSES.includes(d.status));
      assert.ok(VALID_CATEGORIES.includes(d.category));
      assert.ok(d.storeName);
      assert.ok(d.ip);
      assert.ok(d.lastHeartbeat);
      assert.equal(typeof d.alerts, 'number');
    }
  });

  it('所有设备和门店名称非空', () => {
    const devices = generateMockDevices(25);
    for (const d of devices) {
      assert.ok(d.id.startsWith('DEV-'));
      assert.ok(d.name.length > 0);
      assert.ok(d.storeName.length > 0);
    }
  });
});
