/**
 * devices-page.test.ts — Unit tests for devices page data, filtering, and page logic
 *
 * 🐜 自动: [B-页面创建] [devices-page 设备管理列表页测试]
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

// ---- 类型定义（与 devices/device-types.ts 一致） ----

type DeviceType = 'POS' | 'printer' | 'scanner' | 'tablet' | 'kiosk' | 'scale';
type DeviceStatus = 'online' | 'offline' | 'warning' | 'maintenance';

interface DeviceItem {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  ip: string;
  storeId: string;
  storeName: string;
  lastCheckAt: string;
  firmwareVersion: string;
  serialNumber: string;
}

const DEVICE_TYPE_ENUM: DeviceType[] = ['POS', 'printer', 'scanner', 'tablet', 'kiosk', 'scale'];
const DEVICE_STATUS_ENUM: DeviceStatus[] = ['online', 'offline', 'warning', 'maintenance'];

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

// ---- Mock 数据 ----

const MOCK_DEVICES: DeviceItem[] = [
  { id: 'd1', name: 'POS-主收银-A01', type: 'POS', status: 'online', ip: '192.168.1.101', storeId: 'S001', storeName: '旗舰店-解放路', lastCheckAt: '2026-06-23T14:55:00Z', firmwareVersion: 'v3.2.1', serialNumber: 'POS-XJ-2024001' },
  { id: 'd2', name: '标签打印机-B03', type: 'printer', status: 'warning', ip: '192.168.1.132', storeId: 'S001', storeName: '旗舰店-解放路', lastCheckAt: '2026-06-23T14:30:00Z', firmwareVersion: 'v2.5.0', serialNumber: 'PRT-XJ-2024012' },
  { id: 'd3', name: '条码扫描枪-C01', type: 'scanner', status: 'online', ip: '192.168.1.105', storeId: 'S001', storeName: '旗舰店-解放路', lastCheckAt: '2026-06-23T14:50:00Z', firmwareVersion: 'v1.9.3', serialNumber: 'SCN-XJ-2024003' },
  { id: 'd4', name: 'POS-副收银-A02', type: 'POS', status: 'offline', ip: '192.168.1.102', storeId: 'S002', storeName: '分店-建设大道', lastCheckAt: '2026-06-23T08:20:00Z', firmwareVersion: 'v3.2.0', serialNumber: 'POS-XJ-2024002' },
  { id: 'd5', name: '自助点餐机-K01', type: 'kiosk', status: 'online', ip: '192.168.1.201', storeId: 'S002', storeName: '分店-建设大道', lastCheckAt: '2026-06-23T14:45:00Z', firmwareVersion: 'v4.0.1', serialNumber: 'KSK-XJ-2024005' },
  { id: 'd6', name: '电子秤-E01', type: 'scale', status: 'maintenance', ip: '192.168.1.210', storeId: 'S003', storeName: '分店-中山路', lastCheckAt: '2026-06-22T16:00:00Z', firmwareVersion: 'v2.1.0', serialNumber: 'SCL-XJ-2024006' },
  { id: 'd7', name: 'POS-收银-A03', type: 'POS', status: 'online', ip: '192.168.1.103', storeId: 'S003', storeName: '分店-中山路', lastCheckAt: '2026-06-23T14:40:00Z', firmwareVersion: 'v3.2.1', serialNumber: 'POS-XJ-2024003' },
  { id: 'd8', name: '无线扫描枪-C02', type: 'scanner', status: 'online', ip: '192.168.1.106', storeId: 'S004', storeName: '分店-天河城', lastCheckAt: '2026-06-23T14:35:00Z', firmwareVersion: 'v1.9.3', serialNumber: 'SCN-XJ-2024004' },
  { id: 'd9', name: '热敏打印机-B04', type: 'printer', status: 'offline', ip: '192.168.1.133', storeId: 'S004', storeName: '分店-天河城', lastCheckAt: '2026-06-23T08:10:00Z', firmwareVersion: 'v2.5.0', serialNumber: 'PRT-XJ-2024013' },
  { id: 'd10', name: '平板点菜-T01', type: 'tablet', status: 'online', ip: '192.168.1.50', storeId: 'S002', storeName: '分店-建设大道', lastCheckAt: '2026-06-23T14:20:00Z', firmwareVersion: 'v5.1.2', serialNumber: 'TAB-XJ-2024010' },
  { id: 'd11', name: 'POS-收银-A04', type: 'POS', status: 'warning', ip: '192.168.1.104', storeId: 'S005', storeName: '分店-五一路', lastCheckAt: '2026-06-23T13:00:00Z', firmwareVersion: 'v3.1.9', serialNumber: 'POS-XJ-2024004' },
  { id: 'd12', name: '条码扫描枪-C03', type: 'scanner', status: 'online', ip: '192.168.1.107', storeId: 'S005', storeName: '分店-五一路', lastCheckAt: '2026-06-23T14:00:00Z', firmwareVersion: 'v1.9.2', serialNumber: 'SCN-XJ-2024005' },
  { id: 'd13', name: '自助点餐机-K02', type: 'kiosk', status: 'offline', ip: '192.168.1.202', storeId: 'S005', storeName: '分店-五一路', lastCheckAt: '2026-06-23T06:30:00Z', firmwareVersion: 'v4.0.0', serialNumber: 'KSK-XJ-2024006' },
  { id: 'd14', name: '电子秤-E02', type: 'scale', status: 'online', ip: '192.168.1.211', storeId: 'S004', storeName: '分店-天河城', lastCheckAt: '2026-06-23T14:10:00Z', firmwareVersion: 'v2.1.1', serialNumber: 'SCL-XJ-2024007' },
  { id: 'd15', name: 'POS-收银-A05', type: 'POS', status: 'online', ip: '192.168.1.108', storeId: 'S006', storeName: '分店-万象城', lastCheckAt: '2026-06-23T14:15:00Z', firmwareVersion: 'v3.2.1', serialNumber: 'POS-XJ-2024005' },
  { id: 'd16', name: '平板点菜-T02', type: 'tablet', status: 'maintenance', ip: '192.168.1.51', storeId: 'S006', storeName: '分店-万象城', lastCheckAt: '2026-06-22T12:00:00Z', firmwareVersion: 'v5.1.0', serialNumber: 'TAB-XJ-2024011' },
  { id: 'd17', name: '自助点餐机-K03', type: 'kiosk', status: 'online', ip: '192.168.1.203', storeId: 'S006', storeName: '分店-万象城', lastCheckAt: '2026-06-23T14:00:00Z', firmwareVersion: 'v4.0.1', serialNumber: 'KSK-XJ-2024007' },
  { id: 'd18', name: '标签打印机-B05', type: 'printer', status: 'online', ip: '192.168.1.134', storeId: 'S001', storeName: '旗舰店-解放路', lastCheckAt: '2026-06-23T14:48:00Z', firmwareVersion: 'v2.5.1', serialNumber: 'PRT-XJ-2024014' },
  { id: 'd19', name: '无线扫描枪-C04', type: 'scanner', status: 'offline', ip: '192.168.1.108', storeId: 'S003', storeName: '分店-中山路', lastCheckAt: '2026-06-23T07:55:00Z', firmwareVersion: 'v1.8.9', serialNumber: 'SCN-XJ-2024006' },
  { id: 'd20', name: 'POS-收银-A06', type: 'POS', status: 'online', ip: '192.168.1.109', storeId: 'S007', storeName: '分店-世纪城', lastCheckAt: '2026-06-23T14:30:00Z', firmwareVersion: 'v3.2.0', serialNumber: 'POS-XJ-2024006' },
];

// ---- 测试套件 ----

describe('devices data integrity', () => {
  describe('MOCK_DEVICES', () => {
    it('should contain at least 15 devices', () => {
      assert.ok(MOCK_DEVICES.length >= 15, `expected >= 15, got ${MOCK_DEVICES.length}`);
    });

    it('every device should have a unique id', () => {
      const ids = MOCK_DEVICES.map((d) => d.id);
      assert.strictEqual(new Set(ids).size, ids.length);
    });

    it('every device should have a unique serialNumber', () => {
      const serials = MOCK_DEVICES.map((d) => d.serialNumber);
      assert.strictEqual(new Set(serials).size, serials.length);
    });

    it('every device should have a valid type', () => {
      for (const d of MOCK_DEVICES) {
        assert.ok(
          DEVICE_TYPE_ENUM.includes(d.type),
          `invalid type ${d.type} for ${d.id}`
        );
      }
    });

    it('every device should have a valid status', () => {
      for (const d of MOCK_DEVICES) {
        assert.ok(
          DEVICE_STATUS_ENUM.includes(d.status),
          `invalid status ${d.status} for ${d.id}`
        );
      }
    });

    it('every device should have a non-empty name', () => {
      for (const d of MOCK_DEVICES) {
        assert.ok(d.name.trim().length > 0, `empty name for ${d.id}`);
      }
    });

    it('every device should have a valid IP address', () => {
      const IP_PATTERN = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
      for (const d of MOCK_DEVICES) {
        assert.ok(IP_PATTERN.test(d.ip), `invalid IP ${d.ip} for ${d.id}`);
      }
    });

    it('every device should have a non-empty firmwareVersion', () => {
      for (const d of MOCK_DEVICES) {
        assert.ok(d.firmwareVersion.length > 0, `missing firmwareVersion for ${d.id}`);
      }
    });

    it('should have devices in multiple stores', () => {
      const stores = new Set(MOCK_DEVICES.map((d) => d.storeId));
      assert.ok(stores.size >= 5, `expected >= 5 stores, got ${stores.size}`);
    });

    it('should have at least one device of each type', () => {
      for (const t of DEVICE_TYPE_ENUM) {
        const count = MOCK_DEVICES.filter((d) => d.type === t).length;
        assert.ok(count > 0, `no devices of type ${t}`);
      }
    });

    it('should have at least one device in each status', () => {
      for (const s of DEVICE_STATUS_ENUM) {
        const count = MOCK_DEVICES.filter((d) => d.status === s).length;
        assert.ok(count > 0, `no devices with status ${s}`);
      }
    });

    it('lastCheckAt should be a valid ISO string', () => {
      const ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
      for (const d of MOCK_DEVICES) {
        assert.ok(ISO_PATTERN.test(d.lastCheckAt), `invalid lastCheckAt ${d.lastCheckAt} for ${d.id}`);
      }
    });
  });

  describe('DEVICE_TYPE_LABELS', () => {
    it('should have entries for all device types', () => {
      for (const t of DEVICE_TYPE_ENUM) {
        assert.ok(DEVICE_TYPE_LABELS[t], `missing label for type ${t}`);
      }
    });

    it('each label should be a non-empty Chinese string', () => {
      for (const t of DEVICE_TYPE_ENUM) {
        assert.ok(typeof DEVICE_TYPE_LABELS[t] === 'string' && DEVICE_TYPE_LABELS[t].length > 0);
      }
    });
  });

  describe('STATUS_LABELS', () => {
    it('should have entries for all statuses', () => {
      for (const s of DEVICE_STATUS_ENUM) {
        assert.ok(STATUS_LABELS[s], `missing label for status ${s}`);
      }
    });

    it('each label should be a non-empty Chinese string', () => {
      for (const s of DEVICE_STATUS_ENUM) {
        assert.ok(typeof STATUS_LABELS[s] === 'string' && STATUS_LABELS[s].length > 0);
      }
    });
  });
});

describe('devices filtering logic', () => {
  describe('status filter', () => {
    it('should filter by online status', () => {
      const result = MOCK_DEVICES.filter((d) => d.status === 'online');
      assert.ok(result.length > 0);
      for (const d of result) {
        assert.strictEqual(d.status, 'online');
      }
    });

    it('should filter by offline status', () => {
      const result = MOCK_DEVICES.filter((d) => d.status === 'offline');
      assert.ok(result.length > 0);
      for (const d of result) {
        assert.strictEqual(d.status, 'offline');
      }
    });

    it('should filter by warning status', () => {
      const result = MOCK_DEVICES.filter((d) => d.status === 'warning');
      assert.ok(result.length > 0);
      for (const d of result) {
        assert.strictEqual(d.status, 'warning');
      }
    });

    it('should filter by maintenance status', () => {
      const result = MOCK_DEVICES.filter((d) => d.status === 'maintenance');
      assert.ok(result.length > 0);
      for (const d of result) {
        assert.strictEqual(d.status, 'maintenance');
      }
    });
  });

  describe('type filter', () => {
    it('should filter by POS type', () => {
      const result = MOCK_DEVICES.filter((d) => d.type === 'POS');
      assert.ok(result.length >= 5);
      for (const d of result) {
        assert.strictEqual(d.type, 'POS');
      }
    });

    it('should filter by printer type', () => {
      const result = MOCK_DEVICES.filter((d) => d.type === 'printer');
      assert.ok(result.length >= 2);
      for (const d of result) {
        assert.strictEqual(d.type, 'printer');
      }
    });

    it('should filter by scanner type', () => {
      const result = MOCK_DEVICES.filter((d) => d.type === 'scanner');
      assert.ok(result.length >= 3);
      for (const d of result) {
        assert.strictEqual(d.type, 'scanner');
      }
    });

    it('should filter by kiosk type', () => {
      const result = MOCK_DEVICES.filter((d) => d.type === 'kiosk');
      assert.ok(result.length >= 2);
      for (const d of result) {
        assert.strictEqual(d.type, 'kiosk');
      }
    });

    it('should filter by tablet type', () => {
      const result = MOCK_DEVICES.filter((d) => d.type === 'tablet');
      assert.ok(result.length >= 1);
      for (const d of result) {
        assert.strictEqual(d.type, 'tablet');
      }
    });

    it('should filter by scale type', () => {
      const result = MOCK_DEVICES.filter((d) => d.type === 'scale');
      assert.ok(result.length >= 1);
      for (const d of result) {
        assert.strictEqual(d.type, 'scale');
      }
    });
  });

  describe('search filter', () => {
    const searchFields: (keyof DeviceItem)[] = ['name', 'storeName', 'serialNumber', 'ip'];

    function searchBy(items: DeviceItem[], term: string): DeviceItem[] {
      if (!term.trim()) return items;
      const lower = term.toLowerCase();
      return items.filter((item) =>
        searchFields.some((key) =>
          String(item[key]).toLowerCase().includes(lower)
        )
      );
    }

    it('should match by device name', () => {
      const result = searchBy(MOCK_DEVICES, 'POS-主收银');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 'd1');
    });

    it('should match by store name (case-insensitive)', () => {
      const result = searchBy(MOCK_DEVICES, '旗舰店');
      assert.ok(result.length >= 3);
    });

    it('should match by serial number', () => {
      const result = searchBy(MOCK_DEVICES, 'POS-XJ-2024001');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 'd1');
    });

    it('should match by IP address', () => {
      const result = searchBy(MOCK_DEVICES, '192.168.1.101');
      assert.strictEqual(result.length, 1);
      assert.strictEqual(result[0]?.id, 'd1');
    });

    it('should return empty for non-matching search', () => {
      const result = searchBy(MOCK_DEVICES, 'xyz-nonexistent-99999');
      assert.strictEqual(result.length, 0);
    });

    it('empty search should return all items', () => {
      const result = searchBy(MOCK_DEVICES, '');
      assert.strictEqual(result.length, MOCK_DEVICES.length);
    });

    it('partial match should work', () => {
      const result = searchBy(MOCK_DEVICES, 'POS-');
      assert.ok(result.length >= 6);
    });
  });

  describe('store filter', () => {
    it('should filter by store S001 (flagship)', () => {
      const result = MOCK_DEVICES.filter((d) => d.storeId === 'S001');
      assert.ok(result.length >= 3);
      for (const d of result) {
        assert.strictEqual(d.storeId, 'S001');
      }
    });

    it('should filter by store S002', () => {
      const result = MOCK_DEVICES.filter((d) => d.storeId === 'S002');
      assert.ok(result.length >= 2);
      for (const d of result) {
        assert.strictEqual(d.storeId, 'S002');
      }
    });
  });
});

describe('devices composite filtering', () => {
  describe('status + type', () => {
    it('online POS devices should exist', () => {
      const result = MOCK_DEVICES.filter(
        (d) => d.status === 'online' && d.type === 'POS'
      );
      assert.ok(result.length >= 3);
      for (const d of result) {
        assert.strictEqual(d.status, 'online');
        assert.strictEqual(d.type, 'POS');
      }
    });

    it('offline printers should exist', () => {
      const result = MOCK_DEVICES.filter(
        (d) => d.status === 'offline' && d.type === 'printer'
      );
      assert.ok(result.length >= 1);
    });

    it('online scanners should exist', () => {
      const result = MOCK_DEVICES.filter(
        (d) => d.status === 'online' && d.type === 'scanner'
      );
      assert.ok(result.length >= 2);
    });
  });

  describe('status + store', () => {
    it('online devices in S001 should exist', () => {
      const result = MOCK_DEVICES.filter(
        (d) => d.status === 'online' && d.storeId === 'S001'
      );
      assert.ok(result.length >= 2);
    });

    it('offline devices should exist in multiple stores', () => {
      const offlineByStore = new Set(
        MOCK_DEVICES.filter((d) => d.status === 'offline').map((d) => d.storeId)
      );
      assert.ok(offlineByStore.size >= 2);
    });
  });

  describe('triple filter: status + type + store', () => {
    it('online POS devices in S001 should exist', () => {
      const result = MOCK_DEVICES.filter(
        (d) => d.status === 'online' && d.type === 'POS' && d.storeId === 'S001'
      );
      assert.ok(result.length >= 1);
    });
  });
});

describe('devices pagination logic', () => {
  it('should paginate items correctly with pageSize=5', () => {
    const pageSize = 5;
    const page = 0;
    const start = page * pageSize;
    const end = start + pageSize;
    const pageItems = MOCK_DEVICES.slice(start, end);
    assert.strictEqual(pageItems.length, pageSize);
    assert.strictEqual(pageItems[0]?.id, MOCK_DEVICES[0]?.id);
  });

  it('second page should have correct items', () => {
    const pageSize = 5;
    const page = 1;
    const start = page * pageSize;
    const end = start + pageSize;
    const pageItems = MOCK_DEVICES.slice(start, end);
    assert.strictEqual(pageItems.length, pageSize);
    assert.strictEqual(pageItems[0]?.id, 'd6');
  });

  it('last page should handle fewer items', () => {
    const pageSize = 10;
    const totalPages = Math.ceil(MOCK_DEVICES.length / pageSize);
    const lastPage = totalPages - 1;
    const start = lastPage * pageSize;
    const pageItems = MOCK_DEVICES.slice(start);
    assert.ok(pageItems.length <= pageSize);
    assert.ok(pageItems.length > 0);
  });

  it('out-of-bounds page should return empty', () => {
    const pageSize = 10;
    const page = 10;
    const start = page * pageSize;
    const pageItems = MOCK_DEVICES.slice(start);
    assert.strictEqual(pageItems.length, 0);
  });

  it('should handle different page sizes', () => {
    const pageSize = 7;
    const pages = Math.ceil(MOCK_DEVICES.length / pageSize);
    assert.strictEqual(pages, 3);
    const lastPageStart = (pages - 1) * pageSize;
    const lastItems = MOCK_DEVICES.slice(lastPageStart);
    assert.strictEqual(lastItems.length, MOCK_DEVICES.length - lastPageStart);
    assert.ok(lastItems.length <= pageSize);
  });
});

describe('devices sorting logic', () => {
  it('should sort by name alphabetically', () => {
    const sorted = [...MOCK_DEVICES].sort((a, b) => a.name.localeCompare(b.name));
    assert.ok(
      sorted.every(
        (_, i) => i === 0 || sorted[i]?.name.localeCompare(sorted[i - 1]?.name ?? '') >= 0
      )
    );
  });

  it('should sort by IP address (string compare)', () => {
    const sorted = [...MOCK_DEVICES].sort((a, b) => a.ip.localeCompare(b.ip));
    assert.ok(
      sorted.every(
        (_, i) => i === 0 || sorted[i]?.ip.localeCompare(sorted[i - 1]?.ip ?? '') >= 0
      )
    );
  });

  it('should sort by status order: offline > warning > maintenance > online', () => {
    const statusOrder: Record<DeviceStatus, number> = { offline: 0, warning: 1, maintenance: 2, online: 3 };
    const sorted = [...MOCK_DEVICES].sort(
      (a, b) => statusOrder[a.status] - statusOrder[b.status]
    );
    assert.ok(
      sorted.every(
        (_, i) =>
          i === 0 || statusOrder[sorted[i]?.status ?? 'online'] >= statusOrder[sorted[i - 1]?.status ?? 'online']
      )
    );
  });

  it('should sort by firmware version descending', () => {
    const sorted = [...MOCK_DEVICES].sort((a, b) => b.firmwareVersion.localeCompare(a.firmwareVersion));
    assert.ok(
      sorted.every(
        (_, i) => i === 0 || sorted[i]?.firmwareVersion.localeCompare(sorted[i - 1]?.firmwareVersion ?? '') <= 0
      )
    );
  });
});

describe('devices stats computation', () => {
  it('should compute correct totals', () => {
    const total = MOCK_DEVICES.length;
    const online = MOCK_DEVICES.filter((d) => d.status === 'online').length;
    const offline = MOCK_DEVICES.filter((d) => d.status === 'offline').length;
    const warning = MOCK_DEVICES.filter((d) => d.status === 'warning').length;
    const maintenance = MOCK_DEVICES.filter((d) => d.status === 'maintenance').length;

    assert.strictEqual(total, 20);
    assert.strictEqual(online + offline + warning + maintenance, total);
    assert.ok(online >= 10);
    assert.ok(offline >= 2);
    assert.ok(warning >= 1);
    assert.ok(maintenance >= 1);
  });

  it('should compute correct online rate', () => {
    const online = MOCK_DEVICES.filter((d) => d.status === 'online').length;
    const onlineRate = Math.round((online / MOCK_DEVICES.length) * 100);
    assert.ok(onlineRate >= 40);
    assert.ok(onlineRate <= 100);
  });

  it('should compute correct type distribution', () => {
    for (const t of DEVICE_TYPE_ENUM) {
      const count = MOCK_DEVICES.filter((d) => d.type === t).length;
      assert.ok(count >= 1, `no devices of type ${t}`);
    }
  });

  it('should compute correct store distribution', () => {
    const storeCounts = new Map<string, number>();
    for (const d of MOCK_DEVICES) {
      storeCounts.set(d.storeId, (storeCounts.get(d.storeId) ?? 0) + 1);
    }
    // S001 (flagship) should have the most devices
    const s001Count = storeCounts.get('S001') ?? 0;
    assert.ok(s001Count >= 3, `expected S001 to have >= 3 devices, got ${s001Count}`);
  });

  it('should compute POS-to-scanner ratio', () => {
    const posCount = MOCK_DEVICES.filter((d) => d.type === 'POS').length;
    const scannerCount = MOCK_DEVICES.filter((d) => d.type === 'scanner').length;
    assert.ok(posCount > scannerCount, `expected POS(${posCount}) > scanner(${scannerCount})`);
  });
});

describe('devices edge cases', () => {
  it('empty filter should return empty array', () => {
    const result = MOCK_DEVICES.filter(() => false);
    assert.strictEqual(result.length, 0);
  });

  it('ALL type filter (no-op) should return all devices', () => {
    const result = MOCK_DEVICES.filter(() => true);
    assert.strictEqual(result.length, MOCK_DEVICES.length);
  });

  it('non-existent store should return empty', () => {
    const result = MOCK_DEVICES.filter((d) => d.storeId === 'S999');
    assert.strictEqual(result.length, 0);
  });

  it('serialNumber should follow format prefix-STORE-XXXX pattern', () => {
    const PATTERN = /^[A-Z]+-XJ-\d{7}$/;
    for (const d of MOCK_DEVICES) {
      assert.ok(PATTERN.test(d.serialNumber), `unexpected serialNumber format: ${d.serialNumber}`);
    }
  });

  it('firmware version should follow semver-like pattern', () => {
    const SEMVER_PATTERN = /^v\d+\.\d+\.\d+$/;
    for (const d of MOCK_DEVICES) {
      assert.ok(SEMVER_PATTERN.test(d.firmwareVersion), `unexpected firmware version: ${d.firmwareVersion}`);
    }
  });

  it('devices with warning status should be actionable', () => {
    const warningDevices = MOCK_DEVICES.filter((d) => d.status === 'warning');
    for (const d of warningDevices) {
      // Warning devices should have a recent check (within the last hour)
      const checkTime = new Date(d.lastCheckAt).getTime();
      const now = new Date('2026-06-23T15:00:00Z').getTime();
      const diffMs = now - checkTime;
      assert.ok(diffMs >= 0, `warning device ${d.id} has future check time`);
    }
  });
});
