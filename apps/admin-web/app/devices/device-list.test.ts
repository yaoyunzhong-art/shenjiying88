/**
 * 设备管理列表页 - 单元测试
 *
 * 使用 Node 内置 test runner
 * 运行: node --import tsx --test apps/admin-web/app/devices/*.test.ts
 */

import assert from 'node:assert';
import { describe, it } from 'node:test';
import type { DeviceItem } from './device-types';
import { getDevices } from './devices-data';

describe('getDevices()', () => {
  it('返回非空数组', () => {
    const devices = getDevices();
    assert.ok(Array.isArray(devices), '应为数组');
    assert.ok(devices.length > 0, '至少有一条设备数据');
  });

  it('每条数据包含必需字段', () => {
    const devices = getDevices();
    for (const d of devices) {
      assert.ok(typeof d.id === 'string', `设备 ${d.name} 缺少 id`);
      assert.ok(typeof d.name === 'string', `设备缺少 name`);
      assert.ok(typeof d.type === 'string', `设备 ${d.name} 缺少 type`);
      assert.ok(typeof d.status === 'string', `设备 ${d.name} 缺少 status`);
      assert.ok(typeof d.ip === 'string', `设备 ${d.name} 缺少 ip`);
      assert.ok(typeof d.storeId === 'string', `设备 ${d.name} 缺少 storeId`);
      assert.ok(typeof d.storeName === 'string', `设备 ${d.name} 缺少 storeName`);
      assert.ok(typeof d.lastCheckAt === 'string', `设备 ${d.name} 缺少 lastCheckAt`);
      assert.ok(typeof d.firmwareVersion === 'string', `设备 ${d.name} 缺少 firmwareVersion`);
      assert.ok(typeof d.serialNumber === 'string', `设备 ${d.name} 缺少 serialNumber`);
    }
  });

  it('status 字段是合法值', () => {
    const validStatuses = new Set(['online', 'offline', 'warning', 'maintenance']);
    const devices = getDevices();
    for (const d of devices) {
      assert.ok(
        validStatuses.has(d.status),
        `设备 ${d.name} 的 status="${d.status}" 不合法，允许: ${[...validStatuses].join(', ')}`
      );
    }
  });

  it('type 字段是合法值', () => {
    const validTypes = new Set(['POS', 'printer', 'scanner', 'tablet', 'kiosk', 'scale']);
    const devices = getDevices();
    for (const d of devices) {
      assert.ok(
        validTypes.has(d.type),
        `设备 ${d.name} 的 type="${d.type}" 不合法，允许: ${[...validTypes].join(', ')}`
      );
    }
  });

  it('serialNumber 非空', () => {
    const devices = getDevices();
    for (const d of devices) {
      assert.ok(d.serialNumber.length > 0, `设备 ${d.name} 的 serialNumber 为空`);
    }
  });

  it('lastCheckAt 是合法 ISO 时间戳', () => {
    const devices = getDevices();
    for (const d of devices) {
      const parsed = new Date(d.lastCheckAt);
      assert.ok(!isNaN(parsed.getTime()), `设备 ${d.name} 的 lastCheckAt="${d.lastCheckAt}" 无法解析`);
    }
  });

  it('每种设备类型都有对应设备', () => {
    const devices = getDevices();
    const types = new Set(devices.map((d) => d.type));
    const expected = ['POS', 'printer', 'scanner', 'tablet', 'kiosk', 'scale'] as const;
    for (const t of expected) {
      assert.ok(types.has(t), `缺少设备类型: ${t}`);
    }
  });
});

describe('DeviceItem 类型过滤', () => {
  it('按 status=online 过滤', () => {
    const devices = getDevices();
    const online = devices.filter((d) => d.status === 'online');
    assert.ok(online.length > 0, '至少有一台在线设备');
    for (const d of online) {
      assert.strictEqual(d.status, 'online');
    }
  });

  it('按 type=POS 过滤', () => {
    const devices = getDevices();
    const posDevices = devices.filter((d) => d.type === 'POS');
    assert.ok(posDevices.length > 0, '至少有一台 POS 设备');
    for (const d of posDevices) {
      assert.strictEqual(d.type, 'POS');
    }
  });

  it('按名称搜索', () => {
    const devices = getDevices();
    const keyword = 'POS';
    const matched = devices.filter(
      (d) =>
        d.name.includes(keyword) ||
        d.type.includes(keyword) ||
        d.storeName.includes(keyword) ||
        d.ip.includes(keyword)
    );
    assert.ok(matched.length > 0, `搜索 "${keyword}" 应有结果`);
  });

  it('离线 + 告警设备统计', () => {
    const devices = getDevices();
    const problemDevices = devices.filter(
      (d) => d.status === 'offline' || d.status === 'warning'
    );
    assert.ok(problemDevices.length > 0, '至少有一台问题设备');

    for (const d of problemDevices) {
      assert.ok(d.status === 'offline' || d.status === 'warning');
    }
  });
});
