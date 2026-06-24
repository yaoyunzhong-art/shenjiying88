/**
 * devices-page.test.ts — Page-level data tests for devices management page.
 * Tests mock data integrity, status/type filtering, search, and sorting.
 *
 * Pattern: L1 JMeter-style (正例 + 反例 + 边界)
 * References: devices-data.ts, device-types.ts
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';

import { getDevices } from './devices-data';
import type { DeviceItem, DeviceType, DeviceStatus } from './device-types';

// ---- 支持的枚举 ----

const ALL_TYPES: DeviceType[] = ['POS', 'printer', 'scanner', 'tablet', 'kiosk', 'scale'];
const ALL_STATUSES: DeviceStatus[] = ['online', 'offline', 'warning', 'maintenance'];

// ---- Page-level filter helpers ----

function filterByType(items: DeviceItem[], type: DeviceType | 'ALL'): DeviceItem[] {
  if (type === 'ALL') return items;
  return items.filter((d) => d.type === type);
}

function filterByStatus(items: DeviceItem[], status: DeviceStatus | 'ALL'): DeviceItem[] {
  if (status === 'ALL') return items;
  return items.filter((d) => d.status === status);
}

function searchItems(items: DeviceItem[], keyword: string): DeviceItem[] {
  if (!keyword.trim()) return items;
  const lower = keyword.toLowerCase();
  return items.filter(
    (d) =>
      d.name.toLowerCase().includes(lower) ||
      d.type.toLowerCase().includes(lower) ||
      d.storeName.toLowerCase().includes(lower) ||
      d.ip.toLowerCase().includes(lower) ||
      d.serialNumber.toLowerCase().includes(lower)
  );
}

type SortKey = 'name' | 'type' | 'status' | 'storeName' | 'lastCheckAt';
type SortDir = 'asc' | 'desc';

function sortItems(items: DeviceItem[], key: SortKey, dir: SortDir): DeviceItem[] {
  const sorted = [...items].sort((a, b) => {
    const cmp = String(a[key] ?? '').localeCompare(String(b[key] ?? ''));
    return dir === 'asc' ? cmp : -cmp;
  });
  return sorted;
}

function getOnlineRate(items: DeviceItem[]): number {
  if (items.length === 0) return 0;
  return items.filter((d) => d.status === 'online').length / items.length;
}

function countByType(items: DeviceItem[], type: DeviceType): number {
  return items.filter((d) => d.type === type).length;
}

function countByStatus(items: DeviceItem[], status: DeviceStatus): number {
  return items.filter((d) => d.status === status).length;
}

// ---- 正例 ----

describe('devices-page: 正例 (positive cases)', () => {
  const devices = getDevices();

  describe('data integrity', () => {
    it('should return at least 6 devices', () => {
      assert.ok(devices.length >= 6, `expected >= 6, got ${devices.length}`);
    });

    it('every device should have unique id', () => {
      const ids = devices.map((d) => d.id);
      assert.strictEqual(new Set(ids).size, ids.length);
    });

    it('every device should have valid type and status', () => {
      for (const d of devices) {
        assert.ok(ALL_TYPES.includes(d.type), `invalid type ${d.type} for ${d.id}`);
        assert.ok(ALL_STATUSES.includes(d.status), `invalid status ${d.status} for ${d.id}`);
      }
    });

    it('every device should have non-empty name, storeName, ip, serialNumber', () => {
      for (const d of devices) {
        assert.ok(d.name.length > 0, `empty name for ${d.id}`);
        assert.ok(d.storeName.length > 0, `empty storeName for ${d.id}`);
        assert.ok(d.ip.length > 0, `empty ip for ${d.id}`);
        assert.ok(d.serialNumber.length > 0, `empty serialNumber for ${d.id}`);
      }
    });

    it('every device should have a valid firmware version', () => {
      for (const d of devices) {
        assert.ok(/^v\d+\.\d+\.\d+$/.test(d.firmwareVersion), `invalid firmwareVersion ${d.firmwareVersion} for ${d.id}`);
      }
    });

    it('should have at least 2 POS devices', () => {
      assert.ok(countByType(devices, 'POS') >= 2);
    });

    it('should have at least 1 online device', () => {
      assert.ok(countByStatus(devices, 'online') >= 1);
    });
  });

  describe('filter by type', () => {
    it('filter POS should return only POS devices', () => {
      const result = filterByType(devices, 'POS');
      assert.ok(result.length >= 2);
      for (const d of result) {
        assert.strictEqual(d.type, 'POS');
      }
    });

    it('filter printer should return only printer devices', () => {
      const result = filterByType(devices, 'printer');
      assert.ok(result.length >= 1);
      for (const d of result) {
        assert.strictEqual(d.type, 'printer');
      }
    });

    it('filter ALL should return all devices', () => {
      const result = filterByType(devices, 'ALL');
      assert.strictEqual(result.length, devices.length);
    });
  });

  describe('filter by status', () => {
    it('filter online should return only online devices', () => {
      const result = filterByStatus(devices, 'online');
      assert.ok(result.length >= 3);
      for (const d of result) {
        assert.strictEqual(d.status, 'online');
      }
    });

    it('filter offline should return only offline devices', () => {
      const result = filterByStatus(devices, 'offline');
      assert.ok(result.length >= 1);
      for (const d of result) {
        assert.strictEqual(d.status, 'offline');
      }
    });

    it('filter maintenance should return only maintenance devices', () => {
      const result = filterByStatus(devices, 'maintenance');
      assert.ok(result.length >= 1);
      for (const d of result) {
        assert.strictEqual(d.status, 'maintenance');
      }
    });
  });

  describe('search', () => {
    it('should find by name', () => {
      const result = searchItems(devices, 'POS');
      assert.ok(result.length >= 2);
    });

    it('should find by storeName', () => {
      const result = searchItems(devices, '解放路');
      assert.ok(result.length >= 1);
    });

    it('should find by serialNumber', () => {
      const result = searchItems(devices, '2024001');
      assert.ok(result.length >= 1);
    });

    it('empty search should return all', () => {
      const result = searchItems(devices, '');
      assert.strictEqual(result.length, devices.length);
    });
  });

  describe('sorting', () => {
    it('should sort by name ascending', () => {
      const sorted = sortItems(devices, 'name', 'asc');
      for (let i = 1; i < sorted.length; i++) {
        assert.ok((sorted[i]?.name ?? '') >= (sorted[i - 1]?.name ?? ''));
      }
    });

    it('should sort by name descending', () => {
      const sorted = sortItems(devices, 'name', 'desc');
      for (let i = 1; i < sorted.length; i++) {
        assert.ok((sorted[i]?.name ?? '') <= (sorted[i - 1]?.name ?? ''));
      }
    });

    it('should sort by lastCheckAt', () => {
      const sorted = sortItems(devices, 'lastCheckAt', 'desc');
      for (let i = 1; i < sorted.length; i++) {
        assert.ok((sorted[i]?.lastCheckAt ?? '') <= (sorted[i - 1]?.lastCheckAt ?? ''));
      }
    });
  });

  describe('online rate', () => {
    it('should be between 0 and 1', () => {
      const rate = getOnlineRate(devices);
      assert.ok(rate >= 0 && rate <= 1, `online rate ${rate} out of range`);
    });

    it('should be at least 0.3', () => {
      const rate = getOnlineRate(devices);
      assert.ok(rate >= 0.3, `online rate too low: ${rate}`);
    });
  });

  describe('combined filter', () => {
    it('should filter by type + status', () => {
      let result = filterByType(devices, 'POS');
      result = filterByStatus(result, 'online');
      for (const d of result) {
        assert.strictEqual(d.type, 'POS');
        assert.strictEqual(d.status, 'online');
      }
    });

    it('should filter + search combined', () => {
      let result = filterByStatus(devices, 'online');
      result = searchItems(result, '解放路');
      for (const d of result) {
        assert.strictEqual(d.status, 'online');
        assert.ok(d.storeName.includes('解放路'));
      }
    });
  });
});

// ---- 反例 ----

describe('devices-page: 反例 (negative cases)', () => {
  const devices = getDevices();

  it('filter by nonexistent type should return empty', () => {
    const result = filterByType(devices, 'router' as DeviceType);
    assert.strictEqual(result.length, 0);
  });

  it('search for nonexistent keyword should return empty', () => {
    const result = searchItems(devices, 'ZZZZ_NONEXISTENT');
    assert.strictEqual(result.length, 0);
  });

  it('empty list should handle all filters gracefully', () => {
    const empty: DeviceItem[] = [];
    assert.strictEqual(filterByType(empty, 'POS').length, 0);
    assert.strictEqual(filterByStatus(empty, 'online').length, 0);
    assert.strictEqual(searchItems(empty, 'test').length, 0);
    assert.strictEqual(sortItems(empty, 'name', 'asc').length, 0);
  });

  it('getOnlineRate for empty list should return 0', () => {
    assert.strictEqual(getOnlineRate([]), 0);
  });
});

// ---- 边界 ----

describe('devices-page: 边界 (boundary cases)', () => {
  const devices = getDevices();

  it('single char search should match', () => {
    const result = searchItems(devices, 'P');
    assert.ok(result.length >= 1, 'single char search should find matches');
  });

  it('case-insensitive search should work', () => {
    const upper = searchItems(devices, 'POS');
    const lower = searchItems(devices, 'pos');
    assert.strictEqual(upper.length, lower.length);
  });

  it('every device should have ISO format lastCheckAt', () => {
    for (const d of devices) {
      const parsed = new Date(d.lastCheckAt);
      assert.ok(!Number.isNaN(parsed.getTime()), `invalid date for ${d.id}: ${d.lastCheckAt}`);
    }
  });

  it('every device ip should be valid format', () => {
    const ipPattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    for (const d of devices) {
      assert.ok(ipPattern.test(d.ip), `invalid ip ${d.ip} for ${d.id}`);
    }
  });

  it('should have at least 2 distinct stores', () => {
    const stores = new Set(devices.map((d) => d.storeId));
    assert.ok(stores.size >= 2, `expected >= 2 stores, got ${stores.size}`);
  });

  it('countByType + countByStatus should not overflow', () => {
    for (const type of ALL_TYPES) {
      const c = countByType(devices, type);
      assert.ok(c <= devices.length, `type ${type} count ${c} exceeds total ${devices.length}`);
    }
    for (const status of ALL_STATUSES) {
      const c = countByStatus(devices, status);
      assert.ok(c <= devices.length, `status ${status} count ${c} exceeds total ${devices.length}`);
    }
  });
});
