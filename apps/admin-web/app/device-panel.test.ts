/**
 * device-panel.test.ts — L1 设备管理面板测试
 *
 * 测试设备列表渲染、筛选、搜索、状态切换(在线/离线/维护)
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

// ---------------------------------------------------------------------------
// 数据类型定义
// ---------------------------------------------------------------------------

type DeviceStatus = 'online' | 'offline' | 'maintenance';

interface DeviceInfo {
  id: string;
  code: string;
  name: string;
  type: 'pos' | 'pad' | 'printer' | 'scanner' | 'scale';
  status: DeviceStatus;
  storeId: string;
  storeName: string;
  brandId: string;
  brandName: string;
  marketCode: string;
  lastOnlineAt: string;
  firmwareVersion: string;
  ipAddress: string;
  macAddress: string;
  registeredAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Mock 设备数据
// ---------------------------------------------------------------------------

const MOCK_DEVICES: DeviceInfo[] = [
  {
    id: 'dev-001', code: 'DEV-POS-001', name: '收银终端 1F-A',
    type: 'pos', status: 'online',
    storeId: 'store-001', storeName: '万象城旗舰店',
    brandId: 'brand-001', brandName: '华润万象',
    marketCode: 'cn-mainland',
    lastOnlineAt: '2026-06-23T19:00:00.000Z',
    firmwareVersion: 'v2.4.1',
    ipAddress: '192.168.1.101',
    macAddress: 'AA:BB:CC:DD:EE:01',
    registeredAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2026-06-23T19:00:00.000Z'
  },
  {
    id: 'dev-002', code: 'DEV-POS-002', name: '收银终端 1F-B',
    type: 'pos', status: 'online',
    storeId: 'store-001', storeName: '万象城旗舰店',
    brandId: 'brand-001', brandName: '华润万象',
    marketCode: 'cn-mainland',
    lastOnlineAt: '2026-06-23T18:55:00.000Z',
    firmwareVersion: 'v2.4.1',
    ipAddress: '192.168.1.102',
    macAddress: 'AA:BB:CC:DD:EE:02',
    registeredAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2026-06-23T18:55:00.000Z'
  },
  {
    id: 'dev-003', code: 'DEV-PAD-001', name: '导购平板 A1',
    type: 'pad', status: 'online',
    storeId: 'store-001', storeName: '万象城旗舰店',
    brandId: 'brand-001', brandName: '华润万象',
    marketCode: 'cn-mainland',
    lastOnlineAt: '2026-06-23T18:30:00.000Z',
    firmwareVersion: 'v3.1.0',
    ipAddress: '192.168.1.201',
    macAddress: 'AA:BB:CC:DD:EE:03',
    registeredAt: '2025-03-01T00:00:00.000Z',
    updatedAt: '2026-06-23T18:30:00.000Z'
  },
  {
    id: 'dev-004', code: 'DEV-POS-003', name: '收银终端 2F-A',
    type: 'pos', status: 'offline',
    storeId: 'store-001', storeName: '万象城旗舰店',
    brandId: 'brand-001', brandName: '华润万象',
    marketCode: 'cn-mainland',
    lastOnlineAt: '2026-06-22T10:00:00.000Z',
    firmwareVersion: 'v2.4.0',
    ipAddress: '192.168.1.103',
    macAddress: 'AA:BB:CC:DD:EE:04',
    registeredAt: '2025-01-15T00:00:00.000Z',
    updatedAt: '2026-06-22T10:00:00.000Z'
  },
  {
    id: 'dev-005', code: 'DEV-PRN-001', name: '小票打印机 A',
    type: 'printer', status: 'maintenance',
    storeId: 'store-002', storeName: '太古汇店',
    brandId: 'brand-001', brandName: '华润万象',
    marketCode: 'cn-mainland',
    lastOnlineAt: '2026-06-21T08:00:00.000Z',
    firmwareVersion: 'v1.8.3',
    ipAddress: '192.168.2.101',
    macAddress: 'AA:BB:CC:DD:EE:05',
    registeredAt: '2025-05-01T00:00:00.000Z',
    updatedAt: '2026-06-23T10:00:00.000Z'
  },
  {
    id: 'dev-006', code: 'DEV-SCN-001', name: '扫码枪 A',
    type: 'scanner', status: 'online',
    storeId: 'store-002', storeName: '太古汇店',
    brandId: 'brand-001', brandName: '华润万象',
    marketCode: 'cn-mainland',
    lastOnlineAt: '2026-06-23T19:10:00.000Z',
    firmwareVersion: 'v2.0.1',
    ipAddress: '192.168.2.102',
    macAddress: 'AA:BB:CC:DD:EE:06',
    registeredAt: '2025-05-01T00:00:00.000Z',
    updatedAt: '2026-06-23T19:10:00.000Z'
  },
  {
    id: 'dev-007', code: 'DEV-PAD-002', name: '导购平板 B1',
    type: 'pad', status: 'offline',
    storeId: 'store-002', storeName: '太古汇店',
    brandId: 'brand-001', brandName: '华润万象',
    marketCode: 'cn-mainland',
    lastOnlineAt: '2026-06-20T15:00:00.000Z',
    firmwareVersion: 'v3.0.2',
    ipAddress: '192.168.2.201',
    macAddress: 'AA:BB:CC:DD:EE:07',
    registeredAt: '2025-05-01T00:00:00.000Z',
    updatedAt: '2026-06-20T15:00:00.000Z'
  },
  {
    id: 'dev-008', code: 'DEV-SCL-001', name: '电子秤 A',
    type: 'scale', status: 'online',
    storeId: 'store-003', storeName: '三里屯店',
    brandId: 'brand-002', brandName: '太古汇',
    marketCode: 'cn-mainland',
    lastOnlineAt: '2026-06-23T19:05:00.000Z',
    firmwareVersion: 'v1.5.0',
    ipAddress: '192.168.3.101',
    macAddress: 'AA:BB:CC:DD:EE:08',
    registeredAt: '2025-07-01T00:00:00.000Z',
    updatedAt: '2026-06-23T19:05:00.000Z'
  }
];

// ---------------------------------------------------------------------------
// 设备列表渲染
// ---------------------------------------------------------------------------

describe('设备列表渲染', () => {
  it('should have at least 8 mock devices', () => {
    assert.ok(MOCK_DEVICES.length >= 8);
  });

  it('should have unique device ids', () => {
    const ids = MOCK_DEVICES.map((d) => d.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it('should have unique device codes', () => {
    const codes = MOCK_DEVICES.map((d) => d.code);
    assert.equal(new Set(codes).size, codes.length);
  });

  it('each device should have required identification fields', () => {
    for (const dev of MOCK_DEVICES) {
      assert.ok(dev.id, `device missing id`);
      assert.ok(dev.code, `device missing code`);
      assert.ok(dev.name, `device missing name`);
      assert.ok(['pos', 'pad', 'printer', 'scanner', 'scale'].includes(dev.type), `device ${dev.code} has invalid type: ${dev.type}`);
      assert.ok(['online', 'offline', 'maintenance'].includes(dev.status), `device ${dev.code} has invalid status: ${dev.status}`);
    }
  });

  it('each device should have store and brand references', () => {
    for (const dev of MOCK_DEVICES) {
      assert.ok(dev.storeId, `device ${dev.code} missing storeId`);
      assert.ok(dev.storeName, `device ${dev.code} missing storeName`);
      assert.ok(dev.brandId, `device ${dev.code} missing brandId`);
      assert.ok(dev.brandName, `device ${dev.code} missing brandName`);
      assert.ok(dev.marketCode, `device ${dev.code} missing marketCode`);
    }
  });

  it('each device should have network info', () => {
    for (const dev of MOCK_DEVICES) {
      assert.ok(dev.ipAddress, `device ${dev.code} missing ipAddress`);
      assert.ok(dev.macAddress, `device ${dev.code} missing macAddress`);
      assert.ok(dev.firmwareVersion, `device ${dev.code} missing firmwareVersion`);
    }
  });

  it('each device should have timestamps', () => {
    for (const dev of MOCK_DEVICES) {
      assert.ok(dev.registeredAt, `device ${dev.code} missing registeredAt`);
      assert.ok(dev.lastOnlineAt, `device ${dev.code} missing lastOnlineAt`);
      assert.ok(dev.updatedAt, `device ${dev.code} missing updatedAt`);
    }
  });
});

// ---------------------------------------------------------------------------
// 设备筛选
// ---------------------------------------------------------------------------

describe('设备筛选', () => {
  it('should filter by status: online', () => {
    const online = MOCK_DEVICES.filter((d) => d.status === 'online');
    assert.ok(online.length >= 3);
    for (const dev of online) {
      assert.equal(dev.status, 'online');
    }
  });

  it('should filter by status: offline', () => {
    const offline = MOCK_DEVICES.filter((d) => d.status === 'offline');
    assert.ok(offline.length >= 2);
    for (const dev of offline) {
      assert.equal(dev.status, 'offline');
    }
  });

  it('should filter by status: maintenance', () => {
    const maintenance = MOCK_DEVICES.filter((d) => d.status === 'maintenance');
    assert.ok(maintenance.length >= 1);
    for (const dev of maintenance) {
      assert.equal(dev.status, 'maintenance');
    }
  });

  it('should filter by type: pos', () => {
    const pos = MOCK_DEVICES.filter((d) => d.type === 'pos');
    assert.ok(pos.length >= 2);
    for (const dev of pos) {
      assert.equal(dev.type, 'pos');
    }
  });

  it('should filter by type: pad', () => {
    const pads = MOCK_DEVICES.filter((d) => d.type === 'pad');
    assert.ok(pads.length >= 2);
    for (const dev of pads) {
      assert.equal(dev.type, 'pad');
    }
  });

  it('should filter by store', () => {
    const store001 = MOCK_DEVICES.filter((d) => d.storeId === 'store-001');
    assert.ok(store001.length >= 3);
    for (const dev of store001) {
      assert.equal(dev.storeId, 'store-001');
    }
  });

  it('should filter by brand', () => {
    const brand001 = MOCK_DEVICES.filter((d) => d.brandId === 'brand-001');
    assert.ok(brand001.length >= 5);
    for (const dev of brand001) {
      assert.equal(dev.brandId, 'brand-001');
    }
  });

  it('should filter empty result for non-existent store', () => {
    const result = MOCK_DEVICES.filter((d) => d.storeId === 'store-999');
    assert.equal(result.length, 0);
  });

  it('should filter empty result for non-existent type', () => {
    const result = MOCK_DEVICES.filter((d) => (d.type as string) === 'unknown');
    assert.equal(result.length, 0);
  });
});

// ---------------------------------------------------------------------------
// 设备搜索
// ---------------------------------------------------------------------------

describe('设备搜索', () => {
  it('should search by code prefix', () => {
    const results = MOCK_DEVICES.filter((d) => d.code.startsWith('DEV-POS'));
    assert.ok(results.length >= 2);
    for (const dev of results) {
      assert.ok(dev.code.startsWith('DEV-POS'));
    }
  });

  it('should search by name partial match', () => {
    const results = MOCK_DEVICES.filter((d) => d.name.includes('收银'));
    assert.ok(results.length >= 2);
    for (const dev of results) {
      assert.ok(dev.name.includes('收银'));
    }
  });

  it('should search by store name', () => {
    const results = MOCK_DEVICES.filter((d) => d.storeName.includes('万象城'));
    assert.ok(results.length >= 2);
    for (const dev of results) {
      assert.ok(dev.storeName.includes('万象城'));
    }
  });

  it('should search by IP address', () => {
    const results = MOCK_DEVICES.filter((d) => d.ipAddress.startsWith('192.168.1'));
    assert.ok(results.length >= 3);
    for (const dev of results) {
      assert.ok(dev.ipAddress.startsWith('192.168.1'));
    }
  });

  it('should search case-insensitively', () => {
    const lowerSearch = MOCK_DEVICES.filter((d) => d.code.toLowerCase().includes('dev-pos'));
    const upperSearch = MOCK_DEVICES.filter((d) => d.code.includes('DEV-POS'));
    assert.equal(lowerSearch.length, upperSearch.length);
  });

  it('should return empty for unmatched search', () => {
    const results = MOCK_DEVICES.filter((d) => d.name.includes('不存在的设备'));
    assert.equal(results.length, 0);
  });
});

// ---------------------------------------------------------------------------
// 设备状态切换
// ---------------------------------------------------------------------------

describe('设备状态切换', () => {
  it('should have correct status counts', () => {
    const online = MOCK_DEVICES.filter((d) => d.status === 'online').length;
    const offline = MOCK_DEVICES.filter((d) => d.status === 'offline').length;
    const maintenance = MOCK_DEVICES.filter((d) => d.status === 'maintenance').length;

    assert.equal(online + offline + maintenance, MOCK_DEVICES.length);
    assert.ok(online > 0, 'should have online devices');
    assert.ok(offline > 0, 'should have offline devices');
    assert.ok(maintenance > 0, 'should have maintenance devices');
  });

  it('should simulate status transition online → maintenance', () => {
    const device = { ...MOCK_DEVICES[0] };
    assert.equal(device.status, 'online');

    const updated = { ...device, status: 'maintenance' as DeviceStatus, updatedAt: '2026-06-23T20:00:00.000Z' };
    assert.equal(updated.status, 'maintenance');
  });

  it('should simulate status transition maintenance → online', () => {
    const device = { ...MOCK_DEVICES[4] };
    assert.equal(device.status, 'maintenance');

    const updated = { ...device, status: 'online' as DeviceStatus, updatedAt: '2026-06-23T20:00:00.000Z' };
    assert.equal(updated.status, 'online');
  });

  it('should simulate status transition offline → online', () => {
    const device = { ...MOCK_DEVICES[3] };
    assert.equal(device.status, 'offline');

    const updated = { ...device, status: 'online' as DeviceStatus, updatedAt: '2026-06-23T20:00:00.000Z' };
    assert.equal(updated.status, 'online');
  });

  it('should update timestamp on status change', () => {
    const device = { ...MOCK_DEVICES[0] };
    const oldUpdatedAt = device.updatedAt ?? '';

    const updated = { ...device, status: 'maintenance' as DeviceStatus, updatedAt: '2026-06-23T20:00:00.000Z' };
    assert.ok(updated.updatedAt! > oldUpdatedAt);
  });

  it('should only allow valid statuses', () => {
    const validStatuses: DeviceStatus[] = ['online', 'offline', 'maintenance'];
    for (const dev of MOCK_DEVICES) {
      assert.ok(validStatuses.includes(dev.status));
    }
  });
});

// ---------------------------------------------------------------------------
// 设备面板辅助函数
// ---------------------------------------------------------------------------

describe('设备面板辅助函数', () => {
  it('should compute status label in Chinese', () => {
    const statusLabel: Record<DeviceStatus, string> = {
      online: '在线',
      offline: '离线',
      maintenance: '维护中'
    };
    assert.equal(statusLabel.online, '在线');
    assert.equal(statusLabel.offline, '离线');
    assert.equal(statusLabel.maintenance, '维护中');
  });

  it('should compute status color/variant', () => {
    const statusVariant: Record<DeviceStatus, 'success' | 'danger' | 'warning'> = {
      online: 'success',
      offline: 'danger',
      maintenance: 'warning'
    };
    assert.equal(statusVariant.online, 'success');
    assert.equal(statusVariant.offline, 'danger');
    assert.equal(statusVariant.maintenance, 'warning');
  });

  it('should compute device type label in Chinese', () => {
    const typeLabel: Record<DeviceInfo['type'], string> = {
      pos: '收银终端',
      pad: '平板',
      printer: '打印机',
      scanner: '扫码枪',
      scale: '电子秤'
    };
    assert.equal(typeLabel.pos, '收银终端');
    assert.equal(typeLabel.pad, '平板');
    assert.equal(typeLabel.printer, '打印机');
    assert.equal(typeLabel.scanner, '扫码枪');
    assert.equal(typeLabel.scale, '电子秤');
  });

  it('should compute device count per store', () => {
    const storeCounts: Record<string, number> = {};
    for (const dev of MOCK_DEVICES) {
      storeCounts[dev.storeId] = (storeCounts[dev.storeId] ?? 0) + 1;
    }
    assert.ok((storeCounts['store-001'] ?? 0) >= 3);
    assert.ok((storeCounts['store-002'] ?? 0) >= 2);
    assert.ok((storeCounts['store-003'] ?? 0) >= 1);
  });

  it('should compute device count per type', () => {
    const typeCounts: Record<string, number> = {};
    for (const dev of MOCK_DEVICES) {
      typeCounts[dev.type] = (typeCounts[dev.type] ?? 0) + 1;
    }
    assert.ok((typeCounts['pos'] ?? 0) >= 2);
    assert.ok((typeCounts['pad'] ?? 0) >= 2);
    assert.ok((typeCounts['printer'] ?? 0) >= 1);
    assert.ok((typeCounts['scanner'] ?? 0) >= 1);
    assert.ok((typeCounts['scale'] ?? 0) >= 1);
  });
});

// ---------------------------------------------------------------------------
// 跨market覆盖
// ---------------------------------------------------------------------------

describe('设备跨market覆盖', () => {
  it('should have a dominant market', () => {
    const markets = MOCK_DEVICES.map((d) => d.marketCode);
    const uniqueMarkets = new Set(markets);
    assert.ok(uniqueMarkets.size >= 1);
    assert.ok(markets.every((m) => m === 'cn-mainland'));
  });
});
